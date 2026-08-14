import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

describe("Knowledge Vector Tile (KVT) Fixture Verification", () => {
  const fixturePath = resolve(__dirname, "../fixtures/curriculum/de-by-realschule-optik-kvt.json");
  const raw = readFileSync(fixturePath, "utf-8");
  const tile: KvtTile = JSON.parse(raw);

  it("loads and conforms to basic KVT metadata structure", () => {
    expect(tile.tile_id).toBe("de-by:realschule-optik");
    expect(tile.version).toBeDefined();
    expect(tile.atoms.length).toBeGreaterThanOrEqual(4);
  });

  it("ensures all Atom IDs conform to the opaque namespaced format", () => {
    const atomIdPattern = /^atom:zam:[a-z0-9-]+:[a-z0-9-]+$/;
    for (const atom of tile.atoms) {
      expect(atom.id).toMatch(atomIdPattern);
      expect(atom.title.length).toBeGreaterThan(3);
      expect(atom.typical_age_min).toBeGreaterThan(5);
    }
  });

  it("validates that all prerequisite references exist within the tile", () => {
    const atomIdSet = new Set(tile.atoms.map((a) => a.id));
    for (const atom of tile.atoms) {
      for (const prereq of atom.prerequisites) {
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
      for (const prereq of atom.prerequisites) {
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

  it("verifies multi-curriculum reuse across Realschule Zweig I (Grade 7) and Zweig II/III (Grade 8)", () => {
    const qualitativeAtom = tile.atoms.find((a) => a.id === "atom:zam:de-by:ph-optik-brechung-qualitativ");
    expect(qualitativeAtom).toBeDefined();

    const curricula = qualitativeAtom?.curricula ?? [];
    const hasGrade7Track1 = curricula.some(
      (c) => c.grade === 7 && c.track === "I" && c.topic_code === "PH7-LB2",
    );
    const hasGrade8Track23 = curricula.some(
      (c) => c.grade === 8 && c.track === "II_III" && c.topic_code === "PH8-LB2",
    );

    expect(hasGrade7Track1).toBe(true);
    expect(hasGrade8Track23).toBe(true);
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
