/**
 * Per-capability AI tier preference on the device (ADR 2026-08-09b §3).
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
  type AiTierPreference,
  DEFAULT_AI_TIER_PREFERENCES,
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
