import { describe, expect, it } from "vitest";
import {
  isUiObservationReport,
  parseUiObservationLog,
  type UiObservationReport,
} from "../../../src/kernel/observation/ui-observer.js";
import { getUiObservationPath } from "../../../src/kernel/observation/ui-observer-io.js";

function report(sequence: number): UiObservationReport {
  return {
    version: 1,
    sessionId: "session-1",
    sequence,
    observedFrom: "2026-06-15T10:00:00Z",
    observedTo: "2026-06-15T10:00:01Z",
    kind: "progress",
    application: {
      processName: "explorer.exe",
      processId: 42,
      windowTitle: "Documents",
    },
    summary: "Foreground application changed.",
    actions: [{ type: "window-change", target: "explorer.exe" }],
    evidence: [{ type: "window", ref: "event:2", redacted: false }],
    candidateTokens: [],
    confidence: 0.99,
  };
}

describe("UI observer protocol", () => {
  it("accepts a valid report", () => {
    expect(isUiObservationReport(report(1))).toBe(true);
  });

  it("rejects unsupported versions and invalid confidence", () => {
    expect(isUiObservationReport({ ...report(1), version: 2 })).toBe(false);
    expect(isUiObservationReport({ ...report(1), confidence: 1.1 })).toBe(
      false,
    );
  });

  it("parses valid JSONL, skips malformed lines, and sorts sequences", () => {
    const jsonl = [
      JSON.stringify(report(2)),
      "not-json",
      JSON.stringify({ ...report(3), kind: "unsupported" }),
      JSON.stringify(report(1)),
    ].join("\n");

    expect(parseUiObservationLog(jsonl).map((item) => item.sequence)).toEqual([
      1, 2,
    ]);
  });

  it("rejects session IDs that could escape the observer directory", () => {
    expect(() => getUiObservationPath("../other-session")).toThrow(
      "Invalid observer session ID",
    );
  });
});
