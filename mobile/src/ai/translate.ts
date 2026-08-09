/**
 * Translating a card into the language the learner is actually reading in.
 *
 * Cards arrive from imports, shared libraries and other people's decks, and a
 * card in the wrong language is not a card — you cannot answer from memory in
 * a language you are still decoding. The mistake is usually only noticed
 * mid-review, which is why this lives next to the review screen rather than in
 * the library.
 *
 * **Nothing is saved here.** The translation lands in the edit fields for the
 * learner to correct before saving. A model that renders a term of art badly
 * is common; silently overwriting the card with its guess is not recoverable,
 * and the learner is the one who knows what the card is supposed to say.
 */

import type { ZamPairLlmEndpoint } from "../../../src/bridge/mobile-pairing.js";
import type { Database } from "../../../src/kernel/db/types.js";
import { type EvaluationPorts, generateViaHttp } from "../evaluate.js";
import { resolveMobileCloudChain } from "../model-registry.js";

/** Output budget: a card is short, and a runaway answer is never the right one. */
const TRANSLATE_MAX_OUTPUT_TOKENS = 1200;

export const LANGUAGE_NAMES: Record<string, string> = {
  de: "German",
  en: "English",
};

export interface TranslatableCard {
  question: string;
  concept: string;
}

export class NoTranslationBackendError extends Error {
  constructor() {
    super("no cloud text model is connected");
    this.name = "NoTranslationBackendError";
  }
}

/**
 * What went wrong, in a form the review screen can turn into a sentence.
 *
 * `status` carries the HTTP code when there was one, because the two cases a
 * learner can actually act on — a rejected key and a rate limit — are only
 * distinguishable by it. Note that OpenRouter answers a *malformed* key with
 * `401 Missing Authentication header` even when the header was sent (verified
 * 2026-08-09 with a bogus token), so the wording of the body is not evidence
 * that ZAM failed to authenticate.
 */
export class TranslationFailedError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TranslationFailedError";
  }
}

/** First HTTP status mentioned by the collected endpoint failures, if any. */
export function statusFromFailures(text: string): number | undefined {
  const match = text.match(/HTTP (\d{3})/);
  return match ? Number(match[1]) : undefined;
}

/**
 * The model is asked for JSON with exactly two fields, because the alternative
 * — "return the translation" — reliably comes back wrapped in a sentence of
 * commentary that would then be pasted into the card.
 */
export function buildTranslatePrompt(
  card: TranslatableCard,
  locale: string,
): string {
  const language = LANGUAGE_NAMES[locale] ?? "English";
  return `Translate this flashcard into ${language}.

Rules:
1. Translate meaning, not words. The result must read as if it had been written in ${language} by someone who knows the subject.
2. Keep proper nouns, code, formulas, and established technical terms in their original form when that is what a ${language} speaker would use.
3. Do not answer the question, do not explain, do not add or remove information.
4. If a field is already in ${language}, return it unchanged.
5. Reply with JSON only — no prose, no markdown fence:
{"question": "...", "concept": "..."}

question: ${card.question}
concept: ${card.concept}`;
}

/**
 * Pull the two fields out of whatever the model sent back.
 *
 * Models fence JSON in markdown more often than not, so the fence is stripped
 * before parsing. A reply that is not usable JSON throws rather than being
 * pattern-matched into shape: a half-understood translation is worse than an
 * error the learner can retry.
 */
export function parseTranslation(text: string): TranslatableCard {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("translation was not valid JSON");
  }
  const value = parsed as Partial<TranslatableCard>;
  if (typeof value.question !== "string" || typeof value.concept !== "string") {
    throw new Error("translation was missing question or concept");
  }
  return { question: value.question.trim(), concept: value.concept.trim() };
}

/**
 * Translate one card into `locale`, through the connected cloud text model.
 *
 * Throws `NoTranslationBackendError` when nothing is connected, so the caller
 * can say "connect a model" instead of showing a transport error for a button
 * that was never going to work.
 */
export async function translateCard(
  db: Database,
  card: TranslatableCard,
  locale: string,
  ports: { fetchText?: EvaluationPorts["fetchText"] } = {},
  resolve: (
    db: Database,
  ) => Promise<ZamPairLlmEndpoint | null> = resolveMobileCloudChainText,
): Promise<TranslatableCard> {
  const endpoint = await resolve(db);
  if (!endpoint) throw new NoTranslationBackendError();

  const prompt = buildTranslatePrompt(card, locale);
  const errors: string[] = [];
  // Walk the fallback chain the same way evaluation does: a learner with two
  // endpoints configured expects the second one to carry the first's failure.
  for (
    let current: ZamPairLlmEndpoint | undefined = endpoint;
    current;
    current = current.fallback
  ) {
    try {
      const text = await generateViaHttp(
        current,
        prompt,
        ports.fetchText,
        TRANSLATE_MAX_OUTPUT_TOKENS,
      );
      return parseTranslation(text);
    } catch (error) {
      errors.push(
        `${current.label || current.model}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  const detail = errors.join("; ");
  throw new TranslationFailedError(detail, statusFromFailures(detail));
}

function resolveMobileCloudChainText(
  db: Database,
): Promise<ZamPairLlmEndpoint | null> {
  return resolveMobileCloudChain(db, "text");
}
