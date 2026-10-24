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
import legacyRaw from "../fixtures/legacy/de-by-realschule-9-englisch-grammatik-syntax-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-englisch-realschule-9-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:englisch-realschule-9";
const APP = "https://academy.zam-os.org/englisch-realschule-9/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacy = legacyRaw as unknown as KvtTile;
// Thomas approved these eight rows for zam-os/zam-academy#38 on 2026-10-24:
// three equal single-point recalls carry their histories, five corrected or
// multi-part recalls retire without transferring mastery. Both source files
// are archived byte-for-byte, independently of the Academy lock.
const REPLACEMENTS: Record<string, string> = {
  "01K4E9G0000000000000000J01": "e9-conditionals-check",
  "01K4E9G0000000000000000J03": "e9-passive-check",
  "01K4E9G0000000000000000J05": "e9-reported-statements-check",
};
const RETIRED = [
  "01K4E9G0000000000000000J02",
  "01K4E9G0000000000000000J04",
  "01K4E9G0000000000000000J06",
  "01K4E9G0000000000000000J07",
  "01K4E9G0000000000000000J08",
];
const OPTIONAL = [
  "e9-conditionals",
  "e9-passive",
  "e9-relative-defining",
  "e9-relative-extra",
];
const STAGES: Record<string, number> = {
  work: 8,
  india: 4,
  australia: 4,
  digital: 5,
  language: 9,
  literature: 6,
  foundations: 4,
};
const scope = (track?: string, grade = 9) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "englisch",
  ...(track ? { track } : {}),
});
function withoutMapping(): KvtTile {
  const earlier = structuredClone(tile) as KvtTile;
  earlier.version = "2026.10.1";
  delete earlier.retired_items;
  for (const atom of earlier.atoms)
    for (const item of atom.practice_items) delete item.replaces;
  return earlier;
}

describe("ZAM Academy Englisch 9 Realschule cell", () => {
  it("bundles the published bytes and removes the partial grammar cell from discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Englisch 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 40,
    });
    expect(items).toHaveLength(80);
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
      "c0155e3ba42f9a86c15ee2238034d2626bff07e7454c6dcbdb60c17729c5a410",
    );
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
      source_repository: "https://github.com/zam-os/zam",
      source_commit: "4ca430dd146de311fda3614264edf550a31e25a1",
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

  it("is offered to every grade-9 Realschule group and to no other grade or school type", () => {
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
    for (const grade of [7, 8, 10])
      expect(
        findBundledCellsForScope(scope("I", grade)).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    expect(
      findBundledCellsForScope({ ...scope("I"), schoolType: "gymnasium" }).map(
        (cell) => cell.id,
      ),
    ).not.toContain(CELL_ID);
  });

  it("covers all five learning areas with 36 core lessons and leaves four refreshers optional", () => {
    const coverage = new Set<string>();
    const core = tile.atoms.filter((atom) => !OPTIONAL.includes(atom.slug));
    expect(core).toHaveLength(36);
    expect(
      tile.atoms.filter((atom) => OPTIONAL.includes(atom.slug)),
    ).toHaveLength(4);
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
        subject: "englisch-realschule-9",
      });
      const official =
        atom.curricula?.filter(
          (binding) => binding.provider === "lehrplanplus-bayern",
        ) ?? [];
      if (OPTIONAL.includes(atom.slug)) {
        expect(official).toHaveLength(0);
        expect(atom.curricula).toHaveLength(1);
      } else {
        expect(official.length).toBeGreaterThan(0);
        for (const binding of official) {
          expect(binding).toMatchObject({
            school_type: "realschule",
            grade: 9,
            subject: "englisch",
          });
          expect(["lb1", "lb2", "lb3", "lb4", "lb5"]).toContain(
            binding.topic_code,
          );
          coverage.add(binding.topic_code);
        }
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

  it("pins exactly the three approved transfers and five retirements", () => {
    expect(mapping.approved).toBe("2026-10-24");
    expect(mapping.status).toBe("approved");
    expect(mapping.source).toContain("Thomas");
    expect(mapping.source).toContain("Freigabe erteile ich");
    expect(mapping.rows).toHaveLength(8);
    expect(
      mapping.rows
        .filter((row) => row.category === "A")
        .map((row) => [row.de_by_id, row.academy_slug])
        .sort(),
    ).toEqual(Object.entries(REPLACEMENTS).sort());
    expect(
      mapping.rows
        .filter((row) => row.category === "C")
        .map((row) => row.de_by_id)
        .sort(),
    ).toEqual([...RETIRED].sort());
    expect(
      items
        .flatMap((item) => (item.replaces ?? []).map((id) => [id, item.slug]))
        .sort(),
    ).toEqual(Object.entries(REPLACEMENTS).sort());
    expect(tile.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    expect(
      mapping.rows
        .map((row) => [row.de_by_id, row.de_by_atom, row.de_by_question])
        .sort(),
    ).toEqual(
      legacy.atoms
        .flatMap((atom) =>
          atom.practice_items.map((item) => [item.id, atom.id, item.question]),
        )
        .sort(),
    );
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "e9-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-e9-"));
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

    it("installs without cards, then enrols all 80 unlearned cards as one topic, idempotently", async () => {
      await installKvtTile(db, tile);
      expect((await snapshot()).cards).toHaveLength(0);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 80,
        alreadyEnrolled: false,
      });
      const before = await snapshot();
      expect(before.cards).toHaveLength(80);
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
        expect.objectContaining({ key: APP, itemCount: 80, heldCount: 80 }),
      ]);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it.each(["first enrolment", "upgrade from an unmapped cell"])(
      "preserves all eight histories during %s and starts 77 other cards unlearned",
      async (mode) => {
        if (mode === "upgrade from an unmapped cell")
          await installKvtTile(db, withoutMapping());
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

        expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
          success: true,
          cardsCreated: 77,
          cardsReused: 3,
        });
        const after = await snapshot();
        expect(after.cards).toHaveLength(85);
        expect(after.reviews).toHaveLength(16);
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
        for (const original of originals) {
          const token = await getTokenById(db, original.id);
          expect(token?.deprecated_at).toBeTruthy();
          if (RETIRED.includes(original.id))
            expect(token?.editorial_state).toBe("deprecated");
        }
        expect(await queue(RETIRED, due)).toHaveLength(0);
        expect(
          await queue(
            Object.values(REPLACEMENTS).map((slug) => bySlug.get(slug)!.id),
            due,
          ),
        ).toHaveLength(3);
        const oldCardIds = new Set(before.cards.map((card) => card.id));
        const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
        expect(fresh).toHaveLength(77);
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
