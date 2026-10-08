/**
 * What `zam_knowledge_map_show` (src/cli/commands/mcp.ts) hands the
 * knowledge-map panel, and the notice the panel shows when it has to fall
 * back to ZAM's own map — the same wording the Studio uses (studio.ts).
 */

import {
  type MapIssue,
  validateKnowledgeMap,
} from "../../../src/cli/knowledge-map/model.js";

export interface ShowKnowledgeMapResult {
  repoRoot?: string | null;
  found?: boolean;
  map?: unknown;
  issues?: MapIssue[];
  view?: string;
}

/** The notice above the map, or null when the repository's own map is shown. */
export function sampleNotice(
  result: ShowKnowledgeMapResult,
  translate: (key: string) => string,
): string | null {
  if (result.map && validateKnowledgeMap(result.map).map) return null;
  if (!result.found) return translate("km_sample_note");
  return [
    translate("km_invalid"),
    ...(result.issues ?? [])
      .filter((issue) => issue.level === "error")
      .slice(0, 8)
      .map((issue) => `• ${issue.id ? `${issue.id}: ` : ""}${issue.message}`),
  ].join("\n");
}
