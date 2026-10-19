/**
 * Hex geometry for the knowledge atlas (ADR 2026-10-13, Decision 8): axial
 * coordinates, pointy-top hexes of radius 1, and the Gosper curve that lays
 * out a new island.
 *
 * Pure: no database, no Node built-ins. The Studio and Mobile draw with it.
 */

export interface Hex {
  q: number;
  r: number;
}

export interface Point {
  x: number;
  y: number;
}

export const SQRT3 = Math.sqrt(3);

/** Pointy-top axial neighbours, counter-clockwise from east. */
export const DIRS: readonly Hex[] = Object.freeze([
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
]);

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function neighbours(hex: Hex): Hex[] {
  return DIRS.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

/** Steps between two hexes. */
export function hexDistance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** The hexes exactly `radius` steps from `center`, in a fixed order. */
export function ring(center: Hex, radius: number): Hex[] {
  if (radius === 0) return [{ ...center }];
  const out: Hex[] = [];
  let hex = {
    q: center.q + DIRS[4].q * radius,
    r: center.r + DIRS[4].r * radius,
  };
  for (let side = 0; side < 6; side++) {
    for (let step = 0; step < radius; step++) {
      out.push(hex);
      hex = { q: hex.q + DIRS[side].q, r: hex.r + DIRS[side].r };
    }
  }
  return out;
}

/** Centre of a hex in world units (y down). */
export function toPixel(q: number, r: number): Point {
  return { x: SQRT3 * (q + r / 2), y: 1.5 * r };
}

/** The hex containing a world point (cube rounding). */
export function fromPixel(x: number, y: number): Hex {
  const qf = (SQRT3 / 3) * x - y / 3;
  const rf = (2 / 3) * y;
  const sf = -qf - rf;
  let q = Math.round(qf);
  let r = Math.round(rf);
  const s = Math.round(sf);
  const dq = Math.abs(q - qf);
  const dr = Math.abs(r - rf);
  const ds = Math.abs(s - sf);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  // Normalise -0 so keys and equality stay stable.
  return { q: q + 0, r: r + 0 };
}

const gosperCache = new Map<number, readonly Hex[]>();

/**
 * The hexes a Gosper curve of this order visits, 7^order + 1 of them, each
 * once. Any run of consecutive hexes is one connected patch, so regions laid
 * along it stay whole at every zoom level.
 *
 * L-system: axiom FX, X → X+YF++YF-FX--FXFX-YF+, Y → -FX+YFYF++YF+FX--FX-Y,
 * turns of 60°. The AB form of the curve revisits hexes from order 3 on.
 */
export function gosper(order: number): readonly Hex[] {
  const cached = gosperCache.get(order);
  if (cached) return cached;
  let program = "FX";
  for (let i = 0; i < order; i++) {
    program = program.replace(/[XY]/g, (c) =>
      c === "X" ? "X+YF++YF-FX--FXFX-YF+" : "-FX+YFYF++YF+FX--FX-Y",
    );
  }
  const out: Hex[] = [{ q: 0, r: 0 }];
  let q = 0;
  let r = 0;
  let d = 0;
  for (const ch of program) {
    if (ch === "+") d = (d + 1) % 6;
    else if (ch === "-") d = (d + 5) % 6;
    else if (ch === "F") {
      q += DIRS[d].q;
      r += DIRS[d].r;
      out.push({ q, r });
    }
  }
  const frozen = Object.freeze(out);
  gosperCache.set(order, frozen);
  return frozen;
}

/** Smallest Gosper order whose curve holds `count` hexes. */
export function gosperOrderFor(count: number): number {
  let order = 0;
  while (7 ** order + 1 < count) order++;
  return order;
}
