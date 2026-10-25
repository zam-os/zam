import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { weltwissenSeedRows } from "../../src/kernel/atlas/index.js";
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
import legacyRaw from "../fixtures/legacy/de-by-realschule-10-geschichte-kalter-krieg-teilung-wiedervereinigung-kvt.json" with {
  type: "json",
};
import mappingRaw from "../fixtures/legacy/zam-academy-geschichte-realschule-10-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:geschichte-realschule-10";
const APP = "https://academy.zam-os.org/geschichte-realschule-10/";
const tile = getBundledCellTile(CELL_ID)!;
const legacy = legacyRaw as unknown as KvtTile;
// replaces-de-by.json, copied unchanged from zam-os/zam-academy@ee305e1.
const mapping = mappingRaw as {
  approved: string;
  sources: Array<{ file: string; tile_id: string; sha256: string }>;
  rows: Array<{
    de_by_id: string;
    category: string;
    academy_slug: string | null;
  }>;
};
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
// Explicit owner approval in Academy PR #45 on 2026-10-25: 2 A, 0 B, 2 C, both C retired.
const REPLACEMENTS: Record<string, string> = {
  "01K4HAK0000000000000000J01": "g10-kuba-krise-merken",
  "01K4HAK0000000000000000J03": "g10-friedliche-revolution-merken",
};
const RETIRED = ["01K4HAK0000000000000000J02", "01K4HAK0000000000000000J04"];
const LESSONS: Record<string, string[]> = {
  lb1: [
    "g10-karikatur",
    "g10-bild-und-lied",
    "g10-perspektiven",
    "g10-schaubild",
    "g10-zeitzeugen",
    "g10-film",
  ],
  lb2: [
    "g10-potsdam",
    "g10-nachkriegsalltag",
    "g10-flucht-vertreibung",
    "g10-verfassung-bayern",
    "g10-zwei-staaten",
  ],
  lb3: [
    "g10-sed-diktatur",
    "g10-17-juni-1953",
    "g10-stasi",
    "g10-mauerbau",
    "g10-aera-adenauer",
    "g10-ns-vergangenheit",
    "g10-gastarbeiter",
    "g10-1968",
    "g10-sozialliberale-reformen",
    "g10-juedisches-leben",
    "g10-deutsche-frage",
  ],
  lb4: [
    "g10-blockbildung",
    "g10-kuba-krise",
    "g10-vietnamkrieg",
    "g10-entkolonialisierung",
    "g10-entspannung",
    "g10-umbruch-ostblock",
    "g10-friedliche-revolution",
    "g10-weg-zur-einheit",
    "g10-innere-einheit",
    "g10-rolle-deutschlands",
    "g10-europa",
  ],
  lb5: [
    "g10-weltordnung",
    "g10-uno",
    "g10-jugoslawien",
    "g10-nahost-wurzeln",
    "g10-nahost-seit-1967",
    "g10-terror-9-11",
    "g10-globalisierung",
    "g10-aktuelle-konflikte",
  ],
  lb6: [
    "g10-migration-epochen",
    "g10-auswanderung",
    "g10-einwanderung",
    "g10-einwanderungsland",
  ],
  lb7: [
    "g10-geschichtskultur-frueher",
    "g10-instrumentalisierung",
    "g10-geschichte-unterhaltung",
    "g10-gedenkkultur",
  ],
  lb8: ["g10-en-postwar", "g10-en-airlift", "g10-en-india", "g10-en-cold-war"],
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);

describe("ZAM Academy Geschichte 10 Realschule cell", () => {
  it("bundles the published cell and retires the legacy discovery entry", () => {
    expect(tile.version).toBe("2026.10.3");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Geschichte 10 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 53,
    });
    expect(items).toHaveLength(159);
    expect(getBundledCell(legacy.tile_id)).toBeUndefined();
    expect(getBundledCellTile(legacy.tile_id)).toBeUndefined();
    expect(mapping.sources.map((source) => source.tile_id)).toEqual([
      legacy.tile_id,
    ]);
    for (const source of mapping.sources) {
      // `file` is relative to the Academy package (geschichte-realschule-10/);
      // ZAM keeps the same bytes in tests/fixtures/legacy/. The hash decides.
      const file = source.file.replace(/^tests\/fixtures\//, "");
      expect(
        createHash("sha256")
          .update(readFileSync(join(__dirname, "../fixtures/legacy", file)))
          .digest("hex"),
      ).toBe(source.sha256);
    }
    expect(mapping.sources[0].sha256).toBe(
      "ecba7fe3328e8e2bcaeda44dd447a7b1f6f9dde81556f79834f0cfe92535e8ff",
    );
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
        grade: 10,
        subject: "geschichte",
        ...(track ? { track } : {}),
      };
      expect(findBundledCellsForScope(scope).map((cell) => cell.id)).toEqual([
        CELL_ID,
      ]);
      expect(needsGenericCurriculumImport(scope)).toBe(false);
    }
    for (const [schoolType, grade] of [
      ["realschule", 9],
      ["gymnasium", 10],
    ] as const) {
      expect(
        findBundledCellsForScope({
          provider: "lehrplanplus-bayern",
          schoolType,
          grade,
          subject: "geschichte",
        }).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    }
  });

  it("covers all official areas and keeps the English deepening separate", () => {
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
          subject: "geschichte-realschule-10",
        });
        const official =
          atom.curricula?.filter(
            (binding) => binding.provider === "lehrplanplus-bayern",
          ) ?? [];
        expect(official).toHaveLength(1);
        expect(official[0]).toMatchObject({
          school_type: "realschule",
          grade: 10,
          subject: "geschichte",
          topic_code: topic,
          exam_relevant: topic !== "lb8",
        });
        expect(official[0].track).toBeUndefined();
        expect(atom.practice_items.map((item) => item.tier)).toEqual([
          "tier1_fast",
          "tier1_fast",
          "tier2_synthesis",
        ]);
        for (const item of atom.practice_items) {
          expect(item.source_link).toBe(atom.source_link);
          expect(item.language).toBe(topic === "lb8" ? "en" : "de");
        }
      }
    }
  });

  it("files LB 2 to 5 under the atlas area for the 20th century", () => {
    const { aliases } = weltwissenSeedRows();
    const resolve = (domain: string) =>
      aliases
        .filter(
          (alias) =>
            domain === alias.domainPrefix ||
            domain.startsWith(`${alias.domainPrefix}/`),
        )
        .sort((a, b) => b.domainPrefix.length - a.domainPrefix.length)[0]
        ?.regionKey;
    for (const atom of tile.atoms) {
      const topic = atom.curricula?.[0]?.topic_code;
      // Methods, the two longitudinal areas and the English lessons span
      // epochs; like Geschichte 9 they stay at the subject.
      expect(resolve(atom.domain), atom.slug).toBe(
        ["lb2", "lb3", "lb4", "lb5"].includes(topic!)
          ? "gesellschaft.geschichte.zeitgeschichte"
          : "gesellschaft.geschichte",
      );
    }
  });

  it("pins only the two approved single-retrieval successors and retires the two corrected cards", () => {
    expect(mapping.approved).toBe("2026-10-25");
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(declared).toHaveLength(2);
    expect(tile.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    expect(
      Object.fromEntries(
        mapping.rows
          .filter((row) => row.category === "A")
          .map((row) => [row.de_by_id, row.academy_slug]),
      ),
    ).toEqual(REPLACEMENTS);
    expect(
      mapping.rows
        .filter((row) => row.category === "C")
        .map((row) => row.de_by_id),
    ).toEqual(RETIRED);
    const old = legacy.atoms.flatMap((atom) => atom.practice_items);
    expect(old.map((item) => item.id).sort()).toEqual(
      [...Object.keys(REPLACEMENTS), ...RETIRED].sort(),
    );
    for (const [id, slug] of Object.entries(REPLACEMENTS)) {
      expect(old.find((item) => item.id === id)?.tier).toBe("tier1_fast");
      expect(bySlug.get(slug)?.tier).toBe("tier1_fast");
    }
    // Same retrievals: the crisis of October 1962 and the date the border opened.
    expect(
      bySlug.get(REPLACEMENTS["01K4HAK0000000000000000J01"])?.concept,
    ).toBe("In der Kuba-Krise");
    expect(
      bySlug.get(REPLACEMENTS["01K4HAK0000000000000000J03"])?.concept,
    ).toBe("Am 9. November 1989");
  });

  describe("enrolment and retained review evidence", () => {
    let dir: string, db: Database;
    const userId = "geschichte-10-learner";
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-geschichte-10-"));
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

    it("enrols all 159 cards as one topic without duplicating or rescheduling on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 159,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 159,
        heldCount: 159,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves two whole histories, keeps two corrected histories intact and retires their old text", async () => {
      await installKvtTile(db, legacy);
      const originals = legacy.atoms.flatMap((atom) => atom.practice_items);
      for (const [index, item] of originals.entries())
        await review(item.id, index);
      const before = await snapshot();
      expect(before.cards).toHaveLength(4);
      expect(before.reviews).toHaveLength(8);
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
      ).toHaveLength(2);
      // Each successor atom has two further items. On an atom the learner
      // already holds, enrolment adds one new sibling at a time
      // (materialiseKvtCards), so the second one follows on the next enrolment.
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 155,
        cardsReused: 2,
      });
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 2,
      });
      const after = await snapshot();
      expect(after.cards).toHaveLength(161);
      expect(after.reviews).toHaveLength(8);
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
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(after);
    });

    it.each(Object.keys(REPLACEMENTS))(
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
