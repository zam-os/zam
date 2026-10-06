/**
 * Starting a material import from the Studio (ADR 2026-10-05 Decisions 1–3,
 * 11). One dialog, two ways in:
 *
 * - **Read it here.** The picked photos or PDF go to the learner's connected
 *   model, named in the dialog, and its proposals open in the review list.
 * - **Through a harness.** The learner's AI app reads the file, can ask back,
 *   and submits its proposals to the same list. ZAM cannot put a file into
 *   another app's chat (ADR 2026-07-18c), so the dialog hands the learner a
 *   ready request to paste — with the file's path once they picked it here,
 *   so a terminal agent such as opencode can open it directly.
 *
 * Desktop only: the shell injects the file picker, drops, progress and the
 * ways to the settings; without them the matching parts are left out.
 */

import type {
  AgentHarnessStatusResponse,
  MaterialAnalyzeCodeWire,
  MaterialImportAnalyzeResponse,
  MaterialImportModelsResponse,
} from "../../src/bridge/protocol.js";
import {
  type MaterialFileKind,
  materialFileKind,
  materialSelection,
} from "../../src/cli/llm/material-prompt.js";
import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";
import {
  type MaterialReviewOptions,
  openMaterialReview,
  refreshPendingMaterialImports,
} from "./material-review.js";
import { rememberDisplay, setShown } from "./visibility.js";

export interface MaterialImportHost {
  /** Native multi-file picker for photos and PDFs; absolute paths. */
  pickFiles?: () => Promise<string[]>;
  /** Open the settings where an agent harness is connected to ZAM. */
  openAgentSetup?: () => void;
  /** Open the setup where a model is connected. */
  openModelSetup?: () => void;
  /**
   * Settles once an overdue check of the models' capabilities is done, so
   * the dialog names the model that really reads the files.
   */
  modelsChecked?: () => Promise<void>;
  /** Files dropped on the window; returns the unsubscribe. */
  onFileDrop?: (listener: (paths: string[]) => void) => Promise<() => void>;
  /**
   * Run a model-bound bridge command in its own process, so the minute a
   * model takes to read the pages does not hold up the rest of the Studio.
   */
  runInBackground?: (cmd: string, args: string[]) => Promise<unknown>;
}

let host: MaterialImportHost = {};

export function setMaterialImportHost(next: MaterialImportHost): void {
  host = next;
}

// ── Rules (pure) ─────────────────────────────────────────────────────────────

/** Harnesses that carry ZAM's MCP entry, by their display label. */
export function connectedHarnesses(
  report: AgentHarnessStatusResponse | null | undefined,
): string[] {
  if (!report?.success) return [];
  return report.harnesses
    .filter((harness) => harness.configured)
    .map((harness) => harness.label);
}

/**
 * The request the learner pastes into their harness. Each path is quoted and
 * several go one per line: Desktop and iCloud paths carry spaces, and a comma
 * in a file name must not read as a separator.
 */
export function harnessRequestText(paths: string[]): string {
  if (paths.length === 0) return t("material_start_request_drop");
  if (paths.length === 1) {
    return tf("material_start_request_one", { file: paths[0] });
  }
  return tf("material_start_request_files", {
    files: paths.map((path) => `"${path}"`).join("\n"),
  });
}

/** "opencode", "opencode / Claude Code" */
export function harnessNames(labels: string[]): string {
  return labels.join(" / ");
}

export { type MaterialFileKind, materialFileKind };

/** What the "read it here" part shows for these files and models. */
export type BuiltInState =
  | { kind: "hidden" }
  | { kind: "waiting"; model: string }
  | { kind: "ready"; model: string; pdf: boolean }
  | { kind: "blocked"; key: string; setup: boolean };

/** Up to ten photos or one PDF, and a model that reads them (D1, D3). */
export function builtInState(
  paths: string[],
  models: MaterialImportModelsResponse | null,
): BuiltInState {
  if (!models?.success) return { kind: "hidden" };
  const blocked = (key: string, setup = false): BuiltInState => ({
    kind: "blocked",
    key,
    setup,
  });
  const noImageModel = blocked("material_builtin_no_image_model", true);
  if (paths.length === 0) {
    return models.image
      ? { kind: "waiting", model: models.image.label }
      : noImageModel;
  }
  const selection = materialSelection(paths);
  if (!selection.ok) return blocked(analyzeRefusalKey(selection.code));
  if (selection.kind === "pdf") {
    return models.file
      ? { kind: "ready", model: models.file.label, pdf: true }
      : blocked("material_builtin_no_file_model");
  }
  if (!models.image) return noImageModel;
  if (
    paths.some((path) => materialFileKind(path) === "heic") &&
    !models.convertsHeic
  ) {
    return blocked("material_builtin_heic");
  }
  return { kind: "ready", model: models.image.label, pdf: false };
}

export function analyzeArgs(paths: string[], pages: string): string[] {
  const range = pages.trim();
  return ["--file", ...paths, ...(range ? ["--pages", range] : [])];
}

/** The learner-facing line for a refusal from `material-import-analyze`. */
export function analyzeRefusalKey(code: MaterialAnalyzeCodeWire): string {
  switch (code) {
    case "no-image-model":
      return "material_builtin_no_image_model";
    case "no-file-model":
      return "material_builtin_no_file_model";
    case "heic":
      return "material_builtin_heic";
    case "mixed":
      return "material_builtin_mixed";
    case "one-pdf":
      return "material_builtin_one_pdf";
    case "too-many":
      return "material_builtin_too_many";
    case "unsupported":
    case "no-files":
      return "material_builtin_unsupported";
    case "too-large":
      return "material_builtin_too_large";
    case "missing":
      return "material_builtin_missing";
    case "invalid-answer":
      return "material_builtin_invalid";
    default:
      return "material_builtin_failed";
  }
}

// ── Dialog ───────────────────────────────────────────────────────────────────

interface StartParts {
  overlay: HTMLElement;
  title: HTMLElement;
  subject: HTMLElement;
  choose: HTMLButtonElement;
  selected: HTMLElement;
  dropHint: HTMLElement;
  builtIn: HTMLElement;
  builtInTitle: HTMLElement;
  builtInText: HTMLElement;
  pagesRow: HTMLElement;
  pagesLabel: HTMLLabelElement;
  pages: HTMLInputElement;
  analyze: HTMLButtonElement;
  modelSetup: HTMLButtonElement;
  builtInStatus: HTMLElement;
  harnessText: HTMLElement;
  request: HTMLTextAreaElement;
  copy: HTMLButtonElement;
  copyStatus: HTMLElement;
  noHarness: HTMLElement;
  setup: HTMLButtonElement;
  after: HTMLElement;
  close: HTMLButtonElement;
}

const OVERLAY_ID = "material-import-start-overlay";
let parts: StartParts | null = null;
let paths: string[] = [];
let harnesses: string[] = [];
let models: MaterialImportModelsResponse | null = null;
let analyzing = false;
let reviewOptions: MaterialReviewOptions = {};
let stopDrop: (() => void) | null = null;

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
  rememberDisplay(node);
  return node;
}

function section(): HTMLElement {
  const node = element("div", {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });
  node.className = "modal-impact-section";
  return node;
}

function button(className: string, onClick: () => void): HTMLButtonElement {
  const node = element("button");
  node.type = "button";
  node.className = className;
  node.addEventListener("click", onClick);
  return node;
}

function ensureDialog(): StartParts {
  if (parts?.overlay.isConnected) return parts;
  const overlay = element("div");
  overlay.id = OVERLAY_ID;
  overlay.className = "modal-overlay";
  const box = element("div", { maxWidth: "620px" });
  box.className = "modal-box";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");

  const header = element("div");
  header.className = "modal-header";
  const title = element("h3");
  title.id = "lbl-material-import-start-title";
  header.append(title);
  box.setAttribute("aria-labelledby", title.id);

  const body = element("div", {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  });
  body.className = "modal-body";
  const subject = element("p", { margin: "0", fontWeight: "600" });

  const pick = element("div", {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  });
  const choose = button("btn secondary-btn btn-sm", () => {
    void chooseFiles();
  });
  const selected = element("span", {
    fontSize: "0.85rem",
    wordBreak: "break-all",
  });
  pick.append(choose, selected);
  const dropHint = element("p", {
    margin: "0",
    fontSize: "0.8rem",
    opacity: "0.8",
  });

  const builtIn = section();
  const builtInTitle = element("strong");
  const builtInText = element("p", { margin: "0" });
  const pagesRow = element("div", {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  });
  const pagesLabel = element("label", { fontSize: "0.85rem" });
  const pages = element("input", { maxWidth: "140px" });
  pages.type = "text";
  pages.id = "material-import-pages";
  pages.className = "editor-input";
  pagesLabel.htmlFor = pages.id;
  pagesRow.append(pagesLabel, pages);
  const builtInActions = element("div", {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  });
  const analyze = button("btn primary-btn btn-sm", () => {
    void analyzeHere();
  });
  const modelSetup = button("btn secondary-btn btn-sm", () => {
    closeMaterialImportStart();
    host.openModelSetup?.();
  });
  const builtInStatus = element("span", { fontSize: "0.85rem" });
  builtInStatus.setAttribute("aria-live", "polite");
  builtInActions.append(analyze, modelSetup, builtInStatus);
  builtIn.append(builtInTitle, builtInText, pagesRow, builtInActions);

  const harnessSection = section();
  const harnessText = element("p", { margin: "0" });
  const request = element("textarea", { minHeight: "72px" });
  request.className = "editor-textarea";
  request.readOnly = true;
  const copyRow = element("div", {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  });
  const copy = button("btn secondary-btn btn-sm", () => {
    void copyRequest();
  });
  const copyStatus = element("span", { fontSize: "0.85rem" });
  copyStatus.setAttribute("aria-live", "polite");
  copyRow.append(copy, copyStatus);
  harnessSection.append(harnessText, request, copyRow);

  const noHarness = section();
  const noHarnessText = element("p", { margin: "0" });
  noHarnessText.dataset.role = "text";
  const setup = button("btn secondary-btn btn-sm", () => {
    closeMaterialImportStart();
    host.openAgentSetup?.();
  });
  setup.style.alignSelf = "flex-start";
  noHarness.append(noHarnessText, setup);

  const after = element("p", { margin: "0", fontSize: "0.85rem" });
  body.append(
    subject,
    pick,
    dropHint,
    builtIn,
    harnessSection,
    noHarness,
    after,
  );

  const actions = element("div");
  actions.className = "modal-actions";
  const close = button("btn secondary-btn btn-sm", () =>
    closeMaterialImportStart(),
  );
  actions.append(close);

  box.append(header, body, actions);
  overlay.append(box);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      closeMaterialImportStart();
    }
  });
  document.body.append(overlay);

  parts = {
    overlay,
    title,
    subject,
    choose,
    selected,
    dropHint,
    builtIn,
    builtInTitle,
    builtInText,
    pagesRow,
    pagesLabel,
    pages,
    analyze,
    modelSetup,
    builtInStatus,
    harnessText,
    request,
    copy,
    copyStatus,
    noHarness,
    setup,
    after,
    close,
  };
  return parts;
}

function renderBuiltIn(dialog: StartParts): void {
  const state = builtInState(paths, models);
  setShown(dialog.builtIn, state.kind !== "hidden");
  dialog.builtInTitle.textContent = t("material_builtin_title");
  dialog.pagesLabel.textContent = t("material_builtin_pages");
  dialog.pages.placeholder = t("material_builtin_pages_placeholder");
  setShown(dialog.pagesRow, state.kind === "ready" && state.pdf);
  dialog.analyze.textContent = t("material_builtin_analyze");
  setShown(dialog.analyze, state.kind === "ready");
  dialog.analyze.disabled = analyzing;
  dialog.modelSetup.textContent = t("material_builtin_setup");
  setShown(
    dialog.modelSetup,
    state.kind === "blocked" && state.setup && Boolean(host.openModelSetup),
  );
  switch (state.kind) {
    case "waiting":
      dialog.builtInText.textContent = tf("material_builtin_photos_to", {
        model: state.model,
      });
      break;
    case "ready":
      dialog.builtInText.textContent = tf("material_builtin_sent_to", {
        model: state.model,
      });
      break;
    case "blocked":
      dialog.builtInText.textContent = t(state.key);
      break;
    default:
      dialog.builtInText.textContent = "";
  }
}

function render(dialog: StartParts): void {
  dialog.title.textContent = t("material_start_title");
  dialog.subject.textContent = t("material_start_one_subject");
  dialog.choose.textContent = t("material_start_choose");
  setShown(dialog.choose, Boolean(host.pickFiles));
  dialog.choose.disabled = analyzing;
  setShown(dialog.selected, Boolean(host.pickFiles));
  dialog.selected.textContent =
    paths.length > 0 ? paths.join(", ") : t("material_start_none_selected");
  dialog.dropHint.textContent = t("material_start_drop_hint");
  setShown(dialog.dropHint, Boolean(host.onFileDrop));
  renderBuiltIn(dialog);
  const names = harnessNames(harnesses);
  const hasHarness = harnesses.length > 0;
  if (dialog.harnessText.parentElement) {
    setShown(dialog.harnessText.parentElement, hasHarness);
  }
  dialog.harnessText.textContent = tf("material_start_harness", {
    harness: names,
  });
  dialog.request.value = harnessRequestText(paths);
  dialog.copy.textContent = t("material_start_copy");
  setShown(dialog.noHarness, !hasHarness);
  const noHarnessText =
    dialog.noHarness.querySelector<HTMLElement>('[data-role="text"]');
  if (noHarnessText) noHarnessText.textContent = t("material_start_no_harness");
  dialog.setup.textContent = t("material_start_setup");
  setShown(dialog.setup, Boolean(host.openAgentSetup));
  dialog.after.textContent = t("material_start_after");
  dialog.close.textContent = t("material_start_close");
}

function usePaths(next: string[]): void {
  if (!parts || analyzing || next.length === 0) return;
  paths = next;
  parts.copyStatus.textContent = "";
  parts.builtInStatus.textContent = "";
  parts.pages.value = "";
  render(parts);
}

async function chooseFiles(): Promise<void> {
  if (!host.pickFiles) return;
  usePaths(await host.pickFiles().catch(() => []));
}

async function copyRequest(): Promise<void> {
  if (!parts) return;
  try {
    await navigator.clipboard.writeText(parts.request.value);
    parts.copyStatus.textContent = tf("material_start_copied", {
      harness: harnessNames(harnesses),
    });
  } catch {
    parts.request.select();
    parts.copyStatus.textContent = t("material_start_copy_failed");
  }
}

/** Send the picked files to the connected model, then open the review. */
async function analyzeHere(): Promise<void> {
  const dialog = parts;
  if (!dialog || analyzing) return;
  const state = builtInState(paths, models);
  if (state.kind !== "ready") return;
  analyzing = true;
  render(dialog);
  dialog.builtInStatus.textContent = t("material_builtin_running");
  try {
    const args = analyzeArgs(paths, state.pdf ? dialog.pages.value : "");
    const result = (
      host.runInBackground
        ? await host.runInBackground("material-import-analyze", args)
        : await runBridge("material-import-analyze", args)
    ) as MaterialImportAnalyzeResponse;
    if (!result.success) {
      dialog.builtInStatus.textContent = t(analyzeRefusalKey(result.code));
      return;
    }
    dialog.builtInStatus.textContent = "";
    closeMaterialImportStart();
    void openMaterialReview(result.id, reviewOptions);
    void refreshPendingMaterialImports();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    dialog.builtInStatus.textContent = `${t("material_builtin_failed")} ${reason}`;
  } finally {
    analyzing = false;
    render(dialog);
  }
}

export function closeMaterialImportStart(): void {
  parts?.overlay.classList.remove("active");
  stopDrop?.();
  stopDrop = null;
}

/** Open the start dialog and look up the harnesses and models. */
export async function openMaterialImportStart(): Promise<void> {
  const dialog = ensureDialog();
  if (!analyzing) {
    paths = [];
    dialog.copyStatus.textContent = "";
    dialog.builtInStatus.textContent = "";
    dialog.pages.value = "";
  }
  render(dialog);
  dialog.overlay.classList.add("active");
  dialog.close.focus();
  if (host.onFileDrop && !stopDrop) {
    const stop = await host.onFileDrop(usePaths).catch(() => null);
    // Closed while the listener was being set up: let it go again.
    if (dialog.overlay.classList.contains("active")) stopDrop = stop;
    else stop?.();
  }
  const [harnessReport, modelReport] = await Promise.all([
    runBridge<AgentHarnessStatusResponse>("agent-harness-status").catch(
      () => null,
    ),
    (host.modelsChecked?.() ?? Promise.resolve())
      .catch(() => undefined)
      .then(() =>
        runBridge<MaterialImportModelsResponse>("material-import-models"),
      )
      .catch(() => null),
  ]);
  harnesses = connectedHarnesses(harnessReport);
  models = modelReport;
  render(dialog);
}

/** Wire the Learning Content button, if the host has one. */
export function initMaterialImportStart(
  options: MaterialReviewOptions = {},
): void {
  reviewOptions = options;
  const button = document.getElementById("btn-content-material-import");
  if (!button) return;
  button.textContent = t("btn_material_import");
  button.addEventListener("click", () => {
    void openMaterialImportStart();
  });
}
