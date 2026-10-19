import { describe, expect, it } from "vitest";
import inventory from "../../src/kernel/library/math-inventory.json" with {
  type: "json",
};
import { PLAIN_KNOWN_WORDS } from "../../src/kernel/library/tex-plain.js";
import {
  FORBIDDEN_TEX_COMMANDS,
  isInventoryControlWord,
  MAX_TEX_LENGTH,
  texIssues,
  tokenizeTex,
} from "../../src/kernel/library/tex-tokenizer.js";

const codes = (tex: string) => texIssues(tex).map((issue) => issue.code);

describe("the formula inventory", () => {
  it("holds no forbidden command", () => {
    const forbidden = inventory.controlWords.filter((word) =>
      FORBIDDEN_TEX_COMMANDS.has(word),
    );
    expect(forbidden).toEqual([]);
  });

  it("lists exactly the environments the bundled corpus uses", () => {
    expect([...inventory.environments].sort()).toEqual([
      "aligned",
      "array",
      "cases",
      "pmatrix",
    ]);
  });

  it("names only words the plain converter knows", () => {
    const unknown = inventory.controlWords.filter(
      (word) => !PLAIN_KNOWN_WORDS.has(word),
    );
    expect(unknown).toEqual([]);
  });
});

describe("tokenizeTex", () => {
  it("accepts ordinary school formulas", () => {
    for (const tex of [
      "W_{\\text{el}} = \\frac{1}{2} C U^2",
      "\\sqrt[3]{x^2 + 1}",
      "\\text{CO}_2 + \\text{H}_2\\text{O} \\rightleftharpoons \\text{H}_2\\text{CO}_3",
      "^4_2\\text{He}",
      "\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}",
      "f(x) = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}",
      "90\\,\\% \\implies [\\mu \\pm 1{,}64\\sigma]",
      "\\theta",
    ]) {
      expect(texIssues(tex), tex).toEqual([]);
    }
  });

  it("refuses every forbidden family, even if listed by mistake", () => {
    for (const command of [
      "def",
      "gdef",
      "edef",
      "newcommand",
      "csname",
      "char",
      "expandafter",
      "href",
      "url",
      "includegraphics",
      "htmlData",
      "label",
      "tag",
    ]) {
      expect(codes(`\\${command}{x}`), command).toContain("forbidden-command");
      expect(isInventoryControlWord(command)).toBe(false);
    }
  });

  it("refuses a command outside the inventory", () => {
    expect(codes("\\color{red}{x}")).toContain("unknown-command");
    expect(codes("\\boxed{x}")).toContain("unknown-command");
  });

  it("refuses an environment outside the inventory", () => {
    expect(codes("\\begin{bmatrix} 1 \\end{bmatrix}")).toContain(
      "unknown-environment",
    );
  });

  it("refuses a column separator outside an environment", () => {
    expect(codes("a & b")).toContain("stray-alignment");
    expect(texIssues("\\text{A \\& B}")).toEqual([]);
    expect(texIssues("\\begin{pmatrix} a & b \\end{pmatrix}")).toEqual([]);
  });

  it("refuses a doubled backslash before a command name outside a matrix", () => {
    expect(codes("\\\\lambda < 4")).toContain("doubled-backslash");
    expect(
      texIssues("\\begin{pmatrix} a \\\\ b \\end{pmatrix}"),
    ).toEqual([]);
  });

  it("refuses dollars, bare comments and bare parameters", () => {
    expect(codes("x $ y")).toContain("dollar");
    expect(codes("50% + x")).toContain("comment");
    expect(codes("#1 + x")).toContain("parameter");
  });

  it("allows the escaped percent and hash", () => {
    expect(texIssues("50\\,\\%")).toEqual([]);
    expect(texIssues("\\# x")).toEqual([]);
  });

  it("refuses unbalanced braces and environments", () => {
    expect(codes("\\frac{a}{b")).toContain("unbalanced-braces");
    expect(codes("a}")).toContain("unbalanced-braces");
    expect(codes("\\begin{cases} x \\end{aligned}")).toContain(
      "unbalanced-environment",
    );
    expect(codes("\\begin{cases} x")).toContain("unbalanced-environment");
  });

  it("refuses control characters but allows a newline", () => {
    expect(codes("\text{CO}_2")).toContain("control-character");
    expect(codes("a\rb")).toContain("control-character");
    expect(texIssues("a\n+ b")).toEqual([]);
  });

  it("refuses an operator with nothing to act on", () => {
    for (const tex of ["x \\not", "\\not", "x^", "x_", "{x^}", "a_ ^2"]) {
      expect(codes(tex)).toContain("missing-operand");
    }
    expect(texIssues("3 \\not \\in A")).toEqual([]);
    expect(texIssues("x^ 2")).toEqual([]);
  });

  it("refuses direction overrides and zero-width characters", () => {
    expect(codes("x \u202E= y")).toContain("invisible-character");
    expect(codes("a\u200Bb")).toContain("invisible-character");
  });

  it("refuses an empty or over-long formula", () => {
    expect(codes("   ")).toEqual(["empty"]);
    expect(codes("x".repeat(MAX_TEX_LENGTH + 1))).toContain("too-long");
    expect(texIssues("x".repeat(MAX_TEX_LENGTH))).toEqual([]);
  });

  it("names the offending token and its offset", () => {
    const [issue] = texIssues("a + \\color{red}");
    expect(issue).toMatchObject({
      code: "unknown-command",
      offset: 4,
      token: "\\color",
    });
  });

  it("emits begin and end tokens for environments", () => {
    const { tokens } = tokenizeTex("\\begin{cases} a \\end{cases}");
    expect(tokens[0]).toMatchObject({ kind: "begin", env: "cases" });
    expect(tokens[tokens.length - 1]).toMatchObject({
      kind: "end",
      env: "cases",
    });
  });
});
