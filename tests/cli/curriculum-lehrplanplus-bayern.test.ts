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

  it("exposes exactly the 2095 live-captured catalog paths", () => {
    const paths = provider.listCatalogPaths?.() ?? [];
    expect(paths).toHaveLength(2095);
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
