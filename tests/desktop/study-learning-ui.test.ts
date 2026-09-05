import { describe, expect, it } from "vitest";
import {
  acceptsTypedStudyAnswer,
  resolveStudyLearningControlState,
  shouldEvaluateStudyAnswer,
  shouldRequestDynamicStudyQuestion,
} from "../../desktop/src/study-learning-ui.js";

const readyCard = {
  learningMode: "flash" as const,
  settingsPending: false,
  hasActiveCard: true,
  cardLoadInProgress: false,
  revealInProgress: false,
  reviewActionInProgress: false,
  reviewOverlayOpen: false,
};

describe("desktop study learning controls", () => {
  it("re-enables the in-session switcher when the first card finishes loading", () => {
    expect(
      resolveStudyLearningControlState({
        ...readyCard,
        cardLoadInProgress: true,
      }).reviewDisabled,
    ).toBe(true);
    expect(resolveStudyLearningControlState(readyCard).reviewDisabled).toBe(
      false,
    );
  });

  it("keeps the switcher blocked during a save, reveal, action, or overlay", () => {
    for (const busy of [
      { settingsPending: true },
      { revealInProgress: true },
      { reviewActionInProgress: true },
      { reviewOverlayOpen: true },
      { hasActiveCard: false },
    ]) {
      expect(
        resolveStudyLearningControlState({ ...readyCard, ...busy })
          .reviewDisabled,
      ).toBe(true);
    }
  });

  it("treats both answer modes as the exclusive AI choice", () => {
    const state = resolveStudyLearningControlState({
      ...readyCard,
      learningMode: "answer_variation",
    });
    expect(state.flashSelected).toBe(false);
    expect(state.aiSelected).toBe(true);
  });

  it("keeps Flash free of typing, dynamic questions, and evaluation", () => {
    expect(acceptsTypedStudyAnswer("flash")).toBe(false);
    expect(shouldRequestDynamicStudyQuestion("flash", true)).toBe(false);
    expect(
      shouldEvaluateStudyAnswer({
        learningMode: "flash",
        evaluatorAvailable: true,
        answer: "A correct answer",
        fastCheck: false,
      }),
    ).toBe(false);
  });

  it("allows answer-mode AI work only when its other requirements are met", () => {
    expect(
      shouldEvaluateStudyAnswer({
        learningMode: "answer_feedback",
        evaluatorAvailable: true,
        answer: "A correct answer",
        fastCheck: false,
      }),
    ).toBe(true);
    expect(
      shouldEvaluateStudyAnswer({
        learningMode: "answer_feedback",
        evaluatorAvailable: true,
        answer: "",
        fastCheck: false,
      }),
    ).toBe(false);
    expect(
      shouldEvaluateStudyAnswer({
        learningMode: "answer_feedback",
        evaluatorAvailable: true,
        answer: "Option A",
        fastCheck: true,
      }),
    ).toBe(false);
  });
});
