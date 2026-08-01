/**
 * `zam review` — Interactive review session.
 */

import { Command } from "commander";
import type { BloomLevel, Database } from "../../kernel/index.js";
import {
  buildReviewQueue,
  generatePrompt,
  getKnowledgeContextByName,
  openDatabase,
  resolveReviewContext,
} from "../../kernel/index.js";
import { formatHeader } from "../learn-format.js";
import { runInteractiveReviewAction } from "../review-actions.js";
import { resolveUser } from "../users/identity.js";

export const reviewCommand = new Command("review")
  .description("Start an interactive review session")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--max-new <n>", "Maximum new cards", "10")
  .option("--max-reviews <n>", "Maximum review cards", "50")
  .option("--no-resolve", "Skip resolving source_link into inline context")
  .option(
    "--knowledge-context <context>",
    "Filter review queue by knowledge context",
  )
  .action(async (opts) => {
    let db: Database | undefined;
    try {
      db = await openDatabase();
      const userId = await resolveUser(opts, db);

      // ADR Decision 4: without an explicit --knowledge-context the queue
      // stays unscoped (everything, interleaved). The device default drives
      // generation defaults only, never review eligibility.
      let resolvedContext: string | undefined;
      if (opts.knowledgeContext) {
        const context = await getKnowledgeContextByName(
          db,
          opts.knowledgeContext,
        );
        if (!context) {
          throw new Error(
            `Knowledge context not found: ${opts.knowledgeContext}`,
          );
        }
        resolvedContext = context.name;
      }

      const queue = await buildReviewQueue(db, {
        userId,
        maxNew: Number(opts.maxNew),
        maxReviews: Number(opts.maxReviews),
        knowledgeContext: resolvedContext,
      });

      if (queue.items.length === 0) {
        console.log("No cards due for review. You're all caught up!");
        await db.close();
        return;
      }

      console.log(`\nReview session: ${queue.items.length} card(s)`);
      if (resolvedContext) {
        console.log(`  Context: ${resolvedContext}`);
      }
      console.log(
        `  New: ${queue.newCount}  Review: ${queue.reviewCount}  Relearn: ${queue.relearnCount}`,
      );
      console.log(`  Domains: ${queue.totalDomains.join(", ")}`);
      console.log();

      const _completed = 0;
      let stoppedEarly = false;
      let maintenanceActions = 0;
      const results: Array<{
        slug: string;
        rating: number;
        nextDue: string | undefined;
      }> = [];

      for (const [index, item] of queue.items.entries()) {
        const prompt = generatePrompt({
          cardId: item.cardId,
          tokenId: item.tokenId,
          slug: item.slug,
          concept: item.concept,
          domain: item.domain,
          bloomLevel: item.bloomLevel as BloomLevel,
          sourceLink: item.sourceLink,
        });

        console.log(
          `\n[${index + 1}/${queue.items.length}] ${formatHeader({ bloomLevel: item.bloomLevel, domain: item.domain })}`,
        );
        if (prompt.sourceLink) {
          console.log(`Source: ${prompt.sourceLink}`);
          if (opts.resolve !== false) {
            const ctx = await resolveReviewContext(item.sourceLink, {
              maxChars: 1200,
            }).catch(() => null);
            if (ctx && ctx.sourceType === "dynamic_search") {
              console.log(`  ↳ ${ctx.content}`);
            } else if (ctx?.content.trim()) {
              const indented = ctx.content
                .trimEnd()
                .split("\n")
                .map((line) => `  │ ${line}`)
                .join("\n");
              console.log("  Context:");
              console.log(indented);
              if (ctx.truncated) {
                console.log("  │ … (truncated)");
              }
            }
          }
        }
        console.log(`\n  ${prompt.question}\n`);

        const action = await runInteractiveReviewAction({
          db,
          userId,
          item,
          mode: "review",
          startedAt: Date.now(),
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
            nextDue: action.result.evaluation?.nextDueAt,
          });
        } else if (action.action !== "skip") {
          maintenanceActions++;
        }
      }

      // Session summary
      console.log(`\n${"═".repeat(50)}`);
      console.log(
        stoppedEarly ? "Review session ended." : "Review session complete!",
      );
      console.log(`  Cards rated: ${results.length}`);
      if (maintenanceActions > 0) {
        console.log(`  Maintenance actions: ${maintenanceActions}`);
      }

      if (results.length > 0) {
        const avgRating =
          results.reduce((s, r) => s + r.rating, 0) / results.length;
        console.log(`  Average rating: ${avgRating.toFixed(1)}`);

        const forgot = results.filter((r) => r.rating === 1).length;
        if (forgot > 0) {
          console.log(`  Forgot: ${forgot} card(s)`);
        }
      }

      await db.close();
    } catch (err) {
      await db?.close();
      // User cancelled with Ctrl+C — exit gracefully
      if ((err as Error).name === "ExitPromptError") {
        console.log("\nReview session cancelled.");
        process.exit(0);
      }
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });
