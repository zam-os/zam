import { describe, expect, it } from "vitest";
import {
  AI_CAPABILITIES,
  type AiCapability,
  type AiPlatform,
  DEFAULT_AI_TIER_PREFERENCES,
  decideAiTier,
  hasDeviceTier,
  isAiPreferenceConfigurable,
  isAiTierPreference,
  resolveAiCapabilityTier,
  resolveAiTierPlan,
} from "../../src/kernel/ai/tier-preference.js";
import {
  resolveVoiceEnginePlan,
  VOICE_ENGINE_PREFERENCES,
} from "../../src/kernel/recall/voice-review.js";

const both = { local: true, cloud: true };
const cloudOnly = { local: false, cloud: true };
const deviceOnly = { local: true, cloud: false };
const neither = { local: false, cloud: false };

describe("AI tier preference (ADR 2026-08-09c)", () => {
  it("defaults recall and voice to the device, content to a good cloud model", () => {
    // The load-bearing asymmetry: a weak evaluation costs one card the learner
    // sees and can overrule; a weak card is authored once and repeated for
    // years.
    expect(DEFAULT_AI_TIER_PREFERENCES.recall).toBe("device-first");
    expect(DEFAULT_AI_TIER_PREFERENCES.voice).toBe("device-first");
    expect(DEFAULT_AI_TIER_PREFERENCES.text).toBe("quality-first");
    expect(DEFAULT_AI_TIER_PREFERENCES.image).toBe("quality-first");
  });

  it("shares one vocabulary with the speech preference it generalises", () => {
    for (const preference of VOICE_ENGINE_PREFERENCES) {
      expect(isAiTierPreference(preference)).toBe(true);
    }
    expect(isAiTierPreference("cheapest")).toBe(false);
  });

  it("never reaches the cloud under device-only, and says why", () => {
    expect(decideAiTier("device-only", both)).toEqual({
      tier: "local",
      reason: "preferred",
    });
    expect(decideAiTier("device-only", cloudOnly)).toEqual({
      tier: null,
      reason: "unavailable-device-only",
    });
  });

  it("reports a fallback instead of performing it silently", () => {
    expect(decideAiTier("device-first", cloudOnly)).toEqual({
      tier: "cloud",
      reason: "fell-back-to-cloud",
    });
    expect(decideAiTier("quality-first", deviceOnly)).toEqual({
      tier: "local",
      reason: "fell-back-to-local",
    });
    expect(decideAiTier("device-first", neither)).toEqual({
      tier: null,
      reason: "unavailable",
    });
  });

  it("resolves speech through exactly the same primitive", () => {
    // Voice keeps its own API; drift between the two would let one surface
    // report a fallback the other performs quietly.
    const plan = resolveVoiceEnginePlan("device-first", {
      stt: cloudOnly,
      tts: deviceOnly,
    });
    expect(plan.stt).toEqual(decideAiTier("device-first", cloudOnly));
    expect(plan.tts).toEqual(decideAiTier("device-first", deviceOnly));
  });

  it("ignores a runtime that claims local support the platform lacks", () => {
    // A stub that answers is not a feature: Android has no on-device embedding
    // API, so a truthy availability there must not route work to it.
    expect(hasDeviceTier("android", "embedding")).toBe(false);
    expect(
      resolveAiCapabilityTier("android", "embedding", "device-only", both),
    ).toEqual({ tier: null, reason: "unavailable-device-only" });
    expect(
      resolveAiCapabilityTier("android", "embedding", "device-first", both),
    ).toEqual({ tier: "cloud", reason: "fell-back-to-cloud" });
  });

  it("offers the control only where a device tier could exist", () => {
    expect(isAiPreferenceConfigurable("android", "recall")).toBe(true);
    expect(isAiPreferenceConfigurable("android", "text")).toBe(true);
    expect(isAiPreferenceConfigurable("android", "image")).toBe(false);
    expect(isAiPreferenceConfigurable("android", "embedding")).toBe(false);

    // iOS keeps a reserved slot until Apple Intelligence hardware is in range
    // (ADR 2026-08-08 §6); platform speech is available regardless.
    expect(isAiPreferenceConfigurable("ios", "recall")).toBe(false);
    expect(isAiPreferenceConfigurable("ios", "voice")).toBe(true);
  });

  it("plans every capability, falling back to the defaults", () => {
    const plan = resolveAiTierPlan(
      "android",
      {},
      Object.fromEntries(
        AI_CAPABILITIES.map((capability) => [capability, both]),
      ) as Record<AiCapability, typeof both>,
    );
    // recall/voice prefer the device and get it; text prefers the cloud by
    // default; image and embedding have no device tier on Android at all.
    expect(plan.recall).toEqual({ tier: "local", reason: "preferred" });
    expect(plan.voice).toEqual({ tier: "local", reason: "preferred" });
    expect(plan.text).toEqual({ tier: "cloud", reason: "preferred" });
    expect(plan.image).toEqual({ tier: "cloud", reason: "preferred" });
    expect(plan.embedding).toEqual({ tier: "cloud", reason: "preferred" });
  });

  it("treats an unmeasured capability as unavailable rather than assuming", () => {
    const plan = resolveAiTierPlan("desktop" as AiPlatform, {}, {});
    for (const capability of AI_CAPABILITIES) {
      expect(plan[capability].tier).toBeNull();
    }
    expect(plan.recall.reason).toBe("unavailable");
  });
});
