import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { bildungsplanHamburgProvider as provider } from "../../src/cli/curriculum/providers/bildungsplan-hamburg/index.js";

describe("Bildungsplan Hamburg (Phase C complete catalog)", () => {
  it("is catalog-complete with all four school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(350);
    const types = new Set(paths.map((p) => p.schoolType));
    expect(types).toEqual(
      new Set([
        "grundschule",
        "stadtteilschule",
        "gymnasium",
        "studienstufe",
      ]),
    );
  });

  it("scopes Naturwissenschaften/Technik to grades 5/6 only", () => {
    const sts5 = provider.listSubjects("stadtteilschule", "5").map((s) => s.id);
    const sts9 = provider.listSubjects("stadtteilschule", "9").map((s) => s.id);
    expect(sts5).toContain("naturwissenschaften-technik");
    expect(sts9).not.toContain("naturwissenschaften-technik");
    expect(sts9).toContain("biologie");
  });

  it("resolves topics to dokumente.hamburg.de PDF URLs", () => {
    const topics = provider.listTopics({
      schoolType: "stadtteilschule",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(4);
    const resolved = provider.resolveTopic(topics[0]);
    expect(resolved.uri).toContain("dokumente.hamburg.de");
    expect(resolved.uri).toMatch(/\.pdf$/i);
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("bildungsplan-hamburg")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/bildungsplan-hamburg/mathematik-sts.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "stadtteilschule|7|mathematik#zahlen-operationen",
      "stadtteilschule|7|mathematik#raum-form",
    ]);
    const z = extracted["stadtteilschule|7|mathematik#zahlen-operationen"];
    const r = extracted["stadtteilschule|7|mathematik#raum-form"];
    expect(z).toContain("UNIQUE_ZAHLEN_MARKER");
    expect(z).not.toContain("UNIQUE_RAUM_MARKER");
    expect(r).toContain("UNIQUE_RAUM_MARKER");
    expect(r).not.toContain("UNIQUE_ZAHLEN_MARKER");
  });
});
