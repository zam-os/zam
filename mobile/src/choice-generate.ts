/**
 * Choice options generated on the device's behalf (ADR 2026-09-27 Decision 6).
 *
 * Mobile generates through the connected cloud `text` model, the same chain
 * translation uses; there is no on-device model for writing options. A learner
 * whose text preference is `device-only` therefore gets no generated options —
 * their cards come as choices only from curated and derived options, and
 * otherwise in a recall format. That degradation is accepted in the ADR.
 *
 * Callers run this in the background for the next few cards; it never blocks
 * the card on screen.
 */

import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import {
  type ChoiceGeneration,
  type PrepareChoiceOptionsResult,
  prepareChoiceOptionsForCards,
} from "../../src/cli/llm/choice-prepare.js";
import {
  asSingleMessage,
  CHOICE_FILTER_MAX_OUTPUT_TOKENS,
  CHOICE_GENERATION_MAX_OUTPUT_TOKENS,
  type ChoiceCompletion,
  type ChoiceGenerationItem,
  runChoiceGeneration,
} from "../../src/cli/llm/choice-prompt.js";
import type { AiTierPreference } from "../../src/kernel/ai/tier-preference.js";
import type { Database } from "../../src/kernel/db/types.js";
import { type EvaluationPorts, generateViaHttp } from "./evaluate.js";
import { resolveMobileCloudChain } from "./model-registry.js";

export interface MobileChoicePrepareResult extends PrepareChoiceOptionsResult {
  /** Why nothing was generated, when nothing could be. */
  reason?: "device-only" | "no_model";
}

/** Walk an endpoint chain the way translation does: the first answer wins. */
function chainCompletion(
  chain: ZamPairLlmEndpoint,
  maxTokens: number,
  fetchText: EvaluationPorts["fetchText"],
): ChoiceCompletion {
  return async (prompt) => {
    const errors: string[] = [];
    for (
      let current: ZamPairLlmEndpoint | undefined = chain;
      current;
      current = current.fallback
    ) {
      try {
        return await generateViaHttp(
          current,
          asSingleMessage(prompt),
          fetchText,
          maxTokens,
        );
      } catch (error) {
        errors.push(
          `${current.label || current.model}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
    throw new Error(errors.join("; ") || "no endpoint answered");
  };
}

export async function prepareMobileChoiceOptions(
  db: Database,
  input: {
    userId: string;
    cardIds: readonly string[];
    preference: AiTierPreference;
    knowledgeContext?: string;
  },
  ports: { fetchText?: EvaluationPorts["fetchText"] } = {},
  resolve: (
    db: Database,
  ) => Promise<ZamPairLlmEndpoint | null> = resolveMobileCloudChainText,
): Promise<MobileChoicePrepareResult> {
  const nothing = { prepared: 0, skipped: 0, failed: [], modelCalls: 0 };
  if (input.preference === "device-only") {
    return { ...nothing, reason: "device-only" };
  }
  const generator = await resolve(db);
  if (!generator) return { ...nothing, reason: "no_model" };
  // Mobile connects one text chain; the filter runs on it too. Desktop can
  // prefer a second model for the filter because it has a recall role.
  const filter = generator;

  return prepareChoiceOptionsForCards(
    db,
    {
      userId: input.userId,
      cardIds: input.cardIds,
      knowledgeContext: input.knowledgeContext,
    },
    async (item: ChoiceGenerationItem): Promise<ChoiceGeneration> => ({
      result: await runChoiceGeneration({
        item,
        complete: chainCompletion(
          generator,
          CHOICE_GENERATION_MAX_OUTPUT_TOKENS,
          ports.fetchText,
        ),
        completeFilter: chainCompletion(
          filter,
          CHOICE_FILTER_MAX_OUTPUT_TOKENS,
          ports.fetchText,
        ),
      }),
      model: generator.label || generator.model,
      filterModel: filter.label || filter.model,
    }),
  );
}

function resolveMobileCloudChainText(
  db: Database,
): Promise<ZamPairLlmEndpoint | null> {
  return resolveMobileCloudChain(db, "text");
}
