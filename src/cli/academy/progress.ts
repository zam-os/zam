import type { EnrolBundledCellProgress } from "../../kernel/index.js";

interface AcademyProgressEvent extends EnrolBundledCellProgress {
  type: "academy-progress";
  cellId: string;
}

/** Immediate first/last counts; intermediate updates at most ten times a second. */
export function academyProgress(
  cellId: string,
  emit: (event: AcademyProgressEvent) => void,
): (progress: EnrolBundledCellProgress) => void {
  let lastAt = 0;
  return (progress) => {
    const now = Date.now();
    if (
      progress.done === 0 ||
      progress.done === progress.total ||
      now - lastAt >= 100
    ) {
      lastAt = now;
      emit({ type: "academy-progress", cellId, ...progress });
    }
  };
}
