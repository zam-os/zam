import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type AcademyImportRow,
  academyPreviewLabel,
  completeAcademyImportRow,
} from "../../mobile/src/academy-import-view.js";
import { setLocale } from "../../mobile/src/i18n.js";
import { academyDom } from "../helpers/academy-dom.js";

afterEach(() => {
  setLocale("de");
  vi.unstubAllGlobals();
});

describe("Mobile Academy preview label", () => {
  it.each([
    ["de", "Vorschau · noch nicht von einer Lehrkraft geprüft"],
    ["en", "Preview · not yet reviewed by a teacher"],
  ] as const)("says what is missing in %s", (locale, text) => {
    vi.stubGlobal("document", academyDom().document);
    setLocale(locale);
    const label = academyPreviewLabel();
    expect(label.className).toBe("academy-preview-label");
    expect(label.textContent).toBe(text);
  });
});

function row(held: boolean): AcademyImportRow {
  return {
    action: { textContent: "", disabled: false } as HTMLButtonElement,
    meta: { textContent: "26 cards · version 2026.9.1" } as HTMLElement,
    items: 26,
    held,
  };
}

describe("Mobile Academy completion", () => {
  it.each(["de", "en"] as const)(
    "labels an update with the saved version in %s",
    (locale) => {
      setLocale(locale);
      const view = row(true);
      const status = completeAcademyImportRow(view, {
        version: "2026.10.2",
        name: "UML",
        cardsCreated: 1,
      });
      expect(view.action.disabled).toBe(true);
      expect(view.action.textContent).toBe(
        locale === "de" ? "Aktualisiert auf 2026.10.2" : "Updated to 2026.10.2",
      );
      expect(view.meta.textContent).toContain("26");
      expect(view.meta.textContent).toContain("2026.10.2");
      expect(view.meta.textContent).not.toContain("2026.9.1");
      expect(status).toContain("UML");
      expect(status).toContain("2026.10.2");
      expect(status).toContain("1");
    },
  );

  it("keeps first-time enrolment labelled as taken", () => {
    const view = row(false);
    expect(
      completeAcademyImportRow(view, {
        version: "2026.10.1",
        name: "UML",
        cardsCreated: 26,
      }),
    ).toBe("UML: 26 Karten hinzugefügt.");
    expect(view.action.textContent).toBe("Aufgenommen");
    expect(view.meta.textContent).toBe("26 Karten · Version 2026.10.1");
  });
});
