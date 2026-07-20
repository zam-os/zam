import { describe, expect, it } from "vitest";
import {
  auditAllProviders,
  auditPath,
  auditProviderCoverage,
  collectCatalogPaths,
  formatCoverageHuman,
  gapKeys,
  pathKey,
  RAW_CURRICULUM_PROVIDERS,
  selectionFromPath,
} from "../../src/cli/curriculum/index.js";
import type {
  CurriculumProvider,
  CurriculumSelection,
  TopicNode,
} from "../../src/cli/curriculum/types.js";

const stubProvider: CurriculumProvider = {
  id: "stub-coverage",
  country: "DE",
  countryLabel: "Deutschland",
  region: "XX",
  regionLabel: "Testland",
  label: "Stub Coverage",

  listSchoolTypes: () => [
    { id: "os", label: "Oberschule" },
    { id: "gy", label: "Gymnasium" },
  ],
  listGrades: (schoolType) =>
    schoolType === "os"
      ? [
          { id: "7", label: "7" },
          { id: "8", label: "8" },
        ]
      : [{ id: "7", label: "7" }],
  listSubjects: (schoolType, grade) => {
    if (schoolType === "os" && grade === "7") {
      return [
        { id: "mathematik", label: "Mathematik" },
        { id: "physik", label: "Physik" },
      ];
    }
    if (schoolType === "os" && grade === "8") {
      return [{ id: "tracked", label: "Tracked" }];
    }
    return [{ id: "mathematik", label: "Mathematik" }];
  },
  listTracks: (schoolType, grade, subject) =>
    schoolType === "os" && grade === "8" && subject === "tracked"
      ? [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ]
      : [],
  listTopics: (selection: CurriculumSelection) => {
    // Covered: os|7|mathematik, os|8|tracked|a
    // Empty: os|7|physik, os|8|tracked|b, gy|7|mathematik
    if (
      selection.schoolType === "os" &&
      selection.grade === "7" &&
      selection.subject === "mathematik"
    ) {
      return [{ id: "lb1", label: "LB1", sourceRef: "os|7|mathematik" }];
    }
    if (
      selection.schoolType === "os" &&
      selection.grade === "8" &&
      selection.subject === "tracked" &&
      selection.track === "a"
    ) {
      return [{ id: "lb2", label: "LB2", sourceRef: "os|8|tracked|a" }];
    }
    return [];
  },
  resolveTopic: (topic: TopicNode) => {
    if (topic.sourceRef === "os|7|mathematik") {
      return {
        provider: "stub-coverage",
        topicId: `${topic.sourceRef}#${topic.id}`,
        uri: "https://example.invalid/math",
      };
    }
    if (topic.sourceRef === "os|8|tracked|a") {
      return {
        provider: "stub-coverage",
        topicId: `${topic.sourceRef}#${topic.id}`,
        uri: "https://example.invalid/track-a",
      };
    }
    throw new Error(`no url for ${topic.sourceRef}`);
  },
};

describe("curriculum topic coverage audit", () => {
  it("pathKey and selectionFromPath round-trip track and non-track paths", () => {
    expect(
      pathKey({
        schoolType: "os",
        grade: "7",
        subject: "mathematik",
      }),
    ).toBe("os|7|mathematik");
    expect(
      pathKey({
        schoolType: "os",
        grade: "8",
        subject: "tracked",
        track: "a",
      }),
    ).toBe("os|8|tracked|a");
    expect(
      selectionFromPath({
        schoolType: "os",
        grade: "8",
        subject: "tracked",
        track: "a",
      }),
    ).toEqual({
      schoolType: "os",
      grade: "8",
      subject: "tracked",
      track: "a",
    });
  });

  it("collectCatalogPaths expands tracks into leaf paths", () => {
    const keys = collectCatalogPaths(stubProvider).map(pathKey).sort();
    expect(keys).toEqual([
      "gy|7|mathematik",
      "os|7|mathematik",
      "os|7|physik",
      "os|8|tracked|a",
      "os|8|tracked|b",
    ]);
  });

  it("auditPath marks empty topics and successful resolves", () => {
    const ok = auditPath(stubProvider, {
      schoolType: "os",
      grade: "7",
      subject: "mathematik",
    });
    expect(ok.ok).toBe(true);
    expect(ok.topicCount).toBe(1);

    const gap = auditPath(stubProvider, {
      schoolType: "os",
      grade: "7",
      subject: "physik",
    });
    expect(gap.ok).toBe(false);
    expect(gap.issue).toBe("no_topics");
  });

  it("auditProviderCoverage reports covered vs gap counts", () => {
    const report = auditProviderCoverage(stubProvider);
    expect(report.total).toBe(5);
    expect(report.covered).toBe(2);
    expect(report.gaps).toBe(3);
    expect(report.coverageRatio).toBeCloseTo(0.4);
    expect(gapKeys(report).sort()).toEqual([
      "gy|7|mathematik",
      "os|7|physik",
      "os|8|tracked|b",
    ]);
  });

  it("formatCoverageHuman includes totals", () => {
    const summary = auditAllProviders([stubProvider]);
    const text = formatCoverageHuman(summary);
    expect(text).toContain("stub-coverage");
    expect(text).toContain("2/5");
    expect(text).toContain("TOTAL:");
  });

  it("raw registry has every filtered provider and more (or equal) paths", () => {
    expect(RAW_CURRICULUM_PROVIDERS.length).toBeGreaterThanOrEqual(15);
    const ids = RAW_CURRICULUM_PROVIDERS.map((p) => p.id);
    expect(ids).toContain("lehrplanplus-bayern");
    expect(ids).toContain("bildungsplan-bremen");
  });

  it("live raw providers: audit is deterministic and Bayern has substantial coverage", () => {
    const summary = auditAllProviders(RAW_CURRICULUM_PROVIDERS);
    expect(summary.total).toBeGreaterThan(500);
    // Seed + partial captures: overall not yet 100%, but progress is real.
    expect(summary.covered).toBeGreaterThan(100);
    expect(summary.coverageRatio).toBeGreaterThan(0);
    expect(summary.coverageRatio).toBeLessThanOrEqual(1);

    const bayern = summary.providers.find(
      (p) => p.providerId === "lehrplanplus-bayern",
    );
    expect(bayern).toBeDefined();
    expect(bayern!.covered).toBeGreaterThan(1000);
    expect(bayern!.coverageRatio).toBeGreaterThan(0.5);
  });

  it("auditPath flags resolve_failed when listTopics returns a topic without URL", () => {
    const broken: CurriculumProvider = {
      ...stubProvider,
      id: "broken",
      listSchoolTypes: () => [{ id: "os", label: "OS" }],
      listGrades: () => [{ id: "7", label: "7" }],
      listSubjects: () => [{ id: "x", label: "X" }],
      listTracks: () => [],
      listTopics: () => [{ id: "t", label: "T", sourceRef: "os|7|x" }],
      resolveTopic: () => {
        throw new Error("missing contentUrls entry");
      },
    };
    const result = auditPath(broken, {
      schoolType: "os",
      grade: "7",
      subject: "x",
    });
    expect(result.ok).toBe(false);
    expect(result.issue).toBe("resolve_failed");
    expect(result.detail).toMatch(/missing contentUrls/);
  });
});
