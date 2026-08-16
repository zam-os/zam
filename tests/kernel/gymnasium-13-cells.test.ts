import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  listBundledCells,
  openDatabase,
} from "../../src/kernel/index.js";

describe("Gymnasium Klasse 13 Bayern LehrplanPLUS Cells", () => {
  const gym13Cells = [
    "de-by:gymnasium-13-mathematik-gebrochen-rationale-funktionen-asymptoten-uneigentliche-integrale",
    "de-by:gymnasium-13-mathematik-geometrie-abstaende-hesse-kugeln-schnittwinkel",
    "de-by:gymnasium-13-mathematik-stochastik-stetige-zufallsgroessen-normalverteilung-sigma-regeln",
    "de-by:gymnasium-13-physik-astrophysik-hrd-sternentwicklung-kosmologie-hubble",
    "de-by:gymnasium-13-physik-relativitaetstheorie-zeitdilatation-laengenkontraktion-e-mc2",
    "de-by:gymnasium-13-chemie-farbstoffe-mesomerie-chromophore-azofarbstoffe-spektroskopie",
    "de-by:gymnasium-13-chemie-komplexchemie-ligandenfeldtheorie-chelate-haemoglobin",
    "de-by:gymnasium-13-informatik-formale-sprachen-automaten-chomsky-hierarchie",
    "de-by:gymnasium-13-informatik-berechenbarkeit-turingmaschine-halteproblem-p-np",
    "de-by:gymnasium-13-deutsch-gegenwartsliteratur-erinnerungskultur-schlink-vorleser-postmoderne",
    "de-by:gymnasium-13-englisch-postcolonialism-british-empire-nigeria-adichie",
    "de-by:gymnasium-13-latein-dichtung-ovid-metamorphosen-daedalus-apollo",
    "de-by:gymnasium-13-franzoesisch-francophonie-maghreb-quebec-ben-jelloun",
    "de-by:gymnasium-13-biologie-evolutionsbiologie-synthetische-theorie-artbildung-hominisation",
    "de-by:gymnasium-13-biologie-verhaltensbiologie-oekologie-altruismus-biodiversitaet",
    "de-by:gymnasium-13-geographie-klimawandel-kippelemente-ipcc-ressourcen",
    "de-by:gymnasium-13-geschichte-nachkriegszeit-kalter-krieg-mauerfall-deutsche-einheit",
    "de-by:gymnasium-13-wirtschaft-recht-wirtschaftspolitik-stabilitaetsgesetz-aussenhandel",
  ];

  it("all 18 Gymnasium 13 cells are bundled and retrievable", () => {
    const allCells = listBundledCells();
    const cellIds = allCells.map((c) => c.tile_id);

    expect(gym13Cells).toHaveLength(18);

    for (const expectedId of gym13Cells) {
      expect(cellIds).toContain(expectedId);
      const cell = allCells.find((c) => c.tile_id === expectedId);
      expect(cell).toBeDefined();
      expect(cell?.atoms.length).toBeGreaterThanOrEqual(2);
      expect(cell?.gradeLabel).toContain("Gymnasium Klasse 13 (Bayern)");

      // Verify every atom has practice items and valid curriculum mappings
      for (const atom of cell!.atoms) {
        expect(atom.practice_items.length).toBe(2);
        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(13);
        expect(curr?.exam_relevant).toBe(true);

        const [tier1, tier2] = atom.practice_items;
        expect(tier1.tier).toBe("tier1_fast");
        expect(tier1.fast_check?.type).toBe("binary_choice");
        expect(tier1.fast_check?.options.length).toBe(2);
        expect(tier1.fast_check?.correct_index).toBe(0);
        expect(tier2.tier).toBe("tier2_synthesis");
        expect(tier2.sample_solution.length).toBeGreaterThan(50);
      }
    }
  });

  it("contains zero duplicate atom or practice item IDs across all Gymnasium 13 cells", () => {
    const allCells = listBundledCells();
    const gym13CellObjs = allCells.filter((c) =>
      gym13Cells.includes(c.tile_id),
    );

    const atomIds = new Set<string>();
    const itemIds = new Set<string>();

    for (const cell of gym13CellObjs) {
      for (const atom of cell.atoms) {
        expect(atomIds.has(atom.id)).toBe(false);
        atomIds.add(atom.id);

        for (const item of atom.practice_items) {
          expect(itemIds.has(item.id)).toBe(false);
          itemIds.add(item.id);
        }
      }
    }

    expect(atomIds.size).toBe(36);
    expect(itemIds.size).toBe(72);
  });

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-gym13-test-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true });
    });

    it("installs and enrols a Klasse 13 STEM cell that previously had 25-character ids", async () => {
      const cellId =
        "de-by:gymnasium-13-mathematik-gebrochen-rationale-funktionen-asymptoten-uneigentliche-integrale";
      const res = await enrolBundledCell(
        db,
        "01K4TESTUSERGYM1300000001",
        cellId,
      );
      expect(res.success).toBe(true);
      expect(res.cardsCreated).toBeGreaterThan(0);
    });
  });
});
