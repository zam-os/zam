/**
 * Cloud LLM provider descriptors (ADR 2026-07-24 §5) — the data behind the
 * onboarding model page and `zam init`'s cloud path. Pure data, no HTTP: the
 * connect flow lives in cloud-connect.ts, and client.ts reads the default
 * model from here, so this module must stay a leaf (no imports from other
 * llm/ modules).
 *
 * OpenRouter is the first provider, not an exclusive one — a second provider
 * is a new descriptor row plus copy, not a wizard redesign.
 */

import type { ModelCapability } from "../../kernel/index.js";

export interface CloudProviderDescriptor {
  id: string;
  /** Proper-noun provider name, shown as-is in every locale. */
  label: string;
  /** OpenAI-compatible base URL requests go to. */
  baseUrl: string;
  /** Model registered on connect; one entry filling text AND vision. */
  defaultModel: string;
  /** Credential ref in ~/.zam/credentials.json — key is never stored inline. */
  apiKeyRef: string;
  /** Capabilities the default model is registered with. */
  capabilities: ModelCapability[];
  /**
   * Authenticated key-metadata endpoint (relative to baseUrl), used to verify
   * a pasted key: the /models catalog is public on OpenRouter, so a metadata
   * probe alone cannot tell a bad key from a good one.
   */
  keyCheckPath: string;
  /** Deep links — ZAM never creates accounts, adds credit, or creates keys. */
  keysUrl: string;
  creditsUrl: string;
  privacyUrl: string;
  /**
   * Smallest one-time credit purchase the provider accepts, in USD.
   * OpenRouter: $5 per transaction (terms, verified 2026-07-24) — the figure
   * the onboarding copy must state (ADR open question 6).
   */
  minTopUpUsd: number;
}

/**
 * Recommended OpenRouter chat models for first-run and Settings.
 *
 * Order is preference for the select. Criteria: multimodal (text+image for
 * photo import), fast enough for card evaluation, current enough knowledge
 * for school/study. Switching is one tap in Settings — the list is for
 * trying, not a permanent ranking.
 *
 * `xiaomi/mimo-v2.5` stays last: multimodal and cheap on paper, but as a
 * default it burned the evaluation output budget thinking (field reports
 * 2026-08 on iPad).
 */
export const OPENROUTER_RECOMMENDED_MODELS = [
  {
    id: "openai/gpt-5.6-luna",
    /** Short label for a select control; proper nouns stay untranslated. */
    label: "GPT-5.6 Luna",
  },
  {
    // Cheapest current Gemini Flash Lite that is still strong enough for
    // evaluation + photo import — the 3.x Flash Lite tiers are several times
    // more expensive per token and not competitive as a ZAM default.
    id: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash Lite",
  },
  {
    id: "qwen/qwen3.7-flash",
    label: "Qwen3.7 Flash",
  },
  {
    id: "openai/gpt-5-nano",
    label: "GPT-5 Nano",
  },
  {
    id: "xiaomi/mimo-v2.5",
    label: "MiMo V2.5",
  },
  // Still reachable as "Other model…" or by typing the id; not recommended.
] as const;

/**
 * Retired ZAM defaults that connect/migrate should replace in place.
 *
 * Only models that must not remain as a silent default — never anything still
 * offered in {@link OPENROUTER_RECOMMENDED_MODELS}, or a hand-picked choice
 * would be overwritten on the next app open.
 */
export const OPENROUTER_LEGACY_DEFAULT_MODELS = ["xiaomi/mimo-v2.5"] as const;

/**
 * Reasoning effort for short OpenRouter evaluation calls.
 *
 * Card grading wants a small JSON object, not a chain of thought. `none`
 * keeps Flash/Luna from spending the output budget on thinking (the MiMo
 * failure mode on iPad). Learners who want deeper reasoning can pick a
 * heavier model; the evaluation path stays cheap and fast.
 */
export const OPENROUTER_EVALUATION_REASONING_EFFORT = "none" as const;

export const OPENROUTER_PROVIDER: CloudProviderDescriptor = {
  id: "openrouter",
  label: "OpenRouter",
  baseUrl: "https://openrouter.ai/api/v1",
  // GPT-5.6 Luna: fast multimodal OpenAI tier (~$0.10/$0.60 per M, 1M
  // context). Evaluation uses reasoning.effort "none". Other models stay one
  // Settings tap away (catalogue verified 2026-08-08).
  defaultModel: "openai/gpt-5.6-luna",
  apiKeyRef: "openrouter",
  capabilities: ["text", "image"],
  keyCheckPath: "/auth/key",
  keysUrl: "https://openrouter.ai/settings/keys",
  creditsUrl: "https://openrouter.ai/settings/credits",
  privacyUrl: "https://openrouter.ai/settings/privacy",
  minTopUpUsd: 5,
};

export const CLOUD_PROVIDERS: readonly CloudProviderDescriptor[] = [
  OPENROUTER_PROVIDER,
];

export function getCloudProvider(
  id: string,
): CloudProviderDescriptor | undefined {
  return CLOUD_PROVIDERS.find((provider) => provider.id === id);
}
