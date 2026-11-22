import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("mobile academy & vision wiring", () => {
  it("routes learning paths to ZAM Academy without the removed curriculum wizard", () => {
    const html = read("mobile/index.html");
    const main = read("mobile/src/main.ts");

    expect(html).not.toContain('id="open-curriculum"');
    expect(html).not.toContain('id="curriculum-model-settings"');
    for (const id of [
      "open-academy",
      "library-curriculum",
      "curriculum-back",
      "curriculum-breadcrumb",
      "curriculum-options",
      "curriculum-status",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(main).toContain("openMobileAcademy()");
    expect(main).not.toContain("openMobileCurriculum");
    expect(main).not.toContain("curriculum_source_request");
  });

  it("provides bounded HTTPS model requests on Android and iOS without curriculum_source_request", () => {
    const cargo = read("mobile/src-tauri/Cargo.toml");
    const vision = read("mobile/src-tauri/src/vision.rs");
    const lib = read("mobile/src-tauri/src/lib.rs");

    expect(cargo).toContain(
      'cfg(any(target_os = "android", target_os = "ios"))',
    );
    expect(cargo).toMatch(
      /cfg\(any\(target_os = "android", target_os = "ios"\)\)[\s\S]*reqwest/,
    );
    expect(vision).toContain("#[cfg(mobile)]");
    expect(vision).not.toContain('#[cfg(target_os = "android")]');
    expect(lib).not.toContain("mod curriculum;");
    expect(lib).not.toContain("curriculum::curriculum_source_request");
  });
});
