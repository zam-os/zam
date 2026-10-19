/**
 * The topic import as a dialog of its own (ADR 2026-10-14).
 *
 * The same topic area as the first-run flow's topic page: name a topic and
 * its context, let ZAM propose one level of subtopics at a time, pick the
 * cards. Learning Content's Import menu and the atlas's *Hier importieren …*
 * open it; both render through `renderTopicArea`.
 *
 * Closing keeps a half-decomposed topic for the next opening. Once cards are
 * imported, closing hands the result to the host and the next opening starts
 * with an empty topic.
 */

import { t } from "./i18n.js";
import {
  createTopicImportState,
  type TopicImportState,
  type TopicPlace,
  renderTopicArea,
} from "./onboarding.js";

export interface TopicImportDialogOptions {
  /** Without a text model the topic area links to the model setup. */
  openModelSetup(): void;
  /** Cards were imported, at `place` if any; the host refreshes what shows them. */
  onImported(place: TopicPlace | null): void;
}

const OVERLAY_ID = "topic-import-overlay";

let options: TopicImportDialogOptions | null = null;
let state: TopicImportState = createTopicImportState();
let open = false;
let returnFocus: HTMLElement | null = null;

function overlay(): HTMLElement | null {
  return document.getElementById(OVERLAY_ID);
}

function applyLabels(): void {
  const title = document.getElementById("lbl-topic-import-title");
  if (title) title.textContent = t("topic_title");
  const body = document.getElementById("lbl-topic-import-body");
  if (body) body.textContent = t("topic_body");
  const close = document.getElementById("btn-topic-import-close");
  if (close) close.textContent = t("topic_import_close");
}

function render(): void {
  const root = document.getElementById("topic-import-root");
  if (!root) return;
  renderTopicArea(
    root,
    {
      isLeaving: () => !open,
      openModelSetup: () => {
        closeTopicImportDialog();
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

/** Focus the topic area's first control, or Close when it has none left. */
function focusInDialog(): void {
  const root = document.getElementById("topic-import-root");
  const target =
    (root && firstControl(root)) ??
    document.getElementById("btn-topic-import-close");
  target?.focus();
}

/** Whether two optional places name the same region. */
function samePlace(a: TopicPlace | null, b: TopicPlace | null): boolean {
  return a?.lens === b?.lens && a?.regionKey === b?.regionKey;
}

/**
 * Open the dialog. `returnTo` takes focus back on close; pass it when the
 * control that opened the dialog will be hidden by then (a menu entry).
 * With a `place`, the topic's cards land at that atlas region (ADR
 * 2026-10-13, Decision 9); a topic started elsewhere is not carried over.
 */
export function openTopicImportDialog(
  returnTo?: HTMLElement | null,
  options: { place?: TopicPlace } = {},
): void {
  const el = overlay();
  if (!el) return;
  const place = options.place ?? null;
  if (!samePlace(state.place, place)) state = createTopicImportState(place);
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

export function closeTopicImportDialog(): void {
  const el = overlay();
  if (!el || !open) return;
  open = false;
  el.classList.remove("active");
  if (state.imported) {
    const place = state.place;
    state = createTopicImportState();
    options?.onImported(place);
  }
  returnFocus?.focus();
  returnFocus = null;
}

/** Wire the dialog once; the Learning Content menu entry opens it. */
export function initTopicImportDialog(next: TopicImportDialogOptions): void {
  options = next;
  applyLabels();
  document
    .getElementById("btn-topic-import-close")
    ?.addEventListener("click", () => closeTopicImportDialog());
  const el = overlay();
  el?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      closeTopicImportDialog();
    }
  });
  // The topic area redraws itself at every step and removes the control that
  // had focus, which drops focus to the page behind the dialog. Put it back
  // inside: on the new step's first control, or on Close once an import has
  // left only its result line.
  const root = document.getElementById("topic-import-root");
  if (el && root) {
    new MutationObserver(() => {
      if (open && !el.contains(document.activeElement)) focusInDialog();
    }).observe(root, { childList: true, subtree: true });
  }
}

/** Re-apply the dialog's own labels after a language switch. */
export function applyTopicImportLabels(): void {
  applyLabels();
  if (open) render();
}
