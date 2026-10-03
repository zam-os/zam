/**
 * The knowledge-map views that can be switched in Settings. Each one is its
 * own lazily loaded module: nothing here loads until the alpha is on and the
 * map is opened (ADR 2026-10-03, Decisions 2–4).
 */

import type { ViewModule } from "./contract.js";

export type KnowledgeMapViewId = "focus" | "outline" | "levels";

export interface KnowledgeMapViewEntry {
  id: KnowledgeMapViewId;
  /** i18n keys for the name and one-line description. */
  nameKey: string;
  descriptionKey: string;
  load: () => Promise<ViewModule>;
}

export const KNOWLEDGE_MAP_VIEWS: readonly KnowledgeMapViewEntry[] = [
  {
    id: "focus",
    nameKey: "km_view_focus",
    descriptionKey: "km_view_focus_desc",
    load: () => import("./views/focus.js"),
  },
  {
    id: "outline",
    nameKey: "km_view_outline",
    descriptionKey: "km_view_outline_desc",
    load: () => import("./views/outline.js"),
  },
  {
    id: "levels",
    nameKey: "km_view_levels",
    descriptionKey: "km_view_levels_desc",
    load: () => import("./views/levels.js"),
  },
];

export const DEFAULT_KNOWLEDGE_MAP_VIEW: KnowledgeMapViewId = "focus";

export function parseKnowledgeMapViewId(value: unknown): KnowledgeMapViewId {
  return KNOWLEDGE_MAP_VIEWS.some((view) => view.id === value)
    ? (value as KnowledgeMapViewId)
    : DEFAULT_KNOWLEDGE_MAP_VIEW;
}

export function knowledgeMapViewEntry(
  id: KnowledgeMapViewId,
): KnowledgeMapViewEntry {
  return (
    KNOWLEDGE_MAP_VIEWS.find((view) => view.id === id) ?? KNOWLEDGE_MAP_VIEWS[0]
  );
}
