/**
 * The one follow-up question for formulas that came back without speech
 * (ADR 2026-10-14b, Decisions 4 and 6): "how does a teacher read this
 * aloud?". A learner's built-in import asks it once; whatever is still
 * missing afterwards stays empty, and voice mode reads the plain text.
 *
 * HTTP-free and free of Node built-ins, like `material-prompt.ts`, so Mobile
 * can bundle it. The caller owns the transport.
 */

import { repairEatenBackslashes } from "../../kernel/library/card-text-input.js";

/** At most this many formulas go into one follow-up request. */
export const MAX_SPEECH_REQUEST_FORMULAS = 60;

export interface FormulaSpeechItem {
  tex: string;
  /** The card's plain text, so the model reads it in the card's language. */
  card: string;
}

export const FORMULA_SPEECH_SYSTEM_PROMPT = `You are ZAM. For each formula, write how a teacher reads it aloud, in the language of the card it belongs to.
Rules:
- Plain words only: no LaTeX, no backslash, no $ and no < in a reading.
- Read numbers as digits, keeping the card's decimal separator ("1,5").
- Read chemical formulas by their symbols ("C O zwei"), units by their names ("Meter pro Sekunde").
- Examples: "W_{\\text{el}} = \\frac{1}{2} C U^2" → "W el gleich ein halb C U Quadrat"; "\\vec{F} = m \\cdot \\vec{a}" → "Vektor F gleich m mal Vektor a"; "x_{1,2}" → "x eins zwei".
- Output ONLY a raw JSON array, one object per formula, the formula copied exactly: [{"tex":"…","speech":"…"}]. In JSON every backslash is written twice.`;

/**
 * The formulas in requests of at most `MAX_SPEECH_REQUEST_FORMULAS`, so a
 * long import asks about every formula instead of dropping the rest.
 */
export function formulaSpeechBatches(
  items: FormulaSpeechItem[],
): FormulaSpeechItem[][] {
  const batches: FormulaSpeechItem[][] = [];
  for (let i = 0; i < items.length; i += MAX_SPEECH_REQUEST_FORMULAS) {
    batches.push(items.slice(i, i + MAX_SPEECH_REQUEST_FORMULAS));
  }
  return batches;
}

/** The user message for one batch: the formulas with their cards, as JSON. */
export function buildFormulaSpeechRequest(items: FormulaSpeechItem[]): string {
  return `Formulas:\n${JSON.stringify(items, null, 1)}\n\nJSON Array Output:`;
}

/**
 * The readings a reply holds, by formula. Never throws: an unreadable reply
 * is an empty map, and the formulas stay without speech.
 */
export function parseFormulaSpeechReply(text: string): Map<string, string> {
  const out = new Map<string, string>();
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start < 0 || end < start) return out;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return out;
  }
  if (!Array.isArray(parsed)) return out;
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const { tex, speech } = entry as { tex?: unknown; speech?: unknown };
    if (typeof tex === "string" && typeof speech === "string") {
      // A reply that wrote `\frac` with one backslash still names its formula.
      out.set(repairEatenBackslashes(tex), speech.trim());
    }
  }
  return out;
}
