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
import { createToken, ensureCard, openDatabase } from "../../src/kernel/index.js";
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
async function describeSchema(
  db: Database,
): Promise<Record<string, string[]>> {
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

describe("applySchemaAndMigrations", () => {
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
});
