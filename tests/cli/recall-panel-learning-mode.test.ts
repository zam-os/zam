import { describe, expect, it } from "vitest";
import { recallPanelLearningMode } from "../../src/cli/commands/mcp.js";

/**
 * The MCP Recall panel has no choice presentation in version one (ADR
 * 2026-09-27 Decision 10), so the new modes open in a format it has.
 */
describe("recall panel learning mode", () => {
  it("opens Choice without typing", () => {
    expect(recallPanelLearningMode("choice", null, true)).toBe("flash");
  });

  it("opens Auto in its free-recall format", () => {
    expect(recallPanelLearningMode("auto", null, true)).toBe("answer_feedback");
    expect(recallPanelLearningMode("auto", "answer", false)).toBe("flash");
    expect(recallPanelLearningMode("auto", "flash", true)).toBe("flash");
  });

  it("keeps the existing modes", () => {
    for (const mode of [
      "flash",
      "answer_feedback",
      "answer_variation",
    ] as const) {
      expect(recallPanelLearningMode(mode, null, true)).toBe(mode);
    }
  });
});
