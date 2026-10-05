/**
 * Pure helpers for the field-test study prompts: precondition self-assessment,
 * empty-queue keep-going, and the bonus offers. No DOM, no Tauri — same
 * contract style as study-card-actions.ts.
 */

export type BridgeCall = { cmd: string; args: string[] };

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
        candidate.atomId === atomId &&
        candidate.assessmentState === "unassessed",
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

export function preconditionsListCommand(): BridgeCall {
  return { cmd: "preconditions-get", args: [] };
}

export function preconditionAssessCommand(
  atomId: string,
  decision: "known" | "learn",
): BridgeCall {
  return { cmd: "precondition-assess", args: [atomId, decision] };
}

export function pullForwardCandidatesCommand(limit = 5): BridgeCall {
  return {
    cmd: "pull-forward-candidates",
    args: ["--limit", String(limit)],
  };
}

export function pullForwardExecuteCommand(cardIds: string[]): BridgeCall {
  return { cmd: "pull-forward-execute", args: ["--cards", ...cardIds] };
}

export function bonusCandidatesCommand(limit = 1): BridgeCall {
  return { cmd: "bonus-candidates-list", args: ["--limit", String(limit)] };
}

export function bonusEnrolCommand(atomId: string): BridgeCall {
  return { cmd: "bonus-atom-enrol", args: [atomId] };
}

/**
 * Bonus items the learner kept from their own imports (ADR 2026-10-05
 * Decision 6): offered once the due queue is done, before the atom bonus.
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

export function importBonusCommand(limit = 2): BridgeCall {
  return {
    cmd: "material-import-bonus-list",
    args: ["--limit", String(limit)],
  };
}

export function importBonusTakeCommand(tokenId: string): BridgeCall {
  return { cmd: "material-import-bonus-take", args: ["--token", tokenId] };
}

/**
 * A few items from the newest import that still holds any, so the offer can
 * name what they belong to. Items from older imports wait for the next one.
 */
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
