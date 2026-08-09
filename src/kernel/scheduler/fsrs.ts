/**
 * FSRS-6 — Free Spaced Repetition Scheduler
 *
 * Pure-function implementation of the long-term FSRS-6 memory model plus
 * deterministic short learning and relearning steps. The kernel owns the
 * scheduling semantics; persistence and UI surfaces only store/render the
 * returned state.
 *
 * Reference: https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm
 */

/** 1 = Again (forgot), 2 = Hard, 3 = Good, 4 = Easy. */
export type Rating = 1 | 2 | 3 | 4;

export type CardState = "new" | "learning" | "review" | "relearning";

export interface SchedulingCard {
  /** Memory stability in days — the interval at which recall reaches 90%. */
  stability: number;
  /** Intrinsic difficulty on a 1–10 scale. */
  difficulty: number;
  /** Days elapsed since the last review; fractional for same-day reviews. */
  elapsedDays: number;
  /** Current interval in days; fractional while a short step is active. */
  scheduledDays: number;
  /** Count of successful consecutive reviews. */
  reps: number;
  /** Times the card was forgotten (rated Again). */
  lapses: number;
  /** Current learning state. */
  state: CardState;
  /** Zero-based cursor into the active learning/relearning steps. */
  learningStep: number | null;
  /** When the card is next due. */
  dueAt: Date;
  /** When the card was last reviewed (null for new cards). */
  lastReviewAt: Date | null;
}

export interface FSRSParameters {
  /** The 21 FSRS-6 model weights (w0–w20). */
  readonly w: readonly number[];
  /** Target recall probability used to calculate long-term intervals. */
  readonly requestRetention: number;
  /** Ascending short steps for new cards, expressed in minutes. */
  readonly learningStepsMinutes: readonly number[];
  /** Ascending short steps after a lapse, expressed in minutes. */
  readonly relearningStepsMinutes: readonly number[];
  /** Upper bound for a long-term review interval. */
  readonly maximumIntervalDays: number;
}

// Official FSRS-6 defaults, trained across the public reference dataset.
const DEFAULT_W: readonly number[] = Object.freeze([
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666,
  0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658,
  0.1542,
]);

const DEFAULT_REQUEST_RETENTION = 0.9;
const DEFAULT_LEARNING_STEPS_MINUTES: readonly number[] = Object.freeze([
  1, 10,
]);
const DEFAULT_RELEARNING_STEPS_MINUTES: readonly number[] = Object.freeze([10]);
const DEFAULT_MAXIMUM_INTERVAL_DAYS = 36_500;
const MIN_STABILITY = 0.001;
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTES_PER_DAY = 24 * 60;

export interface FSRS {
  /** Return a fully updated card after applying a rating. Pure function. */
  schedule(card: SchedulingCard, rating: Rating, now?: Date): SchedulingCard;
  /** The immutable parameters baked into this instance. */
  readonly params: Readonly<FSRSParameters>;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function clampStability(stability: number): number {
  return Math.max(MIN_STABILITY, stability);
}

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / DAY_MS;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function minutesToDays(minutes: number): number {
  return minutes / MINUTES_PER_DAY;
}

function initialStability(w: readonly number[], rating: Rating): number {
  return clampStability(w[rating - 1]);
}

/**
 * D0(G) = w4 - exp(w5 * (G - 1)) + 1
 */
function initialDifficulty(
  w: readonly number[],
  rating: Rating,
  shouldClamp = true,
): number {
  const difficulty = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
  return shouldClamp ? clamp(difficulty, 1, 10) : difficulty;
}

/**
 * FSRS-6 difficulty update: linear damping followed by mean reversion toward
 * the initial Easy difficulty.
 */
function nextDifficulty(
  w: readonly number[],
  difficulty: number,
  rating: Rating,
): number {
  const delta = -w[6] * (rating - 3);
  const damped = difficulty + ((10 - difficulty) * delta) / 9;
  const target = initialDifficulty(w, 4, false);
  return clamp(w[7] * target + (1 - w[7]) * damped, 1, 10);
}

function forgettingCurveFactor(w: readonly number[]): number {
  return 0.9 ** (-1 / w[20]) - 1;
}

/**
 * FSRS-6 forgetting curve with trainable decay w20.
 */
function retrievability(
  w: readonly number[],
  elapsedDays: number,
  stability: number,
): number {
  const safeStability = clampStability(stability);
  return (
    (1 + (forgettingCurveFactor(w) * elapsedDays) / safeStability) ** -w[20]
  );
}

function stabilityAfterSuccess(
  w: readonly number[],
  stability: number,
  difficulty: number,
  recallProbability: number,
  rating: Rating,
): number {
  const hardPenalty = rating === 2 ? w[15] : 1;
  const easyBonus = rating === 4 ? w[16] : 1;
  return clampStability(
    stability *
      (1 +
        Math.exp(w[8]) *
          (11 - difficulty) *
          stability ** -w[9] *
          (Math.exp(w[10] * (1 - recallProbability)) - 1) *
          hardPenalty *
          easyBonus),
  );
}

function stabilityAfterForgetting(
  w: readonly number[],
  stability: number,
  difficulty: number,
  recallProbability: number,
): number {
  const longTerm =
    w[11] *
    difficulty ** -w[12] *
    ((stability + 1) ** w[13] - 1) *
    Math.exp(w[14] * (1 - recallProbability));
  const shortTermLimit = stability / Math.exp(w[17] * w[18]);
  return clampStability(Math.min(longTerm, shortTermLimit));
}

/**
 * S'(S,G) = S * exp(w17 * (G - 3 + w18)) * S^(-w19)
 *
 * A successful same-day review may not reduce stability.
 */
function shortTermStability(
  w: readonly number[],
  stability: number,
  rating: Rating,
): number {
  let increase = Math.exp(w[17] * (rating - 3 + w[18])) * stability ** -w[19];
  if (rating >= 2) increase = Math.max(increase, 1);
  return clampStability(stability * increase);
}

function nextInterval(
  w: readonly number[],
  stability: number,
  requestRetention: number,
  maximumIntervalDays: number,
): number {
  const decay = w[20];
  const interval =
    (stability / forgettingCurveFactor(w)) *
    (requestRetention ** (-1 / decay) - 1);
  return Math.max(1, Math.min(maximumIntervalDays, Math.round(interval)));
}

function validateSteps(name: string, steps: readonly number[]): void {
  for (let index = 0; index < steps.length; index++) {
    const step = steps[index];
    if (!Number.isFinite(step) || step <= 0) {
      throw new Error(`${name} must contain positive minute values.`);
    }
    if (index > 0 && step <= steps[index - 1]) {
      throw new Error(`${name} must be in strictly ascending order.`);
    }
  }
}

function resolveParameters(
  params?: Partial<FSRSParameters>,
): Readonly<FSRSParameters> {
  const weights = [...(params?.w ?? DEFAULT_W)];
  if (weights.length !== 21) {
    throw new Error(
      `FSRS-6 requires exactly 21 weights; got ${weights.length}.`,
    );
  }
  if (!weights.every(Number.isFinite)) {
    throw new Error("FSRS-6 weights must all be finite numbers.");
  }

  const requestRetention =
    params?.requestRetention ?? DEFAULT_REQUEST_RETENTION;
  if (
    !Number.isFinite(requestRetention) ||
    requestRetention <= 0 ||
    requestRetention >= 1
  ) {
    throw new Error(
      "Request retention must be greater than 0 and less than 1.",
    );
  }

  const learningStepsMinutes = [
    ...(params?.learningStepsMinutes ?? DEFAULT_LEARNING_STEPS_MINUTES),
  ];
  const relearningStepsMinutes = [
    ...(params?.relearningStepsMinutes ?? DEFAULT_RELEARNING_STEPS_MINUTES),
  ];
  validateSteps("Learning steps", learningStepsMinutes);
  validateSteps("Relearning steps", relearningStepsMinutes);

  const maximumIntervalDays =
    params?.maximumIntervalDays ?? DEFAULT_MAXIMUM_INTERVAL_DAYS;
  if (!Number.isInteger(maximumIntervalDays) || maximumIntervalDays < 1) {
    throw new Error(
      "Maximum interval must be a positive whole number of days.",
    );
  }

  return Object.freeze({
    w: Object.freeze(weights),
    requestRetention,
    learningStepsMinutes: Object.freeze(learningStepsMinutes),
    relearningStepsMinutes: Object.freeze(relearningStepsMinutes),
    maximumIntervalDays,
  });
}

interface ScheduleOutcome {
  state: CardState;
  learningStep: number | null;
  intervalDays: number;
}

function longTermOutcome(intervalDays: number): ScheduleOutcome {
  return { state: "review", learningStep: null, intervalDays };
}

function currentStep(
  persistedStep: number | null,
  steps: readonly number[],
): number {
  // Cards created before M020 have no cursor. Treat them as being on the last
  // step so a successful answer graduates instead of replaying a new sequence.
  if (
    persistedStep === null ||
    persistedStep < 0 ||
    persistedStep >= steps.length
  ) {
    return Math.max(0, steps.length - 1);
  }
  return persistedStep;
}

function stepOutcome(
  state: "learning" | "relearning",
  persistedStep: number | null,
  steps: readonly number[],
  rating: Rating,
  longTermInterval: number,
): ScheduleOutcome {
  if (steps.length === 0) return longTermOutcome(longTermInterval);

  const step = currentStep(persistedStep, steps);
  switch (rating) {
    case 1:
      return {
        state,
        learningStep: 0,
        intervalDays: minutesToDays(steps[0]),
      };
    case 2: {
      let intervalMinutes = steps[step];
      if (step === 0 && steps.length === 1) {
        intervalMinutes = steps[0] * 1.5;
      } else if (step === 0) {
        intervalMinutes = (steps[0] + steps[1]) / 2;
      }
      return {
        state,
        learningStep: step,
        intervalDays: minutesToDays(intervalMinutes),
      };
    }
    case 3:
      if (step + 1 >= steps.length) return longTermOutcome(longTermInterval);
      return {
        state,
        learningStep: step + 1,
        intervalDays: minutesToDays(steps[step + 1]),
      };
    case 4:
      return longTermOutcome(longTermInterval);
  }
}

export function createEmptyCard(now?: Date): SchedulingCard {
  const dueAt = now ?? new Date();
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: "new",
    learningStep: null,
    dueAt,
    lastReviewAt: null,
  };
}

/**
 * Create a deterministic FSRS-6 scheduler instance.
 *
 * The operation has no side effects, database access, random fuzzing, or model
 * calls. The same card, rating, time, and parameters always produce the same
 * result on every ZAM surface.
 */
export function createFSRS(params?: Partial<FSRSParameters>): FSRS {
  const resolvedParams = resolveParameters(params);

  function schedule(
    card: SchedulingCard,
    rating: Rating,
    now?: Date,
  ): SchedulingCard {
    const reviewTime = now ?? new Date();
    const elapsedDays =
      card.lastReviewAt === null
        ? 0
        : Math.max(0, daysBetween(card.lastReviewAt, reviewTime));

    let stability: number;
    let difficulty: number;

    if (card.state === "new") {
      stability = initialStability(resolvedParams.w, rating);
      difficulty = initialDifficulty(resolvedParams.w, rating);
    } else {
      const previousStability = clampStability(card.stability);
      const previousDifficulty = clamp(card.difficulty, 1, 10);
      if (elapsedDays < 1) {
        stability = shortTermStability(
          resolvedParams.w,
          previousStability,
          rating,
        );
      } else {
        const recallProbability = retrievability(
          resolvedParams.w,
          elapsedDays,
          previousStability,
        );
        stability =
          rating === 1
            ? stabilityAfterForgetting(
                resolvedParams.w,
                previousStability,
                previousDifficulty,
                recallProbability,
              )
            : stabilityAfterSuccess(
                resolvedParams.w,
                previousStability,
                previousDifficulty,
                recallProbability,
                rating,
              );
      }
      difficulty = nextDifficulty(resolvedParams.w, previousDifficulty, rating);
    }

    const longTermInterval = nextInterval(
      resolvedParams.w,
      stability,
      resolvedParams.requestRetention,
      resolvedParams.maximumIntervalDays,
    );

    let outcome: ScheduleOutcome;
    switch (card.state) {
      case "new":
        outcome = stepOutcome(
          "learning",
          0,
          resolvedParams.learningStepsMinutes,
          rating,
          longTermInterval,
        );
        break;
      case "learning":
        outcome = stepOutcome(
          "learning",
          card.learningStep,
          resolvedParams.learningStepsMinutes,
          rating,
          longTermInterval,
        );
        break;
      case "review":
        outcome =
          rating === 1 && resolvedParams.relearningStepsMinutes.length > 0
            ? {
                state: "relearning",
                learningStep: 0,
                intervalDays: minutesToDays(
                  resolvedParams.relearningStepsMinutes[0],
                ),
              }
            : longTermOutcome(longTermInterval);
        break;
      case "relearning":
        outcome = stepOutcome(
          "relearning",
          card.learningStep,
          resolvedParams.relearningStepsMinutes,
          rating,
          longTermInterval,
        );
        break;
    }

    return {
      stability,
      difficulty,
      elapsedDays,
      scheduledDays: outcome.intervalDays,
      reps: rating === 1 ? 0 : card.reps + 1,
      lapses: rating === 1 ? card.lapses + 1 : card.lapses,
      state: outcome.state,
      learningStep: outcome.learningStep,
      dueAt: addDays(reviewTime, outcome.intervalDays),
      lastReviewAt: reviewTime,
    };
  }

  return { schedule, params: resolvedParams };
}
