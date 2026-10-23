import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCellTile,
  getTokenById,
  listBundledCells,
  openDatabase,
} from "../../src/kernel/index.js";

// The four physics cells of this grade moved to the ZAM Academy cell
// zam-academy:physik-realschule-9 (zam-os/zam-academy#4), the database cell
// to zam-academy:sql (zam-os/zam-academy#8) and the five mathematics cells
// to zam-academy:mathematik-realschule-9 (zam-os/zam-academy#9), and the
// two chemistry cells to zam-academy:chemie-realschule-9 (#10).
// Geographie also moved to zam-academy:geographie-realschule-9 (#15) and
// Geschichte to zam-academy:geschichte-realschule-9 (#14). The two biology
// cells were mislabelled grade 9 (the Realschule has no Biologie 9); they
// moved to zam-academy:biologie-realschule-10 (#16). The algorithms and
// networks cell split into zam-academy:algorithmen and
// zam-academy:datennetze (#18); both are IT modules for any grade. BwR moved
// to zam-academy:bwr-realschule-9 (#19). Explicit replacements preserve
// histories; corrected items are retired without transferring mastery.
// Wirtschaft und Recht 9 moved to zam-academy:wirtschaft-recht-realschule-9
// (zam-os/zam-academy#27, #29). Deutsch 9 has an Academy cell
// (zam-os/zam-academy#30, #31) that retires the old partial school cell.
// See tests/kernel/zam-academy-*-cell.test.ts.
const RS9_CELL_IDS = [
  "de-by:realschule-9-englisch-grammatik-syntax",
  "de-by:realschule-9-franzoesisch-imparfait-futur-objektpronomen",
];
const ACADEMY_RS9_IDS = [
  "zam-academy:physik-realschule-9",
  "zam-academy:sql",
  "zam-academy:mathematik-realschule-9",
  "zam-academy:chemie-realschule-9",
  "zam-academy:geographie-realschule-9",
  "zam-academy:geschichte-realschule-9",
  "zam-academy:algorithmen",
  "zam-academy:datennetze",
  "zam-academy:bwr-realschule-9",
  "zam-academy:wirtschaft-recht-realschule-9",
  "zam-academy:deutsch-realschule-9",
];

describe("Realschule Bayern 9 Curriculum Cells", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rs9-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists the remaining Realschule 9 school cells and their Academy successors", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(100);

    for (const cellId of [...RS9_CELL_IDS, ...ACADEMY_RS9_IDS]) {
      const found = cells.find((c) => c.id === cellId);
      expect(found, `Cell ${cellId} must be present`).toBeDefined();
      expect(found?.atomCount).toBeGreaterThanOrEqual(2);
    }
  });

  it("finds all Grade 9 Realschule cells using findBundledCellsForScope", () => {
    const rs9Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 9,
    });
    // Two school cells and the eleven Academy entries listed above.
    expect(rs9Cells.length).toBeGreaterThanOrEqual(
      RS9_CELL_IDS.length + ACADEMY_RS9_IDS.length,
    );
    for (const cellId of [...RS9_CELL_IDS, ...ACADEMY_RS9_IDS]) {
      expect(
        rs9Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into the full BwR 9 Academy package", async () => {
    const user = "learner-rs9-bwr";
    const cellId = "zam-academy:bwr-realschule-9";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(92);

    const item = getBundledCellTile(cellId)!
      .atoms.flatMap((atom) => atom.practice_items)
      .find((item) => item.slug === "bwr9-gr-vorsteuer-check")!;
    const token = await getTokenById(db, item.id);
    expect(token).toBeDefined();
    expect(token?.concept).toContain("Forderung");
  });

  it("installs and enrols cleanly into Französisch 9 Imparfait und Objektpronomen", async () => {
    const user = "learner-rs9-fra";
    const cellId =
      "de-by:realschule-9-franzoesisch-imparfait-futur-objektpronomen";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("supports simultaneous enrolment in the remaining Grade 9 school cells without conflict", async () => {
    const user = "complete-rs9-polymath";

    let totalCards = 0;
    for (const cellId of RS9_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    const expected = RS9_CELL_IDS.reduce((count, cellId) => {
      const tile = getBundledCellTile(cellId);
      return (
        count +
        (tile?.atoms.reduce(
          (items, atom) => items + atom.practice_items.length,
          0,
        ) ?? 0)
      );
    }, 0);
    expect(totalCards).toBe(expected);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(expected);
  });
});
