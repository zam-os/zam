/**
 * Library topics (ADR 2026-10-02, phase 1): the catalog of what the library
 * already holds, grouped by source, and one action per topic that gives the
 * learner their own cards for it.
 *
 * Shared by the desktop Studio and the MCP Apps panel: it builds its own
 * dialog from the modal classes both hosts style, and talks to the bridge
 * only through `runBridge`.
 */

import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

export interface LibraryTopicRow {
  key: string;
  name: string;
  domain: string | null;
  itemCount: number;
  heldCount: number;
  setAsideCount: number;
}

export interface LibraryTopicStartResult {
  key: string;
  name: string;
  itemCount: number;
  created: number;
  alreadyHeld: number;
  setAside: number;
}

export interface LibraryTopicsOptions {
  /** Runs after a start created cards — e.g. reload the card list. */
  onStarted?: () => void | Promise<void>;
}

const OVERLAY_ID = "library-topics-overlay";

/** Cards of the topic the learner neither holds nor set aside. */
export function missingCount(topic: LibraryTopicRow): number {
  return Math.max(0, topic.itemCount - topic.heldCount - topic.setAsideCount);
}

/** "12 cards · you have 3 · 1 set aside" */
export function topicMetaText(topic: LibraryTopicRow): string {
  let text = tf("library_topics_row_meta", {
    items: topic.itemCount,
    held: topic.heldCount,
  });
  if (topic.setAsideCount > 0) {
    text += tf("library_topics_row_set_aside", {
      count: topic.setAsideCount,
    });
  }
  return topic.domain ? `${topic.domain} · ${text}` : text;
}

/** Label of the row's action, or null when there is nothing left to add. */
export function topicActionLabel(topic: LibraryTopicRow): string | null {
  if (topic.heldCount + topic.setAsideCount === 0) {
    return t("library_topics_start");
  }
  const missing = missingCount(topic);
  return missing > 0 ? tf("library_topics_add_new", { count: missing }) : null;
}

export function startResultText(result: LibraryTopicStartResult): string {
  return result.created > 0
    ? tf("library_topics_started", {
        name: result.name,
        count: result.created,
      })
    : tf("library_topics_nothing_new", { name: result.name });
}

export async function fetchLibraryTopics(): Promise<LibraryTopicRow[]> {
  const listing = await runBridge<{
    success: boolean;
    topics: LibraryTopicRow[];
  }>("library-topics-list");
  if (!listing?.success) throw new Error(t("library_topics_error"));
  return listing.topics;
}

export async function startLibraryTopic(
  key: string,
): Promise<LibraryTopicStartResult> {
  const result = await runBridge<
    LibraryTopicStartResult & { success: boolean }
  >("library-topic-start", ["--key", key]);
  if (!result?.success) throw new Error(t("library_topics_error"));
  return result;
}

/** "Could not …: <reason>", without repeating the prefix as the reason. */
export function topicsErrorText(
  err: unknown,
  prefixKey:
    | "library_topics_error"
    | "library_topics_start_error" = "library_topics_error",
): string {
  const prefix = t(prefixKey);
  const reason = err instanceof Error ? err.message : String(err);
  return !reason || reason === prefix ? prefix : `${prefix}: ${reason}`;
}

interface DialogParts {
  overlay: HTMLElement;
  title: HTMLElement;
  intro: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
  close: HTMLButtonElement;
}

let dialog: DialogParts | null = null;
// A start in flight keeps the dialog open: closing and reopening mid-start
// would show fresh buttons that ignore clicks, then the old start's result.
let busy = false;

function ensureDialog(): DialogParts {
  if (dialog?.overlay.isConnected) return dialog;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "modal-overlay";

  const box = document.createElement("div");
  box.className = "modal-box";
  box.style.maxWidth = "560px";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");

  const header = document.createElement("div");
  header.className = "modal-header";
  const title = document.createElement("h3");
  title.id = "lbl-library-topics-title";
  header.append(title);
  box.setAttribute("aria-labelledby", title.id);

  const body = document.createElement("div");
  body.className = "modal-body";
  const intro = document.createElement("p");
  const status = document.createElement("p");
  status.setAttribute("aria-live", "polite");
  status.style.fontWeight = "600";
  const list = document.createElement("div");
  list.style.display = "flex";
  list.style.flexDirection = "column";
  list.style.gap = "10px";
  body.append(intro, status, list);

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "btn secondary-btn btn-sm";
  close.addEventListener("click", () => closeLibraryTopics());
  actions.append(close);

  box.append(header, body, actions);
  overlay.append(box);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeLibraryTopics();
  });
  // On the window, not the overlay: re-rendering the rows removes the
  // focused button, and Escape must still close the dialog afterwards.
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      closeLibraryTopics();
    }
  });
  document.body.append(overlay);

  dialog = { overlay, title, intro, status, list, close };
  return dialog;
}

export function closeLibraryTopics(): void {
  if (busy) return;
  dialog?.overlay.classList.remove("active");
}

/** Neutral row chrome both hosts render alike (no warning-box styles). */
function topicRow(topic: LibraryTopicRow): HTMLElement {
  const row = document.createElement("article");
  row.dataset.topicKey = topic.key;
  row.style.display = "flex";
  row.style.flexDirection = "column";
  row.style.gap = "6px";
  row.style.padding = "10px 12px";
  row.style.borderRadius = "10px";
  row.style.border =
    "1px solid var(--clr-border, var(--border-card-frosted, rgba(127, 127, 127, 0.3)))";

  const name = document.createElement("div");
  name.style.fontWeight = "600";
  name.style.color = "var(--clr-text-primary, var(--fg))";
  name.textContent = topic.name;
  name.title = topic.key;

  const meta = document.createElement("div");
  meta.style.fontSize = "0.8rem";
  meta.textContent = topicMetaText(topic);

  row.append(name, meta);
  return row;
}

function setActionDone(action: HTMLButtonElement): void {
  action.dataset.done = "true";
  action.className = "btn secondary-btn btn-sm";
  action.textContent = t("library_topics_all_added");
  action.disabled = true;
}

/** Rows only; the caller owns the status line. */
function renderTopics(
  parts: DialogParts,
  topics: LibraryTopicRow[],
  options: LibraryTopicsOptions,
): void {
  parts.list.replaceChildren();
  for (const topic of topics) {
    const row = topicRow(topic);
    const label = topicActionLabel(topic);
    const action = document.createElement("button");
    action.type = "button";
    action.style.alignSelf = "flex-start";
    if (label) {
      action.className = "btn primary-btn btn-sm";
      action.textContent = label;
    } else {
      setActionDone(action);
    }
    action.addEventListener("click", () => {
      void runStart(parts, topic, action, options);
    });
    row.append(action);
    parts.list.append(row);
  }
}

function setRowsDisabled(parts: DialogParts, disabled: boolean): void {
  for (const button of parts.list.querySelectorAll("button")) {
    // A finished row stays finished when the others come back.
    if (!disabled && button.dataset.done) continue;
    button.disabled = disabled;
  }
}

async function runStart(
  parts: DialogParts,
  topic: LibraryTopicRow,
  action: HTMLButtonElement,
  options: LibraryTopicsOptions,
): Promise<void> {
  if (busy) return;
  busy = true;
  setRowsDisabled(parts, true);
  parts.close.disabled = true;
  parts.status.textContent = t("library_topics_starting");
  try {
    let result: LibraryTopicStartResult;
    try {
      result = await startLibraryTopic(topic.key);
    } catch (err) {
      // Nothing changed: keep the rows, say why.
      parts.status.textContent = topicsErrorText(
        err,
        "library_topics_start_error",
      );
      setRowsDisabled(parts, false);
      return;
    }

    // The cards exist now, whatever the re-list below does. The host's
    // refresh (card list, dashboard) can take seconds, so it runs behind the
    // result instead of before it.
    if (result.created > 0) {
      void Promise.resolve(options.onStarted?.()).catch((err) =>
        console.error("library topics: refresh after start failed", err),
      );
    }
    const message = startResultText(result);
    try {
      renderTopics(parts, await fetchLibraryTopics(), options);
    } catch {
      // The list could not be refreshed; the started row is done anyway.
      setActionDone(action);
      setRowsDisabled(parts, false);
    }
    parts.status.textContent = message;
  } finally {
    busy = false;
    parts.close.disabled = false;
    parts.close.focus();
  }
}

/** Open the catalog and load the topics. */
export async function openLibraryTopics(
  options: LibraryTopicsOptions = {},
): Promise<void> {
  const parts = ensureDialog();
  parts.title.textContent = t("library_topics_title");
  parts.intro.textContent = t("library_topics_intro");
  parts.close.textContent = t("library_topics_close");
  parts.overlay.classList.add("active");
  parts.close.focus();
  if (busy) return; // a start in flight owns the rows and the status line
  parts.status.textContent = t("library_topics_loading");
  parts.list.replaceChildren();
  try {
    const topics = await fetchLibraryTopics();
    parts.status.textContent =
      topics.length === 0 ? t("library_topics_empty") : "";
    renderTopics(parts, topics, options);
  } catch (err) {
    parts.status.textContent = topicsErrorText(err);
  }
}

/** Wire the Learning Content button, if the host has one. */
export function initLibraryTopics(options: LibraryTopicsOptions = {}): void {
  const button = document.getElementById("btn-content-library-topics");
  if (!button) return;
  button.textContent = t("btn_library_topics");
  button.addEventListener("click", () => {
    void openLibraryTopics(options);
  });
}
