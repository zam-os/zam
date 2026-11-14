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

// All nine Realschule 5 school cells moved to ZAM Academy cells
// (biologie-realschule-5, deutsch-realschule-5, englisch-realschule-5,
// geographie-realschule-5, mathematik-realschule-5) and are archived in
// tests/fixtures/legacy/.
const RETIRED_RS5_CELL_IDS = [
  "de-by:realschule-5-biologie-mensch-skelett-bewegung-organe",
  "de-by:realschule-5-biologie-pflanzen-bluetenbau-samen",
  "de-by:realschule-5-natur-technik-mikroskop-experiment-dateien",
  "de-by:realschule-5-geographie-erde-gradnetz-orientierung",
];
const ACADEMY_RS5_IDS = [
  "zam-academy:biologie-realschule-5",
  "zam-academy:deutsch-realschule-5",
  "zam-academy:englisch-realschule-5",
  "zam-academy:geographie-realschule-5",
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

  it("excludes retired Realschule 5 school cells and lists all five Academy successors", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(68);

    for (const cellId of RETIRED_RS5_CELL_IDS) {
      expect(cells.find((c) => c.id === cellId)).toBeUndefined();
      expect(getBundledCell(cellId)).toBeUndefined();
      expect(getBundledCellTile(cellId)).toBeUndefined();
    }
    for (const cellId of ACADEMY_RS5_IDS) {
      expect(
        cells.find((c) => c.id === cellId),
        `Academy cell ${cellId} should be present`,
      ).toBeDefined();
    }
  });

  it("finds all Grade 5 Realschule Academy cells using findBundledCellsForScope", () => {
    const rs5Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 5,
    });
    expect(rs5Cells.length).toBeGreaterThanOrEqual(ACADEMY_RS5_IDS.length);
    for (const cellId of ACADEMY_RS5_IDS) {
      expect(
        rs5Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
    for (const cellId of RETIRED_RS5_CELL_IDS) {
      expect(rs5Cells.some((c) => c.id === cellId)).toBe(false);
    }
  });

  it("installs and enrols cleanly into Biologie 5 Realschule Academy", async () => {
    const userId = "01K4TESTUSER000000000000001";
    const cellId = "zam-academy:biologie-realschule-5";

    expect(await isBundledCellInstalled(db, cellId)).toBe(false);

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.installed).toBe(true);
    expect(res.cardsCreated).toBe(50);
    expect(res.alreadyEnrolled).toBe(false);

    expect(await isBundledCellInstalled(db, cellId)).toBe(true);
    const enrolment = await getBundledCellEnrolment(db, userId, cellId);
    expect(enrolment.installed).toBe(true);
    expect(enrolment.enrolled).toBe(true);
    expect(enrolment.cardCount).toBe(50);
  });

  it("installs and enrols cleanly into Geographie 5 Realschule Academy", async () => {
    const userId = "01K4TESTUSER000000000000003";
    const cellId = "zam-academy:geographie-realschule-5";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(62);

    const geoAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.slug LIKE 'geo5-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(geoAtoms.length).toBeGreaterThanOrEqual(31);
  });

  it("supports simultaneous enrolment in all Grade 5 Realschule Academy cells without conflict", async () => {
    const userId = "01K4TESTUSERALLRS5000000001";

    for (const cellId of ACADEMY_RS5_IDS) {
      const res = await enrolBundledCell(db, userId, cellId);
      expect(res.success).toBe(true);
      expect(res.installed).toBe(true);
      expect(res.cardsCreated).toBeGreaterThan(0);
    }

    const statuses = await getBundledCellsWithStatus(db, userId);
    const rs5Statuses = statuses.filter((s) => ACADEMY_RS5_IDS.includes(s.id));
    expect(rs5Statuses.length).toBe(ACADEMY_RS5_IDS.length);
    for (const status of rs5Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
      expect(status.cardCount).toBeGreaterThan(0);
    }
  });
});
