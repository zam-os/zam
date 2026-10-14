/**
 * Map geometry of one atlas lens for the Studio (ADR 2026-10-13, Decisions
 * 3, 4, 5 and 8): the land `atlas-read` returns, placed on the sea, grouped
 * into regions, with the borders between them.
 *
 * Positions are engine-written (Decision 8). This module only reads them;
 * founding, growth and drift live in the kernel (`src/kernel/atlas/land.ts`).
 * Ported from the knowledge-atlas spike's `layout.ts` (PR #405). Pure: no
 * DOM, so the tests and later surfaces use it as is.
 *
 * Levels count from 0, as the kernel's do: level 0 is an island, and the
 * learning units sit below the last level (`depth`).
 */

import type {
  AtlasConditionWire,
  AtlasEmblemWire,
  AtlasPlanetWire,
  AtlasReadResponse,
  AtlasThreadKindWire,
  AtlasThreadWire,
  AtlasUnitWire,
} from "../../../src/bridge/protocol.js";
import { weakestCondition } from "../../../src/kernel/atlas/condition.js";
import { DIRS, hexKey, toPixel } from "../../../src/kernel/atlas/hex.js";
import {
  BASE_SHADE,
  hueFor,
  regionShade,
  type Shade,
} from "../../../src/kernel/atlas/palette.js";
import { THREAD_KINDS } from "../../../src/kernel/atlas/types.js";

/** Screen-space patterns that tell sibling regions apart below the colour level. */
export const PATTERNS = [
  "diag",
  "antidiag",
  "cross",
  "dots",
  "waves",
  "grid",
  "hlines",
  "vlines",
  "rings",
  "zigzag",
] as const;
export type PatternKind = (typeof PATTERNS)[number];

/** Hue of land above the colour level, or without a subject. */
const NEUTRAL_HUE = 210;

export interface AtlasRegion {
  key: string;
  name: string;
  level: number;
  parentKey: string | null;
  rank: number;
  hueKey: string;
  hue: number;
  /** Children by rank, then name. */
  children: string[];
  /** Place among its siblings. */
  index: number;
  /** Set on the level just below the colour level. */
  pattern: PatternKind | null;
  provisional: boolean;
  /** Key into the read's `emblems`: its Sinnbild, or its first unit's. */
  emblem?: string;
  /** Where its own Sinnbild is written: a Fach's subject, else the region. */
  emblemSubject: string;
}

export interface Cell {
  q: number;
  r: number;
  x: number;
  y: number;
  island: string;
  /** Region keys from the island to the leaf. */
  path: string[];
  /** Null: blank land (reserve, or a unit the learner does not hold). */
  unit: AtlasUnitWire | null;
  hue: number;
  shade: Shade;
}

export interface RegionGeom {
  key: string;
  level: number;
  cells: Cell[];
  /** Equivalent-circle radius in world units. */
  radius: number;
  /** Where the label sits: the cell farthest from the region's edge. */
  labelX: number;
  labelY: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** x1, y1, x2, y2 in world units. */
export type Segment = [number, number, number, number];

export interface IslandGeom {
  x: number;
  y: number;
  radius: number;
  /** Hex steps since founding (shown to curators). */
  drift: number;
}

export interface AtlasLayout {
  view: AtlasReadResponse;
  /** Number of region levels; `depth` itself means single units. */
  depth: number;
  colourLevel: number;
  regions: Map<string, AtlasRegion>;
  /** Island keys by rank. */
  roots: string[];
  cells: Cell[];
  byKey: Map<string, Cell>;
  unitCell: Map<string, Cell>;
  units: Map<string, AtlasUnitWire>;
  geoms: Map<string, RegionGeom>;
  /**
   * Border segments by level: [0] the coast, [i] between regions that first
   * differ on level i.
   */
  edges: Segment[][];
  islands: Map<string, IslandGeom>;
  /** Median region radius per level, for semantic zoom. */
  medianRadius: number[];
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Corner i of a unit hex (pointy top), i = 0..5. */
export const CORNERS: ReadonlyArray<readonly [number, number]> = Array.from(
  { length: 6 },
  (_, i) => {
    const a = ((60 * i - 30) * Math.PI) / 180;
    return [Math.cos(a), Math.sin(a)] as const;
  },
);

/** Screen angle (y down) towards each neighbour in `DIRS`. */
const DIR_ANGLE = [0, -60, -120, 180, 120, 60].map((d) => (d * Math.PI) / 180);

function byRankThenName(
  regions: Map<string, { rank: number; name: string }>,
): (a: string, b: string) => number {
  return (a, b) => {
    const ra = regions.get(a);
    const rb = regions.get(b);
    return (
      (ra?.rank ?? 0) - (rb?.rank ?? 0) ||
      (ra?.name ?? a).localeCompare(rb?.name ?? b, "de")
    );
  };
}

export function buildAtlasLayout(view: AtlasReadResponse): AtlasLayout {
  const depth = view.lens.levels.length;
  const colourLevel = view.lens.colourLevel;

  // ── Regions ───────────────────────────────────────────────────────────────
  const regions = new Map<string, AtlasRegion>();
  for (const wire of view.regions) {
    regions.set(wire.key, {
      key: wire.key,
      name: wire.name,
      level: wire.level,
      parentKey: wire.parentKey,
      rank: wire.rank,
      hueKey: wire.hueKey,
      hue: wire.hueKey ? hueFor(wire.hueKey) : NEUTRAL_HUE,
      children: [],
      index: 0,
      pattern: null,
      provisional: wire.provisional,
      emblem: wire.emblem,
      emblemSubject: wire.emblemSubject,
    });
  }
  const order = byRankThenName(regions);
  const roots: string[] = [];
  for (const region of regions.values()) {
    const parent = region.parentKey ? regions.get(region.parentKey) : undefined;
    if (parent) parent.children.push(region.key);
    else roots.push(region.key);
  }
  roots.sort(order);
  roots.forEach((key, i) => {
    const region = regions.get(key);
    if (region) region.index = i;
  });
  for (const region of regions.values()) {
    region.children.sort(order);
    region.children.forEach((key, i) => {
      const child = regions.get(key);
      if (!child) return;
      child.index = i;
      if (child.level === colourLevel + 1) {
        const pattern = wirePattern(view, key);
        child.pattern = pattern ?? PATTERNS[i % PATTERNS.length];
      }
    });
  }

  const paths = new Map<string, string[]>();
  const pathOf = (key: string): string[] => {
    const cached = paths.get(key);
    if (cached) return cached;
    const region = regions.get(key);
    const parent = region?.parentKey;
    const path =
      parent && regions.has(parent) ? [...pathOf(parent), key] : [key];
    paths.set(key, path);
    return path;
  };

  // ── Cells ─────────────────────────────────────────────────────────────────
  const units = new Map(view.units.map((u) => [u.key, u]));
  const offsets = new Map(view.islands.map((i) => [i.key, i]));
  const cells: Cell[] = [];
  const byKey = new Map<string, Cell>();
  const unitCell = new Map<string, Cell>();
  for (const hex of view.land) {
    const offset = offsets.get(hex.island);
    const q = hex.q + (offset?.dq ?? 0);
    const r = hex.r + (offset?.dr ?? 0);
    const { x, y } = toPixel(q, r);
    const path = regions.has(hex.region) ? pathOf(hex.region) : [hex.island];
    const leaf = regions.get(path[path.length - 1]);
    const shadeRegion = regions.get(path[colourLevel + 1] ?? "");
    const shade = shadeRegion
      ? regionShade(
          shadeRegion.index,
          path.length - 1 > colourLevel + 1 ? (leaf?.index ?? 0) : null,
        )
      : BASE_SHADE;
    const unit = hex.unit ? (units.get(hex.unit) ?? null) : null;
    const cell: Cell = {
      q,
      r,
      x,
      y,
      island: hex.island,
      path,
      unit,
      hue: leaf?.hue ?? NEUTRAL_HUE,
      shade,
    };
    cells.push(cell);
    byKey.set(hexKey(q, r), cell);
    if (unit) unitCell.set(unit.key, cell);
  }

  // ── Region shapes ─────────────────────────────────────────────────────────
  const groups = new Map<string, Cell[]>();
  for (const cell of cells) {
    for (const key of cell.path) {
      const list = groups.get(key);
      if (list) list.push(cell);
      else groups.set(key, [cell]);
    }
  }
  const geoms = new Map<string, RegionGeom>();
  for (const [key, list] of groups) {
    geoms.set(key, regionGeom(key, regions.get(key)?.level ?? 0, list));
  }

  // ── Borders ───────────────────────────────────────────────────────────────
  const edges: Segment[][] = Array.from(
    { length: Math.max(1, depth) },
    () => [],
  );
  for (const cell of cells) {
    const own = hexKey(cell.q, cell.r);
    DIRS.forEach((dir, d) => {
      const other = byKey.get(hexKey(cell.q + dir.q, cell.r + dir.r));
      if (other && hexKey(other.q, other.r) < own) return;
      let level = 0;
      if (other) {
        const length = Math.max(cell.path.length, other.path.length);
        let i = 0;
        while (i < length && cell.path[i] === other.path[i]) i++;
        if (i === length) return;
        level = Math.min(i, edges.length - 1);
      }
      edges[level].push(edgeSegment(cell, d));
    });
  }

  // ── Islands ───────────────────────────────────────────────────────────────
  const islands = new Map<string, IslandGeom>();
  for (const key of roots) {
    const geom = geoms.get(key);
    if (!geom) continue;
    const x = geom.cells.reduce((s, c) => s + c.x, 0) / geom.cells.length;
    const y = geom.cells.reduce((s, c) => s + c.y, 0) / geom.cells.length;
    const radius =
      Math.max(...geom.cells.map((c) => Math.hypot(c.x - x, c.y - y))) + 1.2;
    islands.set(key, { x, y, radius, drift: offsets.get(key)?.drift ?? 0 });
  }

  const medianRadius: number[] = [];
  for (let level = 0; level < depth; level++) {
    const radii = [...geoms.values()]
      .filter((g) => g.level === level)
      .map((g) => g.radius)
      .sort((a, b) => a - b);
    medianRadius[level] = radii[Math.floor(radii.length / 2)] ?? 1;
  }

  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  return {
    view,
    depth,
    colourLevel,
    regions,
    roots: roots.filter((key) => geoms.has(key)),
    cells,
    byKey,
    unitCell,
    units,
    geoms,
    edges,
    islands,
    medianRadius,
    minX: Math.min(...xs, 0) - 1,
    minY: Math.min(...ys, 0) - 1,
    maxX: Math.max(...xs, 0) + 1,
    maxY: Math.max(...ys, 0) + 1,
  };
}

function wirePattern(view: AtlasReadResponse, key: string): PatternKind | null {
  const pattern = view.regions.find((r) => r.key === key)?.pattern;
  return pattern && (PATTERNS as readonly string[]).includes(pattern)
    ? (pattern as PatternKind)
    : null;
}

export function edgeSegment(
  cell: { x: number; y: number },
  dir: number,
): Segment {
  const a = DIR_ANGLE[dir] - Math.PI / 6;
  const b = DIR_ANGLE[dir] + Math.PI / 6;
  return [
    cell.x + Math.cos(a),
    cell.y + Math.sin(a),
    cell.x + Math.cos(b),
    cell.y + Math.sin(b),
  ];
}

/** The outline of any set of cells (for highlights). */
export function outline(
  cells: readonly Cell[],
  byKey: Map<string, Cell>,
  same: (a: Cell, b: Cell) => boolean,
): Segment[] {
  const out: Segment[] = [];
  for (const cell of cells) {
    DIRS.forEach((dir, d) => {
      const other = byKey.get(hexKey(cell.q + dir.q, cell.r + dir.r));
      if (!other || !same(cell, other)) out.push(edgeSegment(cell, d));
    });
  }
  return out;
}

function regionGeom(key: string, level: number, cells: Cell[]): RegionGeom {
  const inside = new Map(cells.map((c) => [hexKey(c.q, c.r), c]));
  // Multi-source BFS from the region's edge: the deepest cell holds the label.
  const dist = new Map<string, number>();
  let frontier: Cell[] = [];
  for (const c of cells) {
    if (DIRS.some((d) => !inside.has(hexKey(c.q + d.q, c.r + d.r)))) {
      dist.set(hexKey(c.q, c.r), 0);
      frontier.push(c);
    }
  }
  for (let step = 1; frontier.length > 0; step++) {
    const next: Cell[] = [];
    for (const c of frontier) {
      for (const d of DIRS) {
        const k = hexKey(c.q + d.q, c.r + d.r);
        const n = inside.get(k);
        if (n && !dist.has(k)) {
          dist.set(k, step);
          next.push(n);
        }
      }
    }
    frontier = next;
  }
  const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length;
  const cy = cells.reduce((s, c) => s + c.y, 0) / cells.length;
  let best = cells[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const c of cells) {
    const score =
      (dist.get(hexKey(c.q, c.r)) ?? 0) * 4 - Math.hypot(c.x - cx, c.y - cy);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  return {
    key,
    level,
    cells,
    radius: 0.91 * Math.sqrt(cells.length),
    labelX: best.x,
    labelY: best.y,
    minX: Math.min(...xs) - 1,
    minY: Math.min(...ys) - 1,
    maxX: Math.max(...xs) + 1,
    maxY: Math.max(...ys) + 1,
  };
}

// ── Questions the panels and the outline ask ───────────────────────────────

/** Region keys from the island down to `key`. */
export function regionPath(layout: AtlasLayout, key: string): string[] {
  const out: string[] = [];
  let current: string | null = key;
  while (current) {
    const region = layout.regions.get(current);
    if (!region) break;
    out.unshift(current);
    current = region.parentKey;
  }
  return out;
}

/** The learner's units in a region and below, in map order. */
export function unitsIn(layout: AtlasLayout, key: string): AtlasUnitWire[] {
  const geom = layout.geoms.get(key);
  if (!geom) return [];
  return geom.cells
    .map((c) => c.unit)
    .filter((u): u is AtlasUnitWire => u !== null);
}

/** A region's condition: the weakest of its units (`weakestCondition`). */
export function regionCondition(
  layout: AtlasLayout,
  key: string,
): AtlasConditionWire | null {
  return weakestCondition(unitsIn(layout, key).map((u) => u.condition));
}

/** The learner's own due cards in a region, its subtree included. */
export function regionDue(layout: AtlasLayout, key: string): number {
  return layout.view.own.dueByRegion[key] ?? 0;
}

/**
 * The most units a learner is offered to go through again when nothing in a
 * region is due: one question each, so a short session.
 */
export const REGION_PRACTICE_MAX_UNITS = 30;

/** Units in a region the learner has practised: what going through it again shows. */
export function practisedUnits(layout: AtlasLayout, key: string): number {
  return unitsIn(layout, key).filter(
    (u) => u.condition !== null && u.condition !== "unpractised",
  ).length;
}

/** Going through a region again is offered for small regions only. */
export function mayPractiseRegion(layout: AtlasLayout, key: string): boolean {
  const units = practisedUnits(layout, key);
  return units > 0 && units <= REGION_PRACTICE_MAX_UNITS;
}

/** The other end of a thread: a unit on this map, or a portal to the other planet. */
export type ThreadOther =
  | { kind: "unit"; unit: AtlasUnitWire }
  | { kind: "portal"; key: string; title: string; planet: AtlasPlanetWire };

export interface ThreadGroup {
  kind: AtlasThreadKindWire;
  /**
   * `out`: this unit is the dependent end (it builds on, uses, consumes the
   * interface of, or is a special case of the other); `in`: the other is. A
   * Verbindung has no direction and is always `out`.
   */
  direction: "out" | "in";
  entries: Array<{ thread: AtlasThreadWire; other: ThreadOther }>;
}

/** The other end of a thread, as the map knows it. */
export function threadOther(
  layout: AtlasLayout,
  key: string,
): ThreadOther | null {
  const unit = layout.units.get(key);
  if (unit) return { kind: "unit", unit };
  const portal = layout.view.portals?.[key];
  return portal ? { kind: "portal", key, ...portal } : null;
}

/**
 * A unit's threads by kind and direction (Decision 7), in `THREAD_KINDS`
 * order, the dependent side first. Empty groups are left out.
 */
export function unitThreads(
  layout: AtlasLayout,
  unitKey: string,
): ThreadGroup[] {
  const groups = new Map<string, ThreadGroup>();
  for (const thread of layout.view.threads) {
    if (thread.from !== unitKey && thread.to !== unitKey) continue;
    const out = thread.from === unitKey;
    const other = threadOther(layout, out ? thread.to : thread.from);
    if (!other) continue;
    const direction = out || thread.kind === "verbindung" ? "out" : "in";
    const id = `${thread.kind}:${direction}`;
    let group = groups.get(id);
    if (!group) {
      group = { kind: thread.kind, direction, entries: [] };
      groups.set(id, group);
    }
    group.entries.push({ thread, other });
  }
  const rank = (g: ThreadGroup) =>
    THREAD_KINDS.indexOf(g.kind) * 2 + (g.direction === "out" ? 0 : 1);
  return [...groups.values()].sort((a, b) => rank(a) - rank(b));
}

export interface SearchHit {
  kind: "region" | "unit";
  key: string;
  name: string;
  /** Names from the island down to the hit's parent, to tell repeated titles apart. */
  where: string[];
}

/**
 * The Sinnbild a region or unit shows (Decision 6): its own, or for a leaf
 * region without one, its first unit's. Untrusted: show it only as an image
 * (`emblemDataUrl`) and the glyph only as text.
 */
export function emblemOf(
  layout: AtlasLayout,
  kind: "region" | "unit",
  key: string,
): AtlasEmblemWire | null {
  const ref =
    kind === "region"
      ? layout.regions.get(key)?.emblem
      : layout.units.get(key)?.emblem;
  return ref ? (layout.view.emblems?.[ref] ?? null) : null;
}

/** Regions and units whose name contains every word of the query. */
export function searchAtlas(
  layout: AtlasLayout,
  query: string,
  limit = 30,
): SearchHit[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const matches = (name: string) => {
    const folded = fold(name);
    return words.every((w) => folded.includes(w));
  };
  const names = (keys: string[]) =>
    keys.map((k) => layout.regions.get(k)?.name ?? k);
  const hits: SearchHit[] = [];
  for (const region of layout.regions.values()) {
    if (!layout.geoms.has(region.key) || !matches(region.name)) continue;
    hits.push({
      kind: "region",
      key: region.key,
      name: region.name,
      where: names(regionPath(layout, region.key).slice(0, -1)),
    });
  }
  for (const unit of layout.units.values()) {
    if (!layout.unitCell.has(unit.key) || !matches(unit.title)) continue;
    hits.push({
      kind: "unit",
      key: unit.key,
      name: unit.title,
      where: names(regionPath(layout, unit.region)),
    });
  }
  // Shallow places first, then by name.
  hits.sort(
    (a, b) =>
      (a.kind === "region" ? 0 : 1) - (b.kind === "region" ? 0 : 1) ||
      a.where.length - b.where.length ||
      a.name.localeCompare(b.name, "de"),
  );
  return hits.slice(0, limit);
}

function fold(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}
