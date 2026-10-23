import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  getTokenById,
  installKvtTile,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

const CELL_ID = "zam-academy:mathematik-realschule-7";
const APP = "https://academy.zam-os.org/mathematik-realschule-7/";
const tile = getBundledCellTile(CELL_ID)!;
const LEGACY_IDS = [
  "de-by:realschule-7-mathematik-geometrie-achsen-punktsymmetrie",
  "de-by:realschule-7-mathematik-kongruenz-dreiecke-vektoren",
  "de-by:realschule-7-mathematik-prozent-zinsrechnung",
  "de-by:realschule-7-mathematik-rationale-zahlen-terme",
];

// The published app's eleven I-only lessons. All other lessons serve both
// Fachlehrplaene; in II/III their Lernbereich numbers differ from Zweig I.
const I_ONLY = new Set([
  "pv-3-vektoraddition",
  "pv-8-vielecke",
  "dr-1-existenz",
  "dr-2-konstruktion",
  "dr-3-kongruenz",
  "dr-4-begruenden",
  "rg-1-lagebeziehungen",
  "rg-2-schraegbilder",
  "rg-3-wahre-groessen",
  "ol-5-tangenten-konstruktion",
  "ol-8-schwerpunkt",
]);
const LERNBEREICH: Record<string, Record<string, number>> = {
  I: { pt: 1, pv: 2, dr: 3, rg: 4, ol: 5, al: 6, pr: 7, da: 8 },
  II_III: { pt: 1, pv: 2, ol: 3, al: 4, pr: 5, da: 6 },
};
const scope = (track?: string) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade: 7,
  subject: "mathematik",
  ...(track ? { track } : {}),
});
const matchingCell = (track?: string) =>
  findBundledCellsForScope(scope(track)).find((cell) => cell.id === CELL_ID)!;

describe("ZAM Academy Mathematik 7 Realschule cell", () => {
  it("bundles the published cell beside all four school cells without approving a history transfer", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Mathematik 7 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 42,
    });
    expect(tile.atoms.flatMap((atom) => atom.practice_items)).toHaveLength(126);
    expect(tile.retired_items ?? []).toEqual([]);
    for (const atom of tile.atoms)
      for (const item of atom.practice_items)
        expect(item.replaces ?? [], item.id).toEqual([]);
    for (const id of LEGACY_IDS) {
      expect(getBundledCell(id), id).toBeDefined();
      expect(getBundledCellTile(id), id).toBeDefined();
    }
  });

  it.each([
    undefined,
    "I",
    "wpfg1",
    "II_III",
    "wpfg2-3",
    "II",
    "III",
    "IIIa",
    "IIIb",
  ])("offers the complete Academy cell at curriculum track %s", (track) => {
    const cell = matchingCell(track);
    expect(cell).toBeDefined();
    // Discovery selects a cell, not a branch-specific subset of its cards.
    // Taking an Academy cell enrols its complete published scope.
    expect(cell.inScopeAtomIds).toHaveLength(42);
    expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    const expectedLegacy =
      track === undefined || track === "I" || track === "wpfg1"
        ? LEGACY_IDS
        : LEGACY_IDS.filter(
            (id) =>
              id !==
              "de-by:realschule-7-mathematik-kongruenz-dreiecke-vektoren",
          );
    expect(
      new Set(findBundledCellsForScope(scope(track)).map((entry) => entry.id)),
    ).toEqual(new Set([CELL_ID, ...expectedLegacy]));
  });

  it("binds 42 lessons to eight Lernbereiche in I and 31 lessons to six in II/III", () => {
    for (const [track, prefixes] of Object.entries(LERNBEREICH)) {
      const bound = tile.atoms.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.track === track,
        ),
      );
      expect(bound).toHaveLength(track === "I" ? 42 : 31);
      expect(new Set(bound.map((atom) => atom.slug))).toEqual(
        new Set(
          tile.atoms
            .filter((atom) => track === "I" || !I_ONLY.has(atom.slug))
            .map((atom) => atom.slug),
        ),
      );
      const counts =
        track === "I" ? [5, 8, 4, 3, 8, 5, 5, 4] : [5, 6, 6, 5, 5, 4];
      for (const [index, count] of counts.entries()) {
        const topic = `lb${index + 1}`;
        const atoms = bound.filter((atom) =>
          atom.curricula?.some(
            (binding) =>
              binding.provider === "lehrplanplus-bayern" &&
              binding.track === track &&
              binding.topic_code === topic,
          ),
        );
        expect(atoms, `${track} ${topic}`).toHaveLength(count);
        for (const atom of atoms) {
          expect(prefixes[atom.slug.slice(0, 2)]).toBe(index + 1);
          expect(
            atom.curricula?.find(
              (binding) =>
                binding.provider === "lehrplanplus-bayern" &&
                binding.track === track,
            ),
          ).toMatchObject({
            school_type: "realschule",
            grade: 7,
            subject: "mathematik",
            topic_code: topic,
          });
        }
      }
    }
  });

  it("keeps the cell out of other grades, school types and subjects", () => {
    for (const other of [
      { ...scope("I"), grade: 6 },
      { ...scope("I"), grade: 8 },
      { ...scope("I"), schoolType: "gymnasium" },
      { ...scope("I"), subject: "physik" },
    ])
      expect(
        findBundledCellsForScope(other).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
  });

  it("keeps every German card linked to its exact published lesson", () => {
    expect(new Set(tile.atoms.map((atom) => atom.slug)).size).toBe(42);
    for (const atom of tile.atoms) {
      expect(atom.source_link).toBe(`${APP}#lesson=${atom.slug}`);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
      }
    }
  });

  describe("enrolment and preserved school-card histories", () => {
    let dir: string;
    let db: Database;
    let userId: string;

    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-mathe7-"));
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

    it("enrols all 126 cards as one topic without duplicating or rescheduling on repeat", async () => {
      await installKvtTile(db, tile);
      expect((await snapshot()).cards).toEqual([]);
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 126,
      });
      const topics = (await listLibraryTopics(db, userId)).filter(
        (topic) => topic.key === APP,
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({ itemCount: 126, heldCount: 126 });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("leaves all 30 old cards and 60 reviews intact and starts the 126 Academy cards unlearned", async () => {
      for (const id of LEGACY_IDS) await enrolBundledCell(db, userId, id);
      const originals = (await snapshot()).cards;
      expect(originals).toHaveLength(30);
      for (const [index, card] of originals.entries()) {
        const now = new Date("2026-10-01T10:00:00.000Z");
        const rating = {
          cardId: String(card.id),
          tokenId: String(card.token_id),
          userId,
          answerFormat: "recall" as const,
          responseTimeMs: 1200 + index * 100,
        };
        await evaluateRating(db, { ...rating, rating: 3, now });
        await evaluateRating(db, {
          ...rating,
          rating: index % 2 === 0 ? 2 : 4,
          now: new Date(now.getTime() + 3 * 86_400_000),
        });
      }
      const before = await snapshot();
      expect(before.reviews).toHaveLength(60);
      const oldIds = new Set(before.cards.map((card) => card.id));
      const oldTokens = await Promise.all(
        originals.map((card) => getTokenById(db, String(card.token_id))),
      );

      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 126,
        cardsReused: 0,
      });
      const after = await snapshot();
      expect(after.cards).toHaveLength(156);
      expect(after.cards.filter((card) => oldIds.has(card.id))).toEqual(
        before.cards,
      );
      expect(after.reviews).toEqual(before.reviews);
      expect(
        await Promise.all(
          originals.map((card) => getTokenById(db, String(card.token_id))),
        ),
      ).toEqual(oldTokens);
      for (const token of oldTokens) {
        expect(token).toBeDefined();
        expect(token?.deprecated_at).toBeNull();
      }
      for (const card of after.cards.filter((entry) => !oldIds.has(entry.id)))
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
