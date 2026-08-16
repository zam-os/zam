import { describe, expect, it } from "vitest";
import { listBundledCells } from "../../src/kernel/library/bundled-cells.js";

describe("Gymnasium Bayern Full Curriculum (Klassen 5–13) Integrity & Quality Audit", () => {
  const CROCKFORD_BASE32_REGEX = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]+$/;

  it("verifies global uniqueness and schema compliance across all 138 Gymnasium Bayern cells (Grades 5-13)", () => {
    const allCells = listBundledCells();
    const byGymCells = allCells.filter((c) =>
      c.tile_id.startsWith("de-by:gymnasium-"),
    );

    expect(byGymCells.length).toBe(138);

    const allAtomIds = new Set<string>();
    const allItemIds = new Set<string>();

    const gradeCellCounts: Record<number, number> = {};
    const gradeAtomCounts: Record<number, number> = {};

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
        // Atom ID Crockford base32 check
        expect(atom.id).toMatch(CROCKFORD_BASE32_REGEX);
        expect(allAtomIds.has(atom.id)).toBe(false);
        allAtomIds.add(atom.id);

        // Curriculum check
        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(cellGrade);

        gradeAtomCounts[cellGrade] = (gradeAtomCounts[cellGrade] || 0) + 1;

        // Practice items check
        expect(atom.practice_items.length).toBeGreaterThanOrEqual(1);

        for (const item of atom.practice_items) {
          expect(item.id).toMatch(CROCKFORD_BASE32_REGEX);
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

    // Exact grade breakdown across the 9 years of Gymnasium (G9)
    expect(gradeCellCounts[5]).toBe(9);
    expect(gradeCellCounts[6]).toBe(9);
    expect(gradeCellCounts[7]).toBe(13);
    expect(gradeCellCounts[8]).toBe(16);
    expect(gradeCellCounts[9]).toBe(15);
    expect(gradeCellCounts[10]).toBe(18);
    expect(gradeCellCounts[11]).toBe(21);
    expect(gradeCellCounts[12]).toBe(19);
    expect(gradeCellCounts[13]).toBe(18);

    // Global collision-free validation
    expect(allAtomIds.size).toBe(
      byGymCells.reduce((acc, c) => acc + c.atoms.length, 0),
    );
    expect(allAtomIds.size).toBeGreaterThanOrEqual(280);
    expect(allItemIds.size).toBeGreaterThanOrEqual(560);
  });
});
