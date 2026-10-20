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
import legacyRaw from "../fixtures/legacy/de-by-realschule-9-geographie-klima-ressourcen-kvt.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:geographie-realschule-9";
const APP = "https://academy.zam-os.org/geographie-realschule-9/";
const tile = getBundledCellTile(CELL_ID)!;
const legacy = legacyRaw as unknown as KvtTile;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
// Explicit owner approval in Academy PR #15 on 2026-10-20: 3 A, 1 B, 4 C.
const REPLACEMENTS: Record<string, string> = {
  "01K4G9R0000000000000000J01": "geo9-grundlagen-itc-check",
  "01K4G9R0000000000000000J05": "geo9-grundlagen-desertifikation-check",
  "01K4G9R0000000000000000J07": "geo9-fussabdruck-check",
  "01K4G9R0000000000000000J08": "geo9-treibhauseffekt-nachhaltigkeit-gesamt",
};
const RETIRED = [
  "01K4G9R0000000000000000J02",
  "01K4G9R0000000000000000J03",
  "01K4G9R0000000000000000J04",
  "01K4G9R0000000000000000J06",
];
const LESSONS: Record<string, string[]> = {
  lb1: [
    "geo-grosslandschaften",
    "geo-plattentektonik",
    "geo-erdgeschichte",
    "geo-abtragung",
    "geo-eingriffe",
  ],
  lb2: [
    "geo-wetter-klima",
    "geo-grosswetterlagen",
    "geo-treibhauseffekt",
    "geo-klimafolgen",
    "geo-extremereignisse",
    "geo-klimaschutz-anpassung",
    "geo-ozon",
  ],
  lb3: [
    "geo-landwirtschaft-faktoren",
    "geo-konventionell-bio",
    "geo-boden-ernaehrung",
    "geo-agrarhandel",
    "geo-hunger",
    "geo-hydroponik",
  ],
  lb4: [
    "geo-staedtenetz",
    "geo-stadtfunktionen",
    "geo-stadtwandel",
    "geo-nachhaltige-stadt",
  ],
  lb5: [
    "geo-altersdiagramme",
    "geo-bevoelkerungsbilanz",
    "geo-szenarien",
    "geo-migration",
    "geo-bevoelkerungspolitik",
  ],
  lb6: [
    "geo-eu-karte",
    "geo-eu-erweiterung",
    "geo-globalisierung-bayern",
    "geo-fussabdruck",
    "geo-grenzenwandel",
  ],
  lb7: ["geo-nahraumfrage", "geo-nahraumbelege", "geo-nahraumurteil"],
  lb8: [
    "geo-en-landscapes",
    "geo-en-climate",
    "geo-en-food",
    "geo-en-cities",
    "geo-en-population",
    "geo-en-borders",
    "geo-en-local",
  ],
  grundlagen: [
    "geo-grundlagen-itc",
    "geo-grundlagen-regenwald",
    "geo-grundlagen-desertifikation",
  ],
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);

describe("ZAM Academy Geographie 9 Realschule cell", () => {
  it("bundles the published cell and retires the legacy discovery entry", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Geographie 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 45,
    });
    expect(items).toHaveLength(91);
    expect(getBundledCell(legacy.tile_id)).toBeUndefined();
    expect(getBundledCellTile(legacy.tile_id)).toBeUndefined();
    expect(
      createHash("sha256")
        .update(
          readFileSync(
            join(
              __dirname,
              "../fixtures/legacy/de-by-realschule-9-geographie-klima-ressourcen-kvt.json",
            ),
          ),
        )
        .digest("hex"),
    ).toBe("50e0b97342103cb0c8995f88bf9459feca1fa322fd356a89c9264153cc13a4f2");
  });

  it("uses the common curriculum for every Wahlpflichtfächergruppe and displaces generic import", () => {
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
      const scope = {
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "geographie",
        ...(track ? { track } : {}),
      };
      expect(findBundledCellsForScope(scope).map((cell) => cell.id)).toEqual([
        CELL_ID,
      ]);
      expect(needsGenericCurriculumImport(scope)).toBe(false);
    }
    for (const [schoolType, grade] of [
      ["realschule", 8],
      ["realschule", 10],
      ["gymnasium", 9],
    ] as const) {
      expect(
        findBundledCellsForScope({
          provider: "lehrplanplus-bayern",
          schoolType,
          grade,
          subject: "geographie",
        }).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    }
  });

  it("covers all official areas and keeps English and supplementary foundations separate", () => {
    expect(tile.atoms.map((atom) => lessonId(atom.source_link!))).toEqual(
      Object.values(LESSONS).flat(),
    );
    for (const [topic, lessons] of Object.entries(LESSONS)) {
      const atoms = tile.atoms.filter(
        (atom) => atom.curricula?.[0]?.topic_code === topic,
      );
      expect(atoms.map((atom) => lessonId(atom.source_link!))).toEqual(lessons);
      for (const atom of atoms) {
        expect(atom.curricula?.[0]).toMatchObject({
          provider: "zam-academy",
          subject: "geographie-realschule-9",
        });
        const official =
          atom.curricula?.filter(
            (binding) => binding.provider === "lehrplanplus-bayern",
          ) ?? [];
        if (topic === "grundlagen") expect(official).toHaveLength(0);
        else {
          expect(official).toHaveLength(1);
          expect(official[0]).toMatchObject({
            school_type: "realschule",
            grade: 9,
            subject: "geographie",
            topic_code: topic,
            exam_relevant: topic !== "lb8",
          });
          expect(official[0].track).toBeUndefined();
        }
        for (const item of atom.practice_items) {
          expect(item.source_link).toBe(atom.source_link);
          expect(item.language).toBe(topic === "lb8" ? "en" : "de");
        }
      }
    }
  });

  it("pins only the four approved successors and preserves the whole B retrieval", () => {
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(declared).toHaveLength(4);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(tile.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    expect(
      legacy.atoms
        .flatMap((atom) => atom.practice_items.map((item) => item.id))
        .sort(),
    ).toEqual([...Object.keys(REPLACEMENTS), ...RETIRED].sort());
    const old = legacy.atoms
      .flatMap((atom) => atom.practice_items)
      .find((item) => item.id === "01K4G9R0000000000000000J08")!;
    const successor = bySlug.get(REPLACEMENTS[old.id])!;
    expect(successor.question).toBe(old.question);
    expect(successor.concept).toBe(old.concept);
    expect(successor.sample_solution).toEqual(old.sample_solution);
    expect(successor.tier).toBe("tier2_synthesis");
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "geographie-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-geographie-"));
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

    it("enrols all 91 cards as one topic without duplicating or rescheduling on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 91,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 91,
        heldCount: 91,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves four whole histories, keeps four corrected histories intact and retires their old text", async () => {
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
        ),
      );
      due.setUTCDate(due.getUTCDate() + 1);
      expect(
        (
          await buildReviewQueue(db, {
            userId,
            tokenIds: RETIRED,
            now: due,
            buryNewSiblings: false,
            buryReviewSiblings: false,
          })
        ).items,
      ).toHaveLength(4);
      // The preserved B synthesis shares an atom with two new atomic items.
      // Existing atoms receive one new item per enrolment, never a new schedule
      // on the learner's transferred card (the normal materialisation budget).
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 86,
        cardsReused: 4,
      });
      const after = await snapshot();
      expect(after.cards).toHaveLength(94);
      expect(after.reviews).toHaveLength(16);
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
      expect(
        (
          await buildReviewQueue(db, {
            userId,
            tokenIds: RETIRED,
            now: due,
            buryNewSiblings: false,
            buryReviewSiblings: false,
          })
        ).items,
      ).toHaveLength(0);
      const oldCardIds = new Set(before.cards.map((card) => card.id));
      for (const card of after.cards.filter(
        (card) => !oldCardIds.has(card.id),
      )) {
        expect(card.state).toBe("new");
        expect(card.stability).toBe(0);
        expect(card.last_review_at).toBeNull();
      }
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 1,
        cardsReused: 90,
      });
      const complete = await snapshot();
      expect(complete.cards).toHaveLength(95);
      expect(complete.reviews).toEqual(after.reviews);
      for (const card of after.cards)
        expect(
          complete.cards.find((candidate) => candidate.id === card.id),
        ).toEqual(card);
      const finalNew = complete.cards.filter(
        (card) => !after.cards.some((previous) => previous.id === card.id),
      );
      expect(finalNew).toHaveLength(1);
      expect(finalNew[0]).toMatchObject({
        state: "new",
        stability: 0,
        last_review_at: null,
      });
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(complete);
    });

    it.each(["01K4G9R0000000000000000J01", "01K4G9R0000000000000000J08"])(
      "refuses to combine two reviewed histories for %s",
      async (old) => {
        await installKvtTile(db, tile);
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
