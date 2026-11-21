/**
 * Cascade Block & Unblock — prerequisite-aware blocking logic.
 *
 * Ported from the PoC's cascade-block and unblock-ready commands.
 *
 * When a user rates a token as "forgot" (rating 1) and that token has
 * prerequisites, we block the token and surface its prerequisites into
 * the active deck. When all prerequisites are met, we unblock.
 */

import type { Database } from "../db/types.js";
import { ensureCard } from "../models/card.js";
import { getBlockingPrerequisites } from "../models/prerequisite.js";
import { getTokenBySlug } from "../models/token.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CascadeBlockResult {
  blockedSlug: string;
  prerequisites: Array<{ slug: string; concept: string; bloomLevel: number }>;
}

export interface UnblockResult {
  unblocked: Array<{ slug: string; concept: string }>;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Block a token and surface its prerequisites.
 *
 * Called when a user rates a token as "forgot" (rating 1). The token is
 * marked as blocked so it won't appear in review queues. All direct
 * prerequisites are ensured to have cards (unblocked, due now) so they
 * appear in the user's next review session. Only prerequisites the queue can
 * show count: a draft or retired foundation is not something the learner can
 * be sent to, so it neither blocks nor gets a card.
 *
 * @param db - Database connection
 * @param userId - The user whose card to block
 * @param tokenSlug - Slug of the token the user forgot
 * @returns Info about what was blocked and which prerequisites were surfaced
 */
export async function cascadeBlock(
  db: Database,
  userId: string,
  tokenSlug: string,
): Promise<CascadeBlockResult> {
  const token = await getTokenBySlug(db, tokenSlug);
  if (!token) {
    throw new Error(`Unknown token slug: ${tokenSlug}`);
  }

  const prereqs = await getBlockingPrerequisites(db, token.id);
  if (prereqs.length === 0) {
    throw new Error(`Cannot block ${tokenSlug}: token has no prerequisites`);
  }

  // Ensure a card exists, then block it
  await ensureCard(db, token.id, userId);
  await db
    .prepare("UPDATE cards SET blocked = 1 WHERE token_id = ? AND user_id = ?")
    .run(token.id, userId);

  // Surface all direct prerequisites — ensure cards exist (unblocked, due now)
  const surfaced: Array<{ slug: string; concept: string; bloomLevel: number }> =
    [];

  for (const prereq of prereqs) {
    // ensureCard creates a new card if missing (defaults: blocked=0, due_at=now)
    const card = await ensureCard(db, prereq.requires_id, userId);

    // If the prerequisite card was somehow blocked with no prereqs of its own,
    // make sure it's unblocked and due now so it surfaces
    if (card.blocked === 1) {
      const prereqOfPrereq = (await db
        .prepare("SELECT COUNT(*) as n FROM prerequisites WHERE token_id = ?")
        .get(prereq.requires_id)) as { n: number };

      // Only force-unblock if it has no prerequisites of its own
      if (prereqOfPrereq.n === 0) {
        const now = new Date().toISOString();
        await db
          .prepare(
            "UPDATE cards SET blocked = 0, due_at = ? WHERE token_id = ? AND user_id = ?",
          )
          .run(now, prereq.requires_id, userId);
      }
    }

    surfaced.push({
      slug: prereq.slug,
      concept: prereq.concept,
      bloomLevel: prereq.bloom_level,
    });
  }

  return {
    blockedSlug: tokenSlug,
    prerequisites: surfaced,
  };
}

/**
 * Scan all blocked cards for a user and unblock any whose prerequisites are met.
 *
 * A blocked card is ready to unblock when ALL of its direct prerequisites have:
 * - reps >= 1 (the user has successfully recalled it at least once)
 * - blocked = 0 (the prerequisite itself is not blocked)
 *
 * Only prerequisites the queue can show are counted, on both sides: a draft or
 * retired foundation can never collect a review, so waiting for one would hold
 * the card blocked for good. This also releases cards blocked while their
 * foundation was still published.
 *
 * If a blocked card has no prerequisites at all, it is unblocked immediately
 * (it was likely blocked in error or its prerequisites were removed).
 *
 * Unblocking cascades: when unblocking a card satisfies the last unmet
 * prerequisite of another blocked card, that card unblocks in the same call.
 *
 * Every successful rating (2–4) runs this inside its own transaction
 * (`executeReviewAction`, `applySessionSynthesis`, `applyDirectRating`), after
 * `lockLearnerRatings`, so a blocked card comes back on every surface once its
 * foundations are in place (ADR 2026-11-21 Decision 7). `zam card unblock`
 * stays as a manual trigger.
 *
 * @param db - Database connection
 * @param userId - The user whose blocked cards to check
 * @param options.now - When the released cards fall due (default: now)
 * @returns List of cards that were unblocked
 */
export async function unblockReady(
  db: Database,
  userId: string,
  options: { now?: Date } = {},
): Promise<UnblockResult> {
  const unblocked: Array<{ slug: string; concept: string }> = [];

  // Fixpoint loop: unblocking a card can satisfy another blocked card's
  // prerequisite, so repeat until a pass unblocks nothing. Each pass is one
  // SELECT (correlated prerequisite counts, no per-card round trips) plus
  // one batched UPDATE; passes are bounded by the prerequisite chain depth,
  // not the card count.
  for (;;) {
    const readyCards = (await db
      .prepare(
        `SELECT c.token_id, t.slug, t.concept
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
         WHERE c.user_id = ? AND c.blocked = 1
           AND (SELECT COUNT(*) FROM prerequisites p
                JOIN tokens pt ON pt.id = p.requires_id
                WHERE p.token_id = c.token_id
                  AND pt.editorial_state = 'published'
                  AND pt.deprecated_at IS NULL) =
               (SELECT COUNT(*) FROM prerequisites p
                JOIN tokens pt ON pt.id = p.requires_id
                JOIN cards pc ON pc.token_id = p.requires_id
                  AND pc.user_id = c.user_id
                WHERE p.token_id = c.token_id
                  AND pt.editorial_state = 'published'
                  AND pt.deprecated_at IS NULL
                  AND pc.reps >= 1 AND pc.blocked = 0)`,
      )
      .all(userId)) as Array<{
      token_id: string;
      slug: string;
      concept: string;
    }>;

    if (readyCards.length === 0) break;

    const now = (options.now ?? new Date()).toISOString();
    const placeholders = readyCards.map(() => "?").join(",");
    await db
      .prepare(
        `UPDATE cards SET blocked = 0, due_at = ?
         WHERE user_id = ? AND token_id IN (${placeholders})`,
      )
      .run(now, userId, ...readyCards.map((card) => card.token_id));

    for (const card of readyCards) {
      unblocked.push({ slug: card.slug, concept: card.concept });
    }
  }

  return { unblocked };
}

/**
 * Serialize one learner's ratings on PostgreSQL until the outermost commit.
 *
 * Every rating transaction calls this first. Without it, two concurrent
 * ratings of different foundations of the same blocked card each see only
 * their own success in `unblockReady`, both commit, and the dependent stays
 * blocked. A transaction-scoped advisory lock is held until the real commit,
 * also when the rating runs inside a caller's transaction (PostgreSQL runs a
 * nested `transaction()` inline), so the later rating scans after the earlier
 * one committed (READ COMMITTED takes a fresh snapshot per statement).
 *
 * SQLite needs nothing: `BEGIN IMMEDIATE` already admits one writer at a time.
 */
export async function lockLearnerRatings(
  tx: Database,
  userId: string,
): Promise<void> {
  if (tx.dialect !== "postgres") return;
  await tx
    .prepare("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))")
    .get(`zam:ratings:${userId}`);
}
