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

describe("Automated content guards for the Optik field-test cells", () => {
  const fixtureMap: Record<string, string> = {
    "de-by:realschule-optik": "de-by-realschule-optik-kvt.json",
    "de-by:gymnasium-8-optik": "de-by-gymnasium-8-optik-kvt.json",
    "de-by:realschule-optik-erweiterung":
      "de-by-realschule-optik-erweiterung-kvt.json",
    "de-by:bos-10-optik": "de-by-bos-10-optik-kvt.json",
  };

  /**
   * The bundled tile in `src/` is what a learner installs; the JSON fixture is
   * what a curator edits. Two copies of learner-facing content is a standing
   * hazard, and the first version of this guard was too shallow to catch it —
   * it compared ids, titles and counts, so a copy that had silently dropped
   * `sources` and a reference answer passed.
   *
   * The guard is now exact over everything the installer consumes. Anything a
   * curator changes in the fixture and does not mirror into `bundled-cells.ts`
   * fails here, loudly, instead of shipping the older wording to a learner.
   */
  it("keeps every bundled tile byte-identical to its fixture, field by field", () => {
    /** Only what `KvtTile` models: the rest is curator documentation. */
    const substance = (tile: KvtTile) => ({
      tile_id: tile.tile_id,
      version: tile.version,
      title: tile.title,
      publisher: tile.publisher,
      atoms: [...tile.atoms]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((atom) => ({
          id: atom.id,
          atom_uri: atom.atom_uri,
          namespace: atom.namespace,
          slug: atom.slug,
          title: atom.title,
          domain: atom.domain,
          reduction: atom.reduction,
          typical_age_min: atom.typical_age_min,
          prerequisites: [...(atom.prerequisites ?? [])].sort((a, b) =>
            a.atom_id.localeCompare(b.atom_id),
          ),
          alignments: [...(atom.alignments ?? [])].sort((a, b) =>
            a.target_uri.localeCompare(b.target_uri),
          ),
          curricula: [...(atom.curricula ?? [])].sort((a, b) =>
            `${a.provider}${a.topic_code}`.localeCompare(
              `${b.provider}${b.topic_code}`,
            ),
          ),
          practice_items: [...atom.practice_items]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((item) => ({
              id: item.id,
              slug: item.slug,
              language: item.language,
              bloom_level: item.bloom_level,
              tier: item.tier,
              fast_check: item.fast_check,
              question: item.question,
              concept: item.concept,
              materiality: item.materiality,
              replaces: item.replaces,
            })),
        })),
    });

    for (const [cellId, fixtureFile] of Object.entries(fixtureMap)) {
      const tileFromCode = BUNDLED_TILES[cellId];
      const tileFromFile = loadFixture(fixtureFile);
      expect(tileFromCode, `no bundled tile for ${cellId}`).toBeDefined();
      expect(substance(tileFromCode as KvtTile)).toEqual(
        substance(tileFromFile),
      );
    }
  });

  /**
   * Grounding evidence lives in the fixture, not in the installed tile: the
   * KVT type models no `sources` block, so nothing carries it into the
   * database yet. Until it does, the repository is where "no anchor without
   * resolution against its primary source" is checkable — so the block has to
   * stay there and stay dated.
   */
  const CELLS_AWAITING_PRIMARY_SOURCE: string[] = [];

  it("keeps a dated primary source for every curriculum binding", () => {
    for (const fixtureFile of Object.values(fixtureMap)) {
      const raw = JSON.parse(
        readFileSync(resolve(FIXTURES_DIR, fixtureFile), "utf-8"),
      ) as {
        sources?: Array<{ uri: string; checked: string; label?: string }>;
        published_at?: string;
        signature?: string;
        atoms: Array<{
          curricula?: Array<{ provider: string; topic_code: string }>;
        }>;
      };
      expect(
        raw.published_at,
        `${fixtureFile} has no published_at`,
      ).toBeTruthy();

      // Nothing is signed yet — signing is a publication gate (ADR
      // 2026-08-14b). A placeholder signature in shipped content is worse
      // than none: it is the field a later reader would trust.
      expect(raw.signature, `${fixtureFile} carries a mock signature`).toBe(
        undefined,
      );

      if (CELLS_AWAITING_PRIMARY_SOURCE.includes(fixtureFile)) continue;
      expect(
        raw.sources?.length,
        `${fixtureFile} has no sources`,
      ).toBeGreaterThan(0);
      for (const source of raw.sources ?? []) {
        expect(source.uri).toMatch(/^https?:\/\//);
        expect(source.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }

      const anchoredText = (raw.sources ?? [])
        .map((source) => `${source.uri} ${source.label ?? ""}`)
        .join("\n");
      for (const binding of raw.atoms.flatMap(
        (atom) => atom.curricula ?? [],
      )) {
        expect(binding.provider).toBe("lehrplanplus-bayern");
        expect(
          anchoredText,
          `${fixtureFile} has no primary source for topic ${binding.topic_code}`,
        ).toContain(binding.topic_code);
      }
    }
  });

  it("does not ship an ungrounded field-test cell", () => {
    expect(CELLS_AWAITING_PRIMARY_SOURCE).toEqual([]);
  });

  it("guards the reviewed refraction, reflection and TIR reference statements", () => {
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

  it("guards the reviewed reflection, lens-imaging and dispersion statements", () => {
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
