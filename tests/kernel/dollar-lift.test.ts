import { describe, expect, it } from "vitest";
import {
  DollarLiftError,
  liftDollarMath,
  looksLikeMath,
} from "../../src/kernel/library/dollar-lift.js";

describe("liftDollarMath (strict)", () => {
  it("lifts inline formulas between text", () => {
    const { segments } = liftDollarMath(
      "Wie ändert sich $W = \\frac{1}{2} C U^2$, wenn $d$ verdoppelt wird?",
      "strict",
    );
    expect(segments).toEqual([
      { type: "text", text: "Wie ändert sich " },
      { type: "math", tex: "W = \\frac{1}{2} C U^2" },
      { type: "text", text: ", wenn " },
      { type: "math", tex: "d" },
      { type: "text", text: " verdoppelt wird?" },
    ]);
  });

  it("consumes $$…$$ before $…$ when a string mixes both", () => {
    const { segments } = liftDollarMath(
      "Ein Teilchen ($q$) tritt ein: $$F = q v B$$ und es gilt $r = \\frac{m v}{q B}$.",
      "strict",
    );
    expect(segments.filter((s) => s.type === "math")).toEqual([
      { type: "math", tex: "q" },
      { type: "math", tex: "F = q v B", block: true },
      { type: "math", tex: "r = \\frac{m v}{q B}" },
    ]);
  });

  it("throws on an unbalanced dollar instead of guessing", () => {
    expect(() => liftDollarMath("Preis $5 und $x$", "strict")).toThrow(
      DollarLiftError,
    );
    expect(() => liftDollarMath("$$a + b$ c", "strict")).toThrow(
      DollarLiftError,
    );
  });

  it("keeps an escaped dollar as text", () => {
    const { segments } = liftDollarMath("Kosten: 5 \\$ und $x^2$", "strict");
    expect(segments).toEqual([
      { type: "text", text: "Kosten: 5 \\$ und " },
      { type: "math", tex: "x^2" },
    ]);
  });

  it("keeps a damaging tab at a formula's edge for the tokenizer to see", () => {
    const { segments } = liftDollarMath("Methan ($\text{CH}_4$)", "strict");
    expect(segments[1]).toEqual({ type: "math", tex: "\text{CH}_4" });
  });

  it("returns text unchanged when there is no dollar", () => {
    expect(liftDollarMath("Kein Mathe hier.", "strict").segments).toEqual([
      { type: "text", text: "Kein Mathe hier." },
    ]);
  });
});

describe("liftDollarMath (lenient)", () => {
  it("lifts math-looking spans", () => {
    const { segments, unlifted } = liftDollarMath(
      "Berechne $x^2 + 1$ für $x = 3$.",
      "lenient",
    );
    expect(segments.filter((s) => s.type === "math")).toEqual([
      { type: "math", tex: "x^2 + 1" },
      { type: "math", tex: "x = 3" },
    ]);
    expect(unlifted).toEqual([]);
  });

  it("leaves shell variables and prices as text and reports them", () => {
    const { segments, unlifted } = liftDollarMath(
      "Setze $JAVA_HOME und $PATH, das kostet 5 $ und 6 $.",
      "lenient",
    );
    expect(segments).toEqual([
      {
        type: "text",
        text: "Setze $JAVA_HOME und $PATH, das kostet 5 $ und 6 $.",
      },
    ]);
    expect(unlifted.length).toBeGreaterThan(0);
  });

  it("never throws on an unbalanced dollar", () => {
    const { segments, unlifted } = liftDollarMath("Nur $HOME hier", "lenient");
    expect(segments).toEqual([{ type: "text", text: "Nur $HOME hier" }]);
    expect(unlifted[0]).toMatchObject({ reason: "unbalanced" });
  });

  it("does not pair a closing dollar followed by a digit", () => {
    const { segments } = liftDollarMath("von $5 bis $10", "lenient");
    expect(segments).toEqual([{ type: "text", text: "von $5 bis $10" }]);
  });
});

describe("looksLikeMath", () => {
  it.each([
    ["x", true],
    ["pK", true],
    ["v1", true],
    ["x^2", true],
    ["a = b", true],
    ["\\alpha", true],
    ["2 + 3", true],
    ["HOME", false],
    ["5 und 6 ", false],
    ["", false],
  ])("%s → %s", (content, expected) => {
    expect(looksLikeMath(content)).toBe(expected);
  });
});
