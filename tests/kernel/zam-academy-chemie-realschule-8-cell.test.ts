import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
  type KvtTile,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";
import legacyStoffeRaw from "../fixtures/legacy/de-by-realschule-8-chemie-stoffe-stoffgemische-trennung-kvt.json" with {
  type: "json",
};
import legacyReaktionRaw from "../fixtures/legacy/de-by-realschule-8-chemie-chemische-reaktion-oxidation-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-chemie-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:chemie-realschule-8";
const APP = "https://academy.zam-os.org/chemie-realschule-8/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacyStoffe = legacyStoffeRaw as unknown as KvtTile;
const legacyReaktion = legacyReaktionRaw as unknown as KvtTile;
const legacyTiles = [legacyStoffe, legacyReaktion];

// Thomas approved all 16 rows on 2026-10-26 (zam-os/zam-academy#60, cell 2026.10.2).
// The source snapshots and the decision record are copied without changing bytes
// from zam-os/zam-academy@main after #60.
const REPLACEMENTS: Record<string, string> = {
  "01K4C8S0000000000000000J01": "c8-reinstoffe-gemische-suspension",
  "01K4C8S0000000000000000J03": "c8-sinne-kenngroessen-dichte",
  "01K4C8S0000000000000000J05": "c8-trennverfahren-destillation",
  "01K4C8S0000000000000000J07": "c8-teilchenmodell-phasen-sublimation",
  "01K4C8R0000000000000000J01": "c8-merkmale-umgruppierung-unterschied",
  "01K4C8R0000000000000000J03": "c8-katalyse-oberflaeche-wirkung",
  "01K4C8R0000000000000000J05": "c8-verbrennung-explosion-brandschutz-dreieck",
  "01K4C8R0000000000000000J07": "c8-massenerhaltung-gleichungen-lavoisier",
};
const RETIRED = [
  "01K4C8S0000000000000000J02",
  "01K4C8S0000000000000000J04",
  "01K4C8S0000000000000000J06",
  "01K4C8S0000000000000000J08",
  "01K4C8R0000000000000000J02",
  "01K4C8R0000000000000000J04",
  "01K4C8R0000000000000000J06",
  "01K4C8R0000000000000000J08",
];
const CORE_COUNTS: Record<string, number> = {
  lb1: 3,
  lb2: 6,
  lb3: 5,
  lb4: 13,
  lb5: 5,
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scope = (subject: string, track?: string, grade = 8) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject,
  ...(track ? { track } : {}),
});

describe("ZAM Academy Chemie 8 Realschule cell", () => {
  it("bundles the published cell and removes the legacy cells from discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Chemie 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 32,
    });
    expect(items).toHaveLength(66);
    for (const legacy of legacyTiles) {
      expect(getBundledCell(legacy.tile_id)).toBeUndefined();
      expect(getBundledCellTile(legacy.tile_id)).toBeUndefined();
    }
    expect(mapping.sources).toHaveLength(2);
    for (const source of mapping.sources) {
      const match = legacyTiles.find((t) => t.tile_id === source.tile_id)!;
      expect(match).toBeDefined();
      expect(match.version).toBe("2026.08.1");
      expect(
        createHash("sha256")
          .update(
            readFileSync(
              join(
                __dirname,
                "../fixtures/legacy",
                source.file.replace(/^tests\/fixtures\//, ""),
              ),
            ),
          )
          .digest("hex"),
      ).toBe(source.sha256);
    }
  });

  it("offers Chemie 8 only for group I (Zweig I), since II and III start in Grade 9", () => {
    for (const track of [undefined, "I", "wpfg1"]) {
      expect(
        findBundledCellsForScope(scope("chemie", track)).map((cell) => cell.id),
      ).toEqual([CELL_ID]);
      expect(needsGenericCurriculumImport(scope("chemie", track))).toBe(false);
    }
    for (const track of [
      "II",
      "wpfg2",
      "III",
      "wpfg3",
      "IIIa",
      "III_a",
      "wpfg3a",
      "wpfg3-a",
      "IIIb",
      "III_b",
      "wpfg3b",
      "wpfg3-b",
    ]) {
      expect(findBundledCellsForScope(scope("chemie", track))).toEqual([]);
      expect(needsGenericCurriculumImport(scope("chemie", track))).toBe(true);
    }
    for (const grade of [7, 9, 10]) {
      expect(
        findBundledCellsForScope(scope("chemie", "I", grade)).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    }
    expect(
      findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade: 8,
        subject: "chemie",
      }).map((cell) => cell.id),
    ).not.toContain(CELL_ID);
  });

  it("covers five areas with 32 group-I lessons", () => {
    const core = tile.atoms.filter((atom) =>
      atom.curricula?.some(
        (binding) => binding.provider === "lehrplanplus-bayern",
      ),
    );
    expect(core).toHaveLength(32);
    for (const [topic, count] of Object.entries(CORE_COUNTS)) {
      const atoms = core.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.topic_code === topic,
        ),
      );
      expect(atoms, topic).toHaveLength(count);
    }
    for (const atom of tile.atoms) {
      expect(atom.source_link).toMatch(/^https:\/\/academy\.zam-os\.org\/chemie-realschule-8\/#lesson=/);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
      }
    }
  });

  it("declares exactly eight approved replaces and eight retired_items", () => {
    expect(tile.retired_items?.map((item) => item.id)).toEqual(RETIRED);
    const declared = Object.fromEntries(
      tile.atoms
        .flatMap((atom) => atom.practice_items)
        .filter((item) => item.replaces?.length)
        .map((item) => [item.replaces![0], item.slug]),
    );
    expect(declared).toEqual(REPLACEMENTS);
  });

  describe("library integration", () => {
    let tempDir: string;
    let db: Database;
    const userId = "c8-learner";

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-c8-lib-"));
      db = await openDatabase({ dbPath: join(tempDir, "lib.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true });
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

    const withoutToken = ({ token_id, ...rest }: Record<string, unknown>) => rest;

    async function review(tokenId: string, index: number) {
      const card = await ensureCard(db, tokenId, userId);
      const now = new Date();
      await evaluateRating(db, {
        cardId: card.id,
        tokenId,
        userId,
        rating: index % 2 === 0 ? 1 : 3,
        answerFormat: "recall",
        responseTimeMs: 1200 + index * 100,
        now,
      });
      await evaluateRating(db, {
        cardId: card.id,
        tokenId,
        userId,
        rating: index % 3 === 0 ? 2 : 4,
        answerFormat: "recall",
        responseTimeMs: 2000 + index * 100,
        now: new Date(now.getTime() + (index + 1) * 86_400_000),
      });
    }

    it("enrols all 66 cards as one topic and preserves every schedule on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 66,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 66,
        heldCount: 66,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves eight whole histories, retains eight retired histories and starts 57 fresh cards unlearned", async () => {
      for (const legacy of legacyTiles) {
        await installKvtTile(db, legacy);
      }
      const originals = legacyTiles.flatMap((t) => t.atoms.flatMap((atom) => atom.practice_items));
      for (const [index, item] of originals.entries()) {
        await review(item.id, index);
      }
      const before = await snapshot();
      expect(before.cards).toHaveLength(16);
      expect(before.reviews).toHaveLength(32);

      const due = new Date(
        Math.max(...before.cards.map((card) => Date.parse(String(card.due_at)))) + 86_400_000,
      );
      const retiredQueue = async () =>
        (
          await buildReviewQueue(db, {
            userId,
            tokenIds: RETIRED,
            now: due,
            buryNewSiblings: false,
            buryReviewSiblings: false,
          })
        ).items;
      expect(await retiredQueue()).toHaveLength(8);

      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 57,
        cardsReused: 8,
      });

      const after = await snapshot();
      expect(after.cards).toHaveLength(73); // 65 active (8 reused + 57 created, 1 Tier-2 sibling waits) + 8 retired
      expect(after.reviews).toHaveLength(32);

      const expected = (id: string) =>
        REPLACEMENTS[id] ? bySlug.get(REPLACEMENTS[id])!.id : id;
      for (const card of before.cards) {
        const next = after.cards.find((candidate) => candidate.id === card.id)!;
        expect(withoutToken(next)).toEqual(withoutToken(card));
        expect(next.token_id).toBe(expected(String(card.token_id)));
      }
      for (const review of before.reviews) {
        const next = after.reviews.find((candidate) => candidate.id === review.id)!;
        expect(withoutToken(next)).toEqual(withoutToken(review));
        expect(next.token_id).toBe(expected(String(review.token_id)));
      }
      for (const original of originals) {
        expect((await getTokenById(db, original.id))?.deprecated_at).toBeTruthy();
      }
      expect(await retiredQueue()).toHaveLength(0);

      const oldCardIds = new Set(before.cards.map((card) => card.id));
      const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
      // 57 fresh cards: 66 total minus 8 reused minus 1 Tier-2 sibling waiting on an atom with prior cards
      expect(fresh).toHaveLength(57);
      for (const card of fresh) {
        expect(card).toMatchObject({
          state: "new",
          stability: 0,
          reps: 0,
          last_review_at: null,
        });
      }

      // Second enrol pass brings in the remaining Tier-2 sibling on the 3-item atom
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 1,
        alreadyEnrolled: false,
      });

      const fullyEnrolled = await snapshot();
      expect(fullyEnrolled.cards).toHaveLength(74); // all 66 active + 8 retired

      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(fullyEnrolled);
    });

    it.each(Object.keys(REPLACEMENTS))(
      "refuses to combine two reviewed histories for %s",
      async (old) => {
        await installKvtTile(db, tile);
        for (const legacy of legacyTiles) {
          await installKvtTile(db, legacy);
        }
        await review(old, 1);
        await review(bySlug.get(REPLACEMENTS[old])!.id, 2);
        const before = await snapshot();
        await expect(enrolBundledCell(db, userId, CELL_ID)).rejects.toThrow(
          /holds a card on both|merge/i,
        );
        expect(await snapshot()).toEqual(before);
      },
    );
  });
});
