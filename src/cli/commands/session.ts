/**
 * `zam session` — Session management subcommand group.
 *
 * Session start follows the two-phase flow from Increment 2:
 * Phase 1 — Repetition: review due cards (pure recall first, skippable)
 * Phase 2 — Task execution: pick a work item from ADO or enter a custom task
 */

import { readFileSync } from "node:fs";
import { input, select } from "@inquirer/prompts";
import { Command } from "commander";
import type {
  BloomLevel,
  Database,
  ExecutionContext,
  Rating,
  SynthesisConfidence,
  TokenPattern,
} from "../../kernel/index.js";
import {
  AtomSiblingOccupiedError,
  admitPresentation,
  applySessionSynthesis,
  buildReviewQueue,
  CardNotDueError,
  endSession,
  fetchActiveWorkItems,
  generatePrompt,
  getSessionSummary,
  getTokenBySlug,
  hostTimeZone,
  isObserverPolicyConfigured,
  loadADOConfig,
  logStep,
  OBSERVER_POLICY_UNSET_HINT,
  openDatabase,
  prepareSessionSynthesis,
  startSession,
} from "../../kernel/index.js";
import { formatHeader } from "../learn-format.js";
import { runInteractiveReviewAction } from "../review-actions.js";
import { resolveUser } from "../users/identity.js";
import { withDb } from "./shared/db.js";

export const sessionCommand = new Command("session").description(
  "Manage learning sessions",
);

// ── zam session start ─────────────────────────────────────────────────────

sessionCommand
  .command("start")
  .description("Start a new learning session (review → task)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--task <description>", "Task description (interactive if omitted)")
  .option(
    "--context <level>",
    "Execution context: shell | ui | reallife (default: shell)",
    "shell",
  )
  .option(
    "--skip-review",
    "Skip the repetition phase and go straight to task selection",
  )
  .option(
    "--review-minutes <n>",
    "Maximum minutes for the repetition phase (default: 20)",
    "20",
  )
  .option("--json", "Output as JSON")
  .option("--quiet", "Output only the session ID")
  .action(async (opts) => {
    let db: Database | undefined;
    try {
      db = await openDatabase();

      const validContexts = ["shell", "ui", "reallife"];
      if (!validContexts.includes(opts.context)) {
        console.error(
          `Invalid context: ${opts.context}. Must be one of: ${validContexts.join(", ")}`,
        );
        process.exit(1);
      }

      const userId = await resolveUser(opts, db);
      const reviewMinutes = Number(opts.reviewMinutes);

      // ── Phase 1: Repetition ────────────────────────────────────────────
      if (!opts.skipReview && !opts.quiet && !opts.json) {
        const reviewResults = await runRepetitionPhase(
          db,
          userId,
          reviewMinutes,
        );
        if (reviewResults.reviewed > 0) {
          console.log();
        }
      }

      // ── Phase 2: Task Selection ────────────────────────────────────────
      let task: string = opts.task;

      if (!task && !opts.quiet && !opts.json) {
        task = await selectTask();
      }

      if (!task) {
        // Fallback for --quiet/--json without --task
        console.error(
          "Task description is required. Use --task or run interactively.",
        );
        process.exit(1);
      }

      const session = await startSession(db, {
        user_id: userId,
        task,
        execution_context: opts.context as ExecutionContext,
      });

      const observerHint =
        opts.context === "ui" && !(await isObserverPolicyConfigured(db))
          ? OBSERVER_POLICY_UNSET_HINT
          : null;

      await db.close();

      if (opts.quiet) {
        console.log(session.id);
      } else if (opts.json) {
        console.log(
          JSON.stringify(
            observerHint
              ? { ...session, observerPolicyHint: observerHint }
              : session,
            null,
            2,
          ),
        );
      } else {
        console.log(`\nSession started: ${session.id}`);
        console.log(`  User:    ${session.user_id}`);
        console.log(`  Task:    ${session.task}`);
        console.log(`  Context: ${session.execution_context}`);
        console.log(`  Started: ${session.started_at}`);
        if (observerHint) {
          console.log(`\n${observerHint}`);
        }
      }
    } catch (err) {
      await db?.close();
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
  const timeZone = hostTimeZone();
  const queue = await buildReviewQueue(db, { userId, timeZone });

  if (queue.items.length === 0) {
    console.log("No cards due for review — moving to task selection.\n");
    return { reviewed: 0, maintained: 0, skipped: false };
  }

  console.log("═".repeat(50));
  console.log("Phase 1: Repetition");
  console.log("═".repeat(50));
  console.log(`${queue.items.length} card(s) due`);
  console.log(
    `  New: ${queue.newCount}  Review: ${queue.reviewCount}  Relearn: ${queue.relearnCount}`,
  );
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
      console.log(
        `\nTime limit reached (${maxMinutes} min). Moving to task selection.`,
      );
      break;
    }

    // Record the exposure before the question is printed; a sibling of the
    // same atom shown earlier today is skipped rather than shown twice.
    let attemptId: string;
    try {
      const admission = await admitPresentation(db, {
        userId,
        cardId: item.cardId,
        timeZone,
        confirm: true,
      });
      attemptId = admission.attemptId;
    } catch (err) {
      if (
        err instanceof AtomSiblingOccupiedError ||
        err instanceof CardNotDueError
      ) {
        continue;
      }
      throw err;
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
    console.log(
      `[${index + 1}/${queue.items.length}] ${formatHeader({ bloomLevel: item.bloomLevel, domain: item.domain })} (${elapsed}/${maxMinutes} min)`,
    );
    console.log(`\n  ${prompt.question}\n`);

    const action = await runInteractiveReviewAction({
      db,
      userId,
      item,
      mode: "session",
      startedAt: Date.now(),
      attemptId,
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

async function selectTask(): Promise<string> {
  console.log("═".repeat(50));
  console.log("Phase 2: Task Selection");
  console.log("═".repeat(50));

  const adoConfig = loadADOConfig();

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

// ── Session synthesis ───────────────────────────────────────────────────────

const RATING_LABELS: Record<Rating, string> = {
  1: "Again",
  2: "Hard",
  3: "Good",
  4: "Easy",
};

function loadPatternFile(path: string | undefined): TokenPattern[] {
  if (!path) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf-8"));
  } catch (err) {
    throw new Error(
      `Cannot read synthesis patterns from ${path}: ${(err as Error).message}`,
    );
  }

  const patterns =
    typeof parsed === "object" &&
    parsed !== null &&
    "patterns" in parsed &&
    Array.isArray(parsed.patterns)
      ? parsed.patterns
      : parsed;

  if (!Array.isArray(patterns)) {
    throw new Error(
      "Synthesis pattern file must contain an array or { patterns: [...] }",
    );
  }

  return patterns.map((entry: unknown, index: number) => {
    if (
      typeof entry !== "object" ||
      entry === null ||
      !("slug" in entry) ||
      typeof entry.slug !== "string" ||
      !("patterns" in entry) ||
      !Array.isArray(entry.patterns) ||
      !entry.patterns.every((pattern) => typeof pattern === "string")
    ) {
      throw new Error(
        `Invalid synthesis pattern at index ${index}: expected { slug, patterns[] }`,
      );
    }
    return { slug: entry.slug, patterns: entry.patterns };
  });
}

async function runSynthesisPhase(
  db: Database,
  sessionId: string,
  options: {
    patternFile?: string;
    minConfidence: SynthesisConfidence;
  },
): Promise<number> {
  const preview = await prepareSessionSynthesis(db, {
    sessionId,
    explicitPatterns: loadPatternFile(options.patternFile),
    minConfidence: options.minConfidence,
  });

  console.log("\nObservation synthesis");
  console.log("─".repeat(50));
  console.log(
    `  Commands: ${preview.commandCount}  Token patterns: ${preview.patternCount}`,
  );
  if (preview.alreadyApplied > 0) {
    console.log(`  Already applied: ${preview.alreadyApplied}`);
  }
  if (preview.skippedLowConfidence > 0) {
    console.log(
      `  Below ${options.minConfidence} confidence: ${preview.skippedLowConfidence}`,
    );
  }

  if (preview.patternCount === 0) {
    console.log(
      "  No token patterns found. Link tokens to agent skills or pass --patterns <file>.",
    );
    return 0;
  }
  if (preview.candidates.length === 0) {
    console.log("  No new medium/high-confidence ratings to confirm.");
    return 0;
  }

  let applied = 0;
  for (const candidate of preview.candidates) {
    console.log(`\n${candidate.tokenSlug}: ${candidate.concept}`);
    console.log(
      candidate.inferredRating == null
        ? `  Suggested: none (${candidate.confidence} confidence; exit code or similarity alone is not a rating)`
        : `  Suggested: ${candidate.inferredRating} - ${RATING_LABELS[candidate.inferredRating]} (${candidate.confidence} confidence)`,
    );
    console.log(
      `  Evidence: ${candidate.evidence.matchedCommands} command(s), ${candidate.evidence.errorCount} error(s), ${candidate.evidence.selfCorrections} correction(s)${candidate.evidence.helpSeeking ? ", help used" : ""}`,
    );
    for (const command of candidate.matchedCommandTexts.slice(0, 5)) {
      console.log(`    ${command}`);
    }

    const otherRatings = ([1, 2, 3, 4] as Rating[]).filter(
      (rating) => rating !== candidate.inferredRating,
    );
    const acceptChoice =
      candidate.inferredRating == null
        ? []
        : [
            {
              name: `Accept ${candidate.inferredRating} - ${RATING_LABELS[candidate.inferredRating]}`,
              value: candidate.inferredRating,
            },
          ];
    const choice = await select<Rating | "skip">({
      message: `Confirm rating for ${candidate.tokenSlug}:`,
      choices: [
        ...acceptChoice,
        ...otherRatings.map((rating) => ({
          name: `Override with ${rating} - ${RATING_LABELS[rating]}`,
          value: rating,
        })),
        { name: "Skip without changing learning state", value: "skip" },
      ],
    });

    if (choice === "skip") {
      console.log("  Skipped.");
      continue;
    }

    const result = await applySessionSynthesis(db, {
      sessionId,
      tokenSlug: candidate.tokenSlug,
      inferredRating: candidate.inferredRating,
      confirmedRating: choice,
      confidence: candidate.confidence,
      evidence: candidate.evidence,
      matchedCommandTexts: candidate.matchedCommandTexts,
      attemptId: candidate.attemptId,
    });

    if (!result.applied) {
      console.log("  Already applied; learning state unchanged.");
      continue;
    }

    applied++;
    console.log(`  Applied ${choice} - ${RATING_LABELS[choice]}.`);
    if (result.blocked) {
      console.log(
        `  Blocked ${result.blocked.blockedSlug}; prerequisites surfaced.`,
      );
    }
  }

  return applied;
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
  .action(async (opts) => {
    await withDb(async (db) => {
      const token = await getTokenBySlug(db, opts.token);
      if (!token) {
        console.error(`Token not found: ${opts.token}`);
        process.exit(1);
      }

      const step = await logStep(db, {
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
  .option(
    "--synthesize",
    "Analyze monitor evidence and confirm ratings before ending",
  )
  .option(
    "--patterns <path>",
    "JSON file with additional { slug, patterns[] } mappings",
  )
  .option(
    "--min-confidence <level>",
    "Minimum synthesis confidence: medium | high",
    "medium",
  )
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      if (opts.patterns && !opts.synthesize) {
        throw new Error("--patterns requires --synthesize");
      }
      if (opts.synthesize && opts.json) {
        throw new Error("--json cannot be combined with interactive synthesis");
      }
      if (!["medium", "high"].includes(opts.minConfidence)) {
        throw new Error("--min-confidence must be medium or high");
      }

      const before = await getSessionSummary(db, opts.session);
      if (opts.synthesize) {
        await runSynthesisPhase(db, opts.session, {
          patternFile: opts.patterns,
          minConfidence: opts.minConfidence as SynthesisConfidence,
        });
      }

      if (!before.session.completed_at) {
        await endSession(db, opts.session);
      } else if (!opts.synthesize) {
        throw new Error(`Session already completed: ${opts.session}`);
      }

      const summary = await getSessionSummary(db, opts.session);

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
        console.log("  Token                 Done by  Rating  Concept");
        console.log(`  ${"─".repeat(70)}`);
        for (const s of summary.steps) {
          console.log(
            `  ${s.slug.padEnd(21)} ${s.done_by.padEnd(8)} ${String(s.rating ?? "-").padEnd(7)} ${s.concept.slice(0, 30)}`,
          );
        }
      }
    });
  });
