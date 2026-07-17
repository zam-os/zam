import dns from "node:dns";
import fs from "node:fs";
import type { Database } from "../../kernel/index.js";
import { extractTextFromScanViaLLM } from "../llm/client.js";

const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 5;

function isPrivateOrReservedIp(address: string): boolean {
  const ip = address.toLowerCase().split("%", 1)[0];
  const mappedV4 = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  const ipv4 = mappedV4 ?? (ip.includes(".") ? ip : null);
  if (ipv4) {
    const parts = ipv4.split(".").map(Number);
    if (
      parts.length !== 4 ||
      parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
      return true;
    }
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 0 && parts[2] === 2) ||
      (a === 198 && (b === 18 || b === 19 || b === 51)) ||
      (a === 203 && b === 0 && parts[2] === 113) ||
      a >= 224
    );
  }

  return (
    ip === "::" ||
    ip === "::1" ||
    ip.startsWith("fc") ||
    ip.startsWith("fd") ||
    /^fe[89ab]/.test(ip) ||
    ip.startsWith("ff") ||
    ip.startsWith("2001:db8:")
  );
}

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
 * Returns true if a URL is safe to fetch (http/https and not loopback or private range IPs).
 */
export async function isSafeUrl(urlString: string): Promise<boolean> {
  try {
    const url = new URL(urlString);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    if (url.username || url.password) return false;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (hostname === "localhost" || hostname.endsWith(".localhost"))
      return false;

    const results = await dns.promises.lookup(hostname, {
      all: true,
      verbatim: true,
    });
    return (
      results.length > 0 &&
      results.every((result) => !isPrivateOrReservedIp(result.address))
    );
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
 * Fetches and sanitizes web link content.
 */
export async function readWebLink(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    let currentUrl = new URL(url);
    for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
      if (!(await isSafeUrl(currentUrl.href))) {
        throw new Error(
          `Access denied to unsafe target URL: ${currentUrl.href}`,
        );
      }

      const res = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "ZAM-Content-Studio/0.13.0",
        },
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) {
          throw new Error("Web server returned a redirect without a location");
        }
        if (redirects === MAX_REDIRECTS) {
          throw new Error(`Web request exceeded ${MAX_REDIRECTS} redirects`);
        }
        currentUrl = new URL(location, currentUrl);
        continue;
      }
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
      const declaredLength = Number(res.headers.get("content-length"));
      if (
        Number.isFinite(declaredLength) &&
        declaredLength > MAX_SOURCE_BYTES
      ) {
        throw new Error("Response body exceeds 2MB limit");
      }

      const text = await readResponseBodyWithLimit(res, MAX_SOURCE_BYTES);
      if (
        contentType.includes("text/html") ||
        contentType.includes("application/xhtml+xml")
      ) {
        return cleanHtml(text);
      }
      return text;
    }
    throw new Error("Web request failed");
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Connection request timed out after 10 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readResponseBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("Response body exceeds 2MB limit");
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
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
