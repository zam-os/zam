/**
 * ADR 2026-10-08b D5: `zam settings show` masks secrets.
 */

import { describe, expect, it } from "vitest";
import { maskSecret, maskSettingValue } from "../../src/kernel/index.js";

describe("secret masking", () => {
  it("masks secret settings by name", () => {
    expect(maskSettingValue("llm.api_key", "sk-or-v1-Fake5ecretValue1234")).toBe(
      "••••1234",
    );
    expect(maskSettingValue("llm.vision.api_key", "short")).toBe("••••");
    expect(maskSettingValue("turso.token", "eyJhbGciOiJFZERTQSJ9.Fake")).toBe(
      "••••Fake",
    );
    expect(maskSettingValue("system.locale", "de")).toBe("de");
  });

  it("masks secret properties inside JSON values", () => {
    const value = JSON.stringify({
      models: [
        { id: "a", url: "https://api.test", apiKey: "sk-Fake5ecretValueABCD" },
        { id: "b", nested: { token: "tok-Fake5ecretValue9876" } },
      ],
    });
    const masked = maskSettingValue("ai.models", value);
    expect(masked).not.toContain("Fake5ecret");
    expect(JSON.parse(masked).models[0]).toEqual({
      id: "a",
      url: "https://api.test",
      apiKey: "••••ABCD",
    });
    expect(JSON.parse(masked).models[1].nested.token).toBe("••••9876");
  });

  it("never shows a short secret's characters", () => {
    expect(maskSecret("abcdefghijkl")).toBe("••••");
    expect(maskSecret("")).toBe("");
  });
});
