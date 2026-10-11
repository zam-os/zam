/**
 * Goal import as a dialog of its own.
 *
 * The goal page (define a goal, let ZAM propose one decomposition level at a
 * time, pick the cards) used to be reachable only inside the first-run flow:
 * Learning Content's "Goal import" reopened that flow at its goal step, with
 * the flow's progress bar, Skip and Finish later around it. It is a content
 * import like any other, so Learning Content now shows the same goal area in
 * a plain dialog. The first-run flow keeps its own goal step; both render
 * through `renderGoalArea`.
 *
 * Closing keeps a half-decomposed goal for the next opening. Once cards are
 * imported, closing hands the result to the host and the next opening starts
 * with an empty goal.
 */

import { t } from "./i18n.js";
import {
  createGoalImportState,
  type GoalImportState,
  renderGoalArea,
} from "./onboarding.js";

export interface GoalImportDialogOptions {
  /** Without a text model the goal area links to the model setup. */
  openModelSetup(): void;
  /** Cards were imported; the host refreshes what shows them. */
  onImported(): void;
}

const OVERLAY_ID = "goal-import-overlay";

let options: GoalImportDialogOptions | null = null;
let state: GoalImportState = createGoalImportState();
let open = false;
let returnFocus: HTMLElement | null = null;

function overlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}

function applyLabels(): void {
  const title = document.getElementById("lbl-goal-import-title");
  if (title) title.textContent = t("onboarding_goal_title");
  const body = document.getElementById("lbl-goal-import-body");
  if (body) body.textContent = t("onboarding_goal_body");
  const close = document.getElementById("btn-goal-import-close");
  if (close) close.textContent = t("goal_import_close");
}

function render(): void {
  const root = document.getElementById("goal-import-root");
  if (!root) return;
  renderGoalArea(
    root,
    {
      isLeaving: () => !open,
      openModelSetup: () => {
        closeGoalImportDialog();
        options?.openModelSetup();
      },
    },
    state,
  );
}

export function openGoalImportDialog(): void {
  const el = overlay();
  if (!el) return;
  returnFocus =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  open = true;
  applyLabels();
  render();
  el.classList.add("active");
  const first = el.querySelector<HTMLElement>("input, textarea, button");
  first?.focus();
}

export function closeGoalImportDialog(): void {
  const el = overlay();
  if (!el || !open) return;
  open = false;
  el.classList.remove("active");
  if (state.imported) {
    state = createGoalImportState();
    options?.onImported();
  }
  returnFocus?.focus();
  returnFocus = null;
}

/** Wire the dialog once; the Learning Content menu entry opens it. */
export function initGoalImportDialog(next: GoalImportDialogOptions): void {
  options = next;
  applyLabels();
  document
    .getElementById("btn-goal-import-close")
    ?.addEventListener("click", () => closeGoalImportDialog());
  overlay()?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeGoalImportDialog();
    }
  });
}

/** Re-apply the dialog's own labels after a language switch. */
export function applyGoalImportLabels(): void {
  applyLabels();
  if (open) render();
}
