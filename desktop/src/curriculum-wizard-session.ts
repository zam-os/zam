/**
 * Generation guard for the curriculum wizard.
 * Cancel/reopen bumps the generation so in-flight bridge work is ignored.
 */
export class CurriculumWizardSession {
  private generation = 0;

  /** Start a new wizard visit (open or full reset). */
  begin(): number {
    this.generation += 1;
    return this.generation;
  }

  /** Invalidate in-flight work (cancel / close overlay). */
  invalidate(): number {
    this.generation += 1;
    return this.generation;
  }

  snapshot(): number {
    return this.generation;
  }

  isStale(snapshot: number): boolean {
    return snapshot !== this.generation;
  }
}

interface ToggleableClassList {
  add(token: string): void;
  remove(token: string): void;
}

interface DisableableControl {
  disabled: boolean;
}

/** Restore controls that may have been left busy by a canceled/stale run. */
export function resetCurriculumWizardTransientUi(input: {
  buttons: DisableableControl[];
  progressContainer: { classList: ToggleableClassList };
  stepBody: { classList: ToggleableClassList };
}): void {
  for (const button of input.buttons) button.disabled = false;
  input.progressContainer.classList.add("hidden");
  input.stepBody.classList.remove("hidden");
}

/** Apply the card-preview bulk selection without replacing item identities. */
export function setCurriculumPreviewSelection<T extends { selected: boolean }>(
  items: T[],
  selected: boolean,
): void {
  for (const item of items) item.selected = selected;
}

export function areAllCurriculumPreviewItemsSelected(
  items: Array<{ selected: boolean }>,
): boolean {
  return items.length > 0 && items.every((item) => item.selected);
}

function curriculumCategorySegment(value: string): string {
  return value.trim().split("/").join("／");
}

/** Compact learner-facing hierarchy: subject / grade / curriculum topic. */
export function buildCurriculumCategoryPath(input: {
  subject: string;
  grade: string;
  topic: string;
}): string {
  return [input.subject, input.grade, input.topic]
    .map(curriculumCategorySegment)
    .filter(Boolean)
    .join("/");
}

/** A bundled cell offered in place of the generic curriculum import. */
export interface BundledCellOffer {
  id: string;
  title: string;
  gradeLabel: string;
  description: string;
  atomCount: number;
  enrolled: boolean;
}

/**
 * Which cells the wizard should offer instead of its own topic list.
 *
 * ADR 2026-08-14 Decision 10 gives the cell precedence, but only a *verdict*
 * may suppress the generic path. A failed bridge call, an older CLI that does
 * not understand the scope flags, or an unscoped answer all produce an empty
 * list — and reading "empty" as "no cell exists here" would silently hand the
 * learner the weaker import at exactly the moment a reviewed cell was
 * available. So the list counts only when `needsGenericImport` is explicitly
 * false.
 */
export function coveringCellsFromResponse(response: unknown): BundledCellOffer[] {
  if (!response || typeof response !== "object") return [];
  const payload = response as {
    needsGenericImport?: unknown;
    cells?: unknown;
  };
  if (payload.needsGenericImport !== false) return [];
  if (!Array.isArray(payload.cells)) return [];
  return payload.cells.filter(
    (cell): cell is BundledCellOffer =>
      !!cell &&
      typeof cell === "object" &&
      typeof (cell as BundledCellOffer).id === "string" &&
      typeof (cell as BundledCellOffer).title === "string",
  );
}
