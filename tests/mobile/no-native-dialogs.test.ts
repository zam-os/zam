import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

/**
 * `window.confirm`, `alert` and `prompt` do nothing inside Tauri's WKWebView.
 *
 * No panel is shown and `confirm` returns `false` immediately, so every branch
 * guarded by one is dead code that looks like a working control. "Delete card"
 * in the Library shipped that way from 0.29.0 to 0.29.2: the button was there,
 * the copy was there, and no card was ever removed. Verified on the iPad (A16)
 * simulator; the mobile shell carries no dialog plugin, so there is nothing to
 * fall back to either.
 *
 * Destructive actions arm the button in place instead — see `armDestructive`.
 * This test exists because the failure is invisible: nothing throws, nothing
 * logs, the control simply does not work.
 */
describe("no native JS dialogs on mobile", () => {
  const sources = [
    "mobile/src/main.ts",
    "mobile/src/library.ts",
    "mobile/src/import.ts",
    "mobile/src/setup/wizard.ts",
    "mobile/src/ui/nav.ts",
  ];

  it("never calls confirm, alert or prompt", () => {
    for (const file of sources) {
      const source = read(file);
      for (const call of [
        /\bwindow\.confirm\s*\(/,
        /\bwindow\.alert\s*\(/,
        /\bwindow\.prompt\s*\(/,
        /(?<![.\w])confirm\s*\(/,
        /(?<![.\w])alert\s*\(/,
      ]) {
        expect(
          source,
          `${file} uses a native dialog, which silently does nothing in WKWebView`,
        ).not.toMatch(call);
      }
    }
  });

  it("keeps a two-tap path for the destructive actions instead", () => {
    const main = read("mobile/src/main.ts");
    expect(main).toContain("function armDestructive");
    // Both delete buttons go through it — the review one and the library one
    // that was broken.
    expect(main).toMatch(/armDestructive\(\s*cardDeleteItem/);
    expect(main).toMatch(/armDestructive\(\s*detailDeleteButton/);
  });

  it("disarms when the learner walks away", () => {
    // An armed delete belongs to the card that armed it. Closing the menu or
    // leaving the detail view is a change of mind, not a pending deletion.
    const main = read("mobile/src/main.ts");
    const closeMenu = main.slice(main.indexOf("function closeCardMenu"));
    expect(closeMenu.slice(0, closeMenu.indexOf("\n}"))).toContain(
      "disarmCardDelete?.()",
    );
    const libraryMode = main.slice(main.indexOf("function showLibraryMode"));
    expect(libraryMode.slice(0, libraryMode.indexOf("\n}"))).toContain(
      "disarmLibraryDelete?.()",
    );
  });
});
