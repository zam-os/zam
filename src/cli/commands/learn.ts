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
import type { BloomLevel, SupportedLocale } from "../../kernel/index.js";
import {
  buildReviewQueue,
  generatePrompt,
  getSetting,
  getTokenById,
  openDatabase,
  resolveReviewContext,
  t,
} from "../../kernel/index.js";
import { formatHeader, formatReveal } from "../learn-format.js";
import {
  ensureHighQualityQuestion,
  ensureLocalLlmRunning,
  evaluateAnswerViaLLM,
  translateQuestionViaLLM,
} from "../llm/client.js";
import { runInteractiveReviewAction } from "../review-actions.js";
import { resolveUser } from "./resolve-user.js";

/** Words the learner can type at the answer prompt to end the session. */
const STOP_WORDS = new Set(["q", ":q", "quit", "stop"]);

function isExitPrompt(err: unknown): boolean {
  return err instanceof Error && err.name === "ExitPromptError";
}

export const learnCommand = new Command("learn")
  .description(
    "Run a spoiler-free, in-process learning session (recall → reveal → self-rate)",
  )
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

      const locale = (getSetting(db, "system.locale") ||
        "en") as SupportedLocale;

      if (queue.items.length === 0) {
        console.log(t(locale, "nothing_due"));
        db.close();
        return;
      }

      // Start the local LLM if needed and verify it is actually usable
      // (reachable AND serving the configured model). A wrong model name
      // otherwise looks like "the AI is slow" — instead we fall back cleanly.
      const llm = await ensureLocalLlmRunning(db);
      const isLlmEnabled = llm.usable;

      console.log(`\n${t(locale, "welcome", { count: queue.items.length })}`);
      console.log(
        t(locale, "new_review_relearn", {
          newC: queue.newCount,
          reviewC: queue.reviewCount,
          relearnC: queue.relearnCount,
        }),
      );
      console.log(
        t(locale, "domains", { domains: queue.totalDomains.join(", ") }),
      );

      // When the LLM is simply switched off, nudge the user; offline /
      // model-not-found already printed their own actionable message.
      if (!isLlmEnabled && llm.reason === "disabled") {
        console.log(t(locale, "offline_warning"));
        console.log(t(locale, "offline_instruction"));
      }

      console.log(t(locale, "instruction"));
      console.log(t(locale, "quit_hint"));

      let stoppedEarly = false;
      let maintenanceActions = 0;
      const results: Array<{ slug: string; rating: number }> = [];

      for (const [index, item] of queue.items.entries()) {
        // Dynamically generate a fresh, living active-recall question if LLM is enabled
        let resolvedQuestion = item.question;
        if (isLlmEnabled) {
          console.log(`  \x1b[2m${t(locale, "generating_question")}\x1b[0m`);
          try {
            const healed = await ensureHighQualityQuestion(db, {
              id: item.tokenId,
              slug: item.slug,
              concept: item.concept,
              domain: item.domain,
              bloomLevel: item.bloomLevel as BloomLevel,
              sourceLink: item.sourceLink,
              question: item.question,
            });
            if (healed) {
              resolvedQuestion = healed;
            }
          } catch {
            // ignore and proceed
          }
        }

        const prompt = generatePrompt({
          cardId: item.cardId,
          tokenId: item.tokenId,
          slug: item.slug,
          concept: item.concept,
          domain: item.domain,
          bloomLevel: item.bloomLevel as BloomLevel,
          sourceLink: item.sourceLink,
          question: resolvedQuestion,
        });

        console.log(`\n${"─".repeat(50)}`);
        console.log(
          `[${index + 1}/${queue.items.length}] ${formatHeader(item)}`,
        );

        // Dynamically translate question if LLM is enabled and locale is not English
        let displayQuestion = prompt.question;
        if (locale !== "en" && isLlmEnabled) {
          console.log(`  \x1b[2m${t(locale, "translating")}\x1b[0m`);
          try {
            displayQuestion = await translateQuestionViaLLM(
              db,
              prompt.question,
            );
          } catch {
            // fallback to original question on error/offline
          }
        }

        console.log(`\n  ${displayQuestion}`);

        // Capture the learner's answer FIRST — nothing is revealed yet.
        // Typing a stop word (or Ctrl+C) ends the session gracefully.
        let answer: string;
        try {
          answer = await input({
            message: t(locale, "prompt_answer"),
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
          resolved = await resolveReviewContext(item.sourceLink).catch(
            () => null,
          );
        }
        const token = getTokenById(db, item.tokenId);

        // Perform LLM evaluation if enabled and there is a typed answer
        if (isLlmEnabled && answer.trim().length > 0) {
          console.log(`\n  ${t(locale, "evaluating")}`);
          try {
            const evaluation = await evaluateAnswerViaLLM(db, {
              slug: item.slug,
              concept: item.concept,
              domain: item.domain,
              bloomLevel: item.bloomLevel,
              context: token?.context,
              question: prompt.question,
              userAnswer: answer,
              sourceLinkContent: resolved?.content,
            });
            console.log(
              `\n  ${t(locale, "feedback_title", { line: "─".repeat(34) })}`,
            );
            for (const line of evaluation.split("\n")) {
              console.log(`  ${line}`);
            }
          } catch (err) {
            console.warn(
              `\n${t(locale, "eval_skipped", { reason: (err as Error).message })}`,
            );
          }
        }

        console.log(
          `\n  ${t(locale, "answer_title", { line: "─".repeat(38) })}`,
        );
        const reveal = formatReveal({
          slug: item.slug,
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
          action = await runInteractiveReviewAction({
            db,
            userId,
            item,
            mode: "review",
          });
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
      console.log(
        stoppedEarly
          ? t(locale, "session_ended")
          : t(locale, "session_complete"),
      );
      console.log(t(locale, "cards_rated", { count: results.length }));
      if (maintenanceActions > 0) {
        console.log(`  Maintenance actions: ${maintenanceActions}`);
      }
      if (results.length > 0) {
        const avg = results.reduce((s, r) => s + r.rating, 0) / results.length;
        console.log(t(locale, "avg_rating", { avg: avg.toFixed(1) }));
        const forgot = results.filter((r) => r.rating === 1).length;
        if (forgot > 0) {
          console.log(t(locale, "forgot", { count: forgot }));
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
