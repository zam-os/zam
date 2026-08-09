/**
 * On-device vs. cloud resolution for every generative capability
 * (ADR 2026-08-09b).
 *
 * ADR 2026-07-31 gave speech a device tier, a three-way preference and a
 * *reason* attached to every decision, because a fallback the learner is not
 * told about makes the preference dishonest. This module is that same model
 * generalised: recall evaluation, card text, image import and embeddings get
 * the identical vocabulary, and `voice` keeps its existing resolver by
 * delegating the shared primitive here.
 *
 * Pure functions only. What each tier can serve *right now* is measured by the
 * surfaces (a Gemini Nano status check, a configured cloud row) and passed in.
 */

export type AiTier = "local" | "cloud";

/** Capabilities a learner can steer independently. */
export type AiCapability = "recall" | "text" | "image" | "voice" | "embedding";

export const AI_CAPABILITIES: readonly AiCapability[] = Object.freeze([
  "recall",
  "text",
  "image",
  "voice",
  "embedding",
]);

/**
 * Same three values speech has used since ADR 2026-07-31, so a learner meets
 * one vocabulary rather than two.
 */
export type AiTierPreference = "device-only" | "device-first" | "quality-first";

export const AI_TIER_PREFERENCES: readonly AiTierPreference[] = Object.freeze([
  "device-only",
  "device-first",
  "quality-first",
]);

export function isAiTierPreference(value: unknown): value is AiTierPreference {
  return (
    typeof value === "string" &&
    (AI_TIER_PREFERENCES as readonly string[]).includes(value)
  );
}

/**
 * Defaults differ per capability because the risk does (ADR 2026-08-09b §2).
 *
 * Recall and voice run many times a day, the learner sees the result and can
 * overrule it, and a weaker judgement costs one card — device-first. Card text
 * and image import produce content that is authored once and reviewed for
 * years, where a mistranslated term compounds on every repetition and the
 * learner cannot spot it later — quality-first, on a good cloud model.
 *
 * These are a judgement about the models of 2026. When on-device quality
 * catches up, this table changes; the mechanism does not.
 */
export const DEFAULT_AI_TIER_PREFERENCES: Readonly<
  Record<AiCapability, AiTierPreference>
> = Object.freeze({
  recall: "device-first",
  text: "quality-first",
  image: "quality-first",
  voice: "device-first",
  embedding: "quality-first",
});

export type AiPlatform = "android" | "ios" | "desktop";

/**
 * Whether a platform has an on-device implementation *at all* — a structural
 * fact about today's APIs, not a runtime measurement.
 *
 * A `false` here means Settings states "not possible on this device" instead
 * of offering a choice that silently does nothing (ADR 2026-08-09b §4).
 *
 * - **Android**: ML Kit GenAI's Prompt API is text in, text out, so it serves
 *   recall and card text. Image *description* is a different feature and does
 *   not extract card structure; there is no on-device embedding API.
 * - **iOS**: Apple's Foundation Models framework needs A17 Pro / M-series, and
 *   no device in the field-test range qualifies — the slot stays reserved
 *   (ADR 2026-08-08 §6). Platform speech is available regardless.
 * - **Desktop**: Foundry/Ollama already cover text, image and embeddings, but
 *   only on accelerated hardware — the runtime half of that answer comes from
 *   ADR 2026-08-02's classification, through `availability`.
 */
export const DEVICE_TIER_SUPPORT: Readonly<
  Record<AiPlatform, Readonly<Record<AiCapability, boolean>>>
> = Object.freeze({
  android: Object.freeze({
    recall: true,
    text: true,
    image: false,
    voice: true,
    embedding: false,
  }),
  ios: Object.freeze({
    recall: false,
    text: false,
    image: false,
    voice: true,
    embedding: false,
  }),
  desktop: Object.freeze({
    recall: true,
    text: true,
    image: true,
    voice: true,
    embedding: true,
  }),
});

export function hasDeviceTier(
  platform: AiPlatform,
  capability: AiCapability,
): boolean {
  return DEVICE_TIER_SUPPORT[platform][capability];
}

/**
 * Whether Settings should offer the preference control for this capability.
 *
 * Without a device tier there is nothing to prefer, and a control that cannot
 * change the outcome is worse than no control.
 */
export function isAiPreferenceConfigurable(
  platform: AiPlatform,
  capability: AiCapability,
): boolean {
  return hasDeviceTier(platform, capability);
}

/** Which tiers can actually serve a capability right now. */
export interface AiTierAvailability {
  local: boolean;
  cloud: boolean;
}

/**
 * Why a capability ended up where it did. Surfaces turn this into copy, so a
 * learner is never silently switched to a paid third party.
 */
export type AiTierReason =
  | "preferred"
  | "fell-back-to-cloud"
  | "fell-back-to-local"
  | "unavailable-device-only"
  | "unavailable";

export interface AiTierDecision {
  tier: AiTier | null;
  reason: AiTierReason;
}

/**
 * Resolve one preference against what the two tiers can serve.
 *
 * Shared with `resolveVoiceEnginePlan`, which is where these semantics were
 * first settled: `device-only` never reaches the cloud, and any other
 * preference that cannot use its first choice reports the fallback rather
 * than performing it quietly.
 */
export function decideAiTier(
  preference: AiTierPreference,
  availability: AiTierAvailability,
): AiTierDecision {
  if (preference === "device-only") {
    return availability.local
      ? { tier: "local", reason: "preferred" }
      : { tier: null, reason: "unavailable-device-only" };
  }
  const [first, second]: AiTier[] =
    preference === "quality-first" ? ["cloud", "local"] : ["local", "cloud"];
  if (availability[first]) return { tier: first, reason: "preferred" };
  if (availability[second]) {
    return {
      tier: second,
      reason: second === "cloud" ? "fell-back-to-cloud" : "fell-back-to-local",
    };
  }
  return { tier: null, reason: "unavailable" };
}

/**
 * Resolve a capability on a platform, folding in whether a device tier exists.
 *
 * A platform without one cannot serve `local` however the runtime answers, so
 * the availability it reports for that tier is ignored rather than trusted:
 * a stub that answers is not a feature (the lesson from the iPad reporting a
 * denied microphone for a subsystem that was not there).
 */
export function resolveAiCapabilityTier(
  platform: AiPlatform,
  capability: AiCapability,
  preference: AiTierPreference,
  availability: AiTierAvailability,
): AiTierDecision {
  const local = hasDeviceTier(platform, capability) && availability.local;
  return decideAiTier(preference, { local, cloud: availability.cloud });
}

export type AiTierPlan = Record<AiCapability, AiTierDecision>;

/** Resolve every capability at once, for a Settings screen or a session start. */
export function resolveAiTierPlan(
  platform: AiPlatform,
  preferences: Partial<Record<AiCapability, AiTierPreference>>,
  availability: Partial<Record<AiCapability, AiTierAvailability>>,
): AiTierPlan {
  const plan = {} as AiTierPlan;
  for (const capability of AI_CAPABILITIES) {
    plan[capability] = resolveAiCapabilityTier(
      platform,
      capability,
      preferences[capability] ?? DEFAULT_AI_TIER_PREFERENCES[capability],
      availability[capability] ?? { local: false, cloud: false },
    );
  }
  return plan;
}
