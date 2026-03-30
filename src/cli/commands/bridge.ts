/**
 * `zam bridge` — Machine-readable JSON protocol for AI integration.
 *
 * All output is valid JSON only. No human-readable formatting.
 * Errors are also JSON: { "error": "message" }
 */

import { Command } from "commander";
import type { Database } from "libsql";
import {
  openDatabase,
  getDueCards,
  buildReviewQueue,
  generatePrompt,
  ensureCard,
  createToken,
  getTokenBySlug,
  getAgentSkill,
  listAgentSkills,
  readMonitorLog,
  pairCommands,
  analyzeObservation,
  monitorLogExists,
  discoverSkills,
  executeReviewAction,
  getTokenDeleteImpact,
  getCardDeletionImpact,
} from "../../kernel/index.js";
import type {
  Rating,
  BloomLevel,
  TokenPattern,
  ReviewActionType,
  SymbiosisMode,
} from "../../kernel/index.js";
import { readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { resolveUser } from "./resolve-user.js";

function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function jsonError(message: string): never {
  console.log(JSON.stringify({ error: message }, null, 2));
  process.exit(1);
}

function withDb(fn: (db: Database) => void): void {
  let db: Database | undefined;
  try {
    db = openDatabase();
    fn(db);
  } catch (err) {
    db?.close();
    jsonError((err as Error).message);
  } finally {
    db?.close();
  }
}

interface ReviewTargetRow {
  card_id: string;
  token_id: string;
  user_id: string;
  slug: string;
}

function getReviewTarget(db: Database, cardId: string, userId: string): ReviewTargetRow {
  const target = db
    .prepare(
      `SELECT c.id AS card_id, c.token_id, c.user_id, t.slug
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.id = ?`,
    )
    .get(cardId) as ReviewTargetRow | undefined;

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
}): {
  concept?: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
} {
  const updates: {
    concept?: string;
    domain?: string;
    bloom_level?: BloomLevel;
    context?: string;
    symbiosis_mode?: SymbiosisMode | null;
  } = {};

  if (opts.concept !== undefined) updates.concept = opts.concept;
  if (opts.domain !== undefined) updates.domain = opts.domain;
  if (opts.bloom !== undefined) updates.bloom_level = Number(opts.bloom) as BloomLevel;
  if (opts.context !== undefined) updates.context = opts.context;
  if (opts.mode !== undefined) {
    const validModes = ["shadowing", "copilot", "autonomy", "none"];
    if (!validModes.includes(opts.mode)) {
      jsonError(`Invalid mode: ${opts.mode}`);
    }
    updates.symbiosis_mode = opts.mode === "none" ? null : opts.mode as SymbiosisMode;
  }

  return updates;
}

export const bridgeCommand = new Command("bridge")
  .description("Machine-readable JSON protocol for AI integration");

// ── zam bridge check-due ──────────────────────────────────────────────────

bridgeCommand
  .command("check-due")
  .description("Check due cards for a user (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db, { json: true });
      const dueCards = getDueCards(db, userId);
      const domains = [...new Set(dueCards.map((c) => c.domain).filter(Boolean))].sort();

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
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db, { json: true });
      const queue = buildReviewQueue(db, { userId, maxReviews: 1, maxNew: 1 });

      if (queue.items.length === 0) {
        jsonOut({
          userId,
          hasReview: false,
          card: null,
          prompt: null,
          queueSize: 0,
        });
        return;
      }

      const item = queue.items[0];
      const prompt = generatePrompt({
        cardId: item.cardId,
        tokenId: item.tokenId,
        slug: item.slug,
        concept: item.concept,
        domain: item.domain,
        bloomLevel: item.bloomLevel as BloomLevel,
      });

      // Get full queue size for context
      const fullQueue = buildReviewQueue(db, { userId });

      jsonOut({
        userId,
        hasReview: true,
        card: item,
        prompt,
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
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db, { json: true });
      const rating = Number(opts.rating) as Rating;
      if (rating < 1 || rating > 4) {
        jsonError("Rating must be between 1 and 4");
      }

      const result = executeReviewAction(db, {
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
  .requiredOption("--action <action>", "Action: rate | skip | edit-token | deprecate-token | delete-token | delete-card | stop")
  .option("--rating <n>", "Rating (1-4) for action=rate")
  .option("--concept <concept>", "Updated concept text for action=edit-token")
  .option("--domain <domain>", "Updated domain for action=edit-token")
  .option("--bloom <level>", "Updated Bloom level for action=edit-token")
  .option("--context <context>", "Updated context for action=edit-token")
  .option("--mode <mode>", "Updated symbiosis mode for action=edit-token")
  .option("--confirm", "Confirm destructive delete actions")
  .action((opts) => {
    withDb((db) => {
      const userId = resolveUser(opts, db, { json: true });
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

      const target = getReviewTarget(db, opts.cardId, userId);
      if ((action === "delete-token" || action === "delete-card") && !opts.confirm) {
        if (action === "delete-token") {
          jsonOut({
            success: true,
            action,
            preview: true,
            requiresConfirmation: true,
            token: { slug: target.slug, tokenId: target.token_id },
            impact: getTokenDeleteImpact(db, target.slug),
          });
          return;
        }

        jsonOut({
          success: true,
          action,
          preview: true,
          requiresConfirmation: true,
          token: { slug: target.slug, tokenId: target.token_id },
          impact: getCardDeletionImpact(db, target.token_id, userId),
        });
        return;
      }

      const rating = opts.rating !== undefined ? Number(opts.rating) as Rating : undefined;
      if (action === "rate" && (rating == null || rating < 1 || rating > 4)) {
        jsonError("Rating must be between 1 and 4 for action=rate");
      }

      const result = executeReviewAction(db, {
        action,
        cardId: opts.cardId,
        userId,
        rating,
        tokenUpdates: action === "edit-token" ? parseTokenUpdates(opts) : undefined,
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
  .action((opts) => {
    withDb((db) => {
      const skill = getAgentSkill(db, opts.slug);
      if (!skill) {
        jsonError(`Skill not found: ${opts.slug}`);
      }

      jsonOut({
        slug: skill!.slug,
        description: skill!.description,
        steps: skill!.steps,
        tokenSlugs: skill!.token_slugs,
        source: skill!.source,
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
      jsonOut({ sessionId: opts.session, exists: false, commands: [], timeSpan: null });
      return;
    }

    const events = readMonitorLog(opts.session);
    const commands = pairCommands(events);

    let timeSpan: { start: string; end: string; durationMs: number } | null = null;
    if (commands.length > 0) {
      const first = commands[0];
      const last = commands[commands.length - 1];
      const endTs = last.endedAt ?? last.startedAt;
      timeSpan = {
        start: first.startedAt,
        end: endTs,
        durationMs: new Date(endTs).getTime() - new Date(first.startedAt).getTime(),
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
        jsonOut({ sessionId: opts.session, ratings: [], unmatchedCommands: [], timeSpan: null });
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

      if (!Array.isArray(data!.patterns)) {
        jsonError("JSON must include 'patterns' array");
      }

      const events = readMonitorLog(opts.session);
      const commands = pairCommands(events);
      const result = analyzeObservation(commands, data!.patterns);

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
      };

      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      if (!data!.slug || !data!.concept) {
        jsonError("JSON must include 'slug' and 'concept' fields");
      }

      db = openDatabase();
      const userId = resolveUser(opts, db, { json: true });

      const token = createToken(db, {
        slug: data!.slug,
        concept: data!.concept,
        domain: data!.domain,
        bloom_level: (data!.bloom_level ?? 1) as BloomLevel,
        context: data!.context,
        symbiosis_mode: data!.symbiosis_mode as "shadowing" | "copilot" | "autonomy" | null | undefined,
      });

      const card = ensureCard(db, token.id, userId);

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

      db.close();
    } catch (err) {
      db?.close();
      // If it's already a JSON error exit, let it propagate
      if ((err as Error).message) {
        jsonError((err as Error).message);
      }
    }
  });

// ── zam bridge discover-skills ──────────────────────────────────────────────

bridgeCommand
  .command("discover-skills")
  .description("Analyze monitor logs across sessions to discover recurring patterns")
  .option("--min-sessions <n>", "Minimum sessions a pattern must appear in (default: 2)", "2")
  .option("--limit <n>", "Max number of sessions to analyze (default: 20)", "20")
  .action((opts) => {
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
      const sessionCommands = new Map<string, ReturnType<typeof pairCommands>>();
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
      let db;
      try {
        db = openDatabase();
        existingSkillSlugs = listAgentSkills(db).map((s) => s.slug);
      } catch {
        // DB not available — proceed without exclusion
      } finally {
        db?.close();
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
