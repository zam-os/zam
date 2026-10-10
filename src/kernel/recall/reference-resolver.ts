import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type PathRefusalCode,
  PathRefusedError,
  readTrustedTextFile,
} from "../system/trusted-paths.js";

export interface ResolvedReference {
  sourceType: "local" | "remote_web" | "dynamic_search";
  content: string;
  filePath?: string;
  url?: string;
  /**
   * Set when a local link was refused (ADR 2026-10-08b D1); `content` then
   * says why and what fixes it.
   */
  refusal?: PathRefusalCode;
}

/**
 * A source reference resolved and bounded for inclusion in a review payload.
 * Same shape as ResolvedReference plus the originating link and a truncation flag.
 */
export interface ReviewContext {
  sourceLink: string;
  sourceType: ResolvedReference["sourceType"];
  content: string;
  filePath?: string;
  url?: string;
  truncated: boolean;
  refusal?: PathRefusalCode;
}

/** Minimal transport the resolver needs; `globalThis.fetch` satisfies it. */
export type ReferenceFetcher = (url: string) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
}>;

export interface ResolveReferenceOptions {
  fetch?: ReferenceFetcher;
  /**
   * Allowed roots for local files (ADR 2026-10-08b D1): the MCP client's
   * roots and the learner's trusted folders, already canonical. A local link
   * resolves only inside them, never against the working directory; without
   * roots no local file is read.
   */
  roots?: readonly string[];
}

export interface ResolveReviewContextOptions {
  fetch?: ReferenceFetcher;
  maxChars?: number;
  roots?: readonly string[];
}

/** Default cap on resolved content length, so bridge JSON / terminal output stays bounded. */
export const DEFAULT_REVIEW_CONTEXT_MAX_CHARS = 6000;

/** How long resolved review context stays in the in-process cache (5 minutes). */
export const REVIEW_CONTEXT_CACHE_TTL_MS = 5 * 60 * 1000;

type CachedReviewContext = {
  context: ReviewContext;
  expiresAt: number;
};

const reviewContextCache = new Map<string, CachedReviewContext>();

function reviewContextCacheKey(
  sourceLink: string,
  maxChars: number,
  hasFetcher: boolean,
  roots: readonly string[],
): string {
  return `${sourceLink}\0${maxChars}\0${hasFetcher ? "1" : "0"}\0${roots.join("\0")}`;
}

/** Clear the in-process review-context cache (mainly for tests). */
export function clearReviewContextCache(): void {
  reviewContextCache.clear();
}

/**
 * Strips HTML tags and attempts to convert basic structure to readable text/markdown.
 */
function htmlToText(html: string): string {
  // Extract body if present
  let content = html;
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  if (bodyMatch) {
    content = bodyMatch[1];
  }

  // Strip script, style, and head tags completely
  content = content.replace(/<(script|style|head)[^>]*>([\s\S]*?)<\/\1>/gi, "");
  // Replace headings
  content = content.replace(
    /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi,
    "\n\n# $1\n",
  );
  // Replace paragraph/div/li tags with line breaks
  content = content.replace(/<(p|div|li)[^>]*>/gi, "\n");
  content = content.replace(/<\/(p|div|li)>/gi, "\n");
  content = content.replace(/<br\s*\/?>/gi, "\n");
  // Strip all other HTML tags
  content = content.replace(/<[^>]+>/g, "");
  // Decode basic HTML entities
  content = content
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Collapse consecutive newlines
  content = content.replace(/\n{3,}/g, "\n\n").trim();
  return content;
}

/**
 * Parse line anchors like #L10-L25 or #L10 and extract the lines from file content.
 */
function extractLines(content: string, anchor: string): string {
  const lines = content.split(/\r?\n/);
  const match = /#L(\d+)(?:-L(\d+))?$/i.exec(anchor);
  if (!match) return content;

  const start = Number.parseInt(match[1], 10) - 1; // 0-indexed
  const end = match[2] ? Number.parseInt(match[2], 10) - 1 : start;

  if (start < 0 || start >= lines.length) return content;

  const slice = lines.slice(start, Math.min(end + 1, lines.length));
  return slice.join("\n");
}

/**
 * Resolves a given token's source_link into readable textual content.
 */
export async function resolveReference(
  sourceLink: string,
  opts: ResolveReferenceOptions = {},
): Promise<ResolvedReference> {
  const cleaned = sourceLink.trim();

  // 1. Dynamic Web Search
  if (cleaned.startsWith("search://")) {
    try {
      const url = new URL(cleaned);
      const query = url.searchParams.get("q") || "";
      return {
        sourceType: "dynamic_search",
        content: `QUERY_DIRECTIVE: Run web search for "${query}"`,
        url: cleaned,
      };
    } catch {
      // Fallback if URL parsing fails
      const query = cleaned.replace(/^search:\/\/(\??q=)?/, "");
      return {
        sourceType: "dynamic_search",
        content: `QUERY_DIRECTIVE: Run web search for "${decodeURIComponent(query)}"`,
        url: cleaned,
      };
    }
  }

  // 2. HTTP/HTTPS URLs
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    const fetcher = opts.fetch;

    // 2.a GitHub URIs
    const gitHubMatch =
      /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i.exec(
        cleaned,
      );
    if (gitHubMatch) {
      const [_, owner, repo, branch, fullPathWithAnchor] = gitHubMatch;
      const anchorIndex = fullPathWithAnchor.indexOf("#");
      const filePath =
        anchorIndex !== -1
          ? fullPathWithAnchor.slice(0, anchorIndex)
          : fullPathWithAnchor;
      const anchor =
        anchorIndex !== -1 ? fullPathWithAnchor.slice(anchorIndex) : "";

      // A local checkout of the repository is used only inside an allowed
      // root (ADR 2026-10-08b D1): a root that is the checkout, or a checkout
      // directly inside a root. The path is normalised and `..` refused.
      const segments = filePath.split("/").map((segment) => {
        try {
          return decodeURIComponent(segment);
        } catch {
          return segment;
        }
      });
      const roots = opts.roots ?? [];
      if (
        roots.length > 0 &&
        !segments.some((segment) => segment === ".." || segment === ".")
      ) {
        const checkouts = [
          ...roots.filter(
            (root) => basename(root).toLowerCase() === repo.toLowerCase(),
          ),
          ...roots.map((root) => join(root, repo)),
        ];
        for (const checkout of checkouts) {
          try {
            const read = readTrustedTextFile(
              join(checkout, ...segments),
              roots,
            );
            return {
              sourceType: "local",
              content: anchor
                ? extractLines(read.content, anchor)
                : read.content,
              filePath: read.path,
            };
          } catch {
            // Not here, not allowed or not text: try the next, then GitHub.
          }
        }
      }

      // Remote fallback: fetch raw content from githubusercontent
      if (fetcher) {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
        try {
          const response = await fetcher(rawUrl);
          if (response.ok) {
            let rawText = await response.text();
            if (anchor) {
              rawText = extractLines(rawText, anchor);
            }
            return {
              sourceType: "remote_web",
              content: rawText,
              url: cleaned,
            };
          }
        } catch (_e) {
          // Fallback to generic URL loading
        }
      }
    }

    // 2.b Generic HTTPS/HTTP URLs
    if (!fetcher) {
      return {
        sourceType: "remote_web",
        content: `Error fetching URL reference: No HTTP fetcher configured\nLink: ${cleaned}`,
        url: cleaned,
      };
    }

    try {
      const response = await fetcher(cleaned);
      if (response.ok) {
        const text = await response.text();
        const cleanText = htmlToText(text);
        return {
          sourceType: "remote_web",
          content: cleanText,
          url: cleaned,
        };
      }
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    } catch (err) {
      return {
        sourceType: "remote_web",
        content: `Error fetching URL reference: ${(err as Error).message}\nLink: ${cleaned}`,
        url: cleaned,
      };
    }
  }

  // 3. Local path: only inside an allowed root (ADR 2026-10-08b D1).
  const anchorIndex = cleaned.indexOf("#");
  let localPath = anchorIndex !== -1 ? cleaned.slice(0, anchorIndex) : cleaned;
  const anchor = anchorIndex !== -1 ? cleaned.slice(anchorIndex) : "";
  if (localPath.startsWith("file:")) {
    // Material imports link their files as file:// URLs.
    try {
      localPath = fileURLToPath(localPath);
    } catch {
      // Not a usable file URL: refused below like any other path.
    }
  }

  try {
    const read = readTrustedTextFile(localPath, opts.roots ?? []);
    return {
      sourceType: "local",
      content: anchor ? extractLines(read.content, anchor) : read.content,
      filePath: read.path,
    };
  } catch (err) {
    if (err instanceof PathRefusedError) {
      return {
        sourceType: "local",
        content: `${err.message}\nReference: ${cleaned}`,
        refusal: err.code,
      };
    }
    return {
      sourceType: "local",
      content: `Local reference file not found or unreadable.\nReference: ${cleaned}`,
    };
  }
}

/**
 * Resolve a token's source_link into bounded, review-ready context.
 *
 * Wraps {@link resolveReference} for the review/bridge flow: returns `null`
 * for empty links and caps content length so the surrounding payload (bridge
 * JSON or terminal output) stays manageable, flagging when truncation occurred.
 */
export async function resolveReviewContext(
  sourceLink: string | null | undefined,
  opts: ResolveReviewContextOptions = {},
): Promise<ReviewContext | null> {
  const cleaned = sourceLink?.trim();
  if (!cleaned) return null;

  const maxChars = opts.maxChars ?? DEFAULT_REVIEW_CONTEXT_MAX_CHARS;
  const hasFetcher = Boolean(opts.fetch);
  const roots = opts.roots ?? [];
  const cacheKey = reviewContextCacheKey(cleaned, maxChars, hasFetcher, roots);
  const cached = reviewContextCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.context;
  }

  const resolved = await resolveReference(cleaned, {
    fetch: opts.fetch,
    roots,
  });

  let content = resolved.content;
  let truncated = false;
  if (content.length > maxChars) {
    content = content.slice(0, maxChars);
    truncated = true;
  }

  const context: ReviewContext = {
    sourceLink: cleaned,
    sourceType: resolved.sourceType,
    content,
    filePath: resolved.filePath,
    url: resolved.url,
    truncated,
    ...(resolved.refusal ? { refusal: resolved.refusal } : {}),
  };

  reviewContextCache.set(cacheKey, {
    context,
    expiresAt: Date.now() + REVIEW_CONTEXT_CACHE_TTL_MS,
  });

  return context;
}

/**
 * Normalizes a path, stripping anchors and converting separators.
 */
export function normalizePath(p: string): string {
  const base = p.split("#")[0].trim();
  return base.replace(/\\/g, "/").toLowerCase();
}

/**
 * Checks if a token's source_link references a changed file.
 */
export function matchesFilePath(
  sourceLink: string | null,
  changedFile: string,
): boolean {
  if (!sourceLink) return false;

  const normSource = normalizePath(sourceLink);
  const normChanged = normalizePath(changedFile);

  if (!normSource || !normChanged) return false;

  // 1. GitHub URI matching
  const gitHubMatch =
    /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i.exec(
      normSource,
    );
  if (gitHubMatch) {
    const filePath = gitHubMatch[4];
    return filePath === normChanged;
  }

  // Generic URL check (don't match web references against local paths)
  if (normSource.startsWith("http://") || normSource.startsWith("https://")) {
    return false;
  }

  // 2. Relative/Absolute path matching
  return normSource.endsWith(normChanged) || normChanged.endsWith(normSource);
}
