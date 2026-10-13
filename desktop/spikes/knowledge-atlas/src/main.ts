/**
 * Knowledge atlas spike — the Studio side.
 *
 * A zoomable map of world knowledge. The agent sorts new knowledge into its
 * logical place; the learner explores, reviews, and may rearrange — but
 * only what they have just reviewed. Red threads show what belongs together
 * across the map's order.
 */
import { button, el, isModalOpen, modal, toast } from "../../knowledge-world/src/dom.ts";
import { SAMPLE_EMBLEMS } from "../../knowledge-world/src/sample-emblems.ts";
import { statsFor, tileKeyFromFileName } from "../../knowledge-world/src/model.ts";
import {
  LEVEL_NAME,
  addThread,
  advanceClock,
  allThreads,
  clearPersonalEmblem,
  conceptsIn,
  createRegion,
  createStartAtlas,
  dismissProposal,
  displayEmblem,
  dueCards,
  effectiveEmblem,
  find,
  homeIndex,
  importTile,
  itemName,
  moveItem,
  pathText,
  rateCard,
  regionPath,
  regionStats,
  removeThread,
  rename,
  setEmblem,
  simDay,
  simNow,
  staleCards,
  startTileKeys,
  tileTitle,
} from "./atlas.ts";
import type { Atlas, Concept, Rating, Stats, StoredCard, Thread, TileCatalog, TileJson } from "./atlas.ts";
import { layoutAtlas } from "./layout.ts";
import type { Cell, Layout } from "./layout.ts";
import { MapView, emblemDataUrl } from "./render.ts";
import type { Selection, ThreadMode } from "./render.ts";
import { REGION_EMBLEMS } from "./sample-emblems.ts";
import { SAMPLE_THREADS } from "./sample-threads.ts";

// ── Catalog (bundled tiles) ─────────────────────────────────────────────────

const tileModules = import.meta.glob("../../../../tests/fixtures/curriculum/de-by-*-kvt.json", { eager: true, import: "default" }) as Record<string, TileJson>;
const catalog: TileCatalog = {};
for (const [path, tile] of Object.entries(tileModules)) {
  const key = tileKeyFromFileName(path.split("/").pop() ?? "");
  if (key) catalog[key] = tile;
}

// ── State ───────────────────────────────────────────────────────────────────

let atlas: Atlas = (await (await fetch("/api/atlas")).json()) as Atlas;
let layout: Layout = layoutAtlas(atlas);

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const canvas = $("map") as HTMLCanvasElement;
const panel = $("panel");
const tooltip = $("tooltip");
const banner = $("banner");

let pick: { level: 3 | 4 | "concept"; title: string; onPick: (id: string) => void; extra?: HTMLElement } | null = null;

const view = new MapView(canvas, {
  onClick(target) {
    if (pick) {
      if (target && (!view.pickMode?.allow || view.pickMode.allow(target.id))) {
        const done = pick;
        endPick();
        done.onPick(target.id);
      }
      return;
    }
    select(target);
  },
  onDoubleClick(target) {
    if (pick || !target) return;
    if (target.kind === "region") view.fitRegion(target.id);
    else view.focusConcept(target.id);
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
  layout = layoutAtlas(atlas);
  view.setData(atlas, layout);
  refreshPanel();
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
  const before = new Set(Object.keys(atlas.concepts));
  atlas = fresh;
  relayout();
  const added = Object.keys(atlas.concepts).filter((id) => !before.has(id));
  if (added.length) view.flash = { ids: new Set(added), until: performance.now() + 1800 };
  if (atlas.lastChange?.by === "agent") toast(atlas.lastChange.summary, "agent");
}

import.meta.hot?.on("atlas:changed", () => {
  void reloadFromServer();
});

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
  const path = regionPath(atlas, regionId);
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

const LEVEL_PLURAL = { 1: "Bereiche", 2: "Fächer", 3: "Gebiete", 4: "Themen", 5: "Begriffe" } as const;

function updateCrumbs(): void {
  const host = $("crumbs-path");
  const regionId = view.viewRegion();
  host.replaceChildren(button("Welt", () => view.fitAll(), "link"));
  if (regionId) {
    for (const r of regionPath(atlas, regionId)) {
      host.append(el("span", { class: "sep" }, "›"), button(r.name, () => view.fitRegion(r.id), "link"));
    }
  }
  $("crumbs-level").textContent = `Ansicht: ${LEVEL_PLURAL[view.focusLevel()]}`;
}

function updateToolbar(): void {
  const bar = $("toolbar");
  const modes: Record<ThreadMode, string> = { alle: "alle", auswahl: "Auswahl", aus: "aus" };
  const proposals = atlas.proposals.length;
  const items: HTMLElement[] = [button(`Rote Fäden: ${modes[view.threadMode]}`, cycleThreads, "threads")];
  if (proposals) items.push(button(`Vorschläge (${proposals})`, openProposals, "primary"));
  items.push(button("Importieren", openImport), button(`Zeit · Tag ${simDay(atlas)}`, openTime), button("?", openHelp, "icon"));
  bar.replaceChildren(...items);
}

function cycleThreads(): void {
  const order: ThreadMode[] = ["alle", "auswahl", "aus"];
  view.threadMode = order[(order.indexOf(view.threadMode) + 1) % order.length];
  updateToolbar();
  view.requestDraw();
}

function buildLegend(): void {
  const items: Array<[string, string]> = [
    ["hell", "sitzt"],
    ["staubig", "staubig (fällig)"],
    ["dunkel", "dunkel (lange fällig)"],
    ["verfallen", "verfällt (rissig)"],
    ["nebel", "im Nebel (vergessen)"],
    ["unerforscht", "unerforscht (skizziert)"],
  ];
  $("legend").replaceChildren(
    ...items.map(([k, label]) => el("div", { class: "lg" }, el("span", { class: `sw ${k}` }), label)),
    el("div", { class: "lg" }, el("span", { class: "sw thread" }), "roter Faden"),
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────────────

function showTooltip(target: Selection | null, cell: Cell | null, x: number, y: number): void {
  if (!target || !cell) {
    tooltip.style.display = "none";
    return;
  }
  let text: string;
  if (target.kind === "concept") {
    const c = atlas.concepts[target.id];
    const st = view.cellInfo(cell)?.state ?? "";
    text = `${c.title} · ${STATE_TEXT[st] ?? st}`;
  } else {
    const r = atlas.regions[target.id];
    const s = regionStats(atlas, r.id);
    const due = dueCards(atlas, conceptsIn(atlas, r.id).flatMap((c) => c.cards)).length;
    text = `${LEVEL_NAME[r.level]}: ${r.name} · ${STATE_TEXT[s.label] ?? s.label}${due ? ` · ${due} fällig` : ""}`;
  }
  if (pick) text = `${pick.title.split("—")[0].trim()}: ${text}`;
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
  if (!sel || (sel.kind === "concept" ? !atlas.concepts[sel.id] : !atlas.regions[sel.id])) {
    panel.style.display = "none";
    view.rightInset = 0;
    return;
  }
  panel.style.display = "flex";
  view.rightInset = panel.offsetWidth + 24;
  const body = sel.kind === "concept" ? conceptPanel(atlas.concepts[sel.id]) : regionPanel(sel.id);
  panel.replaceChildren(body);
}

function emblemSection(id: string): HTMLElement {
  const eff = effectiveEmblem(atlas, id);
  const own = () => {
    askGlyph(eff?.emblem.glyph ?? "").then((glyph) => {
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
  const r = atlas.regions[id];
  const concepts = conceptsIn(atlas, id);
  const cards = concepts.flatMap((c) => c.cards);
  const s = regionStats(atlas, id);
  const due = dueCards(atlas, cards);
  const children =
    r.level === 4
      ? (r.concepts ?? []).map((cid) => ({ id: cid, kind: "concept" as const, stats: statsForCards(atlas.concepts[cid].cards), count: `${atlas.concepts[cid].cards.length} Karten` }))
      : r.children.map((cid) => ({ id: cid, kind: "region" as const, stats: regionStats(atlas, cid), count: `${conceptsIn(atlas, cid).length} Begriffe` }));
  const childLabel = r.level === 4 ? "Begriffe" : LEVEL_PLURAL[(r.level + 1) as 2 | 3 | 4];
  return el(
    "div",
    { class: "inner" },
    el(
      "div",
      { class: "head" },
      emblemView(id, 64),
      el("div", { class: "grow" }, el("div", { class: "kicker" }, LEVEL_NAME[r.level]), el("h2", {}, r.name), r.parent ? crumbsFor(r.parent, false) : null),
      button("×", closePanel, "icon close"),
    ),
    emblemSection(id),
    stateBar(s, 12),
    el("p", { class: "small muted" }, `${concepts.length} Begriffe · ${cards.length} Karten · ${due.length} fällig · Zustand: ${STATE_TEXT[s.label] ?? s.label}`),
    el(
      "div",
      { class: "actions" },
      due.length ? button(`Wiederholen (${due.length})`, () => review(due, r.name), "primary") : null,
      button("Hineinzoomen", () => view.fitRegion(id)),
      r.level === 4 ? button("Verschieben …", () => startMove(id)) : null,
      button("Umbenennen …", () => askLine("Umbenennen", r.name).then((name) => name && apply(() => rename(atlas, id, name)))),
    ),
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
              select(c.kind === "concept" ? { kind: "concept", id: c.id } : { kind: "region", id: c.id });
              if (c.kind === "concept") view.focusConcept(c.id);
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

function threadSummary(regionId: string): HTMLElement | null {
  const r = atlas.regions[regionId];
  const home = homeIndex(atlas);
  const inside = (cid: string) => {
    const path = regionPath(atlas, home.get(cid) ?? "");
    return path.some((p) => p.id === regionId);
  };
  const outward = new Map<string, Thread[]>();
  for (const t of allThreads(atlas)) {
    const ia = inside(t.a);
    const ib = inside(t.b);
    if (ia === ib) continue;
    const other = ia ? t.b : t.a;
    const path = regionPath(atlas, home.get(other) ?? "");
    const at = path[Math.min(r.level, path.length) - 1] ?? path[path.length - 1];
    if (!at) continue;
    const list = outward.get(at.id) ?? [];
    list.push(t);
    outward.set(at.id, list);
  }
  if (outward.size === 0) return null;
  const rows = [...outward.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 8);
  return el(
    "div",
    {},
    el("h3", {}, "Rote Fäden"),
    el(
      "ul",
      { class: "threads" },
      ...rows.map(([otherId, threads]) => {
        const note = threads.find((t) => t.kind === "verbindung" && t.note)?.note;
        return el(
          "li",
          {},
          el("span", { class: "pin" }),
          el(
            "div",
            { class: "grow" },
            button(pathText(atlas, otherId), () => {
              select({ kind: "region", id: otherId });
              view.fitRegion(otherId);
            }, "link"),
            el("div", { class: "small muted" }, `${threads.length} ${threads.length === 1 ? "Faden" : "Fäden"}${note ? ` · „${note}“` : ""}`),
          ),
        );
      }),
    ),
  );
}

function conceptPanel(c: Concept): HTMLElement {
  const home = homeIndex(atlas).get(c.id) ?? "";
  const s = statsForCards(c.cards);
  const due = dueCards(atlas, c.cards);
  const threads = allThreads(atlas).filter((t) => t.a === c.id || t.b === c.id);
  const group = (title: string, list: Thread[], other: (t: Thread) => string) =>
    list.length === 0
      ? null
      : el(
          "div",
          {},
          el("div", { class: "kicker" }, title),
          el(
            "ul",
            { class: "threads" },
            ...list.map((t) =>
              el(
                "li",
                {},
                el("span", { class: t.kind === "verbindung" ? "pin" : "pin req" }),
                el(
                  "div",
                  { class: "grow" },
                  button(atlas.concepts[other(t)].title, () => {
                    select({ kind: "concept", id: other(t) });
                    view.focusConcept(other(t));
                  }, "link"),
                  t.note ? el("div", { class: "small muted" }, t.kind === "verbindung" ? `„${t.note}“${t.by === "agent" ? " – Agent" : ""}` : t.note) : null,
                ),
                t.kind === "verbindung" ? button("×", () => apply(() => removeThread(atlas, t.id), { layout: false }), "icon") : null,
              ),
            ),
          ),
        );
  return el(
    "div",
    { class: "inner" },
    el(
      "div",
      { class: "head" },
      emblemView(c.id, 72),
      el("div", { class: "grow" }, el("div", { class: "kicker" }, "Begriff"), el("h2", {}, c.title), home ? crumbsFor(home, false) : null),
      button("×", closePanel, "icon close"),
    ),
    emblemSection(c.id),
    el("div", { class: "row" }, stateBadge(s.label), el("span", { class: "small muted" }, `${c.cards.length} Karten · ${due.length} fällig`)),
    el(
      "div",
      { class: "actions" },
      button(due.length ? `Wiederholen (${due.length})` : "Üben", () => review(due.length ? due : c.cards, c.title), "primary"),
      button("Verschieben …", () => startMove(c.id)),
      button("Faden spannen …", () => startThread(c.id)),
    ),
    threads.length ? el("h3", {}, "Rote Fäden") : null,
    group("Baut auf", threads.filter((t) => t.kind === "voraussetzung" && t.b === c.id), (t) => t.a),
    group("Darauf baut auf", threads.filter((t) => t.kind === "voraussetzung" && t.a === c.id), (t) => t.b),
    group("Verbindungen", threads.filter((t) => t.kind === "verbindung"), (t) => (t.a === c.id ? t.b : t.a)),
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

function askGlyph(initial: string): Promise<string | null> {
  return askLine("Eigenes Sinnbild", initial, "Ein Kurzzeichen – Formel, Symbol oder Emoji, höchstens 16 Zeichen. Es gilt nur für dich. Ein Bild zeichnet dir dein Agent.");
}

// ── Review ──────────────────────────────────────────────────────────────────

/** Review cards one by one; resolves with how many were rated. */
function review(cards: StoredCard[], title: string, gate?: string): Promise<number> {
  return new Promise((resolve) => {
    const queue = cards.slice();
    if (queue.length === 0) {
      resolve(0);
      return;
    }
    let i = 0;
    let shown = false;
    let rated = 0;
    const conceptOf = (card: StoredCard) => Object.values(atlas.concepts).find((c) => c.cards.some((x) => x.id === card.id));
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
          if (!gate) toast(`${rated} Karten wiederholt – ${title}`);
        }
        resolve(rated);
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
        const concept = conceptOf(card);
        host.replaceChildren(
          gate ? el("div", { class: "gate" }, gate) : "",
          el("div", { class: "row" }, concept ? emblemView(concept.id, 36) : null, el("span", { class: "muted small grow" }, concept && concept.title !== title ? `${title} · ${concept.title}` : title), el("span", { class: "muted small" }, `${i + 1} / ${queue.length}`)),
          el("div", { class: "card-q" }, card.question),
          shown
            ? el(
                "div",
                {},
                el("div", { class: "card-a" }, card.answer),
                el("div", { class: "ratings" }, button("1 Nochmal", () => rate(1)), button("2 Schwer", () => rate(2)), button("3 Gut", () => rate(3), "primary"), button("4 Leicht", () => rate(4))),
              )
            : el("div", { class: "actions" }, button("Antwort zeigen (Leertaste)", () => { shown = true; render(); }, "primary"), button(gate ? "Abbrechen" : "Beenden", finish)),
        );
      };
      render();
      return host;
    }, true);
  });
}

// ── Moving: review first, then choose the place ─────────────────────────────

async function reviewBeforeMove(itemId: string, targetId?: string): Promise<boolean> {
  const concepts = atlas.concepts[itemId] ? [atlas.concepts[itemId]] : conceptsIn(atlas, itemId);
  const stale = staleCards(atlas, concepts);
  if (stale.length === 0) return true;
  const name = itemName(atlas, itemId);
  const then = targetId ? `dann zieht es nach ${pathText(atlas, targetId)}` : "dann darfst du entscheiden, wohin es wandert";
  const rated = await review(stale, name, `Umräumen ist Wiederholen: Erst die ${stale.length} Karte${stale.length === 1 ? "" : "n"} von „${name}“, ${then}.`);
  if (rated < stale.length) {
    toast("Noch nicht alles wiederholt – es bleibt, wo es ist.", "warn");
    return false;
  }
  return true;
}

async function startMove(itemId: string): Promise<void> {
  if (!(await reviewBeforeMove(itemId))) return;
  const isConcept = Boolean(atlas.concepts[itemId]);
  const name = itemName(atlas, itemId);
  const home = isConcept ? homeIndex(atlas).get(itemId) : atlas.regions[itemId].parent;
  const newPlace = button(isConcept ? "Neues Thema …" : "Neues Gebiet …", () => {
    endPick();
    // A new place lives one level up: pick its parent first.
    beginPick(isConcept ? 3 : 2 as 3, `Wo entsteht das neue ${isConcept ? "Thema" : "Gebiet"}? — klicke ein ${isConcept ? "Gebiet" : "Fach"}`, async (parentId) => {
      const label = await askLine(`Neues ${isConcept ? "Thema" : "Gebiet"} in ${atlas.regions[parentId].name}`, "", `„${name}“ zieht dort ein.`);
      if (!label) return;
      const ids = conceptIdsOf(itemId);
      if (apply(() => {
        const { id } = createRegion(atlas, parentId, label);
        return moveItem(atlas, itemId, id);
      })) flashConcepts(ids, isConcept);
    });
  });
  beginPick(isConcept ? 4 : 3, `Wohin soll „${name}“? — klicke ${isConcept ? "ein Thema" : "ein Gebiet"} auf der Karte`, (targetId) => {
    if (targetId === home) {
      toast("Das ist schon sein Ort.");
      return;
    }
    moveAndShow(itemId, targetId);
  }, newPlace, (id) => id !== home);
}

function conceptIdsOf(itemId: string): string[] {
  return atlas.concepts[itemId] ? [itemId] : conceptsIn(atlas, itemId).map((c) => c.id);
}

/** Show where things went: a moved Thema may have merged, so follow its Begriffe. */
function flashConcepts(ids: string[], single: boolean): void {
  view.flash = { ids: new Set(ids), until: performance.now() + 1800 };
  if (ids.length === 0) return;
  if (single) {
    select({ kind: "concept", id: ids[0] });
    view.focusConcept(ids[0]);
    return;
  }
  const topic = homeIndex(atlas).get(ids[0]);
  if (topic) {
    select({ kind: "region", id: topic });
    view.fitRegion(topic);
  }
}

/** Move after review; flash the Begriffe at their new place. */
function moveAndShow(itemId: string, targetId: string): void {
  const ids = conceptIdsOf(itemId);
  const single = Boolean(atlas.concepts[itemId]);
  if (apply(() => moveItem(atlas, itemId, targetId))) flashConcepts(ids, single);
}

function beginPick(level: 2 | 3 | 4 | "concept", title: string, onPick: (id: string) => void, extra?: HTMLElement, allow?: (id: string) => boolean): void {
  const pickLevel = level === 2 ? 3 : level;
  pick = { level: pickLevel, title, onPick, extra };
  // Picking a Fach: map Gebiet hover up to its Fach.
  if (level === 2) {
    pick.onPick = (areaId) => onPick(atlas.regions[areaId].parent ?? areaId);
  }
  view.pickMode = { level: pickLevel, allow };
  banner.replaceChildren(el("span", { class: "grow" }, title), extra ?? "", button("Abbrechen", endPick));
  banner.style.display = "flex";
  view.requestDraw();
}

function endPick(): void {
  pick = null;
  view.pickMode = null;
  banner.style.display = "none";
  view.requestDraw();
}

// ── Threads ─────────────────────────────────────────────────────────────────

function startThread(conceptId: string): void {
  const name = atlas.concepts[conceptId].title;
  beginPick("concept", `Faden von „${name}“ — klicke den Begriff, der dazugehört (zoome nah heran)`, async (otherId) => {
    const note = await askLine("Warum hängt das zusammen?", "", `„${name}“ ↔ „${atlas.concepts[otherId].title}“ — ein kurzer Satz hilft beim Erinnern.`);
    if (apply(() => addThread(atlas, conceptId, otherId, note ?? undefined, "learner"), { layout: false })) {
      view.threadMode = view.threadMode === "aus" ? "auswahl" : view.threadMode;
      updateToolbar();
    }
  }, undefined, (id) => id !== conceptId);
}

// ── Proposals ───────────────────────────────────────────────────────────────

function openProposals(): void {
  modal((close) => {
    const list = el("ul", { class: "list" });
    const render = () => {
      list.replaceChildren(
        ...atlas.proposals.map((p) =>
          el(
            "li",
            {},
            el("div", {}, el("strong", {}, itemName(atlas, p.item)), " → ", pathText(atlas, p.target)),
            p.note ? el("div", { class: "small muted" }, `„${p.note}“`) : null,
            el(
              "div",
              { class: "actions" },
              button("Wiederholen & umziehen", async () => {
                close();
                if (!(await reviewBeforeMove(p.item, p.target))) return;
                moveAndShow(p.item, p.target);
              }, "primary"),
              button("Ansehen", () => {
                close();
                flashConcepts(conceptIdsOf(p.item), Boolean(atlas.concepts[p.item]));
              }),
              button("Verwerfen", () => {
                apply(() => dismissProposal(atlas, p.id), { layout: false });
                render();
                if (atlas.proposals.length === 0) close();
              }),
            ),
          ),
        ),
      );
    };
    render();
    return el("div", {}, el("h2", {}, "Vorschläge des Agenten"), el("p", { class: "muted" }, "Der Agent schlägt neue Orte vor. Umziehen darf etwas erst, nachdem du es wiederholt hast."), list);
  });
}

// ── Import ──────────────────────────────────────────────────────────────────

function openImport(): void {
  const groups = new Map<string, string[]>();
  for (const key of Object.keys(catalog).sort((a, b) => a.localeCompare(b, "de", { numeric: true }))) {
    const m = /^(realschule|gymnasium|bos)-(\d+)-/.exec(key);
    const group = m ? `${m[1].charAt(0).toUpperCase()}${m[1].slice(1)} ${m[2]}` : "Sonstige";
    groups.set(group, [...(groups.get(group) ?? []), key]);
  }
  modal((close) => {
    const body = el("div", { class: "import" });
    for (const [group, keys] of groups) {
      body.append(
        el("h3", {}, group),
        el(
          "div",
          { class: "chips" },
          ...keys.map((key) => {
            const tile = catalog[key];
            const have = tile.atoms.filter((a) => atlas.concepts[a.id]).length;
            const full = have === tile.atoms.length;
            const b = button(`${tileTitle(tile)}${full ? " ✓" : ""}`, () => {
              let topics: string[] = [];
              const before = new Set(Object.keys(atlas.concepts));
              if (!apply(() => {
                const r = importTile(atlas, key, tile);
                topics = r.topics;
                return r.summary;
              })) return;
              close();
              const added = Object.keys(atlas.concepts).filter((id) => !before.has(id));
              view.flash = { ids: new Set(added), until: performance.now() + 2200 };
              if (topics[0]) {
                const area = atlas.regions[topics[0]].parent ?? topics[0];
                select({ kind: "region", id: area });
                view.fitRegion(area);
              }
            }, full ? "done" : "");
            if (full) b.setAttribute("disabled", "");
            return b;
          }),
        ),
      );
    }
    return el("div", {}, el("h2", {}, "Wissen importieren"), el("p", { class: "muted" }, "Der Agent sortiert neue Begriffe an ihren logischen Ort – als unerforschtes, skizziertes Land. Erforscht wird es durch Lernen."), body);
  }, true);
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
      el(
        "div",
        { class: "actions" },
        button("Mit Lernverlauf", () => reset(true), "danger"),
        button("Alles unerforscht", () => reset(false), "danger"),
      ),
    );
    function reset(history: boolean): void {
      const fresh = createStartAtlas(catalog, { history, regionEmblems: REGION_EMBLEMS, conceptEmblems: SAMPLE_EMBLEMS, threads: SAMPLE_THREADS });
      fresh.revision = atlas.revision;
      atlas = fresh;
      atlas.lastChange = { by: "studio", summary: "Neu angefangen" };
      close();
      endPick();
      select(null);
      relayout();
      view.fitAll();
      save();
      toast(`Neu angefangen: ${startTileKeys(catalog).length} Kacheln, ${Object.keys(atlas.concepts).length} Begriffe`);
    }
  });
}

// ── Help ────────────────────────────────────────────────────────────────────

function openHelp(): void {
  const rows: Array<[string, string]> = [
    ["Scrollen / Pinch", "zoomen – von Bereichen über Fächer, Gebiete und Themen bis zu den Begriffen"],
    ["Ziehen", "Karte verschieben"],
    ["Klick", "auswählen (auf der Ebene, die du gerade siehst)"],
    ["Doppelklick", "hineinzoomen"],
    ["F", "rote Fäden: alle → nur Auswahl → aus"],
    ["/", "suchen"],
    ["I · T", "importieren · Zeitmaschine"],
    ["0", "ganze Welt"],
    ["Esc", "abbrechen, schließen, eine Ebene hinaus"],
  ];
  modal(() =>
    el(
      "div",
      {},
      el("h2", {}, "Wissensatlas"),
      el("p", {}, "Farbe zeigt, wo etwas hingehört: jedes Fach hat seinen Farbton, jedes Gebiet eine Schattierung und ein Muster. Die Oberfläche zeigt, wie gut du es weißt: satt und klar, staubig, dunkel, rissig, im Nebel – oder nur skizziert, wenn du es noch nie geübt hast."),
      el("p", {}, "Rote Fäden verbinden, was zusammengehört: Voraussetzungen (dunkelrot) und Verbindungen quer durch die Fächer (hellrot, mit Notiz). Je weiter du hinauszoomst, desto mehr Fäden werden zu einem gebündelt."),
      el("p", {}, "Umräumen ist Wiederholen: Bevor ein Begriff oder Thema umziehen darf, wiederholst du seine Karten."),
      el("table", { class: "help" }, ...rows.map(([k, v]) => el("tr", {}, el("td", {}, el("kbd", {}, k)), el("td", {}, v)))),
    ),
  );
}

// ── Search ──────────────────────────────────────────────────────────────────

const search = $("search") as HTMLInputElement;
const results = $("results");

function showResults(): void {
  const hits = find(atlas, search.value).slice(0, 8);
  const home = homeIndex(atlas);
  results.replaceChildren(
    ...hits.map((hit) => {
      const target: Selection = hit.kind === "concept" ? { kind: "concept", id: hit.concept.id } : { kind: "region", id: hit.region.id };
      const sub = hit.kind === "concept" ? pathText(atlas, home.get(target.id) ?? "") : `${LEVEL_NAME[hit.region.level]} · ${pathText(atlas, hit.region.id)}`;
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
  if (target.kind === "concept") view.focusConcept(target.id);
  else view.fitRegion(target.id);
}

search.addEventListener("input", showResults);
search.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const first = results.querySelector<HTMLButtonElement>("button.result");
    first?.click();
  } else if (e.key === "Escape") {
    search.value = "";
    results.style.display = "none";
    search.blur();
  }
});

// ── Keys and zoom buttons ───────────────────────────────────────────────────

$("zoom").replaceChildren(
  button("+", () => view.zoomBy(1.5), "icon"),
  button("−", () => view.zoomBy(1 / 1.5), "icon"),
  button("Welt", () => view.fitAll(), "icon"),
);

document.addEventListener("keydown", (e) => {
  if (isModalOpen() || e.target instanceof HTMLInputElement) return;
  if (e.key === "Escape") {
    if (pick) endPick();
    else if (view.selection) closePanel();
    else {
      const r = view.viewRegion();
      const parent = r ? atlas.regions[r].parent : null;
      if (parent) view.fitRegion(parent);
      else view.fitAll();
    }
  } else if (e.key === "f" || e.key === "F") cycleThreads();
  else if (e.key === "i" || e.key === "I") openImport();
  else if (e.key === "t" || e.key === "T") openTime();
  else if (e.key === "h" || e.key === "H" || e.key === "?") openHelp();
  else if (e.key === "0") view.fitAll();
  else if (e.key === "+" || e.key === "=") view.zoomBy(1.5);
  else if (e.key === "-") view.zoomBy(1 / 1.5);
  else if (e.key === "/") {
    e.preventDefault();
    search.focus();
  }
});

view.setData(atlas, layout);
view.fitAll(false);
buildLegend();
updateToolbar();
updateCrumbs();

// Debug hook for the spike.
(window as unknown as { __atlas: unknown }).__atlas = { view, get atlas() { return atlas; }, get layout() { return layout; } };
