/**
 * Settings configuration and state helpers for the Mindmap Alpha feature.
 *
 * Implements Phase 6 of docs/plans/2026-10-03-repo-knowledge-mindmap-prototype.md.
 *
 * Manages:
 * - Feature enablement: Alpha feature, default disabled (false).
 * - Active plugin selection: "antigravity" (default), "claude", or "grok".
 */

import {
  type MindmapPlugin,
  type MindmapPluginId,
  getMindmapPlugin,
  listMindmapPlugins,
} from "./mindmap-plugins.js";

export const MINDMAP_ENABLED_STORAGE_KEY = "zam:mindmap:enabled";
export const MINDMAP_PLUGIN_STORAGE_KEY = "zam:mindmap:plugin";

export function isMindmapFeatureEnabled(
  storage: Pick<Storage, "getItem"> | undefined = typeof window !== "undefined"
    ? window.localStorage
    : undefined,
): boolean {
  if (typeof window === "undefined") return false;

  // 1. URL search parameter overrides for developer testing (?prototype=mindmap)
  try {
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("prototype") === "mindmap" ||
      params.get("view") === "mindmap" ||
      params.get("prototype") === "knowledge-map" ||
      window.location.hash.includes("prototype=mindmap")
    ) {
      return true;
    }
  } catch {
    // ignore
  }

  // 2. Settings toggle in localStorage (Alpha-Feature)
  try {
    return storage?.getItem(MINDMAP_ENABLED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setMindmapFeatureEnabled(
  enabled: boolean,
  storage: Pick<Storage, "setItem"> | undefined = typeof window !== "undefined"
    ? window.localStorage
    : undefined,
): void {
  try {
    storage?.setItem(MINDMAP_ENABLED_STORAGE_KEY, enabled ? "true" : "false");
  } catch {
    // ignore
  }
}

export function getActiveMindmapPluginId(
  storage: Pick<Storage, "getItem"> | undefined = typeof window !== "undefined"
    ? window.localStorage
    : undefined,
): MindmapPluginId {
  // Check URL param first (?plugin=claude or ?plugin=grok)
  if (typeof window !== "undefined") {
    try {
      const paramPlugin = new URLSearchParams(window.location.search).get("plugin");
      if (paramPlugin === "antigravity" || paramPlugin === "claude" || paramPlugin === "grok") {
        return paramPlugin;
      }
    } catch {
      // ignore
    }
  }

  try {
    const saved = storage?.getItem(MINDMAP_PLUGIN_STORAGE_KEY);
    if (saved === "antigravity" || saved === "claude" || saved === "grok") {
      return saved;
    }
  } catch {
    // ignore
  }
  return "antigravity";
}

export function setActiveMindmapPluginId(
  pluginId: MindmapPluginId,
  storage: Pick<Storage, "setItem"> | undefined = typeof window !== "undefined"
    ? window.localStorage
    : undefined,
): void {
  try {
    storage?.setItem(MINDMAP_PLUGIN_STORAGE_KEY, pluginId);
  } catch {
    // ignore
  }
}

export function getActiveMindmapPlugin(
  storage?: Pick<Storage, "getItem">,
): MindmapPlugin {
  const id = getActiveMindmapPluginId(storage);
  return getMindmapPlugin(id);
}

export { listMindmapPlugins, type MindmapPlugin, type MindmapPluginId };
