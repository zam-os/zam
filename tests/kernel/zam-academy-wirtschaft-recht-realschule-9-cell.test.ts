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

const CELL_ID = "zam-academy:wirtschaft-recht-realschule-9";
const LEGACY_ID = "de-by:realschule-9-wirtschaft-recht-markt-vertraege";
const APP = "https://academy.zam-os.org/wirtschaft-recht-realschule-9/";
const tile = getBundledCellTile(CELL_ID)!;
const items = tile.atoms.flatMap((atom) => atom.practice_items);
const CORE_COUNTS: Record<string, number> = {
  lb1: 10,
  lb2: 10,
  lb3: 9,
  lb4: 17,
};
const lessonId = (link: string) => new URL(link).hash.slice("#lesson=".length);
const scope = (subject: string, track?: string, grade = 9) => ({
  provider: "lehrplanplus-bayern",
  schoolType: "realschule",
  grade,
  subject,
  ...(track ? { track } : {}),
});

// Wirtschaft und Recht 9 is one Fachlehrplan for the groups I and III; group
// II learns BwR in this grade (zam-os/zam-academy#27).
describe("ZAM Academy Wirtschaft und Recht 9 Realschule cell", () => {
  it("bundles the published bytes and keeps the old partial cell untouched", () => {
    expect(tile.version).toBe("2026.10.1");
    expect(getBundledCell(CELL_ID)).toMatchObject({
      title: "Wirtschaft und Recht 9 Realschule (ZAM Academy)",
      publisher: "ZAM Academy",
      gradeLabel: "ZAM Academy",
      atomCount: 50,
    });
    expect(items).toHaveLength(150);
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
          readFileSync(
            join(__dirname, "../fixtures/curriculum", entry.file),
          ),
        )
        .digest("hex"),
    ).toBe(entry.sha256);
  });

  it("is offered to groups I, IIIa and IIIb, never to group II or other grades", () => {
    for (const subject of ["wirtschaft-und-recht", "wirtschaft_und_recht"]) {
      for (const track of [
        undefined,
        "I",
        "wpfg1",
        "III",
        "wpfg3",
        "IIIa",
        "wpfg3a",
        "IIIb",
        "wpfg3b",
        "I/III",
        "wpfg1-3",
      ]) {
        expect(
          findBundledCellsForScope(scope(subject, track)).map(
            (cell) => cell.id,
          ),
          `${subject} ${track}`,
        ).toContain(CELL_ID);
        expect(needsGenericCurriculumImport(scope(subject, track))).toBe(false);
      }
      for (const track of ["II", "wpfg2"])
        expect(
          findBundledCellsForScope(scope(subject, track)).map(
            (cell) => cell.id,
          ),
          `${subject} ${track}`,
        ).not.toContain(CELL_ID);
      for (const grade of [8, 10])
        expect(
          findBundledCellsForScope(scope(subject, "I", grade)).map(
            (cell) => cell.id,
          ),
        ).not.toContain(CELL_ID);
    }
    expect(
      findBundledCellsForScope({
        ...scope("wirtschaft-und-recht", "I"),
        schoolType: "gymnasium",
      }).map((cell) => cell.id),
    ).not.toContain(CELL_ID);
  });

  it("binds 46 core lessons to the four Lernbereiche in both groups and leaves four English lessons unbound", () => {
    const core = tile.atoms.filter((atom) =>
      atom.curricula?.some(
        (binding) => binding.provider === "lehrplanplus-bayern",
      ),
    );
    expect(core).toHaveLength(46);
    for (const [topic, count] of Object.entries(CORE_COUNTS)) {
      const atoms = core.filter((atom) =>
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
        ).toEqual(
          ["I", "III"].map((track) =>
            expect.objectContaining({
              school_type: "realschule",
              grade: 9,
              track,
              subject: "wirtschaft-und-recht",
              topic_code: topic,
              exam_relevant: true,
            }),
          ),
        );
    }
    const optional = tile.atoms.filter((atom) => !core.includes(atom));
    expect(optional.map((atom) => lessonId(atom.source_link!))).toEqual([
      "en-work-unemployment",
      "en-job-application",
      "en-supply-demand",
      "en-social-systems",
    ]);
    for (const atom of optional) {
      expect(atom.curricula).toEqual([
        expect.objectContaining({
          provider: "zam-academy",
          subject: "wirtschaft-recht-realschule-9",
          topic_code: "lb5",
        }),
      ]);
      for (const item of atom.practice_items) expect(item.language).toBe("en");
    }
  });

  it("links every card to its lesson and keeps two or three single-point cards per lesson", () => {
    for (const atom of tile.atoms) {
      expect(atom.source_link?.startsWith(`${APP}#lesson=`)).toBe(true);
      expect(atom.practice_items.length).toBeGreaterThanOrEqual(2);
      expect(atom.practice_items.length).toBeLessThanOrEqual(3);
      expect(atom.practice_items[0].tier).toBe("tier1_fast");
      for (const item of atom.practice_items) {
        expect(item.source_link).toBe(atom.source_link);
        expect(item.concept?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  describe("enrolment", () => {
    let dir: string, db: Database;
    beforeEach(async () => {
      dir = mkdtempSync(join(tmpdir(), "zam-academy-wr9-"));
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
      const old = await enrolBundledCell(db, "wr9-learner", LEGACY_ID);
      expect(old.success).toBe(true);
      expect(old.cardsCreated).toBe(legacyCards);
      const result = await enrolBundledCell(db, "wr9-learner", CELL_ID);
      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(150);
      expect(result.alreadyEnrolled).toBe(false);
      const again = await enrolBundledCell(db, "wr9-learner", CELL_ID);
      expect(again.alreadyEnrolled).toBe(true);
      expect(again.cardsCreated).toBe(0);
      const cards = (await db
        .prepare("SELECT COUNT(*) AS count FROM cards WHERE user_id = ?")
        .get("wr9-learner")) as { count: number };
      expect(cards.count).toBe(legacyCards + 150);
    });
  });
});
