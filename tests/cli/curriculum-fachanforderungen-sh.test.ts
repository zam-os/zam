import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { fachanforderungenShProvider as provider } from "../../src/cli/curriculum/providers/fachanforderungen-sh/index.js";

describe("Fachanforderungen Schleswig-Holstein (Phase D complete catalog)", () => {
  it("is catalog-complete with four school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(300);
    const types = new Set(paths.map((p) => p.schoolType));
    expect(types).toEqual(
      new Set([
        "grundschule",
        "gemeinschaftsschule",
        "gymnasium",
        "gymnasiale-oberstufe",
      ]),
    );
  });

  it("uses 2026 Fachanforderungen PDFs for Bio/Chemie/Physik", () => {
    const bio = provider.listTopics({
      schoolType: "gemeinschaftsschule",
      grade: "9",
      subject: "biologie",
    });
    const uri = provider.resolveTopic(bio[0]).uri;
    expect(uri).toContain("fachportal.lernnetz.de");
    expect(uri).toMatch(/Biologie.*2026|2026.*Biologie/i);
    expect(uri).toMatch(/\.pdf$/i);
  });

  it("scopes Naturwissenschaften to grades 5/6", () => {
    const g5 = provider
      .listSubjects("gemeinschaftsschule", "5")
      .map((s) => s.id);
    const g9 = provider
      .listSubjects("gemeinschaftsschule", "9")
      .map((s) => s.id);
    expect(g5).toContain("naturwissenschaften");
    expect(g9).not.toContain("naturwissenschaften");
    expect(g9).toContain("physik");
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("fachanforderungen-sh")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/fachanforderungen-sh/mathematik-sek1.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "gemeinschaftsschule|7|mathematik#zahlen-operationen",
      "gemeinschaftsschule|7|mathematik#raum-form",
    ]);
    const z = extracted["gemeinschaftsschule|7|mathematik#zahlen-operationen"];
    const r = extracted["gemeinschaftsschule|7|mathematik#raum-form"];
    expect(z).toContain("UNIQUE_ZAHLEN_MARKER");
    expect(z).not.toContain("UNIQUE_RAUM_MARKER");
    expect(r).toContain("UNIQUE_RAUM_MARKER");
  });
});
