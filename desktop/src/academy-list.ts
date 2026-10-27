/**
 * „Aus der ZAM Academy“ (ADR 2026-10-19, Decision 5): the cells of the ZAM
 * Academy, each with „Üben ↗“ to open its app and „Aufnehmen“ to take it in
 * one click. Also the update check on a held academy cell in Lern-Karten.
 *
 * Every call here is a learner's click. The bridge commands it uses
 * (`academy-list`, `academy-enrol`, `academy-update`) are the only code that
 * reads academy.zam-os.org; they are not on the MCP panel bridge.
 */

import { runBridge } from "./bridge-transport.js";
import type { EnrolBundledCellProgress } from "../../src/kernel/library/bundled-cells.js";
import { createCellImportProgress } from "./cell-import-progress.js";
import { t, tf } from "./i18n.js";

export interface AcademyCellRow {
  id: string;
  title: string;
  description: string;
  language: string | null;
  version: string;
  items: number;
  appUrl: string | null;
  bundled: boolean;
  held: boolean;
  heldVersion: string | null;
  newer: boolean;
}

export interface AcademyListing {
  offline: boolean;
  cells: AcademyCellRow[];
}

export interface AcademyListOptions {
  /** Opens the app in the system browser. */
  openExternal?: (url: string) => void;
  /** Runs after an enrolment created cards — e.g. reload the card list. */
  onEnrolled?: () => void | Promise<void>;
}

const OVERLAY_ID = "academy-list-overlay";
let activeImports = 0;

export interface AcademyProgressEvent extends EnrolBundledCellProgress {
  type: string;
  cellId: string;
}

type AcademyProgressSource = (
  listener: (event: AcademyProgressEvent) => void,
) => Promise<() => void>;

let progressSource: AcademyProgressSource | null = null;

export function setAcademyProgressSource(
  source: AcademyProgressSource | null,
): void {
  progressSource = source;
}

/** Listen before starting the command, and always release the listener. */
export async function withAcademyProgress<T>(
  cellId: string,
  onProgress: ((progress: EnrolBundledCellProgress) => void) | undefined,
  run: () => Promise<T>,
): Promise<T> {
  let unlisten: (() => void) | undefined;
  try {
    if (onProgress)
      unlisten = await progressSource?.((event) => {
        if (event.type === "academy-progress" && event.cellId === cellId)
          onProgress(event);
      });
  } catch {
    // The import still works if the native event channel is unavailable.
  }
  try {
    return await run();
  } finally {
    unlisten?.();
  }
}

export function isAcademyCellId(id: string): boolean {
  return id.startsWith("zam-academy:");
}

/** "26 Karten · Version 2026.10.1" */
export function academyMetaText(cell: AcademyCellRow): string {
  return tf("academy_row_meta", { items: cell.items, version: cell.version });
}

export async function fetchAcademyCells(): Promise<AcademyListing> {
  const listing = await runBridge<{
    success: boolean;
    offline: boolean;
    cells: AcademyCellRow[];
  }>("academy-list");
  if (!listing?.success) throw new Error(t("academy_error"));
  return { offline: listing.offline, cells: listing.cells };
}

export async function enrolAcademyCell(
  id: string,
  onProgress?: (progress: EnrolBundledCellProgress) => void,
): Promise<{ cardsCreated: number; version: string | null }> {
  const result = await withAcademyProgress(id, onProgress, () =>
    runBridge<{
      success: boolean;
      cardsCreated: number;
      version: string | null;
    }>("academy-enrol", [id]),
  );
  if (!result?.success) throw new Error(t("academy_error"));
  return result;
}

export async function updateAcademyCell(
  id: string,
  onProgress?: (progress: EnrolBundledCellProgress) => void,
): Promise<{ updated: boolean; version: string | null }> {
  const result = await withAcademyProgress(id, onProgress, () =>
    runBridge<{
      success: boolean;
      updated: boolean;
      version: string | null;
    }>("academy-update", [id]),
  );
  if (!result?.success) throw new Error(t("academy_error"));
  return result;
}

/** "Could not …: <reason>", without repeating the prefix as the reason. */
export function academyErrorText(err: unknown): string {
  const prefix = t("academy_error");
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
  title.id = "lbl-academy-title";
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
  close.addEventListener("click", () => closeAcademyList());
  actions.append(close);

  box.append(header, body, actions);
  overlay.append(box);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeAcademyList();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      closeAcademyList();
    }
  });
  document.body.append(overlay);

  dialog = { overlay, title, intro, status, list, close };
  return dialog;
}

export function closeAcademyList(): void {
  dialog?.overlay.classList.remove("active");
}

function importStarted(): void {
  activeImports++;
}

function importFinished(): void {
  activeImports--;
}

function setTake(button: HTMLButtonElement): void {
  button.className = "btn primary-btn btn-sm";
  button.textContent = t("academy_take");
  button.disabled = false;
}

function setTaken(button: HTMLButtonElement): void {
  button.className = "btn secondary-btn btn-sm";
  button.textContent = t("academy_taken");
  button.disabled = true;
}

/** One cell: title, description, meta, „Üben ↗“ and „Aufnehmen“. */
export function academyRow(
  cell: AcademyCellRow,
  options: AcademyListOptions,
  status: HTMLElement,
): HTMLElement {
  const row = document.createElement("article");
  row.dataset.cellId = cell.id;
  row.style.display = "flex";
  row.style.flexDirection = "column";
  row.style.gap = "6px";
  row.style.padding = "10px 12px";
  row.style.borderRadius = "10px";
  row.style.border =
    "1px solid var(--clr-border, var(--border-card-frosted, rgba(127, 127, 127, 0.3)))";

  const name = document.createElement("div");
  name.style.fontWeight = "600";
  name.textContent = cell.title;

  const description = document.createElement("div");
  description.style.fontSize = "0.82rem";
  description.textContent = cell.description;

  const meta = document.createElement("div");
  meta.style.fontSize = "0.78rem";
  meta.textContent = academyMetaText(cell);

  const buttons = document.createElement("div");
  buttons.style.display = "flex";
  buttons.style.gap = "8px";

  if (cell.appUrl && options.openExternal) {
    const practise = document.createElement("button");
    practise.type = "button";
    practise.className = "btn secondary-btn btn-sm";
    practise.textContent = t("academy_practise");
    practise.title = cell.appUrl;
    const url = cell.appUrl;
    practise.addEventListener("click", () => options.openExternal?.(url));
    buttons.append(practise);
  }

  const take = document.createElement("button");
  take.type = "button";
  take.dataset.action = "take";
  if (cell.held) {
    setTaken(take);
  } else {
    setTake(take);
    take.addEventListener("click", () => {
      take.disabled = true;
      take.textContent = t("academy_taking");
      const progress = createCellImportProgress((key, counts) =>
        tf(key, counts),
      );
      row.append(progress.element);
      importStarted();
      status.textContent = t("academy_taking");
      enrolAcademyCell(cell.id, progress.update)
        .then((result) => {
          // Another version than the row showed is not what was taken: say
          // which one was saved and let the learner try again.
          const other =
            result.version !== null && result.version !== cell.version;
          if (!other) progress.finish();
          progress.remove();
          if (other) setTake(take);
          else setTaken(take);
          status.textContent = other
            ? tf("academy_taken_other_version", {
                name: cell.title,
                saved: result.version ?? "",
                version: cell.version,
              })
            : tf("academy_taken_result", {
                name: cell.title,
                count: result.cardsCreated,
              });
          if (result.cardsCreated > 0) {
            void Promise.resolve(options.onEnrolled?.()).catch((err) =>
              console.error("academy: refresh after enrol failed", err),
            );
          }
        })
        .catch((err) => {
          setTake(take);
          progress.remove();
          status.textContent = academyErrorText(err);
        })
        .finally(importFinished);
    });
  }
  buttons.append(take);

  row.append(name, description, meta, buttons);
  return row;
}

/** Open the list and load the cells. */
export async function openAcademyList(
  options: AcademyListOptions = {},
): Promise<void> {
  const parts = ensureDialog();
  if (activeImports > 0) {
    parts.overlay.classList.add("active");
    parts.close.focus();
    return;
  }
  parts.title.textContent = t("academy_title");
  parts.intro.textContent = t("academy_intro");
  parts.close.textContent = t("academy_close");
  parts.overlay.classList.add("active");
  parts.close.focus();
  parts.status.textContent = t("academy_loading");
  parts.list.replaceChildren();
  try {
    const listing = await fetchAcademyCells();
    parts.status.textContent = listing.offline
      ? t("academy_offline")
      : listing.cells.length === 0
        ? t("academy_empty")
        : "";
    for (const cell of listing.cells) {
      parts.list.append(academyRow(cell, options, parts.status));
    }
  } catch (err) {
    parts.status.textContent = academyErrorText(err);
  }
}

/** Wire the import-menu entry, if the host has one. */
export function initAcademyList(options: AcademyListOptions = {}): void {
  const button = document.getElementById("btn-academy-open");
  if (!button) return;
  button.textContent = t("academy_menu");
  button.addEventListener("click", () => {
    void openAcademyList(options);
  });
}

/**
 * „Auf Aktualisierung prüfen“ on a held academy cell in Lern-Karten. The
 * check reads the catalog; „Aktualisieren auf <version>“ installs it.
 */
export function academyUpdateButton(
  cellId: string,
  onUpdated?: () => void | Promise<void>,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn secondary-btn btn-xs";
  button.dataset.action = "academy-update";
  button.textContent = t("academy_check_update");
  let newerVersion: string | null = null;
  button.addEventListener("click", () => {
    button.disabled = true;
    if (!newerVersion) {
      fetchAcademyCells()
        .then((listing) => {
          const cell = listing.cells.find((row) => row.id === cellId);
          if (cell?.newer) {
            newerVersion = cell.version;
            button.textContent = tf("academy_update_to", {
              version: cell.version,
            });
            button.disabled = false;
          } else if (listing.offline) {
            // Offline is not an answer: the same button checks again.
            button.textContent = t("academy_offline_short");
            button.disabled = false;
          } else {
            button.textContent = t("academy_up_to_date");
          }
        })
        .catch(() => {
          button.textContent = t("academy_check_update");
          button.disabled = false;
        });
      return;
    }
    button.textContent = t("academy_updating");
    const progress = createCellImportProgress((key, counts) => tf(key, counts));
    button.closest(".zam-card")?.append(progress.element);
    updateAcademyCell(cellId, progress.update)
      .then((result) => {
        progress.finish();
        button.textContent = tf("academy_updated", {
          version: result.version ?? newerVersion ?? "",
        });
        progress.remove();
        void Promise.resolve(onUpdated?.()).catch((err) =>
          console.error("academy: refresh after update failed", err),
        );
      })
      .catch(() => {
        progress.remove();
        button.textContent = tf("academy_update_to", {
          version: newerVersion ?? "",
        });
        button.disabled = false;
      });
  });
  return button;
}
