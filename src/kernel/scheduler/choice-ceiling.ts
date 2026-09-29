/**
 * The tap ceiling (ADR 2026-09-27 Decisions 4 and 5).
 *
 * A rating that rests on a tapped option — a choice graded automatically, or a
 * tier-1 fast check the learner tapped and then rated — shows recognition, not
 * recall. Such a success may build stability up to the ceiling, keeps
 * stability earned above it, and never books a long-term interval beyond it.
 * Pure: no database, no clock, no randomness.
 */

import type { FSRS, Rating, SchedulingCard } from "./fsrs.js";

/**
 * How the learner answered the card a rating is for.
 *
 * - `recall`: answered freely (Flash, typed or spoken); the rating is theirs.
 * - `options`: options were shown and tapped, then the learner rated.
 * - `choice`: the rating was derived from the selected option.
 */
export type AnswerFormat = "recall" | "options" | "choice";

export const ANSWER_FORMATS: readonly AnswerFormat[] = [
  "recall",
  "options",
  "choice",
];

/**
 * How far a tap may carry a card. Must stay below the statistics' maturity
 * threshold (`MATURE_STABILITY_DAYS`) so that taps alone never mature a card.
 */
export const CHOICE_CEILING_DAYS = 20;

export function isAnswerFormat(value: unknown): value is AnswerFormat {
  return (
    typeof value === "string" &&
    (ANSWER_FORMATS as readonly string[]).includes(value)
  );
}

/** True for a successful rating that rests on a tapped option. */
export function isTapBounded(format: AnswerFormat, rating: Rating): boolean {
  return (format === "choice" || format === "options") && rating >= 2;
}

export interface TapCeilingResult {
  card: SchedulingCard;
  /** The ceiling lowered stability or the interval FSRS would have booked. */
  ceilingApplied: boolean;
}

/**
 * Bound a successful tapped answer that FSRS has already scheduled.
 *
 * - Stability: `min(S_fsrs, max(ceiling, S_old))` — built up to the ceiling,
 *   kept (never raised) above it.
 * - Difficulty: a tap says nothing about how hard recall is. A new card starts
 *   at the initial difficulty for Hard; later taps leave it unchanged.
 * - Interval: long-term reviews are booked from `min(stability, ceiling)`;
 *   learning and relearning steps keep their minute intervals.
 */
export function applyTapCeiling(
  fsrs: FSRS,
  previous: SchedulingCard,
  scheduled: SchedulingCard,
  now: Date,
): TapCeilingResult {
  const stability = Math.min(
    scheduled.stability,
    Math.max(
      CHOICE_CEILING_DAYS,
      previous.state === "new" ? 0 : previous.stability,
    ),
  );
  const difficulty =
    previous.state === "new" ? fsrs.initialDifficulty(2) : previous.difficulty;

  if (scheduled.state !== "review") {
    return {
      card: { ...scheduled, stability, difficulty },
      ceilingApplied: stability < scheduled.stability,
    };
  }

  const days = fsrs.intervalDays(Math.min(stability, CHOICE_CEILING_DAYS));
  const dueAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return {
    card: { ...scheduled, stability, difficulty, scheduledDays: days, dueAt },
    ceilingApplied:
      stability < scheduled.stability ||
      dueAt.getTime() < scheduled.dueAt.getTime(),
  };
}
