/**
 * CLI review context resolution.
 *
 * Wraps the kernel's reference resolver and supplies the outbound fetcher
 * (ADR 2026-10-08b D2) as the transport for remote references: no private or
 * link-local target, every redirect checked.
 */

import {
  canonicalRoots,
  getTrustedFolders,
  resolveReviewContext as kernelResolveReviewContext,
  type ReferenceFetcher,
  type ReviewContext,
} from "../kernel/index.js";
import { CONTENT_USER_AGENT } from "./adapters/source-reader.js";
import { safeFetch } from "./net/safe-fetch.js";

export type { ReviewContext };

export interface ResolveReviewContextOptions {
  maxChars?: number;
  /**
   * More allowed roots for local links, such as the MCP client's workspace
   * folders. The learner's trusted folders always apply (ADR 2026-10-08b D1).
   */
  roots?: readonly string[];
}

const fetchReference: ReferenceFetcher = (url) =>
  safeFetch(url, { headers: { "User-Agent": CONTENT_USER_AGENT } });

/**
 * Resolve a token's source_link into bounded, review-ready context through
 * the outbound fetcher.
 */
export async function resolveReviewContext(
  sourceLink: string | null | undefined,
  opts?: ResolveReviewContextOptions,
): Promise<ReviewContext | null> {
  return kernelResolveReviewContext(sourceLink, {
    fetch: fetchReference,
    maxChars: opts?.maxChars,
    roots: canonicalRoots([...(opts?.roots ?? []), ...getTrustedFolders()]),
  });
}
