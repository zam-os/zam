/**
 * `zam doctor` — Knowledge base maintenance and repair.
 * Implements the `zam doctor` from the titles ADR.
 */

import { Command } from "commander";
import type { Database } from "../../kernel/db/types.js";
import {
  assignTokenToContext,
  getEmbeddingCoverage,
  getSetting,
  getShortSlug,
  type KnowledgeContext,
  listKnowledgeContexts,
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
  knowledgeContext?: string;
  json?: boolean;
}

export interface DoctorTask {
  name: string;
  description: string;
  run: (db: Database, opts: DoctorOptions) => Promise<void>;
}

function shouldApplyFixes(opts: DoctorOptions): boolean {
  return opts.fix === true && opts.dryRun !== true;
}

function stringifyDoctorOutput(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function captureDoctorTaskOutput(
  task: DoctorTask,
  db: Database,
  opts: DoctorOptions,
): Promise<{ lines: string[]; error?: string }> {
  const chunks: string[] = [];
  const append = (value: string): void => {
    for (const line of value.split(/[\r\n]+/)) {
      const trimmed = line.trim();
      if (trimmed) chunks.push(trimmed);
    }
  };
  const capture = (...args: unknown[]): void => {
    append(args.map(stringifyDoctorOutput).join(" "));
  };
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalWrite = process.stdout.write;

  console.log = capture as typeof console.log;
  console.warn = capture as typeof console.warn;
  console.error = capture as typeof console.error;
  process.stdout.write = ((chunk: string | Uint8Array) => {
    append(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString());
    return true;
  }) as typeof process.stdout.write;

  try {
    await task.run(db, opts);
    return { lines: chunks };
  } catch (error) {
    return { lines: chunks, error: (error as Error).message };
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    process.stdout.write = originalWrite;
  }
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

const LANGUAGE_MARKERS: Record<string, string[]> = {
  de: ["der", "die", "das", "und", "ist", "sind", "für", "mit", "nicht"],
  en: ["the", "and", "is", "are", "for", "with", "not", "from", "that"],
  es: ["el", "la", "los", "las", "y", "es", "son", "para", "con"],
  fr: ["le", "la", "les", "et", "est", "sont", "pour", "avec"],
  pt: ["o", "a", "os", "as", "e", "é", "são", "para", "com"],
};

function inferEstablishedLanguage(token: Token): string | null {
  const text = [token.title, token.concept, token.question, token.context]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/[぀-ヿ]/u.test(text)) return "ja";
  if (/[㐀-鿿]/u.test(text)) return "zh";

  const words = new Set(text.match(/\p{L}+/gu) ?? []);
  const scores = Object.entries(LANGUAGE_MARKERS)
    .map(([language, markers]) => ({
      language,
      score: markers.filter((marker) => words.has(marker)).length,
    }))
    .sort((a, b) => b.score - a.score);
  return scores[0].score >= 2 && scores[0].score > scores[1].score
    ? scores[0].language
    : null;
}

function primaryLanguage(language: string | null): string | null {
  return language?.trim().toLowerCase().split(/[-_]/)[0] || null;
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
        if (!opts.json) {
          process.stdout.write(
            `\r  [${i + 1}/${needing.length}] ${item.token.slug.slice(0, 40)}...`,
          );
        }
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
              {
                timeoutMs: opts.timeoutMs,
                knowledgeContext: opts.knowledgeContext,
              },
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
      if (!opts.json) process.stdout.write("\n");
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
  {
    name: "contexts",
    description:
      "Backfill contexts on old/unassigned tokens using heuristic rules.",
    run: async (db, opts) => {
      const tokensWithoutContext = (await db
        .prepare(
          `SELECT t.* FROM tokens t
           WHERE NOT EXISTS (
             SELECT 1 FROM token_contexts tc WHERE tc.token_id = t.id
           )`,
        )
        .all()) as Token[];

      const allContexts = await listKnowledgeContexts(db);
      const contexts = opts.knowledgeContext
        ? allContexts.filter(
            (context) => context.name === opts.knowledgeContext,
          )
        : allContexts;
      if (opts.knowledgeContext && contexts.length === 0) {
        throw new Error(
          `Knowledge context not found: ${opts.knowledgeContext}`,
        );
      }
      if (contexts.length === 0) {
        if (opts.json) {
          console.log(
            JSON.stringify({
              success: false,
              error: "No knowledge contexts defined.",
            }),
          );
        } else {
          console.log(
            "No knowledge contexts defined. Run `zam kc create` first.",
          );
        }
        return;
      }

      const proposals: Array<{
        token: Token;
        context: KnowledgeContext;
        highConfidence: boolean;
      }> = [];

      for (const t of tokensWithoutContext) {
        const domain = (t.domain || "").toLowerCase();
        const slug = t.slug.toLowerCase();
        const title = (t.title || "").toLowerCase();
        const source = (t.source_link || "").toLowerCase();
        const establishedLanguage = inferEstablishedLanguage(t);
        const languageMatches = establishedLanguage
          ? contexts.filter(
              (context) =>
                primaryLanguage(context.language) === establishedLanguage,
            )
          : [];

        for (const ctx of contexts) {
          const ctxName = ctx.name.toLowerCase();
          const ctxLabel = (ctx.label || "").toLowerCase();

          let match = false;
          let highConfidence = false;

          // Rule 1: Domain matching context name or label
          if (domain) {
            if (domain === ctxName) {
              match = true;
              highConfidence = true;
            } else if (ctxName.includes(domain) || domain.includes(ctxName)) {
              match = true;
              highConfidence = domain.length >= 2;
            } else if (
              ctxLabel &&
              (ctxLabel.includes(domain) || domain.includes(ctxLabel))
            ) {
              match = true;
              highConfidence = domain.length >= 2;
            }
          }

          // Rule 2: Substring matches in slug/title
          if (slug.includes(ctxName) || title.includes(ctxName)) {
            match = true;
          }

          // Rule 3: Word-by-word matches on label words
          if (ctxLabel) {
            const labelWords = ctxLabel
              .split(/\s+/)
              .filter((w) => w.length > 3);
            for (const word of labelWords) {
              if (
                domain.includes(word) ||
                slug.includes(word) ||
                title.includes(word)
              ) {
                match = true;
              }
            }
          }

          // Rule 4: Source references may explicitly name their owning world.
          if (
            source &&
            (source.includes(ctxName) ||
              ctxLabel
                .split(/\s+/)
                .filter((word) => word.length > 3)
                .some((word) => source.includes(word)))
          ) {
            match = true;
            highConfidence = true;
          }

          // Rule 5: Established content language is a weak signal, and only
          // useful when exactly one available context declares that language.
          if (
            languageMatches.length === 1 &&
            languageMatches[0].id === ctx.id
          ) {
            match = true;
          }

          if (match) {
            proposals.push({
              token: t,
              context: ctx,
              highConfidence,
            });
          }
        }
      }

      const applying = shouldApplyFixes(opts);

      if (opts.json) {
        if (!applying) {
          const formatted = proposals.map((p) => ({
            tokenSlug: p.token.slug,
            contextName: p.context.name,
            highConfidence: p.highConfidence,
          }));
          console.log(
            JSON.stringify({
              success: true,
              task: "contexts",
              proposals: formatted,
              totalUnassigned: tokensWithoutContext.length,
            }),
          );
          return;
        }
      } else {
        console.log(
          `Found ${proposals.length} proposed context assignments for ${tokensWithoutContext.length} unassigned tokens.`,
        );
      }
      if (proposals.length === 0) {
        if (opts.json && applying) {
          console.log(
            JSON.stringify({
              success: true,
              task: "contexts",
              applied: [],
              totalApplied: 0,
            }),
          );
        }
        return;
      }

      if (!applying) {
        console.log("\nProposed context assignments (Dry run):");
        for (const prop of proposals) {
          const confStr = prop.highConfidence ? " [High Confidence]" : "";
          console.log(
            `  - Assign token "${prop.token.slug}" to context "${prop.context.name}"${confStr}`,
          );
        }
        console.log("\nRun with --fix to apply these assignments.");
        return;
      }

      if (opts.yes) {
        let applied = 0;
        const appliedProposals = [];
        for (const prop of proposals) {
          if (prop.highConfidence) {
            await assignTokenToContext(db, prop.token.id, prop.context.id);
            if (!opts.json) {
              console.log(
                `Auto-assigned: "${prop.token.slug}" -> context "${prop.context.name}"`,
              );
            }
            appliedProposals.push({
              tokenSlug: prop.token.slug,
              contextName: prop.context.name,
            });
            applied++;
          }
        }
        if (opts.json) {
          console.log(
            JSON.stringify({
              success: true,
              task: "contexts",
              applied: appliedProposals,
              totalApplied: applied,
            }),
          );
        } else {
          console.log(`Auto-assigned ${applied} high-confidence contexts.`);
        }
        return;
      }

      const { confirm } = await import("@inquirer/prompts");
      let assignedCount = 0;
      for (const prop of proposals) {
        const confStr = prop.highConfidence ? " (high confidence)" : "";
        const ans = await confirm({
          message: `Assign token "${prop.token.slug}" to context "${prop.context.name}"${confStr}?`,
          default: prop.highConfidence,
        });
        if (ans) {
          await assignTokenToContext(db, prop.token.id, prop.context.id);
          console.log(
            `Assigned "${prop.token.slug}" -> context "${prop.context.name}"`,
          );
          assignedCount++;
        }
      }
      console.log(
        `Completed contexts backfill. Assigned ${assignedCount} tokens.`,
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
  .option(
    "--knowledge-context <context>",
    "Knowledge context to limit/guide doctor task",
  )
  .option("--json", "Emit report in JSON format")
  .argument(
    "[task]",
    "Specific task: titles, texts, duplicates, domains, contexts",
  )
  .action(async (taskName, opts) => {
    await withDb(async (db) => {
      const fix = !!opts.fix;
      const dryRun = !fix || !!opts.dryRun;
      const yes = !!opts.yes;
      const noLlm = opts.llm === false;
      const timeoutMs = parseDoctorTimeout(opts.timeout);
      const knowledgeContext = opts.knowledgeContext;
      const json = !!opts.json;

      if (!taskName) {
        const diagnosisOptions: DoctorOptions = {
          fix: false,
          dryRun: true,
          yes: false,
          noLlm: true,
          timeoutMs,
          knowledgeContext,
          json: false,
        };
        if (json) {
          const reports = [];
          for (const task of doctorTasks) {
            const report = await captureDoctorTaskOutput(
              task,
              db,
              diagnosisOptions,
            );
            reports.push({
              name: task.name,
              description: task.description,
              ...report,
            });
          }
          const success = reports.every((report) => !report.error);
          console.log(
            JSON.stringify({ success, readOnly: true, tasks: reports }),
          );
          if (!success) process.exitCode = 1;
        } else {
          console.log("ZAM doctor read-only diagnosis (LLM disabled):");
          for (const task of doctorTasks) {
            console.log(`\n[${task.name}] ${task.description}`);
            await task.run(db, diagnosisOptions);
          }
        }
        return;
      }

      const task = doctorTasks.find((t) => t.name === taskName);
      if (!task) {
        if (json) {
          console.log(
            JSON.stringify({
              success: false,
              error: `Unknown task: ${taskName}`,
            }),
          );
        } else {
          console.error(`Unknown task: ${taskName}`);
        }
        process.exit(1);
      }

      if (!json) {
        console.log(
          `Running doctor task: ${task.name} (fix=${fix}, dryRun=${dryRun}${noLlm ? ", noLlm=true" : ""})`,
        );
      }
      const taskOptions: DoctorOptions = {
        fix,
        dryRun,
        yes,
        noLlm,
        timeoutMs,
        knowledgeContext,
        json,
      };
      if (json && fix && !yes) {
        console.log(
          JSON.stringify({
            success: false,
            error:
              "--json --fix requires --yes; interactive prompts are not machine-readable",
          }),
        );
        process.exitCode = 1;
        return;
      }
      if (
        json &&
        fix &&
        yes &&
        (task.name === "duplicates" || task.name === "domains")
      ) {
        console.log(
          JSON.stringify({
            success: false,
            error: `${task.name} fixes require interactive choices and cannot use --json --yes`,
          }),
        );
        process.exitCode = 1;
        return;
      }
      if (json) {
        const report = await captureDoctorTaskOutput(task, db, taskOptions);
        let payload: Record<string, unknown> = {
          success: report.error === undefined,
          task: task.name,
          ...report,
        };
        if (
          task.name === "contexts" &&
          !report.error &&
          report.lines.length === 1
        ) {
          try {
            payload = JSON.parse(report.lines[0]) as Record<string, unknown>;
          } catch {
            // Fall back to the generic captured report.
          }
        }
        console.log(JSON.stringify(payload));
        if (report.error || payload.success === false) {
          process.exitCode = 1;
        }
        return;
      }
      await task.run(db, taskOptions);
    });
  });
