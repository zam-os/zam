import { describe, expect, it, vi } from "vitest";
import {
  loadSettingsViewMode,
  parseSettingsViewMode,
  SETTINGS_VIEW_MODE_STORAGE_KEY,
  saveSettingsViewMode,
} from "../../desktop/src/settings-view-mode.js";

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
});
