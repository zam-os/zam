import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { kerncurriculumHessenProvider as provider } from "../../src/cli/curriculum/providers/kerncurriculum-hessen/index.js";

describe("Kerncurriculum Hessen (Phase E complete catalog)", () => {
  it("is catalog-complete with five school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(350);
    const types = new Set(paths.map((p) => p.schoolType));
    expect(types).toEqual(
      new Set([
        "grundschule",
        "hauptschule",
        "realschule",
        "gymnasium",
        "gymnasiale-oberstufe",
      ]),
    );
  });

  it("uses school-type-specific KC PDFs", () => {
    const rs = provider.resolveTopic(
      provider.listTopics({
        schoolType: "realschule",
        grade: "9",
        subject: "mathematik",
      })[0],
    );
    const gym = provider.resolveTopic(
      provider.listTopics({
        schoolType: "gymnasium",
        grade: "9",
        subject: "mathematik",
      })[0],
    );
    expect(rs.uri).toContain("kultus.hessen.de");
    expect(rs.uri).toMatch(/realschule/i);
    expect(gym.uri).toMatch(/gymnasium/i);
    expect(rs.uri).not.toBe(gym.uri);
  });

  it("scopes Chemie to grades 7+ and Informatik to Gymnasium Wahlunterricht", () => {
    const rs5 = provider.listSubjects("realschule", "5").map((s) => s.id);
    const rs9 = provider.listSubjects("realschule", "9").map((s) => s.id);
    expect(rs5).not.toContain("chemie");
    expect(rs9).toContain("chemie");
    expect(provider.listSubjects("gymnasium", "8").map((s) => s.id)).toContain(
      "informatik",
    );
    expect(provider.listSubjects("realschule", "8").map((s) => s.id)).not.toContain(
      "informatik",
    );
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("kerncurriculum-hessen")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/kerncurriculum-hessen/mathematik-gym.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "gymnasium|9|mathematik#zahlen-operationen",
      "gymnasium|9|mathematik#raum-form",
    ]);
    expect(extracted["gymnasium|9|mathematik#zahlen-operationen"]).toContain(
      "UNIQUE_ZAHLEN_MARKER",
    );
    expect(
      extracted["gymnasium|9|mathematik#zahlen-operationen"],
    ).not.toContain("UNIQUE_RAUM_MARKER");
    expect(extracted["gymnasium|9|mathematik#raum-form"]).toContain(
      "UNIQUE_RAUM_MARKER",
    );
  });
});
