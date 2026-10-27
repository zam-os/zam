import type { EnrolBundledCellProgress } from "../../src/kernel/library/bundled-cells.js";

export type CellImportProgressKey =
  | "academy_import_preparing"
  | "academy_import_installing"
  | "academy_import_enrolling"
  | "academy_import_saving"
  | "academy_import_complete";

/** Two counted passes; only a successful command may fill the bar. */
export function cellImportProgressState(
  progress: EnrolBundledCellProgress | null,
  complete = false,
): {
  key: CellImportProgressKey;
  value: number | null;
  done: number;
  total: number;
} {
  if (complete)
    return { key: "academy_import_complete", value: 1, done: 0, total: 0 };
  if (!progress)
    return { key: "academy_import_preparing", value: null, done: 0, total: 0 };
  const { phase, done, total } = progress;
  const fraction = total > 0 ? Math.min(1, Math.max(0, done / total)) : 1;
  return {
    key: done === total ? "academy_import_saving" : `academy_import_${phase}`,
    value: Math.min(0.99, (phase === "installing" ? 0 : 0.5) + fraction / 2),
    done,
    total,
  };
}

/** Shared by Desktop and Mobile, with each client's translations. */
export function createCellImportProgress(
  text: (
    key: CellImportProgressKey,
    counts: { done: number; total: number },
  ) => string,
) {
  const element = document.createElement("div");
  element.style.width = "100%";
  const label = document.createElement("p");
  label.style.margin = "0 0 6px";
  label.style.fontSize = "0.82rem";
  label.setAttribute("role", "status");
  label.setAttribute("aria-live", "polite");
  const bar = document.createElement("progress");
  bar.max = 1;
  bar.style.width = "100%";
  bar.style.height = "12px";
  bar.style.accentColor = "var(--clr-primary, #5b71da)";
  element.append(label, bar);

  function render(progress: EnrolBundledCellProgress | null, complete = false) {
    const state = cellImportProgressState(progress, complete);
    const message = text(state.key, state);
    label.textContent = message;
    bar.setAttribute("aria-label", message);
    if (state.value === null) bar.removeAttribute("value");
    else bar.value = state.value;
    bar.setAttribute("aria-busy", String(!complete));
  }
  render(null);
  return {
    element,
    update: (progress: EnrolBundledCellProgress) => render(progress),
    finish: () => render(null, true),
    remove: () => element.remove(),
  };
}
