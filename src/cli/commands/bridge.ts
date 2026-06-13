/**
 * `zam bridge` — Machine-readable JSON protocol for AI integration.
 *
 * All output is valid JSON only. No human-readable formatting.
 * Errors are also JSON: { "error": "message" }
 */

import { readdirSync } from "node:fs";
import { homedir } from "node:os";
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
  buildReviewQueue,
  createToken,
  discoverSkills,
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
  listAgentSkills,
  listTokens,
  monitorLogExists,
  openDatabase,
  pairCommands,
  readMonitorLog,
  resolveReviewContext,
} from "../../kernel/index.js";
import {
  ensureHighQualityQuestion,
  ensureLlmReadyHeadless,
  evaluateAnswerViaLLM,
  getAvailableModels,
  getLlmConfig,
  isLlmOnline,
  translateQuestionViaLLM,
} from "../llm/client.js";
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
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const dueCards = await getDueCards(db, userId);
      const domains = [
        ...new Set(dueCards.map((c) => c.domain).filter(Boolean)),
      ].sort();

      jsonOut({
        userId,
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
