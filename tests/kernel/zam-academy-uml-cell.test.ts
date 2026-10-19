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

const CELL_ID = "zam-academy:uml";
const APP = "https://academy.zam-os.org/uml/";

/**
 * The lessons of the UML app in zam-os/zam-academy, by stage. A card cites
 * one of them, so renaming a lesson there breaks every card that cites it.
 */
const LESSONS: Record<string, string[]> = {
  "stage-1-use-case": [
    "uc-1-boxes",
    "uc-2-connections",
    "uc-3-detective",
    "uc-4-capstone",
  ],
  "stage-2-class": [
    "cls-1-boxes",
    "cls-2-connections",
    "cls-3-detective",
    "cls-4-capstone",
  ],
  "stage-3-activity": [
    "act-1-boxes",
    "act-2-connections",
    "act-3-detective",
    "act-4-capstone",
  ],
  "stage-4-state": [
    "stm-1-boxes",
    "stm-2-connections",
    "stm-3-detective",
    "stm-4-capstone",
  ],
  "stage-5-sequence": [
    "seq-1-boxes",
    "seq-2-connections",
    "seq-3-detective",
    "seq-4-capstone",
  ],
  "stage-6-component": [
    "cmp-1-boxes",
    "cmp-2-connections",
    "cmp-3-detective",
    "cmp-4-capstone",
  ],
};

describe("ZAM Academy UML cell", () => {
  const tile = getBundledCellTile(CELL_ID);

  it("is a bundled cell of the zam-academy provider", () => {
    const cell = getBundledCell(CELL_ID);
    expect(cell?.title).toBe("UML 2.5.1 (ZAM Academy)");
    expect(cell?.publisher).toBe("ZAM Academy");
    // Labelled by its publisher: a stage is no school place.
    expect(cell?.gradeLabel).toBe("ZAM Academy");
    expect(cell?.atomCount).toBe(6);
    expect(
      findBundledCellsForScope({ provider: "zam-academy", subject: "uml" }).map(
        (c) => c.id,
      ),
    ).toContain(CELL_ID);
  });

  it("follows the app's stages, one atom each, in the app's order", () => {
    expect(tile?.atoms.map((atom) => atom.curricula?.[0]?.topic_code)).toEqual(
      Object.keys(LESSONS),
    );
  });

  it("links every card to a lesson of its own stage", () => {
    for (const atom of tile?.atoms ?? []) {
      const stage = atom.curricula?.[0]?.topic_code ?? "";
      const lessons = LESSONS[stage] ?? [];
      for (const item of [atom, ...atom.practice_items]) {
        const link = item.source_link ?? "";
        expect(link.startsWith(`${APP}#lesson=`), link).toBe(true);
        expect(lessons, `${item.id} cites ${link}`).toContain(
          link.slice(`${APP}#lesson=`.length),
        );
      }
    }
  });

  describe("enrolment", () => {
    let tempDir: string;
    let db: Database;

    beforeEach(async () => {
      tempDir = mkdtempSync(join(tmpdir(), "zam-academy-uml-"));
      db = await openDatabase({ dbPath: join(tempDir, "test.db") });
    });

    afterEach(async () => {
      await db.close();
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
    });

    it("gives the learner every card, as one library topic", async () => {
      const items =
        tile?.atoms.reduce((n, atom) => n + atom.practice_items.length, 0) ?? 0;
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
