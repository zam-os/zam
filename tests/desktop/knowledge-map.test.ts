import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";
import {
  CONCEPT_SPOKES,
  conceptLabel,
  conceptPicture,
  conceptReading,
} from "../../desktop/src/knowledge-map/concept-layout.js";
import {
  layoutFocus,
  layoutMinimap,
  MAX_VISIBLE_NEIGHBORS,
  NARROW_WIDTH,
  rankNeighbors,
  relationLabelKey,
} from "../../desktop/src/knowledge-map/layout.js";
import {
  DEFAULT_KNOWLEDGE_MAP_VIEW,
  KNOWLEDGE_MAP_VIEWS,
  parseKnowledgeMapViewId,
} from "../../desktop/src/knowledge-map/registry.js";
import {
  buildMapIndex,
  type KnowledgeMap,
  RELATION_KINDS,
  validateKnowledgeMap,
} from "../../src/cli/knowledge-map/model.js";

const ROOT = resolve(import.meta.dirname, "../..");
const MAP_DIR = join(ROOT, "desktop/src/knowledge-map");

function zamIndex() {
  const raw = JSON.parse(
    readFileSync(join(ROOT, "docs/knowledge-map/map.json"), "utf8"),
  );
  return buildMapIndex(validateKnowledgeMap(raw).map as KnowledgeMap);
}

/** A root with nine details and two cross-links, for overflow cases. */
function wideIndex() {
  const statements = [{ id: "root", text: "Root.", sources: ["README.md"] }];
  for (let i = 0; i < 9; i++) {
    statements.push({
      id: `c${i}`,
      parent: "root",
      text: `Child ${i}.`,
      sources: ["README.md"],
    } as never);
  }
  statements.push({
    id: "why",
    parent: "c0",
    text: "Why.",
    sources: ["README.md"],
  } as never);
  statements.push({
    id: "use",
    parent: "c1",
    text: "Use.",
    sources: ["README.md"],
  } as never);
  const map = validateKnowledgeMap({
    format: "zam-knowledge-map",
    version: 1,
    title: "Wide",
    focus_question: "?",
    root: "root",
    statements,
    relations: [
      { from: "root", to: "why", kind: "because" },
      { from: "use", to: "root", kind: "requires" },
    ],
  }).map as KnowledgeMap;
  return buildMapIndex(map);
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

describe("knowledge map layout", () => {
  it("ranks the parent, the statement just left, cross-links, then details", () => {
    const index = zamIndex();
    const ranked = rankNeighbors(index, "review", "skill-decay");
    expect(ranked[0]).toMatchObject({ id: "zam", tree: "parent" });
    expect(ranked[1]).toMatchObject({ id: "skill-decay", kind: "because" });
    expect(ranked.slice(2).every((n) => n.tree === "child")).toBe(true);
  });

  it("keeps the compass: parent above, details below, out right, in left", () => {
    const index = wideIndex();
    const layout = layoutFocus(index, "root", null, 1000, 640);
    const sides = new Map(layout.nodes.map((n) => [n.neighbor.id, n.side]));
    expect(sides.get("why")).toBe("right");
    expect(sides.get("use")).toBe("left");
    expect(sides.get("c0")).toBe("bottom");
    const child = layoutFocus(index, "c0", "root", 1000, 640);
    expect(child.nodes.find((n) => n.neighbor.id === "root")?.side).toBe("top");
  });

  it("shows at most seven neighbours and folds the rest into +n", () => {
    const index = wideIndex();
    const layout = layoutFocus(index, "root", null, 1000, 640);
    expect(layout.nodes).toHaveLength(MAX_VISIBLE_NEIGHBORS);
    expect(layout.overflow?.count).toBe(11 - MAX_VISIBLE_NEIGHBORS);
    const expanded = layoutFocus(index, "root", null, 1000, 640, true);
    expect(expanded.nodes).toHaveLength(11);
    expect(expanded.overflow).toBeNull();
  });

  it("stacks one column on a narrow screen", () => {
    const layout = layoutFocus(wideIndex(), "c0", null, NARROW_WIDTH - 1, 600);
    expect(layout.narrow).toBe(true);
    const xs = new Set(layout.nodes.map((n) => n.x));
    expect(xs.size).toBe(1);
    expect(layout.minHeight).toBeGreaterThan(0);
  });

  it("places every statement in the overview", () => {
    const index = zamIndex();
    const { points, edges } = layoutMinimap(index, 220, 96);
    expect(points.size).toBe(index.order().length);
    expect(edges).toHaveLength(index.order().length - 1);
    for (const point of points.values()) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(220);
    }
  });
});

describe("knowledge map views and strings", () => {
  it("registers the switchable views with a safe default", () => {
    expect(KNOWLEDGE_MAP_VIEWS.map((v) => v.id)).toEqual([
      "focus",
      "outline",
      "levels",
      "concept",
    ]);
    expect(parseKnowledgeMapViewId("levels")).toBe("levels");
    expect(parseKnowledgeMapViewId("3d")).toBe(DEFAULT_KNOWLEDGE_MAP_VIEW);
    expect(parseKnowledgeMapViewId(null)).toBe("focus");
  });

  it("has every connective and view label in English and German", () => {
    const keys = [
      ...KNOWLEDGE_MAP_VIEWS.flatMap((v) => [v.nameKey, v.descriptionKey]),
      ...["elaborates", ...RELATION_KINDS].flatMap((kind) =>
        (["out", "in"] as const).map((direction) =>
          relationLabelKey({ kind: kind as never, direction }),
        ),
      ),
    ];
    const source = filesUnder(MAP_DIR)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    for (const match of source.matchAll(
      /\bt\("(km_[a-z_]+)"\)|tf\("(km_[a-z_]+)"/g,
    )) {
      keys.push(match[1] ?? match[2]);
    }
    for (const locale of ["en", "de"]) {
      setCurrentLocale(locale);
      for (const key of new Set(keys)) {
        expect(t(key), `${locale}: ${key}`).not.toBe(key);
      }
    }
    setCurrentLocale("en");
  });
});

describe("concept map picture", () => {
  function indexed(statements: Array<Record<string, unknown>>, relations = []) {
    const map = validateKnowledgeMap(
      {
        format: "zam-knowledge-map",
        version: 1,
        title: "ZAM",
        focus_question: "What stays in view?",
        root: "zam",
        statements,
        relations,
      },
      { sourceExists: () => true },
    ).map;
    if (!map) throw new Error("fixture map was rejected");
    return buildMapIndex(map);
  }

  const star = () =>
    indexed([
      {
        id: "zam",
        label: "ZAM",
        text: "ZAM is the studio.",
        sources: ["README.md"],
      },
      {
        id: "kernel",
        parent: "zam",
        label: "Kernel",
        text: "The kernel holds learning.",
        sources: ["README.md"],
      },
      {
        id: "cli",
        parent: "zam",
        text: "The CLI orchestrates.",
        sources: ["README.md"],
      },
      {
        id: "library",
        parent: "zam",
        label: "Library",
        text: "The library stores cards.",
        sources: ["README.md"],
      },
      {
        id: "articles",
        parent: "zam",
        label: "Articles",
        text: "Articles explain ZAM.",
        sources: ["README.md"],
      },
      {
        id: "bridge",
        parent: "zam",
        label: "Bridge",
        text: "The bridge speaks JSON.",
        sources: ["README.md"],
      },
      {
        id: "learning",
        parent: "kernel",
        label: "Learning",
        text: "Learning lives in the kernel.",
        sources: ["README.md"],
      },
    ]);

  it("draws at most four spokes and keeps the rest as further concepts", () => {
    const picture = conceptPicture(star(), "zam");
    expect(picture.spokes).toHaveLength(CONCEPT_SPOKES);
    expect(picture.spokes.map((spoke) => spoke.id)).toEqual([
      "articles",
      "bridge",
      "cli",
      "kernel",
    ]);
    expect(picture.more).toEqual(["library"]);
    expect(picture.spokes.map((spoke) => spoke.position)).toEqual([
      "north",
      "east",
      "south",
      "west",
    ]);
  });

  it("reads only the visible spokes, outgoing before incoming", () => {
    const index = star();
    const picture = conceptPicture(index, "kernel");
    expect(picture.spokes.map((spoke) => spoke.id)[0]).not.toBe("zam");
    const reading = conceptReading(index, picture, (key) =>
      key.endsWith("_out") ? "in detail" : "is part of",
    );
    expect(reading.startsWith("Kernel in detail")).toBe(true);
    expect(reading).toContain("Kernel is part of ZAM.");
    expect(reading).not.toContain("Library");
  });

  it("uses the id when a statement has no label, and the root when the id is missing", () => {
    const index = star();
    expect(
      conceptLabel(index.get("cli") as KnowledgeMap["statements"][number]),
    ).toBe("cli");
    expect(conceptPicture(index, "missing").centerId).toBe("zam");
    for (const id of index.order()) {
      expect(conceptPicture(index, id).spokes.length).toBeLessThanOrEqual(
        CONCEPT_SPOKES,
      );
    }
  });
});

describe("knowledge map module boundaries and wiring", () => {
  it("never imports Tauri, Three.js or main.ts", () => {
    for (const path of filesUnder(MAP_DIR)) {
      const text = readFileSync(path, "utf8");
      expect(text, path).not.toMatch(/@tauri-apps|from "three"|\.\.\/main\.js/);
    }
  });

  it("keeps views off the bridge", () => {
    for (const path of filesUnder(join(MAP_DIR, "views"))) {
      expect(readFileSync(path, "utf8"), path).not.toContain(
        "bridge-transport",
      );
    }
  });

  it("loads the map page lazily and hides it until the alpha is on", () => {
    const main = readFileSync(join(ROOT, "desktop/src/main.ts"), "utf8");
    expect(main).toContain('await import("./knowledge-map/studio.js")');
    expect(main).not.toMatch(/^import .*knowledge-map\/studio/m);
    expect(main).not.toMatch(/^import .*knowledge-map\/views/m);
    const html = readFileSync(join(ROOT, "desktop/index.html"), "utf8");
    expect(html).toMatch(/<button id="nav-knowledge-map"[^>]*\bhidden\b/);
    expect(html).toMatch(
      /id="knowledge-map-card" data-settings-tier="advanced"/,
    );
    expect(html).toMatch(
      /<div class="settings-stack" id="knowledge-map-settings-body" hidden>/,
    );
  });
});
