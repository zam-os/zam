/**
 * CLI review context resolution.
 *
 * Wraps the kernel's reference resolver and supplies `globalThis.fetch` as the
 * transport for remote references.
 */

import {
  resolveReviewContext as kernelResolveReviewContext,
  type ReviewContext,
} from "../kernel/index.js";

export type { ReviewContext };

export interface ResolveReviewContextOptions {
  maxChars?: number;
}

/**
 * Resolve a token's source_link into bounded, review-ready context using
 * globalThis.fetch as the transport.
 */
export async function resolveReviewContext(
  sourceLink: string | null | undefined,
  opts?: ResolveReviewContextOptions,
): Promise<ReviewContext | null> {
  return kernelResolveReviewContext(sourceLink, {
    fetch: globalThis.fetch,
    maxChars: opts?.maxChars,
  });
}
