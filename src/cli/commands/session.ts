/**
 * `zam session` — Session management subcommand group.
 *
 * Session start follows the two-phase flow from Increment 2:
 * Phase 1 — Repetition: review due cards (pure recall first, skippable)
 * Phase 2 — Task execution: pick a work item from ADO or enter a custom task
 */

import { Command } from "commander";
import type { Database } from "libsql";
import { select, input } from "@inquirer/prompts";
import {
  openDatabase,
  startSession,
  logStep,
  endSession,
  getSessionSummary,
  getTokenBySlug,
  loadADOConfig,
  fetchActiveWorkItems,
  buildReviewQueue,
  generatePrompt,
  getSetting,
} from "../../kernel/index.js";
import type { ExecutionContext, BloomLevel } from "../../kernel/index.js";
import { resolveUser } from "./resolve-user.js";
import { runInteractiveReviewAction } from "../review-actions.js";

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

export const sessionCommand = new Command("session")
  .description("Manage learning sessions");

// ── zam session start ─────────────────────────────────────────────────────

sessionCommand
  .command("start")
  .description("Start a new learning session (review → task)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--task <description>", "Task description (interactive if omitted)")
  .option("--context <level>", "Execution context: shell | ui | reallife (default: shell)", "shell")
  .option("--skip-review", "Skip the repetition phase and go straight to task selection")
  .option("--review-minutes <n>", "Maximum minutes for the repetition phase (default: 20)", "20")
  .option("--json", "Output as JSON")
  .option("--quiet", "Output only the session ID")
  .action(async (opts) => {
    let db: Database | undefined;
    try {
      db = openDatabase();

      const validContexts = ["shell", "ui", "reallife"];
      if (!validContexts.includes(opts.context)) {
        console.error(`Invalid context: ${opts.context}. Must be one of: ${validContexts.join(", ")}`);
        process.exit(1);
      }

      const userId = resolveUser(opts, db);
      const reviewMinutes = Number(opts.reviewMinutes);

      // ── Phase 1: Repetition ────────────────────────────────────────────
      if (!opts.skipReview && !opts.quiet && !opts.json) {
        const reviewResults = await runRepetitionPhase(db, userId, reviewMinutes);
        if (reviewResults.reviewed > 0) {
          console.log();
        }
      }

      // ── Phase 2: Task Selection ────────────────────────────────────────
      let task: string = opts.task;

      if (!task && !opts.quiet && !opts.json) {
        task = await selectTask(db);
      }

      if (!task) {
        // Fallback for --quiet/--json without --task
        console.error("Task description is required. Use --task or run interactively.");
        process.exit(1);
      }

      const session = startSession(db, {
        user_id: userId,
        task,
        execution_context: opts.context as ExecutionContext,
      });

      db.close();

      if (opts.quiet) {
        console.log(session.id);
      } else if (opts.json) {
        console.log(JSON.stringify(session, null, 2));
      } else {
        console.log(`\nSession started: ${session.id}`);
        console.log(`  User:    ${session.user_id}`);
        console.log(`  Task:    ${session.task}`);
        console.log(`  Context: ${session.execution_context}`);
        console.log(`  Started: ${session.started_at}`);
      }
    } catch (err) {
      db?.close();
      if ((err as Error).name === "ExitPromptError") {
        console.log("\nSession cancelled.");
        process.exit(0);
      }
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

// ── Phase 1: Repetition ─────────────────────────────────────────────────────

interface RepetitionResult {
  reviewed: number;
  maintained: number;
  skipped: boolean;
}

async function runRepetitionPhase(
  db: Database,
  userId: string,
  maxMinutes: number,
): Promise<RepetitionResult> {
  const queue = buildReviewQueue(db, { userId });

  if (queue.items.length === 0) {
    console.log("No cards due for review — moving to task selection.\n");
    return { reviewed: 0, maintained: 0, skipped: false };
  }

  console.log("═".repeat(50));
  console.log("Phase 1: Repetition");
  console.log("═".repeat(50));
  console.log(`${queue.items.length} card(s) due`);
  console.log(`  New: ${queue.newCount}  Review: ${queue.reviewCount}  Relearn: ${queue.relearnCount}`);
  console.log(`  Domains: ${queue.totalDomains.join(", ")}`);
  console.log(`  Time limit: ${maxMinutes} minutes (skip anytime with 's')`);
  console.log();

  const startTime = Date.now();
  const timeLimitMs = maxMinutes * 60 * 1000;
  let reviewed = 0;
  let maintained = 0;

  for (const [index, item] of queue.items.entries()) {
    // Check time limit
    if (Date.now() - startTime >= timeLimitMs) {
      console.log(`\nTime limit reached (${maxMinutes} min). Moving to task selection.`);
      break;
    }

    const prompt = generatePrompt({
      cardId: item.cardId,
      tokenId: item.tokenId,
      slug: item.slug,
      concept: item.concept,
      domain: item.domain,
      bloomLevel: item.bloomLevel as BloomLevel,
    });

    const elapsed = Math.round((Date.now() - startTime) / 60000);
    console.log(`[${index + 1}/${queue.items.length}] ${prompt.bloomVerb} (Bloom ${prompt.bloomLevel}) — ${elapsed}/${maxMinutes} min`);
    console.log(`Domain: ${prompt.domain || "(none)"}`);
    console.log(`\n  ${prompt.question}\n`);

    const action = await runInteractiveReviewAction({
      db,
      userId,
      item,
      mode: "session",
    });

    if (action.action === "stop") {
      console.log("Stopping review and moving to task selection.");
      return { reviewed, maintained, skipped: true };
    }

    if (action.action === "rate") {
      reviewed++;
    } else if (action.action !== "skip") {
      maintained++;
    }
  }

  if (reviewed > 0 || maintained > 0) {
    console.log("─".repeat(50));
    console.log(`Repetition complete — ${reviewed} card(s) rated.`);
    if (maintained > 0) {
      console.log(`Maintenance actions: ${maintained}`);
    }
  }

  return { reviewed, maintained, skipped: false };
}

// ── Phase 2: Task Selection ─────────────────────────────────────────────────

async function selectTask(db: Database): Promise<string> {
  console.log("═".repeat(50));
  console.log("Phase 2: Task Selection");
  console.log("═".repeat(50));

  const adoConfig = loadADOConfig(db);

  if (adoConfig) {
    const items = await fetchActiveWorkItems(adoConfig);

    if (items.length > 0) {
      const choices = items.map((wi) => ({
        name: `[${wi.type}] ${wi.title} (${wi.state})`,
        value: `[ADO-${wi.id}] ${wi.title}`,
      }));
      choices.push({ name: "Enter a custom task...", value: "__custom__" });

      const picked = await select({
        message: `${items.length} active work item(s) — pick one:`,
        choices,
      });

      if (picked !== "__custom__") return picked;
    } else {
      console.log("No active work items found in Azure DevOps.");
    }
  }

  return input({ message: "Task description:" });
}

// ── zam session log ───────────────────────────────────────────────────────

sessionCommand
  .command("log")
  .description("Log a step within a session")
  .requiredOption("--session <id>", "Session ID")
  .requiredOption("--token <slug>", "Token slug")
  .requiredOption("--done-by <who>", "Who performed the step (user or agent)")
  .option("--rating <n>", "Rating (1-4)")
  .option("--json", "Output as JSON")
  .option("--quiet", "Suppress output (exit code only)")
  .action((opts) => {
    withDb((db) => {
      const token = getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const step = logStep(db, {
        session_id: opts.session,
        token_id: token.id,
        done_by: opts.doneBy as "user" | "agent",
        rating: opts.rating ? Number(opts.rating) : undefined,
      });

      if (opts.quiet) return;
      if (opts.json) {
        console.log(JSON.stringify(step, null, 2));
      } else {
        console.log(`Step logged: ${step.id}`);
        console.log(`  Token:   ${opts.token}`);
        console.log(`  Done by: ${step.done_by}`);
        if (step.rating != null) {
          console.log(`  Rating:  ${step.rating}`);
        }
      }
    });
  });

// ── zam session end ───────────────────────────────────────────────────────

sessionCommand
  .command("end")
  .description("End a session and show summary")
  .requiredOption("--session <id>", "Session ID")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      endSession(db, opts.session);
      const summary = getSessionSummary(db, opts.session);

      if (opts.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      console.log(`Session ${summary.session.id} completed.`);
      console.log(`  Task: ${summary.session.task}`);
      console.log(`  Started:   ${summary.session.started_at}`);
      console.log(`  Completed: ${summary.session.completed_at}`);
      console.log(`  Steps:     ${summary.steps.length}`);

      if (summary.steps.length > 0) {
        console.log("\nSteps:");
        console.log(
          "  Token                 Done by  Rating  Concept",
        );
        console.log("  " + "─".repeat(70));
        for (const s of summary.steps) {
          console.log(
            `  ${s.slug.padEnd(21)} ${s.done_by.padEnd(8)} ${String(s.rating ?? "-").padEnd(7)} ${s.concept.slice(0, 30)}`,
          );
        }
      }
    });
  });
