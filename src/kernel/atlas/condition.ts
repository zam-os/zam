/**
 * Condition classes for the knowledge atlas and every other knowledge view
 * (ADR 2026-10-13, Decision 4).
 *
 * Condition is computed from a learner's FSRS-6 cards when a view is drawn and
 * is never stored. Queue, statistics, atlas and graphs call this one function,
 * so they agree on what "due" or "forgotten" means.
 *
 * Pure: no database, no Node built-ins. The Studio and Mobile import it
 * directly.
 */

import { parseStoredTimestampUtc } from "../db/sql.js";
import {
  type CardState,
  currentRetrievability,
  type FSRSParameters,
} from "../scheduler/fsrs.js";

export type Condition =
  | "known"
  | "due"
  | "overdue"
  | "decaying"
  | "forgotten"
  | "unpractised";

/**
 * Where the classes below "known" start, as fractions of the request
 * retention. A review card is due once its recall probability falls to the
 * request retention, so these bands all lie past the due point. At the default
 * retention of 0.9 they give the knowledge-atlas spike's 0.85 / 0.75 / 0.65.
 */
export const CONDITION_BAND_RATIOS = Object.freeze({
  due: 0.85 / 0.9,
  overdue: 0.75 / 0.9,
  decaying: 0.65 / 0.9,
});

/** A due card with this many lapses is at least "decaying": it keeps lapsing. */
export const DECAY_LAPSES = 3;

const DEFAULT_REQUEST_RETENTION = 0.9;

/** The fields of a stored card that condition depends on. */
export interface ConditionCard {
  state: CardState;
  stability: number;
  /** Stored timestamp (ISO, or SQLite's zone-less UTC form). */
  dueAt: string;
  /** Stored timestamp; null for a card never reviewed. */
  lastReviewAt: string | null;
  lapses: number;
}

/** From best to worst; `unpractised` stands apart (see `unitCondition`). */
const SEVERITY: Readonly<Record<Exclude<Condition, "unpractised">, number>> =
  Object.freeze({
    known: 0,
    due: 1,
    overdue: 2,
    decaying: 3,
    forgotten: 4,
  });

/**
 * The condition of one card at `now`.
 *
 * - A new card, or one never reviewed, is `unpractised`.
 * - A card in short steps (learning, relearning) counts as `due`.
 * - A review card that is not due yet is `known`.
 * - A due review card falls into a band by its recall probability, relative
 *   to the request retention. One that keeps lapsing is at least `decaying`.
 *
 * Blocking, burying and maintenance are queue matters and do not change it.
 */
export function cardCondition(
  card: ConditionCard,
  now: Date,
  params?: Partial<FSRSParameters>,
): Condition {
  if (card.state === "new" || card.lastReviewAt === null) return "unpractised";

  const lastReviewMs = parseStoredTimestampUtc(card.lastReviewAt);
  if (Number.isNaN(lastReviewMs)) return "unpractised";

  const shortSteps = card.state === "learning" || card.state === "relearning";
  if (!shortSteps && parseStoredTimestampUtc(card.dueAt) > now.getTime()) {
    return "known";
  }

  const retention = params?.requestRetention ?? DEFAULT_REQUEST_RETENTION;
  const r =
    currentRetrievability(
      { stability: card.stability, lastReviewAt: new Date(lastReviewMs) },
      now,
      params,
    ) ?? 0;

  let condition: Exclude<Condition, "unpractised">;
  if (shortSteps || r >= CONDITION_BAND_RATIOS.due * retention) {
    condition = "due";
  } else if (r >= CONDITION_BAND_RATIOS.overdue * retention) {
    condition = "overdue";
  } else if (r >= CONDITION_BAND_RATIOS.decaying * retention) {
    condition = "decaying";
  } else {
    condition = "forgotten";
  }

  if (card.lapses >= DECAY_LAPSES) {
    condition = worse(condition, "decaying");
  }
  return condition;
}

/**
 * The condition of a learning unit: the weakest of its cards (an atom has one
 * card per practice item, and its representative item is no mastery claim).
 *
 * Unpractised cards are ignored while any card has been practised, so a new
 * sibling item does not make a known unit look never practised. A unit whose
 * cards are all unpractised is `unpractised`; a unit without cards is `null`.
 */
export function unitCondition(
  cards: readonly ConditionCard[],
  now: Date,
  params?: Partial<FSRSParameters>,
): Condition | null {
  if (cards.length === 0) return null;
  let weakest: Condition = "unpractised";
  for (const card of cards) {
    const condition = cardCondition(card, now, params);
    if (condition === "unpractised") continue;
    weakest = weakest === "unpractised" ? condition : worse(weakest, condition);
  }
  return weakest;
}

function worse(
  a: Exclude<Condition, "unpractised">,
  b: Exclude<Condition, "unpractised">,
): Exclude<Condition, "unpractised"> {
  return SEVERITY[a] >= SEVERITY[b] ? a : b;
}
