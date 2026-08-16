import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ATOM_ID_PATTERN,
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  listBundledCells,
  openDatabase,
} from "../../src/kernel/index.js";

/** Subject ids the Bayern Gymnasium LehrplanPLUS manifest actually uses. */
const BAYERN_GYMNASIUM_SUBJECTS = new Set([
  "biologie",
  "chemie",
  "deutsch",
  "englisch",
  "franzoesisch",
  "geographie",
  "geschichte",
  "informatik",
  "latein",
  "mathematik",
  "nt_gym",
  "physik",
  "wirtschaft-und-recht",
]);

const ENROL_SMOKE_CELLS = [
  "de-by:gymnasium-9-mathematik-quadratische-funktionen-pythagoras-trigonometrie",
  "de-by:gymnasium-10-mathematik-trigonometrie-sinus-kosinussatz-bogenmass",
  "de-by:gymnasium-10-wirtschaft-recht-bgb-vertragsrecht-unternehmen",
  "de-by:gymnasium-11-mathematik-kurvendiskussion-extremwertprobleme-wendepunkte",
  "de-by:gymnasium-12-mathematik-e-funktion-kettenregel-produktregel",
  "de-by:gymnasium-13-mathematik-gebrochen-rationale-funktionen-asymptoten-uneigentliche-integrale",
  "de-by:gymnasium-5-natur-technik-mikroskop-experiment-oop",
];

describe("Gymnasium Bayern Full Curriculum (Klassen 5–13) Integrity & Quality Audit", () => {
  it("verifies global uniqueness and schema compliance across all 138 Gymnasium Bayern cells (Grades 5-13)", () => {
    const allCells = listBundledCells();
    const byGymCells = allCells.filter((c) =>
      c.tile_id.startsWith("de-by:gymnasium-"),
    );

    expect(byGymCells.length).toBe(138);

    const allAtomIds = new Set<string>();
    const allItemIds = new Set<string>();

    const gradeCellCounts: Record<number, number> = {};

    for (const cell of byGymCells) {
      expect(cell.tile_id).toMatch(/^de-by:gymnasium-\d{1,2}-/);
      expect(cell.title).toBeTruthy();
      expect(cell.description.length).toBeGreaterThan(50);
      expect(cell.atoms.length).toBeGreaterThanOrEqual(2);

      const match = cell.tile_id.match(/^de-by:gymnasium-(\d+)-/);
      expect(match).toBeTruthy();
      const cellGrade = parseInt(match![1], 10);
      gradeCellCounts[cellGrade] = (gradeCellCounts[cellGrade] || 0) + 1;

      for (const atom of cell.atoms) {
        expect(atom.id).toMatch(ATOM_ID_PATTERN);
        expect(allAtomIds.has(atom.id)).toBe(false);
        allAtomIds.add(atom.id);

        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(cellGrade);
        expect(curr?.subject).toBeTruthy();
        expect(BAYERN_GYMNASIUM_SUBJECTS.has(curr!.subject!)).toBe(true);

        expect(atom.practice_items.length).toBeGreaterThanOrEqual(1);

        for (const item of atom.practice_items) {
          expect(item.id).toMatch(ATOM_ID_PATTERN);
          expect(allItemIds.has(item.id)).toBe(false);
          allItemIds.add(item.id);

          if (item.tier === "tier1_fast") {
            expect(item.fast_check?.type).toBe("binary_choice");
            expect(item.fast_check?.options).toHaveLength(2);
            expect(item.fast_check?.correct_index).toBe(0);
          } else if (item.tier === "tier2_synthesis") {
            if (item.sample_solution) {
              expect(item.sample_solution.length).toBeGreaterThan(50);
            } else {
              expect(item.concept.length).toBeGreaterThan(20);
            }
          }
        }
      }
    }

    expect(gradeCellCounts[5]).toBe(9);
    expect(gradeCellCounts[6]).toBe(9);
    expect(gradeCellCounts[7]).toBe(13);
    expect(gradeCellCounts[8]).toBe(16);
    expect(gradeCellCounts[9]).toBe(15);
    expect(gradeCellCounts[10]).toBe(18);
    expect(gradeCellCounts[11]).toBe(21);
    expect(gradeCellCounts[12]).toBe(19);
    expect(gradeCellCounts[13]).toBe(18);

    expect(allAtomIds.size).toBe(
      byGymCells.reduce((acc, c) => acc + c.atoms.length, 0),
    );
    expect(allAtomIds.size).toBeGreaterThanOrEqual(280);
    expect(allItemIds.size).toBeGreaterThanOrEqual(560);
  });

  it("finds Wirtschaft and NuT cells under official LehrplanPLUS subject slugs", () => {
    for (const grade of [8, 9, 10, 11, 12, 13]) {
      const cells = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade,
        subject: "wirtschaft-und-recht",
      });
      expect(
        cells.length,
        `wirtschaft-und-recht grade ${grade}`,
      ).toBeGreaterThanOrEqual(1);
    }

    for (const grade of [5, 6]) {
      const cells = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade,
        subject: "nt_gym",
      });
      expect(cells.length, `nt_gym grade ${grade}`).toBeGreaterThanOrEqual(1);
    }
  });

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-gym-integrity-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true });
    });

    it("installs previously short-id STEM cells and a Wirtschaft cell", async () => {
      const userId = "01K4TESTUSERGYMINTEG000001";
      for (const cellId of ENROL_SMOKE_CELLS) {
        const cell = listBundledCells().find((c) => c.tile_id === cellId);
        expect(cell, cellId).toBeDefined();
        const res = await enrolBundledCell(db, userId, cellId);
        expect(res.success, cellId).toBe(true);
        expect(res.cardsCreated, cellId).toBeGreaterThan(0);
      }
    });
  });
});
