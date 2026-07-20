import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { lehrplanSachsenProvider as provider } from "../../src/cli/curriculum/providers/lehrplan-sachsen/index.js";

describe("Lehrplan Sachsen (Phase J complete catalog)", () => {
  it("is catalog-complete with major Sachsen school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(500);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "oberschule",
      "gymnasium",
      "foerderschule-lernen",
      "foerderschule-geistige-entwicklung",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to stable lplandb Lehrplan URLs", () => {
    const topics = provider.listTopics({
      schoolType: "oberschule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("schulportal.sachsen.de/lplandb/lehrplan/");
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("lehrplan-sachsen")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/lehrplan-sachsen/mathematik-oberschule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "oberschule|7|mathematik#arithmetik-algebra",
      "oberschule|7|mathematik#geometrie",
    ]);
    expect(extracted["oberschule|7|mathematik#arithmetik-algebra"]).toContain(
      "UNIQUE_ARITH_MARKER",
    );
    expect(
      extracted["oberschule|7|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(extracted["oberschule|7|mathematik#geometrie"]).toContain(
      "UNIQUE_GEO_MARKER",
    );
  });
});
