/**
 * Pure helpers for the field-test study prompts on mobile.
 * Mirrors desktop/src/study-offers.ts without importing the desktop module.
 */

export interface PreconditionOffer {
  atomId: string;
  title: string;
  assessmentState: "unassessed" | "buried_known" | "learning";
}

export interface PullForwardOffer {
  cardId: string;
  reason: "precondition_buried" | "future_due" | "new_in_scope";
}

export interface BonusOffer {
  atomId: string;
  title: string;
  unlockCount: number;
  restsOnTitles: string[];
}

export function matchUnassessedPrecondition(
  atomId: string | null | undefined,
  candidates: PreconditionOffer[],
): PreconditionOffer | null {
  if (!atomId) return null;
  return (
    candidates.find(
      (candidate) =>
        candidate.atomId === atomId && candidate.assessmentState === "unassessed",
    ) ?? null
  );
}

export function keepGoingCardIds(
  candidates: PullForwardOffer[],
  limit = 5,
): string[] {
  return candidates.slice(0, limit).map((candidate) => candidate.cardId);
}

export function bonusBecause(restsOnTitles: string[]): string {
  return restsOnTitles.filter((title) => title.trim().length > 0).join(", ");
}
