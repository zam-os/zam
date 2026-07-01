import fs from "node:fs";
import dns from "node:dns";
import { promisify } from "node:util";
import type { Database } from "../../kernel/index.js";
import { extractTextFromScanViaLLM } from "../llm/client.js";

const dnsLookup = promisify(dns.lookup);

/**
 * Clean up HTML contents by removing script, style, and svg tags,
 * then stripping outer tags and normalizing whitespace.
 */
export function cleanHtml(html: string): string {
  let text = html.replace(/<(head|script|style|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ");
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
    const hostname = url.hostname;
    const result = await dnsLookup(hostname);
    const ip = result.address;

    if (ip === "localhost" || ip === "::1" || ip === "0.0.0.0") return false;

    if (ip.includes(".")) {
      const parts = ip.split(".").map(Number);
      if (parts[0] === 127) return false;
      if (parts[0] === 10) return false;
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return false;
      if (parts[0] === 192 && parts[1] === 168) return false;
      if (parts[0] === 169 && parts[1] === 254) return false;
    }

    if (ip.includes(":")) {
      const cleanIp = ip.toLowerCase();
      if (cleanIp === "::1" || cleanIp === "::") return false;
      if (cleanIp.startsWith("fc") || cleanIp.startsWith("fd")) return false;
      if (cleanIp.startsWith("fe8") || cleanIp.startsWith("fe9") || cleanIp.startsWith("fea") || cleanIp.startsWith("feb")) return false;
    }

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
  if (stat.size > 2 * 1024 * 1024) {
    throw new Error("File exceeds 2MB limit");
  }
  return fs.readFileSync(filepath, "utf-8");
}

/**
 * Fetches and sanitizes web link content.
 */
export async function readWebLink(url: string): Promise<string> {
  if (!(await isSafeUrl(url))) {
    throw new Error(`Access denied to unsafe target URL: ${url}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ZAM-Content-Studio/0.5.3",
      },
    });

    clearTimeout(timeoutId);

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
    if (text.length > 2 * 1024 * 1024) {
      throw new Error("Response body exceeds 2MB limit");
    }

    if (contentType.includes("text/html") || contentType.includes("application/xhtml+xml")) {
      return cleanHtml(text);
    }
    return text;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error("Connection request timed out after 10 seconds");
    }
    throw err;
  }
}

/**
 * Extracts text from scan file using vision OCR.
 */
export async function readImageOCR(db: Database, imagePath: string): Promise<string> {
  return extractTextFromScanViaLLM(db, imagePath);
}
