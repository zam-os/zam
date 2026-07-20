import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { lehrplanSaarlandProvider as provider } from "../../src/cli/curriculum/providers/lehrplan-saarland/index.js";

describe("Lehrplan Saarland (Phase I complete catalog)", () => {
  it("is catalog-complete with major Saarland school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(250);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "gemeinschaftsschule",
      "gymnasium",
      "gymnasiale-oberstufe",
      "foerderschule",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to SharedDocs PDF URLs", () => {
    const topics = provider.listTopics({
      schoolType: "gemeinschaftsschule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("saarland.de");
    expect(uri).toMatch(/SharedDocs|Downloads/i);
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("lehrplan-saarland")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/lehrplan-saarland/mathematik-gemeinschaftsschule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "gemeinschaftsschule|7|mathematik#arithmetik-algebra",
      "gemeinschaftsschule|7|mathematik#geometrie",
    ]);
    expect(
      extracted["gemeinschaftsschule|7|mathematik#arithmetik-algebra"],
    ).toContain("UNIQUE_ARITH_MARKER");
    expect(
      extracted["gemeinschaftsschule|7|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(
      extracted["gemeinschaftsschule|7|mathematik#geometrie"],
    ).toContain("UNIQUE_GEO_MARKER");
  });
});
