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

const GYM6_CELL_IDS = [
  "de-by:gymnasium-6-mathematik-brueche-dezimalbrueche-prozent",
  "de-by:gymnasium-6-mathematik-flaechen-koerper-prisma",
  "de-by:gymnasium-6-biologie-saeugetiere-voegel-leichtbau-flug",
  "de-by:gymnasium-6-biologie-fische-amphibien-reptilien-evolution",
  "de-by:gymnasium-6-natur-technik-informatik-vektorgrafik-texte",
  "de-by:gymnasium-6-geschichte-urgeschichte-aegypten-griechenland",
  "de-by:gymnasium-6-geschichte-rom-imperium-limes-bayern",
  "de-by:gymnasium-6-geographie-europa-raeume-wirtschaft-eu",
  "de-by:gymnasium-6-englisch-past-tenses-present-perfect-adjectives",
];

describe("Gymnasium Bayern 6 Curriculum Cells (Unterstufe / Orientierungsstufe)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-gym6-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all bundled cells including all 9 Gymnasium 6 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(86);

    for (const cellId of GYM6_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(cell, `Cell ${cellId} should be present in bundled cells`).toBeDefined();
      expect(cell?.gradeLabel).toContain("Gymnasium");
      expect(cell?.atomCount).toBe(4);
      expect(cell?.inScopeAtomIds.length).toBe(4);
    }
  });

  it("finds all Grade 6 Gymnasium cells using findBundledCellsForScope", () => {
    const gym6Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "gymnasium",
      grade: 6,
    });
    expect(gym6Cells.length).toBeGreaterThanOrEqual(9);
    for (const cellId of GYM6_CELL_IDS) {
      expect(
        gym6Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into Mathematik 6 Brüche und Prozentrechnung", async () => {
    const userId = "01K4TESTUSERGYM60000000001";
    const cellId = "de-by:gymnasium-6-mathematik-brueche-dezimalbrueche-prozent";

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

  it("installs and enrols cleanly into Geschichte 6 Rom und Römer in Bayern", async () => {
    const userId = "01K4TESTUSERGYM60000000002";
    const cellId = "de-by:gymnasium-6-geschichte-rom-imperium-limes-bayern";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(8);

    const histAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.namespace LIKE 'geschichte-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(histAtoms.length).toBeGreaterThanOrEqual(4);
    expect(
      histAtoms.some((a) => a.slug === "roemer-in-bayern-raetien-noricum-limes-kastelle"),
    ).toBe(true);
  });

  it("installs and enrols cleanly into NuT 6 Vektorgrafik und Dokumentenstrukturen", async () => {
    const userId = "01K4TESTUSERGYM60000000003";
    const cellId = "de-by:gymnasium-6-natur-technik-informatik-vektorgrafik-texte";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(8);

    const itAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.namespace LIKE 'informatik-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(itAtoms.length).toBeGreaterThanOrEqual(4);
  });

  it("supports simultaneous enrolment in ALL 9 Grade 6 Gymnasium cells without conflict", async () => {
    const userId = "01K4TESTUSERALLGYM60000001";

    let totalCardsCreated = 0;
    for (const cellId of GYM6_CELL_IDS) {
      const res = await enrolBundledCell(db, userId, cellId);
      expect(res.success).toBe(true);
      expect(res.installed).toBe(true);
      totalCardsCreated += res.cardsCreated;
    }

    // 9 cells * 4 atoms * 2 items = 72 cards
    expect(totalCardsCreated).toBe(72);

    const statuses = await getBundledCellsWithStatus(db, userId);
    const gym6Statuses = statuses.filter((s) => GYM6_CELL_IDS.includes(s.id));
    expect(gym6Statuses.length).toBe(9);
    for (const status of gym6Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
      expect(status.cardCount).toBe(8);
    }
  });
});
