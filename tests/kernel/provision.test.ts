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
        "atom_id",
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

/**
 * M024 — the migration that repairs M023's nullable-grade key.
 *
 * The Codex hardening review rejected the first version for querying
 * `sqlite_master` on a path shared with the PostgreSQL provider and for a
 * four-step table rebuild that could not be resumed after a crash. What
 * replaced it is a unique index over `COALESCE(grade, -1)` plus a repair that
 * only runs when the index refuses to build, so these tests cover the three
 * database states it can meet and the conflict it must not paper over.
 */
describe("M024 curriculum binding uniqueness", () => {
  async function openFresh(): Promise<Database> {
    return openDatabase({
      dbPath: join(tempDir(), "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  }

  /** Recreate the M023 table shape: nullable grade inside the primary key. */
  async function downgradeToM023(db: Database): Promise<void> {
    await db.exec("DROP INDEX IF EXISTS ux_atom_binding");
    await db.exec("DROP TABLE IF EXISTS atom_curriculum_bindings");
    await db.exec(`
      CREATE TABLE atom_curriculum_bindings (
        atom_id         TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
        provider        TEXT NOT NULL,
        school_type     TEXT NOT NULL DEFAULT '',
        grade           INTEGER,
        track           TEXT NOT NULL DEFAULT '',
        subject         TEXT NOT NULL DEFAULT '',
        topic_code      TEXT NOT NULL,
        topic_title     TEXT,
        exam_relevant   INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (atom_id, provider, topic_code, grade, track)
      );
    `);
  }

  async function seedAtom(db: Database): Promise<void> {
    await db
      .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
      .run("01K3X9A7R4B8C1D2E3F4G5B001", "Test");
  }

  async function insertBinding(db: Database, title: string): Promise<void> {
    await db
      .prepare(
        `INSERT INTO atom_curriculum_bindings
           (atom_id, provider, school_type, grade, track, subject,
            topic_code, topic_title, exam_relevant)
         VALUES (?, 'lp', 'realschule', NULL, '', 'physik', 'T1', ?, 0)`,
      )
      .run("01K3X9A7R4B8C1D2E3F4G5B001", title);
  }

  async function bindingCount(db: Database): Promise<number> {
    const row = (await db
      .prepare("SELECT COUNT(*) AS n FROM atom_curriculum_bindings")
      .get()) as { n: number };
    return row.n;
  }

  it("leaves a fresh database alone and is repeatable", async () => {
    const db = await openFresh();
    await applySchemaAndMigrations(db);
    await applySchemaAndMigrations(db);
    const indexes = (await db.pragma(
      "index_list(atom_curriculum_bindings)",
    )) as Array<{ name: string }>;
    expect(indexes.map((index) => index.name)).toContain("ux_atom_binding");
    await db.close();
  });

  it("collapses the duplicates an M023 database accumulated", async () => {
    const db = await openFresh();
    await downgradeToM023(db);
    await seedAtom(db);
    // The bug: NULL never equals NULL, so the old key permitted all three.
    await insertBinding(db, "Optik");
    await insertBinding(db, "Optik");
    await insertBinding(db, "Optik");
    expect(await bindingCount(db)).toBe(3);

    await applySchemaAndMigrations(db);

    expect(await bindingCount(db)).toBe(1);
    const surviving = (await db
      .prepare("SELECT topic_title FROM atom_curriculum_bindings")
      .get()) as { topic_title: string };
    expect(surviving.topic_title).toBe("Optik");

    // Repeatable, and the repaired database now rejects a fourth copy.
    await applySchemaAndMigrations(db);
    expect(await bindingCount(db)).toBe(1);
    await expect(insertBinding(db, "Optik")).rejects.toThrow();
    await db.close();
  });

  it("refuses to merge duplicates that disagree", async () => {
    const db = await openFresh();
    await downgradeToM023(db);
    await seedAtom(db);
    await insertBinding(db, "Optik");
    await insertBinding(db, "Etwas anderes");

    // A column-wise MAX() would have invented a row no release published.
    await expect(applySchemaAndMigrations(db)).rejects.toThrow(
      /conflicting duplicate curriculum bindings/,
    );
    expect(await bindingCount(db)).toBe(2);
    await db.close();
  });
});

/**
 * M027 — the wording a rating was earned on.
 *
 * Personal learning evidence is the durable half of a learner's state when the
 * knowledge base is rebuilt (ADR 2026-08-14 Decision 9). A rating whose
 * question is unknown cannot be classified later as the same item or a
 * materially revised one, and `cards.learned_content_version` only ever holds
 * the current value.
 */
describe("M027 review content version", () => {
  it("adds the column without inventing a version for existing rows", async () => {
    const db = await openDatabase({
      dbPath: join(tempDir(), "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });

    // A log row as it looked before the column existed.
    await db
      .prepare(
        `INSERT INTO tokens (id, slug, concept) VALUES ('01K3X9A7R4B8C1D2E3F4G5C001', 'probe', 'c')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO cards (id, token_id, user_id, due_at)
         VALUES ('01K3X9A7R4B8C1D2E3F4G5C002', '01K3X9A7R4B8C1D2E3F4G5C001', 'u', '2026-08-01T00:00:00.000Z')`,
      )
      .run();
    await db
      .prepare(
        `INSERT INTO review_logs (id, card_id, token_id, user_id, rating, scheduled_at)
         VALUES ('01K3X9A7R4B8C1D2E3F4G5C003', '01K3X9A7R4B8C1D2E3F4G5C002',
                 '01K3X9A7R4B8C1D2E3F4G5C001', 'u', 3, '2026-08-01T00:00:00.000Z')`,
      )
      .run();

    await applySchemaAndMigrations(db);

    const row = (await db
      .prepare("SELECT content_version FROM review_logs WHERE id = ?")
      .get("01K3X9A7R4B8C1D2E3F4G5C003")) as { content_version: number | null };
    // NULL means "unknown", not version 1 — guessing would fabricate evidence.
    expect(row.content_version).toBeNull();
    await db.close();
  });
});
