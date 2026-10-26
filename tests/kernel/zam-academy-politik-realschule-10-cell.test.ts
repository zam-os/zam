import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deriveSchule,
  hueFor,
  loadBindings,
  loadUnits,
  SUBJECT_HUES,
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
  hasPendingCurriculumRetirements,
  installKvtTile,
  type KvtTile,
  kvtItemPlainTexts,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
  reconcileInstalledBundledTiles,
} from "../../src/kernel/index.js";

const CELL_ID = "zam-academy:politik-realschule-10";
const APP = "https://academy.zam-os.org/politik-realschule-10/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const itemIds = new Set(items.map((item) => item.id));
const legacyBytes = readFileSync(
  new URL(
    "../fixtures/legacy/zam-academy-politik-realschule-10-2026.10.1.json",
    import.meta.url,
  ),
);
const legacy = JSON.parse(legacyBytes.toString("utf8")) as KvtTile;
const AREAS = {
  methoden: "lb1",
  mitwirkung: "lb2",
  strukturen: "lb3",
  handlungsfelder: "lb4",
};
const scope = (grade = 10, track?: string) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "pug",
  ...(track ? { track } : {}),
});

describe("ZAM Academy Politik und Gesellschaft 10 Realschule cell", () => {
  it("bundles the published 32 lessons and 64 practice items unchanged", () => {
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Politik und Gesellschaft 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 32,
    });
    expect(tile.version).toBe("2026.10.2");
    expect(tile.published_at).toBe("2026-10-26T05:46:58Z");
    expect(getBundledCell(CELL_ID)?.publishedAt).toBe(tile.published_at);
    expect(tile.description).not.toContain("Entwurf");
    expect(
      createHash("sha256")
        .update(
          readFileSync(
            new URL(
              "../fixtures/curriculum/zam-academy-politik-realschule-10-kvt.json",
              import.meta.url,
            ),
          ),
        )
        .digest("hex"),
    ).toBe("a2046b91a2a860b04c624ae369b450869d01c540a26bc233a9f3407dd389d5ec");
    expect(items).toHaveLength(64);
    expect(itemIds.size).toBe(64);
    expect(new Set(tile.atoms.map((atom) => atom.id)).size).toBe(32);
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(32);
    expect(
      ["methoden", "mitwirkung", "strukturen", "handlungsfelder"].map(
        (stage) =>
          tile.atoms.filter((atom) =>
            atom.curricula?.some(
              (binding) =>
                binding.provider === "zam-academy" &&
                binding.topic_code === stage,
            ),
          ).length,
      ),
    ).toEqual([6, 8, 10, 8]);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "politik-realschule-10",
      }).map((cell) => cell.id),
    ).toContain(CELL_ID);
  });

  it("pins the published .1 source and keeps every identity, retrieval and lesson link", () => {
    expect(createHash("sha256").update(legacyBytes).digest("hex")).toBe(
      "ebd1872fde552c2a8ab59c12e4dbf9ff1aa877a30a747c417dfda61819e18690",
    );
    expect(legacy.version).toBe("2026.10.1");
    expect(
      tile.atoms.map((atom) => [atom.id, atom.slug, atom.atom_uri]),
    ).toEqual(legacy.atoms.map((atom) => [atom.id, atom.slug, atom.atom_uri]));
    for (const [index, atom] of tile.atoms.entries()) {
      const old = legacy.atoms[index];
      for (const [itemIndex, item] of atom.practice_items.entries()) {
        const before = old.practice_items[itemIndex];
        for (const field of [
          "id",
          "slug",
          "question",
          "concept",
          "sample_solution",
          "source_link",
          "fast_check",
        ] as const)
          expect(item[field], `${atom.slug}/${field}`).toEqual(before[field]);
        if (item.bloom_level !== before.bloom_level)
          expect(item.materiality).toBe("cosmetic");
      }
    }
  });

  it("offers all four common learning areas to every Realschule group in grade 10", () => {
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
        findBundledCellsForScope(scope(10, track)).map((cell) => cell.id),
      ).toEqual([CELL_ID]);
      expect(needsGenericCurriculumImport(scope(10, track))).toBe(false);
    }
    for (const position of [
      scope(8),
      scope(9),
      { ...scope(), schoolType: "gymnasium" },
      { ...scope(), schoolType: "mittelschule" },
      { ...scope(), subject: "geographie" },
    ]) {
      expect(
        findBundledCellsForScope(position).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    }
    expect(needsGenericCurriculumImport(scope(9))).toBe(true);
    const bindings = tile.atoms.flatMap((atom) =>
      (atom.curricula ?? []).filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      ),
    );
    expect(new Set(bindings.map((binding) => binding.topic_code))).toEqual(
      new Set(["lb1", "lb2", "lb3", "lb4"]),
    );
    expect(bindings).toHaveLength(32);
    for (const atom of tile.atoms) {
      expect(
        atom.curricula
          ?.filter((binding) => binding.provider === "lehrplanplus-bayern")
          .map((binding) => binding.topic_code),
      ).toEqual([AREAS[atom.domain.split("/")[1] as keyof typeof AREAS]]);
    }
    expect(
      tile.atoms.flatMap((atom) => atom.retired_curricula ?? []),
    ).toHaveLength(42);
    for (const binding of bindings) {
      expect(binding).toMatchObject({
        school_type: "realschule",
        grade: 10,
        subject: "pug",
        exam_relevant: false,
      });
      expect(binding.track).toBeUndefined();
    }
  });

  it("places every lesson under Politik und Gesellschaft in the knowledge atlas", () => {
    const { regions, aliases } = weltwissenSeedRows();
    expect(
      regions.find(
        (region) => region.key === "gesellschaft.politik-und-gesellschaft",
      ),
    ).toMatchObject({
      name: "Politik und Gesellschaft",
      parentKey: "gesellschaft",
      level: 1,
    });
    for (const atom of tile.atoms) {
      const stage = atom.domain.split("/")[1];
      expect(
        aliases.find((alias) => alias.domainPrefix === atom.domain)?.regionKey,
      ).toBe(`gesellschaft.politik-und-gesellschaft.${stage}`);
    }
    expect(hueFor("politik-und-gesellschaft")).toBe(
      SUBJECT_HUES["politik-und-gesellschaft"],
    );
    expect(SUBJECT_HUES["politik-und-gesellschaft"]).toBeDefined();
    const hue = SUBJECT_HUES["politik-und-gesellschaft"];
    for (const [subject, other] of Object.entries(SUBJECT_HUES)) {
      if (subject === "politik-und-gesellschaft") continue;
      const distance = Math.abs(hue - other);
      expect(
        Math.min(distance, 360 - distance),
        subject,
      ).toBeGreaterThanOrEqual(25);
    }
  });

  it("links every card to its lesson and declares no replacement or retirement", () => {
    expect(tile.retired_items ?? []).toEqual([]);
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
  });

  describe("enrolment and existing learning evidence", () => {
    let dir: string;
    let db: Database;
    const userId = ulid();

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-politik-10-"));
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
    async function expectFourSchoolAreas() {
      const bindings = await loadBindings(db);
      const official = bindings.filter(
        (binding) =>
          binding.provider === "lehrplanplus-bayern" &&
          binding.subject === "pug",
      );
      expect(official).toHaveLength(32);
      expect(
        ["lb1", "lb2", "lb3", "lb4"].map(
          (code) =>
            official.filter((binding) => binding.topicCode === code).length,
        ),
      ).toEqual([6, 8, 10, 8]);
      const units = await loadUnits(db, { tokenIds: [...itemIds] });
      expect(units).toHaveLength(32);
      const placements = deriveSchule(
        units,
        { regions: [], aliases: [], members: [] },
        bindings,
      );
      for (const atom of tile.atoms) {
        const expectedCode =
          AREAS[atom.domain.split("/")[1] as keyof typeof AREAS];
        const binding = official.find((row) => row.atomId === atom.id)!;
        expect(binding.topicCode, atom.slug).toBe(expectedCode);
        const unit = units.find((row) => row.atomId === atom.id)!;
        const placement = placements.find((row) => row.unitKey === unit.key)!;
        expect(placement.path[1]).toMatchObject({
          key: "realschule-10.politik-und-gesellschaft",
          name: "Politik und Gesellschaft",
        });
        expect(placement.path[2].name, atom.slug).toBe(binding.topicTitle);
        for (const item of atom.practice_items)
          expect(await getTokenById(db, item.id)).toMatchObject({
            provider: "lehrplanplus-bayern",
            topic_id: expectedCode,
          });
      }
      expect(await hasPendingCurriculumRetirements(db, tile)).toBe(false);
    }

    it("projects the actual 32 atoms and 64 tokens into all four school learning areas", async () => {
      await installKvtTile(db, tile);
      await expectFourSchoolAreas();
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
    });

    it.each([false, true])(
      "upgrades existing .1 evidence and catches up an older kernel's .2: %s",
      async (olderKernelFirst) => {
        await installKvtTile(db, legacy);
        for (const [index, item] of items.entries()) {
          const card = await ensureCard(db, item.id, userId);
          if (index < 4)
            await evaluateRating(db, {
              cardId: card.id,
              tokenId: item.id,
              userId,
              rating: 3,
              answerFormat: "recall",
              responseTimeMs: 2000,
              now: new Date("2026-10-25T10:00:00Z"),
            });
        }
        const before = await snapshot();
        const oldVersions = await Promise.all(
          items.map(
            async (item) => (await getTokenById(db, item.id))?.content_version,
          ),
        );
        expect(before.cards).toHaveLength(64);
        expect(before.reviews).toHaveLength(4);
        if (olderKernelFirst) {
          const ignoredWithdrawals = structuredClone(tile);
          for (const atom of ignoredWithdrawals.atoms)
            delete atom.retired_curricula;
          await installKvtTile(db, ignoredWithdrawals);
          expect(await snapshot()).toEqual(before);
          expect(await hasPendingCurriculumRetirements(db, tile)).toBe(true);
        }
        expect(await reconcileInstalledBundledTiles(db)).toMatchObject({
          reinstalled: [CELL_ID],
          failed: [],
        });
        await expectFourSchoolAreas();
        expect(await snapshot()).toEqual(before);
        expect(
          await Promise.all(
            items.map(
              async (item) =>
                (await getTokenById(db, item.id))?.content_version,
            ),
          ),
        ).toEqual(oldVersions);
        expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual(
          [],
        );
        expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
          cardsCreated: 0,
          alreadyEnrolled: true,
        });
        expect(await snapshot()).toEqual(before);
      },
    );

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

    it("installs without cards and enrols 64 fresh cards as one library topic, idempotently", async () => {
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual({ cards: [], reviews: [] });
      expect(
        (await listLibraryTopics(db, userId)).find(
          (topic) => topic.key === APP,
        ),
      ).toMatchObject({
        itemCount: 64,
        heldCount: 0,
      });
      expect(
        (await buildReviewQueue(db, { userId, tokenIds: [...itemIds] })).items,
      ).toEqual([]);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 64,
        cardsReused: 0,
      });
      const enrolled = await snapshot();
      expectFreshCards(enrolled.cards);
      expect(enrolled.reviews).toEqual([]);
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([expect.objectContaining({ itemCount: 64, heldCount: 64 })]);
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

    it("presents 32 initial fast checks with their published answers and lesson links", async () => {
      await enrolBundledCell(db, userId, CELL_ID);
      const queue = await buildReviewQueue(db, {
        userId,
        tokenIds: [...itemIds],
        maxNew: 100,
        maxReviews: 100,
        buryNewSiblings: false,
        buryReviewSiblings: false,
      });
      // New Tier-2 siblings wait for their atom's initial Tier-1 review.
      expect(queue.items).toHaveLength(32);
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

    it("preserves neighbouring geography, history and economics cards and all their reviews", async () => {
      const oldIds: string[] = [];
      const neighbours = [
        "zam-academy:geographie-realschule-9",
        "zam-academy:geschichte-realschule-10",
        "de-by:realschule-10-wirtschaft-recht-strafrecht-arbeitsrecht-sozialstaat",
      ];
      for (const [index, id] of neighbours.entries()) {
        const old = getBundledCellTile(id)!;
        await installKvtTile(db, old);
        const tokenId = old.atoms[0].practice_items[0].id;
        oldIds.push(tokenId);
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
            now: new Date(Date.UTC(2026, 9, 23 + day, 10)),
          });
      }
      const before = await snapshot();
      const oldTokens = await Promise.all(
        oldIds.map((id) => getTokenById(db, id)),
      );
      expect(before.cards).toHaveLength(3);
      expect(before.reviews).toHaveLength(6);
      await installKvtTile(db, tile);
      expect(await snapshot()).toEqual(before);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 64,
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
