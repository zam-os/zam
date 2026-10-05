/**
 * The vocabulary of a material-import proposal set (ADR 2026-10-05), kept
 * apart from the matching and writing code so the prompt module — which
 * Mobile bundles into its WebView — can name it without pulling in the
 * bundled curriculum tiles.
 */

export const MATERIAL_PROPOSAL_SET_VERSION = 1;

export const MATERIAL_KINDS = [
  "own-notes",
  "handout",
  "worksheet",
  "solution-sheet",
  "board-picture",
  "other",
] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export const MATERIAL_ORIGINS = ["page", "completed", "extra"] as const;
/** Where a proposed card comes from (Decision 4). */
export type MaterialOrigin = (typeof MATERIAL_ORIGINS)[number];
