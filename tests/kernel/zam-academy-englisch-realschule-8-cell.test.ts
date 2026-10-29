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
import legacyRaw from "../fixtures/legacy/de-by-realschule-8-englisch-grammar-conditional-reported-speech-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-englisch-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:englisch-realschule-8";
const APP = "https://academy.zam-os.org/englisch-realschule-8/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacy = legacyRaw as unknown as KvtTile;
// Thomas approved these four rows for zam-os/zam-academy#67 on 2026-10-29:
// one equal single-point recall (the type 3 main clause) carries its history;
// the multi-part conditional recall and the two reported-speech recalls
// (Jahrgangsstufe 9 content) get no successor and stay active, unretired.
// The old cell leaves the bundle; both source files are archived
// byte-for-byte, independently of the Academy lock.
const REPLACEMENTS: Record<string, string> = {
  "01K4E8G0000000000000000J01": "e8-if-type3-check",
};
const KEPT = [
  "01K4E8G0000000000000000J02",
  "01K4E8G0000000000000000J03",
  "01K4E8G0000000000000000J04",
];
const STAGES: Record<string, number> = {
  history: 5,
  usa: 11,
  cities: 4,
  canada: 5,
  language: 17,
  literature: 4,
  projects: 5,
};
const scope = (track?: string, grade = 8) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "englisch",
  ...(track ? { track } : {}),
});
function withoutMapping(): KvtTile {
  const earlier = structuredClone(tile) as KvtTile;
  earlier.version = "2026.10.1";
  for (const atom of earlier.atoms)
    for (const item of atom.practice_items) delete item.replaces;
  return earlier;
}

describe("ZAM Academy Englisch 8 Realschule cell", () => {
  it("bundles the published bytes and removes the old grammar cell from discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Englisch 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 51,
    });
    expect(items).toHaveLength(102);
    expect(getBundledCell(legacy.tile_id)).toBeUndefined();
    expect(getBundledCellTile(legacy.tile_id)).toBeUndefined();
    const lock = JSON.parse(
      readFileSync(
        join(__dirname, "../fixtures/curriculum/zam-academy-cells.lock.json"),
        "utf8",
      ),
    ) as Array<{ id: string; sha256: string; file: string; version: string }>;
    const entry = lock.find((candidate) => candidate.id === CELL_ID)!;
    expect(entry.version).toBe(tile.version);
    expect(entry.sha256).toBe(
      "b47a776ab9f7d7d42d4c9ab88d89ce4e1ccee634671bc2fd721d78cb233e4b1b",
    );
    expect(
      createHash("sha256")
        .update(
          readFileSync(join(__dirname, "../fixtures/curriculum", entry.file)),
        )
        .digest("hex"),
    ).toBe(entry.sha256);
    expect(mapping).toMatchObject({
      source_repository: "zam-os/zam",
      source_commit: "717ba45adf1f531da0bf662393a4b5379961f21f",
    });
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

  it("is offered to every grade-8 Realschule group and to no other grade or school type", () => {
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
      expect(ids, String(track)).toContain(CELL_ID);
      expect(ids, String(track)).not.toContain(legacy.tile_id);
      expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    }
    for (const grade of [7, 9, 10])
      expect(
        findBundledCellsForScope(scope("I", grade)).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    expect(
      findBundledCellsForScope({ ...scope("I"), schoolType: "gymnasium" }).map(
        (cell) => cell.id,
      ),
    ).not.toContain(CELL_ID);
  });

  it("covers all five learning areas with 51 core lessons in seven stages", () => {
    const coverage = new Set<string>();
    for (const [stage, count] of Object.entries(STAGES))
      expect(
        tile.atoms.filter((atom) =>
          atom.curricula?.some(
            (binding) =>
              binding.provider === "zam-academy" &&
              binding.topic_code === stage,
          ),
        ),
        stage,
      ).toHaveLength(count);
    for (const atom of tile.atoms) {
      expect(atom.curricula?.[0]).toMatchObject({
        provider: "zam-academy",
        subject: "englisch-realschule-8",
      });
      const official =
        atom.curricula?.filter(
          (binding) => binding.provider === "lehrplanplus-bayern",
        ) ?? [];
      expect(official.length).toBeGreaterThan(0);
      for (const binding of official) {
        // A grade-8 course, not material for the final examination.
        expect(binding).toMatchObject({
          school_type: "realschule",
          grade: 8,
          subject: "englisch",
          exam_relevant: false,
        });
        expect(["lb1", "lb2", "lb3", "lb4", "lb5"]).toContain(
          binding.topic_code,
        );
        coverage.add(binding.topic_code);
      }
      for (const binding of atom.curricula ?? [])
        expect(binding).not.toHaveProperty("track");
    }
    expect([...coverage].sort()).toEqual(["lb1", "lb2", "lb3", "lb4", "lb5"]);
  });

  it("links two English recall cards per lesson to the training app", () => {
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(APP + "#lesson=" + atom.slug);
      expect(atom.practice_items).toHaveLength(2);
      expect(atom.practice_items.map((item) => item.tier)).toEqual([
        "tier1_fast",
        "tier2_synthesis",
      ]);
      expect(atom.practice_items.map((item) => item.slug)).toEqual([
        atom.slug + "-check",
        atom.slug + "-recall",
      ]);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("en");
        expect(item.concept?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("pins exactly the one approved transfer and keeps three cards without retiring any", () => {
    expect(mapping.approved).toBe("2026-10-29");
    expect(mapping.status).toBe("approved");
    expect(mapping.source).toContain("Thomas");
    expect(mapping.source).toContain("Approve mapping");
    expect(mapping.rows).toHaveLength(4);
    expect(
      mapping.rows
        .filter((row) => row.category === "A")
        .map((row) => [row.de_by_id, row.academy_slug, row.action]),
    ).toEqual(
      Object.entries(REPLACEMENTS).map(([id, slug]) => [id, slug, "replace"]),
    );
    expect(
      mapping.rows
        .filter((row) => row.category === "C")
        .map((row) => [row.de_by_id, row.academy_slug, row.action])
        .sort(),
    ).toEqual(KEPT.map((id) => [id, null, "keep-active"]).sort());
    expect(
      items
        .flatMap((item) => (item.replaces ?? []).map((id) => [id, item.slug]))
        .sort(),
    ).toEqual(Object.entries(REPLACEMENTS).sort());
    expect(tile.retired_items ?? []).toEqual([]);
    expect(
      mapping.rows.map((row) => [row.de_by_id, row.de_by_question]).sort(),
    ).toEqual(
      legacy.atoms
        .flatMap((atom) =>
          atom.practice_items.map((item) => [item.id, item.question]),
        )
        .sort(),
    );
    // The successor asks the same single retrieval as the old card.
    const old = legacy.atoms
      .flatMap((atom) => atom.practice_items)
      .find((item) => item.id === "01K4E8G0000000000000000J01")!;
    const successor = bySlug.get("e8-if-type3-check")!;
    expect(successor.concept).toBe("would have helped");
    expect(successor.fast_check?.options).toEqual(old.fast_check?.options);
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "e8-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-e8-"));
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
      const card = await ensureCard(db, tokenId, userId);
      const now = new Date("2026-01-01T12:00:00Z");
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

    it("installs without cards, then enrols all 102 unlearned cards as one topic, idempotently", async () => {
      await installKvtTile(db, tile);
      expect((await snapshot()).cards).toHaveLength(0);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 102,
        alreadyEnrolled: false,
      });
      const before = await snapshot();
      expect(before.cards).toHaveLength(102);
      expect(before.reviews).toHaveLength(0);
      for (const card of before.cards)
        expect(card).toMatchObject({
          state: "new",
          stability: 0,
          reps: 0,
          last_review_at: null,
        });
      expect(
        (await listLibraryTopics(db, userId)).filter(
          (topic) => topic.key === APP,
        ),
      ).toEqual([
        expect.objectContaining({ key: APP, itemCount: 102, heldCount: 102 }),
      ]);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it.each(["first enrolment", "upgrade from an unmapped cell"])(
      "moves one history, keeps three cards active during %s and starts the other cards unlearned",
      async (mode) => {
        if (mode === "upgrade from an unmapped cell")
          await installKvtTile(db, withoutMapping());
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
        expect(await queue(KEPT, due)).toHaveLength(3);

        expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
          success: true,
          cardsCreated: 101,
          cardsReused: 1,
        });
        const after = await snapshot();
        expect(after.cards).toHaveLength(105);
        expect(after.reviews).toHaveLength(8);
        const expected = (id: string) =>
          REPLACEMENTS[id] ? bySlug.get(REPLACEMENTS[id])!.id : id;
        for (const group of ["cards", "reviews"] as const)
          for (const row of before[group]) {
            const next = after[group].find(
              (candidate) => candidate.id === row.id,
            )!;
            expect(withoutToken(next)).toEqual(withoutToken(row));
            expect(next.token_id).toBe(expected(String(row.token_id)));
          }
        for (const id of Object.keys(REPLACEMENTS))
          expect((await getTokenById(db, id))?.deprecated_at, id).toBeTruthy();
        for (const id of KEPT)
          expect((await getTokenById(db, id))?.deprecated_at, id).toBeFalsy();
        expect(await queue(KEPT, due)).toHaveLength(3);
        expect(
          await queue(
            Object.values(REPLACEMENTS).map((slug) => bySlug.get(slug)!.id),
            due,
          ),
        ).toHaveLength(1);
        const oldCardIds = new Set(before.cards.map((card) => card.id));
        const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
        expect(fresh).toHaveLength(101);
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
      },
    );

    it.each(Object.keys(REPLACEMENTS))(
      "refuses to combine two reviewed histories for %s",
      async (old) => {
        await installKvtTile(db, withoutMapping());
        await installKvtTile(db, legacy);
        await review(old, 1);
        await review(bySlug.get(REPLACEMENTS[old])!.id, 2);
        const before = await snapshot();
        const tokensBefore = await db
          .prepare("SELECT * FROM tokens ORDER BY id")
          .all();
        await expect(enrolBundledCell(db, userId, CELL_ID)).rejects.toThrow(
          /holds a card on both|merge/i,
        );
        expect(await snapshot()).toEqual(before);
        expect(
          await db.prepare("SELECT * FROM tokens ORDER BY id").all(),
        ).toEqual(tokensBefore);
      },
    );
  });
});
