import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  type Database,
  deleteTokens,
  ensureCard,
  getTokenBySlug,
  getTokensDeleteImpact,
  openDatabase,
  tokenSetFingerprint,
} from "../../src/kernel/index.js";

describe("deleting an area of tokens", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-token-delete-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    for (const slug of ["first", "second", "third"]) {
      const token = await createToken(db, { slug, concept: slug });
      await ensureCard(db, token.id, "thomas");
    }
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("deletes every token of the set and sums their impact", async () => {
    const impact = await getTokensDeleteImpact(db, ["first", "second"]);
    expect(impact.cards).toBe(2);

    const result = await deleteTokens(db, ["first", "second", "first"]);
    expect(result.tokens.map((t) => t.slug)).toEqual(["first", "second"]);
    expect(result.impact.cards).toBe(2);
    expect(await getTokenBySlug(db, "first")).toBeUndefined();
    expect(await getTokenBySlug(db, "second")).toBeUndefined();
    expect(await getTokenBySlug(db, "third")).not.toBeUndefined();
  });

  it("deletes nothing when one token of the set cannot be deleted", async () => {
    await db.exec(`
      CREATE TRIGGER refuse_third BEFORE DELETE ON tokens
      WHEN OLD.slug = 'third'
      BEGIN SELECT RAISE(ABORT, 'refused'); END;
    `);

    await expect(
      deleteTokens(db, ["first", "second", "third"]),
    ).rejects.toThrow();
    for (const slug of ["first", "second", "third"]) {
      expect(await getTokenBySlug(db, slug)).not.toBeUndefined();
    }
  });

  it("fingerprints a set independent of order and duplicates", () => {
    expect(tokenSetFingerprint(["a", "b"])).toBe(
      tokenSetFingerprint(["b", "a", "b"]),
    );
    expect(tokenSetFingerprint(["a", "b"])).not.toBe(
      tokenSetFingerprint(["a", "b", "c"]),
    );
  });
});
