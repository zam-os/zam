import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";
import {
  buildC4Diagram,
  buildC4Model,
  clipToBoxes,
  homeScope,
  parentScope,
  zoomScope,
} from "../../desktop/src/knowledge-map/c4-layout.js";
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

describe("knowledge map C4 view", () => {
  const index = zamIndex();
  const model = buildC4Model(index);

  it("places containers in their system and components in their container", () => {
    expect(model.elements.get("kernel")?.host).toBe("zam");
    expect(model.elements.get("cli-layer")?.host).toBe("zam");
    expect(model.elements.get("mcp-apps-panels")?.host).toBe("zam");
    expect(model.elements.get("mcp-preferred")?.host).toBe("cli-layer");
    expect(model.elements.get("llm-in-cli")?.host).toBe("cli-layer");
    expect(model.elements.get("fsrs6")?.host).toBe("kernel");
    expect(model.elements.get("server-db")?.host).toBeUndefined();
    // A statement without a facet belongs to its nearest element.
    expect(model.elementOf("not-transitive")).toBe("blocking");
    expect(model.elementOf("beliefs")).toBe("zam");
  });

  it("navigates context → containers → components and back", () => {
    expect(homeScope(model, "learner")).toEqual({
      level: "context",
      scopeId: null,
    });
    expect(homeScope(model, "kernel")).toEqual({
      level: "container",
      scopeId: "zam",
    });
    expect(homeScope(model, "fsrs6")).toEqual({
      level: "component",
      scopeId: "kernel",
    });
    expect(zoomScope(model, "zam")).toEqual({
      level: "container",
      scopeId: "zam",
    });
    expect(zoomScope(model, "cli-layer")).toEqual({
      level: "component",
      scopeId: "cli-layer",
    });
    expect(zoomScope(model, "agents")).toBeNull();
    expect(
      parentScope(model, { level: "component", scopeId: "kernel" }),
    ).toEqual({
      level: "container",
      scopeId: "zam",
    });
    expect(parentScope(model, { level: "context", scopeId: null })).toBeNull();
  });

  it("rolls links up to the boxes of the system context", () => {
    const diagram = buildC4Diagram(index, model, {
      level: "context",
      scopeId: null,
    });
    const ids = diagram.boxes.map((box) => box.element.id).sort();
    expect(ids).toEqual([
      "agents",
      "language-models",
      "learner",
      "server-db",
      "zam",
    ]);
    const arrows = diagram.arrows.map((a) => `${a.from}>${a.to}`);
    expect(arrows).toContain("learner>zam");
    expect(arrows).toContain("agents>zam");
    expect(arrows).toContain("zam>language-models");
    expect(arrows).toContain("zam>server-db");
    expect(diagram.boundary).toBeNull();
  });

  it("draws the containers of a system with the outside it talks to", () => {
    const diagram = buildC4Diagram(index, model, {
      level: "container",
      scopeId: "zam",
    });
    const inside = diagram.boxes
      .filter((b) => b.role === "inside")
      .map((b) => b.element.id);
    expect(inside.sort()).toEqual(
      [
        "cli-layer",
        "kernel",
        "local-sqlite",
        "mcp-apps-panels",
        "mobile-standalone",
        "studio",
      ].sort(),
    );
    const arrows = diagram.arrows.map((a) => `${a.from}>${a.to}`);
    // agents → MCP server rolls up to the CLI container; two component
    // links into the kernel become one arrow that counts both.
    expect(arrows).toContain("agents>cli-layer");
    const cliToKernel = diagram.arrows.find(
      (a) => a.from === "cli-layer" && a.to === "kernel",
    );
    expect(cliToKernel?.count).toBe(2);
    // Links between two outside boxes stay off a container diagram.
    expect(arrows).not.toContain("learner>agents");
    expect(diagram.boundary?.id).toBe("zam");
  });

  it("draws the components of a container", () => {
    const diagram = buildC4Diagram(index, model, {
      level: "component",
      scopeId: "cli-layer",
    });
    const inside = diagram.boxes
      .filter((b) => b.role === "inside")
      .map((b) => b.element.id);
    expect(inside.sort()).toEqual([
      "bridge-json",
      "llm-in-cli",
      "mcp-preferred",
    ]);
    const arrows = diagram.arrows.map((a) => `${a.from}>${a.to}`);
    expect(arrows).toContain("studio>bridge-json");
    expect(arrows).toContain("mcp-preferred>kernel");
    expect(arrows).toContain("llm-in-cli>language-models");
  });

  it("clips arrows to the box borders", () => {
    const line = clipToBoxes(
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 300, y: 0, width: 100, height: 50 },
      0,
    );
    expect(line).toEqual({ x1: 100, y1: 25, x2: 300, y2: 25 });
    const same = clipToBoxes(
      { x: 0, y: 0, width: 0, height: 0 },
      { x: 0, y: 0, width: 0, height: 0 },
    );
    expect(Number.isFinite(same.x1)).toBe(true);
  });
});

describe("knowledge map views and strings", () => {
  it("registers the switchable views with a safe default", () => {
    expect(KNOWLEDGE_MAP_VIEWS.map((v) => v.id)).toEqual([
      "focus",
      "outline",
      "levels",
      "c4",
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
