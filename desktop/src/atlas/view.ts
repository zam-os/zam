/**
 * The Studio's knowledge atlas (ADR 2026-10-13, Decisions 3–7; plan Phases
 * 6–9). It reads one lens through `atlas-read`, stores pending land once
 * through `atlas-settle` when this connection may write knowledge, and opens
 * on the learner's home region.
 *
 * A learner spins their own red threads here (`atlas-connect`); a portal on
 * the map, or in a unit's panel, opens the other planet at that unit.
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
  AtlasConnectResponse,
  AtlasEmblemDrawRefusal,
  AtlasEmblemResponse,
  AtlasLensInfoWire,
  AtlasLensKindWire,
  AtlasMovePlanetResponse,
  AtlasOwnPlanetWire,
  AtlasPlanetWire,
  AtlasPrefsResponse,
  AtlasReadResponse,
  AtlasRevisionResponse,
  AtlasTakeResponse,
  AtlasThreadKindWire,
  AtlasUnitWire,
} from "../../../src/bridge/protocol.js";
import { emblemDataUrl } from "../../../src/kernel/atlas/emblem.js";
import { THREAD_KINDS } from "../../../src/kernel/atlas/types.js";
import { runBridge } from "../bridge-transport.js";
import { currentLocale, t, tf } from "../i18n.js";
import { readUpUrl } from "../read-up.js";
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
  type ThreadGroup,
  unitsIn,
  unitThreads,
} from "./layout.js";
import { conditionWords, renderOutline } from "./outline.js";
import {
  AtlasMap,
  type MapWords,
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
  /** Open the topic import (describe what is missing) at a place (D9). */
  importTopic?(place: ImportPlace): void;
  /** Open the material import (photos, PDF, notes) at a place (D9). */
  importMaterial(place: ImportPlace): void;
  /** Open the generic curriculum wizard, where no cell covers a place. */
  openCurriculumWizard?(): void;
  /** Open a page in the system browser: *Nachlesen* (ADR 2026-10-14, D4). */
  openExternal?(url: string): void;
}

/** Until the first read names the library's lenses: world knowledge's. */
const WORLD_LENSES: readonly AtlasLensInfoWire[] = [
  { kind: "weltwissen", planet: "welt", name: "Weltwissen" },
  { kind: "schule", planet: "welt", name: "Schule" },
];
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
  /** Curators' note on the lens: no longer fits, or a replacement waits. */
  curation: HTMLElement;
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
  /** The library's lenses, world's first, then its own planet's (D2). */
  lenses: readonly AtlasLensInfoWire[];
  ownPlanet: AtlasOwnPlanetWire | null;
  mode: "map" | "outline";
  expanded: Set<string>;
  /** *Neue Inhalte zeigen*, as the learner's setting says; null until read. */
  showNew: boolean | null;
  /** Spinning a thread (Decision 7): its first end while the second is picked. */
  pick: string | null;
  /** A thread whose ends are chosen, waiting for its kind and note. */
  draft: { from: string; to: string } | null;
  /** The atlas revision the map was read at; an agent's write changes it. */
  revision: string | null;
  /** A revision check is running. */
  checking: boolean;
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
  // Curation (Decision 3): a lens that no longer fits its source, and a
  // replacement waiting for a curator.
  const curation = el("div", "atlas-curation");
  curation.hidden = true;
  curation.setAttribute("role", "region");
  root.append(toolbar, curation, status, body);
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
    curation,
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
    lenses: [],
    ownPlanet: null,
    mode: "map",
    expanded: new Set(),
    showNew: null,
    pick: null,
    revision: null,
    checking: false,
    draft: null,
    generation: 0,
    frame: 0,
    detach: () => undefined,
  };
  s.map = new AtlasMap(canvas, {
    onClick: (target) => (s.pick ? pickEnd(s, target) : select(s, target)),
    onPortal: (planet, key) => void goToPortal(s, planet, key),
    onDoubleClick: (target) => {
      if (!target) return;
      select(s, target, true);
    },
    onHover: (target, x, y) => showTooltip(s, target, x, y),
    onCamera: () => scheduleChrome(s),
  });

  renderLensButtons(s, WORLD_LENSES);
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
  // An agent's write shows without a click: a cheap revision check every
  // REVISION_POLL_MS while the map is on screen, and on focus.
  const onFocus = () => void checkRevision(s);
  window.addEventListener("focus", onFocus);
  const poll = window.setInterval(() => void checkRevision(s), REVISION_POLL_MS);
  s.detach = () => {
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("focus", onFocus);
    window.clearInterval(poll);
    if (s.frame) cancelAnimationFrame(s.frame);
    s.map.destroy();
  };
  return s;
}

/** How often the open atlas asks whether an agent changed it. */
const REVISION_POLL_MS = 10_000;

/** Whether the map is on screen, so a check is worth a round trip. */
function onScreen(s: ViewState): boolean {
  return (
    document.visibilityState === "visible" &&
    s.root.isConnected &&
    s.root.getClientRects().length > 0
  );
}

/**
 * Read the map again when the atlas changed since it was read: an agent
 * sorted, connected or edited. Never while the learner spins a thread or
 * the map is busy; the camera stays where it is.
 */
async function checkRevision(s: ViewState): Promise<void> {
  if (s.checking || !onScreen(s) || s.pick || s.draft) return;
  if (!s.els.busy.hidden || s.revision === null) return;
  s.checking = true;
  try {
    const { revision } = await runBridge<AtlasRevisionResponse>(
      "atlas-revision",
    );
    if (revision !== s.revision) await load(s, s.lens ?? undefined, true);
  } catch {
    // A missed check is caught by the next one.
  } finally {
    s.checking = false;
  }
}

/**
 * One button per lens of the library, grouped by planet (Decision 2): world
 * knowledge's first, then the library's own planet's. Rebuilt only when the
 * set of lenses changes.
 */
function renderLensButtons(
  s: ViewState,
  lenses: readonly AtlasLensInfoWire[],
): void {
  const same =
    lenses.length === s.lenses.length &&
    lenses.every((lens, i) => lens.kind === s.lenses[i]?.kind);
  if (same) return;
  s.lenses = lenses;
  const group = s.els.lenses;
  group.replaceChildren();
  s.els.lensButtons.clear();
  let planet: string | null = null;
  for (const lens of lenses) {
    if (lens.planet !== planet) {
      planet = lens.planet;
      const label = el("span", "atlas-planet-label");
      label.dataset.planet = lens.planet;
      group.appendChild(label);
    }
    const b = button("atlas-lens-btn");
    b.dataset.lens = lens.kind;
    b.dataset.planet = lens.planet;
    b.addEventListener("click", () => void switchLens(s, lens.kind));
    s.els.lensButtons.set(lens.kind, b);
    group.appendChild(b);
  }
  // Only a library with a second planet names them.
  const planets = new Set(lenses.map((lens) => lens.planet));
  group.classList.toggle("atlas-lenses-planets", planets.size > 1);
  applyLensLabels(s);
}

function applyLensLabels(s: ViewState): void {
  const group = s.els.lenses;
  for (const label of group.querySelectorAll<HTMLElement>(
    ".atlas-planet-label",
  )) {
    label.textContent = t(`atlas_planet_${label.dataset.planet ?? "welt"}`);
  }
  s.els.lensButtons.forEach((b, lens) => {
    b.textContent = t(`atlas_lens_${lens}`);
    b.setAttribute("aria-pressed", String(lens === s.lens));
  });
}

function applyLabels(s: ViewState): void {
  const { els } = s;
  applyLensLabels(s);
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
  s.map.words = {
    kinds: Object.fromEntries(
      THREAD_KINDS.map((kind) => [kind, t(`atlas_thread_${kind}`)]),
    ) as MapWords["kinds"],
    planets: {
      welt: t("atlas_planet_welt"),
      firma: t("atlas_planet_firma"),
      privat: t("atlas_planet_privat"),
    },
  };
  s.map.requestDraw();
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

async function load(
  s: ViewState,
  lens?: AtlasLensKindWire,
  quiet = false,
): Promise<void> {
  const generation = ++s.generation;
  // A background re-read after an agent's write shows no veil.
  if (!quiet) {
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
  }
  try {
    // Read first, so a write that lands during the read shows next time.
    const revision = await runBridge<AtlasRevisionResponse>(
      "atlas-revision",
    ).catch(() => null);
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
    s.ownPlanet = view.ownPlanet ?? null;
    renderLensButtons(s, view.lenses ?? WORLD_LENSES);
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
    s.revision = revision?.revision ?? s.revision;
    renderCuration(s, view);
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

/**
 * What curators see of the lens's curation (Decision 3): it no longer fits
 * its source, or a replacement waits to be accepted or rejected. Learners
 * who may not write knowledge see nothing of it.
 */
function renderCuration(s: ViewState, view: AtlasReadResponse): void {
  const box = s.els.curation;
  box.replaceChildren();
  const curation = view.curation ?? null;
  const show =
    view.settle.mayWrite &&
    curation !== null &&
    (curation.stale !== null || curation.proposal !== null);
  box.hidden = !show;
  if (!show || !curation) return;
  if (curation.stale) {
    const text = curation.source
      ? tf("atlas_curation_stale_source", { source: curation.source })
      : t("atlas_curation_stale");
    const line = el("p", "atlas-curation-line", text);
    if (curation.stale.note) {
      line.append(" ", el("span", "atlas-curation-note", curation.stale.note));
    }
    box.appendChild(line);
  }
  const proposal = curation.proposal;
  if (proposal) {
    const line = el(
      "p",
      "atlas-curation-line",
      tf("atlas_curation_proposal", {
        source: proposal.source,
        regions: proposal.regions,
        members: proposal.members,
      }),
    );
    const accept = button("btn primary-btn btn-sm", t("atlas_curation_accept"));
    accept.title = t("atlas_curation_accept_hint");
    const reject = button("btn secondary-btn btn-sm", t("atlas_curation_reject"));
    const decide = (rejecting: boolean) => {
      accept.disabled = true;
      reject.disabled = true;
      void (async () => {
        try {
          await runBridge("atlas-lens-accept", [
            "--lens",
            view.lens.kind,
            ...(rejecting ? ["--reject"] : []),
          ]);
          select(s, null);
          await load(s, view.lens.kind);
        } catch (err) {
          accept.disabled = false;
          reject.disabled = false;
          setStatus(
            s,
            `${t("atlas_curation_failed")} ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      })();
    };
    accept.addEventListener("click", () => decide(false));
    reject.addEventListener("click", () => decide(true));
    const actions = el("div", "atlas-curation-actions");
    actions.append(accept, reject);
    box.append(line, actions);
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
  // A thread being written belongs to its first unit's panel.
  if (s.draft && !(target?.kind === "unit" && target.key === s.draft.from)) {
    s.draft = null;
  }
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
    if (s.pick || s.draft) {
      cancelThread(s);
      e.preventDefault();
      return;
    }
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
      const kinds = s.lenses.map((lens) => lens.kind);
      if (kinds.length === 0) break;
      const i = kinds.indexOf(s.lens ?? "weltwissen");
      void switchLens(s, kinds[(i + 1) % kinds.length]);
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
          if (s.pick) {
            pickEnd(s, sel);
            return;
          }
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
  else if (s.draft?.from === sel.key) threadForm(s, layout, s.draft, body);
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
        lens: s.lens,
        regionKey: key,
        path: regionPath(layout, key).map(
          (k) => layout.regions.get(k)?.name ?? k,
        ),
      },
      {
        // The model knows only world knowledge; a company's or a person's
        // comes from its source (ADR 2026-10-14, Decision 5).
        importTopic:
          layout.view.lens.planet === "welt" ? s.deps.importTopic : undefined,
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
  // A unit's kind (Decision 2): own units of this region to the other planet.
  const ownHere = units.filter((unit) => unit.own && !unit.inReach).length;
  const move = planetMoveButton(s, ownHere, [
    "--region",
    key,
    "--lens",
    s.lens ?? view.lens.kind,
  ]);
  if (move) actions.appendChild(move);
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
  // Reading up: world units only, the bridge gives others none (D4 of
  // ADR 2026-10-14). Opened on this click; nothing is fetched before.
  const readUp = unit.readUp;
  const openExternal = s.deps.openExternal;
  if (readUp && openExternal) {
    const read = button("btn secondary-btn btn-sm", t("read_up"));
    read.title = t(
      readUp.kind === "source" ? "read_up_source_hint" : "read_up_search_hint",
    );
    read.addEventListener("click", () =>
      openExternal(readUpUrl(readUp, currentLocale)),
    );
    const actions = el("div", "atlas-panel-actions");
    actions.appendChild(read);
    body.appendChild(actions);
  }
  if (unit.own) {
    body.appendChild(el("p", "atlas-panel-note", t("atlas_own_unit_note")));
    const move = unit.inReach ? null : planetMoveButton(s, 1, ["--unit", key]);
    if (move) {
      const actions = el("div", "atlas-panel-actions");
      actions.appendChild(move);
      body.appendChild(actions);
    }
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
  body.appendChild(threadSection(s, layout, key));
}

/**
 * Move own units to the other planet (Decision 2): from world knowledge to
 * the library's own planet, or back. Only who may write knowledge sees it;
 * published units stay world knowledge, so the server skips them.
 */
function planetMoveButton(
  s: ViewState,
  count: number,
  args: string[],
): HTMLButtonElement | null {
  const layout = s.layout;
  const own = s.ownPlanet;
  if (!layout || !own || count === 0 || !layout.view.settle.mayWrite) {
    return null;
  }
  const target: AtlasPlanetWire =
    layout.view.lens.planet === "welt" ? own : "welt";
  const label = t(`atlas_move_to_${target}`);
  const b = button(
    "btn secondary-btn btn-sm",
    args[0] === "--unit" ? label : `${label} (${count})`,
  );
  b.title = t(
    target === "welt" ? "atlas_move_hint_welt" : "atlas_move_hint_own",
  );
  b.addEventListener("click", () => void movePlanet(s, target, args));
  return b;
}

async function movePlanet(
  s: ViewState,
  target: AtlasPlanetWire,
  args: string[],
): Promise<void> {
  setBusy(s, t("atlas_busy_moving"));
  try {
    const result = await runBridge<AtlasMovePlanetResponse>(
      "atlas-move-planet",
      ["--planet", target, ...args],
    );
    // What moved has left this planet's map.
    select(s, null);
    await load(s, s.lens ?? undefined);
    const moved = tf("atlas_moved", {
      count: result.moved.length,
      planet: t(`atlas_planet_${target}`),
    });
    const held = result.held ?? [];
    setStatus(
      s,
      held.length > 0
        ? `${moved} ${tf("atlas_move_held", { count: held.length })}`
        : moved,
    );
  } catch (err) {
    setBusy(s, null);
    setStatus(
      s,
      `${t("atlas_move_failed")} ${err instanceof Error ? err.message : String(err)}`,
    );
  }
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
  const region = kind === "region" ? layout.regions.get(key) : undefined;
  // A Fach writes to its subject, which every lens shares.
  const subject =
    kind === "unit" ? key : (region?.emblemSubject ?? `region:${lens}:${key}`);
  const emblem = emblemOf(layout, kind, key);
  const ref =
    kind === "region" ? region?.emblem : layout.units.get(key)?.emblem;
  // A leaf region showing its first unit's Sinnbild has none of its own.
  const borrowed =
    kind === "region" && ref !== undefined && /^(atom|token):/.test(ref);
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
  if (emblem?.glyph)
    words.appendChild(el("p", "atlas-emblem-glyph", emblem.glyph));
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
  draw.addEventListener(
    "click",
    () => void drawEmblem(s, subject, draw, status),
  );
  actions.appendChild(draw);
  const own = button("btn secondary-btn btn-sm", t("atlas_emblem_glyph"));
  actions.appendChild(own);
  if (emblem?.source === "personal" && !borrowed) {
    const clear = button("btn secondary-btn btn-sm", t("atlas_emblem_clear"));
    // Remove the row it was found under: the subject's, or an older one
    // under the lens's own region key.
    const shown = ref ?? subject;
    clear.addEventListener("click", () => void clearEmblem(s, shown, status));
    actions.appendChild(clear);
  }
  section.appendChild(actions);

  const form = el("form", "atlas-emblem-form");
  form.hidden = true;
  const label = el(
    "label",
    "atlas-emblem-form-label",
    t("atlas_emblem_glyph_label"),
  );
  const input = el("input", "atlas-emblem-input");
  input.type = "text";
  input.maxLength = 16;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.value =
    emblem?.source === "personal" && !borrowed ? (emblem.glyph ?? "") : "";
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
    const result = await runBridge<
      AtlasEmblemResponse | AtlasEmblemDrawRefusal
    >("atlas-emblem-draw", ["--subject", subject]);
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

// ── Red threads (Decision 7) ──────────────────────────────────────────────

/**
 * A unit's threads by kind, each in words. Prerequisites are listed both
 * ways, empty or not; the other kinds where there are some.
 */
function threadSection(
  s: ViewState,
  layout: AtlasLayout,
  key: string,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const groups = unitThreads(layout, key);
  const prerequisites = (direction: "out" | "in") => {
    const group = groups.find(
      (g) => g.kind === "voraussetzung" && g.direction === direction,
    );
    return group
      ? threadList(s, layout, group)
      : el("p", "atlas-panel-empty", t("atlas_none"));
  };
  fragment.append(
    el("h3", "atlas-panel-sub", t("atlas_builds_on")),
    prerequisites("out"),
    el("h3", "atlas-panel-sub", t("atlas_foundation_for")),
    prerequisites("in"),
  );
  for (const group of groups) {
    if (group.kind === "voraussetzung") continue;
    fragment.append(
      el(
        "h3",
        "atlas-panel-sub",
        t(`atlas_threads_${group.kind}_${group.direction}`),
      ),
      threadList(s, layout, group),
    );
  }
  const actions = el("div", "atlas-panel-actions");
  const spin = button("btn secondary-btn btn-sm", t("atlas_thread_add"));
  spin.addEventListener("click", () => startPick(s, key));
  actions.appendChild(spin);
  fragment.appendChild(actions);
  return fragment;
}

function threadList(
  s: ViewState,
  layout: AtlasLayout,
  group: ThreadGroup,
): HTMLUListElement {
  const list = el("ul", "atlas-panel-list");
  for (const { thread, other } of group.entries.slice(0, 60)) {
    const words: string[] = [];
    let name: string;
    let go: () => void;
    if (other.kind === "unit") {
      name = other.unit.title;
      words.push(
        conditionWords({ t, tf }, other.unit.condition, other.unit.due),
      );
      go = () => select(s, { kind: "unit", key: other.unit.key }, true);
    } else {
      name = tf("atlas_portal_entry", {
        planet: t(`atlas_planet_${other.planet}`),
        title: other.title,
      });
      words.push(t("atlas_portal_hint"));
      go = () => void goToPortal(s, other.planet, other.key);
    }
    if (thread.scope === "personal") words.push(t("atlas_thread_yours"));
    if (thread.alsoShared) words.push(t("atlas_thread_also_shared"));
    // The note is untrusted text: textContent only, as every entry is.
    if (thread.note) words.push(tf("atlas_thread_note", { note: thread.note }));
    const li = entry(name, words.join(" · "), go);
    const id = thread.id;
    if (id && (thread.scope === "personal" || layout.view.settle.mayWrite)) {
      li.classList.add("atlas-thread-row");
      const cut = button("atlas-thread-cut", "×");
      cut.title = t("atlas_thread_remove");
      cut.setAttribute(
        "aria-label",
        tf("atlas_thread_remove_named", { title: name }),
      );
      cut.addEventListener("click", () => void cutThread(s, id));
      li.appendChild(cut);
    }
    list.appendChild(li);
  }
  if (group.entries.length > 60) {
    list.appendChild(
      el(
        "li",
        "atlas-panel-more",
        tf("atlas_more", { count: group.entries.length - 60 }),
      ),
    );
  }
  return list;
}

/** *Faden spannen*: the next unit clicked, found or chosen is the other end. */
function startPick(s: ViewState, from: string): void {
  s.pick = from;
  s.draft = null;
  s.root.classList.add("atlas-picking");
  if (s.map.threadMode === "off") {
    s.map.threadMode = "selection";
    updateThreadsButton(s);
  }
  setStatus(s, t("atlas_thread_pick"));
}

function endPick(s: ViewState): void {
  s.pick = null;
  s.root.classList.remove("atlas-picking");
  setStatus(s, "");
}

function cancelThread(s: ViewState): void {
  const from = s.pick ?? s.draft?.from ?? null;
  endPick(s);
  s.draft = null;
  if (from) select(s, { kind: "unit", key: from });
}

/** While picking, a unit is the other end; a region zooms in to reach its units. */
function pickEnd(s: ViewState, target: Selection | null): void {
  const from = s.pick;
  if (!from || !target) return;
  if (target.kind === "region") {
    s.map.fitRegion(target.key);
    return;
  }
  if (target.key === from) return;
  endPick(s);
  s.draft = { from, to: target.key };
  select(s, { kind: "unit", key: from });
}

/** The new thread's kind, direction and note, in sentences anyone can read. */
function threadForm(
  s: ViewState,
  layout: AtlasLayout,
  draft: { from: string; to: string },
  body: HTMLElement,
): void {
  let from = draft.from;
  let to = draft.to;
  const title = (key: string) => layout.units.get(key)?.title ?? key;
  body.append(
    el("p", "atlas-panel-kicker", t("atlas_thread_new")),
    el("h2", "atlas-panel-title", title(draft.from)),
  );
  const form = el("form", "atlas-thread-form");
  const kinds = el("fieldset", "atlas-thread-kinds");
  kinds.appendChild(el("legend", "", t("atlas_thread_kind_label")));
  const sentences = new Map<AtlasThreadKindWire, HTMLElement>();
  for (const kind of THREAD_KINDS) {
    const label = el("label", "atlas-thread-kind");
    const radio = el("input");
    radio.type = "radio";
    radio.name = "atlas-thread-kind";
    radio.value = kind;
    radio.checked = kind === "verbindung";
    const sentence = el("span");
    sentences.set(kind, sentence);
    label.append(radio, sentence);
    kinds.appendChild(label);
  }
  const writeSentences = () => {
    for (const [kind, sentence] of sentences) {
      // Titles are untrusted text: textContent only.
      sentence.textContent = tf(`atlas_thread_sentence_${kind}`, {
        a: title(from),
        b: title(to),
      });
    }
  };
  writeSentences();
  const swap = button("btn secondary-btn btn-sm", t("atlas_thread_swap"));
  swap.addEventListener("click", () => {
    [from, to] = [to, from];
    writeSentences();
  });
  const noteLabel = el(
    "label",
    "atlas-emblem-form-label",
    t("atlas_thread_note_label"),
  );
  const note = el("input", "atlas-emblem-input");
  note.type = "text";
  note.maxLength = 280;
  note.autocomplete = "off";
  noteLabel.appendChild(note);
  const actions = el("div", "atlas-panel-actions");
  const save = button("btn primary-btn btn-sm", t("atlas_thread_save"));
  save.type = "submit";
  const cancel = button("btn secondary-btn btn-sm", t("model_btn_cancel"));
  cancel.addEventListener("click", () => cancelThread(s));
  actions.append(save, cancel);
  form.append(kinds, swap, noteLabel, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const kind =
      form.querySelector<HTMLInputElement>(
        'input[name="atlas-thread-kind"]:checked',
      )?.value ?? "verbindung";
    save.disabled = true;
    void spinThread(s, { from, to, kind, note: note.value.trim() }).then(
      (spun) => {
        // A refusal keeps the form as the learner filled it in.
        if (!spun) save.disabled = false;
      },
    );
  });
  body.appendChild(form);
  form.querySelector<HTMLInputElement>("input:checked")?.focus();
}

async function spinThread(
  s: ViewState,
  thread: { from: string; to: string; kind: string; note: string },
): Promise<boolean> {
  try {
    await runBridge<AtlasConnectResponse>("atlas-connect", [
      "--from",
      thread.from,
      "--to",
      thread.to,
      "--kind",
      thread.kind,
      ...(thread.note ? ["--note", thread.note] : []),
      "--from-studio",
    ]);
  } catch (err) {
    setStatus(
      s,
      `${t("atlas_thread_failed")} ${err instanceof Error ? err.message : String(err)}`,
    );
    return false;
  }
  s.draft = null;
  await load(s, s.lens ?? undefined);
  setStatus(s, t("atlas_thread_saved"));
  return true;
}

async function cutThread(s: ViewState, id: string): Promise<void> {
  try {
    await runBridge("atlas-disconnect", ["--id", id]);
  } catch (err) {
    setStatus(
      s,
      `${t("atlas_thread_remove_failed")} ${err instanceof Error ? err.message : String(err)}`,
    );
    return;
  }
  await load(s, s.lens ?? undefined);
  setStatus(s, t("atlas_thread_removed"));
}

/** A portal (Decision 2): open a lens of the other planet at that unit. */
async function goToPortal(
  s: ViewState,
  planet: AtlasPlanetWire,
  key: string,
): Promise<void> {
  const lens = s.lenses.find((l) => l.planet === planet);
  if (!lens) {
    setStatus(s, t("atlas_portal_missing"));
    return;
  }
  if (s.pick) endPick(s);
  s.draft = null;
  // The read after the switch focuses the selected unit, if it is there.
  s.map.selection = { kind: "unit", key };
  if (lens.kind === s.lens) select(s, { kind: "unit", key }, true);
  else await switchLens(s, lens.kind);
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
      if (s.pick) {
        pickEnd(s, { kind: hit.kind, key: hit.key });
        return;
      }
      if (s.mode === "outline") toggleMode(s);
      select(s, { kind: hit.kind, key: hit.key }, true);
    });
    li.appendChild(b);
    list.appendChild(li);
  }
  list.hidden = false;
}
