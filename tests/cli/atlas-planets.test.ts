import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  atlasMovePlanet,
  atlasPlanetInfo,
  atlasRead,
  readAtlasPrefs,
  setAtlasOwnPlanet,
} from "../../src/cli/atlas.js";
import {
  createToken,
  type Database,
  ensureCard,
  ensureLensRow,
  ensureWorldLenses,
  installKvtTile,
  LEBEN_LENS,
  libraryLenses,
  moveUnitsToPlanet,
  OWN_PLANET_SETTING,
  openDatabase,
  ownPlanetOf,
  PlanetError,
  PRODUKTE_LENS,
  placeUnits,
  readAtlas,
  SCHULE_LENS,
  setSetting,
  settleLens,
  type UnitKey,
  unitPlanetsFrom,
  WELTWISSEN_LENS,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";

/**
 * Planets (ADR 2026-10-13, Decision 2; plan Phase 9): a library holds world
 * knowledge and its own planet, a unit lives on one planet, its kind, and
 * its status never changes on a device.
 */

const USER = "learner";

describe("atlas planets", () => {
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-planets-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  async function ownUnit(
    slug: string,
    domain: string,
    sourceLink?: string,
  ): Promise<UnitKey> {
    const token = await createToken(db, {
      slug,
      concept: slug,
      domain,
      ...(sourceLink ? { source_link: sourceLink } : {}),
    });
    await ensureCard(db, token.id, USER);
    return `token:${token.id}`;
  }

  async function keysIn(lens: typeof WELTWISSEN_LENS): Promise<UnitKey[]> {
    const view = await readAtlas(db, { userId: USER, lens });
    return view.units.map((u) => u.key);
  }

  it("is Privat on a personal library unless the library says Firma", async () => {
    expect(await ownPlanetOf(db)).toBe("privat");
    expect((await libraryLenses(db)).map((l) => l.kind)).toEqual([
      "weltwissen",
      "schule",
      "leben",
    ]);
    await setSetting(db, OWN_PLANET_SETTING, "firma");
    expect(await ownPlanetOf(db)).toBe("firma");
    // Unternehmen is optional: it shows once a curator made it.
    expect((await libraryLenses(db)).map((l) => l.kind)).toEqual([
      "weltwissen",
      "schule",
      "produkte",
    ]);
    // Produkte is the default primary lens of a company library.
    expect((await readAtlasPrefs(db)).lens).toBe("produkte");
  });

  it("gives each unit one planet: published and covered units are world, the rest own", () => {
    const unit = (key: UnitKey, atomId: string | null = null) => ({
      key,
      title: key,
      domain: "x",
      atomId,
      tokenIds: [key.slice(6)],
      own: atomId === null,
      curriculumLink: null,
    });
    const planets = unitPlanetsFrom({
      units: [
        unit("atom:a1", "a1"),
        unit("token:covered"),
        unit("token:loose"),
        unit("token:placed-own"),
        unit("token:placed-world"),
        unit("token:both"),
      ],
      memberPlanets: new Map([
        ["token:placed-own", new Set(["privat" as const])],
        ["token:placed-world", new Set(["welt" as const])],
        // An older row on both: treated as protected.
        ["token:both", new Set(["welt" as const, "privat" as const])],
        // A published unit is world knowledge, whatever a row says.
        ["atom:a1", new Set(["privat" as const])],
      ]),
      worldCovered: new Set(["token:covered"]),
      own: "privat",
    });
    expect(Object.fromEntries(planets)).toEqual({
      "atom:a1": "welt",
      "token:covered": "welt",
      "token:loose": "privat",
      "token:placed-own": "privat",
      "token:placed-world": "welt",
      "token:both": "privat",
    });
  });

  it("keeps unsorted own knowledge on the own planet and covered knowledge on the world's", async () => {
    const physik = await ownUnit("hebel", "physik/mechanik");
    const lehrplan = await ownUnit(
      "bruchrechnen",
      "rechnen/brueche",
      "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/6/mathematik",
    );
    const familie = await ownUnit("geburtstage", "familie/geburtstage");

    expect(await keysIn(WELTWISSEN_LENS)).toEqual(
      expect.arrayContaining([physik, lehrplan]),
    );
    expect(await keysIn(WELTWISSEN_LENS)).not.toContain(familie);
    expect(await keysIn(SCHULE_LENS)).not.toContain(familie);

    // Leben: until the agent sorts it, a domain's first segment is the Bereich.
    const leben = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(leben.units.map((u) => u.key)).toEqual([familie]);
    expect(leben.units[0].region).toBe("familie.geburtstage");
    expect(leben.units[0].own).toBe(true);
    expect(leben.lens.planet).toBe("privat");
    const bereich = leben.regions.find((r) => r.key === "familie");
    expect(bereich?.level).toBe(0);
    // A private Bereich keeps its own Sinnbild key, not a world subject's.
    expect(bereich?.emblemSubject).toBe("region:leben:familie");

    // Settle gives it land; the world lenses free nothing they never held.
    await settleLens(db, LEBEN_LENS);
    const settled = await readAtlas(db, { userId: USER, lens: LEBEN_LENS });
    expect(settled.land.some((h) => h.unit === familie)).toBe(true);
    expect(settled.settle.pending).toBe(0);
  });

  it("refuses a lens of the other planet", async () => {
    await expect(settleLens(db, PRODUKTE_LENS)).rejects.toBeInstanceOf(
      PlanetError,
    );
    await expect(
      atlasRead(db, { userId: USER, lens: "produkte" }),
    ).rejects.toThrow(/firma planet/);
    await setSetting(db, OWN_PLANET_SETTING, "firma");
    await expect(settleLens(db, LEBEN_LENS)).rejects.toBeInstanceOf(
      PlanetError,
    );
    await expect(
      placeUnits(db, LEBEN_LENS, "familie", [
        { unitKey: "token:x" as UnitKey, below: [] },
      ]),
    ).rejects.toBeInstanceOf(PlanetError);
  });

  it("moves a unit between planets: one planet at a time, still own", async () => {
    const zam = await ownUnit("zam-cli", "zam/cli");
    await ensureWorldLenses(db);
    expect(await keysIn(LEBEN_LENS)).toEqual([zam]);

    const toWorld = await db.transaction((tx) =>
      moveUnitsToPlanet(tx, {
        units: [zam],
        planet: "welt",
        placedBy: "learner",
      }),
    );
    expect(toWorld.moved).toEqual([zam]);
    expect(await keysIn(LEBEN_LENS)).toEqual([]);
    const welt = await readAtlas(db, { userId: USER, lens: WELTWISSEN_LENS });
    const moved = welt.units.find((u) => u.key === zam);
    // Where Weltwissen's rules put it: the unsorted island, by its domain.
    expect(moved?.region).toBe("unsortiert.zam.cli.allgemein");
    // Its status stays own: nothing on a device publishes.
    expect(moved?.own).toBe(true);
    expect(await keysIn(SCHULE_LENS)).toContain(zam);

    // A second move back leaves no world placement behind.
    const back = await db.transaction((tx) =>
      moveUnitsToPlanet(tx, {
        units: [zam],
        planet: "privat",
        placedBy: "learner",
      }),
    );
    expect(back.moved).toEqual([zam]);
    const members = (await db
      .prepare(
        `SELECT l.planet FROM atlas_members m
           JOIN atlas_lenses l ON l.id = m.lens_id WHERE m.unit_key = ?`,
      )
      .all(zam)) as Array<{ planet: string }>;
    expect(members.map((m) => m.planet)).toEqual(["privat"]);
    expect(await keysIn(WELTWISSEN_LENS)).not.toContain(zam);
    expect(await keysIn(LEBEN_LENS)).toEqual([zam]);
  });

  it("keeps published units on the world planet", async () => {
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    if (!tile) throw new Error("no bundled optics tile");
    await installKvtTile(db, tile);
    const atom = `atom:${tile.atoms[0].id}` as UnitKey;
    await ensureWorldLenses(db);
    await ensureLensRow(db, LEBEN_LENS);

    const result = await db.transaction((tx) =>
      moveUnitsToPlanet(tx, {
        units: [atom],
        planet: "privat",
        placedBy: "learner",
      }),
    );
    expect(result.skipped).toEqual([atom]);
    await expect(
      placeUnits(db, LEBEN_LENS, "familie", [{ unitKey: atom, below: [] }]),
    ).rejects.toThrow(/published world knowledge/);
  });

  it("moves a whole region through the bridge, skipping published units", async () => {
    const a = await ownUnit("git-rebase", "git/branches");
    const b = await ownUnit("git-merge", "git/branches");
    const result = await atlasMovePlanet(db, {
      planet: "welt",
      lens: "leben",
      region: "git",
    });
    expect(result.moved.sort()).toEqual([a, b].sort());
    expect(await keysIn(LEBEN_LENS)).toEqual([]);
    await expect(
      atlasMovePlanet(db, { planet: "firma", units: [a] }),
    ).rejects.toThrow(/welt or privat/);
  });

  it("lets the owner switch the library to Firma; the private lens stays stored but hidden", async () => {
    const note = await ownUnit("team-boreas-scrum", "scrum/team-boreas");
    await settleLens(db, LEBEN_LENS);
    const info = await setAtlasOwnPlanet(db, "firma");
    expect(info.own).toBe("firma");
    expect(info.explicit).toBe(true);
    expect(info.lenses.map((l) => l.kind)).toEqual([
      "weltwissen",
      "schule",
      "produkte",
    ]);
    // The unit now lives on the company planet: Produkte's unsorted island.
    const produkte = await readAtlas(db, { userId: USER, lens: PRODUKTE_LENS });
    expect(produkte.units.map((u) => u.key)).toEqual([note]);
    expect(produkte.units[0].region).toBe("unsortiert.scrum.team-boreas");
    const read = await atlasRead(db, { userId: USER, planet: "firma" });
    expect(read.lens.kind).toBe("produkte");
    expect(read.ownPlanet).toBe("firma");
    await expect(setAtlasOwnPlanet(db, "welt")).rejects.toThrow(
      /firma or privat/,
    );
    expect((await atlasPlanetInfo(db)).mayChange).toBe(true);
  });
});
