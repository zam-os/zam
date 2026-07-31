import { describe, expect, it } from "vitest";
import {
  DEFAULT_VOICE_ENGINE_PREFERENCE,
  isVoiceEnginePreference,
  isVoiceModeUsable,
  planLeavesDevice,
  resolveVoiceEnginePlan,
  type VoiceAvailability,
  type VoiceEnginePreference,
} from "../../src/kernel/recall/voice-review.js";

const availability = (
  stt: [boolean, boolean],
  tts: [boolean, boolean],
): VoiceAvailability => ({
  stt: { local: stt[0], cloud: stt[1] },
  tts: { local: tts[0], cloud: tts[1] },
});

const both = availability([true, true], [true, true]);

describe("voice engine tiering", () => {
  it("defaults to device-first", () => {
    expect(DEFAULT_VOICE_ENGINE_PREFERENCE).toBe("device-first");
  });

  it("validates persisted preference values", () => {
    for (const value of ["device-only", "device-first", "quality-first"]) {
      expect(isVoiceEnginePreference(value)).toBe(true);
    }
    for (const value of ["local", "", null, undefined, 3, "Device-Only"]) {
      expect(isVoiceEnginePreference(value)).toBe(false);
    }
  });

  it("keeps everything on the device when both tiers are available", () => {
    const plan = resolveVoiceEnginePlan("device-first", both);
    expect(plan.stt).toEqual({ tier: "local", reason: "preferred" });
    expect(plan.tts).toEqual({ tier: "local", reason: "preferred" });
    expect(planLeavesDevice(plan)).toBe(false);
  });

  it("prefers the cloud only when the user asked for quality", () => {
    const plan = resolveVoiceEnginePlan("quality-first", both);
    expect(plan.stt.tier).toBe("cloud");
    expect(plan.tts.tier).toBe("cloud");
    expect(plan.stt.reason).toBe("preferred");
    expect(planLeavesDevice(plan)).toBe(true);
  });

  it("falls back per capability, not per session", () => {
    // Linux: local synthesis via speech-dispatcher, no local recognizer.
    const plan = resolveVoiceEnginePlan(
      "device-first",
      availability([false, true], [true, true]),
    );
    expect(plan.stt).toEqual({ tier: "cloud", reason: "fell-back-to-cloud" });
    expect(plan.tts).toEqual({ tier: "local", reason: "preferred" });
    expect(isVoiceModeUsable(plan)).toBe(true);
    expect(planLeavesDevice(plan)).toBe(true);
  });

  it("falls back to the device when no cloud model is configured", () => {
    const plan = resolveVoiceEnginePlan(
      "quality-first",
      availability([true, false], [true, false]),
    );
    expect(plan.stt).toEqual({ tier: "local", reason: "fell-back-to-local" });
    expect(plan.tts).toEqual({ tier: "local", reason: "fell-back-to-local" });
    expect(planLeavesDevice(plan)).toBe(false);
  });

  it("never silently leaves the device under device-only", () => {
    const plan = resolveVoiceEnginePlan(
      "device-only",
      availability([false, true], [true, true]),
    );
    expect(plan.stt).toEqual({
      tier: null,
      reason: "unavailable-device-only",
    });
    expect(plan.tts.tier).toBe("local");
    expect(isVoiceModeUsable(plan)).toBe(false);
    expect(planLeavesDevice(plan)).toBe(false);
  });

  it("reports voice mode unusable when a capability has no tier at all", () => {
    const plan = resolveVoiceEnginePlan(
      "device-first",
      availability([false, false], [true, true]),
    );
    expect(plan.stt).toEqual({ tier: null, reason: "unavailable" });
    expect(isVoiceModeUsable(plan)).toBe(false);
  });

  it("requires both halves of the loop", () => {
    const preferences: VoiceEnginePreference[] = [
      "device-only",
      "device-first",
      "quality-first",
    ];
    for (const preference of preferences) {
      const noTts = resolveVoiceEnginePlan(
        preference,
        availability([true, true], [false, false]),
      );
      expect(isVoiceModeUsable(noTts)).toBe(false);
    }
  });
});
