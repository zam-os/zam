import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  getCard,
  getTokenById,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

const CELL_ID = "zam-academy:physik-realschule-8";
const APP = "https://academy.zam-os.org/physik-realschule-8/";
const ITEMS = 152;

/**
 * The two de-by Realschule 8 physics cells stay bundled and unchanged beside
 * the Academy cell. The Academy's proposed mapping of their sixteen cards
 * (replaces-de-by.json) is not approved, so the Academy cell carries neither
 * `replaces` nor `retired_items` and no learner's history moves.
 */
const OLD_IDS = [
  "de-by:realschule-8-physik-elektrik-grundlagen",
  "de-by:realschule-8-physik-mechanik-kraft-bewegung",
];

/**
 * The lessons of the Physik-8 app in zam-os/zam-academy, by stage. A card
 * cites one of them, so renaming a lesson there breaks every card that
 * cites it. The app's own test pins the same ids.
 */
const LESSONS: Record<string, string[]> = {
  "stage-1-mechanik": [
    "kr-1-messen",
    "kr-2-geschwindigkeit",
    "kr-3-kraft",
    "kr-4-wechselwirkung",
    "kr-5-hooke",
    "kr-6-masse-gewicht",
    "kr-7-teilchenmodell",
    "kr-8-dichte",
    "kr-9-reibung",
  ],
  "stage-2-optik": [
    "op-1-lichtausbreitung",
    "op-2-schatten",
    "op-3-finsternisse",
    "op-4-reflexion",
    "op-5-brechung",
    "op-6-totalreflexion",
    "op-7-sammellinse",
    "op-8-abbildung",
    "op-9-geraete",
  ],
  "stage-3-energie": [
    "en-1-schiefe-ebene",
    "en-2-hebel",
    "en-3-flaschenzug",
    "en-4-arbeit",
    "en-5-leistung",
    "en-6-energieformen",
    "en-7-energieerhaltung",
    "en-8-wirkungsgrad",
  ],
  "stage-4-waerme": [
    "wl-1-innere-energie",
    "wl-2-temperatur",
    "wl-3-aggregatzustaende",
    "wl-4-ausdehnung",
    "wl-5-wasseranomalie",
    "wl-6-waermeleitung",
    "wl-7-konvektion-strahlung",
  ],
  "stage-5-elektrizitaet": [
    "el-1-magnete",
    "el-2-magnetfeld",
    "el-3-ladung",
    "el-4-elektrisches-feld",
    "el-5-elektrostatik-anwendung",
    "el-6-strom",
    "el-7-stromkreis",
    "el-8-stromstaerke-messen",
    "el-9-stromfluss-fluessigkeit-gas",
    "el-10-gefahren-schutz",
  ],
  "stage-6-akustik": ["ak-1-schall", "ak-2-ausbreitung"],
  "stage-7-astronomie": ["as-1-weltbilder", "as-2-sonnensystem"],
};
const ALL_LESSONS = Object.values(LESSONS).flat();

/**
 * The Lernbereich of each lesson in the two Fachlehrpläne of LehrplanPLUS
 * Realschule 8 Physik, per Wahlpflichtfächergruppe (read on 2026-10-23, as the
 * Academy's coverage.json records it). Zweig I (`I`, wpfg1): LB 1 Mechanik und
 * Energie, LB 2 Wärmelehre, LB 3 Elektrizitätslehre, LB 4 Wahlbereich with 4.1
 * Astronomie and 4.2 Akustik. Zweig II/III (`II_III`, wpfg2-3): LB 1 Mechanik,
 * LB 2 Optik, LB 3 Magnetismus und Elektrizitätslehre. A lesson of both Zweige
 * carries one binding each; the elective lessons sit in `I` only, and the
 * coverage file's coarse LB 4 is refined here to `lb4.1` / `lb4.2`.
 */
const LESSON_AREAS: Record<string, Array<[track: string, topic: string]>> = {
  "kr-1-messen": [["II_III", "lb1"]],
  "kr-2-geschwindigkeit": [["II_III", "lb1"]],
  "kr-3-kraft": [["II_III", "lb1"]],
  "kr-4-wechselwirkung": [["II_III", "lb1"]],
  "kr-5-hooke": [["II_III", "lb1"]],
  "kr-6-masse-gewicht": [["II_III", "lb1"]],
  "kr-7-teilchenmodell": [["II_III", "lb1"]],
  "kr-8-dichte": [["II_III", "lb1"]],
  "kr-9-reibung": [["II_III", "lb1"]],
  "op-1-lichtausbreitung": [["II_III", "lb2"]],
  "op-2-schatten": [["II_III", "lb2"]],
  "op-3-finsternisse": [["II_III", "lb2"]],
  "op-4-reflexion": [["II_III", "lb2"]],
  "op-5-brechung": [["II_III", "lb2"]],
  "op-6-totalreflexion": [["II_III", "lb2"]],
  "op-7-sammellinse": [["II_III", "lb2"]],
  "op-8-abbildung": [["II_III", "lb2"]],
  "op-9-geraete": [["II_III", "lb2"]],
  "en-1-schiefe-ebene": [["I", "lb1"]],
  "en-2-hebel": [["I", "lb1"]],
  "en-3-flaschenzug": [["I", "lb1"]],
  "en-4-arbeit": [["I", "lb1"]],
  "en-5-leistung": [["I", "lb1"]],
  "en-6-energieformen": [["I", "lb1"]],
  "en-7-energieerhaltung": [["I", "lb1"]],
  "en-8-wirkungsgrad": [["I", "lb1"]],
  "wl-1-innere-energie": [["I", "lb2"]],
  "wl-2-temperatur": [["I", "lb2"]],
  "wl-3-aggregatzustaende": [["I", "lb2"]],
  "wl-4-ausdehnung": [["I", "lb2"]],
  "wl-5-wasseranomalie": [["I", "lb2"]],
  "wl-6-waermeleitung": [["I", "lb2"]],
  "wl-7-konvektion-strahlung": [["I", "lb2"]],
  "el-1-magnete": [["II_III", "lb3"]],
  "el-2-magnetfeld": [["II_III", "lb3"]],
  "el-3-ladung": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-4-elektrisches-feld": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-5-elektrostatik-anwendung": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-6-strom": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-7-stromkreis": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-8-stromstaerke-messen": [["I", "lb3"]],
  "el-9-stromfluss-fluessigkeit-gas": [["I", "lb3"]],
  "el-10-gefahren-schutz": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "ak-1-schall": [["I", "lb4.2"]],
  "ak-2-ausbreitung": [["I", "lb4.2"]],
  "as-1-weltbilder": [["I", "lb4.1"]],
  "as-2-sonnensystem": [["I", "lb4.1"]],
};

const POSITION = {
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade: 8,
  subject: "physik",
};

describe("ZAM Academy Physik 8 Realschule cell", () => {
  const tile = getBundledCellTile(CELL_ID);

  it("is a bundled cell of the zam-academy provider, labelled by its publisher", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell?.title).toBe("Physik 8 Realschule (ZAM Academy)");
    expect(cell?.publisher).toBe("ZAM Academy");
    expect(cell?.gradeLabel).toBe("ZAM Academy");
    expect(cell?.atomCount).toBe(47);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "physik-realschule-8",
      }).map((c) => c.id),
    ).toContain(CELL_ID);
  });

  it("is offered at Realschule 8 Physik to every Wahlpflichtfächergruppe, beside the two older cells", () => {
    for (const track of [
      undefined,
      "I",
      "II",
      "IIIa",
      "IIIb",
      "wpfg1",
      "wpfg2-3",
    ]) {
      const ids = findBundledCellsForScope({
        ...POSITION,
        ...(track ? { track } : {}),
      }).map((c) => c.id);
      expect(ids, `track ${track ?? "any"}`).toEqual(
        expect.arrayContaining([CELL_ID, ...OLD_IDS]),
      );
    }
    // The cell covers the grade itself, so the generic importer is not
    // offered beside it (ADR 2026-08-14 Decision 10).
    expect(needsGenericCurriculumImport(POSITION)).toBe(false);
    for (const other of [
      { ...POSITION, grade: 7 },
      { ...POSITION, grade: 9 },
      { ...POSITION, schoolType: "gymnasium" },
      { ...POSITION, subject: "chemie" },
    ]) {
      expect(
        findBundledCellsForScope(other).map((c) => c.id),
        JSON.stringify(other),
      ).not.toContain(CELL_ID);
    }
    expect(getBundledCell(CELL_ID)?.curriculumScopes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ...POSITION, track: "I" }),
        expect.objectContaining({ ...POSITION, track: "II_III" }),
      ]),
    );
  });

  it("keeps the two older Realschule 8 physics cells bundled, with their own four cards each", () => {
    for (const id of OLD_IDS) {
      expect(getBundledCell(id), `${id} stays bundled`).toBeDefined();
      const old = getBundledCellTile(id);
      expect(old?.atoms, id).toHaveLength(4);
      for (const atom of old?.atoms ?? []) {
        for (const item of atom.practice_items) {
          expect(item.replaces, `${item.id} is not replaced`).toBeUndefined();
        }
      }
    }
  });

  it("declares no replaces and no retired items: the mapping is not approved", () => {
    expect(tile).toBeDefined();
    expect(
      (tile as unknown as Record<string, unknown>).retired_items,
    ).toBeUndefined();
    const items = tile?.atoms.flatMap((atom) => atom.practice_items) ?? [];
    expect(items).toHaveLength(ITEMS);
    for (const item of items) {
      expect(item.replaces, item.id).toBeUndefined();
      expect(
        (item as unknown as Record<string, unknown>).retired,
        item.id,
      ).toBeUndefined();
    }
  });

  it("has one atom per lesson, in the app's order, each bound first to its stage", () => {
    expect(tile?.atoms).toHaveLength(ALL_LESSONS.length);
    expect(
      tile?.atoms.map((atom) =>
        (atom.source_link ?? "").slice(`${APP}#lesson=`.length),
      ),
    ).toEqual(ALL_LESSONS);
    for (const atom of tile?.atoms ?? []) {
      // The first binding decides the cell's label (bundled-cells.ts):
      // the academy stage, with no school type or grade.
      const first = atom.curricula?.[0];
      expect(first?.provider).toBe("zam-academy");
      expect(first?.school_type).toBeUndefined();
      expect(first?.grade).toBeUndefined();
      expect(Object.keys(LESSONS)).toContain(first?.topic_code);
    }
  });

  it("binds every lesson to its Lernbereich in exactly the right Wahlpflichtfächergruppen", () => {
    expect(Object.keys(LESSON_AREAS)).toEqual(ALL_LESSONS);
    for (const atom of tile?.atoms ?? []) {
      const lesson = (atom.source_link ?? "").slice(`${APP}#lesson=`.length);
      const lehrplan = (atom.curricula ?? []).filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      );
      for (const binding of lehrplan) {
        expect(binding.school_type, lesson).toBe("realschule");
        expect(binding.grade, lesson).toBe(8);
        expect(binding.subject, lesson).toBe("physik");
      }
      // Exactly the expected pairs: a swapped, missing, extra or duplicated
      // binding changes this list.
      expect(
        lehrplan
          .map((binding) => `${binding.track} ${binding.topic_code}`)
          .sort(),
        lesson,
      ).toEqual(
        LESSON_AREAS[lesson]
          .map(([track, topic]) => `${track} ${topic}`)
          .sort(),
      );
    }
  });

  it("links every card to a lesson of its own stage", () => {
    for (const atom of tile?.atoms ?? []) {
      const stage = atom.curricula?.[0]?.topic_code ?? "";
      const lessons = LESSONS[stage] ?? [];
      expect(atom.practice_items.length, atom.slug).toBeGreaterThanOrEqual(2);
      for (const item of [atom, ...atom.practice_items]) {
        const link = item.source_link ?? "";
        expect(link.startsWith(`${APP}#lesson=`), link).toBe(true);
        expect(lessons, `${item.id} cites ${link}`).toContain(
          link.slice(`${APP}#lesson=`.length),
        );
      }
    }
  });

  it("spells every formula out for reading aloud", () => {
    for (const atom of tile?.atoms ?? []) {
      for (const item of atom.practice_items) {
        for (const segment of [
          ...(item.question_segments ?? []),
          ...(item.concept_segments ?? []),
        ]) {
          if (segment.type === "math") {
            expect(segment.speech, `${item.id}: ${segment.tex}`).toBeTruthy();
          }
        }
      }
    }
  });

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-physik8-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("gives the learner every card, as one library topic", async () => {
      const result = await enrolBundledCell(db, "learner", CELL_ID);
      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(ITEMS);

      const topics = await listLibraryTopics(db, "learner");
      const app = topics.filter((topic) => topic.key.startsWith(APP));
      expect(app).toHaveLength(1);
      expect(app[0]).toMatchObject({
        key: APP,
        itemCount: ITEMS,
        heldCount: ITEMS,
      });
    });

    /**
     * No mapping is approved, so a learner who holds the two older cells
     * keeps their cards, history and active tokens, and the Academy cell
     * adds its own cards on top. Nothing transfers on a guess.
     */
    it("moves no history from the two older cells: their cards stay, the new cards start fresh", async () => {
      const oldItemIds: string[] = [];
      for (const id of OLD_IDS) {
        const result = await enrolBundledCell(db, "learner", id);
        expect(result.success).toBe(true);
        for (const atom of getBundledCellTile(id)?.atoms ?? []) {
          for (const item of atom.practice_items) oldItemIds.push(item.id);
        }
      }
      expect(oldItemIds.length).toBeGreaterThan(0);

      const first = oldItemIds[0];
      const card = await getCard(db, first, "learner");
      expect(card).toBeTruthy();
      await db
        .prepare("UPDATE cards SET reps = 5, stability = 20 WHERE id = ?")
        .run(card!.id);

      const result = await enrolBundledCell(db, "learner", CELL_ID);
      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(ITEMS);

      const kept = await getCard(db, first, "learner");
      expect(kept?.id).toBe(card!.id);
      expect(kept?.reps).toBe(5);
      expect(kept?.stability).toBe(20);
      for (const id of oldItemIds) {
        expect((await getTokenById(db, id))?.deprecated_at, id).toBeFalsy();
        expect(await getCard(db, id, "learner"), id).toBeTruthy();
      }

      // The new cards are unrated: not one of them inherited a rep.
      const reviewed = (await db
        .prepare(
          `SELECT COUNT(*) AS n FROM cards
            WHERE user_id = 'learner' AND reps > 0
              AND token_id NOT IN (${oldItemIds.map(() => "?").join(",")})`,
        )
        .get(...oldItemIds)) as { n: number };
      expect(reviewed.n).toBe(0);
    });
  });
});
