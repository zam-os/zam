import { describe, expect, it } from "vitest";
import {
  type PropositionNode,
  ZAM_REPO_KNOWLEDGE,
  ZAM_ROOT_ID,
} from "../../desktop/src/panel/mindmap-data.js";
import { isMindmapPrototypeActive } from "../../desktop/src/panel/mindmap-render.js";

describe("repo knowledge mindmap data graph", () => {
  it("contains the root node as default entry point", () => {
    expect(ZAM_REPO_KNOWLEDGE[ZAM_ROOT_ID]).toBeDefined();
    const root = ZAM_REPO_KNOWLEDGE[ZAM_ROOT_ID]!;
    expect(root.id).toBe("zam_root");
    expect(root.statement).toContain("Spaced-Repetition Lernengine");
    expect(root.macroSynthesis).toBeTruthy();
  });

  it("enforces atomic propositions per node", () => {
    for (const [id, node] of Object.entries(ZAM_REPO_KNOWLEDGE)) {
      expect(node.id).toBe(id);
      expect(node.statement.trim().length).toBeGreaterThan(15);
      // Statement should be a single coherent proposition (at most 2 sentences)
      const sentenceCount = (node.statement.match(/[.!?]+/g) || []).length;
      expect(sentenceCount).toBeLessThanOrEqual(2);
    }
  });

  it("maintains referential integrity across all neighbor links", () => {
    for (const [nodeId, node] of Object.entries(ZAM_REPO_KNOWLEDGE)) {
      expect(node.neighbors.length).toBeGreaterThan(0);
      for (const neighbor of node.neighbors) {
        expect(
          ZAM_REPO_KNOWLEDGE[neighbor.id],
          `Node ${nodeId} points to nonexistent neighbor ${neighbor.id}`,
        ).toBeDefined();
        expect(neighbor.statement).toBeTruthy();
        expect(neighbor.relation).toBeTruthy();
      }
    }
  });

  it("provides concrete repo orientation anchors for each concept", () => {
    for (const [nodeId, node] of Object.entries(ZAM_REPO_KNOWLEDGE)) {
      expect(node.anchors.length).toBeGreaterThan(0);
      for (const anchor of node.anchors) {
        expect(anchor.path).toBeTruthy();
        expect([
          "code",
          "test",
          "schema",
          "okf",
          "adr",
          "config",
          "docs",
        ]).toContain(anchor.type);
      }
    }
  });

  it("furnishes complete 4-facet clusters for multi-perspective viewing", () => {
    for (const [nodeId, node] of Object.entries(ZAM_REPO_KNOWLEDGE)) {
      const { facets } = node;
      expect(facets.north.statement, `${nodeId} missing north statement`).toBeTruthy();
      expect(facets.east.statement, `${nodeId} missing east statement`).toBeTruthy();
      expect(facets.south.statement, `${nodeId} missing south statement`).toBeTruthy();
      expect(facets.west.statement, `${nodeId} missing west statement`).toBeTruthy();
    }
  });

  it("furnishes upstream and downstream tree nodes for causal viewing", () => {
    for (const [nodeId, node] of Object.entries(ZAM_REPO_KNOWLEDGE)) {
      const { tree } = node;
      expect(Array.isArray(tree.upstream)).toBe(true);
      expect(Array.isArray(tree.downstream)).toBe(true);
      if (nodeId !== ZAM_ROOT_ID) {
        // Non-root nodes should have at least one upstream cause/origin
        expect(tree.upstream.length).toBeGreaterThan(0);
      }
      expect(tree.downstream.length).toBeGreaterThan(0);
    }
  });
});

describe("isMindmapPrototypeActive switch", () => {
  it("stays inactive when no prototype query param is present", () => {
    const originalWindow = globalThis.window;
    try {
      // Simulate standard URL without prototype switch
      globalThis.window = {
        location: { search: "", hash: "" },
      } as unknown as Window & typeof globalThis;

      expect(isMindmapPrototypeActive()).toBe(false);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("activates when prototype=mindmap is set in query string", () => {
    const originalWindow = globalThis.window;
    try {
      globalThis.window = {
        location: { search: "?prototype=mindmap", hash: "" },
      } as unknown as Window & typeof globalThis;

      expect(isMindmapPrototypeActive()).toBe(true);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("activates when view=mindmap is set in query string", () => {
    const originalWindow = globalThis.window;
    try {
      globalThis.window = {
        location: { search: "?view=mindmap", hash: "" },
      } as unknown as Window & typeof globalThis;

      expect(isMindmapPrototypeActive()).toBe(true);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("activates when prototype=knowledge-map is set in query string", () => {
    const originalWindow = globalThis.window;
    try {
      globalThis.window = {
        location: { search: "?prototype=knowledge-map", hash: "" },
      } as unknown as Window & typeof globalThis;

      expect(isMindmapPrototypeActive()).toBe(true);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("degrades gracefully to false when window is undefined", () => {
    const originalWindow = globalThis.window;
    try {
      // @ts-expect-error intentionally simulating undefined window in node
      delete globalThis.window;
      expect(isMindmapPrototypeActive()).toBe(false);
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
