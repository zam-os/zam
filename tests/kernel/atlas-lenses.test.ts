import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type BindingRow,
  cleanTopic,
  deriveSchule,
  deriveWeltwissen,
  ensureWorldLenses,
  findLensId,
  type LensRows,
  loadBindings,
  loadLensRows,
  loadUnits,
  OUTSIDE_CURRICULUM_KEY,
  UNSORTED_KEY,
  type UnitRow,
  weltwissenSeedRows,
} from "../../src/kernel/atlas/lenses.js";
import { unitKeyFor } from "../../src/kernel/atlas/types.js";
import {
  createToken,
  type Database,
  installKvtTile,
  openDatabase,
} from "../../src/kernel/index.js";
import { listBundledTiles } from "../../src/kernel/library/bundled-cells.js";

/** The Weltwissen seed as lens rows, with each region's key as its id. */
function seedLensRows(): LensRows {
  const seed = weltwissenSeedRows();
  return {
    regions: seed.regions.map((r) => ({
      id: r.key,
      key: r.key,
      name: r.name,
      level: r.level,
      parentId: r.parentKey,
      rank: r.rank,
    })),
    aliases: seed.aliases.map((a) => ({
      domainPrefix: a.domainPrefix,
      regionId: a.regionKey,
    })),
    members: [],
  };
}

function unit(
  id: string,
  domain: string,
  overrides: Partial<UnitRow> = {},
): UnitRow {
  const atomId = overrides.atomId ?? null;
  return {
    key: unitKeyFor(id, atomId),
    title: id,
    domain,
    atomId,
    tokenIds: [id],
    own: atomId === null,
    curriculumLink: null,
    ...overrides,
  };
}

function binding(
  atomId: string,
  grade: number | null,
  overrides: Partial<BindingRow> = {},
): BindingRow {
  return {
    atomId,
    provider: "lehrplanplus-bayern",
    schoolType: "realschule",
    grade,
    track: "",
    subject: "mathematik",
    topicCode: `code-${grade}`,
    topicTitle: `Mathematik ${grade}: Thema ${grade}`,
    ...overrides,
  };
}

const keys = (path: { key: string }[]) => path.map((step) => step.key);

describe("Weltwissen derivation", () => {
  it("places every atom of every bundled tile under a known Fach", () => {
    const units: UnitRow[] = [];
    const bindings: BindingRow[] = [];
    for (const tile of listBundledTiles()) {
      for (const atom of tile.atoms) {
        units.push(
          unit(atom.id, atom.domain, { atomId: atom.id, title: atom.title }),
        );
        for (const c of atom.curricula ?? []) {
          bindings.push(
            binding(atom.id, c.grade ?? null, {
              schoolType: c.school_type ?? "",
              subject: c.subject ?? "",
              topicCode: c.topic_code,
              topicTitle: c.topic_title ?? null,
            }),
          );
        }
      }
    }
    expect(units.length).toBeGreaterThan(400);

    const placements = deriveWeltwissen(units, seedLensRows(), bindings);
    const unsorted = placements.filter((p) => p.path[0].key === UNSORTED_KEY);
    expect(unsorted.map((p) => p.unitKey)).toEqual([]);
    for (const placement of placements) {
      expect(placement.path).toHaveLength(4);
      expect(placement.path.map((step) => step.level)).toEqual([0, 1, 2, 3]);
    }
  });

  it("follows the seed's aliases and the binding's topic", () => {
    const placements = deriveWeltwissen(
      [
        unit("a1", "physik/kinematik", { atomId: "a1" }),
        unit("a2", "bwr/bilanz", { atomId: "a2" }),
        unit("a3", "chemie", { atomId: "a3" }),
        unit("t1", "physik/unbekannt/hebel"),
      ],
      seedLensRows(),
      [
        binding("a1", 9, {
          subject: "physik",
          topicTitle: "Physik 9: Mechanik – Bewegungen",
        }),
      ],
    );
    expect(keys(placements[0].path)).toEqual([
      "natur",
      "natur.physik",
      "natur.physik.mechanik",
      "natur.physik.mechanik.bewegungen",
    ]);
    expect(placements[0].path[3].name).toBe("Bewegungen");
    expect(keys(placements[1].path)).toEqual([
      "gesellschaft",
      "gesellschaft.wirtschaft-recht",
      "gesellschaft.wirtschaft-recht.rechnungswesen",
      "gesellschaft.wirtschaft-recht.rechnungswesen.bilanz",
    ]);
    // A bare subject reads as its "allgemein" area.
    expect(keys(placements[2].path).slice(0, 3)).toEqual([
      "natur",
      "natur.chemie",
      "natur.chemie.teilchen",
    ]);
    // An unknown area becomes a new Gebiet under the known Fach.
    expect(keys(placements[3].path)).toEqual([
      "natur",
      "natur.physik",
      "natur.physik.unbekannt",
      "natur.physik.unbekannt.hebel",
    ]);
    expect(placements[3].path[2].name).toBe("Unbekannt");
  });

  it("puts an unknown domain on the unsorted island, grouped by its root", () => {
    const [placement] = deriveWeltwissen(
      [unit("t1", "kochen/teig/pizza")],
      seedLensRows(),
      [],
    );
    expect(placement.source).toBe("unsorted");
    expect(keys(placement.path)).toEqual([
      UNSORTED_KEY,
      `${UNSORTED_KEY}.kochen`,
      `${UNSORTED_KEY}.kochen.teig`,
      `${UNSORTED_KEY}.kochen.teig.pizza`,
    ]);
  });

  it("keeps two units with the same title apart", () => {
    const placements = deriveWeltwissen(
      [
        unit("t1", "informatik/softwaretechnik", { title: "Troubleshooting" }),
        unit("t2", "informatik/netze", { title: "Troubleshooting" }),
      ],
      seedLensRows(),
      [],
    );
    expect(placements).toHaveLength(2);
    expect(placements[0].unitKey).not.toBe(placements[1].unitKey);
    expect(placements[0].path[2].key).not.toBe(placements[1].path[2].key);
  });

  it("lets an explicit member row win over the alias", () => {
    const rows = seedLensRows();
    rows.members.push({
      unitKey: "token:t1",
      regionId: "natur.physik.mechanik",
    });
    const [placement] = deriveWeltwissen(
      [unit("t1", "chemie/reaktionen")],
      rows,
      [],
    );
    expect(placement.source).toBe("member");
    expect(keys(placement.path)).toEqual([
      "natur",
      "natur.physik",
      "natur.physik.mechanik",
    ]);
  });
});

describe("Schule derivation", () => {
  it("places a unit bound to grades 7 and 9 on the grade-7 island", () => {
    const [placement] = deriveSchule(
      [unit("a1", "mathematik/geometrie", { atomId: "a1" })],
      { regions: [], aliases: [], members: [] },
      [binding("a1", 9), binding("a1", 7)],
    );
    expect(placement.source).toBe("binding");
    expect(keys(placement.path)).toEqual([
      "realschule-7",
      "realschule-7.mathematik",
      "realschule-7.mathematik.thema-7",
    ]);
    expect(placement.path[0].name).toBe("7. Klasse");
    expect(placement.path[1].name).toBe("Mathematik");
    expect(placement.path[2].name).toBe("Thema 7");
  });

  it("names the school type when the library holds several", () => {
    const placements = deriveSchule(
      [
        unit("a1", "mathematik", { atomId: "a1" }),
        unit("a2", "mathematik", { atomId: "a2" }),
      ],
      { regions: [], aliases: [], members: [] },
      [binding("a1", 9), binding("a2", 9, { schoolType: "gymnasium" })],
    );
    expect(placements[0].path[0].name).toBe("9. Klasse Realschule");
    expect(placements[1].path[0].name).toBe("9. Klasse Gymnasium");
  });

  it("reads grade and subject from a LehrplanPLUS link without an atom", () => {
    const [placement] = deriveSchule(
      [
        unit("t1", "physik/optik", {
          curriculumLink:
            "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/physik/wpfg1#123",
        }),
      ],
      { regions: [], aliases: [], members: [] },
      [],
    );
    expect(keys(placement.path)).toEqual([
      "realschule-9",
      "realschule-9.physik",
      "realschule-9.physik.optik",
    ]);
  });

  it("puts an unbound unit outside the curriculum", () => {
    const [placement] = deriveSchule(
      [unit("t1", "kochen/teig")],
      { regions: [], aliases: [], members: [] },
      [],
    );
    expect(placement.source).toBe("unsorted");
    expect(placement.path[0].key).toBe(OUTSIDE_CURRICULUM_KEY);
  });
});

describe("cleanTopic", () => {
  it("drops the subject-grade prefix and a repeated Gebiet", () => {
    expect(
      cleanTopic("Mathematik 9: Quadratische Funktionen", "Mathematik", ""),
    ).toBe("Quadratische Funktionen");
    expect(cleanTopic("Geometrie – Dreiecke", "Mathematik", "Geometrie")).toBe(
      "Dreiecke",
    );
    // A dash that does not repeat the Fach or Gebiet stays.
    expect(cleanTopic("Licht – Schatten", "Physik", "")).toBe(
      "Licht – Schatten",
    );
  });
});

describe("with a database", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-atlas-lenses-"));
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

  it("creates the world lenses and seed once, keeping ids on a second run", async () => {
    await ensureWorldLenses(db);
    const lensId = await findLensId(db, "welt", "weltwissen");
    const schuleId = await findLensId(db, "welt", "schule");
    expect(lensId).not.toBeNull();
    expect(schuleId).not.toBeNull();
    const first = await loadLensRows(db, lensId);
    const seed = weltwissenSeedRows();
    expect(first.regions).toHaveLength(seed.regions.length);
    expect(first.aliases).toHaveLength(seed.aliases.length);

    await ensureWorldLenses(db);
    expect(await findLensId(db, "welt", "weltwissen")).toBe(lensId);
    const second = await loadLensRows(db, lensId);
    expect(second.regions.map((r) => r.id).sort()).toEqual(
      first.regions.map((r) => r.id).sort(),
    );
  });

  it("keeps a curator's rename across runs", async () => {
    await ensureWorldLenses(db);
    await db
      .prepare(`UPDATE atlas_regions SET name = 'Rechnen' WHERE key = ?`)
      .run("logik.mathematik.zahlen");
    await ensureWorldLenses(db);
    const row = (await db
      .prepare(`SELECT name FROM atlas_regions WHERE key = ?`)
      .get("logik.mathematik.zahlen")) as { name: string };
    expect(row.name).toBe("Rechnen");
  });

  it("places installed tiles and own cards from the database", async () => {
    const tile = listBundledTiles().find((t) =>
      t.atoms.some((a) => a.domain.startsWith("physik/optik")),
    );
    expect(tile).toBeDefined();
    if (!tile) return;
    await installKvtTile(db, tile);
    const own = await createToken(db, {
      slug: "stoffe-erkennen-eigene-notiz",
      concept: "Stoffe an Farbe und Geruch erkennen",
      domain: "chemie/stoffe",
      bloom_level: 1,
    });

    await ensureWorldLenses(db);
    const units = await loadUnits(db);
    const ownUnit = units.find((u) => u.key === `token:${own.id}`);
    expect(ownUnit?.own).toBe(true);
    const published = units.filter((u) => u.atomId !== null);
    expect(published.length).toBeGreaterThan(0);
    expect(published.every((u) => !u.own)).toBe(true);
    // Every practice item of an atom is one unit.
    const tokenCount = published.reduce((n, u) => n + u.tokenIds.length, 0);
    expect(tokenCount).toBeGreaterThanOrEqual(published.length);

    const lensId = await findLensId(db, "welt", "weltwissen");
    const placements = deriveWeltwissen(
      units,
      await loadLensRows(db, lensId),
      await loadBindings(db),
    );
    const optik = placements.filter((p) =>
      published.some((u) => u.key === p.unitKey),
    );
    expect(optik.length).toBeGreaterThan(0);
    for (const placement of optik) {
      expect(keys(placement.path).slice(0, 2)).toEqual([
        "natur",
        "natur.physik",
      ]);
    }
    const ownPlacement = placements.find((p) => p.unitKey === ownUnit?.key);
    expect(keys(ownPlacement?.path ?? []).slice(0, 2)).toEqual([
      "natur",
      "natur.chemie",
    ]);
  });
});
