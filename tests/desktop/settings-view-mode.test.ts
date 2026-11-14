import { describe, expect, it, vi } from "vitest";
import {
  AGENTIC_CODING_MODE_STORAGE_KEY,
  isAgenticCodingEffective,
  loadAgenticCodingMode,
  loadSettingsViewMode,
  parseAgenticCodingMode,
  parseSettingsViewMode,
  SETTINGS_VIEW_MODE_STORAGE_KEY,
  saveAgenticCodingMode,
  saveSettingsViewMode,
} from "../../desktop/src/settings-view-mode.js";
import { resolveEffectiveStudyLearningMode } from "../../desktop/src/study-learning-ui.js";

describe("desktop settings view mode", () => {
  it("defaults missing and unknown values to the learner-friendly simple view", () => {
    expect(parseSettingsViewMode(null)).toBe("simple");
    expect(parseSettingsViewMode("expert")).toBe("simple");
    expect(
      loadSettingsViewMode({
        getItem: () => null,
      }),
    ).toBe("simple");
  });

  it("restores an explicit advanced choice", () => {
    expect(
      loadSettingsViewMode({
        getItem: (key) =>
          key === SETTINGS_VIEW_MODE_STORAGE_KEY ? "advanced" : null,
      }),
    ).toBe("advanced");
  });

  it("keeps Settings usable when storage is blocked", () => {
    expect(
      loadSettingsViewMode({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe("simple");

    const setItem = vi.fn(() => {
      throw new Error("blocked");
    });
    expect(() => saveSettingsViewMode("advanced", { setItem })).not.toThrow();
    expect(setItem).toHaveBeenCalledWith(
      SETTINGS_VIEW_MODE_STORAGE_KEY,
      "advanced",
    );
  });

  it("keeps Agentic Coding (Alpha) off by default and gated behind With AI mode", () => {
    expect(parseAgenticCodingMode(null)).toBe(false);
    expect(parseAgenticCodingMode("false")).toBe(false);
    expect(parseAgenticCodingMode("true")).toBe(true);
    expect(loadAgenticCodingMode({ getItem: () => null })).toBe(false);
    expect(
      loadAgenticCodingMode({
        getItem: (key) =>
          key === AGENTIC_CODING_MODE_STORAGE_KEY ? "true" : null,
      }),
    ).toBe(true);
    expect(
      loadAgenticCodingMode({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBe(false);

    const setItem = vi.fn(() => {
      throw new Error("blocked");
    });
    expect(() => saveAgenticCodingMode(true, { setItem })).not.toThrow();
    expect(setItem).toHaveBeenCalledWith(
      AGENTIC_CODING_MODE_STORAGE_KEY,
      "true",
    );

    expect(isAgenticCodingEffective("simple", false)).toBe(false);
    expect(isAgenticCodingEffective("simple", true)).toBe(false);
    expect(isAgenticCodingEffective("advanced", false)).toBe(false);
    expect(isAgenticCodingEffective("advanced", true)).toBe(true);
  });

  it("forces Free-mode learning presentation to Auto while preserving explicit mode in With AI", () => {
    for (const mode of [
      "flash",
      "choice",
      "answer_feedback",
      "answer_variation",
      "auto",
    ] as const) {
      expect(
        resolveEffectiveStudyLearningMode({
          freeMode: true,
          learningMode: mode,
        }),
      ).toBe("auto");
      expect(
        resolveEffectiveStudyLearningMode({
          freeMode: false,
          learningMode: mode,
        }),
      ).toBe(mode);
    }
  });
});
