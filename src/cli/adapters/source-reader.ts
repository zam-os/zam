import fs from "node:fs";
import type { Database } from "../../kernel/index.js";
import { extractTextFromScanViaLLM } from "../llm/client.js";
import { resolveAllowedTarget, safeFetch } from "../net/safe-fetch.js";

const MAX_SOURCE_BYTES = 2 * 1024 * 1024;

/** The User-Agent of every content fetch; bumped with each release. */
export const CONTENT_USER_AGENT = "ZAM-Content-Studio/0.50.0";

/**
 * Clean up HTML contents by removing script, style, and svg tags,
 * then stripping outer tags and normalizing whitespace.
 */
export function cleanHtml(html: string): string {
  let text = html.replace(
    /<(head|script|style|svg)[^>]*>[\s\S]*?<\/\1>/gi,
    " ",
  );
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Whether a URL passes the outbound fetcher's check (ADR 2026-10-08b D2):
 * http or https, no credentials, and every resolved address public.
 */
export async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    await resolveAllowedTarget(urlString, "public");
    return true;
  } catch {
    return false;
  }
}

/**
 * Reads local textbook/class-note file.
 */
export async function readLocalFile(filepath: string): Promise<string> {
  if (!fs.existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  const stat = fs.statSync(filepath);
  if (!stat.isFile()) {
    throw new Error(`Not a file: ${filepath}`);
  }
  if (stat.size > MAX_SOURCE_BYTES) {
    throw new Error("File exceeds 2MB limit");
  }
  return fs.readFileSync(filepath, "utf-8");
}

/**
 * Fetches and sanitizes web link content through the outbound fetcher: every
 * redirect is checked, and the body is capped at 2 MB.
 */
export async function readWebLink(url: string): Promise<string> {
  const res = await safeFetch(url, {
    headers: { "User-Agent": CONTENT_USER_AGENT },
    maxBytes: MAX_SOURCE_BYTES,
    timeoutMs: 10_000,
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    if (/exceeds/.test(message))
      throw new Error("Response body exceeds 2MB limit");
    if (/timed out/.test(message)) {
      throw new Error("Connection request timed out after 10 seconds");
    }
    throw err;
  });
  if (!res.ok) {
    throw new Error(`Web server responded with status ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (
    !contentType.includes("text/html") &&
    !contentType.includes("text/plain") &&
    !contentType.includes("application/xhtml+xml") &&
    !contentType.includes("text/xml")
  ) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }
  const text = await res.text();
  if (
    contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml")
  ) {
    return cleanHtml(text);
  }
  return text;
}

/**
 * Extracts text from scan file using vision OCR.
 */
export async function readImageOCR(
  db: Database,
  imagePath: string,
): Promise<string> {
  return extractTextFromScanViaLLM(db, imagePath);
}
