import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditProviderCoverage,
  getRawCurriculumProvider,
} from "../../src/cli/curriculum/index.js";
import { bildungsplanBremenProvider as provider } from "../../src/cli/curriculum/providers/bildungsplan-bremen/index.js";
import { extractPdfText, isPdfUrl } from "../../src/cli/curriculum/pdf-text.js";

describe("Bildungsplan Bremen (Phase A complete catalog)", () => {
  it("is registered as catalog-complete with explicit leaves", () => {
    expect(provider.catalogStatus).toBe("complete");
    expect(provider.listCatalogPaths).toBeTypeOf("function");
    const paths = provider.listCatalogPaths!();
    expect(paths.length).toBeGreaterThan(300);
    expect(paths.some((p) => p.schoolType === "primarstufe")).toBe(true);
    expect(paths.some((p) => p.schoolType === "oberschule")).toBe(true);
    expect(paths.some((p) => p.schoolType === "gymnasium")).toBe(true);
    expect(paths.some((p) => p.schoolType === "gymnasiale-oberstufe")).toBe(
      true,
    );
  });

  it("exposes grade-scoped subjects (no Naturwissenschaften in Jg. 9)", () => {
    const os5 = provider.listSubjects("oberschule", "5").map((s) => s.id);
    const os9 = provider.listSubjects("oberschule", "9").map((s) => s.id);
    expect(os5).toContain("naturwissenschaften");
    expect(os5).not.toContain("biologie");
    expect(os9).toContain("biologie");
    expect(os9).toContain("chemie");
    expect(os9).toContain("physik");
    expect(os9).not.toContain("naturwissenschaften");
  });

  it("resolves topics to official PDF content URLs, not the landing page", () => {
    const topics = provider.listTopics({
      schoolType: "oberschule",
      grade: "5",
      subject: "mathematik",
    });
    expect(topics.length).toBeGreaterThanOrEqual(4);
    const resolved = provider.resolveTopic(topics[0]);
    expect(resolved.uri).toMatch(/\.pdf/i);
    expect(resolved.uri).toContain("lis.bremen.de");
    expect(resolved.uri).not.toContain("bildungsplaene-21942");
    expect(isPdfUrl(resolved.uri)).toBe(true);
  });

  it("coverage audit is 100% for the complete Bremen catalog", () => {
    const raw = getRawCurriculumProvider("bildungsplan-bremen");
    expect(raw).toBeDefined();
    const report = auditProviderCoverage(raw!);
    expect(report.catalogComplete).toBe(true);
    expect(report.gaps).toBe(0);
    expect(report.covered).toBe(report.total);
    expect(report.total).toBeGreaterThan(300);
  });

  it("extracts sibling Mathematik topics without cross-contamination", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/bildungsplan-bremen/mathematik-oberschule-5-10.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "oberschule|5|mathematik#arithmetik-algebra",
      "oberschule|5|mathematik#geometrie",
    ]);
    const a = extracted["oberschule|5|mathematik#arithmetik-algebra"];
    const g = extracted["oberschule|5|mathematik#geometrie"];
    expect(a).toContain("Arithmetik / Algebra");
    expect(g).toContain("Geometrie");
    // Geometrie section body should not be the only content of Arithmetik extract
    expect(a).not.toMatch(/^Geometrie\n/);
  });

  it("extracts Deutsch Oberschule topics from the offline fixture", () => {
    const html = fs.readFileSync(
      path.resolve(
        "tests/fixtures/curriculum/bildungsplan-bremen/deutsch-oberschule.html",
      ),
      "utf-8",
    );
    const extracted = provider.extractTopics!(html, [
      "oberschule|7|deutsch#sprechen-zuhoeren",
      "oberschule|7|deutsch#schreiben",
    ]);
    expect(extracted["oberschule|7|deutsch#sprechen-zuhoeren"]).toContain(
      "Sprechen und Zuhören",
    );
    expect(extracted["oberschule|7|deutsch#schreiben"]).toContain("Schreiben");
    expect(extracted["oberschule|7|deutsch#schreiben"]).not.toContain(
      "Sprechen und Zuhören",
    );
  });

  it("hard-omits topics when the document has no matching section", () => {
    const extracted = provider.extractTopics!(
      "<html><body><h1>Unrelated</h1><p>no match</p></body></html>",
      ["oberschule|5|mathematik#arithmetik-algebra"],
    );
    expect(
      extracted["oberschule|5|mathematik#arithmetik-algebra"],
    ).toBeUndefined();
  });

  it("extractPdfText can read a real Bremen PDF when pdftotext is available", () => {
    // Optional system-tool smoke: skip if poppler is not installed (CI may
    // still run pure fixture tests above).
    const sample = path.resolve("/tmp/bremen-bp/osch_mathe.pdf");
    if (!fs.existsSync(sample)) {
      return;
    }
    try {
      const bytes = new Uint8Array(fs.readFileSync(sample));
      const text = extractPdfText(bytes);
      expect(text).toMatch(/Mathematik/i);
      expect(text.length).toBeGreaterThan(500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("could not run pdftotext")) return;
      throw err;
    }
  });
});
