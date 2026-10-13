/**
 * Knowledge atlas spike — data model and operations.
 *
 * A 2D map of world knowledge, ordered logically rather than by school
 * grade: continents (Bereiche) hold countries (Fächer), which hold
 * provinces (Gebiete), which hold districts (Themen); each Begriff is one
 * hex of land. Zooming in walks down these levels, like the C4 model.
 *
 * Shared by the browser and the agent CLI. Pure: no DOM, no Node APIs.
 * Cards, FSRS state and Sinnbild validation come from the 3D spike's model,
 * which wraps the kernel's real FSRS-6.
 *
 * One rule shapes every change: what you move, you first review. Moving a
 * Begriff or a Thema refuses while any of its cards is stale, so tidying
 * the map is always also practice.
 */
import {
  applyRating,
  conceptsFromTile,
  isDue,
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
import { CONTINENTS, PATTERNS, cleanTopic, placeForDomain } from "./taxonomy.ts";
import type { PatternKind } from "./taxonomy.ts";

export type { Concept, Emblem, Rating, Stats, StoredCard, TileCatalog, TileJson };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Cards reviewed within this many (simulated) hours count as fresh enough to move. */
export const FRESH_HOURS = 12;

// ── Types ────────────────────────────────────────────────────────────────────

/** 1 Bereich (continent), 2 Fach (country), 3 Gebiet (province), 4 Thema (district). */
export type Level = 1 | 2 | 3 | 4;

export const LEVEL_NAME: Record<Level, string> = { 1: "Bereich", 2: "Fach", 3: "Gebiet", 4: "Thema" };

export interface Region {
  id: string;
  level: Level;
  name: string;
  parent: string | null;
  /** Child regions in order — foundations first. */
  children: string[];
  /** Sort key among siblings (taxonomy position, or lowest grade for a Thema). */
  rank: number;
  /** Hue of the Fach the region belongs to (a Bereich has none). */
  hue: number;
  /** A Gebiet's map pattern, so neighbours differ even in the same colour family. */
  pattern?: PatternKind;
  /** Taxonomy key, e.g. "physik/optik" — sample Sinnbilder are keyed by it. */
  key: string;
  emblem?: Emblem;
  /** A Thema's Begriffe in order. */
  concepts?: string[];
}

export interface Proposal {
  id: string;
  /** A Begriff or Thema id. */
  item: string;
  /** A Thema (for a Begriff) or Gebiet (for a Thema). */
  target: string;
  by: "agent" | "studio";
  note?: string;
}

/**
 * A red thread on the pin board: a link across the map's order. Prerequisites
 * come from the tiles; connections across Fächer are the agent's (or the
 * learner's) — the part a tree of categories cannot show.
 */
export interface Thread {
  id: string;
  /** For a prerequisite: the foundation. */
  a: string;
  /** For a prerequisite: what builds on it. */
  b: string;
  kind: "voraussetzung" | "verbindung";
  note?: string;
  by: "kachel" | "agent" | "learner";
}

export interface Atlas {
  schema: "zam-knowledge-atlas-spike/1";
  revision: number;
  createdAt: string;
  /** Simulated minutes since `createdAt` (the time machine moves it). */
  clockMinutes: number;
  /** Bereiche in order. */
  roots: string[];
  regions: Record<string, Region>;
  concepts: Record<string, Concept>;
  /** This learner's own Sinnbilder, by region or concept id. */
  personalEmblems?: Record<string, Emblem>;
  proposals: Proposal[];
  /** Prerequisites from the tiles: concept id → what it builds on (kept even before the foundation is imported). */
  requires: Record<string, Array<{ id: string; note?: string }>>;
  /** Connections spun by the agent or the learner. */
  threads: Thread[];
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

/** concept id → Thema id */
export function homeIndex(atlas: Atlas): Map<string, string> {
  const home = new Map<string, string>();
  for (const r of Object.values(atlas.regions)) for (const c of r.concepts ?? []) home.set(c, r.id);
  return home;
}

export function regionPath(atlas: Atlas, regionId: string): Region[] {
  const path: Region[] = [];
  for (let r: Region | undefined = atlas.regions[regionId]; r; r = r.parent ? atlas.regions[r.parent] : undefined) path.unshift(r);
  return path;
}

export function pathText(atlas: Atlas, regionId: string): string {
  return regionPath(atlas, regionId).map((r) => r.name).join(" › ");
}

export function conceptsIn(atlas: Atlas, regionId: string): Concept[] {
  const region = atlas.regions[regionId];
  if (!region) return [];
  if (region.level === 4) return (region.concepts ?? []).map((id) => atlas.concepts[id]).filter(Boolean);
  return region.children.flatMap((id) => conceptsIn(atlas, id));
}

export function cardsOf(concepts: Concept[]): StoredCard[] {
  return concepts.flatMap((c) => c.cards);
}

export function regionStats(atlas: Atlas, regionId: string): Stats {
  return statsFor(cardsOf(conceptsIn(atlas, regionId)), simNow(atlas));
}

export function dueCards(atlas: Atlas, cards: StoredCard[]): StoredCard[] {
  const now = simNow(atlas);
  return cards.filter((c) => c.state === "new" || isDue(c, now));
}

/** Cards that must be reviewed before their Begriff may move. */
export function staleCards(atlas: Atlas, concepts: Concept[]): StoredCard[] {
  const fresh = simNow(atlas).getTime() - FRESH_HOURS * 60 * 60 * 1000;
  return cardsOf(concepts).filter((c) => c.lastReviewAt === null || Date.parse(c.lastReviewAt) < fresh);
}

/** Find a Begriff or region by id, slug or (part of its) name. */
export function find(atlas: Atlas, query: string): Array<{ kind: "concept"; concept: Concept } | { kind: "region"; region: Region }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const exact = atlas.concepts[query] ?? Object.values(atlas.concepts).find((c) => c.slug === query);
  if (exact) return [{ kind: "concept", concept: exact }];
  if (atlas.regions[query]) return [{ kind: "region", region: atlas.regions[query] }];
  const regions = Object.values(atlas.regions)
    .filter((r) => r.name.toLowerCase().includes(q) || r.key === q)
    .sort((a, b) => a.level - b.level || a.name.length - b.name.length)
    .map((region) => ({ kind: "region" as const, region }));
  const concepts = Object.values(atlas.concepts)
    .filter((c) => c.title.toLowerCase().includes(q) || c.slug.includes(q))
    .map((concept) => ({ kind: "concept" as const, concept }));
  return [...regions, ...concepts];
}

// ── Building the map ────────────────────────────────────────────────────────

function slugify(name: string): string {
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

const PREFIX: Record<Level, string> = { 1: "b", 2: "f", 3: "g", 4: "t" };

function insertChild(atlas: Atlas, parent: Region | null, region: Region): void {
  const list = parent ? parent.children : atlas.roots;
  const at = list.findIndex((id) => {
    const other = atlas.regions[id];
    return other.rank > region.rank || (other.rank === region.rank && other.name.localeCompare(region.name, "de") > 0);
  });
  if (at < 0) list.push(region.id);
  else list.splice(at, 0, region.id);
}

function ensureRegion(atlas: Atlas, level: Level, parentId: string | null, key: string, name: string, rank: number, hue: number): Region {
  const id = `${PREFIX[level]}:${key}`;
  const existing = atlas.regions[id];
  if (existing) {
    if (level === 4) existing.rank = Math.min(existing.rank, rank);
    return existing;
  }
  const parent = parentId ? atlas.regions[parentId] : null;
  const region: Region = { id, level, name, parent: parentId, children: [], rank, hue, key };
  if (level === 3 && parent) region.pattern = PATTERNS[parent.children.length % PATTERNS.length];
  if (level === 4) region.concepts = [];
  atlas.regions[id] = region;
  insertChild(atlas, parent, region);
  return region;
}

/**
 * Sort Begriffe into their logical place, building whatever is missing.
 * This is what the agent does on import — the learner never has to.
 */
export function addConcepts(atlas: Atlas, concepts: Concept[]): { added: number; skipped: string[]; topics: Set<string> } {
  const skipped: string[] = [];
  const topics = new Set<string>();
  let added = 0;
  for (const concept of concepts) {
    if (atlas.concepts[concept.id]) continue;
    const place = placeForDomain(concept.domain);
    if (!place) {
      skipped.push(`${concept.slug} (${concept.domain})`);
      continue;
    }
    const ci = CONTINENTS.indexOf(place.continent);
    const si = place.continent.subjects.indexOf(place.subject);
    const ai = place.subject.areas.indexOf(place.area);
    const hue = place.subject.hue;
    const continent = ensureRegion(atlas, 1, null, place.continent.key, place.continent.name, ci, 0);
    const subject = ensureRegion(atlas, 2, continent.id, place.subject.key, place.subject.name, si, hue);
    const area = ensureRegion(atlas, 3, subject.id, `${place.subject.key}/${place.area.key}`, place.area.name, ai < 0 ? 100 : ai, hue);
    const topicName = cleanTopic(concept.topic ?? concept.source, place.subject.name, place.area.name);
    const topic = ensureRegion(atlas, 4, area.id, `${area.key}/${slugify(topicName)}`, topicName, concept.grade ?? 99, hue);
    atlas.concepts[concept.id] = concept;
    topic.concepts?.push(concept.id);
    topics.add(topic.id);
    added += 1;
  }
  // A Thema's rank changed only if it gained a lower grade; resort its siblings.
  for (const id of topics) {
    const parent = atlas.regions[atlas.regions[id].parent ?? ""];
    if (parent) parent.children.sort((a, b) => atlas.regions[a].rank - atlas.regions[b].rank || atlas.regions[a].name.localeCompare(atlas.regions[b].name, "de"));
  }
  return { added, skipped, topics };
}

type TileAtom = TileJson["atoms"][number] & { prerequisites?: Array<{ atom_id?: string; rationale?: string }> };

/** Remember what each atom builds on; a thread appears once both ends are in the atlas. */
export function recordPrerequisites(atlas: Atlas, tile: TileJson): void {
  for (const atom of tile.atoms as TileAtom[]) {
    const reqs = (atom.prerequisites ?? []).filter((r) => r.atom_id).map((r) => ({ id: r.atom_id as string, note: r.rationale }));
    if (reqs.length > 0) atlas.requires[atom.id] = reqs;
  }
}

export function tileTitle(tile: TileJson): string {
  return tile.title.replace(/\s*\([^)]*\)\s*$/, "");
}

export function importTile(atlas: Atlas, key: string, tile: TileJson): { summary: string; topics: string[] } {
  const fresh = conceptsFromTile(key, tile, simNow(atlas)).filter((c) => !atlas.concepts[c.id]);
  if (fresh.length === 0) return { summary: `„${tileTitle(tile)}“ ist schon vollständig im Atlas`, topics: [] };
  recordPrerequisites(atlas, tile);
  const { added, skipped, topics } = addConcepts(atlas, fresh);
  const where = [...new Set([...topics].map((t) => pathText(atlas, atlas.regions[t].parent ?? t)))].join("; ");
  return {
    summary: `${added} neue Begriffe aus „${tileTitle(tile)}“ einsortiert: ${where}${skipped.length ? ` (${skipped.length} ohne Ort)` : ""}`,
    topics: [...topics],
  };
}

// ── Changing the order (always after review) ────────────────────────────────

function removeEmpty(atlas: Atlas, regionId: string | null): void {
  let id = regionId;
  while (id) {
    const region = atlas.regions[id];
    if (!region) return;
    const empty = region.level === 4 ? (region.concepts ?? []).length === 0 : region.children.length === 0;
    if (!empty) return;
    const list = region.parent ? atlas.regions[region.parent].children : atlas.roots;
    list.splice(list.indexOf(id), 1);
    delete atlas.regions[id];
    atlas.proposals = atlas.proposals.filter((p) => p.item !== id && p.target !== id);
    id = region.parent;
  }
}

function requireFresh(atlas: Atlas, concepts: Concept[], what: string): void {
  const stale = staleCards(atlas, concepts);
  if (stale.length > 0) fail(`Erst wiederholen: ${stale.length} Karte${stale.length === 1 ? "" : "n"} von „${what}“, dann darf es umziehen.`);
}

export function moveConcept(atlas: Atlas, conceptId: string, topicId: string): string {
  const concept = atlas.concepts[conceptId] ?? fail("Begriff nicht gefunden");
  const target = atlas.regions[topicId] ?? fail("Ziel nicht gefunden");
  if (target.level !== 4) fail("Ein Begriff zieht in ein Thema.");
  const from = homeIndex(atlas).get(conceptId);
  if (from === topicId) return `„${concept.title}“ liegt schon dort`;
  requireFresh(atlas, [concept], concept.title);
  if (from) {
    const list = atlas.regions[from].concepts ?? [];
    list.splice(list.indexOf(conceptId), 1);
  }
  target.concepts?.push(conceptId);
  atlas.proposals = atlas.proposals.filter((p) => p.item !== conceptId);
  removeEmpty(atlas, from ?? null);
  return `„${concept.title}“ ist umgezogen nach ${pathText(atlas, topicId)}`;
}

export function moveTopic(atlas: Atlas, topicId: string, areaId: string): string {
  const topic = atlas.regions[topicId] ?? fail("Thema nicht gefunden");
  const target = atlas.regions[areaId] ?? fail("Ziel nicht gefunden");
  if (topic.level !== 4 || target.level !== 3) fail("Ein Thema zieht in ein Gebiet.");
  if (topic.parent === areaId) return `„${topic.name}“ liegt schon dort`;
  requireFresh(atlas, conceptsIn(atlas, topicId), topic.name);
  const from = topic.parent;
  if (from) atlas.regions[from].children.splice(atlas.regions[from].children.indexOf(topicId), 1);
  // A Thema of the same name already there: merge instead of keeping two.
  const twin = target.children.map((id) => atlas.regions[id]).find((r) => r.name.toLowerCase() === topic.name.toLowerCase());
  if (twin) {
    twin.concepts?.push(...(topic.concepts ?? []));
    twin.rank = Math.min(twin.rank, topic.rank);
    delete atlas.regions[topicId];
    atlas.proposals = atlas.proposals.filter((p) => p.item !== topicId && p.target !== topicId);
    removeEmpty(atlas, from);
    return `Thema „${topic.name}“ ist umgezogen nach ${pathText(atlas, areaId)} und mit dem gleichnamigen zusammengelegt`;
  }
  topic.parent = areaId;
  topic.hue = target.hue;
  insertChild(atlas, target, topic);
  atlas.proposals = atlas.proposals.filter((p) => p.item !== topicId);
  removeEmpty(atlas, from);
  return `Thema „${topic.name}“ ist umgezogen nach ${pathText(atlas, areaId)}`;
}

export function moveItem(atlas: Atlas, itemId: string, targetId: string): string {
  return atlas.concepts[itemId] ? moveConcept(atlas, itemId, targetId) : moveTopic(atlas, itemId, targetId);
}

/** A new, empty Thema or Gebiet as a move target. It gets land once something moves in. */
export function createRegion(atlas: Atlas, parentId: string, name: string): { id: string; summary: string } {
  const parent = atlas.regions[parentId] ?? fail("Ort nicht gefunden");
  if (parent.level !== 2 && parent.level !== 3) fail("Neue Orte entstehen in einem Fach (Gebiet) oder Gebiet (Thema).");
  const clean = name.trim() || fail("Name fehlt");
  const level = (parent.level + 1) as Level;
  const twin = parent.children.map((id) => atlas.regions[id]).find((r) => r.name.toLowerCase() === clean.toLowerCase());
  if (twin) return { id: twin.id, summary: `„${clean}“ gibt es schon` };
  let key = `${parent.key}/${slugify(clean)}`;
  for (let n = 2; atlas.regions[`${PREFIX[level]}:${key}`]; n += 1) key = `${parent.key}/${slugify(clean)}-${n}`;
  const rank = Math.max(0, ...parent.children.map((id) => atlas.regions[id].rank)) + 1;
  const region = ensureRegion(atlas, level, parentId, key, clean, rank, parent.hue);
  return { id: region.id, summary: `${LEVEL_NAME[level]} „${clean}“ angelegt in ${pathText(atlas, parentId)}` };
}

export function rename(atlas: Atlas, regionId: string, name: string): string {
  const region = atlas.regions[regionId] ?? fail("Ort nicht gefunden");
  const old = region.name;
  region.name = name.trim() || fail("Name fehlt");
  return `„${old}“ heißt jetzt „${region.name}“`;
}

// ── Proposals (the agent suggests, the learner moves after review) ─────────

export function propose(atlas: Atlas, itemId: string, targetId: string, by: Proposal["by"], note?: string): string {
  const isConcept = Boolean(atlas.concepts[itemId]);
  const item = isConcept ? atlas.concepts[itemId].title : (atlas.regions[itemId]?.name ?? fail("Begriff oder Thema nicht gefunden"));
  const target = atlas.regions[targetId] ?? fail("Ziel nicht gefunden");
  if (isConcept && target.level !== 4) fail("Ein Begriff zieht in ein Thema.");
  if (!isConcept && (atlas.regions[itemId].level !== 4 || target.level !== 3)) fail("Ein Thema zieht in ein Gebiet.");
  atlas.proposals = atlas.proposals.filter((p) => p.item !== itemId);
  atlas.proposals.push({ id: `v-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, item: itemId, target: targetId, by, note });
  return `Vorschlag: „${item}“ → ${pathText(atlas, targetId)}`;
}

export function dismissProposal(atlas: Atlas, proposalId: string): string {
  atlas.proposals = atlas.proposals.filter((p) => p.id !== proposalId);
  return "Vorschlag verworfen";
}

export function itemName(atlas: Atlas, itemId: string): string {
  return atlas.concepts[itemId]?.title ?? atlas.regions[itemId]?.name ?? itemId;
}

// ── Red threads ─────────────────────────────────────────────────────────────

export function allThreads(atlas: Atlas): Thread[] {
  const out: Thread[] = [];
  for (const [dependent, reqs] of Object.entries(atlas.requires)) {
    if (!atlas.concepts[dependent]) continue;
    for (const r of reqs) {
      if (atlas.concepts[r.id] && r.id !== dependent) out.push({ id: `req:${r.id}:${dependent}`, a: r.id, b: dependent, kind: "voraussetzung", note: r.note, by: "kachel" });
    }
  }
  return out.concat(atlas.threads);
}

export function threadsOf(atlas: Atlas, conceptId: string): Thread[] {
  return allThreads(atlas).filter((t) => t.a === conceptId || t.b === conceptId);
}

export function addThread(atlas: Atlas, a: string, b: string, note: string | undefined, by: Thread["by"]): string {
  const ca = atlas.concepts[a] ?? fail("Begriff nicht gefunden");
  const cb = atlas.concepts[b] ?? fail("Begriff nicht gefunden");
  if (a === b) fail("Ein Faden braucht zwei verschiedene Begriffe.");
  const twin = allThreads(atlas).find((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a));
  if (twin) fail(`Zwischen „${ca.title}“ und „${cb.title}“ hängt schon ein Faden.`);
  atlas.threads.push({ id: `f-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, a, b, kind: "verbindung", note: note?.trim() || undefined, by });
  return `Roter Faden: „${ca.title}“ ↔ „${cb.title}“`;
}

export function removeThread(atlas: Atlas, threadId: string): string {
  const thread = atlas.threads.find((t) => t.id === threadId) ?? fail("Nur gespannte Fäden lassen sich abnehmen.");
  atlas.threads = atlas.threads.filter((t) => t.id !== threadId);
  return `Faden abgenommen: „${itemName(atlas, thread.a)}“ ↔ „${itemName(atlas, thread.b)}“`;
}

/** Sample connections by slug; pairs whose ends are missing are skipped. */
export function applyThreads(atlas: Atlas, threads: Array<{ a: string; b: string; note: string }>): number {
  const bySlug = new Map(Object.values(atlas.concepts).map((c) => [c.slug, c.id]));
  let added = 0;
  for (const t of threads) {
    const a = bySlug.get(t.a);
    const b = bySlug.get(t.b);
    if (!a || !b) continue;
    try {
      addThread(atlas, a, b, t.note, "agent");
      added += 1;
    } catch {
      // Already linked.
    }
  }
  return added;
}

// ── Reviews and time ────────────────────────────────────────────────────────

export function findCard(atlas: Atlas, cardId: string): { concept: Concept; card: StoredCard } | null {
  for (const concept of Object.values(atlas.concepts)) {
    const card = concept.cards.find((c) => c.id === cardId);
    if (card) return { concept, card };
  }
  return null;
}

export function rateCard(atlas: Atlas, cardId: string, rating: Rating): string {
  const hit = findCard(atlas, cardId) ?? fail("Karte nicht gefunden");
  applyRating(hit.card, rating, simNow(atlas));
  atlas.clockMinutes += 1;
  const names = { 1: "Nochmal", 2: "Schwer", 3: "Gut", 4: "Leicht" } as const;
  return `„${hit.concept.title}“ geübt (${names[rating]})`;
}

export function advanceClock(atlas: Atlas, days: number): string {
  atlas.clockMinutes += Math.round(days * 24 * 60);
  return `Zeitmaschine: ${days} Tag${days === 1 ? "" : "e"} weiter (jetzt Tag ${simDay(atlas)})`;
}

// ── Sinnbilder for every level ──────────────────────────────────────────────

export function effectiveEmblem(atlas: Atlas, id: string): { emblem: Emblem; personal: boolean } | null {
  const own = atlas.personalEmblems?.[id];
  if (own) return { emblem: own, personal: true };
  const shared = atlas.concepts[id]?.emblem ?? atlas.regions[id]?.emblem;
  return shared ? { emblem: shared, personal: false } : null;
}

/** What to show for a place: its own Sinnbild, or — for a Thema without one — that of its first Begriff that has one. */
export function displayEmblem(atlas: Atlas, id: string): Emblem | null {
  const own = effectiveEmblem(atlas, id)?.emblem;
  if (own) return own;
  const region = atlas.regions[id];
  if (region?.level !== 4) return null;
  for (const cid of region.concepts ?? []) {
    const e = effectiveEmblem(atlas, cid)?.emblem;
    if (e) return e;
  }
  return null;
}

/**
 * The first Sinnbild of a Begriff or region is shared by everyone; after
 * that a new one overrides it only for this learner (scope "auto").
 */
export function setEmblem(atlas: Atlas, id: string, emblem: Emblem, scope: "auto" | "shared" | "personal" = "auto"): string {
  const owner: { emblem?: Emblem } = atlas.concepts[id] ?? atlas.regions[id] ?? fail("Begriff oder Ort nicht gefunden");
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

/** Sample Sinnbilder: regions by taxonomy key, Begriffe by slug. */
export function applyEmblems(atlas: Atlas, regions: Record<string, Partial<Emblem>>, concepts: Record<string, Partial<Emblem>>): { applied: number; rejected: string[] } {
  let applied = 0;
  const rejected: string[] = [];
  const apply = (id: string, label: string, e: Partial<Emblem> | undefined, has: boolean) => {
    if (!e || has) return;
    try {
      setEmblem(atlas, id, { svg: e.svg, glyph: e.glyph, by: e.by ?? "agent" }, "shared");
      applied += 1;
    } catch (error) {
      rejected.push(`${label}: ${(error as Error).message}`);
    }
  };
  for (const r of Object.values(atlas.regions)) apply(r.id, r.key, regions[r.key], r.emblem !== undefined);
  for (const c of Object.values(atlas.concepts)) apply(c.id, c.slug, concepts[c.slug], c.emblem !== undefined);
  return { applied, rejected };
}

/** What still lacks a Sinnbild, top levels first. */
export function missingEmblems(atlas: Atlas): Array<{ id: string; label: string; context: string }> {
  const out: Array<{ id: string; label: string; context: string }> = [];
  for (const level of [1, 2, 3, 4] as Level[]) {
    for (const r of Object.values(atlas.regions)) {
      if (r.level !== level || effectiveEmblem(atlas, r.id)) continue;
      const children = r.level === 4 ? conceptsIn(atlas, r.id).map((c) => c.title) : r.children.map((id) => atlas.regions[id].name);
      out.push({ id: r.id, label: `${LEVEL_NAME[r.level]} ${pathText(atlas, r.id)}`, context: `enthält: ${children.slice(0, 8).join("; ")}` });
    }
  }
  for (const c of Object.values(atlas.concepts)) {
    if (effectiveEmblem(atlas, c.id)) continue;
    out.push({ id: c.slug, label: `Begriff ${c.title}`, context: c.cards.map((k) => `F: ${k.question} A: ${k.answer}`).join(" | ").slice(0, 400) });
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
 * How a sample learner treated each Fach: days since they stopped, how
 * well it went, how much they never touched, and how much they only
 * crammed for a test. Chemie is new to them.
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
};

export function simulateHistory(atlas: Atlas, seed = 7): void {
  const rng = mulberry32(seed);
  const now = simNow(atlas).getTime();
  const subjectOf = (concept: Concept) => placeForDomain(concept.domain)?.subject.key ?? "";
  for (const concept of Object.values(atlas.concepts)) {
    const profile = PROFILES[subjectOf(concept)];
    if (!profile) continue;
    const grade = concept.grade ?? 9;
    const skill = Math.min(0.97, profile.skill + (rng() - 0.5) * 0.25);
    // Some Themen were dropped earlier than the rest of their Fach.
    const stopAt = now - (profile.stopAgo + (rng() < 0.2 ? 15 + rng() * 60 : 0)) * DAY_MS;
    const span = rng() < profile.cram ? 5 + rng() * 15 : 40 + Math.max(0, 9 - grade) * 50 + rng() * 40;
    const startAt = stopAt - span * DAY_MS;
    for (const card of concept.cards) {
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

export function emptyAtlas(): Atlas {
  return {
    schema: "zam-knowledge-atlas-spike/1",
    revision: 0,
    createdAt: new Date().toISOString(),
    clockMinutes: 0,
    roots: [],
    regions: {},
    concepts: {},
    proposals: [],
    requires: {},
    threads: [],
    lastChange: null,
  };
}

/** Realschule tiles of grades 5–9: what a ninth-grader may have met so far. */
export function startTileKeys(catalog: TileCatalog): string[] {
  return Object.keys(catalog)
    .filter((k) => /^realschule-[5-9]-/.test(k))
    .sort();
}

export function createStartAtlas(
  catalog: TileCatalog,
  opts: {
    history: boolean;
    regionEmblems?: Record<string, Partial<Emblem>>;
    conceptEmblems?: Record<string, Partial<Emblem>>;
    threads?: Array<{ a: string; b: string; note: string }>;
  },
): Atlas {
  const atlas = emptyAtlas();
  for (const key of startTileKeys(catalog)) {
    addConcepts(atlas, conceptsFromTile(key, catalog[key], simNow(atlas)));
    recordPrerequisites(atlas, catalog[key]);
  }
  if (opts.threads) applyThreads(atlas, opts.threads);
  if (opts.history) simulateHistory(atlas);
  if (opts.regionEmblems || opts.conceptEmblems) applyEmblems(atlas, opts.regionEmblems ?? {}, opts.conceptEmblems ?? {});
  return atlas;
}
