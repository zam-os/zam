import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCellsWithStatus,
  getBundledCellTile,
  getTokenById,
  listBundledCells,
  openDatabase,
} from "../../src/kernel/index.js";

// Mathematik 7 moved to zam-academy:mathematik-gymnasium-7; both school
// cells are archived in tests/fixtures/legacy/.
const GYM7_CELL_IDS = [
  "de-by:gymnasium-7-physik-optik-lichtbrechung-totalreflexion-linsen",
  "de-by:gymnasium-7-physik-mechanik-kraefte-masse-dichte-druck",
  "de-by:gymnasium-7-informatik-objektorientierung-hypertext-datenstrukturen",
  "de-by:gymnasium-7-deutsch-konjunktiv-indirekte-rede-passiv-syntax",
  "de-by:gymnasium-7-deutsch-texte-inhaltsangabe-ballade-interpretation",
  "de-by:gymnasium-7-englisch-grammar-present-perfect-modals-conditionals",
  "de-by:gymnasium-7-latein-aci-partizipialkonstruktionen-deklinationen",
  "de-by:gymnasium-7-franzoesisch-passe-compose-relativsaetze-verneinung",
  "de-by:gymnasium-7-biologie-sinnesorgane-auge-ohr-nervensystem-skelett",
  "de-by:gymnasium-7-geographie-europa-naturraeume-klima-plattentektonik",
  "de-by:gymnasium-7-geschichte-mittelalter-frankenreich-staedte-kreuzzuege-reformation",
];
const ACADEMY_GYM7_IDS = ["zam-academy:mathematik-gymnasium-7"];

describe("Gymnasium Bayern 7 Curriculum Cells (G9 LehrplanPLUS)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-gym7-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("lists all remaining Gymnasium 7 school cells and their Academy successor", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(122);

    for (const cellId of GYM7_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(cell, `Cell ${cellId} must be present`).toBeDefined();
      expect(cell?.gradeLabel).toContain("Gymnasium");
      expect(cell?.atomCount).toBeGreaterThanOrEqual(2);
    }
    for (const cellId of ACADEMY_GYM7_IDS) {
      expect(
        cells.find((c) => c.id === cellId),
        `Academy cell ${cellId} must be present`,
      ).toBeDefined();
    }
  });

  it("finds all Grade 7 Gymnasium cells using findBundledCellsForScope", () => {
    const gym7Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "gymnasium",
      grade: 7,
    });
    expect(gym7Cells.length).toBeGreaterThanOrEqual(
      GYM7_CELL_IDS.length + ACADEMY_GYM7_IDS.length,
    );
    for (const cellId of [...GYM7_CELL_IDS, ...ACADEMY_GYM7_IDS]) {
      expect(
        gym7Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into Academy Mathematik 7 Gymnasium", async () => {
    const user = "learner-gym7-mathe";
    const cellId = "zam-academy:mathematik-gymnasium-7";
    const tile = getBundledCellTile(cellId)!;

    const res = await enrolBundledCell(db, user, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(132); // 44 atoms * 3 items

    const firstItem = tile.atoms[0]?.practice_items[0];
    expect(firstItem).toBeDefined();
    const token = await getTokenById(db, firstItem!.id);
    expect(token).toBeDefined();
  });

  it("installs and enrols cleanly into Latein 7 AcI und PC", async () => {
    const user = "learner-gym7-latein";
    const cellId =
      "de-by:gymnasium-7-latein-aci-partizipialkonstruktionen-deklinationen";

    const res = await enrolBundledCell(db, user, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(4); // 2 atoms * 2 items

    const token = await getTokenById(db, "01K4T7A0000000000000000J01");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("Nominativ");
  });

  it("installs and enrols cleanly into Physik 7 Optik und Brechung", async () => {
    const user = "learner-gym7-physik";
    const cellId =
      "de-by:gymnasium-7-physik-optik-lichtbrechung-totalreflexion-linsen";

    const res = await enrolBundledCell(db, user, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(4); // 2 atoms * 2 items

    const token = await getTokenById(db, "01K4P7X0000000000000000J03");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("optisch DICHTEREN");
  });

  it("supports simultaneous co-enrolment in ALL 11 remaining Grade 7 Gymnasium school cells without conflict", async () => {
    const user = "complete-gym7-candidate";

    let totalCards = 0;
    for (const cellId of GYM7_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // 11 school cells (2 atoms * 2 items = 4 cards each) = 44 cards
    expect(totalCards).toBe(44);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(44);

    const statuses = await getBundledCellsWithStatus(db, user);
    const gym7Statuses = statuses.filter((s) => GYM7_CELL_IDS.includes(s.id));
    expect(gym7Statuses.length).toBe(11);
    for (const status of gym7Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
    }
  });
});
