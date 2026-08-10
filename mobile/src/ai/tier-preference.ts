/**
 * Per-capability AI tier preference on the device (ADR 2026-08-09c §3).
 *
 * Device-local on purpose. A Pixel 9 with AICore and an A15 iPad can read the
 * same `ai.models.cloud` rows out of one shared Turso library, and a stored
 * "prefer local" would mean opposite things on them — so this never enters the
 * database. `localStorage` is where the companion already keeps
 * `zam.voice-engine.v1` for exactly the same reason.
 *
 * Voice keeps its own key: it shipped first, learners have already chosen
 * there, and moving it would silently reset that choice.
 */

import {
  type AiCapability,
  type AiPlatform,
  type AiTierPreference,
  DEFAULT_AI_TIER_PREFERENCES,
  isAiPreferenceConfigurable,
  isAiTierPreference,
} from "../../../src/kernel/ai/tier-preference.js";

export const AI_TIER_PREFERENCE_STORAGE_KEY = "zam.ai-tier-preference.v1";

export type StoredAiPreferences = Partial<
  Record<AiCapability, AiTierPreference>
>;

/**
 * Parse the stored map, keeping only recognised entries.
 *
 * A capability added in a later release is simply absent, and a hand-edited or
 * half-written value falls back to its default rather than taking the whole
 * map with it — the same degradation rule the workload settings use.
 */
export function parseStoredAiPreferences(
  raw: string | null | undefined,
): StoredAiPreferences {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

  const preferences: StoredAiPreferences = {};
  for (const [capability, value] of Object.entries(parsed)) {
    if (
      capability in DEFAULT_AI_TIER_PREFERENCES &&
      isAiTierPreference(value)
    ) {
      preferences[capability as AiCapability] = value;
    }
  }
  return preferences;
}

export function readAiPreference(
  stored: StoredAiPreferences,
  capability: AiCapability,
): AiTierPreference {
  return stored[capability] ?? DEFAULT_AI_TIER_PREFERENCES[capability];
}

/** Serialize for storage, dropping entries that match the shipped default. */
export function serializeAiPreferences(
  preferences: StoredAiPreferences,
): string {
  const explicit: StoredAiPreferences = {};
  for (const [capability, value] of Object.entries(preferences)) {
    const key = capability as AiCapability;
    // Storing a default would freeze it: a learner who never touched the
    // control should follow the shipped judgement when it changes.
    if (value && value !== DEFAULT_AI_TIER_PREFERENCES[key]) {
      explicit[key] = value;
    }
  }
  return JSON.stringify(explicit);
}

/**
 * Capabilities the local-AI settings section covers.
 *
 * `voice` is deliberately absent: it has had its own engine control since ADR
 * 2026-07-31, with its own stored value and its own device signals. Two
 * controls for one decision is worse than one in the wrong place.
 */
export const AI_SETTINGS_CAPABILITIES: readonly AiCapability[] = Object.freeze([
  "recall",
  "text",
  "image",
  "embedding",
]);

/**
 * What the device tier can do for a capability, as a Settings row says it.
 *
 * `unsupported` is a statement about the platform's APIs, `unknown` about a
 * probe that did not answer — the learner needs to be able to tell those
 * apart, because only the second might change on a retry.
 */
export type AiDeviceState =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable"
  | "unsupported"
  | "unknown";

export interface AiSettingsRow {
  capability: AiCapability;
  /** False where the platform has no on-device implementation at all. */
  configurable: boolean;
  preference: AiTierPreference;
  deviceState: AiDeviceState;
  /** Whether "Prepare now" can do anything from here. */
  canPrepare: boolean;
}

function deviceStateFrom(status: string | null | undefined): AiDeviceState {
  switch (status) {
    case "available":
    case "downloadable":
    case "downloading":
    case "unavailable":
      return status;
    default:
      return "unknown";
  }
}

/**
 * Compose the rows for the local-AI settings section.
 *
 * Pure so the decisions that matter — which rows offer a choice, which say
 * "not possible here", which can start a download — are testable without a
 * device or a DOM.
 */
export function buildAiSettingsRows(
  platform: AiPlatform,
  stored: StoredAiPreferences,
  deviceStatus: string | null | undefined,
): AiSettingsRow[] {
  return AI_SETTINGS_CAPABILITIES.map((capability) => {
    const configurable = isAiPreferenceConfigurable(platform, capability);
    const deviceState = configurable
      ? deviceStateFrom(deviceStatus)
      : "unsupported";
    return {
      capability,
      configurable,
      preference: readAiPreference(stored, capability),
      deviceState,
      // Downloading is already under way, and available needs nothing.
      canPrepare: configurable && deviceState === "downloadable",
    };
  });
}
