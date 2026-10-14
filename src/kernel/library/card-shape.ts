/**
 * The shape of a generated card (owner's rule, 2026-10-14): one point per
 * card, and one names-only overview card for a knowledge that is itself a
 * complete, closed set.
 *
 * Every card-generating prompt states these rules in this wording — the
 * curriculum and file import, the topic import, the split and foundations
 * proposals, the material import and the OKF import — so a model meets one
 * rule on every path. Existing list cards were bloated with a member's
 * explanation per line; the overview card asks for the names only, and what
 * is to be said about a member goes on that member's own card.
 *
 * The overview card leans on answer points (`answer-points.ts`, ADR
 * 2026-09-08): each name is its own list item, so each member is scored as a
 * point, and points are scored only up to Bloom `MAX_SCORED_BLOOM_LEVEL` —
 * hence Bloom 1 or 2 for the overview card.
 *
 * Plain strings, free of Node built-ins: Mobile bundles the material prompt
 * that states them.
 */
export const CARD_SHAPE_RULES: readonly string[] = [
  "One point per card. When an answer would need several separate points (three differences between two systems, say), write several cards, one per point. Keep each answer as short as its point allows: a complex point may need a longer answer, but one answer never holds several points.",
  "Exception, the overview card: when the knowledge is itself a complete, closed set (the 16 German federal states, the parts of a cell, the seven OSI layers, the rhetorical devices of a curriculum), write ONE card that asks for the whole set. Its reference answer lists only the members' names, each as its own list item on its own line, so each name counts as one point; its Bloom level is 1 (Remember) or 2 (Understand). Never put a member's explanation, reason, example or effect on the overview card.",
  'Overview and single cards complement each other: a member that carries knowledge of its own also gets its own card. "List the rhetorical devices" is one card; what each device is and what effect it has are further cards, one point each.',
  'An overview asks for the names of a set\'s members, not for what is to be said about each: "Which index types does PostgreSQL have?" is an overview card; "How do B-Tree, GIN and BRIN differ?" is three cards.',
];

/** The rules as a prompt's bullet lines, one rule per line. */
export function cardShapeRuleLines(): string {
  return CARD_SHAPE_RULES.map((rule) => `- ${rule}`).join("\n");
}
