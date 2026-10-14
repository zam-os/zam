import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Learning Content's header (Studio redesign step 4): one primary action, one
 * Import menu, and the topic import (formerly the goal import) as a dialog
 * of its own instead of the first-run flow opened at its step. Text assertions over the markup and
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
      "btn-content-topic-import",
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

  it("never hides the entry that has focus (PR #402 review)", () => {
    // Closing while an entry is focused moves focus to the button first; a
    // dialog that took focus in the entry's own handler keeps it.
    expect(desktopFile("src/content-import-menu.ts")).toContain(
      "if (!next && menu.contains(document.activeElement)) button.focus();",
    );
    // The file import dialog is one that has to take focus itself.
    const content = desktopFile("src/learning-content.ts");
    const show = content.slice(content.indexOf("function showImportModal"));
    expect(show.slice(0, show.indexOf("\n}\n"))).toContain(
      "openContentSearch.focus();",
    );
  });
});

describe("topic import (ADR 2026-10-14)", () => {
  it("opens as its own dialog, not as the first-run flow", () => {
    const main = desktopFile("src/main.ts");
    // The menu entry is hidden once chosen, so closing returns to the button.
    expect(main).toContain(
      'openTopicImportDialog(document.getElementById("btn-content-import-menu"))',
    );
    expect(main).not.toContain('showOnboardingAt("topic")');
    expect(desktopFile("index.html")).toContain('id="topic-import-overlay"');

    const dialog = desktopFile("src/topic-import.ts");
    expect(dialog).toContain("renderTopicArea(");
    expect(dialog).not.toContain("initOnboarding");
  });

  it("keeps focus inside the dialog when the topic area redraws", () => {
    const dialog = desktopFile("src/topic-import.ts");
    expect(dialog).toContain("new MutationObserver(");
    expect(dialog).toContain(
      "if (open && !el.contains(document.activeElement)) focusInDialog();",
    );
  });

  it("shares one topic area with the first-run flow", () => {
    const onboarding = desktopFile("src/onboarding.ts");
    expect(onboarding).toContain("export function renderTopicArea(");
    expect(onboarding).toContain(
      'openModelSetup: () => actions.goToStep("model")',
    );
  });

  it("asks for context beside the topic and writes no goal file", () => {
    const onboarding = desktopFile("src/onboarding.ts");
    expect(onboarding).toContain('t("topic_context_label")');
    expect(onboarding).toContain('"topic-source"');
    expect(onboarding).not.toContain("goal-create");
  });

  it("shows the first-run topic page only while the topic path is chosen", () => {
    const onboarding = desktopFile("src/onboarding.ts");
    expect(onboarding).toContain('shown: () => chosenStep === "topic",');
    // Every path on page 6 sets the choice, so another path takes it back.
    expect(onboarding).toContain("chosenStep = null;");
    expect(onboarding).toContain('actions.goToStep("content");');
    expect(onboarding).toContain("chosenStep = path.action.step;");
  });

  it("keeps the topic's name within its record before any model call", () => {
    const onboarding = desktopFile("src/onboarding.ts");
    expect(onboarding).toContain("titleInput.maxLength = TOPIC_TITLE_MAX;");
    expect(onboarding).toContain('t("topic_edit")');
  });
});
