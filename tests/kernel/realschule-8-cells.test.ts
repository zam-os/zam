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
// The two chemistry cells of this grade moved to the ZAM Academy cell
// zam-academy:chemie-realschule-8 (zam-os/zam-academy#59, #60). Eight of their
// sixteen cards pass their history on, eight retire without transferring
// mastery. See tests/kernel/zam-academy-chemie-realschule-8-cell.test.ts.
// The Englisch 8 grammar cell moved to the ZAM Academy cell
// zam-academy:englisch-realschule-8 (zam-os/zam-academy#67). One of its four
// cards passes its history on; three (two of them Jahrgangsstufe 9 content)
// stay active in libraries that hold them. See
// tests/kernel/zam-academy-englisch-realschule-8-cell.test.ts.
// Biologie 8, Deutsch 8, Französisch 8, Geographie 8 and Geschichte 8 school
// cells moved to tests/fixtures/legacy/ alongside their ZAM Academy
// successors. Two grade-8 school cells remain bundled.
const RS8_CELL_IDS = [
  "de-by:realschule-8-bwr-erfolgskonten-guv-werkstoffe-rabatte",
  "de-by:realschule-8-wirtschaft-recht-konsum-geld-jugend",
];
const ACADEMY_RS8_IDS = [
  "zam-academy:biologie-realschule-8",
  "zam-academy:chemie-realschule-8",
  "zam-academy:deutsch-realschule-8",
  "zam-academy:englisch-realschule-8",
  "zam-academy:franzoesisch-realschule-8",
  "zam-academy:geographie-realschule-8",
  "zam-academy:geschichte-realschule-8",
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
    // Eight school cells and the Academy cells listed above.
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

  it("installs and enrols cleanly into Wirtschaft und Recht 8 Konsum und Geld", async () => {
    const user = "learner-rs8-wur";
    const cellId = "de-by:realschule-8-wirtschaft-recht-konsum-geld-jugend";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(8); // 4 atoms * 2 items
  });

  it("supports simultaneous co-enrolment in the remaining Grade 8 school cells without conflict", async () => {
    const user = "complete-rs8-candidate";

    let totalCards = 0;
    for (const cellId of RS8_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // BwR 4 + Wirtschaft und Recht 8 = 12 cards
    expect(totalCards).toBe(12);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(12);
  });
});
