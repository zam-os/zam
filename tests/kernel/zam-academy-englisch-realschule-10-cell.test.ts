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
import mapping from "../fixtures/legacy/zam-academy-englisch-realschule-10-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:englisch-realschule-10";
const LEGACY_ID =
  "de-by:realschule-10-englisch-abschlusspruefung-text-production-mediation";
const APP = "https://academy.zam-os.org/englisch-realschule-10/";
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
  subject: "englisch",
  ...(track ? { track } : {}),
});

describe("ZAM Academy Englisch 10 Realschule cell", () => {
  it("bundles the published 46 lessons and 92 practice items", () => {
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Englisch 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 46,
    });
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)?.publishedAt).toBe(tile.published_at);
    expect(
      createHash("sha256")
        .update(
          readFileSync(
            new URL(
              "../fixtures/curriculum/zam-academy-englisch-realschule-10-kvt.json",
              import.meta.url,
            ),
          ),
        )
        .digest("hex"),
    ).toBe("6a8d4eb0e0ff9ec15320b5c91e64aa7139d4c35c91a8e34f4f8138b10539c18f");
    expect(items).toHaveLength(92);
    expect(itemIds.size).toBe(92);
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(46);
    const stages = [
      "independence",
      "global",
      "science",
      "nz",
      "sa",
      "language",
      "literature",
      "projects",
    ];
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
    ).toEqual([6, 6, 6, 4, 4, 12, 4, 4]);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "englisch-realschule-10",
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
      { ...scope(), subject: "deutsch" },
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
      new Set(["lb1", "lb2", "lb3", "lb4", "lb5"]),
    );
    for (const binding of bindings) {
      expect(binding).toMatchObject({
        school_type: "realschule",
        grade: 10,
        subject: "englisch",
        exam_relevant: true,
      });
      expect(binding.track).toBeUndefined();
    }
  });

  it("uses the established English atlas areas for grammar, writing, culture and literature", () => {
    const { aliases } = weltwissenSeedRows();
    const expected = new Map([
      ["englisch/grammar", "sprache.englisch.grammar"],
      ["englisch/writing", "sprache.englisch.writing"],
      ["englisch/landeskunde", "sprache.englisch.landeskunde"],
      ["englisch/literatur", "sprache.englisch.literatur"],
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
    // Byte-exact proposal from zam-os/zam-academy@93c33184a5ecfb9c5eb4e91a66596c7fca6a0c32,
    // englisch-realschule-10/replaces-de-by.json. No transfer or retirement was approved.
    const proposal = readFileSync(
      new URL(
        "../fixtures/legacy/zam-academy-englisch-realschule-10-replaces-de-by.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(proposal).digest("hex")).toBe(
      "5f0f3bd3a685a2668efc174d848dadc41e8d445e4de85b650c8ff79d30d72477",
    );
    const bytes = readFileSync(
      new URL(
        "../fixtures/curriculum/de-by-realschule-10-englisch-abschlusspruefung-text-production-mediation-kvt.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      mapping.sources[0].sha256,
    );
    expect(mapping.source_repository).toBe("zam-os/zam");
    expect(mapping.source_commit).toBe(
      "cd1a71b5e8a91aa3eec601b5db06095844d024e3",
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
      "01K4EAM0000000000000000J01",
      "01K4EAM0000000000000000J02",
      "01K4EAM0000000000000000J03",
      "01K4EAM0000000000000000J04",
    ]);
    expect(tile.retired_items ?? []).toEqual([]);
    for (const id of oldIds) expect(itemIds.has(id)).toBe(false);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(`${APP}#lesson=${atom.slug}`);
      expect(atom.practice_items).toHaveLength(2);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("en");
        expect(item.replaces ?? []).toEqual([]);
      }
    }
  });

  describe("enrolment and existing Englisch 10 learning evidence", () => {
    let dir: string;
    let db: Database;
    const userId = "englisch-10-learner";

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-englisch-10-"));
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

    it("installs without cards and enrols 92 fresh cards as one topic", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(
        (await listLibraryTopics(db, userId)).find(
          (topic) => topic.key === APP,
        ),
      ).toMatchObject({ itemCount: 92, heldCount: 0 });
      expect(
        (await buildReviewQueue(db, { userId, tokenIds: [...itemIds] })).items,
      ).toEqual([]);

      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 92,
        cardsReused: 0,
      });
      const enrolled = await snapshot();
      expectFreshCards(enrolled.cards);
      expect(enrolled.reviews).toEqual([]);
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([expect.objectContaining({ itemCount: 92, heldCount: 92 })]);
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

    it("presents the enrolled English fast checks with their exact answers and lesson links", async () => {
      await enrolBundledCell(db, userId, CELL_ID);
      const queue = await buildReviewQueue(db, {
        userId,
        tokenIds: [...itemIds],
        maxNew: 100,
        maxReviews: 100,
        buryNewSiblings: false,
        buryReviewSiblings: false,
      });
      // New Tier-2 siblings wait for their atom's first Tier-1 review.
      expect(queue.items).toHaveLength(46);
      for (const entry of queue.items) {
        const source = items.find((item) => item.id === entry.tokenId)!;
        const text = kvtItemPlainTexts(source);
        expect(entry.question).toBe(text.question);
        expect(entry.concept).toBe(text.concept);
        expect(entry.sourceLink).toBe(source.source_link);
        expect(entry.tier).toBe("tier1_fast");
        expect(entry.fastCheck?.options).toHaveLength(2);
        const check = entry.fastCheck!;
        expect(check.options[check.correctIndex]).toBe(text.concept);
      }
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
        cardsCreated: 92,
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
