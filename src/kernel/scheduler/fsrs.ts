/**
 * FSRS-5 — Free Spaced Repetition Scheduler (v5)
 *
 * Pure-function implementation of the FSRS algorithm that replaces
 * the PoC's SM-2 scheduler. This is the mathematical heart of ZAM's
 * spaced-repetition engine.
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm
 */

// ── Rating scale ────────────────────────────────────────────────────────────

/** 1 = Again (forgot), 2 = Hard, 3 = Good, 4 = Easy */
export type Rating = 1 | 2 | 3 | 4;

// ── Card states ─────────────────────────────────────────────────────────────

export type CardState = "new" | "learning" | "review" | "relearning";

// ── Scheduling card ─────────────────────────────────────────────────────────

export interface SchedulingCard {
  /** Memory stability in days — expected half-life of recall probability. */
  stability: number;
  /** Intrinsic difficulty on a 1–10 scale. */
  difficulty: number;
  /** Days elapsed since the last review. */
  elapsedDays: number;
  /** Currently scheduled interval in days. */
  scheduledDays: number;
  /** Count of successful consecutive reviews. */
  reps: number;
  /** Times the card was forgotten (rated Again). */
  lapses: number;
  /** Current learning state. */
  state: CardState;
  /** When the card is next due. */
  dueAt: Date;
  /** When the card was last reviewed (null for new cards). */
  lastReviewAt: Date | null;
}

// ── Parameters ──────────────────────────────────────────────────────────────

export interface FSRSParameters {
  /** 19 optimised weight parameters (w0 – w18). */
  w: number[];
  /** Target retention rate, e.g. 0.9 means we aim for 90% recall. */
  requestRetention: number;
}

// ── FSRS-5 default weights ──────────────────────────────────────────────────

const DEFAULT_W: number[] = [
  0.4072, 1.1829, 3.1262, 15.4722, // w0–w3:  initial stability per rating
  7.2102, 0.5316, 1.0651,           // w4–w6:  difficulty
  0.0092, 1.5988, 0.1176, 1.0014,  // w7–w10: stability after forgetting
  2.0032, 0.0266, 0.3077, 0.15,    // w11–w14: stability increase
  0.0, 2.7849, 0.3477, 0.6831,     // w15–w18: additional parameters
];

const DEFAULT_REQUEST_RETENTION = 0.9;

// ── FSRS object returned by the factory ─────────────────────────────────────

export interface FSRS {
  /** Return a fully updated card after applying a rating. Pure function. */
  schedule(card: SchedulingCard, rating: Rating, now?: Date): SchedulingCard;
  /** The parameters baked into this instance. */
  readonly params: Readonly<FSRSParameters>;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Clamp a number to [lo, hi]. */
function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Days between two Date objects (may be fractional). */
function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

// ── Core FSRS-5 formulas ────────────────────────────────────────────────────

/**
 * Initial stability for a brand-new card.
 * S₀ = w[rating - 1]
 */
function initialStability(w: number[], rating: Rating): number {
  return w[rating - 1];
}

/**
 * Initial difficulty for a brand-new card.
 * D₀(rating) = w4 - exp(w5 * (rating - 1)) + 1
 * Clamped to [1, 10].
 */
function initialDifficulty(w: number[], rating: Rating): number {
  return clamp(w[4] - Math.exp(w[5] * (rating - 1)) + 1, 1, 10);
}

/**
 * Updated difficulty after a review.
 * D' = w7 * D₀(3) + (1 - w7) * (D - w6 * (rating - 3))
 * Clamped to [1, 10].
 */
function nextDifficulty(w: number[], d: number, rating: Rating): number {
  const d0ForGood = initialDifficulty(w, 3);
  const updated = w[7] * d0ForGood + (1 - w[7]) * (d - w[6] * (rating - 3));
  return clamp(updated, 1, 10);
}

/**
 * Retrievability — probability of recall.
 * R = (1 + elapsed / (9 * S))^(-1)
 */
function retrievability(elapsed: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + elapsed / (9 * stability), -1);
}

/**
 * Stability after a **successful** recall (rating >= 2).
 * S' = S * (exp(w8) * (11 - D) * S^(-w9) * (exp(w10 * (1 - R)) - 1) * hard_penalty * easy_bonus + 1)
 */
function stabilityAfterSuccess(
  w: number[],
  s: number,
  d: number,
  r: number,
  rating: Rating,
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;

  const inner =
    Math.exp(w[8]) *
    (11 - d) *
    Math.pow(s, -w[9]) *
    (Math.exp(w[10] * (1 - r)) - 1) *
    hardPenalty *
    easyBonus;

  return s * (inner + 1);
}

/**
 * Stability after **forgetting** (rating = 1).
 * S' = w11 * D^(-w12) * ((S+1)^w13 - 1) * exp(w14 * (1 - R))
 */
function stabilityAfterForgetting(
  w: number[],
  s: number,
  d: number,
  r: number,
): number {
  return (
    w[11] *
    Math.pow(d, -w[12]) *
    (Math.pow(s + 1, w[13]) - 1) *
    Math.exp(w[14] * (1 - r))
  );
}

/**
 * Optimal interval given new stability and target retention.
 * I = 9 * S' * (1/requestRetention - 1)
 * Minimum 1 day.
 */
function nextInterval(stability: number, requestRetention: number): number {
  const interval = 9 * stability * (1 / requestRetention - 1);
  return Math.max(1, Math.round(interval));
}

// ── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a new card with default initial values.
 */
export function createEmptyCard(now?: Date): SchedulingCard {
  const ts = now ?? new Date();
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: "new",
    dueAt: ts,
    lastReviewAt: null,
  };
}

/**
 * Create an FSRS scheduler instance.
 *
 * All scheduling is done through pure functions — no side effects,
 * no database access, no mutation of the input card.
 */
export function createFSRS(params?: Partial<FSRSParameters>): FSRS {
  const resolvedParams: FSRSParameters = {
    w: params?.w ?? [...DEFAULT_W],
    requestRetention: params?.requestRetention ?? DEFAULT_REQUEST_RETENTION,
  };

  function schedule(
    card: SchedulingCard,
    rating: Rating,
    now?: Date,
  ): SchedulingCard {
    const reviewTime = now ?? new Date();
    const w = resolvedParams.w;

    // Compute elapsed days since last review (or 0 for new cards).
    const elapsed =
      card.lastReviewAt !== null
        ? Math.max(0, daysBetween(card.lastReviewAt, reviewTime))
        : 0;

    // ── New card ──────────────────────────────────────────────────────
    if (card.state === "new") {
      const s = initialStability(w, rating);
      const d = initialDifficulty(w, rating);
      const interval = nextInterval(s, resolvedParams.requestRetention);

      const dueAt = new Date(reviewTime);
      dueAt.setDate(dueAt.getDate() + interval);

      // New cards always move to "learning" after first rating.

      return {
        stability: s,
        difficulty: d,
        elapsedDays: 0,
        scheduledDays: interval,
        reps: rating >= 2 ? 1 : 0,
        lapses: rating === 1 ? 1 : 0,
        state: "learning",
        dueAt,
        lastReviewAt: reviewTime,
      };
    }

    // ── Existing card (learning / review / relearning) ───────────────

    const r = retrievability(elapsed, card.stability);

    let newStability: number;
    let newDifficulty: number;
    let newReps: number;
    let newLapses: number;
    let newState: CardState;

    if (rating === 1) {
      // Forgot — apply forgetting formula
      newStability = stabilityAfterForgetting(w, card.stability, card.difficulty, r);
      newDifficulty = nextDifficulty(w, card.difficulty, rating);
      newReps = 0;
      newLapses = card.lapses + 1;
      newState = "relearning";
    } else {
      // Recalled — apply success formula
      newStability = stabilityAfterSuccess(w, card.stability, card.difficulty, r, rating);
      newDifficulty = nextDifficulty(w, card.difficulty, rating);
      newReps = card.reps + 1;
      newLapses = card.lapses;
      // Successful recall transitions any state to review.
      newState = "review";
    }

    const interval = nextInterval(newStability, resolvedParams.requestRetention);

    const dueAt = new Date(reviewTime);
    dueAt.setDate(dueAt.getDate() + interval);

    return {
      stability: newStability,
      difficulty: newDifficulty,
      elapsedDays: elapsed,
      scheduledDays: interval,
      reps: newReps,
      lapses: newLapses,
      state: newState,
      dueAt,
      lastReviewAt: reviewTime,
    };
  }

  return {
    schedule,
    params: Object.freeze(resolvedParams),
  };
}
