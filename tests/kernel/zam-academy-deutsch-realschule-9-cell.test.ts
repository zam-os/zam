import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  needsGenericCurriculumImport,
  openDatabase,
} from "../../src/kernel/index.js";

const CELL_ID = "zam-academy:deutsch-realschule-9";
const LEGACY_ID = "de-by:realschule-9-deutsch-argumentation-eroerterung";
const APP = "https://academy.zam-os.org/deutsch-realschule-9/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const CORE_COUNTS: Record<string, number> = {
  lb1: 11,
  lb2: 16,
  lb3: 13,
  lb4: 13,
};
const scope = (track?: string, grade = 9) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject: "deutsch",
  ...(track ? { track } : {}),
});

// Deutsch 9 is one Fachlehrplan for every Wahlpflichtfächergruppe, so the
// cell's curriculum binding names no track (zam-os/zam-academy#30).
describe("ZAM Academy Deutsch 9 Realschule cell", () => {
  it("bundles the published bytes and keeps the old partial cell untouched", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Deutsch 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 53,
    });
    expect(items).toHaveLength(159);
    // No mapping is approved yet, so nothing is replaced or retired.
    expect(tile.retired_items).toBeUndefined();
    for (const item of items) expect(item.replaces).toBeUndefined();
    expect(getBundledCell(LEGACY_ID)).toBeDefined();
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
  });

  it("is offered to every Wahlpflichtfächergruppe of grade 9, and to no other grade or school type", () => {
    for (const track of [
      undefined,
      "I",
      "wpfg1",
      "II",
      "wpfg2",
      "III",
      "wpfg3",
      "IIIa",
      "wpfg3a",
      "IIIb",
      "wpfg3b",
      "II_III",
      "wpfg2-3",
    ]) {
      expect(
        findBundledCellsForScope(scope(track)).map((cell) => cell.id),
        `Deutsch ${track}`,
      ).toContain(CELL_ID);
      expect(needsGenericCurriculumImport(scope(track))).toBe(false);
    }
    for (const grade of [8, 10])
      expect(
        findBundledCellsForScope(scope("I", grade)).map((cell) => cell.id),
      ).not.toContain(CELL_ID);
    expect(
      findBundledCellsForScope({ ...scope("I"), schoolType: "gymnasium" }).map(
        (cell) => cell.id,
      ),
    ).not.toContain(CELL_ID);
  });

  it("binds all 53 lessons to the four Lernbereiche, with no group named", () => {
    for (const [topic, count] of Object.entries(CORE_COUNTS)) {
      const atoms = tile.atoms.filter((atom) =>
        atom.curricula?.some(
          (binding) =>
            binding.provider === "lehrplanplus-bayern" &&
            binding.topic_code === topic,
        ),
      );
      expect(atoms, topic).toHaveLength(count);
      for (const atom of atoms)
        expect(
          atom.curricula?.filter(
            (binding) => binding.provider === "lehrplanplus-bayern",
          ),
        ).toEqual([
          expect.objectContaining({
            school_type: "realschule",
            grade: 9,
            subject: "deutsch",
            topic_code: topic,
            exam_relevant: true,
          }),
        ]);
    }
    for (const atom of tile.atoms)
      for (const binding of atom.curricula ?? [])
        expect(binding).not.toHaveProperty("track");
  });

  it("links every card to its lesson and keeps three single-point cards per lesson", () => {
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(atom.practice_items).toHaveLength(3);
      expect(atom.practice_items.map((item) => item.tier)).toEqual([
        "tier1_fast",
        "tier2_synthesis",
        "tier1_fast",
      ]);
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.language).toBe("de");
        expect(item.concept?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  describe("enrolment", () => {
    let dir: string, db: Database;
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-de9-"));
      db = await openDatabase({
        dbPath: join(dir, "test.db"),
        useConfiguredCloud: false,
      });
    });
    afterEach(async () => {
      await db.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("creates one card per item and can sit beside the old partial cell without a conflict", async () => {
      const legacyCards = getBundledCellTile(LEGACY_ID)!.atoms.reduce(
        (n, atom) => n + atom.practice_items.length,
        0,
      );
      const old = await enrolBundledCell(db, "de9-learner", LEGACY_ID);
      expect(old.success).toBe(true);
      expect(old.cardsCreated).toBe(legacyCards);
      const result = await enrolBundledCell(db, "de9-learner", CELL_ID);
      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(159);
      expect(result.alreadyEnrolled).toBe(false);
      const again = await enrolBundledCell(db, "de9-learner", CELL_ID);
      expect(again.alreadyEnrolled).toBe(true);
      expect(again.cardsCreated).toBe(0);
      const cards = (await db
        .prepare("SELECT COUNT(*) AS count FROM cards WHERE user_id = ?")
        .get("de9-learner")) as { count: number };
      expect(cards.count).toBe(legacyCards + 159);
    });
  });
});
