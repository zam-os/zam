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
  openDatabase,
} from "../../src/kernel/index.js";
import legacyElektrik from "../fixtures/legacy/de-by-realschule-9-physik-elektrik-kvt.json" with {
  type: "json",
};
import legacyFluessigkeiten from "../fixtures/legacy/de-by-realschule-9-physik-fluessigkeiten-gase-kvt.json" with {
  type: "json",
};
import legacyMechanik from "../fixtures/legacy/de-by-realschule-9-physik-mechanik-energie-kvt.json" with {
  type: "json",
};
import legacyWaerme from "../fixtures/legacy/de-by-realschule-9-physik-waermelehre-kvt.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:physik-realschule-9";
const APP = "https://academy.zam-os.org/physik-realschule-9/";
const ITEMS = 70;

/**
 * The four de-by Realschule 9 physics cells this cell replaced
 * (zam-os/zam-academy#4, approved 2026-10-19). They left the bundle; the
 * migration test installs them from tests/fixtures/legacy.
 */
const LEGACY_TILES = [
  legacyElektrik,
  legacyFluessigkeiten,
  legacyMechanik,
  legacyWaerme,
] as unknown as KvtTile[];
const LEGACY_IDS = [
  "de-by:realschule-9-physik-elektrik",
  "de-by:realschule-9-physik-fluessigkeiten-gase",
  "de-by:realschule-9-physik-mechanik-energie",
  "de-by:realschule-9-physik-waermelehre",
];

/**
 * The lessons of the Physik-9 app in zam-os/zam-academy, by stage. A card
 * cites one of them, so renaming a lesson there breaks every card that
 * cites it. The app's own test pins the same ids.
 */
const LESSONS: Record<string, string[]> = {
  "stage-1-druck": [
    "dr-1-druck",
    "dr-2-hydraulik",
    "dr-3-schweredruck",
    "dr-4-auftrieb",
    "dr-5-boyle-mariotte",
  ],
  "stage-2-mechanik-energie": [
    "me-1-kraftwandler",
    "me-2-arbeit-leistung",
    "me-3-energieerhaltung",
    "me-4-wirkungsgrad",
  ],
  "stage-3-waermelehre": [
    "wl-1-temperatur",
    "wl-2-waermekapazitaet",
    "wl-3-mischung",
    "wl-4-aggregatzustand",
    "wl-5-wasseranomalie",
    "wl-6-gasgleichung",
  ],
  "stage-4-elektrizitaet": [
    "el-1-elektromagnet",
    "el-2-lorentzkraft-motor",
    "el-3-energie-leistung",
    "el-4-kennlinie-ohm",
    "el-5-widerstandsgesetz",
    "el-6-halbleiter",
  ],
};
const ALL_LESSONS = Object.values(LESSONS).flat();

describe("ZAM Academy Physik 9 Realschule cell", () => {
  const tile = getBundledCellTile(CELL_ID);

  it("is a bundled cell of the zam-academy provider, labelled by its publisher", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell?.title).toBe("Physik 9 Realschule (ZAM Academy)");
    expect(cell?.publisher).toBe("ZAM Academy");
    expect(cell?.gradeLabel).toBe("ZAM Academy");
    expect(cell?.atomCount).toBe(21);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "physik-realschule-9",
      }).map((c) => c.id),
    ).toContain(CELL_ID);
  });

  it("is the only cell at its LehrplanPLUS position, Realschule 9 Physik, for both Zweige", () => {
    for (const track of [undefined, "I", "II_III"]) {
      const ids = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "physik",
        ...(track ? { track } : {}),
      }).map((c) => c.id);
      expect(ids, `track ${track ?? "any"}`).toEqual([CELL_ID]);
    }
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
        subject: "physik",
      }).map((c) => c.id),
    ).not.toContain(CELL_ID);
    const cell = getBundledCell(CELL_ID);
    expect(cell?.curriculumScopes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 9,
          subject: "physik",
        }),
      ]),
    );
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
      const lehrplan = atom.curricula?.filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      );
      expect(lehrplan?.length, atom.slug).toBeGreaterThan(0);
      for (const binding of lehrplan ?? []) {
        expect(binding.school_type).toBe("realschule");
        expect(binding.grade).toBe(9);
        expect(["I", "II_III"]).toContain(binding.track);
        expect(["lb1", "lb2", "lb3"]).toContain(binding.topic_code);
      }
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
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-physik-"));
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
     * ADR 2026-08-14 Decision 9: the approved `replaces` move a learner's card
     * and review history from the de-by items to their academy successors and
     * retire the old tokens, so nobody learns the same fact twice. Items with
     * no successor (the Jahrgangsstufe 7/8 content) stay as they are.
     */
    it("moves the cards and history of a learner who held the four de-by cells", async () => {
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
      expect(replaced.size).toBe(32);
      const legacyItems = LEGACY_TILES.flatMap((t) =>
        t.atoms.flatMap((atom) => atom.practice_items.map((item) => item.id)),
      );
      expect(legacyItems).toHaveLength(42);
      for (const old of replaced.keys()) expect(legacyItems).toContain(old);

      // Real history on the absolute-zero card of the de-by Wärmelehre cell.
      const oldId = "01K4W9P0000000000000000J01";
      const newId = replaced.get(oldId)!;
      const card = await getCard(db, oldId, "learner");
      await db
        .prepare("UPDATE cards SET reps = 6, stability = 30 WHERE id = ?")
        .run(card!.id);
      await db
        .prepare(
          `INSERT INTO review_logs
             (id, card_id, token_id, user_id, rating, reviewed_at, scheduled_at)
           VALUES ('01K8PHYS9RSLEGACY000000R01', ?, ?, 'learner', 3,
                   '2026-10-01T10:00:00.000Z', '2026-10-01T09:00:00.000Z')`,
        )
        .run(card!.id, oldId);

      const result = await enrolBundledCell(db, "learner", CELL_ID);
      expect(result.success).toBe(true);
      // The 32 cards moved over count as held. On an atom where the learner
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
      expect(expectedNew).toBe(32);
      expect(result.cardsCreated).toBe(expectedNew);

      const moved = await getCard(db, newId, "learner");
      expect(moved?.id).toBe(card!.id);
      expect(moved?.reps).toBe(6);
      expect(moved?.stability).toBe(30);
      expect(await getCard(db, oldId, "learner")).toBeFalsy();
      const log = (await db
        .prepare("SELECT token_id FROM review_logs WHERE id = ?")
        .get("01K8PHYS9RSLEGACY000000R01")) as { token_id: string };
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
      // A de-by item without successor keeps its card and stays active.
      const kept = "01K4E9P0000000000000000J01";
      expect(replaced.has(kept)).toBe(false);
      expect(await getCard(db, kept, "learner")).toBeTruthy();
      expect((await getTokenById(db, kept))?.deprecated_at).toBeFalsy();

      // Held now: the moved cards plus the new ones; the rest follows as the
      // learner progresses, like every other new atom content.
      const academyCards = (await db
        .prepare(
          `SELECT COUNT(*) AS n FROM cards
            WHERE user_id = 'learner' AND token_id LIKE '01K8PHYS9RS%'`,
        )
        .get()) as { n: number };
      expect(academyCards.n).toBe(32 + expectedNew);
    });
  });
});
