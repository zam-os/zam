/**
 * `zam card` — Card scheduling subcommand group.
 */

import { Command } from "commander";
import type { Database } from "better-sqlite3";
import {
  openDatabase,
  getDueCards,
  getTokenBySlug,
  ensureCard,
  evaluateRating,
  cascadeBlock,
  unblockReady,
  getPrerequisites,
} from "../../kernel/index.js";
import type { Rating } from "../../kernel/index.js";
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

export const cardCommand = new Command("card")
  .description("Manage spaced-repetition cards");

// ── zam card due ──────────────────────────────────────────────────────────

cardCommand
  .command("due")
  .description("Show due tokens for a user")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--json", "Output as JSON")
  .option("--summary", "Show only counts per domain (no slugs or concepts)")
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db);
      const dueCards = getDueCards(db, userId);

      if (opts.json) {
        console.log(JSON.stringify(dueCards, null, 2));
        return;
      }

      if (dueCards.length === 0) {
        console.log("No cards due for review.");
        return;
      }

      if (opts.summary) {
        const byDomain = new Map<string, { count: number; blooms: number[] }>();
        for (const c of dueCards) {
          const d = c.domain || "general";
          const entry = byDomain.get(d) ?? { count: 0, blooms: [] };
          entry.count++;
          entry.blooms.push(c.bloom_level);
          byDomain.set(d, entry);
        }
        console.log(`${dueCards.length} card(s) due:\n`);
        console.log(
          "Domain           Count  Bloom levels",
        );
        console.log("─".repeat(45));
        for (const [domain, { count, blooms }] of [...byDomain.entries()].sort()) {
          const bloomStr = blooms.sort().join(", ");
          console.log(
            `${domain.padEnd(16)} ${String(count).padEnd(6)} ${bloomStr}`,
          );
        }
        return;
      }

      console.log(`${dueCards.length} card(s) due:\n`);
      console.log(
        "Slug                  Concept                         Domain      Bloom  State",
      );
      console.log("─".repeat(90));
      for (const c of dueCards) {
        console.log(
          `${c.slug.padEnd(21)} ${c.concept.slice(0, 31).padEnd(31)} ${(c.domain || "-").padEnd(11)} ${String(c.bloom_level).padEnd(6)} ${c.state}`,
        );
      }
    });
  });

// ── zam card update ───────────────────────────────────────────────────────

cardCommand
  .command("update")
  .description("Apply a rating to a card")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--token <slug>", "Token slug")
  .requiredOption("--rating <n>", "Rating (1=Again, 2=Hard, 3=Good, 4=Easy)")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db);
      const token = getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const card = ensureCard(db, token.id, userId);
      const rating = Number(opts.rating) as Rating;

      if (rating < 1 || rating > 4) {
        console.error("Rating must be between 1 and 4.");
        process.exit(1);
      }

      const result = evaluateRating(db, {
        cardId: card.id,
        tokenId: token.id,
        userId,
        rating,
      });

      // If rating is 1 (forgot) and token has prerequisites, cascade block
      if (rating === 1) {
        const prereqs = getPrerequisites(db, token.id);
        if (prereqs.length > 0) {
          const blockResult = cascadeBlock(db, userId, token.slug);
          if (opts.quiet) return;
          if (opts.json) {
            console.log(JSON.stringify({ evaluation: result, blocked: blockResult }, null, 2));
          } else {
            console.log(`Rated ${token.slug} as Again (1) — next due: ${result.nextDueAt}`);
            console.log(`Blocked ${blockResult.blockedSlug}. Prerequisites surfaced:`);
            for (const p of blockResult.prerequisites) {
              console.log(`  - ${p.slug}: ${p.concept}`);
            }
          }
          return;
        }
      }

      if (opts.quiet) return;
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const ratingLabels: Record<number, string> = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" };
        console.log(`Rated ${token.slug} as ${ratingLabels[rating]} (${rating})`);
        console.log(`  Next due:   ${result.nextDueAt}`);
        console.log(`  Stability:  ${result.stability.toFixed(2)}`);
        console.log(`  State:      ${result.state}`);
        console.log(`  Reps:       ${result.reps}`);
      }
    });
  });

// ── zam card unblock ──────────────────────────────────────────────────────

cardCommand
  .command("unblock")
  .description("Unblock cards whose prerequisites are met")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db);
      const result = unblockReady(db, userId);

      if (opts.quiet) return;
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      if (result.unblocked.length === 0) {
        console.log("No cards ready to unblock.");
      } else {
        console.log(`Unblocked ${result.unblocked.length} card(s):`);
        for (const u of result.unblocked) {
          console.log(`  - ${u.slug}: ${u.concept}`);
        }
      }
    });
  });
