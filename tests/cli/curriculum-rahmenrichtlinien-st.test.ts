import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { rahmenrichtlinienStProvider as provider } from "../../src/cli/curriculum/providers/rahmenrichtlinien-st/index.js";

describe("Rahmenrichtlinien ST (Phase O complete catalog)", () => {
  it("is catalog-complete with major Sachsen-Anhalt school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(400);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "sekundarschule",
      "gymnasium",
      "gemeinschaftsschule",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to Bildungsserver LSA PDF URLs", () => {
    const topics = provider.listTopics({
      schoolType: "sekundarschule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("bildung-lsa.de");
    expect(uri).toMatch(/\.pdf$/i);
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("rahmenrichtlinien-st")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/rahmenrichtlinien-st/mathematik-sekundarschule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "sekundarschule|7|mathematik#arithmetik-algebra",
      "sekundarschule|7|mathematik#geometrie",
    ]);
    expect(
      extracted["sekundarschule|7|mathematik#arithmetik-algebra"],
    ).toContain("UNIQUE_ARITH_MARKER");
    expect(
      extracted["sekundarschule|7|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(extracted["sekundarschule|7|mathematik#geometrie"]).toContain(
      "UNIQUE_GEO_MARKER",
    );
  });
});
