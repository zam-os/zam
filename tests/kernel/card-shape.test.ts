import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
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

  it("keeps the names-only overview card at Bloom 1 or 2, where its points are scored", () => {
    // Recalling names is Remember, at most Understand; that is why the
    // overview card stays at 1 or 2. Both levels must also be scored, so each
    // name counts as a point.
    expect(CARD_SHAPE_RULES[1]).toContain(
      "its Bloom level is 1 (Remember) or 2 (Understand)",
    );
    expect(supportsAnswerPoints(1)).toBe(true);
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
    // The card-text rule names the inventory's environments (ADR
    // 2026-10-14b), so the rules import the tokenizer, which imports only
    // the inventory JSON. Nothing in that chain may reach a Node built-in.
    const imports = (file: string) =>
      [
        ...readFileSync(
          join(process.cwd(), "src", "kernel", "library", file),
          "utf8",
        ).matchAll(/^import .* from "([^"]+)"/gm),
      ].map((match) => match[1]);
    expect(imports("card-shape.ts")).toEqual(["./tex-tokenizer.js"]);
    expect(imports("tex-tokenizer.ts")).toEqual(["./math-inventory.json"]);
  });
});
