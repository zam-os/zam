/**
 * Studio Settings: the knowledge-map alpha card (ADR 2026-10-03, Decision 4).
 *
 * Off by default. Until the learner ticks the box, the card is one checkbox
 * and one sentence and the navigation entry stays hidden. Once on, the card
 * lists the views; the choice is stored for this machine and the map page
 * uses it the next time it opens.
 */

import { runBridge } from "../bridge-transport.js";
import { t } from "../i18n.js";
import {
  KNOWLEDGE_MAP_VIEWS,
  type KnowledgeMapViewId,
  parseKnowledgeMapViewId,
} from "./registry.js";

interface FeatureResponse {
  enabled: boolean;
  view: string | null;
}

export interface KnowledgeMapSettings {
  refresh(): Promise<void>;
}

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing`);
  return element as T;
}

/**
 * Wire the card. `onEnabledChange` lets main.ts show or hide the navigation
 * entry; `onViewChange` lets an open map page switch views right away.
 */
export function initKnowledgeMapSettings(options: {
  onEnabledChange(enabled: boolean): void;
  onViewChange?(view: KnowledgeMapViewId): void;
}): KnowledgeMapSettings {
  const toggle = required<HTMLInputElement>("toggle-knowledge-map");
  const body = required<HTMLElement>("knowledge-map-settings-body");
  const views = required<HTMLElement>("knowledge-map-views");
  const status = required<HTMLElement>("knowledge-map-status");

  const applyLabels = () => {
    required("lbl-km-settings-title-text").textContent = t("km_settings_title");
    required("lbl-km-settings-help").textContent = t("km_settings_help");
    required("lbl-km-settings-toggle").textContent = t("km_settings_toggle");
    required("lbl-km-settings-note").textContent = t("km_settings_note");
    required("lbl-km-settings-view").textContent = t("km_settings_view");
  };

  let current: KnowledgeMapViewId = "focus";
  const renderViews = () => {
    views.replaceChildren();
    for (const entry of KNOWLEDGE_MAP_VIEWS) {
      const label = document.createElement("label");
      label.className = "settings-toggle";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "knowledge-map-view";
      input.value = entry.id;
      input.id = `knowledge-map-view-${entry.id}`;
      input.checked = entry.id === current;
      input.addEventListener("change", async () => {
        if (!input.checked) return;
        try {
          await runBridge("knowledge-map-feature", ["--view", entry.id]);
          current = entry.id;
          status.textContent = "";
          options.onViewChange?.(entry.id);
        } catch {
          status.textContent = t("km_settings_error");
        }
      });
      const text = document.createElement("span");
      const name = document.createElement("span");
      name.textContent = t(entry.nameKey);
      const help = document.createElement("span");
      help.className = "settings-card-help";
      help.textContent = t(entry.descriptionKey);
      text.append(name, help);
      label.append(input, text);
      views.appendChild(label);
    }
  };

  const show = (enabled: boolean) => {
    toggle.checked = enabled;
    body.hidden = !enabled;
    options.onEnabledChange(enabled);
  };

  const refresh = async () => {
    applyLabels();
    try {
      const feature = await runBridge<FeatureResponse>("knowledge-map-feature");
      current = parseKnowledgeMapViewId(feature.view);
      renderViews();
      show(feature.enabled === true);
    } catch {
      // An older bridge has no such command: treat the alpha as off.
      renderViews();
      show(false);
    }
  };

  toggle.addEventListener("change", async () => {
    const enable = toggle.checked;
    try {
      await runBridge("knowledge-map-feature", [
        enable ? "--enable" : "--disable",
      ]);
      status.textContent = "";
      show(enable);
    } catch {
      status.textContent = t("km_settings_error");
      show(!enable);
    }
  });

  void refresh();
  return { refresh };
}
