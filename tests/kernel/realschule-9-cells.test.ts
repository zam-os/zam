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
  installKvtTile,
  listBundledCells,
  openDatabase,
} from "../../src/kernel/index.js";

const RS9_CELL_IDS = [
  "de-by:realschule-9-physik-elektrik",
  "de-by:realschule-9-physik-mechanik-energie",
  "de-by:realschule-9-mathematik-pythagoras-trigonometrie",
  "de-by:realschule-9-mathematik-quadratische-funktionen",
  "de-by:realschule-9-mathematik-lineare-gleichungssysteme",
  "de-by:realschule-9-mathematik-kreis-raumgeometrie",
  "de-by:realschule-9-physik-waermelehre",
  "de-by:realschule-9-physik-fluessigkeiten-gase",
  "de-by:realschule-9-chemie-atombau-pse",
  "de-by:realschule-9-chemie-chemische-bindung",
  "de-by:realschule-9-biologie-genetik-vererbung",
  "de-by:realschule-9-biologie-nervensystem-sinne",
  "de-by:realschule-9-bwr-anlagenkauf-abschreibung-umsatzsteuer",
  "de-by:realschule-9-informatik-datenbanken-sql",
  "de-by:realschule-9-informatik-algorithmen-strukturen",
  "de-by:realschule-9-geschichte-weimar-ns",
  "de-by:realschule-9-wirtschaft-recht-markt-vertraege",
  "de-by:realschule-9-geographie-klima-ressourcen",
  "de-by:realschule-9-englisch-grammatik-syntax",
  "de-by:realschule-9-deutsch-argumentation-eroerterung",
  "de-by:realschule-9-mathematik-stochastik-daten",
  "de-by:realschule-9-franzoesisch-imparfait-futur-objektpronomen",
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

  it("lists all bundled cells including all 22 Realschule 9 cells", () => {
    const cells = listBundledCells();
    expect(cells.length).toBeGreaterThanOrEqual(100);

    for (const cellId of RS9_CELL_IDS) {
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
    expect(rs9Cells.length).toBeGreaterThanOrEqual(22);
    for (const cellId of RS9_CELL_IDS) {
      expect(
        rs9Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into BwR 9 Umsatzsteuer und AfA", async () => {
    const user = "learner-rs9-bwr";
    const cellId = "de-by:realschule-9-bwr-anlagenkauf-abschreibung-umsatzsteuer";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items

    const token = await getTokenById(db, "01K4W9A0000000000000000J01");
    expect(token).toBeDefined();
    expect(token?.concept).toContain("Forderung");
  });

  it("installs and enrols cleanly into Französisch 9 Imparfait und Objektpronomen", async () => {
    const user = "learner-rs9-fra";
    const cellId = "de-by:realschule-9-franzoesisch-imparfait-futur-objektpronomen";

    const result = await enrolBundledCell(db, user, cellId);
    expect(result.success).toBe(true);
    expect(result.cardsCreated).toBe(4); // 2 atoms * 2 items
  });

  it("supports simultaneous enrolment in ALL 22 Grade 9 Realschule cells without conflict", async () => {
    const user = "complete-rs9-polymath";

    let totalCards = 0;
    for (const cellId of RS9_CELL_IDS) {
      const res = await enrolBundledCell(db, user, cellId);
      expect(res.success).toBe(true);
      totalCards += res.cardsCreated;
    }

    // 176 + 4 (BwR) + 4 (Fra) = 184 practice items
    expect(totalCards).toBe(184);

    const cards = (await db
      .prepare(`SELECT COUNT(*) as count FROM cards WHERE user_id = ?`)
      .get(user)) as { count: number };
    expect(cards.count).toBe(184);
  });
});
