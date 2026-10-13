/**
 * Stored land of a lens (ADR 2026-10-13, Decision 8): every unit gets its hex
 * once, and nothing that holds a unit ever moves inside its island.
 *
 * - **Founding.** A new island lays its regions out along a Gosper curve, in
 *   reading order, each leaf followed by reserved land. It is centred once.
 * - **Growth.** A new unit takes its region's reserved land, else the nearest
 *   free coast next to the region (or its nearest ancestor). The curve is never
 *   run again for an existing island.
 * - **The sea.** Islands sit around a fixed anchor, the first island's origin.
 *   A new island takes the first free spot near the constellation. When growth
 *   cannot keep the gap to a neighbour, the outer island drifts outward along
 *   its bearing from the anchor, by at most `MAX_DRIFT_PER_SETTLE` hexes per
 *   settle, so every island keeps its direction.
 * - A unit that left its region frees its hex as reserved land of that region.
 *
 * Pure and deterministic: the same rows in give the same land out.
 */

import {
  fromPixel,
  gosper,
  gosperOrderFor,
  type Hex,
  hexDistance,
  hexKey,
  neighbours,
  type Point,
  toPixel,
} from "./hex.js";
import type { DerivedPlacement } from "./lenses.js";
import type { UnitKey } from "./types.js";

/** Space kept between two islands' outlines, in hex radii. */
export const ISLAND_GAP = 4;
/** How far one settle may move an island, in hex steps. */
export const MAX_DRIFT_PER_SETTLE = 3;

/**
 * Reserved land a leaf keeps after its units when its island is founded: one
 * hex for every six units, at least one. Most Themen hold one or two units,
 * so a larger minimum would leave half the map empty; growth beyond the
 * reserve takes coast.
 */
export function reserveFor(unitCount: number): number {
  return Math.max(1, Math.ceil(unitCount / 6));
}

export interface LandHex {
  /** Island (top-level region) key. */
  island: string;
  /** Island-local axial coordinates. */
  q: number;
  r: number;
  /** The leaf region that owns this hex. */
  region: string;
  /** Null: reserved land of `region`. */
  unit: UnitKey | null;
}

export interface IslandPlace {
  island: string;
  /** Offset of the island's origin on the sea. */
  dq: number;
  dr: number;
  /** Offset at founding; total drift is the distance to (dq, dr). */
  foundedDq: number;
  foundedDr: number;
}

export interface LandState {
  islands: IslandPlace[];
  land: LandHex[];
}

/** A region's place in its lens tree, for reading order and ancestors. */
export interface RegionInfo {
  key: string;
  parentKey: string | null;
  rank: number;
}

export interface PlanSettleInput {
  /** Where every unit of the library sits in this lens. */
  placements: DerivedPlacement[];
  /** Stored regions; regions only the placements name are added from them. */
  regions: RegionInfo[];
  state: LandState;
}

export interface SettlePlan {
  /** Islands that are new or moved. */
  islands: IslandPlace[];
  /** Land hexes that are new, or whose unit or region changed. */
  land: LandHex[];
  /** The whole state after the plan. */
  next: LandState;
}

/** Total drift of an island since it was founded, in hex steps. */
export function islandDrift(island: IslandPlace): number {
  return hexDistance(
    { q: island.dq, r: island.dr },
    { q: island.foundedDq, r: island.foundedDr },
  );
}

/** One of eight 45° sectors, seen from the anchor; -1 at the anchor itself. */
export function octantOf(p: Point): number {
  if (Math.hypot(p.x, p.y) < 1e-6) return -1;
  const angle = (Math.atan2(p.y, p.x) + 2 * Math.PI) % (2 * Math.PI);
  return Math.floor(angle / (Math.PI / 4)) % 8;
}

const byNumericKey = (a: string, b: string) =>
  a.localeCompare(b, "en", { numeric: true });

function islandCentre(place: IslandPlace): Point {
  return toPixel(place.dq, place.dr);
}

/** Reach of an island's land from its origin, in world units. */
function islandRadius(hexes: Iterable<LandHex>): number {
  let max = 0;
  for (const hex of hexes) {
    const p = toPixel(hex.q, hex.r);
    max = Math.max(max, Math.hypot(p.x, p.y));
  }
  return max + 1;
}

function centroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  return { x, y };
}

const sameHex = (a: LandHex, b: LandHex) =>
  a.island === b.island &&
  a.q === b.q &&
  a.r === b.r &&
  a.region === b.region &&
  a.unit === b.unit;

export function planSettle(input: PlanSettleInput): SettlePlan {
  // ── The tree: stored regions plus whatever the placements name ────────────
  const info = new Map<string, RegionInfo>();
  for (const region of input.regions) info.set(region.key, region);
  for (const placement of input.placements) {
    placement.path.forEach((step, i) => {
      if (!info.has(step.key)) {
        info.set(step.key, {
          key: step.key,
          parentKey: i > 0 ? placement.path[i - 1].key : null,
          rank: step.rank,
        });
      }
    });
  }
  const order = (a: string, b: string) =>
    (info.get(a)?.rank ?? 0) - (info.get(b)?.rank ?? 0) || byNumericKey(a, b);
  const ancestors = (key: string): string[] => {
    const out: string[] = [];
    let current = info.get(key)?.parentKey ?? null;
    while (current && !out.includes(current)) {
      out.push(current);
      current = info.get(current)?.parentKey ?? null;
    }
    return out;
  };

  // ── Desired places ─────────────────────────────────────────────────────────
  const desired = new Map<UnitKey, { island: string; leaf: string }>();
  for (const placement of input.placements) {
    const path = placement.path;
    if (path.length === 0) continue;
    desired.set(placement.unitKey, {
      island: path[0].key,
      leaf: path[path.length - 1].key,
    });
  }

  // ── Working copies ─────────────────────────────────────────────────────────
  const islands = new Map<string, IslandPlace>(
    input.state.islands.map((i) => [i.island, { ...i }]),
  );
  const land = new Map<string, Map<string, LandHex>>();
  for (const hex of input.state.land) {
    let hexes = land.get(hex.island);
    if (!hexes) {
      hexes = new Map();
      land.set(hex.island, hexes);
    }
    hexes.set(hexKey(hex.q, hex.r), { ...hex });
  }

  // A unit that left its region (or the library) frees its hex as reserve.
  const placed = new Set<UnitKey>();
  for (const hexes of land.values()) {
    for (const hex of hexes.values()) {
      if (!hex.unit) continue;
      const want = desired.get(hex.unit);
      if (!want || want.island !== hex.island || want.leaf !== hex.region) {
        hex.unit = null;
      } else if (placed.has(hex.unit)) {
        hex.unit = null; // never two hexes for one unit
      } else {
        placed.add(hex.unit);
      }
    }
  }

  // Units still without land, by island, in a stable order.
  const waiting = new Map<string, Map<string, UnitKey[]>>();
  for (const [unit, want] of [...desired.entries()].sort(([a], [b]) =>
    byNumericKey(a, b),
  )) {
    if (placed.has(unit)) continue;
    let leaves = waiting.get(want.island);
    if (!leaves) {
      leaves = new Map();
      waiting.set(want.island, leaves);
    }
    const list = leaves.get(want.leaf) ?? [];
    list.push(unit);
    leaves.set(want.leaf, list);
  }

  const islandOrder = [...waiting.keys()].sort(order);
  const radii = new Map<string, number>();
  const radius = (island: string) => {
    let r = radii.get(island);
    if (r === undefined) {
      r = islandRadius(land.get(island)?.values() ?? []);
      radii.set(island, r);
    }
    return r;
  };
  const children = new Map<string, string[]>();
  for (const region of info.values()) {
    if (!region.parentKey) continue;
    const list = children.get(region.parentKey) ?? [];
    list.push(region.key);
    children.set(region.parentKey, list);
  }
  for (const list of children.values()) list.sort(order);

  // ── Found new islands ──────────────────────────────────────────────────────
  const founded: string[] = [];
  for (const island of islandOrder) {
    if ((land.get(island)?.size ?? 0) > 0) continue;
    const leaves = waiting.get(island) as Map<string, UnitKey[]>;
    // Regions on the way to a waiting leaf; the walk visits only those.
    const onTheWay = new Set<string>();
    for (const leaf of leaves.keys()) {
      onTheWay.add(leaf);
      for (const ancestor of ancestors(leaf)) onTheWay.add(ancestor);
    }
    const slots: Array<{ region: string; unit: UnitKey | null }> = [];
    const walk = (key: string) => {
      const units = leaves.get(key);
      if (units) {
        for (const unit of units) slots.push({ region: key, unit });
        for (let i = 0; i < reserveFor(units.length); i++) {
          slots.push({ region: key, unit: null });
        }
      }
      for (const child of children.get(key) ?? []) {
        if (onTheWay.has(child)) walk(child);
      }
    };
    walk(island);
    // Leaves the tree walk could not reach (a broken parent chain) still land.
    for (const [leaf, units] of [...leaves.entries()].sort(([a], [b]) =>
      order(a, b),
    )) {
      if (slots.some((s) => s.region === leaf)) continue;
      for (const unit of units) slots.push({ region: leaf, unit });
    }

    const curve = gosper(gosperOrderFor(slots.length)).slice(0, slots.length);
    const middle = centroid(curve.map((h) => toPixel(h.q, h.r)));
    const origin = fromPixel(middle.x, middle.y);
    const hexes = new Map<string, LandHex>();
    curve.forEach((h, i) => {
      const q = h.q - origin.q;
      const r = h.r - origin.r;
      hexes.set(hexKey(q, r), {
        island,
        q,
        r,
        region: slots[i].region,
        unit: slots[i].unit,
      });
    });
    land.set(island, hexes);
    radii.delete(island);
    waiting.delete(island);
    founded.push(island);
  }
  // Land without a place on the sea (an interrupted earlier settle) gets one too.
  for (const island of [...land.keys()].sort(order)) {
    if (!islands.has(island) && !founded.includes(island)) founded.push(island);
  }

  // ── Grow existing islands ──────────────────────────────────────────────────
  const gapOk = (island: string, world: Point): boolean => {
    for (const [other, place] of islands) {
      if (other === island) continue;
      const c = islandCentre(place);
      if (
        Math.hypot(world.x - c.x, world.y - c.y) <
        radius(other) + ISLAND_GAP
      ) {
        return false;
      }
    }
    return true;
  };

  for (const island of islandOrder) {
    const leaves = waiting.get(island);
    if (!leaves) continue;
    const hexes = land.get(island) as Map<string, LandHex>;
    const place = islands.get(island);
    for (const leaf of [...leaves.keys()].sort(order)) {
      for (const unit of leaves.get(leaf) as UnitKey[]) {
        const own = [...hexes.values()].filter((h) => h.region === leaf);
        const free = own.filter((h) => h.unit === null);
        if (free.length > 0) {
          const mid = centroid(own.map((h) => toPixel(h.q, h.r)));
          free.sort(
            (a, b) =>
              distanceTo(a, mid) - distanceTo(b, mid) || a.q - b.q || a.r - b.r,
          );
          free[0].unit = unit;
          continue;
        }
        // Coast next to the region, else next to its nearest ancestor's land.
        let base = own;
        for (const ancestor of ancestors(leaf)) {
          if (base.length > 0) break;
          base = [...hexes.values()].filter(
            (h) =>
              h.region === ancestor || ancestors(h.region).includes(ancestor),
          );
        }
        if (base.length === 0) base = [...hexes.values()];
        const mid = centroid(base.map((h) => toPixel(h.q, h.r)));
        const coast = new Map<string, Hex>();
        for (const h of base) {
          for (const n of neighbours(h)) {
            const k = hexKey(n.q, n.r);
            if (!hexes.has(k)) coast.set(k, n);
          }
        }
        const offset = place ? { q: place.dq, r: place.dr } : { q: 0, r: 0 };
        const candidates = [...coast.values()].map((h) => {
          const world = toPixel(h.q + offset.q, h.r + offset.r);
          return { h, ok: gapOk(island, world), d: distanceTo(h, mid) };
        });
        candidates.sort(
          (a, b) =>
            Number(b.ok) - Number(a.ok) ||
            a.d - b.d ||
            a.h.q - b.h.q ||
            a.h.r - b.h.r,
        );
        const pick = candidates[0].h;
        hexes.set(hexKey(pick.q, pick.r), {
          island,
          q: pick.q,
          r: pick.r,
          region: leaf,
          unit,
        });
        radii.delete(island);
      }
    }
  }

  // ── Place founded islands on the sea ───────────────────────────────────────
  for (const island of founded) {
    const r = radius(island);
    const placedCentres = [...islands.entries()].map(([key, p]) => ({
      c: islandCentre(p),
      r: radius(key),
    }));
    let spot: Hex = { q: 0, r: 0 };
    if (placedCentres.length > 0) {
      const middle = centroid(placedCentres.map((p) => p.c));
      const free = (p: Point) =>
        placedCentres.every(
          (o) => Math.hypot(p.x - o.c.x, p.y - o.c.y) >= r + o.r + ISLAND_GAP,
        );
      search: for (let d = 0; d < 5000; d += 1.5) {
        for (let a = 0; a < 360; a += 15) {
          const rad = (a * Math.PI) / 180;
          const target = {
            x: middle.x + d * Math.cos(rad),
            y: middle.y + d * Math.sin(rad),
          };
          if (!free(target)) continue;
          const hex = fromPixel(target.x, target.y);
          if (!free(toPixel(hex.q, hex.r))) continue;
          spot = hex;
          break search;
        }
      }
    }
    islands.set(island, {
      island,
      dq: spot.q,
      dr: spot.r,
      foundedDq: spot.q,
      foundedDr: spot.r,
    });
  }

  // ── Drift: outward along the bearing, capped per settle ───────────────────
  const budget = new Map<string, number>();
  const readingOrder = [...islands.keys()].sort(order);
  for (let pass = 0; pass < readingOrder.length * 2; pass++) {
    let moved = false;
    for (let i = 0; i < readingOrder.length; i++) {
      for (let j = i + 1; j < readingOrder.length; j++) {
        const a = readingOrder[i];
        const b = readingOrder[j];
        const pa = islands.get(a) as IslandPlace;
        const pb = islands.get(b) as IslandPlace;
        const ca = islandCentre(pa);
        const cb = islandCentre(pb);
        const min = radius(a) + radius(b) + ISLAND_GAP;
        if (Math.hypot(cb.x - ca.x, cb.y - ca.y) >= min - 1e-9) continue;
        // The island farther from the anchor moves; a tie moves the later one.
        const da = Math.hypot(ca.x, ca.y);
        const db = Math.hypot(cb.x, cb.y);
        const [outer, inner] = da > db + 1e-9 ? [a, b] : [b, a];
        const left = MAX_DRIFT_PER_SETTLE - (budget.get(outer) ?? 0);
        if (left <= 0) continue;
        const po = islands.get(outer) as IslandPlace;
        const co = islandCentre(po);
        const ci = islandCentre(islands.get(inner) as IslandPlace);
        const length = Math.hypot(co.x, co.y);
        const u =
          length > 1e-6
            ? { x: co.x / length, y: co.y / length }
            : unit(co.x - ci.x, co.y - ci.y);
        const moveTo = driftTarget(co, u, ci, min, left);
        const before = octantOf(co);
        const options = [moveTo, ...neighbours(moveTo)]
          .filter((h) => before < 0 || octantOf(toPixel(h.q, h.r)) === before)
          .filter((h) => hexDistance(h, { q: po.dq, r: po.dr }) <= left)
          .sort((x, y) => {
            const px = toPixel(x.q, x.r);
            const py = toPixel(y.q, y.r);
            const gx = Math.hypot(px.x - ci.x, px.y - ci.y) >= min - 1e-9;
            const gy = Math.hypot(py.x - ci.x, py.y - ci.y) >= min - 1e-9;
            return (
              Number(gy) - Number(gx) ||
              hexDistance(x, { q: po.dq, r: po.dr }) -
                hexDistance(y, { q: po.dq, r: po.dr }) ||
              x.q - y.q ||
              x.r - y.r
            );
          });
        const next = options[0];
        if (!next || (next.q === po.dq && next.r === po.dr)) continue;
        budget.set(
          outer,
          (budget.get(outer) ?? 0) + hexDistance(next, { q: po.dq, r: po.dr }),
        );
        po.dq = next.q;
        po.dr = next.r;
        moved = true;
      }
    }
    if (!moved) break;
  }

  // ── The plan: what differs from the state we were given ────────────────────
  const before = new Map(
    input.state.land.map((h) => [`${h.island}|${hexKey(h.q, h.r)}`, h]),
  );
  const nextLand: LandHex[] = [];
  const changedLand: LandHex[] = [];
  for (const island of [...land.keys()].sort(order)) {
    const hexes = [...(land.get(island) as Map<string, LandHex>).values()].sort(
      (a, b) => a.q - b.q || a.r - b.r,
    );
    for (const hex of hexes) {
      nextLand.push(hex);
      const old = before.get(`${hex.island}|${hexKey(hex.q, hex.r)}`);
      if (!old || !sameHex(old, hex)) changedLand.push(hex);
    }
  }
  const oldIslands = new Map(input.state.islands.map((i) => [i.island, i]));
  const nextIslands = [...islands.values()].sort((a, b) =>
    order(a.island, b.island),
  );
  const changedIslands = nextIslands.filter((i) => {
    const old = oldIslands.get(i.island);
    return !old || old.dq !== i.dq || old.dr !== i.dr;
  });
  return {
    islands: changedIslands,
    land: changedLand,
    next: { islands: nextIslands, land: nextLand },
  };
}

function distanceTo(hex: Hex, p: Point): number {
  const c = toPixel(hex.q, hex.r);
  return Math.hypot(c.x - p.x, c.y - p.y);
}

function unit(x: number, y: number): Point {
  const length = Math.hypot(x, y);
  return length > 1e-9 ? { x: x / length, y: y / length } : { x: 1, y: 0 };
}

/**
 * The hex nearest the smallest outward move that restores the gap, or the
 * move by the whole budget when it cannot.
 */
function driftTarget(
  from: Point,
  u: Point,
  inner: Point,
  min: number,
  budget: number,
): Hex {
  // One hex step is √3 world units along a row.
  const maxStep = budget * Math.sqrt(3);
  const at = (s: number) => ({ x: from.x + u.x * s, y: from.y + u.y * s });
  const enough = (s: number) => {
    const p = at(s);
    return Math.hypot(p.x - inner.x, p.y - inner.y) >= min;
  };
  let step = maxStep;
  if (enough(maxStep)) {
    let lo = 0;
    let hi = maxStep;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (enough(mid)) hi = mid;
      else lo = mid;
    }
    step = hi;
  }
  const p = at(step);
  return fromPixel(p.x, p.y);
}
