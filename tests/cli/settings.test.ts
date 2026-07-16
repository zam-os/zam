import { describe, expect, it } from "vitest";
import { normalizeSettingValue } from "../../src/cli/commands/settings.js";

describe("settings command helpers", () => {
  it("normalizes boolean aliases for boolean settings", () => {
    expect(normalizeSettingValue("llm.enabled", "on")).toBe("true");
    expect(normalizeSettingValue("llm.enabled", "disabled")).toBe("false");
    expect(normalizeSettingValue("llm.vision.enabled", "enable")).toBe("true");
    expect(normalizeSettingValue("llm.vision.enabled", "off")).toBe("false");
    expect(normalizeSettingValue("recall.quick_mode", "enabled")).toBe("true");
    expect(normalizeSettingValue("recall.quick_mode", "off")).toBe("false");
  });

  it("leaves non-boolean settings untouched", () => {
    expect(normalizeSettingValue("llm.vision.model", "on")).toBe("on");
  });
});
