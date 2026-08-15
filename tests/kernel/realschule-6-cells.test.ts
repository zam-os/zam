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

const RS6_CELL_IDS = [
  "de-by:realschule-6-mathematik-brueche-dezimalbrueche",
  "de-by:realschule-6-mathematik-flaechen-raum-volumen",
  "de-by:realschule-6-biologie-saeugetiere-wirbeltiere-hunde-katzen",
  "de-by:realschule-6-biologie-voegel-fische-amphibien-reptilien",
  "de-by:realschule-6-informatik-textverarbeitung-praesentation",
  "de-by:realschule-6-geschichte-urgeschichte-antike",
  "de-by:realschule-6-geographie-deutschland-bayern-raum",
  "de-by:realschule-6-englisch-grammatik-grundlagen",
  "de-by:realschule-6-deutsch-wortarten-satzglieder-rechtschreibung",
  "de-by:realschule-6-deutsch-texte-bericht-vorgangsbeschreibung",
];

describe("Realschule Bayern 6 Curriculum Cells (Einführungs- und Orientierungsstufe)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rs6-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all bundled cells including all 10 Realschule 6 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(100);

    for (const cellId of RS6_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(cell, `Cell ${cellId} should be present in bundled cells`).toBeDefined();
      expect(cell?.gradeLabel).toContain("Realschule");
      expect(cell?.atomCount).toBeGreaterThanOrEqual(2);
      expect(cell?.inScopeAtomIds.length).toBe(cell?.atomCount);
    }
  });

  it("finds all Grade 6 Realschule cells using findBundledCellsForScope", () => {
    const rs6Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 6,
    });
    expect(rs6Cells.length).toBeGreaterThanOrEqual(10);
    for (const cellId of RS6_CELL_IDS) {
      expect(
        rs6Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into Mathematik 6 Brüche und Dezimalbrüche", async () => {
    const userId = "01K4TESTUSER000000000000001";
    const cellId = "de-by:realschule-6-mathematik-brueche-dezimalbrueche";

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

  it("installs and enrols cleanly into Deutsch 6 Berichte und Vorgangsbeschreibung", async () => {
    const userId = "01K4TESTUSER000000000000004";
    const cellId = "de-by:realschule-6-deutsch-texte-bericht-vorgangsbeschreibung";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(4); // 2 atoms * 2 items

    const reportAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.slug = 'unfallbericht-sachbericht-w-fragen-praeteritum-stil'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(reportAtoms.length).toBe(1);
  });

  it("supports simultaneous enrolment in ALL 10 Grade 6 Realschule cells without conflict", async () => {
    const userId = "01K4TESTUSERALLRS6000000001";

    let totalCardsCreated = 0;
    for (const cellId of RS6_CELL_IDS) {
      const res = await enrolBundledCell(db, userId, cellId);
      expect(res.success).toBe(true);
      expect(res.installed).toBe(true);
      totalCardsCreated += res.cardsCreated;
    }

    // 9 cells * 8 + 1 cell * 4 = 72 + 4 = 76 cards
    expect(totalCardsCreated).toBe(76);

    const statuses = await getBundledCellsWithStatus(db, userId);
    const rs6Statuses = statuses.filter((s) => RS6_CELL_IDS.includes(s.id));
    expect(rs6Statuses.length).toBe(10);
    for (const status of rs6Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
      expect(status.cardCount).toBeGreaterThanOrEqual(4);
    }
  });
});
