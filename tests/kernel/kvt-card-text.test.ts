import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BUNDLED_TILES,
  type CardText,
  type Database,
  getTokenById,
  hasPendingCurriculumRetirements,
  installKvtTile,
  type KvtTile,
  listActiveDistractors,
  openDatabase,
  parseReviewFastCheck,
  parseStoredCardText,
  reconcileInstalledBundledTiles,
  type Token,
} from "../../src/kernel/index.js";

const TILE_ID = "test:kondensator";
const ATOM = "01K9TEST000000000000000A01";
const ITEM = "01K9TEST000000000000000J01";
const CHECK = "01K9TEST000000000000000J02";

const QUESTION: CardText = [
  { type: "text", text: "Wie ändert sich " },
  {
    type: "math",
    tex: "W_{\\text{el}} = \\frac{1}{2} C U^2",
    speech: "W el gleich ein halb C U Quadrat",
  },
  { type: "text", text: ", wenn d verdoppelt wird?" },
];

function tile(
  overrides: { version?: string; speech?: string; question?: string } = {},
): KvtTile {
  const question = QUESTION.map((segment) =>
    segment.type === "math" && overrides.speech
      ? { ...segment, speech: overrides.speech }
      : segment,
  );
  return {
    tile_id: TILE_ID,
    version: overrides.version ?? "2026.10.1",
    title: "Kondensator",
    publisher: "ZAM Test",
    atoms: [
      {
        id: ATOM,
        title: "Feldenergie",
        domain: "physik/elektrizitaet",
        practice_items: [
          {
            id: ITEM,
            language: "de",
            tier: "tier2_synthesis",
            bloom_level: 2,
            question_segments: question,
            ...(overrides.question ? { question: overrides.question } : {}),
            concept: "Die Energie verdoppelt sich.",
            materiality: "cosmetic",
            choice_distractors: [
              {
                segments: [
                  { type: "text", text: "Sie wird " },
                  { type: "math", tex: "\\frac{1}{4}", speech: "ein Viertel" },
                ],
                reason: "Q bleibt konstant.",
              },
            ],
          },
          {
            id: CHECK,
            language: "de",
            tier: "tier1_fast",
            bloom_level: 1,
            question: "Welche Formel gilt für die Feldenergie?",
            concept: "W = ½CU²",
            fast_check: {
              type: "binary_choice",
              options: [
                [
                  {
                    type: "math",
                    tex: "W = \\frac{1}{2} C U^2",
                    speech: overrides.speech ?? "W gleich ein halb C U Quadrat",
                  },
                ],
                "W = CU",
              ],
              correct_index: 0,
            },
          },
        ],
      },
    ],
  };
}

describe("tiles with card-text segments (ADR 2026-10-14b, plan Phase 4)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-kvt-card-text-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  const token = async (id: string) => (await getTokenById(db, id)) as Token;

  it("installs segments with derived plain text and records the version", async () => {
    await installKvtTile(db, tile());
    const item = await token(ITEM);
    expect(item.question).toBe(
      "Wie ändert sich W_el = ½CU², wenn d verdoppelt wird?",
    );
    expect(parseStoredCardText(item.question_segments)).toEqual(QUESTION);

    const check = parseReviewFastCheck((await token(CHECK)).fast_check);
    expect(check?.options).toEqual(["W = ½CU²", "W = CU"]);
    expect(check?.optionSegments?.[1]).toBeNull();

    const [option] = await listActiveDistractors(
      db,
      ITEM,
      (await import("../../src/kernel/index.js")).choiceSourceHash(item),
    );
    expect(option.text).toBe("Sie wird ¼");

    const row = await db
      .prepare(
        "SELECT version, failed_at FROM installed_tiles WHERE tile_id = ?",
      )
      .get(TILE_ID);
    expect(row).toEqual({ version: "2026.10.1", failed_at: null });
  });

  it("reinstalls an unchanged tile without touching a row", async () => {
    await installKvtTile(db, tile());
    const before = await token(ITEM);
    const result = await installKvtTile(db, tile());
    expect(result.tokensRevised).toBe(0);
    const after = await token(ITEM);
    expect(after.updated_at).toBe(before.updated_at);
    expect(after.question_segments).toBe(before.question_segments);
  });

  it("delivers new speech without a revision", async () => {
    await installKvtTile(db, tile());
    const before = await token(ITEM);
    const checkBefore = await token(CHECK);
    const result = await installKvtTile(
      db,
      tile({ version: "2026.10.2", speech: "anders vorgelesen" }),
    );
    expect(result.tokensRevised).toBe(0);
    const after = await token(ITEM);
    expect(after.content_version).toBe(before.content_version);
    expect(after.question).toBe(before.question);
    const math = parseStoredCardText(after.question_segments)?.find(
      (segment) => segment.type === "math",
    );
    expect(math).toMatchObject({ speech: "anders vorgelesen" });
    const check = await token(CHECK);
    expect(check.content_version).toBe(checkBefore.content_version);
    expect(
      parseReviewFastCheck(check.fast_check)?.optionSegments?.[0]?.[0],
    ).toMatchObject({ speech: "anders vorgelesen" });
  });

  it("delivers a curated option's new reading on reinstall", async () => {
    await installKvtTile(db, tile());
    const next = tile({ version: "2026.10.2" });
    const distractor = next.atoms[0].practice_items[0].choice_distractors?.[0];
    const math = distractor?.segments?.[1];
    if (!math || math.type !== "math") throw new Error("fixture changed");
    math.speech = "ein viertel so viel";
    await installKvtTile(db, next);
    const item = await token(ITEM);
    const options = await listActiveDistractors(
      db,
      ITEM,
      (await import("../../src/kernel/index.js")).choiceSourceHash(item),
    );
    expect(options).toHaveLength(1);
    expect(options[0].segments?.[1]).toMatchObject({
      speech: "ein viertel so viel",
    });
  });

  it("refuses a tile whose plain question disagrees with its segments", async () => {
    await expect(
      installKvtTile(db, tile({ question: "Etwas ganz anderes?" })),
    ).rejects.toThrow(/does not match question_segments/);
    const row = (await db
      .prepare(
        "SELECT failed_at, last_error FROM installed_tiles WHERE tile_id = ?",
      )
      .get(TILE_ID)) as { failed_at: string | null; last_error: string };
    expect(row.failed_at).not.toBeNull();
    expect(row.last_error).toMatch(/does not match/);
  });

  it("refuses published segments without speech", async () => {
    const silent = tile();
    const item = silent.atoms[0].practice_items[0];
    item.question_segments = [{ type: "math", tex: "x^2" }];
    await expect(installKvtTile(db, silent)).rejects.toThrow(/speech/);
  });
});

describe("reconcileInstalledBundledTiles", () => {
  let db: Database;
  let tempDir: string;
  const bundled = Object.values(BUNDLED_TILES)[0];

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-reconcile-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("touches nothing in a library without installed tiles", async () => {
    const result = await reconcileInstalledBundledTiles(db);
    expect(result).toEqual({
      installed: 0,
      reinstalled: [],
      failed: [],
      remaining: 0,
    });
  });

  it("reinstalls an installed tile with no or another recorded version, once", async () => {
    await installKvtTile(db, bundled);
    await db.prepare("DELETE FROM installed_tiles").run();
    const first = await reconcileInstalledBundledTiles(db);
    expect(first.reinstalled).toEqual([bundled.tile_id]);
    expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual([]);

    await db
      .prepare("UPDATE installed_tiles SET version = 'older' WHERE tile_id = ?")
      .run(bundled.tile_id);
    expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual([
      bundled.tile_id,
    ]);
  });

  // ADR 2026-10-19 Decision 4: a newer version from the academy catalog must
  // survive the next start of an older build.
  it("never downgrades a tile recorded ahead of this build", async () => {
    await installKvtTile(db, bundled);
    await db
      .prepare("UPDATE installed_tiles SET version = ? WHERE tile_id = ?")
      .run("9999.1.1", bundled.tile_id);
    expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual([]);
    const row = (await db
      .prepare("SELECT version FROM installed_tiles WHERE tile_id = ?")
      .get(bundled.tile_id)) as { version: string };
    expect(row.version).toBe("9999.1.1");
  });

  it("applies withdrawals missed by an older kernel even when the recorded version is current", async () => {
    const original = BUNDLED_TILES[bundled.tile_id];
    const old = structuredClone(original);
    old.version = "2026.10.1";
    const wrong = {
      provider: "lehrplanplus-bayern",
      school_type: "realschule",
      grade: 10,
      track: "",
      subject: "pug",
      topic_code: "lb1",
    };
    old.atoms[0].curricula = [wrong];
    const fixed = structuredClone(old);
    fixed.version = "2026.10.2";
    fixed.atoms[0].curricula = [{ ...wrong, topic_code: "lb3" }];
    fixed.atoms[0].retired_curricula = [
      { ...wrong, reason: "An old kernel did not understand this correction" },
    ];
    try {
      BUNDLED_TILES[bundled.tile_id] = fixed;
      await installKvtTile(db, old);
      const olderKernel = structuredClone(fixed);
      delete olderKernel.atoms[0].retired_curricula;
      await installKvtTile(db, olderKernel);
      expect(await hasPendingCurriculumRetirements(db, fixed)).toBe(true);
      expect(
        await getTokenById(db, old.atoms[0].practice_items[0].id),
      ).toMatchObject({ topic_id: "lb1" });
      // Even an explicit withdrawal may not downgrade a newer catalog tile.
      await db
        .prepare(
          "UPDATE installed_tiles SET version = '9999.1.1' WHERE tile_id = ?",
        )
        .run(bundled.tile_id);
      expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual(
        [],
      );
      expect(await hasPendingCurriculumRetirements(db, fixed)).toBe(true);
      await db
        .prepare("UPDATE installed_tiles SET version = ? WHERE tile_id = ?")
        .run(fixed.version, bundled.tile_id);
      const limited = await reconcileInstalledBundledTiles(db, { maxTiles: 0 });
      expect(limited).toMatchObject({ reinstalled: [], remaining: 1 });
      expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual([
        bundled.tile_id,
      ]);
      expect(await hasPendingCurriculumRetirements(db, fixed)).toBe(false);
      expect(
        await getTokenById(db, old.atoms[0].practice_items[0].id),
      ).toMatchObject({ topic_id: "lb3" });
      expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual(
        [],
      );
    } finally {
      BUNDLED_TILES[bundled.tile_id] = original;
    }
  });

  it("records malformed withdrawals and backs off instead of breaking each startup", async () => {
    const original = BUNDLED_TILES[bundled.tile_id];
    await installKvtTile(db, original);
    const invalid = structuredClone(original);
    invalid.atoms[0].retired_curricula = [
      { provider: "test" },
    ] as unknown as NonNullable<KvtTile["atoms"][number]["retired_curricula"]>;
    try {
      BUNDLED_TILES[bundled.tile_id] = invalid;
      const result = await reconcileInstalledBundledTiles(db);
      expect(result.reinstalled).toEqual([]);
      expect(result.failed).toEqual([
        {
          tileId: bundled.tile_id,
          error: expect.stringMatching(/full scope and a reason/),
        },
      ]);
      expect((await reconcileInstalledBundledTiles(db)).failed).toEqual([]);
    } finally {
      BUNDLED_TILES[bundled.tile_id] = original;
    }
  });

  it("reinstalls a tile recorded at an older dotted version", async () => {
    await installKvtTile(db, bundled);
    await db
      .prepare("UPDATE installed_tiles SET version = ? WHERE tile_id = ?")
      .run("0.0.1", bundled.tile_id);
    expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual([
      bundled.tile_id,
    ]);
  });

  it("stops at the limit and leaves the rest for the next start", async () => {
    await installKvtTile(db, bundled);
    await db.prepare("DELETE FROM installed_tiles").run();
    const result = await reconcileInstalledBundledTiles(db, { maxTiles: 0 });
    expect(result).toMatchObject({ reinstalled: [], remaining: 1 });
  });

  it("does not retry a tile that failed since this process started", async () => {
    await installKvtTile(db, bundled);
    await db
      .prepare(
        "UPDATE installed_tiles SET version = 'older', failed_at = ? WHERE tile_id = ?",
      )
      .run(new Date(Date.now() + 1000).toISOString(), bundled.tile_id);
    expect((await reconcileInstalledBundledTiles(db)).reinstalled).toEqual([]);
  });

  it("leaves a tile whose first install failed to the learner", async () => {
    await db
      .prepare(
        `INSERT INTO installed_tiles (tile_id, version, installed_at, failed_at, last_error)
         VALUES (?, '', ?, ?, 'boom')`,
      )
      .run(bundled.tile_id, "2026-01-01", "2026-01-01");
    expect(await reconcileInstalledBundledTiles(db)).toMatchObject({
      installed: 0,
      reinstalled: [],
    });
  });

  it("refuses a team library, whose administrator publishes", async () => {
    const team = Object.assign(Object.create(db), { dialect: "postgres" });
    await expect(reconcileInstalledBundledTiles(team)).rejects.toThrow(
      /administrator/,
    );
  });
});
