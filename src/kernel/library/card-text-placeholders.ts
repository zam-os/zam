/**
 * Card text a model may reword without touching its formulas (ADR
 * 2026-10-14b, Decision 6).
 *
 * Variation and translation never see `tex` or an image hash. The model gets
 * the text with numbered placeholders — `[[1]]`, `[[2]]`, … where the
 * formulas and images stand — and each one's reading. It returns the text
 * with the same placeholders (translation also the readings), and the kernel
 * splices the stored segments back in.
 *
 * Echoing `tex` instead would lose the variation whenever the model tidied a
 * space; a placeholder cannot be tidied. A reply that drops, repeats or
 * invents a placeholder, or writes markup into the text, splices to `null`,
 * and the caller serves the stored text.
 */

import {
  type CardSegment,
  type CardText,
  normalizeCardText,
  validateCardText,
} from "./card-text.js";
import { dropEmphasis } from "./card-text-input.js";
import { texToPlain } from "./tex-plain.js";

export interface PlaceholderText {
  /** The text with `[[1]]`, `[[2]]`, … where formulas and images stand. */
  text: string;
  /**
   * What each placeholder stands for, in placeholder order: a formula's
   * speech (or its plain form when it has none), an image's alt text.
   */
  readings: string[];
}

const PLACEHOLDER = /\[\[(\d+)\]\]/g;

/** The text a model may reword, with the formulas held back. */
export function toPlaceholderText(segments: CardText): PlaceholderText {
  let text = "";
  const readings: string[] = [];
  for (const segment of segments) {
    if (segment.type === "text") {
      // A literal `[[3]]` in the text would read as a placeholder.
      text += segment.text.replace(PLACEHOLDER, "[ [$1] ]");
      continue;
    }
    readings.push(
      segment.type === "math"
        ? segment.speech || texToPlain(segment.tex)
        : segment.alt,
    );
    text += `[[${readings.length}]]`;
  }
  return { text, readings };
}

/**
 * The stored segments spliced into a model's reworded text, or `null` when
 * the reply does not hold each placeholder exactly once, or its text is not
 * clean card text. Placeholders may move: a translation reorders words.
 *
 * `readings` replaces formula speech in placeholder order (translation); an
 * empty or invalid reading keeps the stored speech.
 */
export function fromPlaceholderText(
  text: string,
  segments: CardText,
  opts: { readings?: readonly (string | null | undefined)[] } = {},
): CardText | null {
  const held = segments.filter((segment) => segment.type !== "text");
  const seen = new Set<number>();
  const out: CardSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(PLACEHOLDER)) {
    const n = Number(match[1]);
    if (n < 1 || n > held.length || seen.has(n)) return null;
    seen.add(n);
    const before = text.slice(cursor, match.index);
    if (before) out.push({ type: "text", text: before });
    out.push(withReading(held[n - 1], opts.readings?.[n - 1]));
    cursor = (match.index ?? 0) + match[0].length;
  }
  if (seen.size !== held.length) return null;
  const rest = text.slice(cursor);
  if (rest) out.push({ type: "text", text: rest });

  const spliced = normalizeCardText(dropEmphasis(out)).map(
    (segment, index, all) => {
      if (segment.type !== "text") return segment;
      let value = segment.text;
      if (index === 0) value = value.trimStart();
      if (index === all.length - 1) value = value.trimEnd();
      return { type: "text" as const, text: value };
    },
  );
  const result = normalizeCardText(spliced);
  if (result.length === 0) return null;
  return validateCardText(result).length === 0 ? result : null;
}

function withReading(
  segment: CardSegment,
  reading: string | null | undefined,
): CardSegment {
  const spoken = reading?.trim();
  if (!spoken || segment.type !== "math") return segment;
  const candidate = { ...segment, speech: spoken };
  return validateCardText([candidate], { requireSpeech: true }).length === 0
    ? candidate
    : segment;
}
