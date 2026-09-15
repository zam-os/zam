/**
 * Idle-aware study-time clock (ADR 2026-09-15).
 *
 * Surfaces measure one number per rating: active learning milliseconds while
 * a card is on screen. The review log stores that number; `getReviewActivity`
 * still clamps it at read time (`STUDY_TIME_CAP_MS`).
 *
 * Model, in short:
 * - Clicks, keypresses and typing reset the idle watcher.
 * - A gap of up to one minute between reactions still counts (thinking,
 *   reading). Anything longer is treated as a distraction: only the grace
 *   period is booked, and the clock stays paused until the next reaction.
 * - While the app is waiting on the system (AI evaluation), idle does not
 *   pause — the learner is waiting, not away.
 * - A follow-up question counts too, but one turn is capped at two minutes.
 *   Longer waits are almost always a hung model or a walk-away.
 *
 * The clock always reports a non-negative integer. A surface that never
 * started it still submits 0 rather than omitting the measurement.
 */

/** Longest unattended gap that still counts as learning. */
export const LEARNING_IDLE_GRACE_MS = 60_000;

/** Longest one follow-up turn (send → reply) may contribute. */
export const LEARNING_FOLLOW_UP_CAP_MS = 2 * 60_000;

export interface LearningClock {
  /** Begin a new card. Drops any previous measurement. */
  start(now: number): void;
  /** Learner reaction: click, pointer, key, or input. */
  noteActivity(now: number): void;
  /** App is waiting on the system (AI evaluation). Idle does not pause. */
  beginBusy(now: number): void;
  endBusy(now: number): void;
  /** One follow-up turn; capped at `LEARNING_FOLLOW_UP_CAP_MS`. */
  beginFollowUp(now: number): void;
  endFollowUp(now: number): void;
  /** Active milliseconds so far. Always a non-negative integer. */
  elapsedMs(now: number): number;
  reset(): void;
}

export interface LearningClockOptions {
  idleGraceMs?: number;
  followUpCapMs?: number;
}

export function createLearningClock(
  options: LearningClockOptions = {},
): LearningClock {
  const idleGraceMs = options.idleGraceMs ?? LEARNING_IDLE_GRACE_MS;
  const followUpCapMs = options.followUpCapMs ?? LEARNING_FOLLOW_UP_CAP_MS;

  let running = false;
  let paused = false;
  let busyDepth = 0;
  let inFollowUp = false;
  let followUpCounted = 0;
  let accumulated = 0;
  let lastCommitAt = 0;

  function commit(now: number): void {
    if (!running) {
      lastCommitAt = now;
      return;
    }
    if (paused) {
      lastCommitAt = now;
      return;
    }
    const gap = Math.max(0, now - lastCommitAt);
    if (inFollowUp) {
      const remaining = Math.max(0, followUpCapMs - followUpCounted);
      const add = Math.min(gap, remaining);
      accumulated += add;
      followUpCounted += add;
    } else if (busyDepth > 0) {
      accumulated += gap;
    } else {
      accumulated += Math.min(gap, idleGraceMs);
      if (gap > idleGraceMs) paused = true;
    }
    lastCommitAt = now;
  }

  return {
    start(now: number): void {
      running = true;
      paused = false;
      busyDepth = 0;
      inFollowUp = false;
      followUpCounted = 0;
      accumulated = 0;
      lastCommitAt = now;
    },

    noteActivity(now: number): void {
      if (!running) return;
      commit(now);
      paused = false;
      lastCommitAt = now;
    },

    beginBusy(now: number): void {
      if (!running) return;
      commit(now);
      busyDepth += 1;
      paused = false;
    },

    endBusy(now: number): void {
      if (!running) return;
      commit(now);
      busyDepth = Math.max(0, busyDepth - 1);
    },

    beginFollowUp(now: number): void {
      if (!running) return;
      commit(now);
      inFollowUp = true;
      followUpCounted = 0;
      paused = false;
    },

    endFollowUp(now: number): void {
      if (!running) return;
      commit(now);
      inFollowUp = false;
      followUpCounted = 0;
    },

    elapsedMs(now: number): number {
      if (!running) return 0;
      commit(now);
      return Math.max(0, Math.round(accumulated));
    },

    reset(): void {
      running = false;
      paused = false;
      busyDepth = 0;
      inFollowUp = false;
      followUpCounted = 0;
      accumulated = 0;
      lastCommitAt = 0;
    },
  };
}
