/**
 * Map geometry for one lens. Every learning unit is one hex; every island
 * (the lens's top level) is laid out on its own.
 *
 * Inside an island, units — ordered region by region, foundations first —
 * lie along a Gosper curve (a hexagonal space-filling curve). Any run of
 * consecutive hexes on it is a connected, compact patch, so every region is
 * one piece of land at every zoom level (the "GosperMap" idea of Auber et
 * al., 2013). A leaf keeps some spare land so it can grow a little.
 *
 * Islands keep their place once laid out (`Lens.islands`). A new island
 * settles next to its predecessor; when islands grow into each other they
 * drift apart, keeping their neighbours and directions.
 */
import { unitIdsIn } from "./atlas.ts";
import type { Atlas, Lens } from "./atlas.ts";

export const SQRT3 = Math.sqrt(3);

/** Pointy-top axial neighbours, and the screen angle (y down) towards each. */
export const DIRS: Array<[number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const DIR_ANGLE = [0, -60, -120, 180, 120, 60].map((d) => (d * Math.PI) / 180);

/** Space between two islands' outlines, in hex radii. */
const ISLAND_GAP = 4;

export function hexCenter(q: number, r: number): { x: number; y: number } {
  return { x: SQRT3 * (q + r / 2), y: 1.5 * r };
}

function toAxial(x: number, y: number): [number, number] {
  const r = Math.round(y / 1.5);
  return [Math.round(x / SQRT3 - r / 2), r];
}

/** Corner i of a unit hex (pointy top), i = 0..5. */
export const CORNERS: Array<[number, number]> = Array.from({ length: 6 }, (_, i) => {
  const a = ((60 * i - 30) * Math.PI) / 180;
  return [Math.cos(a), Math.sin(a)];
});

export interface Cell {
  q: number;
  r: number;
  x: number;
  y: number;
  /** null = spare land of the leaf (room to grow). */
  unit: string | null;
  /** Region ids from island to leaf. */
  path: string[];
}

export interface RegionGeom {
  id: string;
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

export interface Layout {
  depth: number;
  cells: Cell[];
  byKey: Map<string, Cell>;
  unitCell: Map<string, Cell>;
  regions: Map<string, RegionGeom>;
  /** Border segments by level: [0] coast, [2..depth] between regions that first differ on that level. */
  edges: Segment[][];
  islands: Map<string, { x: number; y: number; radius: number }>;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const key = (q: number, r: number) => `${q},${r}`;

// ── Gosper curve ────────────────────────────────────────────────────────────

const gosperCache = new Map<number, Array<[number, number]>>();

/** The hexes visited by a Gosper curve of the given order (7^order + 1 hexes). */
export function gosper(order: number): Array<[number, number]> {
  const cached = gosperCache.get(order);
  if (cached) return cached;
  // F draws one step; X and Y only expand. This form visits every hex once.
  let s = "FX";
  for (let i = 0; i < order; i += 1) s = s.replace(/[XY]/g, (c) => (c === "X" ? "X+YF++YF-FX--FXFX-YF+" : "-FX+YFYF++YF+FX--FX-Y"));
  const out: Array<[number, number]> = [[0, 0]];
  let q = 0;
  let r = 0;
  let d = 0;
  for (const ch of s) {
    if (ch === "+") d = (d + 1) % 6;
    else if (ch === "-") d = (d + 5) % 6;
    else if (ch === "F") {
      q += DIRS[d][0];
      r += DIRS[d][1];
      out.push([q, r]);
    }
  }
  gosperCache.set(order, out);
  return out;
}

/** Spare land a leaf keeps for growth. An empty leaf still gets one hex. */
export function spare(unitCount: number): number {
  return unitCount === 0 ? 1 : Math.floor(unitCount / 6);
}

interface Slot {
  unit: string | null;
  path: string[];
}

function islandSlots(lens: Lens, islandId: string): Slot[] {
  const slots: Slot[] = [];
  const walk = (id: string, path: string[]) => {
    const region = lens.regions[id];
    const here = [...path, id];
    if (region.units) {
      for (const unit of region.units) slots.push({ unit, path: here });
      for (let i = 0; i < spare(region.units.length); i += 1) slots.push({ unit: null, path: here });
      return;
    }
    for (const child of region.children) walk(child, here);
  };
  walk(islandId, []);
  return slots;
}

/** An island's hexes around its own centre, and how far it reaches. */
function islandShape(count: number): { hexes: Array<[number, number]>; radius: number } {
  let order = 1;
  while (7 ** order + 1 < count) order += 1;
  const raw = gosper(order).slice(0, Math.max(1, count));
  const pts = raw.map(([q, r]) => hexCenter(q, r));
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const [q0, r0] = toAxial(cx, cy);
  const hexes = raw.map(([q, r]) => [q - q0, r - r0] as [number, number]);
  const radius = Math.max(...hexes.map(([q, r]) => Math.hypot(hexCenter(q, r).x, hexCenter(q, r).y))) + 1.2;
  return { hexes, radius };
}

// ── Islands: settle and drift ───────────────────────────────────────────────

/**
 * Give every island a place. Islands that have one keep it unless a
 * neighbour grew into them — then they drift apart just enough. Returns
 * whether anything moved (so the caller saves).
 */
export function settleIslands(lens: Lens): boolean {
  const before = JSON.stringify(lens.islands);
  for (const id of Object.keys(lens.islands)) if (!lens.roots.includes(id)) delete lens.islands[id];
  const radius = new Map(lens.roots.map((id) => [id, islandShape(islandSlots(lens, id).length).radius]));
  const pos = new Map<string, { x: number; y: number }>();
  for (const id of lens.roots) {
    const at = lens.islands[id];
    if (at) pos.set(id, hexCenter(at.q, at.r));
  }
  const free = (x: number, y: number, r: number) =>
    [...pos.entries()].every(([other, p]) => Math.hypot(p.x - x, p.y - y) >= r + (radius.get(other) ?? 0) + ISLAND_GAP);
  // New islands go in reading order: right of their predecessor, a new row
  // below the row's first island once a row is full.
  const perRow = Math.max(2, Math.ceil(Math.sqrt(lens.roots.length)));
  lens.roots.forEach((id, index) => {
    if (pos.has(id)) return;
    const r = radius.get(id) ?? 1;
    if (pos.size === 0) {
      pos.set(id, { x: 0, y: 0 });
      return;
    }
    const prevId = lens.roots[index - 1];
    const prev = pos.get(prevId ?? "");
    const rowStartId = lens.roots[index - (index % perRow)];
    const rowAbove = lens.roots[index - perRow];
    let target: { x: number; y: number };
    if (index % perRow === 0 && pos.has(rowAbove ?? "")) {
      const above = pos.get(rowAbove) as { x: number; y: number };
      target = { x: above.x, y: above.y + (radius.get(rowAbove) ?? 0) + r + ISLAND_GAP };
    } else if (prev) {
      target = { x: prev.x + (radius.get(prevId) ?? 0) + r + ISLAND_GAP, y: prev.y };
    } else {
      target = pos.get(rowStartId) ?? { x: 0, y: 0 };
    }
    // The free spot nearest the target.
    for (let d = 0; d < 2000; d += 1.5) {
      let best: { x: number; y: number } | null = null;
      let bestD = Infinity;
      for (let a = 0; a < 360; a += 15) {
        const x = target.x + d * Math.cos((a * Math.PI) / 180);
        const y = target.y + d * Math.sin((a * Math.PI) / 180);
        if (!free(x, y, r)) continue;
        const dd = Math.hypot(x - target.x, y - target.y);
        if (dd < bestD) {
          bestD = dd;
          best = { x, y };
        }
      }
      if (best) {
        pos.set(id, best);
        return;
      }
    }
  });
  // Drift: push overlapping islands apart along the line between them.
  const ids = [...pos.keys()];
  for (let iter = 0; iter < 80; iter += 1) {
    let moved = false;
    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = pos.get(ids[i]) as { x: number; y: number };
        const b = pos.get(ids[j]) as { x: number; y: number };
        const min = (radius.get(ids[i]) ?? 0) + (radius.get(ids[j]) ?? 0) + ISLAND_GAP;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d >= min) continue;
        if (d < 1e-6) {
          dx = Math.cos(j);
          dy = Math.sin(j);
          d = 1;
        }
        const push = (min - d) / 2 + 0.05;
        a.x -= (dx / d) * push;
        a.y -= (dy / d) * push;
        b.x += (dx / d) * push;
        b.y += (dy / d) * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  for (const [id, p] of pos) {
    const [q, r] = toAxial(p.x, p.y);
    lens.islands[id] = { q, r };
  }
  return JSON.stringify(lens.islands) !== before;
}

/** Settle the islands of every lens on every planet; true if any moved. */
export function settleAll(atlas: Atlas): boolean {
  let moved = false;
  for (const planet of Object.values(atlas.planets)) for (const lens of planet.lenses) moved = settleIslands(lens) || moved;
  return moved;
}

// ── Layout ──────────────────────────────────────────────────────────────────

export function layoutLens(lens: Lens): Layout {
  if (lens.roots.some((id) => !lens.islands[id])) settleIslands(lens);
  const depth = lens.levels.length;
  const cells: Cell[] = [];
  const byKey = new Map<string, Cell>();
  const unitCell = new Map<string, Cell>();
  const islands = new Map<string, { x: number; y: number; radius: number }>();
  for (const islandId of lens.roots) {
    const slots = islandSlots(lens, islandId);
    if (slots.length === 0) continue;
    const { hexes, radius } = islandShape(slots.length);
    const at = lens.islands[islandId] ?? { q: 0, r: 0 };
    const center = hexCenter(at.q, at.r);
    islands.set(islandId, { x: center.x, y: center.y, radius });
    hexes.forEach(([hq, hr], j) => {
      const q = hq + at.q;
      const r = hr + at.r;
      const { x, y } = hexCenter(q, r);
      const cell: Cell = { q, r, x, y, unit: slots[j].unit, path: slots[j].path };
      cells.push(cell);
      byKey.set(key(q, r), cell);
      if (cell.unit) unitCell.set(cell.unit, cell);
    });
  }

  const groups = new Map<string, Cell[]>();
  for (const cell of cells) {
    for (const id of cell.path) {
      const list = groups.get(id);
      if (list) list.push(cell);
      else groups.set(id, [cell]);
    }
  }
  const regions = new Map<string, RegionGeom>();
  for (const [id, list] of groups) regions.set(id, regionGeom(id, lens.regions[id].level, list));

  const edges: Segment[][] = Array.from({ length: depth + 1 }, () => []);
  for (const cell of cells) {
    DIRS.forEach(([dq, dr], d) => {
      const other = byKey.get(key(cell.q + dq, cell.r + dr));
      if (other && key(other.q, other.r) < key(cell.q, cell.r)) return;
      let level = 0;
      if (other) {
        const i = cell.path.findIndex((id, n) => other.path[n] !== id);
        if (i < 0) return;
        level = i === 0 ? 0 : i + 1;
      }
      edges[level].push(edgeSegment(cell, d));
    });
  }

  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  return {
    depth,
    cells,
    byKey,
    unitCell,
    regions,
    edges,
    islands,
    minX: Math.min(...xs, 0) - 1,
    minY: Math.min(...ys, 0) - 1,
    maxX: Math.max(...xs, 0) + 1,
    maxY: Math.max(...ys, 0) + 1,
  };
}

export function edgeSegment(cell: Cell, dir: number): Segment {
  const a = DIR_ANGLE[dir] - Math.PI / 6;
  const b = DIR_ANGLE[dir] + Math.PI / 6;
  return [cell.x + Math.cos(a), cell.y + Math.sin(a), cell.x + Math.cos(b), cell.y + Math.sin(b)];
}

/** The outline of any set of cells (for highlights). */
export function outline(cells: Cell[], byKey: Map<string, Cell>, same: (a: Cell, b: Cell) => boolean): Segment[] {
  const out: Segment[] = [];
  for (const cell of cells) {
    DIRS.forEach(([dq, dr], d) => {
      const other = byKey.get(key(cell.q + dq, cell.r + dr));
      if (!other || !same(cell, other)) out.push(edgeSegment(cell, d));
    });
  }
  return out;
}

function regionGeom(id: string, level: number, cells: Cell[]): RegionGeom {
  const inside = new Set(cells.map((c) => key(c.q, c.r)));
  // Multi-source BFS from the region's edge cells: the deepest cell holds the label.
  const dist = new Map<string, number>();
  let frontier: Cell[] = [];
  for (const c of cells) {
    if (DIRS.some(([dq, dr]) => !inside.has(key(c.q + dq, c.r + dr)))) {
      dist.set(key(c.q, c.r), 0);
      frontier.push(c);
    }
  }
  const byKey = new Map(cells.map((c) => [key(c.q, c.r), c]));
  for (let depth = 1; frontier.length > 0; depth += 1) {
    const next: Cell[] = [];
    for (const c of frontier) {
      for (const [dq, dr] of DIRS) {
        const k = key(c.q + dq, c.r + dr);
        const n = byKey.get(k);
        if (n && !dist.has(k)) {
          dist.set(k, depth);
          next.push(n);
        }
      }
    }
    frontier = next;
  }
  const cx = cells.reduce((s, c) => s + c.x, 0) / cells.length;
  const cy = cells.reduce((s, c) => s + c.y, 0) / cells.length;
  let best = cells[0];
  let bestScore = -Infinity;
  for (const c of cells) {
    const score = (dist.get(key(c.q, c.r)) ?? 0) * 4 - Math.hypot(c.x - cx, c.y - cy);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  return {
    id,
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

/** How many units a region holds (for panels). */
export function unitCount(lens: Lens, regionId: string): number {
  return unitIdsIn(lens, regionId).length;
}
