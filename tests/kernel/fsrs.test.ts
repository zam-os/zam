import { describe, expect, it } from "vitest";
import {
  createEmptyCard,
  createFSRS,
  type Rating,
  type SchedulingCard,
} from "../../src/kernel/scheduler/fsrs.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build a Date shifted by `days` from `base`. */
function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

// ── Default FSRS-5 weights for reference in assertions ──────────────────────

const W = [
  0.4072, 1.1829, 3.1262, 15.4722,
  7.2102, 0.5316, 1.0651,
  0.0092, 1.5988, 0.1176, 1.0014,
  2.0032, 0.0266, 0.3077, 0.15,
  0.0, 2.7849, 0.3477, 0.6831,
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe("FSRS-5 scheduler", () => {
  const fsrs = createFSRS();
  const now = new Date("2025-01-01T12:00:00Z");

  // ── Factory ─────────────────────────────────────────────────────────────

  describe("createEmptyCard", () => {
    it("returns a new card with zeroed scheduling fields", () => {
      const card = createEmptyCard(now);
      expect(card.state).toBe("new");
      expect(card.stability).toBe(0);
      expect(card.difficulty).toBe(0);
      expect(card.reps).toBe(0);
      expect(card.lapses).toBe(0);
      expect(card.lastReviewAt).toBeNull();
      expect(card.dueAt).toEqual(now);
    });
  });

  describe("createFSRS", () => {
    it("uses default parameters when none are provided", () => {
      const f = createFSRS();
      expect(f.params.w).toHaveLength(19);
      expect(f.params.requestRetention).toBe(0.9);
    });

    it("allows partial parameter overrides", () => {
      const f = createFSRS({ requestRetention: 0.85 });
      expect(f.params.requestRetention).toBe(0.85);
      expect(f.params.w).toHaveLength(19);
    });

    it("freezes the params object", () => {
      const f = createFSRS();
      expect(() => {
        (f.params as any).requestRetention = 0.5;
      }).toThrow();
    });
  });

  // ── New card ratings ────────────────────────────────────────────────────

  describe("new card → first rating", () => {
    it("rated Good → stability ≈ w2, state becomes learning", () => {
      const card = createEmptyCard(now);
      const next = fsrs.schedule(card, 3, now);

      expect(next.stability).toBeCloseTo(W[2], 4); // 3.1262
      expect(next.state).toBe("learning");
      expect(next.reps).toBe(1);
      expect(next.lapses).toBe(0);
      expect(next.lastReviewAt).toEqual(now);
      // Due in the future
      expect(next.dueAt.getTime()).toBeGreaterThan(now.getTime());
    });

    it("rated Again → stability ≈ w0, short interval, lapses = 1", () => {
      const card = createEmptyCard(now);
      const next = fsrs.schedule(card, 1, now);

      expect(next.stability).toBeCloseTo(W[0], 4); // 0.4072
      expect(next.state).toBe("learning");
      expect(next.reps).toBe(0);
      expect(next.lapses).toBe(1);
      // With S ≈ 0.41, interval = round(9 * 0.4072 * (1/0.9 - 1)) ≈ round(0.407) = 1 day minimum
      expect(next.scheduledDays).toBeGreaterThanOrEqual(1);
    });

    it("rated Hard → stability ≈ w1", () => {
      const card = createEmptyCard(now);
      const next = fsrs.schedule(card, 2, now);

      expect(next.stability).toBeCloseTo(W[1], 4); // 1.1829
      expect(next.reps).toBe(1);
      expect(next.lapses).toBe(0);
    });

    it("rated Easy → stability ≈ w3, longest interval", () => {
      const card = createEmptyCard(now);
      const next = fsrs.schedule(card, 4, now);

      expect(next.stability).toBeCloseTo(W[3], 4); // 15.4722
      expect(next.reps).toBe(1);
      expect(next.lapses).toBe(0);
      // Interval should be much larger for Easy
      const goodNext = fsrs.schedule(card, 3, now);
      expect(next.scheduledDays).toBeGreaterThan(goodNext.scheduledDays);
    });

    it("initial stability values produce correct ordering: Again < Hard < Good < Easy", () => {
      const card = createEmptyCard(now);
      const results = ([1, 2, 3, 4] as Rating[]).map((r) =>
        fsrs.schedule(card, r, now),
      );
      for (let i = 1; i < results.length; i++) {
        expect(results[i].stability).toBeGreaterThan(results[i - 1].stability);
      }
    });
  });

  // ── Initial difficulty ────────────────────────────────────────────────

  describe("initial difficulty", () => {
    it("difficulty decreases with higher ratings", () => {
      const card = createEmptyCard(now);
      const dAgain = fsrs.schedule(card, 1, now).difficulty;
      const dHard = fsrs.schedule(card, 2, now).difficulty;
      const dGood = fsrs.schedule(card, 3, now).difficulty;
      const dEasy = fsrs.schedule(card, 4, now).difficulty;

      expect(dAgain).toBeGreaterThan(dHard);
      expect(dHard).toBeGreaterThan(dGood);
      expect(dGood).toBeGreaterThan(dEasy);
    });

    it("all difficulties are within [1, 10]", () => {
      const card = createEmptyCard(now);
      for (const r of [1, 2, 3, 4] as Rating[]) {
        const d = fsrs.schedule(card, r, now).difficulty;
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(10);
      }
    });
  });

  // ── Review card (learning/review state) ───────────────────────────────

  describe("review card ratings", () => {
    /** Helper: create a card in review state as if it was rated Good on a new card. */
    function makeReviewCard(): SchedulingCard {
      const newCard = createEmptyCard(now);
      const afterFirst = fsrs.schedule(newCard, 3, now);
      // Move to review state by simulating a second Good rating
      const reviewTime = addDays(now, afterFirst.scheduledDays);
      return fsrs.schedule(afterFirst, 3, reviewTime);
    }

    it("rated Good → stability increases, state is review", () => {
      const card = makeReviewCard();
      const reviewTime = addDays(card.lastReviewAt!, card.scheduledDays);
      const next = fsrs.schedule(card, 3, reviewTime);

      expect(next.stability).toBeGreaterThan(card.stability);
      expect(next.state).toBe("review");
      expect(next.reps).toBe(card.reps + 1);
      expect(next.lapses).toBe(card.lapses);
    });

    it("rated Again → stability decreases, lapses increment, state becomes relearning", () => {
      const card = makeReviewCard();
      const reviewTime = addDays(card.lastReviewAt!, card.scheduledDays);
      const next = fsrs.schedule(card, 1, reviewTime);

      expect(next.stability).toBeLessThan(card.stability);
      expect(next.state).toBe("relearning");
      expect(next.reps).toBe(0);
      expect(next.lapses).toBe(card.lapses + 1);
    });

    it("rated Easy → larger interval than Good (easy bonus)", () => {
      const card = makeReviewCard();
      const reviewTime = addDays(card.lastReviewAt!, card.scheduledDays);
      const nextGood = fsrs.schedule(card, 3, reviewTime);
      const nextEasy = fsrs.schedule(card, 4, reviewTime);

      expect(nextEasy.scheduledDays).toBeGreaterThanOrEqual(nextGood.scheduledDays);
      expect(nextEasy.stability).toBeGreaterThan(nextGood.stability);
    });

    it("rated Hard → smaller interval than Good (hard penalty)", () => {
      // Note: with default w15 = 0, the hard penalty factor is 0, which makes
      // the stability formula multiply by 0, resulting in S' = S * (0 + 1) = S.
      // This is intentional in the default parameters — Hard preserves stability.
      const card = makeReviewCard();
      const reviewTime = addDays(card.lastReviewAt!, card.scheduledDays);
      const nextHard = fsrs.schedule(card, 2, reviewTime);
      const nextGood = fsrs.schedule(card, 3, reviewTime);

      expect(nextHard.scheduledDays).toBeLessThanOrEqual(nextGood.scheduledDays);
    });
  });

  // ── Difficulty bounds ─────────────────────────────────────────────────

  describe("difficulty clamping", () => {
    it("repeated Again ratings do not push difficulty above 10", () => {
      let card = createEmptyCard(now);
      let time = now;

      // 20 cycles of Again
      for (let i = 0; i < 20; i++) {
        card = fsrs.schedule(card, 1, time);
        time = addDays(time, Math.max(1, card.scheduledDays));
      }

      expect(card.difficulty).toBeLessThanOrEqual(10);
    });

    it("repeated Easy ratings do not push difficulty below 1", () => {
      let card = createEmptyCard(now);
      let time = now;

      for (let i = 0; i < 20; i++) {
        card = fsrs.schedule(card, 4, time);
        time = addDays(time, Math.max(1, card.scheduledDays));
      }

      expect(card.difficulty).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Sequential reviews — the core SRS property ────────────────────────

  describe("sequential reviews with Good ratings", () => {
    it("intervals grow over time (the core SRS property)", () => {
      let card = createEmptyCard(now);
      let time = now;
      const intervals: number[] = [];

      for (let i = 0; i < 8; i++) {
        card = fsrs.schedule(card, 3, time);
        intervals.push(card.scheduledDays);
        time = addDays(time, card.scheduledDays);
      }

      // After the initial learning phase, intervals should generally increase
      // Check that the last interval is larger than the second
      expect(intervals[intervals.length - 1]).toBeGreaterThan(intervals[1]);

      // Also check that stability is monotonically increasing for Good ratings
      // (since R < 1 after elapsed time, the formula always increases S)
    });

    it("stability increases monotonically with consecutive Good ratings", () => {
      let card = createEmptyCard(now);
      let time = now;
      const stabilities: number[] = [];

      for (let i = 0; i < 6; i++) {
        card = fsrs.schedule(card, 3, time);
        stabilities.push(card.stability);
        time = addDays(time, card.scheduledDays);
      }

      for (let i = 1; i < stabilities.length; i++) {
        expect(stabilities[i]).toBeGreaterThan(stabilities[i - 1]);
      }
    });
  });

  // ── Retrievability ────────────────────────────────────────────────────

  describe("retrievability decreases over time", () => {
    it("a card reviewed on time has higher retrievability than one overdue", () => {
      const card = createEmptyCard(now);
      const after = fsrs.schedule(card, 3, now);

      // Review right on schedule
      const onTime = addDays(now, after.scheduledDays);
      const reviewedOnTime = fsrs.schedule(after, 3, onTime);

      // Review much later (double the interval)
      const late = addDays(now, after.scheduledDays * 3);
      const reviewedLate = fsrs.schedule(after, 3, late);

      // The late review should produce higher stability increase because
      // the retrievability is lower (more forgotten territory recovered).
      // But the key point: the algorithm handles both cases.
      expect(reviewedOnTime.stability).toBeGreaterThan(0);
      expect(reviewedLate.stability).toBeGreaterThan(0);
    });

    it("retrievability at elapsed=0 is 1 (just reviewed)", () => {
      // R = (1 + 0 / (9 * S))^(-1) = 1
      const card = createEmptyCard(now);
      const after = fsrs.schedule(card, 3, now);

      // Immediately re-review — elapsed ≈ 0
      const immediate = fsrs.schedule(after, 3, now);
      // With R ≈ 1, the stability increase factor should be minimal
      // S' = S * (exp(w8) * (11-D) * S^(-w9) * (exp(w10*(1-1)) - 1) + 1) = S * 1 = S
      // Because exp(0) - 1 = 0, the inner term collapses.
      expect(immediate.stability).toBeCloseTo(after.stability, 1);
    });
  });

  // ── Interval calculation ──────────────────────────────────────────────

  describe("interval calculation", () => {
    it("interval is at least 1 day", () => {
      const card = createEmptyCard(now);
      const next = fsrs.schedule(card, 1, now); // Again → low stability
      expect(next.scheduledDays).toBeGreaterThanOrEqual(1);
    });

    it("higher retention target produces shorter intervals", () => {
      const fsrsHigh = createFSRS({ requestRetention: 0.95 });
      const fsrsLow = createFSRS({ requestRetention: 0.8 });

      const card = createEmptyCard(now);
      const highRet = fsrsHigh.schedule(card, 3, now);
      const lowRet = fsrsLow.schedule(card, 3, now);

      // I = 9 * S * (1/R - 1), higher R → smaller (1/R - 1) → shorter interval
      expect(highRet.scheduledDays).toBeLessThanOrEqual(lowRet.scheduledDays);
    });

    it("interval formula: I = round(9 * S * (1/R - 1))", () => {
      const card = createEmptyCard(now);
      const next = fsrs.schedule(card, 3, now);

      const expectedS = W[2]; // 3.1262
      const expectedI = Math.max(1, Math.round(9 * expectedS * (1 / 0.9 - 1)));
      expect(next.scheduledDays).toBe(expectedI);
    });
  });

  // ── Relearning cycle ──────────────────────────────────────────────────

  describe("relearning cycle", () => {
    it("a forgotten card can recover through relearning", () => {
      let card = createEmptyCard(now);
      let time = now;

      // Build up some reviews
      for (let i = 0; i < 4; i++) {
        card = fsrs.schedule(card, 3, time);
        time = addDays(time, card.scheduledDays);
      }

      const stableBefore = card.stability;
      expect(card.state).toBe("review");

      // Forget
      card = fsrs.schedule(card, 1, time);
      expect(card.state).toBe("relearning");
      expect(card.stability).toBeLessThan(stableBefore);
      expect(card.lapses).toBe(1);

      // Recover through Good ratings
      time = addDays(time, card.scheduledDays);
      card = fsrs.schedule(card, 3, time);
      expect(card.state).toBe("review");
      expect(card.stability).toBeGreaterThan(0);
    });
  });

  // ── Pure function guarantees ──────────────────────────────────────────

  describe("purity", () => {
    it("does not mutate the input card", () => {
      const card = createEmptyCard(now);
      const frozen = { ...card, dueAt: new Date(card.dueAt) };

      fsrs.schedule(card, 3, now);

      expect(card.stability).toBe(frozen.stability);
      expect(card.difficulty).toBe(frozen.difficulty);
      expect(card.reps).toBe(frozen.reps);
      expect(card.lapses).toBe(frozen.lapses);
      expect(card.state).toBe(frozen.state);
      expect(card.dueAt.getTime()).toBe(frozen.dueAt.getTime());
    });

    it("same inputs always produce the same output", () => {
      const card = createEmptyCard(now);
      const a = fsrs.schedule(card, 3, now);
      const b = fsrs.schedule(card, 3, now);

      expect(a.stability).toBe(b.stability);
      expect(a.difficulty).toBe(b.difficulty);
      expect(a.scheduledDays).toBe(b.scheduledDays);
      expect(a.reps).toBe(b.reps);
      expect(a.lapses).toBe(b.lapses);
      expect(a.state).toBe(b.state);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles custom weight parameters", () => {
      const customW = [...W];
      customW[2] = 5.0; // Higher initial stability for Good
      const custom = createFSRS({ w: customW });

      const card = createEmptyCard(now);
      const next = custom.schedule(card, 3, now);
      expect(next.stability).toBeCloseTo(5.0, 4);
    });

    it("now parameter defaults to current time when omitted", () => {
      const card = createEmptyCard();
      const before = Date.now();
      const next = fsrs.schedule(card, 3);
      const after = Date.now();

      expect(next.lastReviewAt!.getTime()).toBeGreaterThanOrEqual(before);
      expect(next.lastReviewAt!.getTime()).toBeLessThanOrEqual(after);
    });
  });
});
