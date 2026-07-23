import {
  ZAM_PAIR_TYPE,
  ZAM_PAIR_VERSION,
  type ZamPairLlmEndpoint,
  type ZamPairPayloadV1,
} from "../bridge/mobile-pairing.js";
import type { ProviderConfig } from "./llm/client.js";

function projectEndpoint(provider: ProviderConfig): ZamPairLlmEndpoint {
  return {
    enabled: provider.enabled,
    url: provider.url,
    model: provider.model,
    apiFlavor: provider.apiFlavor,
    ...(provider.apiKey ? { apiKey: provider.apiKey } : {}),
    local: provider.local,
    ...(provider.label ? { label: provider.label } : {}),
    ...(provider.fallback
      ? { fallback: projectEndpoint(provider.fallback) }
      : {}),
  };
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
    ...(input.recallProvider.enabled
      ? { llm: { recall: projectEndpoint(input.recallProvider) } }
      : {}),
    settings: { locale: input.recallProvider.locale },
  };
}
