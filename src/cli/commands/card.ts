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
  .requiredOption("--user <id>", "User ID")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const dueCards = getDueCards(db, opts.user);

      if (opts.json) {
        console.log(JSON.stringify(dueCards, null, 2));
        return;
      }

      if (dueCards.length === 0) {
        console.log("No cards due for review.");
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
  .requiredOption("--user <id>", "User ID")
  .requiredOption("--token <slug>", "Token slug")
  .requiredOption("--rating <n>", "Rating (1=Again, 2=Hard, 3=Good, 4=Easy)")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const token = getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const card = ensureCard(db, token.id, opts.user);
      const rating = Number(opts.rating) as Rating;

      if (rating < 1 || rating > 4) {
        console.error("Rating must be between 1 and 4.");
        process.exit(1);
      }

      const result = evaluateRating(db, {
        cardId: card.id,
        tokenId: token.id,
        userId: opts.user,
        rating,
      });

      // If rating is 1 (forgot) and token has prerequisites, cascade block
      if (rating === 1) {
        const prereqs = getPrerequisites(db, token.id);
        if (prereqs.length > 0) {
          const blockResult = cascadeBlock(db, opts.user, token.slug);
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
  .requiredOption("--user <id>", "User ID")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const result = unblockReady(db, opts.user);

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
