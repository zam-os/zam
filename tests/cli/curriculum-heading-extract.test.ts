import { describe, expect, it } from "vitest";
import {
  extractTopicsByHeadingStrict,
  labelFromManifestTopics,
  parseHeadingSections,
} from "../../src/cli/curriculum/heading-extract.js";
import { kernlehrplanNrwProvider } from "../../src/cli/curriculum/providers/kernlehrplan-nrw/index.js";
import { lehrplanplusBayernProvider } from "../../src/cli/curriculum/providers/lehrplanplus-bayern/index.js";
import fs from "node:fs";
import path from "node:path";

const SIBLING_HTML = `<!DOCTYPE html>
<html><body>
<h1>Mathematik</h1>
<h2>Arithmetik und Algebra</h2>
<p>UNIQUE_ARITHMETIK_MARKER Zahlen, Terme und Gleichungen.</p>
<h2>Funktionen</h2>
<p>UNIQUE_FUNKTIONEN_MARKER Lineare und quadratische Funktionen.</p>
<h2>Geometrie</h2>
<p>UNIQUE_GEOMETRIE_MARKER Figuren und Körper.</p>
</body></html>`;

const NON_MATCHING_HTML = `<!DOCTYPE html>
<html><body>
<h1>Unrelated document</h1>
<h2>Something else entirely</h2>
<p>This page has substantial content but no matching curriculum headings.</p>
</body></html>`;

describe("extractTopicsByHeadingStrict", () => {
  const topics = {
    "realschule|10|mathematik": [
      { id: "arithmetik-algebra", label: "Arithmetik und Algebra" },
      { id: "funktionen", label: "Funktionen" },
      { id: "geometrie", label: "Geometrie" },
    ],
  };
  const resolve = (id: string) => labelFromManifestTopics(topics, id);

  it("parses heading sections without inventing content", () => {
    const sections = parseHeadingSections(SIBLING_HTML);
    expect(sections.map((s) => s.header)).toEqual([
      "Mathematik",
      "Arithmetik und Algebra",
      "Funktionen",
      "Geometrie",
    ]);
  });

  it("extracts only selected sibling topics from a shared source", () => {
    const extracted = extractTopicsByHeadingStrict(
      SIBLING_HTML,
      [
        "realschule|10|mathematik#arithmetik-algebra",
        "realschule|10|mathematik#funktionen",
      ],
      resolve,
    );

    expect(Object.keys(extracted).sort()).toEqual([
      "realschule|10|mathematik#arithmetik-algebra",
      "realschule|10|mathematik#funktionen",
    ]);

    const arith = extracted["realschule|10|mathematik#arithmetik-algebra"];
    const funk = extracted["realschule|10|mathematik#funktionen"];

    expect(arith).toContain("UNIQUE_ARITHMETIK_MARKER");
    expect(arith).not.toContain("UNIQUE_FUNKTIONEN_MARKER");
    expect(arith).not.toContain("UNIQUE_GEOMETRIE_MARKER");

    expect(funk).toContain("UNIQUE_FUNKTIONEN_MARKER");
    expect(funk).not.toContain("UNIQUE_ARITHMETIK_MARKER");
    expect(funk).not.toContain("UNIQUE_GEOMETRIE_MARKER");
  });

  it("omits unselected siblings entirely (partial selection)", () => {
    const extracted = extractTopicsByHeadingStrict(
      SIBLING_HTML,
      ["realschule|10|mathematik#arithmetik-algebra"],
      resolve,
    );
    expect(extracted["realschule|10|mathematik#arithmetik-algebra"]).toBeDefined();
    expect(extracted["realschule|10|mathematik#funktionen"]).toBeUndefined();
    expect(extracted["realschule|10|mathematik#geometrie"]).toBeUndefined();
  });

  it("hard-omits a valid topic id when the document has no matching section", () => {
    const extracted = extractTopicsByHeadingStrict(
      NON_MATCHING_HTML,
      [
        "realschule|10|mathematik#arithmetik-algebra",
        "realschule|10|mathematik#funktionen",
      ],
      resolve,
    );
    expect(extracted).toEqual({});
  });

  it("never falls back to an unrelated first section or the bare label", () => {
    const extracted = extractTopicsByHeadingStrict(
      NON_MATCHING_HTML,
      ["realschule|10|mathematik#arithmetik-algebra"],
      resolve,
    );
    expect(extracted["realschule|10|mathematik#arithmetik-algebra"]).toBeUndefined();
    // Old seed fallback returned the label alone — that must not happen.
    expect(Object.values(extracted)).not.toContain("Arithmetik und Algebra");
  });

  it("ignores unknown short ids that are not in the manifest", () => {
    const extracted = extractTopicsByHeadingStrict(
      SIBLING_HTML,
      ["realschule|10|mathematik#nonexistent"],
      resolve,
    );
    expect(extracted["realschule|10|mathematik#nonexistent"]).toBeUndefined();
  });
});

describe("provider extractTopics strict contract (seed + complete)", () => {
  it("NRW complete provider isolates two sibling topics from one fixture", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/kernlehrplan-nrw/mathematik-realschule-10.html",
      ),
      "utf-8",
    );
    const extracted = kernlehrplanNrwProvider.extractTopics!(html, [
      "realschule|10|mathematik#arithmetik-algebra",
      "realschule|10|mathematik#funktionen",
    ]);
    const a = extracted["realschule|10|mathematik#arithmetik-algebra"];
    const f = extracted["realschule|10|mathematik#funktionen"];
    expect(a).toContain("Arithmetik und Algebra");
    expect(a).toContain("Zahlen, Termen");
    expect(a).not.toContain("Lineare Funktionen");
    expect(f).toContain("Funktionen");
    expect(f).toContain("Lineare Funktionen");
    expect(f).not.toContain("Zahlen, Termen");
  });

  it("NRW complete provider hard-omits topics against a non-matching document", () => {
    const extracted = kernlehrplanNrwProvider.extractTopics!(NON_MATCHING_HTML, [
      "realschule|10|mathematik#arithmetik-algebra",
    ]);
    expect(
      extracted["realschule|10|mathematik#arithmetik-algebra"],
    ).toBeUndefined();
  });

  it("Bayern complete provider still omits non-matching topics (no invent)", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/lehrplanplus-bayern/mathematik-realschule-5.html",
      ),
      "utf-8",
    );
    const extracted = lehrplanplusBayernProvider.extractTopics!(html, [
      "realschule|5|mathematik#lb1",
      "realschule|9|deutsch#lb1",
    ]);
    expect(extracted["realschule|5|mathematik#lb1"]).toBeDefined();
    // Wrong subject/path must not pull text from an unrelated document.
    expect(extracted["realschule|9|deutsch#lb1"]).toBeUndefined();
  });
});
