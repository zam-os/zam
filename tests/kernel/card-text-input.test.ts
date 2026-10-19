import { describe, expect, it } from "vitest";
import { validateCardText } from "../../src/kernel/library/card-text.js";
import {
  dropEmphasis,
  formulasWithoutSpeech,
  readCardTextInput,
  repairEatenBackslashes,
  texAsText,
  withSpeech,
} from "../../src/kernel/library/card-text-input.js";

const read = (value: unknown, mode: "agent" | "import" = "import") => {
  const result = readCardTextInput(value, mode);
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.value;
};

describe("readCardTextInput (ADR 2026-10-14b Decision 6)", () => {
  it("lifts a formula out of a string and reports its missing speech", () => {
    const value = read("Berechne $x^2$ für $x = 3$.");
    expect(value.segments).toEqual([
      { type: "text", text: "Berechne " },
      { type: "math", tex: "x^2" },
      { type: "text", text: " für " },
      { type: "math", tex: "x = 3" },
      { type: "text", text: "." },
    ]);
    expect(value.plain).toBe("Berechne x² für x = 3.");
    expect(value.missingSpeech).toEqual([1, 3]);
    expect(value.notes).toEqual([]);
  });

  it("keeps plain text plain, and notes a dollar that is not math", () => {
    const value = read("Setze $HOME auf dein Verzeichnis.");
    expect(value.segments).toBeNull();
    expect(value.plain).toBe("Setze $HOME auf dein Verzeichnis.");
    expect(value.notes).toEqual([
      { kind: "dollar", text: "$HOME auf dein Verzeichnis." },
    ]);
  });

  it("drops emphasis, also around a formula, and writes bare commands as Unicode", () => {
    expect(read("**Wichtig:** der Winkel \\beta").plain).toBe(
      "Wichtig: der Winkel β",
    );
    const value = read("**Alkene ($C_nH_{2n}$)** reagieren");
    expect(value.segments?.[0]).toEqual({ type: "text", text: "Alkene (" });
    expect(value.plain).toBe("Alkene (C_nH_2n) reagieren");
  });

  it("accepts segments with speech as they are", () => {
    const segments = [
      { type: "text", text: "Wie groß ist " },
      { type: "math", tex: "W_{\\text{el}}", speech: "W el" },
      { type: "text", text: "?" },
    ];
    const value = read(segments, "agent");
    expect(value.segments).toEqual(segments);
    expect(value.missingSpeech).toEqual([]);
  });

  it("lifts dollars a model left inside a text segment", () => {
    const value = read([{ type: "text", text: "Löse $2x = 4$." }]);
    expect(value.segments?.[1]).toEqual({ type: "math", tex: "2x = 4" });
  });

  it("names a refused formula for an agent", () => {
    const result = readCardTextInput("Siehe $\\href{x}{y}$", "agent");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0].path).toBe("[1].tex");
      expect(result.issues[0].code).toBe("tex-forbidden-command");
    }
  });

  it("keeps a refused formula as readable text in an import, and notes it", () => {
    const value = read("Siehe $\\href{x}{y}$ dort");
    expect(value.segments).toBeNull();
    expect(value.plain).toBe("Siehe href x y dort");
    expect(value.notes).toEqual([{ kind: "formula", text: "\\href{x}{y}" }]);
  });

  it("repairs backslashes a JSON escape ate", () => {
    // What JSON.parse makes of \frac, \text, \beta and \nu written with one
    // backslash: a form feed, tabs, a backspace and a newline.
    const damaged = JSON.parse(
      '"W_{\\\\text{el}} = \\frac{1}{2} \\text{J} \\beta \\nu"',
    );
    const repaired = "W_{\\text{el}} = \\frac{1}{2} \\text{J} \\beta \\nu";
    expect(repairEatenBackslashes(damaged)).toBe(repaired);
    expect(repairEatenBackslashes("a\nb")).toBe("a\nb");
    const value = read(
      [{ type: "math", tex: damaged, speech: "W el" }],
      "agent",
    );
    expect(value.segments?.[0]).toMatchObject({ tex: repaired });
  });

  it("drops a reading that is not plain words in an import, names it for an agent", () => {
    const formula = [
      { type: "math", tex: "x^2", speech: "x <b>Quadrat</b>" },
      { type: "math", tex: "y", speech: "y".repeat(700) },
    ];
    const imported = read(formula);
    expect(imported.segments).toEqual([
      { type: "math", tex: "x^2" },
      { type: "math", tex: "y" },
    ]);
    expect(imported.missingSpeech).toEqual([0, 1]);
    const agent = readCardTextInput(formula, "agent");
    expect(agent.ok).toBe(false);
    if (!agent.ok) {
      expect(agent.issues.map((issue) => issue.path)).toEqual([
        "[0].speech",
        "[1].speech",
      ]);
    }
  });

  it("counts a blank reading as missing", () => {
    const value = read([{ type: "math", tex: "x", speech: "   " }]);
    expect(value.missingSpeech).toEqual([0]);
    expect(
      validateCardText([{ type: "math", tex: "x", speech: "  " }], {
        requireSpeech: true,
      }).map((issue) => issue.code),
    ).toEqual(["missing-speech"]);
  });

  it("refuses images, empty text and other values", () => {
    const image = readCardTextInput(
      [{ type: "image", media: "a".repeat(64), alt: "Skizze" }],
      "import",
    );
    expect(image.ok).toBe(false);
    if (!image.ok) expect(image.issues[0].code).toBe("image-unsupported");
    expect(readCardTextInput("  ", "import").ok).toBe(false);
    expect(readCardTextInput(42, "import").ok).toBe(false);
    const shape = readCardTextInput([{ type: "math" }], "import");
    expect(shape.ok).toBe(false);
  });
});

describe("speech helpers", () => {
  it("fills missing speech from a reading list and skips invalid readings", () => {
    const segments = read("Mit $a^2$ und $b^2$").segments ?? [];
    const filled = withSpeech(
      segments,
      new Map([
        ["a^2", "a Quadrat"],
        ["b^2", "b \\cdot"],
      ]),
    );
    expect(filled[1]).toEqual({
      type: "math",
      tex: "a^2",
      speech: "a Quadrat",
    });
    expect(formulasWithoutSpeech(filled)).toEqual(["b^2"]);
  });

  it("dropEmphasis keeps nested and formula-spanning text intact", () => {
    expect(
      dropEmphasis([{ type: "text", text: "*„fertig“**,** sagte er.*" }]),
    ).toEqual([{ type: "text", text: "„fertig“, sagte er." }]);
  });

  it("texAsText leaves no TeX syntax", () => {
    expect(texAsText("\\frac{1}{2")).not.toMatch(/[\\{}]/);
    expect(texAsText("\\alpha + 1")).toBe("α + 1");
  });
});
