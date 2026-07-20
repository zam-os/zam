import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { lehrplanThueringenProvider as provider } from "../../src/cli/curriculum/providers/lehrplan-thueringen/index.js";

describe("Lehrplan Thüringen (Phase K complete catalog)", () => {
  it("is catalog-complete with major Thüringen school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(300);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "regelschule",
      "gymnasium",
      "gemeinschaftsschule",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to Schulportal PDF resource URLs", () => {
    const topics = provider.listTopics({
      schoolType: "regelschule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("schulportal-thueringen.de");
    expect(uri).toMatch(/tip\/resources|\.pdf/i);
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("lehrplan-thueringen")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/lehrplan-thueringen/mathematik-regelschule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "regelschule|7|mathematik#arithmetik-algebra",
      "regelschule|7|mathematik#geometrie",
    ]);
    expect(extracted["regelschule|7|mathematik#arithmetik-algebra"]).toContain(
      "UNIQUE_ARITH_MARKER",
    );
    expect(
      extracted["regelschule|7|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(extracted["regelschule|7|mathematik#geometrie"]).toContain(
      "UNIQUE_GEO_MARKER",
    );
  });
});
