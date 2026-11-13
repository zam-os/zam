import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellEnrolment,
  getBundledCellsWithStatus,
  getBundledCellTile,
  isBundledCellInstalled,
  listBundledCells,
  openDatabase,
} from "../../src/kernel/index.js";

// Mathematik 5, Englisch 5 and Deutsch 5 moved to their ZAM Academy cells
// (zam-academy:mathematik-realschule-5, zam-academy:englisch-realschule-5,
// zam-academy:deutsch-realschule-5); their five school cells are archived in
// tests/fixtures/legacy/.
const RS5_CELL_IDS = [
  "de-by:realschule-5-biologie-mensch-skelett-bewegung-organe",
  "de-by:realschule-5-biologie-pflanzen-bluetenbau-samen",
  "de-by:realschule-5-natur-technik-mikroskop-experiment-dateien",
  "de-by:realschule-5-geographie-erde-gradnetz-orientierung",
];
const ACADEMY_RS5_IDS = [
  "zam-academy:deutsch-realschule-5",
  "zam-academy:englisch-realschule-5",
  "zam-academy:mathematik-realschule-5",
];

describe("Realschule Bayern 5 Curriculum Cells (Eingangsstufe)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rs5-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all remaining Realschule 5 school cells and their Academy successors", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(68);

    for (const cellId of RS5_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(
        cell,
        `Cell ${cellId} should be present in bundled cells`,
      ).toBeDefined();
      expect(cell?.gradeLabel).toContain("Realschule");
      expect(cell?.atomCount).toBe(4);
      expect(cell?.inScopeAtomIds.length).toBe(4);
    }
    for (const cellId of ACADEMY_RS5_IDS) {
      expect(
        cells.find((c) => c.id === cellId),
        `Academy cell ${cellId} should be present`,
      ).toBeDefined();
    }
  });

  it("finds all Grade 5 Realschule cells using findBundledCellsForScope", () => {
    const rs5Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 5,
    });
    expect(rs5Cells.length).toBeGreaterThanOrEqual(
      RS5_CELL_IDS.length + ACADEMY_RS5_IDS.length,
    );
    for (const cellId of [...RS5_CELL_IDS, ...ACADEMY_RS5_IDS]) {
      expect(
        rs5Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into Biologie 5 Skelett und Organe", async () => {
    const userId = "01K4TESTUSER000000000000001";
    const cellId = "de-by:realschule-5-biologie-mensch-skelett-bewegung-organe";

    expect(await isBundledCellInstalled(db, cellId)).toBe(false);

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.installed).toBe(true);
    expect(res.cardsCreated).toBe(8); // 4 atoms * 2 practice items
    expect(res.alreadyEnrolled).toBe(false);

    expect(await isBundledCellInstalled(db, cellId)).toBe(true);
    const enrolment = await getBundledCellEnrolment(db, userId, cellId);
    expect(enrolment.installed).toBe(true);
    expect(enrolment.enrolled).toBe(true);
    expect(enrolment.cardCount).toBe(8);
  });

  it("installs and enrols cleanly into NuT 5 Naturwissenschaftliches Arbeiten und Informatik", async () => {
    const userId = "01K4TESTUSER000000000000002";
    const cellId =
      "de-by:realschule-5-natur-technik-mikroskop-experiment-dateien";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(8);

    const nutAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.namespace LIKE 'nut-%' OR a.namespace LIKE 'informatik-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(nutAtoms.length).toBeGreaterThanOrEqual(4);
    expect(
      nutAtoms.some(
        (a) =>
          a.slug ===
          "naturwissenschaftlicher-erkenntnisweg-experiment-kontrollansatz",
      ),
    ).toBe(true);
  });

  it("installs and enrols cleanly into Geographie 5 Erde und Gradnetz", async () => {
    const userId = "01K4TESTUSER000000000000003";
    const cellId = "de-by:realschule-5-geographie-erde-gradnetz-orientierung";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(8);

    const geoAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.namespace LIKE 'geographie-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(geoAtoms.length).toBeGreaterThanOrEqual(4);
  });

  it("supports simultaneous enrolment in all remaining Grade 5 Realschule school cells without conflict", async () => {
    const userId = "01K4TESTUSERALLRS5000000001";

    let totalCardsCreated = 0;
    for (const cellId of RS5_CELL_IDS) {
      const res = await enrolBundledCell(db, userId, cellId);
      expect(res.success).toBe(true);
      expect(res.installed).toBe(true);
      totalCardsCreated += res.cardsCreated;
    }

    // 4 cells * 4 atoms * 2 items = 32 cards
    expect(totalCardsCreated).toBe(32);

    const statuses = await getBundledCellsWithStatus(db, userId);
    const rs5Statuses = statuses.filter((s) => RS5_CELL_IDS.includes(s.id));
    expect(rs5Statuses.length).toBe(RS5_CELL_IDS.length);
    for (const status of rs5Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
      expect(status.cardCount).toBe(8);
    }
  });
});
