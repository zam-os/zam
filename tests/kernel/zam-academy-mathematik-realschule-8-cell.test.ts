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

const CELL_ID = "zam-academy:mathematik-realschule-8";
const APP = "https://academy.zam-os.org/mathematik-realschule-8/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));

// The three school cells for grade 8 mathematics were version 1 and are no
// longer bundled. Thomas approved the row-by-row mapping of their 24 cards on
// 2026-10-23 (zam-os/zam-academy mathematik-realschule-8/replaces-de-by.json,
// zam-os/zam-academy#25): 9 A and 8 B move their histories to one successor
// each, 7 C stay as they are, nothing is retired. The Academy's
// validate-migration.mjs proves the moves with the real old cells; here the
// old cells are stand-ins that carry only their ids, which is all a
// `replaces` refers to.
const OLD_CELLS = {
  G: "de-by:realschule-8-mathematik-ebene-geometrie-vierecke",
  F: "de-by:realschule-8-mathematik-lineare-funktionen",
  T: "de-by:realschule-8-mathematik-terme-gleichungen",
} as const;
const oldId = (cell: keyof typeof OLD_CELLS, n: number) =>
  `01K4M8${cell}0000000000000000J0${n}`;
const A_ROWS: Record<string, string> = {
  [oldId("G", 1)]: "m8-raute-erkennen",
  [oldId("G", 3)]: "m8-trapez-flaeche",
  [oldId("F", 1)]: "m8-gerade-steigung-m",
  [oldId("F", 3)]: "m8-steigung-zwei-punkte",
  [oldId("F", 5)]: "m8-senkrecht-steigungen",
  [oldId("T", 1)]: "m8-binom-zweite",
  [oldId("T", 3)]: "m8-aequivalenz-null",
  [oldId("T", 5)]: "m8-definitionsmenge-vier",
  [oldId("T", 7)]: "m8-ungleichung-umkehren",
};
const B_ROWS: Record<string, string> = {
  [oldId("G", 4)]: "m8-trapez-drachen-flaeche",
  [oldId("F", 2)]: "m8-gerade-m-t-zeichnen",
  [oldId("F", 4)]: "m8-gerade-zwei-punkte-probe",
  [oldId("F", 6)]: "m8-parallel-senkrecht-schnitt",
  [oldId("T", 2)]: "m8-binom-alle-drei",
  [oldId("T", 4)]: "m8-gleichung-allgemeingueltig",
  [oldId("T", 6)]: "m8-bruchgleichung-hauptnenner",
  [oldId("T", 8)]: "m8-ungleichung-intervall",
};
const REPLACEMENTS = { ...A_ROWS, ...B_ROWS };
const C_ROWS = [
  oldId("G", 2),
  oldId("G", 5),
  oldId("G", 6),
  oldId("G", 7),
  oldId("G", 8),
  oldId("F", 7),
  oldId("F", 8),
];

/** A stand-in for an old school cell: its eight item ids, odd ones tier 1. */
function oldCell(cell: keyof typeof OLD_CELLS): KvtTile {
  return {
    tile_id: OLD_CELLS[cell],
    version: "2026.08.1",
    title: OLD_CELLS[cell],
    atoms: [1, 2, 3, 4].map((atom) => ({
      id: `01K4M8${cell}0000000000000000A0${atom}`,
      slug: `${OLD_CELLS[cell].slice("de-by:".length)}-${atom}`,
      title: `${OLD_CELLS[cell]} ${atom}`,
      practice_items: [2 * atom - 1, 2 * atom].map((n) => ({
        id: oldId(cell, n),
        slug: `${OLD_CELLS[cell].slice("de-by:".length)}-j0${n}`,
        bloom_level: 1,
        tier: n % 2 === 1 ? "tier1_fast" : "tier2_synthesis",
        question: `Frage ${n}`,
        concept: `Antwort ${n}`,
      })),
    })),
  };
}
const oldCells = (["G", "F", "T"] as const).map(oldCell);

// The Lernbereiche of each Wahlpflichtfächergruppe and the lessons that cover
// them (zam-os/zam-academy mathematik-realschule-8/coverage.json). Zweig I
// learnt triangles and Schrägbilder in grade 7 and has the Drehung, space
// coordinates, Ungleichungen and y = mx + t; Zweig II/III meets y = mx + t
// only in grade 9.
const TRACKS: Record<"I" | "II_III", Record<string, string[]>> = {
  I: {
    lb1: [
      "dv-4-vierecke",
      "dv-5-viereckskonstruktion",
      "dv-6-vierecke-anwenden",
    ],
    lb2: ["dr-1-drehung", "dr-2-punktspiegelung", "dr-3-vektoren"],
    lb3: [
      "rg-1-koerpersymmetrie",
      "rg-2-axialschnitte",
      "rg-3-raumkoordinaten",
      "rg-4-koerper-koordinaten",
    ],
    lb4: [
      "tg-1-terme",
      "tg-2-ausmultiplizieren",
      "tg-3-binomische-formeln",
      "tg-4-faktorisieren",
      "tg-5-extremwerte",
      "tg-6-extremwertprobleme",
      "tg-7-gleichungen",
      "tg-8-sachaufgaben",
      "tg-9-ungleichungen",
    ],
    lb5: [
      "br-1-bruchterme",
      "br-2-definitionsmenge",
      "br-3-verhaeltnisgleichungen",
    ],
    lb6: [
      "fu-1-funktionen",
      "fu-2-darstellungen",
      "fu-3-werte-nullstellen",
      "fu-4-ursprungsgeraden",
      "fu-5-senkrecht",
      "fu-6-geraden",
      "fu-7-geraden-bestimmen",
      "fu-8-parallelenscharen",
      "fu-9-anwendungen",
      "fu-10-flaechen",
    ],
    lb7: [
      "dz-1-ergebnis-ereignis",
      "dz-2-baumdiagramm",
      "dz-3-vierfeldertafel",
      "dz-4-haeufigkeiten",
    ],
  },
  II_III: {
    lb1: [
      "dv-1-dreiecksexistenz",
      "dv-2-dreieckskonstruktion",
      "dv-3-kongruenz",
      "dv-4-vierecke",
      "dv-5-viereckskonstruktion",
      "dv-6-vierecke-anwenden",
    ],
    lb2: ["rg-5-schraegbilder", "rg-6-wahre-groesse"],
    lb3: [
      "tg-1-terme",
      "tg-2-ausmultiplizieren",
      "tg-3-binomische-formeln",
      "tg-4-faktorisieren",
      "tg-5-extremwerte",
      "tg-6-extremwertprobleme",
      "tg-7-gleichungen",
      "tg-8-sachaufgaben",
    ],
    lb4: [
      "br-1-bruchterme",
      "br-2-definitionsmenge",
      "br-3-verhaeltnisgleichungen",
    ],
    lb5: [
      "fu-1-funktionen",
      "fu-2-darstellungen",
      "fu-3-werte-nullstellen",
      "fu-4-ursprungsgeraden",
      "fu-5-senkrecht",
    ],
    lb6: [
      "dz-1-ergebnis-ereignis",
      "dz-2-baumdiagramm",
      "dz-3-vierfeldertafel",
      "dz-4-haeufigkeiten",
    ],
  },
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scopeIds = (schoolType: string, grade: number, track?: string) =>
  findBundledCellsForScope({
    provider: "lehrplanplus-bayern",
    schoolType,
    grade,
    subject: "mathematik",
    ...(track ? { track } : {}),
  }).map((cell) => cell.id);

describe("ZAM Academy Mathematik 8 Realschule cell", () => {
  it("bundles the published cell and no longer bundles the three school cells", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Mathematik 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 41,
    });
    expect(items).toHaveLength(141);
    expect(tile.retired_items ?? []).toEqual([]);
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
    for (const old of Object.values(OLD_CELLS)) {
      expect(getBundledCell(old)).toBeUndefined();
      expect(getBundledCellTile(old)).toBeUndefined();
    }
  });

  it("is the Mathematik 8 cell for both branches and claims no other grade", () => {
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
      expect(scopeIds("realschule", 8, track), `track ${track}`).toEqual([
        CELL_ID,
      ]);
      expect(
        needsGenericCurriculumImport({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 8,
          subject: "mathematik",
          ...(track ? { track } : {}),
        }),
      ).toBe(false);
    }
    for (const grade of [7, 9, 10])
      expect(scopeIds("realschule", grade)).not.toContain(CELL_ID);
    expect(scopeIds("gymnasium", 8)).not.toContain(CELL_ID);
  });

  it("binds 36 lessons to Zweig I and 28 to II/III, each with its own Lernbereich", () => {
    for (const [track, topics] of Object.entries(TRACKS)) {
      const bound = tile.atoms.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.track === track,
        ),
      );
      expect(bound).toHaveLength(track === "I" ? 36 : 28);
      for (const [topic, lessons] of Object.entries(topics)) {
        const atoms = bound.filter((atom) =>
          atom.curricula?.some(
            (binding) =>
              binding.provider === "lehrplanplus-bayern" &&
              binding.track === track &&
              binding.topic_code === topic,
          ),
        );
        expect(
          atoms.map((atom) => lessonId(atom.source_link!)).sort(),
          `${track} ${topic}`,
        ).toEqual([...lessons].sort());
        for (const atom of atoms)
          expect(
            atom.curricula?.find(
              (binding) =>
                binding.provider === "lehrplanplus-bayern" &&
                binding.track === track,
            ),
          ).toMatchObject({
            school_type: "realschule",
            grade: 8,
            subject: "mathematik",
          });
      }
    }
    // Every lesson serves at least one branch; 23 serve both.
    const lessons = new Set(
      Object.values(TRACKS).flatMap((topics) => Object.values(topics).flat()),
    );
    expect(lessons.size).toBe(41);
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(lessons.has(lessonId(atom.source_link!))).toBe(true);
      expect(atom.curricula?.[0]).toMatchObject({
        provider: "zam-academy",
        subject: "mathematik-realschule-8",
      });
      expect(atom.practice_items.length).toBeGreaterThanOrEqual(2);
      expect(atom.practice_items.length).toBeLessThanOrEqual(5);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
      }
    }
  });

  it("pins exactly the approved 9 A and 8 B successors and retires nothing", () => {
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(declared).toHaveLength(17);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    // A successor keeps the tier of the card whose history it takes over:
    // the odd old items were tier 1, the even ones tier 2.
    for (const slug of Object.values(A_ROWS))
      expect(bySlug.get(slug)?.tier, slug).toBe("tier1_fast");
    for (const slug of Object.values(B_ROWS))
      expect(bySlug.get(slug)?.tier, slug).toBe("tier2_synthesis");
    for (const id of C_ROWS)
      expect(
        items.some((item) => item.replaces?.includes(id)),
        id,
      ).toBe(false);
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "mathe8-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-mathe8-"));
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

    it("enrols all 141 cards as one topic without duplicating or rescheduling on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 141,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 141,
        heldCount: 141,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves the seventeen approved histories, keeps the seven C cards active and starts the new cards unlearned", async () => {
      for (const old of oldCells) await installKvtTile(db, old);
      const originals = oldCells.flatMap((old) =>
        old.atoms.flatMap((atom) => atom.practice_items),
      );
      for (const [index, item] of originals.entries())
        await review(item.id, index);
      const before = await snapshot();
      expect(before.cards).toHaveLength(24);
      expect(before.reviews).toHaveLength(48);
      const due = new Date(
        Math.max(
          ...before.cards.map((card) => Date.parse(String(card.due_at))),
        ) + 86_400_000,
      );
      const movedIds = Object.keys(REPLACEMENTS);
      expect(await queue(movedIds, due)).toHaveLength(17);
      const enrolled = await enrolBundledCell(db, userId, CELL_ID);
      expect(enrolled).toMatchObject({ success: true, cardsReused: 17 });
      const after = await snapshot();
      expect(after.reviews).toHaveLength(48);
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
      for (const id of movedIds)
        expect((await getTokenById(db, id))?.deprecated_at, id).toBeTruthy();
      expect(await queue(movedIds, due)).toHaveLength(0);
      // The C cards keep their own histories and stay in active use.
      for (const id of C_ROWS)
        expect((await getTokenById(db, id))?.deprecated_at, id).toBeFalsy();
      expect(await queue(C_ROWS, due)).toHaveLength(7);
      const successors = Object.values(REPLACEMENTS).map(
        (slug) => bySlug.get(slug)!.id,
      );
      expect(await queue(successors, due)).toHaveLength(17);
      // On an atom where the learner already holds a card, one enrolment adds
      // only one more card, so the held atoms fill up over a few enrolments.
      const held = new Set(successors);
      const atStart = tile.atoms.reduce((sum, atom) => {
        const missing = atom.practice_items.filter(
          (item) => !held.has(item.id),
        ).length;
        const holds = atom.practice_items.some((item) => held.has(item.id));
        return sum + (holds ? Math.min(missing, 1) : missing);
      }, 0);
      expect(enrolled.cardsCreated).toBe(atStart);
      let next = await enrolBundledCell(db, userId, CELL_ID);
      while (next.cardsCreated > 0)
        next = await enrolBundledCell(db, userId, CELL_ID);
      const complete = await snapshot();
      expect(complete.reviews).toEqual(after.reviews);
      expect(complete.cards).toHaveLength(items.length + C_ROWS.length);
      const oldCardIds = new Set(before.cards.map((card) => card.id));
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
        await installKvtTile(db, tile);
        for (const cell of oldCells) await installKvtTile(db, cell);
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
