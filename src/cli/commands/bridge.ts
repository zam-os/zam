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
  evaluateRating,
  ensureCard,
  createToken,
  getTokenBySlug,
  cascadeBlock,
  getPrerequisites,
  getAgentSkill,
  listAgentSkills,
  readMonitorLog,
  pairCommands,
  analyzeObservation,
  monitorLogExists,
  discoverSkills,
} from "../../kernel/index.js";
import type { Rating, BloomLevel, TokenPattern } from "../../kernel/index.js";
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

      // Look up the card to get tokenId
      const card = db
        .prepare("SELECT * FROM cards WHERE id = ?")
        .get(opts.cardId) as { id: string; token_id: string; user_id: string } | undefined;

      if (!card) {
        jsonError(`Card not found: ${opts.cardId}`);
      }

      const result = evaluateRating(db, {
        cardId: opts.cardId,
        tokenId: card!.token_id,
        userId,
        rating,
      });

      let blocked = null;
      if (rating === 1) {
        const token = db
          .prepare("SELECT slug FROM tokens WHERE id = ?")
          .get(card!.token_id) as { slug: string } | undefined;

        if (token) {
          const prereqs = getPrerequisites(db, card!.token_id);
          if (prereqs.length > 0) {
            blocked = cascadeBlock(db, userId, token.slug);
          }
        }
      }

      jsonOut({
        success: true,
        rating,
        evaluation: result,
        blocked,
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
