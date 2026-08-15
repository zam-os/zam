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

const GYM7_CELL_IDS = [
  "de-by:gymnasium-7-mathematik-symmetrie-winkel-dreiecke-kongruenz",
  "de-by:gymnasium-7-mathematik-rationale-zahlen-gleichungen-prozent",
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

  it("lists all bundled cells including all 13 Gymnasium 7 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(122);

    for (const cellId of GYM7_CELL_IDS) {
      const cell = cells.find((c) => c.id === cellId);
      expect(cell, `Cell ${cellId} must be present`).toBeDefined();
      expect(cell?.gradeLabel).toContain("Gymnasium");
      expect(cell?.atomCount).toBeGreaterThanOrEqual(2);
    }
  });

  it("finds all Grade 7 Gymnasium cells using findBundledCellsForScope", () => {
    const gym7Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "gymnasium",
      grade: 7,
    });
    expect(gym7Cells.length).toBeGreaterThanOrEqual(13);
    for (const cellId of GYM7_CELL_IDS) {
      expect(
        gym7Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into Mathematik 7 Symmetrie und Kongruenz", async () => {
    const user = "learner-gym7-mathe";
    const cellId = "de-by:gymnasium-7-mathematik-symmetrie-winkel-dreiecke-kongruenz";

    const res = await enrolBundledCell(db, user, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(8); // 4 atoms * 2 items

    const token = await getTokenById(db, "01K4M7W0000000000000000J03");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("180°");
  });

  it("installs and enrols cleanly into Latein 7 AcI und PC", async () => {
    const user = "learner-gym7-latein";
    const cellId = "de-by:gymnasium-7-latein-aci-partizipialkonstruktionen-deklinationen";

    const res = await enrolBundledCell(db, user, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(4); // 2 atoms * 2 items

    const token = await getTokenById(db, "01K4T7A0000000000000000J01");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("Nominativ");
  });

  it("installs and enrols cleanly into Physik 7 Optik und Brechung", async () => {
    const user = "learner-gym7-physik";
    const cellId = "de-by:gymnasium-7-physik-optik-lichtbrechung-totalreflexion-linsen";

    const res = await enrolBundledCell(db, user, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(4); // 2 atoms * 2 items

    const token = await getTokenById(db, "01K4P7X0000000000000000J03");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("optisch DICHTEREN");
  });

  it("supports simultaneous co-enrolment in ALL 13 Grade 7 Gymnasium cells without conflict", async () => {
    const user = "complete-gym7-candidate";

    let totalCards = 0;
    for (const cellId of GYM7_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // 1 cell (4 atoms) * 8 + 12 cells (2 atoms) * 4 = 8 + 48 = 56 cards
    // Let's count:
    // Mathe 1: 4 atoms * 2 = 8
    // Mathe 2: 2 atoms * 2 = 4
    // Physik Optik: 2 atoms * 2 = 4
    // Physik Mech: 2 atoms * 2 = 4
    // IT: 2 atoms * 2 = 4
    // D Grammatik: 2 atoms * 2 = 4
    // D Texte: 2 atoms * 2 = 4
    // E: 2 atoms * 2 = 4
    // Latein: 2 atoms * 2 = 4
    // Französisch: 2 atoms * 2 = 4
    // Bio: 2 atoms * 2 = 4
    // Geo: 2 atoms * 2 = 4
    // Gesch: 2 atoms * 2 = 4
    // Total = 8 + 12 * 4 = 56 cards
    expect(totalCards).toBe(56);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(56);

    const statuses = await getBundledCellsWithStatus(db, user);
    const gym7Statuses = statuses.filter((s) => GYM7_CELL_IDS.includes(s.id));
    expect(gym7Statuses.length).toBe(13);
    for (const status of gym7Statuses) {
      expect(status.installed).toBe(true);
      expect(status.enrolled).toBe(true);
    }
  });
});
