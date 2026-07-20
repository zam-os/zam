import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { rahmenlehrplanBerlinBrandenburgProvider as provider } from "../../src/cli/curriculum/providers/rahmenlehrplan-berlin-brandenburg/index.js";

describe("Rahmenlehrplan Berlin-Brandenburg (Phase M complete catalog)", () => {
  it("is catalog-complete with major school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(400);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "integrierte-sekundarschule",
      "gymnasium",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to Bildungsserver RLP URLs", () => {
    const topics = provider.listTopics({
      schoolType: "gymnasium",
      grade: "9",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("bildungsserver.berlin-brandenburg.de");
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("rahmenlehrplan-berlin-brandenburg")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/rahmenlehrplan-berlin-brandenburg/mathematik-gymnasium.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "gymnasium|9|mathematik#arithmetik-algebra",
      "gymnasium|9|mathematik#geometrie",
    ]);
    expect(extracted["gymnasium|9|mathematik#arithmetik-algebra"]).toContain(
      "UNIQUE_ARITH_MARKER",
    );
    expect(
      extracted["gymnasium|9|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(extracted["gymnasium|9|mathematik#geometrie"]).toContain(
      "UNIQUE_GEO_MARKER",
    );
  });
});
