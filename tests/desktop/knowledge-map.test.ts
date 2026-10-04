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
  CONCEPT_SPOKES,
  conceptLabel,
  conceptPicture,
  conceptReading,
} from "../../desktop/src/knowledge-map/concept-layout.js";
import {
  anchorType,
  causeTree,
  facetsOf,
  macroSynthesis,
  relatedItems,
} from "../../desktop/src/knowledge-map/gemini-adapter.js";
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
  knowledgeMapViewsByAuthor,
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
  const statements = [
    { id: "root", label: "Root", text: "Root.", sources: ["README.md"] },
  ];
  for (let i = 0; i < 9; i++) {
    statements.push({
      id: `c${i}`,
      parent: "root",
      label: `Child ${i}`,
      link: "has",
      text: `Child ${i}.`,
      sources: ["README.md"],
    } as never);
  }
  statements.push({
    id: "why",
    parent: "c0",
    label: "Why",
    link: "has",
    text: "Why.",
    sources: ["README.md"],
  } as never);
  statements.push({
    id: "use",
    parent: "c1",
    label: "Use",
    link: "has",
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
      { from: "root", to: "why", kind: "because", link: "is explained by" },
      { from: "use", to: "root", kind: "requires", link: "needs" },
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

  it("names a box after c4.name, else the statement's label", () => {
    expect(model.elements.get("kernel")?.name).toBe("Kernel");
    expect(model.elements.get("cli-layer")?.name).toBe("CLI and MCP server");
    expect(model.elements.get("studio")?.name).toBe("Desktop Studio");
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
    // Rolled-up links keep every distinct phrase for the list.
    expect(cliToKernel?.labels).toEqual(["runs learning logic in"]);
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

describe("Gemini's views on the shared map", () => {
  const index = zamIndex();

  it("joins each neighbour with its concept sentence", () => {
    const items = relatedItems(index, "zam");
    expect(items[0].proposition).toBe("ZAM guards against Disconnection");
    expect(items.every((item) => item.proposition !== null)).toBe(true);
  });

  it("derives the macro-statement from the map, sentence by sentence", () => {
    const text = macroSynthesis(index, "zam");
    expect(text).toContain("ZAM rests on Beliefs.");
    expect(text).toContain("ZAM keeps Kernel.");
  });

  it("puts what the focus rests on left and what follows right", () => {
    const { upstream, downstream } = causeTree(index, "kernel");
    const up = upstream.map((item) => item.id);
    const down = downstream.map((item) => item.id);
    expect(up).toContain("zam");
    expect(up).toContain("local-sqlite");
    expect(down).toContain("mcp-preferred");
    expect(down).toContain("kernel-no-llm");
    expect(up.filter((id) => down.includes(id))).toEqual([]);
  });

  it("fills the four zones", () => {
    const facets = facetsOf(index, "fsrs6");
    expect(facets.purpose.map((item) => item.id)).toEqual(["review"]);
    expect(facets.rules.map((item) => item.id)).toContain("sm2");
    expect(facets.places).toEqual([
      { path: "docs/okf/fsrs-scheduling.md", type: "okf" },
    ]);
  });

  it("types repository anchors by path", () => {
    expect(anchorType("docs/adr/2026-10-03-repo-knowledge-map.md")).toBe("adr");
    expect(anchorType("tests/cli/knowledge-map.test.ts")).toBe("test");
    expect(anchorType("docs/knowledge-map/map.schema.json")).toBe("schema");
    expect(anchorType("package.json")).toBe("config");
    expect(anchorType("README.md")).toBe("docs");
    expect(anchorType("src/kernel/index.ts")).toBe("code");
  });
});

describe("knowledge map views and strings", () => {
  it("registers the switchable views with a safe default", () => {
    expect(KNOWLEDGE_MAP_VIEWS.map((v) => v.id)).toEqual([
      "focus",
      "outline",
      "levels",
      "concept",
      "c4",
      "gemini-radial",
      "gemini-causal",
      "gemini-facets",
    ]);
    expect(
      knowledgeMapViewsByAuthor().map(
        (group) => `${group.author}:${group.views.map((v) => v.id).join(",")}`,
      ),
    ).toEqual([
      "shared:outline",
      "claude:focus,levels,c4",
      "gemini:gemini-radial,gemini-causal,gemini-facets",
      "grok:concept",
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
  // Built without the validator on purpose: these fixtures leave labels and
  // phrases out to show that the view degrades instead of drawing slugs, a
  // case the validator now rejects for written maps.
  function indexed(statements: Array<Record<string, unknown>>, relations = []) {
    return buildMapIndex({
      format: "zam-knowledge-map",
      version: 1,
      title: "ZAM",
      focus_question: "What stays in view?",
      root: "zam",
      statements,
      relations,
    } as unknown as KnowledgeMap);
  }

  const star = () =>
    indexed(
      [
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
          link: "keeps",
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
          link: "stores",
          text: "The library stores cards.",
          sources: ["README.md"],
        },
        {
          id: "articles",
          parent: "zam",
          label: "Articles",
          link: "explains with",
          text: "Articles explain ZAM.",
          sources: ["README.md"],
        },
        {
          id: "bridge",
          parent: "zam",
          label: "Bridge",
          link: "offers",
          text: "The bridge speaks JSON.",
          sources: ["README.md"],
        },
        {
          id: "mobile",
          parent: "zam",
          label: "Mobile",
          link: "includes",
          text: "Mobile runs on its own.",
          sources: ["README.md"],
        },
        {
          id: "learning",
          parent: "kernel",
          label: "Learning",
          link: "contains",
          text: "Learning lives in the kernel.",
          sources: ["README.md"],
        },
      ],
      [{ from: "kernel", to: "learning", kind: "because", link: "holds" }],
    );

  it("draws four spokes and keeps the parent above the centre", () => {
    const picture = conceptPicture(star(), "zam");
    expect(picture.spokes).toHaveLength(CONCEPT_SPOKES);
    expect(picture.spokes.map((spoke) => spoke.id)).toEqual([
      "kernel",
      "library",
      "articles",
      "bridge",
    ]);
    expect(picture.more).toEqual(["mobile"]);
    expect(picture.spokes.every((spoke) => spoke.side === "bottom")).toBe(true);
    const kernel = conceptPicture(star(), "kernel");
    expect(kernel.spokes.find((spoke) => spoke.id === "zam")?.side).toBe("top");
    expect(kernel.spokes.find((spoke) => spoke.id === "learning")?.phrase).toBe(
      "holds",
    );
  });

  it("reads the stored phrase, not the sentence connective", () => {
    const index = star();
    const reading = conceptReading(index, conceptPicture(index, "kernel"));
    expect(reading).toContain("ZAM keeps Kernel.");
    expect(reading).toContain("Kernel holds Learning.");
    expect(reading).not.toContain("im Einzelnen");
    expect(reading).not.toContain("Library");
  });

  it("skips a node without a label and falls back to the root", () => {
    const index = star();
    expect(
      conceptLabel(index.get("cli") as KnowledgeMap["statements"][number]),
    ).toBeNull();
    expect(
      conceptPicture(index, "zam").spokes.some((spoke) => spoke.id === "cli"),
    ).toBe(false);
    expect(conceptPicture(index, "missing").centerId).toBe("zam");
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
