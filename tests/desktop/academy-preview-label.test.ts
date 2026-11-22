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
    body.replaceChildren();
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

  it("hides unenrolled legacy de-by: school cells and offers ZAM Academy instead (ADR 2026-11-22 D4)", async () => {
    const openAcademy = vi.fn();
    setBridgeTransport(async () => ({
      success: true,
      cells: [
        atlasCell("de-by:bos-10-optik", false),
        { ...atlasCell("de-by:realschule-optik", false), enrolled: true },
      ],
      wizard: false,
    }));
    await openAtlasImport(PLACE, {
      importMaterial: () => {},
      openAcademy,
      onChanged: () => {},
    });
    const rows = body.all("li");
    expect(rows).toHaveLength(1);
    expect(rows[0].all("span")[1].textContent).toBe("de-by:realschule-optik");
    expect(
      body
        .all("button")
        .filter((btn) => btn.textContent === t("atlas_import_enrol")),
    ).toHaveLength(0);

    // When only hidden unenrolled de-by: cells matched, offer ZAM Academy.
    closeAtlasImport();
    setBridgeTransport(async () => ({
      success: true,
      cells: [atlasCell("de-by:bos-10-optik", false)],
      wizard: false,
    }));
    await openAtlasImport(PLACE, {
      importMaterial: () => {},
      openAcademy,
      onChanged: () => {},
    });
    expect(body.all("li")).toHaveLength(0);
    const academyBtn = body
      .all("button")
      .find((btn) => btn.textContent === t("atlas_import_wizard"));
    expect(academyBtn).toBeDefined();
    academyBtn!.click();
    expect(openAcademy).toHaveBeenCalledOnce();
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
      "Studio's Academy browser",
      "desktop/src/academy-list.ts",
      "if (cell.preview) row.append(academyPreviewLabel());",
    ],
    [
      "Studio's active paths",
      "desktop/src/learning-content.ts",
      "if (cell.preview) cardEl.append(academyPreviewLabel());",
    ],
    [
      "Mobile's Academy list",
      "mobile/src/main.ts",
      "if (item.preview) card.append(academyPreviewLabel());",
    ],
    [
      "Mobile's active paths",
      "mobile/src/main.ts",
      "if (cell.preview) card.append(academyPreviewLabel());",
    ],
  ])("is wired into %s", (_surface, file, line) => {
    expect(readFileSync(file, "utf8")).toContain(line);
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
