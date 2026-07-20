import { describe, expect, it } from "vitest";
import {
  assessCurriculumText,
  CURRICULUM_PROVIDERS,
  findCurriculumTopicAlternatives,
  getCurriculumProvider,
} from "../../src/cli/curriculum/index.js";

describe("curriculum content readiness", () => {
  it("rejects the exact Bremen placeholder extracted during E2E", () => {
    expect(
      assessCurriculumText(
        "Arithmetik / Algebra\n\nDie Schülerinnen und Schüler...",
      ),
    ).toMatchObject({
      status: "missing",
      reason: "placeholder",
      textLength: 53,
    });
  });

  it("rejects short and truncated source fragments", () => {
    const niedersachsen =
      "Zahlen und Operationen\n\nZahlen sind Bestandteil des täglichen Lebens. Sie dienen dazu, Phänomene aus der Umwelt zu quantifizieren und zu vergleichen. Schülerinnen und Schüler entwickeln ein grundlegendes Verständnis von";
    expect(assessCurriculumText(niedersachsen)).toMatchObject({
      status: "missing",
      reason: "too_short",
    });
  });

  it("accepts coherent detailed selected-topic text", () => {
    const text = [
      "Rationale Zahlen – Rechenregeln",
      "Die Schülerinnen und Schüler erklären anhand von Guthaben, Schulden und Temperaturschwankungen die Regeln für die Addition und Subtraktion rationaler Zahlen.",
      "Sie wenden die vier Grundrechenarten in Sachkontexten an, begründen ihre Rechenwege und kontrollieren die Ergebnisse durch Überschlagsrechnungen.",
      "Außerdem vergleichen sie verschiedene Darstellungen auf der Zahlengeraden und wählen für eine gegebene Aufgabe eine geeignete Darstellung aus.",
    ].join("\n\n");
    expect(assessCurriculumText(text)).toMatchObject({
      status: "verified",
      reason: "verified",
    });
  });

  it("marks unverified state topics missing and offers verified Bayern links", () => {
    const selection = {
      schoolType: "oberschule",
      grade: "7",
      subject: "mathematik",
    };
    const bremen = getCurriculumProvider("bildungsplan-bremen")!;
    const topic = bremen
      .listTopics(selection)
      .find((candidate) => candidate.id === "arithmetik-algebra")!;

    expect(topic.contentStatus).toBe("missing");

    const alternatives = findCurriculumTopicAlternatives(
      CURRICULUM_PROVIDERS,
      bremen.id,
      selection,
      topic,
    );
    expect(alternatives.map((alternative) => alternative.regionLabel)).toEqual([
      "Bayern",
    ]);
    expect(alternatives[0]?.topicLabels).toEqual(
      expect.arrayContaining([
        "Rationale Zahlen – Rechenregeln",
        "Gleichungen",
      ]),
    );
    expect(alternatives[0]?.sourceUris[0]).toContain(
      "https://www.lehrplanplus.bayern.de/",
    );
  });
});
