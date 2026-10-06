import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setCurrentLocale } from "../../desktop/src/i18n.js";
import {
  bonusButtonLabel,
  bonusGroups,
  bonusSourceLine,
} from "../../desktop/src/material-bonus.js";
import type { MaterialImportBonusItemWire } from "../../src/bridge/protocol.js";

/**
 * ADR 2026-10-05 Decision 6: Bonus items have a place in Learning Content
 * and are offered once the due queue is done.
 */

afterEach(() => setCurrentLocale("en"));

function item(
  tokenId: string,
  sourceId: string,
  sourceTitle: string | null = "Stofferkennung mit den Sinnen",
): MaterialImportBonusItemWire {
  return {
    tokenId,
    title: `Karte ${tokenId}`,
    question: "Wie riecht Essig?",
    concept: "Stechend sauer.",
    domain: "chemie/stoffe",
    sourceId,
    sourceTitle,
    importedAt: "2026-10-05T10:00:00.000Z",
  };
}

describe("material bonus view", () => {
  it("groups kept items by import, newest import first", () => {
    const groups = bonusGroups([
      item("t1", "s-new"),
      item("t2", "s-new"),
      item("t3", "s-old", "Dichte"),
    ]);
    expect(groups.map((group) => group.sourceId)).toEqual(["s-new", "s-old"]);
    expect(groups[0].items.map((entry) => entry.tokenId)).toEqual(["t1", "t2"]);
    expect(bonusGroups([])).toEqual([]);
  });

  it("names each import by its title and date", () => {
    setCurrentLocale("de");
    expect(bonusSourceLine(item("t1", "s"), "de")).toBe(
      "aus „Stofferkennung mit den Sinnen“, 5. Okt.",
    );
    setCurrentLocale("en");
    expect(bonusSourceLine(item("t1", "s", null), "en-GB")).toBe(
      "from “your import”, 5 Oct",
    );
  });

  it("shows the Learning Content button only when items are kept", () => {
    expect(bonusButtonLabel(0)).toBeNull();
    expect(bonusButtonLabel(3)).toBe("Bonus (3)");
  });

  it("is wired into Learning Content and the end of the due queue", () => {
    const root = process.cwd();
    const html = readFileSync(join(root, "desktop", "index.html"), "utf8");
    const studio = readFileSync(
      join(root, "desktop", "src", "learning-content.ts"),
      "utf8",
    );
    const main = readFileSync(join(root, "desktop", "src", "main.ts"), "utf8");
    expect(html).toMatch(/id="btn-content-material-bonus"[^>]*hidden/);
    expect(studio).toContain("initMaterialBonus({");
    expect(studio).toContain("await refreshMaterialBonus();");
    // The import's own bonus items come before the atom bonus.
    const offer = main.slice(main.indexOf("async function offerBonusOrFinish"));
    expect(offer.indexOf("await offerImportBonus(requestId)")).toBeGreaterThan(
      0,
    );
    expect(offer.indexOf("await offerImportBonus(requestId)")).toBeLessThan(
      offer.indexOf("bonusCandidatesCommand()"),
    );
    expect(main).toContain("importBonusTakeCommand(tokenId)");
  });
});
