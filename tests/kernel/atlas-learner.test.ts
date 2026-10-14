import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ATLAS_LENS_SETTING,
  createToken,
  type Database,
  ensureCard,
  openDatabase,
  readAtlasPrefs,
  readLearnerAtlas,
  setSetting,
} from "../../src/kernel/index.js";

/**
 * One learner's atlas as every surface reads it (plan Phase 10b): the Studio's
 * bridge and Mobile open the same lens and get the same map.
 */
describe("readLearnerAtlas", () => {
  let dir: string;
  let db: Database;

  beforeEach(async () => {
    dir = mkdtempSync(join(tmpdir(), "zam-atlas-learner-"));
    db = await openDatabase({
      dbPath: join(dir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const token = await createToken(db, {
      slug: "hebel",
      concept: "Ein Hebel überträgt Kraft.",
      domain: "physik/mechanik",
      question: "Was macht ein Hebel?",
    });
    await ensureCard(db, token.id, "learner");
  });

  afterEach(async () => {
    await db.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it("opens the learner's lens, else the library's default, and names the lenses", async () => {
    const view = await readLearnerAtlas(db, {
      userId: "learner",
      mayWrite: false,
    });
    expect(view.lens.kind).toBe("weltwissen");
    expect(view.ownPlanet).toBe("privat");
    expect(view.lenses.map((lens) => lens.kind)).toEqual([
      "weltwissen",
      "schule",
      "leben",
    ]);
    expect(view.units).toHaveLength(1);
    // Nothing was stored by the read.
    const land = (await db
      .prepare("SELECT COUNT(*) AS n FROM atlas_land")
      .get()) as { n: number };
    expect(Number(land.n)).toBe(0);

    await setSetting(db, ATLAS_LENS_SETTING, "leben");
    expect((await readAtlasPrefs(db)).lens).toBe("leben");
    expect(
      (await readLearnerAtlas(db, { userId: "learner", mayWrite: false })).lens
        .kind,
    ).toBe("leben");
    // A planet alone opens its lens; a lens of the other planet is refused.
    expect(
      (
        await readLearnerAtlas(db, {
          userId: "learner",
          planet: "welt",
          mayWrite: false,
        })
      ).lens.kind,
    ).toBe("weltwissen");
    await expect(
      readLearnerAtlas(db, {
        userId: "learner",
        lens: "produkte",
        mayWrite: false,
      }),
    ).rejects.toThrow();
  });
});
