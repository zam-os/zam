import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  type AcademyCellRow,
  academyErrorText,
  academyMetaText,
  enrolAcademyCell,
  fetchAcademyCells,
  isAcademyCellId,
  updateAcademyCell,
} from "../../desktop/src/academy-list.js";
import { setBridgeTransport } from "../../desktop/src/bridge-transport.js";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";

/** ADR 2026-10-19 Decision 5: the Studio side of the ZAM Academy. */

function cell(overrides: Partial<AcademyCellRow> = {}): AcademyCellRow {
  return {
    id: "zam-academy:uml",
    title: "UML 2.5.1 (ZAM Academy)",
    description: "…",
    language: "de",
    version: "2026.10.1",
    items: 26,
    appUrl: "https://academy.zam-os.org/uml/",
    bundled: true,
    held: false,
    heldVersion: null,
    newer: false,
    ...overrides,
  };
}

afterEach(() => {
  setCurrentLocale("en");
  setBridgeTransport(async () => {
    throw new Error("no transport in this test");
  });
});

describe("academy rows", () => {
  it("say how many cards a click adds, and which version", () => {
    expect(academyMetaText(cell())).toBe("26 cards · version 2026.10.1");
    setCurrentLocale("de");
    expect(academyMetaText(cell())).toBe("26 Karten · Version 2026.10.1");
    expect(t("academy_take")).toBe("Aufnehmen");
    expect(t("academy_taken")).toBe("Aufgenommen");
    expect(t("academy_menu")).toBe("Aus der ZAM Academy");
  });

  it("knows an academy cell by its namespace", () => {
    expect(isAcademyCellId("zam-academy:uml")).toBe(true);
    expect(isAcademyCellId("de-by:bos-10-optik")).toBe(false);
  });

  it("names the reason once", () => {
    expect(academyErrorText(new Error("network down"))).toBe(
      `${t("academy_error")}: network down`,
    );
    expect(academyErrorText(new Error(t("academy_error")))).toBe(
      t("academy_error"),
    );
  });
});

describe("academy bridge calls", () => {
  it("lists, enrols and updates through the learner's bridge commands", async () => {
    const calls: Array<[string, string[]]> = [];
    setBridgeTransport(async (cmd, args) => {
      calls.push([cmd, args ?? []]);
      if (cmd === "academy-list") {
        return { success: true, offline: true, cells: [cell({ held: true })] };
      }
      if (cmd === "academy-enrol") {
        return { success: true, cardsCreated: 26, version: "2026.10.1" };
      }
      return { success: true, updated: true, version: "2026.10.2" };
    });

    const listing = await fetchAcademyCells();
    expect(listing).toMatchObject({ offline: true });
    expect(listing.cells[0].held).toBe(true);
    expect(await enrolAcademyCell("zam-academy:uml")).toMatchObject({
      cardsCreated: 26,
    });
    expect(await updateAcademyCell("zam-academy:uml")).toMatchObject({
      version: "2026.10.2",
    });
    expect(calls).toEqual([
      ["academy-list", []],
      ["academy-enrol", ["zam-academy:uml"]],
      ["academy-update", ["zam-academy:uml"]],
    ]);
  });

  it("turns an unsuccessful answer into an error", async () => {
    setBridgeTransport(async () => ({ success: false }));
    await expect(fetchAcademyCells()).rejects.toThrow(t("academy_error"));
  });
});

describe("academy wiring", () => {
  const file = (path: string) =>
    readFileSync(join(process.cwd(), path), "utf-8");

  it("has its entry in the import menu, labelled on every language switch", () => {
    expect(file("desktop/index.html")).toMatch(
      /id="btn-academy-open" class="import-menu-item"/,
    );
    expect(file("desktop/src/main.ts")).toContain('t("academy_menu")');
  });

  it("opens apps in the system browser and refreshes after enrolling", () => {
    const content = file("desktop/src/learning-content.ts");
    expect(content).toContain("openExternal: (url) => externalOpener?.(url)");
    expect(content).toContain("onEnrolled: () => loadStudioData()");
  });

  it("offers the update check only on a held academy cell", () => {
    const content = file("desktop/src/learning-content.ts");
    expect(content).toMatch(
      /if \(isAcademyCellId\(cell\.id\)\) \{\s*buttons\.append\(academyUpdateButton\(cell\.id/,
    );
  });

  it("flips „Aufnehmen“ at once and undoes it on failure", () => {
    const list = file("desktop/src/academy-list.ts");
    const click = list.slice(list.indexOf('take.addEventListener("click"'));
    expect(click.indexOf("setTaken(take)")).toBeLessThan(
      click.indexOf("enrolAcademyCell(cell.id)"),
    );
    expect(click).toMatch(/\.catch\(\(err\) => \{\s*take\.className/);
  });
});
