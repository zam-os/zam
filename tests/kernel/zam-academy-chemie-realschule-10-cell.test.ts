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
import legacyOrganik from "../fixtures/legacy/de-by-realschule-10-chemie-organik-kohlenwasserstoffe-kvt.json" with {
  type: "json",
};
import legacySaeuren from "../fixtures/legacy/de-by-realschule-10-chemie-saeuren-basen-neutralisation-kvt.json" with {
  type: "json",
};
import mappingRaw from "../fixtures/legacy/zam-academy-chemie-realschule-10-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:chemie-realschule-10";
const APP = "https://academy.zam-os.org/chemie-realschule-10/";
const LEGACY_DIR = join(__dirname, "../fixtures/legacy");
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacyTiles = [legacyOrganik, legacySaeuren] as unknown as KvtTile[];

// replaces-de-by.json, copied unchanged from zam-os/zam-academy@88bb6d2.
// Thomas approved this row-by-row mapping on 2026-10-24 for
// zam-os/zam-academy#43: 5 A, 2 B, 9 C. A B successor keeps the whole old
// question, answer and sample solution and is a `replaces` like an A row.
// C rows get no successor and are not retired: those cards stay active.
interface MappingRow {
  de_by_cell: string;
  de_by_id: string;
  category: "A" | "B" | "C";
  academy_slug: string | null;
  action?: string;
}
const mapping = mappingRaw as unknown as {
  approved: string;
  status: string;
  sources: Array<{ file: string; tile_id: string; sha256: string }>;
  rows: MappingRow[];
};
const REPLACEMENTS: Record<string, string> = Object.fromEntries(
  mapping.rows
    .filter((row) => row.category !== "C")
    .map((row) => [row.de_by_id, row.academy_slug!]),
);
const KEPT = mapping.rows
  .filter((row) => row.category === "C")
  .map((row) => row.de_by_id);

// The official Lernbereiche of each Wahlpflichtfächergruppe and the lessons
// bound to them. The Zweige differ in content: Zweig I has 30 lessons, II/III
// 34. Every Wahl-Teilbereich is offered; the teacher picks two.
const TRACKS: Record<"I" | "II_III", Record<string, string[]>> = {
  I: {
    lb1: ["ch-gefahrstoffe", "ch-versuche-planen"],
    lb2: [
      "ch-ph-oxonium",
      "ch-neutralisation",
      "ch-titration",
      "ch-carbonate-metalle",
    ],
    lb3: [
      "ch-kohlenstoff-nachweis",
      "ch-fotosynthese",
      "ch-energiegehalt",
      "ch-rohstoffe",
    ],
    lb4: [
      "ch-addition",
      "ch-substitution",
      "ch-oxidationszahlen-organisch",
      "ch-alkanole-oxidation",
      "ch-alkanone",
      "ch-estersynthese",
      "ch-ester-eigenschaften",
    ],
    lb5: [
      "ch-aminosaeuren",
      "ch-peptide",
      "ch-proteinstruktur",
      "ch-glucose-fructose",
      "ch-saccharose-polysaccharide",
      "ch-glycerin",
      "ch-fette",
    ],
    lb6: [
      "ch-polymerisation",
      "ch-polykondensation",
      "ch-kunststoffklassen",
      "ch-silikone",
      "ch-kunststoffabfall",
      "ch-biokunststoff-oekobilanz",
    ],
  },
  II_III: {
    lb1: ["ch-gefahrstoffe", "ch-versuche-planen"],
    lb2: [
      "ch-ionenbildung",
      "ch-redox-teilgleichungen",
      "ch-salzformeln",
      "ch-gitterenergie",
      "ch-hydratation",
    ],
    lb3: [
      "ch-saure-alkalische-loesungen",
      "ch-broensted",
      "ch-protolyse-saeurereste",
      "ch-neutralisation",
      "ch-carbonate-metalle",
    ],
    lb4: [
      "ch-kohlenstoff-nachweis",
      "ch-fotosynthese",
      "ch-energiegehalt",
      "ch-rohstoffe",
    ],
    lb5: [
      "ch-addition",
      "ch-oxidationszahlen-organisch",
      "ch-alkanole-oxidation",
      "ch-estersynthese",
      "ch-ester-eigenschaften",
    ],
    // Wahlbereich: 6.1 Redoxanwendungen, 6.2–6.4 Biomoleküle, 6.5 Kunststoffe.
    lb6: [
      "ch-aminosaeuren",
      "ch-peptide",
      "ch-proteinstruktur",
      "ch-glucose-fructose",
      "ch-saccharose-polysaccharide",
      "ch-glycerin",
      "ch-fette",
      "ch-polymerisation",
      "ch-polykondensation",
      "ch-kunststoffklassen",
      "ch-kunststoffabfall",
      "ch-batterie-akku",
      "ch-brennstoffzelle",
    ],
  },
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scopeIds = (schoolType: string, grade: number, track?: string) =>
  findBundledCellsForScope({
    provider: "lehrplanplus-bayern",
    schoolType,
    grade,
    subject: "chemie",
    ...(track ? { track } : {}),
  }).map((cell) => cell.id);

describe("ZAM Academy Chemie 10 Realschule cell", () => {
  it("bundles the published cell and takes the two school cells out of discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Chemie 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 40,
    });
    expect(items).toHaveLength(100);
    expect(items.filter((item) => item.tier === "tier1_fast")).toHaveLength(80);
    expect(mapping.sources.map((source) => source.tile_id)).toEqual(
      legacyTiles.map((legacy) => legacy.tile_id),
    );
    for (const source of mapping.sources) {
      expect(getBundledCell(source.tile_id)).toBeUndefined();
      expect(getBundledCellTile(source.tile_id)).toBeUndefined();
      // `file` is relative to the Academy package (chemie-realschule-10/);
      // ZAM keeps the same bytes in tests/fixtures/legacy/. The hash decides.
      const file = source.file.replace(/^tests\/fixtures\//, "");
      expect(
        createHash("sha256")
          .update(readFileSync(join(LEGACY_DIR, file)))
          .digest("hex"),
      ).toBe(source.sha256);
    }
  });

  it("is the Chemie 10 cell for both branches and claims no other grade", () => {
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
          subject: "chemie",
          ...(track ? { track } : {}),
        }),
      ).toBe(false);
    }
    for (const grade of [8, 9])
      expect(scopeIds("realschule", grade)).not.toContain(CELL_ID);
    expect(scopeIds("gymnasium", 10)).not.toContain(CELL_ID);
  });

  it("binds 30 lessons to Zweig I and 34 to II/III, each with its own Lernbereich", () => {
    for (const [track, topics] of Object.entries(TRACKS)) {
      const bound = tile.atoms.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.track === track,
        ),
      );
      expect(bound).toHaveLength(track === "I" ? 30 : 34);
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
            subject: "chemie",
            exam_relevant: true,
          });
      }
    }
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(atom.curricula?.[0]).toMatchObject({
        provider: "zam-academy",
        subject: "chemie-realschule-10",
      });
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
      }
    }
  });

  it("pins exactly the approved 7 successors (5 A, 2 B) and keeps the 9 C items active", () => {
    expect(mapping.approved).toBe("2026-10-24");
    expect(mapping.status).toBe("approved");
    const count = (category: MappingRow["category"]) =>
      mapping.rows.filter((row) => row.category === category).length;
    expect([count("A"), count("B"), count("C")]).toEqual([5, 2, 9]);
    expect(mapping.rows).toHaveLength(16);
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(declared).toHaveLength(7);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(tile.retired_items).toBeUndefined();
    for (const row of mapping.rows.filter((row) => row.category === "C")) {
      expect(row.academy_slug).toBeNull();
      expect(row.action).toBe("keep-active");
    }
    const originals = legacyTiles.flatMap((old) =>
      old.atoms.flatMap((atom) =>
        atom.practice_items.map((item) => ({ ...item, cell: old.tile_id })),
      ),
    );
    expect(originals).toHaveLength(16);
    expect(
      mapping.rows.map((row) => [row.de_by_id, row.de_by_cell]).sort(),
    ).toEqual(originals.map((item) => [item.id, item.cell]).sort());
    for (const row of mapping.rows.filter((row) => row.category === "B")) {
      const old = originals.find((item) => item.id === row.de_by_id)!;
      const successor = bySlug.get(row.academy_slug!)!;
      expect(successor.tier).toBe("tier2_synthesis");
      expect(successor.question).toBe(old.question);
      expect(successor.concept).toBe(old.concept);
      expect(successor.sample_solution).toBe(old.sample_solution);
    }
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "chemie-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-chemie10-"));
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

    it("enrols all 100 cards as one topic without duplicating or rescheduling on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 100,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 100,
        heldCount: 100,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves seven whole histories and leaves the nine C cards active and unchanged", async () => {
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
      const keptQueue = async () =>
        (
          await buildReviewQueue(db, {
            userId,
            tokenIds: KEPT,
            now: due,
            buryNewSiblings: false,
            buryReviewSiblings: false,
          })
        ).items;
      expect(await keptQueue()).toHaveLength(9);
      const enrolled = await enrolBundledCell(db, userId, CELL_ID);
      expect(enrolled).toMatchObject({ success: true, cardsReused: 7 });
      // On an atom where the learner already holds a card, one enrolment adds
      // only one more card; the rest follows with the next enrolment.
      const held = new Set(
        Object.values(REPLACEMENTS).map((slug) => bySlug.get(slug)!.id),
      );
      const atStart = tile.atoms.reduce((sum, atom) => {
        const missing = atom.practice_items.filter(
          (item) => !held.has(item.id),
        ).length;
        const holds = atom.practice_items.some((item) => held.has(item.id));
        return sum + (holds ? Math.min(missing, 1) : missing);
      }, 0);
      expect(enrolled.cardsCreated).toBe(atStart);
      expect(atStart).toBe(91);
      const second = await enrolBundledCell(db, userId, CELL_ID);
      expect(second.cardsCreated).toBe(items.length - 7 - atStart);
      const after = await snapshot();
      // 9 C cards + 100 cards of the cell, 7 of them with a moved history.
      expect(after.cards).toHaveLength(109);
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
          Boolean((await getTokenById(db, original.id))?.deprecated_at),
        ).toBe(original.id in REPLACEMENTS);
      expect(await keptQueue()).toHaveLength(9);
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
