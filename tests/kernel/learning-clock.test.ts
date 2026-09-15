import { describe, expect, it } from "vitest";
import {
  createLearningClock,
  LEARNING_FOLLOW_UP_CAP_MS,
  LEARNING_IDLE_GRACE_MS,
} from "../../src/kernel/analytics/learning-clock.js";

describe("learning clock", () => {
  it("reports 0 when it was never started, so a rating always has a number", () => {
    const clock = createLearningClock();
    expect(clock.elapsedMs(12_000)).toBe(0);
  });

  it("counts uninterrupted time from start to rating", () => {
    const clock = createLearningClock();
    clock.start(1_000);
    clock.noteActivity(4_000);
    expect(clock.elapsedMs(8_500)).toBe(7_500);
  });

  it("keeps a gap up to the idle grace and drops the rest until the next reaction", () => {
    const clock = createLearningClock({ idleGraceMs: 1_000 });
    clock.start(0);
    clock.noteActivity(400);
    // Five seconds away — only the 1s grace counts, then the clock pauses.
    clock.noteActivity(5_400);
    expect(clock.elapsedMs(5_400)).toBe(1_400);
    // Work after the pause counts again: 400 + 1000 grace + 1100.
    clock.noteActivity(6_000);
    expect(clock.elapsedMs(6_500)).toBe(2_500);
  });

  it("does not pause during an AI wait, even without learner input", () => {
    const clock = createLearningClock({ idleGraceMs: 1_000 });
    clock.start(0);
    clock.beginBusy(200);
    clock.endBusy(4_200);
    expect(clock.elapsedMs(4_200)).toBe(4_200);
  });

  it("caps one follow-up turn and still counts a later turn", () => {
    const clock = createLearningClock({
      idleGraceMs: 1_000,
      followUpCapMs: 2_000,
    });
    clock.start(0);
    clock.beginFollowUp(500);
    clock.endFollowUp(5_500);
    // 500 before the turn + 2000 cap, not the 5000 wait.
    expect(clock.elapsedMs(5_500)).toBe(2_500);

    clock.beginFollowUp(5_600);
    clock.endFollowUp(6_400);
    expect(clock.elapsedMs(6_400)).toBe(3_400);
  });

  it("applies idle again after a follow-up reply, not the two-minute cap", () => {
    const clock = createLearningClock({
      idleGraceMs: 1_000,
      followUpCapMs: 5_000,
    });
    clock.start(0);
    clock.beginFollowUp(100);
    clock.endFollowUp(400);
    clock.noteActivity(400);
    // Walks away for a long time after the reply, then rates.
    expect(clock.elapsedMs(10_400)).toBe(1_400);
  });

  it("uses the production idle and follow-up bounds by default", () => {
    const clock = createLearningClock();
    clock.start(0);
    clock.noteActivity(LEARNING_IDLE_GRACE_MS);
    clock.beginFollowUp(LEARNING_IDLE_GRACE_MS);
    clock.endFollowUp(
      LEARNING_IDLE_GRACE_MS + LEARNING_FOLLOW_UP_CAP_MS + 30_000,
    );
    expect(
      clock.elapsedMs(
        LEARNING_IDLE_GRACE_MS + LEARNING_FOLLOW_UP_CAP_MS + 30_000,
      ),
    ).toBe(LEARNING_IDLE_GRACE_MS + LEARNING_FOLLOW_UP_CAP_MS);
  });

  it("reset drops the measurement so the next card starts clean", () => {
    const clock = createLearningClock();
    clock.start(0);
    clock.noteActivity(3_000);
    clock.reset();
    expect(clock.elapsedMs(9_000)).toBe(0);
    clock.start(9_000);
    expect(clock.elapsedMs(9_400)).toBe(400);
  });
});
