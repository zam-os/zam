import { describe, expect, it } from "vitest";
import {
  AI_TIER_PREFERENCE_STORAGE_KEY,
  parseStoredAiPreferences,
  readAiPreference,
  serializeAiPreferences,
} from "../../mobile/src/ai/tier-preference.js";
import { DEFAULT_AI_TIER_PREFERENCES } from "../../src/kernel/ai/tier-preference.js";

describe("device-local AI tier preferences (ADR 2026-08-09c §3)", () => {
  it("keeps the choice out of the shared database", () => {
    // Two devices on one Turso library have different silicon, so "prefer
    // local" cannot mean the same thing on both.
    expect(AI_TIER_PREFERENCE_STORAGE_KEY).toMatch(/^zam\./);
  });

  it("falls back to the shipped default per capability", () => {
    const stored = parseStoredAiPreferences('{"recall":"device-only"}');
    expect(readAiPreference(stored, "recall")).toBe("device-only");
    expect(readAiPreference(stored, "text")).toBe(
      DEFAULT_AI_TIER_PREFERENCES.text,
    );
  });

  it("survives a corrupt or hand-edited value", () => {
    expect(parseStoredAiPreferences("not json")).toEqual({});
    expect(parseStoredAiPreferences("[1,2]")).toEqual({});
    expect(parseStoredAiPreferences('{"recall":"cheapest"}')).toEqual({});
    expect(parseStoredAiPreferences('{"nonsense":"device-only"}')).toEqual({});
    expect(readAiPreference(parseStoredAiPreferences(null), "recall")).toBe(
      DEFAULT_AI_TIER_PREFERENCES.recall,
    );
  });

  it("does not freeze a default the learner never chose", () => {
    // Storing today's default would keep it after the shipped judgement moves
    // — and it is expected to move as on-device quality improves.
    const serialized = serializeAiPreferences({
      recall: DEFAULT_AI_TIER_PREFERENCES.recall,
      text: "device-first",
    });
    expect(JSON.parse(serialized)).toEqual({ text: "device-first" });
  });

  it("round-trips an explicit choice", () => {
    const stored = parseStoredAiPreferences(
      serializeAiPreferences({ recall: "quality-first" }),
    );
    expect(readAiPreference(stored, "recall")).toBe("quality-first");
  });
});
