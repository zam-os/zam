/**
 * *Hier importieren …* on the knowledge atlas (ADR 2026-10-13, Decision 9):
 * an import that starts at a region of the map.
 *
 * - **Aus dem Lehrplan.** The cell has precedence (ADR 2026-08-14, Decision
 *   10): the bundled cells for the region come first, and the generic
 *   curriculum wizard only where no cell covers the position.
 * - **Fehlendes Wissen beschreiben.** The topic import (ADR 2026-10-14): the
 *   learner names what is missing and its context, the model proposes
 *   subtopics and cards, and they land at this region, each subtopic as its
 *   deepest level. World regions only: the model knows no company's or
 *   person's knowledge, which comes from its source instead.
 * - **Mitschrift oder Material.** Photos, a PDF or typed notes go through the
 *   material import, which places the new units at this region.
 *
 * No Tauri and no `main.ts`: the host hands in the ways out.
 */

import type {
  AtlasLensKindWire,
  AtlasPlaceResponse,
} from "../../../src/bridge/protocol.js";
import { runBridge } from "../bridge-transport.js";
import { t, tf } from "../i18n.js";

export interface ImportPlace {
  lens: AtlasLensKindWire;
  regionKey: string;
  /** Region names from the island down. */
  path: string[];
}

export interface AtlasImportDeps {
  /** Open the topic import (describe what is missing) at this place. */
  importTopic?(place: ImportPlace): void;
  /** Open the material import (photos, PDF, notes) at this place. */
  importMaterial(place: ImportPlace): void;
  /** Open the generic curriculum wizard, where no cell covers the place. */
  openCurriculumWizard?(): void;
  /** Called after a cell enrol changed the learner's cards. */
  onChanged(): void;
}

interface Parts {
  overlay: HTMLElement;
  title: HTMLElement;
  path: HTMLElement;
  curriculumTitle: HTMLElement;
  curriculum: HTMLElement;
  topicSection: HTMLElement;
  topicTitle: HTMLElement;
  topicText: HTMLElement;
  topic: HTMLButtonElement;
  materialTitle: HTMLElement;
  materialText: HTMLElement;
  material: HTMLButtonElement;
  status: HTMLElement;
  close: HTMLButtonElement;
}

let parts: Parts | null = null;
let generation = 0;
let changed = false;
let onClose: (() => void) | null = null;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(className: string, text: string): HTMLButtonElement {
  const b = el("button", className, text);
  b.type = "button";
  return b;
}

function ensureDialog(): Parts {
  if (parts?.overlay.isConnected) return parts;
  const overlay = el("div", "modal-overlay atlas-import-overlay");
  const box = el("div", "modal-box atlas-import");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  const header = el("div", "modal-header");
  const title = el("h3");
  title.id = "atlas-import-title";
  box.setAttribute("aria-labelledby", title.id);
  header.append(title);
  const body = el("div", "modal-body atlas-import-body");
  const path = el("p", "atlas-import-path");
  const curriculumSection = el("section", "atlas-import-section");
  const curriculumTitle = el("h4");
  const curriculum = el("div", "atlas-import-cells");
  curriculumSection.append(curriculumTitle, curriculum);
  const topicSection = el("section", "atlas-import-section");
  const topicTitle = el("h4");
  const topicText = el("p", "atlas-import-help");
  const topic = button("btn primary-btn btn-sm", "");
  topicSection.append(topicTitle, topicText, topic);
  const materialSection = el("section", "atlas-import-section");
  const materialTitle = el("h4");
  const materialText = el("p", "atlas-import-help");
  const material = button("btn secondary-btn btn-sm", "");
  materialSection.append(materialTitle, materialText, material);
  const status = el("p", "atlas-import-status");
  status.setAttribute("aria-live", "polite");
  // The learner's own words and material first: one button each; the cells
  // can be many.
  body.append(path, topicSection, materialSection, curriculumSection, status);
  const actions = el("div", "modal-actions");
  const close = button("btn secondary-btn btn-sm", "");
  actions.append(close);
  box.append(header, body, actions);
  overlay.append(box);
  document.body.append(overlay);
  close.addEventListener("click", () => closeAtlasImport());
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeAtlasImport();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("active")) {
      event.preventDefault();
      event.stopPropagation();
      closeAtlasImport();
    }
  });
  parts = {
    overlay,
    title,
    path,
    curriculumTitle,
    curriculum,
    topicSection,
    topicTitle,
    topicText,
    topic,
    materialTitle,
    materialText,
    material,
    status,
    close,
  };
  return parts;
}

export function closeAtlasImport(): void {
  if (!parts?.overlay.classList.contains("active")) return;
  parts.overlay.classList.remove("active");
  generation++;
  const done = onClose;
  onClose = null;
  if (changed) done?.();
}

export async function openAtlasImport(
  place: ImportPlace,
  deps: AtlasImportDeps,
): Promise<void> {
  const dialog = ensureDialog();
  const stamp = ++generation;
  changed = false;
  onClose = deps.onChanged;
  dialog.title.textContent = t("atlas_import_title");
  dialog.path.textContent = tf("atlas_import_at", {
    path: place.path.join(" › "),
  });
  dialog.curriculumTitle.textContent = t("atlas_import_curriculum");
  dialog.curriculum.replaceChildren(
    el("p", "atlas-import-help", t("atlas_loading")),
  );
  dialog.topicSection.hidden = !deps.importTopic;
  dialog.topicTitle.textContent = t("atlas_import_topic");
  dialog.topicText.textContent = t("atlas_import_topic_help");
  dialog.topic.textContent = t("atlas_import_topic_open");
  dialog.topic.onclick = () => {
    closeAtlasImport();
    deps.importTopic?.(place);
  };
  dialog.materialTitle.textContent = t("atlas_import_material");
  dialog.materialText.textContent = t("atlas_import_material_help");
  dialog.material.textContent = t("atlas_import_material_open");
  dialog.material.onclick = () => {
    closeAtlasImport();
    deps.importMaterial(place);
  };
  dialog.status.textContent = "";
  dialog.close.textContent = t("atlas_panel_close");
  dialog.overlay.classList.add("active");
  (deps.importTopic ? dialog.topic : dialog.material).focus();

  try {
    const result = await runBridge<AtlasPlaceResponse>("atlas-place", [
      "--lens",
      place.lens satisfies AtlasLensKindWire,
      "--region",
      place.regionKey,
    ]);
    if (stamp !== generation) return;
    renderCells(dialog, result, deps, stamp);
  } catch (err) {
    if (stamp !== generation) return;
    dialog.curriculum.replaceChildren(
      el(
        "p",
        "atlas-import-help",
        `${t("atlas_load_failed")} ${err instanceof Error ? err.message : String(err)}`,
      ),
    );
  }
}

function renderCells(
  dialog: Parts,
  result: AtlasPlaceResponse,
  deps: AtlasImportDeps,
  stamp: number,
): void {
  const list = el("ul", "atlas-import-list");
  for (const cell of result.cells) {
    const li = el("li", "atlas-import-cell");
    const text = el("span", "atlas-import-cell-name", cell.title);
    const grade = el("span", "atlas-import-cell-meta", cell.gradeLabel);
    const label = el("span");
    label.append(text, grade);
    li.append(label);
    if (cell.enrolled) {
      li.append(
        el("span", "atlas-import-cell-state", t("atlas_import_enrolled")),
      );
    } else {
      const enrol = button("btn secondary-btn btn-sm", t("atlas_import_enrol"));
      enrol.addEventListener("click", () => {
        void enrolCell(dialog, cell.id, enrol, stamp);
      });
      li.append(enrol);
    }
    list.append(li);
  }
  const children: HTMLElement[] = [];
  if (result.cells.length > 0) children.push(list);
  else children.push(el("p", "atlas-import-help", t("atlas_import_no_cells")));
  if (result.wizard && deps.openCurriculumWizard) {
    const wizard = button("btn secondary-btn btn-sm", t("atlas_import_wizard"));
    wizard.addEventListener("click", () => {
      closeAtlasImport();
      deps.openCurriculumWizard?.();
    });
    children.push(wizard);
  }
  dialog.curriculum.replaceChildren(...children);
}

async function enrolCell(
  dialog: Parts,
  cellId: string,
  control: HTMLButtonElement,
  stamp: number,
): Promise<void> {
  control.disabled = true;
  dialog.status.textContent = t("atlas_import_enrolling");
  try {
    const result = await runBridge<{ cardsCreated?: number }>(
      "bundled-cell-enrol",
      [cellId],
    );
    if (stamp !== generation) return;
    changed = true;
    control.replaceWith(
      el("span", "atlas-import-cell-state", t("atlas_import_enrolled")),
    );
    dialog.status.textContent = tf("atlas_import_enrolled_cards", {
      count: result.cardsCreated ?? 0,
    });
  } catch (err) {
    if (stamp !== generation) return;
    control.disabled = false;
    dialog.status.textContent = `${t("atlas_import_failed")} ${err instanceof Error ? err.message : String(err)}`;
  }
}
