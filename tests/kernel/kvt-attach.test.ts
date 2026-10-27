import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type Database,
  ensureCard,
  evaluateRating,
  getCard,
  getPrerequisites,
  getTokenById,
  hasPendingCurriculumRetirements,
  installKvtTile,
  type KvtTile,
  type KvtProgress,
  listLibraryTopics,
  materialiseKvtCards,
  openDatabase,
} from "../../src/kernel/index.js";
import { OPTIK, REALSCHULE_CELL } from "../helpers/optik-atoms.js";

const FIXTURES = resolve(__dirname, "../fixtures/curriculum");

const BONUS_ONLY_ATOM = OPTIK.snelliusFormel;

function loadFixture(name: string): KvtTile {
  return JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf-8"));
}

function loadTile(): KvtTile {
  return loadFixture("de-by-realschule-optik-kvt");
}

const ALL_CELLS = [
  "de-by-realschule-optik-kvt",
  "de-by-gymnasium-8-optik-kvt",
  "de-by-realschule-optik-erweiterung-kvt",
  "de-by-bos-10-optik-kvt",
];

/** Everything a release owns, minus timestamps, ordered for comparison. */
async function snapshot(db: Database): Promise<string> {
  const parts: string[] = [];
  for (const sql of [
    `SELECT id, title, domain, reduction, typical_age_min FROM learning_atoms ORDER BY id`,
    `SELECT atom_id, target_uri, alignment_type FROM atom_alignments ORDER BY atom_id, target_uri`,
    `SELECT atom_id, provider, school_type, grade, track, topic_code, exam_relevant
       FROM atom_curriculum_bindings
      ORDER BY atom_id, provider, topic_code, COALESCE(grade, -1), track`,
    `SELECT atom_id, requires_id, kind FROM atom_prerequisites ORDER BY atom_id, requires_id`,
    `SELECT id, slug, atom_id, provider, topic_id, question, concept, bloom_level,
            content_version
       FROM tokens ORDER BY id`,
    `SELECT token_id, requires_id FROM prerequisites ORDER BY token_id, requires_id`,
  ]) {
    parts.push(JSON.stringify(await db.prepare(sql).all()));
  }
  return parts.join("\n");
}

async function countRows(db: Database, table: string): Promise<number> {
  const row = (await db
    .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
    .get()) as {
    n: number;
  };
  return row.n;
}

describe("installKvtTile", () => {
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

  it("installs atoms, items and bindings", async () => {
    const progress: KvtProgress[] = [];
    const result = await installKvtTile(db, loadTile(), {
      onProgress: (event) => progress.push(event),
    });
    expect(progress).toEqual(
      Array.from({ length: 8 }, (_, done) => ({ done, total: 7 })),
    );

    expect(result.atomsUpserted).toBe(4);
    expect(result.tokensCreated).toBe(7);
    expect(result.tokensRevised).toBe(0);
    expect(result.bindings).toBe(7);
    expect(result.alignments).toBeGreaterThanOrEqual(4);

    expect(await countRows(db, "learning_atoms")).toBe(4);

    const qualitativeBindings = (await db
      .prepare(
        `SELECT grade, track FROM atom_curriculum_bindings
          WHERE atom_id = ? ORDER BY grade`,
      )
      .all(OPTIK.brechungQualitativ)) as Array<{
      grade: number;
      track: string;
    }>;
    expect(qualitativeBindings).toEqual([
      { grade: 7, track: "I" },
      { grade: 8, track: "II_III" },
    ]);

    const token = await getTokenById(db, "01K3X9A7R4B8C1D2E3F4G5H003");
    expect(token?.atom_id).toBe(OPTIK.brechungQualitativ);
    expect(token?.question).toMatch(/Luft in Wasser/);
  });

  it("can fail saving after its last item count, rolling the content back", async () => {
    const transaction = db.transaction.bind(db);
    const spy = vi.spyOn(db, "transaction").mockImplementationOnce((run) =>
      transaction(async (tx) => {
        await run(tx);
        throw new Error("commit failed");
      }),
    );
    const progress: KvtProgress[] = [];
    try {
      await expect(
        installKvtTile(db, loadTile(), {
          onProgress: (event) => progress.push(event),
        }),
      ).rejects.toThrow("commit failed");
      expect(progress.at(-1)).toEqual({ done: 7, total: 7 });
      expect(await countRows(db, "tokens")).toBe(0);
      expect(await countRows(db, "cards")).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  // Codex hardening review H3, after the owner ruled language, tier and
  // fast_check to be PracticeItem substance: a published item must survive the
  // round trip. Previously the installer accepted all three and dropped them.
  it("installs and reads back every practice item without loss", async () => {
    const tile = loadTile();
    await installKvtTile(db, tile);

    for (const atom of tile.atoms) {
      for (const item of atom.practice_items) {
        const stored = (await db
          .prepare(
            `SELECT question, concept, bloom_level, language, tier, fast_check
               FROM tokens WHERE id = ?`,
          )
          .get(item.id)) as {
          question: string;
          concept: string;
          bloom_level: number;
          language: string | null;
          tier: string | null;
          fast_check: string | null;
        };

        expect(stored.question).toBe(item.question);
        expect(stored.concept).toBe(item.concept);
        expect(stored.bloom_level).toBe(item.bloom_level);
        expect(stored.language).toBe(item.language ?? null);
        expect(stored.tier).toBe(item.tier ?? null);
        expect(
          stored.fast_check === null
            ? undefined
            : JSON.parse(stored.fast_check),
        ).toEqual(item.fast_check);
      }
    }
  });

  it("treats a changed fast check as a material revision", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const tokenId = "01K3X9A7R4B8C1D2E3F4G5H003";

    const tile = loadTile();
    const item = tile.atoms
      .find((a) => a.id === OPTIK.brechungQualitativ)!
      .practice_items.find((i) => i.id === tokenId) as {
      fast_check: { options: string[] };
    };
    item.fast_check.options = ["Zum Lot hin", "Vom Lot weg (neu)"];

    const result = await installKvtTile(db, tile);
    expect(result.tokensRevised).toBe(1);
    const token = await getTokenById(db, tokenId);
    expect(token?.content_version).toBe(2);
  });

  // Codex acceptance test 10.
  it("enrols nobody: installing a release creates zero cards", async () => {
    await installKvtTile(db, loadTile());
    expect(await countRows(db, "cards")).toBe(0);
  });

  it("materialises cards only for the atoms a learner chose", async () => {
    await installKvtTile(db, loadTile());
    const progress: KvtProgress[] = [];
    const result = await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL, {
      onProgress: (event) => progress.push(event),
    });
    expect(progress).toEqual(
      Array.from({ length: 7 }, (_, done) => ({ done, total: 6 })),
    );

    expect(result.cardsCreated).toBe(6);
    expect(await countRows(db, "cards")).toBe(6);

    // The tile also ships the optional BOS formula atom. A Realschule learner
    // must not be handed a card for material their curriculum never asks for.
    const gymItem = await db
      .prepare("SELECT id FROM tokens WHERE atom_id = ?")
      .get(BONUS_ONLY_ATOM);
    const stray = await getCard(
      db,
      (gymItem as { id: string }).id,
      "learner-a",
    );
    expect(stray).toBeUndefined();
  });

  it("materialises the same atoms twice without new cards", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const progress: KvtProgress[] = [];
    const again = await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL, {
      onProgress: (event) => progress.push(event),
    });
    expect(progress).toEqual(
      Array.from({ length: 7 }, (_, done) => ({ done, total: 6 })),
    );
    expect(again.cardsCreated).toBe(0);
    expect(again.cardsReused).toBe(6);
  });

  it("counts repeated atom ids once and checks siblings without enrolling beyond the budget", async () => {
    const tile = loadTile();
    const atom = tile.atoms[0];
    atom.practice_items.push({
      ...structuredClone(atom.practice_items[1]),
      id: "01K3X9A7R4B8C1D2E3F4G5H008",
      slug: "optik-strahlengang-extra",
    });
    await installKvtTile(db, tile);
    await ensureCard(db, atom.practice_items[0].id, "learner-a");
    const progress: KvtProgress[] = [];
    const result = await materialiseKvtCards(
      db,
      "learner-a",
      [atom.id, atom.id],
      {
        onProgress: (event) => progress.push(event),
      },
    );
    expect(result).toEqual({ cardsCreated: 1, cardsReused: 1 });
    expect(progress).toEqual(
      Array.from({ length: 4 }, (_, done) => ({ done, total: 3 })),
    );
    expect(await countRows(db, "cards")).toBe(2);
    expect(
      await getCard(db, "01K3X9A7R4B8C1D2E3F4G5H008", "learner-a"),
    ).toBeUndefined();
  });

  // Codex acceptance test 2.
  it("is idempotent: the same release twice changes nothing", async () => {
    await installKvtTile(db, loadTile());
    const before = await snapshot(db);

    const second = await installKvtTile(db, loadTile());
    expect(second.tokensCreated).toBe(0);
    expect(second.tokensRevised).toBe(0);
    expect(second.tokensUnchanged).toBe(7);

    expect(await snapshot(db)).toBe(before);
  });

  // Codex acceptance test 13.
  it("keeps a binding without a grade idempotent", async () => {
    const tile = loadTile();
    for (const atom of tile.atoms) {
      for (const binding of atom.curricula ?? []) {
        binding.grade = undefined;
      }
    }
    await installKvtTile(db, tile);
    const afterFirst = await countRows(db, "atom_curriculum_bindings");
    await installKvtTile(db, tile);
    await installKvtTile(db, tile);
    expect(await countRows(db, "atom_curriculum_bindings")).toBe(afterFirst);
  });

  /** Install `names` into a throwaway database and return its snapshot. */
  async function snapshotOfOrder(names: string[]): Promise<string> {
    const dir = mkdtempSync(join(tmpdir(), "zam-kvt-perm-"));
    const other = await openDatabase({
      dbPath: join(dir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      for (const name of names) {
        await installKvtTile(other, loadFixture(name));
      }
      return await snapshot(other);
    } finally {
      await other.close();
      rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
    }
  }

  function permutations<T>(items: T[]): T[][] {
    if (items.length <= 1) return [items];
    return items.flatMap((item, index) =>
      permutations([...items.slice(0, index), ...items.slice(index + 1)]).map(
        (rest) => [item, ...rest],
      ),
    );
  }

  // Codex acceptance test 1, in the form he asked for: all 24 orders, not two.
  it("reaches the same state in all 24 install orders", async () => {
    const orders = permutations(ALL_CELLS);
    expect(orders).toHaveLength(24);

    const expected = await snapshotOfOrder(ALL_CELLS);
    for (const order of orders) {
      expect(await snapshotOfOrder(order)).toBe(expected);
    }
  }, 60_000);

  // Codex hardening review H2: the counterexample he reproduced.
  it("drops the old edge when a later release changes the representative", async () => {
    const parentAtom = OPTIK.strahlengangLot;
    const childAtom = OPTIK.brechungQualitativ;

    // Two genuinely different items on the parent atom — not the same question
    // under two ids, which the frozen-id rule now refuses outright.
    function tileWithParentItem(
      id: string,
      question: string,
      tileId: string,
    ): KvtTile {
      const base = loadTile();
      const parent = base.atoms.find((a) => a.id === parentAtom);
      const child = base.atoms.find((a) => a.id === childAtom);
      const [parentItem] = parent!.practice_items;
      const [childItem] = child!.practice_items;
      return {
        tile_id: tileId,
        version: "1",
        atoms: [
          {
            ...parent!,
            practice_items: [{ ...parentItem, id, question, slug: `p-${id}` }],
          },
          {
            ...child!,
            practice_items: [{ ...childItem, slug: "c-fixed" }],
            prerequisites: [{ atom_id: parentAtom, type: "hard" }],
          },
        ],
      };
    }

    const high = tileWithParentItem(
      "01K3X9A7R4B8C1D2E3F4G5HB02",
      "Wo steht das Einfallslot?",
      "tile-a",
    );
    const low = tileWithParentItem(
      "01K3X9A7R4B8C1D2E3F4G5HB01",
      "Woran misst man den Einfallswinkel?",
      "tile-b",
    );
    const childId = loadTile().atoms.find((a) => a.id === childAtom)!
      .practice_items[0].id;

    async function edgesAfter(order: KvtTile[]): Promise<string[]> {
      const dir = mkdtempSync(join(tmpdir(), "zam-kvt-rep-"));
      const other = await openDatabase({
        dbPath: join(dir, "zam-test.db"),
        initialize: true,
        useConfiguredCloud: false,
      });
      try {
        for (const tile of order) await installKvtTile(other, tile);
        const rows = (await other
          .prepare(
            "SELECT requires_id FROM prerequisites WHERE token_id = ? ORDER BY requires_id",
          )
          .all(childId)) as Array<{ requires_id: string }>;
        return rows.map((row) => row.requires_id);
      } finally {
        await other.close();
        rmSync(dir, { recursive: true, force: true, maxRetries: 10 });
      }
    }

    const highThenLow = await edgesAfter([high, low]);
    const lowThenHigh = await edgesAfter([low, high]);

    // Before the fix this was ["…B01", "…B02"] versus ["…B01"].
    expect(highThenLow).toEqual(lowThenHigh);
    expect(highThenLow).toEqual(["01K3X9A7R4B8C1D2E3F4G5HB01"]);
  });

  // Codex acceptance test 3.
  it("publishes a material revision when an answer changes", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const tokenId = "01K3X9A7R4B8C1D2E3F4G5H003";
    const card = await getCard(db, tokenId, "learner-a");
    await db
      .prepare(
        `UPDATE cards SET reps = 8, stability = 42, state = 'review',
                          due_at = '2099-01-01T00:00:00.000Z'
          WHERE id = ?`,
      )
      .run(card!.id);

    const tile = loadTile();
    const atom = tile.atoms.find((a) => a.id === OPTIK.brechungQualitativ);
    const item = atom!.practice_items.find((i) => i.id === tokenId);
    item!.concept = "Eine sachlich geänderte Antwort.";

    const result = await installKvtTile(db, tile);
    expect(result.tokensRevised).toBe(1);

    const token = await getTokenById(db, tokenId);
    expect(token?.content_version).toBe(2);
    expect(token?.concept).toBe("Eine sachlich geänderte Antwort.");

    const after = await getCard(db, tokenId, "learner-a");
    expect(after?.reps).toBe(8);
    expect(after?.stability).toBe(42);
    expect(after?.learned_content_version).toBe(1);
    // Pulled forward for a re-test rather than left sitting in 2099.
    expect(new Date(after!.due_at).getTime()).toBeLessThan(Date.now() + 1000);
  });

  // Codex acceptance test 4.
  it("does not re-test anyone for a change declared cosmetic", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const tokenId = "01K3X9A7R4B8C1D2E3F4G5H003";
    const card = await getCard(db, tokenId, "learner-a");
    await db
      .prepare(
        `UPDATE cards SET reps = 8, stability = 42, state = 'review',
                          due_at = '2099-01-01T00:00:00.000Z'
          WHERE id = ?`,
      )
      .run(card!.id);

    const tile = loadTile();
    const atom = tile.atoms.find((a) => a.id === OPTIK.brechungQualitativ);
    const item = atom!.practice_items.find((i) => i.id === tokenId);
    item!.question = `${item!.question} `.replace(/\s+$/, "?");
    item!.materiality = "cosmetic";

    await installKvtTile(db, tile);

    const token = await getTokenById(db, tokenId);
    expect(token?.content_version).toBe(1);

    const after = await getCard(db, tokenId, "learner-a");
    expect(after?.reps).toBe(8);
    expect(after?.due_at).toBe("2099-01-01T00:00:00.000Z");
  });

  // Codex acceptance test 11.
  it("gives two Tier 1 items of one atom distinct addresses", async () => {
    const tile = loadTile();
    const atom = tile.atoms.find((a) => a.id === OPTIK.brechungQualitativ);
    const [first] = atom!.practice_items;
    atom!.practice_items.push({
      ...first,
      id: "01K3X9A7R4B8C1D2E3F4G5H0Z1",
      question: "Eine zweite schnelle Prüfung zur Brechungsrichtung?",
    });

    await installKvtTile(db, tile);

    const slugs = (await db
      .prepare("SELECT slug FROM tokens WHERE atom_id = ? ORDER BY id")
      .all(OPTIK.brechungQualitativ)) as Array<{ slug: string }>;
    expect(new Set(slugs.map((row) => row.slug)).size).toBe(slugs.length);
  });

  it("honours an address the tile names itself", async () => {
    const tile = loadTile();
    tile.atoms[0].practice_items[0].slug = "optik-lot-schnellcheck";
    await installKvtTile(db, tile);
    const token = await getTokenById(db, tile.atoms[0].practice_items[0].id);
    expect(token?.slug).toBe("optik-lot-schnellcheck");
  });

  describe("source links", () => {
    const APP = "https://academy.zam-os.org/uml/";

    async function linkOf(id: string): Promise<string | null> {
      return (await getTokenById(db, id))?.source_link ?? null;
    }

    it("stores the item's link, else its atom's, and treats blank as none", async () => {
      const tile = loadTile();
      const [first, second] = tile.atoms[0].practice_items;
      tile.atoms[0].source_link = `${APP}#lesson=atom`;
      first.source_link = `  ${APP}#lesson=item  `;
      second.source_link = "   ";

      await installKvtTile(db, tile);

      expect(await linkOf(first.id)).toBe(`${APP}#lesson=item`);
      expect(await linkOf(second.id)).toBe(`${APP}#lesson=atom`);
      expect(await linkOf(tile.atoms[1].practice_items[0].id)).toBeNull();
    });

    it("moves a link a later release names, and keeps one it does not", async () => {
      const tile = loadTile();
      const item = tile.atoms[0].practice_items[0];
      const curated = tile.atoms[1].practice_items[0];
      item.source_link = `${APP}#lesson=old`;
      await installKvtTile(db, tile);

      item.source_link = `${APP}#lesson=new`;
      await installKvtTile(db, tile);
      expect(await linkOf(item.id)).toBe(`${APP}#lesson=new`);

      await db
        .prepare("UPDATE tokens SET source_link = ? WHERE id = ?")
        .run("https://example.org/notes.md", curated.id);
      delete item.source_link;
      await installKvtTile(db, tile);
      expect(await linkOf(item.id)).toBe(`${APP}#lesson=new`);
      expect(await linkOf(curated.id)).toBe("https://example.org/notes.md");
    });

    it("makes one library topic of an app's lessons", async () => {
      const tile = loadTile();
      tile.atoms[0].source_link = `${APP}#lesson=uc-1-boxes`;
      tile.atoms[1].source_link = `${APP}#lesson=cls-1-boxes`;
      await installKvtTile(db, tile);

      const topics = await listLibraryTopics(db, "learner-a");
      const app = topics.filter((topic) => topic.key.startsWith(APP));
      expect(app.map((topic) => topic.key)).toEqual([APP]);
      expect(app[0].itemCount).toBe(
        tile.atoms[0].practice_items.length +
          tile.atoms[1].practice_items.length,
      );
    });
  });

  // Codex hardening review H2.3: silently ignoring the new value was the worst
  // of the three options.
  it("refuses to rename a published item address", async () => {
    await installKvtTile(db, loadTile());
    const tile = loadTile();
    tile.atoms[0].practice_items[0].slug = "ein-anderer-name";
    await expect(installKvtTile(db, tile)).rejects.toThrow(
      /Slugs are immutable/,
    );
  });

  it("refuses a practice-item id that is not a ULID", async () => {
    const tile = loadTile();
    tile.atoms[0].practice_items[0].id = "optik-lot-schnellcheck";
    await expect(installKvtTile(db, tile)).rejects.toThrow(/expected a ULID/);
  });

  /**
   * ADR 2026-08-14 Decision 9. An item id that changes without a declaration
   * used to be refused by comparing question text; that check was both too
   * loose (any rewording slipped past) and too tight (a Tier 1 and a Tier 2
   * item may ask the same thing). Succession is now stated, not inferred.
   */
  describe("declared item succession", () => {
    /** A learner with real history on the item that is about to be replaced. */
    async function learnerWithHistory(tokenId: string): Promise<string> {
      await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
      const card = await getCard(db, tokenId, "learner-a");
      await db
        .prepare("UPDATE cards SET reps = 6, stability = 30 WHERE id = ?")
        .run(card!.id);
      await db
        .prepare(
          `INSERT INTO review_logs
             (id, card_id, token_id, user_id, rating, reviewed_at, scheduled_at)
           VALUES ('01K3X9A7R4B8C1D2E3F4G5R001', ?, ?, 'learner-a', 3,
                   '2026-08-01T10:00:00.000Z', '2026-08-01T09:00:00.000Z')`,
        )
        .run(card!.id, tokenId);
      return card!.id;
    }

    /** Re-mint the given item under a new id, declaring what it supersedes. */
    function tileWithSuccessor(oldId: string, newId: string): KvtTile {
      const tile = loadTile();
      for (const atom of tile.atoms) {
        const item = atom.practice_items.find((i) => i.id === oldId);
        if (!item) continue;
        item.id = newId;
        item.slug = `${atom.slug}-successor`;
        item.replaces = [oldId];
      }
      return tile;
    }

    it("orphans nobody: an undeclared new id leaves the old card alone", async () => {
      await installKvtTile(db, loadTile());
      const oldId = "01K3X9A7R4B8C1D2E3F4G5H003";
      const cardId = await learnerWithHistory(oldId);

      // No `replaces`: the tile simply publishes another item.
      const tile = loadTile();
      const atom = tile.atoms.find((a) => a.id === OPTIK.brechungQualitativ);
      atom!.practice_items[0].id = "01K3X9A7R4B8C1D2E3F4G5D001";
      atom!.practice_items[0].slug = "optik-brechung-zweitfassung";
      await installKvtTile(db, tile);

      // The learner keeps the card they earned; nothing was moved silently.
      const kept = await getCard(db, oldId, "learner-a");
      expect(kept?.id).toBe(cardId);
      expect(kept?.reps).toBe(6);
    });

    it("moves card and review history to a declared successor", async () => {
      await installKvtTile(db, loadTile());
      const oldId = "01K3X9A7R4B8C1D2E3F4G5H003";
      const newId = "01K3X9A7R4B8C1D2E3F4G5D002";
      const cardId = await learnerWithHistory(oldId);

      const result = await installKvtTile(db, tileWithSuccessor(oldId, newId));
      expect(result.itemsSuperseded).toBe(1);

      // Same card row, same FSRS state — now answering for the new item.
      const moved = await getCard(db, newId, "learner-a");
      expect(moved?.id).toBe(cardId);
      expect(moved?.reps).toBe(6);
      expect(moved?.stability).toBe(30);
      expect(await getCard(db, oldId, "learner-a")).toBeFalsy();

      const log = (await db
        .prepare("SELECT token_id FROM review_logs WHERE id = ?")
        .get("01K3X9A7R4B8C1D2E3F4G5R001")) as { token_id: string };
      expect(log.token_id).toBe(newId);

      // The superseded item is retired, never deleted: every other table that
      // references a token cascades on delete.
      const old = await getTokenById(db, oldId);
      expect(old?.deprecated_at).toBeTruthy();
    });

    it("keeps the declaration even when the old item was never installed", async () => {
      const tile = loadTile();
      tile.atoms[0].practice_items[0].replaces = ["01K3X9A7R4B8C1D2E3F4G5D003"];
      const result = await installKvtTile(db, tile);
      // Nothing to move, but the statement is evidence for a later rebuild.
      expect(result.itemsSuperseded).toBe(0);
      const row = (await db
        .prepare(
          `SELECT new_item_id, declared_by FROM practice_item_replacements
            WHERE old_item_id = ?`,
        )
        .get("01K3X9A7R4B8C1D2E3F4G5D003")) as {
        new_item_id: string;
        declared_by: string;
      };
      expect(row.new_item_id).toBe(tile.atoms[0].practice_items[0].id);
      expect(row.declared_by).toBeTruthy();
    });

    it("refuses a merge: two histories cannot silently become one", async () => {
      await installKvtTile(db, loadTile());
      await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);

      // Declare one existing item as the successor of another existing one —
      // the learner holds a card on both.
      const tile = loadTile();
      const target = tile.atoms.find((a) => a.id === OPTIK.brechungQualitativ);
      target!.practice_items[0].replaces = ["01K3X9A7R4B8C1D2E3F4G5H001"];

      await expect(installKvtTile(db, tile)).rejects.toThrow(
        /mastery is never merged/,
      );
    });

    it("refuses to declare itself as replaced", async () => {
      const tile = loadTile();
      const item = tile.atoms[0].practice_items[0];
      item.replaces = [item.id];
      await expect(installKvtTile(db, tile)).rejects.toThrow(
        /declares itself as replaced/,
      );
    });
  });

  it("keeps the learner's card when a release reuses the item id", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const tokenId = "01K3X9A7R4B8C1D2E3F4G5H003";
    const card = await getCard(db, tokenId, "learner-a");
    await db
      .prepare("UPDATE cards SET reps = 6, stability = 30 WHERE id = ?")
      .run(card!.id);

    await installKvtTile(db, loadTile());

    const after = await getCard(db, tokenId, "learner-a");
    expect(after?.id).toBe(card!.id);
    expect(after?.reps).toBe(6);
    expect(after?.stability).toBe(30);
  });

  it("refuses to reassign an item to a different atom", async () => {
    await installKvtTile(db, loadTile());
    const tile = loadTile();
    tile.atoms[1].practice_items[0].id = "01K3X9A7R4B8C1D2E3F4G5H001";
    await expect(installKvtTile(db, tile)).rejects.toThrow(/already realises/);
  });

  it("wires hard atom prerequisites onto the representative item", async () => {
    await installKvtTile(db, loadTile());
    const prereqs = await getPrerequisites(db, "01K3X9A7R4B8C1D2E3F4G5H003");
    expect(prereqs.map((row) => row.requires_id)).toEqual([
      "01K3X9A7R4B8C1D2E3F4G5H001",
    ]);

    const edge = (await db
      .prepare(
        `SELECT kind FROM atom_prerequisites
          WHERE atom_id = ? AND requires_id = ?`,
      )
      .get(OPTIK.brechungQualitativ, OPTIK.strahlengangLot)) as {
      kind: string;
    };
    expect(edge.kind).toBe("hard");
  });

  it("never rewrites FSRS state on a second install", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const tokenId = "01K3X9A7R4B8C1D2E3F4G5H003";
    const before = await getCard(db, tokenId, "learner-a");
    await db
      .prepare(
        `UPDATE cards SET reps = 1, state = 'review', stability = 2.5 WHERE id = ?`,
      )
      .run(before!.id);

    await installKvtTile(db, loadTile());

    const after = await getCard(db, tokenId, "learner-a");
    expect(after?.reps).toBe(1);
    expect(after?.state).toBe("review");
    expect(after?.stability).toBe(2.5);
  });

  it("gives a second learner their own cards on the same tokens", async () => {
    await installKvtTile(db, loadTile());
    await materialiseKvtCards(db, "learner-a", REALSCHULE_CELL);
    const result = await materialiseKvtCards(db, "learner-b", REALSCHULE_CELL);
    expect(result.cardsCreated).toBe(6);
    expect(await countRows(db, "tokens")).toBe(7);
  });

  it("rejects an atom id that is not a published atom URI", async () => {
    const tile = loadTile();
    tile.atoms[0].id = "wd:Q208391/qualitative";
    await expect(installKvtTile(db, tile)).rejects.toThrow(
      /Invalid published atom id/,
    );
  });

  it("withdraws an exact binding for every item, keeping overlays and all personal evidence", async () => {
    const tile = loadTile();
    const atom = tile.atoms[0];
    const wrong = {
      provider: "lehrplanplus-bayern",
      school_type: "realschule",
      grade: 10,
      track: "",
      subject: "pug",
      topic_code: "lb1",
    };
    const overlay = { ...wrong, grade: 11, topic_code: "lb2" };
    tile.atoms = [{ ...atom, curricula: [wrong, overlay] }];
    await installKvtTile(db, tile);
    const userId = atom.id;
    for (const item of atom.practice_items) {
      const card = await ensureCard(db, item.id, userId);
      await evaluateRating(db, {
        cardId: card.id,
        tokenId: item.id,
        userId,
        rating: 3,
        answerFormat: "recall",
        responseTimeMs: 2000,
        now: new Date("2026-10-25T10:00:00Z"),
      });
    }
    const personal = async () => ({
      cards: await db.prepare("SELECT * FROM cards ORDER BY id").all(),
      reviews: await db.prepare("SELECT * FROM review_logs ORDER BY id").all(),
    });
    const before = await personal();
    const corrected: KvtTile = {
      ...tile,
      version: "2",
      atoms: [
        {
          ...atom,
          curricula: [{ ...wrong, topic_code: "lb3" }],
          retired_curricula: [
            { ...wrong, reason: "Correction of an accidental methods binding" },
          ],
          // Another overlay's item still needs the corrected projection.
          practice_items: [atom.practice_items[0]],
        },
      ],
    };
    for (let attempt = 0; attempt < 2; attempt++) {
      await installKvtTile(db, corrected);
      expect(await personal()).toEqual(before);
      expect(
        await db
          .prepare(
            "SELECT grade, topic_code FROM atom_curriculum_bindings WHERE atom_id = ? ORDER BY grade",
          )
          .all(atom.id),
      ).toEqual([
        { grade: 10, topic_code: "lb3" },
        { grade: 11, topic_code: "lb2" },
      ]);
      for (const item of atom.practice_items)
        expect(await getTokenById(db, item.id)).toMatchObject({
          provider: wrong.provider,
          topic_id: "lb3",
        });
    }
  });

  it.each([
    { provider: "another-provider" },
    { school_type: "gymnasium" },
    { grade: 11 },
    { track: "I" },
    { subject: "geschichte" },
    { topic_code: "lb2" },
  ])("does not withdraw another binding scope: %j", async (different) => {
    const tile = loadTile();
    const atom = tile.atoms[0];
    const held = {
      provider: "lehrplanplus-bayern",
      school_type: "realschule",
      grade: 10,
      track: "",
      subject: "pug",
      topic_code: "lb1",
    };
    tile.atoms = [{ ...atom, curricula: [held] }];
    await installKvtTile(db, tile);
    await installKvtTile(db, {
      ...tile,
      version: "2",
      atoms: [
        {
          ...atom,
          curricula: [],
          retired_curricula: [
            {
              ...held,
              ...different,
              reason: "Only the fully named scope may be removed",
            },
          ],
        },
      ],
    });
    expect(
      await db
        .prepare(
          "SELECT topic_code FROM atom_curriculum_bindings WHERE atom_id = ?",
        )
        .all(atom.id),
    ).toEqual([{ topic_code: "lb1" }]);
  });

  it("checks pending withdrawals beyond the first remote-query batch without changing knowledge", async () => {
    const tile = loadTile();
    const atom = tile.atoms[0];
    const held = {
      provider: "lehrplanplus-bayern",
      school_type: "realschule",
      grade: 10,
      track: "",
      subject: "pug",
      topic_code: "lb1",
    };
    tile.atoms = [{ ...atom, curricula: [held] }];
    await installKvtTile(db, tile);
    const corrected: KvtTile = {
      ...tile,
      atoms: [
        {
          ...atom,
          curricula: [{ ...held, topic_code: "lb3" }],
          retired_curricula: [
            ...Array.from({ length: 64 }, (_, index) => ({
              ...held,
              topic_code: `absent-${index}`,
              reason: "Not present in this library",
            })),
            { ...held, reason: "The pending entry is in the second batch" },
          ],
        },
      ],
    };
    const before = await snapshot(db);
    expect(await hasPendingCurriculumRetirements(db, corrected)).toBe(true);
    expect(await snapshot(db)).toBe(before);
    await installKvtTile(db, corrected);
    expect(await hasPendingCurriculumRetirements(db, corrected)).toBe(false);
  });

  it("withdraws a grade-less binding and clears the last token projection", async () => {
    const tile = loadTile();
    const atom = tile.atoms[0];
    tile.atoms = [
      { ...atom, curricula: [{ provider: "test", topic_code: "module" }] },
    ];
    await installKvtTile(db, tile);
    await installKvtTile(db, {
      ...tile,
      version: "2",
      atoms: [
        {
          ...atom,
          curricula: [],
          retired_curricula: [
            {
              provider: "test",
              school_type: "",
              grade: null,
              track: "",
              subject: "",
              topic_code: "module",
              reason: "Remove a grade-less module",
            },
          ],
        },
      ],
    });
    expect(
      await db
        .prepare("SELECT * FROM atom_curriculum_bindings WHERE atom_id = ?")
        .all(atom.id),
    ).toEqual([]);
    expect(await getTokenById(db, atom.practice_items[0].id)).toMatchObject({
      provider: null,
      topic_id: null,
    });
  });

  it("refuses incomplete or contradictory withdrawals without changing installed knowledge", async () => {
    const tile = loadTile();
    await installKvtTile(db, tile);
    const before = await snapshot(db);
    const atom = tile.atoms[0];
    const declared = atom.curricula![0];
    const retired = {
      provider: declared.provider,
      school_type: declared.school_type ?? "",
      grade: declared.grade ?? null,
      track: declared.track ?? "",
      subject: declared.subject ?? "",
      topic_code: declared.topic_code,
      reason: "A scoped correction",
    };
    for (const bad of [
      { ...retired, subject: undefined },
      { ...retired, grade: undefined },
      { ...retired, reason: "" },
      { ...retired, provider: "" },
    ]) {
      const invalid = {
        ...tile,
        version: "2",
        atoms: [{ ...atom, curricula: [], retired_curricula: [bad] }],
      } as unknown as KvtTile;
      await expect(installKvtTile(db, invalid)).rejects.toThrow(
        /full scope and a reason/,
      );
      expect(await snapshot(db)).toBe(before);
    }
    await expect(
      installKvtTile(db, {
        ...tile,
        version: "2",
        atoms: [{ ...atom, retired_curricula: [retired] }],
      }),
    ).rejects.toThrow(/both declared and retired/);
    expect(await snapshot(db)).toBe(before);
  });

  it("merges Gymnasium 8 without wiping Realschule bindings", async () => {
    await installKvtTile(db, loadTile());
    await installKvtTile(db, loadFixture("de-by-gymnasium-8-optik-kvt"));

    const bindings = (await db
      .prepare(
        `SELECT school_type, grade, topic_code FROM atom_curriculum_bindings
          WHERE atom_id = ? ORDER BY school_type, grade`,
      )
      .all(OPTIK.brechungQualitativ)) as Array<{
      school_type: string;
      grade: number;
      topic_code: string;
    }>;
    expect(bindings).toEqual([
      { school_type: "gymnasium", grade: 8, topic_code: "215729" },
      { school_type: "realschule", grade: 7, topic_code: "65643" },
      { school_type: "realschule", grade: 8, topic_code: "65854" },
    ]);
  });

  it("attaches all four overlapping cells onto one atom graph", async () => {
    for (const name of ALL_CELLS) {
      await installKvtTile(db, loadFixture(name));
    }

    expect(await countRows(db, "learning_atoms")).toBe(9);
    expect(await countRows(db, "tokens")).toBe(15);

    const refraction = (await db
      .prepare(
        `SELECT COUNT(*) as n FROM atom_curriculum_bindings
          WHERE atom_id = '01K3X9A7R4B8C1D2E3F4G5A002'`,
      )
      .get()) as { n: number };
    expect(refraction.n).toBe(4);
  });
});
