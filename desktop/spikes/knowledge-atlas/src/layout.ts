/**
 * Map geometry. Every Begriff is one hex. Each Bereich becomes an island:
 * its Begriffe — ordered Fach › Gebiet › Thema, foundations first — are
 * laid along a Gosper curve (a hexagonal space-filling curve). Any run of
 * consecutive hexes on that curve is a connected, compact patch, so every
 * Fach, Gebiet and Thema gets one contiguous piece of land at every zoom
 * level (the "GosperMap" idea of Auber et al., 2013).
 *
 * Positions are a pure function of the order, so the map only shifts where
 * the order changes. A Thema keeps some spare land so it can grow a little
 * without pushing its neighbours.
 */
import type { Atlas, Level } from "./atlas.ts";

export const SQRT3 = Math.sqrt(3);

/** Pointy-top axial neighbours, and the screen angle (y down) towards each. */
export const DIRS: Array<[number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const DIR_ANGLE = [0, -60, -120, 180, 120, 60].map((d) => (d * Math.PI) / 180);

export function hexCenter(q: number, r: number): { x: number; y: number } {
  return { x: SQRT3 * (q + r / 2), y: 1.5 * r };
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
  /** null = spare land of the Thema (room to grow). */
  concept: string | null;
  topic: string;
  area: string;
  subject: string;
  continent: string;
}

export interface RegionGeom {
  id: string;
  level: Level;
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
  cells: Cell[];
  byKey: Map<string, Cell>;
  conceptCell: Map<string, Cell>;
  regions: Map<string, RegionGeom>;
  /** Border segments: coast, between Fächer, Gebiete and Themen. */
  edges: { coast: Segment[]; subject: Segment[]; area: Segment[]; topic: Segment[] };
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

function curve(length: number): Array<[number, number]> {
  let order = 1;
  while (7 ** order + 1 < length) order += 1;
  return gosper(order).slice(0, length);
}

/** Spare land a Thema keeps for growth. An empty Thema still gets one hex. */
export function spare(conceptCount: number): number {
  return conceptCount === 0 ? 1 : Math.floor(conceptCount / 6);
}

// ── Layout ──────────────────────────────────────────────────────────────────

interface Slot {
  concept: string | null;
  topic: string;
  area: string;
  subject: string;
  continent: string;
}

export function layoutAtlas(atlas: Atlas): Layout {
  const islands: Array<{ slots: Slot[]; hexes: Array<[number, number]> }> = [];
  for (const continentId of atlas.roots) {
    const slots: Slot[] = [];
    for (const subjectId of atlas.regions[continentId].children) {
      for (const areaId of atlas.regions[subjectId].children) {
        for (const topicId of atlas.regions[areaId].children) {
          const concepts = atlas.regions[topicId].concepts ?? [];
          const base = { topic: topicId, area: areaId, subject: subjectId, continent: continentId };
          for (const concept of concepts) slots.push({ ...base, concept });
          for (let i = 0; i < spare(concepts.length); i += 1) slots.push({ ...base, concept: null });
        }
      }
    }
    if (slots.length > 0) islands.push({ slots, hexes: curve(slots.length) });
  }

  // Arrange the islands two by two, each centred in its grid cell.
  const boxes = islands.map(({ hexes }) => {
    const pts = hexes.map(([q, r]) => hexCenter(q, r));
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    return { minX: Math.min(...xs) - 1, maxX: Math.max(...xs) + 1, minY: Math.min(...ys) - 1, maxY: Math.max(...ys) + 1 };
  });
  const cols = islands.length <= 1 ? 1 : 2;
  const gap = 9;
  const colW = [0, 0];
  const rowH: number[] = [];
  boxes.forEach((b, i) => {
    const c = i % cols;
    const row = Math.floor(i / cols);
    colW[c] = Math.max(colW[c], b.maxX - b.minX);
    rowH[row] = Math.max(rowH[row] ?? 0, b.maxY - b.minY);
  });

  const cells: Cell[] = [];
  const byKey = new Map<string, Cell>();
  const conceptCell = new Map<string, Cell>();
  islands.forEach(({ slots, hexes }, i) => {
    const b = boxes[i];
    const c = i % cols;
    const row = Math.floor(i / cols);
    const cellX = c === 0 ? 0 : colW[0] + gap;
    const cellY = rowH.slice(0, row).reduce((s, h) => s + h + gap, 0);
    const wantX = cellX + (colW[c] - (b.maxX - b.minX)) / 2 - b.minX;
    const wantY = cellY + (rowH[row] - (b.maxY - b.minY)) / 2 - b.minY;
    // Snap the offset onto the hex lattice so every island shares one grid.
    const dr = Math.round(wantY / 1.5);
    const dq = Math.round(wantX / SQRT3 - dr / 2);
    hexes.forEach(([hq, hr], j) => {
      const q = hq + dq;
      const r = hr + dr;
      const { x, y } = hexCenter(q, r);
      const cell: Cell = { q, r, x, y, ...slots[j] };
      cells.push(cell);
      byKey.set(key(q, r), cell);
      if (cell.concept) conceptCell.set(cell.concept, cell);
    });
  });

  const regions = new Map<string, RegionGeom>();
  const groups = new Map<string, Cell[]>();
  for (const cell of cells) {
    for (const id of [cell.continent, cell.subject, cell.area, cell.topic]) {
      const list = groups.get(id);
      if (list) list.push(cell);
      else groups.set(id, [cell]);
    }
  }
  for (const [id, list] of groups) regions.set(id, regionGeom(id, atlas.regions[id].level, list));

  const edges: Layout["edges"] = { coast: [], subject: [], area: [], topic: [] };
  for (const cell of cells) {
    DIRS.forEach(([dq, dr], d) => {
      const other = byKey.get(key(cell.q + dq, cell.r + dr));
      const list = !other
        ? edges.coast
        : other.subject !== cell.subject
          ? edges.subject
          : other.area !== cell.area
            ? edges.area
            : other.topic !== cell.topic
              ? edges.topic
              : null;
      // Each inner edge once: only from the cell that sorts first.
      if (!list || (other && key(other.q, other.r) < key(cell.q, cell.r))) return;
      list.push(edgeSegment(cell, d));
    });
  }

  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  return {
    cells,
    byKey,
    conceptCell,
    regions,
    edges,
    minX: Math.min(...xs) - 1,
    minY: Math.min(...ys) - 1,
    maxX: Math.max(...xs) + 1,
    maxY: Math.max(...ys) + 1,
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

function regionGeom(id: string, level: Level, cells: Cell[]): RegionGeom {
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
