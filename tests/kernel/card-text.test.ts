import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type CardText,
  findPlainTextMarkup,
  MAX_SPEECH_LENGTH,
  normalizeCardText,
  plainProjection,
  spokenProjection,
  validateCardText,
} from "../../src/kernel/library/card-text.js";
import { liftDollarMath } from "../../src/kernel/library/dollar-lift.js";
import { texIssues } from "../../src/kernel/library/tex-tokenizer.js";

const HASH = "a".repeat(64);
const markupCodes = (text: string) =>
  findPlainTextMarkup(text).map((markup) => markup.code);

describe("findPlainTextMarkup (ADR 2026-10-14b Decision 2)", () => {
  it("flags LaTeX spans and bare commands", () => {
    expect(markupCodes("Wie groß ist $W = \\frac{1}{2} C U^2$?")).toEqual([
      "latex-span",
    ]);
    expect(markupCodes("den Schnittwinkel \\beta zwischen")).toEqual([
      "latex-command",
    ]);
  });

  it("leaves Windows paths alone", () => {
    expect(markupCodes("Absoluter Pfad: C:\\Schule\\Mathe\\test.pdf")).toEqual(
      [],
    );
    expect(markupCodes("Relativ: ..\\Bilder\\logo.png")).toEqual([]);
    expect(markupCodes("C:\\Gymnasium\\NuT\\referat.pdf")).toEqual([]);
  });

  it("leaves shell variables, prices and code alone", () => {
    expect(markupCodes("Setze $JAVA_HOME und $PATH")).toEqual([]);
    expect(markupCodes("kostet 5 $ und 6 $")).toEqual([]);
    expect(markupCodes("Die Methode __init__ in Python")).toEqual([]);
    expect(markupCodes("glob src/*.ts und lib/*.js")).toEqual([]);
    expect(markupCodes("2*b*c*cos(alpha)")).toEqual([]);
    expect(markupCodes("snake_case_name")).toEqual([]);
    expect(markupCodes("a ** b ** c")).toEqual([]);
  });

  it("flags Markdown emphasis", () => {
    expect(markupCodes("Das ist **wichtig**.")).toEqual(["emphasis"]);
    expect(markupCodes("Merkregel: *'Ta-Ta-Ta-Tü'* hilft")).toEqual([
      "emphasis",
    ]);
    expect(markupCodes("*Beispiel*: zwei Fälle")).toEqual(["emphasis"]);
    expect(markupCodes("__sehr wichtig__")).toEqual(["emphasis"]);
  });

  it("keeps list markers and flags only the emphasis inside a list line", () => {
    expect(markupCodes("- Punkt\n* Punkt\n1. Punkt\n2) Punkt")).toEqual([]);
    const markups = findPlainTextMarkup("* **Umfang**: die Länge des Rands");
    expect(markups).toHaveLength(1);
    expect(markups[0]).toMatchObject({ code: "emphasis", text: "**Umfang**" });
  });

  it("flags control characters but not newlines", () => {
    expect(markupCodes("a\tb")).toEqual(["control-character"]);
    expect(markupCodes("a\rb")).toEqual(["control-character"]);
    expect(markupCodes("Zeile 1\nZeile 2")).toEqual([]);
  });
});

describe("validateCardText", () => {
  const card: CardText = [
    { type: "text", text: "Wie ändert sich " },
    {
      type: "math",
      tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
      speech: "W el gleich ein halb C U Quadrat",
    },
    { type: "text", text: "?" },
  ];

  it("accepts a well-formed card", () => {
    expect(validateCardText(card)).toEqual([]);
    expect(validateCardText(card, { requireSpeech: true })).toEqual([]);
  });

  it("requires speech only when asked", () => {
    const silent: CardText = [{ type: "math", tex: "x^2" }];
    expect(validateCardText(silent)).toEqual([]);
    expect(validateCardText(silent, { requireSpeech: true })).toMatchObject([
      { path: "[0].speech", code: "missing-speech" },
    ]);
  });

  it("refuses markup in text segments and speech", () => {
    expect(
      validateCardText([{ type: "text", text: "**fett**" }]),
    ).toMatchObject([{ path: "[0].text", code: "markup-emphasis" }]);
    expect(
      validateCardText([{ type: "math", tex: "x", speech: "\\frac x" }]).map(
        (i) => i.code,
      ),
    ).toContain("speech-markup");
  });

  it("refuses a formula the tokenizer refuses", () => {
    const issues = validateCardText([{ type: "math", tex: "\\href{x}{y}" }]);
    expect(issues.map((i) => i.code)).toContain("tex-forbidden-command");
  });

  it("refuses over-long speech", () => {
    const issues = validateCardText([
      { type: "math", tex: "x", speech: "a".repeat(MAX_SPEECH_LENGTH + 1) },
    ]);
    expect(issues.map((i) => i.code)).toContain("speech-too-long");
  });

  it("requires an image's alt text and a media hash", () => {
    expect(
      validateCardText([{ type: "image", media: HASH, alt: "Ein Dreieck" }]),
    ).toEqual([]);
    const issues = validateCardText([
      { type: "image", media: "x.png", alt: " " },
    ]);
    expect(issues.map((i) => i.code).sort()).toEqual([
      "bad-media",
      "missing-alt",
    ]);
  });

  it("refuses unknown types, unknown keys and non-lists", () => {
    expect(validateCardText("text")).toMatchObject([{ code: "not-a-list" }]);
    expect(validateCardText([])).toMatchObject([{ code: "empty" }]);
    expect(validateCardText([{ type: "html", html: "<b>" }])).toMatchObject([
      { code: "unknown-type" },
    ]);
    expect(
      validateCardText([{ type: "text", text: "x", onclick: "alert(1)" }]),
    ).toMatchObject([{ path: "[0].onclick", code: "unknown-key" }]);
  });
});

describe("projections", () => {
  const card: CardText = [
    { type: "text", text: "Wie ändert sich " },
    {
      type: "math",
      tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
      speech: "W el gleich ein halb C U Quadrat",
    },
    { type: "text", text: ", wenn " },
    { type: "math", tex: "d" },
    { type: "text", text: " verdoppelt wird?" },
  ];

  it("plain projection writes formulas as Unicode", () => {
    expect(plainProjection(card)).toBe(
      "Wie ändert sich W_el = ½CU², wenn d verdoppelt wird?",
    );
  });

  it("spoken projection reads speech, falling back to the plain form", () => {
    expect(spokenProjection(card)).toBe(
      "Wie ändert sich W el gleich ein halb C U Quadrat, wenn d verdoppelt wird?",
    );
  });

  it("puts a block formula on its own line and reads images by alt", () => {
    const block: CardText = [
      { type: "text", text: "Gegeben:" },
      { type: "math", tex: "f(x) = x^2", block: true },
      { type: "text", text: "Bestimme f(3)." },
      { type: "image", media: HASH, alt: "Parabel", inline: true },
    ];
    expect(plainProjection(block)).toBe(
      "Gegeben:\nf(x) = x²\nBestimme f(3).Parabel",
    );
    expect(spokenProjection(block)).toBe(
      "Gegeben: f(x) = x² Bestimme f(3).Parabel",
    );
  });

  it("normalizeCardText merges text and drops empty segments", () => {
    expect(
      normalizeCardText([
        { type: "text", text: "a" },
        { type: "text", text: "" },
        { type: "text", text: "b" },
        { type: "math", tex: "x" },
      ]),
    ).toEqual([
      { type: "text", text: "ab" },
      { type: "math", tex: "x" },
    ]);
  });
});

describe("the bundled corpus against the formula rules", () => {
  /**
   * Formulas the bundled tiles carry broken today: seven strings where JSON
   * turned `\t`/`\r` into control characters, and four with unbalanced
   * braces. Plan Phase 5 patches them by hand and empties this list.
   */
  const KNOWN_DAMAGED = new Set([
    "de-by-gymnasium-10-chemie-sauerstoffgruppen-alkohole-aldehyde-carbonsaeuren-ester-kvt.json|01K8GA80000000000000000J04|sample_solution",
    "de-by-gymnasium-10-geographie-geooekozonen-klimawandel-kippelemente-kvt.json|01K8GAF0000000000000000J04|sample_solution",
    "de-by-gymnasium-10-mathematik-analytische-geometrie-vektoren-skalarprodukt-kvt.json|01K8GA30000000000000000J02|sample_solution",
    "de-by-gymnasium-10-mathematik-trigonometrie-sinus-kosinussatz-bogenmass-kvt.json|01K8GA00000000000000000J02|question",
    "de-by-gymnasium-11-biologie-stoffwechselphysiologie-fotosynthese-zellatmung-atp-kvt.json|01K8GBH0000000000000000J04|sample_solution",
    "de-by-gymnasium-11-chemie-kunststoffe-polymerisation-polykondensation-duroplaste-kvt.json|01K8GB90000000000000000J02|sample_solution",
    "de-by-gymnasium-11-physik-elektrisches-feld-kondensator-millikan-kvt.json|01K8GB40000000000000000J02|question",
    "de-by-gymnasium-12-chemie-saeure-base-gleichgewichte-ph-wert-titration-puffer-kvt.json|01K8GC60000000000000000J04|question",
    "de-by-gymnasium-12-chemie-saeure-base-gleichgewichte-ph-wert-titration-puffer-kvt.json|01K8GC60000000000000000J04|sample_solution",
    "de-by-gymnasium-12-physik-atomphysik-bohrsches-atommodell-linien-spektren-kernspaltung-kvt.json|01K8GC40000000000000000J04|sample_solution",
    "de-by-gymnasium-13-chemie-farbstoffe-mesomerie-chromophore-azofarbstoffe-spektroskopie-kvt.json|01K8GD50000000000000000J04|sample_solution",
  ]);

  it("every other formula lifts strictly and passes the tokenizer", () => {
    const dir = join(process.cwd(), "tests/fixtures/curriculum");
    const refused: string[] = [];
    let formulas = 0;
    for (const file of readdirSync(dir).filter((f) =>
      f.endsWith("-kvt.json"),
    )) {
      const tile = JSON.parse(readFileSync(join(dir, file), "utf-8"));
      for (const atom of tile.atoms) {
        for (const item of atom.practice_items) {
          for (const field of ["question", "concept", "sample_solution"]) {
            const text = item[field];
            if (typeof text !== "string") continue;
            const key = `${file}|${item.id}|${field}`;
            for (const segment of liftDollarMath(text, "strict").segments) {
              if (segment.type !== "math") continue;
              formulas++;
              if (
                texIssues(segment.tex).length > 0 &&
                !KNOWN_DAMAGED.has(key)
              ) {
                refused.push(`${key}: ${segment.tex.slice(0, 60)}`);
              }
            }
          }
        }
      }
    }
    expect(formulas).toBeGreaterThan(6000);
    expect(refused).toEqual([]);
  });
});
