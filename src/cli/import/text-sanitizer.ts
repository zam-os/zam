import type { TextImportNotice } from "../../kernel/index.js";

export interface SanitizedImportText {
  text: string;
  warnings: TextImportNotice[];
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value: string): string {
  return value.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (match, entity: string) => {
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        const codePoint = Number.parseInt(entity.slice(2), 16);
        return Number.isSafeInteger(codePoint) && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      }
      if (entity.startsWith("#")) {
        const codePoint = Number.parseInt(entity.slice(1), 10);
        return Number.isSafeInteger(codePoint) && codePoint <= 0x10ffff
          ? String.fromCodePoint(codePoint)
          : match;
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
    },
  );
}

function imageAlt(tag: string): string {
  const match = tag.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return match ? ` ${match[1] ?? match[2] ?? match[3] ?? ""} ` : " ";
}

/**
 * Convert untrusted card HTML to inert plain text. No returned string is ever
 * inserted as HTML, so remote resources and event handlers cannot execute.
 */
export function sanitizeImportedText(value: string): SanitizedImportText {
  const warnings: TextImportNotice[] = [];
  let text = value.replace(/\r\n?/g, "\n");

  const hasUnsafeHtml =
    /<\s*(script|style|iframe|object|embed|link|meta|base|form)\b/i.test(
      text,
    ) ||
    /\son[a-z]+\s*=/i.test(text) ||
    /\b(?:src|href)\s*=\s*["']?\s*(?:https?:|\/\/|data:|javascript:)/i.test(
      text,
    );
  if (hasUnsafeHtml) {
    warnings.push({
      code: "unsafe-html-removed",
      message:
        "Unsafe HTML, active content, or remote resource references were removed.",
    });
  }

  if (/<\s*img\b/i.test(text) || /\[sound:[^\]]+\]/i.test(text)) {
    warnings.push({
      code: "media-unsupported",
      message: "Media was omitted by the text-only importer.",
    });
  }

  // Remove whole active/style blocks before the generic tag pass so their
  // source code never becomes learner-visible text.
  text = text.replace(
    /<\s*(script|style|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    " ",
  );
  text = text.replace(/<\s*img\b[^>]*>/gi, imageAlt);
  text = text.replace(/\[sound:[^\]]+\]/gi, " ");
  text = text.replace(/<\s*br\s*\/?>/gi, "\n");
  text = text.replace(/<\s*hr\b[^>]*>/gi, "\n");
  text = text.replace(/<\s*li\b[^>]*>/gi, "\n• ");
  text = text.replace(
    /<\s*\/?\s*(?:p|div|section|article|header|footer|h[1-6]|ul|ol|table|tr|blockquote)\b[^>]*>/gi,
    "\n",
  );
  text = text.replace(/<[^>]*>/g, " ");
  text = decodeEntities(text);
  text = text
    .split("\n")
    .map((line) => line.replace(/[\t\f\v ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, warnings };
}
