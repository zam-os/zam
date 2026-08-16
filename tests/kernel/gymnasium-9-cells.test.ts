import { describe, expect, it } from "vitest";
import { listBundledCells } from "../../src/kernel/library/bundled-cells.js";

describe("Gymnasium Klasse 9 Bayern LehrplanPLUS Cells", () => {
  const gym9Cells = [
    "de-by:gymnasium-9-mathematik-quadratische-funktionen-pythagoras-trigonometrie",
    "de-by:gymnasium-9-mathematik-raumgeometrie-koerper-bedingte-wahrscheinlichkeit",
    "de-by:gymnasium-9-physik-elektrizitaetslehre-schaltungen-energie-leistung",
    "de-by:gymnasium-9-physik-mechanik-kinematik-dynamik-newton-axiome",
    "de-by:gymnasium-9-chemie-stoechiometrie-saeuren-basen-protolyse",
    "de-by:gymnasium-9-chemie-redoxreaktionen-oxidationszahlen-elektrochemie",
    "de-by:gymnasium-9-informatik-oop-klassen-vererbung-algorithmen",
    "de-by:gymnasium-9-deutsch-eroerterung-literatur-weimarer-klassik",
    "de-by:gymnasium-9-englisch-participles-gerund-british-empire-commonwealth",
    "de-by:gymnasium-9-latein-gerundium-gerundivum-caesar-originallektuere",
    "de-by:gymnasium-9-franzoesisch-subjonctif-conditionnel-hypothesensaetze",
    "de-by:gymnasium-9-biologie-molekulargenetik-mendel-proteinbiosynthese",
    "de-by:gymnasium-9-geographie-disparitaeten-hdi-demographie-megastaedte",
    "de-by:gymnasium-9-geschichte-weimarer-republik-nationalsozialismus-shoah",
    "de-by:gymnasium-9-wirtschaft-recht-arbeitsrecht-soziale-marktwirtschaft-konjunktur",
  ];

  it("all 15 Gymnasium 9 cells are bundled and retrievable", () => {
    const allCells = listBundledCells();
    const cellIds = allCells.map((c) => c.tile_id);

    for (const expectedId of gym9Cells) {
      expect(cellIds).toContain(expectedId);
      const cell = allCells.find((c) => c.tile_id === expectedId);
      expect(cell).toBeDefined();
      expect(cell?.atoms.length).toBeGreaterThanOrEqual(2);
      expect(cell?.gradeLabel).toContain("Gymnasium Klasse 9 (Bayern)");

      // Verify every atom has practice items and valid curriculum mappings
      for (const atom of cell!.atoms) {
        expect(atom.practice_items.length).toBe(2);
        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(9);
        expect(curr?.exam_relevant).toBe(true);

        const [tier1, tier2] = atom.practice_items;
        expect(tier1.tier).toBe("tier1_fast");
        expect(tier1.fast_check?.type).toBe("binary_choice");
        expect(tier1.fast_check?.options.length).toBe(2);
        expect(tier2.tier).toBe("tier2_synthesis");
        expect(tier2.sample_solution.length).toBeGreaterThan(50);
      }
    }
  });
});
