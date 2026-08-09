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

describe("Studio-first open-content discovery wiring", () => {
  it("opens the curated library before local and AI-assisted imports", () => {
    expect(html.indexOf('id="btn-import-tab-library"')).toBeGreaterThan(-1);
    expect(html.indexOf('id="btn-import-tab-library"')).toBeLessThan(
      html.indexOf('id="btn-import-tab-file"'),
    );
    expect(html).toContain('id="open-content-search"');
    expect(html).toContain('id="open-content-language"');
    expect(html).toContain('id="open-content-subject"');
    expect(studio).toContain('switchImportTab("library")');
  });

  it("lists, verifies, previews, and confirms through dedicated bridge commands", () => {
    expect(studio).toContain('"open-content-list"');
    expect(studio).toContain('"open-content-preview"');
    expect(studio).toContain('"open-content-confirm"');
    expect(studio).toContain('"--plan-hash"');
    expect(studio).toContain("preview.planHash");
  });

  it("shows attribution, source, and license before import", () => {
    expect(studio).toContain("item.attribution");
    expect(studio).toContain("item.sourceUrl");
    expect(studio).toContain("item.license.sourceUrl");
    expect(studio).toContain("card.warnings ?? []");
    expect(main).toContain('t("btn_import_tab_library")');
    expect(main).toContain('t("open_content_intro")');
  });
});
