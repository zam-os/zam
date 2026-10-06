/**
 * Pure helpers for the field-test study prompts on mobile.
 * Mirrors desktop/src/study-offers.ts without importing the desktop module.
 */

export interface PreconditionOffer {
  atomId: string;
  title: string;
  assessmentState: "unassessed" | "buried_known" | "ready" | "learning";
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

/**
 * Bonus items the learner kept from their own imports (ADR 2026-10-05
 * Decision 6): offered once the due queue is done, before the atom bonus.
 * Mirrors `importBonusOffer` in desktop/src/study-offers.ts.
 */
export interface ImportBonusItem {
  tokenId: string;
  title: string;
  sourceId: string;
  sourceTitle: string | null;
}

export interface ImportBonusOffer {
  sourceTitle: string | null;
  tokenIds: string[];
  titles: string[];
}

/** A few items from the newest import that still holds any. */
export function importBonusOffer(
  items: ImportBonusItem[],
  limit = 2,
): ImportBonusOffer | null {
  const first = items[0];
  if (!first) return null;
  const fromImport = items
    .filter((item) => item.sourceId === first.sourceId)
    .slice(0, limit);
  return {
    sourceTitle: first.sourceTitle,
    tokenIds: fromImport.map((item) => item.tokenId),
    titles: fromImport.map((item) => item.title),
  };
}
