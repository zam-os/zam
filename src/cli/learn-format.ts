/**
 * Pure formatting helpers for the spoiler-free learning session (`zam learn`).
 *
 * Kept free of terminal/prompt code so the presentation logic is unit-testable.
 * The up-front question is the kernel's Bloom-templated prompt (built in
 * learn.ts via generatePrompt); these helpers render the header line and the
 * answer that is revealed only AFTER the learner has committed an answer.
 */

import type { ReviewContext } from "../kernel/index.js";

export const BLOOM_VERBS: Record<number, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Synthesize",
};

function clampBloom(n: number): number {
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.trunc(n) : 1;
}

/**
 * Build the card header, e.g. "Understand (Bloom 2) · web · #http-caching".
 * The slug is tagged so the learner can reference it for edit/delete actions.
 */
export function formatHeader(input: {
  bloomLevel: number;
  domain: string;
  slug: string;
}): string {
  const lvl = clampBloom(input.bloomLevel);
  const parts = [`${BLOOM_VERBS[lvl]} (Bloom ${lvl})`];
  if (input.domain?.trim()) {
    parts.push(input.domain.trim());
  }
  parts.push(`#${input.slug}`);
  return parts.join(" · ");
}

export interface RevealInput {
  concept: string;
  context?: string | null;
  resolved?: ReviewContext | null;
}

/**
 * Format the stored answer revealed AFTER the learner has committed: the
 * concept, optional context, and resolved source_link content.
 */
export function formatReveal(input: RevealInput): string {
  const lines: string[] = [`Concept: ${input.concept}`];

  if (input.context?.trim()) {
    lines.push("", `Context: ${input.context.trim()}`);
  }

  const resolved = input.resolved;
  if (resolved && resolved.content.trim()) {
    lines.push("");
    if (resolved.sourceType === "dynamic_search") {
      // content is a QUERY_DIRECTIVE — there is nothing to quote inline
      lines.push(`Source: ${resolved.content}`);
    } else {
      const label = resolved.url ?? resolved.filePath ?? resolved.sourceLink;
      lines.push(`Source (${resolved.sourceType}: ${label}):`);
      for (const line of resolved.content.trimEnd().split("\n")) {
        lines.push(`  │ ${line}`);
      }
      if (resolved.truncated) {
        lines.push("  │ … (truncated)");
      }
    }
  }

  return lines.join("\n");
}
