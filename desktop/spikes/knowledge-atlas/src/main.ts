/**
 * Knowledge atlas spike — the Studio side.
 *
 * Planets that never mix (world, company, private knowledge), each read
 * through lenses (orders over the same learning units). The agent keeps the
 * map; the learner explores, reviews, follows red threads, and starts an
 * import right at the place where new knowledge belongs.
 */
import { button, el, isModalOpen, modal, toast } from "../../knowledge-world/src/dom.ts";
import { SAMPLE_EMBLEMS } from "../../knowledge-world/src/sample-emblems.ts";
import { statsFor, tileKeyFromFileName } from "../../knowledge-world/src/model.ts";
import {
  THREAD_KINDS,
  addThread,
  advanceClock,
  applyEmblems,
  clearPersonalEmblem,
  conceptsFromTileFor,
  createStartAtlas,
  displayEmblem,
  dueCards,
  effectiveEmblem,
  find,
  findUnit,
  homeIndex,
  importTile,
  itemName,
  lensKeyFor,
  lensOf,
  pathText,
  planetOfUnit,
  rateCard,
  regionPath,
  regionStats,
  removeThread,
  requestImport,
  setEmblem,
  setHome,
  simDay,
  simNow,
  startTileKeys,
  threadsOf,
  tileTitle,
  unitsIn,
} from "./atlas.ts";
import type { Atlas, Concept, Lens, Planet, Rating, Stats, StoredCard, Thread, ThreadKind, TileCatalog, TileJson } from "./atlas.ts";
import { layoutLens, settleAll } from "./layout.ts";
import type { Cell, Layout } from "./layout.ts";
import { MapView, PLANET_EMBLEMS, emblemDataUrl, shortTitle } from "./render.ts";
import type { Selection, ThreadMode } from "./render.ts";
import { REGION_EMBLEMS } from "./sample-emblems.ts";
import { START_SAMPLES } from "./sample-planets.ts";

// ── Catalog (bundled tiles) ─────────────────────────────────────────────────

const tileModules = import.meta.glob("../../../../tests/fixtures/curriculum/de-by-*-kvt.json", { eager: true, import: "default" }) as Record<string, TileJson>;
const catalog: TileCatalog = {};
for (const [path, tile] of Object.entries(tileModules)) {
  const key = tileKeyFromFileName(path.split("/").pop() ?? "");
  if (key) catalog[key] = tile;
}

for (const kind of ["welt", "firma", "privat"]) {
  const e = REGION_EMBLEMS[`planet-${kind}`];
  if (e) PLANET_EMBLEMS[kind] = { svg: e.svg, glyph: e.glyph, by: "agent" };
}

// ── State ───────────────────────────────────────────────────────────────────

let atlas: Atlas = (await (await fetch("/api/atlas")).json()) as Atlas;

function remembered(key: string): string | null {
  try {
    return localStorage.getItem(`atlas:${key}`);
  } catch {
    return null;
  }
}

function remember(key: string, value: string): void {
  try {
    localStorage.setItem(`atlas:${key}`, value);
  } catch {
    // Private window: preferences just don't stick.
  }
}

let planetId = remembered("planet") ?? "welt";
if (!atlas.planets[planetId]) planetId = "welt";
const lensChoice = new Map<string, string>();

function planet(): Planet {
  return atlas.planets[planetId];
}

function lens(): Lens {
  return lensOf(planet(), lensChoice.get(planetId) ?? remembered(`lens:${planetId}`) ?? planet().lenses[0].id);
}

let layout: Layout = layoutLens(lens());

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const canvas = $("map") as HTMLCanvasElement;
const panel = $("panel");
const tooltip = $("tooltip");
const banner = $("banner");

let pick: { title: string; onPick: (id: string) => void } | null = null;

const view = new MapView(canvas, {
  onClick(target) {
    if (pick) {
      if (target?.kind === "unit" && (!view.pickMode?.allow || view.pickMode.allow(target.id))) {
        const done = pick;
        endPick();
        done.onPick(target.id);
      }
      return;
    }
    select(target);
  },
  onPortal(toPlanet, unitId) {
    goToUnit(toPlanet, unitId);
  },
  onDoubleClick(target) {
    if (pick || !target) return;
    if (target.kind === "region") view.fitRegion(target.id);
    else view.focusUnit(target.id);
  },
  onHover(target, cell, x, y) {
    showTooltip(target, cell, x, y);
  },
  onCamera() {
    updateCrumbs();
  },
});

// ── Sync with the dev server (and through it, with the agent) ───────────────

let saving: Promise<void> = Promise.resolve();

function save(): void {
  saving = saving.then(async () => {
    // Snapshot when it is this save's turn, so it builds on the revision the previous save got back.
    const snapshot = JSON.stringify({ baseRevision: atlas.revision, atlas });
    const res = await fetch("/api/atlas", { method: "PUT", headers: { "content-type": "application/json" }, body: snapshot });
    if (res.status === 409) {
      atlas = (await res.json()) as Atlas;
      relayout();
      toast("Der Agent hat gleichzeitig etwas geändert – sein Stand gilt.", "warn");
      return;
    }
    const { revision } = (await res.json()) as { revision: number };
    atlas.revision = revision;
  });
}

function relayout(): void {
  if (settleAll(atlas)) save();
  layout = layoutLens(lens());
  view.setData(atlas, planet(), lens(), layout);
  refreshPanel();
  updateSwitcher();
  updateToolbar();
  updateCrumbs();
}

/** Run a change, then redraw, save and report. */
function apply(op: () => string, opts: { quiet?: boolean; layout?: boolean } = {}): boolean {
  let summary: string;
  try {
    summary = op();
  } catch (error) {
    toast((error as Error).message, "warn");
    return false;
  }
  atlas.lastChange = { by: "studio", summary };
  if (opts.layout === false) {
    view.recolor();
    refreshPanel();
    updateToolbar();
  } else relayout();
  save();
  if (!opts.quiet) toast(summary);
  return true;
}

async function reloadFromServer(): Promise<void> {
  await saving;
  const fresh = (await (await fetch("/api/atlas")).json()) as Atlas;
  if (fresh.revision <= atlas.revision) return;
  const before = new Set(Object.values(atlas.planets).flatMap((p) => Object.keys(p.units)));
  atlas = fresh;
  relayout();
  const added = Object.keys(planet().units).filter((id) => !before.has(id));
  if (added.length) view.flash = { ids: new Set(added), until: performance.now() + 2200 };
  if (atlas.lastChange?.by === "agent") toast(atlas.lastChange.summary, "agent");
}

import.meta.hot?.on("atlas:changed", () => {
  void reloadFromServer();
});

// ── Planets and lenses ──────────────────────────────────────────────────────

function switchTo(toPlanet: string, toLens?: string): void {
  planetId = toPlanet;
  remember("planet", toPlanet);
  if (toLens) {
    lensChoice.set(toPlanet, toLens);
    remember(`lens:${toPlanet}`, toLens);
  }
  endPick();
  view.selection = null;
  relayout();
  goHome(false);
}

function goHome(animate = true): void {
  const home = lens().home;
  if (home && layout.regions.has(home)) view.fitHome(home, animate);
  else view.fitAll(animate);
}

function goToUnit(toPlanet: string, unitId: string): void {
  if (toPlanet !== planetId) switchTo(toPlanet);
  select({ kind: "unit", id: unitId });
  view.focusUnit(unitId);
}

function updateSwitcher(): void {
  $("planets").replaceChildren(
    ...atlas.planetOrder.map((id) => {
      const p = atlas.planets[id];
      const emblem = PLANET_EMBLEMS[p.kind];
      const b = richButton(() => switchTo(id), `planet ${id === planetId ? "on" : ""}`, emblem?.svg ? el("img", { src: emblemDataUrl(emblem.svg), width: "18", height: "18", alt: "" }) : null, el("span", {}, p.name.replace(" (fiktiv)", "")));
      b.title = p.server;
      return b;
    }),
  );
  $("server").textContent = planet().server;
  $("lenses").replaceChildren(
    el("span", { class: "small muted" }, "Ansicht:"),
    ...planet().lenses.map((l) => button(l.name, () => switchTo(planetId, l.id), `lens ${l.id === lens().id ? "on" : ""}`)),
  );
}

// ── Small views ─────────────────────────────────────────────────────────────

const STATE_COLORS = {
  hell: "#37b26c",
  staubig: "#cdb27a",
  dunkel: "#5b6075",
  verfallen: "#7a4b3a",
  nebel: "#cfd6de",
  unerforscht: "#efe4c8",
};

function shares(s: Stats): Array<[keyof typeof STATE_COLORS, number]> {
  return [
    ["hell", Math.max(0, 1 - s.raw - s.dust)],
    ["staubig", s.dust - s.dark],
    ["dunkel", s.dark - s.decay],
    ["verfallen", s.decay - s.fog],
    ["nebel", s.fog],
    ["unerforscht", s.raw],
  ];
}

function stateBar(s: Stats, height = 10): HTMLElement {
  const bar = el("div", { class: "statebar", style: `height:${height}px` });
  for (const [name, share] of shares(s)) {
    if (share <= 0.001) continue;
    bar.append(el("span", { class: `seg ${name}`, style: `flex:${share};background:${STATE_COLORS[name]}`, title: `${name}: ${Math.round(share * 100)} %` }));
  }
  return bar;
}

const STATE_TEXT: Record<string, string> = {
  hell: "sitzt",
  staubig: "staubig",
  dunkel: "dunkel",
  verfallen: "verfällt",
  nebel: "im Nebel",
  rohbau: "unerforscht",
  leer: "leer",
};

function stateBadge(label: string): HTMLElement {
  const key = label === "rohbau" || label === "leer" ? "unerforscht" : (label as keyof typeof STATE_COLORS);
  const dark = key === "dunkel" || key === "verfallen";
  return el("span", { class: `badge${dark ? " dark" : ""}`, style: `background:${STATE_COLORS[key] ?? "#ddd"}` }, STATE_TEXT[label] ?? label);
}

function emblemView(id: string, size: number): HTMLElement {
  const emblem = displayEmblem(atlas, id);
  if (emblem?.svg) return el("img", { src: emblemDataUrl(emblem.svg), width: String(size), height: String(size), alt: "", class: "emblem" });
  const text = emblem?.glyph ?? itemName(atlas, id).slice(0, 2);
  return el("span", { class: "emblem glyph", style: `width:${size}px;height:${size}px;font-size:${Math.max(11, Math.round(size / (text.length > 3 ? 4 : 2.4)))}px` }, text);
}

/** A button with rich content (button() only takes a label). */
function richButton(onClick: () => void, cls: string, ...children: Array<Node | null>): HTMLButtonElement {
  const b = button("", onClick, cls);
  b.replaceChildren(...children.filter((c): c is Node => c !== null));
  return b;
}

function statsForCards(cards: StoredCard[]): Stats {
  return statsFor(cards, simNow(atlas));
}

function crumbsFor(regionId: string, last = true): HTMLElement {
  const host = el("div", { class: "path" });
  const path = regionPath(lens(), regionId);
  path.forEach((r, i) => {
    if (i > 0) host.append(el("span", { class: "sep" }, "›"));
    if (i === path.length - 1 && last) host.append(el("span", {}, r.name));
    else host.append(button(r.name, () => {
      select({ kind: "region", id: r.id });
      view.fitRegion(r.id);
    }, "link"));
  });
  return host;
}

// ── Breadcrumb, toolbar, legend ─────────────────────────────────────────────

function updateCrumbs(): void {
  const host = $("crumbs-path");
  const regionId = view.viewRegion();
  host.replaceChildren(button(planet().name, () => view.fitAll(), "link"));
  if (regionId) {
    for (const r of regionPath(lens(), regionId)) host.append(el("span", { class: "sep" }, "›"), button(r.name, () => view.fitRegion(r.id), "link"));
  }
  $("crumbs-level").textContent = `Zoomstufe: ${view.focusName()}`;
}

function pendingRequests() {
  return atlas.requests.filter((r) => !r.done);
}

function updateToolbar(): void {
  const modes: Record<ThreadMode, string> = { alle: "alle", auswahl: "Auswahl", aus: "aus" };
  const items: HTMLElement[] = [button(`Rote Fäden: ${modes[view.threadMode]}`, cycleThreads, "threads")];
  if (lens().home) items.push(button("Heimat", () => goHome()));
  const pending = pendingRequests().length;
  if (pending) items.push(button(`Beim Agenten (${pending})`, openRequests, "primary"));
  items.push(button("Importieren …", () => openImport(view.viewRegion() ?? "")), button(`Zeit · Tag ${simDay(atlas)}`, openTime), button("?", openHelp, "icon"));
  $("toolbar").replaceChildren(...items);
}

function cycleThreads(): void {
  const order: ThreadMode[] = ["alle", "auswahl", "aus"];
  view.threadMode = order[(order.indexOf(view.threadMode) + 1) % order.length];
  updateToolbar();
  view.requestDraw();
}

const KIND_SVG: Record<ThreadKind, string> = {
  voraussetzung: '<svg width="34" height="12"><line x1="10" y1="6" x2="33" y2="6" stroke="#9c2a3c" stroke-width="2"/><polygon points="2,6 11,2 11,10" fill="#9c2a3c"/></svg>',
  nutzt: '<svg width="34" height="12"><line x1="1" y1="6" x2="31" y2="6" stroke="#d62828" stroke-width="2" stroke-dasharray="5 3"/><polyline points="24,1 32,6 24,11" fill="none" stroke="#d62828" stroke-width="2"/></svg>',
  schnittstelle: '<svg width="34" height="12"><circle cx="5" cy="6" r="4" fill="#fff" stroke="#d62828" stroke-width="2"/><line x1="9" y1="6" x2="26" y2="6" stroke="#d62828" stroke-width="2"/><path d="M33 1 A5 5 0 0 0 33 11" fill="none" stroke="#d62828" stroke-width="2"/></svg>',
  "ist-ein": '<svg width="34" height="12"><line x1="1" y1="6" x2="23" y2="6" stroke="#d62828" stroke-width="2"/><polygon points="33,6 23,1 23,11" fill="#fff" stroke="#d62828" stroke-width="2"/></svg>',
  verbindung: '<svg width="34" height="12"><line x1="1" y1="6" x2="33" y2="6" stroke="#d62828" stroke-width="2.5"/></svg>',
};

function buildLegend(): void {
  const states: Array<[string, string]> = [
    ["hell", "sitzt"],
    ["staubig", "staubig (fällig)"],
    ["dunkel", "dunkel (lange fällig)"],
    ["verfallen", "verfällt (rissig)"],
    ["nebel", "im Nebel (vergessen)"],
    ["unerforscht", "unerforscht (skizziert)"],
  ];
  const kinds = (Object.keys(THREAD_KINDS) as ThreadKind[]).map((k) => {
    const sample = el("span", { class: "kind" });
    sample.innerHTML = KIND_SVG[k];
    return el("div", { class: "lg" }, sample, THREAD_KINDS[k].label);
  });
  $("legend").replaceChildren(...states.map(([k, label]) => el("div", { class: "lg" }, el("span", { class: `sw ${k}` }), label)), el("div", { class: "lg-gap" }), ...kinds);
}

// ── Tooltip ─────────────────────────────────────────────────────────────────

function showTooltip(target: Selection | null, cell: Cell | null, x: number, y: number): void {
  if (!target || !cell) {
    tooltip.style.display = "none";
    return;
  }
  let text: string;
  if (target.kind === "unit") {
    const unit = planet().units[target.id];
    const st = view.cellInfo(cell)?.state ?? "";
    text = `${unit.title} · ${STATE_TEXT[st] ?? st}`;
  } else {
    const r = lens().regions[target.id];
    const s = regionStats(atlas, planet(), lens(), r.id);
    const due = dueCards(atlas, unitsIn(planet(), lens(), r.id).flatMap((c) => c.cards)).length;
    text = `${lens().levels[r.level - 1]}: ${r.name} · ${STATE_TEXT[s.label] ?? s.label}${due ? ` · ${due} fällig` : ""}`;
  }
  if (pick) text = `Faden zu: ${text}`;
  tooltip.textContent = text;
  tooltip.style.display = "block";
  tooltip.style.left = `${Math.min(x + 14, window.innerWidth - tooltip.offsetWidth - 10)}px`;
  tooltip.style.top = `${y + 16}px`;
}

// ── Panel ───────────────────────────────────────────────────────────────────

function select(target: Selection | null): void {
  view.selection = target;
  view.requestDraw();
  refreshPanel();
}

function closePanel(): void {
  select(null);
}

function refreshPanel(): void {
  const sel = view.selection;
  if (!sel || (sel.kind === "unit" ? !planet().units[sel.id] : !lens().regions[sel.id])) {
    panel.style.display = "none";
    view.rightInset = 0;
    return;
  }
  panel.style.display = "flex";
  view.rightInset = panel.offsetWidth + 24;
  panel.replaceChildren(sel.kind === "unit" ? unitPanel(planet().units[sel.id]) : regionPanel(sel.id));
}

function emblemSection(id: string): HTMLElement {
  const eff = effectiveEmblem(atlas, id);
  const own = () => {
    askLine("Eigenes Sinnbild", eff?.emblem.glyph ?? "", "Ein Kurzzeichen – Formel, Symbol oder Emoji, höchstens 16 Zeichen. Es gilt nur für dich. Ein Bild zeichnet dir dein Agent.").then((glyph) => {
      if (glyph) apply(() => setEmblem(atlas, id, { glyph, by: "learner" }, "personal"), { layout: false });
    });
  };
  return el(
    "div",
    { class: "emblem-row small muted" },
    eff ? (eff.personal ? "Dein eigenes Sinnbild" : "Gemeinsames Sinnbild") : "Noch kein Sinnbild – das zeichnet der Agent.",
    eff?.personal ? button("Gemeinsames nutzen", () => apply(() => clearPersonalEmblem(atlas, id), { layout: false }), "link") : button("Für mich ändern …", own, "link"),
  );
}

function regionPanel(id: string): HTMLElement {
  const l = lens();
  const r = l.regions[id];
  const units = unitsIn(planet(), l, id);
  const cards = units.flatMap((c) => c.cards);
  const s = regionStats(atlas, planet(), l, id);
  const due = dueCards(atlas, cards);
  const leaf = Boolean(r.units);
  const children = leaf
    ? (r.units ?? []).map((uid) => ({ id: uid, kind: "unit" as const, stats: statsForCards(planet().units[uid].cards), count: `${planet().units[uid].cards.length} Karten` }))
    : r.children.map((cid) => ({ id: cid, kind: "region" as const, stats: regionStats(atlas, planet(), l, cid), count: `${unitsIn(planet(), l, cid).length} Einheiten` }));
  const childLabel = leaf ? "Lerneinheiten" : l.levels[r.level];
  const requests = pendingRequests().filter((q) => q.planet === planetId && q.lens === l.id && q.region === id);
  return el(
    "div",
    { class: "inner" },
    el(
      "div",
      { class: "head" },
      emblemView(id, 64),
      el("div", { class: "grow" }, el("div", { class: "kicker" }, `${l.levels[r.level - 1]} · ${l.name}`), el("h2", {}, r.name), r.parent ? crumbsFor(r.parent, false) : null),
      button("×", closePanel, "icon close"),
    ),
    emblemSection(id),
    stateBar(s, 12),
    el("p", { class: "small muted" }, `${units.length} Lerneinheiten · ${cards.length} Karten · ${due.length} fällig · Zustand: ${STATE_TEXT[s.label] ?? s.label}`),
    el(
      "div",
      { class: "actions" },
      due.length ? button(`Wiederholen (${due.length})`, () => review(due, r.name), "primary") : null,
      button("Hineinzoomen", () => view.fitRegion(id)),
      button("Hier importieren …", () => openImport(id)),
      l.home === id ? null : button("Als Heimat", () => apply(() => setHome(l, id), { layout: false })),
    ),
    requests.length
      ? el("div", { class: "pending" }, `Beim Agenten: ${requests.length} Import${requests.length === 1 ? "" : "e"} für diesen Ort`)
      : null,
    threadSummary(id),
    el("h3", {}, childLabel),
    el(
      "ul",
      { class: "children" },
      ...children.map((c) =>
        el(
          "li",
          {},
          richButton(
            () => {
              select(c.kind === "unit" ? { kind: "unit", id: c.id } : { kind: "region", id: c.id });
              if (c.kind === "unit") view.focusUnit(c.id);
              else view.fitRegion(c.id);
            },
            "child",
            emblemView(c.id, 30),
            el("span", { class: "grow" }, el("span", { class: "name" }, itemName(atlas, c.id)), stateBar(c.stats, 5)),
            el("span", { class: "small muted" }, c.count),
          ),
        ),
      ),
    ),
  );
}

/** Threads leaving a region, grouped by where they go (same level, or another planet). */
function threadSummary(regionId: string): HTMLElement | null {
  const l = lens();
  const r = l.regions[regionId];
  const home = homeIndex(l);
  const inside = (uid: string) => regionPath(l, home.get(uid) ?? "").some((p) => p.id === regionId);
  const outward = new Map<string, { label: string; threads: Thread[]; go: () => void }>();
  for (const t of threadsOf(atlas, planet())) {
    const ia = inside(t.a);
    const ib = inside(t.b);
    if (ia === ib) continue;
    const other = ia ? t.b : t.a;
    const otherPlanet = planetOfUnit(atlas, other);
    let key: string;
    let label: string;
    let go: () => void;
    if (otherPlanet && otherPlanet.id !== planetId) {
      key = `planet:${otherPlanet.id}`;
      label = `${otherPlanet.name} (anderer Planet)`;
      go = () => goToUnit(otherPlanet.id, other);
    } else {
      const path = regionPath(l, home.get(other) ?? "");
      const at = path[Math.min(r.level, path.length) - 1] ?? path[path.length - 1];
      if (!at) continue;
      key = at.id;
      label = pathText(l, at.id);
      go = () => {
        select({ kind: "region", id: at.id });
        view.fitRegion(at.id);
      };
    }
    const entry = outward.get(key) ?? { label, threads: [], go };
    entry.threads.push(t);
    outward.set(key, entry);
  }
  if (outward.size === 0) return null;
  const rows = [...outward.values()].sort((a, b) => b.threads.length - a.threads.length).slice(0, 8);
  return el(
    "div",
    {},
    el("h3", {}, "Rote Fäden"),
    el(
      "ul",
      { class: "threads" },
      ...rows.map((row) => {
        const kinds = [...new Set(row.threads.map((t) => THREAD_KINDS[t.kind].label))].join(", ");
        const note = row.threads.find((t) => t.note && t.kind !== "voraussetzung")?.note;
        return el(
          "li",
          {},
          el("span", { class: "pin" }),
          el("div", { class: "grow" }, button(row.label, row.go, "link"), el("div", { class: "small muted" }, `${row.threads.length} ${row.threads.length === 1 ? "Faden" : "Fäden"}: ${kinds}${note ? ` · „${note}“` : ""}`)),
        );
      }),
    ),
  );
}

function unitPanel(c: Concept): HTMLElement {
  const l = lens();
  const home = homeIndex(l).get(c.id) ?? "";
  const s = statsForCards(c.cards);
  const due = dueCards(atlas, c.cards);
  const threads = threadsOf(atlas, planet()).filter((t) => t.a === c.id || t.b === c.id);
  const groups: Array<{ title: string; list: Array<{ thread: Thread; other: string }> }> = [];
  for (const kind of Object.keys(THREAD_KINDS) as ThreadKind[]) {
    const out = threads.filter((t) => t.kind === kind && t.a === c.id).map((thread) => ({ thread, other: thread.b }));
    const inn = threads.filter((t) => t.kind === kind && t.b === c.id).map((thread) => ({ thread, other: thread.a }));
    if (kind === "verbindung") {
      if (out.length + inn.length) groups.push({ title: "Verbindungen", list: [...out, ...inn] });
      continue;
    }
    if (out.length) groups.push({ title: THREAD_KINDS[kind].from, list: out });
    if (inn.length) groups.push({ title: THREAD_KINDS[kind].to, list: inn });
  }
  // Same name, other knowledge: units whose titles start alike.
  const firstWord = shortTitle(c.title).split(/\s+/)[0];
  const namesakes = firstWord.length >= 6 ? Object.values(planet().units).filter((u) => u.id !== c.id && shortTitle(u.title).split(/\s+/)[0] === firstWord) : [];
  return el(
    "div",
    { class: "inner" },
    el(
      "div",
      { class: "head" },
      emblemView(c.id, 72),
      el("div", { class: "grow" }, el("div", { class: "kicker" }, `Lerneinheit · ${planet().name}`), el("h2", {}, c.title), home ? crumbsFor(home, false) : null),
      button("×", closePanel, "icon close"),
    ),
    emblemSection(c.id),
    el("div", { class: "row" }, stateBadge(s.label), el("span", { class: "small muted" }, `${c.cards.length} Karten · ${due.length} fällig`)),
    el(
      "div",
      { class: "actions" },
      button(due.length ? `Wiederholen (${due.length})` : "Üben", () => review(due.length ? due : c.cards, c.title), "primary"),
      button("Faden spannen …", () => startThread(c.id)),
    ),
    threads.length ? el("h3", {}, "Rote Fäden") : null,
    ...groups.map((g) =>
      el(
        "div",
        {},
        el("div", { class: "kicker" }, g.title),
        el(
          "ul",
          { class: "threads" },
          ...g.list.map(({ thread, other }) => {
            const otherPlanet = planetOfUnit(atlas, other);
            const external = otherPlanet && otherPlanet.id !== planetId;
            const unit = findUnit(atlas, other);
            return el(
              "li",
              {},
              el("span", { class: thread.kind === "voraussetzung" ? "pin req" : "pin" }),
              el(
                "div",
                { class: "grow" },
                external ? el("span", { class: "planet-tag" }, otherPlanet.name) : null,
                button(unit?.title ?? other, () => (external ? goToUnit(otherPlanet.id, other) : (select({ kind: "unit", id: other }), view.focusUnit(other))), "link"),
                thread.note ? el("div", { class: "small muted" }, thread.kind === "voraussetzung" ? thread.note : `„${thread.note}“${thread.by === "agent" ? " – Agent" : ""}`) : null,
              ),
              thread.by !== "kachel" ? button("×", () => apply(() => removeThread(atlas, planetId, thread.id), { layout: false }), "icon") : null,
            );
          }),
        ),
      ),
    ),
    namesakes.length
      ? el(
          "div",
          {},
          el("h3", {}, "Gleicher Name, anderes Wissen"),
          el(
            "ul",
            { class: "threads" },
            ...namesakes.map((u) =>
              el(
                "li",
                {},
                el("span", { class: "pin ghost" }),
                el("div", { class: "grow" }, button(u.title, () => (select({ kind: "unit", id: u.id }), view.focusUnit(u.id)), "link"), el("div", { class: "small muted" }, pathText(l, homeIndex(l).get(u.id) ?? ""))),
              ),
            ),
          ),
        )
      : null,
    el("h3", {}, "Karten"),
    el("ul", { class: "cards" }, ...c.cards.map((k) => el("li", {}, k.question))),
  );
}

// ── Dialog helpers ──────────────────────────────────────────────────────────

function askLine(title: string, initial = "", hint = ""): Promise<string | null> {
  return new Promise((resolve) => {
    let input: HTMLInputElement;
    modal((done) => {
      input = el("input", { type: "text", value: initial });
      const ok = () => {
        const v = input.value.trim();
        done();
        resolve(v || null);
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") ok();
      });
      return el(
        "div",
        {},
        el("h2", {}, title),
        hint ? el("p", { class: "muted" }, hint) : null,
        input,
        el("div", { class: "actions" }, button("Abbrechen", () => { done(); resolve(null); }), button("OK", ok, "primary")),
      );
    });
    setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  });
}

// ── Review ──────────────────────────────────────────────────────────────────

function review(cards: StoredCard[], title: string): void {
  const queue = cards.slice();
  if (queue.length === 0) return;
  let i = 0;
  let shown = false;
  let rated = 0;
  const unitOf = (card: StoredCard) => Object.values(planet().units).find((c) => c.cards.some((x) => x.id === card.id));
  modal((close) => {
    const host = el("div", {});
    const finish = () => {
      document.removeEventListener("keydown", onKey);
      close();
      if (rated > 0) {
        atlas.lastChange = { by: "studio", summary: `${rated} Karten wiederholt: ${title}` };
        view.recolor();
        refreshPanel();
        updateToolbar();
        save();
        toast(`${rated} Karten wiederholt – ${title}`);
      }
    };
    const rate = (r: Rating) => {
      rateCard(atlas, queue[i].id, r);
      rated += 1;
      i += 1;
      shown = false;
      if (i >= queue.length) finish();
      else render();
    };
    const onKey = (e: KeyboardEvent) => {
      if (!host.isConnected) return document.removeEventListener("keydown", onKey);
      if (!shown && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        shown = true;
        render();
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) rate(Number(e.key) as Rating);
    };
    document.addEventListener("keydown", onKey);
    const render = () => {
      const card = queue[i];
      const unit = unitOf(card);
      host.replaceChildren(
        el("div", { class: "row" }, unit ? emblemView(unit.id, 36) : "", el("span", { class: "muted small grow" }, unit && unit.title !== title ? `${title} · ${unit.title}` : title), el("span", { class: "muted small" }, `${i + 1} / ${queue.length}`)),
        el("div", { class: "card-q" }, card.question),
        shown
          ? el(
              "div",
              {},
              el("div", { class: "card-a" }, card.answer),
              el("div", { class: "ratings" }, button("1 Nochmal", () => rate(1)), button("2 Schwer", () => rate(2)), button("3 Gut", () => rate(3), "primary"), button("4 Leicht", () => rate(4))),
            )
          : el("div", { class: "actions" }, button("Antwort zeigen (Leertaste)", () => { shown = true; render(); }, "primary"), button("Beenden", finish)),
      );
    };
    render();
    return host;
  }, true);
}

// ── Threads ─────────────────────────────────────────────────────────────────

function beginPick(title: string, onPick: (id: string) => void, allow?: (id: string) => boolean): void {
  pick = { title, onPick };
  view.pickMode = { allow };
  banner.replaceChildren(el("span", { class: "grow" }, title), button("Abbrechen", endPick));
  banner.style.display = "flex";
  view.requestDraw();
}

function endPick(): void {
  pick = null;
  view.pickMode = null;
  banner.style.display = "none";
  view.requestDraw();
}

function startThread(unitId: string): void {
  const name = shortTitle(planet().units[unitId].title);
  beginPick(`Faden von „${name}“ – klicke die Lerneinheit, die dazugehört (zoome nah heran)`, (otherId) => chooseKind(unitId, otherId), (id) => id !== unitId);
}

function chooseKind(a: string, b: string): void {
  let from = a;
  let to = b;
  modal((close) => {
    const host = el("div", {});
    const render = () => {
      const x = `„${shortTitle(itemName(atlas, from))}“`;
      const y = `„${shortTitle(itemName(atlas, to))}“`;
      const sentences: Record<ThreadKind, string> = {
        voraussetzung: `${x} ist Voraussetzung für ${y}`,
        nutzt: `${x} nutzt ${y}`,
        schnittstelle: `${x} bietet eine Schnittstelle, ${y} nutzt sie`,
        "ist-ein": `${x} ist ein Sonderfall von ${y}`,
        verbindung: `${x} und ${y} gehören zusammen`,
      };
      host.replaceChildren(
        el("h2", {}, "Welcher Faden?"),
        el("p", { class: "muted" }, "Die Enden folgen UML: Pfeil, gestrichelte Abhängigkeit, Kugel und Pfanne, hohles Dreieck, einfache Linie."),
        el(
          "div",
          { class: "kinds" },
          ...(Object.keys(THREAD_KINDS) as ThreadKind[]).map((kind) => {
            const sample = el("span", { class: "kind" });
            sample.innerHTML = KIND_SVG[kind];
            return richButton(async () => {
              close();
              const note = await askLine("Warum hängt das zusammen?", "", `${sentences[kind]} – ein kurzer Satz hilft beim Erinnern.`);
              if (apply(() => addThread(atlas, planetId, from, to, kind, note ?? undefined, "learner"), { layout: false })) {
                if (view.threadMode === "aus") view.threadMode = "auswahl";
                updateToolbar();
              }
            }, "kind-choice", sample, el("span", {}, sentences[kind]));
          }),
        ),
        el("div", { class: "actions" }, button("Richtung tauschen", () => { [from, to] = [to, from]; render(); }), button("Abbrechen", close)),
      );
    };
    render();
    return host;
  });
}

// ── Import at a place ───────────────────────────────────────────────────────

/** Tiles from the curriculum that would land inside this region of the current lens. */
function tilesFor(regionId: string): string[] {
  const l = lens();
  const prefix = regionId ? l.regions[regionId].key : "";
  return Object.keys(catalog)
    .filter((key) => {
      const tile = catalog[key];
      if (tile.atoms.every((a) => planet().units[a.id])) return false;
      return conceptsFromTileFor(key, tile).some((c) => {
        const k = lensKeyFor(l.id, c);
        return k !== null && (prefix === "" || k === prefix || k.startsWith(`${prefix}/`));
      });
    })
    .sort((a, b) => a.localeCompare(b, "de", { numeric: true }));
}

function openImport(regionId: string): void {
  const l = lens();
  const region = regionId ? l.regions[regionId] : null;
  const where = region ? pathText(l, regionId) : planet().name;
  const below = region ? l.levels.slice(region.level) : l.levels;
  modal((close) => {
    const text = el("textarea", { rows: "7", placeholder: "Mitschrift, Tafelbild, Text aus einem Handout …" }) as HTMLTextAreaElement;
    const tiles = planet().kind === "welt" ? tilesFor(regionId) : [];
    return el(
      "div",
      {},
      el("h2", {}, "Hier importieren"),
      el("p", {}, el("strong", {}, where)),
      el(
        "p",
        { class: "muted small" },
        below.length
          ? `Der Agent ordnet darunter selbst ein (${below.join(" › ")}). Je tiefer du den Import startest, desto weniger muss er raten.`
          : "Die Lerneinheiten landen genau hier.",
      ),
      el("h3", {}, "Mitschrift oder Text"),
      text,
      el(
        "div",
        { class: "actions" },
        button("An den Agenten geben", () => {
          if (apply(() => requestImport(atlas, planetId, l.id, regionId, text.value), { layout: false })) close();
        }, "primary"),
      ),
      tiles.length
        ? el(
            "div",
            {},
            el("h3", {}, region ? "Aus dem Lehrplan – passt hierher" : "Aus dem Lehrplan"),
            el("p", { class: "muted small" }, "Die Struktur des Lehrplans steht schon: diese Kacheln landen ohne neue Kategorien an ihrem Platz."),
            el(
              "div",
              { class: "chips" },
              ...tiles.slice(0, 40).map((key) =>
                button(tileTitle(catalog[key]), () => {
                  const before = new Set(Object.keys(planet().units));
                  let leaves: string[] = [];
                  if (!apply(() => {
                    const r = importTile(atlas, key, catalog[key]);
                    leaves = r.leaves;
                    // New places get the sample Sinnbilder an agent would draw.
                    applyEmblems(atlas, REGION_EMBLEMS, SAMPLE_EMBLEMS);
                    return r.summary;
                  })) return;
                  close();
                  const added = Object.keys(planet().units).filter((id) => !before.has(id));
                  view.flash = { ids: new Set(added), until: performance.now() + 2400 };
                  const first = added[0] ? homeIndex(lens()).get(added[0]) : leaves[0];
                  const target = first ? (lens().regions[first]?.parent ?? first) : null;
                  if (target) {
                    select({ kind: "region", id: target });
                    view.fitRegion(target);
                  }
                }),
              ),
            ),
          )
        : null,
    );
  }, true);
}

function openRequests(): void {
  modal((close) => {
    const list = el("ul", { class: "list" });
    const render = () => {
      list.replaceChildren(
        ...pendingRequests().map((q) => {
          const p = atlas.planets[q.planet];
          const l = lensOf(p, q.lens);
          return el(
            "li",
            {},
            el("div", {}, el("strong", {}, q.region ? pathText(l, q.region) : p.name), el("span", { class: "muted small" }, ` · ${p.name} · ${l.name}`)),
            el("div", { class: "small" }, q.text.length > 220 ? `${q.text.slice(0, 220)}…` : q.text),
            el("div", { class: "small muted" }, q.units.length ? `${q.units.length} Lerneinheiten schon eingefügt` : "Der Agent hat ihn noch nicht bearbeitet."),
            el(
              "div",
              { class: "actions" },
              button("Zurückziehen", () => {
                atlas.requests = atlas.requests.filter((x) => x.id !== q.id);
                apply(() => "Import zurückgezogen", { layout: false });
                render();
                if (pendingRequests().length === 0) close();
              }),
            ),
          );
        }),
      );
    };
    render();
    return el(
      "div",
      {},
      el("h2", {}, "Beim Agenten"),
      el("p", { class: "muted" }, "Importe, die du an einem Ort der Karte gestartet hast. Der Agent macht daraus Lerneinheiten – genau dort. (CLI: imports, add-unit)"),
      list,
    );
  });
}

// ── Time machine ────────────────────────────────────────────────────────────

function openTime(): void {
  modal((close) => {
    const jump = (days: number) => {
      apply(() => advanceClock(atlas, days), { layout: false });
      close();
    };
    return el(
      "div",
      {},
      el("h2", {}, "Zeitmaschine"),
      el("p", { class: "muted" }, `Simulierter Tag ${simDay(atlas)}. Spring in die Zukunft und sieh zu, wie der Nebel kommt.`),
      el("div", { class: "actions" }, ...[1, 7, 30, 90, 365].map((d) => button(`+${d} Tag${d === 1 ? "" : "e"}`, () => jump(d)))),
      el("h3", {}, "Neu anfangen"),
      el("div", { class: "actions" }, button("Mit Lernverlauf", () => reset(true), "danger"), button("Alles unerforscht", () => reset(false), "danger")),
    );
    function reset(history: boolean): void {
      const fresh = createStartAtlas(catalog, START_SAMPLES, { history, regionEmblems: REGION_EMBLEMS, unitEmblems: SAMPLE_EMBLEMS });
      settleAll(fresh);
      fresh.revision = atlas.revision;
      atlas = fresh;
      atlas.lastChange = { by: "studio", summary: "Neu angefangen" };
      close();
      endPick();
      view.selection = null;
      relayout();
      goHome(false);
      save();
      toast(`Neu angefangen: ${startTileKeys(catalog).length} Kacheln im Weltwissen, dazu Firma und Privat`);
    }
  });
}

// ── Help ────────────────────────────────────────────────────────────────────

function openHelp(): void {
  const rows: Array<[string, string]> = [
    ["Scrollen / Pinch", "zoomen – von den Inseln bis zu den einzelnen Lerneinheiten"],
    ["Ziehen", "Karte verschieben"],
    ["Klick", "auswählen (auf der Ebene, die du gerade siehst)"],
    ["Doppelklick", "hineinzoomen"],
    ["P · L", "nächster Planet · nächste Ansicht"],
    ["F", "rote Fäden: alle → nur Auswahl → aus"],
    ["/", "suchen"],
    ["I · T", "importieren · Zeitmaschine"],
    ["0", "Heimat (oder ganzer Planet)"],
    ["Esc", "abbrechen, schließen, eine Ebene hinaus"],
  ];
  modal(() =>
    el(
      "div",
      {},
      el("h2", {}, "Wissensatlas"),
      el("p", {}, "Wissen liegt auf getrennten Planeten: Weltwissen auf einem zentralen Server, Firmenwissen bleibt in der Firma, Privates auf deinem Gerät. Fäden zwischen Planeten zeigen nur vom Firmen- oder Privatwissen zum Weltwissen."),
      el("p", {}, "Jeder Planet hat Ansichten – zum Beispiel Weltwissen und Schule, oder Organisation und Produkte. Dieselben Lerneinheiten liegen dann woanders."),
      el("p", {}, "Farbe zeigt, wo etwas hingehört; die Oberfläche, wie gut du es weißt: satt, staubig, dunkel, rissig, im Nebel – oder skizziert, wenn du es noch nie geübt hast."),
      el("p", {}, "Rote Fäden mit UML-Enden: Voraussetzung (Pfeil), nutzt (gestrichelt), Schnittstelle (Kugel und Pfanne), ist ein (hohles Dreieck), Verbindung (mit Notiz). Ein Faden zu einem anderen Planeten endet an einem Portal – klick es an."),
      el("p", {}, "„Hier importieren …“ an einem Ort: Der Agent macht aus deiner Mitschrift Lerneinheiten genau dort."),
      el("table", { class: "help" }, ...rows.map(([k, v]) => el("tr", {}, el("td", {}, el("kbd", {}, k)), el("td", {}, v)))),
    ),
  );
}

// ── Search ──────────────────────────────────────────────────────────────────

const search = $("search") as HTMLInputElement;
const results = $("results");

function showResults(): void {
  const l = lens();
  const hits = find(planet(), l, search.value).slice(0, 8);
  const home = homeIndex(l);
  results.replaceChildren(
    ...hits.map((hit) => {
      const target: Selection = hit.kind === "unit" ? { kind: "unit", id: hit.unit.id } : { kind: "region", id: hit.region.id };
      const sub = hit.kind === "unit" ? pathText(l, home.get(target.id) ?? "") : `${l.levels[hit.region.level - 1]} · ${pathText(l, hit.region.id)}`;
      return richButton(() => go(target), "result", emblemView(target.id, 24), el("span", { class: "grow" }, el("span", { class: "name" }, itemName(atlas, target.id)), el("span", { class: "small muted" }, sub)));
    }),
  );
  results.style.display = hits.length ? "flex" : "none";
}

function go(target: Selection): void {
  search.value = "";
  results.style.display = "none";
  search.blur();
  select(target);
  if (target.kind === "unit") view.focusUnit(target.id);
  else view.fitRegion(target.id);
}

search.addEventListener("input", showResults);
search.addEventListener("keydown", (e) => {
  if (e.key === "Enter") results.querySelector<HTMLButtonElement>("button.result")?.click();
  else if (e.key === "Escape") {
    search.value = "";
    results.style.display = "none";
    search.blur();
  }
});

// ── Keys and zoom buttons ───────────────────────────────────────────────────

$("zoom").replaceChildren(button("+", () => view.zoomBy(1.5), "icon"), button("−", () => view.zoomBy(1 / 1.5), "icon"), button("Alles", () => view.fitAll(), "icon"));

document.addEventListener("keydown", (e) => {
  if (isModalOpen() || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
  if (e.key === "Escape") {
    if (pick) endPick();
    else if (view.selection) closePanel();
    else {
      const r = view.viewRegion();
      const parent = r ? lens().regions[r].parent : null;
      if (parent) view.fitRegion(parent);
      else view.fitAll();
    }
  } else if (e.key === "f" || e.key === "F") cycleThreads();
  else if (e.key === "i" || e.key === "I") openImport(view.viewRegion() ?? "");
  else if (e.key === "t" || e.key === "T") openTime();
  else if (e.key === "h" || e.key === "H" || e.key === "?") openHelp();
  else if (e.key === "p" || e.key === "P") switchTo(atlas.planetOrder[(atlas.planetOrder.indexOf(planetId) + 1) % atlas.planetOrder.length]);
  else if (e.key === "l" || e.key === "L") {
    const lenses = planet().lenses;
    switchTo(planetId, lenses[(lenses.indexOf(lens()) + 1) % lenses.length].id);
  } else if (e.key === "0") goHome();
  else if (e.key === "+" || e.key === "=") view.zoomBy(1.5);
  else if (e.key === "-") view.zoomBy(1 / 1.5);
  else if (e.key === "/") {
    e.preventDefault();
    search.focus();
  }
});

relayout();
goHome(false);
buildLegend();

// Debug hook for the spike.
(window as unknown as { __atlas: unknown }).__atlas = {
  view,
  get atlas() {
    return atlas;
  },
  get layout() {
    return layout;
  },
  switchTo,
};
