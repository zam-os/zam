import { describe, expect, it } from "vitest";
import { preferredRecallDisplayMode } from "../../desktop/src/panel/display-mode.js";

describe("preferredRecallDisplayMode", () => {
  it("requests picture-in-picture only when the host advertises it", () => {
    expect(
      preferredRecallDisplayMode({
        displayMode: "inline",
        availableDisplayModes: ["inline", "pip"],
      }),
    ).toBe("pip");
    expect(
      preferredRecallDisplayMode({
        displayMode: "inline",
        availableDisplayModes: ["inline", "fullscreen"],
      }),
    ).toBeUndefined();
  });

  it("does not request a redundant mode change", () => {
    expect(
      preferredRecallDisplayMode({
        displayMode: "pip",
        availableDisplayModes: ["inline", "pip"],
      }),
    ).toBeUndefined();
    expect(preferredRecallDisplayMode(undefined)).toBeUndefined();
  });
});
