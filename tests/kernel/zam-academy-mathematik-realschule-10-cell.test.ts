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
import legacyVektoren from "../fixtures/legacy/de-by-realschule-10-mathematik-ebene-vektorgeometrie-kvt.json" with {
  type: "json",
};
import legacyExpLog from "../fixtures/legacy/de-by-realschule-10-mathematik-exponential-logarithmus-kvt.json" with {
  type: "json",
};
import mappingRaw from "../fixtures/legacy/zam-academy-mathematik-realschule-10-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:mathematik-realschule-10";
const APP = "https://academy.zam-os.org/mathematik-realschule-10/";
const LEGACY_DIR = join(__dirname, "../fixtures/legacy");
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacyTiles = [legacyVektoren, legacyExpLog] as unknown as KvtTile[];

// replaces-de-by.json, copied unchanged from zam-os/zam-academy@8740026.
// Thomas approved this row-by-row mapping on 2026-10-22 for
// zam-os/zam-academy#23: 7 A, 9 B, no C. A B row keeps the whole old
// multi-part question, answer and sample solution on one successor, so in a
// tile it is a `replaces` exactly like an A row.
interface MappingRow {
  de_by_cell: string;
  de_by_id: string;
  category: "A" | "B" | "C";
  academy_slug: string | null;
}
const mapping = mappingRaw as unknown as {
  approved: string;
  source: string;
  sources: Array<{
    file: string;
    tile_id: string;
    version: string;
    sha256: string;
  }>;
  rows: MappingRow[];
};
const REPLACEMENTS: Record<string, string> = Object.fromEntries(
  mapping.rows.map((row) => [row.de_by_id, row.academy_slug!]),
);

// The Lernbereiche of each Wahlpflichtfächergruppe and the lessons that cover
// them (zam-os/zam-academy mathematik-realschule-10/coverage.json). The two
// Fachlehrpläne differ in content, not only in depth: Zweig I has Abbildungen,
// Potenzfunktionen and Logarithmusfunktionen, Zweig II/III Raumgeometrie and
// quadratische Funktionen, which Zweig I learnt in grade 9.
const TRACKS: Record<"I" | "II_III", Record<string, string[]>> = {
  I: {
    lb1: [
      "tr-1-einheitskreis",
      "tr-2-winkel-bis-360",
      "tr-3-steigungswinkel",
      "tr-4-sinusfunktion",
      "tr-5-kosinus-tangens",
      "tr-6-additionstheoreme",
      "dr-1-sinussatz",
      "dr-2-kosinussatz",
      "dr-3-flaecheninhalt",
      "dr-4-ebene-raum",
      "dr-5-gleichungen",
      "vk-1-vektoren",
      "vk-2-skalarprodukt",
      "vk-3-abstand",
    ],
    lb2: [
      "ab-1-verschiebung-streckung",
      "ab-2-achsenspiegelung",
      "ab-3-drehung",
      "ab-4-determinante",
      "ab-5-traegergraph",
      "ab-6-funktionsgraphen",
    ],
    lb3: [
      "pt-1-potenzgesetze",
      "pt-2-wurzeln",
      "pt-3-potenzfunktionen",
      "pt-4-parameter",
      "pt-5-umkehrfunktion",
    ],
    lb4: [
      "el-1-exponentialfunktion",
      "el-2-wachstum",
      "el-3-logarithmus",
      "el-4-logarithmensaetze",
      "el-5-exponentialfunktion-allgemein",
      "el-6-logarithmusfunktion",
    ],
    lb5: ["dz-1-mehrstufig", "dz-2-pfadregeln", "dz-3-anwendungen"],
  },
  II_III: {
    lb1: [
      "tr-1-einheitskreis",
      "tr-2-winkel-bis-360",
      "tr-3-steigungswinkel",
      "tr-4-sinusfunktion",
      "dr-1-sinussatz",
      "dr-2-kosinussatz",
      "dr-3-flaecheninhalt",
      "dr-4-ebene-raum",
    ],
    lb2: [
      "rg-1-axialschnitt",
      "rg-2-oberflaeche",
      "rg-3-volumen",
      "rg-4-zusammengesetzt",
      "rg-5-extremwerte",
    ],
    lb3: ["el-1-exponentialfunktion", "el-2-wachstum", "el-3-logarithmus"],
    lb4: [
      "qf-1-parabeln",
      "qf-2-scheitelpunkt",
      "qf-3-bestimmungsstuecke",
      "qf-4-extremwerte",
      "qf-5-loesungsformel",
      "qf-6-schnittpunkte",
    ],
    lb5: ["dz-1-mehrstufig", "dz-2-pfadregeln", "dz-3-anwendungen"],
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

describe("ZAM Academy Mathematik 10 Realschule cell", () => {
  it("bundles the published cell and retires the two legacy cells from discovery", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Mathematik 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 45,
    });
    expect(items).toHaveLength(148);
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
    expect(mapping.sources.map((source) => source.tile_id)).toEqual(
      legacyTiles.map((legacy) => legacy.tile_id),
    );
    for (const source of mapping.sources) {
      expect(getBundledCell(source.tile_id)).toBeUndefined();
      expect(getBundledCellTile(source.tile_id)).toBeUndefined();
      // `file` is relative to the Academy package (mathematik-realschule-10/);
      // ZAM keeps the same bytes in tests/fixtures/legacy/. The hash decides.
      const file = source.file.replace(/^tests\/fixtures\//, "");
      expect(
        createHash("sha256")
          .update(readFileSync(join(LEGACY_DIR, file)))
          .digest("hex"),
      ).toBe(source.sha256);
    }
  });

  it("is the Mathematik 10 cell for both branches and claims no other grade", () => {
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
      expect(scopeIds("realschule", 10, track), `track ${track}`).toEqual([
        CELL_ID,
      ]);
      expect(
        needsGenericCurriculumImport({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 10,
          subject: "mathematik",
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
            grade: 10,
            subject: "mathematik",
            exam_relevant: true,
          });
      }
    }
    // Every lesson serves at least one branch; 14 serve both.
    const lessons = new Set(
      Object.values(TRACKS).flatMap((topics) => Object.values(topics).flat()),
    );
    expect(lessons.size).toBe(45);
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(lessons.has(lessonId(atom.source_link!))).toBe(true);
      expect(atom.curricula?.[0]).toMatchObject({
        provider: "zam-academy",
        subject: "mathematik-realschule-10",
      });
      expect(atom.practice_items.length).toBeGreaterThanOrEqual(2);
      expect(atom.practice_items.length).toBeLessThanOrEqual(4);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
      }
    }
  });

  it("pins exactly the approved 7 A and 9 B successors and retires nothing", () => {
    expect(mapping.approved).toBe("2026-10-22");
    expect(mapping.source).toContain("Thomas");
    const count = (category: MappingRow["category"]) =>
      mapping.rows.filter((row) => row.category === category).length;
    expect([count("A"), count("B"), count("C")]).toEqual([7, 9, 0]);
    expect(mapping.rows).toHaveLength(16);
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(declared).toHaveLength(16);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    const originals = legacyTiles.flatMap((old) =>
      old.atoms.flatMap((atom) =>
        atom.practice_items.map((item) => ({ ...item, cell: old.tile_id })),
      ),
    );
    expect(originals).toHaveLength(16);
    expect(
      mapping.rows.map((row) => [row.de_by_id, row.de_by_cell]).sort(),
    ).toEqual(originals.map((item) => [item.id, item.cell]).sort());
    // A successor keeps the tier of the card whose history it takes over.
    for (const row of mapping.rows)
      expect(bySlug.get(row.academy_slug!)?.tier, row.de_by_id).toBe(
        originals.find((item) => item.id === row.de_by_id)?.tier,
      );
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "mathe10-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-mathe10-"));
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

    it("enrols all 148 cards as one topic without duplicating or rescheduling on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 148,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 148,
        heldCount: 148,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves all sixteen whole histories and starts the new cards unlearned", async () => {
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
        ) + 86_400_000,
      );
      const oldIds = Object.keys(REPLACEMENTS);
      expect(await queue(oldIds, due)).toHaveLength(16);
      const enrolled = await enrolBundledCell(db, userId, CELL_ID);
      expect(enrolled).toMatchObject({ success: true, cardsReused: 16 });
      const after = await snapshot();
      expect(after.reviews).toHaveLength(32);
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
      expect(await queue(oldIds, due)).toHaveLength(0);
      const successors = Object.values(REPLACEMENTS).map(
        (slug) => bySlug.get(slug)!.id,
      );
      expect(await queue(successors, due)).toHaveLength(16);
      // On an atom where the learner already holds a card, one enrolment adds
      // only one more card. Eight atoms hold a moved history; on the ones with
      // two moved histories or two missing cards the rest follows with the
      // next enrolment.
      const held = new Set(successors);
      const atStart = tile.atoms.reduce((sum, atom) => {
        const missing = atom.practice_items.filter(
          (item) => !held.has(item.id),
        ).length;
        const holds = atom.practice_items.some((item) => held.has(item.id));
        return sum + (holds ? Math.min(missing, 1) : missing);
      }, 0);
      expect(enrolled.cardsCreated).toBe(atStart);
      expect(atStart).toBe(126);
      const second = await enrolBundledCell(db, userId, CELL_ID);
      expect(second.cardsCreated).toBe(items.length - 16 - atStart);
      const complete = await snapshot();
      expect(complete.reviews).toEqual(after.reviews);
      expect(complete.cards).toHaveLength(items.length);
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
