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
  kvtItemPlainTexts,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

// Französisch 10 (zam-os/zam-academy#54) is a new Academy offering for
// Wahlpflichtfächergruppe IIIa. ZAM has no earlier Französisch-10 school cell
// for the Realschule, so the cell replaces and retires nothing.
const CELL_ID = "zam-academy:franzoesisch-realschule-10";
const APP = "https://academy.zam-os.org/franzoesisch-realschule-10/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const itemIds = new Set(items.map((item) => item.id));
const scope = (track?: string, grade = 10) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "franzoesisch",
  ...(track ? { track } : {}),
});
const ids = (track?: string, grade = 10) =>
  findBundledCellsForScope(scope(track, grade)).map((cell) => cell.id);

describe("ZAM Academy Französisch 10 Realschule cell", () => {
  it("bundles the published 57 lessons and 171 practice items as a new cell (2026.10.2 corrects two distractor reasons)", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Französisch 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 57,
    });
    expect(items).toHaveLength(171);
    expect(tile.retired_items ?? []).toEqual([]);
    for (const item of items) expect(item.replaces ?? [], item.id).toEqual([]);
  });

  it("is offered for Wahlpflichtfächergruppe IIIa and without a chosen group, never for groups without Französisch", () => {
    for (const track of [undefined, "IIIa", "wpfg3a"]) {
      expect(new Set(ids(track)), String(track)).toEqual(new Set([CELL_ID]));
      const cell = findBundledCellsForScope(scope(track)).find(
        (entry) => entry.id === CELL_ID,
      )!;
      expect(cell.inScopeAtomIds).toHaveLength(57);
      expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    }
    for (const track of ["I", "II", "IIIb"])
      expect(ids(track), track).not.toContain(CELL_ID);
  });

  it("binds all 57 lessons to IIIa, grade 10 and a Lernbereich", () => {
    for (const atom of tile.atoms) {
      const binding = atom.curricula?.find(
        (entry) => entry.provider === "lehrplanplus-bayern",
      );
      expect(binding, atom.slug).toMatchObject({
        school_type: "realschule",
        grade: 10,
        track: "IIIa",
        subject: "franzoesisch",
        exam_relevant: true,
      });
      expect(binding?.topic_code, atom.slug).toMatch(/^lb\d/);
    }
  });

  it("keeps the cell out of grade 9 and the Gymnasium, and grade 9 keeps its own cell", () => {
    expect(ids("IIIa", 9)).not.toContain(CELL_ID);
    expect(ids("IIIa", 9)).toContain("zam-academy:franzoesisch-realschule-9");
    const gymnasium = findBundledCellsForScope({
      ...scope(),
      schoolType: "gymnasium",
    }).map((cell) => cell.id);
    expect(gymnasium).not.toContain(CELL_ID);
    expect(gymnasium).toContain(
      "de-by:gymnasium-10-franzoesisch-francophonie-passif-gerondif",
    );
  });

  it("keeps every German card linked to its exact published lesson", () => {
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(57);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(
        `${APP}#lesson=${atom.slug.replace(/^fr10-/, "fr-")}`,
      );
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
      }
    }
  });

  describe("enrolment and neighbouring French histories", () => {
    let dir: string;
    let db: Database;
    let userId: string;

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-franzoesisch10-"));
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

    it("enrols all 171 cards as one topic without duplicating or rescheduling on repeat", async () => {
      await installKvtTile(db, tile);
      expect((await snapshot()).cards).toEqual([]);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 171,
      });
      const topics = (await listLibraryTopics(db, userId)).filter(
        (topic) => topic.key === APP,
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({ itemCount: 171, heldCount: 171 });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("presents both Tier-1 fast checks of every lesson, 114 in all, with their published answers and lesson links", async () => {
      await enrolBundledCell(db, userId, CELL_ID);
      const queue = await buildReviewQueue(db, {
        userId,
        tokenIds: [...itemIds],
        maxNew: 200,
        maxReviews: 200,
        buryNewSiblings: false,
        buryReviewSiblings: false,
      });
      // New Tier-2 siblings wait for their atom's initial Tier-1 review, so the
      // queue holds the two Tier-1 cards of each of the 57 atoms. Sibling burial
      // applies only to imported cards, not to Academy items.
      expect(queue.items).toHaveLength(114);
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

    it("preserves the Französisch 9, Realschule 8 and Gymnasium 10 cards and all their reviews", async () => {
      const oldIds: string[] = [];
      const neighbours = [
        "zam-academy:franzoesisch-realschule-9",
        "de-by:realschule-8-franzoesisch-passe-compose-relativsaetze-adjektive",
        "de-by:gymnasium-10-franzoesisch-francophonie-passif-gerondif",
      ];
      for (const [index, id] of neighbours.entries()) {
        const old = getBundledCellTile(id)!;
        expect(old, id).toBeDefined();
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
        cardsCreated: 171,
        cardsReused: 0,
      });
      const after = await snapshot();
      expect(
        after.cards.filter((card) => !itemIds.has(String(card.token_id))),
      ).toEqual(before.cards);
      expect(after.reviews).toEqual(before.reviews);
      for (const card of after.cards.filter((entry) =>
        itemIds.has(String(entry.token_id)),
      ))
        expect(card).toMatchObject({
          state: "new",
          stability: 0,
          reps: 0,
          last_review_at: null,
        });
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
