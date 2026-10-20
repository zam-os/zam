import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  ensureCard,
  evaluateRating,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  installKvtTile,
  type KvtTile,
  listLibraryTopics,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";
import legacyAtombau from "../fixtures/legacy/de-by-realschule-9-chemie-atombau-pse-kvt.json" with {
  type: "json",
};
import legacyBindung from "../fixtures/legacy/de-by-realschule-9-chemie-chemische-bindung-kvt.json" with {
  type: "json",
};

const CELL_ID = "zam-academy:chemie-realschule-9";
const APP = "https://academy.zam-os.org/chemie-realschule-9/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const bySlug = new Map(items.map((item) => [item.slug, item]));
const legacyTiles = [legacyAtombau, legacyBindung] as unknown as KvtTile[];

// The owner-approved mapping in zam-os/zam-academy#10 (2026-10-20):
// six equal atomic retrievals and five whole, unchanged synthesis questions.
// The five corrected or uncertain items below transfer no mastery.
const REPLACEMENTS: Record<string, string> = {
  "01K4C9A0000000000000000J01": "c9-rutherford-check",
  "01K4C9A0000000000000000J02": "c9-legacy-j02-atombau",
  "01K4C9A0000000000000000J03": "c9-atomteilchen-check",
  "01K4C9A0000000000000000J04": "c9-legacy-j04-atombau",
  "01K4C9A0000000000000000J05": "c9-energiestufen-check",
  "01K4C9A0000000000000000J06": "c9-legacy-j06-atombau",
  "01K4C9B0000000000000000J01": "c9-metallbindung-check",
  "01K4C9B0000000000000000J02": "c9-legacy-j02-bindung",
  "01K4C9B0000000000000000J03": "c9-elektronenpaare-check",
  "01K4C9B0000000000000000J04": "c9-legacy-j04-bindung",
  "01K4C9B0000000000000000J05": "c9-polaritaet-check",
};
const RETIRED = [
  "01K4C9A0000000000000000J07",
  "01K4C9A0000000000000000J08",
  "01K4C9B0000000000000000J06",
  "01K4C9B0000000000000000J07",
  "01K4C9B0000000000000000J08",
];
const CURRICULA: Record<string, Record<string, string[]>> = {
  I: {
    lb1: ["ch-sicher-arbeiten"],
    lb2: [
      "ch-metallbindung",
      "ch-elektronenpaare",
      "ch-molekuelgestalt",
      "ch-polaritaet",
      "ch-zwischenmolekulare-kraefte",
      "ch-kohlenwasserstoffe",
      "ch-funktionelle-gruppen",
      "ch-organik-vertiefung",
    ],
    lb3: [
      "ch-ionen-salze",
      "ch-elektronenuebergang",
      "ch-oxidationszahlen",
      "ch-redoxgleichungen",
      "ch-salze-loesen",
    ],
    lb4: [
      "ch-batterie-akku",
      "ch-elektrolyse",
      "ch-korrosion",
      "ch-brennstoffzelle",
    ],
    lb5: [
      "ch-ph-indikator",
      "ch-protonenuebergang",
      "ch-saeurereste",
      "ch-oxide-wasser",
    ],
  },
  II_III: {
    lb1: ["ch-sicher-arbeiten"],
    lb2: [
      "ch-stoffeigenschaften",
      "ch-teilchenmodell",
      "ch-trennverfahren",
      "ch-nachweise",
    ],
    lb3: ["ch-teilchenverbaende", "ch-ionen-salze"],
    lb4: ["ch-reaktionsgleichungen", "ch-energie-katalyse", "ch-stoffmenge"],
    lb5: [
      "ch-rutherford",
      "ch-atomteilchen",
      "ch-energiestufen",
      "ch-periodensystem",
      "ch-kugelwolken",
    ],
    lb6: [
      "ch-metallbindung",
      "ch-elektronenpaare",
      "ch-molekuelgestalt",
      "ch-polaritaet",
      "ch-zwischenmolekulare-kraefte",
      "ch-kohlenwasserstoffe",
      "ch-funktionelle-gruppen",
    ],
  },
};

describe("ZAM Academy Chemie 9 Realschule cell", () => {
  it("bundles the published cell and removes the two legacy cells from active discovery", () => {
    expect(tile.version).toBe("2026.10.2");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Chemie 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 35,
    });
    expect(items).toHaveLength(77);
    for (const legacy of legacyTiles)
      expect(getBundledCell(legacy.tile_id)).toBeUndefined();
    for (const track of [
      undefined,
      "I",
      "wpfg1",
      "II_III",
      "wpfg2-3",
      "II",
      "III",
    ]) {
      const scope = {
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "chemie",
        ...(track ? { track } : {}),
      };
      expect(findBundledCellsForScope(scope).map((cell) => cell.id)).toEqual([
        CELL_ID,
      ]);
      expect(needsGenericCurriculumImport(scope)).toBe(false);
    }
    for (const grade of [8, 10])
      expect(
        findBundledCellsForScope({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade,
          subject: "chemie",
        }).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    expect(
      findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade: 9,
        subject: "chemie",
      }).map((cell) => cell.id),
    ).not.toContain(CELL_ID);
  });

  it("covers each branch's actual Lernbereiche with 22 lessons, and every card cites its lesson", () => {
    for (const [track, topics] of Object.entries(CURRICULA)) {
      const bound = tile.atoms.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.track === track,
        ),
      );
      expect(bound).toHaveLength(22);
      for (const [topic, lessons] of Object.entries(topics)) {
        expect(
          bound
            .filter((atom) =>
              atom.curricula?.some(
                (binding) =>
                  binding.provider === "lehrplanplus-bayern" &&
                  binding.track === track &&
                  binding.topic_code === topic,
              ),
            )
            .map((atom) =>
              new URL(atom.source_link!).hash.slice("#lesson=".length),
            )
            .sort(),
        ).toEqual([...lessons].sort());
      }
    }
    const lessons = new Set(
      Object.values(CURRICULA).flatMap((topics) =>
        Object.values(topics).flat(),
      ),
    );
    expect(lessons.size).toBe(35);
    for (const atom of tile.atoms) {
      expect(atom.curricula?.[0]).toMatchObject({
        provider: "zam-academy",
        subject: "chemie-realschule-9",
      });
      expect(atom.curricula?.[0].grade).toBeUndefined();
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(
        lessons.has(new URL(atom.source_link!).hash.slice("#lesson=".length)),
      ).toBe(true);
      for (const item of atom.practice_items) {
        expect(item.language).toBe("de");
        expect(item.source_link).toBe(atom.source_link);
        for (const segment of [
          ...(item.question_segments ?? []),
          ...(item.concept_segments ?? []),
        ]) {
          if (segment.type === "math") expect(segment.speech).toBeTruthy();
        }
      }
    }
  });

  it("pins exactly eleven replacements and five retirements, preserving whole synthesis demands", () => {
    const declared = items.flatMap((item) =>
      (item.replaces ?? []).map((id) => [id, item.slug]),
    );
    expect(Object.fromEntries(declared)).toEqual(REPLACEMENTS);
    expect(declared).toHaveLength(11);
    expect(tile.retired_items?.map((item) => item.id).sort()).toEqual(
      [...RETIRED].sort(),
    );
    const originals = legacyTiles.flatMap((old) =>
      old.atoms.flatMap((atom) => atom.practice_items),
    );
    expect(originals.map((item) => item.id).sort()).toEqual(
      [...Object.keys(REPLACEMENTS), ...RETIRED].sort(),
    );
    for (const [id, slug] of Object.entries(REPLACEMENTS)) {
      if (!slug.includes("-legacy-")) continue;
      const old = originals.find((item) => item.id === id)!;
      const successor = bySlug.get(slug)!;
      expect(successor.question).toBe(old.question);
      expect(successor.concept).toBe(old.concept);
      expect(successor.sample_solution).toEqual(old.sample_solution);
      expect(successor.tier).toBe("tier2_synthesis");
    }
  });

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;
    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-chemie-"));
      db = await openDatabase({
        dbPath: join(tempDir, "test.db"),
        useConfiguredCloud: false,
      });
    });
    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("enrols all 77 fresh cards as one library topic, with no duplicate on re-enrolment", async () => {
      expect(await enrolBundledCell(db, "learner", CELL_ID)).toMatchObject({
        success: true,
        cardsCreated: 77,
      });
      const topics = (await listLibraryTopics(db, "learner")).filter((topic) =>
        topic.key.startsWith(APP),
      );
      expect(topics).toHaveLength(1);
      expect(topics[0]).toMatchObject({
        key: APP,
        itemCount: 77,
        heldCount: 77,
      });
      expect(await enrolBundledCell(db, "learner", CELL_ID)).toMatchObject({
        cardsCreated: 0,
        alreadyEnrolled: true,
      });
    });

    it("refuses an automatic merge when both old and successor cards already have reviews", async () => {
      await installKvtTile(db, tile);
      for (const legacy of legacyTiles) await installKvtTile(db, legacy);
      const old = "01K4C9A0000000000000000J01";
      const successor = bySlug.get(REPLACEMENTS[old])!.id;
      for (const tokenId of [old, successor]) {
        const card = await ensureCard(db, tokenId, "learner");
        await evaluateRating(db, {
          cardId: card.id,
          tokenId,
          userId: "learner",
          rating: 3,
          answerFormat: "recall",
        });
      }
      const beforeCards = await db
        .prepare("SELECT * FROM cards ORDER BY id")
        .all();
      const beforeReviews = await db
        .prepare("SELECT * FROM review_logs ORDER BY id")
        .all();
      await expect(enrolBundledCell(db, "learner", CELL_ID)).rejects.toThrow(
        /holds a card on both|merge/i,
      );
      expect(await db.prepare("SELECT * FROM cards ORDER BY id").all()).toEqual(
        beforeCards,
      );
      expect(
        await db.prepare("SELECT * FROM review_logs ORDER BY id").all(),
      ).toEqual(beforeReviews);
    });
  });
});
