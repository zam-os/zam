import {
  ZAM_PAIR_TYPE,
  ZAM_PAIR_VERSION,
  type ZamPairPayloadV1,
} from "../bridge/mobile-pairing.js";

export interface MobilePairingPayloadInput {
  databaseUrl: string;
  databaseToken: string;
  userId: string;
  /** Learner's interface language, for the companion's first paint. */
  locale?: string;
  createdAt?: string;
}

/**
 * Build the secret-bearing payload only in response to an explicit UI action.
 *
 * The payload is deliberately thin (ADR 2026-07-23 decision 5): server database
 * URL, token, learner id, and the locale so the first screen is not blank.
 * Model configuration is **not** in here. Cloud models live in the learner
 * database (decision 4), so a companion loads them once it is online — which
 * means changing a model on the desktop reaches the phone without re-pairing,
 * and no API key is ever encoded into something a bystander can photograph.
 *
 * 0.24–0.25 did embed the recall endpoint and its key. That was a workaround
 * for the registry still being machine-local, and it is what pushed the payload
 * against `ZAM_PAIR_MAX_BYTES` and made re-pairing necessary after every model
 * change. Older payloads still parse — the companion prefers the database and
 * falls back to a stored one — so an already-paired device keeps working.
 */
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
    ...(input.locale ? { settings: { locale: input.locale } } : {}),
  };
}
