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
  Rating,
  ReviewActionType,
  SymbiosisMode,
  TokenPattern,
} from "../../kernel/index.js";
import {
  analyzeObservation,
  buildReviewQueue,
  countUncardedTokens,
  createToken,
  discoverSkills,
  ensureCard,
  ensureCardsForAllTokens,
  executeReviewAction,
  generatePrompt,
  getAgentSkill,
  getCardDeletionImpact,
  getDueCards,
  getSetting,
  getTokenDeleteImpact,
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
import { resolveUser } from "./resolve-user.js";
import { withDb as sharedWithDb } from "./shared/db.js";

function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function jsonError(message: string): never {
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

      // Auto-create cards for tokens that don't have one yet.
      // Tokens registered via `zam token register` have no cards,
      // so they would be invisible to the review queue otherwise.
      await ensureCardsForAllTokens(db, userId);

      const dueCards = await getDueCards(db, userId);
      const domains = [
        ...new Set(dueCards.map((c) => c.domain).filter(Boolean)),
      ].sort();

      // Count total non-deprecated tokens (all have cards now thanks to ensureCardsForAllTokens).
      const totalTokens = (await listTokens(db)).length;
      const uncardedCount = await countUncardedTokens(db, userId);

      jsonOut({
        userId,
        dueCount: dueCards.length,
        totalTokens,
        uncardedTokens: uncardedCount,
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

// ── zam bridge ensure-cards ──────────────────────────────────────────────────

bridgeCommand
  .command("ensure-cards")
  .description("Ensure every token has a card for the user (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const created = await ensureCardsForAllTokens(db, userId);
      const totalTokens = (await listTokens(db)).length;

      jsonOut({
        userId,
        totalTokens,
        cardsCreated: created,
        allCarded: true,
      });
    });
  });

// ── zam bridge token-stats ──────────────────────────────────────────────────

bridgeCommand
  .command("token-stats")
  .description("Get token and card counts for a user (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const totalTokens = (await listTokens(db)).length;
      const uncarded = await countUncardedTokens(db, userId);
      const dueCards = await getDueCards(db, userId);
      const domains = [
        ...new Set(dueCards.map((c) => c.domain).filter(Boolean)),
      ].sort();

      jsonOut({
        userId,
        totalTokens,
        cardedTokens: totalTokens - uncarded,
        uncardedTokens: uncarded,
        dueCount: dueCards.length,
        domains,
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

      // Ensure every token has a card so the queue is never empty just
      // because tokens were registered via `zam token register` (which
      // creates tokens but not cards).
      await ensureCardsForAllTokens(db, userId);

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

// ── zam bridge get-settings ───────────────────────────────────────────────

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

// ── zam bridge cloud-model-hint ─────────────────────────────────────────────

/**
 * Known cloud LLM endpoints with their recommended model and API flavor.
 *
 * The flavor is critical: for recall/text roles ZAM currently only supports
 * `chat-completions` (OpenAI-compatible protocol).  Providers like DeepSeek
 * expose both an `/anthropic` endpoint (anthropic-messages) and a `/v1`
 * endpoint (chat-completions) — always recommend the chat-completions one
 * so the provider works for ALL roles, not just vision.
 */
interface CloudModelRecommendation {
  model: string;
  flavor: "chat-completions" | "anthropic-messages";
}

function getCloudModelRecommendation(url: string): CloudModelRecommendation | null {
  const lower = url.toLowerCase();
  if (lower.includes("openrouter.ai")) {
    return { model: "openrouter/free", flavor: "chat-completions" };
  }
  if (lower.includes("openai.com") || lower.includes("api.openai")) {
    return { model: "gpt-5-mini", flavor: "chat-completions" };
  }
  if (lower.includes("googleapis.com") || lower.includes("google")) {
    return { model: "gemini-3.5-flash", flavor: "chat-completions" };
  }
  if (lower.includes("deepseek.com")) {
    // DeepSeek has OpenAI-compatible /v1 AND Anthropic-compatible /anthropic.
    // /v1 (chat-completions) works for ALL roles; /anthropic is vision-only.
    return { model: "deepseek-v4-flash", flavor: "chat-completions" };
  }
  if (lower.includes("mimo")) {
    return { model: "mimo-v2.5", flavor: "chat-completions" };
  }
  if (lower.includes("anthropic.com")) {
    return { model: "claude-haiku-4-5-20251001", flavor: "anthropic-messages" };
  }
  return null;
}

bridgeCommand
  .command("cloud-model-hint")
  .description("Suggest a cloud model and API flavor for an endpoint URL (JSON)")
  .requiredOption("--url <url>", "Endpoint base URL")
  .action((opts) => {
    jsonOut({ recommendation: getCloudModelRecommendation(opts.url) });
  });
