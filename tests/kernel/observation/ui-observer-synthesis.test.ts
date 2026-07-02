import { describe, expect, it } from "vitest";
import type { Token } from "../../../src/kernel/models/token.js";
import type { UiObservationReport } from "../../../src/kernel/observation/ui-observer.js";
import { buildUiSynthesisCandidates } from "../../../src/kernel/observation/ui-observer-synthesis.js";

function token(slug: string): Token {
  return {
    id: `token-${slug}`,
    slug,
    concept: `Concept for ${slug}`,
    domain: "ui",
    bloom_level: 3,
    symbiosis_mode: "assist",
    created_at: "2026-06-15T10:00:00Z",
    deprecated_at: null,
  };
}

function report(
  sequence: number,
  overrides: Partial<UiObservationReport> = {},
): UiObservationReport {
  return {
    version: 1,
    sessionId: "ui-session",
    sequence,
    observedFrom: "2026-06-15T10:00:00Z",
    observedTo: "2026-06-15T10:00:01Z",
    kind: "step-completed",
    application: { processName: "explorer.exe" },
    summary: "Created a folder.",
    actions: [{ type: "click", target: "New folder" }],
    evidence: [],
    candidateTokens: [
      {
        slug: "explorer-create-folder",
        confidence: 0.92,
        rationale: "Folder creation observed.",
      },
    ],
    confidence: 0.9,
    ...overrides,
  };
}

describe("UI observer synthesis", () => {
  it("builds candidates from observer report candidate tokens", () => {
    const tokens = new Map([
      ["explorer-create-folder", token("explorer-create-folder")],
    ]);
    const { candidates, skippedLowConfidence } = buildUiSynthesisCandidates(
      [report(1)],
      tokens,
      new Set(),
      "medium",
    );

    expect(skippedLowConfidence).toBe(0);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      tokenSlug: "explorer-create-folder",
      inferredRating: 4,
      confidence: "high",
    });
    expect(candidates[0].matchedCommandTexts).toContain("Created a folder.");
  });

  it("skips low-confidence candidate tokens", () => {
    const tokens = new Map([
      ["explorer-create-folder", token("explorer-create-folder")],
    ]);
    const { candidates, skippedLowConfidence } = buildUiSynthesisCandidates(
      [
        report(1, {
          candidateTokens: [
            {
              slug: "explorer-create-folder",
              confidence: 0.5,
              rationale: "Weak signal.",
            },
          ],
        }),
      ],
      tokens,
      new Set(),
      "high",
    );

    expect(candidates).toHaveLength(0);
    expect(skippedLowConfidence).toBe(1);
  });
});
