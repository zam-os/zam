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
  domain?: string;
  knowledgeContext?: string;
}

export interface ReviewFastCheck {
  type: "binary_choice";
  options: string[];
  correctIndex: number;
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
  atomId: string | null;
  tier: string | null;
  fastCheck: ReviewFastCheck | null;
}

/**
 * Pilot rule `tier1-first` (field-test): a new Tier-2 item stays out of the
 * queue while a new Tier-1 item of the same atom is still unreviewed.
 *
 * Enforced in the new-card SQL below, deliberately in one place. It first
 * existed as a filter over the fetched batch, which agreed with the rule only
 * as long as both items fell inside the same `LIMIT` window — a Tier-1 card
 * pushed past the window would have admitted its Tier-2 sibling.
 */
export const TIER1_FIRST_RULE = "tier1-first";

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
  atom_id: string | null;
  tier: string | null;
  fast_check: string | null;
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
           WHERE tm.token_id = t.id AND tm.side = 'answer') AS answer_media_count,
         t.atom_id AS atom_id,
         t.tier AS tier,
         t.fast_check AS fast_check
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

  if (options.domain) {
    dueSql += " AND t.domain = ?";
    dueParams.push(options.domain);
  }

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
           WHERE tm.token_id = t.id AND tm.side = 'answer') AS answer_media_count,
         t.atom_id AS atom_id,
         t.tier AS tier,
         t.fast_check AS fast_check
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ?
         AND c.blocked = 0
         AND (c.buried_until IS NULL OR c.buried_until <= ?)
         AND c.state = 'new'
         AND t.deprecated_at IS NULL
         AND t.maintenance_at IS NULL
         AND t.editorial_state = 'published'
         AND c.detached_at IS NULL
         AND NOT (
           t.tier = 'tier2_synthesis'
           AND t.atom_id IS NOT NULL
           AND EXISTS (
             SELECT 1
               FROM cards tier1_card
               JOIN tokens tier1_token ON tier1_token.id = tier1_card.token_id
              WHERE tier1_card.user_id = c.user_id
                AND tier1_token.atom_id = t.atom_id
                AND tier1_token.tier = 'tier1_fast'
                AND tier1_card.state = 'new'
                AND tier1_card.blocked = 0
                AND tier1_card.detached_at IS NULL
                AND tier1_token.deprecated_at IS NULL
                AND tier1_token.maintenance_at IS NULL
                AND tier1_token.editorial_state = 'published'
           )
         )`;

  const newParams: unknown[] = [options.userId, nowISO];

  if (options.domain) {
    newSql += " AND t.domain = ?";
    newParams.push(options.domain);
  }

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
    atomId: row.atom_id,
    tier: row.tier,
    fastCheck: presentFastCheck(
      parseReviewFastCheck(row.fast_check),
      `${row.token_id}:${row.due_at}`,
    ),
  };
}

/** 32-bit FNV-1a. Small, stable, and not a security primitive. */
function seedHash(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Order the options a learner sees, and move `correctIndex` with them.
 *
 * Every fast check currently authored puts the correct answer first. Rendered
 * in stored order that is not a retrieval task: after two cards the learner
 * has learned the button position, taps it without reading, and the rating
 * that follows is evidence of nothing — worse than a missing check, because
 * FSRS then schedules on it.
 *
 * Fixing the content alone would not hold; the next author defaults to index 0
 * again. So the presentation permutes, and no surface can forget to.
 *
 * The permutation is **derived, not random**: the kernel performs no random
 * operations, and a re-render inside one presentation must not move a button
 * under a learner's finger. Seeding on the card's due date means the order is
 * fixed while the card is being answered and differs the next time it comes
 * round, so the position cannot be memorised either.
 */
export function presentFastCheck(
  fastCheck: ReviewFastCheck | null,
  seed: string,
): ReviewFastCheck | null {
  if (!fastCheck) return null;
  const order = fastCheck.options.map((option, index) => ({ option, index }));
  let hash = seedHash(seed);
  for (let index = order.length - 1; index > 0; index--) {
    // Draw from the high bits. Practice-item ids differ only in their last
    // characters, and the low bit of an FNV hash barely moves with them: taking
    // `hash % 2` put six of seven Optik cards in the same position, which is
    // the tell this function exists to remove.
    hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d) >>> 0;
    hash ^= hash >>> 13;
    const target = (hash >>> 16) % (index + 1);
    const swap = order[index]!;
    order[index] = order[target]!;
    order[target] = swap;
  }
  return {
    type: fastCheck.type,
    options: order.map((entry) => entry.option),
    correctIndex: order.findIndex(
      (entry) => entry.index === fastCheck.correctIndex,
    ),
  };
}

/**
 * Parse the persisted, editorial fast-check payload into the review contract.
 *
 * Malformed optional metadata must never make the whole queue unavailable.
 * Installation validation can report bad content separately; a learner still
 * gets the ordinary question/answer card as the graceful fallback.
 */
export function parseReviewFastCheck(raw: unknown): ReviewFastCheck | null {
  if (raw === null || raw === undefined) return null;
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const candidate = value as {
    type?: unknown;
    options?: unknown;
    correct_index?: unknown;
    correctIndex?: unknown;
  };
  if (candidate.type !== "binary_choice" || !Array.isArray(candidate.options)) {
    return null;
  }
  const options = candidate.options;
  if (
    options.length < 2 ||
    !options.every(
      (option): option is string =>
        typeof option === "string" && option.trim().length > 0,
    )
  ) {
    return null;
  }
  const correctIndex = candidate.correct_index ?? candidate.correctIndex;
  if (
    !Number.isInteger(correctIndex) ||
    (correctIndex as number) < 0 ||
    (correctIndex as number) >= options.length
  ) {
    return null;
  }
  return {
    type: "binary_choice",
    options: [...options],
    correctIndex: correctIndex as number,
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
