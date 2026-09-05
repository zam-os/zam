import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("native desktop settings simplicity", () => {
  const html = file("desktop/index.html");
  const css = file("desktop/src/styles.css");
  const main = file("desktop/src/main.ts");

  it("opens in simple mode with the complexity choice before all settings", () => {
    const view = html.indexOf(
      'id="settings-view" class="view" data-settings-mode="simple"',
    );
    const switcher = html.indexOf('id="settings-mode-switcher"');
    const settings = html.indexOf('class="settings-list"');
    expect(view).toBeGreaterThan(0);
    expect(switcher).toBeGreaterThan(view);
    expect(switcher).toBeLessThan(settings);
  });

  it("keeps everyday learning choices visible", () => {
    for (const id of [
      "study-learning-card",
      "study-workload-card",
      "settings-ai-card",
      "settings-appearance-card",
      "settings-data-card",
    ]) {
      expect(html).toMatch(
        new RegExp(`<article[^>]+id="${id}"(?![^>]+data-settings-tier)`),
      );
    }
  });

  it("puts infrastructure and every local-model setup behind advanced mode", () => {
    for (const id of [
      "settings-agents-card",
      "settings-workspaces-card",
      "settings-context-card",
      "settings-voice-card",
      "settings-server-db-card",
      "secrets-vault-card",
      "settings-mobile-card",
    ]) {
      expect(html).toMatch(
        new RegExp(`<article[^>]+id="${id}"[^>]+data-settings-tier="advanced"`),
      );
    }
    for (const id of [
      "foundry-local-setup",
      "local-vision-setup",
      "local-embedding-setup",
    ]) {
      expect(html).toMatch(
        new RegExp(`id="${id}"[^>]+data-settings-tier="advanced"`),
      );
    }
  });

  it("hides advanced controls and only probes local models on demand", () => {
    expect(css).toContain(
      '#settings-view[data-settings-mode="simple"] [data-settings-tier="advanced"]',
    );
    expect(main).toContain('if (settingsViewMode === "advanced") {');
    expect(main).toContain("void loadFoundryLocalStatus();");
    expect(main).toContain("void loadLocalVisionStatus();");
    expect(main).toContain("void loadLocalEmbeddingStatus();");
  });

  it("keeps recovery, database health, and backup visible in simple mode", () => {
    expect(html).toMatch(
      /<button id="btn-run-onboarding"(?![^>]+data-settings-tier)[^>]*>/,
    );
    expect(html).toMatch(
      /<div class="settings-row">\s*<span id="lbl-settings-database">/,
    );
    expect(html).toMatch(
      /<p id="database-connection-detail"(?![^>]+data-settings-tier)[^>]*>/,
    );
    expect(html).toMatch(
      /<button id="btn-backup-db"(?![^>]+data-settings-tier)[^>]*>/,
    );
  });

  it("puts future simple cards after the explicitly ordered everyday cards", () => {
    expect(css).toContain(
      '#settings-view[data-settings-mode="simple"] .settings-card {\n  order: 99;',
    );
  });

  it("exposes both exclusive choices as described radio groups", () => {
    expect(html).toMatch(
      /id="settings-mode-switcher"[\s\S]*?role="radiogroup"[\s\S]*?aria-describedby="settings-mode-description"/,
    );
    expect(html).toMatch(/id="study-mode-switcher"[\s\S]*?role="radiogroup"/);
    expect(html).toMatch(
      /id="btn-study-mode-flash"[\s\S]*?role="radio"[\s\S]*?aria-checked="true"/,
    );
  });
});
