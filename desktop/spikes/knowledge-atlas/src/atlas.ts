/**
 * Knowledge atlas spike — data model and operations.
 *
 * Knowledge lives on separate **planets** that never mix: world knowledge
 * (a central, public knowledge server), company knowledge (stays inside the
 * company) and private knowledge (stays on the device). Each planet can be
 * read through several **lenses** — orders over the same learning units,
 * such as Weltwissen and Schule, or Organisation and Produkte. A lens is a
 * tree: its top level forms the islands, its leaves hold the learning units
 * (one hex each). Zooming in walks down a lens, like the C4 model.
 *
 * The map is fixed: the agent keeps the order; the learner explores and
 * reviews. Red threads link units; a thread to another planet only ever
 * points from company or private knowledge to world knowledge, and it is
 * stored on the dependent side, so world knowledge never learns about them.
 *
 * Shared by the browser and the agent CLI. Pure: no DOM, no Node APIs.
 */
import {
  applyRating,
  conceptsFromTile,
  isDue,
  newStoredCard,
  retrievability,
  statsFor,
  validateEmblemSvg,
} from "../../knowledge-world/src/model.ts";
import type {
  Concept,
  Emblem,
  Rating,
  Stats,
  StoredCard,
  TileCatalog,
  TileJson,
} from "../../knowledge-world/src/model.ts";
import type { SampleThread, SampleUnit, SampleWorldUnit } from "./sample-planets.ts";
import { CONTINENTS, PATTERNS, cleanTopic, placeForDomain } from "./taxonomy.ts";
import type { PatternKind } from "./taxonomy.ts";

export type { Concept, Emblem, Rating, Stats, StoredCard, TileCatalog, TileJson };

const DAY_MS = 24 * 60 * 60 * 1000;

// ── Types ────────────────────────────────────────────────────────────────────

export type PlanetKind = "welt" | "firma" | "privat";

/**
 * Thread kinds borrow UML's connectors: a prerequisite, a «use» dependency,
 * a provided/required interface, a generalisation, and a plain association.
 */
export type ThreadKind = "voraussetzung" | "nutzt" | "schnittstelle" | "ist-ein" | "verbindung";

export const THREAD_KINDS: Record<ThreadKind, { label: string; from: string; to: string }> = {
  voraussetzung: { label: "Voraussetzung", from: "Darauf baut auf", to: "Baut auf" },
  nutzt: { label: "nutzt", from: "Nutzt", to: "Wird genutzt von" },
  schnittstelle: { label: "Schnittstelle", from: "Bietet eine Schnittstelle für", to: "Nutzt die Schnittstelle von" },
  "ist-ein": { label: "ist ein", from: "Ist ein Sonderfall von", to: "Sonderfälle" },
  verbindung: { label: "Verbindung", from: "Verbindung", to: "Verbindung" },
};

export interface Region {
  id: string;
  /** 1 = island … levels.length = leaf. */
  level: number;
  name: string;
  parent: string | null;
  children: string[];
  rank: number;
  /** Hue of the region on the lens's colour level (inherited below it). */
  hue: number;
  /** Pattern of a region one level below the colour level. */
  pattern?: PatternKind;
  key: string;
  /** Which sample Sinnbild belongs here. */
  emblemKey: string;
  emblem?: Emblem;
  /** A leaf's learning units in order. */
  units?: string[];
}

export interface Lens {
  id: string;
  name: string;
  /** Level names, island first. */
  levels: string[];
  /** Level (1-based) whose regions carry a hue. */
  colorLevel: number;
  roots: string[];
  regions: Record<string, Region>;
  /** Island positions on the hex lattice, kept once laid out (islands drift, never jump). */
  islands: Record<string, { q: number; r: number }>;
  /** The learner's own area — the map opens there. */
  home?: string;
}

export interface Thread {
  id: string;
  /** voraussetzung: the foundation · nutzt: the user · schnittstelle: the provider · ist-ein: the special case. */
  a: string;
  b: string;
  kind: ThreadKind;
  note?: string;
  by: "kachel" | "agent" | "learner";
}

export interface Planet {
  id: string;
  kind: PlanetKind;
  name: string;
  /** Where this knowledge lives, in a learner's words. */
  server: string;
  lenses: Lens[];
  units: Record<string, Concept>;
  /** Prerequisites from tiles: unit → what it builds on (kept even before the foundation arrives). */
  requires: Record<string, Array<{ id: string; note?: string }>>;
  threads: Thread[];
}

/**
 * The learner started an import at a place on the map — notes, a handout,
 * a text — and the agent turns it into learning units right there. The
 * deeper the place, the less the agent has to guess.
 */
export interface ImportRequest {
  id: string;
  planet: string;
  lens: string;
  region: string;
  text: string;
  createdAt: string;
  /** Units the agent added for it. */
  units: string[];
  done: boolean;
}

export interface Atlas {
  schema: "zam-knowledge-atlas-spike/2";
  revision: number;
  createdAt: string;
  /** Simulated minutes since `createdAt` (the time machine moves it). */
  clockMinutes: number;
  planetOrder: string[];
  planets: Record<string, Planet>;
  /** This learner's own Sinnbilder, by unit or region id. */
  personalEmblems?: Record<string, Emblem>;
  requests: ImportRequest[];
  lastChange: { by: "studio" | "agent"; summary: string } | null;
}

export function fail(message: string): never {
  throw new Error(message);
}

// ── Clock ───────────────────────────────────────────────────────────────────

export function simNow(atlas: Atlas): Date {
  return new Date(Date.parse(atlas.createdAt) + atlas.clockMinutes * 60_000);
}

export function simDay(atlas: Atlas): number {
  return Math.floor(atlas.clockMinutes / (24 * 60));
}

// ── Lookup ──────────────────────────────────────────────────────────────────

export function planetOfUnit(atlas: Atlas, unitId: string): Planet | null {
  for (const id of atlas.planetOrder) if (atlas.planets[id].units[unitId]) return atlas.planets[id];
  return null;
}

export function findUnit(atlas: Atlas, unitId: string): Concept | null {
  return planetOfUnit(atlas, unitId)?.units[unitId] ?? null;
}

export function lensOf(planet: Planet, lensId: string): Lens {
  return planet.lenses.find((l) => l.id === lensId) ?? planet.lenses[0];
}

/** unit id → leaf region id, in one lens */
export function homeIndex(lens: Lens): Map<string, string> {
  const home = new Map<string, string>();
  for (const r of Object.values(lens.regions)) for (const u of r.units ?? []) home.set(u, r.id);
  return home;
}

export function regionPath(lens: Lens, regionId: string): Region[] {
  const path: Region[] = [];
  for (let r: Region | undefined = lens.regions[regionId]; r; r = r.parent ? lens.regions[r.parent] : undefined) path.unshift(r);
  return path;
}

export function pathText(lens: Lens, regionId: string): string {
  return regionPath(lens, regionId).map((r) => r.name).join(" › ");
}

export function unitIdsIn(lens: Lens, regionId: string): string[] {
  const region = lens.regions[regionId];
  if (!region) return [];
  if (region.units) return region.units;
  return region.children.flatMap((id) => unitIdsIn(lens, id));
}

export function unitsIn(planet: Planet, lens: Lens, regionId: string): Concept[] {
  return unitIdsIn(lens, regionId).map((id) => planet.units[id]).filter(Boolean);
}

export function cardsOf(units: Concept[]): StoredCard[] {
  return units.flatMap((c) => c.cards);
}

export function regionStats(atlas: Atlas, planet: Planet, lens: Lens, regionId: string): Stats {
  return statsFor(cardsOf(unitsIn(planet, lens, regionId)), simNow(atlas));
}

export function dueCards(atlas: Atlas, cards: StoredCard[]): StoredCard[] {
  const now = simNow(atlas);
  return cards.filter((c) => c.state === "new" || isDue(c, now));
}

export function itemName(atlas: Atlas, id: string): string {
  const unit = findUnit(atlas, id);
  if (unit) return unit.title;
  for (const p of Object.values(atlas.planets)) for (const l of p.lenses) if (l.regions[id]) return l.regions[id].name;
  return id;
}

/** Find units and regions on one planet by id, slug or (part of their) name. */
export function find(planet: Planet, lens: Lens, query: string): Array<{ kind: "unit"; unit: Concept } | { kind: "region"; region: Region }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = planet.units[query] ?? Object.values(planet.units).find((c) => c.slug === query);
  if (exact) return [{ kind: "unit", unit: exact }];
  if (lens.regions[query]) return [{ kind: "region", region: lens.regions[query] }];
  const regions = Object.values(lens.regions)
    .filter((r) => r.name.toLowerCase().includes(q) || r.key === q)
    .sort((a, b) => a.level - b.level || a.name.length - b.name.length)
    .map((region) => ({ kind: "region" as const, region }));
  const units = Object.values(planet.units)
    .filter((c) => c.title.toLowerCase().includes(q) || c.slug.includes(q))
    .map((unit) => ({ kind: "unit" as const, unit }));
  return [...regions, ...units];
}

// ── Building lenses ─────────────────────────────────────────────────────────

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function sortChildren(lens: Lens, list: string[]): void {
  list.sort((a, b) => lens.regions[a].rank - lens.regions[b].rank || lens.regions[a].name.localeCompare(lens.regions[b].name, "de"));
}

export interface PathStep {
  name: string;
  /** Defaults to the slug of the name. */
  key?: string;
  rank: number;
  hue?: number;
  emblemKey?: string;
}

/** Put a unit at a path in a lens, building whatever regions are missing. */
export function placeInLens(lens: Lens, steps: PathStep[], unitId: string): string {
  if (steps.length !== lens.levels.length) fail(`Pfad für ${lens.name} braucht ${lens.levels.length} Ebenen`);
  let parent: Region | null = null;
  steps.forEach((step, i) => {
    const level = i + 1;
    const segment = step.key ?? slugify(step.name);
    const key = parent ? `${parent.key}/${segment}` : segment;
    const id = `${lens.id}:${key}`;
    let region: Region | undefined = lens.regions[id];
    if (!region) {
      const pattern: PatternKind | undefined = level === lens.colorLevel + 1 && parent ? PATTERNS[parent.children.length % PATTERNS.length] : undefined;
      const created: Region = {
        id,
        level,
        name: step.name,
        parent: parent?.id ?? null,
        children: [],
        rank: step.rank,
        hue: step.hue ?? parent?.hue ?? 0,
        key,
        emblemKey: step.emblemKey ?? key,
        ...(pattern ? { pattern } : {}),
        ...(level === steps.length ? { units: [] } : {}),
      };
      region = created;
      lens.regions[id] = created;
      const list = parent ? parent.children : lens.roots;
      list.push(id);
      sortChildren(lens, list);
    } else if (step.rank < region.rank) {
      region.rank = step.rank;
      sortChildren(lens, parent ? parent.children : lens.roots);
    }
    parent = region;
  });
  const leaf = parent as unknown as Region;
  if (!leaf.units?.includes(unitId)) leaf.units?.push(unitId);
  return leaf.id;
}

function emptyLens(id: string, name: string, levels: string[], colorLevel: number): Lens {
  return { id, name, levels, colorLevel, roots: [], regions: {}, islands: {} };
}

/** Weltwissen: Bereich › Fach › Gebiet › Thema, from the unit's domain. */
function weltwissenSteps(unit: Concept): PathStep[] | null {
  const place = placeForDomain(unit.domain);
  if (!place) return null;
  const ci = CONTINENTS.indexOf(place.continent);
  const si = place.continent.subjects.indexOf(place.subject);
  const ai = place.subject.areas.indexOf(place.area);
  const topic = cleanTopic(unit.topic ?? unit.source, place.subject.name, place.area.name);
  return [
    { name: place.continent.name, key: place.continent.key, rank: ci },
    { name: place.subject.name, key: place.subject.key, rank: si, hue: place.subject.hue, emblemKey: place.subject.key },
    { name: place.area.name, key: place.area.key, rank: ai < 0 ? 100 : ai, emblemKey: `${place.subject.key}/${place.area.key}` },
    { name: topic, rank: unit.grade ?? 99 },
  ];
}

/** Schule: Klasse › Fach › Lernbereich, from the curriculum binding. `order` keeps Lernbereiche in arrival order. */
function schuleSteps(unit: Concept, order: number): PathStep[] | null {
  const place = placeForDomain(unit.domain);
  if (!place) return null;
  const ci = CONTINENTS.indexOf(place.continent);
  const si = place.continent.subjects.indexOf(place.subject);
  const grade = unit.grade;
  const island: PathStep = grade
    ? { name: `${grade}. Klasse`, key: `klasse-${grade}`, rank: grade, emblemKey: `klasse-${grade}` }
    : { name: "Außerhalb des Lehrplans", key: "ohne-klasse", rank: 99, emblemKey: "ohne-klasse" };
  const topic = cleanTopic(unit.topic ?? unit.source, place.subject.name, place.area.name);
  return [
    island,
    { name: place.subject.name, key: place.subject.key, rank: ci * 10 + si, hue: place.subject.hue, emblemKey: place.subject.key },
    { name: topic, rank: order },
  ];
}

const tileUnitCache = new Map<string, Concept[]>();

/** A tile's units without scheduling state — for asking where they would land. */
export function conceptsFromTileFor(key: string, tile: TileJson): Concept[] {
  let units = tileUnitCache.get(key);
  if (!units) {
    units = conceptsFromTile(key, tile, new Date(0));
    tileUnitCache.set(key, units);
  }
  return units;
}

/** Where a world unit would land in a lens, as a region key path (for "does this tile fit here?"). */
export function lensKeyFor(lensId: string, unit: Concept): string | null {
  const steps = lensId === "weltwissen" ? weltwissenSteps(unit) : lensId === "schule" ? schuleSteps(unit, 0) : null;
  if (!steps) return null;
  return steps.map((st) => st.key ?? slugify(st.name)).join("/");
}

/** Sort world units into both world lenses — the agent's job on import. */
export function addWorldUnits(atlas: Atlas, units: Concept[]): { added: number; skipped: string[]; leaves: Set<string> } {
  const planet = atlas.planets.welt;
  const welt = lensOf(planet, "weltwissen");
  const schule = lensOf(planet, "schule");
  const skipped: string[] = [];
  const leaves = new Set<string>();
  let added = 0;
  for (const unit of units) {
    if (planet.units[unit.id]) continue;
    const a = weltwissenSteps(unit);
    const b = schuleSteps(unit, Object.keys(schule.regions).length);
    if (!a || !b) {
      skipped.push(`${unit.slug} (${unit.domain})`);
      continue;
    }
    planet.units[unit.id] = unit;
    leaves.add(placeInLens(welt, a, unit.id));
    placeInLens(schule, b, unit.id);
    added += 1;
  }
  return { added, skipped, leaves };
}

type TileAtom = TileJson["atoms"][number] & { prerequisites?: Array<{ atom_id?: string; rationale?: string }> };

/** Remember what each atom builds on; a thread appears once both ends are present. */
export function recordPrerequisites(planet: Planet, tile: TileJson): void {
  for (const atom of tile.atoms as TileAtom[]) {
    const reqs = (atom.prerequisites ?? []).filter((r) => r.atom_id).map((r) => ({ id: r.atom_id as string, note: r.rationale }));
    if (reqs.length > 0) planet.requires[atom.id] = reqs;
  }
}

export function tileTitle(tile: TileJson): string {
  return tile.title.replace(/\s*\([^)]*\)\s*$/, "");
}

/** Import a tile into world knowledge (tiles are public curriculum content). */
export function importTile(atlas: Atlas, key: string, tile: TileJson): { summary: string; leaves: string[] } {
  const planet = atlas.planets.welt;
  const fresh = conceptsFromTile(key, tile, simNow(atlas)).filter((c) => !planet.units[c.id]);
  if (fresh.length === 0) return { summary: `„${tileTitle(tile)}“ ist schon vollständig im Weltwissen`, leaves: [] };
  recordPrerequisites(planet, tile);
  const { added, skipped, leaves } = addWorldUnits(atlas, fresh);
  const lens = lensOf(planet, "weltwissen");
  const where = [...new Set([...leaves].map((t) => pathText(lens, lens.regions[t].parent ?? t)))].join("; ");
  return {
    summary: `${added} neue Lerneinheiten aus „${tileTitle(tile)}“ einsortiert: ${where}${skipped.length ? ` (${skipped.length} ohne Ort)` : ""}`,
    leaves: [...leaves],
  };
}

// ── Importing at a place ────────────────────────────────────────────────────

/** Level names still missing below a region, down to a leaf. */
export function missingLevels(lens: Lens, regionId: string): string[] {
  const region = lens.regions[regionId] ?? fail("Ort nicht gefunden");
  return lens.levels.slice(region.level);
}

export function requestImport(atlas: Atlas, planetId: string, lensId: string, regionId: string, text: string): string {
  const planet = atlas.planets[planetId] ?? fail("Planet nicht gefunden");
  const lens = lensOf(planet, lensId);
  if (regionId && !lens.regions[regionId]) fail("Ort nicht gefunden");
  const clean = text.trim() || fail("Der Text ist leer.");
  atlas.requests.push({ id: `imp-${Date.now().toString(36)}`, planet: planetId, lens: lens.id, region: regionId, text: clean, createdAt: new Date().toISOString(), units: [], done: false });
  return `Import für ${regionId ? pathText(lens, regionId) : planet.name} liegt beim Agenten`;
}

export function completeRequest(atlas: Atlas, requestId: string): string {
  const request = atlas.requests.find((r) => r.id === requestId) ?? fail("Import-Auftrag nicht gefunden");
  request.done = true;
  return `Import abgeschlossen: ${request.units.length} Lerneinheiten`;
}

/** Steps that lead to an existing region, so `placeInLens` finds the same regions again. */
function stepsTo(lens: Lens, regionId: string): PathStep[] {
  return regionPath(lens, regionId).map((r) => ({ name: r.name, key: r.key.split("/").pop(), rank: r.rank, hue: r.hue, emblemKey: r.emblemKey }));
}

/**
 * The agent adds a learning unit at a place. Missing levels below the place
 * are named in `below` (e.g. Gebiet and Thema under a Fach). The unit also
 * gets a home in the planet's other lenses: derived from its domain in world
 * knowledge, otherwise on an island for what is not yet sorted.
 */
export function addUnitAt(
  atlas: Atlas,
  planetId: string,
  lensId: string,
  regionId: string,
  title: string,
  cards: Array<[string, string]>,
  opts: { below?: string[]; domain?: string; requestId?: string } = {},
): { id: string; summary: string } {
  const planet = atlas.planets[planetId] ?? fail("Planet nicht gefunden");
  const lens = lensOf(planet, lensId);
  const missing = missingLevels(lens, regionId);
  const below = opts.below ?? [];
  if (below.length !== missing.length) fail(`Unter „${lens.regions[regionId].name}“ fehlen noch: ${missing.join(" › ") || "nichts"} – bitte genau diese Namen angeben.`);
  if (cards.length === 0) fail("Mindestens eine Karte (Frage und Antwort).");
  const now = simNow(atlas);
  const id = `u-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const steps: PathStep[] = [...stepsTo(lens, regionId), ...below.map((name) => ({ name, rank: Object.keys(lens.regions).length, emblemKey: slugify(name) }))];
  // Derive what the place already says: subject and area in Weltwissen, grade and subject in Schule.
  const keys = steps.map((st) => st.key ?? slugify(st.name));
  const leafName = steps[steps.length - 1].name;
  let domain = opts.domain ?? planet.kind;
  let grade: number | null = null;
  if (planet.kind === "welt" && !opts.domain) {
    if (lens.id === "weltwissen") domain = `${keys[1]}/${keys[2]}`;
    if (lens.id === "schule") {
      domain = `${keys[1]}/allgemein`;
      const m = /^klasse-(\d+)$/.exec(keys[0]);
      grade = m ? Number(m[1]) : null;
    }
  }
  const unit: Concept = {
    id,
    slug: `${slugify(title)}-${id.slice(-4)}`,
    title: title.trim() || fail("Titel fehlt"),
    domain,
    subject: "",
    grade,
    topic: leafName,
    source: "Import an Ort",
    tileKey: "",
    cards: cards.map(([q, a], i) => newStoredCard(`${id}-k${i + 1}`, q, a, 2, now)),
  };
  planet.units[id] = unit;
  placeInLens(lens, steps, id);
  for (const other of planet.lenses) {
    if (other.id === lens.id) continue;
    const derived = planet.kind === "welt" ? (other.id === "weltwissen" ? weltwissenSteps(unit) : schuleSteps(unit, Object.keys(other.regions).length)) : null;
    if (derived) {
      placeInLens(other, derived, id);
      continue;
    }
    const names = steps.map((st) => st.name).slice(-(other.levels.length - 1));
    while (names.length < other.levels.length - 1) names.unshift("Neu");
    placeInLens(other, [{ name: "Noch nicht eingeordnet", key: "noch-nicht-eingeordnet", rank: 999 }, ...names.map((name, i) => ({ name, rank: i }))], id);
  }
  if (opts.requestId) {
    const request = atlas.requests.find((r) => r.id === opts.requestId);
    request?.units.push(id);
  }
  return { id, summary: `„${unit.title}“ eingefügt: ${pathText(lens, homeIndex(lens).get(id) ?? regionId)}` };
}

// ── Red threads ─────────────────────────────────────────────────────────────

/** The threads a planet holds: tile prerequisites among its units, plus its own threads (some pointing to world knowledge). */
export function threadsOf(atlas: Atlas, planet: Planet): Thread[] {
  const out: Thread[] = [];
  for (const [dependent, reqs] of Object.entries(planet.requires)) {
    if (!planet.units[dependent]) continue;
    for (const r of reqs) {
      if (planet.units[r.id] && r.id !== dependent) out.push({ id: `req:${r.id}:${dependent}`, a: r.id, b: dependent, kind: "voraussetzung", note: r.note, by: "kachel" });
    }
  }
  return out.concat(planet.threads.filter((t) => findUnit(atlas, t.a) && findUnit(atlas, t.b)));
}

/**
 * A thread may leave its planet only towards world knowledge: company and
 * private knowledge build on it, world knowledge never points back.
 */
export function addThread(atlas: Atlas, planetId: string, a: string, b: string, kind: ThreadKind, note: string | undefined, by: Thread["by"]): string {
  const planet = atlas.planets[planetId] ?? fail("Planet nicht gefunden");
  const ua = findUnit(atlas, a) ?? fail("Lerneinheit nicht gefunden");
  const ub = findUnit(atlas, b) ?? fail("Lerneinheit nicht gefunden");
  if (a === b) fail("Ein Faden braucht zwei verschiedene Lerneinheiten.");
  for (const end of [a, b]) {
    const home = planetOfUnit(atlas, end);
    if (home?.id === planet.id) continue;
    if (planet.kind === "welt") fail("Weltwissen verweist nicht auf Firmen- oder Privatwissen.");
    if (home?.kind !== "welt") fail("Firmenwissen und Privates werden nicht verbunden.");
  }
  if (!planet.units[a] && !planet.units[b]) fail("Mindestens ein Ende muss auf diesem Planeten liegen.");
  const twin = threadsOf(atlas, planet).find((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a));
  if (twin) fail(`Zwischen „${ua.title}“ und „${ub.title}“ hängt schon ein Faden.`);
  planet.threads.push({ id: `f-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, a, b, kind, note: note?.trim() || undefined, by });
  return `Roter Faden (${THREAD_KINDS[kind].label}): „${ua.title}“ – „${ub.title}“`;
}

export function removeThread(atlas: Atlas, planetId: string, threadId: string): string {
  const planet = atlas.planets[planetId] ?? fail("Planet nicht gefunden");
  const thread = planet.threads.find((t) => t.id === threadId) ?? fail("Nur gespannte Fäden lassen sich abnehmen.");
  planet.threads = planet.threads.filter((t) => t.id !== threadId);
  return `Faden abgenommen: „${itemName(atlas, thread.a)}“ – „${itemName(atlas, thread.b)}“`;
}

/** Sample threads name their ends by id or slug. */
function resolveRef(atlas: Atlas, ref: string): string | null {
  if (findUnit(atlas, ref)) return ref;
  for (const id of atlas.planetOrder) {
    const hit = Object.values(atlas.planets[id].units).find((u) => u.slug === ref);
    if (hit) return hit.id;
  }
  return null;
}

export function applyThreads(atlas: Atlas, planetId: string, threads: SampleThread[]): number {
  let added = 0;
  for (const t of threads) {
    const a = resolveRef(atlas, t.a);
    const b = resolveRef(atlas, t.b);
    if (!a || !b) continue;
    try {
      addThread(atlas, planetId, a, b, t.kind, t.note, "agent");
      added += 1;
    } catch {
      // Already linked, or an end is missing.
    }
  }
  return added;
}

// ── Reviews and time ────────────────────────────────────────────────────────

export function findCard(atlas: Atlas, cardId: string): { unit: Concept; card: StoredCard } | null {
  for (const id of atlas.planetOrder) {
    for (const unit of Object.values(atlas.planets[id].units)) {
      const card = unit.cards.find((c) => c.id === cardId);
      if (card) return { unit, card };
    }
  }
  return null;
}

export function rateCard(atlas: Atlas, cardId: string, rating: Rating): string {
  const hit = findCard(atlas, cardId) ?? fail("Karte nicht gefunden");
  applyRating(hit.card, rating, simNow(atlas));
  atlas.clockMinutes += 1;
  const names = { 1: "Nochmal", 2: "Schwer", 3: "Gut", 4: "Leicht" } as const;
  return `„${hit.unit.title}“ geübt (${names[rating]})`;
}

export function advanceClock(atlas: Atlas, days: number): string {
  atlas.clockMinutes += Math.round(days * 24 * 60);
  return `Zeitmaschine: ${days} Tag${days === 1 ? "" : "e"} weiter (jetzt Tag ${simDay(atlas)})`;
}

export function rename(lens: Lens, regionId: string, name: string): string {
  const region = lens.regions[regionId] ?? fail("Ort nicht gefunden");
  const old = region.name;
  region.name = name.trim() || fail("Name fehlt");
  return `„${old}“ heißt jetzt „${region.name}“`;
}

export function setHome(lens: Lens, regionId: string): string {
  const region = lens.regions[regionId] ?? fail("Ort nicht gefunden");
  lens.home = regionId;
  return `Heimat in „${lens.name}“: ${region.name}`;
}

// ── Sinnbilder ──────────────────────────────────────────────────────────────

function regionById(atlas: Atlas, id: string): Region | null {
  for (const p of Object.values(atlas.planets)) for (const l of p.lenses) if (l.regions[id]) return l.regions[id];
  return null;
}

export function effectiveEmblem(atlas: Atlas, id: string): { emblem: Emblem; personal: boolean } | null {
  const own = atlas.personalEmblems?.[id];
  if (own) return { emblem: own, personal: true };
  const shared = findUnit(atlas, id)?.emblem ?? regionById(atlas, id)?.emblem;
  return shared ? { emblem: shared, personal: false } : null;
}

/** A region's own Sinnbild, or — for a leaf without one — that of its first unit that has one. */
export function displayEmblem(atlas: Atlas, id: string): Emblem | null {
  const own = effectiveEmblem(atlas, id)?.emblem;
  if (own) return own;
  const region = regionById(atlas, id);
  for (const uid of region?.units ?? []) {
    const e = effectiveEmblem(atlas, uid)?.emblem;
    if (e) return e;
  }
  return null;
}

/** The first Sinnbild is shared; after that a new one is only this learner's (scope "auto"). */
export function setEmblem(atlas: Atlas, id: string, emblem: Emblem, scope: "auto" | "shared" | "personal" = "auto"): string {
  const owner: { emblem?: Emblem } = findUnit(atlas, id) ?? regionById(atlas, id) ?? fail("Lerneinheit oder Ort nicht gefunden");
  if (!emblem.svg && !emblem.glyph) fail("Ein Sinnbild braucht svg oder glyph.");
  if (emblem.svg) {
    const problem = validateEmblemSvg(emblem.svg);
    if (problem) fail(`SVG abgelehnt: ${problem}`);
  }
  if (emblem.glyph && [...emblem.glyph].length > 16) fail("Glyph höchstens 16 Zeichen.");
  const name = itemName(atlas, id);
  if (scope === "personal" || (scope === "auto" && owner.emblem !== undefined)) {
    atlas.personalEmblems = { ...atlas.personalEmblems, [id]: emblem };
    return `Eigenes Sinnbild für „${name}“ (nur für dich)`;
  }
  owner.emblem = emblem;
  return `Sinnbild für „${name}“ gezeichnet (gilt für alle)`;
}

export function clearPersonalEmblem(atlas: Atlas, id: string): string {
  if (atlas.personalEmblems) delete atlas.personalEmblems[id];
  return `„${itemName(atlas, id)}“ zeigt wieder das gemeinsame Sinnbild`;
}

/** Sample Sinnbilder: regions by emblem key, units by slug. */
export function applyEmblems(atlas: Atlas, regions: Record<string, Partial<Emblem>>, units: Record<string, Partial<Emblem>>): { applied: number; rejected: string[] } {
  let applied = 0;
  const rejected: string[] = [];
  const apply = (owner: { emblem?: Emblem }, label: string, e: Partial<Emblem> | undefined) => {
    if (!e || owner.emblem) return;
    if (e.svg) {
      const problem = validateEmblemSvg(e.svg);
      if (problem) {
        rejected.push(`${label}: ${problem}`);
        return;
      }
    }
    owner.emblem = { svg: e.svg, glyph: e.glyph, by: e.by ?? "agent" };
    applied += 1;
  };
  for (const planet of Object.values(atlas.planets)) {
    for (const lens of planet.lenses) for (const r of Object.values(lens.regions)) apply(r, r.emblemKey, regions[r.emblemKey]);
    for (const u of Object.values(planet.units)) apply(u, u.slug, units[u.slug]);
  }
  return { applied, rejected };
}

export function missingEmblems(atlas: Atlas): Array<{ id: string; label: string; context: string }> {
  const out: Array<{ id: string; label: string; context: string }> = [];
  for (const pid of atlas.planetOrder) {
    const planet = atlas.planets[pid];
    for (const lens of planet.lenses) {
      for (const r of Object.values(lens.regions).sort((a, b) => a.level - b.level)) {
        if (displayEmblem(atlas, r.id)) continue;
        const children = r.units ? r.units.map((u) => planet.units[u]?.title) : r.children.map((c) => lens.regions[c].name);
        out.push({ id: r.id, label: `${planet.name} · ${lens.name} · ${lens.levels[r.level - 1]} ${pathText(lens, r.id)}`, context: `enthält: ${children.slice(0, 8).join("; ")}` });
      }
    }
    for (const u of Object.values(planet.units)) {
      if (effectiveEmblem(atlas, u.id)) continue;
      out.push({ id: u.slug, label: `${planet.name} · Lerneinheit ${u.title}`, context: u.cards.map((k) => `F: ${k.question} A: ${k.answer}`).join(" | ").slice(0, 400) });
    }
  }
  return out;
}

// ── Start atlas ─────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * How a sample learner treated each area: days since they stopped, how
 * well it went, how much they never touched, how much they only crammed.
 */
const PROFILES: Record<string, { stopAgo: number; skill: number; untouched: number; cram: number }> = {
  mathematik: { stopAgo: 0, skill: 0.85, untouched: 0.08, cram: 0 },
  englisch: { stopAgo: 1, skill: 0.8, untouched: 0.1, cram: 0 },
  physik: { stopAgo: 6, skill: 0.62, untouched: 0.15, cram: 0.1 },
  "wirtschaft-recht": { stopAgo: 3, skill: 0.72, untouched: 0.45, cram: 0 },
  deutsch: { stopAgo: 25, skill: 0.72, untouched: 0.15, cram: 0.1 },
  biologie: { stopAgo: 50, skill: 0.66, untouched: 0.12, cram: 0.15 },
  informatik: { stopAgo: 80, skill: 0.58, untouched: 0.2, cram: 0.3 },
  geographie: { stopAgo: 160, skill: 0.5, untouched: 0.1, cram: 0.5 },
  geschichte: { stopAgo: 300, skill: 0.45, untouched: 0.1, cram: 0.75 },
  franzoesisch: { stopAgo: 400, skill: 0.4, untouched: 0.15, cram: 0.85 },
  firma: { stopAgo: 2, skill: 0.75, untouched: 0.2, cram: 0.1 },
  privat: { stopAgo: 40, skill: 0.7, untouched: 0.2, cram: 0.3 },
};

export function simulateHistory(atlas: Atlas, seed = 7): void {
  const rng = mulberry32(seed);
  const now = simNow(atlas).getTime();
  for (const pid of atlas.planetOrder) {
    const planet = atlas.planets[pid];
    for (const unit of Object.values(planet.units)) {
      const key = planet.kind === "welt" ? (placeForDomain(unit.domain)?.subject.key ?? "") : planet.kind;
      const profile = PROFILES[key];
      if (!profile) continue;
      const grade = unit.grade ?? 9;
      const skill = Math.min(0.97, profile.skill + (rng() - 0.5) * 0.25);
      const stopAt = now - (profile.stopAgo + (rng() < 0.2 ? 15 + rng() * 60 : 0)) * DAY_MS;
      const span = rng() < profile.cram ? 5 + rng() * 15 : 40 + Math.max(0, 9 - grade) * 50 + rng() * 40;
      const startAt = stopAt - span * DAY_MS;
      for (const card of unit.cards) {
        if (rng() < profile.untouched) continue;
        let t = startAt;
        for (let i = 0; i < 40 && t < stopAt; i += 1) {
          const r = retrievability(card, new Date(t));
          const pRecall = r === null ? skill : Math.min(0.98, r * (0.8 + skill * 0.25));
          const rating: Rating = rng() < pRecall ? (rng() < 0.15 ? 4 : 3) : 1;
          applyRating(card, rating, new Date(t));
          t += (Date.parse(card.dueAt) - t) * (1 + rng() * 0.5);
        }
      }
    }
  }
}

function sampleUnit(def: SampleUnit | SampleWorldUnit, domain: string, now: Date): Concept {
  return {
    id: def.id,
    slug: def.id,
    title: def.title,
    domain,
    subject: "",
    grade: null,
    topic: "topic" in def ? def.topic : undefined,
    source: "Beispiel",
    tileKey: "",
    cards: def.cards.map(([q, a], i) => newStoredCard(`${def.id}-k${i + 1}`, q, a, 2, now)),
  };
}

/** Place sample units into a planet's lenses; ranks follow first appearance, hues come from the table. */
function addSampleUnits(planet: Planet, units: SampleUnit[], hues: Record<string, Record<string, number>>, now: Date): void {
  const ranks = new Map<string, number>();
  const rankOf = (key: string) => {
    if (!ranks.has(key)) ranks.set(key, ranks.size);
    return ranks.get(key) as number;
  };
  for (const def of units) {
    const unit = sampleUnit(def, planet.kind, now);
    planet.units[unit.id] = unit;
    for (const lens of planet.lenses) {
      const names = def.paths[lens.id];
      if (!names) continue;
      const steps = names.map((name, i) => ({
        name,
        rank: rankOf(`${lens.id}/${names.slice(0, i + 1).join("/")}`),
        hue: i + 1 === lens.colorLevel ? hues[lens.id]?.[name] : undefined,
        emblemKey: slugify(name),
      }));
      placeInLens(lens, steps, unit.id);
    }
  }
}

function homeFor(lens: Lens, names: string[] | undefined): void {
  if (!names) return;
  let parent: Region | null = null;
  for (const name of names) {
    const list: string[] = parent ? parent.children : lens.roots;
    const next = list.map((id) => lens.regions[id]).find((r) => r.name === name);
    if (!next) return;
    parent = next;
  }
  if (parent) lens.home = parent.id;
}

export function emptyAtlas(): Atlas {
  return {
    schema: "zam-knowledge-atlas-spike/2",
    revision: 0,
    createdAt: new Date().toISOString(),
    clockMinutes: 0,
    planetOrder: ["welt", "firma", "privat"],
    planets: {
      welt: {
        id: "welt",
        kind: "welt",
        name: "Weltwissen",
        server: "Zentraler Wissensserver – öffentlich, für alle",
        lenses: [
          emptyLens("weltwissen", "Weltwissen", ["Bereich", "Fach", "Gebiet", "Thema"], 2),
          emptyLens("schule", "Schule", ["Klasse", "Fach", "Lernbereich"], 2),
        ],
        units: {},
        requires: {},
        threads: [],
      },
      firma: {
        id: "firma",
        kind: "firma",
        name: "Nordwind Software (fiktiv)",
        server: "Lernserver des Unternehmens – verlässt die Firma nie",
        lenses: [
          emptyLens("organisation", "Organisation", ["Bereich", "Team", "Aufgabe"], 2),
          emptyLens("produkte", "Produkte", ["Produktlinie", "Produkt", "Komponente"], 2),
        ],
        units: {},
        requires: {},
        threads: [],
      },
      privat: {
        id: "privat",
        kind: "privat",
        name: "Privat",
        server: "Nur auf deinem Gerät",
        lenses: [emptyLens("leben", "Leben", ["Bereich", "Thema"], 1)],
        units: {},
        requires: {},
        threads: [],
      },
    },
    requests: [],
    lastChange: null,
  };
}

/** Realschule tiles of grades 5–9: what a ninth-grader may have met so far. */
export function startTileKeys(catalog: TileCatalog): string[] {
  return Object.keys(catalog)
    .filter((k) => /^realschule-[5-9]-/.test(k))
    .sort();
}

export interface StartSamples {
  worldSoftware: SampleWorldUnit[];
  worldThreads: Array<SampleThread>;
  firma: { units: SampleUnit[]; threads: SampleThread[]; hues: Record<string, Record<string, number>>; home: Record<string, string[]> };
  privat: { units: SampleUnit[]; threads: SampleThread[]; hues: Record<string, number>; home: Record<string, string[]> };
}

export function createStartAtlas(
  catalog: TileCatalog,
  samples: StartSamples,
  opts: { history: boolean; regionEmblems?: Record<string, Partial<Emblem>>; unitEmblems?: Record<string, Partial<Emblem>> },
): Atlas {
  const atlas = emptyAtlas();
  const now = simNow(atlas);
  const welt = atlas.planets.welt;
  for (const key of startTileKeys(catalog)) {
    addWorldUnits(atlas, conceptsFromTile(key, catalog[key], now));
    recordPrerequisites(welt, catalog[key]);
  }
  addWorldUnits(atlas, samples.worldSoftware.map((u) => sampleUnit(u, "informatik/softwaretechnik", now)));
  applyThreads(atlas, "welt", samples.worldThreads);
  homeFor(lensOf(welt, "schule"), ["9. Klasse"]);

  const firma = atlas.planets.firma;
  addSampleUnits(firma, samples.firma.units, samples.firma.hues, now);
  applyThreads(atlas, "firma", samples.firma.threads);
  for (const lens of firma.lenses) homeFor(lens, samples.firma.home[lens.id]);

  const privat = atlas.planets.privat;
  addSampleUnits(privat, samples.privat.units, { leben: samples.privat.hues }, now);
  applyThreads(atlas, "privat", samples.privat.threads);
  for (const lens of privat.lenses) homeFor(lens, samples.privat.home[lens.id]);

  if (opts.history) simulateHistory(atlas);
  if (opts.regionEmblems || opts.unitEmblems) applyEmblems(atlas, opts.regionEmblems ?? {}, opts.unitEmblems ?? {});
  return atlas;
}
