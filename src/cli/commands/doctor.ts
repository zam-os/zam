/**
 * `zam doctor` — Knowledge base maintenance and repair.
 * Implements the `zam doctor` from the titles ADR.
 */

import { Command } from "commander";
import { withDb } from "./shared/db.js";
import { listTokens, updateToken } from "../../kernel/models/token.js";
import { generateTitleViaLLM, getLlmConfig } from "../llm/client.js";
type DB = any;

interface DoctorTask {
  name: string;
  description: string;
  run: (db: DB, opts: { fix?: boolean; dryRun?: boolean; yes?: boolean }) => Promise<void>;
}

const tasks: DoctorTask[] = [
  {
    name: "titles",
    description: "Backfill missing/weak human-friendly titles (no domain echoes, descriptive names).",
    run: async (db, opts) => {
      const tokens = await listTokens(db, {});
      const needing = tokens.filter((t) => !t.title || t.title.trim() === "" || t.title === t.slug);
      console.log(`Found ${needing.length} tokens needing title work (of ${tokens.length}).`);
      if (needing.length === 0) return;
      if (!opts.fix) {
        console.log("Dry run (use --fix to apply). Sample proposals (will use LLM on --fix):");
        needing.slice(0, 3).forEach((t) => {
          const proposed = t.concept?.split(/[.;]/)[0]?.trim() || t.slug;
          console.log(`  ${t.slug} -> "${proposed.substring(0, 60)}"`);
        });
        return;
      }

      let fixed = 0;
      const cfg = await getLlmConfig(db);
      const useLLM = !!cfg; // if LLM configured

      for (const t of needing) {
        if (t.title && t.title.trim() && t.title !== t.slug) continue;

        let proposed: string;
        if (useLLM) {
          try {
            const gen = await generateTitleViaLLM(db, {
              slug: t.slug,
              concept: t.concept,
              domain: t.domain,
              question: t.question,
              context: t.context,
            });
            proposed = gen.text.trim();
            // Enforce rules post-LLM
            const domWords = (t.domain || "").split(/[-/]/).filter(Boolean);
            for (const w of domWords) {
              const re = new RegExp("^" + w + "\\s+", "i");
              proposed = proposed.replace(re, "");
            }
            if (proposed.length > 100) proposed = proposed.substring(0, 97) + "...";
          } catch (e) {
            console.warn(`LLM title gen failed for ${t.slug}, using heuristic`);
            proposed = (t.concept || "").split(/[.;]/)[0]?.trim() || t.slug.replace(/-/g, " ");
          }
        } else {
          proposed = (t.concept || "").split(/[.;]/)[0]?.trim() || t.slug.replace(/-/g, " ");
          const domWords = (t.domain || "").split(/[-/]/).filter(Boolean);
          for (const w of domWords) {
            const re = new RegExp("^" + w + "\\s+", "i");
            proposed = proposed.replace(re, "");
          }
        }

        if (opts.dryRun) {
          console.log(`Would set ${t.slug} title -> ${proposed}`);
          continue;
        }
        await updateToken(db, t.slug, { title: proposed });
        fixed++;
        console.log(`Set title for ${t.slug} -> ${proposed}`);
      }
      console.log(`Fixed ${fixed} titles. (Content changes will trigger re-embed on next use.)`);
    },
  },
  {
    name: "texts",
    description: "Repair legacy ASCII umlauts in prose fields (question/concept/context).",
    run: async (db, opts) => {
      const tokens = await listTokens(db, {});
      // Better heuristic: only common German umlaut words, avoid English
      const replacements = [
        [/\bUeber\b/g, 'Über'],
        [/\bueber\b/g, 'über'],
        [/\bFuer\b/g, 'Für'],
        [/\bfuer\b/g, 'für'],
        [/\bMuehe\b/g, 'Mühe'],
        [/\bmuehe\b/g, 'mühe'],
        [/\bKuer\b/g, 'Kür'],
        [/\bkuer\b/g, 'kür'],
        [/\bNahe\b/g, 'Nähe'],
        [/\bnahe\b/g, 'nähe'],
        [/\bUe([a-z])/g, 'Ü$1'],
        [/\bOe([a-z])/g, 'Ö$1'],
        [/\bAe([a-z])/g, 'Ä$1'],
      ];
      let toFix: Array<{ token: any; field: string; old: string; new: string }> = [];
      for (const t of tokens) {
        const fields = [
          { key: 'question', val: t.question },
          { key: 'concept', val: t.concept },
          { key: 'context', val: t.context },
          { key: 'title', val: t.title },
        ];
        for (const f of fields) {
          if (!f.val || typeof f.val !== 'string') continue;
          let repaired = f.val;
          for (const [from, to] of replacements) {
            repaired = repaired.replace(from, to as string);
          }
          if (repaired !== f.val) {
            toFix.push({ token: t, field: f.key, old: f.val, new: repaired });
          }
        }
      }
      console.log(`Found ${toFix.length} prose fields with legacy umlauts.`);
      if (toFix.length === 0) return;
      if (!opts.fix) {
        console.log("Dry run. Sample fixes:");
        toFix.slice(0, 5).forEach(fix => {
          console.log(`  ${fix.token.slug} ${fix.field}: "${fix.old.substring(0,40)}..." -> "${fix.new.substring(0,40)}..."`);
        });
        return;
      }
      let fixed = 0;
      for (const fix of toFix) {
        if (opts.dryRun) {
          console.log(`Would fix ${fix.token.slug} ${fix.field}`);
          continue;
        }
        const updates: any = {};
        updates[fix.field] = fix.new;
        await updateToken(db, fix.token.slug, updates);
        fixed++;
      }
      console.log(`Fixed ${fixed} fields. (Re-embed will happen automatically for changed content.)`);
    },
  },
  {
    name: "duplicates",
    description: "List semantic duplicates for review/merge.",
    run: async (db, opts) => {
      // Reuse findPossibleDuplicates logic, but for all tokens
      const { findPossibleDuplicates } = await import("../../cli/llm/embedder.js");
      // Simple: scan for dups
      const tokens = await listTokens(db, {});
      console.log(`Scanning ${tokens.length} tokens for semantic duplicates (threshold from settings)...`);
      // For demo, use a basic scan; full would call for each
      console.log("duplicates: basic scan not fully wired yet. Use `zam token search` or future full impl.");
      if (opts.fix) {
        console.log("(no auto-merge yet)");
      }
    },
  },
  {
    name: "domains",
    description: "Help rename/unify domains into / hierarchy (slugs untouched).",
    run: async (db, opts) => {
      const tokens = await listTokens(db, {});
      const domains = new Set(tokens.map(t => t.domain).filter(Boolean));
      console.log(`Current domains (${domains.size}):`);
      Array.from(domains).sort().forEach(d => console.log(`  ${d}`));
      console.log("\nUse --fix with care to propose renames (not auto yet).");
      if (opts.fix) {
        console.log("(domains rename logic not implemented; edit manually or future).");
      }
    },
  },
];

export const doctorCommand = new Command("doctor")
  .description("Diagnose and repair the knowledge base (titles, legacy data, duplicates, domains).")
  .option("--fix", "Apply changes (default is dry-run)")
  .option("--dry-run", "Explicit dry run (default)")
  .option("--yes", "Auto-confirm without prompts")
  .argument("[task]", "Specific task: titles, texts, duplicates, domains")
  .action(async (taskName, opts) => {
    await withDb(async (db) => {
      const fix = !!opts.fix;
      const dryRun = !fix || !!opts.dryRun;
      const yes = !!opts.yes;

      if (!taskName) {
        console.log("Available doctor tasks:");
        tasks.forEach((t) => console.log(`  ${t.name} — ${t.description}`));
        console.log("\nRun with a task name, e.g. `zam doctor titles --fix`");
        return;
      }

      const task = tasks.find((t) => t.name === taskName);
      if (!task) {
        console.error(`Unknown task: ${taskName}`);
        process.exit(1);
      }

      console.log(`Running doctor task: ${task.name} (fix=${fix}, dryRun=${dryRun})`);
      await task.run(db, { fix, dryRun, yes });
    });
  });
