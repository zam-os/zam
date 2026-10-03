import { describe, expect, it } from "vitest";
import {
  type PropositionNode,
  ZAM_REPO_KNOWLEDGE,
  ZAM_ROOT_ID,
} from "../../desktop/src/panel/mindmap-data.js";
import {
  listMindmapPlugins,
  getMindmapPlugin,
} from "../../desktop/src/panel/mindmap-plugins.js";
import { isMindmapPrototypeActive } from "../../desktop/src/panel/mindmap-render.js";
import {
  MINDMAP_ENABLED_STORAGE_KEY,
  MINDMAP_PLUGIN_STORAGE_KEY,
  isMindmapFeatureEnabled,
  setMindmapFeatureEnabled,
  getActiveMindmapPluginId,
  setActiveMindmapPluginId,
  getActiveMindmapPlugin,
} from "../../desktop/src/panel/mindmap-settings.js";

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

  it("activates when settings storage has enabled=true", () => {
    const originalWindow = globalThis.window;
    try {
      const store = new Map<string, string>();
      store.set(MINDMAP_ENABLED_STORAGE_KEY, "true");
      globalThis.window = {
        location: { search: "", hash: "" },
        localStorage: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, val: string) => store.set(key, val),
        },
      } as unknown as Window & typeof globalThis;

      expect(isMindmapPrototypeActive()).toBe(true);
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

describe("mindmap plugins registry & multi-provider slots", () => {
  it("lists all three configured plugins", () => {
    const plugins = listMindmapPlugins();
    expect(plugins).toHaveLength(3);
    const ids = plugins.map((p) => p.id);
    expect(ids).toContain("antigravity");
    expect(ids).toContain("claude");
    expect(ids).toContain("grok");
  });

  it("provides ready status for antigravity plugin", () => {
    const plugin = getMindmapPlugin("antigravity");
    expect(plugin.id).toBe("antigravity");
    expect(plugin.status).toBe("ready");
    expect(plugin.author).toContain("Antigravity");
    expect(plugin.description).toBeTruthy();
  });

  it("provides development status and placeholder mount for claude plugin", () => {
    const plugin = getMindmapPlugin("claude");
    expect(plugin.id).toBe("claude");
    expect(plugin.status).toBe("in_development");
    expect(plugin.author).toBe("Claude");

    const container = { innerHTML: "" } as unknown as HTMLElement;
    const controller = plugin.mount(container, { initialFocusId: "zam_root" });
    expect(container.innerHTML).toContain("Plugin-Slot: Claude");
    expect(controller.getState().focusId).toBe("zam_root");

    controller.setFocus("zam_kernel");
    expect(controller.getState().focusId).toBe("zam_kernel");

    controller.goToRoot();
    expect(controller.getState().focusId).toBe("zam_root");

    controller.destroy();
    expect(container.innerHTML).toBe("");
  });

  it("provides development status and placeholder mount for grok plugin", () => {
    const plugin = getMindmapPlugin("grok");
    expect(plugin.id).toBe("grok");
    expect(plugin.status).toBe("in_development");
    expect(plugin.author).toBe("Grok");

    const container = { innerHTML: "" } as unknown as HTMLElement;
    const controller = plugin.mount(container);
    expect(container.innerHTML).toContain("Plugin-Slot: Grok");
    expect(controller.getState().focusId).toBe("zam_root");

    controller.destroy();
    expect(container.innerHTML).toBe("");
  });

  it("antigravity plugin renders copyable agent prompt when graph is empty", () => {
    const plugin = getMindmapPlugin("antigravity");
    const container = { innerHTML: "", querySelector: () => null } as unknown as HTMLElement;
    const controller = plugin.mount(container, { graph: {} });
    expect(container.innerHTML).toContain("/repo-knowledge-map");
    expect(container.innerHTML).toContain("Keine Wissenslandkarte");
    controller.destroy();
    expect(container.innerHTML).toBe("");
  });

  it("falls back to antigravity plugin for unknown IDs", () => {
    // @ts-expect-error testing unknown plugin id
    const plugin = getMindmapPlugin("unknown_id");
    expect(plugin.id).toBe("antigravity");
  });
});

describe("mindmap settings manager", () => {
  it("manages feature enablement via storage", () => {
    const originalWindow = globalThis.window;
    try {
      const store = new Map<string, string>();
      const mockStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      };

      globalThis.window = {
        location: { search: "", hash: "" },
        localStorage: mockStorage,
      } as unknown as Window & typeof globalThis;

      expect(isMindmapFeatureEnabled(mockStorage)).toBe(false);

      setMindmapFeatureEnabled(true, mockStorage);
      expect(store.get(MINDMAP_ENABLED_STORAGE_KEY)).toBe("true");
      expect(isMindmapFeatureEnabled(mockStorage)).toBe(true);

      setMindmapFeatureEnabled(false, mockStorage);
      expect(store.get(MINDMAP_ENABLED_STORAGE_KEY)).toBe("false");
      expect(isMindmapFeatureEnabled(mockStorage)).toBe(false);
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("manages active plugin selection via storage with fallback", () => {
    const originalWindow = globalThis.window;
    try {
      const store = new Map<string, string>();
      const mockStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      };

      globalThis.window = {
        location: { search: "", hash: "" },
        localStorage: mockStorage,
      } as unknown as Window & typeof globalThis;

      // Default is antigravity
      expect(getActiveMindmapPluginId(mockStorage)).toBe("antigravity");

      // Set to claude
      setActiveMindmapPluginId("claude", mockStorage);
      expect(store.get(MINDMAP_PLUGIN_STORAGE_KEY)).toBe("claude");
      expect(getActiveMindmapPluginId(mockStorage)).toBe("claude");
      expect(getActiveMindmapPlugin(mockStorage).id).toBe("claude");

      // Set to grok
      setActiveMindmapPluginId("grok", mockStorage);
      expect(store.get(MINDMAP_PLUGIN_STORAGE_KEY)).toBe("grok");
      expect(getActiveMindmapPluginId(mockStorage)).toBe("grok");
      expect(getActiveMindmapPlugin(mockStorage).id).toBe("grok");

      // Invalid stored value falls back to antigravity
      store.set(MINDMAP_PLUGIN_STORAGE_KEY, "invalid_plugin");
      expect(getActiveMindmapPluginId(mockStorage)).toBe("antigravity");
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it("honors URL search param override for plugin selection", () => {
    const originalWindow = globalThis.window;
    try {
      const store = new Map<string, string>();
      store.set(MINDMAP_PLUGIN_STORAGE_KEY, "antigravity");
      const mockStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      };

      globalThis.window = {
        location: { search: "?plugin=claude", hash: "" },
        localStorage: mockStorage,
      } as unknown as Window & typeof globalThis;

      expect(getActiveMindmapPluginId(mockStorage)).toBe("claude");
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

