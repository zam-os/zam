/**
 * `zam learn` — Standalone, spoiler-free, in-process learning session.
 *
 * Slice 1 of the Session Harness (Increment 5), variant (a): no LLM.
 * Flow per card: show a concept-free cue → capture the learner's answer →
 * ONLY THEN reveal the stored answer (concept + context + resolved source_link)
 * → single self-rating 1–4 via the shared interactive action handler.
 *
 * Because the harness owns its own prompt and never prints the answer before
 * input is captured, no external autocomplete/ghost-text can spoil it, and
 * ratings/logs are written in-process (no per-subcommand permission prompts).
 */

import { input } from "@inquirer/prompts";
import { Command } from "commander";
import type { Database } from "libsql";
import {
  buildReviewQueue,
  generatePrompt,
  getTokenById,
  openDatabase,
  resolveReviewContext,
} from "../../kernel/index.js";
import type { BloomLevel } from "../../kernel/index.js";
import { formatHeader, formatReveal } from "../learn-format.js";
import { runInteractiveReviewAction } from "../review-actions.js";
import { resolveUser } from "./resolve-user.js";

/** Words the learner can type at the answer prompt to end the session. */
const STOP_WORDS = new Set(["q", ":q", "quit", "stop"]);

function isExitPrompt(err: unknown): boolean {
  return err instanceof Error && err.name === "ExitPromptError";
}

export const learnCommand = new Command("learn")
  .description("Run a spoiler-free, in-process learning session (recall → reveal → self-rate)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--max-new <n>", "Maximum new cards", "10")
  .option("--max-reviews <n>", "Maximum review cards", "50")
  .option("--no-resolve", "Skip resolving source_link into the revealed answer")
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
        console.log("Nothing due to learn. You're all caught up!");
        db.close();
        return;
      }

      console.log(`\nLearning session: ${queue.items.length} card(s)`);
      console.log(
        `  New: ${queue.newCount}  Review: ${queue.reviewCount}  Relearn: ${queue.relearnCount}`,
      );
      console.log(`  Domains: ${queue.totalDomains.join(", ")}`);
      console.log(
        "\nRecall each answer first, reveal it, then rate yourself honestly.",
      );
      console.log("Type 'q' at the answer prompt (or press Ctrl+C) to stop anytime.");

      let stoppedEarly = false;
      let maintenanceActions = 0;
      const results: Array<{ slug: string; rating: number }> = [];

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

        console.log(`\n${"─".repeat(50)}`);
        console.log(`[${index + 1}/${queue.items.length}] ${formatHeader(item)}`);
        console.log(`\n  ${prompt.question}`);

        // Capture the learner's answer FIRST — nothing is revealed yet.
        // Typing a stop word (or Ctrl+C) ends the session gracefully.
        let answer: string;
        try {
          answer = await input({
            message: "Your answer (Enter to reveal · 'q' to stop):",
          });
        } catch (err) {
          if (isExitPrompt(err)) {
            stoppedEarly = true;
            console.log("\nStopping session.");
            break;
          }
          throw err;
        }

        if (STOP_WORDS.has(answer.trim().toLowerCase())) {
          stoppedEarly = true;
          console.log("Stopping session.");
          break;
        }

        // Now reveal the stored answer.
        let resolved = null;
        if (opts.resolve !== false && item.sourceLink) {
          resolved = await resolveReviewContext(item.sourceLink).catch(() => null);
        }
        const token = getTokenById(db, item.tokenId);

        console.log(`\n  ── Answer ${"─".repeat(38)}`);
        const reveal = formatReveal({
          concept: item.concept,
          context: token?.context,
          resolved,
        });
        for (const line of reveal.split("\n")) {
          console.log(`  ${line}`);
        }
        console.log();

        let action: Awaited<ReturnType<typeof runInteractiveReviewAction>>;
        try {
          action = await runInteractiveReviewAction({ db, userId, item, mode: "review" });
        } catch (err) {
          if (isExitPrompt(err)) {
            stoppedEarly = true;
            console.log("\nStopping session.");
            break;
          }
          throw err;
        }

        if (action.action === "stop") {
          stoppedEarly = true;
          console.log("\nStopping session.");
          break;
        }
        if (action.action === "rate") {
          results.push({ slug: item.slug, rating: action.rating! });
        } else if (action.action !== "skip") {
          maintenanceActions++;
        }
      }

      console.log(`\n${"═".repeat(50)}`);
      console.log(stoppedEarly ? "Learning session ended." : "Learning session complete!");
      console.log(`  Cards rated: ${results.length}`);
      if (maintenanceActions > 0) {
        console.log(`  Maintenance actions: ${maintenanceActions}`);
      }
      if (results.length > 0) {
        const avg = results.reduce((s, r) => s + r.rating, 0) / results.length;
        console.log(`  Average rating: ${avg.toFixed(1)}`);
        const forgot = results.filter((r) => r.rating === 1).length;
        if (forgot > 0) {
          console.log(`  Forgot: ${forgot} card(s)`);
        }
      }

      db.close();
    } catch (err) {
      db?.close();
      if ((err as Error).name === "ExitPromptError") {
        console.log("\nLearning session cancelled.");
        process.exit(0);
      }
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });
