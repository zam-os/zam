import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("mobile curriculum wiring", () => {
  it("exposes one native curriculum flow from the library", () => {
    const html = read("mobile/index.html");
    const main = read("mobile/src/main.ts");

    for (const id of [
      "open-curriculum",
      "library-curriculum",
      "curriculum-back",
      "curriculum-breadcrumb",
      "curriculum-options",
      "curriculum-status",
    ]) {
      expect(html).toContain(`id="${id}"`);
    }
    expect(main).toContain("resolveMobileCurriculumPosition(");
    expect(main).toContain('invoke<string>("curriculum_source_request"');
    expect(main).toContain("previewMobileCurriculumTopic(db");
  });

  it("provides bounded HTTPS source and model requests on Android and iOS", () => {
    const cargo = read("mobile/src-tauri/Cargo.toml");
    const source = read("mobile/src-tauri/src/curriculum.rs");
    const vision = read("mobile/src-tauri/src/vision.rs");
    const lib = read("mobile/src-tauri/src/lib.rs");

    expect(cargo).toContain(
      'cfg(any(target_os = "android", target_os = "ios"))',
    );
    expect(cargo).toMatch(
      /cfg\(any\(target_os = "android", target_os = "ios"\)\)[\s\S]*reqwest/,
    );
    expect(source).toContain("#[cfg(mobile)]");
    expect(source).toContain('parsed.scheme() != "https"');
    expect(source).toContain("MAX_RESPONSE_BYTES");
    expect(vision).toContain("#[cfg(mobile)]");
    expect(vision).not.toContain('#[cfg(target_os = "android")]');
    expect(lib).toContain("curriculum::curriculum_source_request");
  });
});
