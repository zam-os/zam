import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const desktopFile = (path: string) =>
  readFileSync(join(process.cwd(), "desktop", path), "utf8");

/**
 * The per-review question rewrite (ADR 2026-06-15) is one model round-trip
 * before a card can be shown, and it is what makes the first card of a session
 * slow. `llm.dynamic_questions` has gated it since then, but the desktop had no
 * control for it — this wiring is what makes the setting reachable.
 */
describe("dynamic-question toggle wiring", () => {
  const html = desktopFile("index.html");
  const main = desktopFile("src/main.ts");

  it("puts the control in the AI-models card, where the cost comes from", () => {
    const aiCard = html.indexOf('id="lbl-settings-ai-title"');
    const toggle = html.indexOf('id="toggle-dynamic-questions"');
    const agentsCard = html.indexOf('id="lbl-settings-agents-title"');

    expect(toggle).toBeGreaterThan(aiCard);
    expect(toggle).toBeLessThan(agentsCard);
  });

  it("labels the control and its cost through the i18n layer", () => {
    for (const key of [
      "lbl_dynamic_questions",
      "lbl_dynamic_questions_help",
      "dynamic_questions_on",
      "dynamic_questions_off",
      "dynamic_questions_error",
    ]) {
      expect(main).toContain(`t("${key}")`);
    }
  });

  it("reads the stored state instead of assuming the markup default", () => {
    expect(main).toMatch(
      /loadDynamicQuestionSetting[\s\S]*?runBridge<[\s\S]*?>\("get-settings"\)/,
    );
    // Absent must read as on, matching the kernel's `!== "false"`.
    expect(main).toContain("settings?.recall?.dynamicQuestions !== false");
    expect(main).toContain("void loadDynamicQuestionSetting();");
  });

  it("writes through the allowlisted setter and reverts a failed write", () => {
    expect(main).toMatch(
      /setDynamicQuestions[\s\S]*?"setting-set"[\s\S]*?"llm\.dynamic_questions"/,
    );
    // A toggle that silently did nothing is worse than one that says it failed.
    expect(main).toMatch(
      /catch[\s\S]*?toggle\.checked = !enabled[\s\S]*?dynamic_questions_error/,
    );
  });

  it("keeps the setting writable through the bridge allowlist", () => {
    const bridge = readFileSync(
      join(process.cwd(), "src", "cli", "commands", "bridge.ts"),
      "utf8",
    );
    expect(bridge).toMatch(
      /UI_WRITABLE_SETTINGS = new Set\(\[[\s\S]*?"llm\.dynamic_questions"/,
    );
  });
});
