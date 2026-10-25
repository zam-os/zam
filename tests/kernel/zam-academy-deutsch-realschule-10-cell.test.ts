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

const CELL_ID = "zam-academy:deutsch-realschule-10";
const LEGACY_ID =
  "de-by:realschule-10-deutsch-dialektische-eroerterung-textanalyse-stilmittel";
const APP = "https://academy.zam-os.org/deutsch-realschule-10/";
const tile = getBundledCellTile(CELL_ID)!;
const legacy = getBundledCellTile(LEGACY_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const itemIds = new Set(items.map((item) => item.id));
const oldIds = legacy.atoms.flatMap((atom) =>
  atom.practice_items.map((item) => item.id),
);
const scope = (grade = 10, track?: string) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "deutsch",
  ...(track ? { track } : {}),
});

describe("ZAM Academy Deutsch 10 Realschule cell", () => {
  it("bundles the published 30 lessons and 60 practice items", () => {
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Deutsch 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 30,
    });
    expect(tile.version).toBe("2026.10.1");
    expect(items).toHaveLength(60);
    expect(itemIds.size).toBe(60);
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(30);
    const stages = ["sprechen", "lesen", "schreiben", "sprache"];
    expect(
      stages.map(
        (stage) =>
          tile.atoms.filter((atom) =>
            atom.curricula?.some(
              (binding) =>
                binding.provider === "zam-academy" &&
                binding.topic_code === stage,
            ),
          ).length,
      ),
    ).toEqual([5, 10, 10, 5]);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "deutsch-realschule-10",
      }).map((cell) => cell.id),
    ).toContain(CELL_ID);
  });

  it("offers the common grade-10 curriculum to every Realschule group", () => {
    for (const track of [
      undefined,
      "I",
      "II",
      "IIIa",
      "IIIb",
      "wpfg1",
      "wpfg2-3",
    ]) {
      expect(
        findBundledCellsForScope(scope(10, track)).map((cell) => cell.id),
      ).toEqual(expect.arrayContaining([CELL_ID, LEGACY_ID]));
      expect(needsGenericCurriculumImport(scope(10, track))).toBe(false);
    }
    for (const position of [
      scope(9),
      { ...scope(), schoolType: "gymnasium" },
      { ...scope(), subject: "englisch" },
    ])
      expect(
        findBundledCellsForScope(position).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    const bindings = tile.atoms.flatMap((atom) =>
      (atom.curricula ?? []).filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      ),
    );
    expect(new Set(bindings.map((binding) => binding.topic_code))).toEqual(
      new Set(["lb1", "lb2", "lb3", "lb4"]),
    );
    for (const binding of bindings) {
      expect(binding).toMatchObject({
        school_type: "realschule",
        grade: 10,
        subject: "deutsch",
      });
      expect(binding.track).toBeUndefined();
    }
  });

  it("keeps lesson links and introduces no implicit legacy mapping", () => {
    expect(oldIds).toEqual([
      "01K4DAE0000000000000000J01",
      "01K4DAE0000000000000000J02",
      "01K4DAE0000000000000000J03",
      "01K4DAE0000000000000000J04",
    ]);
    expect(tile.retired_items ?? []).toEqual([]);
    for (const id of oldIds) expect(itemIds.has(id)).toBe(false);
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

  describe("enrolment and existing Deutsch 10 learning evidence", () => {
    let dir: string;
    let db: Database;
    const userId = "deutsch-10-learner";

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-deutsch-10-"));
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

    it("installs without cards and enrols 60 fresh cards as one topic", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 60,
        cardsReused: 0,
      });
      const enrolled = await snapshot();
      expectFreshCards(enrolled.cards);
      expect(enrolled.reviews).toEqual([]);
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([expect.objectContaining({ itemCount: 60, heldCount: 60 })]);
      for (const item of items)
        expect((await getTokenById(db, item.id))?.source_link).toBe(
          item.source_link,
        );
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(enrolled);
    });

    it("preserves all four old card states and eight reviews when adding the cell", async () => {
      await installKvtTile(db, legacy);
      for (const [index, tokenId] of oldIds.entries()) {
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
      const oldTokens = await Promise.all(
        oldIds.map((id) => getTokenById(db, id)),
      );
      expect(before.cards).toHaveLength(4);
      expect(before.reviews).toHaveLength(8);
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual(before);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 60,
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
      expect(
        await Promise.all(oldIds.map((id) => getTokenById(db, id))),
      ).toEqual(oldTokens);
      await installKvtTile(db, tile);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });
  });
});
