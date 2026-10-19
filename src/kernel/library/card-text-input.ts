/**
 * Card text from a model or an agent (ADR 2026-10-14b, Decision 6).
 *
 * A writer hands ZAM a question or a reference answer either as a plain
 * string or as a segment list. This module turns either into what the write
 * path stores: the plain projection, and segments when the text holds a
 * formula. Both forms get the same repairs:
 *
 * - `$…$` spans are lifted out of strings and text segments with the lenient
 *   lift: only a span shaped and looking like math (`$HOME` and prices stay
 *   text, and are reported);
 * - Markdown emphasis is dropped from text, across formula boundaries;
 * - a bare inventory command in text (`\beta`) becomes its Unicode (`β`).
 *
 * Two temperaments, as the ADR asks:
 *
 * - **`agent`**: a tool caller fails loudly. A formula the tokenizer refuses
 *   is an issue that names the segment, and the agent retries.
 * - **`import`**: the learner's own import never fails over a formula. A
 *   refused formula becomes readable text and is reported for the review
 *   list, where the learner decides.
 *
 * Formulas without `speech` are reported, never refused here: whether speech
 * is required is the caller's decision (Decision 4).
 *
 * No images yet: an image segment needs attached material, which no writer
 * hands over until plan Phase 8.
 */

import {
  type CardSegment,
  type CardText,
  type CardTextIssue,
  findPlainTextMarkup,
  normalizeCardText,
  plainProjection,
  validateCardText,
} from "./card-text.js";
import { liftDollarMath } from "./dollar-lift.js";
import { texToPlain } from "./tex-plain.js";
import { isInventoryControlWord } from "./tex-tokenizer.js";

export type CardTextInputMode = "agent" | "import";

/** Something a writer sent that stayed text: for the review list. */
export interface CardTextNote {
  /**
   * `dollar`: a `$` span that is not math (`$HOME`, a price).
   * `formula`: a formula the tokenizer refused, kept as readable text.
   */
  kind: "dollar" | "formula";
  /** The original text, shortened. */
  text: string;
}

export interface CardTextInput {
  /** The plain projection: what plain readers, matching and lists show. */
  plain: string;
  /** Segments when the text holds a formula; `null` for plain text. */
  segments: CardText | null;
  notes: CardTextNote[];
  /** Indexes into `segments` of formulas without `speech`. */
  missingSpeech: number[];
}

export type CardTextInputResult =
  | { ok: true; value: CardTextInput }
  | { ok: false; issues: CardTextIssue[] };

/** Stands for a formula while emphasis is stripped around it. */
const FORMULA = "";

/**
 * Drop Markdown emphasis delimiters from text segments, keeping the words. A
 * span may wrap a formula (`**Alkene ($C_nH_{2n}$)**`) or nest inside
 * another (`*„fertig“**,** sagte Paul.*`), so the text is joined around a
 * stand-in for each formula and stripped until nothing is left.
 */
export function dropEmphasis(segments: CardText): CardText {
  const others = segments.filter((s) => s.type !== "text");
  let joined = segments
    .map((s) => (s.type === "text" ? s.text.split(FORMULA).join("") : FORMULA))
    .join("");
  for (let pass = 0; pass < 10; pass++) {
    const spans = findPlainTextMarkup(joined).filter(
      (m) => m.code === "emphasis",
    );
    if (spans.length === 0) break;
    // One pass applies only spans that do not overlap; the next finds the rest.
    const chosen: typeof spans = [];
    let end = -1;
    for (const span of spans.sort((a, b) => a.offset - b.offset)) {
      if (span.offset < end) continue;
      chosen.push(span);
      end = span.offset + span.length;
    }
    for (const span of chosen.reverse()) {
      const inner = span.text
        .replace(/^(\*\*|__|\*|_)/, "")
        .replace(/(\*\*|__|\*|_)$/, "");
      joined =
        joined.slice(0, span.offset) +
        inner +
        joined.slice(span.offset + span.length);
    }
  }
  const texts = joined.split(FORMULA);
  const out: CardSegment[] = [];
  texts.forEach((text, index) => {
    if (text) out.push({ type: "text", text });
    if (index < others.length) out.push(others[index]);
  });
  return out;
}

/**
 * A refused formula as readable text: its plain Unicode where the converter
 * manages, with what is left of TeX syntax removed.
 */
export function texAsText(tex: string): string {
  let plain: string;
  try {
    plain = texToPlain(tex);
  } catch {
    plain = tex;
  }
  return withoutControlCharacters(
    plain
      .replace(/\\([A-Za-z]+)/g, "$1")
      .replace(/\\(.)/g, "$1")
      .replace(/[{}$]/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .trim();
}

/** Control characters other than tab and newline, as spaces. */
function withoutControlCharacters(text: string): string {
  let out = "";
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    const control =
      (code < 0x20 && char !== "\n" && char !== "\t") || code === 0x7f;
    out += control ? " " : char;
  }
  return out;
}

/** The letter a JSON escape stands for when it ate a command's backslash. */
const EATEN_ESCAPES: Record<string, string> = {
  "\b": "b",
  "\f": "f",
  "\n": "n",
  "\r": "r",
  "\t": "t",
};

/**
 * Undo the commonest damage in a model's JSON: a single backslash before
 * `frac`, `text`, `beta` or `rightarrow` reads as the escape `\f`, `\t`,
 * `\b` or `\r`. A control character is put back as `\` and its letter only
 * when that letter and the ones after it spell an inventory command.
 */
export function repairEatenBackslashes(tex: string): string {
  return tex.replace(/[\b\f\n\r\t]([A-Za-z]*)/g, (match, rest: string) => {
    const word = EATEN_ESCAPES[match[0]] + rest;
    return isInventoryControlWord(word) ? `\\${word}` : match;
  });
}

/** A bare inventory command in text (`\beta`) as its Unicode (`β`). */
function withoutBareCommands(text: string): string {
  const spans = findPlainTextMarkup(text).filter(
    (m) => m.code === "latex-command" || m.code === "control-character",
  );
  let out = text;
  for (const span of spans.sort((a, b) => b.offset - a.offset)) {
    const replacement =
      span.code === "control-character" ? " " : texAsText(span.text);
    out =
      out.slice(0, span.offset) +
      replacement +
      out.slice(span.offset + span.length);
  }
  return out;
}

/** A problem with a formula's reading, not with the formula. */
const isSpeechIssue = (issue: CardTextIssue) =>
  /^\[\d+\]\.speech$/.test(issue.path);

/** The segment an issue path (`[2].tex`) points at. */
const segmentIndex = (path: string) => Number(/^\[(\d+)\]/.exec(path)?.[1]);

/** No space before the first word or after the last. */
function trimEdges(segments: CardText): CardText {
  const out = segments.map((segment) => ({ ...segment }));
  const first = out[0];
  if (first?.type === "text") first.text = first.text.trimStart();
  const last = out[out.length - 1];
  if (last?.type === "text") last.text = last.text.trimEnd();
  return normalizeCardText(out);
}

const shorten = (text: string) =>
  text.length > 60 ? `${text.slice(0, 57)}…` : text;

/** Lift the dollars out of every text segment. */
function lifted(segments: CardText, notes: CardTextNote[]): CardText {
  const out: CardSegment[] = [];
  for (const segment of segments) {
    if (segment.type !== "text") {
      out.push(segment);
      continue;
    }
    const result = liftDollarMath(segment.text, "lenient");
    for (const span of result.unlifted) {
      notes.push({ kind: "dollar", text: shorten(span.text) });
    }
    out.push(...result.segments);
  }
  return out;
}

/**
 * Read one question or answer from a writer. `value` is a string or a
 * segment list; anything else, or an empty text, is an issue in both modes.
 */
export function readCardTextInput(
  value: unknown,
  mode: CardTextInputMode,
): CardTextInputResult {
  const notes: CardTextNote[] = [];
  let segments: CardText;
  if (typeof value === "string") {
    if (!value.trim()) {
      return {
        ok: false,
        issues: [{ path: "", code: "empty", message: "The text is empty." }],
      };
    }
    segments = [{ type: "text", text: value }];
  } else if (Array.isArray(value)) {
    // Shape first: a list that is not made of segments has nothing to repair.
    const shape = validateCardText(value).filter(
      (issue) =>
        !issue.code.startsWith("tex-") &&
        !issue.code.startsWith("markup-") &&
        !isSpeechIssue(issue),
    );
    if (shape.length > 0) return { ok: false, issues: shape };
    segments = value as CardText;
  } else {
    return {
      ok: false,
      issues: [
        {
          path: "",
          code: "not-a-list",
          message: "Card text must be a string or a list of segments.",
        },
      ],
    };
  }

  if (segments.some((segment) => segment.type === "image")) {
    return {
      ok: false,
      issues: [
        {
          path: `[${segments.findIndex((s) => s.type === "image")}]`,
          code: "image-unsupported",
          message:
            "Images in card text come only from attached material, which this writer cannot attach yet.",
        },
      ],
    };
  }

  segments = dropEmphasis(lifted(segments, notes)).map((segment) =>
    segment.type === "text"
      ? { type: "text", text: withoutBareCommands(segment.text) }
      : segment.type === "math"
        ? { ...segment, tex: repairEatenBackslashes(segment.tex) }
        : segment,
  );
  segments = normalizeCardText(segments);

  // Refused formulas: an agent hears about each; an import keeps it as text.
  const refused = validateCardText(segments).filter((issue) =>
    issue.code.startsWith("tex-"),
  );
  if (refused.length > 0) {
    if (mode === "agent") return { ok: false, issues: refused };
    const bad = new Set(refused.map((issue) => segmentIndex(issue.path)));
    segments = normalizeCardText(
      segments.map((segment, index) => {
        if (!bad.has(index) || segment.type !== "math") return segment;
        notes.push({ kind: "formula", text: shorten(segment.tex) });
        return { type: "text", text: texAsText(segment.tex) };
      }),
    );
  }

  // A reading that is not plain words: an agent hears about it; an import
  // drops just that reading, and the formula is read by its plain form.
  const badReadings = validateCardText(segments).filter(isSpeechIssue);
  if (badReadings.length > 0) {
    if (mode === "agent") return { ok: false, issues: badReadings };
    const bad = new Set(badReadings.map((issue) => segmentIndex(issue.path)));
    segments = segments.map((segment, index) => {
      if (!bad.has(index) || segment.type !== "math") return segment;
      const { speech: _dropped, ...rest } = segment;
      return rest;
    });
  }

  segments = trimEdges(segments);
  const issues = validateCardText(segments);
  if (issues.length > 0) return { ok: false, issues };

  const plain = plainProjection(segments);
  if (!plain) {
    return {
      ok: false,
      issues: [{ path: "", code: "empty", message: "The text is empty." }],
    };
  }
  const hasMath = segments.some((segment) => segment.type === "math");
  const missingSpeech: number[] = [];
  segments.forEach((segment, index) => {
    if (segment.type === "math" && !segment.speech?.trim()) {
      missingSpeech.push(index);
    }
  });
  return {
    ok: true,
    value: {
      plain,
      segments: hasMath ? segments : null,
      notes,
      missingSpeech,
    },
  };
}

/**
 * Speech for the formulas that lack it, from a `tex → speech` reading list
 * (a model's answer to one follow-up question). Formulas the list misses
 * stay without speech.
 */
export function withSpeech(
  segments: CardText,
  speech: ReadonlyMap<string, string>,
): CardText {
  return segments.map((segment) => {
    if (segment.type !== "math" || segment.speech?.trim()) return segment;
    const spoken = speech.get(segment.tex)?.trim();
    if (!spoken) return segment;
    const candidate = { ...segment, speech: spoken };
    return validateCardText([candidate], { requireSpeech: true }).length === 0
      ? candidate
      : segment;
  });
}

/** The formulas in `segments` that still lack speech. */
export function formulasWithoutSpeech(segments: CardText | null): string[] {
  return (segments ?? [])
    .filter((s) => s.type === "math" && !s.speech?.trim())
    .map((s) => (s.type === "math" ? s.tex : ""));
}
