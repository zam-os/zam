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

// The evolution cell moved to the ZAM Academy cell
// zam-academy:biologie-realschule-10 (zam-os/zam-academy#16), the two
// physics cells to zam-academy:physik-realschule-10 (#17) and the two
// mathematics cells to zam-academy:mathematik-realschule-10 (#23). Their
// items replace or retire the old ones explicitly. See
// tests/kernel/zam-academy-*-realschule-10-cell.test.ts. The two chemistry
// cells moved to zam-academy:chemie-realschule-10 (#43), the history cell to
// zam-academy:geschichte-realschule-10 (#45).
const RS10_CELL_IDS = [
  "de-by:realschule-10-bwr-kosten-leistungsrechnung-kalkulation-bilanzanalyse",
  "de-by:realschule-10-wirtschaft-recht-strafrecht-arbeitsrecht-sozialstaat",
  "de-by:realschule-10-deutsch-dialektische-eroerterung-textanalyse-stilmittel",
  "de-by:realschule-10-englisch-abschlusspruefung-text-production-mediation",
];
const ACADEMY_RS10_IDS = [
  "zam-academy:biologie-realschule-10",
  "zam-academy:chemie-realschule-10",
  "zam-academy:geschichte-realschule-10",
  "zam-academy:mathematik-realschule-10",
  "zam-academy:physik-realschule-10",
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

  it("lists the 4 Realschule 10 school cells and their Academy successors", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(100);

    for (const cellId of [...RS10_CELL_IDS, ...ACADEMY_RS10_IDS]) {
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
    expect(rs10Cells.length).toBeGreaterThanOrEqual(
      RS10_CELL_IDS.length + ACADEMY_RS10_IDS.length,
    );
    for (const cellId of [...RS10_CELL_IDS, ...ACADEMY_RS10_IDS]) {
      expect(
        rs10Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into BwR 10 KLR und Deckungsbeitrag", async () => {
    const user = "learner-rs10-bwr";
    const cellId =
      "de-by:realschule-10-bwr-kosten-leistungsrechnung-kalkulation-bilanzanalyse";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items

    const token = await getTokenById(db, "01K4WAK0000000000000000J03");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("db = p - k_v");
  });

  it("installs and enrols cleanly into Deutsch 10 Dialektische Erörterung", async () => {
    const user = "learner-rs10-deu";
    const cellId =
      "de-by:realschule-10-deutsch-dialektische-eroerterung-textanalyse-stilmittel";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("supports simultaneous co-enrolment in the 4 Grade 10 school cells without conflict", async () => {
    const user = "complete-rs10-candidate";

    let totalCards = 0;
    for (const cellId of RS10_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // 4 cells * 4 = 16 cards
    expect(totalCards).toBe(16);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(16);
  });
});
