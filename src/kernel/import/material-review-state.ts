/**
 * The review list's state, shared by every surface that shows it (ADR
 * 2026-10-05 Decisions 5, 7, 8): the desktop Studio, which reads rows from
 * the bridge, and Mobile, which matches on the device. The CLI uses the area
 * grouping when it builds the rows.
 *
 * Pure and free of imports with side effects: no DOM, no i18n, no Node
 * built-ins. The words and the DOM stay with each app. Rows are typed by
 * their shape, so the kernel's rows and the bridge's wire rows both fit.
 */

export type MaterialReviewChoice = "yes" | "bonus" | "no";

/** Row id → the learner's choice; `null` means "not chosen". */
export type MaterialChoices = Record<string, MaterialReviewChoice | null>;

/** What the rules need to know about a review row. */
export type MaterialReviewRowShape =
  | {
      kind: "proposal";
      id: string;
      proposalIndex: number;
      preset: MaterialReviewChoice | null;
    }
  | {
      kind: "existing";
      id: string;
      besideProposal: number;
      preset: MaterialReviewChoice | null;
      held: boolean;
    }
  | { kind: "continuation"; id: string; preset: MaterialReviewChoice | null };

/** Above this many choosable rows, rows preset to Bonus start collapsed. */
export const COLLAPSE_BONUS_AFTER = 12;

/** A held existing item is information, not a choice. */
export function isChoosable(row: MaterialReviewRowShape): boolean {
  return !(row.kind === "existing" && row.held);
}

/** Every choosable row starts on its preset. */
export function initialChoices(
  rows: MaterialReviewRowShape[],
): MaterialChoices {
  const choices: MaterialChoices = {};
  for (const row of rows) {
    if (isChoosable(row)) choices[row.id] = row.preset;
  }
  return choices;
}

export interface ConfirmCounts {
  yes: number;
  bonus: number;
  /** Rows without a choice, or with No. */
  notSaved: number;
}

/** What the confirm button says it will do — unchosen rows never vanish silently. */
export function confirmCounts(
  rows: MaterialReviewRowShape[],
  choices: MaterialChoices,
): ConfirmCounts {
  const counts: ConfirmCounts = { yes: 0, bonus: 0, notSaved: 0 };
  for (const row of rows) {
    if (!isChoosable(row)) continue;
    const choice = choices[row.id];
    if (choice === "yes") counts.yes++;
    else if (choice === "bonus") counts.bonus++;
    else counts.notSaved++;
  }
  return counts;
}

/** The decisions to commit: the rows with a choice. */
export function decisionsOf(
  choices: MaterialChoices,
): Record<string, MaterialReviewChoice> {
  const decisions: Record<string, MaterialReviewChoice> = {};
  for (const [rowId, choice] of Object.entries(choices)) {
    if (choice) decisions[rowId] = choice;
  }
  return decisions;
}

/** Proposed area → confirmed area, for the areas the learner changed. */
export function changedAreas(
  edited: Record<string, string>,
): Record<string, string> {
  const changed: Record<string, string> = {};
  for (const [proposed, value] of Object.entries(edited)) {
    const confirmed = value.trim();
    if (confirmed.length > 0 && confirmed !== proposed) {
      changed[proposed] = confirmed;
    }
  }
  return changed;
}

export interface MaterialAreaGroup {
  /** The area as proposed; the key a confirmed rename is sent under. */
  area: string;
  proposalIndexes: number[];
}

/** The proposals per proposed area, in the order the areas first appear. */
export function materialAreaGroups(
  proposals: ReadonlyArray<{ area: string }>,
): MaterialAreaGroup[] {
  const groups = new Map<string, number[]>();
  proposals.forEach((proposal, index) => {
    const list = groups.get(proposal.area) ?? [];
    list.push(index);
    groups.set(proposal.area, list);
  });
  return [...groups].map(([area, proposalIndexes]) => ({
    area,
    proposalIndexes,
  }));
}

export interface ReviewGroup<R> {
  area: string;
  /** Proposal rows, each followed by the existing item beside it. */
  rows: R[];
}

/** Rows per proposed area, then what the material leads to. */
export function reviewGroups<R extends MaterialReviewRowShape>(
  rows: R[],
  areaGroups: MaterialAreaGroup[],
): { groups: ReviewGroup<R>[]; continuations: R[] } {
  const beside = new Map<number, R>();
  const own = new Map<number, R>();
  const continuations: R[] = [];
  for (const row of rows) {
    if (row.kind === "proposal") own.set(row.proposalIndex, row);
    else if (row.kind === "existing") beside.set(row.besideProposal, row);
    else continuations.push(row);
  }
  const groups = areaGroups.map((group) => {
    const grouped: R[] = [];
    for (const index of group.proposalIndexes) {
      const proposal = own.get(index);
      if (proposal) grouped.push(proposal);
      const match = beside.get(index);
      if (match) grouped.push(match);
    }
    return { area: group.area, rows: grouped };
  });
  return { groups, continuations };
}

/** Long lists fold their Bonus rows, so the list stays readable. */
export function startsCollapsed(
  row: MaterialReviewRowShape,
  choices: MaterialChoices,
  choosableCount: number,
): boolean {
  return choosableCount > COLLAPSE_BONUS_AFTER && choices[row.id] === "bonus";
}

/** "chemie · Stoffe und Stoffeigenschaften · Realschule, Anfangsunterricht" */
export function analysisLine(analysis: {
  subjects: string[];
  topic: string;
  level: string;
}): string {
  return [analysis.subjects.join(", "), analysis.topic, analysis.level]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" · ");
}
