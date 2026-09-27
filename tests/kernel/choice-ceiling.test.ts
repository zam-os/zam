/**
 * The tap ceiling (ADR 2026-09-27 Decisions 4 and 5).
 *
 * The reference numbers come from the default FSRS-6 parameters with every
 * review answered when due; the ADR's scheduler table quotes the same values.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyTapCeiling,
  CHOICE_CEILING_DAYS,
  createFSRS,
  createToken,
  type Database,
  ensureCard,
  executeReviewAction,
  isAnswerFormat,
  isTapBounded,
  MATURE_STABILITY_DAYS,
  openDatabase,
  type Rating,
  type SchedulingCard,
} from "../../src/kernel/index.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const t0 = new Date("2026-01-01T08:00:00Z");
const fsrs = createFSRS();

function newCard(): SchedulingCard {
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: "new",
    learningStep: null,
    dueAt: t0,
    lastReviewAt: null,
  };
}

/** Answer by tap when due, `times` times, bounded like the kernel does. */
function tapPath(start: SchedulingCard, times: number, rating: Rating = 3) {
  let card = start;
  let now = start.dueAt;
  const steps: Array<{ card: SchedulingCard; intervalMs: number }> = [];
  for (let i = 0; i < times; i++) {
    const scheduled = fsrs.schedule(card, rating, now);
    const { card: next } = applyTapCeiling(fsrs, card, scheduled, now);
    steps.push({
      card: next,
      intervalMs: next.dueAt.getTime() - now.getTime(),
    });
    card = next;
    now = next.dueAt;
  }
  return steps;
}

describe("tap ceiling helpers", () => {
  it("keeps the ceiling below the maturity threshold", () => {
    expect(CHOICE_CEILING_DAYS).toBeLessThan(MATURE_STABILITY_DAYS);
  });

  it("recognises answer formats and bounds only successful taps", () => {
    expect(isAnswerFormat("recall")).toBe(true);
    expect(isAnswerFormat("options")).toBe(true);
    expect(isAnswerFormat("choice")).toBe(true);
    expect(isAnswerFormat("typed")).toBe(false);
    expect(isTapBounded("choice", 3)).toBe(true);
    expect(isTapBounded("options", 4)).toBe(true);
    expect(isTapBounded("options", 1)).toBe(false);
    expect(isTapBounded("recall", 4)).toBe(false);
  });

  it("exposes the FSRS helpers the ceiling needs", () => {
    expect(fsrs.intervalDays(20)).toBe(20);
    expect(fsrs.initialDifficulty(2)).toBeCloseTo(5.1122, 3);
    expect(fsrs.initialDifficulty(3)).toBeCloseTo(2.1181, 3);
  });
});

describe("applyTapCeiling", () => {
  it("builds a new card to the ceiling and holds it there", () => {
    const steps = tapPath(newCard(), 5);
    expect(steps.map((s) => s.intervalMs)).toEqual([
      10 * 60 * 1000,
      2 * DAY_MS,
      8 * DAY_MS,
      20 * DAY_MS,
      20 * DAY_MS,
    ]);
    expect(steps[0]!.card.state).toBe("learning");
    expect(steps[2]!.card.stability).toBeCloseTo(8, 0);
    expect(steps[3]!.card.stability).toBe(20);
    expect(steps[4]!.card.stability).toBe(20);
    for (const step of steps) {
      expect(step.card.difficulty).toBeCloseTo(5.1122, 3);
    }
  });

  it("keeps stability earned by recall but books at most the ceiling", () => {
    const mature: SchedulingCard = {
      stability: 260,
      difficulty: 4,
      elapsedDays: 260,
      scheduledDays: 260,
      reps: 6,
      lapses: 0,
      state: "review",
      learningStep: null,
      dueAt: t0,
      lastReviewAt: new Date(t0.getTime() - 260 * DAY_MS),
    };
    const steps = tapPath(mature, 3);
    for (const step of steps) {
      expect(step.card.stability).toBe(260);
      expect(step.card.difficulty).toBe(4);
      expect(step.intervalMs).toBe(20 * DAY_MS);
    }
  });

  it("gives a new card tapped and rated Easy Hard's difficulty", () => {
    const [step] = tapPath(newCard(), 1, 4);
    expect(step!.card.state).toBe("review");
    expect(step!.card.stability).toBeCloseTo(8.2956, 3);
    expect(step!.intervalMs).toBe(8 * DAY_MS);
    expect(step!.card.difficulty).toBeCloseTo(5.1122, 3);
    // Plain FSRS would have marked the card very easy.
    expect(fsrs.schedule(newCard(), 4, t0).difficulty).toBeCloseTo(1, 3);
  });

  it("reports whether it bounded anything", () => {
    const young = fsrs.schedule(newCard(), 3, t0);
    expect(applyTapCeiling(fsrs, newCard(), young, t0).ceilingApplied).toBe(
      false,
    );
    const at20: SchedulingCard = {
      ...newCard(),
      stability: 20,
      difficulty: 5.1,
      state: "review",
      reps: 4,
      dueAt: new Date(t0.getTime() + 20 * DAY_MS),
      lastReviewAt: t0,
    };
    const due = at20.dueAt;
    const scheduled = fsrs.schedule(at20, 3, due);
    expect(scheduled.stability).toBeGreaterThan(20);
    expect(applyTapCeiling(fsrs, at20, scheduled, due).ceilingApplied).toBe(
      true,
    );
  });
});

describe("review action with an answer format", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-choice-ceiling-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function freshCard(slug: string) {
    const token = await createToken(db, {
      slug,
      concept: "Brechung",
      domain: "Physik",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "learner");
    return { token, card };
  }

  it("bounds a tapped fast check the learner rated Easy", async () => {
    const { card } = await freshCard("tap-easy");
    const result = await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "learner",
      rating: 4,
      answerFormat: "options",
      now: t0,
    });
    expect(result.evaluation?.state).toBe("review");
    expect(result.evaluation?.scheduledDays).toBe(8);
    expect(result.evaluation?.difficulty).toBeCloseTo(5.1122, 3);

    const log = (await db
      .prepare("SELECT answer_format FROM review_logs WHERE card_id = ?")
      .get(card.id)) as { answer_format: string };
    expect(log.answer_format).toBe("options");

    const attempt = (await db
      .prepare("SELECT evidence FROM review_attempts WHERE card_id = ?")
      .get(card.id)) as { evidence: string };
    expect(JSON.parse(attempt.evidence)).toMatchObject({
      answerFormat: "options",
    });
  });

  it("leaves recall ratings exactly as FSRS schedules them", async () => {
    const { card } = await freshCard("recall-easy");
    const result = await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "learner",
      rating: 4,
      now: t0,
    });
    const plain = fsrs.schedule(newCard(), 4, t0);
    expect(result.evaluation?.difficulty).toBeCloseTo(plain.difficulty, 6);
    expect(result.evaluation?.stability).toBeCloseTo(plain.stability, 6);
    expect(result.evaluation?.ceilingApplied).toBe(false);

    const log = (await db
      .prepare("SELECT answer_format FROM review_logs WHERE card_id = ?")
      .get(card.id)) as { answer_format: string };
    expect(log.answer_format).toBe("recall");
  });

  it("caps a mature card answered by a tap at the ceiling", async () => {
    const { card } = await freshCard("mature-tap");
    const lastReview = new Date(t0.getTime() - 260 * DAY_MS);
    await db
      .prepare(
        `UPDATE cards
            SET stability = 260, difficulty = 4, state = 'review', reps = 6,
                scheduled_days = 260, due_at = ?, last_review_at = ?
          WHERE id = ?`,
      )
      .run(t0.toISOString(), lastReview.toISOString(), card.id);

    const result = await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "learner",
      rating: 3,
      answerFormat: "options",
      now: t0,
    });
    expect(result.evaluation?.stability).toBe(260);
    expect(result.evaluation?.scheduledDays).toBe(20);
    expect(result.evaluation?.ceilingApplied).toBe(true);
  });

  it("treats a failed tap as an ordinary lapse", async () => {
    const { card } = await freshCard("tap-miss");
    const tapped = await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "learner",
      rating: 1,
      answerFormat: "options",
      now: t0,
    });
    const plain = fsrs.schedule(newCard(), 1, t0);
    expect(tapped.evaluation?.difficulty).toBeCloseTo(plain.difficulty, 6);
    expect(tapped.evaluation?.ceilingApplied).toBe(false);
  });
});
