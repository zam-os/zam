/**
 * Review Queue Builder — assembles a session's review queue.
 *
 * Combines due-card fetching, new-card selection, urgency sorting,
 * and cross-domain interleaving into a single ready-to-review queue.
 */

import type { Database } from "better-sqlite3";
import { interleave } from "./interleaver.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReviewQueueOptions {
  userId: string;
  maxNew?: number;       // default 10
  maxReviews?: number;   // default 50
  now?: Date;
}

export interface ReviewQueueItem {
  cardId: string;
  tokenId: string;
  slug: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  state: string;         // 'new' | 'learning' | 'review' | 'relearning'
  dueAt: string;
}

export interface ReviewQueue {
  items: ReviewQueueItem[];
  newCount: number;
  reviewCount: number;
  relearnCount: number;
  totalDomains: string[];
}

// ── Internal row type from SQL queries ───────────────────────────────────────

interface CardRow {
  card_id: string;
  token_id: string;
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
  state: string;
  due_at: string;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Build a review queue for a user's study session.
 *
 * The queue is assembled in stages:
 * 1. Fetch all due cards (not blocked, due_at <= now, state in review/relearning/learning)
 * 2. Fetch new cards (state = 'new', not blocked) up to maxNew
 * 3. Sort overdue cards by urgency — most overdue first
 * 4. Apply cross-domain interleaving to prevent same-domain streaks
 * 5. Intersperse new cards at regular intervals (every 5th position)
 * 6. Cap total at maxReviews
 *
 * @param db - Database connection
 * @param options - Queue building options
 * @returns The assembled review queue with metadata
 */
export function buildReviewQueue(
  db: Database,
  options: ReviewQueueOptions,
): ReviewQueue {
  const maxNew = options.maxNew ?? 10;
  const maxReviews = options.maxReviews ?? 50;
  const now = options.now ?? new Date();
  const nowISO = now.toISOString();

  // ── Step 1: Fetch due cards (review, relearning, learning — not new) ───
  const dueRows = db
    .prepare(
      `SELECT
         c.id       AS card_id,
         c.token_id AS token_id,
         t.slug     AS slug,
         t.concept  AS concept,
         t.domain   AS domain,
         t.bloom_level AS bloom_level,
         c.state    AS state,
         c.due_at   AS due_at
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ?
         AND c.blocked = 0
         AND c.due_at <= ?
         AND c.state IN ('review', 'relearning', 'learning')
       ORDER BY c.due_at ASC`,
    )
    .all(options.userId, nowISO) as CardRow[];

  // ── Step 2: Fetch new cards ────────────────────────────────────────────
  const newRows = db
    .prepare(
      `SELECT
         c.id       AS card_id,
         c.token_id AS token_id,
         t.slug     AS slug,
         t.concept  AS concept,
         t.domain   AS domain,
         t.bloom_level AS bloom_level,
         c.state    AS state,
         c.due_at   AS due_at
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ?
         AND c.blocked = 0
         AND c.state = 'new'
       ORDER BY t.bloom_level ASC, t.slug ASC
       LIMIT ?`,
    )
    .all(options.userId, maxNew) as CardRow[];

  // ── Step 3: Sort overdue cards by urgency (most overdue first) ─────────
  const nowMs = now.getTime();
  const sortedDue = [...dueRows].sort((a, b) => {
    const overdueA = nowMs - new Date(a.due_at).getTime();
    const overdueB = nowMs - new Date(b.due_at).getTime();
    return overdueB - overdueA; // most overdue first
  });

  // ── Step 4: Apply cross-domain interleaving to due cards ───────────────
  const interleavedDue = interleave(
    sortedDue.map((row) => ({ ...rowToItem(row), domain: row.domain })),
  );

  // ── Step 5: Intersperse new cards at regular intervals ─────────────────
  const newItems = newRows.map(rowToItem);
  const merged = intersperseNew(interleavedDue, newItems, 5);

  // ── Step 6: Cap total at maxReviews ────────────────────────────────────
  const capped = merged.slice(0, maxReviews);

  // ── Compute metadata ──────────────────────────────────────────────────
  let newCount = 0;
  let reviewCount = 0;
  let relearnCount = 0;
  const domainSet = new Set<string>();

  for (const item of capped) {
    domainSet.add(item.domain);
    switch (item.state) {
      case "new":
        newCount++;
        break;
      case "relearning":
        relearnCount++;
        break;
      default:
        reviewCount++;
        break;
    }
  }

  return {
    items: capped,
    newCount,
    reviewCount,
    relearnCount,
    totalDomains: [...domainSet].sort(),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a SQL row to a ReviewQueueItem. */
function rowToItem(row: CardRow): ReviewQueueItem {
  return {
    cardId: row.card_id,
    tokenId: row.token_id,
    slug: row.slug,
    concept: row.concept,
    domain: row.domain,
    bloomLevel: row.bloom_level,
    state: row.state,
    dueAt: row.due_at,
  };
}

/**
 * Intersperse new cards into the review queue at regular intervals.
 *
 * Instead of front-loading or back-loading new cards, places one new card
 * every `interval` positions (e.g., positions 4, 9, 14, ...).
 * This gives the user a mix of familiar reviews and new material.
 *
 * @param reviews - The interleaved review cards
 * @param newCards - New cards to intersperse
 * @param interval - Place a new card every N positions (default 5)
 * @returns Merged array with new cards interspersed
 */
function intersperseNew(
  reviews: ReviewQueueItem[],
  newCards: ReviewQueueItem[],
  interval: number,
): ReviewQueueItem[] {
  if (newCards.length === 0) return [...reviews];
  if (reviews.length === 0) return [...newCards];

  const result: ReviewQueueItem[] = [];
  let reviewIdx = 0;
  let newIdx = 0;

  // Position counter tracks where we are in the final queue
  let position = 0;

  while (reviewIdx < reviews.length || newIdx < newCards.length) {
    // Insert a new card every `interval` positions (0-indexed: at 4, 9, 14, ...)
    if (
      newIdx < newCards.length &&
      position > 0 &&
      position % interval === interval - 1
    ) {
      result.push(newCards[newIdx]);
      newIdx++;
    } else if (reviewIdx < reviews.length) {
      result.push(reviews[reviewIdx]);
      reviewIdx++;
    } else if (newIdx < newCards.length) {
      // No more reviews — append remaining new cards
      result.push(newCards[newIdx]);
      newIdx++;
    }

    position++;
  }

  return result;
}
