/**
 * Lifting `$…$` and `$$…$$` math out of plain text (ADR 2026-10-14b,
 * Decisions 6 and 8).
 *
 * Two callers, two temperaments:
 *
 * - **`strict`** is for curated tiles. Every unescaped dollar belongs to a
 *   formula, so the pass pairs them in order and fails loudly on an odd one:
 *   a curator patches that string by hand rather than have the pass guess.
 * - **`lenient`** is for a learner's import. A dollar there may be a shell
 *   variable or a price, so a span is lifted only when it is shaped like
 *   TeX inline math (the opening dollar touches its content, the closing one
 *   does too and is not followed by a digit) *and* its content looks like
 *   math. Everything else stays text and is reported, never fatal.
 *
 * Both consume `$$…$$` before `$…$`: the corpus mixes the two in one string,
 * and a pass that pairs single dollars first matches across German prose.
 */

import type { CardSegment } from "./card-text.js";

export type DollarLiftMode = "strict" | "lenient";

export interface UnliftedDollarSpan {
  /** Offset of the dollar in the original text. */
  offset: number;
  /** The text that stayed text, for a review list or a log. */
  text: string;
  reason: "unbalanced" | "not-math";
}

export interface DollarLiftResult {
  /** Text and math segments in order; adjacent text is merged. */
  segments: CardSegment[];
  /** Dollar spans that stayed text (lenient mode only). */
  unlifted: UnliftedDollarSpan[];
}

export class DollarLiftError extends Error {
  constructor(
    message: string,
    readonly offset: number,
  ) {
    super(message);
    this.name = "DollarLiftError";
  }
}

/**
 * Whether a dollar span's content reads as a formula rather than a word.
 *
 * Deliberately conservative: a control word, a script, an equals sign, an
 * operator between operands, or a lone variable (`x`, `pK`, `v1`). `HOME`
 * and `5 and 6` are not math.
 */
export function looksLikeMath(content: string): boolean {
  const body = content.trim();
  if (!body) return false;
  if (/\\[A-Za-z]/.test(body)) return true;
  if (/[\^_=]/.test(body)) return true;
  if (/[\p{L}\p{N})]\s*[-+*/·×<>]\s*[\p{L}\p{N}(]/u.test(body)) return true;
  return /^[A-Za-z]{1,2}[0-9']*$/.test(body);
}

/** Positions of every dollar not escaped as `\$`. */
function dollarPositions(text: string, from: number, to: number): number[] {
  const positions: number[] = [];
  for (let i = from; i < to; i++) {
    if (text[i] !== "$") continue;
    let backslashes = 0;
    for (let j = i - 1; j >= from && text[j] === "\\"; j--) backslashes++;
    if (backslashes % 2 === 0) positions.push(i);
  }
  return positions;
}

interface Piece {
  kind: "text" | "math";
  start: number;
  end: number;
  block?: boolean;
}

/** Split off `$$…$$` spans; returns text pieces between them. */
function splitDisplay(
  text: string,
  mode: DollarLiftMode,
  unlifted: UnliftedDollarSpan[],
): Piece[] {
  const pieces: Piece[] = [];
  let cursor = 0;
  const all = dollarPositions(text, 0, text.length);
  const doubles: number[] = [];
  for (let k = 0; k < all.length; k++) {
    if (all[k + 1] === all[k] + 1) {
      doubles.push(all[k]);
      k++;
    }
  }
  for (let k = 0; k < doubles.length; k += 2) {
    const open = doubles[k];
    const close = doubles[k + 1];
    if (close === undefined) {
      if (mode === "strict") {
        throw new DollarLiftError(
          `Unbalanced $$ at offset ${open}: no closing $$`,
          open,
        );
      }
      unlifted.push({
        offset: open,
        text: text.slice(open, open + 40),
        reason: "unbalanced",
      });
      break;
    }
    pieces.push({ kind: "text", start: cursor, end: open });
    pieces.push({ kind: "math", start: open + 2, end: close, block: true });
    cursor = close + 2;
  }
  pieces.push({ kind: "text", start: cursor, end: text.length });
  return pieces;
}

function splitInlineStrict(text: string, piece: Piece): Piece[] {
  const positions = dollarPositions(text, piece.start, piece.end);
  if (positions.length % 2 === 1) {
    const odd = positions[positions.length - 1];
    throw new DollarLiftError(
      `Unbalanced $ at offset ${odd}: the string has an odd number of dollars`,
      odd,
    );
  }
  const pieces: Piece[] = [];
  let cursor = piece.start;
  for (let k = 0; k < positions.length; k += 2) {
    pieces.push({ kind: "text", start: cursor, end: positions[k] });
    pieces.push({
      kind: "math",
      start: positions[k] + 1,
      end: positions[k + 1],
    });
    cursor = positions[k + 1] + 1;
  }
  pieces.push({ kind: "text", start: cursor, end: piece.end });
  return pieces;
}

function splitInlineLenient(
  text: string,
  piece: Piece,
  unlifted: UnliftedDollarSpan[],
): Piece[] {
  const positions = dollarPositions(text, piece.start, piece.end);
  const pieces: Piece[] = [];
  let cursor = piece.start;
  let k = 0;
  while (k < positions.length) {
    const open = positions[k];
    const after = text[open + 1];
    if (after === undefined || /\s/.test(after)) {
      k++;
      continue;
    }
    // Only the next dollar can close: math never contains an unescaped `$`.
    // When it cannot close (`$HOME und $5`), this one stays text and the
    // next dollar gets its own chance to open.
    let closeIndex = -1;
    const candidate = positions[k + 1];
    if (candidate !== undefined) {
      const before = text[candidate - 1];
      const next = text[candidate + 1];
      if (!/\s/.test(before) && !(next !== undefined && /[0-9]/.test(next))) {
        closeIndex = k + 1;
      }
    }
    if (closeIndex === -1) {
      unlifted.push({
        offset: open,
        text: text.slice(open, Math.min(piece.end, open + 40)),
        reason: "unbalanced",
      });
      k++;
      continue;
    }
    const close = positions[closeIndex];
    const content = text.slice(open + 1, close);
    if (!looksLikeMath(content)) {
      unlifted.push({
        offset: open,
        text: text.slice(open, close + 1),
        reason: "not-math",
      });
      k = closeIndex + 1;
      continue;
    }
    pieces.push({ kind: "text", start: cursor, end: open });
    pieces.push({ kind: "math", start: open + 1, end: close });
    cursor = close + 1;
    k = closeIndex + 1;
  }
  pieces.push({ kind: "text", start: cursor, end: piece.end });
  return pieces;
}

/**
 * Lift the dollar math out of `text`.
 *
 * Strict mode throws {@link DollarLiftError} on an unbalanced dollar; lenient
 * mode never throws and reports what it left as text. An escaped `\$` is
 * always text. Math segments carry no `speech` — the caller asks a model for
 * it, or leaves it empty where that is allowed (ADR Decision 4).
 */
export function liftDollarMath(
  text: string,
  mode: DollarLiftMode,
): DollarLiftResult {
  const unlifted: UnliftedDollarSpan[] = [];
  const pieces: Piece[] = [];
  for (const piece of splitDisplay(text, mode, unlifted)) {
    if (piece.kind === "math") {
      pieces.push(piece);
    } else if (mode === "strict") {
      pieces.push(...splitInlineStrict(text, piece));
    } else {
      pieces.push(...splitInlineLenient(text, piece, unlifted));
    }
  }

  const segments: CardSegment[] = [];
  for (const piece of pieces) {
    const raw = text.slice(piece.start, piece.end);
    if (piece.kind === "text") {
      if (!raw) continue;
      const last = segments[segments.length - 1];
      if (last?.type === "text") last.text += raw;
      else segments.push({ type: "text", text: raw });
      continue;
    }
    // Trim spaces and newlines only: a tab or carriage return at the edge is
    // damage (a JSON `\t` that ate the `\` of `\text`), and the tokenizer
    // must see it rather than receive a clean-looking `ext{…}`.
    const tex = raw.replace(/^[ \n]+|[ \n]+$/g, "");
    if (!tex) {
      // `$$` with nothing inside is not a formula; keep the dollars as text.
      const literal = piece.block ? "$$$$" : "$$";
      const last = segments[segments.length - 1];
      if (last?.type === "text") last.text += literal;
      else segments.push({ type: "text", text: literal });
      continue;
    }
    segments.push(
      piece.block ? { type: "math", tex, block: true } : { type: "math", tex },
    );
  }
  return { segments, unlifted };
}
