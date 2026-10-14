import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  fromPixel,
  gosper,
  gosperOrderFor,
  hexDistance,
  hexKey,
  neighbours,
  ring,
  toPixel,
} from "../../src/kernel/atlas/hex.js";
import {
  ISLAND_GAP,
  islandDrift,
  type LandState,
  MAX_DRIFT_PER_SETTLE,
  octantOf,
  planSettle,
  reserveFor,
} from "../../src/kernel/atlas/land.js";
import {
  type DerivedPlacement,
  SCHULE_LENS,
  WELTWISSEN_LENS,
} from "../../src/kernel/atlas/lenses.js";
import {
  planForSnapshot,
  settleLens,
  snapshotLens,
} from "../../src/kernel/atlas/settle.js";
import type { UnitKey } from "../../src/kernel/atlas/types.js";
import {
  type Database,
  installKvtTile,
  openDatabase,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";

const EMPTY: LandState = { islands: [], land: [] };

/** A placement along a dotted path: "a.b.c" → a › a.b › a.b.c. */
function place(unit: string, leaf: string, rank = 0): DerivedPlacement {
  const parts = leaf.split(".");
  return {
    unitKey: `token:${unit}` as UnitKey,
    path: parts.map((_, i) => ({
      key: parts.slice(0, i + 1).join("."),
      name: parts[i],
      level: i,
      rank,
    })),
    source: "alias",
  };
}

/** Deterministic pseudo-random numbers for repeatable "random" growth. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Whether a set of hexes is one connected patch. */
function connected(hexes: Array<{ q: number; r: number }>): boolean {
  if (hexes.length === 0) return true;
  const all = new Set(hexes.map((h) => hexKey(h.q, h.r)));
  const seen = new Set([hexKey(hexes[0].q, hexes[0].r)]);
  const queue = [hexes[0]];
  while (queue.length > 0) {
    const hex = queue.shift() as { q: number; r: number };
    for (const n of neighbours(hex)) {
      const k = hexKey(n.q, n.r);
      if (all.has(k) && !seen.has(k)) {
        seen.add(k);
        queue.push(n);
      }
    }
  }
  return seen.size === all.size;
}

function unitHexes(state: LandState) {
  return new Map(
    state.land
      .filter((h) => h.unit)
      .map((h) => [h.unit as UnitKey, { island: h.island, q: h.q, r: h.r }]),
  );
}

function settle(placements: DerivedPlacement[], state: LandState) {
  return planSettle({ placements, regions: [], state });
}

describe("hex geometry", () => {
  it("walks a Gosper curve through unique, neighbouring hexes", () => {
    const curve = gosper(4);
    expect(curve).toHaveLength(2402);
    expect(new Set(curve.map((h) => hexKey(h.q, h.r))).size).toBe(2402);
    for (let i = 1; i < curve.length; i++) {
      expect(hexDistance(curve[i - 1], curve[i])).toBe(1);
    }
    expect(gosperOrderFor(8)).toBe(1);
    expect(gosperOrderFor(9)).toBe(2);
  });

  it("rounds world points back to their hex and rings around a centre", () => {
    for (const hex of [
      { q: 0, r: 0 },
      { q: 3, r: -2 },
      { q: -5, r: 7 },
    ]) {
      const p = toPixel(hex.q, hex.r);
      expect(fromPixel(p.x + 0.2, p.y - 0.2)).toEqual(hex);
    }
    const r2 = ring({ q: 1, r: 1 }, 2);
    expect(r2).toHaveLength(12);
    for (const hex of r2) expect(hexDistance(hex, { q: 1, r: 1 })).toBe(2);
  });
});

describe("founding", () => {
  const placements = [
    place("m1", "logik.mathe.zahlen"),
    place("m2", "logik.mathe.zahlen"),
    place("m3", "logik.mathe.geometrie"),
    place("i1", "logik.info.netze"),
    place("p1", "natur.physik.optik"),
    place("p2", "natur.physik.optik"),
    place("c1", "natur.chemie.teilchen"),
  ];

  it("is deterministic", () => {
    expect(settle(placements, EMPTY)).toEqual(settle(placements, EMPTY));
    expect(settle([...placements].reverse(), EMPTY).next).toEqual(
      settle(placements, EMPTY).next,
    );
  });

  it("gives every unit a hex, every leaf its reserve, every region one patch", () => {
    const { next } = settle(placements, EMPTY);
    expect(unitHexes(next).size).toBe(placements.length);
    const zahlen = next.land.filter((h) => h.region === "logik.mathe.zahlen");
    expect(zahlen).toHaveLength(2 + reserveFor(2));
    for (const region of [
      "logik.mathe.zahlen",
      "logik.mathe.geometrie",
      "natur.physik.optik",
    ]) {
      expect(connected(next.land.filter((h) => h.region === region))).toBe(
        true,
      );
    }
    const mathe = next.land.filter((h) => h.region.startsWith("logik.mathe."));
    expect(connected(mathe)).toBe(true);
    expect(next.islands.map((i) => i.island).sort()).toEqual([
      "logik",
      "natur",
    ]);
  });

  it("keeps islands apart by the gap", () => {
    const { next } = settle(placements, EMPTY);
    const [a, b] = next.islands;
    const radius = (island: string) =>
      Math.max(
        ...next.land
          .filter((h) => h.island === island)
          .map((h) => Math.hypot(toPixel(h.q, h.r).x, toPixel(h.q, h.r).y)),
      ) + 1;
    const pa = toPixel(a.dq, a.dr);
    const pb = toPixel(b.dq, b.dr);
    expect(Math.hypot(pa.x - pb.x, pa.y - pb.y)).toBeGreaterThanOrEqual(
      radius(a.island) + radius(b.island) + ISLAND_GAP - 0.01,
    );
  });
});

describe("growth", () => {
  it("moves no other unit when units are added, over 50 random additions", () => {
    const random = mulberry32(2026);
    const leaves = [
      "logik.mathe.zahlen",
      "logik.mathe.geometrie",
      "natur.physik.optik",
      "gesellschaft.geschichte.antike",
    ];
    let placements = leaves.map((leaf, i) => place(`u${i}`, leaf));
    let state = settle(placements, EMPTY).next;

    for (let step = 0; step < 50; step++) {
      const roll = random();
      let leaf: string;
      if (roll < 0.15) {
        // A new leaf under an existing Fach.
        const parent = leaves[Math.floor(random() * leaves.length)]
          .split(".")
          .slice(0, 2)
          .join(".");
        leaf = `${parent}.neu${step}`;
        leaves.push(leaf);
      } else if (roll < 0.2) {
        // A new island.
        leaf = `insel${step}.fach.gebiet`;
        leaves.push(leaf);
      } else {
        leaf = leaves[Math.floor(random() * leaves.length)];
      }
      placements = [...placements, place(`n${step}`, leaf)];

      const before = unitHexes(state);
      const islandsBefore = new Map(state.islands.map((i) => [i.island, i]));
      const { next } = settle(placements, state);
      const after = unitHexes(next);

      for (const [unit, hex] of before) {
        expect(after.get(unit)).toEqual(hex);
      }
      expect(after.get(`token:n${step}` as UnitKey)).toBeDefined();
      for (const island of next.islands) {
        const old = islandsBefore.get(island.island);
        if (!old) continue;
        expect(
          hexDistance({ q: old.dq, r: old.dr }, { q: island.dq, r: island.dr }),
        ).toBeLessThanOrEqual(MAX_DRIFT_PER_SETTLE);
        const was = octantOf(toPixel(old.dq, old.dr));
        if (was >= 0) {
          expect(octantOf(toPixel(island.dq, island.dr))).toBe(was);
        }
      }
      state = next;
    }
    expect(unitHexes(state).size).toBe(placements.length);
  });

  it("gives a new region contiguous land next to its parent", () => {
    const base = [
      place("a", "logik.mathe.zahlen"),
      place("b", "logik.mathe.zahlen"),
      place("c", "logik.mathe.geometrie"),
    ];
    const first = settle(base, EMPTY).next;
    const added = [1, 2, 3, 4, 5].map((i) =>
      place(`s${i}`, "logik.mathe.stochastik"),
    );
    const { next } = settle([...base, ...added], first);
    const stochastik = next.land.filter(
      (h) => h.region === "logik.mathe.stochastik",
    );
    expect(stochastik).toHaveLength(5);
    expect(connected(stochastik)).toBe(true);
    const mathe = next.land.filter((h) => h.region.startsWith("logik.mathe."));
    expect(connected(mathe)).toBe(true);
  });

  it("frees the hex of a unit that left, without moving anyone else", () => {
    const base = [
      place("a", "logik.mathe.zahlen"),
      place("b", "logik.mathe.zahlen"),
      place("c", "logik.mathe.geometrie"),
    ];
    const first = settle(base, EMPTY).next;
    const moved = [base[0], place("b", "logik.mathe.geometrie"), base[2]];
    const { next } = settle(moved, first);
    const before = unitHexes(first);
    const after = unitHexes(next);
    expect(after.get("token:a" as UnitKey)).toEqual(
      before.get("token:a" as UnitKey),
    );
    expect(after.get("token:c" as UnitKey)).toEqual(
      before.get("token:c" as UnitKey),
    );
    const old = before.get("token:b" as UnitKey);
    const freed = next.land.find(
      (h) => h.island === old?.island && h.q === old?.q && h.r === old?.r,
    );
    expect(freed?.unit).toBeNull();
    expect(freed?.region).toBe("logik.mathe.zahlen");
    const nowAt = next.land.find((h) => h.unit === "token:b");
    expect(nowAt?.region).toBe("logik.mathe.geometrie");
  });

  it("grows a region ringed by other land at its parent's coast, not into a crash", () => {
    // Github sits in the middle of its island, every hex taken, ringed by
    // another Fach: no free hex beside it.
    const centre = { q: 0, r: 0 };
    const state: LandState = {
      islands: [{ island: "x", dq: 0, dr: 0, foundedDq: 0, foundedDr: 0 }],
      land: [
        {
          island: "x",
          ...centre,
          region: "x.github.allgemein",
          unit: "token:g1" as UnitKey,
        },
        ...neighbours(centre).map((n, i) => ({
          island: "x",
          q: n.q,
          r: n.r,
          region: "x.andere.allgemein",
          unit: `token:o${i}` as UnitKey,
        })),
      ],
    };
    const placements = [
      place("g1", "x.github.allgemein"),
      ...neighbours(centre).map((_, i) => place(`o${i}`, "x.andere.allgemein")),
      // A goal import adds two units below Github.
      place("g2", "x.github.allgemein"),
      place("g3", "x.github.absichern"),
    ];
    const { next } = settle(placements, state);
    const after = unitHexes(next);
    for (const unit of ["g2", "g3"]) {
      const hex = after.get(`token:${unit}` as UnitKey);
      expect(hex, unit).toBeDefined();
      expect(hexDistance(hex ?? centre, centre)).toBe(2);
    }
    // Nobody moved.
    for (const hex of state.land) {
      expect(after.get(hex.unit as UnitKey)).toEqual({
        island: "x",
        q: hex.q,
        r: hex.r,
      });
    }
  });

  it("keeps every existing island where it is when a new island is founded", () => {
    const base = [
      place("a", "logik.mathe.zahlen"),
      place("b", "natur.physik.optik"),
    ];
    const first = settle(base, EMPTY).next;
    const { next } = settle(
      [...base, place("c", "sprache.deutsch.grammatik")],
      first,
    );
    for (const island of first.islands) {
      const now = next.islands.find((i) => i.island === island.island);
      expect(now).toEqual(island);
    }
    expect(next.islands).toHaveLength(3);
  });
});

describe("drift", () => {
  it("pushes the outer island out along its bearing, by at most the cap", () => {
    const base = [
      place("a", "logik.mathe.zahlen"),
      place("b", "natur.physik.optik"),
    ];
    const first = settle(base, EMPTY).next;
    const outer = first.islands.find((i) => i.dq !== 0 || i.dr !== 0);
    expect(outer).toBeDefined();
    if (!outer) return;
    // Squeeze the outer island towards the anchor, then let settle repair it.
    const squeezed: LandState = {
      ...first,
      islands: first.islands.map((i) =>
        i.island === outer.island
          ? { ...i, dq: Math.round(i.dq / 3), dr: Math.round(i.dr / 3) }
          : i,
      ),
    };
    const squeezedOuter = squeezed.islands.find(
      (i) => i.island === outer.island,
    );
    if (!squeezedOuter) return;
    const { next } = settle(base, squeezed);
    const after = next.islands.find((i) => i.island === outer.island);
    expect(after).toBeDefined();
    if (!after) return;
    const step = hexDistance(
      { q: squeezedOuter.dq, r: squeezedOuter.dr },
      { q: after.dq, r: after.dr },
    );
    expect(step).toBeGreaterThan(0);
    expect(step).toBeLessThanOrEqual(MAX_DRIFT_PER_SETTLE);
    expect(octantOf(toPixel(after.dq, after.dr))).toBe(
      octantOf(toPixel(squeezedOuter.dq, squeezedOuter.dr)),
    );
    expect(islandDrift(after)).toBeGreaterThan(0);
    // The anchor island never moves.
    const anchor = next.islands.find((i) => i.island !== outer.island);
    expect(anchor).toEqual(
      first.islands.find((i) => i.island !== outer.island),
    );
  });
});

describe("settling a lens in the database", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-atlas-land-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("writes the land once; a second settle plans nothing", async () => {
    for (const tile of listBundledTiles().slice(0, 6)) {
      await installKvtTile(db, tile);
    }
    for (const lens of [WELTWISSEN_LENS, SCHULE_LENS]) {
      const first = await settleLens(db, lens);
      expect(first.landWritten).toBeGreaterThan(0);
      expect(first.islandsWritten).toBeGreaterThan(0);

      const snapshot = await snapshotLens(db, lens);
      if (!snapshot) throw new Error("lens missing");
      const again = planForSnapshot(snapshot);
      expect(again.islands).toEqual([]);
      expect(again.land).toEqual([]);

      const second = await settleLens(db, lens);
      expect(second).toEqual({
        regionsCreated: 0,
        islandsWritten: 0,
        landWritten: 0,
      });
      // Every unit holds exactly one hex.
      const placed = snapshot.state.land.filter((h) => h.unit);
      expect(new Set(placed.map((h) => h.unit)).size).toBe(placed.length);
      expect(placed.length).toBe(snapshot.placements.length);
    }
  });
});
