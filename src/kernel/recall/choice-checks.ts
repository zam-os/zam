/**
 * Deterministic checks on choice options (ADR 2026-09-27 Decision 6).
 *
 * They run on every candidate — generated, derived or curated — and again on
 * the set a learner is actually shown. They catch what a string can reveal:
 * a distractor that repeats the answer, a set where the answer is the only
 * long option. They cannot catch a different correct answer; that is what the
 * reject filter, disputes and retirement are for. Pure, no model.
 */

export type CandidateRejection =
  | "empty"
  | "equals_answer"
  | "contains_answer"
  | "duplicate"
  | "all_or_none"
  | "negated_answer"
  | "in_question"
  | "length_outlier";

export type ShownSetRejection = "length_cue" | "parenthesis_cue";

/** Case-, accent-, punctuation- and whitespace-insensitive comparison form. */
export function normalizeOption(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

const ALL_OR_NONE = [
  /\ball of the above\b/,
  /\bnone of the above\b/,
  /\ball of these\b/,
  /\bnone of these\b/,
  /\balle (genannten|oben|antworten|obigen)\b/,
  /\bkeine der\b/,
  /\bkeine (antwort|davon)\b/,
];

const NEGATIONS = [
  "nicht",
  "kein",
  "keine",
  "keiner",
  "not",
  "no",
  "never",
  "nie",
];

/**
 * Words a distractor may not merely prefix to the answer: "nicht X" beside "X"
 * is a trick question, not a plausible alternative.
 */
function isNegatedAnswer(answer: string, candidate: string): boolean {
  const words = candidate.split(" ");
  const withoutNegation = words.filter((word) => !NEGATIONS.includes(word));
  return (
    withoutNegation.length < words.length &&
    withoutNegation.join(" ") === answer
  );
}

/**
 * Length band for a distractor: 0.5× to 2× the answer's length, with at least
 * ±8 characters of slack so short answers ("Ne", "42 N") are not starved.
 */
function outsideLengthBand(answer: string, candidate: string): boolean {
  const low = Math.min(answer.length * 0.5, answer.length - 8);
  const high = Math.max(answer.length * 2, answer.length + 8);
  return candidate.length < low || candidate.length > high;
}

/**
 * Whether the question already names the candidate as a whole word or phrase:
 * "Totalreflexion" beside "… ab dem Totalreflexion eintritt?" is either a
 * give-away or implausible, never a distractor.
 */
function appearsInQuestion(
  question: string | null | undefined,
  normalized: string,
): boolean {
  if (!question || normalized.length < 3) return false;
  return ` ${normalizeOption(question)} `.includes(` ${normalized} `);
}

/**
 * Why a candidate distractor must not be offered for this answer, or `null`.
 * `accepted` are the distractors already chosen for the same set; `question`
 * is the item's question, when it has one.
 */
export function checkCandidate(
  answer: string,
  candidate: string,
  accepted: readonly string[] = [],
  question?: string | null,
): CandidateRejection | null {
  const normalizedAnswer = normalizeOption(answer);
  const normalized = normalizeOption(candidate);
  if (!normalized) return "empty";
  if (normalized === normalizedAnswer) return "equals_answer";
  if (isNegatedAnswer(normalizedAnswer, normalized)) return "negated_answer";
  if (
    normalizedAnswer.length >= 3 &&
    (normalized.includes(normalizedAnswer) ||
      (normalized.length >= 3 && normalizedAnswer.includes(normalized)))
  ) {
    return "contains_answer";
  }
  if (appearsInQuestion(question, normalized)) return "in_question";
  if (accepted.some((other) => normalizeOption(other) === normalized)) {
    return "duplicate";
  }
  if (ALL_OR_NONE.some((pattern) => pattern.test(normalized))) {
    return "all_or_none";
  }
  if (outsideLengthBand(answer.trim(), candidate.trim())) {
    return "length_outlier";
  }
  return null;
}

/**
 * Whether the set a learner would see gives the answer away by its form: the
 * correct option is the only one at least 40 % longer (or shorter) than every
 * distractor, or the only one with a parenthetical.
 */
export function checkShownSet(
  options: readonly string[],
  correctIndex: number,
): ShownSetRejection | null {
  const correct = options[correctIndex];
  if (correct === undefined || options.length < 2) return null;
  const others = options.filter((_, index) => index !== correctIndex);
  const length = correct.trim().length;
  const lengths = others.map((option) => option.trim().length);
  if (
    lengths.every((other) => length >= other * 1.4) ||
    lengths.every((other) => length * 1.4 <= other)
  ) {
    return "length_cue";
  }
  const hasParenthesis = (text: string) => /[()[\]]/.test(text);
  if (hasParenthesis(correct) && !others.some(hasParenthesis)) {
    return "parenthesis_cue";
  }
  return null;
}
