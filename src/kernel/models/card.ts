/**
 * Card repository — typed wrappers around the cards table.
 *
 * Each card tracks one user's scheduling state for one token,
 * using FSRS fields (stability, difficulty, elapsed_days, etc.).
 */

import type { Database } from "better-sqlite3";
import { ulid } from "ulid";

// ── Types ────────────────────────────────────────────────────────────────────

export type CardState = "new" | "learning" | "review" | "relearning";

export interface Card {
  id: string;
  token_id: string;
  user_id: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: CardState;
  due_at: string;
  last_review_at: string | null;
  blocked: number; // 0 or 1
}

export interface UpdateCardInput {
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: CardState;
  due_at?: string;
  last_review_at?: string | null;
  blocked?: number;
}

/** A due card joined with its token details. */
export interface DueCard extends Card {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
}

/** A blocked card joined with its token details. */
export interface BlockedCard extends Card {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Ensure a card exists for the given token+user pair.
 *
 * If one already exists, return it. Otherwise create a new card with
 * default FSRS values (due immediately) and return it.
 *
 * Ported from the PoC's ensureCard helper.
 */
export function ensureCard(
  db: Database,
  tokenId: string,
  userId: string,
): Card {
  const existing = db
    .prepare("SELECT * FROM cards WHERE token_id = ? AND user_id = ?")
    .get(tokenId, userId) as Card | undefined;

  if (existing) return existing;

  const id = ulid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO cards (id, token_id, user_id, due_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, tokenId, userId, now);

  return db
    .prepare("SELECT * FROM cards WHERE id = ?")
    .get(id) as Card;
}

/**
 * Get a card by token+user. Returns undefined if no card exists.
 */
export function getCard(
  db: Database,
  tokenId: string,
  userId: string,
): Card | undefined {
  return db
    .prepare("SELECT * FROM cards WHERE token_id = ? AND user_id = ?")
    .get(tokenId, userId) as Card | undefined;
}

/**
 * Update a card's scheduling fields.
 *
 * Only the fields present in `updates` are changed. Throws if the card
 * does not exist.
 */
export function updateCard(
  db: Database,
  cardId: string,
  updates: UpdateCardInput,
): Card {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.stability !== undefined) {
    fields.push("stability = ?");
    values.push(updates.stability);
  }
  if (updates.difficulty !== undefined) {
    fields.push("difficulty = ?");
    values.push(updates.difficulty);
  }
  if (updates.elapsed_days !== undefined) {
    fields.push("elapsed_days = ?");
    values.push(updates.elapsed_days);
  }
  if (updates.scheduled_days !== undefined) {
    fields.push("scheduled_days = ?");
    values.push(updates.scheduled_days);
  }
  if (updates.reps !== undefined) {
    fields.push("reps = ?");
    values.push(updates.reps);
  }
  if (updates.lapses !== undefined) {
    fields.push("lapses = ?");
    values.push(updates.lapses);
  }
  if (updates.state !== undefined) {
    fields.push("state = ?");
    values.push(updates.state);
  }
  if (updates.due_at !== undefined) {
    fields.push("due_at = ?");
    values.push(updates.due_at);
  }
  if (updates.last_review_at !== undefined) {
    fields.push("last_review_at = ?");
    values.push(updates.last_review_at);
  }
  if (updates.blocked !== undefined) {
    fields.push("blocked = ?");
    values.push(updates.blocked);
  }

  if (fields.length === 0) {
    throw new Error("updateCard called with no fields to update");
  }

  values.push(cardId);

  const result = db
    .prepare(`UPDATE cards SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  if (result.changes === 0) {
    throw new Error(`Card not found: ${cardId}`);
  }

  return db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId) as Card;
}

/**
 * Get all cards that are due for review.
 *
 * A card is due when it is not blocked and due_at <= now.
 * Results are ordered by bloom_level ascending (fundamentals first),
 * then by due_at ascending (oldest first).
 *
 * Ported from the PoC's due-tokens command.
 */
export function getDueCards(
  db: Database,
  userId: string,
  now?: string,
): DueCard[] {
  const cutoff = now ?? new Date().toISOString();

  return db
    .prepare(
      `SELECT c.*, t.slug, t.concept, t.domain, t.bloom_level
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND c.blocked = 0 AND c.due_at <= ?
       ORDER BY t.bloom_level ASC, c.due_at ASC`,
    )
    .all(userId, cutoff) as DueCard[];
}

/**
 * Get all blocked cards for a user.
 *
 * Returns cards joined with their token details so the caller can
 * see what is waiting and why.
 */
export function getBlockedCards(
  db: Database,
  userId: string,
): BlockedCard[] {
  return db
    .prepare(
      `SELECT c.*, t.slug, t.concept, t.domain, t.bloom_level
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND c.blocked = 1
       ORDER BY t.bloom_level ASC, t.slug ASC`,
    )
    .all(userId) as BlockedCard[];
}
