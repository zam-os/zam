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

// Mathematik 8 comes from the ZAM Academy cell
// zam-academy:mathematik-realschule-8 (zam-academy-mathematik-realschule-8-cell.test.ts);
// its three school cells were version 1 and are no longer bundled.
// The two physics cells of this grade moved to the ZAM Academy cell
// zam-academy:physik-realschule-8 (zam-os/zam-academy#24, #37). Four of their
// sixteen cards pass their history on, ten retire without transferring
// mastery, and two (Jahrgangsstufe 9 content) stay active in libraries that
// hold them. See tests/kernel/zam-academy-physik-realschule-8-cell.test.ts.
// The Informatik cells of grades 6, 7 and 8 moved to the ZAM Academy cell
// zam-academy:informatik-realschule-8 (zam-os/zam-academy#62). Eleven of their
// 24 cards pass their history on, thirteen retire without transferring
// mastery. See tests/kernel/zam-academy-informatik-realschule-8-cell.test.ts.
const RS8_CELL_IDS = [
  "de-by:realschule-8-chemie-stoffe-stoffgemische-trennung",
  "de-by:realschule-8-chemie-chemische-reaktion-oxidation",
  "de-by:realschule-8-biologie-atmung-blutkreislauf",
  "de-by:realschule-8-biologie-ernaehrung-verdauung",
  "de-by:realschule-8-bwr-erfolgskonten-guv-werkstoffe-rabatte",
  "de-by:realschule-8-geschichte-aufklaerung-revolution-kaiserreich",
  "de-by:realschule-8-wirtschaft-recht-konsum-geld-jugend",
  "de-by:realschule-8-geographie-tropen-regenwald-passat-wuesten",
  "de-by:realschule-8-deutsch-begruendete-stellungnahme-eroerterung",
  "de-by:realschule-8-englisch-grammar-conditional-reported-speech",
  "de-by:realschule-8-franzoesisch-passe-compose-relativsaetze-adjektive",
];
const ACADEMY_RS8_IDS = [
  "zam-academy:informatik-realschule-8",
  "zam-academy:mathematik-realschule-8",
  "zam-academy:physik-realschule-8",
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

  it("lists the remaining Realschule 8 school cells and their Academy successors", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(100);

    for (const cellId of [...RS8_CELL_IDS, ...ACADEMY_RS8_IDS]) {
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
    // Eleven school cells and the Academy cells listed above.
    expect(rs8Cells.length).toBeGreaterThanOrEqual(
      RS8_CELL_IDS.length + ACADEMY_RS8_IDS.length,
    );
    for (const cellId of [...RS8_CELL_IDS, ...ACADEMY_RS8_IDS]) {
      expect(
        rs8Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into BwR 8 Erfolgskonten und Werkstoffe", async () => {
    const user = "learner-rs8-bwr";
    const cellId =
      "de-by:realschule-8-bwr-erfolgskonten-guv-werkstoffe-rabatte";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items

    const tile = getBundledCellTile(cellId)!;
    expect(tile.atoms).toHaveLength(2);
  });

  it("installs and enrols cleanly into Deutsch 8 Begründete Stellungnahme", async () => {
    const user = "learner-rs8-deu";
    const cellId =
      "de-by:realschule-8-deutsch-begruendete-stellungnahme-eroerterung";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("installs and enrols cleanly into Englisch 8 Conditional 3 und Reported Speech", async () => {
    const user = "learner-rs8-eng";
    const cellId =
      "de-by:realschule-8-englisch-grammar-conditional-reported-speech";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("supports simultaneous co-enrolment in the remaining Grade 8 school cells without conflict", async () => {
    const user = "complete-rs8-candidate";

    let totalCards = 0;
    for (const cellId of RS8_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // 6 cells * 8 + 5 cells * 4 = 48 + 20 = 68 cards
    expect(totalCards).toBe(68);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(68);
  });
});
