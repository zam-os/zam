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