import { MATH_ENVIRONMENTS } from "./tex-tokenizer.js";

/**
 * The shape of a generated card (owner's rule, 2026-10-14): one point per
 * card, and one names-only overview card for a knowledge that is itself a
 * complete, closed set.
 *
 * The card-generating prompts state these rules in this wording, so a model
 * meets one rule on every path: the curriculum and file import
 * (`requestCurriculumCards`), Mobile's curriculum import
 * (`buildMobileCurriculumPrompt`), the split and foundations proposals, the
 * material import on both paths (`materialCardRules`) and the OKF import's
 * tool description. A new card prompt interpolates them instead of copying
 * the text. Existing list cards were bloated with a member's explanation per
 * line; the overview card asks for the names only, and what is to be said
 * about a member goes on that member's own card.
 *
 * The overview card leans on answer points (`answer-points.ts`, ADR
 * 2026-09-08): each name is its own list item, so each member is scored as a
 * point. It stays at Bloom 1 or 2 because it asks for names only — recalling
 * them is Remember, at most Understand. Both levels lie inside the scored
 * range up to `MAX_SCORED_BLOOM_LEVEL`.
 *
 * The last rule is the card-text contract (ADR 2026-10-14b, Decision 6):
 * formulas as math segments with speech, never LaTeX or Markdown in text. Its
 * environment list comes from the formula inventory, so the prompt names
 * exactly what the validator accepts, and it carries its own short example,
 * so every prompt that states these rules shows one.
 *
 * Plain strings, free of Node built-ins: Mobile bundles the material prompt
 * that states them.
 */

/** The segment contract every card-writing prompt states. */
export const CARD_TEXT_RULE = `Formulas: write a question or answer that contains a formula as a list of segments instead of a string: plain text as {"type":"text","text":"…"} and each formula as {"type":"math","tex":"…","speech":"…"}. Example: [{"type":"text","text":"Wie groß ist die Energie "},{"type":"math","tex":"W_{\\\\text{el}} = \\\\frac{1}{2} C U^2","speech":"W el gleich ein halb C U Quadrat"},{"type":"text","text":"?"}]. "tex" is LaTeX math without dollar signs, and in JSON every backslash is written twice (\\\\frac); its only environments are ${MATH_ENVIRONMENTS.join(", ")}. "speech" is how a teacher reads the formula aloud, in the card's language, in plain words. Text never contains LaTeX, $ or Markdown such as ** or _: write plain sentences, with units and single symbols as Unicode (cm², °C, α). A card without a formula stays a plain string.`;

/**
 * For text that is not a card — evaluation feedback, generated choice
 * options, tutor dialogue (ADR 2026-10-14b, Decision 6): it stays plain.
 */
export const PLAIN_FORMULA_RULE =
  "Write formulas as plain Unicode text (W_el = ½·C·U², x², √2, α, H₂O), never as LaTeX, with $ signs or with Markdown.";

export const CARD_SHAPE_RULES: readonly string[] = [
  "One point per card. When an answer would need several separate points (three differences between two systems, say), write several cards, one per point. Keep each answer as short as its point allows: a complex point may need a longer answer, but one answer never holds several points.",
  "Exception, the overview card: when the knowledge is itself a complete, closed set (the 16 German federal states, the parts of a cell, the seven OSI layers, the rhetorical devices of a curriculum), write ONE card that asks for the whole set. Its reference answer lists only the members' names, each as its own list item on its own line, so each name counts as one point; its Bloom level is 1 (Remember) or 2 (Understand). Never put a member's explanation, reason, example or effect on the overview card.",
  'Overview and single cards complement each other: a member that carries knowledge of its own also gets its own card. "List the rhetorical devices" is one card; what each device is and what effect it has are further cards, one point each.',
  'An overview asks for the names of a set\'s members, not for what is to be said about each: "Which index types does PostgreSQL have?" is an overview card; "How do B-Tree, GIN and BRIN differ?" is three cards.',
  CARD_TEXT_RULE,
];

/** The rules as a prompt's bullet lines, one rule per line. */
export function cardShapeRuleLines(): string {
  return CARD_SHAPE_RULES.map((rule) => `- ${rule}`).join("\n");
}
