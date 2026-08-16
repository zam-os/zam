import { describe, expect, it } from "vitest";
import { listBundledCells } from "../../src/kernel/library/bundled-cells.js";

describe("Gymnasium Klasse 10 Bayern LehrplanPLUS Cells", () => {
  const gym10Cells = [
    "de-by:gymnasium-10-mathematik-trigonometrie-sinus-kosinussatz-bogenmass",
    "de-by:gymnasium-10-mathematik-exponential-logarithmus-wachstum",
    "de-by:gymnasium-10-mathematik-ganzrationale-funktionen-ableitung-differentialrechnung",
    "de-by:gymnasium-10-mathematik-analytische-geometrie-vektoren-skalarprodukt",
    "de-by:gymnasium-10-physik-wellenlehre-akustik-doppler-effekt",
    "de-by:gymnasium-10-physik-kernphysik-radioaktivitaet-zerfallsgesetz",
    "de-by:gymnasium-10-physik-kreisbewegung-gravitation-kepler-gesetze",
    "de-by:gymnasium-10-chemie-organik-alkane-alkene-aromaten",
    "de-by:gymnasium-10-chemie-sauerstoffgruppen-alkohole-aldehyde-carbonsaeuren-ester",
    "de-by:gymnasium-10-informatik-rekursion-dynamische-datenstrukturen-baeume",
    "de-by:gymnasium-10-deutsch-expressionismus-episches-theater-brecht",
    "de-by:gymnasium-10-englisch-rhetorik-stil-usa-21st-century",
    "de-by:gymnasium-10-latein-philosophie-seneca-ovid-metamorphosen",
    "de-by:gymnasium-10-franzoesisch-francophonie-passif-gerondif",
    "de-by:gymnasium-10-biologie-evolutionstheorie-belege-humanevolution",
    "de-by:gymnasium-10-geographie-geooekozonen-klimawandel-kippelemente",
    "de-by:gymnasium-10-geschichte-nachkriegsdeutschland-kalter-krieg-deutsche-einheit",
    "de-by:gymnasium-10-wirtschaft-recht-bgb-vertragsrecht-unternehmen",
  ];

  it("all 18 Gymnasium 10 cells are bundled and retrievable", () => {
    const allCells = listBundledCells();
    const cellIds = allCells.map((c) => c.tile_id);

    for (const expectedId of gym10Cells) {
      expect(cellIds).toContain(expectedId);
      const cell = allCells.find((c) => c.tile_id === expectedId);
      expect(cell).toBeDefined();
      expect(cell?.atoms.length).toBeGreaterThanOrEqual(2);
      expect(cell?.gradeLabel).toContain("Gymnasium Klasse 10 (Bayern)");

      // Verify every atom has practice items and valid curriculum mappings
      for (const atom of cell!.atoms) {
        expect(atom.practice_items.length).toBe(2);
        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(10);
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
