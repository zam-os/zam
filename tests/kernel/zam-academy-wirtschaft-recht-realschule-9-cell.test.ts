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
import legacyRaw from "../fixtures/legacy/de-by-realschule-9-wirtschaft-recht-markt-vertraege-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-wirtschaft-recht-realschule-9-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:wirtschaft-recht-realschule-9";
const APP = "https://academy.zam-os.org/wirtschaft-recht-realschule-9/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacy = legacyRaw as unknown as KvtTile;

// Thomas approved all eight rows for zam-os/zam-academy#29 on 2026-10-22. The
// source snapshot and the decision record are copied without changing bytes.
const REPLACEMENTS: Record<string, string> = {
  "01K4W9R0000000000000000J01": "wr9-re-lebensalter-check",
  "01K4W9R0000000000000000J03": "wr9-ve-kaufvertrag-extra",
  "01K4W9R0000000000000000J05": "wr9-wh-verschiebung-check",
};
const RETIRED = [
  "01K4W9R0000000000000000J02",
  "01K4W9R0000000000000000J04",
  "01K4W9R0000000000000000J06",
  "01K4W9R0000000000000000J07",
  "01K4W9R0000000000000000J08",
];
const CORE_COUNTS: Record<string, number> = {
  lb1: 10,
  lb2: 10,
  lb3: 9,
  lb4: 17,
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scope = (subject: string, track?: string, grade = 9) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject,
  ...(track ? { track } : {}),
});

// Wirtschaft und Recht 9 is one Fachlehrplan for the groups I and III; group
// II learns BwR in this grade (zam-os/zam-academy#27, #29).
describe("ZAM Academy Wirtschaft und Recht 9 Realschule cell", () => {
  it("bundles the published bytes and removes the old partial cell from discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Wirtschaft und Recht 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 50,
    });
    expect(items).toHaveLength(150);
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

  it("is offered to groups I, IIIa and IIIb, never to group II or other grades", () => {
    for (const subject of ["wirtschaft-und-recht", "wirtschaft_und_recht"]) {
      for (const track of [
        undefined,
        "I",
        "wpfg1",
        "III",
        "wpfg3",
        "IIIa",
        "wpfg3a",
        "IIIb",
        "wpfg3b",
        "I/III",
        "wpfg1-3",
      ]) {
        expect(
          findBundledCellsForScope(scope(subject, track)).map(
            (cell) => cell.id,
          ),
          `${subject} ${track}`,
        ).toContain(CELL_ID);
        expect(needsGenericCurriculumImport(scope(subject, track))).toBe(false);
      }
      for (const track of ["II", "wpfg2"])
        expect(
          findBundledCellsForScope(scope(subject, track)).map(
            (cell) => cell.id,
          ),
          `${subject} ${track}`,
        ).not.toContain(CELL_ID);
      for (const grade of [8, 10])
        expect(
          findBundledCellsForScope(scope(subject, "I", grade)).map(
            (cell) => cell.id,
          ),
        ).not.toContain(CELL_ID);
    }
    expect(
      findBundledCellsForScope({
        ...scope("wirtschaft-und-recht", "I"),
        schoolType: "gymnasium",
      }).map((cell) => cell.id),
    ).not.toContain(CELL_ID);
  });

  it("binds 46 core lessons to the four Lernbereiche in both groups and leaves four English lessons unbound", () => {
    const core = tile.atoms.filter((atom) =>
      atom.curricula?.some(
        (binding) => binding.provider === "lehrplanplus-bayern",
      ),
    );
    expect(core).toHaveLength(46);
    for (const [topic, count] of Object.entries(CORE_COUNTS)) {
      const atoms = core.filter((atom) =>
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
        ).toEqual(
          ["I", "III"].map((track) =>
            expect.objectContaining({
              school_type: "realschule",
              grade: 9,
              track,
              subject: "wirtschaft-und-recht",
              topic_code: topic,
              exam_relevant: true,
            }),
          ),
        );
    }
    const optional = tile.atoms.filter((atom) => !core.includes(atom));
    expect(optional.map((atom) => lessonId(atom.source_link!))).toEqual([
      "en-work-unemployment",
      "en-job-application",
      "en-supply-demand",
      "en-social-systems",
    ]);
    for (const atom of optional) {
      expect(atom.curricula).toEqual([
        expect.objectContaining({
          provider: "zam-academy",
          subject: "wirtschaft-recht-realschule-9",
          topic_code: "lb5",
        }),
      ]);
      for (const item of atom.practice_items) expect(item.language).toBe("en");
    }
  });

  it("links every card to its lesson and keeps two or three single-point cards per lesson", () => {
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(atom.practice_items.length).toBeGreaterThanOrEqual(2);
      expect(atom.practice_items.length).toBeLessThanOrEqual(3);
      expect(atom.practice_items[0].tier).toBe("tier1_fast");
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.concept?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("pins the three approved atomic successors and retires the five other questions", () => {
    expect(mapping.approved).toBe("2026-10-22");
    expect(mapping.source).toContain("Thomas");
    expect(mapping.rows).toHaveLength(8);
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
    expect(declared).toHaveLength(3);
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
    const userId = "wr9-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-wr9-"));
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

    it("enrols all 150 cards as one topic and preserves every schedule on repeat", async () => {
      const result = await enrolBundledCell(db, userId, CELL_ID);
      expect(result).toMatchObject({ success: true, cardsCreated: 150 });
      expect(result.alreadyEnrolled).toBe(false);
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves three whole histories, retains five retired histories and starts the other cards unlearned", async () => {
      await installKvtTile(db, legacy);
      const originals = legacy.atoms.flatMap((atom) => atom.practice_items);
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
      expect(await queue(RETIRED, due)).toHaveLength(5);
      const enrolled = await enrolBundledCell(db, userId, CELL_ID);
      expect(enrolled).toMatchObject({ success: true, cardsReused: 3 });
      const after = await snapshot();
      expect(after.reviews).toHaveLength(16);
      const expected = (id: string) =>
        REPLACEMENTS[id] ? bySlug.get(REPLACEMENTS[id])!.id : id;
      for (const card of before.cards) {
        const next = after.cards.find((candidate) => candidate.id === card.id)!;
        expect(withoutToken(next)).toEqual(withoutToken(card));
        expect(next.token_id).toBe(expected(String(card.token_id)));
      }
      for (const entry of before.reviews) {
        const next = after.reviews.find(
          (candidate) => candidate.id === entry.id,
        )!;
        expect(withoutToken(next)).toEqual(withoutToken(entry));
        expect(next.token_id).toBe(expected(String(entry.token_id)));
      }
      for (const original of originals)
        expect(
          (await getTokenById(db, original.id))?.deprecated_at,
        ).toBeTruthy();
      expect(await queue(RETIRED, due)).toHaveLength(0);
      const successors = Object.values(REPLACEMENTS).map(
        (slug) => bySlug.get(slug)!.id,
      );
      expect(await queue(successors, due)).toHaveLength(3);
      // zam-core adds only one more card to an atom on which the learner
      // already holds a card, per enrolment: the three atoms with a moved
      // history get their remaining tier 2 card with the next enrolment.
      const oldCardIds = new Set(before.cards.map((card) => card.id));
      const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
      expect(fresh).toHaveLength(items.length - 3 - 3);
      expect(enrolled.cardsCreated).toBe(items.length - 3 - 3);
      const second = await enrolBundledCell(db, userId, CELL_ID);
      expect(second.cardsCreated).toBe(3);
      const complete = await snapshot();
      expect(complete.reviews).toEqual(after.reviews);
      // Every item of the cell holds a card; the three moved ones are the old
      // cards, the retired five stay on their old tokens.
      expect(complete.cards).toHaveLength(items.length + RETIRED.length);
      for (const card of complete.cards.filter(
        (candidate) => !oldCardIds.has(candidate.id),
      ))
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
      expect(await snapshot()).toEqual(complete);
    });

    it.each(Object.keys(REPLACEMENTS))(
      "refuses to combine two reviewed histories for %s",
      async (old) => {
        // The cell as first published (2026.10.1), before any replaces.
        const published = structuredClone(tile) as KvtTile;
        published.version = "2026.10.1";
        delete published.retired_items;
        for (const atom of published.atoms)
          for (const item of atom.practice_items) delete item.replaces;
        await installKvtTile(db, published);
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
