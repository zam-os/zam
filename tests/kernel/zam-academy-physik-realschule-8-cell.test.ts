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
import legacyElektrikRaw from "../fixtures/legacy/de-by-realschule-8-physik-elektrik-grundlagen-kvt.json" with {
  type: "json",
};
import legacyMechanikRaw from "../fixtures/legacy/de-by-realschule-8-physik-mechanik-kraft-bewegung-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-physik-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:physik-realschule-8";
const APP = "https://academy.zam-os.org/physik-realschule-8/";
const ITEMS = 152;

/**
 * The two de-by Realschule 8 physics cells this cell replaces in part. Thomas
 * approved the mapping of their sixteen cards in zam-os/zam-academy#37 on
 * 2026-10-23: four cards pass their review history to an Academy successor
 * (`replaces`), ten retire without transferring mastery (`retired_items`), and
 * two (Jahrgangsstufe 9, Ohmsches Gesetz) stay active unchanged. The cells
 * left the bundle; the migration tests install them from tests/fixtures/legacy,
 * where the snapshots and the decision record are copied without changing
 * bytes.
 */
const legacyElektrik = legacyElektrikRaw as unknown as KvtTile;
const legacyMechanik = legacyMechanikRaw as unknown as KvtTile;
const LEGACY_TILES = [legacyElektrik, legacyMechanik];
const OLD_IDS = LEGACY_TILES.map((legacy) => legacy.tile_id);
const REPLACEMENTS: Record<string, string> = {
  "01K4P8M0000000000000000J03": "ph8-gewichtskraft-zerlegung",
  "01K4P8M0000000000000000J05": "ph8-hebelgesetz",
  "01K4P8M0000000000000000J07": "ph8-goldene-regel",
  "01K4P8E0000000000000000J01": "ph8-leitungselektronen-ladungstransport",
};
const RETIRED = [
  "01K4P8E0000000000000000J02",
  "01K4P8E0000000000000000J03",
  "01K4P8E0000000000000000J04",
  "01K4P8E0000000000000000J05",
  "01K4P8E0000000000000000J06",
  "01K4P8M0000000000000000J01",
  "01K4P8M0000000000000000J02",
  "01K4P8M0000000000000000J04",
  "01K4P8M0000000000000000J06",
  "01K4P8M0000000000000000J08",
];
const KEPT = ["01K4P8E0000000000000000J07", "01K4P8E0000000000000000J08"];

/**
 * The lessons of the Physik-8 app in zam-os/zam-academy, by stage. A card
 * cites one of them, so renaming a lesson there breaks every card that
 * cites it. The app's own test pins the same ids.
 */
const LESSONS: Record<string, string[]> = {
  "stage-1-mechanik": [
    "kr-1-messen",
    "kr-2-geschwindigkeit",
    "kr-3-kraft",
    "kr-4-wechselwirkung",
    "kr-5-hooke",
    "kr-6-masse-gewicht",
    "kr-7-teilchenmodell",
    "kr-8-dichte",
    "kr-9-reibung",
  ],
  "stage-2-optik": [
    "op-1-lichtausbreitung",
    "op-2-schatten",
    "op-3-finsternisse",
    "op-4-reflexion",
    "op-5-brechung",
    "op-6-totalreflexion",
    "op-7-sammellinse",
    "op-8-abbildung",
    "op-9-geraete",
  ],
  "stage-3-energie": [
    "en-1-schiefe-ebene",
    "en-2-hebel",
    "en-3-flaschenzug",
    "en-4-arbeit",
    "en-5-leistung",
    "en-6-energieformen",
    "en-7-energieerhaltung",
    "en-8-wirkungsgrad",
  ],
  "stage-4-waerme": [
    "wl-1-innere-energie",
    "wl-2-temperatur",
    "wl-3-aggregatzustaende",
    "wl-4-ausdehnung",
    "wl-5-wasseranomalie",
    "wl-6-waermeleitung",
    "wl-7-konvektion-strahlung",
  ],
  "stage-5-elektrizitaet": [
    "el-1-magnete",
    "el-2-magnetfeld",
    "el-3-ladung",
    "el-4-elektrisches-feld",
    "el-5-elektrostatik-anwendung",
    "el-6-strom",
    "el-7-stromkreis",
    "el-8-stromstaerke-messen",
    "el-9-stromfluss-fluessigkeit-gas",
    "el-10-gefahren-schutz",
  ],
  "stage-6-akustik": ["ak-1-schall", "ak-2-ausbreitung"],
  "stage-7-astronomie": ["as-1-weltbilder", "as-2-sonnensystem"],
};
const ALL_LESSONS = Object.values(LESSONS).flat();

/**
 * The Lernbereich of each lesson in the two Fachlehrpläne of LehrplanPLUS
 * Realschule 8 Physik, per Wahlpflichtfächergruppe (read on 2026-10-23, as the
 * Academy's coverage.json records it). Zweig I (`I`, wpfg1): LB 1 Mechanik und
 * Energie, LB 2 Wärmelehre, LB 3 Elektrizitätslehre, LB 4 Wahlbereich with 4.1
 * Astronomie and 4.2 Akustik. Zweig II/III (`II_III`, wpfg2-3): LB 1 Mechanik,
 * LB 2 Optik, LB 3 Magnetismus und Elektrizitätslehre. A lesson of both Zweige
 * carries one binding each; the elective lessons sit in `I` only, and the
 * coverage file's coarse LB 4 is refined here to `lb4.1` / `lb4.2`.
 */
const LESSON_AREAS: Record<string, Array<[track: string, topic: string]>> = {
  "kr-1-messen": [["II_III", "lb1"]],
  "kr-2-geschwindigkeit": [["II_III", "lb1"]],
  "kr-3-kraft": [["II_III", "lb1"]],
  "kr-4-wechselwirkung": [["II_III", "lb1"]],
  "kr-5-hooke": [["II_III", "lb1"]],
  "kr-6-masse-gewicht": [["II_III", "lb1"]],
  "kr-7-teilchenmodell": [["II_III", "lb1"]],
  "kr-8-dichte": [["II_III", "lb1"]],
  "kr-9-reibung": [["II_III", "lb1"]],
  "op-1-lichtausbreitung": [["II_III", "lb2"]],
  "op-2-schatten": [["II_III", "lb2"]],
  "op-3-finsternisse": [["II_III", "lb2"]],
  "op-4-reflexion": [["II_III", "lb2"]],
  "op-5-brechung": [["II_III", "lb2"]],
  "op-6-totalreflexion": [["II_III", "lb2"]],
  "op-7-sammellinse": [["II_III", "lb2"]],
  "op-8-abbildung": [["II_III", "lb2"]],
  "op-9-geraete": [["II_III", "lb2"]],
  "en-1-schiefe-ebene": [["I", "lb1"]],
  "en-2-hebel": [["I", "lb1"]],
  "en-3-flaschenzug": [["I", "lb1"]],
  "en-4-arbeit": [["I", "lb1"]],
  "en-5-leistung": [["I", "lb1"]],
  "en-6-energieformen": [["I", "lb1"]],
  "en-7-energieerhaltung": [["I", "lb1"]],
  "en-8-wirkungsgrad": [["I", "lb1"]],
  "wl-1-innere-energie": [["I", "lb2"]],
  "wl-2-temperatur": [["I", "lb2"]],
  "wl-3-aggregatzustaende": [["I", "lb2"]],
  "wl-4-ausdehnung": [["I", "lb2"]],
  "wl-5-wasseranomalie": [["I", "lb2"]],
  "wl-6-waermeleitung": [["I", "lb2"]],
  "wl-7-konvektion-strahlung": [["I", "lb2"]],
  "el-1-magnete": [["II_III", "lb3"]],
  "el-2-magnetfeld": [["II_III", "lb3"]],
  "el-3-ladung": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-4-elektrisches-feld": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-5-elektrostatik-anwendung": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-6-strom": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-7-stromkreis": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "el-8-stromstaerke-messen": [["I", "lb3"]],
  "el-9-stromfluss-fluessigkeit-gas": [["I", "lb3"]],
  "el-10-gefahren-schutz": [
    ["I", "lb3"],
    ["II_III", "lb3"],
  ],
  "ak-1-schall": [["I", "lb4.2"]],
  "ak-2-ausbreitung": [["I", "lb4.2"]],
  "as-1-weltbilder": [["I", "lb4.1"]],
  "as-2-sonnensystem": [["I", "lb4.1"]],
};

const POSITION = {
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade: 8,
  subject: "physik",
};

describe("ZAM Academy Physik 8 Realschule cell", () => {
  const tile = getBundledCellTile(CELL_ID);

  it("is a bundled cell of the zam-academy provider, labelled by its publisher", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell?.title).toBe("Physik 8 Realschule (ZAM Academy)");
    expect(cell?.publisher).toBe("ZAM Academy");
    expect(cell?.gradeLabel).toBe("ZAM Academy");
    expect(cell?.atomCount).toBe(47);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "physik-realschule-8",
      }).map((c) => c.id),
    ).toContain(CELL_ID);
  });

  it("bundles the published bytes and removes the two older cells from discovery", () => {
    const lock = JSON.parse(
      readFileSync(
        join(__dirname, "../fixtures/curriculum/zam-academy-cells.lock.json"),
        "utf8",
      ),
    ) as Array<{ id: string; sha256: string; file: string; version: string }>;
    const entry = lock.find((e) => e.id === CELL_ID)!;
    expect(entry.version).toBe(tile?.version);
    expect(
      createHash("sha256")
        .update(
          readFileSync(join(__dirname, "../fixtures/curriculum", entry.file)),
        )
        .digest("hex"),
    ).toBe(entry.sha256);
    for (const id of OLD_IDS) {
      expect(getBundledCell(id), `${id} left the bundle`).toBeUndefined();
      expect(getBundledCellTile(id), id).toBeUndefined();
    }
    // The decision record names the snapshots it was made on, by hash.
    expect(mapping.sources).toHaveLength(2);
    for (const source of mapping.sources) {
      expect(OLD_IDS).toContain(source.tile_id);
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
        source.tile_id,
      ).toBe(source.sha256);
    }
  });

  it("is offered at Realschule 8 Physik to every Wahlpflichtfächergruppe, as the only physics cell", () => {
    for (const track of [
      undefined,
      "I",
      "II",
      "IIIa",
      "IIIb",
      "wpfg1",
      "wpfg2-3",
    ]) {
      const ids = findBundledCellsForScope({
        ...POSITION,
        ...(track ? { track } : {}),
      }).map((c) => c.id);
      expect(ids, `track ${track ?? "any"}`).toContain(CELL_ID);
      for (const id of OLD_IDS)
        expect(ids, `track ${track ?? "any"}`).not.toContain(id);
    }
    // The cell covers the grade itself, so the generic importer is not
    // offered beside it (ADR 2026-08-14 Decision 10).
    expect(needsGenericCurriculumImport(POSITION)).toBe(false);
    for (const other of [
      { ...POSITION, grade: 7 },
      { ...POSITION, grade: 9 },
      { ...POSITION, schoolType: "gymnasium" },
      { ...POSITION, subject: "chemie" },
    ]) {
      expect(
        findBundledCellsForScope(other).map((c) => c.id),
        JSON.stringify(other),
      ).not.toContain(CELL_ID);
    }
    expect(getBundledCell(CELL_ID)?.curriculumScopes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ...POSITION, track: "I" }),
        expect.objectContaining({ ...POSITION, track: "II_III" }),
      ]),
    );
  });

  it("pins the four approved successors, the ten retired questions and the two that stay", () => {
    expect(mapping.status).toBe("approved");
    expect(mapping.approved).toBe("2026-10-23");
    expect(mapping.source).toContain("Thomas");
    expect(mapping.source).toContain("ich gebe das Mapping frei");
    expect(mapping.rows).toHaveLength(16);
    expect(
      Object.fromEntries(
        mapping.rows
          .filter((row) => row.category === "A")
          .map((row) => [row.de_by_id, row.academy_slug]),
      ),
    ).toEqual(REPLACEMENTS);
    expect(
      mapping.rows
        .filter((row) => row.action === "retire")
        .map((row) => row.de_by_id)
        .sort(),
    ).toEqual([...RETIRED].sort());
    expect(
      mapping.rows
        .filter((row) => row.action === "keep")
        .map((row) => row.de_by_id)
        .sort(),
    ).toEqual([...KEPT].sort());

    // The cell declares exactly those rows.
    const declared = (tile?.atoms ?? []).flatMap((atom) =>
      atom.practice_items.flatMap((item) =>
        (item.replaces ?? []).map((id) => [id, item.slug]),
      ),
    );
    expect(declared).toHaveLength(4);
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(tile?.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    for (const retired of tile?.retired_items ?? []) {
      expect(retired.reason, retired.id).toBeTruthy();
      expect(Object.keys(REPLACEMENTS), retired.id).not.toContain(retired.id);
    }
    for (const id of KEPT) {
      expect(Object.keys(REPLACEMENTS), id).not.toContain(id);
      expect(RETIRED, id).not.toContain(id);
    }

    // The sixteen rows are exactly the sixteen cards of the two old cells.
    expect(
      mapping.rows.map((row) => [row.de_by_cell, row.de_by_id]).sort(),
    ).toEqual(
      LEGACY_TILES.flatMap((legacy) =>
        legacy.atoms.flatMap((atom) =>
          atom.practice_items.map((item) => [legacy.tile_id, item.id]),
        ),
      ).sort(),
    );
  });

  it("has one atom per lesson, in the app's order, each bound first to its stage", () => {
    expect(tile?.atoms).toHaveLength(ALL_LESSONS.length);
    expect(
      tile?.atoms.map((atom) =>
        (atom.source_link ?? "").slice(`${APP}#lesson=`.length),
      ),
    ).toEqual(ALL_LESSONS);
    for (const atom of tile?.atoms ?? []) {
      // The first binding decides the cell's label (bundled-cells.ts):
      // the academy stage, with no school type or grade.
      const first = atom.curricula?.[0];
      expect(first?.provider).toBe("zam-academy");
      expect(first?.school_type).toBeUndefined();
      expect(first?.grade).toBeUndefined();
      expect(Object.keys(LESSONS)).toContain(first?.topic_code);
    }
  });

  it("binds every lesson to its Lernbereich in exactly the right Wahlpflichtfächergruppen", () => {
    expect(Object.keys(LESSON_AREAS)).toEqual(ALL_LESSONS);
    for (const atom of tile?.atoms ?? []) {
      const lesson = (atom.source_link ?? "").slice(`${APP}#lesson=`.length);
      const lehrplan = (atom.curricula ?? []).filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      );
      for (const binding of lehrplan) {
        expect(binding.school_type, lesson).toBe("realschule");
        expect(binding.grade, lesson).toBe(8);
        expect(binding.subject, lesson).toBe("physik");
      }
      // Exactly the expected pairs: a swapped, missing, extra or duplicated
      // binding changes this list.
      expect(
        lehrplan
          .map((binding) => `${binding.track} ${binding.topic_code}`)
          .sort(),
        lesson,
      ).toEqual(
        LESSON_AREAS[lesson]
          .map(([track, topic]) => `${track} ${topic}`)
          .sort(),
      );
    }
  });

  it("links every card to a lesson of its own stage", () => {
    for (const atom of tile?.atoms ?? []) {
      const stage = atom.curricula?.[0]?.topic_code ?? "";
      const lessons = LESSONS[stage] ?? [];
      expect(atom.practice_items.length, atom.slug).toBeGreaterThanOrEqual(2);
      for (const item of [atom, ...atom.practice_items]) {
        const link = item.source_link ?? "";
        expect(link.startsWith(`${APP}#lesson=`), link).toBe(true);
        expect(lessons, `${item.id} cites ${link}`).toContain(
          link.slice(`${APP}#lesson=`.length),
        );
      }
    }
  });

  it("spells every formula out for reading aloud", () => {
    for (const atom of tile?.atoms ?? []) {
      for (const item of atom.practice_items) {
        for (const segment of [
          ...(item.question_segments ?? []),
          ...(item.concept_segments ?? []),
        ]) {
          if (segment.type === "math") {
            expect(segment.speech, `${item.id}: ${segment.tex}`).toBeTruthy();
          }
        }
      }
    }
  });

  describe("enrolment and retained review evidence", () => {
    let tempDir: string;
    let db: Database;
    const userId = "learner";
    const items = tile?.atoms.flatMap((atom) => atom.practice_items) ?? [];
    const bySlug = new Map(items.map((item) => [item.slug, item]));
    const originals = LEGACY_TILES.flatMap((legacy) =>
      legacy.atoms.flatMap((atom) => atom.practice_items),
    );

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-physik8-"));
      db = await openDatabase({
        dbPath: join(tempDir, "test.db"),
        useConfiguredCloud: false,
      });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
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
      const now = new Date();
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

    it("gives the learner every card, as one library topic", async () => {
      const result = await enrolBundledCell(db, userId, CELL_ID);
      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(ITEMS);
      expect(items).toHaveLength(ITEMS);

      const topics = await listLibraryTopics(db, userId);
      const app = topics.filter((topic) => topic.key.startsWith(APP));
      expect(app).toHaveLength(1);
      expect(app[0]).toMatchObject({
        key: APP,
        itemCount: ITEMS,
        heldCount: ITEMS,
      });
    });

    it("preserves every schedule on a repeated enrolment", async () => {
      await enrolBundledCell(db, userId, CELL_ID);
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    /**
     * ADR 2026-08-14 Decision 9: the approved `replaces` move a learner's
     * card and review history to its successor; the ten retired cards keep
     * their evidence but leave the active review; the two Jahrgangsstufe 9
     * cards stay as they are.
     */
    it("moves four whole histories, retains ten retired and two kept ones, and starts the other cards unlearned", async () => {
      for (const legacy of LEGACY_TILES) await installKvtTile(db, legacy);
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
      expect(await queue(RETIRED, due)).toHaveLength(10);
      expect(await queue(KEPT, due)).toHaveLength(2);

      const enrolled = await enrolBundledCell(db, userId, CELL_ID);
      expect(enrolled).toMatchObject({ success: true, cardsReused: 4 });

      const after = await snapshot();
      expect(after.reviews).toHaveLength(32);
      const expected = (id: string) =>
        REPLACEMENTS[id] ? bySlug.get(REPLACEMENTS[id])!.id : id;
      // Every one of the sixteen cards is unchanged but for its token: the
      // four moved ones now sit on their successors, the others stay put.
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

      // Replaced and retired tokens are deprecated; the two kept stay active.
      for (const id of [...Object.keys(REPLACEMENTS), ...RETIRED])
        expect((await getTokenById(db, id))?.deprecated_at, id).toBeTruthy();
      for (const id of KEPT)
        expect((await getTokenById(db, id))?.deprecated_at, id).toBeFalsy();
      // The ten retired cards leave the review queue; the kept two and the
      // four successors are still due.
      expect(await queue(RETIRED, due)).toHaveLength(0);
      expect(await queue(KEPT, due)).toHaveLength(2);
      const successors = Object.values(REPLACEMENTS).map(
        (slug) => bySlug.get(slug)!.id,
      );
      expect(await queue(successors, due)).toHaveLength(4);

      // zam-core adds only one more card to an atom on which the learner
      // already holds a card, per enrolment. An atom with a moved history
      // therefore gets its remaining cards one enrolment at a time, atoms
      // without history all at once.
      const oldCardIds = new Set(before.cards.map((card) => card.id));
      const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
      let expectedNew = 0;
      const pending: number[] = [];
      for (const atom of tile?.atoms ?? []) {
        const moved = atom.practice_items.filter(
          (item) => (item.replaces ?? []).length > 0,
        ).length;
        const missing = atom.practice_items.length - moved;
        expectedNew += moved > 0 ? Math.min(1, missing) : missing;
        if (moved > 0) pending.push(missing - Math.min(1, missing));
      }
      expect(fresh).toHaveLength(expectedNew);
      expect(enrolled.cardsCreated).toBe(expectedNew);
      let rounds = 0;
      for (;;) {
        const open = pending.filter((left) => left > 0).length;
        const next = await enrolBundledCell(db, userId, CELL_ID);
        expect(next.cardsCreated).toBe(open);
        if (open === 0) break;
        for (const [index, left] of pending.entries())
          if (left > 0) pending[index] = left - 1;
        rounds++;
      }
      expect(rounds).toBeGreaterThan(0);
      const complete = await snapshot();
      expect(complete.reviews).toEqual(after.reviews);
      // Every item of the cell holds a card; the four moved ones are old
      // cards, and the ten retired and two kept stay on their old tokens.
      expect(complete.cards).toHaveLength(
        items.length + RETIRED.length + KEPT.length,
      );
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
        // The cell without its replaces and retired items, as if the mapping
        // had never been declared.
        const published = structuredClone(tile) as KvtTile;
        published.version = "2026.10.1";
        delete published.retired_items;
        for (const atom of published.atoms)
          for (const item of atom.practice_items) delete item.replaces;
        await installKvtTile(db, published);
        for (const legacy of LEGACY_TILES) await installKvtTile(db, legacy);
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
