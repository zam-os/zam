import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

interface Prerequisite {
  atom_id: string;
  type: "hard" | "soft";
  rationale?: string;
}

interface PracticeItem {
  id: string;
  language: string;
  bloom_level: number;
  tier: "tier1_fast" | "tier2_synthesis";
  question: string;
  concept: string;
}

interface LearningAtom {
  id: string;
  title: string;
  domain: string;
  reduction: string;
  typical_age_min: number;
  prerequisites: Prerequisite[];
  curricula: Array<{
    provider: string;
    school_type: string;
    grade: number;
    track?: string;
    subject: string;
    topic_code: string;
    exam_relevant: boolean;
  }>;
  practice_items: PracticeItem[];
}

interface KvtTile {
  tile_id: string;
  version: string;
  title: string;
  atoms: LearningAtom[];
}

const TILE_FILES = [
  "de-by-realschule-optik-kvt.json",
  "de-by-gymnasium-8-optik-kvt.json",
  "de-by-realschule-optik-erweiterung-kvt.json",
  "de-by-bos-10-optik-kvt.json",
] as const;

function loadNamedTile(name: string): KvtTile {
  const raw = readFileSync(
    resolve(__dirname, "../fixtures/curriculum", name),
    "utf-8",
  );
  return JSON.parse(raw) as KvtTile;
}

describe.each(TILE_FILES)("KVT fixture %s", (name) => {
  const tile = loadNamedTile(name);

  it("loads and conforms to basic KVT metadata structure", () => {
    expect(tile.tile_id).toMatch(/^de-by:/);
    expect(tile.version).toBeDefined();
    expect(tile.atoms.length).toBeGreaterThanOrEqual(4);
  });

  it("ensures all Atom IDs conform to the opaque namespaced format", () => {
    const atomIdPattern = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    for (const atom of tile.atoms) {
      expect(atom.id).toMatch(atomIdPattern);
      expect(atom.title.length).toBeGreaterThan(3);
      expect(atom.typical_age_min).toBeGreaterThan(5);
    }
  });

  it("validates that all prerequisite references exist within the tile", () => {
    const atomIdSet = new Set(tile.atoms.map((a) => a.id));
    for (const atom of tile.atoms) {
      for (const prereq of atom.prerequisites ?? []) {
        expect(atomIdSet.has(prereq.atom_id)).toBe(true);
      }
    }
  });

  it("proves the prerequisite DAG is strictly acyclic (Topological Sort)", () => {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const atom of tile.atoms) {
      inDegree.set(atom.id, 0);
      adj.set(atom.id, []);
    }

    for (const atom of tile.atoms) {
      for (const prereq of atom.prerequisites ?? []) {
        // Edge: prereq.atom_id -> atom.id
        adj.get(prereq.atom_id)?.push(atom.id);
        inDegree.set(atom.id, (inDegree.get(atom.id) ?? 0) + 1);
      }
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0) {
        queue.push(id);
      }
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      visitedCount++;
      for (const neighbor of adj.get(current) ?? []) {
        const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) {
          queue.push(neighbor);
        }
      }
    }

    expect(visitedCount).toBe(tile.atoms.length);
  });

  it("verifies practice items follow Bloom levels and Tier-1/Tier-2 classification", () => {
    for (const atom of tile.atoms) {
      expect(atom.practice_items.length).toBeGreaterThanOrEqual(1);
      for (const item of atom.practice_items) {
        expect(["tier1_fast", "tier2_synthesis"]).toContain(item.tier);
        expect(item.bloom_level).toBeGreaterThanOrEqual(1);
        expect(item.bloom_level).toBeLessThanOrEqual(5);
        expect(item.question.length).toBeGreaterThan(5);
        expect(item.concept.length).toBeGreaterThan(5);
      }
    }
  });
});

describe("KVT fixture catalog overlap", () => {
  it("reuses the same qualitative-refraction atom across all four tiles", () => {
    const ids = TILE_FILES.map((name) =>
      loadNamedTile(name).atoms.map((atom) => atom.id),
    );
    for (const atomIds of ids) {
      expect(atomIds).toContain("01K3X9A7R4B8C1D2E3F4G5A002");
    }
  });

  it("keeps dispersion only on Realschule 7 I, not on Gym 8 or BOS", () => {
    const gym = loadNamedTile("de-by-gymnasium-8-optik-kvt.json");
    const bos = loadNamedTile("de-by-bos-10-optik-kvt.json");
    const extra = loadNamedTile("de-by-realschule-optik-erweiterung-kvt.json");
    expect(gym.atoms.map((atom) => atom.id)).not.toContain(
      "01K3X9A7R4B8C1D2E3F4G5A008",
    );
    expect(bos.atoms.map((atom) => atom.id)).not.toContain(
      "01K3X9A7R4B8C1D2E3F4G5A008",
    );
    const dispersion = extra.atoms.find(
      (atom) => atom.id === "01K3X9A7R4B8C1D2E3F4G5A008",
    );
    expect(dispersion?.curricula).toEqual([
      expect.objectContaining({
        school_type: "realschule",
        grade: 7,
        track: "I",
        topic_code: "65643",
      }),
    ]);
  });
});

/**
 * A published item may appear in several tiles — that overlap is the whole
 * reuse argument. Codex's hardening review (B1.5) requires those embedded
 * copies to be identical: partial, independently overwritable definitions of
 * the same object are not a cache, they are a race. Before this guard the
 * Gymnasium tile republished item …H001 without its `fast_check`, so the final
 * content_version depended on install order.
 */
const FIXTURE_DIR = resolve(__dirname, "../fixtures/curriculum");

describe("embedded practice items are identical across tiles", () => {
  const SUBSTANCE = [
    "question",
    "concept",
    "bloom_level",
    "language",
    "tier",
    "fast_check",
  ] as const;

  it("never contradicts itself about the same item id", () => {
    const seen = new Map<string, { tile: string; body: string }>();
    for (const file of readdirSync(FIXTURE_DIR).filter((n) =>
      n.endsWith(".json"),
    )) {
      const tile = JSON.parse(
        readFileSync(join(FIXTURE_DIR, file), "utf-8"),
      ) as {
        atoms: Array<{
          practice_items: Array<Record<string, unknown>>;
        }>;
      };
      for (const atom of tile.atoms) {
        for (const item of atom.practice_items) {
          const body = JSON.stringify(
            Object.fromEntries(
              SUBSTANCE.map((key) => [key, item[key] ?? null]),
            ),
          );
          const first = seen.get(item.id as string);
          if (first) {
            expect(
              body,
              `${item.id} differs between ${first.tile} and ${file}`,
            ).toBe(first.body);
          } else {
            seen.set(item.id as string, { tile: file, body });
          }
        }
      }
    }
    expect(seen.size).toBeGreaterThan(0);
  });
});
