/**
 * Rating Evaluator
 *
 * Processes a user's self-assessment rating after a recall attempt.
 * Coordinates between FSRS scheduling, review logging, and blocking.
 */

import type { Database } from "better-sqlite3";
import { ulid } from "ulid";
import { updateCard } from "../models/card.js";
import type { Rating, SchedulingCard } from "../scheduler/fsrs.js";
import { createFSRS } from "../scheduler/fsrs.js";

export interface EvaluateInput {
  cardId: string;
  tokenId: string;
  userId: string;
  rating: Rating;
  sessionId?: string;
  responseTimeMs?: number;
}

export interface EvaluateResult {
  nextDueAt: string;
  stability: number;
  difficulty: number;
  state: string;
  scheduledDays: number;
  reps: number;
  lapses: number;
}

/**
 * Process a rating: update the card via FSRS, log the review.
 * Returns the updated scheduling state.
 *
 * Note: blocking logic (cascade-block) is handled separately by the caller
 * when rating === 1 and the token has prerequisites.
 */
export function evaluateRating(
  db: Database,
  input: EvaluateInput,
): EvaluateResult {
  // Get current card state
  const card = db
    .prepare("SELECT * FROM cards WHERE id = ?")
    .get(input.cardId) as {
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    state: string;
    due_at: string;
    last_review_at: string | null;
  } | undefined;

  if (!card) {
    throw new Error(`Card not found: ${input.cardId}`);
  }

  const now = new Date();
  const fsrs = createFSRS();

  // Build scheduling card from DB state
  const schedulingCard: SchedulingCard = {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as SchedulingCard["state"],
    dueAt: new Date(card.due_at),
    lastReviewAt: card.last_review_at ? new Date(card.last_review_at) : null,
  };

  // Run FSRS
  const updated = fsrs.schedule(schedulingCard, input.rating, now);

  // Update the card in the DB
  updateCard(db, input.cardId, {
    stability: updated.stability,
    difficulty: updated.difficulty,
    elapsed_days: updated.elapsedDays,
    scheduled_days: updated.scheduledDays,
    reps: updated.reps,
    lapses: updated.lapses,
    state: updated.state,
    due_at: updated.dueAt.toISOString(),
    last_review_at: now.toISOString(),
  });

  // Log the review (immutable)
  db.prepare(
    `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, response_time_ms, reviewed_at, scheduled_at, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    ulid(),
    input.cardId,
    input.tokenId,
    input.userId,
    input.rating,
    input.responseTimeMs ?? null,
    now.toISOString(),
    card.due_at,
    input.sessionId ?? null,
  );

  return {
    nextDueAt: updated.dueAt.toISOString(),
    stability: updated.stability,
    difficulty: updated.difficulty,
    state: updated.state,
    scheduledDays: updated.scheduledDays,
    reps: updated.reps,
    lapses: updated.lapses,
  };
}
