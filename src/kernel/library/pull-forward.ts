/**
 * Pull Forward on Empty Queue (Entry & Scheduling Problem, Phase 4).
 *
 * ADR 2026-08-14, Research Note Section 6.5:
 * When a learner's due queue is empty, ZAM provides a voluntary "Pull-Forward"
 * mechanism. The queue is soft:
 *
 * 1. New curriculum items the daily limit held back come first — that is what
 *    "keep going" is asking for.
 * 2. Future-due reviews follow. Answering one early is not a corruption: FSRS
 *    derives elapsed time from `last_review_at`, never from `due_at`, so an
 *    early answer is scored on the real interval it was given.
 * 3. Preconditions the learner declined come last. They said they already have
 *    those, and the deferral expires on its own date; offering them first
 *    would answer "keep going" with the very thing they set aside.
 * 4. Selecting a new card grants a session-local admission budget and writes
 *    nothing. Pulling an active precondition deferral clears its date and
 *    leaves a `precondition_ready` intent marker until retrieval; pulling a
 *    future review sets `due_at = now`.
 */

import type { Database } from "../db/types.js";
import {
  PRECONDITION_BURIED_REASON,
  PRECONDITION_READY_REASON,
} from "./precondition-assessment.js";

export interface PullForwardCandidate {
  cardId: string;
  tokenId: string;
  tokenSlug: string;
  tokenTitle: string;
  atomId: string | null;
  atomTitle: string | null;
  reason: "precondition_buried" | "future_due" | "new_in_scope";
  dueAt: string;
  buriedUntil: string | null;
  buriedReason: string | null;
  state: string;
  reps: number;
  priorityScore: number;
}

export interface PullForwardOptions {
  limit?: number;
  includeFutureDue?: boolean;
}

export interface PullForwardResult {
  pulledCount: number;
  cardIds: string[];
}

interface RawCandidateRow {
  card_id: string;
  token_id: string;
  token_slug: string;
  token_title: string;
  atom_id: string | null;
  atom_title: string | null;
  due_at: string;
  buried_until: string | null;
  buried_reason: string | null;
  state: string;
  reps: number;
}

/**
 * Get prioritized candidates that can be pulled forward into the review queue.
 */
export async function getPullForwardCandidates(
  db: Database,
  userId: string,
  options: PullForwardOptions = {},
): Promise<PullForwardCandidate[]> {
  if (!userId.trim()) {
    throw new Error("userId is required for pull-forward candidates");
  }

  const now = new Date().toISOString();
  const limit = options.limit ?? 20;
  const includeFutureDue = options.includeFutureDue ?? true;
  if (!Number.isInteger(limit) || limit < 1 || limit > 1_000) {
    throw new Error("pull-forward limit must be an integer between 1 and 1000");
  }

  // Not currently in the active due queue, or leftover new cards past maxNew:
  // 1. Buried with precondition reason
  // 2. Leftover new cards that enrolment already materialised
  // 3. Future-due reviews, when includeFutureDue is on
  const rows = (await db
    .prepare(
      `SELECT c.id AS card_id,
              c.token_id AS token_id,
              t.slug AS token_slug,
              t.title AS token_title,
              t.atom_id AS atom_id,
              a.title AS atom_title,
              c.due_at AS due_at,
              c.buried_until AS buried_until,
              c.buried_reason AS buried_reason,
              c.state AS state,
              c.reps AS reps
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
    LEFT JOIN learning_atoms a ON a.id = t.atom_id
        WHERE c.user_id = ?
          AND c.blocked = 0
          AND c.detached_at IS NULL
          AND t.deprecated_at IS NULL
          AND t.maintenance_at IS NULL
          AND t.editorial_state = 'published'
          AND (
            (c.buried_reason = ? AND c.buried_until > ? AND c.reps = 0)
            OR (
              c.state = 'new'
              AND c.buried_until IS NULL
              AND c.buried_reason IS NULL
            )
            OR (
              ? = 1
              AND c.buried_until IS NULL
              AND c.buried_reason IS NULL
              AND c.due_at > ?
            )
          )
        ORDER BY c.due_at ASC`,
    )
    .all(
      userId,
      PRECONDITION_BURIED_REASON,
      now,
      includeFutureDue ? 1 : 0,
      now,
    )) as RawCandidateRow[];

  // Compute dependency / leverage scores (atoms that gate other atoms have higher priority)
  const prereqCounts = (await db
    .prepare(
      `SELECT requires_id, COUNT(*) AS dependent_count
         FROM atom_prerequisites
        WHERE kind = 'hard'
        GROUP BY requires_id`,
    )
    .all()) as Array<{ requires_id: string; dependent_count: number }>;

  const leverageMap = new Map<string, number>();
  for (const row of prereqCounts) {
    leverageMap.set(row.requires_id, row.dependent_count);
  }

  const candidates: PullForwardCandidate[] = rows.map((r) => {
    let reason: "precondition_buried" | "future_due" | "new_in_scope";
    let baseScore: number;

    if (r.buried_reason === PRECONDITION_BURIED_REASON) {
      // Offered, but last. The learner just said they already have this;
      // handing it back first would answer "keep going" with the very thing
      // they declined, and the deferral ends on its own date anyway. Someone
      // who wants to check the claim early can still pick it.
      reason = "precondition_buried";
      baseScore = 10;
    } else if (r.state === "new") {
      // What "keep going" is actually for: curriculum the learner has not
      // reached yet, past the daily limit.
      reason = "new_in_scope";
      baseScore = 50;
    } else {
      reason = "future_due";
      baseScore = 30;
    }

    const leverage = r.atom_id ? (leverageMap.get(r.atom_id) ?? 0) : 0;
    const priorityScore = baseScore + leverage * 5;

    return {
      cardId: r.card_id,
      tokenId: r.token_id,
      tokenSlug: r.token_slug,
      tokenTitle: r.token_title,
      atomId: r.atom_id,
      atomTitle: r.atom_title,
      reason,
      dueAt: r.due_at,
      buriedUntil: r.buried_until,
      buriedReason: r.buried_reason,
      state: r.state,
      reps: r.reps,
      priorityScore,
    };
  });

  // Sort descending by priorityScore, then ascending by dueAt
  candidates.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return a.dueAt.localeCompare(b.dueAt);
  });

  return candidates.slice(0, limit);
}

/**
 * Execute pull-forward on selected cards for a learner.
 *
 * New cards need no scheduling mutation; the caller carries their count into
 * the next queue snapshot as `maxNew`. Active precondition cards are unburied
 * with a durable ready marker, and future non-new reviews are made due now.
 */
export async function pullForwardCards(
  db: Database,
  userId: string,
  cardIds: string[],
): Promise<PullForwardResult> {
  if (!userId.trim()) {
    throw new Error("userId is required for pull-forward");
  }
  if (!Array.isArray(cardIds) || cardIds.length === 0) {
    return { pulledCount: 0, cardIds: [] };
  }

  return db.transaction(async (tx) => {
    const now = new Date().toISOString();
    let pulledCount = 0;
    const processedCardIds: string[] = [];

    for (const cardId of new Set(cardIds)) {
      const card = (await tx
        .prepare(
          `SELECT c.id, c.buried_reason, c.buried_until, c.due_at,
                  c.detached_at, c.state
             FROM cards c
             JOIN tokens t ON t.id = c.token_id
            WHERE c.id = ? AND c.user_id = ?
              AND c.blocked = 0
              AND t.deprecated_at IS NULL
              AND t.maintenance_at IS NULL
              AND t.editorial_state = 'published'`,
        )
        .get(cardId, userId)) as
        | {
            id: string;
            buried_reason: string | null;
            buried_until: string | null;
            due_at: string;
            detached_at: string | null;
            state: string;
          }
        | undefined;

      if (!card || card.detached_at) continue;

      const updates: string[] = [];
      const values: (string | null)[] = [];

      if (
        card.buried_reason === PRECONDITION_BURIED_REASON &&
        card.buried_until !== null &&
        card.buried_until > now
      ) {
        updates.push("buried_until = NULL", "buried_reason = ?");
        values.push(PRECONDITION_READY_REASON);
      }

      if (card.state !== "new" && card.due_at > now) {
        updates.push("due_at = ?");
        values.push(now);
      }

      if (updates.length > 0) {
        values.push(cardId, userId);
        const res = await tx
          .prepare(
            `UPDATE cards
                SET ${updates.join(", ")}
              WHERE id = ? AND user_id = ?`,
          )
          .run(...values);
        if (res.changes === 0) continue;
      } else if (
        card.state !== "new" ||
        card.buried_until !== null ||
        card.buried_reason !== null
      ) {
        continue;
      }

      // A new card is already due in storage: accepting it is a session-local
      // admission decision, so no fake scheduling write is needed here. It is
      // still a successfully processed selection and the caller passes the
      // matching maxNew override into the next queue snapshot.
      pulledCount += 1;
      processedCardIds.push(cardId);
    }

    return {
      pulledCount,
      cardIds: processedCardIds,
    };
  });
}
