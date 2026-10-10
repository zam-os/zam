import { mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { setCurrentLocale, t } from "../../desktop/src/i18n.js";
import { planSourceMap } from "../../desktop/src/knowledge-map/source-plan.js";
import { readSourceFile } from "../../src/cli/learning-content/browse.js";
import { citationTarget } from "../../src/cli/learning-content/citation.js";
import { isSkillSource } from "../../src/cli/provisioning/index.js";

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
    expect(t("onboarding_content_curriculum_action")).toBe(
      "Quellen → Lehrplan",
    );
    expect(t("lbl_bundled_cells_desc")).toContain("Quellen → Lehrplan");
    expect(t("content_source_skill")).toBe("Skillquelle");
    expect(t("btn_content_source_map")).toBe("Wissenskarte anzeigen");
    expect(t("content_source_reader_empty")).toBe(
      "Wähle einen Artikel, um ihn hier zu lesen.",
    );
    setCurrentLocale("en");
    expect(t("lbl_content_source")).toBe("Source");
    expect(t("btn_content_choose_folder")).toBe("Choose folder…");
    expect(t("onboarding_content_curriculum_action")).toBe(
      "Sources → Curriculum",
    );
    expect(t("content_source_skill")).toBe("Skill source");
    expect(t("content_source_reader_refused")).toBe(
      "That file is outside this source.",
    );
  });

  it("puts the Quelle controls in both shells and hosts the curriculum browser", () => {
    const desktop = read("desktop/index.html");
    const panel = read("desktop/src/panel/studio-panel.html");
    for (const id of [
      "content-source-select",
      "btn-content-choose-folder",
      "content-sources-path",
      "content-sources-note",
      "content-sources-body",
      "content-sources-map",
      "content-sources-okf-list",
      "content-sources-reader-body",
      "content-sources-curriculum",
      "curriculum-wizard-step-body",
      "btn-curriculum-wizard-next",
    ]) {
      expect(desktop, id).toContain(`id="${id}"`);
      expect(panel, id).toContain(`id="${id}"`);
    }
    expect(desktop).not.toContain("btn-content-curriculum-wizard");
    expect(panel).not.toContain("btn-content-curriculum-wizard");

    const source = read("desktop/src/learning-content-sources.ts");
    expect(source).toContain('"learning-content-source"');
    expect(source).toContain('"--kind", "curriculum"');
    expect(source).not.toContain("curriculum.disabled = true");
    expect(source).not.toContain("content_source_curriculum_wait");
    expect(source).toContain('"--kind", "folder"');
    expect(source).not.toContain("workspace-add");
    expect(source).not.toContain("workspace-repair");
    expect(source).not.toContain("mountKnowledgeMap");
    expect(source).not.toContain("curriculum-confirm-topic");
    expect(source).not.toContain("bundled-cell-enrol");
    expect(source).toContain("showSourceKnowledge");
    const wizard = read("desktop/src/curriculum-wizard.ts");
    expect(wizard).toContain('"curriculum-confirm-topic"');
    expect(wizard).toContain('"bundled-cell-enrol"');
    expect(wizard).not.toContain("plugin-opener");
    expect(wizard).not.toContain("btn-content-curriculum-wizard");
    const main = read("desktop/src/main.ts");
    expect(main).toContain("setLearningContentFolderPicker");
    expect(main).toContain("setLearningContentCurriculumHost");
    expect(main).toContain("openLearningContentCurriculum");
    expect(main).not.toContain("btn-content-curriculum-wizard");
    expect(read("desktop/src/panel/panel.ts")).toContain(
      "setLearningContentCurriculumHost",
    );
  });

  it("skips the example map for the skill source and does not open an outside citation", () => {
    expect(
      planSourceMap({ skillSource: true, found: false, valid: false }),
    ).toEqual({ draw: "none", notice: "missing" });
    expect(
      planSourceMap({ skillSource: true, found: true, valid: false }),
    ).toEqual({ draw: "none", notice: "invalid-own" });
    expect(
      planSourceMap({ skillSource: false, found: false, valid: false }).draw,
    ).toBe("example");
    expect(
      planSourceMap({ skillSource: true, found: true, valid: true }),
    ).toEqual({ draw: "own", notice: null });

    expect(citationTarget("https://example.com/secret.md")).toBeNull();
    expect(citationTarget("/etc/passwd")).toBeNull();
    expect(citationTarget("docs/okf/bridge-protocol.md#citations")).toBe(
      "docs/okf/bridge-protocol.md",
    );

    const repo = mkdtempSync(join(tmpdir(), "zam-quelle-"));
    writeFileSync(join(repo, "readme.txt"), "inside");
    const outside = readSourceFile(repo, "../../../../../../../etc/passwd");
    expect(outside.opened).toBe(false);
    expect(outside.reason).toBe("outside");
    expect(outside.body).toBeUndefined();
    const link = join(repo, "leak.txt");
    symlinkSync("/etc/passwd", link);
    expect(readSourceFile(repo, "leak.txt").opened).toBe(false);
    expect(readSourceFile(repo, "readme.txt")).toMatchObject({
      opened: true,
      kind: "text",
      body: "inside",
    });

    expect(isSkillSource(process.cwd())).toBe(true);
    expect(isSkillSource(repo)).toBe(false);
    const linked = join(repo, "package-link");
    symlinkSync(process.cwd(), linked);
    expect(isSkillSource(linked)).toBe(true);

    const knowledge = read("desktop/src/learning-content-knowledge.ts");
    expect(knowledge).not.toContain("openUrl");
    expect(knowledge).not.toContain("plugin-opener");
    expect(knowledge).not.toContain("workspace-add");
    expect(knowledge).not.toContain("workspace-repair");
    expect(knowledge).not.toContain("upsertArticle");
    expect(knowledge).not.toContain("writeKnowledgeMap");
    expect(knowledge).not.toContain("knowledge-map-feedback");
    expect(knowledge).not.toContain('knowledge-map-feature", ["--repo"');
    const studio = read("desktop/src/knowledge-map/studio.ts");
    const mount = studio.slice(
      studio.indexOf("export async function mountSourceKnowledgeMap"),
    );
    expect(mount).toContain('["--repo", options.repo]');
    expect(mount).not.toContain("pickFolder");
    expect(mount).not.toContain('knowledge-map-feature", ["--repo"');
    expect(mount).toContain('if (plan.draw === "example")');
    expect(mount.indexOf('if (plan.draw === "none")')).toBeLessThan(
      mount.indexOf("sampleMap()"),
    );
  });
});
