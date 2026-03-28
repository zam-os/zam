/**
 * `zam session` — Session management subcommand group.
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
} from "../../kernel/index.js";
import type { ExecutionContext } from "../../kernel/index.js";
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

export const sessionCommand = new Command("session")
  .description("Manage learning sessions");

// ── zam session start ─────────────────────────────────────────────────────

sessionCommand
  .command("start")
  .description("Start a new learning session")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--task <description>", "Task description (interactive if omitted)")
  .option("--context <level>", "Execution context: shell | ui | reallife (default: shell)", "shell")
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
      let task: string = opts.task;

      // Interactive task selection when --task is not provided
      if (!task) {
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

            task = picked === "__custom__"
              ? await input({ message: "Task description:" })
              : picked;
          } else {
            console.log("No active work items found in Azure DevOps.");
            task = await input({ message: "Task description:" });
          }
        } else {
          task = await input({ message: "Task description:" });
        }

        if (!task) {
          console.error("Task description is required.");
          process.exit(1);
        }
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
        console.log(`Session started: ${session.id}`);
        console.log(`  User:    ${session.user_id}`);
        console.log(`  Task:    ${session.task}`);
        console.log(`  Context: ${session.execution_context}`);
        console.log(`  Started: ${session.started_at}`);
      }
    } catch (err) {
      db?.close();
      if ((err as Error).name === "ExitPromptError") {
        console.log("\nSession start cancelled.");
        process.exit(0);
      }
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
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
