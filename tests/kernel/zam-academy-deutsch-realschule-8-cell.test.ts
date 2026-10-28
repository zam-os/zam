import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { weltwissenSeedRows } from "../../src/kernel/atlas/index.js";
import {
  buildReviewQueue,
  type Database,
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  getTokenById,
  installKvtTile,
  kvtItemPlainTexts,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";
import mapping from "../fixtures/legacy/zam-academy-deutsch-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:deutsch-realschule-8";
const LEGACY_ID =
  "de-by:realschule-8-deutsch-begruendete-stellungnahme-eroerterung";
const APP = "https://academy.zam-os.org/deutsch-realschule-8/";
const tile = getBundledCellTile(CELL_ID)!;
const legacy = getBundledCellTile(LEGACY_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const itemIds = new Set(items.map((item) => item.id));
const oldIds = legacy.atoms.flatMap((atom) =>
  atom.practice_items.map((item) => item.id),
);
const scope = (grade = 8, track?: string) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "deutsch",
  ...(track ? { track } : {}),
});

describe("ZAM Academy Deutsch 8 Realschule cell", () => {
  it("bundles the published 40 lessons and 80 practice items", () => {
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Deutsch 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 40,
    });
    expect(tile.version).toBe("2026.10.1");
    expect(items).toHaveLength(80);
    expect(itemIds.size).toBe(80);
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(40);
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
    ).toEqual([6, 12, 13, 9]);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "deutsch-realschule-8",
      }).map((cell) => cell.id),
    ).toContain(CELL_ID);
  });

  it("offers the common grade-8 curriculum to every Realschule group", () => {
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
        findBundledCellsForScope(scope(8, track)).map((cell) => cell.id),
      ).toEqual(expect.arrayContaining([CELL_ID, LEGACY_ID]));
      expect(needsGenericCurriculumImport(scope(8, track))).toBe(false);
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
        grade: 8,
        subject: "deutsch",
      });
      expect(binding.track).toBeUndefined();
    }
  });

  it("keeps all lessons in the established German atlas without new regions", () => {
    const { aliases } = weltwissenSeedRows();
    const expected = new Map([
      ["deutsch/sprechen", "sprache.deutsch"],
      ["deutsch/lesen", "sprache.deutsch"],
      ["deutsch/schreiben", "sprache.deutsch.schreiben"],
      ["deutsch/sprache", "sprache.deutsch"],
    ]);
    for (const atom of tile.atoms) {
      expect(expected.has(atom.domain), atom.slug).toBe(true);
      const match = aliases
        .filter(
          (alias) =>
            atom.domain === alias.domainPrefix ||
            atom.domain.startsWith(`${alias.domainPrefix}/`),
        )
        .sort((a, b) => b.domainPrefix.length - a.domainPrefix.length)[0];
      expect(match?.regionKey, atom.slug).toBe(expected.get(atom.domain));
    }
  });

  it("pins the proposal-only decision record and byte-exact legacy source", () => {
    // Byte-exact proposal from zam-os/zam-academy@f0adfb72836f9a52bdad4b42dd1194c9f1e44d33,
    // deutsch-realschule-8/replaces-de-by.json. No transfer or retirement was approved.
    const proposal = readFileSync(
      new URL(
        "../fixtures/legacy/zam-academy-deutsch-realschule-8-replaces-de-by.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(proposal).digest("hex")).toBe(
      "52f2358d0386051a5d12fbf3679d7723874dae6d3041d44749732298ecba8713",
    );
    const bytes = readFileSync(
      new URL(
        "../fixtures/curriculum/de-by-realschule-8-deutsch-begruendete-stellungnahme-eroerterung-kvt.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      mapping.sources[0].sha256,
    );
    expect(mapping.source_repository).toBe("zam-os/zam");
    expect(mapping.source_commit).toBe(
      "b6fdcfecb6160b02e14e8914455c9a0414f8c81a",
    );
    expect(mapping.sources[0]).toMatchObject({
      tile_id: legacy.tile_id,
      version: legacy.version,
    });
    expect(mapping.approved).toBeNull();
    expect(mapping.status).toBe("proposal-only");
    expect(mapping.rows.map((row) => row.de_by_id).sort()).toEqual(
      [...oldIds].sort(),
    );
    for (const row of mapping.rows) {
      expect(row).toMatchObject({
        category: "C",
        action: "keep-active",
        academy_slug: null,
        de_by_cell: legacy.tile_id,
      });
      const oldItem = legacy.atoms
        .flatMap((atom) => atom.practice_items)
        .find((item) => item.id === row.de_by_id)!;
      expect(kvtItemPlainTexts(oldItem).question).toBe(row.de_by_question);
    }
  });

  it("keeps lesson links and introduces no implicit legacy mapping", () => {
    expect(oldIds).toEqual([
      "01K4D8E0000000000000000J01",
      "01K4D8E0000000000000000J02",
      "01K4D8E0000000000000000J03",
      "01K4D8E0000000000000000J04",
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

  describe("enrolment and existing Deutsch 8 learning evidence", () => {
    let dir: string;
    let db: Database;
    const userId = "deutsch-8-learner";

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-deutsch-8-"));
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

    it("installs without cards and enrols 80 fresh cards as one topic", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 80,
        cardsReused: 0,
      });
      const enrolled = await snapshot();
      expectFreshCards(enrolled.cards);
      expect(enrolled.reviews).toEqual([]);
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([expect.objectContaining({ itemCount: 80, heldCount: 80 })]);
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

    it("keeps synthesis siblings out of the first queue until their fast check has a review", async () => {
      await enrolBundledCell(db, userId, CELL_ID);
      const [fast, synthesis] = tile.atoms[0].practice_items;
      const now = new Date();
      const queue = () =>
        buildReviewQueue(db, {
          userId,
          tokenIds: [fast.id, synthesis.id],
          now,
          buryNewSiblings: false,
          buryReviewSiblings: false,
        });
      const initial = await queue();
      expect(initial.items.map((item) => item.tokenId)).toContain(fast.id);
      expect(initial.items.map((item) => item.tokenId)).not.toContain(
        synthesis.id,
      );
      const card = await ensureCard(db, fast.id, userId);
      await evaluateRating(db, {
        cardId: card.id,
        tokenId: fast.id,
        userId,
        rating: 3,
        answerFormat: "recall",
        responseTimeMs: 2000,
        now,
      });
      expect((await queue()).items.map((item) => item.tokenId)).toContain(
        synthesis.id,
      );
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
        cardsCreated: 80,
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
