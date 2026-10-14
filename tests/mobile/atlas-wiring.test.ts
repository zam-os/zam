import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { messageKeys } from "../../mobile/src/i18n.js";

/**
 * The knowledge atlas on Mobile (ADR 2026-10-13, Decision 10; plan Phase
 * 10b): on the Fortschritt tab, read only, its region review through the
 * same session as every review.
 */

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("mobile atlas wiring", () => {
  it("sits on the Fortschritt tab and reads again when the tab opens", () => {
    const html = file("mobile/index.html");
    const stats = html.slice(
      html.indexOf('id="stats-view"'),
      html.indexOf('id="settings-view"'),
    );
    for (const id of [
      "atlas-lenses",
      "atlas-status",
      "atlas-outline",
      "atlas-detail",
    ]) {
      expect(stats).toContain(`id="${id}"`);
    }
    const main = file("mobile/src/main.ts");
    expect(main).toContain("void atlas.refresh();");
    expect(main).toContain(
      "reviewSession.start(currentUserId, { tokenIds })",
    );
  });

  it("only reads: no settle, no preference, no write", () => {
    const atlas = file("mobile/src/atlas.ts");
    expect(atlas).toContain("mayWrite: false");
    for (const write of [
      "settleLens",
      "setSetting",
      "addConnection",
      "setAtlasPrefs",
      "moveUnitsToPlanet",
    ]) {
      expect(atlas).not.toContain(write);
    }
  });

  it("names every condition and count in both languages", () => {
    const keys = [
      "atlas_title",
      "atlas_due_count",
      "atlas_no_cards",
      "atlas_unit_count",
      "atlas_own_unit",
      "atlas_review",
      "atlas_review_none",
      "atlas_empty",
      "atlas_load_failed",
      ...["weltwissen", "schule", "leben", "produkte", "unternehmen"].map(
        (lens) => `atlas_lens_${lens}`,
      ),
      ...[
        "known",
        "due",
        "overdue",
        "decaying",
        "forgotten",
        "unpractised",
      ].map((condition) => `condition_${condition}`),
    ];
    for (const locale of ["de", "en"] as const) {
      const present = new Set(messageKeys(locale));
      for (const key of keys) expect(present.has(key), `${locale}: ${key}`).toBe(true);
    }
  });
});
