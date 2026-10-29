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
  reconcileInstalledBundledTiles,
} from "../../src/kernel/index.js";
import mapping from "../fixtures/legacy/zam-academy-geschichte-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:geschichte-realschule-8";
const LEGACY_ID =
  "de-by:realschule-8-geschichte-aufklaerung-revolution-kaiserreich";
const APP = "https://academy.zam-os.org/geschichte-realschule-8/";
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
  subject: "geschichte",
  ...(track ? { track } : {}),
});

describe("ZAM Academy Geschichte 8 Realschule cell", () => {
  it("bundles the published 35 core lessons and three optional English lessons with 76 items", () => {
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Geschichte 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 38,
    });
    expect(tile.version).toBe("2026.10.1");
    expect(items).toHaveLength(76);
    expect(itemIds.size).toBe(76);
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(38);
    const stages = Array.from({ length: 9 }, (_, i) => `lb${i + 1}`);
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
    ).toEqual([4, 7, 4, 4, 5, 5, 3, 3, 3]);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "geschichte-realschule-8",
      }).map((cell) => cell.id),
    ).toContain(CELL_ID);
  });

  it("offers the common grade-8 curriculum to every Realschule group", () => {
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
        findBundledCellsForScope(scope(8, track)).map((cell) => cell.id),
      ).toEqual(expect.arrayContaining([CELL_ID, LEGACY_ID]));
      expect(needsGenericCurriculumImport(scope(8, track))).toBe(false);
    }
    for (const position of [
      scope(7),
      scope(9),
      scope(10),
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
      new Set(Array.from({ length: 9 }, (_, i) => `lb${i + 1}`)),
    );
    for (const binding of bindings) {
      expect(binding).toMatchObject({
        school_type: "realschule",
        grade: 8,
        subject: "geschichte",
      });
      expect(binding.track).toBeUndefined();
      expect(binding.exam_relevant).toBe(binding.topic_code !== "lb9");
    }
  });

  it("keeps all lessons in the established History atlas without new regions", () => {
    const { aliases } = weltwissenSeedRows();
    for (const atom of tile.atoms) {
      const match = aliases
        .filter(
          (alias) =>
            atom.domain === alias.domainPrefix ||
            atom.domain.startsWith(`${alias.domainPrefix}/`),
        )
        .sort((a, b) => b.domainPrefix.length - a.domainPrefix.length)[0];
      expect(match?.regionKey, atom.slug).toBe("gesellschaft.geschichte");
    }
  });

  it("pins the proposal-only decision record and byte-exact legacy source", () => {
    // Byte-exact proposal from zam-os/zam-academy@d0fa9efcb048ced323444f534298c73122fb7d3f,
    // geschichte-realschule-8/replaces-de-by.json. No transfer or retirement was approved.
    const proposal = readFileSync(
      new URL(
        "../fixtures/legacy/zam-academy-geschichte-realschule-8-replaces-de-by.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(proposal).digest("hex")).toBe(
      "52b0cd4674654ce2edbbf02d1562c4053a73076096449eff7fa631a28fc08bb9",
    );
    const bytes = readFileSync(
      new URL(
        "../fixtures/curriculum/de-by-realschule-8-geschichte-aufklaerung-revolution-kaiserreich-kvt.json",
        import.meta.url,
      ),
    );
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      mapping.sources[0].sha256,
    );
    expect(mapping.source_repository).toBe("zam-os/zam");
    expect(mapping.source_commit).toBe(
      "e6a235f75fe87b9d57af38bd61011027b891492c",
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
      "01K4G8R0000000000000000J01",
      "01K4G8R0000000000000000J02",
      "01K4G8R0000000000000000J03",
      "01K4G8R0000000000000000J04",
      "01K4G8R0000000000000000J05",
      "01K4G8R0000000000000000J06",
      "01K4G8R0000000000000000J07",
      "01K4G8R0000000000000000J08",
    ]);
    expect(tile.retired_items ?? []).toEqual([]);
    for (const id of oldIds) expect(itemIds.has(id)).toBe(false);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(`${APP}#lesson=${atom.slug}`);
      expect(atom.practice_items).toHaveLength(2);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe(
          atom.slug.startsWith("g8-en-") ? "en" : "de",
        );
        expect(item.replaces ?? []).toEqual([]);
      }
    }
  });

  describe("enrolment and existing Geschichte 8 learning evidence", () => {
    let dir: string;
    let db: Database;
    const userId = ulid();

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-geschichte-8-"));
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

    it("installs without cards and enrols 76 fresh cards as one topic", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(
        (await listLibraryTopics(db, userId)).find(
          (topic) => topic.key === APP,
        ),
      ).toMatchObject({ itemCount: 76, heldCount: 0 });
      expect(
        (await buildReviewQueue(db, { userId, tokenIds: [...itemIds] })).items,
      ).toEqual([]);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 76,
        cardsReused: 0,
      });
      const enrolled = await snapshot();
      expectFreshCards(enrolled.cards);
      expect(enrolled.reviews).toEqual([]);
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([expect.objectContaining({ itemCount: 76, heldCount: 76 })]);
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

    it("projects all 38 installed atoms into their nine school learning areas", async () => {
      await installKvtTile(db, tile);
      const bindings = (await loadBindings(db)).filter(
        (binding) =>
          binding.provider === "lehrplanplus-bayern" &&
          binding.subject === "geschichte",
      );
      expect(bindings).toHaveLength(38);
      expect(
        Array.from(
          { length: 9 },
          (_, i) =>
            bindings.filter((binding) => binding.topicCode === `lb${i + 1}`)
              .length,
        ),
      ).toEqual([4, 7, 4, 4, 5, 5, 3, 3, 3]);
      const units = await loadUnits(db, { tokenIds: [...itemIds] });
      expect(units).toHaveLength(38);
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
          key: "realschule-8.geschichte",
          name: "Geschichte",
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

    it("preserves all eight old card states and sixteen reviews when adding the cell", async () => {
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
      expect(before.cards).toHaveLength(8);
      expect(before.reviews).toHaveLength(16);
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual(before);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 76,
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
    it("preserves reviewed Academy and legacy cards together during reinstall and reconciliation", async () => {
      await enrolBundledCell(db, userId, LEGACY_ID);
      await enrolBundledCell(db, userId, CELL_ID);
      for (const tokenId of [oldIds[0], items[0].id]) {
        const card = await ensureCard(db, tokenId, userId);
        await evaluateRating(db, {
          cardId: card.id,
          tokenId,
          userId,
          rating: 3,
          answerFormat: "recall",
          responseTimeMs: 2000,
          now: new Date("2026-10-29T12:00:00Z"),
        });
      }
      const before = await snapshot();
      expect(before.cards).toHaveLength(84);
      expect(before.reviews).toHaveLength(2);
      await installKvtTile(db, tile);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await reconcileInstalledBundledTiles(db)).toMatchObject({
        reinstalled: [],
        failed: [],
      });
      expect(await snapshot()).toEqual(before);
      for (const id of oldIds)
        expect((await getTokenById(db, id))?.editorial_state).toBe("published");
    });
  });
});
