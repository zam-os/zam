/**
 * Starting a material import from the Studio (ADR 2026-10-05 Decision 2).
 *
 * The harness path is the stronger one: the learner's AI app reads the file,
 * can ask back, and submits its proposals to ZAM's review list. ZAM cannot
 * put a file into another app's chat (ADR 2026-07-18c), so this dialog hands
 * the learner a ready request to paste — with the file's path once they
 * picked it here, so a terminal agent such as opencode can open it directly.
 *
 * Desktop only: the shell injects the file picker and the way to the agent
 * setup; without them the matching parts are simply left out.
 */

import type { AgentHarnessStatusResponse } from "../../src/bridge/protocol.js";
import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

export interface MaterialImportHost {
  /** Native multi-file picker for photos and PDFs; absolute paths. */
  pickFiles?: () => Promise<string[]>;
  /** Open the settings where an agent harness is connected to ZAM. */
  openAgentSetup?: () => void;
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

// ── Dialog ───────────────────────────────────────────────────────────────────

interface StartParts {
  overlay: HTMLElement;
  title: HTMLElement;
  subject: HTMLElement;
  choose: HTMLButtonElement;
  selected: HTMLElement;
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

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  style: Partial<CSSStyleDeclaration> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node.style, style);
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
  const choose = element("button");
  choose.type = "button";
  choose.className = "btn secondary-btn btn-sm";
  choose.addEventListener("click", () => {
    void chooseFiles();
  });
  const selected = element("span", {
    fontSize: "0.85rem",
    wordBreak: "break-all",
  });
  pick.append(choose, selected);

  const harnessSection = element("div", {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });
  harnessSection.className = "modal-impact-section";
  const harnessText = element("p", { margin: "0" });
  const request = element("textarea", { minHeight: "72px" });
  request.className = "editor-textarea";
  request.readOnly = true;
  const copyRow = element("div", {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  });
  const copy = element("button");
  copy.type = "button";
  copy.className = "btn primary-btn btn-sm";
  copy.addEventListener("click", () => {
    void copyRequest();
  });
  const copyStatus = element("span", { fontSize: "0.85rem" });
  copyStatus.setAttribute("aria-live", "polite");
  copyRow.append(copy, copyStatus);
  harnessSection.append(harnessText, request, copyRow);

  const noHarness = element("div", {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  });
  noHarness.className = "modal-impact-section";
  const noHarnessText = element("p", { margin: "0" });
  noHarnessText.dataset.role = "text";
  const setup = element("button", { alignSelf: "flex-start" });
  setup.type = "button";
  setup.className = "btn secondary-btn btn-sm";
  setup.addEventListener("click", () => {
    closeMaterialImportStart();
    host.openAgentSetup?.();
  });
  noHarness.append(noHarnessText, setup);

  const after = element("p", { margin: "0", fontSize: "0.85rem" });
  body.append(subject, pick, harnessSection, noHarness, after);

  const actions = element("div");
  actions.className = "modal-actions";
  const close = element("button");
  close.type = "button";
  close.className = "btn secondary-btn btn-sm";
  close.addEventListener("click", () => closeMaterialImportStart());
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

function render(dialog: StartParts): void {
  dialog.title.textContent = t("material_start_title");
  dialog.subject.textContent = t("material_start_one_subject");
  dialog.choose.textContent = t("material_start_choose");
  dialog.choose.hidden = !host.pickFiles;
  dialog.selected.hidden = !host.pickFiles;
  dialog.selected.textContent =
    paths.length > 0 ? paths.join(", ") : t("material_start_none_selected");
  const names = harnessNames(harnesses);
  const hasHarness = harnesses.length > 0;
  dialog.harnessText.parentElement?.toggleAttribute("hidden", !hasHarness);
  dialog.harnessText.textContent = tf("material_start_harness", {
    harness: names,
  });
  dialog.request.value = harnessRequestText(paths);
  dialog.copy.textContent = t("material_start_copy");
  dialog.noHarness.hidden = hasHarness;
  const noHarnessText =
    dialog.noHarness.querySelector<HTMLElement>('[data-role="text"]');
  if (noHarnessText) noHarnessText.textContent = t("material_start_no_harness");
  dialog.setup.textContent = t("material_start_setup");
  dialog.setup.hidden = !host.openAgentSetup;
  dialog.after.textContent = t("material_start_after");
  dialog.close.textContent = t("material_start_close");
}

async function chooseFiles(): Promise<void> {
  if (!host.pickFiles || !parts) return;
  const picked = await host.pickFiles().catch(() => []);
  if (picked.length > 0) {
    paths = picked;
    parts.copyStatus.textContent = "";
    render(parts);
  }
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

export function closeMaterialImportStart(): void {
  parts?.overlay.classList.remove("active");
}

/** Open the start dialog and look up the connected harnesses. */
export async function openMaterialImportStart(): Promise<void> {
  const dialog = ensureDialog();
  paths = [];
  dialog.copyStatus.textContent = "";
  render(dialog);
  dialog.overlay.classList.add("active");
  dialog.close.focus();
  try {
    harnesses = connectedHarnesses(
      await runBridge<AgentHarnessStatusResponse>("agent-harness-status"),
    );
  } catch {
    harnesses = [];
  }
  render(dialog);
}

/** Wire the Learning Content button, if the host has one. */
export function initMaterialImportStart(): void {
  const button = document.getElementById("btn-content-material-import");
  if (!button) return;
  button.textContent = t("btn_material_import");
  button.addEventListener("click", () => {
    void openMaterialImportStart();
  });
}
