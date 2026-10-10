import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";

const root = process.cwd();

function read(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

afterEach(() => {
  setCurrentLocale("en");
});

describe("learning content sources shell", () => {
  it("names the switcher in German and English", () => {
    setCurrentLocale("de");
    expect(t("lbl_content_source")).toBe("Quelle");
    expect(t("btn_content_choose_folder")).toBe("Ordner wählen …");
    expect(t("content_source_curriculum")).toBe("Lehrplan");
    setCurrentLocale("en");
    expect(t("lbl_content_source")).toBe("Source");
    expect(t("btn_content_choose_folder")).toBe("Choose folder…");
    expect(t("content_source_next")).toContain("next step");
  });

  it("puts the Quelle controls in both shells and keeps the curriculum entry disabled", () => {
    const desktop = read("desktop/index.html");
    const panel = read("desktop/src/panel/studio-panel.html");
    for (const id of [
      "content-source-select",
      "btn-content-choose-folder",
      "content-sources-path",
      "content-sources-note",
    ]) {
      expect(desktop, id).toContain(`id="${id}"`);
      expect(panel, id).toContain(`id="${id}"`);
    }

    const source = read("desktop/src/learning-content-sources.ts");
    expect(source).toContain('"learning-content-source"');
    expect(source).toContain("curriculum.disabled = true");
    expect(source).toContain('"--kind", "folder"');
    expect(source).not.toContain("workspace-add");
    expect(source).not.toContain("workspace-repair");
    expect(source).not.toContain("mountKnowledgeMap");
    expect(read("desktop/src/main.ts")).toContain(
      "setLearningContentFolderPicker",
    );
  });
});
