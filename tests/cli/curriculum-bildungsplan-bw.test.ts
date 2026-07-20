import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { bildungsplanBwProvider as provider } from "../../src/cli/curriculum/providers/bildungsplan-bw/index.js";

describe("Bildungsplan Baden-Württemberg (Phase B complete catalog)", () => {
  it("is registered as catalog-complete with explicit leaves", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(400);
    expect(paths.some((p) => p.schoolType === "grundschule")).toBe(true);
    expect(paths.some((p) => p.schoolType === "sek1")).toBe(true);
    expect(paths.some((p) => p.schoolType === "gymnasium")).toBe(true);
    expect(
      paths.some((p) => p.schoolType === "gemeinschaftsschule-oberstufe"),
    ).toBe(true);
  });

  it("exposes grade-scoped subjects (BNT only in 5/6)", () => {
    const g5 = provider.listSubjects("gymnasium", "5").map((s) => s.id);
    const g9 = provider.listSubjects("gymnasium", "9").map((s) => s.id);
    expect(g5).toContain("bnt");
    expect(g9).not.toContain("bnt");
    expect(g9).toContain("mathematik");
  });

  it("resolves topics to official portal HTML URLs", () => {
    const topics = provider.listTopics({
      schoolType: "gymnasium",
      grade: "10",
      subject: "mathematik",
    });
    expect(topics.length).toBe(5);
    const resolved = provider.resolveTopic(topics[0]);
    expect(resolved.uri).toContain("bildungsplaene-bw.de");
    expect(resolved.uri).toContain("BP2016BW_ALLG_GYM_M");
  });

  it("coverage audit is 100% for the complete BW catalog", () => {
    const raw = getRawCurriculumProvider("bildungsplan-bw");
    const report = auditProviderCoverage(raw!);
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
    expect(report.total).toBeGreaterThan(400);
  });

  it("extracts sibling Leitideen without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/bildungsplan-bw/mathematik-gym-10.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "gymnasium|10|mathematik#leitidee-zahl",
      "gymnasium|10|mathematik#leitidee-raum",
    ]);
    const zahl = extracted["gymnasium|10|mathematik#leitidee-zahl"];
    const raum = extracted["gymnasium|10|mathematik#leitidee-raum"];
    expect(zahl).toContain("UNIQUE_ZAHL_MARKER");
    expect(zahl).not.toContain("UNIQUE_RAUM_MARKER");
    expect(raum).toContain("UNIQUE_RAUM_MARKER");
    expect(raum).not.toContain("UNIQUE_ZAHL_MARKER");
  });

  it("hard-omits topics against a non-matching document", () => {
    const extracted = provider.extractTopics!(
      "<html><body><h1>Unrelated</h1><p>no match</p></body></html>",
      ["gymnasium|10|mathematik#leitidee-zahl"],
    );
    expect(extracted["gymnasium|10|mathematik#leitidee-zahl"]).toBeUndefined();
  });
});
