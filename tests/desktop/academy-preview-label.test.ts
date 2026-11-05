import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeAtlasImport, openAtlasImport } from "../../desktop/src/atlas/import.js";
import { setBridgeTransport } from "../../desktop/src/bridge-transport.js";
import { LOCALES, setCurrentLocale, t } from "../../desktop/src/i18n.js";
import { type AcademyElement, academyDom } from "../helpers/academy-dom.js";

/**
 * A ZAM Academy cell in preview has no teacher review yet, and its learners
 * are children: every surface that lists it says so, in every language.
 */

const PLACE = {
  lens: "schule",
  regionKey: "ausserhalb.mathematik",
  path: ["Außerhalb des Lehrplans", "Mathematik"],
} as const;

function atlasCell(id: string, preview: boolean) {
  return {
    id,
    title: id,
    gradeLabel: "",
    preview,
    installed: false,
    enrolled: false,
    cardCount: 0,
  };
}

describe("the atlas import dialog", () => {
  let body: AcademyElement;

  beforeEach(() => {
    const dom = academyDom();
    body = dom.body;
    vi.stubGlobal("document", dom.document);
    vi.stubGlobal("window", dom.window);
    setBridgeTransport(async () => ({
      success: true,
      cells: [
        atlasCell("zam-academy:mathematik-grundschule-4", true),
        atlasCell("zam-academy:uml", false),
      ],
      wizard: false,
    }));
  });

  afterEach(() => {
    closeAtlasImport();
    setCurrentLocale("en");
    vi.unstubAllGlobals();
    setBridgeTransport(async () => {
      throw new Error("no transport in this test");
    });
  });

  it("labels a preview cell, and no other", async () => {
    setCurrentLocale("de");
    await openAtlasImport(PLACE, {
      importMaterial: () => {},
      onChanged: () => {},
    });
    const rows = body
      .all("li")
      .map((row) => row.all("span").map((span) => span.textContent));
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain(
      "Vorschau · noch nicht von einer Lehrkraft geprüft",
    );
    expect(rows[1].join(" ")).not.toContain("Vorschau");
  });
});

describe("the preview label", () => {
  afterEach(() => setCurrentLocale("en"));

  it("has its own words in every language of the app", () => {
    const words = LOCALES.map((locale) => {
      setCurrentLocale(locale);
      return t("academy_preview");
    });
    expect(new Set(words).size).toBe(LOCALES.length);
    expect(words).toContain(
      "Vorschau · noch nicht von einer Lehrkraft geprüft",
    );
    expect(words).toContain("Preview · not yet reviewed by a teacher");
  });

  // These render inside large views with no test DOM of their own.
  it.each([
    [
      "the curriculum wizard's offer",
      "desktop/src/curriculum-wizard.ts",
      "if (cell.preview) text.append(academyPreviewLabel());",
    ],
    [
      "Studio's active paths",
      "desktop/src/learning-content.ts",
      "if (cell.preview) cardEl.append(academyPreviewLabel());",
    ],
    [
      "Mobile's Academy list",
      "mobile/src/main.ts",
      "if (preview) card.append(academyPreviewLabel());",
    ],
    [
      "Mobile's curriculum offer and active paths",
      "mobile/src/main.ts",
      "if (cell.preview) card.append(academyPreviewLabel());",
    ],
  ])("is wired into %s", (_surface, file, line) => {
    expect(readFileSync(file, "utf8")).toContain(line);
  });

  it("appears on both of Mobile's cell lists", () => {
    const main = readFileSync("mobile/src/main.ts", "utf8");
    expect(
      main.match(/if \(cell\.preview\) card\.append\(academyPreviewLabel\(\)\);/g),
    ).toHaveLength(2);
  });

  it("has its style in both apps, in the colours of each theme", () => {
    expect(readFileSync("desktop/src/styles.css", "utf8")).toContain(
      ".academy-preview-label",
    );
    expect(readFileSync("mobile/src/ui/components.css", "utf8")).toContain(
      ".academy-preview-label",
    );
  });
});
