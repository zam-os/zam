import { describe, expect, it } from "vitest";
import { diagnoseMobileCloudRows } from "../../mobile/src/model-registry.js";

/**
 * ADR 2026-08-09c §7. The case this exists for, verbatim from the field on
 * 2026-08-09: a paired Pixel 9 on the shared Turso library could edit cards
 * but not evaluate answers, because every model in that library was the
 * desktop's local Ollama — unreachable from a phone by construction, and
 * silent about it.
 */
describe("diagnosing why a device has no usable cloud model", () => {
  const enabled = { text: true };

  it("names a desktop-local model instead of leaving the phone silent", () => {
    const rows = [
      {
        label: "Ollama",
        url: "http://127.0.0.1:11434/v1",
        model: "gemma4:e4b",
        local: true,
        apiFlavor: "chat-completions",
        capabilities: enabled,
        detectedCapabilities: enabled,
      },
    ];
    expect(diagnoseMobileCloudRows(rows, "text")).toEqual([
      { label: "Ollama", usable: false, exclusion: "runs-on-the-desktop" },
    ]);
  });

  it("separates a missing key from a missing capability", () => {
    const base = {
      url: "https://api.example.com/v1",
      model: "m",
      apiFlavor: "chat-completions",
      local: false,
    };
    const rows = [
      {
        ...base,
        label: "no key",
        capabilities: enabled,
        detectedCapabilities: enabled,
      },
      {
        ...base,
        label: "not enabled",
        apiKey: "k",
        capabilities: {},
        detectedCapabilities: enabled,
      },
      {
        ...base,
        label: "never probed",
        apiKey: "k",
        capabilities: enabled,
        detectedCapabilities: {},
      },
    ];
    expect(
      diagnoseMobileCloudRows(rows, "text").map((row) => row.exclusion),
    ).toEqual(["no-key", "capability-not-enabled", "capability-not-detected"]);
  });

  it("reports a usable row as usable, in priority order", () => {
    const usable = {
      label: "OpenRouter",
      url: "https://openrouter.ai/api/v1",
      model: "openai/gpt-5.6-luna",
      apiFlavor: "chat-completions",
      local: false,
      apiKey: "k",
      order: 0,
      capabilities: enabled,
      detectedCapabilities: enabled,
    };
    const rows = [{ ...usable, label: "second", order: 1 }, usable];
    const diagnosis = diagnoseMobileCloudRows(rows, "text");
    expect(diagnosis[0]).toEqual({
      label: "OpenRouter",
      usable: true,
      exclusion: null,
    });
    expect(diagnosis[1].label).toBe("second");
  });

  it("does not blame the API shape for an incomplete row", () => {
    expect(
      diagnoseMobileCloudRows([{ label: "half-written" }], "text")[0].exclusion,
    ).toBe("incomplete-row");
  });
});
