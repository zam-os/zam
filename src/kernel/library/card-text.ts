/**
 * Card text as typed segments (ADR 2026-10-14b).
 *
 * A card's question, reference answer and fast-check options may hold an
 * ordered list of segments — plain text, a formula, an image — instead of
 * one string. The string stays as the segments' *plain projection*, so every
 * reader that only needs text (CLI, MCP, search, answer points, LLM prompts)
 * keeps working; the *spoken projection* is what voice mode reads aloud.
 *
 * Nothing in a segment is markup: a text segment is plain text, a formula is
 * allowlisted TeX that only ZAM's renderer turns into MathML, an image is a
 * hash into the media store with a required alt text. HTML exists only as
 * the renderer's output (Decision 2).
 *
 * Pure functions only, and no Node built-ins: Mobile bundles this module
 * into its WebView.
 */

import { looksLikeMath } from "./dollar-lift.js";
import { texToPlain } from "./tex-plain.js";
import { isInventoryControlWord, texIssues } from "./tex-tokenizer.js";

export interface TextSegment {
  type: "text";
  text: string;
}

export interface MathSegment {
  type: "math";
  /** Allowlisted TeX math, without delimiters. */
  tex: string;
  /** How the formula is read aloud, in the card's language (Decision 4). */
  speech?: string;
  /** A displayed formula on its own line. */
  block?: boolean;
}

export interface ImageSegment {
  type: "image";
  /** SHA-256 hex of a `media_assets` row (Decision 5). */
  media: string;
  /** Required text alternative, read aloud and shown to screen readers. */
  alt: string;
  caption?: string;
  /** Sized to the line, for a symbol or an icon. */
  inline?: boolean;
}

export type CardSegment = TextSegment | MathSegment | ImageSegment;
export type CardText = CardSegment[];

/** Upper bound on segments per field; real cards use a handful. */
export const MAX_CARD_SEGMENTS = 200;

/**
 * Longest `speech` accepted. Provisional until the bundled migration measures
 * the longest generated speech (plan Phase 5): matrices read long.
 */
export const MAX_SPEECH_LENGTH = 600;

const MEDIA_HASH = /^[0-9a-f]{64}$/;

// ── Plain-text markup (Decision 2) ──────────────────────────────────────────

export type PlainTextMarkupCode =
  | "latex-span"
  | "latex-command"
  | "emphasis"
  | "control-character";

export interface PlainTextMarkup {
  code: PlainTextMarkupCode;
  offset: number;
  length: number;
  /** The offending text as written. */
  text: string;
}

/** Characters after which a backslash word belongs to a path, not to TeX. */
const PATH_CONTEXT = /[A-Za-z0-9:./\\]/;

/** Left edge of an emphasis span: start, whitespace or opening punctuation. */
const EMPHASIS_BEFORE = /^$|[\s([{"'„“‚‘«»—–-]$/u;
/** Right edge: end, whitespace or closing punctuation. */
const EMPHASIS_AFTER = /^$|^[\s)\]}"'“”‘’«».,;:!?—–-]/u;

function emphasisSpans(text: string, out: PlainTextMarkup[]): void {
  // `**strong**` and `__strong__` (an identifier such as `__init__` is code,
  // not emphasis), then single `*em*` and `_em_` with word-boundary edges so
  // `2*b*c`, `src/*.ts` and `snake_case` stay text.
  const patterns: Array<{ re: RegExp; identifierIsCode: boolean }> = [
    { re: /\*\*(?=\S)([^*\n]*?\S)\*\*/g, identifierIsCode: false },
    { re: /__(?=\S)([^_\n]*?\S)__/g, identifierIsCode: true },
    {
      re: /(?<!\*)\*(?=[^\s*])([^*\n]*?[^\s*])\*(?!\*)/g,
      identifierIsCode: false,
    },
    { re: /(?<!_)_(?=[^\s_])([^_\n]*?[^\s_])_(?!_)/g, identifierIsCode: true },
  ];
  const taken: Array<[number, number]> = [];
  for (const { re, identifierIsCode } of patterns) {
    for (const match of text.matchAll(re)) {
      const start = match.index ?? 0;
      const end = start + match[0].length;
      if (taken.some(([a, b]) => start < b && end > a)) continue;
      if (!EMPHASIS_BEFORE.test(text.slice(0, start))) continue;
      if (!EMPHASIS_AFTER.test(text.slice(end))) continue;
      if (identifierIsCode && /^[A-Za-z0-9_]+$/.test(match[1])) continue;
      // A line-start `* ` is a list marker; the pattern needs a non-space
      // after the star, so a bullet never matches here.
      taken.push([start, end]);
      out.push({
        code: "emphasis",
        offset: start,
        length: match[0].length,
        text: match[0],
      });
    }
  }
}

/**
 * Markup in a plain-text field, by the exact rules of ADR 2026-10-14b
 * Decision 2. Empty when the text is clean.
 *
 * - **LaTeX** is a `$…$` span that looks like math, or an inventory control
 *   word that is not part of a path (`C:\Schule\Mathe` is text, `\beta
 *   zwischen` is not).
 * - **Emphasis** is an inline `**…**`, `__…__`, `*…*` or `_…_` span with
 *   word-boundary edges. Line-start list markers stay (`- `, `* `, `1. `).
 * - **Control characters** are everything below U+0020 except the newline,
 *   and U+007F.
 */
export function findPlainTextMarkup(text: string): PlainTextMarkup[] {
  const out: PlainTextMarkup[] = [];

  for (const match of text.matchAll(/\$(?=\S)([^$\n]*?\S)\$(?![0-9])/g)) {
    if (!looksLikeMath(match[1])) continue;
    out.push({
      code: "latex-span",
      offset: match.index ?? 0,
      length: match[0].length,
      text: match[0],
    });
  }

  for (const match of text.matchAll(/\\([A-Za-z]+)/g)) {
    const offset = match.index ?? 0;
    const before = text[offset - 1];
    if (before !== undefined && PATH_CONTEXT.test(before)) continue;
    if (!isInventoryControlWord(match[1])) continue;
    if (
      out.some(
        (m) =>
          m.code === "latex-span" &&
          offset >= m.offset &&
          offset < m.offset + m.length,
      )
    ) {
      continue;
    }
    out.push({
      code: "latex-command",
      offset,
      length: match[0].length,
      text: match[0],
    });
  }

  emphasisSpans(text, out);

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if ((code < 0x20 && code !== 0x0a) || code === 0x7f) {
      out.push({
        code: "control-character",
        offset: i,
        length: 1,
        text: text[i],
      });
    }
  }

  return out.sort((a, b) => a.offset - b.offset);
}

/** A one-line description of a markup finding, for an issue message. */
export function describePlainTextMarkup(markup: PlainTextMarkup): string {
  switch (markup.code) {
    case "latex-span":
      return `LaTeX ${markup.text} in plain text; write it as a math segment`;
    case "latex-command":
      return `LaTeX command ${markup.text} in plain text; write it as a math segment`;
    case "emphasis":
      return `Markdown emphasis ${markup.text}; card text is never rendered as Markdown`;
    case "control-character":
      return `control character U+${markup.text.charCodeAt(0).toString(16).padStart(4, "0").toUpperCase()}`;
  }
}

// ── Validation (Decisions 2–5) ──────────────────────────────────────────────

export interface CardTextIssue {
  /** Where: `[2].tex`, `[0].text`, or `""` for the whole value. */
  path: string;
  code: string;
  message: string;
}

export interface ValidateCardTextOptions {
  /**
   * Every formula needs `speech`: published content and model-written cards
   * (Decision 4). Only a personal import without a model may leave it out.
   */
  requireSpeech?: boolean;
}

const SEGMENT_KEYS: Record<CardSegment["type"], ReadonlySet<string>> = {
  text: new Set(["type", "text"]),
  math: new Set(["type", "tex", "speech", "block"]),
  image: new Set(["type", "media", "alt", "caption", "inline"]),
};

function plainFieldIssues(
  path: string,
  value: string,
  issues: CardTextIssue[],
): void {
  for (const markup of findPlainTextMarkup(value)) {
    issues.push({
      path,
      code: `markup-${markup.code}`,
      message: `${path}: ${describePlainTextMarkup(markup)}`,
    });
  }
}

/**
 * Every reason `value` is not acceptable card text. Empty when it is.
 *
 * Unknown keys are refused rather than ignored, so nothing can ride along in
 * a segment that a later surface might trust.
 */
export function validateCardText(
  value: unknown,
  opts: ValidateCardTextOptions = {},
): CardTextIssue[] {
  const issues: CardTextIssue[] = [];
  if (!Array.isArray(value)) {
    return [
      {
        path: "",
        code: "not-a-list",
        message: "Card text must be a list of segments.",
      },
    ];
  }
  if (value.length === 0) {
    return [
      {
        path: "",
        code: "empty",
        message: "Card text needs at least one segment.",
      },
    ];
  }
  if (value.length > MAX_CARD_SEGMENTS) {
    issues.push({
      path: "",
      code: "too-many-segments",
      message: `Card text has ${value.length} segments; at most ${MAX_CARD_SEGMENTS} are allowed.`,
    });
  }

  value.forEach((raw, index) => {
    const at = `[${index}]`;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      issues.push({
        path: at,
        code: "not-a-segment",
        message: `${at}: a segment must be an object.`,
      });
      return;
    }
    const segment = raw as Record<string, unknown>;
    const type = segment.type;
    if (type !== "text" && type !== "math" && type !== "image") {
      issues.push({
        path: `${at}.type`,
        code: "unknown-type",
        message: `${at}.type must be text, math or image.`,
      });
      return;
    }
    for (const key of Object.keys(segment)) {
      if (!SEGMENT_KEYS[type].has(key)) {
        issues.push({
          path: `${at}.${key}`,
          code: "unknown-key",
          message: `${at}.${key} is not a field of a ${type} segment.`,
        });
      }
    }

    if (type === "text") {
      if (typeof segment.text !== "string" || segment.text.length === 0) {
        issues.push({
          path: `${at}.text`,
          code: "empty-text",
          message: `${at}.text must be a non-empty string.`,
        });
        return;
      }
      plainFieldIssues(`${at}.text`, segment.text, issues);
      return;
    }

    if (type === "math") {
      if (typeof segment.tex !== "string") {
        issues.push({
          path: `${at}.tex`,
          code: "missing-tex",
          message: `${at}.tex must be a string.`,
        });
      } else {
        for (const issue of texIssues(segment.tex)) {
          issues.push({
            path: `${at}.tex`,
            code: `tex-${issue.code}`,
            message: `${at}.tex: ${issue.message}`,
          });
        }
      }
      if (segment.block !== undefined && typeof segment.block !== "boolean") {
        issues.push({
          path: `${at}.block`,
          code: "not-boolean",
          message: `${at}.block must be true or false.`,
        });
      }
      const speech = segment.speech;
      // Whitespace is no reading: it counts as missing (PR #412 review).
      if (
        speech === undefined ||
        (typeof speech === "string" && !speech.trim())
      ) {
        if (opts.requireSpeech) {
          issues.push({
            path: `${at}.speech`,
            code: "missing-speech",
            message: `${at}.speech is required: how the formula is read aloud.`,
          });
        }
        return;
      }
      if (typeof speech !== "string") {
        issues.push({
          path: `${at}.speech`,
          code: "not-a-string",
          message: `${at}.speech must be a string.`,
        });
        return;
      }
      if (speech.length > MAX_SPEECH_LENGTH) {
        issues.push({
          path: `${at}.speech`,
          code: "speech-too-long",
          message: `${at}.speech has ${speech.length} characters; at most ${MAX_SPEECH_LENGTH} are allowed.`,
        });
      }
      if (/[\\$<]/.test(speech)) {
        issues.push({
          path: `${at}.speech`,
          code: "speech-markup",
          message: `${at}.speech must be words to read aloud, without \\, $ or <.`,
        });
      }
      plainFieldIssues(`${at}.speech`, speech, issues);
      return;
    }

    // image
    if (typeof segment.media !== "string" || !MEDIA_HASH.test(segment.media)) {
      issues.push({
        path: `${at}.media`,
        code: "bad-media",
        message: `${at}.media must be the SHA-256 hex of a stored image.`,
      });
    }
    if (typeof segment.alt !== "string" || !segment.alt.trim()) {
      issues.push({
        path: `${at}.alt`,
        code: "missing-alt",
        message: `${at}.alt is required.`,
      });
    } else {
      plainFieldIssues(`${at}.alt`, segment.alt, issues);
    }
    if (segment.caption !== undefined) {
      if (typeof segment.caption !== "string") {
        issues.push({
          path: `${at}.caption`,
          code: "not-a-string",
          message: `${at}.caption must be a string.`,
        });
      } else {
        plainFieldIssues(`${at}.caption`, segment.caption, issues);
      }
    }
    if (segment.inline !== undefined && typeof segment.inline !== "boolean") {
      issues.push({
        path: `${at}.inline`,
        code: "not-boolean",
        message: `${at}.inline must be true or false.`,
      });
    }
  });

  return issues;
}

/** True when `value` is acceptable card text under `opts`. */
export function isValidCardText(
  value: unknown,
  opts: ValidateCardTextOptions = {},
): value is CardText {
  return validateCardText(value, opts).length === 0;
}

/** Merge adjacent text segments and drop empty ones. */
export function normalizeCardText(segments: CardText): CardText {
  const out: CardText = [];
  for (const segment of segments) {
    if (segment.type === "text") {
      if (!segment.text) continue;
      const last = out[out.length - 1];
      if (last?.type === "text") {
        out[out.length - 1] = { type: "text", text: last.text + segment.text };
        continue;
      }
    }
    out.push(segment);
  }
  return out;
}

// ── Projections (Decision 4) ────────────────────────────────────────────────

function join(parts: Array<{ text: string; block: boolean }>): string {
  let out = "";
  for (const part of parts) {
    out += part.block ? `\n${part.text}\n` : part.text;
  }
  return out
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function part(
  segment: CardSegment,
  spoken: boolean,
): { text: string; block: boolean } {
  if (segment.type === "text") return { text: segment.text, block: false };
  if (segment.type === "math") {
    const plain = texToPlain(segment.tex);
    return {
      text: spoken ? segment.speech?.trim() || plain : plain,
      block: segment.block === true,
    };
  }
  return { text: segment.alt, block: segment.inline !== true };
}

/**
 * The text every plain reader sees: text as written, each formula by its
 * derived Unicode form, each image by its alt text.
 */
export function plainProjection(segments: CardText): string {
  return join(segments.map((segment) => part(segment, false)));
}

/**
 * What voice mode reads aloud: text as written, each formula by its `speech`
 * (its plain form when a personal import left speech empty), each image by
 * its alt text.
 */
export function spokenProjection(segments: CardText): string {
  return join(segments.map((segment) => part(segment, true))).replace(
    /\s*\n+\s*/g,
    " ",
  );
}
