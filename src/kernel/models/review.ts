/**
 * Review log repository — typed wrappers around the review_logs table.
 *
 * The review log is immutable: every rating event is appended, never
 * updated or deleted. This provides a complete audit trail of a user's
 * learning history.
 */

import type { Database } from "better-sqlite3";
import { ulid } from "ulid";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReviewLog {
  id: string;
  card_id: string;
  token_id: string;
  user_id: string;
  rating: number; // 1-4
  response_time_ms: number | null;
  reviewed_at: string;
  scheduled_at: string;
  session_id: string | null;
}

export interface CreateReviewInput {
  card_id: string;
  token_id: string;
  user_id: string;
  rating: number; // 1-4
  scheduled_at: string;
  response_time_ms?: number | null;
  session_id?: string | null;
}

export interface ListReviewsOptions {
  /** Maximum number of reviews to return. */
  limit?: number;
  /** Return reviews after this ISO timestamp. */
  after?: string;
  /** Return reviews before this ISO timestamp. */
  before?: string;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Log an immutable review event.
 *
 * Validates that the rating is between 1 and 4 (matching the schema CHECK).
 * Returns the created review log entry.
 */
export function logReview(db: Database, input: CreateReviewInput): ReviewLog {
  if (input.rating < 1 || input.rating > 4) {
    throw new Error(`Rating must be between 1 and 4, got ${input.rating}`);
  }

  const id = ulid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, response_time_ms, reviewed_at, scheduled_at, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.card_id,
    input.token_id,
    input.user_id,
    input.rating,
    input.response_time_ms ?? null,
    now,
    input.scheduled_at,
    input.session_id ?? null,
  );

  return db.prepare("SELECT * FROM review_logs WHERE id = ?").get(id) as ReviewLog;
}

/**
 * Get all reviews for a specific card, ordered by reviewed_at ascending.
 */
export function getReviewsForCard(db: Database, cardId: string): ReviewLog[] {
  return db
    .prepare(
      "SELECT * FROM review_logs WHERE card_id = ? ORDER BY reviewed_at ASC",
    )
    .all(cardId) as ReviewLog[];
}

/**
 * Get reviews for a user, with optional filtering.
 *
 * Results are ordered by reviewed_at descending (most recent first).
 */
export function getReviewsForUser(
  db: Database,
  userId: string,
  options?: ListReviewsOptions,
): ReviewLog[] {
  const conditions = ["user_id = ?"];
  const params: unknown[] = [userId];

  if (options?.after) {
    conditions.push("reviewed_at > ?");
    params.push(options.after);
  }
  if (options?.before) {
    conditions.push("reviewed_at < ?");
    params.push(options.before);
  }

  let sql = `SELECT * FROM review_logs WHERE ${conditions.join(" AND ")} ORDER BY reviewed_at DESC`;

  if (options?.limit) {
    sql += " LIMIT ?";
    params.push(options.limit);
  }

  return db.prepare(sql).all(...params) as ReviewLog[];
}
