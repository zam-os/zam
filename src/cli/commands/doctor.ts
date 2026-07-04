/**
 * `zam doctor` — Knowledge base maintenance and repair.
 * Implements the `zam doctor` from the titles ADR.
 */

import { Command } from "commander";
import type { Database } from "../../kernel/db/types.js";
import {
  getEmbeddingCoverage,
  getSetting,
  getShortSlug,
} from "../../kernel/index.js";
import {
  deprecateToken,
  listTokens,
  type Token,
  type UpdateTokenInput,
  updateToken,
} from "../../kernel/models/token.js";
import { listEmbeddedTokens } from "../../kernel/models/token-embedding.js";
import { cosineSimilarity } from "../../kernel/search/hybrid.js";
import {
  generateTitleViaLLM,
  getLlmConfig,
  repairUmlautsViaLLM,
} from "../llm/client.js";
import {
  canonicalEmbeddingModelId,
  ensureTokenEmbeddings,
  resolveDedupThreshold,
} from "../llm/embedder.js";
import { withDb } from "./shared/db.js";

export interface DoctorOptions {
  fix?: boolean;
  dryRun?: boolean;
  yes?: boolean;
  noLlm?: boolean;
  timeoutMs?: number;
}

export interface DoctorTask {
  name: string;
  description: string;
  run: (db: Database, opts: DoctorOptions) => Promise<void>;
}

function shouldApplyFixes(opts: DoctorOptions): boolean {
  return opts.fix === true && opts.dryRun !== true;
}

async function confirmDeterministicChanges(
  opts: DoctorOptions,
  message: string,
): Promise<boolean> {
  if (opts.yes) return true;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      "Cannot request confirmation in a non-interactive terminal. Re-run with --yes to apply deterministic fixes.",
    );
    return false;
  }
  const { confirm } = await import("@inquirer/prompts");
  return confirm({ message, default: false });
}

function canRunInteractiveChoices(
  opts: DoctorOptions,
  taskName: string,
): boolean {
  if (opts.yes) {
    console.error(
      `--yes cannot choose how to resolve ${taskName}. Re-run without --yes in an interactive terminal.`,
    );
    return false;
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error(
      `${taskName} fixes require an interactive terminal because each change needs an explicit choice.`,
    );
    return false;
  }
  return true;
}

function getWeakTitleReason(t: Token): string | null {
  const title = (t.title || "").trim();
  if (!title) {
    return "Missing or empty title";
  }
  if (title === t.slug) {
    return "Title is equal to technical slug";
  }
  if (title.length < 3) {
    return "Title is suspiciously short";
  }
  if (title.length > 100) {
    return "Title is too long (> 100 chars)";
  }
  if (t.domain) {
    const domParts = t.domain.split(/[-/]/).filter((p) => p.length > 2);
    const titleLower = title.toLowerCase();
    for (const part of domParts) {
      if (titleLower.includes(part.toLowerCase())) {
        return `Domain echo (contains '${part}' from domain '${t.domain}')`;
      }
    }
  }
  const conceptClean = (t.concept || "").trim().toLowerCase();
  const titleLower = title.toLowerCase();
  if (
    conceptClean.startsWith(titleLower) &&
    t.concept.length > title.length + 5 &&
    !/[.!?]/.test(title)
  ) {
    const titleWords = titleLower.split(/\s+/).length;
    if (titleWords <= 5) {
      return "Concept-prefix copy";
    }
  }
  if (
    title.endsWith("?") ||
    /^(what|how|why|who|where|when|which|is|are|was|were|can|do|does|did|ueber|fuer|nahe)\b/i.test(
      title,
    )
  ) {
    return "Question stump or interrogative structure";
  }
  if (title.length > 3 && /[a-zA-Z]/.test(title)) {
    if (title === title.toUpperCase()) {
      return "All uppercase";
    }
    if (title === title.toLowerCase()) {
      return "All lowercase";
    }
  }
  return null;
}

function stripLeadingDomainWords(value: string, domain: string): string {
  let result = value.trim();
  for (const word of domain.split(/[-/]/).filter(Boolean)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`^${escaped}\\s+`, "i"), "");
  }
  return result.trim();
}

function truncateTitle(value: string): string {
  const trimmed = value.trim().replace(/^["']+|["']+$/g, "");
  return trimmed.length <= 80
    ? trimmed
    : `${trimmed.substring(0, 77).trimEnd()}...`;
}

function titleFromSlug(token: Token): string {
  return getShortSlug(token.slug, token.domain)
    .split(/[-_]+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function validatedTitleProposal(token: Token, raw: string): string | null {
  const candidates = [
    raw,
    (token.concept || "").split(/[.;]/)[0] || "",
    titleFromSlug(token),
  ];

  for (const candidate of candidates) {
    const normalized = truncateTitle(
      stripLeadingDomainWords(candidate, token.domain || ""),
    );
    if (
      normalized.length > 0 &&
      getWeakTitleReason({ ...token, title: normalized }) === null
    ) {
      return normalized;
    }
  }
  return null;
}

export const doctorTasks: DoctorTask[] = [
  {
    name: "titles",
    description:
      "Backfill missing/weak human-friendly titles (no domain echoes, descriptive names).",
    run: async (db, opts) => {
      const tokens = await listTokens(db, {});
      const needing = tokens
        .map((t) => {
          const reason = getWeakTitleReason(t);
          return reason ? { token: t, reason } : null;
        })
        .filter((x): x is { token: Token; reason: string } => x !== null);

      console.log(
        `Found ${needing.length} tokens needing title work (of ${tokens.length}).`,
      );
      if (needing.length === 0) return;

      const cfg = await getLlmConfig(db);
      const useLLM = cfg.enabled && !opts.noLlm;
      console.log(
        `Title generation mode: ${useLLM ? "LLM" : "Heuristic fallback"}${opts.timeoutMs ? ` (timeout: ${opts.timeoutMs}ms)` : ""}`,
      );

      console.log("Generating proposed titles...");
      const proposals: Array<{
        token: Token;
        oldTitle: string;
        newTitle: string;
        reason: string;
      }> = [];
      let rejected = 0;

      for (let i = 0; i < needing.length; i++) {
        const item = needing[i];
        process.stdout.write(
          `\r  [${i + 1}/${needing.length}] ${item.token.slug.slice(0, 40)}...`,
        );
        let rawProposal = "";
        if (useLLM) {
          try {
            const gen = await generateTitleViaLLM(
              db,
              {
                slug: item.token.slug,
                concept: item.token.concept,
                domain: item.token.domain,
                question: item.token.question,
                context: item.token.context,
              },
              { timeoutMs: opts.timeoutMs },
            );
            rawProposal = gen.text;
          } catch (_e) {
            rawProposal =
              (item.token.concept || "").split(/[.;]/)[0]?.trim() ||
              item.token.slug.replace(/-/g, " ");
          }
        } else {
          rawProposal =
            (item.token.concept || "").split(/[.;]/)[0]?.trim() ||
            item.token.slug.replace(/-/g, " ");
        }

        const proposed = validatedTitleProposal(item.token, rawProposal);
        if (!proposed) {
          rejected++;
          continue;
        }

        proposals.push({
          token: item.token,
          oldTitle: item.token.title,
          newTitle: proposed,
          reason: item.reason,
        });
      }
      process.stdout.write("\n");
      if (rejected > 0) {
        console.warn(
          `Skipped ${rejected} token(s) because no proposal passed title quality validation.`,
        );
      }
      if (proposals.length === 0) return;

      if (!shouldApplyFixes(opts)) {
        console.log("\nProposed changes (Dry run):");
        for (const prop of proposals) {
          console.log(
            `  ${prop.token.slug}: "${prop.oldTitle}" -> "${prop.newTitle}" (Reason: ${prop.reason})`,
          );
        }
        console.log("\nRun with --fix to apply these changes.");
        return;
      }

      if (!opts.yes) {
        console.log("\nProposed changes:");
        for (const prop of proposals) {
          console.log(
            `  ${prop.token.slug}: "${prop.oldTitle}" -> "${prop.newTitle}" (Reason: ${prop.reason})`,
          );
        }
      }
      const confirmed = await confirmDeterministicChanges(
        opts,
        `Apply these ${proposals.length} proposed titles?`,
      );

      if (!confirmed) {
        console.log("Cancelled. No titles were updated.");
        return;
      }

      let fixed = 0;
      for (const prop of proposals) {
        await updateToken(db, prop.token.slug, { title: prop.newTitle });
        fixed++;
        console.log(`Set title for ${prop.token.slug} -> ${prop.newTitle}`);
      }
      console.log(`Successfully fixed ${fixed} titles.`);
    },
  },
  {
    name: "texts",
    description:
      "Repair legacy ASCII umlauts in prose fields (question/concept/context).",
    run: async (db, opts) => {
      const tokens = await listTokens(db, {});
      const cfg = await getLlmConfig(db);
      const useLLM = cfg.enabled && !opts.noLlm;

      const replacements = [
        [/\bUeber\b/g, "Über"],
        [/\bueber\b/g, "über"],
        [/\bFuer\b/g, "Für"],
        [/\bfuer\b/g, "für"],
        [/\bMuehe\b/g, "Mühe"],
        [/\bmuehe\b/g, "mühe"],
        [/\bKuer\b/g, "Kür"],
        [/\bkuer\b/g, "kür"],
        [/\bUebung\b/g, "Übung"],
        [/\buebung\b/g, "übung"],
        [/\bMoeglich\b/g, "Möglich"],
        [/\bmoeglich\b/g, "möglich"],
        [/\bMoeglichkeiten\b/g, "Möglichkeiten"],
        [/\bmoeglichkeiten\b/g, "möglichkeiten"],
        [/\bSchoen\b/g, "Schön"],
        [/\bschoen\b/g, "schön"],
        [/\bKoennen\b/g, "Können"],
        [/\bkoennen\b/g, "können"],
        [/\bMuessen\b/g, "Müssen"],
        [/\bmuessen\b/g, "müssen"],
        [/\bDuerfen\b/g, "Dürfen"],
        [/\bduerfen\b/g, "dürfen"],
        [/\bAerger\b/g, "Ärger"],
        [/\baerger\b/g, "ärger"],
        [/\bGruende\b/g, "Gründe"],
        [/\bgruende\b/g, "gründe"],
      ];

      const toFix: Array<{
        token: Token;
        field: string;
        old: string;
        new: string;
      }> = [];

      console.log("Analyzing prose text fields for legacy umlauts...");
      for (const t of tokens) {
        const fields = [
          { key: "question", val: t.question },
          { key: "concept", val: t.concept },
          { key: "context", val: t.context },
          { key: "title", val: t.title },
        ];
        for (const f of fields) {
          if (!f.val || typeof f.val !== "string") continue;
          let repaired = f.val;

          if (useLLM) {
            const hasPossibleUmlautFold = /[aou]e/i.test(f.val);
            if (hasPossibleUmlautFold) {
              try {
                repaired = await repairUmlautsViaLLM(
                  db,
                  { text: f.val },
                  { timeoutMs: opts.timeoutMs },
                );
                if (repaired === f.val) {
                  for (const [from, to] of replacements) {
                    repaired = repaired.replace(from, to as string);
                  }
                }
              } catch (_e) {
                for (const [from, to] of replacements) {
                  repaired = repaired.replace(from, to as string);
                }
              }
            }
          } else {
            for (const [from, to] of replacements) {
              repaired = repaired.replace(from, to as string);
            }
          }

          if (repaired !== f.val) {
            toFix.push({ token: t, field: f.key, old: f.val, new: repaired });
          }
        }
      }

      console.log(`Found ${toFix.length} prose fields with legacy umlauts.`);
      if (toFix.length === 0) return;

      if (!shouldApplyFixes(opts)) {
        console.log("\nProposed changes (Dry run):");
        for (const fix of toFix) {
          console.log(`  ${fix.token.slug} [${fix.field}]:`);
          console.log(`    Old: "${fix.old}"`);
          console.log(`    New: "${fix.new}"`);
        }
        console.log("\nRun with --fix to apply these changes.");
        return;
      }

      if (!opts.yes) {
        console.log("\nProposed changes:");
        for (const fix of toFix) {
          console.log(
            `  ${fix.token.slug} [${fix.field}]: "${fix.old}" -> "${fix.new}"`,
          );
        }
      }
      const confirmed = await confirmDeterministicChanges(
        opts,
        `Apply these ${toFix.length} prose fixes?`,
      );

      if (!confirmed) {
        console.log("Cancelled. No changes made.");
        return;
      }

      let fixed = 0;
      for (const fix of toFix) {
        const updates: UpdateTokenInput = {};
        (updates as Record<string, unknown>)[fix.field] = fix.new;
        await updateToken(db, fix.token.slug, updates);
        fixed++;
      }
      console.log(
        `Fixed ${fixed} fields. (Re-embed will happen automatically for changed content.)`,
      );
    },
  },
  {
    name: "duplicates",
    description: "List semantic duplicates for review/merge.",
    run: async (db, opts) => {
      const applyingFixes = shouldApplyFixes(opts);
      if (applyingFixes && !canRunInteractiveChoices(opts, "duplicate fixes")) {
        return;
      }

      const modelSetting = await getSetting(db, "llm.embedding.model");
      if (!modelSetting) {
        console.log(
          "No embedding model configured. Please configure an embedding model to scan duplicates.",
        );
        return;
      }

      const model = canonicalEmbeddingModelId(modelSetting);
      if (model !== modelSetting.trim().toLowerCase()) {
        console.log(
          `Using canonical embedding model "${model}" for configured alias "${modelSetting}".`,
        );
      }

      let coverage = await getEmbeddingCoverage(db, model);
      const initiallyIncomplete = coverage.missing + coverage.stale;
      if (initiallyIncomplete > 0) {
        if (applyingFixes) {
          console.log(
            `Embedding coverage is incomplete (${coverage.missing} missing, ${coverage.stale} stale). Attempting backfill...`,
          );
          const result = await ensureTokenEmbeddings(db, {
            limit: coverage.tokens,
          });
          coverage = await getEmbeddingCoverage(db, model);
          const remaining = coverage.missing + coverage.stale;
          if (remaining > 0) {
            console.warn(
              `Warning: Duplicate scan is incomplete: ${remaining} of ${coverage.tokens} active tokens still lack a fresh "${model}" embedding.${result.reason ? ` ${result.reason}` : ""}`,
            );
          } else {
            console.log(
              `Embedding backfill complete (${result.embedded} updated).`,
            );
          }
        } else {
          console.warn(
            `Warning: Duplicate scan is incomplete: ${initiallyIncomplete} of ${coverage.tokens} active tokens lack a fresh "${model}" embedding. Dry-run will not backfill them; run 'zam token reembed' first for a complete scan.`,
          );
        }
      }

      console.log(`Listing embedded tokens for model "${model}"...`);
      const embedded = await listEmbeddedTokens(db, model);
      const threshold = await resolveDedupThreshold(db);
      console.log(
        `Scanning ${embedded.length} tokens for semantic duplicates (threshold: ${threshold})...`,
      );

      const duplicates: Array<{ a: Token; b: Token; similarity: number }> = [];
      const seenPairs = new Set<string>();

      for (let i = 0; i < embedded.length; i++) {
        for (let j = i + 1; j < embedded.length; j++) {
          const sim = cosineSimilarity(
            embedded[i].embedding,
            embedded[j].embedding,
          );
          if (sim >= threshold) {
            const idA = embedded[i].token.id;
            const idB = embedded[j].token.id;
            const pairKey = idA < idB ? `${idA}:${idB}` : `${idB}:${idA}`;
            if (!seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              duplicates.push({
                a: embedded[i].token,
                b: embedded[j].token,
                similarity: sim,
              });
            }
          }
        }
      }

      console.log(`Found ${duplicates.length} duplicate pairs.`);
      if (duplicates.length === 0) return;

      if (!applyingFixes) {
        console.log("\nDuplicate pairs found (Dry run):");
        for (const pair of duplicates) {
          console.log(
            `  - "${pair.a.slug}" and "${pair.b.slug}" (similarity: ${pair.similarity.toFixed(3)})`,
          );
        }
        console.log("\nRun with --fix to resolve duplicates interactively.");
        return;
      }

      const { select } = await import("@inquirer/prompts");
      let deprecatedCount = 0;
      for (const pair of duplicates) {
        console.log(
          `\nDuplicate pair found (similarity: ${pair.similarity.toFixed(3)}):`,
        );
        console.log(
          `  1. ${pair.a.slug}: "${pair.a.concept.substring(0, 100)}..."`,
        );
        console.log(
          `  2. ${pair.b.slug}: "${pair.b.concept.substring(0, 100)}..."`,
        );

        const choice = await select({
          message: "Select action:",
          choices: [
            { name: "Keep both", value: "keep" },
            { name: `Deprecate ${pair.a.slug}`, value: "deprecate_a" },
            { name: `Deprecate ${pair.b.slug}`, value: "deprecate_b" },
          ],
        });

        if (choice === "deprecate_a") {
          await deprecateToken(db, pair.a.slug);
          console.log(`  Deprecated ${pair.a.slug}`);
          deprecatedCount++;
        } else if (choice === "deprecate_b") {
          await deprecateToken(db, pair.b.slug);
          console.log(`  Deprecated ${pair.b.slug}`);
          deprecatedCount++;
        }
      }
      console.log(
        `\nDuplicates scan complete. Deprecated ${deprecatedCount} token(s).`,
      );
    },
  },
  {
    name: "domains",
    description:
      "Help rename/unify domains into / hierarchy (slugs untouched).",
    run: async (db, opts) => {
      const tokens = await listTokens(db, {});
      const domains = Array.from(
        new Set(tokens.map((t) => t.domain).filter(Boolean)),
      ).sort();
      console.log(`Current domains (${domains.length}):`);
      for (const d of domains) {
        const count = tokens.filter((t) => t.domain === d).length;
        const status = d.includes("/") ? "(hierarchical)" : "(flat, valid)";
        console.log(`  ${d} — ${count} token(s) ${status}`);
      }

      if (!shouldApplyFixes(opts)) {
        console.log("\nUse --fix to interactively rename/unify domains.");
        return;
      }

      if (!canRunInteractiveChoices(opts, "domain renames")) return;

      const { confirm, input } = await import("@inquirer/prompts");
      const changes: Array<{ oldDomain: string; newDomain: string }> = [];
      for (const d of domains) {
        const count = tokens.filter((t) => t.domain === d).length;
        const wantRename = await confirm({
          message: `Rename domain "${d}" (${count} tokens)?`,
          default: false,
        });

        if (wantRename) {
          const newDomain = await input({
            message: `Enter new domain name for "${d}":`,
            validate: (val) =>
              val.trim().length > 0 ? true : "Domain name cannot be empty",
          });

          const trimmed = newDomain.trim();
          if (trimmed === d) {
            console.log("  New name matches old name. Skipped.");
            continue;
          }
          changes.push({ oldDomain: d, newDomain: trimmed });
        }
      }

      if (changes.length > 0) {
        await db.transaction(async (tx) => {
          const now = new Date().toISOString();
          const stmt = tx.prepare(
            "UPDATE tokens SET domain = ?, updated_at = ? WHERE domain = ?",
          );
          for (const change of changes) {
            const res = await stmt.run(change.newDomain, now, change.oldDomain);
            console.log(
              `  Renamed "${change.oldDomain}" to "${change.newDomain}" for ${res.changes} token(s).`,
            );
          }
        });
      }
      console.log(
        `Domains rename complete. Renamed ${changes.length} domain(s).`,
      );
    },
  },
];

export function parseDoctorTimeout(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("--timeout must be a positive integer in milliseconds");
  }
  return parsed;
}

export const doctorCommand = new Command("doctor")
  .description(
    "Diagnose and repair the knowledge base (titles, legacy data, duplicates, domains).",
  )
  .option("--fix", "Apply changes (default is dry-run)")
  .option("--dry-run", "Explicit dry run (default)")
  .option(
    "--yes",
    "Auto-confirm deterministic title/text fixes (duplicate/domain choices remain interactive)",
  )
  .option("--no-llm", "Skip LLM calls, use heuristic fallback only")
  .option(
    "--timeout <ms>",
    "LLM timeout in ms per call (default: 20000)",
    "20000",
  )
  .argument("[task]", "Specific task: titles, texts, duplicates, domains")
  .action(async (taskName, opts) => {
    await withDb(async (db) => {
      const fix = !!opts.fix;
      const dryRun = !fix || !!opts.dryRun;
      const yes = !!opts.yes;
      const noLlm = opts.llm === false;
      const timeoutMs = parseDoctorTimeout(opts.timeout);

      if (!taskName) {
        console.log("Available doctor tasks:");
        for (const t of doctorTasks) {
          console.log(`  ${t.name} — ${t.description}`);
        }
        console.log("\nRun with a task name, e.g. `zam doctor titles --fix`");
        return;
      }

      const task = doctorTasks.find((t) => t.name === taskName);
      if (!task) {
        console.error(`Unknown task: ${taskName}`);
        process.exit(1);
      }

      console.log(
        `Running doctor task: ${task.name} (fix=${fix}, dryRun=${dryRun}${noLlm ? ", noLlm=true" : ""})`,
      );
      await task.run(db, { fix, dryRun, yes, noLlm, timeoutMs });
    });
  });
