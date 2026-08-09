import { describe, expect, it } from "vitest";
import {
  createEmptyCard,
  createFSRS,
  type Rating,
  type SchedulingCard,
} from "../../src/kernel/scheduler/fsrs.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function addDays(base: Date, days: number): Date {
  return new Date(base.getTime() + days * DAY_MS);
}

function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * MINUTE_MS);
}

function minutesAsDays(minutes: number): number {
  return minutes / (24 * 60);
}

// Official FSRS-6 defaults. Keep these in the tests so an accidental model
// generation change cannot masquerade as an innocuous parameter update.
const W = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722,
  0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425,
  0.0912, 0.0658, 0.1542,
];

function reviewCard(overrides: Partial<SchedulingCard> = {}): SchedulingCard {
  const now = new Date("2025-01-01T12:00:00Z");
  return {
    stability: 10,
    difficulty: 5,
    elapsedDays: 10,
    scheduledDays: 10,
    reps: 3,
    lapses: 0,
    state: "review",
    learningStep: null,
    dueAt: addDays(now, 10),
    lastReviewAt: now,
    ...overrides,
  };
}

describe("FSRS-6 scheduler", () => {
  const fsrs = createFSRS();
  const now = new Date("2025-01-01T12:00:00Z");

  describe("factory", () => {
    it("creates an immediately due new card with no active learning step", () => {
      const card = createEmptyCard(now);

      expect(card).toMatchObject({
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        state: "new",
        learningStep: null,
        dueAt: now,
        lastReviewAt: null,
      });
    });

    it("uses the official 21 FSRS-6 weights and useful short-step defaults", () => {
      expect(fsrs.params.w).toEqual(W);
      expect(fsrs.params.requestRetention).toBe(0.9);
      expect(fsrs.params.learningStepsMinutes).toEqual([1, 10]);
      expect(fsrs.params.relearningStepsMinutes).toEqual([10]);
      expect(fsrs.params.maximumIntervalDays).toBe(36_500);
    });

    it("accepts partial overrides without sharing mutable arrays", () => {
      const weights = [...W];
      const learningStepsMinutes = [2, 20];
      const custom = createFSRS({
        w: weights,
        requestRetention: 0.85,
        learningStepsMinutes,
      });

      weights[0] = 99;
      learningStepsMinutes[0] = 99;

      expect(custom.params.w[0]).toBe(W[0]);
      expect(custom.params.learningStepsMinutes).toEqual([2, 20]);
      expect(custom.params.requestRetention).toBe(0.85);
    });

    it("rejects invalid FSRS parameters and step sequences", () => {
      expect(() => createFSRS({ w: W.slice(0, 20) })).toThrow(/21/);
      expect(() => createFSRS({ requestRetention: 1 })).toThrow(/retention/i);
      expect(() =>
        createFSRS({ learningStepsMinutes: [10, 1] }),
      ).toThrow(/ascending/i);
      expect(() =>
        createFSRS({ relearningStepsMinutes: [0] }),
      ).toThrow(/positive/i);
    });

    it("freezes the resolved parameters and their arrays", () => {
      expect(() => {
        (fsrs.params as { requestRetention: number }).requestRetention = 0.5;
      }).toThrow();
      expect(() => {
        (fsrs.params.w as number[])[0] = 99;
      }).toThrow();
    });
  });

  describe("new-card learning steps", () => {
    it("Again schedules the first learning step in one minute", () => {
      const next = fsrs.schedule(createEmptyCard(now), 1, now);

      expect(next.stability).toBeCloseTo(W[0], 6);
      expect(next.state).toBe("learning");
      expect(next.learningStep).toBe(0);
      expect(next.scheduledDays).toBeCloseTo(minutesAsDays(1), 10);
      expect(next.dueAt).toEqual(addMinutes(now, 1));
      expect(next.reps).toBe(0);
      expect(next.lapses).toBe(1);
    });

    it("Hard stays on the first step and uses the midpoint to the next step", () => {
      const next = fsrs.schedule(createEmptyCard(now), 2, now);

      expect(next.stability).toBeCloseTo(W[1], 6);
      expect(next.state).toBe("learning");
      expect(next.learningStep).toBe(0);
      expect(next.scheduledDays).toBeCloseTo(minutesAsDays(5.5), 10);
      expect(next.dueAt).toEqual(addMinutes(now, 5.5));
    });

    it("Good advances to the ten-minute step", () => {
      const next = fsrs.schedule(createEmptyCard(now), 3, now);

      expect(next.stability).toBeCloseTo(W[2], 6);
      expect(next.state).toBe("learning");
      expect(next.learningStep).toBe(1);
      expect(next.scheduledDays).toBeCloseTo(minutesAsDays(10), 10);
      expect(next.dueAt).toEqual(addMinutes(now, 10));
      expect(next.reps).toBe(1);
    });

    it("Easy skips the remaining steps and graduates to review", () => {
      const next = fsrs.schedule(createEmptyCard(now), 4, now);

      expect(next.stability).toBeCloseTo(W[3], 6);
      expect(next.state).toBe("review");
      expect(next.learningStep).toBeNull();
      expect(next.scheduledDays).toBe(8);
      expect(next.dueAt).toEqual(addDays(now, 8));
    });

    it("Good on the final learning step graduates using same-day stability", () => {
      const first = fsrs.schedule(createEmptyCard(now), 3, now);
      const reviewTime = addMinutes(now, 10);
      const next = fsrs.schedule(first, 3, reviewTime);
      const increase = Math.max(
        Math.exp(W[17] * (3 - 3 + W[18])) * first.stability ** -W[19],
        1,
      );

      expect(next.stability).toBeCloseTo(first.stability * increase, 10);
      expect(next.state).toBe("review");
      expect(next.learningStep).toBeNull();
      expect(next.scheduledDays).toBeGreaterThanOrEqual(1);
    });

    it("Again on a later learning step returns to the first step", () => {
      const first = fsrs.schedule(createEmptyCard(now), 3, now);
      const next = fsrs.schedule(first, 1, addMinutes(now, 10));

      expect(next.state).toBe("learning");
      expect(next.learningStep).toBe(0);
      expect(next.dueAt).toEqual(addMinutes(now, 11));
    });

    it("honours custom learning steps", () => {
      const custom = createFSRS({ learningStepsMinutes: [2, 20] });
      const next = custom.schedule(createEmptyCard(now), 3, now);

      expect(next.learningStep).toBe(1);
      expect(next.dueAt).toEqual(addMinutes(now, 20));
    });
  });

  describe("FSRS-6 memory model", () => {
    it("initial difficulty falls as the rating rises and stays in [1, 10]", () => {
      const difficulties = ([1, 2, 3, 4] as Rating[]).map(
        (rating) => fsrs.schedule(createEmptyCard(now), rating, now).difficulty,
      );

      expect(difficulties[0]).toBeGreaterThan(difficulties[1]);
      expect(difficulties[1]).toBeGreaterThan(difficulties[2]);
      expect(difficulties[2]).toBeGreaterThan(difficulties[3]);
      for (const difficulty of difficulties) {
        expect(difficulty).toBeGreaterThanOrEqual(1);
        expect(difficulty).toBeLessThanOrEqual(10);
      }
    });

    it("uses the trainable FSRS-6 forgetting curve for long-term intervals", () => {
      const next = fsrs.schedule(createEmptyCard(now), 4, now);
      const decay = W[20];
      const factor = 0.9 ** (-1 / decay) - 1;
      const expected = Math.max(
        1,
        Math.min(
          36_500,
          Math.round(
            (W[3] / factor) * (0.9 ** (-1 / decay) - 1),
          ),
        ),
      );

      expect(next.scheduledDays).toBe(expected);
    });

    it("uses short-term stability for every same-day review", () => {
      const card = reviewCard({ dueAt: addMinutes(now, 30) });
      const reviewTime = addMinutes(now, 30);
      const next = fsrs.schedule(card, 3, reviewTime);
      const increase = Math.max(
        Math.exp(W[17] * W[18]) * card.stability ** -W[19],
        1,
      );

      expect(next.elapsedDays).toBeCloseTo(30 / (24 * 60), 10);
      expect(next.stability).toBeCloseTo(card.stability * increase, 10);
    });

    it("uses the long-term recall formula after at least one day", () => {
      const card = reviewCard();
      const reviewTime = addDays(now, 10);
      const decay = W[20];
      const factor = 0.9 ** (-1 / decay) - 1;
      const retrievability =
        (1 + (factor * 10) / card.stability) ** -decay;
      const expectedStability =
        card.stability *
        (1 +
          Math.exp(W[8]) *
            (11 - card.difficulty) *
            card.stability ** -W[9] *
            (Math.exp(W[10] * (1 - retrievability)) - 1));

      const next = fsrs.schedule(card, 3, reviewTime);

      expect(retrievability).toBeCloseTo(0.9, 10);
      expect(next.stability).toBeCloseTo(expectedStability, 10);
      expect(next.state).toBe("review");
      expect(next.reps).toBe(card.reps + 1);
    });

    it("applies linear damping and Easy-target mean reversion to difficulty", () => {
      const card = reviewCard({ difficulty: 8 });
      const initialEasy = W[4] - Math.exp(W[5] * 3) + 1;
      const delta = -W[6] * (4 - 3);
      const damped = card.difficulty + ((10 - card.difficulty) * delta) / 9;
      const expected = Math.min(
        10,
        Math.max(1, W[7] * initialEasy + (1 - W[7]) * damped),
      );

      const next = fsrs.schedule(card, 4, addDays(now, 10));

      expect(next.difficulty).toBeCloseTo(expected, 10);
    });

    it("bounds post-lapse stability with the FSRS-6 short-term limit", () => {
      const card = reviewCard({ stability: 100, difficulty: 5 });
      const reviewTime = addDays(now, 100);
      const decay = W[20];
      const factor = 0.9 ** (-1 / decay) - 1;
      const retrievability =
        (1 + (factor * 100) / card.stability) ** -decay;
      const longTerm =
        W[11] *
        card.difficulty ** -W[12] *
        ((card.stability + 1) ** W[13] - 1) *
        Math.exp(W[14] * (1 - retrievability));
      const shortTermLimit = card.stability / Math.exp(W[17] * W[18]);

      const next = fsrs.schedule(card, 1, reviewTime);

      expect(next.stability).toBeCloseTo(
        Math.min(longTerm, shortTermLimit),
        10,
      );
    });

    it("caps long-term intervals at the configured maximum", () => {
      const custom = createFSRS({ maximumIntervalDays: 30 });
      const card = reviewCard({ stability: 10_000 });

      const next = custom.schedule(card, 4, addDays(now, 10_000));

      expect(next.scheduledDays).toBe(30);
    });
  });

  describe("review and relearning steps", () => {
    it("Again on a review card starts the ten-minute relearning step", () => {
      const card = reviewCard();
      const reviewTime = addDays(now, 10);
      const next = fsrs.schedule(card, 1, reviewTime);

      expect(next.state).toBe("relearning");
      expect(next.learningStep).toBe(0);
      expect(next.dueAt).toEqual(addMinutes(reviewTime, 10));
      expect(next.reps).toBe(0);
      expect(next.lapses).toBe(card.lapses + 1);
    });

    it("Hard repeats the sole relearning step after fifteen minutes", () => {
      const lapsed = fsrs.schedule(reviewCard(), 1, addDays(now, 10));
      const next = fsrs.schedule(lapsed, 2, lapsed.dueAt);

      expect(next.state).toBe("relearning");
      expect(next.learningStep).toBe(0);
      expect(next.dueAt).toEqual(addMinutes(lapsed.dueAt, 15));
    });

    it("Good completes the sole relearning step", () => {
      const lapsed = fsrs.schedule(reviewCard(), 1, addDays(now, 10));
      const next = fsrs.schedule(lapsed, 3, lapsed.dueAt);

      expect(next.state).toBe("review");
      expect(next.learningStep).toBeNull();
      expect(next.scheduledDays).toBeGreaterThanOrEqual(1);
    });

    it("graduates legacy learning state with no persisted step on Good", () => {
      const legacy = reviewCard({ state: "learning", learningStep: null });
      const next = fsrs.schedule(legacy, 3, legacy.dueAt);

      expect(next.state).toBe("review");
      expect(next.learningStep).toBeNull();
    });
  });

  describe("scheduler guarantees", () => {
    it("grows intervals across successful reviews", () => {
      let card = createEmptyCard(now);
      let reviewTime = now;
      const reviewIntervals: number[] = [];

      for (let i = 0; i < 8; i++) {
        card = fsrs.schedule(card, 3, reviewTime);
        reviewTime = card.dueAt;
        if (card.state === "review") reviewIntervals.push(card.scheduledDays);
      }

      expect(reviewIntervals.length).toBeGreaterThan(2);
      expect(reviewIntervals.at(-1)).toBeGreaterThan(reviewIntervals[0]);
    });

    it("does not mutate the input card", () => {
      const card = createEmptyCard(now);
      const frozen = structuredClone(card);

      fsrs.schedule(card, 3, now);

      expect(card).toEqual(frozen);
    });

    it("is deterministic for the same inputs", () => {
      const card = createEmptyCard(now);

      expect(fsrs.schedule(card, 3, now)).toEqual(fsrs.schedule(card, 3, now));
    });

    it("defaults the review time to the current time", () => {
      const card = createEmptyCard();
      const before = Date.now();
      const next = fsrs.schedule(card, 3);
      const after = Date.now();

      expect(next.lastReviewAt?.getTime()).toBeGreaterThanOrEqual(before);
      expect(next.lastReviewAt?.getTime()).toBeLessThanOrEqual(after);
    });
  });
});
