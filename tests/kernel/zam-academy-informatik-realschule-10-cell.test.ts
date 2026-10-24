import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  getTokenById,
  installKvtTile,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

const CELL_ID = "zam-academy:informatik-realschule-10";
const APP = "https://academy.zam-os.org/informatik-realschule-10/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const itemIds = new Set(items.map((item) => item.id));
const MODULES = [
  ["it-2.5.2", "Datennetze II", 8],
  ["it-2.6.2", "Objektorientierte Softwareentwicklung", 7],
  ["it-2.7.1", "Logische Schaltungen", 7],
  ["it-2.7.2", "Robotik und eingebettete Systeme", 6],
  ["it-2.7.3", "Künstliche Intelligenz", 8],
] as const;
const scope = (grade: number, track?: string, subject = "it") => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject,
  ...(track ? { track } : {}),
});

describe("ZAM Academy Informatik 10 Realschule cell", () => {
  it("bundles the published 36 lessons and 72 cards as an Academy cell", () => {
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Informatik 10 Realschule · IT-Vertiefungen (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 36,
    });
    expect(tile.version).toBe("2026.10.1");
    expect(items).toHaveLength(72);
    expect(itemIds.size).toBe(72);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "informatik-realschule-10",
      }).map((cell) => cell.id),
    ).toContain(CELL_ID);
  });

  it("offers the five elective modules without claiming a complete grade or branch", () => {
    for (const [code, title, lessons] of MODULES) {
      const atoms = tile.atoms.filter((atom) =>
        atom.curricula?.some((binding) => binding.topic_code === code),
      );
      expect(atoms, code).toHaveLength(lessons);
      for (const atom of atoms) {
        expect(atom.curricula).toEqual([
          {
            provider: "zam-academy",
            subject: "informatik-realschule-10",
            topic_code: code,
            topic_title: title,
          },
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            subject: "it",
            topic_code: code,
            topic_title: title,
          },
        ]);
      }
    }
    for (const grade of [5, 6, 7, 8, 9, 10])
      for (const track of [
        undefined,
        "wpfg1",
        "I",
        "wpfg2-3",
        "II",
        "IIIa",
        "IIIb",
      ])
        for (const subject of ["it", "informatik"])
          expect(
            findBundledCellsForScope(scope(grade, track, subject)).map(
              (cell) => cell.id,
            ),
          ).toContain(CELL_ID);
    for (const position of [
      { ...scope(10), schoolType: "gymnasium" },
      { ...scope(10), subject: "physik" },
    ])
      expect(
        findBundledCellsForScope(position).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    // IT's module sequence is chosen by the school. These modules do not
    // replace the generic importer at a position with no grade-specific cell.
    for (const grade of [5, 10])
      expect(needsGenericCurriculumImport(scope(grade))).toBe(true);
  });

  it("keeps every card linked to its lesson and declares no mastery transfer", () => {
    expect(tile.retired_items ?? []).toEqual([]);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(`${APP}#lesson=${atom.slug}`);
      expect(atom.practice_items).toHaveLength(2);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
        expect(item.replaces ?? []).toEqual([]);
      }
    }
  });

  describe("enrolment and existing IT review history", () => {
    let dir: string;
    let db: Database;
    const userId = "informatik-10-learner";

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-informatik-10-"));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
    });
    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    });

    async function snapshot() {
      return {
        cards: (await db
          .prepare("SELECT * FROM cards ORDER BY id")
          .all()) as Array<Record<string, unknown>>,
        reviews: (await db
          .prepare("SELECT * FROM review_logs ORDER BY id")
          .all()) as Array<Record<string, unknown>>,
      };
    }
    function expectFreshCards(cards: Array<Record<string, unknown>>) {
      expect(cards.map((card) => card.token_id).sort()).toEqual(
        [...itemIds].sort(),
      );
      for (const card of cards)
        expect(card).toMatchObject({
          state: "new",
          stability: 0,
          reps: 0,
          last_review_at: null,
        });
    }

    it("installs without cards and enrols 72 fresh cards as one library topic", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 72,
        cardsReused: 0,
      });
      const before = await snapshot();
      expectFreshCards(before.cards);
      expect(before.reviews).toEqual([]);
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([expect.objectContaining({ itemCount: 72, heldCount: 72 })]);
      for (const item of items)
        expect((await getTokenById(db, item.id))?.source_link).toBe(
          item.source_link,
        );
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("preserves the whole card state and review history of all four existing IT packages", async () => {
      const existing = ["algorithmen", "datennetze", "sql", "uml"];
      for (const [index, app] of existing.entries()) {
        const old = getBundledCellTile(`zam-academy:${app}`)!;
        await installKvtTile(db, old);
        const tokenId = old.atoms[0].practice_items[0].id;
        expect(itemIds.has(tokenId)).toBe(false);
        const card = await ensureCard(db, tokenId, userId);
        for (const [day, rating] of ([1, 3] as const).entries())
          await evaluateRating(db, {
            cardId: card.id,
            tokenId,
            userId,
            rating,
            answerFormat: "recall",
            responseTimeMs: 1500 + index * 100,
            now: new Date(Date.UTC(2026, 9, 22 + day, 10)),
          });
      }
      const before = await snapshot();
      expect(before.cards).toHaveLength(4);
      expect(before.reviews).toHaveLength(8);
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual(before);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 72,
        cardsReused: 0,
      });
      const after = await snapshot();
      expect(
        after.cards.filter((card) => !itemIds.has(String(card.token_id))),
      ).toEqual(before.cards);
      expect(after.reviews).toEqual(before.reviews);
      expectFreshCards(
        after.cards.filter((card) => itemIds.has(String(card.token_id))),
      );
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });
  });
});
