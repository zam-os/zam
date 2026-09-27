export type StudyLearningMode =
  | "flash"
  | "choice"
  | "answer_feedback"
  | "answer_variation"
  | "auto";

/**
 * The format Auto resolved for the current card (ADR 2026-09-27 Decision 8):
 * a choice while the card is new, then free recall as an AI-evaluated answer
 * or as Flash.
 */
export type AutoCardFormat = "choice" | "answer" | "flash";

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
  /** The mode whose switcher segment is checked. */
  selectedMode: StudyLearningMode;
  flashSelected: boolean;
  /** One of the two answer modes, which share the 💬 segment. */
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
  return {
    selectedMode: input.learningMode,
    flashSelected: input.learningMode === "flash",
    aiSelected:
      input.learningMode === "answer_feedback" ||
      input.learningMode === "answer_variation",
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

/**
 * Whether the learner types (or speaks) an answer. Flash and Choice never ask
 * for typing; Auto does only once a card is asked as an answer.
 */
export function acceptsTypedStudyAnswer(
  mode: StudyLearningMode,
  autoFormat?: AutoCardFormat,
): boolean {
  if (mode === "flash" || mode === "choice") return false;
  if (mode === "auto") return autoFormat === "answer";
  return true;
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
  /** Auto's format for the current card. */
  autoFormat?: AutoCardFormat;
}): boolean {
  return (
    acceptsTypedStudyAnswer(input.learningMode, input.autoFormat) &&
    input.evaluatorAvailable &&
    input.answer.length > 0 &&
    !input.fastCheck
  );
}
