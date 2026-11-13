import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
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
// zam-academy:geschichte-realschule-10 (#45) and the BwR cell to
// zam-academy:bwr-realschule-10 (#50, mapping approved in #51).
// Deutsch 10 (#46) and Englisch 10 (#49) school cells also moved to
// tests/fixtures/legacy/ alongside their Academy successors; Wirtschaft und Recht
// 10 stays bundled as the remaining Realschule 10 school cell. Politik und
// Gesellschaft 10 (#52) has no earlier PuG-10 school cell to replace. Französisch
// 10 (#54) is bound to Wahlpflichtfächergruppe IIIa.
const RS10_CELL_IDS = [
  "de-by:realschule-10-wirtschaft-recht-strafrecht-arbeitsrecht-sozialstaat",
];
const ACADEMY_RS10_IDS = [
  "zam-academy:biologie-realschule-10",
  "zam-academy:bwr-realschule-10",
  "zam-academy:chemie-realschule-10",
  "zam-academy:deutsch-realschule-10",
  "zam-academy:englisch-realschule-10",
  "zam-academy:franzoesisch-realschule-10",
  "zam-academy:geschichte-realschule-10",
  "zam-academy:mathematik-realschule-10",
  "zam-academy:physik-realschule-10",
  "zam-academy:politik-realschule-10",
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

  it("lists the remaining Realschule 10 school cell and the Academy offerings", () => {
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

  it("installs and enrols cleanly into Wirtschaft und Recht 10", async () => {
    const user = "learner-rs10-wur";
    const cellId =
      "de-by:realschule-10-wirtschaft-recht-strafrecht-arbeitsrecht-sozialstaat";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("enrols the remaining Grade 10 school cell cleanly", async () => {
    const user = "complete-rs10-candidate";

    let totalCards = 0;
    for (const cellId of RS10_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    expect(totalCards).toBe(4);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(4);
  });
});
