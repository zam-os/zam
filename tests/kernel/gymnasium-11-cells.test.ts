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

describe("Gymnasium Klasse 11 Bayern LehrplanPLUS Cells", () => {
  const gym11Cells = [
    "de-by:gymnasium-11-mathematik-kurvendiskussion-extremwertprobleme-wendepunkte",
    "de-by:gymnasium-11-mathematik-integralrechnung-hauptsatz-flaechenberechnung",
    "de-by:gymnasium-11-mathematik-analytische-geometrie-ebenen-abstaende",
    "de-by:gymnasium-11-mathematik-stochastik-bernoulli-binomialverteilung",
    "de-by:gymnasium-11-physik-elektrisches-feld-kondensator-millikan",
    "de-by:gymnasium-11-physik-magnetfeld-lorentz-massenspektrometer-zyklotron",
    "de-by:gymnasium-11-physik-induktion-schwingkreis-wechselstrom",
    "de-by:gymnasium-11-chemie-naturstoffe-kohlenhydrate-glukose-staerke",
    "de-by:gymnasium-11-chemie-aminosaeuren-proteine-peptidbindung-enzyme",
    "de-by:gymnasium-11-chemie-kunststoffe-polymerisation-polykondensation-duroplaste",
    "de-by:gymnasium-11-informatik-sortieralgorithmen-komplexitaet-graphen-dijkstra",
    "de-by:gymnasium-11-informatik-datenbanken-normalisierung-sql-joins-acid",
    "de-by:gymnasium-11-deutsch-romantik-sehnsucht-schauerromantik-realismus",
    "de-by:gymnasium-11-englisch-shakespeare-dramatic-conventions-global-challenges",
    "de-by:gymnasium-11-latein-geschichtsschreibung-sallust-tacitus-brevitas",
    "de-by:gymnasium-11-franzoesisch-existentialisme-absurde-camus-sartre",
    "de-by:gymnasium-11-biologie-neurobiologie-aktionspotential-synapsen-signaltransduktion",
    "de-by:gymnasium-11-biologie-stoffwechselphysiologie-fotosynthese-zellatmung-atp",
    "de-by:gymnasium-11-geographie-globalisierung-wirtschaftsraeume-global-cities-disparitaeten",
    "de-by:gymnasium-11-geschichte-reichsgruendung-bismarck-imperialismus-erster-weltkrieg",
    "de-by:gymnasium-11-wirtschaft-recht-vwl-vgr-ezb-geldpolitik-fiskalpolitik",
  ];

  it("all 21 Gymnasium 11 cells are bundled and retrievable", () => {
    const allCells = listBundledCells();
    const cellIds = allCells.map((c) => c.tile_id);

    expect(gym11Cells).toHaveLength(21);

    for (const expectedId of gym11Cells) {
      expect(cellIds).toContain(expectedId);
      const cell = allCells.find((c) => c.tile_id === expectedId);
      expect(cell).toBeDefined();
      expect(cell?.atoms.length).toBeGreaterThanOrEqual(2);
      expect(cell?.gradeLabel).toContain("Gymnasium Klasse 11 (Bayern)");

      // Verify every atom has practice items and valid curriculum mappings
      for (const atom of cell!.atoms) {
        expect(atom.practice_items.length).toBe(2);
        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(11);
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

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-gym11-test-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true });
    });

    it("installs and enrols a Klasse 11 STEM cell that previously had 25-character ids", async () => {
      const cellId =
        "de-by:gymnasium-11-mathematik-kurvendiskussion-extremwertprobleme-wendepunkte";
      const res = await enrolBundledCell(
        db,
        "01K4TESTUSERGYM1100000001",
        cellId,
      );
      expect(res.success).toBe(true);
      expect(res.cardsCreated).toBeGreaterThan(0);
    });
  });
});
