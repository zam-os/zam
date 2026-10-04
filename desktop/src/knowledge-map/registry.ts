/**
 * The knowledge-map views that can be switched in Settings, grouped by the
 * model that built them. Each one is its own lazily loaded module: nothing
 * here loads until the alpha is on and the map is opened (ADR 2026-10-03,
 * Decisions 2–4).
 */

import type { ViewModule } from "./contract.js";

export type KnowledgeMapViewId =
  | "focus"
  | "outline"
  | "levels"
  | "concept"
  | "c4"
  | "gemini-radial"
  | "gemini-causal"
  | "gemini-facets";

/** Who built a view; Settings groups the views by it. */
export type KnowledgeMapViewAuthor = "shared" | "claude" | "gemini" | "grok";

export const KNOWLEDGE_MAP_AUTHORS: readonly KnowledgeMapViewAuthor[] = [
  "shared",
  "claude",
  "gemini",
  "grok",
];

export interface KnowledgeMapViewEntry {
  id: KnowledgeMapViewId;
  author: KnowledgeMapViewAuthor;
  /** i18n keys for the name and one-line description. */
  nameKey: string;
  descriptionKey: string;
  load: () => Promise<ViewModule>;
}

export const KNOWLEDGE_MAP_VIEWS: readonly KnowledgeMapViewEntry[] = [
  {
    id: "focus",
    author: "claude",
    nameKey: "km_view_focus",
    descriptionKey: "km_view_focus_desc",
    load: () => import("./views/focus.js"),
  },
  {
    id: "outline",
    author: "shared",
    nameKey: "km_view_outline",
    descriptionKey: "km_view_outline_desc",
    load: () => import("./views/outline.js"),
  },
  {
    id: "levels",
    author: "claude",
    nameKey: "km_view_levels",
    descriptionKey: "km_view_levels_desc",
    load: () => import("./views/levels.js"),
  },
  {
    id: "concept",
    author: "grok",
    nameKey: "km_view_concept",
    descriptionKey: "km_view_concept_desc",
    load: () => import("./views/concept.js"),
  },
  {
    id: "c4",
    author: "claude",
    nameKey: "km_view_c4",
    descriptionKey: "km_view_c4_desc",
    load: () => import("./views/c4.js"),
  },
  {
    id: "gemini-radial",
    author: "gemini",
    nameKey: "km_view_g_radial",
    descriptionKey: "km_view_g_radial_desc",
    load: () => import("./views/gemini-radial.js"),
  },
  {
    id: "gemini-causal",
    author: "gemini",
    nameKey: "km_view_g_causal",
    descriptionKey: "km_view_g_causal_desc",
    load: () => import("./views/gemini-causal.js"),
  },
  {
    id: "gemini-facets",
    author: "gemini",
    nameKey: "km_view_g_facets",
    descriptionKey: "km_view_g_facets_desc",
    load: () => import("./views/gemini-facets.js"),
  },
];

/** The views grouped by author, in the order Settings shows them. */
export function knowledgeMapViewsByAuthor(): Array<{
  author: KnowledgeMapViewAuthor;
  views: KnowledgeMapViewEntry[];
}> {
  return KNOWLEDGE_MAP_AUTHORS.map((author) => ({
    author,
    views: KNOWLEDGE_MAP_VIEWS.filter((view) => view.author === author),
  })).filter((group) => group.views.length > 0);
}

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
