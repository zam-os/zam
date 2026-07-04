import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  computeContentHash,
  createToken,
  type Database,
  decodeEmbedding,
  deleteToken,
  embeddingContentForToken,
  encodeEmbedding,
  getEmbeddingCoverage,
  getTokenEmbedding,
  listEmbeddedTokens,
  listTokensNeedingEmbedding,
  openDatabase,
  type Token,
  updateToken,
  upsertTokenEmbedding,
} from "../../src/kernel/index.js";

const MODEL = "embeddinggemma-300m";

describe("token embedding operations", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-token-embeddings-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function makeToken(overrides?: Partial<Token>): Promise<Token> {
    return createToken(db, {
      slug: overrides?.slug ?? "test-token",
      concept: overrides?.concept ?? "This is a concept describing a topic.",
      domain: overrides?.domain ?? "testing",
      question: overrides?.question ?? "What is the concept?",
    });
  }

  // ── prompt formatting ──────────────────────────────────────────────────────

  it("formats stored documents with the model-agnostic canonical representation", async () => {
    const token = await makeToken({
      concept: "A prompted concept",
      question: "How is it recalled?",
      domain: "prompting",
    });

    expect(embeddingContentForToken(token)).toBe(
      "A prompted concept\nHow is it recalled?\nprompting",
    );
  });

  describe("encodeEmbedding / decodeEmbedding", () => {
    it("round-trips a vector through encode and decode", () => {
      const vec = [0.1, -0.5, 3.25, 0];
      const encoded = encodeEmbedding(vec);
      const decoded = decodeEmbedding(encoded);
      expect(Array.from(decoded)).toEqual(Array.from(Float32Array.from(vec)));
    });

    it("round-trips correctly through an unaligned buffer view", () => {
      const vec = [1, 2, 3, 4, 5];
      const encoded = encodeEmbedding(vec);
      // Prepend 2 bytes so the subarray view starts at a non-4-aligned offset.
      const pool = Buffer.concat([Buffer.alloc(2), Buffer.from(encoded)]);
      const unaligned = pool.subarray(2);
      expect(unaligned.byteOffset % 4).not.toBe(0);

      const decoded = decodeEmbedding(unaligned);
      expect(Array.from(decoded)).toEqual(Array.from(Float32Array.from(vec)));
    });

    it("produces a fresh buffer that does not alias the source array", () => {
      const vec = Float32Array.from([9, 8, 7]);
      const encoded = encodeEmbedding(vec);
      vec[0] = 999;
      const decoded = decodeEmbedding(encoded);
      expect(decoded[0]).toBe(9);
    });

    it("throws an error if the blob byteLength is not a multiple of 4", () => {
      const invalid = new Uint8Array([1, 2, 3]);
      expect(() => decodeEmbedding(invalid)).toThrow(
        "must be a multiple of 4 bytes",
      );
    });
  });

  // ── upsert / get ─────────────────────────────────────────────────────────

  describe("upsertTokenEmbedding / getTokenEmbedding", () => {
    it("stores and retrieves a vector with matching metadata", async () => {
      const token = await makeToken();
      const vec = [0.5, 0.25, -0.75];
      const text = embeddingContentForToken(token);
      const hash = computeContentHash(text);

      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: vec,
        model: MODEL,
        contentHash: hash,
      });

      const stored = await getTokenEmbedding(db, token.id);
      expect(stored).toBeDefined();
      expect(Array.from(stored!.embedding)).toEqual(
        Array.from(Float32Array.from(vec)),
      );
      expect(stored!.model).toBe(MODEL);
      expect(stored!.dims).toBe(3);
      expect(stored!.content_hash).toBe(hash);
      expect(stored!.token_id).toBe(token.id);
      expect(typeof stored!.embedded_at).toBe("string");
    });

    it("returns undefined for a token with no stored embedding", async () => {
      const token = await makeToken();
      const stored = await getTokenEmbedding(db, token.id);
      expect(stored).toBeUndefined();
    });

    it("overwrites the previous vector on a second upsert (ON CONFLICT)", async () => {
      const token = await makeToken();
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 1, 1],
        model: MODEL,
        contentHash: "hash-a",
      });
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [2, 2],
        model: MODEL,
        contentHash: "hash-b",
      });

      const stored = await getTokenEmbedding(db, token.id);
      expect(Array.from(stored!.embedding)).toEqual([2, 2]);
      expect(stored!.dims).toBe(2);
      expect(stored!.content_hash).toBe("hash-b");
    });
  });

  // ── staleness matrix ─────────────────────────────────────────────────────

  describe("listTokensNeedingEmbedding staleness matrix", () => {
    it("classifies a fresh token with no embedding row as missing", async () => {
      const token = await makeToken({ slug: "missing-token" });
      const needing = await listTokensNeedingEmbedding(db, MODEL);
      const entry = needing.find((n) => n.token.id === token.id);
      expect(entry).toBeDefined();
      expect(entry!.reason).toBe("missing");
      expect(entry!.text).toBe(embeddingContentForToken(token));
    });

    it("classifies an edited token as content-changed", async () => {
      const token = await makeToken({ slug: "content-changed-token" });
      const originalText = embeddingContentForToken(token);
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(originalText),
      });

      // Should be fresh immediately after embedding.
      let needing = await listTokensNeedingEmbedding(db, MODEL);
      expect(needing.some((n) => n.token.id === token.id)).toBe(false);

      const updated = await updateToken(db, token.slug, {
        concept: "A completely different concept",
      });

      needing = await listTokensNeedingEmbedding(db, MODEL);
      const entry = needing.find((n) => n.token.id === updated.id);
      expect(entry).toBeDefined();
      expect(entry!.reason).toBe("content-changed");
    });

    it("classifies a token embedded under another model as model-changed", async () => {
      const token = await makeToken({ slug: "model-changed-token" });
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 2, 3],
        model: "some-other-model",
        contentHash: computeContentHash(embeddingContentForToken(token)),
      });

      const needing = await listTokensNeedingEmbedding(db, MODEL);
      const entry = needing.find((n) => n.token.id === token.id);
      expect(entry).toBeDefined();
      expect(entry!.reason).toBe("model-changed");
    });

    it("classifies a same-model vector with another dimension as dimension-changed", async () => {
      const token = await makeToken({ slug: "dimension-changed-token" });
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(token)),
      });

      const needing = await listTokensNeedingEmbedding(db, MODEL, { dims: 4 });
      const entry = needing.find((item) => item.token.id === token.id);
      expect(entry?.reason).toBe("dimension-changed");
    });

    it("does not return a fresh vector unless force is set", async () => {
      const token = await makeToken({ slug: "fresh-token" });
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(token)),
      });

      const needing = await listTokensNeedingEmbedding(db, MODEL);
      expect(needing.some((n) => n.token.id === token.id)).toBe(false);

      const forced = await listTokensNeedingEmbedding(db, MODEL, {
        force: true,
      });
      const entry = forced.find((n) => n.token.id === token.id);
      expect(entry).toBeDefined();
      expect(entry!.reason).toBe("content-changed");
    });

    it("applies limit after classification", async () => {
      for (let i = 0; i < 5; i++) {
        await makeToken({
          slug: `limited-token-${i}`,
          concept: `Concept ${i}`,
        });
      }
      const needing = await listTokensNeedingEmbedding(db, MODEL, {
        limit: 2,
      });
      expect(needing.length).toBe(2);
    });
  });

  // ── cascade delete ───────────────────────────────────────────────────────

  describe("deleteToken cascade", () => {
    it("removes the embedding row when the token is deleted", async () => {
      const token = await makeToken({ slug: "cascade-token" });
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(token)),
      });

      expect(await getTokenEmbedding(db, token.id)).toBeDefined();

      await deleteToken(db, token.slug);

      expect(await getTokenEmbedding(db, token.id)).toBeUndefined();
    });
  });

  // ── coverage ─────────────────────────────────────────────────────────────

  describe("getEmbeddingCoverage", () => {
    it("counts tokens, embedded, missing, and stale to match the matrix", async () => {
      const fresh = await makeToken({
        slug: "coverage-fresh",
        concept: "Fresh concept",
      });
      await upsertTokenEmbedding(db, {
        tokenId: fresh.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(fresh)),
      });

      await makeToken({
        slug: "coverage-missing",
        concept: "Missing concept",
      });

      const contentChanged = await makeToken({
        slug: "coverage-content-changed",
        concept: "Original concept",
      });
      await upsertTokenEmbedding(db, {
        tokenId: contentChanged.id,
        embedding: [4, 5, 6],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(contentChanged)),
      });
      await updateToken(db, contentChanged.slug, {
        concept: "Edited concept",
      });

      const modelChanged = await makeToken({
        slug: "coverage-model-changed",
        concept: "Model-changed concept",
      });
      await upsertTokenEmbedding(db, {
        tokenId: modelChanged.id,
        embedding: [7, 8, 9],
        model: "old-model",
        contentHash: computeContentHash(embeddingContentForToken(modelChanged)),
      });

      const coverage = await getEmbeddingCoverage(db, MODEL);
      expect(coverage.tokens).toBe(4);
      expect(coverage.missing).toBe(1);
      expect(coverage.stale).toBe(2);
      expect(coverage.embedded).toBe(1);

      const dimensionAware = await getEmbeddingCoverage(db, MODEL, { dims: 4 });
      expect(dimensionAware.stale).toBe(3);
      expect(dimensionAware.embedded).toBe(0);
    });
  });

  // ── listEmbeddedTokens ───────────────────────────────────────────────────

  describe("listEmbeddedTokens", () => {
    it("returns only tokens embedded under the requested model", async () => {
      const matching = await makeToken({
        slug: "embedded-matching",
        concept: "Matching model concept",
      });
      await upsertTokenEmbedding(db, {
        tokenId: matching.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(matching)),
      });

      const other = await makeToken({
        slug: "embedded-other-model",
        concept: "Other model concept",
      });
      await upsertTokenEmbedding(db, {
        tokenId: other.id,
        embedding: [4, 5, 6],
        model: "different-model",
        contentHash: computeContentHash(embeddingContentForToken(other)),
      });

      const rows = await listEmbeddedTokens(db, MODEL);
      expect(rows.length).toBe(1);
      expect(rows[0].token.id).toBe(matching.id);
      expect(Array.from(rows[0].embedding)).toEqual([1, 2, 3]);
    });

    it("excludes deprecated tokens", async () => {
      const token = await makeToken({
        slug: "embedded-deprecated",
        concept: "Deprecated concept",
      });
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(token)),
      });

      await db
        .prepare(
          "UPDATE tokens SET deprecated_at = datetime('now') WHERE id = ?",
        )
        .run(token.id);

      const rows = await listEmbeddedTokens(db, MODEL);
      expect(rows.some((r) => r.token.id === token.id)).toBe(false);
    });

    it("excludes vectors whose content hash is stale", async () => {
      const token = await makeToken({
        slug: "embedded-stale",
        concept: "Old meaning",
      });
      await upsertTokenEmbedding(db, {
        tokenId: token.id,
        embedding: [1, 2, 3],
        model: MODEL,
        contentHash: computeContentHash(embeddingContentForToken(token)),
      });
      await updateToken(db, token.slug, { concept: "New meaning" });

      const rows = await listEmbeddedTokens(db, MODEL);
      expect(rows.some((row) => row.token.id === token.id)).toBe(false);
    });
  });
});
