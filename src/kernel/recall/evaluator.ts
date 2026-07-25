/**
 * Rating Evaluator
 *
 * Processes a user's self-assessment rating after a recall attempt.
 * Coordinates between FSRS scheduling, review logging, and blocking.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
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
  reviewLogId?: string;
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
export async function evaluateRating(
  db: Database,
  input: EvaluateInput,
): Promise<EvaluateResult> {
  return db.transaction((tx) => evaluateRatingWithinTransaction(tx, input));
}

/**
 * Apply a rating using a transaction already owned by the caller.
 * This is used when prerequisite blocking must commit with the review.
 */
export async function evaluateRatingWithinTransaction(
  db: Database,
  input: EvaluateInput,
): Promise<EvaluateResult> {
  // Get current card state
  const card = (await db
    .prepare("SELECT * FROM cards WHERE id = ?")
    .get(input.cardId)) as
    | {
        stability: number;
        difficulty: number;
        elapsed_days: number;
        scheduled_days: number;
        reps: number;
        lapses: number;
        state: string;
        due_at: string;
        last_review_at: string | null;
      }
    | undefined;

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
  await updateCard(db, input.cardId, {
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

  // The card has now been answered against whatever the token currently says,
  // so it is back in sync (ADR 2026-07-04 Decision 3). Without this a card
  // re-tested after a material change would stay marked as outdated and be
  // pulled forward again on every publish.
  await db
    .prepare(
      `UPDATE cards
          SET learned_content_version =
                (SELECT content_version FROM tokens WHERE id = cards.token_id)
        WHERE id = ?`,
    )
    .run(input.cardId);

  // Log the review (immutable)
  const reviewLogId = input.reviewLogId ?? ulid();
  await db
    .prepare(
      `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, response_time_ms, reviewed_at, scheduled_at, session_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      reviewLogId,
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
