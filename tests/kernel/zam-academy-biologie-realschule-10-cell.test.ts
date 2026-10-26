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
import legacyGenetik from "../fixtures/legacy/de-by-realschule-9-biologie-genetik-vererbung-kvt.json" with {
  type: "json",
};
import legacyNerven from "../fixtures/legacy/de-by-realschule-9-biologie-nervensystem-sinne-kvt.json" with {
  type: "json",
};
import legacyEvolution from "../fixtures/legacy/de-by-realschule-10-biologie-evolution-abstammung-kvt.json" with {
  type: "json",
};
import mappingRaw from "../fixtures/legacy/zam-academy-biologie-realschule-10-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:biologie-realschule-10";
const APP = "https://academy.zam-os.org/biologie-realschule-10/";
const LEGACY_DIR = join(__dirname, "../fixtures/legacy");
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacyTiles = [
  legacyGenetik,
  legacyNerven,
  legacyEvolution,
] as unknown as KvtTile[];

// replaces-de-by.json, copied unchanged from zam-os/zam-academy@6e8e603.
// Thomas approved this row-by-row mapping on 2026-10-21 after reviewing
// zam-os/zam-academy#16: 10 A, 1 B, 15 C.
interface MappingRow {
  de_by_cell: string;
  de_by_id: string;
  category: "A" | "B" | "C";
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
    .filter((row) => row.category !== "C")
    .map((row) => [row.de_by_id, row.academy_slug!]),
);
const RETIRED = mapping.rows
  .filter((row) => row.category === "C")
  .map((row) => row.de_by_id);
const WHOLE = "01K4B9G0000000000000000J04";

const LESSONS: Record<string, string[]> = {
  lb1: [
    "bio-fragen",
    "bio-untersuchung",
    "bio-modelle",
    "bio-quellen",
    "bio-argumentieren",
  ],
  lb2: [
    "bio-chromosomen",
    "bio-dna-bau",
    "bio-replikation",
    "bio-gene-proteine",
    "bio-proteinbiosynthese",
    "bio-mitose",
    "bio-meiose",
    "bio-allele",
    "bio-mendel-uniform",
    "bio-mendel-spaltung",
    "bio-mendel-unabhaengigkeit",
    "bio-stammbaum",
    "bio-mutation",
    "bio-erbkrankheiten",
    "bio-pcr",
    "bio-gentechnik",
    "bio-stammzellen",
    "bio-zuechtung",
  ],
  lb3: [
    "bio-oeko-system",
    "bio-stoffkreislauf",
    "bio-kunststoffe",
    "bio-oeko-wandel",
    "bio-vielfalt",
    "bio-schutz",
    "bio-oekobilanz",
  ],
  lb4: [
    "bio-vorsorge",
    "bio-praenatal",
    "bio-einfluesse",
    "bio-elternschaft",
    "bio-leben-ethik",
    "bio-reproduktionsmedizin",
    "bio-beziehung",
  ],
};
// Refreshers from Biologie 7 and 8; they carry no official binding.
const PRIOR: Record<string, string[]> = {
  "vorwissen-nerven": [
    "bio-vorwissen-neuron",
    "bio-vorwissen-reflex",
    "bio-vorwissen-synapse",
    "bio-vorwissen-nervensystem",
  ],
  "vorwissen-evolution": [
    "bio-vorwissen-selektion",
    "bio-vorwissen-homologie",
    "bio-vorwissen-fossilien",
    "bio-vorwissen-bipedie",
    "bio-vorwissen-stammgeschichte",
  ],
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scopeIds = (schoolType: string, grade: number, track?: string) =>
  findBundledCellsForScope({
    provider: "lehrplanplus-bayern",
    schoolType,
    grade,
    subject: "biologie",
    ...(track ? { track } : {}),
  }).map((cell) => cell.id);

describe("ZAM Academy Biologie 10 Realschule cell", () => {
  it("bundles the published cell and retires the three legacy cells from discovery", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Biologie 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 46,
    });
    expect(items).toHaveLength(93);
    expect(mapping.sources.map((source) => source.tile_id)).toEqual(
      legacyTiles.map((legacy) => legacy.tile_id),
    );
    for (const source of mapping.sources) {
      expect(getBundledCell(source.tile_id)).toBeUndefined();
      expect(getBundledCellTile(source.tile_id)).toBeUndefined();
      // `file` is relative to the Academy package (biologie-realschule-10/);
      // ZAM keeps the same bytes in tests/fixtures/legacy/. The hash decides.
      const file = source.file.replace(/^tests\/fixtures\//, "");
      expect(
        createHash("sha256")
          .update(readFileSync(join(LEGACY_DIR, file)))
          .digest("hex"),
      ).toBe(source.sha256);
    }
  });

  it("is the common Biologie 10 cell for every branch and claims no other grade", () => {
    for (const track of [
      undefined,
      "I",
      "wpfg1",
      "II_III",
      "wpfg2-3",
      "II",
      "III",
      "IIIa",
      "IIIb",
    ]) {
      expect(scopeIds("realschule", 10, track)).toEqual([CELL_ID]);
      expect(
        needsGenericCurriculumImport({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 10,
          subject: "biologie",
          ...(track ? { track } : {}),
        }),
      ).toBe(false);
    }
    // The refreshers do not claim earlier grades. Biologie 8 has its own
    // Academy cell beside its two unchanged school cells. There is no Biologie 9.
    for (const grade of [5, 6, 7]) {
      const ids = scopeIds("realschule", grade);
      expect(ids).not.toContain(CELL_ID);
      expect(ids.every((id) => id.startsWith("de-by:"))).toBe(true);
      if (grade >= 7) expect(ids).toHaveLength(2);
    }
    expect(scopeIds("realschule", 8).sort()).toEqual(
      [
        "zam-academy:biologie-realschule-8",
        "de-by:realschule-8-biologie-atmung-blutkreislauf",
        "de-by:realschule-8-biologie-ernaehrung-verdauung",
      ].sort(),
    );
    expect(scopeIds("realschule", 9)).toEqual([]);
    expect(scopeIds("gymnasium", 10)).not.toContain(CELL_ID);
  });

  it("binds the 37 core lessons to lb1–lb4 and leaves the nine refreshers unbound", () => {
    expect(tile.atoms.map((atom) => lessonId(atom.source_link!))).toEqual([
      ...Object.values(LESSONS).flat(),
      ...Object.values(PRIOR).flat(),
    ]);
    for (const [topic, lessons] of Object.entries({ ...LESSONS, ...PRIOR })) {
      const atoms = tile.atoms.filter(
        (atom) => atom.curricula?.[0]?.topic_code === topic,
      );
      expect(atoms.map((atom) => lessonId(atom.source_link!))).toEqual(lessons);
      for (const atom of atoms) {
        expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
        expect(atom.curricula?.[0]).toMatchObject({
          provider: "zam-academy",
          subject: "biologie-realschule-10",
        });
        const official =
          atom.curricula?.filter(
            (binding) => binding.provider === "lehrplanplus-bayern",
          ) ?? [];
        if (topic in PRIOR) {
          expect(official).toEqual([]);
          expect(atom.curricula).toHaveLength(1);
          expect(atom.curricula?.[0].grade).toBeUndefined();
        } else {
          expect(official).toHaveLength(1);
          expect(official[0]).toMatchObject({
            school_type: "realschule",
            grade: 10,
            subject: "biologie",
            topic_code: topic,
            exam_relevant: true,
          });
          expect(official[0].track).toBeUndefined();
        }
        for (const item of atom.practice_items) {
          expect(item.source_link).toBe(atom.source_link);
          expect(item.language).toBe("de");
        }
      }
    }
    const prior = Object.values(PRIOR).flat();
    expect(
      tile.atoms.filter((atom) => !prior.includes(lessonId(atom.source_link!))),
    ).toHaveLength(37);
    expect(
      tile.atoms.filter((atom) => prior.includes(lessonId(atom.source_link!))),
    ).toHaveLength(9);
  });

  it("pins exactly the approved 10 A and 1 B successors and retires the 15 C items", () => {
    expect(mapping.approved).toBe("2026-10-21");
    const count = (category: MappingRow["category"]) =>
      mapping.rows.filter((row) => row.category === category).length;
    expect([count("A"), count("B"), count("C")]).toEqual([10, 1, 15]);
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(declared).toHaveLength(11);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(tile.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    const originals = legacyTiles.flatMap((old) =>
      old.atoms.flatMap((atom) =>
        atom.practice_items.map((item) => ({ ...item, cell: old.tile_id })),
      ),
    );
    expect(originals).toHaveLength(26);
    expect(
      mapping.rows.map((row) => [row.de_by_id, row.de_by_cell]).sort(),
    ).toEqual(originals.map((item) => [item.id, item.cell]).sort());
    for (const row of mapping.rows.filter((row) => row.category === "A")) {
      expect(originals.find((item) => item.id === row.de_by_id)?.tier).toBe(
        "tier1_fast",
      );
      expect(bySlug.get(row.academy_slug!)?.tier).toBe("tier1_fast");
    }
    // The single B row keeps the whole DNA question word for word.
    expect(
      mapping.rows.filter((row) => row.category === "B").map((r) => r.de_by_id),
    ).toEqual([WHOLE]);
    const whole = originals.find((item) => item.id === WHOLE)!;
    const successor = bySlug.get(REPLACEMENTS[WHOLE])!;
    expect(successor.question).toBe(whole.question);
    expect(successor.concept).toBe(whole.concept);
    expect(successor.sample_solution).toEqual(whole.sample_solution);
    expect(successor.tier).toBe("tier2_synthesis");
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "biologie-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-biologie-"));
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

    it("enrols all 93 cards as one topic without duplicating or rescheduling on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 93,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 93,
        heldCount: 93,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves eleven whole histories, keeps fifteen corrected histories intact and retires their old text", async () => {
      for (const legacy of legacyTiles) await installKvtTile(db, legacy);
      const originals = legacyTiles.flatMap((legacy) =>
        legacy.atoms.flatMap((atom) => atom.practice_items),
      );
      for (const [index, item] of originals.entries())
        await review(item.id, index);
      const before = await snapshot();
      expect(before.cards).toHaveLength(26);
      expect(before.reviews).toHaveLength(52);
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
      expect(await retiredQueue()).toHaveLength(15);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 82,
        cardsReused: 11,
      });
      const after = await snapshot();
      expect(after.cards).toHaveLength(108);
      expect(after.reviews).toHaveLength(52);
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

    it.each([
      "01K4B9G0000000000000000J01",
      WHOLE,
      "01K4B9N0000000000000000J01",
      "01K4E0B0000000000000000J01",
    ])("refuses to combine two reviewed histories for %s", async (old) => {
      await installKvtTile(db, tile);
      for (const legacy of legacyTiles) await installKvtTile(db, legacy);
      await review(old, 1);
      await review(bySlug.get(REPLACEMENTS[old])!.id, 2);
      const before = await snapshot();
      await expect(enrolBundledCell(db, userId, CELL_ID)).rejects.toThrow(
        /holds a card on both|merge/i,
      );
      expect(await snapshot()).toEqual(before);
    });
  });
});
