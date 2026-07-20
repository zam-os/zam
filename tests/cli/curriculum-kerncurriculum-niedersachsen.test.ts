import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { kerncurriculumNiedersachsenProvider as provider } from "../../src/cli/curriculum/providers/kerncurriculum-niedersachsen/index.js";

describe("Kerncurriculum Niedersachsen (Phase F complete catalog)", () => {
  it("is catalog-complete with CuVo school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(500);
    const types = new Set(paths.map((p) => p.schoolType));
    expect(types.has("grundschule")).toBe(true);
    expect(types.has("oberschule")).toBe(true);
    expect(types.has("gymnasium")).toBe(true);
    expect(types.has("gymnasiale-oberstufe")).toBe(true);
  });

  it("resolves topics to CuVo PDF download URLs", () => {
    const topics = provider.listTopics({
      schoolType: "oberschule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("cuvo.nibis.de");
    expect(uri).toContain("download");
    expect(uri).toContain("upload=");
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("kerncurriculum-niedersachsen")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/kerncurriculum-niedersachsen/mathematik-oberschule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "oberschule|7|mathematik#zahlen-operationen",
      "oberschule|7|mathematik#raum-form",
    ]);
    expect(extracted["oberschule|7|mathematik#zahlen-operationen"]).toContain(
      "UNIQUE_ZAHLEN_MARKER",
    );
    expect(
      extracted["oberschule|7|mathematik#zahlen-operationen"],
    ).not.toContain("UNIQUE_RAUM_MARKER");
    expect(extracted["oberschule|7|mathematik#raum-form"]).toContain(
      "UNIQUE_RAUM_MARKER",
    );
  });
});
