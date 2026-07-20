import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { lehrplaeneRpProvider as provider } from "../../src/cli/curriculum/providers/lehrplaene-rp/index.js";

describe("Lehrpläne RP (Phase H complete catalog)", () => {
  it("is catalog-complete with major RP school types", () => {
    expect(provider.catalogStatus).toBe("complete");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(700);
    const types = new Set(paths.map((p) => p.schoolType));
    for (const t of [
      "grundschule",
      "hauptschule",
      "realschule",
      "realschule-plus",
      "gymnasium",
      "integrierte-gesamtschule",
      "gymnasiale-oberstufe",
      "foerderschule",
    ]) {
      expect(types.has(t)).toBe(true);
    }
  });

  it("resolves topics to Bildungsserver download URLs", () => {
    const topics = provider.listTopics({
      schoolType: "realschule-plus",
      grade: "7",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(3);
    const uri = provider.resolveTopic(topics[0]).uri;
    expect(uri).toContain("bildung.rlp.de/lehrplaene");
    expect(uri).toContain("tx_rlpbase_download");
  });

  it("coverage audit is 100%", () => {
    const report = auditProviderCoverage(
      getRawCurriculumProvider("lehrplaene-rp")!,
    );
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/lehrplaene-rp/mathematik-realschule-plus.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "realschule-plus|7|mathematik#arithmetik-algebra",
      "realschule-plus|7|mathematik#geometrie",
    ]);
    expect(
      extracted["realschule-plus|7|mathematik#arithmetik-algebra"],
    ).toContain("UNIQUE_ARITH_MARKER");
    expect(
      extracted["realschule-plus|7|mathematik#arithmetik-algebra"],
    ).not.toContain("UNIQUE_GEO_MARKER");
    expect(extracted["realschule-plus|7|mathematik#geometrie"]).toContain(
      "UNIQUE_GEO_MARKER",
    );
  });
});
