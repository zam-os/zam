import {
  ZAM_PAIR_TYPE,
  ZAM_PAIR_VERSION,
  type ZamPairLlmEndpoint,
  type ZamPairPayloadV1,
} from "../bridge/mobile-pairing.js";
import type { ProviderConfig } from "./llm/client.js";

/**
 * Whether a paired device could ever call this endpoint itself.
 *
 * An `agent`-transport entry (ADR 2026-07-12a) is generation delegated to a
 * harness process on *this machine* — a Grok/Claude/Copilot CLI. It carries a
 * `url` only because `materializeModelEntry` defaults one in, and the desktop
 * ignores it. Projecting it would hand the phone a plausible-looking HTTP
 * endpoint that answers nothing, and — worse — one that looks like a perfectly
 * good cloud target, so the real cloud model behind it is never reached.
 */
function isPairableEndpoint(provider: ProviderConfig): boolean {
  return provider.transport !== "agent";
}

function projectEndpoint(provider: ProviderConfig): ZamPairLlmEndpoint {
  return {
    enabled: provider.enabled,
    url: provider.url,
    model: provider.model,
    apiFlavor: provider.apiFlavor,
    ...(provider.apiKey ? { apiKey: provider.apiKey } : {}),
    local: provider.local,
    ...(provider.label ? { label: provider.label } : {}),
    ...(() => {
      const fallback = firstPairable(provider.fallback);
      return fallback ? { fallback: projectEndpoint(fallback) } : {};
    })(),
  };
}

/** First endpoint in the chain a paired device could actually call. */
function firstPairable(
  provider: ProviderConfig | undefined,
): ProviderConfig | undefined {
  let candidate = provider;
  // The chain is built by resolveCapability and is finite, but a depth cap
  // keeps a hand-edited config from hanging the QR dialog.
  for (let depth = 0; candidate && depth < 8; depth++) {
    if (isPairableEndpoint(candidate)) return candidate;
    candidate = candidate.fallback;
  }
  return undefined;
}

export interface MobilePairingPayloadInput {
  databaseUrl: string;
  databaseToken: string;
  userId: string;
  recallProvider: ProviderConfig;
  createdAt?: string;
}

/** Build the secret-bearing payload only in response to an explicit UI action. */
export function createMobilePairingPayload(
  input: MobilePairingPayloadInput,
): ZamPairPayloadV1 {
  return {
    type: ZAM_PAIR_TYPE,
    version: ZAM_PAIR_VERSION,
    createdAt: input.createdAt ?? new Date().toISOString(),
    database: {
      url: input.databaseUrl,
      token: input.databaseToken,
    },
    learner: { userId: input.userId },
    // Only endpoints the device can reach on its own. When the learner's whole
    // chain is harness-backed, `llm` is omitted entirely: no paired model is a
    // state the companion already handles (self-rating), whereas a model that
    // looks present and always fails is not.
    ...(() => {
      const recall = input.recallProvider.enabled
        ? firstPairable(input.recallProvider)
        : undefined;
      return recall ? { llm: { recall: projectEndpoint(recall) } } : {};
    })(),
    settings: { locale: input.recallProvider.locale },
  };
}
