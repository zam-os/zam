/**
 * Material import review (ADR 2026-10-05, Decisions 5–8): the one list in
 * which the learner decides each proposed card — Yes, No or Bonus — for both
 * the harness path and the built-in path, plus the banner that says an
 * import is waiting.
 *
 * Shared by the desktop Studio and the MCP Apps panel: it builds its own
 * dialog from the modal classes both hosts style, and talks to the bridge
 * only through `runBridge`. The pure helpers at the top carry the rules and
 * are what the tests exercise.
 */

import type {
  MaterialChoiceWire,
  MaterialImportAreasResponse,
  MaterialImportConfirmResponse,
  MaterialImportFilePreviewResponse,
  MaterialImportPendingEntry,
  MaterialImportPendingResponse,
  MaterialImportReviewResponse,
  MaterialImportRowWire,
} from "../../src/bridge/protocol.js";
import { runBridge } from "./bridge-transport.js";
import { currentLocale, t, tf } from "./i18n.js";
import {
  initRadioGroupKeyboard,
  syncRadioGroupTabStops,
} from "./radio-group.js";

export type MaterialChoices = Record<string, MaterialChoiceWire | null>;

/** Above this many choosable rows, rows preset to Bonus start collapsed. */
export const COLLAPSE_BONUS_AFTER = 12;

/**
 * A batch an agent submitted this recently opens by itself when the Studio
 * comes forward — the agent just told the learner to look here.
 */
export const AUTO_OPEN_WINDOW_MS = 10 * 60 * 1000;

// ── Rules (pure) ─────────────────────────────────────────────────────────────

/** A held existing item is information, not a choice. */
export function isChoosable(row: MaterialImportRowWire): boolean {
  return !(row.kind === "existing" && row.held);
}

/** Every choosable row starts on its preset; `null` means "not chosen". */
export function initialChoices(rows: MaterialImportRowWire[]): MaterialChoices {
  const choices: MaterialChoices = {};
  for (const row of rows) {
    if (isChoosable(row)) choices[row.id] = row.preset;
  }
  return choices;
}

export interface ConfirmCounts {
  yes: number;
  bonus: number;
  /** Rows without a choice, or with No. */
  notSaved: number;
}

export function confirmCounts(
  rows: MaterialImportRowWire[],
  choices: MaterialChoices,
): ConfirmCounts {
  const counts: ConfirmCounts = { yes: 0, bonus: 0, notSaved: 0 };
  for (const row of rows) {
    if (!isChoosable(row)) continue;
    const choice = choices[row.id];
    if (choice === "yes") counts.yes++;
    else if (choice === "bonus") counts.bonus++;
    else counts.notSaved++;
  }
  return counts;
}

/** "Add 7 · 2 as Bonus · 3 not saved" — unchosen rows never vanish silently. */
export function confirmLabel(counts: ConfirmCounts): string {
  const parts = [tf("material_review_confirm", { count: counts.yes })];
  if (counts.bonus > 0) {
    parts.push(tf("material_review_confirm_bonus", { count: counts.bonus }));
  }
  if (counts.notSaved > 0) {
    parts.push(
      tf("material_review_confirm_not_saved", { count: counts.notSaved }),
    );
  }
  return parts.join(" · ");
}

/** Proposed area → confirmed area, for the areas the learner changed. */
export function changedAreas(
  edited: Record<string, string>,
): Record<string, string> {
  const changed: Record<string, string> = {};
  for (const [proposed, value] of Object.entries(edited)) {
    const confirmed = value.trim();
    if (confirmed.length > 0 && confirmed !== proposed) {
      changed[proposed] = confirmed;
    }
  }
  return changed;
}

/** Arguments for `material-import-confirm`. */
export function confirmArgs(
  id: string,
  choices: MaterialChoices,
  editedAreas: Record<string, string>,
): string[] {
  const decisions: Record<string, MaterialChoiceWire> = {};
  for (const [rowId, choice] of Object.entries(choices)) {
    if (choice) decisions[rowId] = choice;
  }
  const args = ["--id", id, "--decisions", JSON.stringify(decisions)];
  const areas = changedAreas(editedAreas);
  if (Object.keys(areas).length > 0) {
    args.push("--areas", JSON.stringify(areas));
  }
  return args;
}

export interface ReviewGroup {
  area: string;
  /** Proposal rows, each followed by the existing item beside it. */
  rows: MaterialImportRowWire[];
}

/** Rows per proposed area, then what the material leads to. */
export function reviewGroups(review: MaterialImportReviewResponse): {
  groups: ReviewGroup[];
  continuations: MaterialImportRowWire[];
} {
  const beside = new Map<number, MaterialImportRowWire>();
  const own = new Map<number, MaterialImportRowWire>();
  const continuations: MaterialImportRowWire[] = [];
  for (const row of review.rows) {
    if (row.kind === "proposal") own.set(row.proposalIndex, row);
    else if (row.kind === "existing") beside.set(row.besideProposal, row);
    else continuations.push(row);
  }
  const groups = review.areaGroups.map((group) => {
    const rows: MaterialImportRowWire[] = [];
    for (const index of group.proposalIndexes) {
      const proposal = own.get(index);
      if (proposal) rows.push(proposal);
      const match = beside.get(index);
      if (match) rows.push(match);
    }
    return { area: group.area, rows };
  });
  return { groups, continuations };
}

/** Long lists fold their Bonus rows, so the list stays readable. */
export function startsCollapsed(
  row: MaterialImportRowWire,
  choices: MaterialChoices,
  choosableCount: number,
): boolean {
  return choosableCount > COLLAPSE_BONUS_AFTER && choices[row.id] === "bonus";
}

/** "chemie · Stoffe und Stoffeigenschaften · Realschule, Anfangsunterricht" */
export function analysisLine(
  analysis: MaterialImportReviewResponse["analysis"],
): string {
  return [analysis.subjects.join(", "), analysis.topic, analysis.level]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(" · ");
}

export function originLabel(origin: "page" | "completed" | "extra"): string {
  switch (origin) {
    case "page":
      return t("material_origin_page");
    case "completed":
      return t("material_origin_completed");
    case "extra":
      return t("material_origin_extra");
  }
}

/** "You imported this file on 5 Oct." — informs, never blocks. */
export function reimportNotice(
  reimports: MaterialImportReviewResponse["reimports"],
  locale: string = currentLocale,
): string | null {
  if (reimports.length === 0) return null;
  const newest = [...reimports].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )[0];
  const date = new Date(newest.createdAt);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(date);
  return tf("material_review_reimport", { date: formatted });
}

export function pendingBannerText(
  imports: MaterialImportPendingEntry[],
): string | null {
  if (imports.length === 0) return null;
  if (imports.length === 1) {
    return tf("material_pending_one", { title: imports[0].title });
  }
  return tf("material_pending_many", { count: imports.length });
}

/**
 * The harness batch to open by itself: new to this Studio session and
 * submitted within {@link AUTO_OPEN_WINDOW_MS}. Older or Studio-made batches
 * wait behind the banner.
 */
export function freshHarnessImport(
  imports: MaterialImportPendingEntry[],
  announced: ReadonlySet<string>,
  now: number,
): MaterialImportPendingEntry | null {
  return (
    imports.find((entry) => {
      if (entry.origin !== "harness" || announced.has(entry.id)) return false;
      const created = Date.parse(entry.createdAt);
      return Number.isFinite(created) && now - created <= AUTO_OPEN_WINDOW_MS;
    }) ?? null
  );
}

export function previewNote(
  preview: MaterialImportFilePreviewResponse,
): string {
  switch (preview.reason) {
    case "missing":
      return t("material_preview_missing");
    case "too-large":
      return t("material_preview_too_large");
    default:
      return t("material_preview_not_viewable");
  }
}

// ── Dialog ───────────────────────────────────────────────────────────────────

export interface MaterialReviewOptions {
  /** Runs after a confirm wrote cards — e.g. reload the card list. */
  onConfirmed?: () => void | Promise<void>;
}

interface DialogParts {
  overlay: HTMLElement;
  title: HTMLElement;
  meta: HTMLElement;
  intro: HTMLElement;
  notice: HTMLElement;
  status: HTMLElement;
  preview: HTMLElement;
  list: HTMLElement;
  discard: HTMLButtonElement;
  later: HTMLButtonElement;
  confirm: HTMLButtonElement;
}

const OVERLAY_ID = "material-review-overlay";
const AREA_LIST_ID = "material-review-areas";
const BORDER =
  "1px solid var(--clr-border, var(--border-card-frosted, rgba(127, 127, 127, 0.3)))";

let dialog: DialogParts | null = null;
let busy = false;
let current: {
  review: MaterialImportReviewResponse;
  choices: MaterialChoices;
  areas: Record<string, string>;
  options: MaterialReviewOptions;
} | null = null;

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  return node;
}

function ensureDialog(): DialogParts {
  if (dialog?.overlay.isConnected) return dialog;

  const overlay = element("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "modal-overlay";

  const box = element("div", { maxWidth: "960px", width: "94vw" });
  box.className = "modal-box";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");

  const header = element("div");
  header.className = "modal-header";
  const title = element("h3");
  title.id = "lbl-material-review-title";
  header.append(title);
  box.setAttribute("aria-labelledby", title.id);

  const body = element("div", {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });
  body.className = "modal-body";
  const meta = element("p", { margin: "0", fontWeight: "600" });
  const intro = element("p", { margin: "0", fontSize: "0.85rem" });
  const notice = element("p", { margin: "0", fontSize: "0.85rem" });
  const status = element("p", { margin: "0", fontWeight: "600" });
  status.setAttribute("aria-live", "polite");

  const columns = element("div", {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    alignItems: "flex-start",
  });
  // The page stays in view while the learner decides (Decision 5).
  const preview = element("div", {
    flex: "0 1 260px",
    minWidth: "200px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "62vh",
    overflowY: "auto",
  });
  const list = element("div", {
    flex: "1 1 420px",
    minWidth: "280px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "62vh",
    overflowY: "auto",
    paddingRight: "4px",
  });
  columns.append(preview, list);
  body.append(meta, intro, notice, status, columns);

  const actions = element("div");
  actions.className = "modal-actions";
  const discard = element("button", { marginRight: "auto" });
  discard.type = "button";
  discard.className = "btn secondary-btn btn-sm";
  discard.addEventListener("click", () => {
    void discardCurrent();
  });
  const later = element("button");
  later.type = "button";
  later.className = "btn secondary-btn btn-sm";
  later.addEventListener("click", () => closeMaterialReview());
  const confirm = element("button");
  confirm.type = "button";
  confirm.className = "btn primary-btn btn-sm";
  confirm.addEventListener("click", () => {
    void confirmCurrent();
  });
  actions.append(discard, later, confirm);

  box.append(header, body, actions);
  overlay.append(box);
  // On the window, not the overlay: re-rendering removes the focused control.
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      closeMaterialReview();
    }
  });
  document.body.append(overlay);

  dialog = {
    overlay,
    title,
    meta,
    intro,
    notice,
    status,
    preview,
    list,
    discard,
    later,
    confirm,
  };
  return dialog;
}

export function closeMaterialReview(): void {
  if (busy) return;
  dialog?.overlay.classList.remove("active");
}

function badge(text: string, emphasis = false): HTMLElement {
  const node = element("span", {
    display: "inline-block",
    fontSize: "0.72rem",
    fontWeight: "600",
    padding: "1px 8px",
    borderRadius: "999px",
    border: BORDER,
    opacity: emphasis ? "1" : "0.85",
  });
  node.textContent = text;
  return node;
}

function updateConfirm(parts: DialogParts): void {
  if (!current) return;
  const counts = confirmCounts(current.review.rows, current.choices);
  parts.confirm.textContent = confirmLabel(counts);
  parts.confirm.disabled = busy || counts.yes + counts.bonus === 0;
}

const CHOICES: Array<{ value: MaterialChoiceWire; label: () => string }> = [
  { value: "yes", label: () => t("material_choice_yes") },
  { value: "no", label: () => t("material_choice_no") },
  { value: "bonus", label: () => t("material_choice_bonus") },
];

function choiceControl(
  parts: DialogParts,
  row: MaterialImportRowWire,
): HTMLElement {
  const group = element("div", {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  });
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", t("material_choice_group"));
  const paint = () => {
    const chosen = current?.choices[row.id] ?? null;
    for (const button of group.querySelectorAll<HTMLButtonElement>(
      '[role="radio"]',
    )) {
      const checked = button.dataset.choice === chosen;
      button.setAttribute("aria-checked", String(checked));
      button.className = checked
        ? "btn primary-btn btn-sm"
        : "btn secondary-btn btn-sm";
    }
    syncRadioGroupTabStops(group);
  };
  for (const option of CHOICES) {
    const button = element("button");
    button.type = "button";
    button.setAttribute("role", "radio");
    button.dataset.choice = option.value;
    button.textContent = option.label();
    button.addEventListener("click", () => {
      if (!current || busy) return;
      current.choices[row.id] = option.value;
      paint();
      updateConfirm(parts);
    });
    group.append(button);
  }
  paint();
  initRadioGroupKeyboard(group);
  return group;
}

function rowText(
  review: MaterialImportReviewResponse,
  row: MaterialImportRowWire,
): { question: string; answer: string } {
  if (row.kind === "proposal") {
    const proposal = review.proposals[row.proposalIndex];
    return { question: proposal.question, answer: proposal.answer };
  }
  return { question: row.question, answer: row.answer };
}

function rowElement(
  parts: DialogParts,
  row: MaterialImportRowWire,
  choosableCount: number,
): HTMLElement {
  if (!current) throw new Error("no review open");
  const { review, choices } = current;
  const article = element("article", {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: BORDER,
    marginLeft: row.kind === "existing" ? "24px" : "0",
  });
  article.dataset.rowId = row.id;

  const badges = element("div", {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
  });
  if (row.kind === "proposal") {
    const proposal = review.proposals[row.proposalIndex];
    badges.append(badge(originLabel(proposal.origin)));
    if (proposal.hardToRead) {
      badges.append(badge(t("material_hard_to_read"), true));
    }
  } else if (row.kind === "existing") {
    badges.append(badge(t("material_existing"), true));
  }
  if (badges.childElementCount > 0) article.append(badges);

  const { question, answer } = rowText(review, row);
  const questionEl = element("div", { fontWeight: "600" });
  questionEl.textContent = question;
  const answerEl = element("div", { fontSize: "0.9rem" });
  answerEl.textContent = answer;
  article.append(questionEl, answerEl);

  if (startsCollapsed(row, choices, choosableCount)) {
    answerEl.hidden = true;
    const reveal = element("button", { alignSelf: "flex-start" });
    reveal.type = "button";
    reveal.className = "btn secondary-btn btn-sm";
    reveal.textContent = t("material_review_show_answer");
    reveal.addEventListener("click", () => {
      answerEl.hidden = false;
      reveal.remove();
    });
    article.append(reveal);
  }

  if (row.kind === "existing" && row.held) {
    const held = element("div", { fontSize: "0.85rem", fontStyle: "italic" });
    held.textContent = t("material_existing_held");
    article.append(held);
  } else {
    article.append(choiceControl(parts, row));
  }
  return article;
}

function areaField(area: string): HTMLElement {
  const label = element("label", {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "600",
  });
  const text = element("span");
  text.textContent = t("material_area_label");
  const input = element("input", { flex: "1" });
  input.type = "text";
  input.className = "editor-input";
  input.value = area;
  input.setAttribute("list", AREA_LIST_ID);
  input.addEventListener("input", () => {
    if (current) current.areas[area] = input.value;
  });
  label.append(text, input);
  return label;
}

function renderReview(parts: DialogParts): void {
  if (!current) return;
  const { review } = current;
  parts.title.textContent = review.analysis.title;
  parts.meta.textContent = analysisLine(review.analysis);
  parts.intro.textContent =
    review.harness !== null
      ? `${tf("material_review_from", { harness: review.harness })} ${t("material_review_intro")}`
      : t("material_review_intro");
  const notice = reimportNotice(review.reimports);
  parts.notice.textContent = notice ?? "";
  parts.notice.hidden = notice === null;
  parts.status.textContent = "";

  const choosable = review.rows.filter(isChoosable).length;
  const { groups, continuations } = reviewGroups(review);
  parts.list.replaceChildren();
  for (const group of groups) {
    const section = element("section", {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    });
    section.append(areaField(group.area));
    for (const row of group.rows) {
      section.append(rowElement(parts, row, choosable));
    }
    parts.list.append(section);
  }
  if (continuations.length > 0) {
    const section = element("section", {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    });
    const heading = element("h4", { margin: "4px 0 0" });
    heading.textContent = t("material_continuation_heading");
    section.append(heading);
    for (const row of continuations) {
      section.append(rowElement(parts, row, choosable));
    }
    parts.list.append(section);
  }
  parts.discard.textContent = t("material_review_discard");
  parts.later.textContent = t("material_review_later");
  parts.discard.hidden = false;
  parts.confirm.hidden = false;
  updateConfirm(parts);
}

async function loadAreaOptions(): Promise<void> {
  let datalist = document.getElementById(AREA_LIST_ID);
  if (!datalist) {
    datalist = element("datalist");
    datalist.id = AREA_LIST_ID;
    document.body.append(datalist);
  }
  try {
    const context = await runBridge<MaterialImportAreasResponse>(
      "material-import-areas",
    );
    datalist.replaceChildren(
      ...context.areas.map((area) => {
        const option = element("option");
        option.value = area.path;
        return option;
      }),
    );
  } catch {
    // Free text still works without suggestions.
  }
}

async function loadPreviews(
  parts: DialogParts,
  review: MaterialImportReviewResponse,
): Promise<void> {
  parts.preview.replaceChildren();
  parts.preview.hidden = review.files.length === 0;
  for (let index = 0; index < review.files.length; index++) {
    const figure = element("figure", {
      margin: "0",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
    });
    const caption = element("figcaption", {
      fontSize: "0.75rem",
      wordBreak: "break-all",
    });
    caption.textContent = review.files[index].name;
    figure.append(caption);
    parts.preview.append(figure);
    try {
      const preview = await runBridge<MaterialImportFilePreviewResponse>(
        "material-import-file-preview",
        ["--id", review.id, "--file", String(index)],
      );
      if (preview.dataUrl) {
        const image = element("img", {
          width: "100%",
          borderRadius: "8px",
          border: BORDER,
        });
        image.src = preview.dataUrl;
        image.alt = review.files[index].name;
        figure.insertBefore(image, caption);
      } else {
        const note = element("div", { fontSize: "0.75rem", opacity: "0.8" });
        note.textContent = preview.path
          ? `${previewNote(preview)} ${preview.path}`
          : previewNote(preview);
        figure.append(note);
      }
    } catch {
      // The name stays; the review works without the picture.
    }
  }
}

/** Open the review list for one waiting import. */
export async function openMaterialReview(
  id: string,
  options: MaterialReviewOptions = {},
): Promise<void> {
  const parts = ensureDialog();
  if (busy) return;
  parts.overlay.classList.add("active");
  parts.title.textContent = t("material_review_loading");
  parts.meta.textContent = "";
  parts.intro.textContent = "";
  parts.notice.hidden = true;
  parts.status.textContent = t("material_review_loading");
  parts.list.replaceChildren();
  parts.preview.replaceChildren();
  parts.discard.hidden = true;
  parts.confirm.hidden = true;
  parts.later.textContent = t("material_review_later");
  parts.later.focus();
  try {
    const review = await runBridge<MaterialImportReviewResponse>(
      "material-import-review",
      ["--id", id],
    );
    if (!review?.success) throw new Error(t("material_review_error"));
    current = {
      review,
      choices: initialChoices(review.rows),
      areas: {},
      options,
    };
    renderReview(parts);
    void loadAreaOptions();
    void loadPreviews(parts, review);
  } catch (err) {
    current = null;
    parts.status.textContent = errorText(err);
  }
}

function errorText(err: unknown): string {
  const prefix = t("material_review_error");
  const reason = err instanceof Error ? err.message : String(err);
  return !reason || reason === prefix ? prefix : `${prefix}: ${reason}`;
}

function setControlsDisabled(parts: DialogParts, disabled: boolean): void {
  for (const control of parts.list.querySelectorAll<
    HTMLButtonElement | HTMLInputElement
  >("button, input")) {
    control.disabled = disabled;
  }
  parts.discard.disabled = disabled;
  parts.later.disabled = disabled;
}

async function confirmCurrent(): Promise<void> {
  const parts = ensureDialog();
  if (!current || busy) return;
  const { review, choices, areas, options } = current;
  busy = true;
  setControlsDisabled(parts, true);
  updateConfirm(parts);
  parts.status.textContent = t("material_review_saving");
  try {
    const result = await runBridge<MaterialImportConfirmResponse>(
      "material-import-confirm",
      confirmArgs(review.id, choices, areas),
    );
    if (!result?.success) throw new Error(t("material_review_error"));
    current = null;
    parts.status.textContent = tf("material_review_done", {
      cards: result.cardsCreated,
      bonus: result.bonusKept,
    });
    parts.list.replaceChildren();
    parts.preview.replaceChildren();
    parts.discard.hidden = true;
    parts.confirm.hidden = true;
    parts.later.textContent = t("material_review_close");
    busy = false;
    setControlsDisabled(parts, false);
    parts.later.focus();
    await options.onConfirmed?.();
    void refreshPendingMaterialImports();
  } catch (err) {
    busy = false;
    setControlsDisabled(parts, false);
    updateConfirm(parts);
    parts.status.textContent = errorText(err);
  }
}

async function discardCurrent(): Promise<void> {
  const parts = ensureDialog();
  if (!current || busy) return;
  if (!window.confirm(t("material_review_discard_confirm"))) return;
  busy = true;
  setControlsDisabled(parts, true);
  try {
    await runBridge("material-import-discard", ["--id", current.review.id]);
    current = null;
    busy = false;
    setControlsDisabled(parts, false);
    closeMaterialReview();
    void refreshPendingMaterialImports();
  } catch (err) {
    busy = false;
    setControlsDisabled(parts, false);
    parts.status.textContent = errorText(err);
  }
}

// ── Waiting imports ──────────────────────────────────────────────────────────

const BANNER_ID = "material-pending-banner";
const NAV_BADGE_ID = "nav-content-pending-badge";

let pending: MaterialImportPendingEntry[] = [];
let refreshing: Promise<void> | null = null;
let bannerOptions: MaterialReviewOptions = {};
let autoOpen = false;
const announced = new Set<string>();

function ensureBanner(): HTMLElement | null {
  const existing = document.getElementById(BANNER_ID);
  if (existing) return existing;
  const layout = document.getElementById("content-studio-layout");
  if (!layout?.parentElement) return null;
  const banner = element("div", {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px",
    margin: "0 0 12px",
    borderRadius: "12px",
    border: BORDER,
  });
  banner.id = BANNER_ID;
  banner.className = "frosted";
  banner.hidden = true;
  banner.setAttribute("role", "status");
  const text = element("span", { flex: "1", fontWeight: "600" });
  text.dataset.role = "text";
  const open = element("button");
  open.type = "button";
  open.className = "btn primary-btn btn-sm";
  open.dataset.role = "open";
  open.addEventListener("click", () => {
    const newest = pending[0];
    if (newest) void openMaterialReview(newest.id, bannerOptions);
  });
  banner.append(text, open);
  layout.parentElement.insertBefore(banner, layout);
  return banner;
}

function renderPending(): void {
  if (typeof document === "undefined") return;
  const banner = ensureBanner();
  const text = pendingBannerText(pending);
  if (banner) {
    banner.hidden = text === null;
    const label = banner.querySelector<HTMLElement>('[data-role="text"]');
    const open = banner.querySelector<HTMLElement>('[data-role="open"]');
    if (label) label.textContent = text ?? "";
    if (open) open.textContent = t("material_pending_open");
  }
  const nav = document.getElementById("nav-content");
  if (nav) {
    let navBadge = document.getElementById(NAV_BADGE_ID);
    if (!navBadge) {
      navBadge = element("span", {
        marginLeft: "6px",
        fontSize: "0.72rem",
        fontWeight: "700",
        padding: "0 6px",
        borderRadius: "999px",
        border: BORDER,
      });
      navBadge.id = NAV_BADGE_ID;
      nav.append(navBadge);
    }
    navBadge.textContent = String(pending.length);
    navBadge.hidden = pending.length === 0;
    navBadge.setAttribute("aria-label", text ?? "");
  }
}

/** Ask the bridge which imports are waiting, and show it. */
export async function refreshPendingMaterialImports(): Promise<
  MaterialImportPendingEntry[]
> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const response = await runBridge<MaterialImportPendingResponse>(
          "material-import-pending",
        );
        pending = response?.success ? response.imports : [];
      } catch (err) {
        console.warn("material-import-pending failed", err);
      }
      renderPending();
      const fresh = freshHarnessImport(pending, announced, Date.now());
      for (const entry of pending) announced.add(entry.id);
      const open = dialog?.overlay.classList.contains("active") ?? false;
      if (autoOpen && fresh && !open && !busy) {
        void openMaterialReview(fresh.id, bannerOptions);
      }
    })().finally(() => {
      refreshing = null;
    });
  }
  await refreshing;
  return pending;
}

/**
 * Show waiting imports in Learning Content and keep the banner current: on
 * load, and whenever the window comes back — an agent may have submitted a
 * batch while the learner was in their harness.
 */
export function initMaterialImports(options: MaterialReviewOptions = {}): void {
  bannerOptions = options;
  autoOpen = true;
  void refreshPendingMaterialImports();
  window.addEventListener("focus", () => {
    void refreshPendingMaterialImports();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void refreshPendingMaterialImports();
    }
  });
}
