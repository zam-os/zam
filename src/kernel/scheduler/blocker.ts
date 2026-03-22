/**
 * Cascade Block & Unblock — prerequisite-aware blocking logic.
 *
 * Ported from the PoC's cascade-block and unblock-ready commands.
 *
 * When a user rates a token as "forgot" (rating 1) and that token has
 * prerequisites, we block the token and surface its prerequisites into
 * the active deck. When all prerequisites are met, we unblock.
 */

import type { Database } from "better-sqlite3";
import { ensureCard } from "../models/card.js";
import { getTokenBySlug } from "../models/token.js";
import { getPrerequisites } from "../models/prerequisite.js";

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
 * appear in the user's next review session.
 *
 * @param db - Database connection
 * @param userId - The user whose card to block
 * @param tokenSlug - Slug of the token the user forgot
 * @returns Info about what was blocked and which prerequisites were surfaced
 */
export function cascadeBlock(
  db: Database,
  userId: string,
  tokenSlug: string,
): CascadeBlockResult {
  const token = getTokenBySlug(db, tokenSlug);
  if (!token) {
    throw new Error(`Unknown token slug: ${tokenSlug}`);
  }

  // Ensure a card exists, then block it
  ensureCard(db, token.id, userId);
  db.prepare(
    "UPDATE cards SET blocked = 1 WHERE token_id = ? AND user_id = ?",
  ).run(token.id, userId);

  // Surface all direct prerequisites — ensure cards exist (unblocked, due now)
  const prereqs = getPrerequisites(db, token.id);
  const surfaced: Array<{ slug: string; concept: string; bloomLevel: number }> = [];

  for (const prereq of prereqs) {
    // ensureCard creates a new card if missing (defaults: blocked=0, due_at=now)
    const card = ensureCard(db, prereq.requires_id, userId);

    // If the prerequisite card was somehow blocked with no prereqs of its own,
    // make sure it's unblocked and due now so it surfaces
    if (card.blocked === 1) {
      const prereqOfPrereq = db
        .prepare("SELECT COUNT(*) as n FROM prerequisites WHERE token_id = ?")
        .get(prereq.requires_id) as { n: number };

      // Only force-unblock if it has no prerequisites of its own
      if (prereqOfPrereq.n === 0) {
        const now = new Date().toISOString();
        db.prepare(
          "UPDATE cards SET blocked = 0, due_at = ? WHERE token_id = ? AND user_id = ?",
        ).run(now, prereq.requires_id, userId);
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
 * If a blocked card has no prerequisites at all, it is unblocked immediately
 * (it was likely blocked in error or its prerequisites were removed).
 *
 * @param db - Database connection
 * @param userId - The user whose blocked cards to check
 * @returns List of cards that were unblocked
 */
export function unblockReady(
  db: Database,
  userId: string,
): UnblockResult {
  const blockedCards = db
    .prepare(
      `SELECT c.token_id, t.slug, t.concept
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND c.blocked = 1`,
    )
    .all(userId) as Array<{ token_id: string; slug: string; concept: string }>;

  const unblocked: Array<{ slug: string; concept: string }> = [];

  for (const card of blockedCards) {
    const totalPrereqs = db
      .prepare("SELECT COUNT(*) as n FROM prerequisites WHERE token_id = ?")
      .get(card.token_id) as { n: number };

    const metPrereqs = db
      .prepare(
        `SELECT COUNT(*) as n FROM cards c
         JOIN prerequisites p ON p.requires_id = c.token_id
         WHERE p.token_id = ? AND c.user_id = ? AND c.reps >= 1 AND c.blocked = 0`,
      )
      .get(card.token_id, userId) as { n: number };

    if (totalPrereqs.n === 0 || metPrereqs.n === totalPrereqs.n) {
      const now = new Date().toISOString();
      db.prepare(
        "UPDATE cards SET blocked = 0, due_at = ? WHERE token_id = ? AND user_id = ?",
      ).run(now, card.token_id, userId);

      unblocked.push({ slug: card.slug, concept: card.concept });
    }
  }

  return { unblocked };
}
