/**
 * `zam bridge` — Machine-readable JSON protocol for AI integration.
 *
 * All output is valid JSON only. No human-readable formatting.
 * Errors are also JSON: { "error": "message" }
 */

import { Command } from "commander";
import type { Database } from "better-sqlite3";
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
} from "../../kernel/index.js";
import type { Rating, BloomLevel } from "../../kernel/index.js";

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
  .requiredOption("--user <id>", "User ID")
  .action((opts) => {
    withDb((db) => {
      const dueCards = getDueCards(db, opts.user);
      const domains = [...new Set(dueCards.map((c) => c.domain).filter(Boolean))].sort();

      jsonOut({
        userId: opts.user,
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
  .requiredOption("--user <id>", "User ID")
  .action((opts) => {
    withDb((db) => {
      const queue = buildReviewQueue(db, { userId: opts.user, maxReviews: 1, maxNew: 1 });

      if (queue.items.length === 0) {
        jsonOut({
          userId: opts.user,
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
      const fullQueue = buildReviewQueue(db, { userId: opts.user });

      jsonOut({
        userId: opts.user,
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
  .requiredOption("--user <id>", "User ID")
  .requiredOption("--card-id <id>", "Card ID")
  .requiredOption("--rating <n>", "Rating (1-4)")
  .action((opts) => {
    withDb((db) => {
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
        userId: opts.user,
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
            blocked = cascadeBlock(db, opts.user, token.slug);
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

// ── zam bridge add-token ──────────────────────────────────────────────────

bridgeCommand
  .command("add-token")
  .description("Create a token + card from JSON stdin")
  .requiredOption("--user <id>", "User ID")
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

      const token = createToken(db, {
        slug: data!.slug,
        concept: data!.concept,
        domain: data!.domain,
        bloom_level: (data!.bloom_level ?? 1) as BloomLevel,
        context: data!.context,
        symbiosis_mode: data!.symbiosis_mode as "shadowing" | "copilot" | "autonomy" | null | undefined,
      });

      const card = ensureCard(db, token.id, opts.user);

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
