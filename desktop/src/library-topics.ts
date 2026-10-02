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

interface DialogParts {
  overlay: HTMLElement;
  title: HTMLElement;
  intro: HTMLElement;
  status: HTMLElement;
  list: HTMLElement;
  close: HTMLButtonElement;
}

let dialog: DialogParts | null = null;
let busy = false;

function ensureDialog(): DialogParts {
  if (dialog?.overlay.isConnected) return dialog;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  const box = document.createElement("div");
  box.className = "modal-box";
  box.style.maxWidth = "560px";

  const header = document.createElement("div");
  header.className = "modal-header";
  const title = document.createElement("h3");
  title.id = "lbl-library-topics-title";
  header.append(title);
  overlay.setAttribute("aria-labelledby", title.id);

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
  overlay.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLibraryTopics();
  });
  document.body.append(overlay);

  dialog = { overlay, title, intro, status, list, close };
  return dialog;
}

export function closeLibraryTopics(): void {
  dialog?.overlay.classList.remove("active");
}

function renderTopics(
  parts: DialogParts,
  topics: LibraryTopicRow[],
  options: LibraryTopicsOptions,
): void {
  parts.list.replaceChildren();
  if (topics.length === 0) {
    parts.status.textContent = t("library_topics_empty");
    return;
  }
  for (const topic of topics) {
    const row = document.createElement("article");
    row.className = "modal-impact-section";
    row.dataset.topicKey = topic.key;

    const name = document.createElement("div");
    name.className = "modal-impact-title";
    name.style.color = "var(--clr-text-primary)";
    name.textContent = topic.name;
    name.title = topic.key;

    const meta = document.createElement("div");
    meta.style.fontSize = "0.8rem";
    meta.textContent = topicMetaText(topic);

    row.append(name, meta);

    const label = topicActionLabel(topic);
    const action = document.createElement("button");
    action.type = "button";
    action.className = label
      ? "btn primary-btn btn-sm"
      : "btn secondary-btn btn-sm";
    action.textContent = label ?? t("library_topics_all_added");
    action.disabled = label === null;
    action.style.alignSelf = "flex-start";
    action.addEventListener("click", () => {
      void runStart(parts, topic, options);
    });
    row.append(action);
    parts.list.append(row);
  }
}

async function runStart(
  parts: DialogParts,
  topic: LibraryTopicRow,
  options: LibraryTopicsOptions,
): Promise<void> {
  if (busy) return;
  busy = true;
  for (const button of parts.list.querySelectorAll("button")) {
    button.disabled = true;
  }
  parts.status.textContent = t("library_topics_starting");
  try {
    const result = await startLibraryTopic(topic.key);
    renderTopics(parts, await fetchLibraryTopics(), options);
    parts.status.textContent = startResultText(result);
    // The host's refresh (card list, dashboard) can take seconds; the result
    // is already on screen, so it runs behind it rather than before it.
    if (result.created > 0) {
      void Promise.resolve(options.onStarted?.()).catch((err) =>
        console.error("library topics: refresh after start failed", err),
      );
    }
  } catch (err) {
    parts.status.textContent = `${t("library_topics_error")}: ${
      err instanceof Error ? err.message : String(err)
    }`;
    renderTopics(parts, await fetchLibraryTopics().catch(() => []), options);
  } finally {
    busy = false;
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
  parts.status.textContent = t("library_topics_loading");
  parts.list.replaceChildren();
  parts.overlay.classList.add("active");
  parts.close.focus();
  try {
    const topics = await fetchLibraryTopics();
    parts.status.textContent = "";
    renderTopics(parts, topics, options);
  } catch (err) {
    parts.status.textContent = `${t("library_topics_error")}: ${
      err instanceof Error ? err.message : String(err)
    }`;
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
