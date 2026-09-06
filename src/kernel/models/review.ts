/**
 * Review log repository — typed wrappers around the review_logs table.
 *
 * The review log is immutable: every rating event is appended, never
 * updated or deleted. This provides a complete audit trail of a user's
 * learning history.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";

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
  /** Token `content_version` at answer time; NULL for rows predating M027. */
  content_version: number | null;
  /** Attempt identity; NULL for historical ratings without an attempt record. */
  attempt_id: string | null;
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
export async function logReview(
  db: Database,
  input: CreateReviewInput,
): Promise<ReviewLog> {
  if (input.rating < 1 || input.rating > 4) {
    throw new Error(`Rating must be between 1 and 4, got ${input.rating}`);
  }

  const id = ulid();
  const now = new Date().toISOString();

  // Which wording earned the rating (ADR 2026-08-14 Decision 9) — the token's
  // version at answer time, not the card's, which moves on afterwards.
  const asked = (await db
    .prepare("SELECT content_version FROM tokens WHERE id = ?")
    .get(input.token_id)) as { content_version: number } | undefined;

  await db
    .prepare(
      `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, response_time_ms, reviewed_at, scheduled_at, session_id, content_version)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.card_id,
      input.token_id,
      input.user_id,
      input.rating,
      input.response_time_ms ?? null,
      now,
      input.scheduled_at,
      input.session_id ?? null,
      asked?.content_version ?? null,
    );

  return (await db
    .prepare("SELECT * FROM review_logs WHERE id = ?")
    .get(id)) as ReviewLog;
}

/**
 * Get all reviews for a specific card, ordered by reviewed_at ascending.
 */
export async function getReviewsForCard(
  db: Database,
  cardId: string,
): Promise<ReviewLog[]> {
  return (await db
    .prepare(
      "SELECT * FROM review_logs WHERE card_id = ? ORDER BY reviewed_at ASC",
    )
    .all(cardId)) as ReviewLog[];
}

/**
 * Get reviews for a user, with optional filtering.
 *
 * Results are ordered by reviewed_at descending (most recent first).
 */
export async function getReviewsForUser(
  db: Database,
  userId: string,
  options?: ListReviewsOptions,
): Promise<ReviewLog[]> {
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

  return (await db.prepare(sql).all(...params)) as ReviewLog[];
}
