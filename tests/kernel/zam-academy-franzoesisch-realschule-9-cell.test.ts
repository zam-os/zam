import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
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

import legacyRaw from "../fixtures/legacy/de-by-realschule-9-franzoesisch-imparfait-futur-objektpronomen-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-franzoesisch-realschule-9-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:franzoesisch-realschule-9";
const APP = "https://academy.zam-os.org/franzoesisch-realschule-9/";
const LEGACY_ID =
  "de-by:realschule-9-franzoesisch-imparfait-futur-objektpronomen";
const tile = getBundledCellTile(CELL_ID)!;
const legacy = legacyRaw as unknown as KvtTile;
const scope = (track?: string, grade = 9) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "franzoesisch",
  ...(track ? { track } : {}),
});
const ids = (track?: string, grade = 9) =>
  findBundledCellsForScope(scope(track, grade)).map((cell) => cell.id);

describe("ZAM Academy Französisch 9 Realschule cell", () => {
  it("bundles the published cell without the old partial cell, which stays archived", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Französisch 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 56,
    });
    expect(tile.atoms.flatMap((atom) => atom.practice_items)).toHaveLength(168);
    expect(getBundledCell(LEGACY_ID)).toBeUndefined();
    expect(getBundledCellTile(LEGACY_ID)).toBeUndefined();
  });

  it("declares exactly the four approved retirements and moves no history", () => {
    // Thomas approved the four category C rows on 2026-10-24 (zam-os/zam-academy#41).
    expect(mapping.approved).toBe("2026-10-24");
    expect(mapping.rows.map((row) => row.category)).toEqual([
      "C",
      "C",
      "C",
      "C",
    ]);
    expect(tile.retired_items?.map((entry) => entry.id)).toEqual(
      mapping.rows.map((row) => row.de_by_id),
    );
    expect(tile.retired_items?.map((entry) => entry.id)).toEqual(
      legacy.atoms.flatMap((atom) =>
        atom.practice_items.map((item) => item.id),
      ),
    );
    for (const atom of tile.atoms)
      for (const item of atom.practice_items)
        expect(item.replaces ?? [], item.id).toEqual([]);
  });

  it("is offered for Wahlpflichtfächergruppe IIIa and without a chosen group, never for groups without Französisch", () => {
    for (const track of [undefined, "IIIa"]) {
      expect(new Set(ids(track)), String(track)).toEqual(new Set([CELL_ID]));
      const cell = findBundledCellsForScope(scope(track)).find(
        (entry) => entry.id === CELL_ID,
      )!;
      expect(cell.inScopeAtomIds).toHaveLength(56);
      expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    }
    for (const track of ["I", "II", "IIIb"])
      expect(ids(track), track).not.toContain(CELL_ID);
  });

  it("binds all 56 lessons to IIIa, grade 9 and a Lernbereich", () => {
    for (const atom of tile.atoms) {
      const binding = atom.curricula?.find(
        (entry) => entry.provider === "lehrplanplus-bayern",
      );
      expect(binding, atom.slug).toMatchObject({
        school_type: "realschule",
        grade: 9,
        track: "IIIa",
        subject: "franzoesisch",
      });
      expect(binding?.topic_code, atom.slug).toMatch(/^lb\d/);
    }
  });

  it("keeps the cell out of other grades and school types", () => {
    expect(ids("IIIa", 8)).not.toContain(CELL_ID);
    expect(ids("IIIa", 10)).not.toContain(CELL_ID);
    expect(
      findBundledCellsForScope({
        ...scope("IIIa"),
        schoolType: "gymnasium",
      }).map((cell) => cell.id),
    ).not.toContain(CELL_ID);
  });

  it("keeps every German card linked to its exact published lesson", () => {
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(56);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(
        `${APP}#lesson=${atom.slug.replace(/^fr9-/, "fr-")}`,
      );
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
      }
    }
  });

  describe("enrolment and preserved school-card histories", () => {
    let dir: string;
    let db: Database;
    let userId: string;

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-franzoesisch9-"));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
      userId = ulid();
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

    it("enrols all 168 cards as one topic without duplicating or rescheduling on repeat", async () => {
      await installKvtTile(db, tile);
      expect((await snapshot()).cards).toEqual([]);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 168,
      });
      const topics = (await listLibraryTopics(db, userId)).filter(
        (topic) => topic.key === APP,
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({ itemCount: 168, heldCount: 168 });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("retires the four old cards with all 4 card states and 8 reviews intact and starts the 168 Academy cards unlearned", async () => {
      await installKvtTile(db, legacy);
      const oldTokenIds = tile.retired_items!.map((entry) => entry.id);
      for (const [index, tokenId] of oldTokenIds.entries()) {
        const card = await ensureCard(db, tokenId, userId);
        const now = new Date("2026-10-01T10:00:00.000Z");
        const rating = {
          cardId: card.id,
          tokenId,
          userId,
          answerFormat: "recall" as const,
          responseTimeMs: 1200 + index * 100,
        };
        await evaluateRating(db, { ...rating, rating: 3, now });
        await evaluateRating(db, {
          ...rating,
          rating: index % 2 === 0 ? 2 : 4,
          now: new Date(now.getTime() + 3 * 86_400_000),
        });
      }
      const before = await snapshot();
      expect(before.cards).toHaveLength(4);
      expect(before.reviews).toHaveLength(8);
      const queue = (now: string) =>
        buildReviewQueue(db, {
          userId,
          tokenIds: oldTokenIds,
          now: new Date(now),
          buryNewSiblings: false,
          buryReviewSiblings: false,
        });
      expect((await queue("2030-01-01T00:00:00Z")).items).toHaveLength(4);

      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 168,
        cardsReused: 0,
      });
      const after = await snapshot();
      expect(after.cards).toHaveLength(172);
      expect(
        after.cards.filter((card) =>
          oldTokenIds.includes(String(card.token_id)),
        ),
      ).toEqual(before.cards);
      expect(after.reviews).toEqual(before.reviews);
      for (const id of oldTokenIds) {
        const token = await getTokenById(db, id);
        expect(token, id).toBeDefined();
        expect(token?.deprecated_at, id).not.toBeNull();
        expect(token?.editorial_state, id).toBe("deprecated");
      }
      expect((await queue("2030-01-01T00:00:00Z")).items).toHaveLength(0);
      const oldIds = new Set(before.cards.map((card) => card.id));
      for (const card of after.cards.filter((entry) => !oldIds.has(entry.id)))
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
  });
});
