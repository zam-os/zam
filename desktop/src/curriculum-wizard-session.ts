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
