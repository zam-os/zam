import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  attachKvtTile,
  type Database,
  getCard,
  getPrerequisites,
  getTokenById,
  openDatabase,
} from "../../src/kernel/index.js";

const fixturePath = resolve(
  __dirname,
  "../fixtures/curriculum/de-by-realschule-optik-kvt.json",
);

function loadTile(): unknown {
  return JSON.parse(readFileSync(fixturePath, "utf-8"));
}

describe("attachKvtTile", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-kvt-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true, maxRetries: 10 });
  });

  it("materialises atoms, practice items, cards and overlay bindings", async () => {
    const result = await attachKvtTile(db, loadTile(), "learner-a");

    expect(result.atomsUpserted).toBe(4);
    expect(result.tokensCreated).toBe(7);
    expect(result.tokensReused).toBe(0);
    expect(result.cardsCreated).toBe(7);
    expect(result.cardsReused).toBe(0);
    expect(result.bindings).toBe(7);
    expect(result.alignments).toBeGreaterThanOrEqual(4);

    const atomCount = (await db
      .prepare("SELECT COUNT(*) as n FROM learning_atoms")
      .get()) as { n: number };
    expect(atomCount.n).toBe(4);

    const qualitativeBindings = (await db
      .prepare(
        `SELECT grade, track FROM atom_curriculum_bindings
          WHERE atom_id = ? ORDER BY grade`,
      )
      .all("atom:zam:optik:brechung-qualitativ")) as Array<{
      grade: number;
      track: string;
    }>;
    expect(qualitativeBindings).toEqual([
      { grade: 7, track: "I" },
      { grade: 8, track: "II_III" },
    ]);

    const token = await getTokenById(db, "01K3X9A7R4B8C1D2E3F4G5H003");
    expect(token?.atom_id).toBe("atom:zam:optik:brechung-qualitativ");
    expect(token?.question).toMatch(/Luft in Wasser/);

    const card = await getCard(db, token!.id, "learner-a");
    expect(card?.state).toBe("new");
    expect(card?.reps).toBe(0);
    expect(card?.stability).toBe(0);
  });

  it("wires hard atom prerequisites onto the first practice item", async () => {
    await attachKvtTile(db, loadTile(), "learner-a");
    const prereqs = await getPrerequisites(
      db,
      "01K3X9A7R4B8C1D2E3F4G5H003",
    );
    expect(prereqs.map((row) => row.requires_id)).toEqual([
      "01K3X9A7R4B8C1D2E3F4G5H001",
    ]);

    const softOnly = (await db
      .prepare(
        `SELECT kind FROM atom_prerequisites
          WHERE atom_id = ? AND requires_id = ?`,
      )
      .get(
        "atom:zam:optik:brechung-qualitativ",
        "atom:zam:optik:strahlengang-lot",
      )) as { kind: string };
    expect(softOnly.kind).toBe("hard");
  });

  it("does not rewrite FSRS state on a second attach", async () => {
    await attachKvtTile(db, loadTile(), "learner-a");
    const tokenId = "01K3X9A7R4B8C1D2E3F4G5H003";
    const before = await getCard(db, tokenId, "learner-a");
    expect(before).toBeDefined();

    await db
      .prepare(
        `UPDATE cards SET reps = 1, state = 'review', stability = 2.5
          WHERE id = ?`,
      )
      .run(before!.id);

    const second = await attachKvtTile(db, loadTile(), "learner-a");
    expect(second.tokensCreated).toBe(0);
    expect(second.tokensReused).toBe(7);
    expect(second.cardsCreated).toBe(0);
    expect(second.cardsReused).toBe(7);

    const after = await getCard(db, tokenId, "learner-a");
    expect(after?.reps).toBe(1);
    expect(after?.state).toBe("review");
    expect(after?.stability).toBe(2.5);
  });

  it("gives a second learner their own new cards on the same tokens", async () => {
    await attachKvtTile(db, loadTile(), "learner-a");
    const result = await attachKvtTile(db, loadTile(), "learner-b");
    expect(result.tokensCreated).toBe(0);
    expect(result.tokensReused).toBe(7);
    expect(result.cardsCreated).toBe(7);

    const tokenCount = (await db
      .prepare("SELECT COUNT(*) as n FROM tokens")
      .get()) as { n: number };
    expect(tokenCount.n).toBe(7);
  });

  it("rejects an atom id that is not a published PAID-free namespace", async () => {
    const tile = loadTile() as { atoms: Array<{ id: string }> };
    tile.atoms[0].id = "wd:Q208391/qualitative";
    await expect(attachKvtTile(db, tile, "learner-a")).rejects.toThrow(
      /Invalid published atom id/,
    );
  });

  it("merges Gymnasium 8 without wiping Realschule bindings", async () => {
    await attachKvtTile(db, loadTile(), "learner-a");
    const gym = JSON.parse(
      readFileSync(
        resolve(__dirname, "../fixtures/curriculum/de-by-gymnasium-8-optik-kvt.json"),
        "utf-8",
      ),
    );
    const result = await attachKvtTile(db, gym, "learner-a");
    expect(result.tokensCreated).toBe(5);
    expect(result.tokensReused).toBe(3);

    const bindings = (await db
      .prepare(
        `SELECT school_type, grade, topic_code FROM atom_curriculum_bindings
          WHERE atom_id = ? ORDER BY school_type, grade`,
      )
      .all("atom:zam:optik:brechung-qualitativ")) as Array<{
      school_type: string;
      grade: number;
      topic_code: string;
    }>;
    expect(bindings).toEqual([
      { school_type: "gymnasium", grade: 8, topic_code: "215729" },
      { school_type: "realschule", grade: 7, topic_code: "PH7-LB2" },
      { school_type: "realschule", grade: 8, topic_code: "PH8-LB2" },
    ]);
  });

  it("keeps Gym bindings if the Realschule tile is attached second", async () => {
    const gym = JSON.parse(
      readFileSync(
        resolve(__dirname, "../fixtures/curriculum/de-by-gymnasium-8-optik-kvt.json"),
        "utf-8",
      ),
    );
    await attachKvtTile(db, gym, "learner-a");
    await attachKvtTile(db, loadTile(), "learner-a");

    const gymBinding = (await db
      .prepare(
        `SELECT topic_code FROM atom_curriculum_bindings
          WHERE atom_id = ? AND school_type = 'gymnasium'`,
      )
      .get("atom:zam:optik:brechung-qualitativ")) as { topic_code: string };
    expect(gymBinding.topic_code).toBe("215729");
  });

  it("attaches all four overlapping cells onto one atom graph", async () => {
    const files = [
      "de-by-realschule-optik-kvt.json",
      "de-by-gymnasium-8-optik-kvt.json",
      "de-by-realschule-optik-erweiterung-kvt.json",
      "de-by-bos-10-optik-kvt.json",
    ];
    for (const file of files) {
      const tile = JSON.parse(
        readFileSync(resolve(__dirname, "../fixtures/curriculum", file), "utf-8"),
      );
      await attachKvtTile(db, tile, "learner-a");
    }

    const atoms = (await db
      .prepare("SELECT COUNT(*) as n FROM learning_atoms")
      .get()) as { n: number };
    expect(atoms.n).toBe(9);

    const tokens = (await db
      .prepare("SELECT COUNT(*) as n FROM tokens")
      .get()) as { n: number };
    expect(tokens.n).toBe(15);

    const refractionBindings = (await db
      .prepare(
        `SELECT COUNT(*) as n FROM atom_curriculum_bindings
          WHERE atom_id = 'atom:zam:optik:brechung-qualitativ'`,
      )
      .get()) as { n: number };
    expect(refractionBindings.n).toBe(4);

    const dispersion = (await db
      .prepare(
        `SELECT school_type, grade FROM atom_curriculum_bindings
          WHERE atom_id = 'atom:zam:optik:dispersion-spektrum'`,
      )
      .all()) as Array<{ school_type: string; grade: number }>;
    expect(dispersion).toEqual([{ school_type: "realschule", grade: 7 }]);
  });
});
