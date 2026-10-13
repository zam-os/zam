/**
 * The Studio's knowledge atlas (ADR 2026-10-13, Decisions 3–7; plan Phases
 * 6–8). It reads one lens through `atlas-read`, stores pending land once
 * through `atlas-settle` when this connection may write knowledge, and opens
 * on the learner's home region.
 *
 * Nothing here changes scheduling (Decision 1): *Wiederholen* hands a region
 * to the study view, and only the ratings there do.
 *
 * Sinnbilder show only as images of the validator's canonical form, and a
 * glyph only as text (Decision 6).
 *
 * Loaded lazily. No Tauri and no `main.ts`: the MCP Apps panel can mount it
 * later (Phase 10).
 */

import type {
  AtlasEmblemDrawRefusal,
  AtlasEmblemResponse,
  AtlasLensKindWire,
  AtlasPrefsResponse,
  AtlasReadResponse,
  AtlasTakeResponse,
  AtlasUnitWire,
} from "../../../src/bridge/protocol.js";
import { emblemDataUrl } from "../../../src/kernel/atlas/emblem.js";
import { runBridge } from "../bridge-transport.js";
import { t, tf } from "../i18n.js";
import { type ImportPlace, openAtlasImport } from "./import.js";
import {
  type AtlasLayout,
  buildAtlasLayout,
  emblemOf,
  mayPractiseRegion,
  practisedUnits,
  regionCondition,
  regionDue,
  regionPath,
  searchAtlas,
  unitLinks,
  unitsIn,
} from "./layout.js";
import { conditionWords, renderOutline } from "./outline.js";
import {
  AtlasMap,
  type Selection,
  sameSelection,
  type ThreadMode,
} from "./render.js";

export interface AtlasViewDeps {
  /**
   * Open the study view on this region's due cards. `due` sizes the session;
   * `practise`, when above zero, is how many units the learner may go
   * through again if nothing is due.
   */
  reviewRegion(
    lens: AtlasLensKindWire,
    regionKey: string,
    options: { due: number; practise: number },
  ): void;
  /** Open the material import (photos, PDF, notes) at a place (D9). */
  importMaterial(place: ImportPlace): void;
  /** Open the generic curriculum wizard, where no cell covers a place. */
  openCurriculumWizard?(): void;
}

const LENSES: readonly AtlasLensKindWire[] = ["weltwissen", "schule"];
const THREAD_MODES: readonly ThreadMode[] = ["all", "selection", "off"];

interface Elements {
  showNew: HTMLButtonElement;
  lenses: HTMLElement;
  lensButtons: Map<AtlasLensKindWire, HTMLButtonElement>;
  crumbs: HTMLOListElement;
  home: HTMLButtonElement;
  threads: HTMLButtonElement;
  mode: HTMLButtonElement;
  search: HTMLInputElement;
  results: HTMLUListElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  tooltip: HTMLElement;
  level: HTMLElement;
  outline: HTMLElement;
  panel: HTMLElement;
  panelBody: HTMLElement;
  status: HTMLElement;
  busy: HTMLElement;
  busyText: HTMLElement;
}

interface ViewState {
  root: HTMLElement;
  deps: AtlasViewDeps;
  map: AtlasMap;
  els: Elements;
  layout: AtlasLayout | null;
  lens: AtlasLensKindWire | null;
  mode: "map" | "outline";
  expanded: Set<string>;
  /** *Neue Inhalte zeigen*, as the learner's setting says; null until read. */
  showNew: boolean | null;
  generation: number;
  frame: number;
  detach: () => void;
}

let state: ViewState | null = null;

/**
 * Show the atlas in `container`: mount it the first time, re-read it after
 * that (a review may have changed conditions), keeping the camera.
 */
export async function showAtlasView(
  container: HTMLElement,
  deps: AtlasViewDeps,
): Promise<void> {
  if (!state || state.root.parentElement !== container) {
    state?.detach();
    state = mount(container, deps);
  }
  state.deps = deps;
  applyLabels(state);
  if (state.showNew === null) void readShowNew(state);
  await load(state, state.lens ?? undefined);
}

// ── Mounting ──────────────────────────────────────────────────────────────

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

function button(className: string, text = ""): HTMLButtonElement {
  const b = el("button", className, text);
  b.type = "button";
  return b;
}

function mount(container: HTMLElement, deps: AtlasViewDeps): ViewState {
  container.replaceChildren();
  const root = el("div", "atlas");

  const toolbar = el("div", "atlas-toolbar");
  const lensGroup = el("div", "atlas-lenses");
  lensGroup.setAttribute("role", "group");
  const lensButtons = new Map<AtlasLensKindWire, HTMLButtonElement>();
  for (const lens of LENSES) {
    const b = button("atlas-lens-btn");
    b.dataset.lens = lens;
    lensButtons.set(lens, b);
    lensGroup.appendChild(b);
  }
  const crumbNav = el("nav", "atlas-crumbs");
  const crumbs = el("ol");
  crumbNav.appendChild(crumbs);
  const tools = el("div", "atlas-tools");
  const home = button("btn secondary-btn btn-sm");
  const showNew = button("btn secondary-btn btn-sm atlas-show-new");
  const threads = button("btn secondary-btn btn-sm");
  const mode = button("btn secondary-btn btn-sm");
  const searchBox = el("div", "atlas-search");
  const search = el("input", "atlas-search-input");
  search.type = "search";
  search.autocomplete = "off";
  search.spellcheck = false;
  const results = el("ul", "atlas-search-results");
  results.hidden = true;
  searchBox.append(search, results);
  tools.append(home, showNew, threads, mode, searchBox);
  toolbar.append(lensGroup, crumbNav, tools);

  const body = el("div", "atlas-body");
  const stage = el("div", "atlas-stage");
  const canvas = el("canvas", "atlas-canvas");
  canvas.setAttribute("role", "img");
  canvas.tabIndex = 0;
  const tooltip = el("div", "atlas-tooltip");
  tooltip.hidden = true;
  tooltip.setAttribute("aria-hidden", "true");
  const level = el("div", "atlas-level");
  level.setAttribute("aria-hidden", "true");
  stage.append(canvas, tooltip, level);
  const outline = el("div", "atlas-outline");
  outline.hidden = true;
  const panel = el("aside", "atlas-panel");
  panel.hidden = true;
  const close = button("atlas-panel-close", "×");
  const panelBody = el("div", "atlas-panel-body");
  panel.append(close, panelBody);
  // Building a world can take a moment (settling land, switching lenses):
  // the busy overlay names the step. CSS fades it in late, so a quick
  // re-read does not flash it.
  const busy = el("div", "atlas-busy");
  busy.hidden = true;
  busy.setAttribute("role", "status");
  busy.setAttribute("aria-live", "polite");
  const dots = el("div", "dots-bounce");
  dots.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) dots.appendChild(el("div", "bounce-dot"));
  const busyText = el("p", "loader-message");
  const sweep = el("div", "study-busy-progress");
  sweep.setAttribute("aria-hidden", "true");
  sweep.appendChild(el("span"));
  busy.append(dots, busyText, sweep);
  body.append(stage, outline, panel, busy);

  const status = el("p", "atlas-status");
  status.setAttribute("aria-live", "polite");
  root.append(toolbar, status, body);
  container.appendChild(root);

  const els: Elements = {
    showNew,
    lenses: lensGroup,
    lensButtons,
    crumbs,
    home,
    threads,
    mode,
    search,
    results,
    stage,
    canvas,
    tooltip,
    level,
    outline,
    panel,
    panelBody,
    status,
    busy,
    busyText,
  };

  const s: ViewState = {
    root,
    deps,
    // Set right below; the map's events need the state.
    map: undefined as unknown as AtlasMap,
    els,
    layout: null,
    lens: null,
    mode: "map",
    expanded: new Set(),
    showNew: null,
    generation: 0,
    frame: 0,
    detach: () => undefined,
  };
  s.map = new AtlasMap(canvas, {
    onClick: (target) => select(s, target),
    onDoubleClick: (target) => {
      if (!target) return;
      select(s, target, true);
    },
    onHover: (target, x, y) => showTooltip(s, target, x, y),
    onCamera: () => scheduleChrome(s),
  });

  for (const [lens, b] of lensButtons) {
    b.addEventListener("click", () => void switchLens(s, lens));
  }
  home.addEventListener("click", () => goHome(s));
  threads.addEventListener("click", () => cycleThreads(s));
  showNew.addEventListener("click", () => void toggleShowNew(s));
  mode.addEventListener("click", () => toggleMode(s));
  close.addEventListener("click", () => select(s, null));
  search.addEventListener("input", () => renderResults(s));
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      results.querySelector<HTMLButtonElement>("button")?.click();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      results.querySelector<HTMLButtonElement>("button")?.focus();
    }
  });
  results.addEventListener("keydown", (e) => {
    const items = [...results.querySelectorAll<HTMLButtonElement>("button")];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown" && i >= 0) {
      e.preventDefault();
      items[Math.min(items.length - 1, i + 1)]?.focus();
    } else if (e.key === "ArrowUp" && i >= 0) {
      e.preventDefault();
      (i === 0 ? search : items[i - 1]).focus();
    }
  });

  const onKey = (e: KeyboardEvent) => handleKey(s, e);
  window.addEventListener("keydown", onKey);
  s.detach = () => {
    window.removeEventListener("keydown", onKey);
    if (s.frame) cancelAnimationFrame(s.frame);
    s.map.destroy();
  };
  return s;
}

function applyLabels(s: ViewState): void {
  const { els } = s;
  els.lensButtons.forEach((b, lens) => {
    b.textContent = t(`atlas_lens_${lens}`);
  });
  els.lenses.setAttribute("aria-label", t("atlas_lens_label"));
  els.crumbs.parentElement?.setAttribute("aria-label", t("atlas_breadcrumb"));
  els.home.textContent = t("atlas_home");
  els.home.title = t("atlas_home_hint");
  els.search.placeholder = t("atlas_search_placeholder");
  els.search.setAttribute("aria-label", t("atlas_search_label"));
  els.panel.setAttribute("aria-label", t("atlas_panel_label"));
  els.panel
    .querySelector(".atlas-panel-close")
    ?.setAttribute("aria-label", t("atlas_panel_close"));
  updateThreadsButton(s);
  updateModeButton(s);
  updateShowNewButton(s);
}

function updateShowNewButton(s: ViewState): void {
  s.els.showNew.textContent = t("atlas_show_new");
  s.els.showNew.title = t("atlas_show_new_hint");
  s.els.showNew.setAttribute("aria-pressed", String(s.showNew === true));
  s.els.showNew.disabled = s.showNew === null;
}

/**
 * *Neue Inhalte zeigen* (Decision 1): off by default. Turning it on also
 * installs the year's cells, which enrols nobody; the next read sketches
 * them and settle gives them land.
 */
async function toggleShowNew(s: ViewState): Promise<void> {
  if (s.showNew === null) return;
  const next = !s.showNew;
  s.els.showNew.disabled = true;
  // Turning it on installs the year's cells first, which takes a moment.
  if (next) setBusy(s, t("atlas_busy_installing"));
  try {
    const prefs = await runBridge<AtlasPrefsResponse>("atlas-prefs", [
      "--show-new",
      next ? "on" : "off",
    ]);
    s.showNew = prefs.showNew;
  } catch (err) {
    setStatus(
      s,
      `${t("atlas_load_failed")} ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  updateShowNewButton(s);
  await load(s, s.lens ?? undefined);
}

async function readShowNew(s: ViewState): Promise<void> {
  try {
    const prefs = await runBridge<AtlasPrefsResponse>("atlas-prefs");
    s.showNew = prefs.showNew;
  } catch {
    s.showNew = false;
  }
  updateShowNewButton(s);
}

// ── Loading ───────────────────────────────────────────────────────────────

/** The learner's day decides which atom items wait (one a day). */
function readArgs(lens: AtlasLensKindWire | undefined): string[] {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return [...(lens ? ["--lens", lens] : []), "--time-zone", timeZone];
}

async function load(s: ViewState, lens?: AtlasLensKindWire): Promise<void> {
  const generation = ++s.generation;
  setBusy(
    s,
    t(
      !s.layout
        ? "atlas_loading"
        : lens && lens !== s.lens
          ? "atlas_busy_lens"
          : "atlas_busy_reading",
    ),
  );
  try {
    let view = await runBridge<AtlasReadResponse>("atlas-read", readArgs(lens));
    if (generation !== s.generation) return;
    // Store pending land once; a member who may not write sees it provisional.
    if (view.settle.pending > 0 && view.settle.mayWrite) {
      setBusy(s, t("atlas_busy_settling"));
      try {
        await runBridge("atlas-settle", ["--lens", view.lens.kind]);
        view = await runBridge<AtlasReadResponse>(
          "atlas-read",
          readArgs(view.lens.kind),
        );
      } catch (err) {
        console.warn("atlas-settle failed; showing provisional land", err);
      }
      if (generation !== s.generation) return;
    }
    setBusy(s, t("atlas_busy_drawing"));
    // Let the step's name paint before the layout takes the main thread.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (generation !== s.generation) return;
    const placeCamera = s.lens !== view.lens.kind || !s.layout;
    s.lens = view.lens.kind;
    s.layout = buildAtlasLayout(view);
    s.map.setLayout(s.layout);
    if (placeCamera) {
      s.map.afterSized(() => {
        const sel = s.map.selection;
        if (sel?.kind === "unit") s.map.focusUnit(sel.key, false);
        else if (view.home) s.map.fitHome(view.home, false);
        else s.map.fitAll(false);
      });
    }
    s.els.canvas.setAttribute(
      "aria-label",
      tf("atlas_canvas_label", { lens: view.lens.name }),
    );
    if (view.land.length === 0) setStatus(s, t("atlas_empty"));
    else if (view.settle.pending > 0) setStatus(s, t("atlas_provisional"));
    else setStatus(s, "");
    renderChrome(s);
  } catch (err) {
    if (generation !== s.generation) return;
    setStatus(
      s,
      `${t("atlas_load_failed")} ${err instanceof Error ? err.message : String(err)}`,
    );
  } finally {
    if (generation === s.generation) setBusy(s, null);
  }
}

function setStatus(s: ViewState, text: string): void {
  s.els.status.textContent = text;
  s.els.status.hidden = text === "";
}

/** Name the step the atlas is busy with; null when it is done. */
function setBusy(s: ViewState, text: string | null): void {
  s.els.busyText.textContent = text ?? "";
  s.els.busy.hidden = text === null;
  s.root.setAttribute("aria-busy", String(text !== null));
}

async function switchLens(
  s: ViewState,
  lens: AtlasLensKindWire,
): Promise<void> {
  if (lens === s.lens) return;
  // The lens is remembered as the one the atlas opens with; best effort.
  void runBridge("atlas-prefs", ["--lens", lens]).catch(() => undefined);
  s.expanded.clear();
  await load(s, lens);
}

// ── Selection and navigation ──────────────────────────────────────────────

function select(s: ViewState, target: Selection | null, zoom = false): void {
  s.map.selection = target;
  s.map.requestDraw();
  if (target && zoom) {
    if (target.kind === "unit") s.map.focusUnit(target.key);
    else s.map.fitRegion(target.key);
  }
  if (target && s.layout) {
    // The outline opens down to the selection.
    const leaf =
      target.kind === "unit"
        ? s.layout.units.get(target.key)?.region
        : s.layout.regions.get(target.key)?.parentKey;
    for (const key of leaf ? regionPath(s.layout, leaf) : []) {
      s.expanded.add(key);
    }
  }
  renderChrome(s);
}

/** Esc: one level up, from a unit to its region, from a region to its parent. */
function goUp(s: ViewState): void {
  const sel = s.map.selection;
  const layout = s.layout;
  if (!layout) return;
  if (!sel) {
    s.map.fitAll();
    return;
  }
  if (sel.kind === "unit") {
    const leaf = layout.units.get(sel.key)?.region;
    select(s, leaf ? { kind: "region", key: leaf } : null, true);
    return;
  }
  const parent = layout.regions.get(sel.key)?.parentKey;
  if (parent && layout.geoms.has(parent)) {
    select(s, { kind: "region", key: parent }, true);
  } else {
    select(s, null);
    s.map.fitAll();
  }
}

function goHome(s: ViewState): void {
  const home = s.layout?.view.home;
  if (home) s.map.fitHome(home);
  else s.map.fitAll();
}

function cycleThreads(s: ViewState): void {
  const i = THREAD_MODES.indexOf(s.map.threadMode);
  s.map.threadMode = THREAD_MODES[(i + 1) % THREAD_MODES.length];
  s.map.requestDraw();
  updateThreadsButton(s);
}

function updateThreadsButton(s: ViewState): void {
  const label = t(`atlas_threads_${s.map.threadMode}`);
  s.els.threads.textContent = label;
  s.els.threads.title = t("atlas_threads_hint");
}

function toggleMode(s: ViewState): void {
  s.mode = s.mode === "map" ? "outline" : "map";
  s.els.stage.hidden = s.mode !== "map";
  s.els.outline.hidden = s.mode !== "outline";
  updateModeButton(s);
  renderChrome(s);
  if (s.mode === "outline") {
    s.els.outline.querySelector<HTMLElement>("button")?.focus();
  }
}

function updateModeButton(s: ViewState): void {
  s.els.mode.textContent = t(
    s.mode === "map" ? "atlas_show_outline" : "atlas_show_map",
  );
  s.els.mode.setAttribute("aria-pressed", String(s.mode === "outline"));
}

function isActive(s: ViewState): boolean {
  return s.root.isConnected && s.root.offsetParent !== null;
}

function handleKey(s: ViewState, e: KeyboardEvent): void {
  if (!isActive(s) || e.defaultPrevented) return;
  // A dialog in front (import, material review) owns the keys.
  if (document.querySelector(".modal-overlay.active")) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target instanceof HTMLElement ? e.target : null;
  const typing =
    !!target &&
    (target.matches("input, textarea, select") || target.isContentEditable);
  if (e.key === "Escape") {
    if (!s.els.results.hidden || typing) {
      s.els.search.value = "";
      renderResults(s);
      s.els.search.blur();
    } else goUp(s);
    e.preventDefault();
    return;
  }
  if (typing) return;
  switch (e.key) {
    case "/":
      e.preventDefault();
      s.els.search.focus();
      break;
    case "0":
      goHome(s);
      break;
    case "l":
    case "L": {
      const i = LENSES.indexOf(s.lens ?? "weltwissen");
      void switchLens(s, LENSES[(i + 1) % LENSES.length]);
      break;
    }
    case "f":
    case "F":
      cycleThreads(s);
      break;
    case "+":
    case "=":
      s.map.zoomBy(1.4);
      break;
    case "-":
      s.map.zoomBy(1 / 1.4);
      break;
    case "ArrowLeft":
    case "ArrowRight":
    case "ArrowUp":
    case "ArrowDown": {
      // Only while the map itself has the focus; lists keep their arrows.
      if (target !== s.els.canvas && target !== document.body) return;
      e.preventDefault();
      const step = 80;
      s.map.panBy(
        e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0,
        e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0,
      );
      break;
    }
  }
}

// ── Chrome: breadcrumb, level, lens buttons, panel, outline ───────────────

function scheduleChrome(s: ViewState): void {
  if (s.frame) return;
  s.frame = requestAnimationFrame(() => {
    s.frame = 0;
    // The panel and the outline do not follow the camera.
    renderCrumbs(s);
    renderLevel(s);
  });
}

function renderChrome(s: ViewState): void {
  for (const [lens, b] of s.els.lensButtons) {
    b.setAttribute("aria-pressed", String(lens === s.lens));
  }
  renderCrumbs(s);
  renderLevel(s);
  renderPanel(s);
  if (s.mode === "outline" && s.layout) {
    renderOutline(
      s.els.outline,
      s.layout,
      { expanded: s.expanded, selection: s.map.selection },
      {
        t,
        tf,
        onSelect: (sel) => {
          const same = sameSelection(sel, s.map.selection);
          select(s, sel, !same);
        },
      },
    );
  }
}

function renderCrumbs(s: ViewState): void {
  const layout = s.layout;
  const list = s.els.crumbs;
  list.replaceChildren();
  if (!layout) return;
  const sel = s.map.selection;
  let keys: string[];
  let unit: AtlasUnitWire | undefined;
  if (sel?.kind === "unit") {
    unit = layout.units.get(sel.key);
    keys = unit ? regionPath(layout, unit.region) : [];
  } else if (sel?.kind === "region") {
    keys = regionPath(layout, sel.key);
  } else {
    const inView = s.map.viewRegion();
    keys = inView ? regionPath(layout, inView) : [];
  }
  const add = (
    text: string,
    onClick: (() => void) | null,
    current: boolean,
  ) => {
    const li = el("li");
    if (onClick && !current) {
      const b = button("atlas-crumb", text);
      b.addEventListener("click", onClick);
      li.appendChild(b);
    } else {
      const span = el("span", "atlas-crumb", text);
      if (current) span.setAttribute("aria-current", "location");
      li.appendChild(span);
    }
    list.appendChild(li);
  };
  add(
    layout.view.lens.name,
    () => {
      select(s, null);
      s.map.fitAll();
    },
    keys.length === 0 && !unit,
  );
  keys.forEach((key, i) => {
    const name = layout.regions.get(key)?.name ?? key;
    add(
      name,
      () => select(s, { kind: "region", key }, true),
      i === keys.length - 1 && !unit && sel?.kind === "region",
    );
  });
  if (unit) add(unit.title, null, true);
}

function renderLevel(s: ViewState): void {
  const layout = s.layout;
  if (!layout) return;
  const level = s.map.focusLevel();
  const name =
    level >= layout.depth
      ? t("atlas_units")
      : (layout.view.lens.levels[level] ?? "");
  s.els.level.textContent = tf("atlas_focus_level", { level: name });
}

function showTooltip(
  s: ViewState,
  target: Selection | null,
  x: number,
  y: number,
): void {
  const tip = s.els.tooltip;
  const layout = s.layout;
  if (!target || !layout) {
    tip.hidden = true;
    return;
  }
  let name: string;
  let words: string;
  if (target.kind === "unit") {
    const unit = layout.units.get(target.key);
    if (!unit) {
      tip.hidden = true;
      return;
    }
    name = unit.title;
    words = conditionWords({ t, tf }, unit.condition, unit.due);
  } else {
    const region = layout.regions.get(target.key);
    if (!region) {
      tip.hidden = true;
      return;
    }
    name = region.name;
    words = conditionWords(
      { t, tf },
      regionCondition(layout, target.key),
      regionDue(layout, target.key),
    );
  }
  tip.replaceChildren(el("strong", "", name), el("span", "", words));
  const box = s.els.stage.getBoundingClientRect();
  tip.style.left = `${Math.min(box.width - 220, Math.max(8, x - box.left + 14))}px`;
  tip.style.top = `${Math.max(8, y - box.top + 14)}px`;
  tip.hidden = false;
}

// ── Panels ────────────────────────────────────────────────────────────────

function renderPanel(s: ViewState): void {
  const layout = s.layout;
  const sel = s.map.selection;
  const body = s.els.panelBody;
  body.replaceChildren();
  s.els.panel.hidden = !sel || !layout;
  if (!sel || !layout) return;
  if (sel.kind === "region") regionPanel(s, layout, sel.key, body);
  else unitPanel(s, layout, sel.key, body);
}

function regionPanel(
  s: ViewState,
  layout: AtlasLayout,
  key: string,
  body: HTMLElement,
): void {
  const region = layout.regions.get(key);
  if (!region) return;
  const view = layout.view;
  const due = regionDue(layout, key);
  const units = unitsIn(layout, key);
  body.append(
    el("p", "atlas-panel-kicker", view.lens.levels[region.level] ?? ""),
    el("h2", "atlas-panel-title", region.name),
    el(
      "p",
      "atlas-panel-meta",
      [
        tf("atlas_unit_count", { count: units.length }),
        conditionWords({ t, tf }, regionCondition(layout, key), due),
      ].join(" · "),
    ),
  );
  if (view.home === key) {
    body.appendChild(el("p", "atlas-panel-badge", t("atlas_is_home")));
  }
  body.appendChild(emblemSection(s, layout, "region", key));
  const island = region.level === 0 ? layout.islands.get(key) : undefined;
  if (island && view.settle.mayWrite && island.drift > 0) {
    body.appendChild(
      el("p", "atlas-panel-note", tf("atlas_drift", { count: island.drift })),
    );
  }

  const actions = el("div", "atlas-panel-actions");
  // Nothing due: a small region may still be gone through again (the study
  // view asks first).
  const mayPractise = mayPractiseRegion(layout, key);
  const review = button("btn primary-btn btn-sm", t("atlas_review"));
  review.disabled = due === 0 && !mayPractise;
  review.title =
    due > 0
      ? ""
      : mayPractise
        ? t("atlas_review_practice_hint")
        : practisedUnits(layout, key) > 0
          ? t("atlas_review_too_big")
          : t("atlas_review_none");
  review.addEventListener("click", () => {
    if (!s.lens) return;
    s.deps.reviewRegion(s.lens, key, {
      due,
      practise: mayPractise ? practisedUnits(layout, key) : 0,
    });
  });
  actions.appendChild(review);
  if (view.home !== key) {
    const home = button("btn secondary-btn btn-sm", t("atlas_set_home"));
    home.addEventListener("click", () => void setHome(s, key));
    actions.appendChild(home);
  }
  // Import at this place (Decision 9): curriculum cells, or the learner's
  // own material.
  const importHere = button("btn secondary-btn btn-sm", t("atlas_import_here"));
  importHere.addEventListener("click", () => {
    if (!s.lens) return;
    void openAtlasImport(
      {
        lens: s.lens === "schule" ? "schule" : "weltwissen",
        regionKey: key,
        path: regionPath(layout, key).map(
          (k) => layout.regions.get(k)?.name ?? k,
        ),
      },
      {
        importMaterial: (place) => s.deps.importMaterial(place),
        openCurriculumWizard: s.deps.openCurriculumWizard,
        onChanged: () => void load(s, s.lens ?? undefined),
      },
    );
  });
  actions.appendChild(importHere);
  // Sketched units (Neue Inhalte zeigen) are taken in on a click only.
  if (units.some((unit) => unit.inReach)) {
    const take = button("btn secondary-btn btn-sm", t("atlas_take"));
    take.title = t("atlas_take_region_hint");
    take.addEventListener("click", () => {
      if (!s.lens) return;
      void takeIn(s, ["--region", key, "--lens", s.lens]);
    });
    actions.appendChild(take);
  }
  body.appendChild(actions);

  const children = region.children.filter((c) => layout.geoms.has(c));
  if (children.length > 0) {
    const level = layout.view.lens.levels[region.level + 1] ?? "";
    body.appendChild(el("h3", "atlas-panel-sub", level));
    const list = el("ul", "atlas-panel-list");
    for (const child of children) {
      list.appendChild(
        entry(
          layout.regions.get(child)?.name ?? child,
          conditionWords(
            { t, tf },
            regionCondition(layout, child),
            regionDue(layout, child),
          ),
          () => select(s, { kind: "region", key: child }, true),
        ),
      );
    }
    body.appendChild(list);
  } else if (units.length > 0) {
    body.appendChild(el("h3", "atlas-panel-sub", t("atlas_units")));
    body.appendChild(unitList(s, units));
  }
}

function unitPanel(
  s: ViewState,
  layout: AtlasLayout,
  key: string,
  body: HTMLElement,
): void {
  const unit = layout.units.get(key);
  if (!unit) return;
  const path = regionPath(layout, unit.region).map(
    (k) => layout.regions.get(k)?.name ?? k,
  );
  body.append(
    el("p", "atlas-panel-kicker", t("atlas_unit_kicker")),
    el("h2", "atlas-panel-title", unit.title),
    el("p", "atlas-panel-path", path.join(" › ")),
    el(
      "p",
      "atlas-panel-meta",
      [
        tf("atlas_card_count", { count: unit.cards }),
        conditionWords({ t, tf }, unit.condition, unit.due),
      ].join(" · "),
    ),
  );
  body.appendChild(emblemSection(s, layout, "unit", key));
  if (unit.own) {
    body.appendChild(el("p", "atlas-panel-note", t("atlas_own_unit_note")));
  }
  if (unit.inReach) {
    body.appendChild(el("p", "atlas-panel-note", t("atlas_in_reach_note")));
    const take = button("btn primary-btn btn-sm", t("atlas_take"));
    take.addEventListener("click", () => void takeIn(s, ["--unit", key]));
    const actions = el("div", "atlas-panel-actions");
    actions.appendChild(take);
    body.appendChild(actions);
  }
  // One goal, one method (Decision 12).
  if (unit.standsFor) {
    body.appendChild(
      el(
        "p",
        "atlas-panel-note",
        tf("atlas_variant_instead_of", { title: unit.standsFor.title }),
      ),
    );
    if (unit.standsFor.chosen) {
      const undo = button("btn secondary-btn btn-sm", t("atlas_variant_undo"));
      const standsFor = unit.standsFor.key;
      undo.addEventListener(
        "click",
        () => void changeVariant(s, ["--stands-for", standsFor, "--undo"]),
      );
      const actions = el("div", "atlas-panel-actions");
      actions.appendChild(undo);
      body.appendChild(actions);
    }
  }
  if (unit.variantOffer) {
    body.appendChild(
      el(
        "p",
        "atlas-panel-note",
        tf("atlas_variant_offer", { title: unit.variantOffer.title }),
      ),
    );
    const variant = unit.variantOffer.key;
    const take = button("btn secondary-btn btn-sm", t("atlas_variant_take"));
    take.addEventListener(
      "click",
      () => void changeVariant(s, ["--stands-for", key, "--variant", variant]),
    );
    const actions = el("div", "atlas-panel-actions");
    actions.appendChild(take);
    body.appendChild(actions);
  }
  const links = unitLinks(layout, key);
  body.appendChild(el("h3", "atlas-panel-sub", t("atlas_builds_on")));
  body.appendChild(
    links.buildsOn.length > 0
      ? unitList(s, links.buildsOn)
      : el("p", "atlas-panel-empty", t("atlas_none")),
  );
  body.appendChild(el("h3", "atlas-panel-sub", t("atlas_foundation_for")));
  body.appendChild(
    links.foundationFor.length > 0
      ? unitList(s, links.foundationFor)
      : el("p", "atlas-panel-empty", t("atlas_none")),
  );
}

/** A Sinnbild as an image: the canonical SVG through a data URL, never markup. */
function emblemImage(svg: string, size: number): HTMLImageElement {
  const img = el("img", "atlas-emblem-img");
  img.src = emblemDataUrl(svg);
  img.width = size;
  img.height = size;
  img.alt = "";
  img.decoding = "async";
  return img;
}

/**
 * The Sinnbild of a region or unit (Decision 6), with the ways to change
 * it: let the text model draw one, type an own sign, or remove one's own.
 */
function emblemSection(
  s: ViewState,
  layout: AtlasLayout,
  kind: "region" | "unit",
  key: string,
): HTMLElement {
  const lens = s.lens ?? layout.view.lens.kind;
  const subject = kind === "unit" ? key : `region:${lens}:${key}`;
  const emblem = emblemOf(layout, kind, key);
  const ref =
    kind === "region"
      ? layout.regions.get(key)?.emblem
      : layout.units.get(key)?.emblem;
  const borrowed = kind === "region" && ref !== undefined && ref !== subject;
  const section = el("section", "atlas-emblem");
  section.setAttribute("aria-label", t("atlas_emblem_label"));
  const row = el("div", "atlas-emblem-row");
  if (emblem) {
    row.appendChild(emblemImage(emblem.svg, 56));
  } else {
    row.appendChild(el("span", "atlas-emblem-empty", "?"));
  }
  const words = el("div", "atlas-emblem-words");
  // The glyph is untrusted text: textContent only.
  if (emblem?.glyph) words.appendChild(el("p", "atlas-emblem-glyph", emblem.glyph));
  words.appendChild(
    el(
      "p",
      "atlas-emblem-source",
      !emblem
        ? t("atlas_emblem_none")
        : borrowed
          ? t("atlas_emblem_source_borrowed")
          : t(`atlas_emblem_source_${emblem.source}`),
    ),
  );
  row.appendChild(words);
  section.appendChild(row);

  const actions = el("div", "atlas-panel-actions");
  const status = el("p", "atlas-emblem-status");
  status.setAttribute("aria-live", "polite");
  const draw = button(
    "btn secondary-btn btn-sm",
    t(emblem && !borrowed ? "atlas_emblem_redraw" : "atlas_emblem_draw"),
  );
  draw.addEventListener("click", () => void drawEmblem(s, subject, draw, status));
  actions.appendChild(draw);
  const own = button("btn secondary-btn btn-sm", t("atlas_emblem_glyph"));
  actions.appendChild(own);
  if (emblem?.source === "personal" && !borrowed) {
    const clear = button("btn secondary-btn btn-sm", t("atlas_emblem_clear"));
    clear.addEventListener("click", () => void clearEmblem(s, subject, status));
    actions.appendChild(clear);
  }
  section.appendChild(actions);

  const form = el("form", "atlas-emblem-form");
  form.hidden = true;
  const label = el("label", "atlas-emblem-form-label", t("atlas_emblem_glyph_label"));
  const input = el("input", "atlas-emblem-input");
  input.type = "text";
  input.maxLength = 16;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.value = emblem?.source === "personal" && !borrowed ? (emblem.glyph ?? "") : "";
  label.appendChild(input);
  const save = button("btn primary-btn btn-sm", t("atlas_emblem_glyph_save"));
  save.type = "submit";
  form.append(label, save);
  own.addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) input.focus();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const glyph = input.value.trim();
    if (glyph) void setGlyph(s, subject, glyph, status);
  });
  section.append(form, status);
  return section;
}

async function drawEmblem(
  s: ViewState,
  subject: string,
  trigger: HTMLButtonElement,
  status: HTMLElement,
): Promise<void> {
  trigger.disabled = true;
  status.textContent = t("atlas_emblem_drawing");
  try {
    const result = await runBridge<AtlasEmblemResponse | AtlasEmblemDrawRefusal>(
      "atlas-emblem-draw",
      ["--subject", subject],
    );
    if (!result.success) {
      status.textContent =
        result.code === "no-text-model"
          ? t("atlas_emblem_no_model")
          : `${t("atlas_emblem_draw_failed")} ${result.message}`;
      trigger.disabled = false;
      return;
    }
  } catch (err) {
    status.textContent = `${t("atlas_emblem_draw_failed")} ${err instanceof Error ? err.message : String(err)}`;
    trigger.disabled = false;
    return;
  }
  await load(s, s.lens ?? undefined);
}

async function setGlyph(
  s: ViewState,
  subject: string,
  glyph: string,
  status: HTMLElement,
): Promise<void> {
  try {
    await runBridge<AtlasEmblemResponse>("atlas-emblem-set", [
      "--subject",
      subject,
      "--glyph",
      glyph,
      "--from-studio",
    ]);
  } catch (err) {
    status.textContent = `${t("atlas_emblem_failed")} ${err instanceof Error ? err.message : String(err)}`;
    return;
  }
  await load(s, s.lens ?? undefined);
}

async function clearEmblem(
  s: ViewState,
  subject: string,
  status: HTMLElement,
): Promise<void> {
  try {
    await runBridge("atlas-emblem-clear", ["--subject", subject]);
  } catch (err) {
    status.textContent = `${t("atlas_emblem_failed")} ${err instanceof Error ? err.message : String(err)}`;
    return;
  }
  await load(s, s.lens ?? undefined);
}

function unitList(s: ViewState, units: AtlasUnitWire[]): HTMLUListElement {
  const list = el("ul", "atlas-panel-list");
  for (const unit of units.slice(0, 60)) {
    const words = [conditionWords({ t, tf }, unit.condition, unit.due)];
    if (unit.own) words.push(t("atlas_own_unit"));
    list.appendChild(
      entry(unit.title, words.join(" · "), () =>
        select(s, { kind: "unit", key: unit.key }, true),
      ),
    );
  }
  if (units.length > 60) {
    list.appendChild(
      el(
        "li",
        "atlas-panel-more",
        tf("atlas_more", { count: units.length - 60 }),
      ),
    );
  }
  return list;
}

function entry(name: string, meta: string, onClick: () => void): HTMLLIElement {
  const li = el("li");
  const b = button("atlas-panel-entry");
  b.append(
    el("span", "atlas-panel-entry-name", name),
    el("span", "atlas-panel-entry-meta", meta),
  );
  b.addEventListener("click", onClick);
  li.appendChild(b);
  return li;
}

/** *Aufnehmen*: cards for sketched units, on the learner's click only. */
async function takeIn(s: ViewState, args: string[]): Promise<void> {
  let message: string;
  try {
    const result = await runBridge<AtlasTakeResponse>("atlas-take", args);
    message = tf("atlas_taken", { count: result.cardsCreated });
  } catch (err) {
    message = `${t("atlas_take_failed")} ${err instanceof Error ? err.message : String(err)}`;
  }
  await load(s, s.lens ?? undefined);
  setStatus(s, message);
}

async function changeVariant(s: ViewState, args: string[]): Promise<void> {
  try {
    await runBridge("atlas-variant", args);
  } catch (err) {
    setStatus(
      s,
      `${t("atlas_variant_failed")} ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }
  await load(s, s.lens ?? undefined);
}

async function setHome(s: ViewState, key: string): Promise<void> {
  if (!s.lens) return;
  try {
    await runBridge("atlas-prefs", ["--lens", s.lens, "--home", key]);
    if (s.layout) s.layout.view.home = key;
    renderChrome(s);
  } catch (err) {
    setStatus(
      s,
      `${t("atlas_home_failed")} ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ── Search ────────────────────────────────────────────────────────────────

function renderResults(s: ViewState): void {
  const list = s.els.results;
  list.replaceChildren();
  const layout = s.layout;
  const query = s.els.search.value.trim();
  if (!layout || query === "") {
    list.hidden = true;
    return;
  }
  const hits = searchAtlas(layout, query);
  if (hits.length === 0) {
    list.appendChild(el("li", "atlas-search-empty", t("atlas_search_none")));
  }
  for (const hit of hits) {
    const li = el("li");
    const b = button("atlas-search-hit");
    const emblem = emblemOf(layout, hit.kind, hit.key);
    if (emblem) b.appendChild(emblemImage(emblem.svg, 24));
    const words = el("span", "atlas-search-words");
    words.append(
      el("span", "atlas-search-name", hit.name),
      el("span", "atlas-search-where", hit.where.join(" › ")),
    );
    b.appendChild(words);
    b.addEventListener("click", () => {
      s.els.search.value = "";
      list.hidden = true;
      if (s.mode === "outline") toggleMode(s);
      select(s, { kind: hit.kind, key: hit.key }, true);
    });
    li.appendChild(b);
    list.appendChild(li);
  }
  list.hidden = false;
}
