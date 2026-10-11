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

/** The first control a keyboard user can reach in `root`, if any. */
function firstControl(root: HTMLElement): HTMLElement | null {
  return (
    Array.from(
      root.querySelectorAll<HTMLElement>(
        "input, textarea, select, button, a[href]",
      ),
    ).find(
      (control) =>
        !(control as HTMLButtonElement).disabled &&
        control.getClientRects().length > 0,
    ) ?? null
  );
}

/** Focus the goal area's first control, or Close when it has none left. */
function focusInDialog(): void {
  const root = document.getElementById("goal-import-root");
  const target =
    (root && firstControl(root)) ??
    document.getElementById("btn-goal-import-close");
  target?.focus();
}

/**
 * Open the dialog. `returnTo` takes focus back on close; pass it when the
 * control that opened the dialog will be hidden by then (a menu entry).
 */
export function openGoalImportDialog(returnTo?: HTMLElement | null): void {
  const el = overlay();
  if (!el) return;
  returnFocus =
    returnTo ??
    (document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null);
  open = true;
  applyLabels();
  render();
  el.classList.add("active");
  focusInDialog();
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
  const el = overlay();
  el?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeGoalImportDialog();
    }
  });
  // The goal area redraws itself at every step and removes the control that
  // had focus, which drops focus to the page behind the dialog. Put it back
  // inside: on the new step's first control, or on Close once an import has
  // left only its result line.
  const root = document.getElementById("goal-import-root");
  if (el && root) {
    new MutationObserver(() => {
      if (open && !el.contains(document.activeElement)) focusInDialog();
    }).observe(root, { childList: true, subtree: true });
  }
}

/** Re-apply the dialog's own labels after a language switch. */
export function applyGoalImportLabels(): void {
  applyLabels();
  if (open) render();
}
