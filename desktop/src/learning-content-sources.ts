/**
 * Quellen shell (ADR 2026-10-10, Decisions 4 and 5).
 *
 * One Quelle at a time: a configured workspace, a remembered folder, or the
 * curriculum entry. The curriculum entry stays disabled until the wizard
 * moves here. This module only reads the registry and writes the machine-local
 * selection. It does not mount a map, repair a workspace, or add one.
 */

import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";

interface SourceWorkspace {
  id: string;
  label: string;
  path: string;
}

interface SourceView {
  stored: { kind: string; id?: string; path?: string } | null;
  selection:
    | {
        kind: "workspace";
        id: string;
        label: string;
        path: string;
        missing: boolean;
      }
    | { kind: "folder"; path: string; missing: boolean }
    | { kind: "curriculum" }
    | null;
  workspaces: SourceWorkspace[];
}

let folderPicker: (() => Promise<string | null>) | null = null;
let bound = false;
let loadGeneration = 0;
let lastView: SourceView | null = null;
let saving = false;

export function setLearningContentFolderPicker(
  picker: () => Promise<string | null>,
): void {
  folderPicker = picker;
  document
    .getElementById("btn-content-choose-folder")
    ?.classList.remove("hidden");
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/** Labels for the Quelle switcher. Safe before the shell is bound. */
export function applyLearningContentSourceChrome(): void {
  setText("lbl-content-source", t("lbl_content_source"));
  setText("btn-content-choose-folder", t("btn_content_choose_folder"));
  const curriculum = document.querySelector(
    '#content-source-select option[value="curriculum"]',
  );
  if (curriculum) curriculum.textContent = t("content_source_curriculum");
  if (lastView) renderSourceStatus(lastView);
}

export function initLearningContentSources(): void {
  applyLearningContentSourceChrome();
  document
    .getElementById("btn-content-choose-folder")
    ?.classList.toggle("hidden", !folderPicker);
  if (bound) return;
  bound = true;
  document
    .getElementById("content-source-select")
    ?.addEventListener("change", () => {
      void onSourceChange();
    });
  document
    .getElementById("btn-content-choose-folder")
    ?.addEventListener("click", () => {
      void chooseFolder();
    });
}

export async function refreshLearningContentSources(): Promise<void> {
  const generation = ++loadGeneration;
  try {
    const view = await runBridge<SourceView>("learning-content-source");
    if (generation !== loadGeneration) return;
    lastView = view;
    renderSourceChoices(view);
    renderSourceStatus(view);
  } catch (err: unknown) {
    if (generation !== loadGeneration) return;
    alert(sourceError(err));
  }
}

function sourceError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  return tf("content_source_error", { message });
}

async function saveSource(args: string[]): Promise<void> {
  if (saving) return;
  saving = true;
  try {
    await runBridge("learning-content-source", args);
  } catch (err: unknown) {
    alert(sourceError(err));
  } finally {
    saving = false;
  }
  await refreshLearningContentSources();
}

async function onSourceChange(): Promise<void> {
  const select = document.getElementById(
    "content-source-select",
  ) as HTMLSelectElement | null;
  const value = select?.value ?? "";
  if (value.startsWith("workspace:")) {
    await saveSource([
      "--kind",
      "workspace",
      "--id",
      value.slice("workspace:".length),
    ]);
  }
}

async function chooseFolder(): Promise<void> {
  if (!folderPicker) return;
  const picked = await folderPicker();
  if (!picked) return;
  await saveSource(["--kind", "folder", "--path", picked]);
}

function folderLabel(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] || path;
}

function renderSourceChoices(view: SourceView): void {
  const select = document.getElementById(
    "content-source-select",
  ) as HTMLSelectElement | null;
  if (!select) return;
  select.replaceChildren();
  for (const workspace of view.workspaces) {
    const option = document.createElement("option");
    option.value = `workspace:${workspace.id}`;
    option.textContent = workspace.label;
    select.append(option);
  }
  const curriculum = document.createElement("option");
  curriculum.value = "curriculum";
  curriculum.textContent = t("content_source_curriculum");
  curriculum.disabled = true;
  select.append(curriculum);
  if (view.selection?.kind === "folder") {
    const option = document.createElement("option");
    option.value = "folder";
    option.textContent = folderLabel(view.selection.path);
    select.append(option);
  }
  const selection = view.selection;
  if (!selection) return;
  if (selection.kind === "workspace") {
    select.value = `workspace:${selection.id}`;
  } else {
    select.value = selection.kind;
  }
}

function renderSourceStatus(view: SourceView): void {
  const path = document.getElementById("content-sources-path");
  const note = document.getElementById("content-sources-note");
  if (!path || !note) return;
  const selection = view.selection;
  if (!selection) {
    path.textContent = "";
    note.textContent = t("content_source_none");
    return;
  }
  if (selection.kind === "curriculum") {
    path.textContent = "";
    note.textContent = t("content_source_curriculum_wait");
    return;
  }
  path.textContent = selection.path;
  note.textContent = selection.missing
    ? t("content_source_missing")
    : t("content_source_next");
}
