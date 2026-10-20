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
import legacyDatenbanken from "../fixtures/legacy/de-by-realschule-9-informatik-datenbanken-sql-kvt.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:sql";
const APP = "https://academy.zam-os.org/sql/";
const ITEMS = 68;

/**
 * The de-by Realschule 9 database cell this cell replaced
 * (zam-os/zam-academy#8). It left the bundle; the migration test installs it
 * from tests/fixtures/legacy.
 */
const LEGACY_TILE = legacyDatenbanken as unknown as KvtTile;
const LEGACY_ID = "de-by:realschule-9-informatik-datenbanken-sql";

/**
 * The lessons of the SQL app in zam-os/zam-academy, by stage. A card cites
 * one of them, so renaming a lesson there breaks every card that cites it.
 * The app's own test pins the same ids.
 */
const LESSONS: Record<string, string[]> = {
  "stage-1-tabellen": [
    "db-1-datenbanksystem",
    "db-2-datensatz-datenfeld",
    "db-3-datentypen",
    "db-4-primaerschluessel",
  ],
  "stage-2-abfragen": [
    "sql-1-where",
    "sql-2-und-oder",
    "sql-3-like",
    "sql-4-order-by",
    "sql-5-berechnen",
    "sql-6-aggregat",
  ],
  "stage-3-beziehungen": [
    "er-1-redundanz",
    "er-2-kardinalitaet",
    "er-3-fremdschluessel",
    "join-1-zwei-tabellen",
    "join-2-drei-tabellen",
  ],
  "stage-4-berichte": [
    "rep-1-group-by",
    "rep-2-left-join",
    "dml-1-einfuegen-aendern",
  ],
};
const ALL_LESSONS = Object.values(LESSONS).flat();

/** Beyond LehrplanPLUS IT 2.3.1/2.3.2: bound to the academy stage only. */
const EXTRA_LESSONS = ["rep-1-group-by", "rep-2-left-join"];

describe("ZAM Academy Relationale Datenbanken und SQL cell", () => {
  const tile = getBundledCellTile(CELL_ID);

  it("is a bundled cell of the zam-academy provider, labelled by its publisher", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell?.title).toBe("Relationale Datenbanken und SQL (ZAM Academy)");
    expect(cell?.publisher).toBe("ZAM Academy");
    expect(cell?.gradeLabel).toBe("ZAM Academy");
    expect(cell?.atomCount).toBe(ALL_LESSONS.length);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "sql",
      }).map((c) => c.id),
    ).toContain(CELL_ID);
  });

  it("is the database cell at its LehrplanPLUS position, Realschule 9 Informatik, for Zweig I and II", () => {
    // The position has one other cell, IT 2.5/2.6 (Algorithmen, Datennetze),
    // which is Zweig I only; the de-by database cell is gone.
    const algorithmen = "de-by:realschule-9-informatik-algorithmen-strukturen";
    for (const track of [undefined, "I", "II"]) {
      const ids = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "informatik",
        ...(track ? { track } : {}),
      }).map((c) => c.id);
      expect(ids.sort(), `track ${track ?? "any"}`).toEqual(
        track === "II" ? [CELL_ID] : [algorithmen, CELL_ID],
      );
    }
    // IT 2.3.1 is compulsory in Wahlpflichtfächergruppen I and II only.
    expect(
      findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "informatik",
        track: "III",
      }).map((c) => c.id),
    ).not.toContain(CELL_ID);
    expect(getBundledCell(LEGACY_ID), `${LEGACY_ID} left the bundle`).toBeUndefined();
    expect(
      findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade: 9,
        subject: "informatik",
      }).map((c) => c.id),
    ).not.toContain(CELL_ID);
    const cell = getBundledCell(CELL_ID);
    expect(cell?.curriculumScopes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 9,
          subject: "informatik",
          track: "I",
        }),
        expect.objectContaining({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 9,
          subject: "informatik",
          track: "II",
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
      const lehrplan =
        atom.curricula?.filter(
          (binding) => binding.provider === "lehrplanplus-bayern",
        ) ?? [];
      if (EXTRA_LESSONS.includes(atom.slug)) {
        expect(lehrplan, `${atom.slug} is beyond the curriculum`).toHaveLength(0);
        continue;
      }
      expect(lehrplan.map((binding) => binding.track).sort(), atom.slug).toEqual([
        "I",
        "II",
      ]);
      for (const binding of lehrplan) {
        expect(binding.school_type).toBe("realschule");
        expect(binding.grade).toBe(9);
        expect(binding.subject).toBe("informatik");
        expect(["it-2.3.1", "it-2.3.2"]).toContain(binding.topic_code);
      }
    }
  });

  it("links every card to a lesson of its own stage, in German", () => {
    for (const atom of tile?.atoms ?? []) {
      const stage = atom.curricula?.[0]?.topic_code ?? "";
      const lessons = LESSONS[stage] ?? [];
      expect(atom.practice_items.length, atom.slug).toBeGreaterThanOrEqual(3);
      for (const item of [atom, ...atom.practice_items]) {
        const link = item.source_link ?? "";
        expect(link.startsWith(`${APP}#lesson=`), link).toBe(true);
        expect(lessons, `${item.id} cites ${link}`).toContain(
          link.slice(`${APP}#lesson=`.length),
        );
      }
      for (const item of atom.practice_items) {
        expect(item.language, item.id).toBe("de");
      }
    }
  });

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-sql-"));
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
     * ADR 2026-08-14 Decision 9: the `replaces` of the mapping in
     * zam-os/zam-academy (sql/replaces-de-by.json) move a learner's card and
     * review history from the eight de-by items to their academy successors
     * and retire the old tokens, so nobody learns the same fact twice.
     */
    it("moves the cards and history of a learner who held the de-by database cell", async () => {
      await installKvtTile(db, LEGACY_TILE);
      await materialiseKvtCards(
        db,
        "learner",
        LEGACY_TILE.atoms.map((atom) => atom.id),
      );
      const replaced = new Map<string, string>();
      for (const atom of tile?.atoms ?? []) {
        for (const item of atom.practice_items) {
          for (const old of item.replaces ?? []) replaced.set(old, item.id);
        }
      }
      const legacyItems = LEGACY_TILE.atoms.flatMap((atom) =>
        atom.practice_items.map((item) => item.id),
      );
      expect(legacyItems).toHaveLength(8);
      // Every de-by item has a successor: six existing cards and two new ones.
      expect([...replaced.keys()].sort()).toEqual([...legacyItems].sort());

      // Real history on the WHERE card of the de-by cell.
      const oldId = "01K4D9B0000000000000000J05";
      const newId = replaced.get(oldId)!;
      const card = await getCard(db, oldId, "learner");
      await db
        .prepare("UPDATE cards SET reps = 6, stability = 30 WHERE id = ?")
        .run(card!.id);
      await db
        .prepare(
          `INSERT INTO review_logs
             (id, card_id, token_id, user_id, rating, reviewed_at, scheduled_at)
           VALUES ('01K8ACADSQLEGACY0000000R01', ?, ?, 'learner', 3,
                   '2026-10-01T10:00:00.000Z', '2026-10-01T09:00:00.000Z')`,
        )
        .run(card!.id, oldId);

      const result = await enrolBundledCell(db, "learner", CELL_ID);
      expect(result.success).toBe(true);
      // The eight cards moved over count as held. On an atom where the
      // learner already holds a card, materialiseKvtCards introduces only one
      // more new card at a time; atoms without history get all their cards.
      let expectedNew = 0;
      for (const atom of tile?.atoms ?? []) {
        const moved = atom.practice_items.filter(
          (item) => (item.replaces ?? []).length > 0,
        ).length;
        const missing = atom.practice_items.length - moved;
        expectedNew += moved > 0 ? Math.min(1, missing) : missing;
      }
      expect(expectedNew).toBe(49);
      expect(result.cardsCreated).toBe(expectedNew);

      const moved = await getCard(db, newId, "learner");
      expect(moved?.id).toBe(card!.id);
      expect(moved?.reps).toBe(6);
      expect(moved?.stability).toBe(30);
      expect(await getCard(db, oldId, "learner")).toBeFalsy();
      const log = (await db
        .prepare("SELECT token_id FROM review_logs WHERE id = ?")
        .get("01K8ACADSQLEGACY0000000R01")) as { token_id: string };
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

      // Held now: the moved cards plus the new ones; the rest follows as the
      // learner progresses, like every other new atom content.
      const academyCards = (await db
        .prepare(
          `SELECT COUNT(*) AS n FROM cards
            WHERE user_id = 'learner' AND token_id LIKE '01K8ACADSQ%'`,
        )
        .get()) as { n: number };
      expect(academyCards.n).toBe(8 + expectedNew);
    });
  });
});
