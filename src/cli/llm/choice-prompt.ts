/**
 * Generated choice options (ADR 2026-09-27 Decision 6, source 3).
 *
 * Shared by the CLI and Mobile, which inject their own model transport: this
 * module builds the prompts, parses the replies, applies the kernel's
 * deterministic checks and runs the reject filter. It must stay free of Node
 * built-ins and of `kernel/index.js`, because the Mobile WebView bundles it.
 *
 * Two model calls per item, once: one writes candidates with a reason each, a
 * second — the reject filter — answers the question from the shuffled set, and
 * every candidate it considers correct is dropped. A filtered set is not a
 * verified one; disputes and retirement remain the quality gate.
 */

import {
  type CandidateRejection,
  checkCandidate,
} from "../../kernel/recall/choice-checks.js";
import { languageName } from "../../kernel/system/language-names.js";
import { seededPermutation } from "../../kernel/util/seeded.js";

/** Output budget: a handful of short options with one line each. */
export const CHOICE_GENERATION_MAX_OUTPUT_TOKENS = 1200;
/** Output budget for the filter's index list. */
export const CHOICE_FILTER_MAX_OUTPUT_TOKENS = 300;

/** How many candidates generation asks for. */
export const CHOICE_CANDIDATES_REQUESTED = 5;

export interface ChoiceGenerationItem {
  id: string;
  question: string | null;
  concept: string;
  domain: string;
  bloomLevel: number;
  context?: string | null;
  /** The item's language (`tokens.language`); null asks for the item's own. */
  language?: string | null;
}

export interface ChoicePrompt {
  system: string;
  user: string;
}

export interface GeneratedCandidate {
  text: string;
  reason: string | null;
}

/** A model call: system and user prompt in, reply text out. */
export type ChoiceCompletion = (prompt: ChoicePrompt) => Promise<string>;

function languageInstruction(language: string | null | undefined): string {
  return language?.trim()
    ? languageName(language)
    : "the language the question and answer are written in";
}

/** Prompt for plausible, unambiguously wrong options with a reason each. */
export function buildChoiceGenerationPrompt(
  item: ChoiceGenerationItem,
): ChoicePrompt {
  const language = languageInstruction(item.language);
  const system = `You write wrong answer options (distractors) for a multiple-choice flashcard.

Rules:
1. Write ${CHOICE_CANDIDATES_REQUESTED} distractors in ${language}.
2. Each distractor is clearly WRONG as an answer to the question, yet plausible to a learner who half-knows the topic: use typical misconceptions, confusions with neighbouring concepts, or common calculation slips.
3. Match the correct answer's category, grammatical form and length. A distractor must never be noticeably longer, shorter or more detailed than the correct answer.
4. Never write "all of the above", "none of the above", a negation of the correct answer, or a paraphrase of it.
5. For each distractor, give one short sentence in ${language} explaining why it is wrong — addressed to the learner who picked it.
6. Reply with JSON only, no markdown fence and no prose:
[{"text": "...", "reason": "..."}]`;
  const user = `Domain: ${item.domain}
Question: ${item.question?.trim() || "(the card has no separate question; ask about the answer)"}
Correct answer: ${item.concept}${item.context?.trim() ? `\nContext: ${item.context.trim()}` : ""}

Distractors:`;
  return { system, user };
}

function stripFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

/** The JSON array anywhere in the reply, or undefined. */
function extractArray(text: string): unknown[] | undefined {
  const cleaned = stripFence(text);
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start < 0 || end <= start) return undefined;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

/** Candidates from a generation reply; an unusable reply yields none. */
export function parseChoiceGeneration(text: string): GeneratedCandidate[] {
  const entries = extractArray(text) ?? [];
  const candidates: GeneratedCandidate[] = [];
  for (const entry of entries) {
    if (typeof entry === "string" && entry.trim()) {
      candidates.push({ text: entry.trim(), reason: null });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const value = entry as { text?: unknown; reason?: unknown };
    if (typeof value.text !== "string" || !value.text.trim()) continue;
    candidates.push({
      text: value.text.trim(),
      reason:
        typeof value.reason === "string" && value.reason.trim()
          ? value.reason.trim()
          : null,
    });
  }
  return candidates;
}

/** Prompt asking which options answer the question correctly. */
export function buildChoiceFilterPrompt(input: {
  question: string | null;
  concept: string;
  options: readonly string[];
}): ChoicePrompt {
  const question =
    input.question?.trim() ||
    `Which option matches this reference: ${input.concept}`;
  const numbered = input.options
    .map((option, index) => `${index + 1}. ${option}`)
    .join("\n");
  return {
    system: `You check multiple-choice options. Decide for every option whether it is a correct answer to the question — also when it is worded differently, is a synonym, or is only one of several valid answers. Reply with JSON only: the array of the numbers of all correct options, e.g. [2] or [1, 4].`,
    user: `Question: ${question}

Options:
${numbered}

Correct option numbers:`,
  };
}

/** Zero-based indices of the options the filter considers correct. */
export function parseChoiceFilter(text: string, optionCount: number): number[] {
  const entries = extractArray(text);
  if (!entries) throw new Error("the reject filter did not return a list");
  const indices = new Set<number>();
  for (const entry of entries) {
    const number = typeof entry === "number" ? entry : Number(entry);
    if (Number.isInteger(number) && number >= 1 && number <= optionCount) {
      indices.add(number - 1);
    }
  }
  return [...indices].sort((a, b) => a - b);
}

export interface FilterVerdict {
  /** The options as the filter saw them, answer included, shuffled. */
  shown: string[];
  /** Zero-based indices the filter called correct. */
  correct: number[];
  /** Whether the filter recognised the real answer at all. */
  answerRecognised: boolean;
}

export interface ChoiceGenerationResult {
  accepted: Array<GeneratedCandidate & { filterVerdict: FilterVerdict }>;
  rejected: Array<{
    text: string;
    reason: CandidateRejection | "filter";
  }>;
}

/**
 * Generate, check and filter options for one item.
 *
 * The filter sees the candidates together with the answer, in an order
 * derived from the item id rather than the model's: a generator's (or a
 * reader's) position bias must not decide which options survive. A failing
 * filter call fails the item — unfiltered options are never stored.
 */
export async function runChoiceGeneration(input: {
  item: ChoiceGenerationItem;
  complete: ChoiceCompletion;
  completeFilter: ChoiceCompletion;
}): Promise<ChoiceGenerationResult> {
  const { item } = input;
  const reply = await input.complete(buildChoiceGenerationPrompt(item));
  const rejected: ChoiceGenerationResult["rejected"] = [];
  const checked: GeneratedCandidate[] = [];
  for (const candidate of parseChoiceGeneration(reply)) {
    const reason = checkCandidate(
      item.concept,
      candidate.text,
      checked.map((entry) => entry.text),
      item.question,
    );
    if (reason) rejected.push({ text: candidate.text, reason });
    else checked.push(candidate);
  }
  if (checked.length === 0) return { accepted: [], rejected };

  const shown = seededPermutation(
    [item.concept.trim(), ...checked.map((entry) => entry.text)],
    `${item.id}:filter`,
  );
  const correct = parseChoiceFilter(
    await input.completeFilter(
      buildChoiceFilterPrompt({
        question: item.question,
        concept: item.concept,
        options: shown,
      }),
    ),
    shown.length,
  );
  const correctTexts = new Set(correct.map((index) => shown[index]));
  const verdict: FilterVerdict = {
    shown,
    correct,
    answerRecognised: correctTexts.has(item.concept.trim()),
  };
  const accepted: ChoiceGenerationResult["accepted"] = [];
  for (const candidate of checked) {
    if (correctTexts.has(candidate.text)) {
      rejected.push({ text: candidate.text, reason: "filter" });
    } else {
      accepted.push({ ...candidate, filterVerdict: verdict });
    }
  }
  return { accepted, rejected };
}

/** One user message for transports that send no system prompt (Mobile). */
export function asSingleMessage(prompt: ChoicePrompt): string {
  return `${prompt.system}\n\n${prompt.user}`;
}
