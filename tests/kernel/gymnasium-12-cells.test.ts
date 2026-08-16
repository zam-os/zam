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

describe("Gymnasium Klasse 12 Bayern LehrplanPLUS Cells", () => {
  const gym12Cells = [
    "de-by:gymnasium-12-mathematik-e-funktion-kettenregel-produktregel",
    "de-by:gymnasium-12-mathematik-lineare-gleichungssysteme-gauss-matrizen",
    "de-by:gymnasium-12-mathematik-hypothesentests-signifikanzniveau-fehler-1-und-2-art",
    "de-by:gymnasium-12-physik-quantenphysik-lichtelektrischer-effekt-de-broglie-heisenberg",
    "de-by:gymnasium-12-physik-atomphysik-bohrsches-atommodell-linien-spektren-kernspaltung",
    "de-by:gymnasium-12-chemie-chemisches-gleichgewicht-massenwirkungsgesetz-le-chatelier",
    "de-by:gymnasium-12-chemie-saeure-base-gleichgewichte-ph-wert-titration-puffer",
    "de-by:gymnasium-12-chemie-elektrochemie-galvanische-zelle-nernst-gleichung-elektrolyse",
    "de-by:gymnasium-12-informatik-rechnernetze-osi-modell-tcp-ip-routing-dns",
    "de-by:gymnasium-12-informatik-kryptographie-rsa-diffie-hellman-digitale-signatur",
    "de-by:gymnasium-12-deutsch-literatur-der-moderne-kafka-verwandlung-thomas-mann",
    "de-by:gymnasium-12-englisch-american-dream-social-realities-ethnic-diversity",
    "de-by:gymnasium-12-latein-philosophie-cicero-de-officiis-seneca-stoische-ethik",
    "de-by:gymnasium-12-franzoesisch-societe-banlieue-immigration-integration",
    "de-by:gymnasium-12-biologie-molekulargenetik-dna-proteinbiosynthese-epigenetik",
    "de-by:gymnasium-12-biologie-gentechnik-crispr-cas-pcr-stammzellen-bioethik",
    "de-by:gymnasium-12-geographie-stadtentwicklung-charta-von-athen-suburbanisierung-nachhaltige-stadt",
    "de-by:gymnasium-12-geschichte-weimarer-republik-nationalsozialismus-shoah-totalitarismus",
    "de-by:gymnasium-12-wirtschaft-recht-mikrooekonomie-marktformen-monopol-marktversagen",
  ];

  it("all 19 Gymnasium 12 cells are bundled and retrievable", () => {
    const allCells = listBundledCells();
    const cellIds = allCells.map((c) => c.tile_id);

    expect(gym12Cells).toHaveLength(19);

    for (const expectedId of gym12Cells) {
      expect(cellIds).toContain(expectedId);
      const cell = allCells.find((c) => c.tile_id === expectedId);
      expect(cell).toBeDefined();
      expect(cell?.atoms.length).toBeGreaterThanOrEqual(2);
      expect(cell?.gradeLabel).toContain("Gymnasium Klasse 12 (Bayern)");

      // Verify every atom has practice items and valid curriculum mappings
      for (const atom of cell!.atoms) {
        expect(atom.practice_items.length).toBe(2);
        expect(atom.curricula).toBeDefined();
        const curr = atom.curricula?.find(
          (c) => c.provider === "lehrplanplus-bayern",
        );
        expect(curr).toBeDefined();
        expect(curr?.school_type).toBe("gymnasium");
        expect(curr?.grade).toBe(12);
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

  it("contains zero duplicate atom or practice item IDs across all Gymnasium 12 cells", () => {
    const allCells = listBundledCells();
    const gym12CellObjs = allCells.filter((c) =>
      gym12Cells.includes(c.tile_id),
    );

    const atomIds = new Set<string>();
    const itemIds = new Set<string>();

    for (const cell of gym12CellObjs) {
      for (const atom of cell.atoms) {
        expect(atomIds.has(atom.id)).toBe(false);
        atomIds.add(atom.id);

        for (const item of atom.practice_items) {
          expect(itemIds.has(item.id)).toBe(false);
          itemIds.add(item.id);
        }
      }
    }

    expect(atomIds.size).toBe(38);
    expect(itemIds.size).toBe(76);
  });

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-gym12-test-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true });
    });

    it("installs and enrols a Klasse 12 STEM cell that previously had 25-character ids", async () => {
      const cellId =
        "de-by:gymnasium-12-mathematik-e-funktion-kettenregel-produktregel";
      const res = await enrolBundledCell(
        db,
        "01K4TESTUSERGYM1200000001",
        cellId,
      );
      expect(res.success).toBe(true);
      expect(res.cardsCreated).toBeGreaterThan(0);
    });
  });
});
