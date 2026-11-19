import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCellEnrolment,
  isBundledCellInstalled,
  openDatabase,
} from "../../src/kernel/index.js";

// The Informatik cell of this grade moved to the ZAM Academy cell
// zam-academy:informatik-realschule-8 (zam-os/zam-academy#62, #63), which binds
// the IT-Anfangsunterricht (modules 1.1–1.9) to Jahrgangsstufen 6, 7 and 8. See
// tests/kernel/zam-academy-informatik-realschule-8-cell.test.ts.
// The two Mathematik 6 school cells moved to zam-academy:mathematik-realschule-6
// and are archived in tests/fixtures/legacy/.
// The two Biologie 6 school cells moved to zam-academy:biologie-realschule-6
// and are archived in tests/fixtures/legacy/.
const ACADEMY_RS6_IDS = [
  "zam-academy:biologie-realschule-6",
  "zam-academy:deutsch-realschule-6",
  "zam-academy:englisch-realschule-6",
  "zam-academy:geographie-realschule-6",
  "zam-academy:geschichte-realschule-6",
  "zam-academy:informatik-realschule-8",
  "zam-academy:mathematik-realschule-6",
];

describe("Realschule Bayern 6 Curriculum Cells (Einführungs- und Orientierungsstufe)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-rs6-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("finds all Grade 6 Realschule cells using findBundledCellsForScope", () => {
    const rs6Cells = findBundledCellsForScope({
      provider: "lehrplanplus-bayern",
      schoolType: "realschule",
      grade: 6,
    });
    expect(rs6Cells.length).toBeGreaterThanOrEqual(ACADEMY_RS6_IDS.length);
    for (const cellId of ACADEMY_RS6_IDS) {
      expect(
        rs6Cells.some((c) => c.id === cellId),
        `findBundledCellsForScope should include ${cellId}`,
      ).toBe(true);
    }
  });

  it("installs and enrols cleanly into Englisch 6 Grammatik Grundlagen", async () => {
    const userId = "01K4TESTUSER000000000000001";
    const cellId = "zam-academy:englisch-realschule-6";

    expect(await isBundledCellInstalled(db, cellId)).toBe(false);

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.installed).toBe(true);
    expect(res.cardsCreated).toBe(126);
    expect(res.alreadyEnrolled).toBe(false);

    expect(await isBundledCellInstalled(db, cellId)).toBe(true);
    const enrolment = await getBundledCellEnrolment(db, userId, cellId);
    expect(enrolment.installed).toBe(true);
    expect(enrolment.enrolled).toBe(true);
    expect(enrolment.cardCount).toBe(126);
  });

  it("installs and enrols cleanly into Deutsch 6 Berichte und Vorgangsbeschreibung", async () => {
    const userId = "01K4TESTUSER000000000000004";
    const cellId = "zam-academy:deutsch-realschule-6";

    const res = await enrolBundledCell(db, userId, cellId);
    expect(res.success).toBe(true);
    expect(res.cardsCreated).toBe(100);

    const reportAtoms = (await db
      .prepare(
        "SELECT a.id, a.title, a.slug FROM learning_atoms a WHERE a.slug = 'd6-ereignisbericht'",
      )
      .all()) as Array<{ id: string; title: string; slug: string }>;
    expect(reportAtoms.length).toBe(1);
  });
});
