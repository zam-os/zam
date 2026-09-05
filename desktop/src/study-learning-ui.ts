export type StudyLearningMode =
  | "flash"
  | "answer_feedback"
  | "answer_variation";

export interface StudyLearningControlInput {
  learningMode: StudyLearningMode;
  settingsPending: boolean;
  hasActiveCard: boolean;
  cardLoadInProgress: boolean;
  revealInProgress: boolean;
  reviewActionInProgress: boolean;
  reviewOverlayOpen: boolean;
}

export interface StudyLearningControlState {
  flashSelected: boolean;
  aiSelected: boolean;
  settingsDisabled: boolean;
  reviewDisabled: boolean;
}

/**
 * Resolve the two learning-mode controls without touching the DOM.
 *
 * Card loading is intentionally part of this state: the active-card renderer
 * runs before its enclosing load finishes, and the final state transition must
 * therefore be able to turn the in-session buttons back on.
 */
export function resolveStudyLearningControlState(
  input: StudyLearningControlInput,
): StudyLearningControlState {
  const flashSelected = input.learningMode === "flash";
  return {
    flashSelected,
    aiSelected: !flashSelected,
    settingsDisabled: input.settingsPending,
    reviewDisabled:
      input.settingsPending ||
      !input.hasActiveCard ||
      input.cardLoadInProgress ||
      input.revealInProgress ||
      input.reviewActionInProgress ||
      input.reviewOverlayOpen,
  };
}

export function acceptsTypedStudyAnswer(mode: StudyLearningMode): boolean {
  return mode !== "flash";
}

export function shouldRequestDynamicStudyQuestion(
  mode: StudyLearningMode,
  requested: boolean,
): boolean {
  return acceptsTypedStudyAnswer(mode) && requested;
}

export function shouldEvaluateStudyAnswer(input: {
  learningMode: StudyLearningMode;
  evaluatorAvailable: boolean;
  answer: string;
  fastCheck: boolean;
}): boolean {
  return (
    acceptsTypedStudyAnswer(input.learningMode) &&
    input.evaluatorAvailable &&
    input.answer.length > 0 &&
    !input.fastCheck
  );
}
