/**
 * Offline-friendly PDF text extraction for curriculum sources.
 *
 * Uses the system `pdftotext` (poppler-utils) when available. Curriculum
 * providers whose official sources are PDF (e.g. Bremen Bildungspläne) call
 * this from the CLI layer so the kernel stays free of I/O.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function isPdfUrl(url: string, contentType?: string | null): boolean {
  if (contentType?.toLowerCase().includes("application/pdf")) return true;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".pdf") || path.includes(".pdf");
  } catch {
    return url.toLowerCase().includes(".pdf");
  }
}

/**
 * Extract plain text from a PDF buffer via `pdftotext -layout`.
 * Throws a clear error when poppler is not installed.
 */
export function extractPdfText(pdfBytes: Uint8Array): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-pdf-"));
  const pdfPath = join(dir, "source.pdf");
  try {
    writeFileSync(pdfPath, pdfBytes);
    const result = spawnSync(
      "pdftotext",
      ["-layout", "-enc", "UTF-8", pdfPath, "-"],
      {
        encoding: "utf-8",
        maxBuffer: 20 * 1024 * 1024,
      },
    );
    if (result.error) {
      throw new Error(
        `PDF extraction failed: could not run pdftotext (${result.error.message}). ` +
          `Install poppler-utils (e.g. brew install poppler) to import PDF curricula.`,
      );
    }
    if (result.status !== 0) {
      const detail = (result.stderr || result.stdout || "").trim();
      throw new Error(
        `PDF extraction failed (pdftotext exit ${result.status}): ${detail || "unknown error"}`,
      );
    }
    const text = (result.stdout || "").trim();
    if (!text) {
      throw new Error("PDF extraction produced empty text");
    }
    return text;
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }
}

/**
 * Wrap plain text so heading-based extractors can match section labels.
 * Lines that look like section titles (short, no trailing period) become h2.
 */
export function plainTextToExtractableHtml(text: string): string {
  const lines = text.split(/\r?\n/);
  const parts: string[] = ["<!DOCTYPE html><html><body>"];
  let inPara = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (inPara) {
        parts.push("</p>");
        inPara = false;
      }
      continue;
    }
    // Treat short title-like lines as headings for strict extractors.
    const looksLikeHeading =
      line.length >= 4 &&
      line.length <= 90 &&
      !line.endsWith(".") &&
      !/^\d+\s*$/.test(line) &&
      !/^seite\b/i.test(line);
    if (looksLikeHeading && /^[A-ZÄÖÜ0-9]/.test(line)) {
      if (inPara) {
        parts.push("</p>");
        inPara = false;
      }
      parts.push(`<h2>${escapeHtml(line)}</h2>`);
    } else {
      if (!inPara) {
        parts.push("<p>");
        inPara = true;
      } else {
        parts.push(" ");
      }
      parts.push(escapeHtml(line));
    }
  }
  if (inPara) parts.push("</p>");
  parts.push("</body></html>");
  return parts.join("");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
