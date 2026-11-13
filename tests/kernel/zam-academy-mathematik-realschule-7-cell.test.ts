import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
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
import mapping from "../fixtures/legacy/zam-academy-mathematik-realschule-7-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:mathematik-realschule-7";
const APP = "https://academy.zam-os.org/mathematik-realschule-7/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const LEGACY_IDS = [
  "de-by:realschule-7-mathematik-geometrie-achsen-punktsymmetrie",
  "de-by:realschule-7-mathematik-kongruenz-dreiecke-vektoren",
  "de-by:realschule-7-mathematik-prozent-zinsrechnung",
  "de-by:realschule-7-mathematik-rationale-zahlen-terme",
];
const LEGACY_FILES = [
  "de-by-realschule-7-mathematik-geometrie-achsen-punktsymmetrie-kvt.json",
  "de-by-realschule-7-mathematik-kongruenz-dreiecke-vektoren-kvt.json",
  "de-by-realschule-7-mathematik-prozent-zinsrechnung-kvt.json",
  "de-by-realschule-7-mathematik-rationale-zahlen-terme-kvt.json",
];
const legacyTiles = LEGACY_FILES.map(
  (file) =>
    JSON.parse(
      readFileSync(join(__dirname, "../fixtures/legacy", file), "utf8"),
    ) as KvtTile,
);
const TRANSFERS = new Map(
  mapping.rows
    .filter((row) => row.category === "A")
    .map((row) => [
      row.de_by_id,
      items.find((item) => item.slug === row.academy_slug)!.id,
    ]),
);
const RETIRED_LEGACY_ID = "01K4M7K0000000000000000J02";

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
  it("bundles the published cell with approved replacements and retires the superseded school cells", () => {
    expect(tile.version).toBe("2026.11.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Mathematik 7 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 42,
    });
    expect(items).toHaveLength(126);
    expect(tile.retired_items).toEqual([
      expect.objectContaining({ id: RETIRED_LEGACY_ID }),
    ]);
    expect(mapping.approved).toBe("2026-11-13");
    expect(TRANSFERS.size).toBe(7);
    expect(
      items
        .filter((item) => item.replaces?.length)
        .map((item) => [item.replaces, item.id])
        .sort(),
    ).toEqual([...TRANSFERS].map(([old, next]) => [[old], next]).sort());
    for (const id of LEGACY_IDS) {
      expect(getBundledCell(id), id).toBeUndefined();
      expect(getBundledCellTile(id), id).toBeUndefined();
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
  ])("offers only the Academy cell at curriculum track %s", (track) => {
    const cell = matchingCell(track);
    expect(cell).toBeDefined();
    // Discovery selects a cell, not a branch-specific subset of its cards.
    // Taking an Academy cell enrols its complete published scope.
    expect(cell.inScopeAtomIds).toHaveLength(42);
    expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    expect(
      findBundledCellsForScope(scope(track)).map((entry) => entry.id),
    ).toEqual([CELL_ID]);
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

    it("moves the 7 approved histories, retires 01K4M7K0000000000000000J02, and keeps the 22 C cards active", async () => {
      for (const legacy of legacyTiles) await installKvtTile(db, legacy);
      const oldItems = legacyTiles.flatMap((legacy) =>
        legacy.atoms.flatMap((atom) => atom.practice_items),
      );
      expect(oldItems).toHaveLength(30);
      for (const item of oldItems) await ensureCard(db, item.id, userId);
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
      const withoutToken = ({ token_id, ...rest }: Record<string, unknown>) =>
        rest;

      const first = await enrolBundledCell(db, userId, CELL_ID);
      expect(first).toMatchObject({
        success: true,
        cardsReused: 7,
      });
      let created = first.cardsCreated;
      for (let round = 0; round < 5; round++) {
        const next = await enrolBundledCell(db, userId, CELL_ID);
        if (next.cardsCreated === 0) break;
        created += next.cardsCreated;
      }
      expect(created).toBe(119);
      const after = await snapshot();
      expect(after.cards).toHaveLength(149);
      for (const group of ["cards", "reviews"] as const) {
        for (const row of before[group]) {
          const next = after[group].find((other) => other.id === row.id)!;
          expect(withoutToken(next)).toEqual(withoutToken(row));
          const old = String(row.token_id);
          expect(next.token_id).toBe(TRANSFERS.get(old) ?? old);
        }
      }
      for (const item of oldItems) {
        const deprecated = Boolean(
          (await getTokenById(db, item.id))?.deprecated_at,
        );
        expect(deprecated, item.id).toBe(
          TRANSFERS.has(item.id) || item.id === RETIRED_LEGACY_ID,
        );
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
      // Snapshot of cards and reviews remains stable across repeated enrolment.
      expect(await snapshot()).toEqual(after);
    });
  });
});
