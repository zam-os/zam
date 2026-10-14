import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MAX_SCORED_BLOOM_LEVEL,
  parseAnswerPoints,
  supportsAnswerPoints,
} from "../../src/kernel/library/answer-points.js";
import {
  CARD_SHAPE_RULES,
  cardShapeRuleLines,
} from "../../src/kernel/library/card-shape.js";

/** The owner's card-shape rule (2026-10-14), shared by every card prompt. */
describe("card-shape rules", () => {
  it("asks for one point per card, and a names-only overview for a closed set", () => {
    const text = CARD_SHAPE_RULES.join("\n");
    expect(text).toContain("One point per card.");
    expect(text).toContain("lists only the members' names");
    expect(text).toContain("each as its own list item on its own line");
    expect(text).toContain(
      "Never put a member's explanation, reason, example or effect on the overview card.",
    );
    expect(text).toContain("also gets its own card");
  });

  it("gives the overview card a Bloom level its points are scored at", () => {
    // Points are scored only up to MAX_SCORED_BLOOM_LEVEL; the overview card
    // stays below it so every name is scored.
    expect(CARD_SHAPE_RULES[1]).toContain(
      "its Bloom level is 1 (Remember) or 2 (Understand)",
    );
    expect(MAX_SCORED_BLOOM_LEVEL).toBeGreaterThanOrEqual(2);
    expect(supportsAnswerPoints(2)).toBe(true);
  });

  it("scores each name of a names-only overview answer as its own point", () => {
    expect(
      parseAnswerPoints(
        "- Bitübertragungsschicht\n- Sicherungsschicht\n- Vermittlungsschicht",
      ),
    ).toHaveLength(3);
  });

  it("names no numeric range a split or foundations prompt could anchor on", () => {
    for (const rule of CARD_SHAPE_RULES) {
      expect(rule).not.toMatch(/\b\d+\s+(?:to|or|-)\s+\d+\b/);
    }
  });

  it("renders one bullet line per rule", () => {
    const lines = cardShapeRuleLines().split("\n");
    expect(lines).toEqual(CARD_SHAPE_RULES.map((rule) => `- ${rule}`));
  });

  it("stays free of Node built-ins, for Mobile's bundle", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "kernel", "library", "card-shape.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/^import /m);
  });
});
