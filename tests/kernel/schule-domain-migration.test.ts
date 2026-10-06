import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applySchemaAndMigrations,
  BUNDLED_TILES,
  createToken,
  type Database,
  evaluateRating,
  getCard,
  installKvtTile,
  type KvtTile,
  materialiseKvtCards,
  openDatabase,
} from "../../src/kernel/index.js";

/**
 * M038 (ADR 2026-10-05 Decision 7): the root of an area path is the subject.
 * Stored `schule/…` paths are rewritten in place, so the next attach of a
 * fixture that already dropped the prefix publishes no revision and re-tests
 * nobody.
 */

const TILE = resolve(
  __dirname,
  "../fixtures/curriculum/de-by-realschule-8-chemie-stoffe-stoffgemische-trennung-kvt.json",
);
const ATOM = "01K4C8S0000000000000000A01";
const ITEM = "01K4C8S0000000000000000J01";
const USER = "learner";

function currentTile(): KvtTile {
  return JSON.parse(readFileSync(TILE, "utf-8")) as KvtTile;
}

/** The same tile as the release before this one wrote it. */
function tileWithSchulePrefix(): KvtTile {
  const tile = currentTile();
  for (const atom of tile.atoms) atom.domain = `schule/${atom.domain}`;
  return tile;
}

describe("M038 schule/ rewrite", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-schule-domain-"));
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

  async function domainOf(table: string, id: string): Promise<string> {
    const row = (await db
      .prepare(`SELECT domain FROM ${table} WHERE id = ?`)
      .get(id)) as { domain: string };
    return row.domain;
  }

  async function cardState(): Promise<{
    due_at: string;
    learned_content_version: number;
  }> {
    return (await db
      .prepare(
        "SELECT due_at, learned_content_version FROM cards WHERE token_id = ? AND user_id = ?",
      )
      .get(ITEM, USER)) as { due_at: string; learned_content_version: number };
  }

  it("rewrites stored paths so re-attaching the current tile re-tests nobody", async () => {
    await installKvtTile(db, tileWithSchulePrefix());
    await materialiseKvtCards(db, USER, [ATOM]);
    const card = await getCard(db, ITEM, USER);
    await evaluateRating(db, {
      cardId: card!.id,
      tokenId: ITEM,
      userId: USER,
      rating: 3,
    });
    const notes = await createToken(db, {
      slug: "meine-notizen",
      concept: "Eine Notiz",
      question: "Was steht in der Notiz?",
      domain: "schule/notizen",
    });
    expect(await domainOf("tokens", ITEM)).toBe(
      "schule/chemie/allgemeine-chemie",
    );
    const before = await cardState();

    await applySchemaAndMigrations(db);

    expect(await domainOf("tokens", ITEM)).toBe("chemie/allgemeine-chemie");
    expect(await domainOf("learning_atoms", ATOM)).toBe(
      "chemie/allgemeine-chemie",
    );
    expect(await domainOf("tokens", notes.id)).toBe("notizen");

    const attach = await installKvtTile(db, currentTile());
    expect(attach.tokensRevised).toBe(0);
    expect(await cardState()).toEqual(before);

    const domains = async () =>
      db.prepare("SELECT id, domain FROM tokens ORDER BY id").all();
    const once = await domains();
    await applySchemaAndMigrations(db);
    expect(await domains()).toEqual(once);
  });

  it("leaves a bare 'schule' and other roots alone", async () => {
    const bare = await createToken(db, {
      slug: "bare",
      concept: "c",
      question: "q?",
      domain: "schule",
    });
    const other = await createToken(db, {
      slug: "other",
      concept: "c",
      question: "q?",
      domain: "hochschule/mathe",
    });
    await applySchemaAndMigrations(db);
    expect(await domainOf("tokens", bare.id)).toBe("schule");
    expect(await domainOf("tokens", other.id)).toBe("hochschule/mathe");
  });

  it("ships no bundled tile whose area starts with schule/", () => {
    const offenders = Object.values(BUNDLED_TILES).flatMap((tile) =>
      tile.atoms
        .filter((atom) => /^schule\//i.test(atom.domain ?? ""))
        .map((atom) => `${tile.tile_id} ${atom.id}`),
    );
    expect(offenders).toEqual([]);
  });
});
