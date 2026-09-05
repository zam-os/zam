import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { messageKeys } from "../../mobile/src/i18n.js";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("mobile settings simplicity", () => {
  const html = file("mobile/index.html");
  const css = file("mobile/src/ui/components.css");
  const main = file("mobile/src/main.ts");

  it("opens in simple mode and offers an explicit advanced view", () => {
    expect(html).toContain(
      'id="settings-view" data-settings-mode="simple" hidden',
    );
    expect(html).toContain('id="mobile-settings-mode-simple"');
    expect(html).toContain('id="mobile-settings-mode-advanced"');
    expect(main).toContain(
      'const SETTINGS_VIEW_MODE_STORAGE_KEY = "zam:settings-view-mode";',
    );
  });

  it("keeps local AI and other device plumbing out of the simple view", () => {
    expect(html).toMatch(
      /data-i18n="local_ai_heading" data-settings-tier="advanced"/,
    );
    expect(html).toMatch(
      /id="endpoints-toggle"[\s\S]*?data-settings-tier="advanced"/,
    );
    expect(html).toMatch(/id="voice-settings" data-settings-tier="advanced"/);
    expect(html).toMatch(/id="upgrade-card" data-settings-tier="advanced"/);
    expect(css).toContain(
      '#settings-view[data-settings-mode="simple"] [data-settings-tier="advanced"]',
    );
  });

  it("loads local model diagnostics only in advanced mode", () => {
    expect(main).toContain('if (settingsViewMode === "advanced") {');
    expect(main).toContain("void refreshLocalAi();");
    expect(main).toContain("void renderLocalAiModels();");
  });

  it("honours the radio-group keyboard contract it advertises", () => {
    expect(main).toContain("initRadioGroupKeyboard(settingsModeSwitcher)");
    expect(main).toContain("initRadioGroupKeyboard(reviewModeSwitcher)");
    expect(main).toContain("syncRadioGroupTabStops(settingsModeSwitcher)");
    expect(main).toContain("syncRadioGroupTabStops(reviewModeSwitcher)");
    expect(main).toContain("!radioGroupHasPendingFocus(reviewModeSwitcher)");
    expect(main).toContain("mode === currentLearningSettings.learningMode");
  });

  it("exposes settings and review choices as exclusive radio groups", () => {
    expect(html).toMatch(
      /id="mobile-settings-mode-switcher"[\s\S]*?role="radiogroup"[\s\S]*?aria-describedby="mobile-settings-mode-description"/,
    );
    expect(html).toMatch(/id="review-mode-switcher"[\s\S]*?role="radiogroup"/);
    expect(html).toMatch(
      /id="review-mode-flash"[\s\S]*?role="radio"[\s\S]*?aria-checked="true"/,
    );
  });

  it("localizes the setting level in German and English", () => {
    for (const key of [
      "settings_mode_label",
      "settings_mode_simple",
      "settings_mode_advanced",
      "settings_mode_simple_help",
      "settings_mode_advanced_help",
    ]) {
      expect(messageKeys("de")).toContain(key);
      expect(messageKeys("en")).toContain(key);
    }
  });
});
