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
import legacyRaw from "../fixtures/legacy/de-by-realschule-10-bwr-kosten-leistungsrechnung-kalkulation-bilanzanalyse-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-bwr-realschule-10-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:bwr-realschule-10";
const APP = "https://academy.zam-os.org/bwr-realschule-10/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacy = legacyRaw as unknown as KvtTile;

// Thomas approved all four rows on 2026-10-25 (zam-os/zam-academy#51, cell
// 2026.10.2). The source snapshot and the decision record are copied without
// changing bytes from zam-os/zam-academy@main after #51.
const REPLACEMENTS: Record<string, string> = {
  "01K4WAK0000000000000000J01": "bwr10-vk-zuschlagskalkulation-check",
  "01K4WAK0000000000000000J03": "bwr10-tk-db-check",
};
const RETIRED = ["01K4WAK0000000000000000J02", "01K4WAK0000000000000000J04"];
const CORE_COUNTS: Record<string, number> = {
  lb1: 7,
  lb2: 8,
  lb3: 12,
  lb4: 9,
};
const OPTIONAL = ["gr-vorsteuer", "gr-prozent"];
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scope = (subject: string, track?: string, grade = 10) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject,
  ...(track ? { track } : {}),
});

describe("ZAM Academy BwR 10 Realschule cell", () => {
  it("bundles the published cell and removes the legacy cell from discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "BwR 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 38,
    });
    expect(items).toHaveLength(76);
    expect(getBundledCell(legacy.tile_id)).toBeUndefined();
    expect(getBundledCellTile(legacy.tile_id)).toBeUndefined();
    expect(mapping.sources).toHaveLength(1);
    const source = mapping.sources[0];
    expect(source).toMatchObject({
      tile_id: legacy.tile_id,
      version: legacy.version,
    });
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
  });

  it("offers BwR 10 only for group II, with official and legacy subject ids", () => {
    for (const subject of ["bwr", "bwl-rechnungswesen"]) {
      for (const track of [undefined, "II", "wpfg2"]) {
        expect(
          findBundledCellsForScope(scope(subject, track)).map(
            (cell) => cell.id,
          ),
        ).toEqual([CELL_ID]);
        expect(needsGenericCurriculumImport(scope(subject, track))).toBe(false);
      }
      for (const track of [
        "I",
        "wpfg1",
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
        expect(findBundledCellsForScope(scope(subject, track))).toEqual([]);
        expect(needsGenericCurriculumImport(scope(subject, track))).toBe(true);
      }
      for (const grade of [7, 8, 9])
        expect(
          findBundledCellsForScope(scope(subject, "II", grade)).map(
            (cell) => cell.id,
          ),
        ).not.toContain(CELL_ID);
    }
    expect(
      findBundledCellsForScope({
        ...scope("bwr", "II"),
        schoolType: "gymnasium",
      }),
    ).toEqual([]);
  });

  it("covers four areas with 36 group-II lessons and two optional refreshers", () => {
    const core = tile.atoms.filter((atom) =>
      atom.curricula?.some(
        (binding) => binding.provider === "lehrplanplus-bayern",
      ),
    );
    expect(core).toHaveLength(36);
    for (const [topic, count] of Object.entries(CORE_COUNTS)) {
      const atoms = core.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.topic_code === topic,
        ),
      );
      expect(atoms).toHaveLength(count);
      for (const atom of atoms)
        expect(
          atom.curricula?.filter(
            (binding) => binding.provider === "lehrplanplus-bayern",
          ),
        ).toEqual([
          expect.objectContaining({
            school_type: "realschule",
            grade: 10,
            track: "II",
            subject: "bwr",
            topic_code: topic,
            exam_relevant: true,
          }),
        ]);
    }
    const optional = tile.atoms.filter((atom) => !core.includes(atom));
    expect(optional.map((atom) => lessonId(atom.source_link!)).sort()).toEqual(
      [...OPTIONAL].sort(),
    );
    for (const atom of optional)
      expect(atom.curricula).toEqual([
        expect.objectContaining({
          provider: "zam-academy",
          subject: "bwr-realschule-10",
          topic_code: "grundlagen",
        }),
      ]);
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(atom.curricula?.[0]).toMatchObject({
        provider: "zam-academy",
        subject: "bwr-realschule-10",
      });
      expect(atom.practice_items).toHaveLength(2);
      expect(atom.practice_items.map((item) => item.tier)).toEqual([
        "tier1_fast",
        "tier2_synthesis",
      ]);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
      }
    }
  });

  it("pins the two approved atomic successors and retires the two split questions", () => {
    expect(mapping.approved).toBe("2026-10-25");
    expect(mapping.status).toBe("approved");
    expect(mapping.rows).toHaveLength(4);
    expect(
      Object.fromEntries(
        mapping.rows
          .filter((row) => row.category === "A")
          .map((row) => [row.de_by_id, row.academy_slug]),
      ),
    ).toEqual(REPLACEMENTS);
    expect(
      mapping.rows
        .filter((row) => row.category === "C")
        .map((row) => row.de_by_id)
        .sort(),
    ).toEqual([...RETIRED].sort());
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(declared).toHaveLength(2);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(tile.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    expect(
      mapping.rows.map((row) => [row.de_by_cell, row.de_by_id]).sort(),
    ).toEqual(
      legacy.atoms
        .flatMap((atom) =>
          atom.practice_items.map((item) => [legacy.tile_id, item.id]),
        )
        .sort(),
    );
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "bwr-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-bwr10-"));
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
    const withoutToken = ({ token_id, ...rest }: Record<string, unknown>) =>
      rest;
    async function review(tokenId: string, index: number) {
      const card = await ensureCard(db, tokenId, userId),
        now = new Date();
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

    it("enrols all 76 cards as one topic and preserves every schedule on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 76,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 76,
        heldCount: 76,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves two whole histories, retains two retired histories and starts 74 fresh cards unlearned", async () => {
      await installKvtTile(db, legacy);
      const originals = legacy.atoms.flatMap((atom) => atom.practice_items);
      for (const [index, item] of originals.entries())
        await review(item.id, index);
      const before = await snapshot();
      expect(before.cards).toHaveLength(4);
      expect(before.reviews).toHaveLength(8);
      const due = new Date(
        Math.max(
          ...before.cards.map((card) => Date.parse(String(card.due_at))),
        ) + 86_400_000,
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
      expect(await retiredQueue()).toHaveLength(2);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 74,
        cardsReused: 2,
      });
      const after = await snapshot();
      expect(after.cards).toHaveLength(78);
      expect(after.reviews).toHaveLength(8);
      const expected = (id: string) =>
        REPLACEMENTS[id] ? bySlug.get(REPLACEMENTS[id])!.id : id;
      for (const card of before.cards) {
        const next = after.cards.find((candidate) => candidate.id === card.id)!;
        expect(withoutToken(next)).toEqual(withoutToken(card));
        expect(next.token_id).toBe(expected(String(card.token_id)));
      }
      for (const review of before.reviews) {
        const next = after.reviews.find(
          (candidate) => candidate.id === review.id,
        )!;
        expect(withoutToken(next)).toEqual(withoutToken(review));
        expect(next.token_id).toBe(expected(String(review.token_id)));
      }
      for (const original of originals)
        expect(
          (await getTokenById(db, original.id))?.deprecated_at,
        ).toBeTruthy();
      expect(await retiredQueue()).toHaveLength(0);
      const oldCardIds = new Set(before.cards.map((card) => card.id));
      const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
      expect(fresh).toHaveLength(74);
      for (const card of fresh)
        expect(card).toMatchObject({
          state: "new",
          stability: 0,
          reps: 0,
          last_review_at: null,
        });
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });

    it.each(Object.keys(REPLACEMENTS))(
      "refuses to combine two reviewed histories for %s",
      async (old) => {
        await installKvtTile(db, tile);
        await installKvtTile(db, legacy);
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
