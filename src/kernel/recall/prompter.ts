/**
 * Active Recall Prompt Generation
 *
 * Generates review prompts from tokens, adapting the question style
 * to the token's Bloom taxonomy level. This is NOT an LLM call —
 * it's template-based prompt assembly for the CLI and bridge.
 */

export type BloomLevel = 1 | 2 | 3 | 4 | 5;

export interface RecallPrompt {
  cardId: string;
  tokenId: string;
  slug: string;
  question: string;
  concept: string;
  domain: string;
  bloomLevel: BloomLevel;
  bloomVerb: string;
  hints: string[];
  sourceLink?: string | null;
}

const BLOOM_VERBS: Record<BloomLevel, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Synthesize",
};

function formatSlugForCue(slug: string): string {
  return slug.replace(/[-_]/g, " ");
}

const BLOOM_CUES: Record<BloomLevel, (slug: string) => string> = {
  1: (slug) =>
    `Recall the definition and core concept of: ${formatSlugForCue(slug)}`,
  2: (slug) => `Explain the concept and how ${formatSlugForCue(slug)} works.`,
  3: (slug) =>
    `Describe how or where you would apply the concept of ${formatSlugForCue(slug)}.`,
  4: (slug) =>
    `Analyze the trade-offs, advantages, or alternatives of ${formatSlugForCue(slug)}.`,
  5: (slug) =>
    `How would you design a solution using the concept of ${formatSlugForCue(slug)}?`,
};

export interface PromptInput {
  cardId: string;
  tokenId: string;
  slug: string;
  concept: string;
  domain: string;
  bloomLevel: BloomLevel;
  sourceLink?: string | null;
  question?: string | null;
}

/**
 * Generate a template-based concept-free recall cue using the slug and domain.
 */
export function generateConceptFreeCue(
  bloomLevel: BloomLevel,
  slug: string,
  _domain: string,
): string {
  const bloom = (
    bloomLevel >= 1 && bloomLevel <= 5 ? bloomLevel : 1
  ) as BloomLevel;
  return BLOOM_CUES[bloom](slug);
}

/**
 * Generate a recall prompt for a token at its Bloom level.
 * When called from the CLI, the prompt is rendered in the terminal.
 * When called from the AI bridge, the JSON is returned for the AI to present conversationally.
 */
export function generatePrompt(input: PromptInput): RecallPrompt {
  const bloom = (
    input.bloomLevel >= 1 && input.bloomLevel <= 5 ? input.bloomLevel : 1
  ) as BloomLevel;

  const question = input.question?.trim()
    ? input.question.trim()
    : generateConceptFreeCue(bloom, input.slug, input.domain);

  return {
    cardId: input.cardId,
    tokenId: input.tokenId,
    slug: input.slug,
    question,
    concept: input.concept,
    domain: input.domain,
    bloomLevel: bloom,
    bloomVerb: BLOOM_VERBS[bloom],
    hints: [],
    sourceLink: input.sourceLink ?? null,
  };
}
