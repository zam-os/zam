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

const RS8_CELL_IDS = [
  "de-by:realschule-8-mathematik-terme-gleichungen",
  "de-by:realschule-8-mathematik-lineare-funktionen",
  "de-by:realschule-8-mathematik-ebene-geometrie-vierecke",
  "de-by:realschule-8-physik-mechanik-kraft-bewegung",
  "de-by:realschule-8-physik-elektrik-grundlagen",
  "de-by:realschule-8-chemie-stoffe-stoffgemische-trennung",
  "de-by:realschule-8-chemie-chemische-reaktion-oxidation",
  "de-by:realschule-8-biologie-atmung-blutkreislauf",
  "de-by:realschule-8-biologie-ernaehrung-verdauung",
  "de-by:realschule-8-bwr-erfolgskonten-guv-werkstoffe-rabatte",
  "de-by:realschule-8-informatik-objektorientierung-vektorgrafik",
  "de-by:realschule-8-geschichte-aufklaerung-revolution-kaiserreich",
  "de-by:realschule-8-wirtschaft-recht-konsum-geld-jugend",
  "de-by:realschule-8-geographie-tropen-regenwald-passat-wuesten",
  "de-by:realschule-8-deutsch-begruendete-stellungnahme-eroerterung",
  "de-by:realschule-8-englisch-grammar-conditional-reported-speech",
  "de-by:realschule-8-franzoesisch-passe-compose-relativsaetze-adjektive",
];

describe("Realschule Bayern 8 Curriculum Cells (Grundlagenstufe)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rs8-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all bundled cells including all 17 Realschule 8 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(100);

    for (const cellId of RS8_CELL_IDS) {
      const found = cells.find((c) => c.id === cellId);
      expect(found, `Cell ${cellId} must be present`).toBeDefined();
      expect(found?.atomCount).toBeGreaterThanOrEqual(2);
    }
  });

  it("finds all Grade 8 Realschule cells using findBundledCellsForScope", () => {
    const rs8Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 8,
    });
    expect(rs8Cells.length).toBeGreaterThanOrEqual(17);
    for (const cellId of RS8_CELL_IDS) {
      expect(
        rs8Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into BwR 8 Erfolgskonten und Werkstoffe", async () => {
    const user = "learner-rs8-bwr";
    const cellId = "de-by:realschule-8-bwr-erfolgskonten-guv-werkstoffe-rabatte";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items

    const tile = getBundledCellTile(cellId)!;
    expect(tile.atoms).toHaveLength(2);
  });

  it("installs and enrols cleanly into Deutsch 8 Begründete Stellungnahme", async () => {
    const user = "learner-rs8-deu";
    const cellId = "de-by:realschule-8-deutsch-begruendete-stellungnahme-eroerterung";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("installs and enrols cleanly into Englisch 8 Conditional 3 und Reported Speech", async () => {
    const user = "learner-rs8-eng";
    const cellId = "de-by:realschule-8-englisch-grammar-conditional-reported-speech";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("supports simultaneous co-enrolment in ALL 17 Grade 8 cells without conflict", async () => {
    const user = "complete-rs8-candidate";

    let totalCards = 0;
    for (const cellId of RS8_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // 12 cells * 8 + 5 cells * 4 = 96 + 20 = 116 cards
    expect(totalCards).toBe(116);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(116);
  });
});
