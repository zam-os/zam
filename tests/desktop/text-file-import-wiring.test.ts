import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const studio = readFileSync(
  join(root, "desktop", "src", "learning-content.ts"),
  "utf8",
);
const main = readFileSync(join(root, "desktop", "src", "main.ts"), "utf8");
const html = readFileSync(join(root, "desktop", "index.html"), "utf8");

describe("Studio-first local card import wiring", () => {
  it("puts local file selection before the legacy LLM import paths", () => {
    expect(html.indexOf('id="btn-import-tab-file"')).toBeGreaterThan(-1);
    expect(html.indexOf('id="btn-import-tab-file"')).toBeLessThan(
      html.indexOf('id="btn-import-tab-text"'),
    );
    expect(html).toContain('id="btn-import-file-choose"');
    expect(html).toContain('id="import-file-preview"');
  });

  it("previews before confirming with the exact plan hash", () => {
    expect(studio).toContain('"personal-card-import-file-preview"');
    expect(studio).toContain('"personal-card-import-file-confirm"');
    expect(studio).toContain('"--plan-hash"');
    expect(studio).toContain("preview.planHash");
  });

  it("injects a native picker restricted to APKG, CSV, and TSV", () => {
    expect(main).toContain("setLearningContentFilePicker(async () =>");
    expect(main).toContain('extensions: ["apkg", "csv", "tsv"]');
    expect(studio).not.toContain("@tauri-apps/");
  });
});
