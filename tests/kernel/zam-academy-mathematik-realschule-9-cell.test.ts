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
  installKvtTile,
  type KvtTile,
  listLibraryTopics,
  materialiseKvtCards,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";
import legacyKreis from "../fixtures/legacy/de-by-realschule-9-mathematik-kreis-raumgeometrie-kvt.json" with {
  type: "json",
};
import legacyGleichungssysteme from "../fixtures/legacy/de-by-realschule-9-mathematik-lineare-gleichungssysteme-kvt.json" with {
  type: "json",
};
import legacyPythagoras from "../fixtures/legacy/de-by-realschule-9-mathematik-pythagoras-trigonometrie-kvt.json" with {
  type: "json",
};
import legacyQuadratisch from "../fixtures/legacy/de-by-realschule-9-mathematik-quadratische-funktionen-kvt.json" with {
  type: "json",
};
import legacyStochastik from "../fixtures/legacy/de-by-realschule-9-mathematik-stochastik-daten-kvt.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:mathematik-realschule-9";
const APP = "https://academy.zam-os.org/mathematik-realschule-9/";
const ITEMS = 108;

/**
 * The five de-by Realschule 9 mathematics cells this cell replaced
 * (zam-os/zam-academy#9, approved 2026-10-20). They left the bundle; the
 * migration test installs them from tests/fixtures/legacy.
 */
const LEGACY_TILES = [
  legacyKreis,
  legacyGleichungssysteme,
  legacyPythagoras,
  legacyQuadratisch,
  legacyStochastik,
] as unknown as KvtTile[];
const LEGACY_IDS = [
  "de-by:realschule-9-mathematik-kreis-raumgeometrie",
  "de-by:realschule-9-mathematik-lineare-gleichungssysteme",
  "de-by:realschule-9-mathematik-pythagoras-trigonometrie",
  "de-by:realschule-9-mathematik-quadratische-funktionen",
  "de-by:realschule-9-mathematik-stochastik-daten",
];

/**
 * The lessons of the Mathematik-9 app in zam-os/zam-academy, by stage. A
 * card cites one of them, so renaming a lesson there breaks every card that
 * cites it. The app's own test pins the same ids.
 */
const LESSONS: Record<string, string[]> = {
  "stage-1-dreiecke": [
    "rd-1-pythagoras",
    "rd-2-umkehrung",
    "rd-3-hoehe-kathetensatz",
    "rd-4-sinus-kosinus",
    "rd-5-tangens",
    "rd-6-besondere-winkel",
  ],
  "stage-2-kreis-raum": [
    "kr-1-kreiszahl",
    "kr-2-kreisflaeche",
    "kr-3-sektor",
    "rg-1-zylinder",
    "rg-2-kegel-pyramide",
    "rg-3-kugel",
  ],
  "stage-3-gleichungssysteme": [
    "lg-1-lineare-gleichung",
    "lg-2-gleichsetzen",
    "lg-3-additionsverfahren",
    "lg-4-loesungsfaelle",
    "lg-5-textaufgaben",
  ],
  "stage-4-quadratisch": [
    "qf-1-scheitelform",
    "qf-2-streckfaktor",
    "qf-3-quadratische-ergaenzung",
    "qf-4-loesungsformel",
    "qf-5-linearfaktoren",
    "qf-6-parabel-gerade",
    "qf-7-extremwerte",
  ],
  "stage-5-daten-zufall": [
    "dz-1-baumdiagramm",
    "dz-2-gegenereignis",
    "dz-3-vierfeldertafel",
    "dz-4-kenngroessen",
    "dz-5-boxplot",
  ],
};
const ALL_LESSONS = Object.values(LESSONS).flat();

/**
 * LehrplanPLUS M9: the Lernbereich of each lesson family per Zweig.
 * Raumgeometrie (rg) and the quadratic functions (qf) are Zweig I only.
 */
const LERNBEREICH: Record<string, Record<string, string>> = {
  rd: { I: "lb3", II_III: "lb3" },
  kr: { I: "lb4", II_III: "lb4" },
  rg: { I: "lb5" },
  lg: { I: "lb6", II_III: "lb6" },
  qf: { I: "lb7" },
  dz: { I: "lb8", II_III: "lb7" },
};

const lessonOf = (link: string | undefined) =>
  (link ?? "").slice(`${APP}#lesson=`.length);

describe("ZAM Academy Mathematik 9 Realschule cell", () => {
  const tile = getBundledCellTile(CELL_ID);

  it("is a bundled cell of the zam-academy provider, labelled by its publisher", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell?.title).toBe("Mathematik 9 Realschule (ZAM Academy)");
    expect(cell?.publisher).toBe("ZAM Academy");
    expect(cell?.gradeLabel).toBe("ZAM Academy");
    expect(cell?.atomCount).toBe(ALL_LESSONS.length);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "mathematik-realschule-9",
      }).map((c) => c.id),
    ).toContain(CELL_ID);
  });

  it("is the only cell at its LehrplanPLUS position, Realschule 9 Mathematik, for both Zweige", () => {
    for (const track of [undefined, "I", "wpfg1", "II_III", "wpfg2-3", "II"]) {
      const ids = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "mathematik",
        ...(track ? { track } : {}),
      }).map((c) => c.id);
      expect(ids, `track ${track ?? "any"}`).toEqual([CELL_ID]);
    }
    expect(
      needsGenericCurriculumImport({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "mathematik",
      }),
    ).toBe(false);
    for (const legacy of LEGACY_IDS) {
      expect(
        getBundledCell(legacy),
        `${legacy} left the bundle`,
      ).toBeUndefined();
    }
    expect(
      findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade: 9,
        subject: "mathematik",
      }).map((c) => c.id),
    ).not.toContain(CELL_ID);
  });

  it("has one atom per lesson, in the app's order, bound first to its stage and then to its Lernbereich per Zweig", () => {
    expect(tile?.atoms).toHaveLength(ALL_LESSONS.length);
    expect(tile?.atoms.map((atom) => lessonOf(atom.source_link))).toEqual(
      ALL_LESSONS,
    );
    for (const atom of tile?.atoms ?? []) {
      const lesson = lessonOf(atom.source_link);
      // The first binding decides the cell's label (bundled-cells.ts):
      // the academy stage, with no school type or grade.
      const first = atom.curricula?.[0];
      expect(first?.provider).toBe("zam-academy");
      expect(first?.school_type).toBeUndefined();
      expect(first?.grade).toBeUndefined();
      expect(LESSONS[first?.topic_code ?? ""], atom.slug).toContain(lesson);
      const lehrplan =
        atom.curricula?.filter(
          (binding) => binding.provider === "lehrplanplus-bayern",
        ) ?? [];
      const expected = LERNBEREICH[lesson.slice(0, 2)];
      expect(
        lehrplan.map((binding) => binding.track).sort(),
        atom.slug,
      ).toEqual(Object.keys(expected).sort());
      for (const binding of lehrplan) {
        expect(binding.school_type).toBe("realschule");
        expect(binding.grade).toBe(9);
        expect(binding.subject).toBe("mathematik");
        expect(binding.topic_code, `${atom.slug} ${binding.track}`).toBe(
          expected[binding.track ?? ""],
        );
      }
    }
  });

  it("links every card to its atom's lesson, in German", () => {
    for (const atom of tile?.atoms ?? []) {
      const lesson = lessonOf(atom.source_link);
      expect(atom.practice_items.length, atom.slug).toBeGreaterThanOrEqual(2);
      for (const item of atom.practice_items) {
        expect(item.source_link?.startsWith(`${APP}#lesson=`), item.id).toBe(
          true,
        );
        expect(lessonOf(item.source_link), item.id).toBe(lesson);
        expect(item.language, item.id).toBe("de");
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
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-mathematik-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("gives the learner every card, as one library topic", async () => {
      const items =
        tile?.atoms.reduce((n, atom) => n + atom.practice_items.length, 0) ?? 0;
      expect(items).toBe(ITEMS);
      const result = await enrolBundledCell(db, "learner", CELL_ID);
      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(items);

      const topics = await listLibraryTopics(db, "learner");
      const app = topics.filter((topic) => topic.key.startsWith(APP));
      expect(app).toHaveLength(1);
      expect(app[0]).toMatchObject({
        key: APP,
        itemCount: items,
        heldCount: items,
      });
    });

    /**
     * ADR 2026-08-14 Decision 9: the approved `replaces` of the mapping in
     * zam-os/zam-academy (mathematik-realschule-9/replaces-de-by.json) move a
     * learner's card and review history from 45 of the 49 de-by items to
     * their academy successors and retire the old tokens. The four items
     * without a successor (two worked systems, a worked quadratic completion,
     * a double card of both Kathetensätze) stay as they are.
     */
    it("moves the cards and history of a learner who held the five de-by cells", async () => {
      for (const legacy of LEGACY_TILES) {
        await installKvtTile(db, legacy);
        await materialiseKvtCards(
          db,
          "learner",
          legacy.atoms.map((atom) => atom.id),
        );
      }
      const replaced = new Map<string, string>();
      for (const atom of tile?.atoms ?? []) {
        for (const item of atom.practice_items) {
          for (const old of item.replaces ?? []) replaced.set(old, item.id);
        }
      }
      expect(replaced.size).toBe(45);
      const legacyItems = LEGACY_TILES.flatMap((t) =>
        t.atoms.flatMap((atom) => atom.practice_items.map((item) => item.id)),
      );
      expect(legacyItems).toHaveLength(49);
      for (const old of replaced.keys()) expect(legacyItems).toContain(old);

      // Real history on the hypotenuse card of the de-by Pythagoras cell.
      const oldId = "01K4T9M0000000000000000HH1";
      const newId = replaced.get(oldId)!;
      const card = await getCard(db, oldId, "learner");
      await db
        .prepare("UPDATE cards SET reps = 6, stability = 30 WHERE id = ?")
        .run(card!.id);
      await db
        .prepare(
          `INSERT INTO review_logs
             (id, card_id, token_id, user_id, rating, reviewed_at, scheduled_at)
           VALUES ('01K8MATH9RSLEGACY000000R01', ?, ?, 'learner', 3,
                   '2026-10-01T10:00:00.000Z', '2026-10-01T09:00:00.000Z')`,
        )
        .run(card!.id, oldId);

      const result = await enrolBundledCell(db, "learner", CELL_ID);
      expect(result.success).toBe(true);
      // The 45 cards moved over count as held. On an atom where the learner
      // already holds a card, materialiseKvtCards introduces only one more
      // new card at a time; atoms without history get all their cards.
      let expectedNew = 0;
      for (const atom of tile?.atoms ?? []) {
        const moved = atom.practice_items.filter(
          (item) => (item.replaces ?? []).length > 0,
        ).length;
        const missing = atom.practice_items.length - moved;
        expectedNew += moved > 0 ? Math.min(1, missing) : missing;
      }
      expect(expectedNew).toBe(34);
      expect(result.cardsCreated).toBe(expectedNew);

      const moved = await getCard(db, newId, "learner");
      expect(moved?.id).toBe(card!.id);
      expect(moved?.reps).toBe(6);
      expect(moved?.stability).toBe(30);
      expect(await getCard(db, oldId, "learner")).toBeFalsy();
      const log = (await db
        .prepare("SELECT token_id FROM review_logs WHERE id = ?")
        .get("01K8MATH9RSLEGACY000000R01")) as { token_id: string };
      expect(log.token_id).toBe(newId);

      for (const [old, successor] of replaced) {
        expect(
          (await getTokenById(db, old))?.deprecated_at,
          `${old} retired`,
        ).toBeTruthy();
        expect(
          await getCard(db, successor, "learner"),
          `${successor} held`,
        ).toBeTruthy();
      }
      // A de-by item without successor keeps its card and stays active:
      // the double card of both Kathetensätze.
      const kept = "01K4T9M0000000000000000J04";
      expect(replaced.has(kept)).toBe(false);
      expect(await getCard(db, kept, "learner")).toBeTruthy();
      expect((await getTokenById(db, kept))?.deprecated_at).toBeFalsy();

      // Held now: the moved cards plus the new ones; the rest follows as the
      // learner progresses, like every other new atom content.
      const academyCards = (await db
        .prepare(
          `SELECT COUNT(*) AS n FROM cards
            WHERE user_id = 'learner' AND token_id LIKE '01K8MATH9RS%'`,
        )
        .get()) as { n: number };
      expect(academyCards.n).toBe(45 + expectedNew);
    });
  });
});
