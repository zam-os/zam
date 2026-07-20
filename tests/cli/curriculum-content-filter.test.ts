import { describe, expect, it } from "vitest";
import { withImportableContentOnly } from "../../src/cli/curriculum/content-filter.js";
import {
  CURRICULUM_PROVIDERS,
  getCurriculumProvider,
} from "../../src/cli/curriculum/registry.js";
import type {
  CurriculumProvider,
  CurriculumSelection,
  TopicNode,
} from "../../src/cli/curriculum/types.js";

/**
 * Stub provider with every emptiness case: a school type with no content at
 * all, a grade whose subjects are all empty, a subject without topics, and
 * a track without topics next to one with topics.
 */
const stubProvider: CurriculumProvider = {
  id: "stub",
  country: "DE",
  countryLabel: "Deutschland",
  region: "XX",
  regionLabel: "Teststaat",
  label: "Stub",
  catalogStatus: "complete",

  listSchoolTypes: () => [
    { id: "full", label: "Full" },
    { id: "hollow", label: "Hollow" },
  ],
  listGrades: (schoolType) =>
    schoolType === "full"
      ? [
          { id: "1", label: "1" },
          { id: "2", label: "2" },
        ]
      : [{ id: "1", label: "1" }],
  listSubjects: (schoolType, grade) => {
    if (schoolType !== "full" || grade !== "1") {
      return [{ id: "void", label: "Void" }];
    }
    return [
      { id: "direct", label: "Direct", description: "kept as-is" },
      { id: "tracked", label: "Tracked" },
      { id: "void", label: "Void" },
    ];
  },
  listTracks: (schoolType, grade, subject) =>
    schoolType === "full" && grade === "1" && subject === "tracked"
      ? [
          { id: "alive", label: "Alive" },
          { id: "dead", label: "Dead" },
        ]
      : [],
  listTopics: (selection: CurriculumSelection) => {
    const reachable =
      selection.schoolType === "full" &&
      selection.grade === "1" &&
      (selection.subject === "direct" ||
        (selection.subject === "tracked" && selection.track === "alive"));
    return reachable ? [{ id: "t1", label: "Topic", sourceRef: "ref" }] : [];
  },
  resolveTopic: (topic: TopicNode) => ({
    provider: "stub",
    topicId: topic.id,
    uri: "https://example.invalid/topic",
  }),
};

describe("withImportableContentOnly", () => {
  const filtered = withImportableContentOnly(stubProvider);

  it("hides subjects that cannot reach any topic", () => {
    expect(filtered.listSubjects("full", "1").map((s) => s.id)).toEqual([
      "direct",
      "tracked",
    ]);
  });

  it("hides tracks without topics but keeps topic-bearing siblings", () => {
    expect(
      filtered.listTracks("full", "1", "tracked").map((t) => t.id),
    ).toEqual(["alive"]);
  });

  it("hides grades and school types whose options are all empty", () => {
    expect(filtered.listGrades("full").map((g) => g.id)).toEqual(["1"]);
    expect(filtered.listSchoolTypes().map((s) => s.id)).toEqual(["full"]);
  });

  it("passes surviving nodes through untouched", () => {
    expect(filtered.listSubjects("full", "1")[0]).toEqual({
      id: "direct",
      label: "Direct",
      description: "kept as-is",
    });
    expect(filtered.id).toBe("stub");
    expect(
      filtered.listTopics({
        schoolType: "full",
        grade: "1",
        subject: "direct",
      }),
    ).toHaveLength(1);
  });
});

describe("registered curriculum providers — no dead ends", () => {
  it("wraps the registry so empty FOS/Realschule/BOS combos disappear", () => {
    const bayern = getCurriculumProvider("lehrplanplus-bayern");
    if (!bayern) throw new Error("lehrplanplus-bayern not registered");

    // The user-reported case: FOS grades 10/11 list no Informatik because
    // LehrplanPLUS only publishes it for grades 12/13.
    expect(bayern.listSubjects("fos", "10").map((s) => s.id)).not.toContain(
      "informatik",
    );
    expect(bayern.listSubjects("fos", "11").map((s) => s.id)).not.toContain(
      "informatik",
    );
    expect(bayern.listSubjects("fos", "12").map((s) => s.id)).toContain(
      "informatik",
    );

    expect(
      bayern.listSubjects("realschule", "5").map((s) => s.id),
    ).not.toContain("chemie");
    expect(bayern.listSubjects("realschule", "9").map((s) => s.id)).toContain(
      "mathematik",
    );
    expect(bayern.listSubjects("bos", "12").map((s) => s.id)).not.toContain(
      "deutsch",
    );

    // Filtering must not cost any school type or grade its place today.
    expect(bayern.listSchoolTypes()).toHaveLength(8);
    expect(bayern.listGrades("fos").map((g) => g.id)).toEqual([
      "10",
      "11",
      "12",
      "13",
    ]);
  });

  it("every listed option of every provider reaches a resolvable topic", () => {
    for (const provider of CURRICULUM_PROVIDERS) {
      for (const schoolType of provider.listSchoolTypes()) {
        const grades = provider.listGrades(schoolType.id);
        expect(
          grades.length,
          `${provider.id}: school type ${schoolType.id} lists no grades`,
        ).toBeGreaterThan(0);

        for (const grade of grades) {
          const subjects = provider.listSubjects(schoolType.id, grade.id);
          expect(
            subjects.length,
            `${provider.id}: ${schoolType.id}|${grade.id} lists no subjects`,
          ).toBeGreaterThan(0);

          for (const subject of subjects) {
            const tracks = provider.listTracks(
              schoolType.id,
              grade.id,
              subject.id,
            );
            const selections: CurriculumSelection[] =
              tracks.length === 0
                ? [
                    {
                      schoolType: schoolType.id,
                      grade: grade.id,
                      subject: subject.id,
                    },
                  ]
                : tracks.map((track) => ({
                    schoolType: schoolType.id,
                    grade: grade.id,
                    subject: subject.id,
                    track: track.id,
                  }));

            let reachableTopics = 0;
            for (const selection of selections) {
              const topics = provider.listTopics(selection);
              reachableTopics += topics.length;
              for (const topic of topics) {
                const resolved = provider.resolveTopic(topic);
                expect(
                  resolved.uri,
                  `${provider.id}: ${JSON.stringify(selection)} topic ${topic.id} has no source URL`,
                ).toMatch(/^https?:\/\//);
              }
            }
            expect(
              reachableTopics,
              `${provider.id}: ${schoolType.id}|${grade.id}|${subject.id} is a dead end`,
            ).toBeGreaterThan(0);
          }
        }
      }
    }
  });
});
