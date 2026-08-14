/**
 * Schema provisioning over the bare `Database` contract.
 *
 * The point of `src/kernel/db/provision.ts` is that iOS can create its own
 * database from inside the WebView (ADR 2026-08-08), where `node:fs` and the
 * driver layer do not exist. So the interesting test is not "does it create
 * tables" — it is **does the WebView path end up with exactly the schema the
 * desktop path produces**. Any drift there means a card written on the iPad
 * lands in a differently shaped table than the same card on the Mac.
 *
 * The mobile provider + invoke stub stand in for the real IPC boundary, which
 * is as close to the device as a test can get without one.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createTauriDatabase } from "../../mobile/src/provider.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  createToken,
  ensureCard,
  openDatabase,
} from "../../src/kernel/index.js";
import { createTauriInvokeStub } from "../helpers/tauri-invoke-stub.js";

const tempDirs: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-provision-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop() as string, { recursive: true, force: true });
  }
});

/** Table name → column names, the comparable shape of a database. */
async function describeSchema(db: Database): Promise<Record<string, string[]>> {
  const tables = (await db
    .prepare(
      `SELECT name FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name`,
    )
    .all()) as Array<{ name: string }>;

  const shape: Record<string, string[]> = {};
  for (const { name } of tables) {
    const cols = (await db.pragma(`table_info(${name})`)) as Array<{
      name: string;
    }>;
    shape[name] = cols.map((c) => c.name).sort();
  }
  return shape;
}

/**
 * Provisioning runs the whole schema plus every migration through the mobile
 * IPC stub, one statement at a time against a real file. That is milliseconds
 * on a developer machine (12–26 ms as of M022) and seconds on the
 * `windows-arm64` CI runner, where each SQLite write is orders of magnitude
 * slower — it timed out at the 5 s default twice on 2026-08-09/10, in code
 * neither change touched.
 *
 * The number protects the slowest supported runner, not the code: raising it
 * hides nothing, because a provisioning path that genuinely regressed would
 * blow past this too. If it starts failing again, measure before raising.
 */
describe("applySchemaAndMigrations", { timeout: 30_000 }, () => {
  it("produces the same schema as openDatabase, over IPC only", async () => {
    const stub = createTauriInvokeStub(join(tempDir(), "mobile.db"));
    const mobile = createTauriDatabase(stub.invoke);
    await applySchemaAndMigrations(mobile);

    const desktop = await openDatabase({
      dbPath: join(tempDir(), "desktop.db"),
      initialize: true,
      useConfiguredCloud: false,
    });

    expect(await describeSchema(mobile)).toEqual(await describeSchema(desktop));

    await desktop.close?.();
    stub.close();
  });

  it("is idempotent — a second run changes nothing", async () => {
    const stub = createTauriInvokeStub(join(tempDir(), "twice.db"));
    const db = createTauriDatabase(stub.invoke);

    await applySchemaAndMigrations(db);
    const first = await describeSchema(db);
    await applySchemaAndMigrations(db);

    expect(await describeSchema(db)).toEqual(first);
    stub.close();
  });

  it("leaves a database a learner can actually write to", async () => {
    const stub = createTauriInvokeStub(join(tempDir(), "usable.db"));
    const db = createTauriDatabase(stub.invoke);
    await applySchemaAndMigrations(db);

    const token = await createToken(db, {
      slug: "mathe/satz-des-pythagoras",
      concept: "Satz des Pythagoras",
      domain: "mathe",
      bloom_level: 2,
    });
    const card = await ensureCard(db, token.id, "learner-1");

    expect(card.token_id).toBe(token.id);
    stub.close();
  });

  it("migrates a database that only carries the base schema", async () => {
    // A database created before a migration existed: base tables present, the
    // later ALTER-added columns absent. This is the shape a companion finds
    // when it opens a server database an older desktop provisioned.
    const stub = createTauriInvokeStub(join(tempDir(), "old.db"));
    const db = createTauriDatabase(stub.invoke);

    // The tokens table as it stood before any ALTER-based migration: every
    // column the original CREATE carried, none that a migration added.
    await db.exec(`
      CREATE TABLE tokens (
        id             TEXT PRIMARY KEY,
        slug           TEXT UNIQUE NOT NULL,
        concept        TEXT NOT NULL,
        domain         TEXT NOT NULL DEFAULT '',
        bloom_level    INTEGER NOT NULL DEFAULT 1,
        context        TEXT NOT NULL DEFAULT '',
        symbiosis_mode TEXT,
        created_at     TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    await applySchemaAndMigrations(db);

    const cols = (await db.pragma("table_info(tokens)")) as Array<{
      name: string;
    }>;
    const names = cols.map((c) => c.name);
    // One representative column per migration family that ALTERs tokens.
    expect(names).toEqual(
      expect.arrayContaining([
        "deprecated_at",
        "source_link",
        "question",
        "title",
        "question_source",
        "maintenance_at",
        "content_version",
        "editorial_state",
      ]),
    );
    stub.close();
  });

  it("adds a nullable learning-step cursor without rewriting legacy card state", async () => {
    const stub = createTauriInvokeStub(join(tempDir(), "pre-steps.db"));
    const db = createTauriDatabase(stub.invoke);
    await applySchemaAndMigrations(db);

    const token = await createToken(db, {
      slug: "legacy-learning-card",
      concept: "A card scheduled before short steps existed",
    });
    const card = await ensureCard(db, token.id, "learner-1");
    await db
      .prepare("UPDATE cards SET state = 'learning' WHERE id = ?")
      .run(card.id);
    await db.exec("ALTER TABLE cards DROP COLUMN learning_step");

    await applySchemaAndMigrations(db);

    const columns = (await db.pragma("table_info(cards)")) as Array<{
      name: string;
    }>;
    const migrated = (await db
      .prepare("SELECT state, learning_step FROM cards WHERE id = ?")
      .get(card.id)) as { state: string; learning_step: number | null };

    expect(columns.map((column) => column.name)).toContain("learning_step");
    expect(migrated).toEqual({ state: "learning", learning_step: null });

    stub.close();
  });

  it("adds stable file-import bindings idempotently", async () => {
    const stub = createTauriInvokeStub(join(tempDir(), "pre-file-import.db"));
    const db = createTauriDatabase(stub.invoke);
    await applySchemaAndMigrations(db);

    const columns = (await db.pragma(
      "table_info(imported_card_bindings)",
    )) as Array<{ name: string }>;
    expect(columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "id",
        "external_id",
        "token_id",
        "note_guid",
        "card_ordinal",
        "content_hash",
        "metadata_hash",
      ]),
    );

    await applySchemaAndMigrations(db);
    const indexes = (await db.pragma(
      "index_list(imported_card_bindings)",
    )) as Array<{ name: string }>;
    expect(indexes.map((index) => index.name)).toContain(
      "idx_imported_card_bindings_token",
    );
    stub.close();
  });

  it("adds rich import media and sibling-bury columns idempotently", async () => {
    const stub = createTauriInvokeStub(join(tempDir(), "pre-rich-import.db"));
    const db = createTauriDatabase(stub.invoke);
    await applySchemaAndMigrations(db);

    const tables = (await db
      .prepare(
        `SELECT name FROM sqlite_master
          WHERE type = 'table' AND name IN ('media_assets', 'token_media')
          ORDER BY name`,
      )
      .all()) as Array<{ name: string }>;
    expect(tables.map((row) => row.name)).toEqual([
      "media_assets",
      "token_media",
    ]);
    const cardColumns = (await db.pragma("table_info(cards)")) as Array<{
      name: string;
    }>;
    expect(cardColumns.map((column) => column.name)).toEqual(
      expect.arrayContaining(["buried_until", "buried_reason"]),
    );

    await applySchemaAndMigrations(db);
    const mediaIndexes = (await db.pragma("index_list(token_media)")) as Array<{
      name: string;
    }>;
    expect(mediaIndexes.map((index) => index.name)).toContain(
      "idx_token_media_asset",
    );
    stub.close();
  });
});
