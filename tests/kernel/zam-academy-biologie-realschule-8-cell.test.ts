import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deriveSchule,
  loadBindings,
  loadUnits,
  weltwissenSeedRows,
} from "../../src/kernel/atlas/index.js";
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
import mapping from "../fixtures/legacy/zam-academy-biologie-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:biologie-realschule-8";
const APP = "https://academy.zam-os.org/biologie-realschule-8/";
const tile = getBundledCellTile(CELL_ID)!;
const legacyTiles = mapping.sources.map(
  (source) => getBundledCellTile(source.tile_id)!,
);
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const itemIds = new Set(items.map((item) => item.id));
const oldItems = legacyTiles.flatMap((old) =>
  old.atoms.flatMap((atom) => atom.practice_items),
);
const STAGES = ["methoden", "mikroben", "abwehr", "entwicklung", "evolution"];
const COUNTS = [4, 6, 8, 5, 7];
const scope = (grade = 8, track?: string) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "biologie",
  ...(track ? { track } : {}),
});

describe("ZAM Academy Biologie 8 Realschule cell", () => {
  it("bundles the published 30 lessons and 60 practice items", () => {
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Biologie 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 30,
    });
    expect(tile.version).toBe("2026.10.1");
    expect(tile.published_at).toBe("2026-10-26T14:50:41Z");
    expect(getBundledCell(CELL_ID)?.publishedAt).toBe(tile.published_at);
    expect(items).toHaveLength(60);
    expect(itemIds.size).toBe(60);
    expect(new Set(tile.atoms.map((atom) => atom.id)).size).toBe(30);
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(30);
    expect(
      STAGES.map(
        (stage) =>
          tile.atoms.filter((atom) => atom.domain === `biologie/${stage}`)
            .length,
      ),
    ).toEqual(COUNTS);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "biologie-realschule-8",
      }).map((cell) => cell.id),
    ).toContain(CELL_ID);
  });

  it("offers grade 8 to every group alongside the two unchanged school cells", () => {
    for (const track of [
      undefined,
      "I",
      "II",
      "II_III",
      "IIIa",
      "IIIb",
      "wpfg1",
      "wpfg2",
      "wpfg2-3",
      "wpfg3a",
      "wpfg3b",
    ]) {
      expect(
        findBundledCellsForScope(scope(8, track))
          .map((cell) => cell.id)
          .sort(),
      ).toEqual([CELL_ID, ...legacyTiles.map((old) => old.tile_id)].sort());
      expect(needsGenericCurriculumImport(scope(8, track))).toBe(false);
    }
    for (const position of [
      scope(7),
      scope(9),
      scope(10),
      { ...scope(), schoolType: "gymnasium" },
      { ...scope(), subject: "chemie" },
    ])
      expect(
        findBundledCellsForScope(position).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    for (const [index, stage] of STAGES.entries()) {
      for (const atom of tile.atoms.filter(
        (atom) => atom.domain === `biologie/${stage}`,
      )) {
        const official = atom.curricula?.filter(
          (binding) => binding.provider === "lehrplanplus-bayern",
        );
        expect(official).toHaveLength(1);
        expect(official![0]).toMatchObject({
          school_type: "realschule",
          grade: 8,
          subject: "biologie",
          topic_code: `lb${index + 1}`,
        });
        expect(official![0].track).toBeUndefined();
      }
    }
  });

  it("pins the unapproved proposal and both byte-exact legacy sources", () => {
    // Byte-exact upstream record: zam-os/zam-academy@300fd9443a7962703b69d0c8f9193fad2cea77b3,
    // biologie-realschule-8/replaces-de-by.json. No history transfer was approved.
    const bytes = readFileSync(
      new URL(
        "../fixtures/legacy/zam-academy-biologie-realschule-8-replaces-de-by.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      "3c023efb37dcb313cda76606148c07405779743f7d105009bd0bb93253dd935f",
    );
    expect(mapping.status).toBe("proposal-only");
    expect(mapping.approved).toBeNull();
    expect(mapping.source_repository).toBe("zam-os/zam");
    expect(mapping.source_commit).toBe(
      "0370098ff1fb50ba130984c4b16612bd509d680e",
    );
    expect(
      ["A", "B", "C"].map(
        (category) =>
          mapping.rows.filter((row) => row.category === category).length,
      ),
    ).toEqual([1, 0, 15]);
    expect(oldItems).toHaveLength(16);
    expect(mapping.rows.map((row) => row.de_by_id).sort()).toEqual(
      oldItems.map((item) => item.id).sort(),
    );
    for (const source of mapping.sources) {
      const file = source.file.replace(/^tests\/fixtures\//, "");
      const legacyBytes = readFileSync(
        new URL(`../fixtures/curriculum/${file}`, import.meta.url),
      );
      expect(createHash("sha256").update(legacyBytes).digest("hex")).toBe(
        source.sha256,
      );
      expect(getBundledCell(source.tile_id)).toBeDefined();
    }
    for (const row of mapping.rows) {
      const old = oldItems.find((item) => item.id === row.de_by_id)!;
      expect(kvtItemPlainTexts(old).question).toBe(row.de_by_question);
      if (row.category === "A")
        expect(items.some((item) => item.slug === row.academy_slug)).toBe(true);
      else expect(row.academy_slug).toBeNull();
    }
  });

  it("links every card to its lesson without replacing or retiring existing items", () => {
    expect(tile.retired_items ?? []).toEqual([]);
    for (const item of oldItems) expect(itemIds.has(item.id)).toBe(false);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(`${APP}#lesson=${atom.slug}`);
      expect(atom.practice_items).toHaveLength(2);
      expect(atom.practice_items.map((item) => item.tier)).toEqual([
        "tier1_fast",
        "tier2_synthesis",
      ]);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
        expect(item.replaces ?? []).toEqual([]);
      }
    }
    const { aliases } = weltwissenSeedRows();
    const regions = [
      "forschen",
      "mikroorganismen",
      "mensch",
      "mensch",
      "evolution",
    ];
    for (const [index, stage] of STAGES.entries())
      expect(
        aliases.find((alias) => alias.domainPrefix === `biologie/${stage}`)
          ?.regionKey,
      ).toBe(`natur.biologie.${regions[index]}`);
  });

  describe("enrolment, atlas placement and existing review evidence", () => {
    let dir: string;
    let db: Database;
    const userId = ulid();
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-biologie-8-"));
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

    it("projects the actual atoms into their five school learning areas without creating cards", async () => {
      await installKvtTile(db, tile);
      const bindings = (await loadBindings(db)).filter(
        (binding) =>
          binding.provider === "lehrplanplus-bayern" &&
          binding.subject === "biologie",
      );
      expect(bindings).toHaveLength(30);
      expect(
        [1, 2, 3, 4, 5].map(
          (lb) =>
            bindings.filter((binding) => binding.topicCode === `lb${lb}`)
              .length,
        ),
      ).toEqual(COUNTS);
      const units = await loadUnits(db, { tokenIds: [...itemIds] });
      expect(units).toHaveLength(30);
      const placements = deriveSchule(
        units,
        { regions: [], aliases: [], members: [] },
        bindings,
      );
      for (const atom of tile.atoms) {
        const official = bindings.find(
          (binding) => binding.atomId === atom.id,
        )!;
        const unit = units.find((candidate) => candidate.atomId === atom.id)!;
        const placement = placements.find(
          (candidate) => candidate.unitKey === unit.key,
        )!;
        expect(placement.path[1]).toMatchObject({
          key: "realschule-8.biologie",
          name: "Biologie",
        });
        expect(placement.path[2].name).toBe(official.topicTitle);
        for (const item of atom.practice_items)
          expect(await getTokenById(db, item.id)).toMatchObject({
            provider: "lehrplanplus-bayern",
            topic_id: official.topicCode,
          });
      }
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
    });

    it("installs without cards and enrols 60 fresh cards as one topic, idempotently", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(
        (await listLibraryTopics(db, userId)).find(
          (topic) => topic.key === APP,
        ),
      ).toMatchObject({ itemCount: 60, heldCount: 0 });
      expect(
        (await buildReviewQueue(db, { userId, tokenIds: [...itemIds] })).items,
      ).toEqual([]);
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
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(enrolled);
    });

    it("presents 30 initial fast checks with their published answers and lesson links", async () => {
      await enrolBundledCell(db, userId, CELL_ID);
      const queue = await buildReviewQueue(db, {
        userId,
        tokenIds: [...itemIds],
        maxNew: 100,
        maxReviews: 100,
        buryNewSiblings: false,
        buryReviewSiblings: false,
      });
      // Tier-2 siblings wait for their atom's initial Tier-1 review.
      expect(queue.items).toHaveLength(30);
      for (const entry of queue.items) {
        const source = items.find((item) => item.id === entry.tokenId)!;
        const text = kvtItemPlainTexts(source);
        expect(entry.question).toBe(text.question);
        expect(entry.concept).toBe(text.concept);
        expect(entry.sourceLink).toBe(source.source_link);
        expect(entry.tier).toBe("tier1_fast");
        const check = entry.fastCheck!;
        expect(check.options).toHaveLength(2);
        expect(check.options[check.correctIndex]).toBe(text.concept);
      }
    });

    it("preserves all 16 legacy cards and 32 reviews when adding the 60 new cards", async () => {
      for (const old of legacyTiles) await installKvtTile(db, old);
      for (const [index, item] of oldItems.entries()) {
        const card = await ensureCard(db, item.id, userId);
        for (const [day, rating] of ([1, 3] as const).entries())
          await evaluateRating(db, {
            cardId: card.id,
            tokenId: item.id,
            userId,
            rating,
            answerFormat: "recall",
            responseTimeMs: 1500 + index * 100,
            now: new Date(Date.UTC(2026, 9, 23 + day, 10)),
          });
      }
      const before = await snapshot();
      const oldTokens = await Promise.all(
        oldItems.map((item) => getTokenById(db, item.id)),
      );
      expect(before.cards).toHaveLength(16);
      expect(before.reviews).toHaveLength(32);
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
        await Promise.all(oldItems.map((item) => getTokenById(db, item.id))),
      ).toEqual(oldTokens);
      for (const item of oldItems)
        expect((await getTokenById(db, item.id))?.deprecated_at).toBeNull();
      await installKvtTile(db, tile);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });
  });
});
