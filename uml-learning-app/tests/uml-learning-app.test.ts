import { describe, expect, it } from "vitest";
import { evaluateDiagramAgainstCriteria } from "../src/checker/graph-evaluator";
import {
  getAllLessons,
  getLearningStages,
  getStarterDiagramForLevel,
  LEARNING_STAGES,
} from "../src/curriculum/learning-path";
import {
  exportToMermaid,
  exportToPlantUml,
} from "../src/exporters/code-exporters";
import {
  cloneDiagram,
  UML_DIAGRAM_TYPES,
  type UmlDiagram,
} from "../src/model/uml-types";
import {
  buildZamCsvExport,
  buildZamEnrolCliCommand,
  parseTrainingDeepLink,
  ZAM_PRACTICE_CARDS,
  ZAM_STAGE_ATOMS,
  ZAM_UML_BUNDLED_CELL_ID,
} from "../src/zam/zam-bridge-export";

describe("UML 2.5.1 Metamodel & 14 Diagram Types", () => {
  it("defines all 14 official UML 2.5.1 diagram types and 6 core learning path types", () => {
    const allTypes = Object.values(UML_DIAGRAM_TYPES);
    expect(allTypes).toHaveLength(14);

    const coreTypes = allTypes.filter((d) => d.isCoreLearningPath);
    expect(coreTypes.map((d) => d.type)).toEqual([
      "use-case",
      "class",
      "activity",
      "state-machine",
      "sequence",
      "component",
    ]);
  });
});

describe("6-Stage, 24-Lesson Curriculum, Varied Quiz Answers & Bilingual Support", () => {
  it("has 6 stages and 24 lessons with varied correct quiz answer indices (not always Option 1)", () => {
    expect(LEARNING_STAGES).toHaveLength(6);
    const deLessons = getAllLessons("de");
    const enLessons = getAllLessons("en");
    expect(deLessons).toHaveLength(24);
    expect(enLessons).toHaveLength(24);

    const deIndices = new Set<number>();
    const enIndices = new Set<number>();

    for (const lesson of deLessons) {
      expect(lesson.visualCheck.options.length).toBeGreaterThanOrEqual(2);
      expect(lesson.visualCheck.correctIndex).toBeGreaterThanOrEqual(0);
      expect(lesson.visualCheck.correctIndex).toBeLessThan(
        lesson.visualCheck.options.length,
      );
      deIndices.add(lesson.visualCheck.correctIndex);
      expect(lesson.level2ScenarioPrompt?.length).toBeGreaterThan(20);
    }

    for (const lesson of enLessons) {
      expect(lesson.visualCheck.options.length).toBeGreaterThanOrEqual(2);
      expect(lesson.visualCheck.correctIndex).toBeGreaterThanOrEqual(0);
      expect(lesson.visualCheck.correctIndex).toBeLessThan(
        lesson.visualCheck.options.length,
      );
      enIndices.add(lesson.visualCheck.correctIndex);
      expect(lesson.level2ScenarioPrompt?.length).toBeGreaterThan(20);
    }

    // Ensure correct answers are distributed across options 0, 1, and 2
    expect(deIndices.has(0)).toBe(true);
    expect(deIndices.has(1)).toBe(true);
    expect(deIndices.has(2)).toBe(true);
    expect(enIndices.has(0)).toBe(true);
    expect(enIndices.has(1)).toBe(true);
    expect(enIndices.has(2)).toBe(true);
  });

  it("verifies that every lesson's starterDiagram is incomplete and sampleSolutionDiagram passes 100% in both German and English", () => {
    for (const locale of ["de", "en"] as const) {
      for (const lesson of getAllLessons(locale)) {
        const starterEval = evaluateDiagramAgainstCriteria(
          lesson.starterDiagram,
          lesson.criteria,
          locale,
        );
        expect(
          starterEval.allPassed,
          `[${locale}] Starter diagram for ${lesson.id} should not already pass all criteria`,
        ).toBe(false);

        const solutionEval = evaluateDiagramAgainstCriteria(
          lesson.sampleSolutionDiagram,
          lesson.criteria,
          locale,
        );
        expect(
          solutionEval.allPassed,
          `[${locale}] Sample solution for ${lesson.id} failed criteria: ${JSON.stringify(solutionEval.results)}`,
        ).toBe(true);
        expect(solutionEval.scorePercent).toBe(100);
      }
    }
  });

  it("provides a blank canvas in Level 2 for build/connection/capstone lessons and keeps faulty diagram for bug-detective", () => {
    for (const lesson of getAllLessons("de")) {
      const l1 = getStarterDiagramForLevel(lesson, 1);
      const l2 = getStarterDiagramForLevel(lesson, 2);

      if (lesson.mode === "bug-detective") {
        expect(l2.nodes.length).toBe(l1.nodes.length);
        expect(l2.edges.length).toBe(l1.edges.length);
      } else {
        expect(l2.nodes).toHaveLength(0);
        expect(l2.edges).toHaveLength(0);
      }
    }
  });

  it("provides specific diagnostic hints in both DE and EN when edge direction is reversed or edge kind is wrong", () => {
    const classLessonDe = getAllLessons("de").find(
      (l) => l.id === "cls-2-connections",
    )!;
    const wrongKindDiagram: UmlDiagram = cloneDiagram(
      classLessonDe.starterDiagram,
    );

    // Connect Bestellung -> Bestellposition with aggregation instead of composition
    wrongKindDiagram.edges.push({
      id: "e_wrong_kind",
      kind: "aggregation",
      sourceId: "cls2_order",
      targetId: "cls2_item",
    });

    const resWrongKind = evaluateDiagramAgainstCriteria(
      wrongKindDiagram,
      classLessonDe.criteria,
      "de",
    );
    expect(resWrongKind.isSpecificMistake).toBe(true);
    const compResult = resWrongKind.results.find(
      (r) => r.criterionId === "cls2-comp",
    )!;
    expect(compResult.passed).toBe(false);
    expect(compResult.diagnosticHint).toContain("Aggregation");
    expect(compResult.diagnosticHint).toContain("Komposition");

    // Reversed direction in English
    const classLessonEn = getAllLessons("en").find(
      (l) => l.id === "cls-2-connections",
    )!;
    const reversedDiagramEn: UmlDiagram = cloneDiagram(
      classLessonEn.starterDiagram,
    );
    reversedDiagramEn.edges.push({
      id: "e_reversed_en",
      kind: "composition",
      sourceId: "cls2_item",
      targetId: "cls2_order",
    });

    const resReversedEn = evaluateDiagramAgainstCriteria(
      reversedDiagramEn,
      classLessonEn.criteria,
      "en",
    );
    expect(resReversedEn.isSpecificMistake).toBe(true);
    const revResultEn = resReversedEn.results.find(
      (r) => r.criterionId === "cls2-comp",
    )!;
    expect(revResultEn.passed).toBe(false);
    expect(revResultEn.diagnosticHint).toContain("Reverse Direction");
  });
});

describe("PlantUML & Mermaid Exporters", () => {
  it("exports valid PlantUML and Mermaid code for all 6 stage capstone solutions in DE and EN", () => {
    for (const locale of ["de", "en"] as const) {
      for (const stage of getLearningStages(locale)) {
        const capstone = stage.lessons[stage.lessons.length - 1]!;
        const puml = exportToPlantUml(capstone.sampleSolutionDiagram);
        expect(puml).toContain("@startuml");
        expect(puml).toContain("@enduml");

        const mermaid = exportToMermaid(capstone.sampleSolutionDiagram);
        expect(mermaid.length).toBeGreaterThan(20);
      }
    }
  });
});

describe("ZAM Spaced Repetition Consolidation & Bidirectional Deep-Linking", () => {
  it("maps all 6 stages to 6 ZAM Learning Atoms and 12 Practice Cards with valid lesson deep-links", () => {
    expect(ZAM_STAGE_ATOMS).toHaveLength(6);
    expect(ZAM_PRACTICE_CARDS).toHaveLength(12);
    expect(buildZamEnrolCliCommand()).toBe(
      `zam bridge bundled-cell-enrol ${ZAM_UML_BUNDLED_CELL_ID}`,
    );

    const allLessons = getAllLessons("de");
    for (const card of ZAM_PRACTICE_CARDS) {
      expect(card.sourceLink).toContain(`#lesson=${card.lessonStep}`);
      const parsed = parseTrainingDeepLink(`#lesson=${card.lessonStep}`);
      expect(parsed.lessonId).toBe(card.lessonId);
      expect(allLessons.some((l) => l.id === parsed.lessonId)).toBe(true);
    }
  });

  it("parses URL hash and query deep-links (#lesson=2.2, ?lesson=cls-4-capstone&level=2&lang=en)", () => {
    expect(parseTrainingDeepLink("#lesson=1.2")).toEqual({
      lessonId: "uc-2-connections",
    });
    expect(parseTrainingDeepLink("#lesson=2.4&level=2", "?lang=en")).toEqual({
      lessonId: "cls-4-capstone",
      level: 2,
      locale: "en",
    });
  });

  it("exports ZAM-compatible CSV in DE and EN with id,question,answer,title,deck,tags,source headers", () => {
    const csvDe = buildZamCsvExport("de");
    expect(
      csvDe.startsWith("id,question,answer,title,deck,tags,source\n"),
    ).toBe(true);
    expect(csvDe).toContain("01K8M251SYST00000000000J01");
    expect(csvDe).toContain(
      "uml-learning-app/UML-Studio-Academy.html#lesson=1.2",
    );

    const csvStage1Only = buildZamCsvExport("en", ["stage-1-use-case"]);
    expect(csvStage1Only).toContain("01K8M251SYST00000000000J01");
    expect(csvStage1Only).toContain("01K8M251SYST00000000000J02");
    expect(csvStage1Only).not.toContain("01K8M251SYST00000000000J03");
  });
});
