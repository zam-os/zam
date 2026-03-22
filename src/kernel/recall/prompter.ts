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
}

const BLOOM_VERBS: Record<BloomLevel, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Synthesize",
};

const BLOOM_PROMPTS: Record<BloomLevel, (concept: string) => string> = {
  1: (c) => `What is: ${c}?`,
  2: (c) => `Explain how this works: ${c}`,
  3: (c) => `Apply this concept: ${c}`,
  4: (c) => `Analyze the trade-offs: ${c}`,
  5: (c) => `Design a solution using: ${c}`,
};

export interface PromptInput {
  cardId: string;
  tokenId: string;
  slug: string;
  concept: string;
  domain: string;
  bloomLevel: BloomLevel;
}

/**
 * Generate a recall prompt for a token at its Bloom level.
 * When called from the CLI, the prompt is rendered in the terminal.
 * When called from the AI bridge, the JSON is returned for the AI to present conversationally.
 */
export function generatePrompt(input: PromptInput): RecallPrompt {
  const bloom = (input.bloomLevel >= 1 && input.bloomLevel <= 5
    ? input.bloomLevel
    : 1) as BloomLevel;

  return {
    cardId: input.cardId,
    tokenId: input.tokenId,
    slug: input.slug,
    question: BLOOM_PROMPTS[bloom](input.concept),
    concept: input.concept,
    domain: input.domain,
    bloomLevel: bloom,
    bloomVerb: BLOOM_VERBS[bloom],
    hints: [],
  };
}
