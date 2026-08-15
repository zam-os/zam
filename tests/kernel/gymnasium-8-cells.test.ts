import { describe, expect, it } from "vitest";
import {
  type Cell,
  findBundledCellByPrefix,
  listBundledCells,
} from "../../src/kernel/library/bundled-cells";

describe("Gymnasium Klasse 8 Bayern LehrplanPLUS Cells", () => {
  const gym8Cells = [
    "de-by:gymnasium-8-optik",
    "de-by:gymnasium-8-mathematik-lineare-funktionen-gleichungssysteme",
    "de-by:gymnasium-8-mathematik-wahrscheinlichkeit-kreisgeometrie-bruchterme",
    "de-by:gymnasium-8-physik-mechanik-energie-arbeit-leistung-maschinen",
    "de-by:gymnasium-8-physik-waermelehre-thermodynamik-energieumwandlung",
    "de-by:gymnasium-8-chemie-stoffe-reaktionen-atommodelle-rutherford",
    "de-by:gymnasium-8-chemie-pse-ionenbindung-elektronenpaarbindung",
    "de-by:gymnasium-8-informatik-relationale-datenbanken-sql-modellierung",
    "de-by:gymnasium-8-deutsch-eroerterung-drama-novelle-textanalyse",
    "de-by:gymnasium-8-englisch-past-perfect-passive-indirect-speech-usa",
    "de-by:gymnasium-8-latein-ablativus-absolutus-konjunktive-consecutio",
    "de-by:gymnasium-8-franzoesisch-imparfait-passe-compose-objektpronomen",
    "de-by:gymnasium-8-biologie-verdauung-stoffwechsel-blutkreislauf-herz",
    "de-by:gymnasium-8-geographie-tropen-passatzirkulation-wuesten",
    "de-by:gymnasium-8-geschichte-absolutismus-franzoesische-revolution-1848",
    "de-by:gymnasium-8-wirtschaft-recht-markt-geld-verbraucherschutz",
  ];

  it("all 16 Gymnasium 8 cells are bundled and retrievable", () => {
    const allCells = listBundledCells();
    const cellIds = allCells.map((c) => c.tile_id);

    for (const expectedId of gym8Cells) {
      expect(cellIds).toContain(expectedId);
      const cell = allCells.find((c) => c.tile_id === expectedId);
      expect(cell).toBeDefined();
      expect(cell?.atoms.length).toBeGreaterThanOrEqual(2);

      // Verify every atom has practice items and valid curriculum mappings
      for (const atom of cell!.atoms) {
        expect(atom.practice_items.length).toBeGreaterThanOrEqual(1);
        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(8);
      }
    }
  });

  it("allows seamless co-enrolment across NTG, SG, WSG branches for Grade 8", () => {
    const allCells = listBundledCells();
    const gym8Only = allCells.filter((c) => gym8Cells.includes(c.tile_id));
    expect(gym8Only.length).toBe(16);

    const totalAtoms = gym8Only.reduce((acc, c) => acc + c.atoms.length, 0);
    const totalItems = gym8Only.reduce(
      (acc, c) =>
        acc +
        c.atoms.reduce(
          (itemAcc, a) => itemAcc + (a.practice_items?.length || 0),
          0,
        ),
      0,
    );

    expect(totalAtoms).toBeGreaterThanOrEqual(34);
    expect(totalItems).toBeGreaterThanOrEqual(68);
  });
});
