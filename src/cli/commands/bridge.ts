/**
 * `zam bridge` — Machine-readable JSON protocol for AI integration.
 *
 * All output is valid JSON only. No human-readable formatting.
 * Errors are also JSON: { "error": "message" }
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { Command } from "commander";
import type {
  BloomLevel,
  Database,
  NeighborhoodToken,
  Rating,
  ReviewActionType,
  SymbiosisMode,
  TokenPattern,
} from "../../kernel/index.js";
import {
  analyzeObservation,
  appendUiObservationReport,
  BUILT_IN_SENSITIVE_MATCHERS,
  buildReviewQueue,
  createToken,
  decidePostCapture,
  decidePreCapture,
  discoverSkills,
  endSession,
  ensureCard,
  executeReviewAction,
  generatePrompt,
  getAgentSkill,
  getCardDeletionImpact,
  getDueCards,
  getSetting,
  getTokenBySlug,
  getTokenDeleteImpact,
  getTokenNeighborhood,
  isObserverPolicyConfigured,
  listAgentSkills,
  listTokens,
  monitorLogExists,
  OBSERVER_POLICY_UNSET_HINT,
  openDatabase,
  pairCommands,
  readMonitorLog,
  readUiObservationLog,
  resolveObserverPolicy,
  resolveReviewContext,
  startSession,
  syncObserverSidecarPolicy,
  uiObservationLogExists,
} from "../../kernel/index.js";
import {
  checkVisionReadiness,
  ensureHighQualityQuestion,
  ensureLlmReadyHeadless,
  evaluateAnswerViaLLM,
  getAvailableModels,
  getLlmConfig,
  isLlmOnline,
  translateQuestionViaLLM,
} from "../llm/client.js";
import { observeUiSnapshotViaLLM } from "../llm/vision.js";
import { ensureDefaultUser, resolveUser } from "./resolve-user.js";
import { withDb as sharedWithDb } from "./shared/db.js";

let isServeMode = false;

function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function jsonError(message: string): never {
  if (isServeMode) {
    throw new Error(JSON.stringify({ error: message }));
  }
  console.log(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

function parseNonNegativeIntegerOption(name: string, value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    jsonError(`${name} must be a non-negative integer`);
  }
  return parsed;
}

async function withDb(
  fn: (db: Database) => void | Promise<void>,
): Promise<void> {
  await sharedWithDb(fn, jsonError);
}

interface ReviewTargetRow {
  card_id: string;
  token_id: string;
  user_id: string;
  slug: string;
}

async function getReviewTarget(
  db: Database,
  cardId: string,
  userId: string,
): Promise<ReviewTargetRow> {
  const target = (await db
    .prepare(
      `SELECT c.id AS card_id, c.token_id, c.user_id, t.slug
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.id = ?`,
    )
    .get(cardId)) as ReviewTargetRow | undefined;

  if (!target) {
    jsonError(`Card not found: ${cardId}`);
  }
  if (target.user_id !== userId) {
    jsonError(`Card ${cardId} does not belong to user ${userId}`);
  }

  return target!;
}

function parseTokenUpdates(opts: {
  concept?: string;
  domain?: string;
  bloom?: string;
  context?: string;
  mode?: string;
  sourceLink?: string;
}): {
  concept?: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
  source_link?: string | null;
} {
  const updates: {
    concept?: string;
    domain?: string;
    bloom_level?: BloomLevel;
    context?: string;
    symbiosis_mode?: SymbiosisMode | null;
    source_link?: string | null;
  } = {};

  if (opts.concept !== undefined) updates.concept = opts.concept;
  if (opts.domain !== undefined) updates.domain = opts.domain;
  if (opts.bloom !== undefined)
    updates.bloom_level = Number(opts.bloom) as BloomLevel;
  if (opts.context !== undefined) updates.context = opts.context;
  if (opts.sourceLink !== undefined) {
    updates.source_link = opts.sourceLink === "" ? null : opts.sourceLink;
  }
  if (opts.mode !== undefined) {
    const validModes = ["shadowing", "copilot", "autonomy", "none"];
    if (!validModes.includes(opts.mode)) {
      jsonError(`Invalid mode: ${opts.mode}`);
    }
    updates.symbiosis_mode =
      opts.mode === "none" ? null : (opts.mode as SymbiosisMode);
  }

  return updates;
}

export const bridgeCommand = new Command("bridge").description(
  "Machine-readable JSON protocol for AI integration",
);

// ── zam bridge check-due ──────────────────────────────────────────────────

bridgeCommand
  .command("check-due")
  .description("Check due cards for a user (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--domain <domain>", "Filter by knowledge domain")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const dueCards = await getDueCards(db, userId, undefined, opts.domain);
      const domains = [
        ...new Set(dueCards.map((c) => c.domain).filter(Boolean)),
      ].sort();

      jsonOut({
        userId,
        domain: opts.domain ?? null,
        dueCount: dueCards.length,
        domains,
        cards: dueCards.map((c) => ({
          cardId: c.id,
          tokenId: c.token_id,
          slug: c.slug,
          concept: c.concept,
          domain: c.domain,
          bloomLevel: c.bloom_level,
          state: c.state,
          dueAt: c.due_at,
        })),
      });
    });
  });

// ── zam bridge get-review ─────────────────────────────────────────────────

bridgeCommand
  .command("get-review")
  .description("Get next review card with prompt (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--no-resolve", "Skip resolving the token's source_link into context")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const queue = await buildReviewQueue(db, {
        userId,
        maxReviews: 1,
        maxNew: 1,
      });

      if (queue.items.length === 0) {
        jsonOut({
          userId,
          hasReview: false,
          card: null,
          prompt: null,
          resolvedContext: null,
          queueSize: 0,
        });
        return;
      }

      const item = queue.items[0];
      const isLlmEnabled = (await getSetting(db, "llm.enabled")) === "true";

      // Dynamically generate a fresh, living active-recall question if LLM is enabled
      let resolvedQuestion = item.question;
      if (isLlmEnabled) {
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

      // Resolve the source_link into ready-to-use context for the AI client.
      // Defensive: never let a bad/unreachable reference break the review payload.
      let resolvedContext = null;
      if (opts.resolve !== false) {
        try {
          resolvedContext = await resolveReviewContext(item.sourceLink);
        } catch {
          resolvedContext = null;
        }
      }

      // Get full queue size for context
      const fullQueue = await buildReviewQueue(db, { userId });

      jsonOut({
        userId,
        hasReview: true,
        card: item,
        prompt,
        resolvedContext,
        queueSize: fullQueue.items.length,
      });
    });
  });

// ── zam bridge submit ─────────────────────────────────────────────────────

bridgeCommand
  .command("submit")
  .description("Submit a rating for a card (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--card-id <id>", "Card ID")
  .requiredOption("--rating <n>", "Rating (1-4)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const rating = Number(opts.rating) as Rating;
      if (rating < 1 || rating > 4) {
        jsonError("Rating must be between 1 and 4");
      }

      const result = await executeReviewAction(db, {
        action: "rate",
        cardId: opts.cardId,
        userId,
        rating,
      });

      jsonOut({
        success: true,
        rating,
        evaluation: result.evaluation,
        blocked: result.blocked ?? null,
      });
    });
  });

// ── zam bridge review-action ───────────────────────────────────────────────

bridgeCommand
  .command("review-action")
  .description("Apply a review action (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--card-id <id>", "Card ID")
  .requiredOption(
    "--action <action>",
    "Action: rate | skip | edit-token | deprecate-token | delete-token | delete-card | stop",
  )
  .option("--rating <n>", "Rating (1-4) for action=rate")
  .option("--concept <concept>", "Updated concept text for action=edit-token")
  .option("--domain <domain>", "Updated domain for action=edit-token")
  .option("--bloom <level>", "Updated Bloom level for action=edit-token")
  .option("--context <context>", "Updated context for action=edit-token")
  .option("--mode <mode>", "Updated symbiosis mode for action=edit-token")
  .option("--source-link <link>", "Updated source link for action=edit-token")
  .option("--confirm", "Confirm destructive delete actions")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const action = opts.action as ReviewActionType;
      const validActions: ReviewActionType[] = [
        "rate",
        "skip",
        "edit-token",
        "deprecate-token",
        "delete-token",
        "delete-card",
        "stop",
      ];
      if (!validActions.includes(action)) {
        jsonError(`Unsupported action: ${opts.action}`);
      }

      const target = await getReviewTarget(db, opts.cardId, userId);
      if (
        (action === "delete-token" || action === "delete-card") &&
        !opts.confirm
      ) {
        if (action === "delete-token") {
          jsonOut({
            success: true,
            action,
            preview: true,
            requiresConfirmation: true,
            token: { slug: target.slug, tokenId: target.token_id },
            impact: await getTokenDeleteImpact(db, target.slug),
          });
          return;
        }

        jsonOut({
          success: true,
          action,
          preview: true,
          requiresConfirmation: true,
          token: { slug: target.slug, tokenId: target.token_id },
          impact: await getCardDeletionImpact(db, target.token_id, userId),
        });
        return;
      }

      const rating =
        opts.rating !== undefined ? (Number(opts.rating) as Rating) : undefined;
      if (action === "rate" && (rating == null || rating < 1 || rating > 4)) {
        jsonError("Rating must be between 1 and 4 for action=rate");
      }

      const result = await executeReviewAction(db, {
        action,
        cardId: opts.cardId,
        userId,
        rating,
        tokenUpdates:
          action === "edit-token" ? parseTokenUpdates(opts) : undefined,
      });

      jsonOut({
        success: true,
        action,
        token: {
          slug: result.token.slug,
          tokenId: result.token.id,
        },
        rating: rating ?? null,
        evaluation: result.evaluation ?? null,
        blocked: result.blocked ?? null,
        updatedToken: result.updatedToken ?? null,
        deletedToken: result.deletedToken ?? null,
        deletedCard: result.deletedCard ?? null,
        skipped: result.skipped ?? false,
        stopped: result.stopped ?? false,
      });
    });
  });

// ── zam bridge get-skill ──────────────────────────────────────────────────

bridgeCommand
  .command("get-skill")
  .description("Get an agent skill by slug (JSON)")
  .requiredOption("--slug <slug>", "Skill slug")
  .action(async (opts) => {
    await withDb(async (db) => {
      const skill = await getAgentSkill(db, opts.slug);
      if (!skill) {
        jsonError(`Skill not found: ${opts.slug}`);
      }

      jsonOut({
        slug: skill?.slug,
        description: skill?.description,
        steps: skill?.steps,
        tokenSlugs: skill?.token_slugs,
        source: skill?.source,
      });
    });
  });

// ── zam bridge start-session / end-session ────────────────────────────────

bridgeCommand
  .command("start-session")
  .description("Start a ZAM learning session (JSON)")
  .requiredOption("--task <task>", "Session task description")
  .option(
    "--context <context>",
    "Execution context: shell | ui | reallife",
    "shell",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    const context = opts.context as "shell" | "ui" | "reallife";
    if (!["shell", "ui", "reallife"].includes(context)) {
      jsonError("context must be shell, ui, or reallife");
    }

    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const session = await startSession(db, {
        user_id: userId,
        task: opts.task,
        execution_context: context,
      });
      const observerPolicyHint =
        context === "ui" && !(await isObserverPolicyConfigured(db))
          ? OBSERVER_POLICY_UNSET_HINT
          : undefined;
      jsonOut({
        id: session.id,
        userId: session.user_id,
        task: session.task,
        executionContext: session.execution_context,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        ...(observerPolicyHint ? { observerPolicyHint } : {}),
      });
    });
  });

bridgeCommand
  .command("end-session")
  .description("Complete an active ZAM learning session (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      const session = await endSession(db, opts.session);
      jsonOut({
        id: session.id,
        userId: session.user_id,
        task: session.task,
        executionContext: session.execution_context,
        startedAt: session.started_at,
        completedAt: session.completed_at,
      });
    });
  });

// ── zam bridge get-monitor ────────────────────────────────────────────────

bridgeCommand
  .command("get-monitor")
  .description("Read monitor log for a session (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action((opts) => {
    if (!monitorLogExists(opts.session)) {
      jsonOut({
        sessionId: opts.session,
        exists: false,
        commands: [],
        timeSpan: null,
      });
      return;
    }

    const events = readMonitorLog(opts.session);
    const commands = pairCommands(events);

    let timeSpan: { start: string; end: string; durationMs: number } | null =
      null;
    if (commands.length > 0) {
      const first = commands[0];
      const last = commands[commands.length - 1];
      const endTs = last.endedAt ?? last.startedAt;
      timeSpan = {
        start: first.startedAt,
        end: endTs,
        durationMs:
          new Date(endTs).getTime() - new Date(first.startedAt).getTime(),
      };
    }

    jsonOut({
      sessionId: opts.session,
      exists: true,
      commands: commands.map((c) => ({
        seq: c.seq,
        command: c.command,
        cwd: c.cwd,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        durationMs: c.durationMs,
        exitCode: c.exitCode,
      })),
      timeSpan,
    });
  });

// ── zam bridge analyze-monitor ───────────────────────────────────────────

bridgeCommand
  .command("analyze-monitor")
  .description("Analyze monitor log with token patterns from stdin (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action(async (opts) => {
    try {
      if (!monitorLogExists(opts.session)) {
        jsonOut({
          sessionId: opts.session,
          ratings: [],
          unmatchedCommands: [],
          timeSpan: null,
        });
        return;
      }

      // Read token patterns from stdin
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      const raw = Buffer.concat(chunks).toString("utf-8").trim();

      if (!raw) {
        jsonError("No input received on stdin. Pipe JSON with token patterns.");
      }

      let data: { patterns: TokenPattern[] };
      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      if (!Array.isArray(data?.patterns)) {
        jsonError("JSON must include 'patterns' array");
      }

      const events = readMonitorLog(opts.session);
      const commands = pairCommands(events);
      const result = analyzeObservation(commands, data?.patterns);

      jsonOut({
        sessionId: opts.session,
        ...result,
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge add-token ──────────────────────────────────────────────────

bridgeCommand
  .command("add-token")
  .description("Create a token + card from JSON stdin")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    let db: Database | undefined;
    try {
      // Read JSON from stdin
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      const raw = Buffer.concat(chunks).toString("utf-8").trim();

      if (!raw) {
        jsonError("No input received on stdin. Pipe JSON with token data.");
      }

      let data: {
        slug: string;
        concept: string;
        domain?: string;
        bloom_level?: number;
        context?: string;
        symbiosis_mode?: string | null;
        source_link?: string | null;
        question?: string | null;
      };

      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      if (!data?.slug || !data?.concept) {
        jsonError("JSON must include 'slug' and 'concept' fields");
      }

      db = await openDatabase();
      const userId = await resolveUser(opts, db, { json: true });

      const token = await createToken(db, {
        slug: data?.slug,
        concept: data?.concept,
        domain: data?.domain,
        bloom_level: (data?.bloom_level ?? 1) as BloomLevel,
        context: data?.context,
        symbiosis_mode: data?.symbiosis_mode as
          | "shadowing"
          | "copilot"
          | "autonomy"
          | null
          | undefined,
        source_link: data?.source_link ?? null,
        question: data?.question ?? null,
      });

      const card = await ensureCard(db, token.id, userId);

      jsonOut({
        success: true,
        token,
        card: {
          id: card.id,
          tokenId: card.token_id,
          userId: card.user_id,
          state: card.state,
          dueAt: card.due_at,
          blocked: card.blocked,
        },
      });

      await db.close();
    } catch (err) {
      await db?.close();
      // If it's already a JSON error exit, let it propagate
      if ((err as Error).message) {
        jsonError((err as Error).message);
      }
    }
  });

// ── zam bridge discover-skills ──────────────────────────────────────────────

bridgeCommand
  .command("discover-skills")
  .description(
    "Analyze monitor logs across sessions to discover recurring patterns",
  )
  .option(
    "--min-sessions <n>",
    "Minimum sessions a pattern must appear in (default: 2)",
    "2",
  )
  .option(
    "--limit <n>",
    "Max number of sessions to analyze (default: 20)",
    "20",
  )
  .action(async (opts) => {
    try {
      const monitorDir = join(homedir(), ".zam", "monitor");
      let files: string[];
      try {
        files = readdirSync(monitorDir).filter((f) => f.endsWith(".jsonl"));
      } catch {
        jsonOut({ proposals: [], message: "No monitor logs found." });
        return;
      }

      if (files.length === 0) {
        jsonOut({ proposals: [], message: "No monitor logs found." });
        return;
      }

      // Take the most recent N sessions by file modification time
      const limit = Number(opts.limit);
      const sorted = files
        .map((f) => ({ name: f, path: join(monitorDir, f) }))
        .sort((a, b) => b.name.localeCompare(a.name)) // ULID session IDs sort chronologically
        .slice(0, limit);

      // Load and parse each session's commands
      const sessionCommands = new Map<
        string,
        ReturnType<typeof pairCommands>
      >();
      for (const file of sorted) {
        const sessionId = file.name.replace(".jsonl", "");
        const events = readMonitorLog(sessionId);
        const commands = pairCommands(events);
        if (commands.length > 0) {
          sessionCommands.set(sessionId, commands);
        }
      }

      if (sessionCommands.size === 0) {
        jsonOut({ proposals: [], message: "No command data in monitor logs." });
        return;
      }

      // Get existing skills to exclude
      let existingSkillSlugs: string[] = [];
      let db: Database | undefined;
      try {
        db = await openDatabase();
        existingSkillSlugs = (await listAgentSkills(db)).map((s) => s.slug);
      } catch {
        // DB not available — proceed without exclusion
      } finally {
        await db?.close();
      }

      const proposals = discoverSkills(sessionCommands, {
        minSessions: Number(opts.minSessions),
        existingSkillSlugs,
      });

      jsonOut({
        sessionsAnalyzed: sessionCommands.size,
        proposals,
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge observe-ui-watch / get-observations ─────────────────────────

bridgeCommand
  .command("observe-ui-watch")
  .description(
    "Poll live UI observer watch reports for a ZAM learning session (JSON)",
  )
  .requiredOption(
    "--session <id>",
    "ZAM session ID (also the observer log key)",
  )
  .option("--after <n>", "Only return observations after this sequence")
  .option("--limit <n>", "Maximum observations to return", "100")
  .action(async (opts) => {
    await withDb(async (db) => {
      const session = (await db
        .prepare("SELECT id, execution_context FROM sessions WHERE id = ?")
        .get(opts.session)) as
        | { id: string; execution_context: string }
        | undefined;
      if (!session) {
        jsonError(`Session not found: ${opts.session}`);
      }

      const after =
        opts.after === undefined
          ? undefined
          : parseNonNegativeIntegerOption("after", opts.after);
      const limit = parseNonNegativeIntegerOption("limit", opts.limit);
      const observations = readUiObservationLog(opts.session)
        .filter((report) => after === undefined || report.sequence > after)
        .slice(0, limit);
      const last = observations[observations.length - 1];

      jsonOut({
        sessionId: opts.session,
        executionContext: session.execution_context,
        observationSource: "ui",
        logExists: uiObservationLogExists(opts.session),
        after: after ?? null,
        count: observations.length,
        nextSequence: last?.sequence ?? after ?? null,
        observations,
      });
    });
  });

bridgeCommand
  .command("get-observations")
  .description("Read UI observer reports for a session (JSON)")
  .requiredOption("--session <id>", "Observer session ID")
  .option("--after <n>", "Only return observations after this sequence")
  .option("--limit <n>", "Maximum observations to return", "100")
  .action((opts) => {
    try {
      const after =
        opts.after === undefined
          ? undefined
          : parseNonNegativeIntegerOption("after", opts.after);
      const limit = parseNonNegativeIntegerOption("limit", opts.limit);
      const observations = readUiObservationLog(opts.session)
        .filter((report) => after === undefined || report.sequence > after)
        .slice(0, limit);
      const last = observations[observations.length - 1];

      jsonOut({
        sessionId: opts.session,
        after: after ?? null,
        count: observations.length,
        nextSequence: last?.sequence ?? after ?? null,
        observations,
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

bridgeCommand
  .command("observe-ui-snapshot")
  .description(
    "Analyze a captured UI snapshot or video recording with the configured vision LLM (JSON)",
  )
  .requiredOption("--session <id>", "Observer session ID")
  .requiredOption("--sequence <n>", "Monotonic observation sequence number")
  .requiredOption("--image <path>", "PNG snapshot or video recording path")
  .requiredOption("--observed-from <iso>", "Observation window start time")
  .requiredOption("--observed-to <iso>", "Observation window end time")
  .requiredOption("--process-name <name>", "Observed application process name")
  .option("--process-id <n>", "Observed application process ID")
  .option("--window-title <title>", "Observed window title")
  .option("--evidence-ref <ref>", "Evidence reference to put in the report")
  .option("--model <model>", "Override configured LLM model for this request")
  .option("--max-tokens <n>", "Model response token budget")
  .option("--timeout <ms>", "Hard request timeout in milliseconds")
  .option("--redacted", "Mark the snapshot evidence as redacted")
  .option("--write-log", "Append the generated report to the session JSONL")
  .action(async (opts) => {
    const sequence = parseNonNegativeIntegerOption("sequence", opts.sequence);
    const processId =
      opts.processId === undefined
        ? undefined
        : parseNonNegativeIntegerOption("process-id", opts.processId);
    const maxTokens =
      opts.maxTokens === undefined
        ? undefined
        : parseNonNegativeIntegerOption("max-tokens", opts.maxTokens);
    const hardTimeoutMs =
      opts.timeout === undefined
        ? undefined
        : parseNonNegativeIntegerOption("timeout", opts.timeout);

    await withDb(async (db) => {
      const report = await observeUiSnapshotViaLLM(db, {
        sessionId: opts.session,
        sequence,
        observedFrom: opts.observedFrom,
        observedTo: opts.observedTo,
        imagePath: opts.image,
        application: {
          processName: opts.processName,
          processId,
          windowTitle: opts.windowTitle,
        },
        evidenceRef: opts.evidenceRef,
        redacted: opts.redacted === true,
        model: opts.model,
        maxTokens,
        hardTimeoutMs,
      });
      if (opts.writeLog === true) {
        appendUiObservationReport(report);
      }
      jsonOut(report);
    });
  });

// ── zam bridge capture-ui ──────────────────────────────────────────────────

/**
 * Resolve the PowerShell executable, preferring PowerShell 7+ (`pwsh`) over
 * the legacy Windows PowerShell 5.1 (`powershell`). pwsh 7 still ships the
 * Windows Desktop assemblies the screen-capture script needs, so it is the
 * default; `powershell` remains a fallback for machines without pwsh.
 */
function resolveWindowsPowerShell(): string {
  try {
    execFileSync("where.exe", ["pwsh.exe"], { stdio: "ignore" });
    return "pwsh";
  } catch {
    return "powershell";
  }
}

type CaptureTarget = {
  requestedHwnd: string | null;
  requestedProcessName: string | null;
  matchedBy: string;
  hwnd: number | null;
  processId: number | null;
  processName: string | null;
  windowTitle: string | null;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null;
};

type CaptureResult = {
  method: string;
  target: CaptureTarget | null;
};

function captureScreenshot(
  outputPath: string,
  hwnd?: string,
  processName?: string,
): CaptureResult {
  const platform = process.platform;
  if (hwnd && !/^(0x)?[0-9a-fA-F]+$/.test(hwnd)) {
    throw new Error(`Invalid HWND format: ${hwnd}`);
  }
  if (processName && !/^[a-zA-Z0-9\-_.]+$/.test(processName)) {
    throw new Error(`Invalid process name format: ${processName}`);
  }

  if (platform === "win32") {
    const stdout = execFileSync(
      resolveWindowsPowerShell(),
      [
        "-NoProfile",
        "-Command",
        `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Runtime.InteropServices;

public class Win32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    public static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWnd, EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError=true)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError=true)]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
'@
Add-Type -TypeDefinition $code

try {
    # DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = -4. Without this, Windows
    # can return logical window bounds while PrintWindow renders physical
    # pixels, causing high-DPI captures to crop the right/bottom edge.
    [Win32]::SetProcessDpiAwarenessContext([IntPtr](-4)) | Out-Null
} catch {
    try { [Win32]::SetProcessDPIAware() | Out-Null } catch {}
}

function Get-WindowTitle([IntPtr]$hWnd) {
    $length = [Win32]::GetWindowTextLength($hWnd)
    $capacity = [Math]::Max(1, $length + 1)
    $builder = New-Object System.Text.StringBuilder $capacity
    [Win32]::GetWindowText($hWnd, $builder, $builder.Capacity) | Out-Null
    $builder.ToString()
}

function Get-WindowProcess([IntPtr]$hWnd) {
    [uint32]$processId = 0
    [Win32]::GetWindowThreadProcessId($hWnd, [ref]$processId) | Out-Null
    if ($processId -eq 0) { return $null }
    Get-Process -Id $processId -ErrorAction SilentlyContinue
}

function Get-VisibleTopLevelWindows {
    $script:windowCandidates = New-Object System.Collections.ArrayList
    $callback = [Win32+EnumWindowsProc]{
        param([IntPtr]$candidateHwnd, [IntPtr]$lParam)
        if ([Win32]::IsWindowVisible($candidateHwnd)) {
            $candidateRect = New-Object Win32+RECT
            if ([Win32]::GetWindowRect($candidateHwnd, [ref]$candidateRect)) {
                $candidateWidth = $candidateRect.Right - $candidateRect.Left
                $candidateHeight = $candidateRect.Bottom - $candidateRect.Top
                if ($candidateWidth -gt 0 -and $candidateHeight -gt 0) {
                    [void]$script:windowCandidates.Add($candidateHwnd)
                }
            }
        }
        return $true
    }
    [Win32]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
    $windows = $script:windowCandidates
    Remove-Variable -Name windowCandidates -Scope Script -ErrorAction SilentlyContinue
    $windows
}

function Find-TopLevelWindowByProcessName([string]$name) {
    foreach ($candidateHwnd in Get-VisibleTopLevelWindows) {
        $candidateProcess = Get-WindowProcess $candidateHwnd
        if ($candidateProcess -and $candidateProcess.ProcessName -ieq $name) {
            return [pscustomobject]@{
                Hwnd = $candidateHwnd
                MatchedBy = "process-top-level-window"
            }
        }

        $script:desiredChildProcessName = $name
        $script:foundChildProcessWindow = $false
        $childCallback = [Win32+EnumWindowsProc]{
            param([IntPtr]$childHwnd, [IntPtr]$lParam)
            $childProcess = Get-WindowProcess $childHwnd
            if ($childProcess -and $childProcess.ProcessName -ieq $script:desiredChildProcessName) {
                $script:foundChildProcessWindow = $true
                return $false
            }
            return $true
        }
        [Win32]::EnumChildWindows($candidateHwnd, $childCallback, [IntPtr]::Zero) | Out-Null
        $foundChild = $script:foundChildProcessWindow
        Remove-Variable -Name desiredChildProcessName -Scope Script -ErrorAction SilentlyContinue
        Remove-Variable -Name foundChildProcessWindow -Scope Script -ErrorAction SilentlyContinue

        if ($foundChild) {
            return [pscustomobject]@{
                Hwnd = $candidateHwnd
                MatchedBy = "process-child-window"
            }
        }
    }

    return $null
}

function New-CaptureTarget([IntPtr]$hWnd, [string]$matchedBy) {
    $target = [ordered]@{
        requestedHwnd = if ($targetHwnd -ne '') { $targetHwnd } else { $null }
        requestedProcessName = if ($processName -ne '') { $processName } else { $null }
        matchedBy = $matchedBy
        hwnd = $null
        processId = $null
        processName = $null
        windowTitle = $null
        bounds = $null
    }

    if ($hWnd -ne [IntPtr]::Zero) {
        $target.hwnd = $hWnd.ToInt64()
        $target.windowTitle = Get-WindowTitle $hWnd

        $windowProcess = Get-WindowProcess $hWnd
        if ($windowProcess) {
            $target.processId = $windowProcess.Id
            $target.processName = $windowProcess.ProcessName
        }

        $targetRect = New-Object Win32+RECT
        if ([Win32]::GetWindowRect($hWnd, [ref]$targetRect)) {
            $target.bounds = [ordered]@{
                left = $targetRect.Left
                top = $targetRect.Top
                right = $targetRect.Right
                bottom = $targetRect.Bottom
                width = $targetRect.Right - $targetRect.Left
                height = $targetRect.Bottom - $targetRect.Top
            }
        }
    }

    $target
}

function Write-CaptureResult([string]$method, [IntPtr]$hWnd, [string]$matchedBy) {
    $result = [ordered]@{
        method = $method
        target = New-CaptureTarget $hWnd $matchedBy
    }
    Write-Output ("CAPTURE_RESULT:" + ($result | ConvertTo-Json -Compress -Depth 6))
}

$hwndVal = [IntPtr]::Zero
$matchedBy = "fullscreen-fallback"
$targetHwnd = '${hwnd || ""}'
$processName = '${processName || ""}'

if ($targetHwnd -ne '') {
    if ($targetHwnd.StartsWith("0x")) {
        $hwndVal = [IntPtr][Convert]::ToInt64($targetHwnd, 16)
    } else {
        $hwndVal = [IntPtr][Convert]::ToInt64($targetHwnd, 10)
    }
    $matchedBy = "hwnd"
} elseif ($processName -ne '') {
    $proc = Get-Process -Name $processName -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1
    if ($proc) {
        $hwndVal = $proc.MainWindowHandle
        $matchedBy = "process-main-window"
    } else {
        $proc = Get-Process -Name $processName -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($proc) {
            $hwndVal = $proc.MainWindowHandle
            $matchedBy = "process-zero-main-window"
        }
    }

    if ($hwndVal -eq [IntPtr]::Zero) {
        $windowMatch = Find-TopLevelWindowByProcessName $processName
        if ($windowMatch) {
            $hwndVal = $windowMatch.Hwnd
            $matchedBy = $windowMatch.MatchedBy
        }
    }
}

if ($hwndVal -ne [IntPtr]::Zero) {
    if ([Win32]::IsIconic($hwndVal)) {
        [Win32]::ShowWindow($hwndVal, 9) | Out-Null # SW_RESTORE = 9
        Start-Sleep -Milliseconds 250
    }

    $rect = New-Object Win32+RECT
    if ([Win32]::GetWindowRect($hwndVal, [ref]$rect)) {
        $width = $rect.Right - $rect.Left
        $height = $rect.Bottom - $rect.Top
        if ($width -gt 0 -and $height -gt 0) {
            $bitmap = New-Object System.Drawing.Bitmap($width, $height)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            # PrintWindow renders the target window directly, regardless of
            # z-order, so an occluded or background window is still captured
            # correctly. SetForegroundWindow from a background process is
            # blocked by Windows, so CopyFromScreen would grab whatever sits
            # on top. PW_RENDERFULLCONTENT (0x2) handles modern/UWP windows.
            $hdc = $graphics.GetHdc()
            $printed = [Win32]::PrintWindow($hwndVal, $hdc, 2)
            $graphics.ReleaseHdc($hdc)
            $method = "printwindow"

            # Black-frame guard: PrintWindow can return a near-black frame on
            # some hardware-accelerated / DirectComposition surfaces. Sample a
            # sparse grid; if it is essentially black, fall back to a foreground
            # CopyFromScreen grab so the capture self-heals on those drivers.
            $needFallback = -not $printed
            if (-not $needFallback) {
                $sum = 0.0
                $cnt = 0
                $stepX = [Math]::Max(1, [int]($width / 12))
                $stepY = [Math]::Max(1, [int]($height / 12))
                for ($sy = 0; $sy -lt $height; $sy += $stepY) {
                    for ($sx = 0; $sx -lt $width; $sx += $stepX) {
                        $px = $bitmap.GetPixel($sx, $sy)
                        $sum += ($px.R + $px.G + $px.B) / 3.0
                        $cnt++
                    }
                }
                if ($cnt -gt 0 -and ($sum / $cnt) -lt 6) { $needFallback = $true }
            }

            if ($needFallback) {
                [Win32]::SetForegroundWindow($hwndVal) | Out-Null
                Start-Sleep -Milliseconds 250
                $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
                $method = "copyfromscreen"
            }
            $bitmap.Save('${outputPath.replace(/\\/g, "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose()
            $bitmap.Dispose()
            Write-CaptureResult $method $hwndVal $matchedBy
            exit 0
        }
    }
}

# Fallback: full primary screen
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bitmap.Save('${outputPath.replace(/\\/g, "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-CaptureResult "fullscreen" $hwndVal $matchedBy
        `.trim(),
      ],
      { stdio: "pipe", encoding: "utf8" },
    );
    const resultMatch = /CAPTURE_RESULT:(\{.*\})/.exec(stdout ?? "");
    if (resultMatch) {
      const parsed = JSON.parse(resultMatch[1]) as CaptureResult;
      return parsed;
    }
    const methodMatch = /CAPTURE_METHOD:(\w+)/.exec(stdout ?? "");
    return {
      method: methodMatch ? methodMatch[1] : "unknown",
      target: null,
    };
  } else if (platform === "darwin") {
    if (hwnd) {
      const parsedHwnd = hwnd.startsWith("0x")
        ? parseInt(hwnd, 16)
        : parseInt(hwnd, 10);
      execFileSync("screencapture", ["-l", String(parsedHwnd), outputPath], {
        stdio: "pipe",
      });
      return { method: "screencapture-window", target: null };
    } else if (processName) {
      try {
        const windowId = execFileSync(
          "osascript",
          [
            "-e",
            `tell application "System Events" to get id of window 1 of process "${processName}"`,
          ],
          { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
        ).trim();
        if (windowId && /^\d+$/.test(windowId)) {
          execFileSync("screencapture", ["-l", windowId, outputPath], {
            stdio: "pipe",
          });
          return { method: "screencapture-window", target: null };
        }
      } catch {
        // Fallback if AppleScript fails
      }
      execFileSync("screencapture", ["-x", outputPath], { stdio: "pipe" });
      return { method: "screencapture-full", target: null };
    } else {
      execFileSync("screencapture", ["-x", outputPath], { stdio: "pipe" });
      return { method: "screencapture-full", target: null };
    }
  } else {
    throw new Error(
      `Screen capture not supported on platform: ${platform}. Use zam-observer or provide --image.`,
    );
  }
}

bridgeCommand
  .command("capture-ui")
  .description("Capture a screenshot for agent-side vision analysis (JSON)")
  .option("--session <id>", "ZAM session ID (for metadata)")
  .option("--output <path>", "PNG output path (defaults to temp file)")
  .option("--image <path>", "Skip capture; return an existing image instead")
  .option("--hwnd <hwnd>", "Window handle (decimal or hex) to capture")
  .option("--process-name <name>", "Process name to capture")
  .action(async (opts) => {
    await withDb(async (db) => {
      const policy = await resolveObserverPolicy(db);
      const permission = {
        scope: policy.scope,
        consent: policy.consent,
        retention: policy.retention,
      };
      const isProvided = Boolean(opts.image);

      // A caller-provided --image is "analyze this file", not a capture: ZAM
      // is not holding the camera, so scope/target policy does not apply.
      // Live captures are gated below.
      if (!isProvided) {
        const pre = decidePreCapture(policy, {
          hasExplicitTarget: Boolean(opts.hwnd || opts.processName),
          requestedProcessName: opts.processName ?? null,
        });
        if (!pre.allowed) {
          jsonOut({
            sessionId: opts.session ?? null,
            granted: false,
            denied: true,
            denialReason: pre.denialReason,
            reason: pre.reason,
            capturedAt: new Date().toISOString(),
            platform: process.platform,
            permission: { ...permission, granted: false },
          });
          return;
        }
      }

      const outputPath =
        opts.image ??
        opts.output ??
        join(tmpdir(), `zam-capture-${randomBytes(4).toString("hex")}.png`);

      const captureResult = isProvided
        ? ({ method: "provided", target: null } satisfies CaptureResult)
        : captureScreenshot(outputPath, opts.hwnd, opts.processName);

      // Post-resolution gate: the real process/title are only known now, so
      // the sensitive/denylist check runs against the window actually
      // captured. If it fails, discard the pixels before they leave.
      if (!isProvided) {
        const post = decidePostCapture(policy, {
          method: captureResult.method,
          processName: captureResult.target?.processName ?? null,
          windowTitle: captureResult.target?.windowTitle ?? null,
        });
        if (!post.allowed) {
          if (!opts.output) {
            try {
              rmSync(outputPath, { force: true });
            } catch {
              // best-effort discard
            }
          }
          jsonOut({
            sessionId: opts.session ?? null,
            granted: false,
            denied: true,
            denialReason: post.denialReason,
            reason: post.reason,
            capturedAt: new Date().toISOString(),
            platform: process.platform,
            permission: { ...permission, granted: false },
          });
          return;
        }
      }

      const imageBytes = readFileSync(outputPath);
      const base64 = imageBytes.toString("base64");

      jsonOut({
        sessionId: opts.session ?? null,
        granted: true,
        imagePath: outputPath,
        base64,
        mimeType: "image/png",
        captureMethod: captureResult.method,
        captureTarget: captureResult.target,
        capturedAt: new Date().toISOString(),
        platform: process.platform,
        permission: { ...permission, granted: true },
      });
    });
  });

// ── zam bridge start-recording ──────────────────────────────────────────────

bridgeCommand
  .command("start-recording")
  .description("Start screen recording in the background (JSON)")
  .requiredOption("--session <id>", "ZAM session ID")
  .option("--output <path>", "Video output path")
  .action(async (opts) => {
    const platform = process.platform;
    if (platform !== "darwin" && platform !== "win32") {
      jsonOut({
        sessionId: opts.session,
        started: false,
        error:
          "Screen recording is only supported on macOS (darwin) and Windows (win32)",
      });
      return;
    }

    const sessionId = opts.session;
    const statePath = join(tmpdir(), `zam-recording-${sessionId}.json`);
    const defaultExt = platform === "win32" ? ".mkv" : ".mov";
    const outputPath =
      opts.output ?? join(tmpdir(), `zam-recording-${sessionId}${defaultExt}`);

    const { existsSync, writeFileSync, openSync, closeSync } = await import(
      "node:fs"
    );
    if (existsSync(statePath)) {
      jsonOut({
        sessionId,
        started: false,
        error: `Recording is already active for session ${sessionId}`,
      });
      return;
    }

    const logPath = join(tmpdir(), `zam-recording-${sessionId}.log`);
    let logFd: number;
    try {
      logFd = openSync(logPath, "w");
    } catch (e) {
      jsonOut({
        sessionId,
        started: false,
        error: `Failed to open log file at ${logPath}: ${(e as Error).message}`,
      });
      return;
    }

    const { spawn } = await import("node:child_process");
    const ffmpegArgs =
      platform === "darwin"
        ? [
            "-y",
            "-f",
            "avfoundation",
            "-r",
            "5",
            "-i",
            "0",
            "-pix_fmt",
            "yuv420p",
            outputPath,
          ]
        : [
            "-y",
            "-f",
            "gdigrab",
            "-framerate",
            "5",
            "-i",
            "desktop",
            "-pix_fmt",
            "yuv420p",
            outputPath,
          ];

    const child = spawn("ffmpeg", ffmpegArgs, {
      detached: true,
      stdio: ["pipe", logFd, logFd],
    });

    try {
      closeSync(logFd);
    } catch {}

    child.unref();

    if (child.pid) {
      writeFileSync(
        statePath,
        JSON.stringify({
          pid: child.pid,
          outputPath,
          startedAt: new Date().toISOString(),
        }),
        "utf8",
      );

      jsonOut({
        sessionId,
        started: true,
        outputPath,
        pid: child.pid,
      });
    } else {
      jsonOut({
        sessionId,
        started: false,
        error: "Failed to spawn ffmpeg process",
      });
    }
  });

// ── zam bridge stop-recording ───────────────────────────────────────────────

bridgeCommand
  .command("stop-recording")
  .description(
    "Stop active screen recording and apply idle-frame compression (JSON)",
  )
  .requiredOption("--session <id>", "ZAM session ID")
  .action(async (opts) => {
    const platform = process.platform;
    if (platform !== "darwin" && platform !== "win32") {
      jsonOut({
        sessionId: opts.session,
        stopped: false,
        error:
          "Screen recording is only supported on macOS (darwin) and Windows (win32)",
      });
      return;
    }

    const sessionId = opts.session;
    const statePath = join(tmpdir(), `zam-recording-${sessionId}.json`);
    const { existsSync, readFileSync, rmSync } = await import("node:fs");

    if (!existsSync(statePath)) {
      jsonOut({
        sessionId,
        stopped: false,
        error: `No active recording found for session ${sessionId}`,
      });
      return;
    }

    const state = JSON.parse(readFileSync(statePath, "utf8"));
    const { pid, outputPath } = state;

    try {
      process.kill(pid, "SIGINT");
    } catch (_e) {
      // Process might already be dead
    }

    const isProcessRunning = (pId: number) => {
      try {
        process.kill(pId, 0);
        return true;
      } catch (_e) {
        return false;
      }
    };

    let attempts = 0;
    while (isProcessRunning(pid) && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      attempts++;
    }

    if (isProcessRunning(pid)) {
      try {
        process.kill(pid, "SIGKILL");
      } catch (_e) {}
    }

    try {
      rmSync(statePath, { force: true });
    } catch {}

    if (!existsSync(outputPath)) {
      jsonOut({
        sessionId,
        stopped: false,
        error: `Recording file not found at ${outputPath}`,
      });
      return;
    }

    const decimatedPath = outputPath.replace(/\.[^.]+$/, "-decimated.mp4");
    const { execSync } = await import("node:child_process");

    try {
      execSync(
        `ffmpeg -y -i "${outputPath}" -vf "mpdecimate,setpts=N/FRAME_RATE/TB" -an -pix_fmt yuv420p "${decimatedPath}"`,
        { stdio: "ignore" },
      );
    } catch (ffmpegErr) {
      jsonOut({
        sessionId,
        stopped: true,
        videoPath: outputPath,
        decimated: false,
        warning: `mpdecimate post-processing failed: ${(ffmpegErr as Error).message}`,
      });
      return;
    }

    try {
      rmSync(outputPath, { force: true });
    } catch {}

    jsonOut({
      sessionId,
      stopped: true,
      videoPath: decimatedPath,
      decimated: true,
    });
  });

// ── zam bridge get-observer-policy ─────────────────────────────────────────

bridgeCommand
  .command("get-observer-policy")
  .description(
    "Report the resolved observer policy so an agent can check before capturing (JSON)",
  )
  .action(async () => {
    await withDb(async (db) => {
      const policy = await resolveObserverPolicy(db);
      jsonOut({
        scope: policy.scope,
        consent: policy.consent,
        retention: policy.retention,
        allowlist: policy.allowlist,
        denylist: policy.denylist,
        redactWindowTitles: policy.redactWindowTitles,
        audioOptIn: policy.audioOptIn,
        builtInSensitiveAlwaysRefused: true,
        builtInSensitiveMatchers: [...BUILT_IN_SENSITIVE_MATCHERS],
      });
    });
  });

// ── zam bridge sync-observer-policy ────────────────────────────────────────

bridgeCommand
  .command("sync-observer-policy")
  .description(
    "Write the resolved observer policy to the native sidecar file (JSON)",
  )
  .action(async () => {
    await withDb(async (db) => {
      const { path, policy } = await syncObserverSidecarPolicy(db);
      jsonOut({ synced: true, path, policy });
    });
  });

// ── zam bridge check-llm ──────────────────────────────────────────────────

bridgeCommand
  .command("check-llm")
  .description("Check if LLM is enabled and online (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const { enabled, url, model, apiKey } = await getLlmConfig(db);
      let online = false;
      let availableModels: string[] = [];
      let modelAvailable = false;
      if (enabled) {
        online = await isLlmOnline(url);
        if (online) {
          availableModels = await getAvailableModels(url, apiKey);
          // Empty list = server doesn't expose /models; don't claim it's wrong.
          modelAvailable =
            availableModels.length === 0 ||
            availableModels.some(
              (m) => m.toLowerCase() === model.toLowerCase(),
            );
        }
      }
      jsonOut({
        enabled,
        online,
        url,
        model,
        modelAvailable,
        availableModels,
      });
    });
  });

// ── zam bridge check-vision ────────────────────────────────────────────────

bridgeCommand
  .command("check-vision")
  .description(
    "Check if UI observer vision analysis is enabled and ready (JSON)",
  )
  .action(async () => {
    await withDb(async (db) => {
      jsonOut(await checkVisionReadiness(db));
    });
  });

// ── zam bridge ensure-llm ─────────────────────────────────────────────────

bridgeCommand
  .command("ensure-llm")
  .description(
    "Start the local LLM server if needed and report readiness (JSON)",
  )
  .option(
    "--timeout <ms>",
    "Max time to wait for the server to come online",
    "25000",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const result = await ensureLlmReadyHeadless(db, {
        timeoutMs: Number(opts.timeout),
      });
      jsonOut(result);
    });
  });

// ── zam bridge translate-question ──────────────────────────────────────────

bridgeCommand
  .command("translate-question")
  .description("Translate a question dynamically using the local LLM (JSON)")
  .requiredOption("--question <text>", "Question in English to translate")
  .action(async (opts) => {
    await withDb(async (db) => {
      const isEnabled = (await getSetting(db, "llm.enabled")) === "true";
      if (!isEnabled) {
        jsonOut({
          success: false,
          error: "LLM integration is disabled",
          translation: opts.question,
        });
        return;
      }
      try {
        const translation = await translateQuestionViaLLM(db, opts.question);
        jsonOut({ success: true, translation });
      } catch (err) {
        jsonOut({
          success: false,
          error: (err as Error).message,
          translation: opts.question,
        });
      }
    });
  });

// ── zam bridge evaluate-answer ────────────────────────────────────────────

bridgeCommand
  .command("evaluate-answer")
  .description(
    "Evaluate the learner's active-recall answer using the local LLM (JSON)",
  )
  .requiredOption("--slug <slug>", "Token slug")
  .requiredOption("--concept <concept>", "Target concept text")
  .requiredOption("--domain <domain>", "Token domain")
  .requiredOption("--bloom-level <level>", "Bloom taxonomy level")
  .requiredOption("--question <question>", "Question prompt presented")
  .requiredOption("--user-answer <answer>", "User's typed answer")
  .option("--context <context>", "Optional token context details")
  .option("--source-link <link>", "Optional source link")
  .action(async (opts) => {
    await withDb(async (db) => {
      const isEnabled = (await getSetting(db, "llm.enabled")) === "true";
      if (!isEnabled) {
        jsonOut({
          success: false,
          error: "LLM integration is disabled",
          evaluation: "",
        });
        return;
      }

      let resolvedContextContent = null;
      if (opts.sourceLink) {
        try {
          const resolved = await resolveReviewContext(opts.sourceLink);
          resolvedContextContent = resolved?.content ?? null;
        } catch {
          // ignore context resolution errors
        }
      }

      try {
        const evaluation = await evaluateAnswerViaLLM(db, {
          slug: opts.slug,
          concept: opts.concept,
          domain: opts.domain,
          bloomLevel: Number(opts.bloomLevel),
          context: opts.context,
          question: opts.question,
          userAnswer: opts.userAnswer,
          sourceLinkContent: resolvedContextContent,
        });
        jsonOut({ success: true, evaluation });
      } catch (err) {
        jsonOut({
          success: false,
          error: (err as Error).message,
          evaluation: "",
        });
      }
    });
  });

// ── zam bridge desktop-bootstrap / get-settings ───────────────────────────

bridgeCommand
  .command("desktop-bootstrap")
  .description("Initialize first-run desktop state (JSON)")
  .option("--user <id>", "Preferred user ID when none is configured")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await ensureDefaultUser(db, opts.user);
      const { enabled, url, model, locale } = await getLlmConfig(db);
      jsonOut({
        userId,
        locale,
        llm: { enabled, url, model },
      });
    });
  });

bridgeCommand
  .command("get-settings")
  .description("Get active ZAM settings (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const { enabled, url, model, locale } = await getLlmConfig(db);
      jsonOut({
        locale,
        llm: {
          enabled,
          url,
          model,
        },
      });
    });
  });

// ── zam bridge list-tokens (for graph pickers / entry points) ───────────────

bridgeCommand
  .command("list-tokens")
  .description(
    "List tokens (optionally enriched with user card state for viz) (JSON)",
  )
  .option(
    "--user <id>",
    "User ID (default: whoami) — when provided, includes personal card info",
  )
  .option("--domain <domain>", "Filter by domain")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = opts.user
        ? await resolveUser(opts, db, { json: true })
        : undefined;
      const tokens = await listTokens(
        db,
        opts.domain ? { domain: opts.domain } : undefined,
      );

      const cardMap = new Map<
        string,
        {
          token_id: string;
          state: string;
          reps: number;
          stability: number;
          difficulty: number;
          blocked: number;
          due_at: string;
          last_review_at: string | null;
        }
      >();
      if (userId && tokens.length > 0) {
        const ids = tokens.map((t) => t.id);
        const placeholders = ids.map(() => "?").join(",");
        const cards = (await db
          .prepare(
            `SELECT token_id, state, reps, stability, difficulty, blocked, due_at, last_review_at
             FROM cards WHERE token_id IN (${placeholders}) AND user_id = ?`,
          )
          .all(...ids, userId)) as Array<{
          token_id: string;
          state: string;
          reps: number;
          stability: number;
          difficulty: number;
          blocked: number;
          due_at: string;
          last_review_at: string | null;
        }>;
        for (const c of cards) cardMap.set(c.token_id, c);
      }

      const out = tokens.map((t) => {
        const c = cardMap.get(t.id);
        return {
          id: t.id,
          slug: t.slug,
          concept: t.concept,
          domain: t.domain,
          bloomLevel: t.bloom_level,
          card: c
            ? {
                state: c.state,
                reps: c.reps,
                stability: c.stability,
                difficulty: c.difficulty,
                blocked: c.blocked === 1,
                dueAt: c.due_at,
                lastReviewAt: c.last_review_at ?? null,
              }
            : null,
        };
      });

      jsonOut({ tokens: out });
    });
  });

// ── zam bridge get-neighborhood (core for 3D focus + direct prereqs/dependents) ─

bridgeCommand
  .command("get-neighborhood")
  .description(
    "Get direct prerequisite neighborhood around a token (for 3D graph viz) (JSON)",
  )
  .requiredOption("--focus <slug>", "Token slug to center the neighborhood on")
  .option(
    "--user <id>",
    "User ID (default: whoami) for personal card state in the result",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });

      const token = await getTokenBySlug(db, opts.focus);
      if (!token) {
        jsonError(`Token not found: ${opts.focus}`);
      }

      const nb = await getTokenNeighborhood(db, token!.id, userId);

      const mapToken = (nt: NeighborhoodToken) => ({
        id: nt.id,
        slug: nt.slug,
        concept: nt.concept,
        domain: nt.domain,
        bloomLevel: nt.bloom_level,
        card: nt.card
          ? {
              state: nt.card.state,
              reps: nt.card.reps,
              stability: nt.card.stability,
              difficulty: nt.card.difficulty,
              blocked: nt.card.blocked,
              dueAt: nt.card.due_at,
              lastReviewAt: nt.card.last_review_at,
            }
          : null,
      });

      jsonOut({
        focus: opts.focus,
        center: mapToken(nb.center),
        prerequisites: nb.prerequisites.map(mapToken),
        dependents: nb.dependents.map(mapToken),
      });
    });
  });

// ── zam bridge serve ──────────────────────────────────────────────────────

bridgeCommand
  .command("serve")
  .description("Start the persistent JSON-RPC stdin/stdout server")
  .option("--stdin", "Use stdin/stdout for communication")
  .action(async (_opts) => {
    isServeMode = true;

    // Diagnostic log. A windowed GUI swallows the daemon's stderr, so failures
    // that only happen when the bridge is spawned by the desktop app are
    // otherwise invisible. Logging the resolved environment makes a wrong
    // home directory (→ missing credentials → empty database) obvious.
    const {
      appendFileSync,
      existsSync: fileExists,
      mkdirSync: makeDir,
    } = await import("node:fs");
    const nodeOs = await import("node:os");
    const nodePath = await import("node:path");
    const logDir = nodePath.join(nodeOs.homedir(), ".zam");
    const logPath = nodePath.join(logDir, "desktop-bridge.log");
    const logDiag = (msg: string): void => {
      try {
        if (!fileExists(logDir)) makeDir(logDir, { recursive: true });
        appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
      } catch {
        // best-effort only — never let logging break the bridge
      }
    };
    logDiag(
      `serve start | homedir=${nodeOs.homedir()} | USERPROFILE=${
        process.env.USERPROFILE ?? ""
      } | HOME=${process.env.HOME ?? ""} | cwd=${process.cwd()}`,
    );

    // Configure exitOverride so commander doesn't process.exit on parsing errors
    bridgeCommand.exitOverride();
    for (const cmd of bridgeCommand.commands) {
      cmd.exitOverride();
    }

    // Prevent Commander from writing directly to stdout/stderr
    let outputBuffer = "";
    const outputOpts = {
      writeOut: (str: string) => {
        outputBuffer += str;
      },
      writeErr: (str: string) => {
        outputBuffer += str;
      },
    };
    bridgeCommand.configureOutput(outputOpts);
    for (const cmd of bridgeCommand.commands) {
      cmd.configureOutput(outputOpts);
    }

    const processRequest = async (line: string): Promise<string> => {
      outputBuffer = "";
      let requestId: string | number | null = null;
      try {
        const req = JSON.parse(line);
        requestId = req.id ?? null;
        const cmd = req.cmd;
        const args = req.args ?? [];

        if (!cmd) {
          return JSON.stringify({
            id: requestId,
            error: "Missing 'cmd' field",
          });
        }

        const originalLog = console.log;
        const originalError = console.error;
        console.log = (...logArgs) => {
          outputBuffer += `${logArgs
            .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
            .join(" ")}\n`;
        };
        console.error = (...logArgs) => {
          outputBuffer += `${logArgs
            .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
            .join(" ")}\n`;
        };

        try {
          await bridgeCommand.parseAsync(["node", "bridge", cmd, ...args]);
        } catch (err) {
          if (err instanceof Error && err.message.startsWith('{"error":')) {
            try {
              const parsed = JSON.parse(err.message);
              return JSON.stringify({ id: requestId, error: parsed.error });
            } catch {
              return JSON.stringify({ id: requestId, error: err.message });
            }
          }
          if ((err as { code?: string }).code?.startsWith("commander.")) {
            return JSON.stringify({
              id: requestId,
              error: outputBuffer.trim() || (err as Error).message,
            });
          }
          return JSON.stringify({
            id: requestId,
            error: (err as Error).message || String(err),
          });
        } finally {
          console.log = originalLog;
          console.error = originalError;
        }

        // Parse stdout accumulated output
        let result: unknown;
        const trimmed = outputBuffer.trim();
        try {
          result = JSON.parse(trimmed);
        } catch {
          result = trimmed;
        }

        return JSON.stringify({ id: requestId, result });
      } catch (err) {
        return JSON.stringify({
          id: requestId,
          error: `Invalid JSON request: ${(err as Error).message}`,
        });
      }
    };

    const readline = await import("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    // Process requests strictly one at a time. processRequest() relies on a
    // shared output buffer and temporarily swaps the global console methods, so
    // overlapping executions would corrupt each other's responses. Chaining on
    // a single promise serialises them regardless of how fast lines arrive.
    let pending: Promise<void> = Promise.resolve();
    rl.on("line", (line) => {
      if (!line.trim()) return;
      pending = pending.then(async () => {
        const response = await processRequest(line);
        process.stdout.write(`${response}\n`);
      });
    });
  });
