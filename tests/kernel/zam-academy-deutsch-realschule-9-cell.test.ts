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
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";
import legacyRaw from "../fixtures/legacy/de-by-realschule-9-deutsch-argumentation-eroerterung-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-deutsch-realschule-9-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:deutsch-realschule-9";
const APP = "https://academy.zam-os.org/deutsch-realschule-9/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const legacy = legacyRaw as unknown as KvtTile;
const CORE_COUNTS: Record<string, number> = {
  lb1: 11,
  lb2: 16,
  lb3: 13,
  lb4: 13,
};
// Thomas approved the mapping and the retirement of all eight cards for
// zam-os/zam-academy#31 on 2026-10-23. All rows are category C: no history
// moves, the old cards are retired. The source snapshot and the decision
// record are copied without changing bytes.
const RETIRED = [
  "01K4D9T0000000000000000J01",
  "01K4D9T0000000000000000J02",
  "01K4D9T0000000000000000J03",
  "01K4D9T0000000000000000J04",
  "01K4D9T0000000000000000J05",
  "01K4D9T0000000000000000J06",
  "01K4D9T0000000000000000J07",
  "01K4D9T0000000000000000J08",
];
const scope = (track?: string, grade = 9) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "deutsch",
  ...(track ? { track } : {}),
});

// Deutsch 9 is one Fachlehrplan for every Wahlpflichtfächergruppe, so the
// cell's curriculum binding names no track (zam-os/zam-academy#30, #31).
describe("ZAM Academy Deutsch 9 Realschule cell", () => {
  it("bundles the published bytes and removes the old partial cell from discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Deutsch 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 53,
    });
    expect(items).toHaveLength(159);
    expect(getBundledCell(legacy.tile_id)).toBeUndefined();
    expect(getBundledCellTile(legacy.tile_id)).toBeUndefined();
    const lock = JSON.parse(
      readFileSync(
        join(__dirname, "../fixtures/curriculum/zam-academy-cells.lock.json"),
        "utf8",
      ),
    ) as Array<{ id: string; sha256: string; file: string; version: string }>;
    const entry = lock.find((e) => e.id === CELL_ID)!;
    expect(entry.version).toBe(tile.version);
    expect(
      createHash("sha256")
        .update(
          readFileSync(join(__dirname, "../fixtures/curriculum", entry.file)),
        )
        .digest("hex"),
    ).toBe(entry.sha256);
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

  it("is offered to every Wahlpflichtfächergruppe of grade 9, and to no other grade or school type", () => {
    for (const track of [
      undefined,
      "I",
      "wpfg1",
      "II",
      "wpfg2",
      "III",
      "wpfg3",
      "IIIa",
      "wpfg3a",
      "IIIb",
      "wpfg3b",
      "II_III",
      "wpfg2-3",
    ]) {
      const ids = findBundledCellsForScope(scope(track)).map((cell) => cell.id);
      expect(ids, `Deutsch ${track}`).toContain(CELL_ID);
      expect(ids, `Deutsch ${track}`).not.toContain(legacy.tile_id);
      expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    }
    for (const grade of [8, 10])
      expect(
        findBundledCellsForScope(scope("I", grade)).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    expect(
      findBundledCellsForScope({ ...scope("I"), schoolType: "gymnasium" }).map(
        (cell) => cell.id,
      ),
    ).not.toContain(CELL_ID);
  });

  it("binds all 53 lessons to the four Lernbereiche, with no group named", () => {
    for (const [topic, count] of Object.entries(CORE_COUNTS)) {
      const atoms = tile.atoms.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.topic_code === topic,
        ),
      );
      expect(atoms, topic).toHaveLength(count);
      for (const atom of atoms)
        expect(
          atom.curricula?.filter(
            (binding) => binding.provider === "lehrplanplus-bayern",
          ),
        ).toEqual([
          expect.objectContaining({
            school_type: "realschule",
            grade: 9,
            subject: "deutsch",
            topic_code: topic,
            exam_relevant: true,
          }),
        ]);
    }
    for (const atom of tile.atoms)
      for (const binding of atom.curricula ?? [])
        expect(binding).not.toHaveProperty("track");
  });

  it("links every card to its lesson and keeps three single-point cards per lesson", () => {
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(atom.practice_items).toHaveLength(3);
      expect(atom.practice_items.map((item) => item.tier)).toEqual([
        "tier1_fast",
        "tier2_synthesis",
        "tier1_fast",
      ]);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
        expect(item.concept?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("pins the approved mapping: no history moves and all eight old cards are retired", () => {
    expect(mapping.approved).toBe("2026-10-23");
    expect(mapping.source).toContain("Thomas");
    expect(mapping.rows).toHaveLength(8);
    expect(mapping.rows.every((row) => row.category === "C")).toBe(true);
    expect(mapping.rows.map((row) => row.de_by_id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    for (const item of items) expect(item.replaces).toBeUndefined();
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
    const userId = "de9-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-de9-"));
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
    const queue = async (tokenIds: string[], now: Date) =>
      (
        await buildReviewQueue(db, {
          userId,
          tokenIds,
          now,
          buryNewSiblings: false,
          buryReviewSiblings: false,
        })
      ).items;

    it("enrols all 159 cards as one topic and preserves every schedule on repeat", async () => {
      const result = await enrolBundledCell(db, userId, CELL_ID);
      expect(result).toMatchObject({ success: true, cardsCreated: 159 });
      expect(result.alreadyEnrolled).toBe(false);
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("retires the eight old histories untouched and starts all new cards unlearned", async () => {
      await installKvtTile(db, legacy);
      const originals = legacy.atoms.flatMap((atom) => atom.practice_items);
      expect(originals.map((item) => item.id).sort()).toEqual(
        [...RETIRED].sort(),
      );
      for (const [index, item] of originals.entries())
        await review(item.id, index);
      const before = await snapshot();
      expect(before.cards).toHaveLength(8);
      expect(before.reviews).toHaveLength(16);
      const due = new Date(
        Math.max(
          ...before.cards.map((card) => Date.parse(String(card.due_at))),
        ) + 86_400_000,
      );
      expect(await queue(RETIRED, due)).toHaveLength(8);
      const enrolled = await enrolBundledCell(db, userId, CELL_ID);
      expect(enrolled).toMatchObject({
        success: true,
        cardsCreated: 159,
        cardsReused: 0,
      });
      const after = await snapshot();
      expect(after.reviews).toEqual(before.reviews);
      // The eight old cards stay exactly as they were, on their own tokens.
      for (const card of before.cards)
        expect(after.cards.find((candidate) => candidate.id === card.id)).toEqual(
          card,
        );
      for (const original of originals) {
        const token = await getTokenById(db, original.id);
        expect(token?.deprecated_at).toBeTruthy();
        expect(token?.editorial_state).toBe("deprecated");
      }
      expect(await queue(RETIRED, due)).toHaveLength(0);
      const oldCardIds = new Set(before.cards.map((card) => card.id));
      const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
      expect(fresh).toHaveLength(159);
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
  });
});
