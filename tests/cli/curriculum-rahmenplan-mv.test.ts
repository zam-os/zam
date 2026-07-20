import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { rahmenplanMvProvider as provider } from "../../src/cli/curriculum/providers/rahmenplan-mv/index.js";

describe("Rahmenplan MV (Phase N complete catalog)", () => {
  it("is catalog-complete with major MV school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(300);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "orientierungsstufe",
      "regionale-schule",
      "gymnasium",
      "gymnasiale-oberstufe",
      "foerderschule-lernen",
      "foerderschule-geistige-entwicklung",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to Bildungsserver PDF Rahmenpläne", () => {
    const topics = provider.listTopics({
      schoolType: "regionale-schule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("bildung-mv.de");
    expect(uri).toMatch(/\.pdf$/i);
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("rahmenplan-mv")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/rahmenplan-mv/mathematik-regionale-schule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "regionale-schule|7|mathematik#arithmetik-algebra",
      "regionale-schule|7|mathematik#geometrie",
    ]);
    expect(
      extracted["regionale-schule|7|mathematik#arithmetik-algebra"],
    ).toContain("UNIQUE_ARITH_MARKER");
    expect(
      extracted["regionale-schule|7|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(extracted["regionale-schule|7|mathematik#geometrie"]).toContain(
      "UNIQUE_GEO_MARKER",
    );
  });
});
