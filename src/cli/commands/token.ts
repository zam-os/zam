/**
 * `zam token` — Token management subcommand group.
 */

import { Command } from "commander";
import type { Database } from "libsql";
import {
  openDatabase,
  createToken,
  updateToken,
  findTokens,
  listTokens,
  getTokenBySlug,
  addPrerequisite,
  getPrerequisites,
  getDependents,
  getCard,
  deprecateToken,
  getTokenDeleteImpact,
  deleteToken,
} from "../../kernel/index.js";
import type { BloomLevel, SymbiosisMode } from "../../kernel/index.js";
import { resolveUser } from "./resolve-user.js";

function withDb(fn: (db: Database) => void): void {
  let db: Database | undefined;
  try {
    db = openDatabase();
    fn(db);
  } catch (err) {
    console.error("Error:", (err as Error).message);
    process.exit(1);
  } finally {
    db?.close();
  }
}

function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export const tokenCommand = new Command("token")
  .description("Manage knowledge tokens");

// ── zam token register ────────────────────────────────────────────────────

tokenCommand
  .command("register")
  .description("Register a new knowledge token")
  .requiredOption("--slug <slug>", "Unique token slug")
  .requiredOption("--concept <concept>", "Concept description")
  .option("--domain <domain>", "Knowledge domain", "")
  .option("--bloom <level>", "Bloom taxonomy level (1-5)", "1")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const token = createToken(db, {
        slug: opts.slug,
        concept: opts.concept,
        domain: opts.domain,
        bloom_level: Number(opts.bloom) as BloomLevel,
      });

      if (opts.json) {
        console.log(JSON.stringify(token, null, 2));
      } else {
        console.log(`Registered token: ${token.slug} (${token.id})`);
        console.log(`  Concept: ${token.concept}`);
        console.log(`  Domain:  ${token.domain || "(none)"}`);
        console.log(`  Bloom:   ${token.bloom_level}`);
      }
    });
  });

// ── zam token find ────────────────────────────────────────────────────────

tokenCommand
  .command("find")
  .description("Fuzzy search for tokens")
  .requiredOption("--query <query>", "Search query")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const results = findTokens(db, opts.query);

      if (opts.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      if (results.length === 0) {
        console.log("No tokens found.");
        return;
      }

      console.log(`Found ${results.length} token(s):\n`);
      console.log(
        "Score  Slug                  Concept                         Domain      Bloom",
      );
      console.log("─".repeat(90));
      for (const t of results) {
        console.log(
          `${String(t.score).padEnd(6)} ${t.slug.padEnd(21)} ${t.concept.slice(0, 31).padEnd(31)} ${(t.domain || "-").padEnd(11)} ${t.bloom_level}`,
        );
      }
    });
  });

// ── zam token list ────────────────────────────────────────────────────────

tokenCommand
  .command("list")
  .description("List all tokens")
  .option("--domain <domain>", "Filter by domain")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const tokens = listTokens(db, opts.domain ? { domain: opts.domain } : undefined);

      if (opts.json) {
        console.log(JSON.stringify(tokens, null, 2));
        return;
      }

      if (tokens.length === 0) {
        console.log("No tokens registered.");
        return;
      }

      console.log(
        "Slug                  Concept                         Domain      Bloom",
      );
      console.log("─".repeat(80));
      for (const t of tokens) {
        console.log(
          `${t.slug.padEnd(21)} ${t.concept.slice(0, 31).padEnd(31)} ${(t.domain || "-").padEnd(11)} ${t.bloom_level}`,
        );
      }
      console.log(`\n${tokens.length} token(s) total.`);
    });
  });

// ── zam token edit ────────────────────────────────────────────────────────

tokenCommand
  .command("edit")
  .description("Edit a token's mutable fields")
  .requiredOption("--slug <slug>", "Token slug")
  .option("--concept <concept>", "Updated concept text")
  .option("--domain <domain>", "Updated domain (blank allowed)")
  .option("--bloom <level>", "Updated Bloom taxonomy level (1-5)")
  .option("--context <context>", "Updated context (blank allowed)")
  .option("--mode <mode>", "Updated symbiosis mode: shadowing | copilot | autonomy | none")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const updates: {
        concept?: string;
        domain?: string;
        bloom_level?: BloomLevel;
        context?: string;
        symbiosis_mode?: SymbiosisMode | null;
      } = {};

      if (opts.concept !== undefined) updates.concept = opts.concept;
      if (opts.domain !== undefined) updates.domain = opts.domain;
      if (opts.bloom !== undefined) updates.bloom_level = Number(opts.bloom) as BloomLevel;
      if (opts.context !== undefined) updates.context = opts.context;
      if (opts.mode !== undefined) {
        const validModes = ["shadowing", "copilot", "autonomy", "none"];
        if (!validModes.includes(opts.mode)) {
          console.error(`Invalid --mode: ${opts.mode}`);
          process.exit(1);
        }
        updates.symbiosis_mode = opts.mode === "none" ? null : opts.mode as SymbiosisMode;
      }

      const token = updateToken(db, opts.slug, updates);

      if (opts.json) {
        jsonOut(token);
        return;
      }

      console.log(`Updated token: ${token.slug}`);
      console.log(`  Concept: ${token.concept}`);
      console.log(`  Domain:  ${token.domain || "(none)"}`);
      console.log(`  Bloom:   ${token.bloom_level}`);
      console.log(`  Context: ${token.context || "(none)"}`);
      console.log(`  Mode:    ${token.symbiosis_mode ?? "none"}`);
    });
  });

// ── zam token prereq ─────────────────────────────────────────────────────

tokenCommand
  .command("prereq")
  .description("Add a prerequisite edge between tokens")
  .requiredOption("--token <slug>", "Token that requires a prerequisite")
  .requiredOption("--requires <slug>", "Required prerequisite token")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const token = getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const requires = getTokenBySlug(db, opts.requires);
      if (!requires) {
        console.error(`Prerequisite token not found: ${opts.requires}`);
        process.exit(1);
      }

      addPrerequisite(db, token.id, requires.id);

      if (opts.json) {
        console.log(JSON.stringify({ token: opts.token, requires: opts.requires }, null, 2));
      } else {
        console.log(`Added prerequisite: ${opts.token} requires ${opts.requires}`);
      }
    });
  });

// ── zam token deprecate ───────────────────────────────────────────────────

tokenCommand
  .command("deprecate")
  .description("Mark a token as deprecated (excluded from reviews, not deleted)")
  .requiredOption("--slug <slug>", "Token slug to deprecate")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const token = deprecateToken(db, opts.slug);

      if (opts.json) {
        console.log(JSON.stringify(token, null, 2));
      } else {
        console.log(`Deprecated: ${token.slug}`);
        console.log(`  Concept: ${token.concept}`);
        console.log(`  At:      ${token.deprecated_at}`);
      }
    });
  });

// ── zam token delete ──────────────────────────────────────────────────────

tokenCommand
  .command("delete")
  .description("Hard-delete a token and its dependent learning data")
  .requiredOption("--slug <slug>", "Token slug to delete")
  .option("--force", "Actually delete the token")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const impact = getTokenDeleteImpact(db, opts.slug);

      if (!opts.force) {
        const preview = {
          slug: opts.slug,
          deleted: false,
          requiresForce: true,
          impact,
        };

        if (opts.json) {
          jsonOut(preview);
          return;
        }

        console.log(`Delete preview for ${opts.slug}:`);
        console.log(`  Cards:                 ${impact.cards}`);
        console.log(`  Review logs:           ${impact.review_logs}`);
        console.log(`  Prereq edges from it:  ${impact.prerequisite_edges_from_token}`);
        console.log(`  Prereq edges to it:    ${impact.prerequisite_edges_to_token}`);
        console.log(`  Session steps:         ${impact.session_steps}`);
        console.log(`  Sessions touched:      ${impact.sessions_touched}`);
        console.log(`  Agent skills updated:  ${impact.agent_skills}`);
        console.log("\nRe-run with --force to delete.");
        return;
      }

      const result = deleteToken(db, opts.slug);

      if (opts.json) {
        jsonOut({
          slug: result.token.slug,
          deleted: true,
          impact: result.impact,
        });
        return;
      }

      console.log(`Deleted token: ${result.token.slug}`);
      console.log(`  Cards removed:         ${result.impact.cards}`);
      console.log(`  Review logs removed:   ${result.impact.review_logs}`);
      console.log(`  Session steps removed: ${result.impact.session_steps}`);
      console.log(`  Agent skills updated:  ${result.impact.agent_skills}`);
    });
  });

// ── zam token status ─────────────────────────────────────────────────────

tokenCommand
  .command("status")
  .description("Show full status of a token for a user")
  .requiredOption("--token <slug>", "Token slug")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db);
      const token = getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const card = getCard(db, token.id, userId);
      const prereqs = getPrerequisites(db, token.id);
      const dependents = getDependents(db, token.id);

      const status = {
        token,
        card: card ?? null,
        prerequisites: prereqs,
        dependents,
      };

      if (opts.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      console.log(`Token: ${token.slug} (${token.id})`);
      console.log(`  Concept: ${token.concept}`);
      console.log(`  Domain:  ${token.domain || "(none)"}`);
      console.log(`  Bloom:   ${token.bloom_level}`);
      console.log();

      if (card) {
        console.log("Card status:");
        console.log(`  State:       ${card.state}`);
        console.log(`  Due at:      ${card.due_at}`);
        console.log(`  Stability:   ${card.stability}`);
        console.log(`  Difficulty:  ${card.difficulty}`);
        console.log(`  Reps:        ${card.reps}`);
        console.log(`  Lapses:      ${card.lapses}`);
        console.log(`  Blocked:     ${card.blocked ? "Yes" : "No"}`);
      } else {
        console.log("No card exists for this user yet.");
      }

      console.log();
      if (prereqs.length > 0) {
        console.log("Prerequisites:");
        for (const p of prereqs) {
          console.log(`  - ${p.slug}: ${p.concept} (bloom ${p.bloom_level})`);
        }
      } else {
        console.log("No prerequisites.");
      }

      if (dependents.length > 0) {
        console.log("\nDependents:");
        for (const d of dependents) {
          console.log(`  - ${d.slug}: ${d.concept} (bloom ${d.bloom_level})`);
        }
      }
    });
  });
