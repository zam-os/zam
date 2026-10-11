import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Learning Content's header (Studio redesign step 4): one primary action, one
 * Import menu, and the goal import as a dialog of its own instead of the
 * first-run flow opened at its goal step. Text assertions over the markup and
 * the wiring, like the other desktop wiring tests (the repo has no DOM test
 * environment).
 */

const desktopFile = (path: string) =>
  readFileSync(join(process.cwd(), "desktop", path), "utf8");

function menuMarkup(html: string): string {
  const start = html.indexOf('id="content-import-menu"');
  expect(start, "no import menu in the markup").toBeGreaterThan(-1);
  return html.slice(start, html.indexOf("</div>", start));
}

describe("Learning Content import menu", () => {
  const html = desktopFile("index.html");

  it("puts every import entry in one menu, each still the button its module wires", () => {
    const menu = menuMarkup(html);
    expect(html).toContain('id="btn-content-import-menu"');
    expect(html).toContain('aria-controls="content-import-menu"');
    for (const id of [
      "btn-content-material-import",
      "btn-content-library-topics",
      "btn-content-goal-import",
      "btn-content-import",
    ]) {
      expect(menu).toMatch(new RegExp(`id="${id}"[^>]*role="menuitem"`));
    }
    // The primary action stays a button of its own, outside the menu.
    expect(menu).not.toContain('id="btn-content-new-card"');
    expect(html).toContain('id="btn-content-new-card"');
  });

  it("keeps the curriculum's one door in Quellen (ADR 2026-10-10 Decision 9)", () => {
    expect(menuMarkup(html)).not.toMatch(/curriculum/i);
  });

  it("closes on Escape and hands focus back to the menu button", () => {
    const menu = desktopFile("src/content-import-menu.ts");
    expect(menu).toContain('event.key === "Escape"');
    expect(menu).toContain('setOpen(false, "button")');
    expect(desktopFile("src/main.ts")).toContain("initContentImportMenu();");
  });
});

describe("goal import", () => {
  it("opens as its own dialog, not as the first-run flow", () => {
    const main = desktopFile("src/main.ts");
    expect(main).toContain("openGoalImportDialog()");
    expect(main).not.toContain('showOnboardingAt("goal")');
    expect(desktopFile("index.html")).toContain('id="goal-import-overlay"');

    const dialog = desktopFile("src/goal-import.ts");
    expect(dialog).toContain("renderGoalArea(");
    expect(dialog).not.toContain("initOnboarding");
  });

  it("shares one goal area with the first-run flow", () => {
    const onboarding = desktopFile("src/onboarding.ts");
    expect(onboarding).toContain("export function renderGoalArea(");
    expect(onboarding).toContain('openModelSetup: () => actions.goToStep("model")');
  });
});
