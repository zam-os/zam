/**
 * Mindmap Plugin Registry and multi-provider slots.
 *
 * Implements Phase 5 of docs/plans/2026-10-03-repo-knowledge-mindmap-prototype.md.
 *
 * Supports selectable implementations from multiple authors/models:
 * - "antigravity": Propositional multi-mode Kintsch map (Radial, Tree, Facet) [Ready]
 * - "claude": Claude mindmap plugin slot [In Development]
 * - "grok": Grok mindmap plugin slot [In Development]
 */

import type { MindmapController, MindmapOptions } from "./mindmap-render.js";
import { mountMindmap } from "./mindmap-render.js";

export type MindmapPluginId = "antigravity" | "claude" | "grok";

export interface MindmapPlugin {
  id: MindmapPluginId;
  name: string;
  author: string;
  version: string;
  description: string;
  status: "ready" | "in_development";
  badgeColor?: string;
  mount(container: HTMLElement, options?: MindmapOptions): MindmapController;
}

/** 1. Antigravity / Gemini Plugin: fully functional multi-mode proposition map */
export const antigravityMindmapPlugin: MindmapPlugin = {
  id: "antigravity",
  name: "Antigravity (Propositionale Kintsch-Landkarte)",
  author: "Antigravity / Gemini",
  version: "0.1.0-alpha",
  status: "ready",
  badgeColor: "#3b82f6",
  description:
    "Wissenschaftlich fundierte Wissenslandkarte: genau ~1 Aussage pro Knoten, integrierte Makrosynthese und umschaltbare Darstellungen (Radiale Ego-Karte, Kausalbaum, Zonierte Facetten).",
  mount(container: HTMLElement, options?: MindmapOptions): MindmapController {
    return mountMindmap(container, options);
  },
};

/** 2. Claude Plugin: Slot for Claude's future mindmap implementation */
export const claudeMindmapPlugin: MindmapPlugin = {
  id: "claude",
  name: "Claude Mindmap",
  author: "Claude",
  version: "0.1.0-alpha",
  status: "in_development",
  badgeColor: "#d97706",
  description:
    "Claudes Mindmap-Implementierung zur hierarchischen und konzeptionellen Wissensrepräsentation des Repositories.",
  mount(container: HTMLElement, options?: MindmapOptions): MindmapController {
    let currentFocus = options?.initialFocusId ?? "zam_root";
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:380px;padding:32px;text-align:center;background:var(--card,#fff);border:1px dashed #d97706;border-radius:12px;color:var(--fg,#1c2030);box-sizing:border-box;">
        <div style="font-size:28px;margin-bottom:12px;">🟧</div>
        <div style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;color:#d97706;background:rgba(217,119,6,0.12);padding:2px 8px;border-radius:4px;margin-bottom:8px;">
          Plugin-Slot: Claude
        </div>
        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:700;">Claude Mindmap-Implementierung</h3>
        <p style="max-width:520px;font-size:13px;line-height:1.5;color:var(--muted,#6b7280);margin:0 0 16px 0;">
          Dieser Slot ist für Claudes spezifische Darstellung des ZAM-Repo-Wissens reserviert.
          Sobald Claude seinen Renderer einhängt, visualisiert dieses Plugin die Wissenslandkarte in Claudes Design.
        </p>
        <div style="padding:10px 14px;background:var(--bg,#f5f7fb);border:1px solid var(--border,rgba(15,23,42,0.14));border-radius:8px;font-size:12px;font-family:monospace;color:var(--fg,#1c2030);">
          Status: In Entwicklung (Slot bereit für claudes mindmap-render)
        </div>
      </div>
    `;

    return {
      setFocus(id: string) {
        currentFocus = id;
      },
      setMode() {},
      goToRoot() {
        currentFocus = "zam_root";
      },
      getState() {
        return {
          focusId: currentFocus,
          mode: "radial",
          history: [currentFocus],
        };
      },
      destroy() {
        container.innerHTML = "";
      },
    };
  },
};

/** 3. Grok Plugin: Slot for Grok's future mindmap implementation */
export const grokMindmapPlugin: MindmapPlugin = {
  id: "grok",
  name: "Grok Mindmap",
  author: "Grok",
  version: "0.1.0-alpha",
  status: "in_development",
  badgeColor: "#10b981",
  description:
    "Groks Mindmap-Implementierung zur schnellen, unkonventionellen Wissensexploration des Repositories.",
  mount(container: HTMLElement, options?: MindmapOptions): MindmapController {
    let currentFocus = options?.initialFocusId ?? "zam_root";
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:380px;padding:32px;text-align:center;background:var(--card,#fff);border:1px dashed #10b981;border-radius:12px;color:var(--fg,#1c2030);box-sizing:border-box;">
        <div style="font-size:28px;margin-bottom:12px;">⚡</div>
        <div style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;color:#10b981;background:rgba(16,185,129,0.12);padding:2px 8px;border-radius:4px;margin-bottom:8px;">
          Plugin-Slot: Grok
        </div>
        <h3 style="margin:0 0 8px 0;font-size:16px;font-weight:700;">Grok Mindmap-Implementierung</h3>
        <p style="max-width:520px;font-size:13px;line-height:1.5;color:var(--muted,#6b7280);margin:0 0 16px 0;">
          Dieser Slot ist für Groks spezifische Darstellung des ZAM-Repo-Wissens reserviert.
          Sobald Grok seinen Renderer einhängt, visualisiert dieses Plugin die Wissenslandkarte in Groks Design.
        </p>
        <div style="padding:10px 14px;background:var(--bg,#f5f7fb);border:1px solid var(--border,rgba(15,23,42,0.14));border-radius:8px;font-size:12px;font-family:monospace;color:var(--fg,#1c2030);">
          Status: In Entwicklung (Slot bereit für groks mindmap-render)
        </div>
      </div>
    `;

    return {
      setFocus(id: string) {
        currentFocus = id;
      },
      setMode() {},
      goToRoot() {
        currentFocus = "zam_root";
      },
      getState() {
        return {
          focusId: currentFocus,
          mode: "radial",
          history: [currentFocus],
        };
      },
      destroy() {
        container.innerHTML = "";
      },
    };
  },
};

const REGISTRY: Record<MindmapPluginId, MindmapPlugin> = {
  antigravity: antigravityMindmapPlugin,
  claude: claudeMindmapPlugin,
  grok: grokMindmapPlugin,
};

export function getMindmapPlugin(id: MindmapPluginId): MindmapPlugin {
  return REGISTRY[id] ?? antigravityMindmapPlugin;
}

export function listMindmapPlugins(): MindmapPlugin[] {
  return Object.values(REGISTRY);
}

export function registerMindmapPlugin(plugin: MindmapPlugin): void {
  REGISTRY[plugin.id] = plugin;
}
