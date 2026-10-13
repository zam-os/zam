/**
 * Knowledge world spike — data model and operations.
 *
 * Shared by the browser (Studio side) and the agent CLI, so both change the
 * world through the same functions. Pure: no DOM, no Node APIs.
 *
 * The world is an ordering layer only. Building, moving and demolishing never
 * touch a card's scheduling state; only `rateCard` does, through the
 * kernel's real FSRS-6 implementation.
 */
import {
  createEmptyCard,
  createFSRS,
} from "../../../../src/kernel/scheduler/fsrs.ts";
import type {
  CardState,
  Rating,
  SchedulingCard,
} from "../../../../src/kernel/scheduler/fsrs.ts";

export type { Rating };

export const HOME_ID = "home";
export const SLOTS_PER_CABINET = 6;
export const MAX_ROOMS_PER_FLOOR = 6;
export const MAX_CABINETS_PER_ROOM = 7;
export const MAX_SLOTS_PER_CABINET = 12;

export function cabinetSlots(cabinet: Cabinet): number {
  return cabinet.slots ?? SLOTS_PER_CABINET;
}
const DAY_MS = 24 * 60 * 60 * 1000;

const fsrs = createFSRS();
const W20 = fsrs.params.w[20];
const CURVE_FACTOR = 0.9 ** (-1 / W20) - 1;

// ── Types ────────────────────────────────────────────────────────────────────

export interface StoredCard {
  id: string;
  question: string;
  answer: string;
  bloom: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  state: CardState;
  learningStep: number | null;
  dueAt: string;
  lastReviewAt: string | null;
}

/** A "Begriff": one learning atom with its practice cards. */
export interface Concept {
  id: string;
  slug: string;
  title: string;
  /** The token's original, shared category — never changed by the world. */
  domain: string;
  subject: string;
  grade: number | null;
  source: string;
  tileKey: string;
  /** Curriculum topic, e.g. "Rechtwinklige Dreiecke" — a room name suggestion. */
  topic?: string;
  /** A small picture of the concept, drawn by an agent (see `validateEmblemSvg`). */
  emblem?: Emblem;
  cards: StoredCard[];
}

/**
 * A concept's sinnbild. Text models draw it as SVG (SVG is text) and may add
 * a glyph — a formula or symbol of a few characters — that works on its own.
 */
export interface Emblem {
  svg?: string;
  glyph?: string;
  by: "agent" | "learner";
}

export type Placement =
  | { kind: "box"; boxId: string }
  | { kind: "slot"; cabinetId: string; slot: number };

export interface Box {
  id: string;
  label: string;
  /** `HOME_ID` or the id of the room it stands in. */
  roomId: string;
  origin: "start" | "import" | "demolition" | "sorted-out";
}

export interface Cabinet {
  id: string;
  name: string;
  /** Spot along the room's walls (0–6), see `CABINET_SPOTS`. */
  spot: number;
  /** Compartments; a full cabinet grows instead of refusing (default 6, max 12). */
  slots?: number;
}

export interface Room {
  id: string;
  name: string;
  cabinets: Cabinet[];
}

export interface Floor {
  id: string;
  label: string;
  rooms: Room[];
}

export interface Building {
  id: string;
  name: string;
  lot: number;
  hue: number;
  /** Bottom to top. A floor built "below" is inserted at index 0. */
  floors: Floor[];
}

export interface World {
  schema: "zam-knowledge-world-spike/1";
  revision: number;
  createdAt: string;
  /** Simulated minutes since `createdAt` (the time machine moves it). */
  clockMinutes: number;
  buildings: Building[];
  boxes: Box[];
  concepts: Record<string, Concept>;
  placements: Record<string, Placement>;
  lastChange: { by: "studio" | "agent"; summary: string } | null;
  /** This learner's own Sinnbilder, overriding the shared one (concept id → emblem). */
  personalEmblems?: Record<string, Emblem>;
}

/** Minimal KVT tile shape the spike reads. */
export interface TileJson {
  tile_id: string;
  title: string;
  atoms: Array<{
    id: string;
    slug: string;
    title: string;
    domain: string;
    curricula?: Array<{ grade?: number; subject?: string; topic_title?: string }>;
    practice_items: Array<{
      id: string;
      bloom_level?: number;
      question: string;
      concept: string;
    }>;
  }>;
}

export type TileCatalog = Record<string, TileJson>;

// ── Clock and memory state ──────────────────────────────────────────────────

export function simNow(world: World): Date {
  return new Date(Date.parse(world.createdAt) + world.clockMinutes * 60_000);
}

export function simDay(world: World): number {
  return Math.floor(world.clockMinutes / (24 * 60));
}

export function retrievability(card: StoredCard, now: Date): number | null {
  if (card.state === "new" || card.lastReviewAt === null) return null;
  const elapsed = Math.max(0, (now.getTime() - Date.parse(card.lastReviewAt)) / DAY_MS);
  const s = Math.max(0.001, card.stability);
  return (1 + (CURVE_FACTOR * elapsed) / s) ** -W20;
}

export function isDue(card: StoredCard, now: Date): boolean {
  return Date.parse(card.dueAt) <= now.getTime();
}

/**
 * -1 = never practised (raw build), 0 = bright, 1 = dusty (due),
 * 2 = dark, 3 = decaying, 4 = fog.
 */
export function cardLevel(card: StoredCard, now: Date): number {
  const r = retrievability(card, now);
  if (r === null) return -1;
  if (!isDue(card, now)) return 0;
  const [dusty, dark, decaying] = LEVEL_THRESHOLDS;
  let level = r >= dusty ? 1 : r >= dark ? 2 : r >= decaying ? 3 : 4;
  // "Immer wieder vergessen": a card that keeps lapsing decays even when recent.
  if (card.lapses >= DECAY_LAPSES) level = Math.max(level, 3);
  return level;
}

/**
 * Retrievability floors for dusty, dark and decaying; below the last is fog.
 * Tuning knobs of the spike — FSRS-6 forgets slowly, so fog needs real absence.
 */
export const LEVEL_THRESHOLDS = [0.85, 0.75, 0.65] as const;
export const DECAY_LAPSES = 3;

export type Condition =
  | "leer"
  | "rohbau"
  | "hell"
  | "staubig"
  | "dunkel"
  | "verfallen"
  | "nebel";

export const CONDITION_LABEL: Record<Condition, string> = {
  leer: "leer",
  rohbau: "Rohbau",
  hell: "hell",
  staubig: "staubig",
  dunkel: "dunkel",
  verfallen: "verfällt",
  nebel: "im Nebel",
};

export interface Stats {
  total: number;
  fresh: number;
  due: number;
  /** Shares of all cards: never practised, ≥ dusty, ≥ dark, ≥ decaying, fog. */
  raw: number;
  dust: number;
  dark: number;
  decay: number;
  fog: number;
  meanR: number | null;
  label: Condition;
}

export function statsFor(cards: StoredCard[], now: Date): Stats {
  const total = cards.length;
  if (total === 0) {
    return { total, fresh: 0, due: 0, raw: 0, dust: 0, dark: 0, decay: 0, fog: 0, meanR: null, label: "leer" };
  }
  const atLeast = [0, 0, 0, 0, 0];
  let fresh = 0;
  let due = 0;
  let sumR = 0;
  for (const card of cards) {
    const level = cardLevel(card, now);
    if (isDue(card, now) || card.state === "new") due += 1;
    if (level < 0) {
      fresh += 1;
      continue;
    }
    sumR += retrievability(card, now) ?? 0;
    for (let l = 1; l <= level; l += 1) atLeast[l] += 1;
  }
  const reviewed = total - fresh;
  let label: Condition = "rohbau";
  if (reviewed > 0) {
    label = "hell";
    const names: Condition[] = ["hell", "staubig", "dunkel", "verfallen", "nebel"];
    for (let l = 4; l >= 1; l -= 1) {
      if (atLeast[l] / reviewed >= 0.34) {
        label = names[l];
        break;
      }
    }
  }
  return {
    total,
    fresh,
    due,
    raw: fresh / total,
    dust: atLeast[1] / total,
    dark: atLeast[2] / total,
    decay: atLeast[3] / total,
    fog: atLeast[4] / total,
    meanR: reviewed > 0 ? sumR / reviewed : null,
    label,
  };
}

// ── Lookup ──────────────────────────────────────────────────────────────────

export interface WorldIndex {
  buildings: Map<string, Building>;
  floors: Map<string, { building: Building; floor: Floor; index: number }>;
  rooms: Map<string, { building: Building; floor: Floor; room: Room; index: number }>;
  cabinets: Map<string, { building: Building; floor: Floor; room: Room; cabinet: Cabinet }>;
}

export function indexWorld(world: World): WorldIndex {
  const idx: WorldIndex = { buildings: new Map(), floors: new Map(), rooms: new Map(), cabinets: new Map() };
  for (const building of world.buildings) {
    idx.buildings.set(building.id, building);
    building.floors.forEach((floor, fi) => {
      idx.floors.set(floor.id, { building, floor, index: fi });
      floor.rooms.forEach((room, ri) => {
        idx.rooms.set(room.id, { building, floor, room, index: ri });
        for (const cabinet of room.cabinets) idx.cabinets.set(cabinet.id, { building, floor, room, cabinet });
      });
    });
  }
  return idx;
}

export function cabinetContents(world: World, cabinetId: string): Array<{ concept: Concept; slot: number }> {
  const out: Array<{ concept: Concept; slot: number }> = [];
  for (const [conceptId, p] of Object.entries(world.placements)) {
    if (p.kind === "slot" && p.cabinetId === cabinetId) out.push({ concept: world.concepts[conceptId], slot: p.slot });
  }
  return out.sort((a, b) => a.slot - b.slot);
}

export function boxContents(world: World, boxId: string): Concept[] {
  return Object.entries(world.placements)
    .filter(([, p]) => p.kind === "box" && p.boxId === boxId)
    .map(([id]) => world.concepts[id])
    .sort((a, b) => a.title.localeCompare(b.title, "de"));
}

export function conceptsInRoom(world: World, room: Room): Concept[] {
  return room.cabinets.flatMap((c) => cabinetContents(world, c.id).map((x) => x.concept));
}

export function conceptsInFloor(world: World, floor: Floor): Concept[] {
  return floor.rooms.flatMap((r) => conceptsInRoom(world, r));
}

export function conceptsInBuilding(world: World, building: Building): Concept[] {
  return building.floors.flatMap((f) => conceptsInFloor(world, f));
}

export function cardsOf(concepts: Concept[]): StoredCard[] {
  return concepts.flatMap((c) => c.cards);
}

/** Human path of a concept's place, e.g. "Mathematik › 9. Klasse › Parabeln › Scheitel › Fach 3". */
export function placementPath(world: World, conceptId: string): string {
  const p = world.placements[conceptId];
  if (!p) return "nirgends";
  if (p.kind === "box") {
    const box = world.boxes.find((b) => b.id === p.boxId);
    return `Umzugskarton „${box?.label ?? "?"}“ in ${box ? roomPath(world, box.roomId) : "?"}`;
  }
  const hit = indexWorld(world).cabinets.get(p.cabinetId);
  if (!hit) return "?";
  return `${hit.building.name} › ${hit.floor.label} › ${hit.room.name} › ${hit.cabinet.name} › Fach ${p.slot + 1}`;
}

export function roomPath(world: World, roomId: string): string {
  if (roomId === HOME_ID) return "Dein Zimmer";
  const hit = indexWorld(world).rooms.get(roomId);
  return hit ? `${hit.building.name} › ${hit.floor.label} › ${hit.room.name}` : "?";
}

// ── Building operations (each returns a German summary) ─────────────────────

const HUES = [214, 146, 24, 276, 350, 48, 186, 98];

export function newId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function fail(message: string): never {
  throw new Error(message);
}

export function createBuilding(world: World, name: string): string {
  const used = new Set(world.buildings.map((b) => b.lot));
  let lot = 0;
  while (used.has(lot)) lot += 1;
  // A stable colour per name, skipping hues other buildings already wear.
  let hash = 0;
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const taken = new Set(world.buildings.map((b) => b.hue));
  let hue = HUES[hash % HUES.length];
  for (let i = 0; i < HUES.length && taken.has(hue); i += 1) hue = HUES[(hash + i + 1) % HUES.length];
  world.buildings.push({ id: newId("geb"), name, lot, hue, floors: [] });
  return `Gebäude „${name}“ angelegt`;
}

export function addFloor(world: World, buildingId: string, label: string, where: "above" | "below"): string {
  const building = indexWorld(world).buildings.get(buildingId) ?? fail("Gebäude nicht gefunden");
  const floor: Floor = { id: newId("eta"), label, rooms: [] };
  if (where === "below") building.floors.unshift(floor);
  else building.floors.push(floor);
  return `Etage „${label}“ ${where === "below" ? "unter" : "auf"} „${building.name}“ gebaut`;
}

export function addRoom(world: World, floorId: string, name: string): string {
  const hit = indexWorld(world).floors.get(floorId) ?? fail("Etage nicht gefunden");
  if (hit.floor.rooms.length >= MAX_ROOMS_PER_FLOOR) fail(`Auf „${hit.floor.label}“ ist kein Platz mehr – baue eine neue Etage.`);
  hit.floor.rooms.push({ id: newId("raum"), name, cabinets: [] });
  return `Raum „${name}“ in ${hit.building.name} › ${hit.floor.label} angebaut`;
}

function freeSpot(room: Room): number {
  const used = new Set(room.cabinets.map((c) => c.spot));
  for (let s = 0; s < MAX_CABINETS_PER_ROOM; s += 1) if (!used.has(s)) return s;
  return fail(`Im Raum „${room.name}“ ist kein Platz mehr für einen Schrank.`);
}

export function addCabinet(world: World, roomId: string, name: string): string {
  const hit = indexWorld(world).rooms.get(roomId) ?? fail("Raum nicht gefunden");
  hit.room.cabinets.push({ id: newId("schrank"), name, spot: freeSpot(hit.room) });
  return `Schrank „${name}“ in „${hit.room.name}“ aufgestellt`;
}

export function rename(world: World, nodeId: string, name: string): string {
  const idx = indexWorld(world);
  const b = idx.buildings.get(nodeId);
  if (b) { const old = b.name; b.name = name; return `Gebäude „${old}“ heißt jetzt „${name}“`; }
  const f = idx.floors.get(nodeId);
  if (f) { const old = f.floor.label; f.floor.label = name; return `Etage „${old}“ heißt jetzt „${name}“`; }
  const r = idx.rooms.get(nodeId);
  if (r) { const old = r.room.name; r.room.name = name; return `Raum „${old}“ heißt jetzt „${name}“`; }
  const c = idx.cabinets.get(nodeId);
  if (c) { const old = c.cabinet.name; c.cabinet.name = name; return `Schrank „${old}“ heißt jetzt „${name}“`; }
  const box = world.boxes.find((x) => x.id === nodeId);
  if (box) { const old = box.label; box.label = name; return `Karton „${old}“ heißt jetzt „${name}“`; }
  return fail("Nichts zum Umbenennen gefunden");
}

export function moveCabinet(world: World, cabinetId: string, roomId: string): string {
  const idx = indexWorld(world);
  const from = idx.cabinets.get(cabinetId) ?? fail("Schrank nicht gefunden");
  const to = idx.rooms.get(roomId) ?? fail("Zielraum nicht gefunden");
  if (from.room.id === to.room.id) return "Schrank steht schon dort";
  const spot = freeSpot(to.room);
  from.room.cabinets = from.room.cabinets.filter((c) => c.id !== cabinetId);
  to.room.cabinets.push({ ...from.cabinet, spot });
  return `Schrank „${from.cabinet.name}“ nach „${to.room.name}“ getragen`;
}

export function moveRoom(world: World, roomId: string, floorId: string): string {
  const idx = indexWorld(world);
  const from = idx.rooms.get(roomId) ?? fail("Raum nicht gefunden");
  const to = idx.floors.get(floorId) ?? fail("Zieletage nicht gefunden");
  if (from.floor.id === to.floor.id) return "Raum ist schon auf dieser Etage";
  if (to.floor.rooms.length >= MAX_ROOMS_PER_FLOOR) fail(`Auf „${to.floor.label}“ ist kein Platz mehr.`);
  from.floor.rooms = from.floor.rooms.filter((r) => r.id !== roomId);
  to.floor.rooms.push(from.room);
  return `Raum „${from.room.name}“ nach ${to.building.name} › ${to.floor.label} verlegt`;
}

export function moveFloor(world: World, floorId: string, buildingId: string, where: "above" | "below"): string {
  const idx = indexWorld(world);
  const from = idx.floors.get(floorId) ?? fail("Etage nicht gefunden");
  const to = idx.buildings.get(buildingId) ?? fail("Zielgebäude nicht gefunden");
  from.building.floors = from.building.floors.filter((f) => f.id !== floorId);
  if (where === "below") to.floors.unshift(from.floor);
  else to.floors.push(from.floor);
  return `Etage „${from.floor.label}“ ${where === "below" ? "unter" : "auf"} „${to.name}“ gesetzt`;
}

/** Swap a floor with its neighbour: delta −1 = one level down, +1 = up. */
export function shiftFloor(world: World, floorId: string, delta: -1 | 1): string {
  const hit = indexWorld(world).floors.get(floorId) ?? fail("Etage nicht gefunden");
  const target = hit.index + delta;
  if (target < 0 || target >= hit.building.floors.length) return "Geht nicht weiter";
  const floors = hit.building.floors;
  [floors[hit.index], floors[target]] = [floors[target], floors[hit.index]];
  return `Etage „${hit.floor.label}“ eine Ebene ${delta < 0 ? "tiefer" : "höher"} gelegt`;
}

export function placeConcept(world: World, conceptId: string, cabinetId: string, slot?: number): string {
  const concept = world.concepts[conceptId] ?? fail("Begriff nicht gefunden");
  const hit = indexWorld(world).cabinets.get(cabinetId) ?? fail("Schrank nicht gefunden");
  const taken = new Set(cabinetContents(world, cabinetId).filter((x) => x.concept.id !== conceptId).map((x) => x.slot));
  let target = slot;
  let grown = false;
  if (target === undefined) {
    target = [...Array(cabinetSlots(hit.cabinet)).keys()].find((s) => !taken.has(s));
    if (target === undefined) {
      // A full cabinet is no obstacle: it gets another row of compartments.
      if (cabinetSlots(hit.cabinet) >= MAX_SLOTS_PER_CABINET) fail(`Schrank „${hit.cabinet.name}“ ist ganz voll – stell einen zweiten auf.`);
      target = cabinetSlots(hit.cabinet);
      hit.cabinet.slots = target + 2;
      grown = true;
    }
  }
  if (target < 0 || target >= cabinetSlots(hit.cabinet)) fail("Dieses Fach gibt es nicht.");
  if (taken.has(target)) fail(`Fach ${target + 1} ist schon belegt.`);
  const before = world.placements[conceptId];
  world.placements[conceptId] = { kind: "slot", cabinetId, slot: target };
  removeEmptyBox(world, before);
  return `„${concept.title}“ → ${hit.building.name} › ${hit.room.name} › ${hit.cabinet.name}${grown ? " (Fächer angebaut)" : ""}`;
}

/** Put a concept back into a box; without a box, into "Aussortiert" in Dein Zimmer. */
export function packConcept(world: World, conceptId: string, boxId?: string): string {
  const concept = world.concepts[conceptId] ?? fail("Begriff nicht gefunden");
  let box = boxId ? world.boxes.find((b) => b.id === boxId) : world.boxes.find((b) => b.origin === "sorted-out" && b.roomId === HOME_ID);
  if (!box) {
    box = { id: newId("karton"), label: "Aussortiert", roomId: HOME_ID, origin: "sorted-out" };
    world.boxes.push(box);
  }
  const before = world.placements[conceptId];
  world.placements[conceptId] = { kind: "box", boxId: box.id };
  if (before?.kind === "box" && before.boxId !== box.id) removeEmptyBox(world, before);
  return `„${concept.title}“ in den Karton „${box.label}“ gelegt`;
}

function removeEmptyBox(world: World, before: Placement | undefined): void {
  if (before?.kind !== "box") return;
  if (boxContents(world, before.boxId).length === 0) world.boxes = world.boxes.filter((b) => b.id !== before.boxId);
}

/**
 * Demolish a building, floor, room or cabinet. Every concept inside goes into
 * one new moving box in Dein Zimmer; boxes standing in demolished rooms move
 * there too. Learning state is untouched.
 */
export function demolish(world: World, nodeId: string): string {
  const idx = indexWorld(world);
  let name: string;
  let rooms: Room[] = [];
  let cabinets: Cabinet[] = [];
  const b = idx.buildings.get(nodeId);
  const f = idx.floors.get(nodeId);
  const r = idx.rooms.get(nodeId);
  const c = idx.cabinets.get(nodeId);
  if (b) {
    name = b.name;
    rooms = b.floors.flatMap((x) => x.rooms);
    world.buildings = world.buildings.filter((x) => x.id !== nodeId);
  } else if (f) {
    name = `${f.building.name} › ${f.floor.label}`;
    rooms = f.floor.rooms;
    f.building.floors = f.building.floors.filter((x) => x.id !== nodeId);
  } else if (r) {
    name = r.room.name;
    rooms = [r.room];
    r.floor.rooms = r.floor.rooms.filter((x) => x.id !== nodeId);
  } else if (c) {
    name = c.cabinet.name;
    cabinets = [c.cabinet];
    c.room.cabinets = c.room.cabinets.filter((x) => x.id !== nodeId);
  } else {
    return fail("Nichts zum Abreißen gefunden");
  }
  cabinets = cabinets.concat(rooms.flatMap((x) => x.cabinets));
  const roomIds = new Set(rooms.map((x) => x.id));
  for (const box of world.boxes) if (roomIds.has(box.roomId)) box.roomId = HOME_ID;
  const cabinetIds = new Set(cabinets.map((x) => x.id));
  const homeless = Object.entries(world.placements).filter(([, p]) => p.kind === "slot" && cabinetIds.has(p.cabinetId));
  if (homeless.length === 0) return `„${name}“ abgerissen (war leer)`;
  const box: Box = { id: newId("karton"), label: `Abriss: ${name}`, roomId: HOME_ID, origin: "demolition" };
  world.boxes.push(box);
  for (const [conceptId] of homeless) world.placements[conceptId] = { kind: "box", boxId: box.id };
  return `„${name}“ abgerissen – ${homeless.length} Begriffe liegen jetzt im Umzugskarton`;
}

// ── Import ──────────────────────────────────────────────────────────────────

export function tileLabel(key: string, tile: TileJson): string {
  const title = tile.title.replace(/\s*\([^)]*\)\s*$/, "");
  const m = /realschule-(\d+)-([a-z]+)/.exec(key);
  if (!m) return title;
  const subject = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  return `${subject} ${m[1]} · ${title.replace(new RegExp(`^${subject}( \\d+)?:\\s*`, "i"), "")}`;
}

export function conceptsFromTile(key: string, tile: TileJson, now: Date): Concept[] {
  return tile.atoms.map((atom) => ({
    id: atom.id,
    slug: atom.slug,
    title: atom.title,
    domain: atom.domain,
    subject: atom.curricula?.[0]?.subject ?? "",
    grade: atom.curricula?.[0]?.grade ?? null,
    topic: atom.curricula?.[0]?.topic_title,
    source: tileLabel(key, tile),
    tileKey: key,
    cards: atom.practice_items.map((item) => ({
      ...fromScheduling(createEmptyCard(now)),
      id: item.id,
      question: item.question,
      answer: item.concept,
      bloom: item.bloom_level ?? 1,
    })),
  }));
}

/** New knowledge arrives as a moving box at the place where the learner stands. */
export function importTile(world: World, key: string, tile: TileJson, roomId: string): string {
  if (roomId !== HOME_ID && !indexWorld(world).rooms.has(roomId)) fail("Raum nicht gefunden");
  const concepts = conceptsFromTile(key, tile, simNow(world)).filter((c) => !world.concepts[c.id]);
  if (concepts.length === 0) return `„${tileLabel(key, tile)}“ ist schon vollständig in deiner Welt`;
  const box: Box = { id: newId("karton"), label: tileLabel(key, tile), roomId, origin: "import" };
  world.boxes.push(box);
  for (const c of concepts) {
    world.concepts[c.id] = c;
    world.placements[c.id] = { kind: "box", boxId: box.id };
  }
  return `Umzugskarton „${box.label}“ (${concepts.length} Begriffe) in ${roomPath(world, roomId)} abgestellt`;
}

// ── Reviews and time ────────────────────────────────────────────────────────

function toScheduling(card: StoredCard): SchedulingCard {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsedDays,
    scheduledDays: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    learningStep: card.learningStep,
    dueAt: new Date(card.dueAt),
    lastReviewAt: card.lastReviewAt ? new Date(card.lastReviewAt) : null,
  };
}

function fromScheduling(card: SchedulingCard): Omit<StoredCard, "id" | "question" | "answer" | "bloom"> {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsedDays,
    scheduledDays: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    learningStep: card.learningStep,
    dueAt: card.dueAt.toISOString(),
    lastReviewAt: card.lastReviewAt ? card.lastReviewAt.toISOString() : null,
  };
}

export function applyRating(card: StoredCard, rating: Rating, at: Date): void {
  Object.assign(card, fromScheduling(fsrs.schedule(toScheduling(card), rating, at)));
}

export function findCard(world: World, cardId: string): { concept: Concept; card: StoredCard } | null {
  for (const concept of Object.values(world.concepts)) {
    const card = concept.cards.find((c) => c.id === cardId);
    if (card) return { concept, card };
  }
  return null;
}

export function rateCard(world: World, cardId: string, rating: Rating): string {
  const hit = findCard(world, cardId) ?? fail("Karte nicht gefunden");
  applyRating(hit.card, rating, simNow(world));
  world.clockMinutes += 1;
  const names = { 1: "Nochmal", 2: "Schwer", 3: "Gut", 4: "Leicht" } as const;
  return `„${hit.concept.title}“ geübt (${names[rating]})`;
}

export function advanceClock(world: World, days: number): string {
  world.clockMinutes += Math.round(days * 24 * 60);
  return `Zeitmaschine: ${days} Tag${days === 1 ? "" : "e"} weiter (jetzt Tag ${simDay(world)})`;
}

// ── Start world ─────────────────────────────────────────────────────────────

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

/** Give concepts a plausible past: some well learned, some lapsed, some untouched. */
export function simulateHistory(world: World, conceptIds: string[], seed = 9): void {
  const rng = mulberry32(seed);
  const now = simNow(world).getTime();
  for (const id of conceptIds) {
    const concept = world.concepts[id];
    const skill = 0.55 + rng() * 0.4;
    // Some topics were dropped a while ago; their cards wait overdue since then.
    const stopAt = rng() < 0.25 ? now - (10 + rng() * 50) * DAY_MS : now;
    for (const card of concept.cards) {
      if (rng() < 0.12) continue;
      let t = now - (70 + rng() * 50) * DAY_MS;
      for (let i = 0; i < 40; i += 1) {
        const r = retrievability(card, new Date(t));
        const pRecall = r === null ? skill : Math.min(0.98, r * (0.85 + skill * 0.2));
        const rating: Rating = rng() < pRecall ? (rng() < 0.15 ? 4 : 3) : 1;
        applyRating(card, rating, new Date(t));
        const next = t + (Date.parse(card.dueAt) - t) * (1 + rng() * 0.4);
        if (next > stopAt) break;
        t = next;
      }
    }
  }
}

export function createStartWorld(catalog: TileCatalog, opts: { history: boolean; emblems?: Record<string, Partial<Emblem>> }): World {
  const world: World = {
    schema: "zam-knowledge-world-spike/1",
    revision: 0,
    createdAt: new Date().toISOString(),
    clockMinutes: 0,
    buildings: [],
    boxes: [],
    concepts: {},
    placements: {},
    lastChange: null,
  };
  const keys = Object.keys(catalog).filter((k) => k.startsWith("realschule-9-mathematik-")).sort();
  for (const key of keys) {
    importTile(world, key, catalog[key], HOME_ID);
    const box = world.boxes[world.boxes.length - 1];
    box.origin = "start";
  }
  if (opts.history) simulateHistory(world, Object.keys(world.concepts));
  if (opts.emblems) applyEmblems(world, opts.emblems);
  return world;
}

export function tileKeyFromFileName(fileName: string): string | null {
  const m = /^de-by-(.+)-kvt\.json$/.exec(fileName);
  return m ? m[1] : null;
}

// ── Places on demand ────────────────────────────────────────────────────────

export interface PlacePath {
  building: string;
  floor: string;
  room: string;
  cabinet: string;
}

function same(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase("de") === b.trim().toLocaleLowerCase("de");
}

function leadingNumber(label: string): number | null {
  const m = /^\s*(\d+)/.exec(label);
  return m ? Number(m[1]) : null;
}

/**
 * Find or build the place a path names. Missing parts are created on the
 * spot — a missing cabinet is never an obstacle. A new numbered floor
 * ("8. Klasse") slots in by its number, so foundations end up lower.
 */
export function ensurePlace(world: World, path: PlacePath): { cabinetId: string; created: string[] } {
  const created: string[] = [];
  const names = [path.building, path.floor, path.room, path.cabinet].map((n) => n.trim());
  if (names.some((n) => n === "")) fail("Bitte alle vier Namen ausfüllen.");
  let building = world.buildings.find((b) => same(b.name, names[0]));
  if (!building) {
    createBuilding(world, names[0]);
    building = world.buildings[world.buildings.length - 1];
    created.push(`Gebäude „${names[0]}“`);
  }
  let floor = building.floors.find((f) => same(f.label, names[1]));
  if (!floor) {
    floor = { id: newId("eta"), label: names[1], rooms: [] };
    const n = leadingNumber(names[1]);
    const numbered = building.floors.every((f) => leadingNumber(f.label) !== null);
    let at = building.floors.length;
    if (n !== null && numbered) {
      at = building.floors.findIndex((f) => (leadingNumber(f.label) ?? 0) > n);
      if (at < 0) at = building.floors.length;
    }
    building.floors.splice(at, 0, floor);
    created.push(`Etage „${names[1]}“`);
  }
  let room = floor.rooms.find((r) => same(r.name, names[2]));
  if (!room) {
    addRoom(world, floor.id, names[2]);
    room = floor.rooms[floor.rooms.length - 1];
    created.push(`Raum „${names[2]}“`);
  }
  let cabinet = room.cabinets.find((c) => same(c.name, names[3]));
  if (!cabinet) {
    addCabinet(world, room.id, names[3]);
    cabinet = room.cabinets[room.cabinets.length - 1];
    created.push(`Schrank „${names[3]}“`);
  }
  return { cabinetId: cabinet.id, created };
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toLocaleUpperCase("de") + s.slice(1) : s;
}

/** Where a concept would naturally go, from its own metadata. */
export function suggestedPath(concept: Concept): PlacePath {
  const topic = concept.topic ?? concept.source.replace(/^[^·]*·\s*/, "");
  const leaf = concept.domain.split("/").pop() ?? "";
  return {
    building: capitalize(concept.subject || concept.domain.split("/")[0] || "Allgemein"),
    floor: concept.grade ? `${concept.grade}. Klasse` : "Grundlagen",
    room: topic,
    cabinet: capitalize(leaf) || "Allgemein",
  };
}

/** The concept's current place as a path, if it has one. */
export function currentPath(world: World, conceptId: string): PlacePath | null {
  const p = world.placements[conceptId];
  if (p?.kind !== "slot") return null;
  const hit = indexWorld(world).cabinets.get(p.cabinetId);
  return hit ? { building: hit.building.name, floor: hit.floor.label, room: hit.room.name, cabinet: hit.cabinet.name } : null;
}

/** Names that already exist on a level (below the given parents), for suggestions. */
export function existingNames(world: World, level: keyof PlacePath, parent: Partial<PlacePath> = {}): string[] {
  const out = new Set<string>();
  for (const b of world.buildings) {
    if (level === "building") {
      out.add(b.name);
      continue;
    }
    if (parent.building && !same(b.name, parent.building)) continue;
    for (const f of b.floors) {
      if (level === "floor") {
        out.add(f.label);
        continue;
      }
      if (parent.floor && !same(f.label, parent.floor)) continue;
      for (const r of f.rooms) {
        if (level === "room") {
          out.add(r.name);
          continue;
        }
        if (parent.room && !same(r.name, parent.room)) continue;
        for (const c of r.cabinets) out.add(c.name);
      }
    }
  }
  return [...out];
}

/** Name ideas for a new building, floor, room or cabinet, from the concepts at hand (default: what waits in boxes). */
export function nameIdeas(world: World, level: keyof PlacePath, concepts?: Concept[]): string[] {
  const pool = concepts ?? Object.entries(world.placements).filter(([, p]) => p.kind === "box").map(([id]) => world.concepts[id]);
  const counts = new Map<string, number>();
  for (const c of pool) {
    const name = suggestedPath(c)[level];
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
}

// ── Emblems ─────────────────────────────────────────────────────────────────

const SVG_ELEMENTS = new Set(["svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "text", "tspan"]);
const SVG_ATTRIBUTES = new Set([
  "xmlns", "viewBox", "width", "height", "d", "cx", "cy", "r", "rx", "ry", "x", "y", "x1", "y1", "x2", "y2", "dx", "dy",
  "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-dasharray", "opacity",
  "fill-opacity", "stroke-opacity", "transform", "font-size", "font-weight", "font-style", "text-anchor",
]);
const SAFE_VALUE = /^[#\w\s.,()%+\-:/=²³°·πα-ωΑ-Ω√∞≈≤≥±×÷′″]*$/u;
const SAFE_TEXT = /^[^<>&]*$/;

/**
 * Agent-drawn SVG is untrusted content: only plain shapes and text pass —
 * no scripts, styles, links, images, entities or url() references. Returns
 * null when the SVG is acceptable, otherwise the reason (so an agent can fix it).
 */
export function validateEmblemSvg(svg: string): string | null {
  if (svg.length > 6000) return "zu groß (max. 6000 Zeichen)";
  if (/<!|<\?|&|url\s*\(|javascript:|data:/i.test(svg)) return "verbotene Konstrukte (DOCTYPE, Entities, url(), javascript:, data:)";
  if (!/^\s*<svg[\s>]/.test(svg) || !/<\/svg>\s*$/.test(svg)) return "muss mit <svg> beginnen und mit </svg> enden";
  const tag = /<\/?([a-zA-Z][\w-]*)([^<>]*)>/g;
  if (!SAFE_TEXT.test(svg.replace(tag, ""))) return "unvollständige Tags";
  for (let m = tag.exec(svg); m !== null; m = tag.exec(svg)) {
    if (!SVG_ELEMENTS.has(m[1])) return `Element <${m[1]}> ist nicht erlaubt`;
    const attrs = m[2].replace(/\/\s*$/, "");
    const attr = /([\w:-]+)\s*=\s*"([^"]*)"/g;
    const leftover = attrs.replace(attr, "").trim();
    if (leftover !== "") return `unlesbare Attribute an <${m[1]}>: ${leftover.slice(0, 40)}`;
    for (let a = attr.exec(attrs); a !== null; a = attr.exec(attrs)) {
      if (!SVG_ATTRIBUTES.has(a[1])) return `Attribut ${a[1]} ist nicht erlaubt`;
      if (!SAFE_VALUE.test(a[2])) return `Wert von ${a[1]} enthält verbotene Zeichen`;
    }
  }
  return null;
}

/** The Sinnbild this learner sees: their own, else the shared one. */
export function effectiveEmblem(world: World, concept: Concept): { emblem: Emblem; personal: boolean } | null {
  const own = world.personalEmblems?.[concept.id];
  if (own) return { emblem: own, personal: true };
  return concept.emblem ? { emblem: concept.emblem, personal: false } : null;
}

/**
 * The first Sinnbild of a concept is shared by everyone. After that, a new
 * one overrides it only for this learner (scope "auto"); replacing the
 * shared one takes an explicit "shared".
 */
export function setEmblem(world: World, conceptId: string, emblem: Emblem, scope: "auto" | "shared" | "personal" = "auto"): string {
  const concept = world.concepts[conceptId] ?? fail("Begriff nicht gefunden");
  if (!emblem.svg && !emblem.glyph) fail("Ein Sinnbild braucht svg oder glyph.");
  if (emblem.svg) {
    const problem = validateEmblemSvg(emblem.svg);
    if (problem) fail(`SVG abgelehnt: ${problem}`);
  }
  if (emblem.glyph && [...emblem.glyph].length > 16) fail("Glyph höchstens 16 Zeichen.");
  const personal = scope === "personal" || (scope === "auto" && concept.emblem !== undefined);
  if (personal) {
    world.personalEmblems = { ...world.personalEmblems, [conceptId]: emblem };
    return `Eigenes Sinnbild für „${concept.title}“ (nur für dich)`;
  }
  concept.emblem = emblem;
  return `Sinnbild für „${concept.title}“ gezeichnet (gilt für alle)`;
}

export function clearPersonalEmblem(world: World, conceptId: string): string {
  const concept = world.concepts[conceptId] ?? fail("Begriff nicht gefunden");
  if (world.personalEmblems) delete world.personalEmblems[conceptId];
  return `„${concept.title}“ zeigt wieder das gemeinsame Sinnbild`;
}

/** Apply a slug → emblem map; invalid entries are skipped and reported. */
export function applyEmblems(world: World, emblems: Record<string, Partial<Emblem>>): { applied: number; rejected: string[] } {
  let applied = 0;
  const rejected: string[] = [];
  for (const concept of Object.values(world.concepts)) {
    const e = emblems[concept.slug];
    if (!e || concept.emblem) continue;
    try {
      setEmblem(world, concept.id, { svg: e.svg, glyph: e.glyph, by: e.by ?? "agent" }, "shared");
      applied += 1;
    } catch (error) {
      rejected.push(`${concept.slug}: ${(error as Error).message}`);
    }
  }
  return { applied, rejected };
}
