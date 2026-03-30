/**
 * `zam review` — Interactive review session.
 */

import { Command } from "commander";
import type { Database } from "libsql";
import {
  openDatabase,
  buildReviewQueue,
  generatePrompt,
} from "../../kernel/index.js";
import type { Rating, BloomLevel } from "../../kernel/index.js";
import { resolveUser } from "./resolve-user.js";
import { runInteractiveReviewAction } from "../review-actions.js";

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
      let stoppedEarly = false;
      let maintenanceActions = 0;
      const results: Array<{
        slug: string;
        rating: number;
        nextDue: string;
      }> = [];

      for (const [index, item] of queue.items.entries()) {
        const prompt = generatePrompt({
          cardId: item.cardId,
          tokenId: item.tokenId,
          slug: item.slug,
          concept: item.concept,
          domain: item.domain,
          bloomLevel: item.bloomLevel as BloomLevel,
        });

        console.log(`\n[${index + 1}/${queue.items.length}] ${prompt.bloomVerb} (Bloom ${prompt.bloomLevel})`);
        console.log(`Domain: ${prompt.domain || "(none)"}`);
        console.log(`\n  ${prompt.question}\n`);

        const action = await runInteractiveReviewAction({
          db,
          userId,
          item,
          mode: "review",
        });

        if (action.action === "stop") {
          stoppedEarly = true;
          console.log("\nStopping review.");
          break;
        }

        if (action.action === "rate") {
          results.push({
            slug: item.slug,
            rating: action.rating!,
            nextDue: action.result.evaluation!.nextDueAt,
          });
        } else if (action.action !== "skip") {
          maintenanceActions++;
        }
      }

      // Session summary
      console.log("\n" + "═".repeat(50));
      console.log(stoppedEarly ? "Review session ended." : "Review session complete!");
      console.log(`  Cards rated: ${results.length}`);
      if (maintenanceActions > 0) {
        console.log(`  Maintenance actions: ${maintenanceActions}`);
      }

      if (results.length > 0) {
        const avgRating = results.reduce((s, r) => s + r.rating, 0) / results.length;
        console.log(`  Average rating: ${avgRating.toFixed(1)}`);

        const forgot = results.filter((r) => r.rating === 1).length;
        if (forgot > 0) {
          console.log(`  Forgot: ${forgot} card(s)`);
        }
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
