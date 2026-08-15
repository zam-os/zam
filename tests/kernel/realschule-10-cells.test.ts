import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellsWithStatus,
  getBundledCellTile,
  getCard,
  getTokenById,
  listBundledCells,
  openDatabase,
} from "../../src/kernel/index.js";

const RS10_CELL_IDS = [
  "de-by:realschule-10-mathematik-ebene-vektorgeometrie",
  "de-by:realschule-10-mathematik-exponential-logarithmus",
  "de-by:realschule-10-physik-kernphysik-strahlung",
  "de-by:realschule-10-physik-induktion-wechselstrom",
  "de-by:realschule-10-chemie-organik-kohlenwasserstoffe",
  "de-by:realschule-10-chemie-saeuren-basen-neutralisation",
  "de-by:realschule-10-biologie-evolution-abstammung",
  "de-by:realschule-10-bwr-kosten-leistungsrechnung-kalkulation-bilanzanalyse",
  "de-by:realschule-10-geschichte-kalter-krieg-teilung-wiedervereinigung",
  "de-by:realschule-10-wirtschaft-recht-strafrecht-arbeitsrecht-sozialstaat",
  "de-by:realschule-10-deutsch-dialektische-eroerterung-textanalyse-stilmittel",
  "de-by:realschule-10-englisch-abschlusspruefung-text-production-mediation",
];

describe("Realschule Bayern 10 Curriculum Cells (Abschlussprüfung)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rs10-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all bundled cells including all 12 Realschule 10 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(100);

    for (const cellId of RS10_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(cell, `Cell ${cellId} must be present`).toBeDefined();
      expect(cell?.atomCount).toBeGreaterThanOrEqual(2);
    }
  });

  it("finds all Grade 10 Realschule cells using findBundledCellsForScope", () => {
    const rs10Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 10,
    });
    expect(rs10Cells.length).toBeGreaterThanOrEqual(12);
    for (const cellId of RS10_CELL_IDS) {
      expect(
        rs10Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into BwR 10 KLR und Deckungsbeitrag", async () => {
    const user = "learner-rs10-bwr";
    const cellId = "de-by:realschule-10-bwr-kosten-leistungsrechnung-kalkulation-bilanzanalyse";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items

    const token = await getTokenById(db, "01K4WAK0000000000000000J03");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("db = p - k_v");
  });

  it("installs and enrols cleanly into Deutsch 10 Dialektische Erörterung", async () => {
    const user = "learner-rs10-deu";
    const cellId = "de-by:realschule-10-deutsch-dialektische-eroerterung-textanalyse-stilmittel";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("installs and enrols cleanly into Geschichte 10 Kalter Krieg und deutsche Einheit", async () => {
    const user = "learner-rs10-ges";
    const cellId = "de-by:realschule-10-geschichte-kalter-krieg-teilung-wiedervereinigung";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("supports simultaneous co-enrolment in ALL 12 Grade 10 cells without conflict", async () => {
    const user = "complete-rs10-candidate";

    let totalCards = 0;
    for (const cellId of RS10_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // 7 cells * 8 + 5 cells * 4 = 56 + 20 = 76 cards
    expect(totalCards).toBe(76);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(76);
  });
});
