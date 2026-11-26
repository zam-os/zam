/**
 * CLI review context resolution.
 *
 * Wraps the kernel's reference resolver and supplies the outbound fetcher
 * (ADR 2026-10-08b D2) as the transport for remote references: no private or
 * link-local target, every redirect checked.
 */

import {
  ACADEMY_ORIGIN,
  canonicalRoots,
  type Database,
  getTrustedFolders,
  hasInstalledProviderOrigin,
  resolveReviewContext as kernelResolveReviewContext,
  providerTileForItem,
  type ReferenceFetcher,
  type ReviewContext,
  reviewSuppressedOrigins,
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
  db?: Database;
  tokenId?: string;
}

const fetchReference: ReferenceFetcher = (url) =>
  safeFetch(url, { headers: { "User-Agent": CONTENT_USER_AGENT } });

const ACADEMY_HOST = new URL(ACADEMY_ORIGIN).hostname;

/**
 * Only a learner's action reads academy.zam-os.org (ADR 2026-10-19 D4), and
 * building a review is not one. The page could not help anyway: a card's link
 * names its lesson in the `#lesson=` fragment, which is never sent, so a fetch
 * returns the app's frame and no lesson. The learner opens the link instead.
 */
function isAcademyLink(sourceLink: string | null | undefined): boolean {
  if (!sourceLink) return false;
  try {
    return new URL(sourceLink).hostname === ACADEMY_HOST;
  } catch {
    return false;
  }
}

/**
 * A private provider's lesson (ADR 2026-11-25 Decision 6): its origin is a
 * confirmed provider's, or one recorded for an installed provider tile. The
 * page sits behind a login and the review carries no token, so a fetch could
 * only reach a sign-in page.
 */
async function isProviderLink(
  sourceLink: string | null | undefined,
  { db, tokenId }: ResolveReviewContextOptions,
): Promise<boolean> {
  if (!sourceLink) return false;
  let url: URL;
  try {
    url = new URL(sourceLink);
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (reviewSuppressedOrigins().has(url.origin)) return true;
  if (!db) return false;
  if (tokenId && (await providerTileForItem(db, tokenId))) return true;
  return hasInstalledProviderOrigin(db, url.origin);
}

/**
 * Resolve a token's source_link into bounded, review-ready context through
 * the outbound fetcher. An Academy or provider link resolves to nothing,
 * with no request.
 */
export async function resolveReviewContext(
  sourceLink: string | null | undefined,
  opts: ResolveReviewContextOptions = {},
): Promise<ReviewContext | null> {
  if (isAcademyLink(sourceLink) || (await isProviderLink(sourceLink, opts)))
    return null;
  return kernelResolveReviewContext(sourceLink, {
    fetch: fetchReference,
    maxChars: opts.maxChars,
    roots: canonicalRoots([...(opts.roots ?? []), ...getTrustedFolders()]),
  });
}
