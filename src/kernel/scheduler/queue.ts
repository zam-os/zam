/**
 * Review Queue Builder — assembles a session's review queue.
 *
 * Combines due-card fetching, new-card selection, urgency sorting,
 * and cross-domain interleaving into a single ready-to-review queue.
 */

import type { Database } from "../db/types.js";
import { getDisplayTitle } from "../models/token.js";
import { interleave } from "./interleaver.js";
import { getStudyWorkloadSettings } from "./study-settings.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReviewQueueOptions {
  userId: string;
  maxNew?: number; // default 10
  maxReviews?: number; // default 50
  buryNewSiblings?: boolean;
  buryReviewSiblings?: boolean;
  now?: Date;
  knowledgeContext?: string;
}

export interface ReviewQueueItem {
  cardId: string;
  tokenId: string;
  slug: string;
  title: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  state: string; // 'new' | 'learning' | 'review' | 'relearning'
  dueAt: string;
  sourceLink: string | null;
  question: string | null;
  questionSource: string;
  siblingGroup: string | null;
  hasQuestionMedia: boolean;
  hasAnswerMedia: boolean;
  contentChanged?: boolean;
  publishedBy?: string | null;
  publishedAt?: string | null;
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
  title: string;
  concept: string;
  domain: string;
  bloom_level: number;
  state: string;
  due_at: string;
  source_link: string | null;
  question: string | null;
  question_source: string;
  learned_content_version?: number;
  token_content_version?: number;
  published_by?: string | null;
  published_at?: string | null;
  updated_at?: string;
  sibling_group: string | null;
  question_media_count: number | bigint;
  answer_media_count: number | bigint;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Build a review queue for a user's study session.
 *
 * The queue is assembled in stages:
 * 1. Fetch all due cards (not blocked, due_at <= now, state in review/relearning/learning)
 * 2. Fetch new cards (state = 'new', not blocked)
 * 3. Sort overdue cards by urgency — most overdue first
 * 4. Apply cross-domain interleaving to prevent same-domain streaks
 * 5. Intersperse new cards at regular intervals (every 5th position)
 * 6. Apply sibling controls and the learner's persisted workload limits
 *
 * @param db - Database connection
 * @param options - Queue building options
 * @returns The assembled review queue with metadata
 */
export async function buildReviewQueue(
  db: Database,
  options: ReviewQueueOptions,
): Promise<ReviewQueue> {
  const workload = await getStudyWorkloadSettings(db, options.userId);
  const maxNew = options.maxNew ?? workload.maxNew;
  const maxReviews = options.maxReviews ?? workload.maxReviews;
  const buryNewSiblings = options.buryNewSiblings ?? workload.buryNewSiblings;
  const buryReviewSiblings =
    options.buryReviewSiblings ?? workload.buryReviewSiblings;
  if (!Number.isInteger(maxNew) || maxNew < 0) {
    throw new Error("maxNew must be a non-negative integer");
  }
  if (!Number.isInteger(maxReviews) || maxReviews < 1) {
    throw new Error("maxReviews must be a positive integer");
  }
  const now = options.now ?? new Date();
  const nowISO = now.toISOString();

  // ── Step 1: Fetch due cards (review, relearning, learning — not new) ───
  let dueSql = `SELECT
         c.id       AS card_id,
         c.token_id AS token_id,
         t.slug     AS slug,
         t.title    AS title,
         t.concept  AS concept,
         t.domain   AS domain,
         t.bloom_level AS bloom_level,
         c.state    AS state,
         c.due_at   AS due_at,
         t.source_link AS source_link,
         t.question AS question,
         t.question_source AS question_source,
         c.learned_content_version AS learned_content_version,
         t.content_version AS token_content_version,
         t.published_by AS published_by,
         t.published_at AS published_at,
         t.updated_at AS updated_at,
         (SELECT b.note_guid FROM imported_card_bindings b
           WHERE b.token_id = t.id LIMIT 1) AS sibling_group,
         (SELECT COUNT(*) FROM token_media tm
           WHERE tm.token_id = t.id AND tm.side = 'question') AS question_media_count,
         (SELECT COUNT(*) FROM token_media tm
           WHERE tm.token_id = t.id AND tm.side = 'answer') AS answer_media_count
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ?
         AND c.blocked = 0
         AND (c.buried_until IS NULL OR c.buried_until <= ?)
         AND c.due_at <= ?
         AND c.state IN ('review', 'relearning', 'learning')
         AND t.deprecated_at IS NULL
         AND t.maintenance_at IS NULL
         AND t.editorial_state = 'published'
         AND c.detached_at IS NULL`;

  const dueParams: unknown[] = [options.userId, nowISO, nowISO];

  if (options.knowledgeContext) {
    dueSql += ` AND EXISTS (
      SELECT 1 FROM token_contexts tc
      INNER JOIN contexts ctx ON ctx.id = tc.context_id
      WHERE tc.token_id = t.id AND ctx.name = ?
    )`;
    dueParams.push(options.knowledgeContext);
  }

  dueSql += ` ORDER BY c.due_at ASC`;

  const dueRows = (await db.prepare(dueSql).all(...dueParams)) as CardRow[];

  // ── Step 2: Fetch new cards ────────────────────────────────────────────
  let newSql = `SELECT
         c.id       AS card_id,
         c.token_id AS token_id,
         t.slug     AS slug,
         t.title    AS title,
         t.concept  AS concept,
         t.domain   AS domain,
         t.bloom_level AS bloom_level,
         c.state    AS state,
         c.due_at   AS due_at,
         t.source_link AS source_link,
         t.question AS question,
         t.question_source AS question_source,
         c.learned_content_version AS learned_content_version,
         t.content_version AS token_content_version,
         t.published_by AS published_by,
         t.published_at AS published_at,
         t.updated_at AS updated_at,
         (SELECT b.note_guid FROM imported_card_bindings b
           WHERE b.token_id = t.id LIMIT 1) AS sibling_group,
         (SELECT COUNT(*) FROM token_media tm
           WHERE tm.token_id = t.id AND tm.side = 'question') AS question_media_count,
         (SELECT COUNT(*) FROM token_media tm
           WHERE tm.token_id = t.id AND tm.side = 'answer') AS answer_media_count
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ?
         AND c.blocked = 0
         AND (c.buried_until IS NULL OR c.buried_until <= ?)
         AND c.state = 'new'
         AND t.deprecated_at IS NULL
         AND t.maintenance_at IS NULL
         AND t.editorial_state = 'published'
         AND c.detached_at IS NULL`;

  const newParams: unknown[] = [options.userId, nowISO];

  if (options.knowledgeContext) {
    newSql += ` AND EXISTS (
      SELECT 1 FROM token_contexts tc
      INNER JOIN contexts ctx ON ctx.id = tc.context_id
      WHERE tc.token_id = t.id AND ctx.name = ?
    )`;
    newParams.push(options.knowledgeContext);
  }

  // Sibling suppression can discard candidates, so the window has to be wider
  // than maxNew — but it must stay bounded: an imported library holds tens of
  // thousands of new cards, and a remote (Turso/Postgres) provider would ship
  // every one of them over the wire on every queue build.
  newSql += ` ORDER BY t.bloom_level ASC, t.slug ASC LIMIT ?`;
  newParams.push(maxNew * 10 + 50);

  const newRows = (await db.prepare(newSql).all(...newParams)) as CardRow[];

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

  // ── Step 6: Keep one sibling per enabled bucket, then apply limits ─────
  const capped = applyWorkloadLimits(merged, {
    maxNew,
    maxReviews,
    buryNewSiblings,
    buryReviewSiblings,
  });

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
  const contentChanged =
    row.learned_content_version !== undefined &&
    row.token_content_version !== undefined &&
    row.learned_content_version < row.token_content_version;

  return {
    cardId: row.card_id,
    tokenId: row.token_id,
    slug: row.slug,
    title: getDisplayTitle(row),
    concept: row.concept,
    domain: row.domain,
    bloomLevel: row.bloom_level,
    state: row.state,
    dueAt: row.due_at,
    sourceLink: row.source_link,
    question: row.question,
    questionSource: row.question_source,
    siblingGroup: row.sibling_group,
    hasQuestionMedia: Number(row.question_media_count) > 0,
    hasAnswerMedia: Number(row.answer_media_count) > 0,
    contentChanged,
    publishedBy: row.published_by ?? null,
    publishedAt: row.published_at ?? row.updated_at ?? null,
  };
}

function applyWorkloadLimits(
  items: ReviewQueueItem[],
  options: {
    maxNew: number;
    maxReviews: number;
    buryNewSiblings: boolean;
    buryReviewSiblings: boolean;
  },
): ReviewQueueItem[] {
  const selected: ReviewQueueItem[] = [];
  const seenSiblingGroups = new Set<string>();
  let selectedNew = 0;

  for (const item of items) {
    if (selected.length >= options.maxReviews) break;
    if (item.state === "new" && selectedNew >= options.maxNew) continue;

    const siblingAlreadySelected = Boolean(
      item.siblingGroup && seenSiblingGroups.has(item.siblingGroup),
    );
    const buryThisBucket =
      item.state === "new"
        ? options.buryNewSiblings
        : item.state === "review"
          ? options.buryReviewSiblings
          : false;
    if (siblingAlreadySelected && buryThisBucket) continue;

    selected.push(item);
    if (item.state === "new") selectedNew++;
    if (item.siblingGroup) seenSiblingGroups.add(item.siblingGroup);
  }
  return selected;
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
