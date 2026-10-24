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

  it("returns no grades for an unknown school type", () => {
    expect(provider.listGrades("does-not-exist")).toEqual([]);
  });

  it("lists the full Realschule subject catalog, including Mathematik", () => {
    const subjects = provider.listSubjects("realschule", "9");
    expect(subjects).toHaveLength(28);
    expect(subjects).toContainEqual({ id: "mathematik", label: "Mathematik" });
    expect(subjects).toContainEqual({ id: "deutsch", label: "Deutsch" });
  });

  it("exposes the captured catalog and the verified Realschule branches", () => {
    const paths = provider.listCatalogPaths?.() ?? [];
    expect(paths).toHaveLength(2102);
    for (const track of ["wpfg1", "wpfg2-3"]) {
      expect(paths).toContainEqual({
        schoolType: "realschule",
        grade: "9",
        subject: "chemie",
        track,
      });
    }
    expect(paths).toContainEqual({
      schoolType: "realschule",
      grade: "5",
      subject: "mathematik",
    });
    expect(paths).not.toContainEqual({
      schoolType: "fos",
      grade: "10",
      subject: "informatik",
    });
    expect(paths).not.toContainEqual({
      schoolType: "fos",
      grade: "11",
      subject: "informatik",
    });
  });

  it("lists the two Wahlpflichtfächergruppe tracks for Realschule Mathematik 9", () => {
    const tracks = provider.listTracks("realschule", "9", "mathematik");
    expect(tracks).toEqual([
      {
        id: "wpfg1",
        label: "Mathematik 9 (I)",
        description: expect.stringContaining("Wahlpflichtfächergruppe I"),
      },
      {
        id: "wpfg2-3",
        label: "Mathematik 9 (II/III)",
        description: expect.stringContaining(
          "Wahlpflichtfächergruppen II und III",
        ),
      },
    ]);
  });

  it("returns no tracks for a subject with one unified curriculum", () => {
    expect(provider.listTracks("realschule", "9", "deutsch")).toEqual([]);
  });

  it("offers BwR 9 only in group II with all five verified areas", () => {
    expect(
      provider.listTracks("realschule", "9", "bwl-rechnungswesen"),
    ).toEqual([
      {
        id: "wpfg2",
        label: "Betriebswirtschaftslehre/Rechnungswesen 9 (II)",
        description: expect.stringContaining("wirtschaftlicher Zweig"),
      },
    ]);
    const position = {
      schoolType: "realschule",
      grade: "9",
      subject: "bwl-rechnungswesen",
    };
    const topics = provider.listTopics({ ...position, track: "wpfg2" });
    expect(topics.map((topic) => topic.id)).toEqual([
      "lb1",
      "lb2",
      "lb3",
      "lb4",
      "lb5",
    ]);
    expect(topics.map((topic) => topic.hours)).toEqual([12, 19, 20, 19, 14]);
    for (const topic of topics)
      expect(provider.resolveTopic(topic).uri).toBe(
        "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/bwl-rechnungswesen/wpfg2",
      );
    expect(provider.listTopics(position).map((topic) => topic.id)).toEqual(
      topics.map((topic) => topic.id),
    );
    for (const track of ["wpfg1", "wpfg3a", "wpfg3b", "wpfg2-3"]) {
      expect(provider.listTopics({ ...position, track })).toEqual([]);
      expect(provider.listCatalogPaths?.()).not.toContainEqual({
        ...position,
        track,
      });
    }
    expect(provider.listCatalogPaths?.()).toContainEqual({
      ...position,
      track: "wpfg2",
    });
  });

  it("offers Wirtschaft und Recht 9 for groups I and III with its four areas and the optional bilingual one", () => {
    expect(
      provider.listTracks("realschule", "9", "wirtschaft-und-recht"),
    ).toEqual([
      {
        id: "wpfg1-3",
        label: "Wirtschaft und Recht 9 (I/III)",
        description: expect.stringContaining("Gruppe II lernt in diesem Jahr BwR"),
      },
    ]);
    const position = {
      schoolType: "realschule",
      grade: "9",
      subject: "wirtschaft-und-recht",
    };
    const topics = provider.listTopics({ ...position, track: "wpfg1-3" });
    expect(topics.map((topic) => topic.id)).toEqual([
      "lb1",
      "lb2",
      "lb3",
      "lb4",
      "lb5",
    ]);
    // The four areas add up to the 56 hours of the Fachlehrplan; LB 5 is optional.
    expect(topics.slice(0, 4).map((topic) => topic.hours)).toEqual([
      12, 11, 12, 21,
    ]);
    expect(topics[4].hours).toBeUndefined();
    for (const topic of topics)
      expect(provider.resolveTopic(topic).uri).toBe(
        "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/wirtschaft-und-recht/wpfg1-3",
      );
    expect(provider.listTopics(position).map((topic) => topic.id)).toEqual(
      topics.map((topic) => topic.id),
    );
    for (const track of ["wpfg1", "wpfg2", "wpfg2-3", "wpfg3a", "wpfg3b"])
      expect(provider.listTopics({ ...position, track })).toEqual([]);
    expect(provider.listCatalogPaths?.()).toContainEqual({
      ...position,
      track: "wpfg1-3",
    });
  });

  it("offers Chemie 9 with both Wahlpflichtfächergruppen and explanatory labels", () => {
    expect(provider.listSubjects("realschule", "9")).toContainEqual({
      id: "chemie",
      label: "Chemie",
    });
    expect(provider.listTracks("realschule", "9", "chemie")).toEqual([
      {
        id: "wpfg1",
        label: "Chemie 9 (I)",
        description: expect.stringContaining("Wahlpflichtfächergruppe I"),
      },
      {
        id: "wpfg2-3",
        label: "Chemie 9 (II/III)",
        description: expect.stringContaining(
          "Wahlpflichtfächergruppen II und III",
        ),
      },
    ]);
    expect(
      provider.listTopics({
        schoolType: "realschule",
        grade: "9",
        subject: "chemie",
      }),
    ).toEqual([]);
  });

  it.each([
    [
      "wpfg1",
      [
        ["Wie Chemiker denken und arbeiten", undefined],
        ["Chemische Bindung", 21],
        ["Donator-Akzeptor-Konzept – Elektronenübergänge", 14],
        ["Redoxanwendungen", 11],
        ["Donator-Akzeptor-Konzept – Protonenübergänge I", 10],
      ],
    ],
    [
      "wpfg2-3",
      [
        ["Wie Chemiker denken und arbeiten", undefined],
        ["Stoffe und ihre Eigenschaften", 8],
        ["Aufbau der Materie", 10],
        ["Chemische Reaktion", 16],
        ["Atombau und Periodensystem der Elemente", 5],
        ["Chemische Bindung", 17],
      ],
    ],
  ] as const)(
    "lists the verified Chemie 9 Lernbereiche and source for %s",
    (track, expected) => {
      const topics = provider.listTopics({
        schoolType: "realschule",
        grade: "9",
        subject: "chemie",
        track,
      });
      expect(topics.map((topic) => [topic.label, topic.hours])).toEqual(
        expected,
      );
      expect(topics.map((topic) => topic.id)).toEqual(
        expected.map((_, index) => `lb${index + 1}`),
      );
      for (const topic of topics) {
        expect(provider.resolveTopic(topic)).toEqual({
          provider: "lehrplanplus-bayern",
          topicId: `realschule|9|chemie|${track}#${topic.id}`,
          uri: `https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/chemie/${track}`,
        });
      }
    },
  );

  it("offers the common Geographie 9 curriculum with seven core areas and optional bilingual teaching", () => {
    expect(provider.listSubjects("realschule", "9")).toContainEqual({
      id: "geographie",
      label: "Geographie",
    });
    expect(provider.listTracks("realschule", "9", "geographie")).toEqual([]);
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "geographie",
    });
    expect(topics.map((topic) => [topic.id, topic.label, topic.hours])).toEqual(
      [
        ["lb1", "Landschaft und Naturrisiken", 9],
        ["lb2", "Klima und Klimawandel", 10],
        ["lb3", "Landwirtschaft, Ernährung und Boden", 10],
        ["lb4", "Städtische Siedlungs- und Lebensräume", 8],
        ["lb5", "Bevölkerung und Bevölkerungspolitik", 10],
        ["lb6", "Grenzen im Wandel", 5],
        ["lb7", "Aktuelle geographische Fragestellung im Nahraum", 4],
        ["lb8", "Bilingualer Sachfachunterricht (optional)", undefined],
      ],
    );
    for (const topic of topics)
      expect(provider.resolveTopic(topic)).toEqual({
        provider: "lehrplanplus-bayern",
        topicId: `realschule|9|geographie#${topic.id}`,
        uri: "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/geographie",
      });
    expect(provider.listCatalogPaths?.()).toContainEqual({
      schoolType: "realschule",
      grade: "9",
      subject: "geographie",
    });
  });

  it("offers the common Geschichte 9 curriculum with seven core areas and optional bilingual teaching", () => {
    expect(provider.listSubjects("realschule", "9")).toContainEqual({
      id: "geschichte",
      label: "Geschichte",
    });
    expect(provider.listTracks("realschule", "9", "geschichte")).toEqual([]);
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "geschichte",
    });
    expect(topics.map((topic) => [topic.id, topic.label, topic.hours])).toEqual(
      [
        ["lb1", "Methoden und Arbeitstechniken", undefined],
        ["lb2", "Imperialismus und Erster Weltkrieg", 16],
        ["lb3", "Weimarer Republik – die erste deutsche Demokratie", 10],
        ["lb4", "Nationalsozialismus – Ideologie und Politik bis 1939", 10],
        [
          "lb5",
          "Nationalsozialismus, Zweiter Weltkrieg und Holocaust – Schuld, Widerstand und Verantwortung",
          10,
        ],
        ["lb6", "Jugend und Jugendkultur im Wandel der Zeit (Längsschnitt)", 5],
        ["lb7", "Menschenrechte – Rechte für alle Menschen (Längsschnitt)", 5],
        ["lb8", "Bilingualer Sachfachunterricht (optional)", undefined],
      ],
    );
    for (const topic of topics)
      expect(provider.resolveTopic(topic)).toEqual({
        provider: "lehrplanplus-bayern",
        topicId: `realschule|9|geschichte#${topic.id}`,
        uri: "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/9/geschichte",
      });
    expect(provider.listCatalogPaths?.()).toContainEqual({
      schoolType: "realschule",
      grade: "9",
      subject: "geschichte",
    });
  });

  it("offers the common Biologie 10 curriculum with four areas", () => {
    expect(provider.listSubjects("realschule", "10")).toContainEqual({
      id: "biologie",
      label: "Biologie",
    });
    expect(provider.listTracks("realschule", "10", "biologie")).toEqual([]);
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "10",
      subject: "biologie",
    });
    expect(topics.map((topic) => [topic.id, topic.label, topic.hours])).toEqual(
      [
        ["lb1", "Prozessbezogene Kompetenzen", undefined],
        ["lb2", "Genetik", 20],
        [
          "lb3",
          "Lokale und globale Auswirkungen auf Ökosysteme durch Eingriffe des Menschen",
          8,
        ],
        ["lb4", "Verantwortungsvolle Elternschaft", 8],
      ],
    );
    for (const topic of topics)
      expect(provider.resolveTopic(topic)).toEqual({
        provider: "lehrplanplus-bayern",
        topicId: `realschule|10|biologie#${topic.id}`,
        uri: "https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/10/biologie",
      });
    expect(provider.listCatalogPaths?.()).toContainEqual({
      schoolType: "realschule",
      grade: "10",
      subject: "biologie",
    });
  });

  it("offers Physik 10 with both Wahlpflichtfächergruppen and four areas each", () => {
    expect(provider.listTracks("realschule", "10", "physik")).toEqual([
      {
        id: "wpfg1",
        label: "Physik 10 (I)",
        description: expect.stringContaining("Wahlpflichtfächergruppe I"),
      },
      {
        id: "wpfg2-3",
        label: "Physik 10 (II/III)",
        description: expect.stringContaining(
          "Wahlpflichtfächergruppen II und III",
        ),
      },
    ]);
    const hours = { wpfg1: [17, 29, 14, 12], "wpfg2-3": [10, 19, 7, 12] };
    for (const [track, expected] of Object.entries(hours)) {
      const topics = provider.listTopics({
        schoolType: "realschule",
        grade: "10",
        subject: "physik",
        track,
      });
      expect(
        topics.map((topic) => [topic.id, topic.label, topic.hours]),
      ).toEqual([
        ["lb1", "Mechanik", expected[0]],
        ["lb2", "Elektrizitätslehre", expected[1]],
        ["lb3", "Atom- und Kernphysik", expected[2]],
        ["lb4", "Energieversorgung", expected[3]],
      ]);
      for (const topic of topics)
        expect(provider.resolveTopic(topic)).toEqual({
          provider: "lehrplanplus-bayern",
          topicId: `realschule|10|physik|${track}#${topic.id}`,
          uri: `https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/10/physik/${track}`,
        });
    }
  });

  it("offers Physik 8 with both Wahlpflichtfächergruppen, read from the Fachlehrplan pages", () => {
    expect(provider.listTracks("realschule", "8", "physik")).toEqual([
      {
        id: "wpfg1",
        label: "Physik 8 (I)",
        description: expect.stringContaining("Wahlpflichtfächergruppe I"),
      },
      {
        id: "wpfg2-3",
        label: "Physik 8 (II/III)",
        description: expect.stringContaining(
          "Wahlpflichtfächergruppen II und III",
        ),
      },
    ]);
    // Zweig I: three areas and the elective 4 (Astronomie oder Akustik);
    // Zweig II/III: three areas. Hours as printed on the pages on 2026-10-23.
    const areas = {
      wpfg1: [
        ["lb1", "Mechanik und Energie", 20],
        ["lb2", "Wärmelehre", 15],
        ["lb3", "Elektrizitätslehre", 15],
        ["lb4", "Wahlbereich: Astronomie oder Akustik", 6],
      ],
      "wpfg2-3": [
        ["lb1", "Mechanik", 22],
        ["lb2", "Optik", 14],
        ["lb3", "Magnetismus und Elektrizitätslehre", 20],
      ],
    };
    for (const [track, expected] of Object.entries(areas)) {
      const topics = provider.listTopics({
        schoolType: "realschule",
        grade: "8",
        subject: "physik",
        track,
      });
      expect(
        topics.map((topic) => [topic.id, topic.label, topic.hours]),
      ).toEqual(expected);
      for (const topic of topics)
        expect(provider.resolveTopic(topic)).toEqual({
          provider: "lehrplanplus-bayern",
          topicId: `realschule|8|physik|${track}#${topic.id}`,
          uri: `https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/8/physik/${track}`,
        });
    }
  });

  it("offers Chemie 10 with both Wahlpflichtfächergruppen and their own Lernbereiche", () => {
    expect(provider.listTracks("realschule", "10", "chemie")).toEqual([
      {
        id: "wpfg1",
        label: "Chemie 10 (I)",
        description: expect.stringContaining("Wahlpflichtfächergruppe I"),
      },
      {
        id: "wpfg2-3",
        label: "Chemie 10 (II/III)",
        description: expect.stringContaining(
          "Wahlpflichtfächergruppen II und III",
        ),
      },
    ]);
    const expected = {
      wpfg1: [
        ["lb1", "Wie Chemiker denken und arbeiten", undefined],
        ["lb2", "Donator-Akzeptor-Konzept – Protonenübergänge II", 7],
        [
          "lb3",
          "Herkunft organischer Verbindungen im Überblick – grundlegende Reaktion Fotosynthese",
          5,
        ],
        ["lb4", "Grundlegende Reaktionen organischer Moleküle", 12],
        ["lb5", "Biomoleküle", 12],
        ["lb6", "Moderne Werkstoffe – Kunststoffe und Silikone", 12],
      ],
      "wpfg2-3": [
        ["lb1", "Wie Chemiker denken und arbeiten", undefined],
        ["lb2", "Donator-Akzeptor-Konzept – Elektronenübergänge", 12],
        ["lb3", "Donator-Akzeptor-Konzept – Protonenübergänge", 10],
        [
          "lb4",
          "Herkunft organischer Verbindungen im Überblick – grundlegende Reaktion Fotosynthese",
          5,
        ],
        ["lb5", "Grundlegende Reaktionen organischer Moleküle", 9],
        ["lb6", "Wahlbereich", 12],
      ],
    };
    for (const [track, topicsExpected] of Object.entries(expected)) {
      const topics = provider.listTopics({
        schoolType: "realschule",
        grade: "10",
        subject: "chemie",
        track,
      });
      expect(
        topics.map((topic) => [topic.id, topic.label, topic.hours]),
      ).toEqual(topicsExpected);
      for (const topic of topics)
        expect(provider.resolveTopic(topic)).toEqual({
          provider: "lehrplanplus-bayern",
          topicId: `realschule|10|chemie|${track}#${topic.id}`,
          uri: `https://www.lehrplanplus.bayern.de/fachlehrplan/realschule/10/chemie/${track}`,
        });
    }
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

  it("lists Mathematik 5's six Lernbereiche", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "5",
      subject: "mathematik",
    });
    expect(topics).toHaveLength(6);
    expect(topics[0]).toMatchObject({
      id: "lb1",
      label: "Natürliche Zahlen",
      hours: 50,
    });
  });

  it("lists Biologie 5's four Lernbereiche", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "5",
      subject: "biologie",
    });
    expect(topics).toHaveLength(4);
    expect(topics.map((t) => t.label)).toContain(
      "Biologie, die Wissenschaft von den Lebewesen",
    );
  });

  it("lists Sport 5 tracks and Basissport Lernbereiche", () => {
    expect(provider.listTracks("realschule", "5", "sport")).toEqual([
      {
        id: "basis_sport",
        label: "Basissport 5",
        description: expect.stringContaining("Basissport"),
      },
      {
        id: "diff_sport",
        label: "Differenzierter Sport",
        description: expect.stringContaining("Wahlsport"),
      },
    ]);
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "5",
      subject: "sport",
      track: "basis_sport",
    });
    expect(topics).toHaveLength(4);
    expect(topics.map((t) => t.label)).toContain("Gesundheit und Fitness");
  });

  it("returns no topics for grade 5 subjects not offered on LehrplanPLUS", () => {
    expect(
      provider.listTopics({
        schoolType: "realschule",
        grade: "5",
        subject: "chemie",
      }),
    ).toEqual([]);
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

  it("lists the two Wahlpflichtfächergruppe tracks for Realschule Physik 9", () => {
    expect(provider.listTracks("realschule", "9", "physik")).toEqual([
      {
        id: "wpfg1",
        label: "Physik 9 (I)",
        description: expect.stringContaining("Wahlpflichtfächergruppe I"),
      },
      {
        id: "wpfg2-3",
        label: "Physik 9 (II/III)",
        description: expect.stringContaining(
          "Wahlpflichtfächergruppen II und III",
        ),
      },
    ]);
  });

  it("lists Physik 9 (I)'s three Lernbereiche", () => {
    const topics = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "physik",
      track: "wpfg1",
    });
    expect(topics).toHaveLength(3);
    expect(topics.map((t) => t.label)).toEqual([
      "Mechanik von Flüssigkeiten und Gasen",
      "Wärmelehre",
      "Elektrizitätslehre",
    ]);
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
        sourceRef: "realschule|9|biologie",
      }),
    ).toThrow(/no resolvable source URL/i);
  });

  it("resolves Physik 9 tracks to their distinct Ausprägung URLs", () => {
    const [track1Topic] = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "physik",
      track: "wpfg1",
    });
    const [track23Topic] = provider.listTopics({
      schoolType: "realschule",
      grade: "9",
      subject: "physik",
      track: "wpfg2-3",
    });
    expect(provider.resolveTopic(track1Topic).uri).toContain(
      "w_auspraegung=wpfg1",
    );
    expect(provider.resolveTopic(track23Topic).uri).toContain(
      "w_auspraegung=wpfg2-3",
    );
  });

  it("lists Gymnasium grades 5 through 13", () => {
    expect(provider.listGrades("gymnasium").map((g) => g.id)).toEqual([
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
    ]);
  });

  it("lists Gymnasium Grade 12 Biologie (grundlegend) topics", () => {
    const topics = provider.listTopics({
      schoolType: "gymnasium",
      grade: "12",
      subject: "biologie",
      track: "grundlegend",
    });
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0].sourceRef).toBe("gymnasium|12|biologie|grundlegend");
  });

  // --- Wirtschaftsschule / FOS / BOS (captured 2026-07-19) ---

  it("lists Wirtschaftsschule grades 5 through 11", () => {
    expect(provider.listGrades("wirtschaftsschule").map((g) => g.id)).toEqual([
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
    ]);
  });

  it("lists Fachoberschule grades 10 through 13", () => {
    expect(provider.listGrades("fos").map((g) => g.id)).toEqual([
      "10",
      "11",
      "12",
      "13",
    ]);
  });

  it("lists Berufsoberschule grades 10, 12, and 13", () => {
    expect(provider.listGrades("bos").map((g) => g.id)).toEqual([
      "10",
      "12",
      "13",
    ]);
  });

  it("lists Wirtschaftsschule subject catalog including BSK and Mathematik", () => {
    const subjects = provider.listSubjects("wirtschaftsschule", "10");
    expect(subjects.length).toBeGreaterThanOrEqual(25);
    expect(subjects).toContainEqual({
      id: "bsk",
      label: "Betriebswirtschaftliche Steuerung und Kontrolle",
    });
    expect(subjects).toContainEqual({ id: "mathematik", label: "Mathematik" });
  });

  it("lists the three form tracks for Wirtschaftsschule Mathematik 10", () => {
    const tracks = provider.listTracks("wirtschaftsschule", "10", "mathematik");
    expect(tracks.map((t) => t.id).sort()).toEqual([
      "dreistufig",
      "vierstufig",
      "zweistufig",
    ]);
  });

  it("lists Lernbereiche for Wirtschaftsschule Mathematik 10 (zweistufig)", () => {
    const topics = provider.listTopics({
      schoolType: "wirtschaftsschule",
      grade: "10",
      subject: "mathematik",
      track: "zweistufig",
    });
    expect(topics.length).toBeGreaterThanOrEqual(5);
    expect(topics.map((t) => t.label)).toContain("Lineare Gleichungssysteme");
    expect(topics[0].sourceRef).toBe(
      "wirtschaftsschule|10|mathematik|zweistufig",
    );
  });

  it("resolves a Wirtschaftsschule topic to its Ausprägung URL", () => {
    const [topic] = provider.listTopics({
      schoolType: "wirtschaftsschule",
      grade: "10",
      subject: "mathematik",
      track: "zweistufig",
    });
    const resolved = provider.resolveTopic(topic);
    expect(resolved.provider).toBe("lehrplanplus-bayern");
    expect(resolved.uri).toContain("wirtschaftsschule");
    expect(resolved.uri).toContain("w_auspraegung=zweistufig");
  });

  it("lists FOS Mathematik 12 Ausbildungsrichtungs tracks", () => {
    const tracks = provider.listTracks("fos", "12", "mathematik");
    expect(tracks.map((t) => t.id)).toEqual(
      expect.arrayContaining(["t", "abu-g-s-w-gh-iw"]),
    );
  });

  it("lists FOS Mathematik 12 (T) Lernbereiche", () => {
    const topics = provider.listTopics({
      schoolType: "fos",
      grade: "12",
      subject: "mathematik",
      track: "t",
    });
    expect(topics.length).toBeGreaterThanOrEqual(4);
    expect(topics.map((t) => t.label).join(" ")).toMatch(
      /Differenzial|Funktion/i,
    );
  });

  it("lists FOS Deutsch 12 via gueltig_bis_26_27 track for SJ 2026/27", () => {
    const tracks = provider.listTracks("fos", "12", "deutsch");
    expect(tracks.map((t) => t.id)).toContain("gueltig_bis_26_27");
    const topics = provider.listTopics({
      schoolType: "fos",
      grade: "12",
      subject: "deutsch",
      track: "gueltig_bis_26_27",
    });
    expect(topics.map((t) => t.label)).toEqual(
      expect.arrayContaining(["Sprechen und Zuhören", "Schreiben"]),
    );
  });

  it("lists BOS Mathematik 12 tracks and Technik Lernbereiche", () => {
    const tracks = provider.listTracks("bos", "12", "mathematik");
    expect(tracks.map((t) => t.id)).toEqual(
      expect.arrayContaining(["t", "abu-s-w-gh-iw"]),
    );
    const topics = provider.listTopics({
      schoolType: "bos",
      grade: "12",
      subject: "mathematik",
      track: "t",
    });
    expect(topics.length).toBeGreaterThanOrEqual(4);
  });

  it("returns no topics for BOS Deutsch 12 (only future gueltig_ab_27_28 on site)", () => {
    // Live LehrplanPLUS only lists the 2027/28 curriculum for BOS Deutsch 12;
    // school year 2026/27 correctly has an empty topic list.
    expect(
      provider.listTopics({
        schoolType: "bos",
        grade: "12",
        subject: "deutsch",
      }),
    ).toEqual([]);
    expect(provider.listTracks("bos", "12", "deutsch")).toEqual([]);
  });

  // --- Grundschule / Mittelschule / Förderschule (captured 2026-07-19) ---

  it("lists Grundschule grades 2 through 4", () => {
    expect(provider.listGrades("grundschule").map((g) => g.id)).toEqual([
      "2",
      "3",
      "4",
    ]);
  });

  it("lists Mittelschule grades 5 through 10", () => {
    expect(provider.listGrades("mittelschule").map((g) => g.id)).toEqual([
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });

  it("lists Förderschule grades 2 through 12", () => {
    expect(provider.listGrades("foerderschule").map((g) => g.id)).toEqual([
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
    ]);
  });

  it("lists Grundschule Deutsch 2 Lernbereiche without a track", () => {
    const topics = provider.listTopics({
      schoolType: "grundschule",
      grade: "2",
      subject: "deutsch",
    });
    expect(topics.map((t) => t.label)).toEqual([
      "Sprechen und Zuhören",
      "Lesen – mit Texten und weiteren Medien umgehen",
      "Schreiben",
      "Sprachgebrauch und Sprache untersuchen und reflektieren",
    ]);
  });

  it("lists Grundschule Englisch 3 einstündig/zweistündig tracks", () => {
    const tracks = provider.listTracks("grundschule", "3", "englisch");
    expect(tracks.map((t) => t.id).sort()).toEqual([
      "einstündig",
      "zweistuendig",
    ]);
    const topics = provider.listTopics({
      schoolType: "grundschule",
      grade: "3",
      subject: "englisch",
      track: "einstündig",
    });
    expect(topics.length).toBeGreaterThan(0);
  });

  it("lists Mittelschule Mathematik 8 Regelklasse and M-Zug tracks", () => {
    const tracks = provider.listTracks("mittelschule", "8", "mathematik");
    expect(tracks.map((t) => t.id).sort()).toEqual([
      "mittlere-reife-klasse",
      "regelklasse",
    ]);
    const topics = provider.listTopics({
      schoolType: "mittelschule",
      grade: "8",
      subject: "mathematik",
      track: "regelklasse",
    });
    expect(topics.length).toBeGreaterThan(0);
  });

  it("lists Förderschule Mathematik 7 Förderschwerpunkt tracks including Lernen", () => {
    const tracks = provider.listTracks("foerderschule", "7", "mathematik");
    expect(tracks.map((t) => t.id)).toEqual(
      expect.arrayContaining([
        "lernen",
        "sehen",
        "hoeren",
        "geistige-entwicklung",
      ]),
    );
  });

  it("lists Förderschule Mathematik 7 (Lernen) Lernbereiche", () => {
    const topics = provider.listTopics({
      schoolType: "foerderschule",
      grade: "7",
      subject: "mathematik",
      track: "lernen",
    });
    expect(topics.length).toBeGreaterThanOrEqual(4);
    expect(topics.map((t) => t.label)).toEqual(
      expect.arrayContaining(["Zahlen und Operationen", "Raum und Form"]),
    );
  });

  it("resolves a Förderschule topic to a Förderschwerpunkt URL", () => {
    const [topic] = provider.listTopics({
      schoolType: "foerderschule",
      grade: "7",
      subject: "mathematik",
      track: "lernen",
    });
    const resolved = provider.resolveTopic(topic);
    expect(resolved.provider).toBe("lehrplanplus-bayern");
    expect(resolved.uri).toContain("foerderschule");
    expect(resolved.uri).toContain("w_foerderschwerpunkt=lernen");
  });
});

describe("LehrplanPLUS Bayern provider — Ausprägung descriptions", () => {
  it("explains FOS Ausbildungsrichtung codes, including shared labels", () => {
    const tracks = provider.listTracks("fos", "12", "mathematik");
    const technik = tracks.find((track) => track.id === "t");
    expect(technik?.description).toContain("Technik (T)");
    const all = tracks.find((track) => track.id === "abu-g-s-w-gh-iw");
    expect(all?.description).toContain("Ausbildungsrichtungen");
    expect(all?.description).toContain("Internationale Wirtschaft (IW)");
  });

  it("explains Gymnasium Oberstufe Anforderungsniveaus", () => {
    const tracks = provider.listTracks("gymnasium", "12", "biologie");
    const erhoeht = tracks.find((track) => track.id === "erhoeht");
    const grundlegend = tracks.find((track) => track.id === "grundlegend");
    expect(erhoeht?.description).toMatch(/vertieftes Niveau/);
    expect(grundlegend?.description).toMatch(/Standardniveau/);
  });

  it("explains Wirtschaftsschule forms by their entry grade", () => {
    const tracks = provider.listTracks("wirtschaftsschule", "10", "mathematik");
    expect(
      tracks.find((track) => track.id === "vierstufig")?.description,
    ).toContain("Jahrgangsstufe 7");
    expect(
      tracks.find((track) => track.id === "dreistufig")?.description,
    ).toContain("Jahrgangsstufe 8");
    expect(
      tracks.find((track) => track.id === "zweistufig")?.description,
    ).toContain("Jahrgangsstufe 10");
  });

  it("explains Mittelschule Regelklasse and Mittlere-Reife-Zug", () => {
    const tracks = provider.listTracks("mittelschule", "8", "mathematik");
    expect(
      tracks.find((track) => track.id === "regelklasse")?.description,
    ).toContain("Regelklasse");
    expect(
      tracks.find((track) => track.id === "mittlere-reife-klasse")?.description,
    ).toContain("Mittlere-Reife-Zug");
  });

  it("leaves self-explanatory Förderschwerpunkt tracks undescribed", () => {
    const tracks = provider.listTracks("foerderschule", "7", "mathematik");
    expect(tracks.length).toBeGreaterThan(0);
    expect(tracks.every((track) => track.description === undefined)).toBe(true);
  });
});
