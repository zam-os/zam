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
import legacyRaw from "../fixtures/legacy/de-by-realschule-9-informatik-algorithmen-strukturen-kvt.json" with {
  type: "json",
};
import algorithmenMappingRaw from "../fixtures/legacy/zam-academy-algorithmen-replaces-de-by.json" with {
  type: "json",
};
import datennetzeMappingRaw from "../fixtures/legacy/zam-academy-datennetze-replaces-de-by.json" with {
  type: "json",
};

// The old algorithms/networks cell split into two independent Academy cells
// (zam-os/zam-academy#18). Both replaces-de-by.json files are copied
// unchanged from zam-os/zam-academy@c61750f. Thomas approved the joint
// row-by-row mapping on 2026-10-21: 4 A, 1 B, 3 C.
const LEGACY_ID = "de-by:realschule-9-informatik-algorithmen-strukturen";
const LEGACY_DIR = join(__dirname, "../fixtures/legacy");
const legacy = legacyRaw as unknown as KvtTile;

interface MappingRow {
  de_by_cell: string;
  de_by_id: string;
  category: "A" | "B" | "C";
  academy_slug: string | null;
}
interface Mapping {
  approved: string;
  joint_migration: { predecessor: string; successors: string[] };
  sources: Array<{ file: string; tile_id: string; sha256: string }>;
  rows: MappingRow[];
}

const PACKAGES = [
  {
    app: "algorithmen",
    module: "it-2.6.1",
    lessons: 20,
    mapping: algorithmenMappingRaw as unknown as Mapping,
  },
  {
    app: "datennetze",
    module: "it-2.5.1",
    lessons: 19,
    mapping: datennetzeMappingRaw as unknown as Mapping,
  },
].map((entry) => {
  const id = `zam-academy:${entry.app}`;
  const tile = getBundledCellTile(id)!;
  const items = tile.atoms.flatMap((atom) => atom.practice_items);
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const moved = entry.mapping.rows.filter((row) => row.category !== "C");
  return {
    ...entry,
    id,
    url: `https://academy.zam-os.org/${entry.app}/`,
    tile,
    items,
    replacements: Object.fromEntries(
      moved.map((row) => [row.de_by_id, bySlug.get(row.academy_slug!)!.id]),
    ) as Record<string, string>,
    retired: entry.mapping.rows
      .filter((row) => row.category === "C")
      .map((row) => row.de_by_id),
  };
});
const [ALGORITHMEN, DATENNETZE] = PACKAGES;
const ROWS = PACKAGES.flatMap((entry) => entry.mapping.rows);
const REPLACEMENTS: Record<string, string> = Object.assign(
  {},
  ...PACKAGES.map((entry) => entry.replacements),
);
const OLD_IDS = legacy.atoms.flatMap((atom) =>
  atom.practice_items.map((item) => item.id),
);
const ownerOf = (oldId: string) =>
  PACKAGES.find((entry) =>
    entry.mapping.rows.some((row) => row.de_by_id === oldId),
  )!;

const itScope = (grade: number, track?: string, subject = "it") => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject,
  ...(track ? { track } : {}),
});
const scopeIds = (scope: Parameters<typeof findBundledCellsForScope>[0]) =>
  findBundledCellsForScope(scope).map((cell) => cell.id);

describe("ZAM Academy IT cells: Algorithmen and Datennetze", () => {
  it("bundles both published cells and retires the old IT cell from discovery", () => {
    expect(getBundledCell(ALGORITHMEN.id)).toMatchObject({
      title: "Algorithmen und Programmieren (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 20,
    });
    expect(getBundledCell(DATENNETZE.id)).toMatchObject({
      title: "Datennetze und Internet (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 19,
    });
    expect(ALGORITHMEN.items).toHaveLength(40);
    expect(DATENNETZE.items).toHaveLength(38);
    for (const entry of PACKAGES) expect(entry.tile.version).toBe("2026.10.1");

    expect(getBundledCell(LEGACY_ID)).toBeUndefined();
    expect(getBundledCellTile(LEGACY_ID)).toBeUndefined();
    for (const { mapping } of PACKAGES) {
      expect(mapping.joint_migration).toEqual({
        predecessor: LEGACY_ID,
        successors: PACKAGES.map((entry) => entry.id),
        note: expect.any(String),
      });
      const [source] = mapping.sources;
      expect(source.tile_id).toBe(LEGACY_ID);
      // `file` points into the Academy repository; ZAM keeps the same bytes
      // in tests/fixtures/legacy/. The hash decides.
      expect(
        createHash("sha256")
          .update(
            readFileSync(join(LEGACY_DIR, source.file.split("/").at(-1)!)),
          )
          .digest("hex"),
      ).toBe(source.sha256);
    }
  });

  it("is offered at every Realschule IT position, for both branches, and nowhere else", () => {
    for (const grade of [5, 6, 7, 8, 9, 10])
      for (const track of [undefined, "wpfg1", "I", "wpfg2-3", "II_III"])
        for (const subject of ["it", "informatik"])
          expect(scopeIds(itScope(grade, track, subject))).toEqual(
            expect.arrayContaining([ALGORITHMEN.id, DATENNETZE.id]),
          );
    for (const entry of PACKAGES) {
      expect(
        scopeIds({ ...itScope(9), schoolType: "gymnasium" }),
      ).not.toContain(entry.id);
      expect(scopeIds({ ...itScope(9), subject: "physik" })).not.toContain(
        entry.id,
      );
    }
  });

  it("covers its module only in part, so the generic importer stays available", () => {
    // Grades 6 to 8 keep their school cells and grade 9 its SQL cell; all of
    // them name the grade. Grades 5 and 10 have only grade-less modules,
    // including the Informatik-10 extensions; the school chooses their order.
    for (const grade of [6, 7, 8, 9])
      expect(
        needsGenericCurriculumImport(itScope(grade)),
        `grade ${grade}`,
      ).toBe(false);
    for (const grade of [5, 10]) {
      expect(scopeIds(itScope(grade))).toEqual(
        expect.arrayContaining([ALGORITHMEN.id, DATENNETZE.id]),
      );
      expect(
        needsGenericCurriculumImport(itScope(grade)),
        `grade ${grade}`,
      ).toBe(true);
    }
    // A position without a grade is covered by any fitting cell, as before.
    expect(
      needsGenericCurriculumImport({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        subject: "it",
      }),
    ).toBe(false);
  });

  it("binds each lesson to its IT module without a grade, branch or exam claim", () => {
    for (const entry of PACKAGES) {
      expect(entry.tile.atoms).toHaveLength(entry.lessons);
      for (const atom of entry.tile.atoms) {
        expect(atom.source_link?.startsWith(`${entry.url}#lesson=`)).toBe(true);
        expect(atom.curricula?.[0]).toMatchObject({
          provider: "zam-academy",
          subject: entry.app,
        });
        const official = atom.curricula?.filter(
          (binding) => binding.provider === "lehrplanplus-bayern",
        );
        // The HTTPS extension belongs to Datennetze II and has no binding.
        if (atom.source_link === `${entry.url}#lesson=net-https`) {
          expect(official).toEqual([]);
          continue;
        }
        expect(official).toEqual([
          {
            provider: "lehrplanplus-bayern",
            school_type: "realschule",
            subject: "it",
            topic_code: entry.module,
            topic_title: expect.any(String),
          },
        ]);
        expect(atom.practice_items).toHaveLength(2);
        for (const item of atom.practice_items) {
          expect(item.source_link).toBe(atom.source_link);
          expect(item.language).toBe("de");
        }
      }
    }
  });

  it("pins exactly the approved 4 A / 1 B successors and retires the 3 C items", () => {
    for (const { mapping } of PACKAGES)
      expect(mapping.approved).toBe("2026-10-21");
    const count = (category: MappingRow["category"]) =>
      ROWS.filter((row) => row.category === category).length;
    expect([count("A"), count("B"), count("C")]).toEqual([4, 1, 3]);
    expect(ROWS.map((row) => row.de_by_id).sort()).toEqual([...OLD_IDS].sort());
    for (const row of ROWS) expect(row.de_by_cell).toBe(LEGACY_ID);
    for (const entry of PACKAGES) {
      const declared = entry.items.flatMap((item) =>
        (item.replaces ?? []).map((oldId) => [oldId, item.id]),
      );
      expect(Object.fromEntries(declared)).toEqual(entry.replacements);
      expect(entry.tile.retired_items?.map((item) => item.id).sort()).toEqual(
        [...entry.retired].sort(),
      );
    }
    expect(new Set(Object.values(REPLACEMENTS)).size).toBe(5);
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "it-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-it-"));
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
    async function activeOldItems(now: Date) {
      return (
        await buildReviewQueue(db, {
          userId,
          tokenIds: OLD_IDS,
          now,
          buryNewSiblings: false,
          buryReviewSiblings: false,
        })
      ).items.map((item) => item.tokenId);
    }

    it("enrols each cell as its own topic without duplicating on repeat", async () => {
      for (const entry of PACKAGES) {
        expect(await enrolBundledCell(db, userId, entry.id)).toMatchObject({
          success: true,
          cardsCreated: entry.items.length,
        });
        const before = await snapshot();
        expect(await enrolBundledCell(db, userId, entry.id)).toMatchObject({
          cardsCreated: 0,
          alreadyEnrolled: true,
        });
        expect(await snapshot()).toEqual(before);
      }
      const topics = await listLibraryTopics(db, userId);
      for (const entry of PACKAGES)
        expect(topics.find((topic) => topic.key === entry.url)).toMatchObject({
          itemCount: entry.items.length,
          heldCount: entry.items.length,
        });
    });

    it.each([
      ["Algorithmen first", PACKAGES],
      ["Datennetze first", [...PACKAGES].reverse()],
    ])(
      "%s: moves five whole histories, keeps three intact and leaves the other cell's old items alone",
      async (_order, order) => {
        await installKvtTile(db, legacy);
        for (const [index, oldId] of OLD_IDS.entries())
          await review(oldId, index);
        const before = await snapshot();
        expect(before.cards).toHaveLength(8);
        expect(before.reviews).toHaveLength(16);
        const due = new Date(
          Math.max(
            ...before.cards.map((card) => Date.parse(String(card.due_at))),
          ),
        );
        due.setUTCDate(due.getUTCDate() + 1);
        expect(await activeOldItems(due)).toHaveLength(8);

        const enrolled: typeof PACKAGES = [];
        for (const entry of order) {
          const moved = Object.keys(entry.replacements).length;
          expect(await enrolBundledCell(db, userId, entry.id)).toMatchObject({
            success: true,
            cardsCreated: entry.items.length - moved,
            cardsReused: moved,
          });
          enrolled.push(entry);
          // Old items of a cell not yet taken up stay in active review.
          const pending = OLD_IDS.filter(
            (oldId) => !enrolled.includes(ownerOf(oldId)),
          );
          expect((await activeOldItems(due)).sort()).toEqual(pending.sort());
          for (const oldId of OLD_IDS)
            expect(
              Boolean((await getTokenById(db, oldId))?.deprecated_at),
              oldId,
            ).toBe(enrolled.includes(ownerOf(oldId)));
        }

        const after = await snapshot();
        expect(after.cards).toHaveLength(8 + 36 + 37);
        expect(after.reviews).toHaveLength(16);
        const expected = (id: string) => REPLACEMENTS[id] ?? id;
        for (const card of before.cards) {
          const next = after.cards.find(
            (candidate) => candidate.id === card.id,
          )!;
          expect(withoutToken(next)).toEqual(withoutToken(card));
          expect(next.token_id).toBe(expected(String(card.token_id)));
        }
        for (const log of before.reviews) {
          const next = after.reviews.find(
            (candidate) => candidate.id === log.id,
          )!;
          expect(withoutToken(next)).toEqual(withoutToken(log));
          expect(next.token_id).toBe(expected(String(log.token_id)));
        }
        const oldCardIds = new Set(before.cards.map((card) => card.id));
        for (const card of after.cards.filter(
          (card) => !oldCardIds.has(card.id),
        )) {
          expect(card.state).toBe("new");
          expect(card.stability).toBe(0);
          expect(card.last_review_at).toBeNull();
        }
        for (const entry of PACKAGES)
          expect(await enrolBundledCell(db, userId, entry.id)).toMatchObject({
            cardsCreated: 0,
            alreadyEnrolled: true,
          });
        expect(await snapshot()).toEqual(after);
      },
    );

    it.each(Object.keys(REPLACEMENTS))(
      "refuses to combine two reviewed histories for %s",
      async (oldId) => {
        const entry = ownerOf(oldId);
        await installKvtTile(db, entry.tile);
        await installKvtTile(db, legacy);
        await review(oldId, 1);
        await review(REPLACEMENTS[oldId], 2);
        const before = await snapshot();
        await expect(enrolBundledCell(db, userId, entry.id)).rejects.toThrow(
          /holds a card on both|merge/i,
        );
        expect(await snapshot()).toEqual(before);
      },
    );
  });
});
