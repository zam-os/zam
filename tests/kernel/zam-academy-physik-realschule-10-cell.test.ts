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
import legacyInduktion from "../fixtures/legacy/de-by-realschule-10-physik-induktion-wechselstrom-kvt.json" with {
  type: "json",
};
import legacyKernphysik from "../fixtures/legacy/de-by-realschule-10-physik-kernphysik-strahlung-kvt.json" with {
  type: "json",
};
import mappingRaw from "../fixtures/legacy/zam-academy-physik-realschule-10-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:physik-realschule-10";
const APP = "https://academy.zam-os.org/physik-realschule-10/";
const LEGACY_DIR = join(__dirname, "../fixtures/legacy");
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacyTiles = [legacyInduktion, legacyKernphysik] as unknown as KvtTile[];

// replaces-de-by.json, copied unchanged from zam-os/zam-academy@eaf7b3c.
// Thomas approved this row-by-row mapping on 2026-10-21 for
// zam-os/zam-academy#17: 7 A, 9 C.
interface MappingRow {
  de_by_cell: string;
  de_by_id: string;
  category: "A" | "C";
  academy_slug: string | null;
}
const mapping = mappingRaw as unknown as {
  approved: string;
  sources: Array<{
    file: string;
    tile_id: string;
    version: string;
    sha256: string;
  }>;
  rows: MappingRow[];
};
const REPLACEMENTS: Record<string, string> = Object.fromEntries(
  mapping.rows
    .filter((row) => row.category === "A")
    .map((row) => [row.de_by_id, row.academy_slug!]),
);
const RETIRED = mapping.rows
  .filter((row) => row.category === "C")
  .map((row) => row.de_by_id);

// The official Lernbereiche of each Wahlpflichtfächergruppe and the lessons
// that cover them. Zweig I has 34 core lessons, II/III 25; 24 are shared.
const SHARED: Record<string, string[]> = {
  lb1: [
    "me-bewegung",
    "me-beschleunigung",
    "me-freier-fall",
    "me-kraft",
    "me-energie",
    "me-anhalteweg",
  ],
  lb2: [
    "el-reihe",
    "el-parallel",
    "el-induktion",
    "el-lenz",
    "el-generator",
    "el-trafo",
    "el-fernleitung",
  ],
  lb3: [
    "ke-entdeckung",
    "ke-kern",
    "ke-strahlung",
    "ke-nachweis",
    "ke-zerfall",
    "ke-halbwertszeit",
    "ke-schutz-nutzen",
  ],
  lb4: ["en-kraftwerke", "en-kwk", "en-speicher", "en-urteil"],
};
const ONLY_I: Record<string, string[]> = {
  lb1: ["me-impuls", "me-stoesse"],
  lb2: ["el-messen", "el-messbereich", "el-uvw"],
  lb3: [
    "ke-quarks",
    "ke-zerfallsgesetz",
    "ke-bindung",
    "ke-kettenreaktion",
    "ke-dosis",
  ],
  lb4: [],
};
const ONLY_II_III: Record<string, string[]> = {
  lb1: [],
  lb2: [],
  lb3: [],
  lb4: ["en-waermekraftmaschine"],
};
// Optional enrichment for both branches; no official binding.
const OPTIONAL = "ex-effektivwert";
const TRACKS: Record<"I" | "II_III", Record<string, string[]>> = {
  I: Object.fromEntries(
    Object.entries(SHARED).map(([lb, lessons]) => [
      lb,
      [...lessons, ...ONLY_I[lb]],
    ]),
  ),
  II_III: Object.fromEntries(
    Object.entries(SHARED).map(([lb, lessons]) => [
      lb,
      [...lessons, ...ONLY_II_III[lb]],
    ]),
  ),
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scopeIds = (schoolType: string, grade: number, track?: string) =>
  findBundledCellsForScope({
    provider: "lehrplanplus-bayern",
    schoolType,
    grade,
    subject: "physik",
    ...(track ? { track } : {}),
  }).map((cell) => cell.id);

describe("ZAM Academy Physik 10 Realschule cell", () => {
  it("bundles the published cell and retires the two legacy cells from discovery", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Physik 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 36,
    });
    expect(items).toHaveLength(72);
    expect(mapping.sources.map((source) => source.tile_id)).toEqual(
      legacyTiles.map((legacy) => legacy.tile_id),
    );
    for (const source of mapping.sources) {
      expect(getBundledCell(source.tile_id)).toBeUndefined();
      expect(getBundledCellTile(source.tile_id)).toBeUndefined();
      // `file` is relative to the Academy package (physik-realschule-10/);
      // ZAM keeps the same bytes in tests/fixtures/legacy/. The hash decides.
      const file = source.file.replace(/^tests\/fixtures\//, "");
      expect(
        createHash("sha256")
          .update(readFileSync(join(LEGACY_DIR, file)))
          .digest("hex"),
      ).toBe(source.sha256);
    }
  });

  it("is the Physik 10 cell for both branches and claims no other grade", () => {
    for (const track of [
      undefined,
      "I",
      "wpfg1",
      "II_III",
      "wpfg2-3",
      "II",
      "III",
    ]) {
      expect(scopeIds("realschule", 10, track)).toEqual([CELL_ID]);
      expect(
        needsGenericCurriculumImport({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 10,
          subject: "physik",
          ...(track ? { track } : {}),
        }),
      ).toBe(false);
    }
    for (const grade of [7, 8, 9])
      expect(scopeIds("realschule", grade)).not.toContain(CELL_ID);
    expect(scopeIds("gymnasium", 10)).not.toContain(CELL_ID);
  });

  it("binds 34 lessons to Zweig I and 25 to II/III, each with its own Lernbereich", () => {
    for (const [track, topics] of Object.entries(TRACKS)) {
      const bound = tile.atoms.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.track === track,
        ),
      );
      expect(bound).toHaveLength(track === "I" ? 34 : 25);
      for (const [topic, lessons] of Object.entries(topics)) {
        const atoms = bound.filter((atom) =>
          atom.curricula?.some(
            (binding) =>
              binding.provider === "lehrplanplus-bayern" &&
              binding.track === track &&
              binding.topic_code === topic,
          ),
        );
        expect(atoms.map((atom) => lessonId(atom.source_link!)).sort()).toEqual(
          [...lessons].sort(),
        );
        for (const atom of atoms)
          expect(
            atom.curricula?.find(
              (binding) =>
                binding.provider === "lehrplanplus-bayern" &&
                binding.track === track,
            ),
          ).toMatchObject({
            school_type: "realschule",
            grade: 10,
            subject: "physik",
            exam_relevant: true,
          });
      }
    }
    const optional = tile.atoms.filter(
      (atom) => lessonId(atom.source_link!) === OPTIONAL,
    );
    expect(optional).toHaveLength(1);
    expect(optional[0].curricula).toEqual([
      expect.objectContaining({
        provider: "zam-academy",
        subject: "physik-realschule-10",
        topic_code: "lb2",
      }),
    ]);
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(atom.curricula?.[0]).toMatchObject({
        provider: "zam-academy",
        subject: "physik-realschule-10",
      });
      expect(atom.practice_items).toHaveLength(2);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
        expect(item.tier).toBe("tier1_fast");
      }
    }
  });

  it("pins exactly the approved 7 A successors and retires the 9 C items", () => {
    expect(mapping.approved).toBe("2026-10-21");
    const count = (category: MappingRow["category"]) =>
      mapping.rows.filter((row) => row.category === category).length;
    expect([count("A"), count("C")]).toEqual([7, 9]);
    expect(mapping.rows).toHaveLength(16);
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(declared).toHaveLength(7);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(tile.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    const originals = legacyTiles.flatMap((old) =>
      old.atoms.flatMap((atom) =>
        atom.practice_items.map((item) => ({ ...item, cell: old.tile_id })),
      ),
    );
    expect(originals).toHaveLength(16);
    expect(
      mapping.rows.map((row) => [row.de_by_id, row.de_by_cell]).sort(),
    ).toEqual(originals.map((item) => [item.id, item.cell]).sort());
    for (const row of mapping.rows.filter((row) => row.category === "A")) {
      expect(originals.find((item) => item.id === row.de_by_id)?.tier).toBe(
        "tier1_fast",
      );
      expect(bySlug.get(row.academy_slug!)?.tier).toBe("tier1_fast");
    }
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "physik-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-physik10-"));
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

    it("enrols all 72 cards as one topic without duplicating or rescheduling on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 72,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 72,
        heldCount: 72,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves seven whole histories, keeps nine split or corrected histories intact and retires their old text", async () => {
      for (const legacy of legacyTiles) await installKvtTile(db, legacy);
      const originals = legacyTiles.flatMap((legacy) =>
        legacy.atoms.flatMap((atom) => atom.practice_items),
      );
      for (const [index, item] of originals.entries())
        await review(item.id, index);
      const before = await snapshot();
      expect(before.cards).toHaveLength(16);
      expect(before.reviews).toHaveLength(32);
      const due = new Date(
        Math.max(
          ...before.cards.map((card) => Date.parse(String(card.due_at))),
        ),
      );
      due.setUTCDate(due.getUTCDate() + 1);
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
      expect(await retiredQueue()).toHaveLength(9);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 65,
        cardsReused: 7,
      });
      const after = await snapshot();
      expect(after.cards).toHaveLength(81);
      expect(after.reviews).toHaveLength(32);
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
      for (const card of after.cards.filter(
        (card) => !oldCardIds.has(card.id),
      )) {
        expect(card.state).toBe("new");
        expect(card.stability).toBe(0);
        expect(card.last_review_at).toBeNull();
      }
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });

    // Every A row: Induktion, the optional Effektivwert successor and
    // Kernphysik.
    it.each(Object.keys(REPLACEMENTS))(
      "refuses to combine two reviewed histories for %s",
      async (old) => {
        await installKvtTile(db, tile);
        for (const legacy of legacyTiles) await installKvtTile(db, legacy);
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
