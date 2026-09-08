/**
 * Required points of a reference answer (ADR 2026-09-08).
 *
 * The points are derived from the answer text rather than stored beside it, so
 * these tests are the whole contract: what counts as a list, what counts as
 * prose, and what a coverage score implies for the rating. Everything that
 * shows a count or scores an answer reads it from here.
 */

import { describe, expect, it } from "vitest";
import {
  countAnswerPoints,
  MAX_SCORED_BLOOM_LEVEL,
  parseAnswerPoints,
  ratingFromCoverage,
  shouldShowPointCount,
  supportsAnswerPoints,
} from "../../src/kernel/library/answer-points.js";

describe("parseAnswerPoints", () => {
  it("treats prose as exactly one point", () => {
    expect(parseAnswerPoints("Die Hauptstadt von Bayern ist München.")).toEqual([
      "Die Hauptstadt von Bayern ist München.",
    ]);
  });

  it("treats a multi-line prose answer as one point, not one per line", () => {
    // Only list markers make points. A wrapped sentence is still one fact.
    expect(
      countAnswerPoints("Der Impuls ist\ndas Produkt aus Masse\nund Geschwindigkeit."),
    ).toBe(1);
  });

  it("makes one point per list item", () => {
    expect(
      parseAnswerPoints(
        "Der Satz des Pythagoras:\n- gilt nur für rechtwinklige Dreiecke\n- a² + b² = c²",
      ),
    ).toEqual(["gilt nur für rechtwinklige Dreiecke", "a² + b² = c²"]);
  });

  it("accepts the bullet and numbering styles an author might reach for", () => {
    for (const marker of ["-", "*", "•", "·", "–", "—", "1.", "2)"]) {
      expect(countAnswerPoints(`${marker} eins\n${marker} zwei`)).toBe(2);
    }
  });

  it("keeps the lead-in line out of the points it introduces", () => {
    const points = parseAnswerPoints("Zwei Bedingungen:\n- eine\n- zwei");
    expect(points).toEqual(["eine", "zwei"]);
  });

  it("ignores indentation and blank lines between items", () => {
    expect(countAnswerPoints("  - eins\n\n   - zwei\n\n")).toBe(2);
  });

  it("does not mistake a dash inside a sentence for a list", () => {
    expect(countAnswerPoints("Impuls — das Produkt aus Masse und Tempo.")).toBe(
      1,
    );
  });

  it("asks for nothing when the answer is empty", () => {
    expect(parseAnswerPoints("   \n\n ")).toEqual([]);
    expect(countAnswerPoints("")).toBe(0);
  });
});

describe("supportsAnswerPoints", () => {
  it("scores Remember through Apply, but not Analyse or Synthesise", () => {
    // Bloom 4-5 answers are arguments, not enumerable details; a count there
    // would be fabricated, so those cards keep the unscored behaviour.
    expect(MAX_SCORED_BLOOM_LEVEL).toBe(3);
    for (const level of [1, 2, 3]) {
      expect(supportsAnswerPoints(level)).toBe(true);
    }
    for (const level of [4, 5]) {
      expect(supportsAnswerPoints(level)).toBe(false);
    }
  });

  it("refuses a nonsense level rather than treating it as scorable", () => {
    expect(supportsAnswerPoints(Number.NaN)).toBe(false);
  });
});

describe("shouldShowPointCount", () => {
  const twoPoints = "- eins\n- zwei";

  it("shows the count only when more than one point is asked for", () => {
    expect(shouldShowPointCount(twoPoints, 1)).toBe(true);
    // "1 point" is noise: it tells the learner nothing they can act on.
    expect(shouldShowPointCount("nur eine Sache", 1)).toBe(false);
  });

  it("stays silent above Bloom 3 even for a list", () => {
    expect(shouldShowPointCount(twoPoints, 4)).toBe(false);
  });
});

describe("ratingFromCoverage", () => {
  it("makes any missing point a failed recall", () => {
    // Three of four is still rating 1. Coverage never maps onto an
    // intermediate rating (ADR 2026-09-08 §4).
    expect(ratingFromCoverage(3, 4)).toBe(1);
    expect(ratingFromCoverage(1, 2)).toBe(1);
    expect(ratingFromCoverage(0, 1)).toBe(1);
  });

  it("leaves the choice open on full coverage", () => {
    // Which of Hard/Good/Easy applies is effort, which nothing here observes.
    expect(ratingFromCoverage(1, 1)).toBeNull();
    expect(ratingFromCoverage(4, 4)).toBeNull();
  });

  it("clamps a score outside the range instead of trusting it", () => {
    expect(ratingFromCoverage(9, 2)).toBeNull();
    expect(ratingFromCoverage(-1, 2)).toBe(1);
  });

  it("has no opinion when there is nothing to score", () => {
    expect(ratingFromCoverage(0, 0)).toBeNull();
  });
});
