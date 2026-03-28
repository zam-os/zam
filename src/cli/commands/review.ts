/**
 * `zam review` — Interactive review session.
 */

import { Command } from "commander";
import type { Database } from "libsql";
import { select, input } from "@inquirer/prompts";
import {
  openDatabase,
  buildReviewQueue,
  generatePrompt,
  evaluateRating,
  cascadeBlock,
  getPrerequisites,
} from "../../kernel/index.js";
import type { Rating, BloomLevel } from "../../kernel/index.js";
import { resolveUser } from "./resolve-user.js";

export const reviewCommand = new Command("review")
  .description("Start an interactive review session")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--max-new <n>", "Maximum new cards", "10")
  .option("--max-reviews <n>", "Maximum review cards", "50")
  .action(async (opts) => {
    let db: Database | undefined;
    try {
      db = openDatabase();
      const userId = resolveUser(opts, db);

      const queue = buildReviewQueue(db, {
        userId,
        maxNew: Number(opts.maxNew),
        maxReviews: Number(opts.maxReviews),
      });

      if (queue.items.length === 0) {
        console.log("No cards due for review. You're all caught up!");
        db.close();
        return;
      }

      console.log(`\nReview session: ${queue.items.length} card(s)`);
      console.log(`  New: ${queue.newCount}  Review: ${queue.reviewCount}  Relearn: ${queue.relearnCount}`);
      console.log(`  Domains: ${queue.totalDomains.join(", ")}`);
      console.log();

      let completed = 0;
      const results: Array<{
        slug: string;
        rating: number;
        nextDue: string;
      }> = [];

      for (const item of queue.items) {
        completed++;

        const prompt = generatePrompt({
          cardId: item.cardId,
          tokenId: item.tokenId,
          slug: item.slug,
          concept: item.concept,
          domain: item.domain,
          bloomLevel: item.bloomLevel as BloomLevel,
        });

        console.log(`\n[${ completed }/${queue.items.length}] ${prompt.bloomVerb} (Bloom ${prompt.bloomLevel})`);
        console.log(`Domain: ${prompt.domain || "(none)"}`);
        console.log(`\n  ${prompt.question}\n`);

        const rating = await select({
          message: "How did you do?",
          choices: [
            { name: "1 - Again (forgot)", value: 1 },
            { name: "2 - Hard", value: 2 },
            { name: "3 - Good", value: 3 },
            { name: "4 - Easy", value: 4 },
          ],
        }) as Rating;

        const evalResult = evaluateRating(db, {
          cardId: item.cardId,
          tokenId: item.tokenId,
          userId,
          rating,
        });

        // If rating 1 and token has prereqs, cascade block
        if (rating === 1) {
          const prereqs = getPrerequisites(db, item.tokenId);
          if (prereqs.length > 0) {
            const blockResult = cascadeBlock(db, userId, item.slug);
            console.log(`  Blocked ${blockResult.blockedSlug}. Review these prerequisites:`);
            for (const p of blockResult.prerequisites) {
              console.log(`    - ${p.slug}: ${p.concept}`);
            }
          }
        }

        const ratingLabels: Record<number, string> = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" };
        console.log(`  ${ratingLabels[rating]} — next due: ${evalResult.nextDueAt}`);

        results.push({
          slug: item.slug,
          rating,
          nextDue: evalResult.nextDueAt,
        });
      }

      // Session summary
      console.log("\n" + "═".repeat(50));
      console.log("Review session complete!");
      console.log(`  Cards reviewed: ${results.length}`);

      const avgRating = results.reduce((s, r) => s + r.rating, 0) / results.length;
      console.log(`  Average rating: ${avgRating.toFixed(1)}`);

      const forgot = results.filter((r) => r.rating === 1).length;
      if (forgot > 0) {
        console.log(`  Forgot: ${forgot} card(s)`);
      }

      db.close();
    } catch (err) {
      db?.close();
      // User cancelled with Ctrl+C — exit gracefully
      if ((err as Error).name === "ExitPromptError") {
        console.log("\nReview session cancelled.");
        process.exit(0);
      }
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });
