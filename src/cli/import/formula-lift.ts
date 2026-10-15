/**
 * Formulas in imported Anki notes (ADR 2026-10-14b, plan Phase 7).
 *
 * Anki writes math as `\(…\)`, `\[…\]`, `[$]…[/$]`, `[$$]…[/$$]` or
 * `[latex]…[/latex]`. Those spans are held out of the note's HTML *before*
 * it is made inert, so the sanitizer never sees TeX as text, and come back
 * as math segments afterwards. The card text then goes through the same
 * reader as every learner import (`readCardTextInput`, mode `import`):
 *
 * - a formula the tokenizer refuses stays readable text, and the import
 *   counts it (`formula-kept-as-text`);
 * - `$…$` left in the text is lifted the lenient way; `$5` stays a price;
 * - no speech: an import without a model leaves it empty, and voice mode
 *   reads the plain text (Decision 4).
 */

import {
  type CardSegment,
  type CardText,
  readCardTextInput,
  type TextImportNotice,
} from "../../kernel/index.js";

/** Marks a held formula in the HTML: `<index>`. */
const OPEN = "";
const CLOSE = "";

const DELIMITERS: Array<{ pattern: RegExp; block: boolean }> = [
  { pattern: /\[latex\]([\s\S]*?)\[\/latex\]/gi, block: true },
  { pattern: /\[\$\$\]([\s\S]*?)\[\/\$\$\]/g, block: true },
  { pattern: /\[\$\]([\s\S]*?)\[\/\$\]/g, block: false },
  { pattern: /\\\[([\s\S]*?)\\\]/g, block: true },
  { pattern: /\\\(([\s\S]*?)\\\)/g, block: false },
];

export interface HeldFormula {
  tex: string;
  block: boolean;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

/** A formula's source inside Anki's HTML: tags out, entities decoded. */
function texSource(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
      if (entity[0] === "#") {
        const code =
          entity[1] === "x" || entity[1] === "X"
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10);
        return Number.isSafeInteger(code) && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : match;
      }
      return ENTITIES[entity.toLowerCase()] ?? match;
    })
    .trim();
}

/**
 * `[latex]` holds a LaTeX *document* fragment: math there is usually
 * wrapped in dollars once more. Unwrap one pair; anything else is left for
 * the tokenizer to accept or refuse.
 */
function unwrapDollars(tex: string): string {
  const display = /^\$\$([\s\S]*)\$\$$/.exec(tex);
  if (display) return display[1].trim();
  const inline = /^\$([^$]*)\$$/.exec(tex);
  return inline ? inline[1].trim() : tex;
}

/** The HTML with every formula replaced by a marker, and the formulas. */
export function holdFormulas(html: string): {
  html: string;
  formulas: HeldFormula[];
} {
  const formulas: HeldFormula[] = [];
  let out = html.replaceAll(OPEN, "").replaceAll(CLOSE, "");
  for (const { pattern, block } of DELIMITERS) {
    out = out.replace(pattern, (_match, inner: string) => {
      const source = texSource(inner);
      formulas.push({
        tex: pattern.source.startsWith("\\[latex")
          ? unwrapDollars(source)
          : source,
        block,
      });
      return `${OPEN}${formulas.length - 1}${CLOSE}`;
    });
  }
  return { html: out, formulas };
}

export interface LiftedText {
  /** Plain text: the projection when there are segments. */
  text: string;
  /** Segments when a formula survived; `null` otherwise. */
  segments: CardText | null;
  /** Formulas the tokenizer refused, now readable text. */
  keptAsText: number;
}

/**
 * The sanitized text with its markers turned back into formulas. `fallback`
 * is the text an import without the lift would have stored; it is used when
 * the reader refuses the whole side, so a card is never lost to a formula.
 */
export function restoreFormulas(
  sanitized: string,
  formulas: HeldFormula[],
  fallback: string,
): LiftedText {
  const marker = new RegExp(`${OPEN}(\\d+)${CLOSE}`, "g");
  const raw: CardSegment[] = [];
  let cursor = 0;
  for (const match of sanitized.matchAll(marker)) {
    const before = sanitized.slice(cursor, match.index);
    if (before) raw.push({ type: "text", text: before });
    const formula = formulas[Number(match[1])];
    if (formula?.tex) {
      raw.push(
        formula.block
          ? { type: "math", tex: formula.tex, block: true }
          : { type: "math", tex: formula.tex },
      );
    }
    cursor = (match.index ?? 0) + match[0].length;
  }
  const rest = sanitized.slice(cursor);
  if (rest) raw.push({ type: "text", text: rest });
  if (raw.length === 0) return { text: "", segments: null, keptAsText: 0 };

  const read = readCardTextInput(raw, "import");
  if (!read.ok) return { text: fallback, segments: null, keptAsText: 0 };
  return {
    text: read.value.plain,
    segments: read.value.segments,
    keptAsText: read.value.notes.filter((note) => note.kind === "formula")
      .length,
  };
}

/** The notice an import shows for formulas it kept as text. */
export function keptAsTextNotice(count: number): TextImportNotice {
  return {
    code: "formula-kept-as-text",
    message:
      count === 1
        ? "A formula ZAM cannot show was kept as readable text."
        : `${count} formulas ZAM cannot show were kept as readable text.`,
  };
}
