/**
 * `zam token` — Token management subcommand group.
 */

import { Command } from "commander";
import type { BloomLevel, SymbiosisMode } from "../../kernel/index.js";
import {
  addPrerequisite,
  createToken,
  deleteToken,
  deprecateToken,
  ensureCard,
  generateConceptFreeCue,
  getCard,
  getDependents,
  getEmbeddingCoverage,
  getPrerequisites,
  getSetting,
  getTokenBySlug,
  getTokenDeleteImpact,
  listTokens,
  searchTokensHybrid,
  updateToken,
} from "../../kernel/index.js";
import {
  canonicalEmbeddingModelId,
  embedQuery,
  ensureTokenEmbeddings,
  findPossibleDuplicates,
  resolveUsableEmbeddingEndpoint,
} from "../llm/embedder.js";
import { resolveUser } from "../users/identity.js";
import { jsonOut, withDb } from "./shared/db.js";

export const tokenCommand = new Command("token").description(
  "Manage knowledge tokens",
);

// ── zam token register ────────────────────────────────────────────────────

tokenCommand
  .command("register")
  .description("Register a new knowledge token")
  .requiredOption("--slug <slug>", "Unique token slug")
  .requiredOption("--concept <concept>", "Concept description")
  .option("--domain <domain>", "Knowledge domain", "")
  .option("--bloom <level>", "Bloom taxonomy level (1-5)", "1")
  .option("--source-link <link>", "Source file path or reference URL", "")
  .option("--question <question>", "Specific question prompt for recall", "")
  .option("--user <id>", "Owner of the personal card (default: whoami)")
  .option("--no-card", "Register the token only; do not create a personal card")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      // Token creation is the frontier model's job: the agent (Claude Code,
      // Copilot / Antigravity CLI, …) decomposes the concept into atomic units
      // and may pass an explicit --question. The local LLM is deliberately NOT
      // called here — it is reserved for REVIEW time, where it rephrases the
      // question freshly each session so the learner never memorizes a fixed
      // "exact input → exact output" pair (see ensureHighQualityQuestion()).
      let question: string | null = opts.question || null;
      if (!question) {
        question = generateConceptFreeCue(
          Number(opts.bloom) as BloomLevel,
          opts.slug,
          opts.domain,
        );
      }

      const possibleDuplicates = await findPossibleDuplicates(db, {
        concept: opts.concept,
        question,
        domain: opts.domain,
      });

      const token = await createToken(db, {
        slug: opts.slug,
        concept: opts.concept,
        domain: opts.domain,
        bloom_level: Number(opts.bloom) as BloomLevel,
        source_link: opts.sourceLink || null,
        question,
      });

      // A token with no card never surfaces — not in the deck, not in the
      // content editor (which lists cards). In the single-user (default)
      // scenario the learner's card is created alongside the token so it is
      // immediately visible and reviewable. --no-card opts out for pure
      // knowledge-graph scaffolding in shared, multi-user libraries.
      let cardUserId: string | null = null;
      if (opts.card !== false) {
        cardUserId = opts.user ?? (await getSetting(db, "user.id"));
        if (cardUserId) {
          await ensureCard(db, token.id, cardUserId);
        }
      }

      // Best effort embedding top-up so this token is immediately search-ready.
      try {
        await ensureTokenEmbeddings(db, { limit: 8 });
      } catch {
        // ignore
      }

      if (opts.quiet) return;

      if (opts.json) {
        console.log(
          JSON.stringify(
            { token, card: cardUserId ? { userId: cardUserId } : null },
            null,
            2,
          ),
        );
      } else {
        console.log(`Registered token: ${token.slug} (${token.id})`);
        console.log(`  Concept:  ${token.concept}`);
        console.log(`  Domain:   ${token.domain || "(none)"}`);
        console.log(`  Bloom:    ${token.bloom_level}`);
        console.log(`  Question: ${token.question}`);
        if (token.source_link) {
          console.log(`  Source:   ${token.source_link}`);
        }
        if (cardUserId) {
          console.log(`  Card:     created for ${cardUserId}`);
        } else if (opts.card === false) {
          console.log(`  Card:     skipped (--no-card)`);
        } else {
          console.log(`  Card:     skipped (no default user set)`);
        }
        if (possibleDuplicates.length > 0) {
          console.log(`\nWARNING: Possible duplicate tokens found:`);
          for (const dup of possibleDuplicates) {
            console.log(
              `  - ${dup.slug} (similarity: ${dup.similarity.toFixed(2)})`,
            );
          }
        }
      }
    });
  });

// ── zam token find ────────────────────────────────────────────────────────

tokenCommand
  .command("find")
  .description("Fuzzy search for tokens")
  .requiredOption("--query <query>", "Search query")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const embRes = await ensureTokenEmbeddings(db, { limit: 32 });
      if (embRes.status === "unavailable" && !opts.json && !opts.quiet) {
        console.error(
          `Note: semantic search unavailable (${embRes.reason}) — lexical matches only.`,
        );
      }

      const q = await embedQuery(db, opts.query);
      const results = await searchTokensHybrid(db, opts.query, {
        queryEmbedding: q?.vector,
        model: q?.model,
      });

      if (opts.quiet) return;

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
        "Score  Sim  Slug                  Concept                         Domain      Bloom",
      );
      console.log("─".repeat(95));
      for (const t of results) {
        const scoreStr = t.score.toFixed(3).padEnd(6);
        const simStr = (t.similarity?.toFixed(2) ?? "-").padEnd(4);
        console.log(
          `${scoreStr} ${simStr} ${t.slug.padEnd(21)} ${t.concept.slice(0, 31).padEnd(31)} ${(t.domain || "-").padEnd(11)} ${t.bloom_level}`,
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
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const tokens = await listTokens(
        db,
        opts.domain ? { domain: opts.domain } : undefined,
      );

      if (opts.quiet) return;

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
  .option(
    "--mode <mode>",
    "Updated symbiosis mode: shadowing | copilot | autonomy | none",
  )
  .option(
    "--source-link <link>",
    "Updated source file path or reference URL (blank allowed)",
  )
  .option("--question <question>", "Updated question text (blank allowed)")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const updates: {
        concept?: string;
        domain?: string;
        bloom_level?: BloomLevel;
        context?: string;
        symbiosis_mode?: SymbiosisMode | null;
        source_link?: string | null;
        question?: string | null;
      } = {};

      if (opts.concept !== undefined) updates.concept = opts.concept;
      if (opts.domain !== undefined) updates.domain = opts.domain;
      if (opts.bloom !== undefined)
        updates.bloom_level = Number(opts.bloom) as BloomLevel;
      if (opts.context !== undefined) updates.context = opts.context;
      if (opts.sourceLink !== undefined) {
        updates.source_link = opts.sourceLink === "" ? null : opts.sourceLink;
      }
      if (opts.question !== undefined) {
        updates.question = opts.question === "" ? null : opts.question;
      }
      if (opts.mode !== undefined) {
        const validModes = ["shadowing", "copilot", "autonomy", "none"];
        if (!validModes.includes(opts.mode)) {
          console.error(`Invalid --mode: ${opts.mode}`);
          process.exit(1);
        }
        updates.symbiosis_mode =
          opts.mode === "none" ? null : (opts.mode as SymbiosisMode);
      }

      const token = await updateToken(db, opts.slug, updates);

      if (opts.quiet) return;

      if (opts.json) {
        jsonOut(token);
        return;
      }

      console.log(`Updated token: ${token.slug}`);
      console.log(`  Concept:  ${token.concept}`);
      console.log(`  Domain:   ${token.domain || "(none)"}`);
      console.log(`  Bloom:    ${token.bloom_level}`);
      console.log(`  Question: ${token.question || "(none)"}`);
      console.log(`  Context:  ${token.context || "(none)"}`);
      console.log(`  Mode:     ${token.symbiosis_mode ?? "none"}`);
      console.log(`  Source:   ${token.source_link || "(none)"}`);
    });
  });

// ── zam token prereq ─────────────────────────────────────────────────────

tokenCommand
  .command("prereq")
  .description("Add a prerequisite edge between tokens")
  .requiredOption("--token <slug>", "Token that requires a prerequisite")
  .requiredOption("--requires <slug>", "Required prerequisite token")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const token = await getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const requires = await getTokenBySlug(db, opts.requires);
      if (!requires) {
        console.error(`Prerequisite token not found: ${opts.requires}`);
        process.exit(1);
      }

      await addPrerequisite(db, token.id, requires.id);

      if (opts.quiet) return;

      if (opts.json) {
        console.log(
          JSON.stringify(
            { token: opts.token, requires: opts.requires },
            null,
            2,
          ),
        );
      } else {
        console.log(
          `Added prerequisite: ${opts.token} requires ${opts.requires}`,
        );
      }
    });
  });

// ── zam token deprecate ───────────────────────────────────────────────────

tokenCommand
  .command("deprecate")
  .description(
    "Mark a token as deprecated (excluded from reviews, not deleted)",
  )
  .requiredOption("--slug <slug>", "Token slug to deprecate")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const token = await deprecateToken(db, opts.slug);

      if (opts.quiet) return;

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
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const impact = await getTokenDeleteImpact(db, opts.slug);

      if (!opts.force) {
        const preview = {
          slug: opts.slug,
          deleted: false,
          requiresForce: true,
          impact,
        };

        if (opts.quiet) return;

        if (opts.json) {
          jsonOut(preview);
          return;
        }

        console.log(`Delete preview for ${opts.slug}:`);
        console.log(`  Cards:                 ${impact.cards}`);
        console.log(`  Review logs:           ${impact.review_logs}`);
        console.log(
          `  Prereq edges from it:  ${impact.prerequisite_edges_from_token}`,
        );
        console.log(
          `  Prereq edges to it:    ${impact.prerequisite_edges_to_token}`,
        );
        console.log(`  Session steps:         ${impact.session_steps}`);
        console.log(`  Sessions touched:      ${impact.sessions_touched}`);
        console.log(`  Agent skills updated:  ${impact.agent_skills}`);
        console.log("\nRe-run with --force to delete.");
        return;
      }

      const result = await deleteToken(db, opts.slug);

      if (opts.quiet) return;

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
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db);
      const token = await getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const card = await getCard(db, token.id, userId);
      const prereqs = await getPrerequisites(db, token.id);
      const dependents = await getDependents(db, token.id);

      const status = {
        token,
        card: card ?? null,
        prerequisites: prereqs,
        dependents,
      };

      if (opts.quiet) return;

      if (opts.json) {
        console.log(JSON.stringify(status, null, 2));
        return;
      }

      console.log(`Token: ${token.slug} (${token.id})`);
      console.log(`  Concept:  ${token.concept}`);
      console.log(`  Question: ${token.question || "(none)"}`);
      console.log(`  Domain:   ${token.domain || "(none)"}`);
      console.log(`  Bloom:    ${token.bloom_level}`);
      if (token.source_link) {
        console.log(`  Source:   ${token.source_link}`);
      }
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

// ── zam token reembed ─────────────────────────────────────────────────────

tokenCommand
  .command("reembed")
  .description("Backfill or refresh semantic-search embeddings for tokens")
  .option("--all", "Force re-embed every token, including already-fresh ones")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const endpoint = await resolveUsableEmbeddingEndpoint(db);
      const model = endpoint ? canonicalEmbeddingModelId(endpoint.model) : null;
      const before = model
        ? await getEmbeddingCoverage(db, model)
        : { tokens: 0, embedded: 0, missing: 0, stale: 0 };

      let embedded = 0;
      let reason: string | undefined;
      // --all runs as a single UNBOUNDED forced pass: force with the default
      // per-call cap would re-select the same leading batch forever (freshness
      // is ignored, so nothing ever drops out of the selection), while forcing
      // only a capped first pass would leave every fresh token beyond the cap
      // untouched. Unbounded, one forced pass covers the whole token base
      // (batched per-request internally); follow-up passes run without force
      // and only mop up genuinely missing/stale rows.
      let force = Boolean(opts.all);
      while (true) {
        const result = await ensureTokenEmbeddings(
          db,
          force ? { force: true, limit: Number.MAX_SAFE_INTEGER } : {},
        );
        force = false;
        embedded += result.embedded;
        if (result.status === "unavailable") {
          reason = result.reason;
          break;
        }
        if (result.remaining === 0 || result.embedded === 0) break;
      }

      if (reason !== undefined) {
        if (opts.quiet) {
          process.exit(1);
        }
        if (opts.json) {
          jsonOut({ error: reason, embedded });
        } else {
          console.error(`Error: ${reason}`);
          if (embedded > 0) {
            console.error(
              `(${embedded} token(s) were embedded before the failure)`,
            );
          }
        }
        process.exit(1);
      }

      // model is guaranteed non-null here: reason undefined means at least
      // one ensureTokenEmbeddings call above resolved a usable endpoint.
      const after = await getEmbeddingCoverage(db, model as string);

      if (opts.quiet) return;

      const staleBefore = before.missing + before.stale;
      if (opts.json) {
        jsonOut({ embedded, model, before, after });
        return;
      }

      console.log(
        `Embedded ${embedded} tokens (${after.tokens} total, ${staleBefore} stale before) with ${model}`,
      );
    });
  });
