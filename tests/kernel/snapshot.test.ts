import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { SNAPSHOT_TABLES } from "../../src/kernel/db/snapshot.js";
import {
  assignTokenToContext,
  createKnowledgeContext,
  createToken,
  type Database,
  ensureCard,
  exportSnapshot,
  importSnapshot,
  openDatabase,
  parseSnapshot,
  verifySnapshot,
} from "../../src/kernel/index.js";

/**
 * Tables that are deliberately NOT part of snapshots because their content
 * is derived/recomputable or describes the target installation rather than
 * portable learner data.
 * Every other schema table must be listed in SNAPSHOT_TABLES — the guard
 * test below fails when a new table is added without classifying it here
 * or there.
 */
const DERIVED_TABLES = ["token_embeddings", "zam_schema_version"];

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function freshDb(): Promise<Database> {
  const dir = mkdtempSync(join(tmpdir(), "zam-snapshot-"));
  tempDirs.push(dir);
  return openDatabase({
    dbPath: join(dir, "zam.db"),
    initialize: true,
    useConfiguredCloud: false,
  });
}

async function seed(db: Database): Promise<void> {
  // A token whose concept contains a single quote and unicode, to exercise
  // SQL escaping across the round trip.
  const tricky = await createToken(db, {
    slug: "ohm's-law",
    concept: "U = R·I — Ohm's law",
    domain: "electronics",
    bloom_level: 2,
  });
  const learningCard = await ensureCard(db, tricky.id, "alice");
  await db
    .prepare(
      "UPDATE cards SET state = 'learning', learning_step = 1 WHERE id = ?",
    )
    .run(learningCard.id);
  await db
    .prepare(
      `INSERT INTO imported_card_bindings
        (id, external_id, token_id, format, source_name, note_guid,
         card_ordinal, deck_path, content_hash, metadata_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      "01K20IMPORTBINDING00000000",
      "anki:ohms-law:0",
      tricky.id,
      "apkg",
      "electronics.apkg",
      "ohms-law",
      0,
      "Electronics",
      "content-hash",
      "metadata-hash",
    );
  await db
    .prepare(
      `INSERT INTO media_assets (hash, mime_type, byte_size, data)
       VALUES (?, ?, ?, ?)`,
    )
    .run("asset-hash", "image/png", 4, Uint8Array.from([1, 2, 3, 4]));
  await db
    .prepare(
      `INSERT INTO token_media
        (token_id, asset_hash, side, kind, ordinal, original_name, alt_text)
       VALUES (?, ?, 'question', 'image', 0, ?, ?)`,
    )
    .run(tricky.id, "asset-hash", "ohm.png", "Circuit diagram");

  const second = await createToken(db, {
    slug: "kirchhoff",
    concept: "Sum of currents at a node is zero",
    domain: "electronics",
    bloom_level: 3,
  });
  await ensureCard(db, second.id, "alice");

  await db
    .prepare("INSERT INTO user_config (key, value) VALUES (?, ?)")
    .run("system.locale", "de");
}

describe("database snapshots", () => {
  it("round-trips data into a fresh database", async () => {
    const source = await freshDb();
    await seed(source);
    const snapshot = await exportSnapshot(source);
    await source.close();

    const manifest = verifySnapshot(snapshot);
    expect(manifest.tables.tokens).toBe(2);
    expect(manifest.tables.cards).toBe(2);
    expect(manifest.tables.imported_card_bindings).toBe(1);
    expect(manifest.tables.media_assets).toBe(1);
    expect(manifest.tables.token_media).toBe(1);
    expect(manifest.tables.user_config).toBe(1);

    const target = await freshDb();
    const result = await importSnapshot(target, snapshot);
    expect(result.tables.tokens).toBe(2);
    expect(result.tables.cards).toBe(2);
    expect(result.tables.imported_card_bindings).toBe(1);
    expect(result.tables.media_assets).toBe(1);
    expect(result.tables.token_media).toBe(1);

    const token = (await target
      .prepare("SELECT concept FROM tokens WHERE slug = ?")
      .get("ohm's-law")) as { concept: string };
    expect(token.concept).toBe("U = R·I — Ohm's law");

    const locale = (await target
      .prepare("SELECT value FROM user_config WHERE key = ?")
      .get("system.locale")) as { value: string };
    expect(locale.value).toBe("de");

    const resumed = (await target
      .prepare(
        `SELECT c.state, c.learning_step
           FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE t.slug = ?`,
      )
      .get("ohm's-law")) as { state: string; learning_step: number | null };
    expect(resumed).toEqual({ state: "learning", learning_step: 1 });
    const media = (await target
      .prepare(
        `SELECT ma.data, tm.original_name
           FROM token_media tm JOIN media_assets ma ON ma.hash = tm.asset_hash`,
      )
      .get()) as { data: Uint8Array; original_name: string };
    expect(media.original_name).toBe("ohm.png");
    expect([...media.data]).toEqual([1, 2, 3, 4]);
    await target.close();
  });

  it("refuses to overwrite a non-empty database without force", async () => {
    const source = await freshDb();
    await seed(source);
    const snapshot = await exportSnapshot(source);
    await source.close();

    const target = await freshDb();
    await createToken(target, { slug: "existing", concept: "keep me" });

    await expect(importSnapshot(target, snapshot)).rejects.toThrow(/force/i);

    // The failed import must not have mutated the target.
    const count = (await target
      .prepare("SELECT COUNT(*) AS n FROM tokens")
      .get()) as { n: number };
    expect(count.n).toBe(1);
    await target.close();
  });

  it("overwrites a non-empty database with force", async () => {
    const source = await freshDb();
    await seed(source);
    const snapshot = await exportSnapshot(source);
    await source.close();

    const target = await freshDb();
    await createToken(target, { slug: "stale", concept: "replace me" });

    const result = await importSnapshot(target, snapshot, { force: true });
    expect(result.tables.tokens).toBe(2);

    const stale = await target
      .prepare("SELECT id FROM tokens WHERE slug = ?")
      .get("stale");
    expect(stale).toBeUndefined();
    await target.close();
  });

  it("detects a corrupted snapshot via checksum", async () => {
    const source = await freshDb();
    await seed(source);
    const snapshot = await exportSnapshot(source);
    await source.close();

    // Tamper a value that appears verbatim in the body (no escaped quotes).
    const tampered = snapshot.replace("Sum of currents", "Tampered text");
    expect(tampered).not.toBe(snapshot);
    expect(() => verifySnapshot(tampered)).toThrow(/checksum/i);

    const target = await freshDb();
    await expect(importSnapshot(target, tampered)).rejects.toThrow(/checksum/i);
    await target.close();
  });

  it("rejects input that is not a snapshot", async () => {
    expect(() => parseSnapshot("SELECT 1;")).toThrow(/snapshot/i);
  });

  it("classifies every schema table as snapshotted or derived", async () => {
    const db = await freshDb();
    const rows = (await db
      .prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
         ORDER BY name`,
      )
      .all()) as Array<{ name: string }>;
    await db.close();

    const classified = new Set<string>([...SNAPSHOT_TABLES, ...DERIVED_TABLES]);
    const unclassified = rows
      .map((row) => row.name)
      .filter((name) => !classified.has(name));

    expect(unclassified).toEqual([]);
  });

  it("round-trips sources and knowledge contexts", async () => {
    const source = await freshDb();
    const token = await createToken(source, {
      slug: "photosynthesis",
      concept: "Plants convert light into chemical energy",
      domain: "biology",
      bloom_level: 2,
    });

    const context = await createKnowledgeContext(source, {
      name: "school",
      label: "Schule",
      language: "de",
    });
    await assignTokenToContext(source, token.id, context.id);

    await source
      .prepare(
        "INSERT INTO sources (id, type, uri, content) VALUES (?, ?, ?, ?)",
      )
      .run("src-bio-book", "file", "file:///books/bio.pdf", "chapter text");
    await source
      .prepare(
        `INSERT INTO token_sources (token_id, source_id, excerpt, page_number)
         VALUES (?, ?, ?, ?)`,
      )
      .run(token.id, "src-bio-book", "Light reaction excerpt", "42");

    const snapshot = await exportSnapshot(source);
    await source.close();

    const manifest = verifySnapshot(snapshot);
    expect(manifest.tables.sources).toBe(1);
    expect(manifest.tables.token_sources).toBe(1);
    expect(manifest.tables.contexts).toBe(1);
    expect(manifest.tables.token_contexts).toBe(1);

    const target = await freshDb();
    const result = await importSnapshot(target, snapshot);
    expect(result.tables.contexts).toBe(1);

    const restoredContext = (await target
      .prepare("SELECT name, label, language FROM contexts")
      .get()) as { name: string; label: string; language: string };
    expect(restoredContext).toMatchObject({
      name: "school",
      label: "Schule",
      language: "de",
    });

    const assignment = (await target
      .prepare("SELECT COUNT(*) AS n FROM token_contexts")
      .get()) as { n: number };
    expect(assignment.n).toBe(1);

    const restoredSource = (await target
      .prepare(
        `SELECT s.uri, ts.excerpt, ts.page_number
         FROM token_sources ts JOIN sources s ON s.id = ts.source_id`,
      )
      .get()) as { uri: string; excerpt: string; page_number: string };
    expect(restoredSource).toMatchObject({
      uri: "file:///books/bio.pdf",
      excerpt: "Light reaction excerpt",
      page_number: "42",
    });
    await target.close();
  });

  it("exports and restores an empty database", async () => {
    const source = await freshDb();
    const snapshot = await exportSnapshot(source);
    await source.close();

    const manifest = verifySnapshot(snapshot);
    expect(manifest.tables.tokens).toBe(0);

    const target = await freshDb();
    const result = await importSnapshot(target, snapshot);
    expect(result.total).toBe(0);
    await target.close();
  });
});
