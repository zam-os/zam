import { describe, expect, it } from "vitest";
import { appendGoalCards } from "../../desktop/src/onboarding.js";

// The goal flow drafts cards one topic at a time; neighbouring topics can
// propose the same card, which the preview must show once.
describe("appendGoalCards", () => {
  it("appends each topic's proposals as selected preview cards", () => {
    const first = appendGoalCards(
      [],
      [{ question: "What is a barre chord?", concept: "A chord fretted..." }],
    );
    const both = appendGoalCards(first, [
      { question: "Name the open chords.", concept: "C, A, G, E, D" },
    ]);

    expect(both.map((card) => card.question)).toEqual([
      "What is a barre chord?",
      "Name the open chords.",
    ]);
    expect(both.every((card) => card.selected)).toBe(true);
    expect(both[1].proposal).toMatchObject({ concept: "C, A, G, E, D" });
  });

  it("skips a card another topic already drafted", () => {
    const first = appendGoalCards(
      [],
      [
        {
          question: "What is a barre chord?",
          concept: "One finger, all frets",
        },
      ],
    );
    const again = appendGoalCards(first, [
      {
        question: " what is a BARRE chord? ",
        concept: "one finger, all frets",
      },
      { question: "What is a capo?", concept: "A clamp" },
    ]);

    expect(again.map((card) => card.question)).toEqual([
      "What is a barre chord?",
      "What is a capo?",
    ]);
  });
});
