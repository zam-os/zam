/**
 * `zam session` — Session management subcommand group.
 */

import { Command } from "commander";
import type { Database } from "better-sqlite3";
import {
  openDatabase,
  startSession,
  logStep,
  endSession,
  getSessionSummary,
  getTokenBySlug,
} from "../../kernel/index.js";
import type { ExecutionContext } from "../../kernel/index.js";

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
  .description("Start a new learning session")
  .requiredOption("--user <id>", "User ID")
  .requiredOption("--task <description>", "Task description")
  .option("--context <level>", "Execution context: shell | ui | reallife (default: shell)", "shell")
  .option("--json", "Output as JSON")
  .action((opts) => {
    withDb((db) => {
      const validContexts = ["shell", "ui", "reallife"];
      if (!validContexts.includes(opts.context)) {
        console.error(`Invalid context: ${opts.context}. Must be one of: ${validContexts.join(", ")}`);
        process.exit(1);
      }

      const session = startSession(db, {
        user_id: opts.user,
        task: opts.task,
        execution_context: opts.context as ExecutionContext,
      });

      if (opts.json) {
        console.log(JSON.stringify(session, null, 2));
      } else {
        console.log(`Session started: ${session.id}`);
        console.log(`  User:    ${session.user_id}`);
        console.log(`  Task:    ${session.task}`);
        console.log(`  Context: ${session.execution_context}`);
        console.log(`  Started: ${session.started_at}`);
      }
    });
  });

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
