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

export const OPENROUTER_PROVIDER: CloudProviderDescriptor = {
  id: "openrouter",
  label: "OpenRouter",
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "xiaomi/mimo-v2.5",
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
