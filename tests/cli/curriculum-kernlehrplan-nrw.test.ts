import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { kernlehrplanNrwProvider as provider } from "../../src/cli/curriculum/providers/kernlehrplan-nrw/index.js";

describe("Kernlehrplan NRW (Phase G complete catalog)", () => {
  it("is catalog-complete with major NRW school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(700);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "hauptschule",
      "realschule",
      "gesamtschule",
      "gymnasium",
      "gymnasiale-oberstufe",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to Lehrplannavigator PDF URLs", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("lehrplannavigator.nrw.de");
    expect(uri).toMatch(/\.pdf$/i);
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("kernlehrplan-nrw")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/kernlehrplan-nrw/mathematik-realschule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "realschule|7|mathematik#arithmetik-algebra",
      "realschule|7|mathematik#geometrie",
    ]);
    expect(extracted["realschule|7|mathematik#arithmetik-algebra"]).toContain(
      "UNIQUE_ARITH_MARKER",
    );
    expect(
      extracted["realschule|7|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(extracted["realschule|7|mathematik#geometrie"]).toContain(
      "UNIQUE_GEO_MARKER",
    );
  });
});
