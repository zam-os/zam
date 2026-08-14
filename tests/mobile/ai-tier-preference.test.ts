import { describe, expect, it } from "vitest";
import {
  AI_TIER_PREFERENCE_STORAGE_KEY,
  buildAiSettingsRows,
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

describe("local AI settings rows (ADR 2026-08-09c §4, §6)", () => {
  it("offers a choice only where the platform has a device tier", () => {
    const rows = buildAiSettingsRows("android", {}, "available");
    const byCapability = Object.fromEntries(
      rows.map((row) => [row.capability, row]),
    );
    expect(byCapability.recall.configurable).toBe(true);
    expect(byCapability.text.configurable).toBe(true);
    // No ML Kit image-to-cards and no on-device embedding API: the row states
    // the fact instead of pretending a choice exists.
    expect(byCapability.image.configurable).toBe(false);
    expect(byCapability.image.deviceState).toBe("unsupported");
    expect(byCapability.embedding.deviceState).toBe("unsupported");
  });

  it("leaves voice to the control it already has", () => {
    expect(
      buildAiSettingsRows("android", {}, "available").map((r) => r.capability),
    ).not.toContain("voice");
  });

  it("offers Prepare now only when a download would do something", () => {
    const prepareable = (status: string) =>
      buildAiSettingsRows("android", {}, status).find(
        (row) => row.capability === "recall",
      )?.canPrepare;
    expect(prepareable("downloadable")).toBe(true);
    expect(prepareable("available")).toBe(false);
    expect(prepareable("downloading")).toBe(false);
    expect(prepareable("unavailable")).toBe(false);
  });

  it("distinguishes a platform that cannot from a probe that did not answer", () => {
    const unknown = buildAiSettingsRows("android", {}, null).find(
      (row) => row.capability === "recall",
    );
    expect(unknown?.deviceState).toBe("unknown");
    const ios = buildAiSettingsRows("ios", {}, "available").find(
      (row) => row.capability === "recall",
    );
    expect(ios?.deviceState).toBe("unsupported");
  });

  it("carries the stored preference, defaulting per capability", () => {
    const rows = buildAiSettingsRows(
      "android",
      { recall: "device-only" },
      "available",
    );
    const byCapability = Object.fromEntries(
      rows.map((row) => [row.capability, row]),
    );
    expect(byCapability.recall.preference).toBe("device-only");
    expect(byCapability.text.preference).toBe(DEFAULT_AI_TIER_PREFERENCES.text);
  });
});
