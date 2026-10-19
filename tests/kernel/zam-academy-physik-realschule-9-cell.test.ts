import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellTile,
  listLibraryTopics,
  openDatabase,
} from "../../src/kernel/index.js";

const CELL_ID = "zam-academy:physik-realschule-9";
const APP = "https://academy.zam-os.org/physik-realschule-9/";

/**
 * The lessons of the Physik-9 app in zam-os/zam-academy, by stage. A card
 * cites one of them, so renaming a lesson there breaks every card that
 * cites it. The app's own test pins the same ids.
 */
const LESSONS: Record<string, string[]> = {
  "stage-1-druck": [
    "dr-1-druck",
    "dr-2-hydraulik",
    "dr-3-schweredruck",
    "dr-4-auftrieb",
    "dr-5-boyle-mariotte",
  ],
  "stage-2-mechanik-energie": [
    "me-1-kraftwandler",
    "me-2-arbeit-leistung",
    "me-3-energieerhaltung",
    "me-4-wirkungsgrad",
  ],
  "stage-3-waermelehre": [
    "wl-1-temperatur",
    "wl-2-waermekapazitaet",
    "wl-3-mischung",
    "wl-4-aggregatzustand",
    "wl-5-wasseranomalie",
    "wl-6-gasgleichung",
  ],
  "stage-4-elektrizitaet": [
    "el-1-elektromagnet",
    "el-2-lorentzkraft-motor",
    "el-3-energie-leistung",
    "el-4-kennlinie-ohm",
    "el-5-widerstandsgesetz",
    "el-6-halbleiter",
  ],
};
const ALL_LESSONS = Object.values(LESSONS).flat();

describe("ZAM Academy Physik 9 Realschule cell", () => {
  const tile = getBundledCellTile(CELL_ID);

  it("is a bundled cell of the zam-academy provider, labelled by its publisher", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell?.title).toBe("Physik 9 Realschule (ZAM Academy)");
    expect(cell?.publisher).toBe("ZAM Academy");
    expect(cell?.gradeLabel).toBe("ZAM Academy");
    expect(cell?.atomCount).toBe(21);
    expect(
      findBundledCellsForScope({
        provider: "zam-academy",
        subject: "physik-realschule-9",
      }).map((c) => c.id),
    ).toContain(CELL_ID);
  });

  it("is also found at its LehrplanPLUS position, Realschule 9 Physik, for both Zweige", () => {
    for (const track of [undefined, "I", "II_III"]) {
      const ids = findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "realschule",
        grade: 9,
        subject: "physik",
        ...(track ? { track } : {}),
      }).map((c) => c.id);
      expect(ids, `track ${track ?? "any"}`).toContain(CELL_ID);
    }
    expect(
      findBundledCellsForScope({
        provider: "lehrplanplus-bayern",
        schoolType: "gymnasium",
        grade: 9,
        subject: "physik",
      }).map((c) => c.id),
    ).not.toContain(CELL_ID);
    const cell = getBundledCell(CELL_ID);
    expect(cell?.curriculumScopes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: "lehrplanplus-bayern",
          schoolType: "realschule",
          grade: 9,
          subject: "physik",
        }),
      ]),
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
      const lehrplan = atom.curricula?.filter(
        (binding) => binding.provider === "lehrplanplus-bayern",
      );
      expect(lehrplan?.length, atom.slug).toBeGreaterThan(0);
      for (const binding of lehrplan ?? []) {
        expect(binding.school_type).toBe("realschule");
        expect(binding.grade).toBe(9);
        expect(["I", "II_III"]).toContain(binding.track);
        expect(["lb1", "lb2", "lb3"]).toContain(binding.topic_code);
      }
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

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-physik-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("gives the learner every card, as one library topic", async () => {
      const items =
        tile?.atoms.reduce((n, atom) => n + atom.practice_items.length, 0) ?? 0;
      expect(items).toBe(58);
      const result = await enrolBundledCell(db, "learner", CELL_ID);
      expect(result.success).toBe(true);
      expect(result.cardsCreated).toBe(items);

      const topics = await listLibraryTopics(db, "learner");
      const app = topics.filter((topic) => topic.key.startsWith(APP));
      expect(app).toHaveLength(1);
      expect(app[0]).toMatchObject({
        key: APP,
        itemCount: items,
        heldCount: items,
      });
    });
  });
});
