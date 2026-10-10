/**
 * Quellen shell (ADR 2026-10-10, Decisions 4 and 5).
 *
 * One Quelle at a time: a configured workspace, a remembered folder, or the
 * curriculum. Lehrplan hosts the existing curriculum browser. This module
 * reads the registry and writes the machine-local selection. A present
 * directory is shown by the knowledge module. This module does not repair
 * a workspace, add one, write a map, or import curriculum cards.
 */

import { runBridge } from "./bridge-transport.js";
import { t, tf } from "./i18n.js";
import {
  applySourceKnowledgeChrome,
  clearSourceKnowledge,
  showSourceKnowledge,
} from "./learning-content-knowledge.js";

interface SourceWorkspace {
  id: string;
  label: string;
  path: string;
  skillSource?: boolean;
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
        skillSource?: boolean;
      }
    | { kind: "folder"; path: string; missing: boolean; skillSource?: boolean }
    | { kind: "curriculum" }
    | null;
  workspaces: SourceWorkspace[];
}

let folderPicker: (() => Promise<string | null>) | null = null;
let curriculumHost: {
  open: () => Promise<void>;
  close: () => void;
} | null = null;
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

/** The existing curriculum browser. The desktop and the panel install it. */
export function setLearningContentCurriculumHost(host: {
  open: () => Promise<void>;
  close: () => void;
}): void {
  curriculumHost = host;
}

/** Persist Lehrplan and show the browser. Onboarding and active paths use this. */
export async function selectLearningContentCurriculum(): Promise<void> {
  await saveSource(["--kind", "curriculum"]);
}

/** Open the browser again after a card reload, without resetting a live walk. */
export function reopenCurriculumBrowserIfSelected(): void {
  if (lastView?.selection?.kind !== "curriculum") return;
  setCurriculumVisible(true);
  void curriculumHost?.open();
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/** Labels for the Quelle switcher. Safe before the shell is bound. */
export function applyLearningContentSourceChrome(): void {
  setText("lbl-content-source", t("lbl_content_source"));
  setText("btn-content-choose-folder", t("btn_content_choose_folder"));
  applySourceKnowledgeChrome();
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
  if (value === "curriculum") {
    await saveSource(["--kind", "curriculum"]);
    return;
  }
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

function setCurriculumVisible(visible: boolean): void {
  const host = document.getElementById("content-sources-curriculum");
  if (!host) return;
  host.classList.toggle("hidden", !visible);
  host.hidden = !visible;
}

function folderLabel(path: string): string {
  const parts = path.split(/[/\\]/).filter(Boolean);
  return parts[parts.length - 1] || path;
}

function skillLabel(label: string, skillSource: boolean): string {
  if (!skillSource) return label;
  return `${label} · ${t("content_source_skill")}`;
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
    option.textContent = skillLabel(
      workspace.label,
      workspace.skillSource === true,
    );
    select.append(option);
  }
  const curriculum = document.createElement("option");
  curriculum.value = "curriculum";
  curriculum.textContent = t("content_source_curriculum");
  select.append(curriculum);
  if (view.selection?.kind === "folder") {
    const option = document.createElement("option");
    option.value = "folder";
    option.textContent = skillLabel(
      folderLabel(view.selection.path),
      view.selection.skillSource === true,
    );
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
    clearSourceKnowledge();
    setCurriculumVisible(false);
    curriculumHost?.close();
    return;
  }
  if (selection.kind === "curriculum") {
    path.textContent = "";
    note.textContent = "";
    clearSourceKnowledge();
    setCurriculumVisible(true);
    void curriculumHost?.open();
    return;
  }
  setCurriculumVisible(false);
  curriculumHost?.close();
  path.textContent = selection.path;
  if (selection.missing) {
    note.textContent = t("content_source_missing");
    clearSourceKnowledge();
    return;
  }
  note.textContent = "";
  showSourceKnowledge(selection.path, selection.skillSource === true);
}
