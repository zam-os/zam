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
import legacyRs6Raw from "../fixtures/legacy/de-by-realschule-6-informatik-textverarbeitung-praesentation-kvt.json" with {
  type: "json",
};
import legacyRs7Raw from "../fixtures/legacy/de-by-realschule-7-informatik-informationsdarstellung-dateisystem-kvt.json" with {
  type: "json",
};
import legacyRs8Raw from "../fixtures/legacy/de-by-realschule-8-informatik-objektorientierung-vektorgrafik-kvt.json" with {
  type: "json",
};
import mapping from "../fixtures/legacy/zam-academy-informatik-realschule-8-replaces-de-by.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:informatik-realschule-8";
const APP = "https://academy.zam-os.org/informatik-realschule-8/";
const FIXTURE = join(
  __dirname,
  "../fixtures/curriculum/zam-academy-informatik-realschule-8-kvt.json",
);
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacyTiles = [legacyRs6Raw, legacyRs7Raw, legacyRs8Raw].map(
  (raw) => raw as unknown as KvtTile,
);

// Thomas approved all 24 rows on 2026-10-27 (zam-os/zam-academy#62, cell
// 2026.10.2): 10 A and 1 B pass their history on, 13 C retire. The decision
// record is that of zam-os/zam-academy@41d9b3a. Cell 2026.10.3
// (zam-os/zam-academy#63, @9a9ede38) adds the same bindings for grades 6 and 7
// and changes no id, card, replaces or retired_items.
const REPLACEMENTS: Record<string, string> = {
  "01K4A6T0000000000000000J01": "it8-textobjekte-absatzattribut",
  "01K4A8V0000000000000000J01": "it8-textobjekte-zustand",
  "01K4A6T0000000000000000J03": "it8-layout-objekte-quadratisch",
  "01K4A7D0000000000000000J01": "it8-kommunikationsmodell-daten-information",
  "01K4A7D0000000000000000J03": "it8-dualsystem-1011",
  "01K4A7D0000000000000000J04": "it8-dualsystem-stellenwert-umrechnung",
  "01K4A7D0000000000000000J05": "it8-codierung-byte-256",
  "01K4A8V0000000000000000J05": "it8-pixel-vektor-skalierbar",
  "01K4A8V0000000000000000J07": "it8-bildgroesse-formate-rgb-weiss",
  "01K4A6T0000000000000000J07": "it8-formeln-bezuege-gleichheitszeichen",
  "01K4A7D0000000000000000J07": "it8-betriebssystem-dateien-absoluter-pfad",
};
const RETIRED = [
  "01K4A6T0000000000000000J02",
  "01K4A6T0000000000000000J04",
  "01K4A6T0000000000000000J05",
  "01K4A6T0000000000000000J06",
  "01K4A6T0000000000000000J08",
  "01K4A7D0000000000000000J02",
  "01K4A7D0000000000000000J06",
  "01K4A7D0000000000000000J08",
  "01K4A8V0000000000000000J02",
  "01K4A8V0000000000000000J03",
  "01K4A8V0000000000000000J04",
  "01K4A8V0000000000000000J06",
  "01K4A8V0000000000000000J08",
];
// Lernbereich 1 "Anfangsunterricht" of the LehrplanPLUS Fachlehrplan IT
// Realschule, read at /fachlehrplan/realschule/8/it on 2026-10-27.
const MODULES: Array<[string, string, number]> = [
  ["it-1.1", "Texterfassung", 4],
  ["it-1.2", "Einführung in die Programmierung", 5],
  ["it-1.3", "Einführung in die Textverarbeitung", 4],
  ["it-1.4", "Informationsaustausch", 6],
  ["it-1.5", "Einführung in die Bildbearbeitung", 4],
  ["it-1.6", "Einführung in die Tabellenkalkulation", 5],
  ["it-1.7", "Informationsbeschaffung und -präsentation", 4],
  ["it-1.8", "Grundlagen elektronischer Datenverarbeitung", 4],
  ["it-1.9", "Digitale Medien", 4],
];
const scope = (subject: string, track?: string, grade = 8) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject,
  ...(track ? { track } : {}),
});

describe("ZAM Academy Informatik 8 Realschule cell", () => {
  it("bundles the published bytes and removes the three legacy cells from discovery", () => {
    expect(
      createHash("sha256").update(readFileSync(FIXTURE)).digest("hex"),
    ).toBe("6f7a95cae80bb719014a441277b4dc443777526a4ff56f461ce76b6d4b67fa99");
    expect(tile.version).toBe("2026.10.3");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Informatik 8 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 40,
    });
    expect(items).toHaveLength(87);
    for (const legacy of legacyTiles) {
      expect(getBundledCell(legacy.tile_id)).toBeUndefined();
      expect(getBundledCellTile(legacy.tile_id)).toBeUndefined();
    }
    expect(mapping).toMatchObject({
      status: "approved",
      approved: "2026-10-27",
    });
    expect(mapping.sources).toHaveLength(3);
    for (const source of mapping.sources) {
      const match = legacyTiles.find((t) => t.tile_id === source.tile_id)!;
      expect(match).toBeDefined();
      expect(match.version).toBe(source.version);
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
      ).toBe(source.sha256);
    }
  });

  it("offers Informatik 8 to every Wahlpflichtfächergruppe in grades 6 to 8 only", () => {
    for (const grade of [6, 7, 8])
      for (const subject of ["it", "informatik", "informationstechnologie"]) {
        for (const track of [
          undefined,
          "I",
          "wpfg1",
          "II",
          "wpfg2",
          "IIIa",
          "wpfg3a",
          "IIIb",
          "wpfg3b",
          "wpfg2-3",
        ]) {
          expect(
            findBundledCellsForScope(scope(subject, track, grade)).map(
              (cell) => cell.id,
            ),
            `${grade} ${subject} ${track}`,
          ).toContain(CELL_ID);
          // Coverage is decided per position, not per Lernbereich (ADR
          // 2026-08-14 Decision 10): a binding that names the grade covers that
          // grade fully, although the cell teaches only Lernbereich 1.
          expect(
            needsGenericCurriculumImport(scope(subject, track, grade)),
          ).toBe(false);
        }
      }
    // The three old cells sat at grades 6, 7 and 8; the cell binds the same
    // three grades, so no learner position loses its Anfangsunterricht.
    for (const grade of [5, 9, 10]) {
      expect(
        findBundledCellsForScope(scope("it", "I", grade)).map(
          (cell) => cell.id,
        ),
      ).not.toContain(CELL_ID);
    }
    expect(
      findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade: 8,
        subject: "informatik",
      }).map((cell) => cell.id),
    ).not.toContain(CELL_ID);
  });

  it("binds all 40 lessons to the nine Anfangsunterricht modules in grades 6 to 8 for every group", () => {
    for (const atom of tile.atoms) {
      const school = (atom.curricula ?? []).filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      );
      expect(
        school.map((binding) => binding.grade),
        atom.slug,
      ).toEqual([6, 7, 8]);
      for (const binding of school) {
        expect(binding).toMatchObject({
          school_type: "realschule",
          subject: "it",
          topic_code: school[0].topic_code,
          topic_title: school[0].topic_title,
          exam_relevant: false,
        });
        expect(binding.track, atom.slug).toBeUndefined();
      }
      expect(atom.source_link).toBe(`${APP}#lesson=${atom.slug}`);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
      }
    }
    for (const [code, title, count] of MODULES) {
      const bindings = tile.atoms.flatMap((atom) =>
        (atom.curricula ?? []).filter(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.grade === 8 &&
            binding.topic_code === code,
        ),
      );
      expect(bindings, code).toHaveLength(count);
      for (const binding of bindings) expect(binding.topic_title).toBe(title);
    }
    expect(MODULES.reduce((sum, [, , count]) => sum + count, 0)).toBe(40);
  });

  it("declares exactly the eleven approved replaces and thirteen retired_items", () => {
    expect(tile.retired_items?.map((item) => item.id)).toEqual(RETIRED);
    const declared = Object.fromEntries(
      items
        .filter((item) => item.replaces?.length)
        .map((item) => {
          expect(item.replaces).toHaveLength(1);
          return [item.replaces![0], item.slug];
        }),
    );
    expect(declared).toEqual(REPLACEMENTS);

    // The decision record says the same: 10 A + 1 B replace, 13 C retire.
    expect(mapping.rows).toHaveLength(24);
    const byCategory = (category: string) =>
      mapping.rows.filter((row) => row.category === category);
    expect(byCategory("A")).toHaveLength(10);
    expect(byCategory("B")).toHaveLength(1);
    expect(byCategory("C")).toHaveLength(13);
    expect(
      Object.fromEntries(
        mapping.rows
          .filter((row) => row.action === "replace")
          .map((row) => [row.de_by_id, row.academy_slug]),
      ),
    ).toEqual(REPLACEMENTS);
    expect(
      mapping.rows
        .filter((row) => row.action === "retire")
        .map((row) => row.de_by_id)
        .sort(),
    ).toEqual([...RETIRED].sort());
    const legacyIds = legacyTiles
      .flatMap((t) => t.atoms.flatMap((atom) => atom.practice_items))
      .map((item) => item.id)
      .sort();
    expect([...Object.keys(REPLACEMENTS), ...RETIRED].sort()).toEqual(
      legacyIds,
    );
  });

  describe("library integration", () => {
    let tempDir: string;
    let db: Database;
    const userId = "it8-learner";

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-it8-lib-"));
      db = await openDatabase({ dbPath: join(tempDir, "lib.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true });
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

    it("enrols all 87 cards as one topic and preserves every schedule on repeat", async () => {
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 87,
      });
      const topics = (await listLibraryTopics(db, userId)).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 87,
        heldCount: 87,
      });
      const before = await snapshot();
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
      expect(await snapshot()).toEqual(before);
    });

    it("moves eleven whole histories and keeps thirteen retired cards off the queue", async () => {
      for (const legacy of legacyTiles) {
        await installKvtTile(db, legacy);
      }
      const originals = legacyTiles.flatMap((t) =>
        t.atoms.flatMap((atom) => atom.practice_items),
      );
      for (const [index, item] of originals.entries()) {
        await review(item.id, index);
      }
      const before = await snapshot();
      expect(before.cards).toHaveLength(24);
      expect(before.reviews).toHaveLength(48);

      const due = new Date(
        Math.max(
          ...before.cards.map((card) => Date.parse(String(card.due_at))),
        ) + 86_400_000,
      );
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
      expect(await retiredQueue()).toHaveLength(13);

      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 74,
        cardsReused: 11,
      });

      const after = await snapshot();
      // 85 active (11 reused + 74 created, 2 siblings wait) + 13 retired
      expect(after.cards).toHaveLength(98);
      expect(after.reviews).toHaveLength(48);

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
      for (const original of originals) {
        expect(
          (await getTokenById(db, original.id))?.deprecated_at,
        ).toBeTruthy();
      }
      expect(await retiredQueue()).toHaveLength(0);

      const oldCardIds = new Set(before.cards.map((card) => card.id));
      const fresh = after.cards.filter((card) => !oldCardIds.has(card.id));
      expect(fresh).toHaveLength(74);
      for (const card of fresh) {
        expect(card).toMatchObject({
          state: "new",
          stability: 0,
          reps: 0,
          last_review_at: null,
        });
      }

      // it8-codierung and it8-formeln-bezuege each hold one moved card and two
      // new siblings; their Tier-2 sibling comes with the next enrolment.
      expect(await enrolBundledCell(db, userId, CELL_ID)).toMatchObject({
        cardsCreated: 2,
        alreadyEnrolled: false,
      });
      const complete = await snapshot();
      expect(complete.cards).toHaveLength(100); // all 87 active + 13 retired
      expect(complete.reviews).toHaveLength(48);
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
        for (const legacy of legacyTiles) {
          await installKvtTile(db, legacy);
        }
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
