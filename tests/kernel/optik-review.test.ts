import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BUNDLED_CELLS,
  BUNDLED_TILES,
  getBundledCell,
  getBundledCellTile,
  type KvtTile,
  listBundledCells,
} from "../../src/kernel/index.js";

const FIXTURES_DIR = resolve(__dirname, "../fixtures/curriculum");

function loadFixture(file: string): KvtTile {
  return JSON.parse(
    readFileSync(resolve(FIXTURES_DIR, file), "utf-8"),
  ) as KvtTile;
}

describe("Subject-matter & didactical review of Optik cells (Phase 2)", () => {
  const fixtureMap: Record<string, string> = {
    "de-by:realschule-optik": "de-by-realschule-optik-kvt.json",
    "de-by:gymnasium-8-optik": "de-by-gymnasium-8-optik-kvt.json",
    "de-by:realschule-optik-erweiterung":
      "de-by-realschule-optik-erweiterung-kvt.json",
    "de-by:bos-10-optik": "de-by-bos-10-optik-kvt.json",
  };

  it("ensures static BUNDLED_TILES match the JSON fixtures exactly in substance", () => {
    for (const [cellId, fixtureFile] of Object.entries(fixtureMap)) {
      const tileFromCode = BUNDLED_TILES[cellId];
      const tileFromFile = loadFixture(fixtureFile);

      expect(tileFromCode).toBeDefined();
      expect(tileFromFile).toBeDefined();
      expect(tileFromCode?.tile_id).toBe(tileFromFile.tile_id);
      expect(tileFromCode?.version).toBe(tileFromFile.version);
      expect(tileFromCode?.atoms.length).toBe(tileFromFile.atoms.length);

      // Verify all atom IDs and practice item counts match
      for (let i = 0; i < tileFromFile.atoms.length; i++) {
        const fileAtom = tileFromFile.atoms[i]!;
        const codeAtom = tileFromCode?.atoms.find((a) => a.id === fileAtom.id);
        expect(codeAtom).toBeDefined();
        expect(codeAtom?.title).toBe(fileAtom.title);
        expect(codeAtom?.slug).toBe(fileAtom.slug);
        expect(codeAtom?.practice_items.length).toBe(
          fileAtom.practice_items.length,
        );
      }
    }
  });

  it("verifies Physics correctness of all refraction, reflection and TIR concepts", () => {
    const rsTile = getBundledCellTile("de-by:realschule-optik")!;
    const allItems = rsTile.atoms.flatMap((a) => a.practice_items);

    // Lot is perpendicular (90 deg)
    const lotItem = allItems.find(
      (i) => i.id === "01K3X9A7R4B8C1D2E3F4G5H001",
    )!;
    expect(lotItem.concept).toContain("senkrecht (im 90-Grad-Winkel)");
    const lotCheck = lotItem.fast_check as {
      options: string[];
      correct_index: number;
    };
    expect(lotCheck.options[lotCheck.correct_index]).toContain("Senkrecht");

    // Refraction towards normal when entering denser medium (air -> water)
    const refrItem = allItems.find(
      (i) => i.id === "01K3X9A7R4B8C1D2E3F4G5H003",
    )!;
    expect(refrItem.concept).toContain("Zum Einfallslot hin");
    expect(refrItem.concept).toContain("Wasser optisch dichter ist als Luft");
    const refrCheck = refrItem.fast_check as {
      options: string[];
      correct_index: number;
    };
    expect(refrCheck.options[refrCheck.correct_index]).toBe("Zum Lot hin");

    // TIR only from denser to thinner
    const tirItem = allItems.find(
      (i) => i.id === "01K3X9A7R4B8C1D2E3F4G5H005",
    )!;
    expect(tirItem.concept).toContain(
      "nur beim Übergang vom optisch dichteren ins optisch dünnere Medium",
    );
    const tirCheck = tirItem.fast_check as {
      options: string[];
      correct_index: number;
    };
    expect(tirCheck.options[tirCheck.correct_index]).toContain(
      "Nein (nur dichter zu dünner)",
    );

    // Snellius formula
    const snelliusItem = allItems.find(
      (i) => i.id === "01K3X9A7R4B8C1D2E3F4G5H007",
    )!;
    expect(snelliusItem.concept).toContain("n1 * sin(alpha) = n2 * sin(beta)");
  });

  it("verifies Physics correctness of reflection, lens imaging and dispersion", () => {
    const gymTile = getBundledCellTile("de-by:gymnasium-8-optik")!;
    const gymItems = gymTile.atoms.flatMap((a) => a.practice_items);

    // Law of reflection (alpha = alpha')
    const reflItem = gymItems.find(
      (i) => i.id === "01K3X9A7R4B8C1D2E3F4G5H008",
    )!;
    expect(reflItem.concept).toContain("Sie sind gleich groß");
    expect(reflItem.concept).toContain(
      "Beide werden zwischen Strahl und Einfallslot gemessen",
    );

    // Convex lens real vs virtual image
    const lensItem = gymItems.find(
      (i) => i.id === "01K3X9A7R4B8C1D2E3F4G5H00A",
    )!;
    expect(lensItem.concept).toContain("außerhalb der Brennweite");

    // Dispersion (wavelength-dependent refraction)
    const extTile = getBundledCellTile("de-by:realschule-optik-erweiterung")!;
    const dispItem = extTile.atoms
      .flatMap((a) => a.practice_items)
      .find((i) => i.id === "01K3X9A7R4B8C1D2E3F4G5H00D")!;
    expect(dispItem.concept).toContain(
      "Verschiedene Wellenlängen werden verschieden stark gebrochen",
    );
    expect(dispItem.concept).toContain("Violett stärker als Rot");
  });

  it("validates that all atoms across all cells form an acyclic dependency DAG", () => {
    // Collect all atoms
    const atomMap = new Map<string, { id: string; prereqs: string[] }>();

    for (const tile of Object.values(BUNDLED_TILES)) {
      for (const atom of tile.atoms) {
        if (!atomMap.has(atom.id)) {
          atomMap.set(atom.id, {
            id: atom.id,
            prereqs: (atom.prerequisites ?? []).map((p) => p.atom_id),
          });
        }
      }
    }

    // Topological sort / cycle check (Tarjan / DFS)
    const visited = new Map<string, "visiting" | "visited">();

    function dfs(atomId: string, path: string[]) {
      const state = visited.get(atomId);
      if (state === "visiting") {
        throw new Error(
          `Cycle detected in atom prereqs: ${[...path, atomId].join(" -> ")}`,
        );
      }
      if (state === "visited") return;

      visited.set(atomId, "visiting");
      const entry = atomMap.get(atomId);
      if (entry) {
        for (const req of entry.prereqs) {
          dfs(req, [...path, atomId]);
        }
      }
      visited.set(atomId, "visited");
    }

    for (const atomId of atomMap.keys()) {
      if (!visited.has(atomId)) {
        dfs(atomId, []);
      }
    }

    expect(atomMap.size).toBeGreaterThanOrEqual(9);
  });

  it("validates that all fast check items have valid options and index bounds", () => {
    for (const tile of Object.values(BUNDLED_TILES)) {
      for (const atom of tile.atoms) {
        for (const item of atom.practice_items) {
          if (item.tier === "tier1_fast" && item.fast_check) {
            const check = item.fast_check as {
              type: string;
              options: string[];
              correct_index: number;
            };
            expect(check.type).toBe("binary_choice");
            expect(Array.isArray(check.options)).toBe(true);
            expect(check.options.length).toBe(2);
            expect(check.correct_index).toBeGreaterThanOrEqual(0);
            expect(check.correct_index).toBeLessThan(check.options.length);
          }
        }
      }
    }
  });
});
