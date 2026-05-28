import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export interface ResolvedReference {
  sourceType: "local" | "remote_web" | "dynamic_search";
  content: string;
  filePath?: string;
  url?: string;
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
  content = content.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n# $1\n");
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
export async function resolveReference(sourceLink: string): Promise<ResolvedReference> {
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
    // 2.a GitHub URIs
    const gitHubMatch = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i.exec(cleaned);
    if (gitHubMatch) {
      const [_, owner, repo, branch, fullPathWithAnchor] = gitHubMatch;
      const anchorIndex = fullPathWithAnchor.indexOf("#");
      const filePath = anchorIndex !== -1 ? fullPathWithAnchor.slice(0, anchorIndex) : fullPathWithAnchor;
      const anchor = anchorIndex !== -1 ? fullPathWithAnchor.slice(anchorIndex) : "";

      // Try local resolution: check if repo folder exists in sibling directories
      const parentDir = dirname(process.cwd());
      const localRepoPath = join(parentDir, repo);
      const localFilePath = join(localRepoPath, filePath);

      if (existsSync(localFilePath)) {
        try {
          let fileContent = readFileSync(localFilePath, "utf-8");
          if (anchor) {
            fileContent = extractLines(fileContent, anchor);
          }
          return {
            sourceType: "local",
            content: fileContent,
            filePath: localFilePath,
          };
        } catch (e) {
          // Fallback to fetch if file read fails
        }
      }

      // Remote fallback: fetch raw content from githubusercontent
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      try {
        const response = await fetch(rawUrl);
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
      } catch (e) {
        // Fallback to generic URL loading
      }
    }

    // 2.b Generic HTTPS/HTTP URLs
    try {
      const response = await fetch(cleaned);
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

  // 3. Local Workspace Path (relative to process.cwd)
  const anchorIndex = cleaned.indexOf("#");
  const relativePath = anchorIndex !== -1 ? cleaned.slice(0, anchorIndex) : cleaned;
  const anchor = anchorIndex !== -1 ? cleaned.slice(anchorIndex) : "";
  const absolutePath = resolve(process.cwd(), relativePath);

  if (existsSync(absolutePath)) {
    try {
      let fileContent = readFileSync(absolutePath, "utf-8");
      if (anchor) {
        fileContent = extractLines(fileContent, anchor);
      }
      return {
        sourceType: "local",
        content: fileContent,
        filePath: absolutePath,
      };
    } catch (e) {
      // Fallback
    }
  }

  // Final fallback: return the path/link description as string
  return {
    sourceType: "local",
    content: `Local reference file not found or unreadable.\nReference: ${cleaned}`,
    filePath: absolutePath,
  };
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
export function matchesFilePath(sourceLink: string | null, changedFile: string): boolean {
  if (!sourceLink) return false;
  
  const normSource = normalizePath(sourceLink);
  const normChanged = normalizePath(changedFile);

  if (!normSource || !normChanged) return false;

  // 1. GitHub URI matching
  const gitHubMatch = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/i.exec(normSource);
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
