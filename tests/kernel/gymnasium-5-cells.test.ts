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

const GYM5_CELL_IDS = [
  "de-by:gymnasium-5-mathematik-zahlen-rechengesetze-terme",
  "de-by:gymnasium-5-mathematik-geometrie-flaechen-volumen",
  "de-by:gymnasium-5-biologie-mensch-skelett-sexualbiologie",
  "de-by:gymnasium-5-biologie-pflanzen-bluetenbau-samen",
  "de-by:gymnasium-5-natur-technik-mikroskop-experiment-oop",
  "de-by:gymnasium-5-geographie-erde-gradnetz-orientierung",
  "de-by:gymnasium-5-deutsch-erzaehlen-maerchen-fabeln",
  "de-by:gymnasium-5-deutsch-grammatik-faelle-rechtschreibung",
  "de-by:gymnasium-5-englisch-starter-grammar-tenses",
];

describe("Gymnasium Bayern 5 Curriculum Cells (Unterstufe / G9)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-gym5-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all bundled cells including all 9 Gymnasium 5 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(77);

    for (const cellId of GYM5_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(cell, `Cell ${cellId} should be present in bundled cells`).toBeDefined();
      expect(cell?.gradeLabel).toContain("Gymnasium");
      expect(cell?.atomCount).toBe(4);
      expect(cell?.inScopeAtomIds.length).toBe(4);
    }
  });

  it("finds all Grade 5 Gymnasium cells using findBundledCellsForScope", () => {
    const gym5Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "gymnasium",
      grade: 5,
    });
    expect(gym5Cells.length).toBeGreaterThanOrEqual(9);
    for (const cellId of GYM5_CELL_IDS) {
      expect(
        gym5Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into Mathematik 5 Ganze Zahlen und Kombinatorik", async () => {
    const userId = "01K4TESTUSERGYM50000000001";
    const cellId = "de-by:gymnasium-5-mathematik-zahlen-rechengesetze-terme";

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

  it("installs and enrols cleanly into NuT 5 Erkenntnisweg und OOM", async () => {
    const userId = "01K4TESTUSERGYM50000000002";
    const cellId = "de-by:gymnasium-5-natur-technik-mikroskop-experiment-oop";

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
      nutAtoms.some((a) => a.slug === "objektorientierte-modellierung-klasse-objekt-zustand"),
    ).toBe(true);
  });

  it("installs and enrols cleanly into Deutsch 5 Märchen, Fabeln und Erlebniserzählung", async () => {
    const userId = "01K4TESTUSERGYM50000000003";
    const cellId = "de-by:gymnasium-5-deutsch-erzaehlen-maerchen-fabeln";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(8);

    const dAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.namespace LIKE 'deutsch-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(dAtoms.length).toBeGreaterThanOrEqual(4);
  });

  it("supports simultaneous enrolment in ALL 9 Grade 5 Gymnasium cells without conflict", async () => {
    const userId = "01K4TESTUSERALLGYM50000001";

    let totalCardsCreated = 0;
    for (const cellId of GYM5_CELL_IDS) {
      const res = await enrolBundledCell(db, userId, cellId);
      expect(res.success).toBe(true);
      expect(res.installed).toBe(true);
      totalCardsCreated += res.cardsCreated;
    }

    // 9 cells * 4 atoms * 2 items = 72 cards
    expect(totalCardsCreated).toBe(72);

    const statuses = await getBundledCellsWithStatus(db, userId);
    const gym5Statuses = statuses.filter((s) => GYM5_CELL_IDS.includes(s.id));
    expect(gym5Statuses.length).toBe(9);
    for (const status of gym5Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
      expect(status.cardCount).toBe(8);
    }
  });
});
