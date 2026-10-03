/**
 * Desktop Settings controller for the Repo-Wissenslandkarte Alpha feature.
 *
 * Implements Phase 6 of docs/plans/2026-10-03-repo-knowledge-mindmap-prototype.md.
 *
 * Features:
 * - Alpha feature card, off by default (checkbox unchecked).
 * - Multi-provider plugin selection: Antigravity (Bereit), Claude (Slot), Grok (Slot).
 * - Persisted via localStorage through mindmap-settings.ts.
 */

import {
  type MindmapPluginId,
  getMindmapPlugin,
  listMindmapPlugins,
} from "./panel/mindmap-plugins.js";
import {
  getActiveMindmapPluginId,
  isMindmapFeatureEnabled,
  setActiveMindmapPluginId,
  setMindmapFeatureEnabled,
} from "./panel/mindmap-settings.js";

export interface KnowledgeMindmapSettingsController {
  refresh(): void;
  isEnabled(): boolean;
  getActivePlugin(): MindmapPluginId;
}

export function initKnowledgeMindmapSettings(): KnowledgeMindmapSettingsController {
  const toggleEl = document.getElementById(
    "toggle-knowledge-mindmap",
  ) as HTMLInputElement | null;
  const bodyEl = document.getElementById("knowledge-mindmap-body");
  const selectEl = document.getElementById(
    "select-mindmap-plugin",
  ) as HTMLSelectElement | null;
  const descEl = document.getElementById("knowledge-mindmap-plugin-desc");

  function updateDesc(pluginId: MindmapPluginId): void {
    if (!descEl) return;
    const plugin = getMindmapPlugin(pluginId);
    descEl.textContent = `${plugin.name}: ${plugin.description}`;
  }

  function syncFromStorage(): void {
    const enabled = isMindmapFeatureEnabled();
    const activePlugin = getActiveMindmapPluginId();

    if (toggleEl) {
      toggleEl.checked = enabled;
    }
    if (bodyEl) {
      bodyEl.hidden = !enabled;
    }
    if (selectEl) {
      selectEl.value = activePlugin;
    }
    updateDesc(activePlugin);
  }

  // Populate options dynamically if select exists
  if (selectEl && selectEl.options.length === 0) {
    for (const plugin of listMindmapPlugins()) {
      const opt = document.createElement("option");
      opt.value = plugin.id;
      opt.textContent = `${plugin.name} — ${plugin.status === "ready" ? "Bereit" : "In Entwicklung"}`;
      selectEl.appendChild(opt);
    }
  }

  toggleEl?.addEventListener("change", () => {
    const isChecked = toggleEl.checked;
    setMindmapFeatureEnabled(isChecked);
    if (bodyEl) {
      bodyEl.hidden = !isChecked;
    }
  });

  selectEl?.addEventListener("change", () => {
    const pluginId = selectEl.value as MindmapPluginId;
    setActiveMindmapPluginId(pluginId);
    updateDesc(pluginId);
  });

  // Initial sync
  syncFromStorage();

  return {
    refresh() {
      syncFromStorage();
    },
    isEnabled() {
      return isMindmapFeatureEnabled();
    },
    getActivePlugin() {
      return getActiveMindmapPluginId();
    },
  };
}
