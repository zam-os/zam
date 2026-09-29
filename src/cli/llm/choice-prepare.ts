/**
 * Fill the choice-option cache ahead of the review (ADR 2026-09-27 Decision 6).
 *
 * Shared by the CLI (`zam bridge choice-prepare`) and Mobile, which inject the
 * model transport. A card is generated for when it has no authored or curated
 * set and fewer than two usable generated options its learner has not seen:
 * fresh wrong answers each time make a choice a variation rather than a set
 * to memorise (amended 2026-09-29). Existing options are passed as ones to
 * avoid. Generation never blocks a displayed card — callers run this in the
 * background, and a card whose options are not ready is asked with what
 * there is, or in a recall format.
 *
 * Imports kernel modules by path, never `kernel/index.js`: the Mobile WebView
 * bundles this file.
 */

import type { Database } from "../../kernel/db/types.js";
import { getCardById } from "../../kernel/models/card.js";
import { getTokenById } from "../../kernel/models/token.js";
import { choiceOptionsNeeded } from "../../kernel/recall/answer-presentation.js";
import {
  choiceSourceHash,
  storeDistractors,
} from "../../kernel/recall/choice-options.js";
import type {
  ChoiceGenerationItem,
  ChoiceGenerationResult,
} from "./choice-prompt.js";

export interface ChoiceGeneration {
  result: ChoiceGenerationResult;
  /** Model that wrote the candidates. */
  model: string | null;
  /** Model that ran the reject filter. */
  filterModel: string | null;
}

export type GenerateChoiceOptions = (
  item: ChoiceGenerationItem,
) => Promise<ChoiceGeneration>;

export interface PrepareChoiceOptionsResult {
  /** Cards that gained cached options. */
  prepared: number;
  /** Cards that already had enough options or cannot be asked as a choice. */
  skipped: number;
  failed: Array<{ cardId: string; error: string }>;
  /** Model calls made, for cost accounting: two per generated card. */
  modelCalls: number;
}

export async function prepareChoiceOptionsForCards(
  db: Database,
  input: {
    userId: string;
    cardIds: readonly string[];
    knowledgeContext?: string;
    now?: Date;
  },
  generate: GenerateChoiceOptions,
): Promise<PrepareChoiceOptionsResult> {
  const outcome: PrepareChoiceOptionsResult = {
    prepared: 0,
    skipped: 0,
    failed: [],
    modelCalls: 0,
  };
  for (const cardId of input.cardIds) {
    try {
      const need = await choiceOptionsNeeded(db, {
        userId: input.userId,
        cardId,
      });
      if (!need.needed) {
        outcome.skipped += 1;
        continue;
      }
      const card = await getCardById(db, cardId);
      const token = card ? await getTokenById(db, card.token_id) : undefined;
      if (!token) throw new Error(`Token not found for card ${cardId}`);

      const generation = await generate({
        id: token.id,
        question: token.question,
        concept: token.concept,
        domain: token.domain,
        bloomLevel: token.bloom_level,
        context: token.context,
        language: token.language,
        avoid: need.avoid,
      });
      outcome.modelCalls +=
        generation.result.accepted.length > 0 ||
        generation.result.rejected.some((entry) => entry.reason === "filter")
          ? 2
          : 1;
      const written = await storeDistractors(db, {
        tokenId: token.id,
        sourceHash: choiceSourceHash(token),
        source: "generated",
        entries: generation.result.accepted.map((candidate) => ({
          text: candidate.text,
          reason: candidate.reason,
          filterVerdict: candidate.filterVerdict,
        })),
        model: generation.model,
        filterModel: generation.filterModel,
      });
      if (written > 0) outcome.prepared += 1;
      else outcome.failed.push({ cardId, error: "no usable options" });
    } catch (error) {
      outcome.failed.push({
        cardId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return outcome;
}
