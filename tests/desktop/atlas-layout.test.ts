import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type AtlasLayout,
  buildAtlasLayout,
  mayPractiseRegion,
  PATTERNS,
  practisedUnits,
  REGION_PRACTICE_MAX_UNITS,
  regionCondition,
  regionDue,
  regionPath,
  searchAtlas,
  unitLinks,
  unitsIn,
} from "../../desktop/src/atlas/layout.js";
import type { AtlasReadResponse } from "../../src/bridge/protocol.js";
import {
  type Database,
  installKvtTile,
  openDatabase,
  readAtlas,
  SCHULE_LENS,
  setSetting,
  settleLens,
  updateCard,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";
import { materialiseKvtCards } from "../../src/kernel/library/kvt-attach.js";

/**
 * The Studio's map geometry (ADR 2026-10-13, plan Phase 6) on real reads:
 * bundled tiles installed, the learner holding some of them.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-13T12:00:00.000Z");

describe("atlas map layout", () => {
  let dir: string;
  let db: Database;
  let welt: AtlasReadResponse;
  let schule: AtlasReadResponse;
  let layout: AtlasLayout;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-layout-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "user.id", "learner");
    const tiles = listBundledTiles();
    for (const tile of tiles.slice(0, 6)) await installKvtTile(db, tile);
    // The learner holds three tiles; the rest of the library is blank land.
    const held = tiles.slice(0, 3).flatMap((t) => t.atoms.map((a) => a.id));
    await materialiseKvtCards(db, "learner", held);
    const cards = (await db
      .prepare("SELECT id FROM cards WHERE user_id = ? ORDER BY id")
      .all("learner")) as Array<{ id: string }>;
    // Half of them practised and overdue, half never practised.
    for (const [i, card] of cards.entries()) {
      if (i % 2 === 0) {
        await updateCard(db, card.id, {
          state: "review",
          stability: 10,
          due_at: new Date(now.getTime() - 3 * DAY_MS).toISOString(),
          last_review_at: new Date(now.getTime() - 13 * DAY_MS).toISOString(),
        });
      }
    }
    for (const lens of [WELTWISSEN_LENS, SCHULE_LENS]) {
      await settleLens(db, lens);
    }
    welt = {
      success: true,
      ...(await readAtlas(db, {
        userId: "learner",
        lens: WELTWISSEN_LENS,
        now,
        mayWrite: true,
      })),
    };
    schule = {
      success: true,
      ...(await readAtlas(db, { userId: "learner", lens: SCHULE_LENS, now })),
    };
    layout = buildAtlasLayout(welt);
    expect(welt.units.length).toBeGreaterThan(4);
    expect(welt.threads.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("turns every land hex into one cell at its island's offset", () => {
    expect(layout.cells).toHaveLength(welt.land.length);
    expect(layout.byKey.size).toBe(welt.land.length);
    const offsets = new Map(welt.islands.map((i) => [i.key, i]));
    for (const [i, hex] of welt.land.entries()) {
      const cell = layout.cells[i];
      const offset = offsets.get(hex.island);
      expect(cell.q).toBe(hex.q + (offset?.dq ?? 0));
      expect(cell.r).toBe(hex.r + (offset?.dr ?? 0));
      expect(cell.path[0]).toBe(hex.island);
      expect(cell.path[cell.path.length - 1]).toBe(hex.region);
      expect(cell.unit?.key ?? null).toBe(hex.unit);
    }
    // Only the learner's units are on the land; the rest stays blank.
    expect(layout.unitCell.size).toBe(welt.units.length);
    expect(layout.cells.some((c) => c.unit === null)).toBe(true);
  });

  it("knows every region's path, children and shape", () => {
    expect(layout.depth).toBe(4);
    expect(layout.roots.length).toBeGreaterThan(0);
    for (const key of layout.roots) {
      expect(layout.regions.get(key)?.level).toBe(0);
    }
    for (const [key, geom] of layout.geoms) {
      const path = regionPath(layout, key);
      expect(path[path.length - 1]).toBe(key);
      expect(path).toHaveLength((layout.regions.get(key)?.level ?? 0) + 1);
      expect(geom.cells.every((c) => c.path.includes(key))).toBe(true);
      expect(geom.minX).toBeLessThan(geom.maxX);
    }
    for (const region of layout.regions.values()) {
      const ranks = region.children.map(
        (c) => layout.regions.get(c)?.rank ?? 0,
      );
      expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    }
  });

  it("draws the coast and the borders between Fächer", () => {
    expect(layout.edges).toHaveLength(4);
    expect(layout.edges[0].length).toBeGreaterThan(0);
    const fachKeys = new Set(layout.cells.map((c) => c.path[1]));
    if (fachKeys.size > 1) expect(layout.edges[1].length).toBeGreaterThan(0);
    // Two hexes of the same leaf never get a border between them.
    const total = layout.edges.reduce((n, e) => n + e.length, 0);
    expect(total).toBeLessThan(layout.cells.length * 6);
  });

  it("sets sibling Gebiete apart by shade and pattern", () => {
    const gebiete = [...layout.regions.values()].filter(
      (r) => r.level === layout.colourLevel + 1,
    );
    expect(gebiete.length).toBeGreaterThan(0);
    for (const gebiet of gebiete) {
      expect(PATTERNS).toContain(gebiet.pattern);
    }
    const others = [...layout.regions.values()].filter(
      (r) => r.level !== layout.colourLevel + 1,
    );
    expect(others.every((r) => r.pattern === null)).toBe(true);
    const fach = [...layout.regions.values()].find(
      (r) => r.level === layout.colourLevel && r.children.length > 1,
    );
    if (fach) {
      const [a, b] = fach.children.map((key) => layout.regions.get(key));
      expect(a?.pattern).not.toBe(b?.pattern);
      const shade = (key: string) =>
        layout.cells.find((c) => c.path.includes(key))?.shade;
      expect(shade(fach.children[0])).not.toEqual(shade(fach.children[1]));
    }
    // Every cell of a Fach takes its subject hue.
    for (const cell of layout.cells) {
      const fachRegion = layout.regions.get(cell.path[layout.colourLevel]);
      expect(cell.hue).toBe(fachRegion?.hue);
    }
  });

  it("counts the learner's own cards and names the weakest condition", () => {
    for (const key of layout.roots) {
      const units = unitsIn(layout, key);
      expect(regionDue(layout, key)).toBe(units.reduce((n, u) => n + u.due, 0));
      if (units.some((u) => u.condition && u.condition !== "unpractised")) {
        expect(regionCondition(layout, key)).not.toBe("unpractised");
      }
    }
    const blank = layout.cells.find((c) => c.unit === null);
    if (blank) {
      const leaf = blank.path[blank.path.length - 1];
      if (unitsIn(layout, leaf).length === 0) {
        expect(regionCondition(layout, leaf)).toBeNull();
      }
    }
  });

  it("offers going through a region again only when it is small and practised", () => {
    const practisedLeaf = [...layout.geoms.keys()].find(
      (key) =>
        layout.regions.get(key)?.children.length === 0 &&
        practisedUnits(layout, key) > 0,
    );
    expect(practisedLeaf).toBeDefined();
    expect(mayPractiseRegion(layout, practisedLeaf as string)).toBe(true);
    for (const key of layout.geoms.keys()) {
      const units = practisedUnits(layout, key);
      expect(mayPractiseRegion(layout, key)).toBe(
        units > 0 && units <= REGION_PRACTICE_MAX_UNITS,
      );
      if (
        unitsIn(layout, key).every(
          (u) => u.condition === null || u.condition === "unpractised",
        )
      ) {
        expect(mayPractiseRegion(layout, key)).toBe(false);
      }
    }
  });

  it("lists prerequisites in both directions", () => {
    const thread = welt.threads[0];
    expect(unitLinks(layout, thread.from).buildsOn.map((u) => u.key)).toContain(
      thread.to,
    );
    expect(
      unitLinks(layout, thread.to).foundationFor.map((u) => u.key),
    ).toContain(thread.from);
  });

  it("finds regions and units with the path that tells repeated titles apart", () => {
    const unit = welt.units[0];
    const word = unit.title.split(/\s+/)[0];
    const hits = searchAtlas(layout, word.toUpperCase());
    const hit = hits.find((h) => h.kind === "unit" && h.key === unit.key);
    expect(hit?.where).toEqual(
      regionPath(layout, unit.region).map((k) => layout.regions.get(k)?.name),
    );
    const island = layout.regions.get(layout.roots[0]);
    expect(
      searchAtlas(layout, island?.name ?? "").some(
        (h) => h.kind === "region" && h.key === island?.key,
      ),
    ).toBe(true);
    expect(searchAtlas(layout, "   ")).toEqual([]);
  });

  it("lays out the Schule lens with grades as islands", () => {
    const school = buildAtlasLayout(schule);
    expect(school.depth).toBe(3);
    expect(school.unitCell.size).toBe(schule.units.length);
    for (const key of school.roots) {
      expect(school.regions.get(key)?.level).toBe(0);
    }
    // The same unit sits in both lenses.
    const shared = welt.units.find((u) =>
      schule.units.some((s) => s.key === u.key),
    );
    expect(shared).toBeDefined();
  });
});

describe("atlas modules stay framework-free", () => {
  it("import neither main.ts, Tauri nor Three.js", () => {
    for (const file of [
      "layout.ts",
      "render.ts",
      "outline.ts",
      "view.ts",
      "import.ts",
    ]) {
      const source = readFileSync(
        join(process.cwd(), "desktop", "src", "atlas", file),
        "utf8",
      );
      const specifiers = [
        ...source.matchAll(/from\s+"([^"]+)"|import\(\s*"([^"]+)"\s*\)/g),
      ].map((m) => m[1] ?? m[2]);
      for (const specifier of specifiers) {
        expect(specifier, `${file}: ${specifier}`).not.toMatch(
          /^(\.\.?\/)+main(\.js)?$|^@tauri-apps|^three(\/|$)/,
        );
      }
    }
  });
});
