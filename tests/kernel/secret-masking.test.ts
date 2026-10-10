/**
 * ADR 2026-10-08b D5: `zam settings show` and the bridge's log lines mask
 * secrets.
 */

import { describe, expect, it } from "vitest";
import {
  maskSecret,
  maskSettingValue,
  redactCommand,
} from "../../src/kernel/index.js";

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

describe("bridge log lines (desktop-bridge.log)", () => {
  // The serve log writes every failed request's error through redactCommand;
  // a provider's error text can echo the key it rejected.
  it("hides a key a provider echoes in its error", () => {
    for (const [line, secret] of [
      [
        "request failed | command model-upsert | 12 ms | Incorrect API key provided: sk-proj-Fake5ecretValue1234567890abcd",
        "Fake5ecretValue",
      ],
      [
        "request failed | command model-reprobe | 9 ms | Authorization: Bearer sk-or-v1-0123456789abcdef0123456789abcdef",
        "0123456789abcdef",
      ],
      [
        "serve request failed: libsql://db.turso.io?authToken=Fake5ecretTokenValue123456",
        "Fake5ecretToken",
      ],
    ] as const) {
      expect(redactCommand(line)).not.toContain(secret);
    }
  });

  it("keeps the command name and timing readable", () => {
    expect(redactCommand("request slow | command list-tokens | 3000 ms")).toBe(
      "request slow | command list-tokens | 3000 ms",
    );
  });
});
