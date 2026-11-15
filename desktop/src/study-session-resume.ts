export type ActiveCardNewBudget = "none" | "new" | "extra_new";

export interface PausedAtlasRegion<Lens extends string = string> {
  lens: Lens;
  key: string;
  practise: number;
  practiceSince: string | null;
}

export interface StudySessionSnapshot<Lens extends string = string> {
  sessionId: string | null;
  startedDue: number;
  cardsReviewed: number;
  cardsRemaining: number;
  newRemaining: number;
  extraNewRemaining: number;
  choiceReady: number;
  bonusIgnored: boolean;
  ratings: Record<1 | 2 | 3 | 4, number>;
  done: number;
  assessedAtoms: string[];
  atlasRegion: PausedAtlasRegion<Lens> | null;
}

export interface SnapshotInput<Lens extends string = string>
  extends StudySessionSnapshot<Lens> {
  hasUnratedActiveCard: boolean;
  consumedReviewSlot: boolean;
  consumedNewBudget: ActiveCardNewBudget;
}

/**
 * Capture the active study session when jumping to the full editor.
 *
 * Presenting a card decrements the session's remaining counters before a
 * rating is recorded. Leaving mid-card without rating restores that card's
 * review (and new-card) slot so resuming loads the next card even on the
 * final card of the budget and keeps progress numbers aligned.
 */
export function createPausedStudySession<Lens extends string = string>(
  input: SnapshotInput<Lens>,
): StudySessionSnapshot<Lens> {
  const rollbackReview =
    input.hasUnratedActiveCard && input.consumedReviewSlot ? 1 : 0;
  return {
    sessionId: input.sessionId,
    startedDue: input.startedDue,
    cardsReviewed: input.hasUnratedActiveCard
      ? Math.max(0, input.cardsReviewed - 1)
      : input.cardsReviewed,
    cardsRemaining: input.cardsRemaining + rollbackReview,
    newRemaining:
      input.newRemaining +
      (input.hasUnratedActiveCard && input.consumedNewBudget === "new" ? 1 : 0),
    extraNewRemaining:
      input.extraNewRemaining +
      (input.hasUnratedActiveCard && input.consumedNewBudget === "extra_new"
        ? 1
        : 0),
    choiceReady: input.choiceReady,
    bonusIgnored: input.bonusIgnored,
    ratings: { ...input.ratings },
    done: input.done,
    assessedAtoms: [...input.assessedAtoms],
    atlasRegion: input.atlasRegion ? { ...input.atlasRegion } : null,
  };
}
