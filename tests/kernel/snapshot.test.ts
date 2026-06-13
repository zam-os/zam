import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  type Database,
  createToken,
  ensureCard,
  exportSnapshot,
  importSnapshot,
  openDatabase,
  parseSnapshot,
  verifySnapshot,
} from "../../src/kernel/index.js";

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
  await ensureCard(db, tricky.id, "alice");

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
    expect(manifest.tables.user_config).toBe(1);

    const target = await freshDb();
    const result = await importSnapshot(target, snapshot);
    expect(result.tables.tokens).toBe(2);
    expect(result.tables.cards).toBe(2);

    const token = (await target
      .prepare("SELECT concept FROM tokens WHERE slug = ?")
      .get("ohm's-law")) as { concept: string };
    expect(token.concept).toBe("U = R·I — Ohm's law");

    const locale = (await target
      .prepare("SELECT value FROM user_config WHERE key = ?")
      .get("system.locale")) as { value: string };
    expect(locale.value).toBe("de");
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
