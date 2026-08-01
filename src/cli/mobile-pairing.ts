import {
  ZAM_PAIR_MAX_BYTES,
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

/**
 * Speech adds one constraint on top: audio routes exist only in the OpenAI
 * shape. An `anthropic-messages` endpoint flagged `stt` is a misconfiguration,
 * and projecting it would give the companion something it can only fail on —
 * the same rule `resolveSpeechEndpoint` applies on the desktop.
 */
function isPairableSpeechEndpoint(provider: ProviderConfig): boolean {
  return (
    isPairableEndpoint(provider) && provider.apiFlavor === "chat-completions"
  );
}

function projectEndpoint(
  provider: ProviderConfig,
  withFallback = true,
): ZamPairLlmEndpoint {
  return {
    enabled: provider.enabled,
    url: provider.url,
    model: provider.model,
    apiFlavor: provider.apiFlavor,
    ...(provider.apiKey ? { apiKey: provider.apiKey } : {}),
    local: provider.local,
    ...(provider.label ? { label: provider.label } : {}),
    ...(() => {
      if (!withFallback) return {};
      const fallback = firstPairable(provider.fallback, isPairableEndpoint);
      return fallback ? { fallback: projectEndpoint(fallback) } : {};
    })(),
  };
}

/** First endpoint in the chain a paired device could actually call. */
function firstPairable(
  provider: ProviderConfig | undefined,
  usable: (candidate: ProviderConfig) => boolean,
): ProviderConfig | undefined {
  let candidate = provider;
  // The chain is built by resolveCapability and is finite, but a depth cap
  // keeps a hand-edited config from hanging the QR dialog.
  for (let depth = 0; candidate && depth < 8; depth++) {
    if (usable(candidate)) return candidate;
    candidate = candidate.fallback;
  }
  return undefined;
}

export interface MobilePairingPayloadInput {
  databaseUrl: string;
  databaseToken: string;
  userId: string;
  recallProvider: ProviderConfig;
  /** Speech-to-text model for voice mode's cloud tier, if one is configured. */
  sttProvider?: ProviderConfig | null;
  /** Text-to-speech model for voice mode's cloud tier, if one is configured. */
  ttsProvider?: ProviderConfig | null;
  createdAt?: string;
}

function payloadBytes(payload: ZamPairPayloadV1): number {
  return new TextEncoder().encode(JSON.stringify(payload)).byteLength;
}

/** Build the secret-bearing payload only in response to an explicit UI action. */
export function createMobilePairingPayload(
  input: MobilePairingPayloadInput,
): ZamPairPayloadV1 {
  // Only endpoints the device can reach on its own. When the learner's whole
  // chain is harness-backed, the member is omitted: no paired model is a state
  // the companion already handles (self-rating, or the device speech tier),
  // whereas a model that looks present and always fails is not.
  const recall = input.recallProvider.enabled
    ? firstPairable(input.recallProvider, isPairableEndpoint)
    : undefined;
  const stt = input.sttProvider?.enabled
    ? firstPairable(input.sttProvider, isPairableSpeechEndpoint)
    : undefined;
  const tts = input.ttsProvider?.enabled
    ? firstPairable(input.ttsProvider, isPairableSpeechEndpoint)
    : undefined;

  const build = (withStt: boolean, withTts: boolean): ZamPairPayloadV1 => {
    const llm = {
      ...(recall ? { recall: projectEndpoint(recall) } : {}),
      // Speech endpoints are projected head-only. Their fallback chains would
      // multiply the payload against a hard QR budget, and a second speech
      // model is a far smaller loss than a pairing code that will not scan.
      ...(withStt && stt ? { stt: projectEndpoint(stt, false) } : {}),
      ...(withTts && tts ? { tts: projectEndpoint(tts, false) } : {}),
    };
    return {
      type: ZAM_PAIR_TYPE,
      version: ZAM_PAIR_VERSION,
      createdAt: input.createdAt ?? new Date().toISOString(),
      database: {
        url: input.databaseUrl,
        token: input.databaseToken,
      },
      learner: { userId: input.userId },
      ...(Object.keys(llm).length > 0 ? { llm } : {}),
      settings: { locale: input.recallProvider.locale },
    };
  };

  // The QR budget is fixed by the code's error correction, so something has to
  // give when a learner has long keys and a deep chain. Recall never gives: it
  // is what makes evaluation work at all. Between the two speech halves,
  // text-to-speech goes first — every device has a serviceable built-in voice,
  // while on-device *recognition* is the half that is genuinely behind and the
  // reason the cloud tier exists.
  for (const [withStt, withTts] of [
    [true, true],
    [true, false],
    [false, false],
  ] as const) {
    const payload = build(withStt, withTts);
    if (payloadBytes(payload) <= ZAM_PAIR_MAX_BYTES) return payload;
  }
  // Still over budget with no speech endpoint at all: hand back the smallest
  // payload and let the shared validator name the real problem (an oversized
  // token or URL) rather than blaming a feature that is no longer in it.
  return build(false, false);
}
