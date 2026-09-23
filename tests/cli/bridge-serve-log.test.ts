import { describe, expect, it } from "vitest";
import { reportedError } from "../../src/cli/commands/bridge.js";

// `bridge serve` logs failed requests to ~/.zam/desktop-bridge.log. Some
// commands report failure inside a normal response instead of throwing, and
// those must be logged too — without turning status answers into noise.
describe("reportedError", () => {
  it("reads the error a command reported in its response", () => {
    expect(
      reportedError({ success: false, error: "Claude Code timed out" }),
    ).toBe("Claude Code timed out");
    expect(reportedError({ ok: false, error: "Ollama is not running" })).toBe(
      "Ollama is not running",
    );
  });

  it("treats a false without an error string as a status", () => {
    expect(reportedError({ ok: false, reason: "remote" })).toBeNull();
    expect(
      reportedError({ success: false, bitwardenRequired: true }),
    ).toBeNull();
  });

  it("ignores successful and non-object results", () => {
    expect(reportedError({ success: true, error: "stale" })).toBeNull();
    expect(reportedError([{ success: false, error: "x" }])).toBeNull();
    expect(reportedError(null)).toBeNull();
    expect(reportedError("done")).toBeNull();
  });
});
