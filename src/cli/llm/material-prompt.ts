/**
 * What every producer of material-import proposals is told (ADR 2026-10-05):
 * the agent on the harness path through the MCP tools, and — from Phase 6 —
 * the model on the built-in path through its instructions.
 *
 * HTTP-free and free of Node built-ins: Mobile imports this module into its
 * WebView bundle, as it already does `choice-prompt.ts`.
 */

import {
  MATERIAL_KINDS,
  MATERIAL_ORIGINS,
  MATERIAL_PROPOSAL_SET_VERSION,
} from "../../kernel/import/material-contract.js";

/** The rules, one per line, in the order an agent applies them. */
export const MATERIAL_CARD_RULES: readonly string[] = [
  "Read the material itself — the image or PDF, never a transcript of it. Layout carries meaning: columns, arrows, highlighted headings.",
  "Before you propose, ask the learner about what you cannot read or place: an illegible word, the lesson or subject, what an arrow or a heading refers to.",
  "Analyse first: the kind of material, its subject (use the subject codes from zam_material_import_context), topic, school level and depth, and what it leads to.",
  "One card per retrieval target: a question with one clear answer. Prefer several focused cards over one broad card.",
  "Set each card's origin honestly — page: stated on the page; completed: explains, justifies or corrects a statement on the page; extra: related knowledge the page does not state.",
  "Set hardToRead on a card when you are not sure you read the handwriting right.",
  "Over-delivery is fine: the learner deselects. You never decide for the learner — you propose, and the learner chooses Yes, No or Bonus in ZAM's review list.",
  "One subject per import. If a page still mixes subjects, give each card its own area; the review groups the cards by area.",
  "Reuse an existing area path where it fits. A new path starts with the subject (chemie/stoffe), never with a life area such as schule/.",
  "Write the cards in the material's language.",
];

/** The shape `zam_material_import` takes, shown to agents as an example. */
export const MATERIAL_CONTRACT_EXAMPLE = {
  analysis: {
    kind: "own-notes",
    title: "Stofferkennung mit den Sinnen",
    subjects: ["chemie"],
    topic: "Stoffe und Stoffeigenschaften",
    level: "Realschule, Anfangsunterricht Chemie",
    bloom: [1, 2],
    leadsTo:
      "Messbare Stoffeigenschaften: Dichte, Schmelz- und Siedetemperatur",
  },
  proposals: [
    {
      question: "Welche Eigenschaften eines Stoffes erkennt man am Aussehen?",
      answer: "Farbe, Aggregatzustand bei Raumtemperatur, metallischer Glanz.",
      title: "Stofferkennung am Aussehen",
      bloom: 1,
      file: 0,
      page: 1,
      area: "chemie/stoffe-und-eigenschaften",
      origin: "page",
      hardToRead: false,
    },
  ],
  files: [
    { name: "IMG_1234.jpg", path: "/Users/learner/Desktop/IMG_1234.jpg" },
  ],
} as const;

/** The contract in words, for a tool result or a prompt. */
export function materialContractText(): string {
  return [
    `analysis.kind is one of ${MATERIAL_KINDS.join(", ")}.`,
    `proposals[].origin is one of ${MATERIAL_ORIGINS.join(", ")}; bloom is 1–5; file indexes files[]; page is the page or photo number.`,
    "files[] names each file you read: name, and path when you read it from disk (ZAM fingerprints the file and links the cards to it).",
    `ZAM wraps this as version ${MATERIAL_PROPOSAL_SET_VERSION} of its proposal set and validates every field.`,
  ].join(" ");
}
