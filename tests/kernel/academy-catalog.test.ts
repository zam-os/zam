import { describe, expect, it } from "vitest";
import {
  ACADEMY_GRADE_CROSS,
  ACADEMY_ORIGIN,
  ACADEMY_OTHER_BUCKET,
  ACADEMY_SCHOOL_INDEPENDENT,
  academyAppSlug,
  academyUrl,
  BUNDLED_TILES,
  buildAcademyBereichTiles,
  buildAcademyGradeTiles,
  buildAcademySchoolOptions,
  buildAcademySubjectTiles,
  bundleStandsIn,
  countUserAcademyAppCards,
  DEFAULT_ACADEMY_TAXONOMY,
  enrichAcademyCells,
  enrolBundledCell,
  filterAcademyCells,
  formatAcademyGrades,
  getBundledCellTile,
  openDatabase,
  parseAcademyCatalog,
  parseAcademyIndex,
  userHoldsAcademyAppCards,
} from "../../src/kernel/index.js";

const entry = {
  id: "zam-academy:uml",
  title: "UML 2.5.1 (ZAM Academy)",
  description: "…",
  language: "de",
  version: "2026.10.1",
  items: 26,
  app: "/uml/",
  cell: "/uml/cell.json",
  sha256: "a".repeat(64),
};

describe("parseAcademyCatalog (ADR 2026-10-19 D2, D4)", () => {
  it("resolves paths against the one origin", () => {
    const catalog = parseAcademyCatalog({ schema: 1, cells: [entry] });
    expect(catalog.cells[0]).toMatchObject({
      id: "zam-academy:uml",
      version: "2026.10.1",
      items: 26,
      appUrl: `${ACADEMY_ORIGIN}/uml/`,
      cellUrl: `${ACADEMY_ORIGIN}/uml/cell.json`,
    });
  });

  it("reads preview, and an entry without it is none", () => {
    const parse = (cell: object) =>
      parseAcademyCatalog({ schema: 1, cells: [cell] }).cells[0].preview;
    expect(parse({ ...entry, preview: true })).toBe(true);
    expect(parse({ ...entry, preview: false })).toBe(false);
    expect(parse(entry)).toBe(false);
  });

  it("refuses a preview that is no boolean", () => {
    for (const preview of ["true", 1, null, {}]) {
      expect(
        () =>
          parseAcademyCatalog({ schema: 1, cells: [{ ...entry, preview }] }),
        String(preview),
      ).toThrow(/preview/);
    }
  });

  it("never lets an entry name another host", () => {
    for (const cell of [
      "https://evil.example/cell.json",
      "//evil.example/cell.json",
      "/uml/../../cell.json",
      "/uml//cell.json",
      "\\\\evil.example\\cell.json",
      "/uml/cell.json?x=1",
      "/uml/cell.json#x",
      "/@evil.example/cell.json",
      "uml/cell.json",
      "",
      42,
    ]) {
      expect(
        () => parseAcademyCatalog({ schema: 1, cells: [{ ...entry, cell }] }),
        String(cell),
      ).toThrow(/plain path/);
    }
    expect(() => academyUrl("/a:b/cell.json")).toThrow(/plain path/);
  });

  it("refuses what it cannot trust", () => {
    const bad = (patch: object) =>
      parseAcademyCatalog({ schema: 1, cells: [{ ...entry, ...patch }] });
    expect(() => bad({ version: "2026.10.1-beta" })).toThrow(/dotted/);
    expect(() => bad({ sha256: "A".repeat(64) })).toThrow(/sha256/);
    expect(() => bad({ sha256: "abc" })).toThrow(/sha256/);
    expect(() => bad({ id: "no colon" })).toThrow(/id/);
    expect(() => bad({ items: -1 })).toThrow(/item count/);
    expect(() =>
      parseAcademyCatalog({ schema: 1, cells: [entry, entry] }),
    ).toThrow(/duplicate/);
    expect(() => parseAcademyCatalog({ schema: 2, cells: [] })).toThrow();
    expect(() => parseAcademyCatalog(null)).toThrow();
  });
});

describe("bundleStandsIn", () => {
  const listed = parseAcademyCatalog({ schema: 1, cells: [entry] }).cells[0];

  it("lets a bundle stand in only at the catalog's version or newer", () => {
    expect(bundleStandsIn(listed, "2026.10.1")).toBe(true);
    expect(bundleStandsIn(listed, "2026.11.1")).toBe(true);
    expect(bundleStandsIn(listed, "2026.9.9")).toBe(false);
    expect(bundleStandsIn(listed, "draft")).toBe(false);
    expect(bundleStandsIn(listed, undefined)).toBe(false);
  });
});

const SAMPLE_INDEX_RAW = {
  schema: 1,
  goal: "Bis Ende 2026: alle Themen",
  schulen: [
    {
      id: "mittelschule",
      name: "Mittelschule",
      wo: "an der Mittelschule",
      short: "MS",
      from: 5,
      to: 10,
    },
    {
      id: "realschule",
      name: "Realschule",
      wo: "an der Realschule",
      short: "Real",
      from: 5,
      to: 10,
    },
    {
      id: "gymnasium",
      name: "Gymnasium",
      wo: "am Gymnasium",
      short: "Gym",
      from: 5,
      to: 13,
    },
  ],
  bereiche: [
    { id: "naturwissenschaften", name: "Naturwissenschaften", glyph: "⚛" },
    { id: "informatik", name: "Informatik", glyph: "</>" },
    { id: "gesellschaft", name: "Gesellschaft", glyph: "⌛" },
  ],
  faecher: [
    {
      id: "biologie",
      name: "Biologie",
      bereich: "naturwissenschaften",
      glyph: "DNA",
      hue: 130,
      from: 5,
    },
    {
      id: "physik",
      name: "Physik",
      bereich: "naturwissenschaften",
      glyph: "F=m·a",
      hue: 258,
      from: 6,
    },
    {
      id: "informatik",
      name: "Informatik",
      bereich: "informatik",
      glyph: "</>",
      hue: 190,
      from: 6,
    },
    {
      id: "geschichte",
      name: "Geschichte",
      bereich: "gesellschaft",
      glyph: "1918",
      hue: 30,
      from: 6,
    },
  ],
  fachverbunde: [
    {
      id: "nt",
      name: "Natur und Technik",
      glyph: "NuT",
      school: "mittelschule",
      grades: [5, 6, 7],
      paths: ["biologie", "physik"],
    },
  ],
  pakete: [
    {
      id: "biologie-realschule-6",
      app: "biologie-realschule-6",
      title: "Biologie 6",
      fach: "biologie",
      grade: 6,
      school: "realschule",
      lessons: 30,
      gebiete: ["Ökosystem Gewässer", "Photosynthese"],
      desc: "LehrplanPLUS Realschule 6",
    },
    {
      id: "nt-mittelschule-6",
      app: "nt-mittelschule-6",
      title: "Natur und Technik 6",
      fach: "nt",
      grade: 6,
      school: "mittelschule",
      lessons: 24,
      gebiete: ["Pflanzen", "Kräfte"],
      desc: "Mittelschule NuT 6",
    },
    {
      id: "informatik-realschule-8",
      app: "informatik-realschule-8",
      title: "Informatik 6–8",
      fach: "informatik",
      grade: 8,
      grades: [6, 7, 8],
      school: "realschule",
      zweige: "Alle Wahlpflichtfächergruppen",
      lessons: 40,
      gebiete: ["Programmierung", "Tabellenkalkulation"],
      desc: "Gemeinsames Paket für die Klassen 6–8",
    },
    {
      id: "uml",
      app: "uml",
      title: "UML 2.5.1",
      fach: "informatik",
      grade: null,
      school: null,
      lessons: 24,
      gebiete: ["Use Cases", "Klassendiagramme"],
      desc: "Jahrgangsübergreifend",
    },
  ],
};

describe("parseAcademyIndex & academyAppSlug", () => {
  it("parses schools, areas, subjects, combined subjects and multi-grade packages", () => {
    const index = parseAcademyIndex(SAMPLE_INDEX_RAW);
    expect(index.schulen).toHaveLength(3);
    expect(index.fachverbunde[0].paths).toEqual(["biologie", "physik"]);
    expect(
      index.pakete.find((p) => p.app === "informatik-realschule-8")?.grades,
    ).toEqual([6, 7, 8]);
    expect(index.pakete.find((p) => p.app === "uml")?.grades).toEqual([]);
  });

  it("rejects malformed top-level index or taxonomy shapes", () => {
    expect(() => parseAcademyIndex(null)).toThrow(/Academy index/);
    expect(() =>
      parseAcademyIndex({ ...SAMPLE_INDEX_RAW, schema: 2 }),
    ).toThrow();
    expect(() =>
      parseAcademyIndex({
        ...SAMPLE_INDEX_RAW,
        schulen: [{ ...SAMPLE_INDEX_RAW.schulen[0], id: "../evil" }],
      }),
    ).toThrow(/slug/);
  });

  it("skips individual malformed or duplicate package entries while preserving valid ones", () => {
    const warnings: string[] = [];
    const parsed = parseAcademyIndex(
      {
        ...SAMPLE_INDEX_RAW,
        pakete: [
          SAMPLE_INDEX_RAW.pakete[0],
          { ...SAMPLE_INDEX_RAW.pakete[1], app: "../evil" },
          SAMPLE_INDEX_RAW.pakete[0], // duplicate app
          SAMPLE_INDEX_RAW.pakete[3],
        ],
      },
      { onSkip: (reason) => warnings.push(reason) },
    );
    expect(parsed.pakete.map((p) => p.app)).toEqual([
      "biologie-realschule-6",
      "uml",
    ]);
    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toMatch(/slug/);
    expect(warnings[1]).toMatch(/duplicate app/);
  });

  it("extracts app slugs from URLs, paths and tile ids", () => {
    expect(academyAppSlug("https://academy.zam-os.org/uml/")).toBe("uml");
    expect(academyAppSlug("/biologie-realschule-8/")).toBe(
      "biologie-realschule-8",
    );
    expect(academyAppSlug("zam-academy:sql")).toBe("sql");
  });
});

describe("academy enrichment, multi-stage tiles and search", () => {
  const index = parseAcademyIndex(SAMPLE_INDEX_RAW);
  const baseRows = [
    {
      id: "zam-academy:biologie-realschule-6",
      title: "Biologie 6 Realschule (ZAM Academy)",
      description: "Ökosystem Gewässer und Photosynthese",
      appUrl: `${ACADEMY_ORIGIN}/biologie-realschule-6/`,
      held: true,
    },
    {
      id: "zam-academy:nt-mittelschule-6",
      title: "Natur und Technik 6 Mittelschule (ZAM Academy)",
      description: "Gemeinsames Fach",
      appUrl: `${ACADEMY_ORIGIN}/nt-mittelschule-6/`,
      held: false,
    },
    {
      id: "zam-academy:informatik-realschule-8",
      title: "Informatik 6–8 Realschule (ZAM Academy)",
      description: "IT-Module",
      appUrl: `${ACADEMY_ORIGIN}/informatik-realschule-8/`,
      held: false,
    },
    {
      id: "zam-academy:uml",
      title: "UML 2.5.1 (ZAM Academy)",
      description: "Klassendiagramme",
      appUrl: `${ACADEMY_ORIGIN}/uml/`,
      held: true,
    },
    {
      id: "zam-academy:unbekannt",
      title: "Neues Sonderpaket",
      description: "Noch nicht in academy.json",
      appUrl: `${ACADEMY_ORIGIN}/unbekannt/`,
      held: false,
    },
  ];
  const { taxonomy, cells } = enrichAcademyCells(baseRows, index);

  it("exposes Fachverbunde under each constituent subject and counts multi-grade packages cleanly", () => {
    const grade6Subjects = buildAcademySubjectTiles(cells, taxonomy, {
      grade: 6,
    });
    const bio = grade6Subjects.find((s) => s.id === "biologie");
    expect(bio?.total).toBe(2);
    expect(bio?.held).toBe(1);
    expect(bio?.schools).toEqual([
      {
        id: "mittelschule",
        short: "MS",
        combination: "Natur und Technik",
        combinationGlyph: "NuT",
      },
      {
        id: "realschule",
        short: "Real",
        combination: null,
        combinationGlyph: null,
      },
    ]);

    // Multi-grade Informatik 6–8 appears in grades 6, 7 and 8.
    const grades = buildAcademyGradeTiles(cells, taxonomy, "realschule");
    expect(grades.map((g) => g.key)).toEqual([6, 7, 8]);
  });

  it("never drops unknown cells from either Schulsicht or Weltwissen stages", () => {
    const grades = buildAcademyGradeTiles(cells, taxonomy);
    const cross = grades.find((g) => g.key === ACADEMY_GRADE_CROSS);
    expect(cross?.total).toBe(2); // uml + unbekannt
    const otherSubjects = buildAcademySubjectTiles(cells, taxonomy, {
      grade: ACADEMY_GRADE_CROSS,
    });
    expect(otherSubjects.some((s) => s.id === ACADEMY_OTHER_BUCKET)).toBe(true);

    const areas = buildAcademyBereichTiles(cells, taxonomy);
    expect(areas.some((a) => a.id === ACADEMY_OTHER_BUCKET)).toBe(true);

    const schools = buildAcademySchoolOptions(cells, taxonomy);
    expect(schools.some((s) => s.id === ACADEMY_SCHOOL_INDEPENDENT)).toBe(true);
  });

  it("supports multi-token German-aware search across titles, topics, schools, grades and Fachverbunde", () => {
    // Umlaut folding: "oekosystem" matches "Ökosystem Gewässer"
    expect(
      filterAcademyCells(cells, { query: "oekosystem real 6" }, taxonomy).map(
        (c) => c.id,
      ),
    ).toEqual(["zam-academy:biologie-realschule-6"]);

    // Searching "biologie mittelschule" finds NuT via its Fachverbund path!
    expect(
      filterAcademyCells(
        cells,
        { query: "biologie mittelschule" },
        taxonomy,
      ).map((c) => c.id),
    ).toEqual(["zam-academy:nt-mittelschule-6"]);

    // Searching a topic area ("klassendiagramme") finds UML.
    expect(
      filterAcademyCells(cells, { query: "klassendiagramme" }, taxonomy).map(
        (c) => c.id,
      ),
    ).toEqual(["zam-academy:uml"]);
  });

  it("infers offline fallback facets from bundled tiles when academy.json is absent", () => {
    const bio8 = getBundledCellTile("zam-academy:biologie-realschule-8")!;
    const bwr9 = getBundledCellTile("zam-academy:bwr-realschule-9")!;
    const uml = getBundledCellTile("zam-academy:uml")!;
    const offline = enrichAcademyCells(
      [
        {
          id: bio8.tile_id,
          title: bio8.title,
          description: bio8.description,
          appUrl: null,
          held: false,
        },
        {
          id: bwr9.tile_id,
          title: bwr9.title,
          description: bwr9.description,
          appUrl: null,
          held: false,
        },
        {
          id: uml.tile_id,
          title: uml.title,
          description: uml.description,
          appUrl: null,
          held: false,
        },
      ],
      null,
      (id) => getBundledCellTile(id),
    );
    expect(offline.cells[0].facet).toMatchObject({
      school: "realschule",
      grades: [8],
      fach: "biologie",
      glyph: "DNA",
    });
    expect(offline.cells[1].facet).toMatchObject({
      school: "realschule",
      grades: [9],
      fach: "wirtschaft",
      glyph: "€",
    });
    expect(offline.cells[2].facet).toMatchObject({
      school: null,
      grades: [],
      fach: "informatik",
      glyph: "</>",
    });
  });

  it("formats single, consecutive, non-consecutive and cross-grade labels", () => {
    const labels = {
      gradeSingle: (n: number) => `Klasse ${n}`,
      gradeRange: (r: string) => `Klassen ${r}`,
      crossGrade: "Übergreifend",
    };
    expect(formatAcademyGrades([8], labels)).toBe("Klasse 8");
    expect(formatAcademyGrades([6, 7, 8], labels)).toBe("Klassen 6–8");
    expect(formatAcademyGrades([5, 7], labels)).toBe("Klassen 5, 7");
    expect(formatAcademyGrades([], labels)).toBe("Übergreifend");
  });

  it("keeps DEFAULT_ACADEMY_TAXONOMY internally consistent and aligned with bundled Academy cells", () => {
    const schoolIds = new Set(DEFAULT_ACADEMY_TAXONOMY.schulen.map((s) => s.id));
    const bereichIds = new Set(
      DEFAULT_ACADEMY_TAXONOMY.bereiche.map((b) => b.id),
    );
    const fachIds = new Set(DEFAULT_ACADEMY_TAXONOMY.faecher.map((f) => f.id));

    expect(schoolIds.size).toBe(DEFAULT_ACADEMY_TAXONOMY.schulen.length);
    expect(bereichIds.size).toBe(DEFAULT_ACADEMY_TAXONOMY.bereiche.length);
    expect(fachIds.size).toBe(DEFAULT_ACADEMY_TAXONOMY.faecher.length);

    for (const fach of DEFAULT_ACADEMY_TAXONOMY.faecher) {
      expect(bereichIds.has(fach.bereich), `bereich for ${fach.id}`).toBe(true);
    }
    for (const verbund of DEFAULT_ACADEMY_TAXONOMY.fachverbunde) {
      expect(schoolIds.has(verbund.school), `school for ${verbund.id}`).toBe(
        true,
      );
      for (const path of verbund.paths) {
        expect(fachIds.has(path), `path ${path} for ${verbund.id}`).toBe(true);
      }
    }

    const academyTiles = Object.values(BUNDLED_TILES).filter((tile) =>
      tile.tile_id.startsWith("zam-academy:"),
    );
    expect(academyTiles.length).toBeGreaterThan(0);
    const enriched = enrichAcademyCells(
      academyTiles.map((tile) => ({
        id: tile.tile_id,
        title: tile.title,
        description: tile.description ?? "",
        appUrl: null,
      })),
      null,
      (id) => BUNDLED_TILES[id],
    );
    for (const row of enriched.cells) {
      expect(row.facet.fach, `fach for ${row.id}`).not.toBeNull();
      expect(row.facet.bereich, `bereich for ${row.id}`).not.toBeNull();
      if (row.facet.school !== null) {
        expect(schoolIds.has(row.facet.school), `school for ${row.id}`).toBe(
          true,
        );
      }
    }
  });
});

describe("userHoldsAcademyAppCards (per-learner held check without tile)", () => {
  it("clears held status once the learner detaches or deletes all cards for an app", async () => {
    const db = await openDatabase({ path: ":memory:" });
    try {
      await enrolBundledCell(db, "learner", "zam-academy:uml");
      const appUrl = `${ACADEMY_ORIGIN}/uml/`;
      expect(await countUserAcademyAppCards(db, "learner", appUrl)).toBe(26);
      expect(await userHoldsAcademyAppCards(db, "learner", appUrl)).toBe(true);
      // Another learner in the same library holds no cards yet.
      expect(await userHoldsAcademyAppCards(db, "other-user", appUrl)).toBe(
        false,
      );
      // Detaching all of the learner's cards leaves installed_tiles intact,
      // yet clears per-learner enrolment so "Take" is offered again.
      await db
        .prepare("UPDATE cards SET detached_at = '2026-11-22T00:00:00Z' WHERE user_id = ?")
        .run("learner");
      expect(await countUserAcademyAppCards(db, "learner", appUrl)).toBe(0);
      expect(await userHoldsAcademyAppCards(db, "learner", appUrl)).toBe(false);
    } finally {
      await db.close();
    }
  });
});
