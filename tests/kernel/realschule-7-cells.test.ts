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

const RS7_CELL_IDS = [
  "de-by:realschule-7-mathematik-rationale-zahlen-terme",
  "de-by:realschule-7-mathematik-prozent-zinsrechnung",
  "de-by:realschule-7-mathematik-geometrie-achsen-punktsymmetrie",
  "de-by:realschule-7-mathematik-kongruenz-dreiecke-vektoren",
  "de-by:realschule-7-physik-mechanik-bewegung-geschwindigkeit",
  "de-by:realschule-7-physik-waermelehre-temperatur-ausdehnung",
  "de-by:realschule-7-biologie-wirbeltiere-oekologie",
  "de-by:realschule-7-biologie-pflanzen-fotosynthese",
  "de-by:realschule-7-bwr-unternehmen-inventur-bilanz",
  "de-by:realschule-7-bwr-bestandskonten-buchungssatz-eroeffnung",
  "de-by:realschule-7-informatik-informationsdarstellung-dateisystem",
  "de-by:realschule-7-geschichte-mittelalter-fruehe-neuzeit",
  "de-by:realschule-7-geographie-europa-raum-wirtschaft",
  "de-by:realschule-7-deutsch-inhaltsangabe-sachtexte-literatur",
  "de-by:realschule-7-deutsch-satzstrukturen-adverbialsaetze-kommasetzung",
  "de-by:realschule-7-englisch-grammatik-tenses",
  "de-by:realschule-7-franzoesisch-starter-grammatik-verben",
];

describe("Realschule Bayern 7 Curriculum Cells (Einführungs- und Fundamentstufe)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rs7-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all bundled cells including all 17 Realschule 7 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(96);

    for (const cellId of RS7_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(
        cell,
        `Cell ${cellId} should be present in bundled cells`,
      ).toBeDefined();
      expect(cell?.gradeLabel).toContain("Realschule");
      expect(cell?.atomCount).toBeGreaterThanOrEqual(2);
      expect(cell?.inScopeAtomIds.length).toBe(cell?.atomCount);
    }
  });

  it("finds all Grade 7 Realschule cells using findBundledCellsForScope", () => {
    const rs7Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 7,
    });
    expect(rs7Cells.length).toBeGreaterThanOrEqual(17);
    for (const cellId of RS7_CELL_IDS) {
      expect(
        rs7Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into BwR 7 Inventur und Bilanz", async () => {
    const userId = "01K4TESTUSERBWR70000000001";
    const cellId = "de-by:realschule-7-bwr-unternehmen-inventur-bilanz";

    expect(await isBundledCellInstalled(db, cellId)).toBe(false);

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.installed).toBe(true);
    expect(res.cardsCreated).toBe(6); // 3 atoms * 2 practice items
    expect(res.alreadyEnrolled).toBe(false);

    expect(await isBundledCellInstalled(db, cellId)).toBe(true);
    const enrolment = await getBundledCellEnrolment(db, userId, cellId);
    expect(enrolment.installed).toBe(true);
    expect(enrolment.enrolled).toBe(true);
    expect(enrolment.cardCount).toBe(6);
  });

  it("installs and enrols cleanly into Deutsch 7 Satzstrukturen und Rechtschreibung", async () => {
    const userId = "01K4TESTUSERDEU70000000001";
    const cellId =
      "de-by:realschule-7-deutsch-satzstrukturen-adverbialsaetze-kommasetzung";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(6); // 3 atoms * 2 practice items

    const deuAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.namespace LIKE 'deutsch-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(deuAtoms.length).toBeGreaterThanOrEqual(3);
    expect(
      deuAtoms.some(
        (a) =>
          a.slug === "das-dass-schreibung-ersatzprobe-dieses-jenes-welches",
      ),
    ).toBe(true);
  });

  it("installs and enrols cleanly into Französisch 7 IIIa Starter Grammatik", async () => {
    const userId = "01K4TESTUSERFRA70000000001";
    const cellId = "de-by:realschule-7-franzoesisch-starter-grammatik-verben";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(4); // 2 atoms * 2 practice items

    const fraAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.namespace LIKE 'franzoesisch-%'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(fraAtoms.length).toBe(2);
  });

  it("supports simultaneous enrolment in ALL 17 Grade 7 Realschule cells without conflict", async () => {
    const userId = "01K4TESTUSERALLRS7000000001";

    let totalCardsCreated = 0;
    for (const cellId of RS7_CELL_IDS) {
      const res = await enrolBundledCell(db, userId, cellId);
      expect(res.success).toBe(true);
      expect(res.installed).toBe(true);
      totalCardsCreated += res.cardsCreated;
    }

    // 11 * 8 (44 atoms * 2) + 3*2 (Mathe) + 3*2 (Deu1) + 2*2 (Deu2) + 3*2 (BwR1) + 2*2 (BwR2) + 2*2 (Fra) = 88 + 30 = 118 cards
    expect(totalCardsCreated).toBe(118);

    const statuses = await getBundledCellsWithStatus(db, userId);
    const rs7Statuses = statuses.filter((s) => RS7_CELL_IDS.includes(s.id));
    expect(rs7Statuses.length).toBe(17);
    for (const status of rs7Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
      expect(status.cardCount).toBeGreaterThanOrEqual(4);
    }
  });
});
