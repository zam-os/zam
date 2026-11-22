/**
 * „Aus der ZAM Academy“ (ADR 2026-10-19, Decision 5): fast index-backed
 * Academy browser modeled on `academy.zam-os.org` — multi-stage navigation
 * (Schulsicht: Klasse → Fach → Schule & Pakete; Weltwissen: Wissensbereich →
 * Fach → Pakete), direct filtering by school/grade/subject, and live search.
 * Each package offers „Üben ↗“ to open its app and „Aufnehmen“ to take it in
 * one click. Also the update check on a held academy cell in Lern-Karten.
 *
 * Every call here is a learner's click. The bridge commands it uses
 * (`academy-list`, `academy-enrol`, `academy-update`) are the only code that
 * reads academy.zam-os.org; they are not on the MCP panel bridge.
 */

import {
  ACADEMY_GRADE_CROSS,
  ACADEMY_OTHER_BUCKET,
  type AcademyCellFacet,
  type AcademyGradeFilter,
  type AcademyTaxonomy,
  buildAcademyBereichTiles,
  buildAcademyGradeTiles,
  buildAcademySchoolOptions,
  buildAcademySubjectTiles,
  DEFAULT_ACADEMY_TAXONOMY,
  enrichAcademyCells,
  filterAcademyCells,
  formatAcademyGrades,
  sortAcademyCellsForDisplay,
} from "../../src/kernel/library/academy-browse.js";
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
  preview?: boolean;
  facet?: AcademyCellFacet;
}

export interface AcademyListing {
  offline: boolean;
  cells: AcademyCellRow[];
  taxonomy?: AcademyTaxonomy;
}

export interface AcademyListOptions {
  /** Opens the app in the system browser. */
  openExternal?: (url: string) => void;
  /** Runs after an enrolment or update changed cards — e.g. reload the card list. */
  onEnrolled?: () => void | Promise<void>;
}

export type AcademyLens = "schule" | "welt";
export type AcademyViewMode = "stages" | "list";

export interface AcademyBrowserState {
  lens: AcademyLens;
  mode: AcademyViewMode;
  school: string | null;
  grade: AcademyGradeFilter;
  bereich: string | null;
  subject: string | null;
  query: string;
}

export function createAcademyBrowserState(): AcademyBrowserState {
  return {
    lens: "schule",
    mode: "stages",
    school: null,
    grade: null,
    bereich: null,
    subject: null,
    query: "",
  };
}

/**
 * Updates the school filter while keeping the current stage valid: if the
 * active grade/area/subject has no packages in the newly selected school,
 * steps back up cleanly instead of stranding the learner on an empty stage.
 */
export function applyAcademySchoolFilter(
  state: AcademyBrowserState,
  school: string | null,
  cells: readonly AcademyCellRow[],
  taxonomy: AcademyTaxonomy,
): AcademyBrowserState {
  const next: AcademyBrowserState = { ...state, school };
  if (next.mode !== "stages") return next;
  if (next.lens === "schule" && next.grade !== null) {
    const inGrade = filterAcademyCells(
      cells,
      { school: next.school, grade: next.grade },
      taxonomy,
    );
    if (inGrade.length === 0) {
      next.grade = null;
      next.subject = null;
      return next;
    }
    if (next.subject !== null) {
      const inSubject = filterAcademyCells(
        cells,
        { school: next.school, grade: next.grade, subject: next.subject },
        taxonomy,
      );
      if (inSubject.length === 0) next.subject = null;
    }
  } else if (next.lens === "welt" && next.bereich !== null) {
    const inArea = filterAcademyCells(
      cells,
      { school: next.school, bereich: next.bereich },
      taxonomy,
    );
    if (inArea.length === 0) {
      next.bereich = null;
      next.subject = null;
      next.grade = null;
      return next;
    }
    if (next.subject !== null) {
      const inSubject = filterAcademyCells(
        cells,
        {
          school: next.school,
          bereich: next.bereich,
          subject: next.subject,
        },
        taxonomy,
      );
      if (inSubject.length === 0) {
        next.subject = null;
        next.grade = null;
      } else if (
        next.grade !== null &&
        filterAcademyCells(
          cells,
          {
            school: next.school,
            bereich: next.bereich,
            subject: next.subject,
            grade: next.grade,
          },
          taxonomy,
        ).length === 0
      ) {
        next.grade = null;
      }
    }
  }
  return next;
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

/** „Vorschau · …“ on a cell whose content no teacher has reviewed yet. */
export function academyPreviewLabel(): HTMLElement {
  const label = document.createElement("span");
  label.className = "academy-preview-label";
  label.textContent = t("academy_preview");
  return label;
}

export async function fetchAcademyCells(): Promise<AcademyListing> {
  const listing = await runBridge<{
    success: boolean;
    offline: boolean;
    cells: AcademyCellRow[];
    taxonomy?: AcademyTaxonomy;
  }>("academy-list");
  if (!listing?.success) throw new Error(t("academy_error"));
  return {
    offline: listing.offline,
    cells: listing.cells,
    taxonomy: listing.taxonomy,
  };
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

function packageCountLabel(count: number): string {
  return tf(count === 1 ? "academy_pkg_count_one" : "academy_pkg_count_many", {
    count,
  });
}

function gradeLabel(key: number | typeof ACADEMY_GRADE_CROSS): string {
  return key === ACADEMY_GRADE_CROSS
    ? t("academy_grade_cross")
    : tf("academy_grade_single", { grade: key });
}

function formatGrades(grades: readonly number[]): string {
  return formatAcademyGrades(grades, {
    gradeSingle: (n) => tf("academy_grade_single", { grade: n }),
    gradeRange: (range) => tf("academy_grade_range", { range }),
    crossGrade: t("academy_grade_cross"),
  });
}

function subjectLabel(id: string | null, taxonomy: AcademyTaxonomy): string {
  if (!id || id === ACADEMY_OTHER_BUCKET) return t("academy_other_bucket");
  return (
    taxonomy.faecher.find((f) => f.id === id)?.name ??
    taxonomy.fachverbunde.find((v) => v.id === id)?.name ??
    id
  );
}

function areaLabel(id: string | null, taxonomy: AcademyTaxonomy): string {
  if (!id || id === ACADEMY_OTHER_BUCKET) return t("academy_other_bucket");
  return taxonomy.bereiche.find((b) => b.id === id)?.name ?? id;
}

function setCssVar(el: HTMLElement, name: string, value: string): void {
  el.style?.setProperty?.(name, value);
}

function hexEmblem(glyph: string, hue: number, size: "sm" | "md"): HTMLElement {
  const badge = document.createElement("span");
  const compact = glyph.length >= 5 ? " academy-hex-compact" : "";
  badge.className = `academy-hex academy-hex-${size}${compact}`;
  setCssVar(badge, "--academy-hue", String(hue));
  badge.setAttribute("aria-hidden", "true");
  badge.textContent = glyph;
  return badge;
}

interface DialogParts {
  overlay: HTMLElement;
  box: HTMLElement;
  title: HTMLElement;
  summary: HTMLElement;
  intro: HTMLElement;
  searchLabel: HTMLLabelElement;
  searchInput: HTMLInputElement;
  viewGroup: HTMLElement;
  viewStagesBtn: HTMLButtonElement;
  viewListBtn: HTMLButtonElement;
  lensGroup: HTMLElement;
  lensSchoolBtn: HTMLButtonElement;
  lensWorldBtn: HTMLButtonElement;
  schoolStrip: HTMLElement;
  listFilters: HTMLElement;
  stageBar: HTMLElement;
  body: HTMLElement;
  progress: HTMLProgressElement;
  status: HTMLElement;
  content: HTMLElement;
  close: HTMLButtonElement;
}

let dialog: DialogParts | null = null;
let previousFocus: HTMLElement | null = null;
let currentCells: AcademyCellRow[] = [];
let currentTaxonomy: AcademyTaxonomy = DEFAULT_ACADEMY_TAXONOMY;
let currentOptions: AcademyListOptions = {};
let browserState: AcademyBrowserState = createAcademyBrowserState();

function setBackgroundInert(inert: boolean): void {
  const appShell = document.getElementById?.("app-shell");
  if (appShell) appShell.inert = inert;
}

function ensureDialog(): DialogParts {
  if (dialog?.overlay.isConnected) return dialog;

  const overlay = document.createElement("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "modal-overlay";

  const box = document.createElement("div");
  box.className = "modal-box academy-modal";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");

  const header = document.createElement("div");
  header.className = "modal-header academy-modal-header";
  const headerTop = document.createElement("div");
  headerTop.className = "academy-header-top";
  const title = document.createElement("h3");
  title.id = "lbl-academy-title";
  const summary = document.createElement("span");
  summary.className = "academy-summary-pill";
  summary.hidden = true;
  headerTop.append(title, summary);

  const intro = document.createElement("p");
  intro.className = "academy-intro";
  header.append(headerTop, intro);
  box.setAttribute("aria-labelledby", title.id);

  // Persistent controls bar (search + view/lens toggles + school strip / dropdowns)
  const controls = document.createElement("div");
  controls.className = "academy-controls";

  const toolbarRow = document.createElement("div");
  toolbarRow.className = "academy-toolbar-row";

  const searchWrap = document.createElement("div");
  searchWrap.className = "academy-search-wrap";
  const searchLabel = document.createElement("label");
  searchLabel.htmlFor = "academy-search-input";
  searchLabel.className = "visually-hidden";
  const searchInput = document.createElement("input");
  searchInput.id = "academy-search-input";
  searchInput.type = "search";
  searchInput.className = "input-field academy-search-input";
  searchInput.autocomplete = "off";
  searchInput.addEventListener("input", () => {
    browserState.query = searchInput.value;
    renderBrowser();
  });
  searchWrap.append(searchLabel, searchInput);

  const viewGroup = document.createElement("div");
  viewGroup.className = "academy-seg";
  viewGroup.setAttribute("role", "group");
  const viewStagesBtn = document.createElement("button");
  viewStagesBtn.type = "button";
  viewStagesBtn.className = "academy-seg-btn";
  viewStagesBtn.dataset.view = "stages";
  viewStagesBtn.addEventListener("click", () => {
    if (browserState.mode === "stages") return;
    browserState.mode = "stages";
    renderBrowser();
  });
  const viewListBtn = document.createElement("button");
  viewListBtn.type = "button";
  viewListBtn.className = "academy-seg-btn";
  viewListBtn.dataset.view = "list";
  viewListBtn.addEventListener("click", () => {
    if (browserState.mode === "list") return;
    browserState.mode = "list";
    renderBrowser();
  });
  viewGroup.append(viewStagesBtn, viewListBtn);

  const lensGroup = document.createElement("div");
  lensGroup.className = "academy-seg";
  lensGroup.setAttribute("role", "group");
  const lensSchoolBtn = document.createElement("button");
  lensSchoolBtn.type = "button";
  lensSchoolBtn.className = "academy-seg-btn";
  lensSchoolBtn.dataset.lens = "schule";
  lensSchoolBtn.addEventListener("click", () => {
    if (browserState.lens === "schule") return;
    browserState.lens = "schule";
    browserState.bereich = null;
    browserState.grade = null;
    browserState.subject = null;
    renderBrowser();
  });
  const lensWorldBtn = document.createElement("button");
  lensWorldBtn.type = "button";
  lensWorldBtn.className = "academy-seg-btn";
  lensWorldBtn.dataset.lens = "welt";
  lensWorldBtn.addEventListener("click", () => {
    if (browserState.lens === "welt") return;
    browserState.lens = "welt";
    browserState.bereich = null;
    browserState.grade = null;
    browserState.subject = null;
    renderBrowser();
  });
  lensGroup.append(lensSchoolBtn, lensWorldBtn);

  toolbarRow.append(searchWrap, viewGroup, lensGroup);

  const schoolStrip = document.createElement("div");
  schoolStrip.className = "academy-chip-strip";
  schoolStrip.setAttribute("role", "group");

  const listFilters = document.createElement("div");
  listFilters.className = "academy-list-filters";
  listFilters.hidden = true;

  const stageBar = document.createElement("div");
  stageBar.className = "academy-stage-bar";
  stageBar.hidden = true;

  controls.append(toolbarRow, schoolStrip, listFilters, stageBar);

  const body = document.createElement("div");
  body.className = "modal-body academy-modal-body";
  const progress = document.createElement("progress");
  progress.className = "academy-progress";
  progress.hidden = true;
  const status = document.createElement("p");
  status.className = "academy-status";
  status.setAttribute("aria-live", "polite");
  const content = document.createElement("div");
  content.className = "academy-content";
  body.append(status, content);

  const actions = document.createElement("div");
  actions.className = "modal-actions";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "btn secondary-btn btn-sm";
  close.addEventListener("click", () => closeAcademyList());
  actions.append(close);

  box.append(header, controls, body, actions);
  overlay.append(box);

  // Ignore backdrop clicks when the pointer drag started inside the dialog,
  // while still accepting direct backdrop clicks (including synthetic clicks).
  let pointerStartedInside = false;
  overlay.addEventListener("pointerdown", (event) => {
    pointerStartedInside = event.target !== overlay;
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay && !pointerStartedInside) closeAcademyList();
    pointerStartedInside = false;
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      closeAcademyList();
    }
  });
  document.body.append(overlay);

  dialog = {
    overlay,
    box,
    title,
    summary,
    intro,
    searchLabel,
    searchInput,
    viewGroup,
    viewStagesBtn,
    viewListBtn,
    lensGroup,
    lensSchoolBtn,
    lensWorldBtn,
    schoolStrip,
    listFilters,
    stageBar,
    body,
    progress,
    status,
    content,
    close,
  };
  return dialog;
}

export function closeAcademyList(): void {
  if (!dialog) return;
  dialog.overlay.classList.remove("active");
  setBackgroundInert(false);
  if (previousFocus?.isConnected) {
    previousFocus.focus();
  }
  previousFocus = null;
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

function updateSummaryPill(): void {
  if (!dialog) return;
  if (currentCells.length === 0) {
    dialog.summary.hidden = true;
    return;
  }
  const held = currentCells.filter((cell) => cell.held).length;
  dialog.summary.textContent =
    held > 0
      ? tf("academy_summary_held", { total: currentCells.length, held })
      : tf("academy_summary_total", { total: currentCells.length });
  dialog.summary.hidden = false;
}

/** One cell: subject emblem, title, badges, description, topic tags, meta, „Üben ↗“ and „Aufnehmen“. */
export function academyRow(
  cell: AcademyCellRow,
  options: AcademyListOptions,
  status: HTMLElement,
): HTMLElement {
  const row = document.createElement("article");
  row.className = "academy-pkg-card";
  row.dataset.cellId = cell.id;

  const facet = cell.facet;
  const hue = facet?.hue ?? 225;
  setCssVar(row, "--academy-hue", String(hue));

  const head = document.createElement("div");
  head.className = "academy-pkg-head";

  if (facet?.glyph) {
    head.append(hexEmblem(facet.glyph, hue, "sm"));
  }

  const headText = document.createElement("div");
  headText.className = "academy-pkg-head-text";

  const name = document.createElement("h4");
  name.className = "academy-pkg-title";
  name.textContent = cell.title;
  headText.append(name);

  if (facet) {
    const badges = document.createElement("div");
    badges.className = "academy-pkg-badges";
    if (facet.schoolName) {
      const b = document.createElement("span");
      b.className = "academy-pill academy-pill-school";
      b.textContent = facet.schoolName;
      badges.append(b);
    }
    const gradeBadge = document.createElement("span");
    gradeBadge.className = "academy-pill";
    gradeBadge.textContent = formatGrades(facet.grades);
    badges.append(gradeBadge);
    if (facet.subjectName) {
      const b = document.createElement("span");
      b.className = "academy-pill academy-pill-subject";
      b.textContent = facet.subjectName;
      badges.append(b);
    }
    if (facet.zweige) {
      const b = document.createElement("span");
      b.className = "academy-pill";
      b.textContent = facet.zweige;
      badges.append(b);
    }
    headText.append(badges);
  }
  head.append(headText);

  const description = document.createElement("p");
  description.className = "academy-pkg-desc";
  description.textContent = cell.description;

  const footer = document.createElement("div");
  footer.className = "academy-pkg-footer";

  const meta = document.createElement("div");
  meta.className = "academy-pkg-meta";
  meta.textContent =
    facet?.lessons && facet.lessons > 0
      ? `${tf("academy_lessons_count", { lessons: facet.lessons })} · ${academyMetaText(cell)}`
      : academyMetaText(cell);

  const buttons = document.createElement("div");
  buttons.className = "academy-pkg-actions";

  if (cell.appUrl && options.openExternal) {
    const practise = document.createElement("button");
    practise.type = "button";
    practise.className = "btn secondary-btn btn-sm";
    practise.textContent = t("academy_practise");
    practise.setAttribute(
      "aria-label",
      `${t("academy_practise")}: ${cell.title}`,
    );
    practise.title = cell.appUrl;
    const url = cell.appUrl;
    practise.addEventListener("click", () => options.openExternal?.(url));
    buttons.append(practise);
  }

  if (cell.held && cell.newer) {
    const update = document.createElement("button");
    update.type = "button";
    update.className = "btn primary-btn btn-sm";
    update.dataset.action = "update";
    const label = tf("academy_update_to", { version: cell.version });
    update.textContent = label;
    update.setAttribute("aria-label", `${label}: ${cell.title}`);
    update.addEventListener("click", () => {
      update.disabled = true;
      update.textContent = t("academy_updating");
      const progress = createCellImportProgress((key, counts) =>
        tf(key, counts),
      );
      row.append(progress.element);
      importStarted();
      status.textContent = t("academy_updating");
      updateAcademyCell(cell.id, progress.update)
        .then((result) => {
          progress.finish();
          progress.remove();
          cell.heldVersion = result.version ?? cell.version;
          cell.newer = false;
          update.className = "btn secondary-btn btn-sm";
          update.textContent = tf("academy_updated", {
            version: cell.heldVersion,
          });
          status.textContent = `${cell.title}: ${tf("academy_updated", {
            version: cell.heldVersion,
          })}`;
          void Promise.resolve(options.onEnrolled?.()).catch((err) =>
            console.error("academy: refresh after update failed", err),
          );
        })
        .catch((err) => {
          progress.remove();
          update.textContent = label;
          update.disabled = false;
          status.textContent = academyErrorText(err);
        })
        .finally(importFinished);
    });
    buttons.append(update);
  } else {
    const take = document.createElement("button");
    take.type = "button";
    take.dataset.action = "take";
    if (cell.held) {
      setTaken(take);
      take.setAttribute("aria-label", `${t("academy_taken")}: ${cell.title}`);
    } else {
      setTake(take);
      take.setAttribute("aria-label", `${t("academy_take")}: ${cell.title}`);
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
            if (other) {
              setTake(take);
            } else {
              setTaken(take);
              cell.held = true;
              cell.heldVersion = result.version ?? cell.version;
              cell.newer = false;
              take.setAttribute(
                "aria-label",
                `${t("academy_taken")}: ${cell.title}`,
              );
              updateSummaryPill();
            }
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
  }

  footer.append(meta, buttons);
  row.append(head);
  if (cell.preview) row.append(academyPreviewLabel());
  if (cell.description) row.append(description);

  if (facet && facet.gebiete.length > 0) {
    const topics = document.createElement("div");
    topics.className = "academy-pkg-topics";
    for (const topic of facet.gebiete.slice(0, 6)) {
      const chip = document.createElement("span");
      chip.className = "academy-topic-tag";
      chip.textContent = topic;
      topics.append(chip);
    }
    row.append(topics);
  }

  row.append(footer);
  return row;
}

function renderSchoolChips(
  container: HTMLElement,
  scope: {
    grade?: AcademyGradeFilter;
    bereich?: string | null;
    subject?: string | null;
    query?: string;
  },
  showZeroWrap = false,
): void {
  container.replaceChildren();
  const options = buildAcademySchoolOptions(
    currentCells,
    currentTaxonomy,
    scope,
  );
  if (options.length <= 1 && !browserState.school && !showZeroWrap) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const totalCount = filterAcademyCells(
    currentCells,
    scope,
    currentTaxonomy,
  ).length;
  const addChip = (id: string | null, label: string, count: number) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "academy-chip";
    btn.setAttribute("aria-pressed", String(browserState.school === id));
    btn.dataset.school = id ?? "";
    const text = document.createElement("span");
    text.textContent = label;
    const badge = document.createElement("span");
    badge.className = "academy-chip-count";
    badge.textContent = String(count);
    btn.append(text, badge);
    btn.addEventListener("click", () => {
      const target = browserState.school === id ? null : id;
      browserState = applyAcademySchoolFilter(
        browserState,
        target,
        currentCells,
        currentTaxonomy,
      );
      renderBrowser();
    });
    container.append(btn);
  };

  addChip(null, t("academy_all_schools"), totalCount);
  for (const opt of options) {
    addChip(opt.id, opt.name ?? t("academy_school_independent"), opt.total);
  }
}

function renderListFilterDropdowns(parts: DialogParts): void {
  parts.listFilters.replaceChildren();

  const makeSelect = (
    id: string,
    labelText: string,
    options: Array<{ value: string; label: string }>,
    currentValue: string,
    onChange: (value: string) => void,
  ) => {
    const field = document.createElement("div");
    field.className = "academy-select-field";
    const label = document.createElement("label");
    label.htmlFor = id;
    label.className = "academy-select-label";
    label.textContent = labelText;
    const select = document.createElement("select");
    select.id = id;
    select.className = "input-field academy-select";
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      if (opt.value === currentValue) o.selected = true;
      select.append(o);
    }
    select.addEventListener("change", () => onChange(select.value));
    field.append(label, select);
    return field;
  };

  const schoolOpts = buildAcademySchoolOptions(currentCells, currentTaxonomy);
  parts.listFilters.append(
    makeSelect(
      "academy-filter-school",
      t("academy_school_filter_label"),
      [
        { value: "", label: t("academy_all_schools") },
        ...schoolOpts.map((s) => ({
          value: s.id,
          label: `${s.name ?? t("academy_school_independent")} (${s.total})`,
        })),
      ],
      browserState.school ?? "",
      (val) => {
        browserState.school = val || null;
        renderBrowser();
      },
    ),
  );

  const gradeTiles = buildAcademyGradeTiles(
    currentCells,
    currentTaxonomy,
    browserState.school,
  );
  const currentGradeVal =
    browserState.grade === null ? "" : String(browserState.grade);
  parts.listFilters.append(
    makeSelect(
      "academy-filter-grade",
      t("academy_grade_filter_label"),
      [
        { value: "", label: t("academy_all_grades") },
        ...gradeTiles.map((g) => ({
          value: String(g.key),
          label: `${gradeLabel(g.key)} (${g.total})`,
        })),
      ],
      currentGradeVal,
      (val) => {
        browserState.grade =
          val === ""
            ? null
            : val === ACADEMY_GRADE_CROSS
              ? ACADEMY_GRADE_CROSS
              : Number(val);
        renderBrowser();
      },
    ),
  );

  const subjectTiles = buildAcademySubjectTiles(currentCells, currentTaxonomy, {
    school: browserState.school,
    grade: browserState.grade,
  });
  parts.listFilters.append(
    makeSelect(
      "academy-filter-subject",
      t("academy_subject_filter_label"),
      [
        { value: "", label: t("academy_all_subjects") },
        ...subjectTiles.map((s) => ({
          value: s.id,
          label: `${s.name ?? t("academy_other_bucket")} (${s.total})`,
        })),
      ],
      browserState.subject ?? "",
      (val) => {
        browserState.subject = val || null;
        renderBrowser();
      },
    ),
  );

  const hasFilters = Boolean(
    browserState.school ||
      browserState.grade !== null ||
      browserState.subject ||
      browserState.query.trim(),
  );
  if (hasFilters) {
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "btn secondary-btn btn-sm academy-reset-btn";
    reset.textContent = t("academy_reset_filters");
    reset.addEventListener("click", () => {
      browserState.school = null;
      browserState.grade = null;
      browserState.bereich = null;
      browserState.subject = null;
      browserState.query = "";
      parts.searchInput.value = "";
      renderBrowser();
    });
    parts.listFilters.append(reset);
  }
}

function renderStageBar(parts: DialogParts): void {
  const isStages = browserState.mode === "stages" && !browserState.query.trim();
  parts.stageBar.hidden = !isStages;
  if (!isStages) return;

  parts.stageBar.replaceChildren();

  const crumbs: Array<{ label: string; onClick?: () => void }> = [];
  let hintText = "";

  if (browserState.lens === "schule") {
    crumbs.push({
      label: t("academy_all_grades"),
      onClick:
        browserState.grade !== null
          ? () => {
              browserState.grade = null;
              browserState.subject = null;
              renderBrowser();
            }
          : undefined,
    });
    if (browserState.grade !== null) {
      crumbs.push({
        label: gradeLabel(browserState.grade),
        onClick:
          browserState.subject !== null
            ? () => {
                browserState.subject = null;
                renderBrowser();
              }
            : undefined,
      });
    }
    if (browserState.subject !== null) {
      crumbs.push({
        label: subjectLabel(browserState.subject, currentTaxonomy),
      });
    }

    hintText =
      browserState.grade === null
        ? t("academy_stage_grade_hint")
        : browserState.subject === null
          ? t("academy_stage_subject_hint")
          : t("academy_stage_packages_hint");
  } else {
    crumbs.push({
      label: t("academy_all_areas"),
      onClick:
        browserState.bereich !== null
          ? () => {
              browserState.bereich = null;
              browserState.subject = null;
              browserState.grade = null;
              renderBrowser();
            }
          : undefined,
    });
    if (browserState.bereich !== null) {
      crumbs.push({
        label: areaLabel(browserState.bereich, currentTaxonomy),
        onClick:
          browserState.subject !== null
            ? () => {
                browserState.subject = null;
                browserState.grade = null;
                renderBrowser();
              }
            : undefined,
      });
    }
    if (browserState.subject !== null) {
      crumbs.push({
        label: subjectLabel(browserState.subject, currentTaxonomy),
      });
    }

    hintText =
      browserState.bereich === null
        ? t("academy_stage_area_hint")
        : browserState.subject === null
          ? t("academy_stage_subject_hint")
          : t("academy_stage_packages_hint");
  }

  const row = document.createElement("div");
  row.className = "academy-stage-nav-row";

  if (crumbs.length > 1) {
    const back = document.createElement("button");
    back.type = "button";
    back.className = "btn secondary-btn btn-sm academy-back-btn";
    back.textContent = `← ${t("academy_back")}`;
    back.addEventListener("click", () => {
      const parent = crumbs[crumbs.length - 2];
      parent?.onClick?.();
    });
    row.append(back);
  }

  const nav = document.createElement("nav");
  nav.className = "academy-crumbs";
  nav.setAttribute("aria-label", t("academy_breadcrumb_label"));
  const ol = document.createElement("ol");
  ol.setAttribute("role", "list");
  crumbs.forEach((crumb, idx) => {
    const li = document.createElement("li");
    const isLast = idx === crumbs.length - 1;
    if (crumb.onClick && !isLast) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "academy-crumb-btn";
      btn.textContent = crumb.label;
      btn.addEventListener("click", crumb.onClick);
      li.append(btn);
    } else {
      const span = document.createElement("span");
      span.className = "academy-crumb-current";
      span.setAttribute("aria-current", "location");
      span.textContent = crumb.label;
      li.append(span);
    }
    ol.append(li);
  });
  nav.append(ol);
  row.append(nav);

  const hint = document.createElement("p");
  hint.className = "academy-stage-hint";
  hint.textContent = hintText;

  parts.stageBar.append(row, hint);
}

function renderPackageList(
  container: HTMLElement,
  cells: AcademyCellRow[],
  parts: DialogParts,
  options?: {
    showCountHeader?: boolean;
    broadMatchesCount?: number;
    broadLabelKey?:
      | "academy_search_all_schools"
      | "academy_search_without_filters";
    onBroaden?: () => void;
  },
): void {
  const sorted = sortAcademyCellsForDisplay(cells, currentTaxonomy);

  if (options?.showCountHeader) {
    const bar = document.createElement("div");
    bar.className = "academy-results-bar";
    const count = document.createElement("span");
    count.className = "academy-results-count";
    count.textContent = tf(
      sorted.length === 1
        ? "academy_results_count_one"
        : "academy_results_count_many",
      { count: sorted.length },
    );
    bar.append(count);
    if (
      options.broadMatchesCount &&
      options.broadMatchesCount > sorted.length &&
      options.broadLabelKey &&
      options.onBroaden
    ) {
      const broaden = document.createElement("button");
      broaden.type = "button";
      broaden.className = "btn secondary-btn btn-xs";
      broaden.textContent = tf(options.broadLabelKey, {
        count: options.broadMatchesCount,
      });
      broaden.addEventListener("click", options.onBroaden);
      bar.append(broaden);
    }
    container.append(bar);
  }

  if (sorted.length === 0) {
    const empty = document.createElement("div");
    empty.className = "academy-empty-state";
    const msg = document.createElement("p");
    msg.textContent = t("academy_no_matches");
    empty.append(msg);
    if (
      options?.broadMatchesCount &&
      options.broadMatchesCount > 0 &&
      options.broadLabelKey &&
      options.onBroaden
    ) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn primary-btn btn-sm";
      btn.textContent = tf(options.broadLabelKey, {
        count: options.broadMatchesCount,
      });
      btn.addEventListener("click", options.onBroaden);
      empty.append(btn);
    } else if (
      browserState.school ||
      browserState.grade !== null ||
      browserState.subject ||
      browserState.query.trim()
    ) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn secondary-btn btn-sm";
      btn.textContent = t("academy_reset_filters");
      btn.addEventListener("click", () => {
        browserState = createAcademyBrowserState();
        parts.searchInput.value = "";
        renderBrowser();
      });
      empty.append(btn);
    }
    container.append(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "academy-package-list";
  list.setAttribute("role", "list");
  for (const cell of sorted) {
    const li = document.createElement("li");
    li.append(academyRow(cell, currentOptions, parts.status));
    list.append(li);
  }
  container.append(list);
}

function renderStageButton(config: {
  glyph: string;
  hue: number;
  title: string;
  count: number;
  held: number;
  subline?: string;
  onClick: () => void;
}): HTMLLIElement {
  const li = document.createElement("li");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "academy-stage-tile";
  setCssVar(btn, "--academy-hue", String(config.hue));
  btn.addEventListener("click", config.onClick);

  const emblem = hexEmblem(config.glyph, config.hue, "md");
  const body = document.createElement("div");
  body.className = "academy-stage-tile-body";

  const titleEl = document.createElement("span");
  titleEl.className = "academy-stage-tile-title";
  titleEl.textContent = config.title;

  const metaEl = document.createElement("span");
  metaEl.className = "academy-stage-tile-meta";
  const countSpan = document.createElement("span");
  countSpan.textContent = packageCountLabel(config.count);
  metaEl.append(countSpan);

  if (config.held > 0) {
    const heldPill = document.createElement("span");
    heldPill.className = "academy-tile-held";
    heldPill.textContent = tf("academy_taken_count", { count: config.held });
    metaEl.append(heldPill);
  }

  body.append(titleEl, metaEl);
  if (config.subline) {
    const sub = document.createElement("span");
    sub.className = "academy-stage-tile-sub";
    sub.textContent = config.subline;
    body.append(sub);
  }

  btn.append(emblem, body);
  li.append(btn);
  return li;
}

function renderBrowser(): void {
  const parts = dialog;
  if (!parts) return;

  parts.viewStagesBtn.setAttribute(
    "aria-pressed",
    String(browserState.mode === "stages"),
  );
  parts.viewListBtn.setAttribute(
    "aria-pressed",
    String(browserState.mode === "list"),
  );
  parts.lensSchoolBtn.setAttribute(
    "aria-pressed",
    String(browserState.lens === "schule"),
  );
  parts.lensWorldBtn.setAttribute(
    "aria-pressed",
    String(browserState.lens === "welt"),
  );

  const hasQuery = browserState.query.trim().length > 0;
  parts.lensGroup.hidden = browserState.mode !== "stages" || hasQuery;

  if (browserState.mode === "list") {
    parts.schoolStrip.hidden = true;
    parts.listFilters.hidden = false;
    renderListFilterDropdowns(parts);
  } else {
    parts.listFilters.hidden = true;
    const chipScope = hasQuery
      ? { query: browserState.query }
      : browserState.lens === "schule"
        ? { grade: browserState.grade, subject: browserState.subject }
        : {
            bereich: browserState.bereich,
            subject: browserState.subject,
            grade: browserState.grade,
          };
    renderSchoolChips(parts.schoolStrip, chipScope);
  }

  renderStageBar(parts);
  parts.content.replaceChildren();

  if (currentCells.length === 0) return;

  // 1. Live search (works from any stage or list mode).
  if (hasQuery) {
    const filter =
      browserState.mode === "list"
        ? {
            school: browserState.school,
            grade: browserState.grade,
            subject: browserState.subject,
            query: browserState.query,
          }
        : {
            school: browserState.school,
            query: browserState.query,
          };
    const matches = filterAcademyCells(currentCells, filter, currentTaxonomy);
    const allMatches = filterAcademyCells(
      currentCells,
      { query: browserState.query },
      currentTaxonomy,
    );
    const filteredByControls =
      browserState.mode === "list"
        ? Boolean(
            browserState.school ||
              browserState.grade !== null ||
              browserState.subject,
          )
        : Boolean(browserState.school);
    renderPackageList(parts.content, matches, parts, {
      showCountHeader: true,
      broadMatchesCount: filteredByControls ? allMatches.length : 0,
      broadLabelKey:
        browserState.mode === "list"
          ? "academy_search_without_filters"
          : "academy_search_all_schools",
      onBroaden: () => {
        browserState.school = null;
        if (browserState.mode === "list") {
          browserState.grade = null;
          browserState.subject = null;
        }
        renderBrowser();
      },
    });
    return;
  }

  // 2. Flat filterable list mode (or tiny catalog of <= 3 packages where a
  // multi-stage drilldown would only add unnecessary clicks).
  if (
    browserState.mode === "list" ||
    (currentCells.length > 0 &&
      currentCells.length <= 3 &&
      browserState.grade === null &&
      browserState.bereich === null &&
      browserState.subject === null)
  ) {
    const matches = filterAcademyCells(
      currentCells,
      {
        school: browserState.school,
        grade: browserState.grade,
        subject: browserState.subject,
      },
      currentTaxonomy,
    );
    renderPackageList(parts.content, matches, parts, {
      showCountHeader: browserState.mode === "list",
    });
    return;
  }

  // 3. Multi-stage Academy view — Schulsicht: Klasse → Fach → Schule & Pakete.
  if (browserState.lens === "schule") {
    if (browserState.grade === null) {
      const grades = buildAcademyGradeTiles(
        currentCells,
        currentTaxonomy,
        browserState.school,
      );
      const grid = document.createElement("ul");
      grid.className = "academy-tile-grid";
      grid.setAttribute("role", "list");
      for (const tile of grades) {
        grid.append(
          renderStageButton({
            glyph: tile.glyph,
            hue: tile.hue,
            title: gradeLabel(tile.key),
            count: tile.total,
            held: tile.held,
            subline:
              tile.schools.length > 0
                ? tile.schools.join(" · ")
                : t("academy_school_independent"),
            onClick: () => {
              browserState.grade = tile.key;
              browserState.subject = null;
              renderBrowser();
            },
          }),
        );
      }
      parts.content.append(grid);
      return;
    }

    if (browserState.subject === null) {
      const subjects = buildAcademySubjectTiles(currentCells, currentTaxonomy, {
        school: browserState.school,
        grade: browserState.grade,
      });
      const grid = document.createElement("ul");
      grid.className = "academy-tile-grid academy-tile-grid-subjects";
      grid.setAttribute("role", "list");
      for (const tile of subjects) {
        const subline = tile.schools
          .map((s) =>
            s.combinationGlyph
              ? `${s.short} (${s.combinationGlyph})`
              : s.combination
                ? `${s.short} (${s.combination})`
                : s.short,
          )
          .join(" · ");
        grid.append(
          renderStageButton({
            glyph: tile.glyph,
            hue: tile.hue,
            title: tile.name ?? t("academy_other_bucket"),
            count: tile.total,
            held: tile.held,
            subline: subline || undefined,
            onClick: () => {
              browserState.subject = tile.id;
              renderBrowser();
            },
          }),
        );
      }
      parts.content.append(grid);
      return;
    }

    // Stage 3: matching packages (the school strip above already scopes to this grade + subject).
    const matches = filterAcademyCells(
      currentCells,
      {
        school: browserState.school,
        grade: browserState.grade,
        subject: browserState.subject,
      },
      currentTaxonomy,
    );
    renderPackageList(parts.content, matches, parts);
    return;
  }

  // 4. Multi-stage Academy view — Weltwissen: Wissensbereich → Fach → Pakete.
  if (browserState.bereich === null) {
    const areas = buildAcademyBereichTiles(
      currentCells,
      currentTaxonomy,
      browserState.school,
    );
    const grid = document.createElement("ul");
    grid.className = "academy-tile-grid academy-tile-grid-subjects";
    grid.setAttribute("role", "list");
    for (const tile of areas) {
      grid.append(
        renderStageButton({
          glyph: tile.glyph,
          hue: tile.hue,
          title: tile.name ?? t("academy_other_bucket"),
          count: tile.total,
          held: tile.held,
          onClick: () => {
            browserState.bereich = tile.id;
            browserState.subject = null;
            browserState.grade = null;
            renderBrowser();
          },
        }),
      );
    }
    parts.content.append(grid);
    return;
  }

  if (browserState.subject === null) {
    const subjects = buildAcademySubjectTiles(currentCells, currentTaxonomy, {
      school: browserState.school,
      bereich: browserState.bereich,
    });
    const grid = document.createElement("ul");
    grid.className = "academy-tile-grid academy-tile-grid-subjects";
    grid.setAttribute("role", "list");
    for (const tile of subjects) {
      const subline = tile.schools.map((s) => s.short).join(" · ");
      grid.append(
        renderStageButton({
          glyph: tile.glyph,
          hue: tile.hue,
          title: tile.name ?? t("academy_other_bucket"),
          count: tile.total,
          held: tile.held,
          subline: subline || undefined,
          onClick: () => {
            browserState.subject = tile.id;
            browserState.grade = null;
            renderBrowser();
          },
        }),
      );
    }
    parts.content.append(grid);
    return;
  }

  // Stage 3 (Weltwissen): optional grade quick-pick + matching packages.
  const subjectScoped = filterAcademyCells(
    currentCells,
    {
      school: browserState.school,
      bereich: browserState.bereich,
      subject: browserState.subject,
    },
    currentTaxonomy,
  );
  const gradeTiles = buildAcademyGradeTiles(
    subjectScoped,
    currentTaxonomy,
    browserState.school,
  );
  if (gradeTiles.length > 1) {
    const gradeStrip = document.createElement("div");
    gradeStrip.className = "academy-chip-strip academy-sub-strip";
    gradeStrip.setAttribute("role", "group");
    gradeStrip.setAttribute("aria-label", t("academy_grade_filter_label"));
    const addGradeChip = (
      key: AcademyGradeFilter,
      label: string,
      count: number,
    ) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "academy-chip";
      btn.setAttribute("aria-pressed", String(browserState.grade === key));
      const text = document.createElement("span");
      text.textContent = label;
      const badge = document.createElement("span");
      badge.className = "academy-chip-count";
      badge.textContent = String(count);
      btn.append(text, badge);
      btn.addEventListener("click", () => {
        browserState.grade = browserState.grade === key ? null : key;
        renderBrowser();
      });
      gradeStrip.append(btn);
    };
    addGradeChip(null, t("academy_all_grades"), subjectScoped.length);
    for (const tile of gradeTiles) {
      addGradeChip(tile.key, gradeLabel(tile.key), tile.total);
    }
    parts.content.append(gradeStrip);
  }

  const matches = filterAcademyCells(
    subjectScoped,
    { grade: browserState.grade },
    currentTaxonomy,
  );
  renderPackageList(parts.content, matches, parts);
}

/** Open the ZAM Academy browser and load the lightweight catalog & index. */
export async function openAcademyList(
  options: AcademyListOptions = {},
): Promise<void> {
  previousFocus =
    typeof HTMLElement !== "undefined" &&
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  currentOptions = options;
  browserState = createAcademyBrowserState();
  const parts = ensureDialog();
  if (activeImports > 0) {
    setBackgroundInert(true);
    parts.overlay.classList.add("active");
    parts.close.focus();
    return;
  }
  parts.title.textContent = t("academy_title");
  parts.intro.textContent = t("academy_intro");
  parts.close.textContent = t("academy_close");
  parts.searchLabel.textContent = t("academy_search_label");
  parts.searchInput.placeholder = t("academy_search_placeholder");
  parts.searchInput.value = "";
  parts.viewGroup.setAttribute("aria-label", t("academy_view_label"));
  parts.viewStagesBtn.textContent = t("academy_view_stages");
  parts.viewListBtn.textContent = t("academy_view_list");
  parts.lensGroup.setAttribute("aria-label", t("academy_lens_label"));
  parts.lensSchoolBtn.textContent = t("academy_lens_school");
  parts.lensWorldBtn.textContent = t("academy_lens_world");
  parts.schoolStrip.setAttribute(
    "aria-label",
    t("academy_school_filter_label"),
  );

  parts.summary.hidden = true;
  parts.schoolStrip.hidden = true;
  parts.listFilters.hidden = true;
  parts.stageBar.hidden = true;
  parts.content.replaceChildren();
  parts.progress.hidden = false;
  parts.body.replaceChildren(parts.progress, parts.status, parts.content);
  parts.status.textContent = t("academy_loading");

  parts.overlay.classList.add("active");
  setBackgroundInert(true);
  parts.searchInput.focus();

  try {
    const listing = await fetchAcademyCells();
    parts.progress.hidden = true;
    parts.progress.remove();
    const taxonomy = listing.taxonomy ?? DEFAULT_ACADEMY_TAXONOMY;
    const needsFacet = listing.cells.some((c) => !c.facet);
    currentTaxonomy = taxonomy;
    currentCells = needsFacet
      ? enrichAcademyCells(listing.cells, null).cells
      : listing.cells;
    updateSummaryPill();
    parts.status.textContent = listing.offline
      ? t("academy_offline")
      : currentCells.length === 0
        ? t("academy_empty")
        : "";
    renderBrowser();
  } catch (err) {
    parts.progress.hidden = true;
    parts.progress.remove();
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
