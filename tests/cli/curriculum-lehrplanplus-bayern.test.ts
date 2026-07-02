import { describe, expect, it } from "vitest";
import { lehrplanplusBayernProvider as provider } from "../../src/cli/curriculum/providers/lehrplanplus-bayern/index.js";

describe("LehrplanPLUS Bayern provider — navigation (real, agent-captured data)", () => {
  it("lists all eight Bavarian school types", () => {
    const schoolTypes = provider.listSchoolTypes();
    expect(schoolTypes).toHaveLength(8);
    expect(schoolTypes.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        "grundschule",
        "mittelschule",
        "foerderschule",
        "realschule",
        "gymnasium",
        "wirtschaftsschule",
        "fos",
        "bos",
      ]),
    );
  });

  it("lists Realschule grades 5 through 10", () => {
    expect(provider.listGrades("realschule").map((g) => g.id)).toEqual([
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });

  it("returns no grades for an uncurated school type", () => {
    expect(provider.listGrades("gymnasium")).toEqual([]);
  });

  it("lists the full Realschule subject catalog, including Mathematik", () => {
    const subjects = provider.listSubjects("realschule", "9");
    expect(subjects).toHaveLength(28);
    expect(subjects).toContainEqual({ id: "mathematik", label: "Mathematik" });
    expect(subjects).toContainEqual({ id: "deutsch", label: "Deutsch" });
  });

  it("lists the two Wahlpflichtfächergruppe tracks for Realschule Mathematik 9", () => {
    expect(provider.listTracks("realschule", "9", "mathematik")).toEqual([
      { id: "wpfg1", label: "Mathematik 9 (I)" },
      { id: "wpfg2-3", label: "Mathematik 9 (II/III)" },
    ]);
  });

  it("returns no tracks for a subject with one unified curriculum", () => {
    expect(provider.listTracks("realschule", "9", "deutsch")).toEqual([]);
  });

  it("lists the eight Lernbereiche of Mathematik 9 (I)", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg1",
    });
    expect(topics).toHaveLength(8);
    expect(topics[0]).toEqual({
      id: "lb1",
      label: "Reelle Zahlen",
      hours: 10,
      sourceRef: "realschule|9|mathematik|wpfg1",
    });
    expect(topics.map((t) => t.label)).toContain(
      "Quadratische Funktionen und quadratische Gleichungen",
    );
  });

  it("lists a different Lernbereich set for Mathematik 9 (II/III)", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg2-3",
    });
    expect(topics).toHaveLength(7);
    expect(topics.map((t) => t.label)).toContain("Lineare Funktionen");
    expect(topics.map((t) => t.label)).not.toContain(
      "Quadratische Funktionen und quadratische Gleichungen",
    );
  });

  it("lists Deutsch 9's four Lernbereiche without requiring a track", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "deutsch",
    });
    expect(topics.map((t) => t.label)).toEqual([
      "Sprechen und Zuhören",
      "Lesen – mit Texten und weiteren Medien umgehen",
      "Schreiben",
      "Sprachgebrauch und Sprache untersuchen und reflektieren",
    ]);
  });

  it("lists Englisch 9's five Lernbereiche", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "englisch",
    });
    expect(topics).toHaveLength(5);
  });

  it("returns no topics for an incomplete or uncurated selection", () => {
    expect(provider.listTopics({ schoolType: "realschule" })).toEqual([]);
    expect(
      provider.listTopics({
        schoolType: "realschule",
        grade: "9",
        subject: "physik",
      }),
    ).toEqual([]);
  });

  it("resolves a topic to its stable LehrplanPLUS source URL", () => {
    const [topic] = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "deutsch",
    });
    const resolved = provider.resolveTopic(topic);
    expect(resolved).toEqual({
      provider: "lehrplanplus-bayern",
      topicId: "realschule|9|deutsch#lb1",
      uri: "https://www.lehrplanplus.bayern.de/schulart/realschule/jgs/9/fach/deutsch/inhalt/fachlehrplaene",
    });
  });

  it("resolves sibling Mathematik tracks to their distinct Ausprägung URLs", () => {
    const [track1Topic] = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg1",
    });
    const [track23Topic] = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "mathematik",
      track: "wpfg2-3",
    });
    expect(provider.resolveTopic(track1Topic).uri).toContain(
      "w_auspraegung=wpfg1",
    );
    expect(provider.resolveTopic(track23Topic).uri).toContain(
      "w_auspraegung=wpfg2-3",
    );
  });

  it("throws when asked to resolve a topic outside curated coverage", () => {
    expect(() =>
      provider.resolveTopic({
        id: "lb1",
        label: "Fake",
        sourceRef: "realschule|9|physik",
      }),
    ).toThrow(/no resolvable source URL/i);
  });
});
