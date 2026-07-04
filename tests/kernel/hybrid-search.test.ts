import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findPossibleDuplicates } from "../../src/cli/llm/embedder.js";
import {
  cosineSimilarity,
  createToken,
  type Database,
  deprecateToken,
  openDatabase,
  searchTokensHybrid,
  setSetting,
  type Token,
  upsertTokenEmbedding,
} from "../../src/kernel/index.js";

const MODEL = "embeddinggemma-300m";

describe("hybrid search & dedup", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-hybrid-search-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function makeToken(
    overrides: Partial<Token> & { slug: string; concept: string },
  ): Promise<Token> {
    return createToken(db, {
      slug: overrides.slug,
      concept: overrides.concept,
      domain: overrides.domain ?? "testing",
      question: overrides.question ?? "What is the concept?",
    });
  }

  // ── cosineSimilarity ──────────────────────────────────────────────────────

  describe("cosineSimilarity", () => {
    it("returns 1.0 for identical vectors", () => {
      const a = new Float32Array([1, 0, 0, 0]);
      expect(cosineSimilarity(a, a)).toBeCloseTo(1.0, 5);
    });

    it("returns 0.0 for orthogonal vectors", () => {
      const a = new Float32Array([1, 0, 0, 0]);
      const b = new Float32Array([0, 1, 0, 0]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
    });

    it("returns 0.0 if either vector has norm 0", () => {
      const a = new Float32Array([0, 0, 0, 0]);
      const b = new Float32Array([1, 2, 3, 4]);
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it("correctly calculates similarity for opposite vectors", () => {
      const a = new Float32Array([1, 2, 3]);
      const b = new Float32Array([-1, -2, -3]);
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
    });
  });

  // ── hybrid search ─────────────────────────────────────────────────────────

  describe("searchTokensHybrid", () => {
    it("performs paraphrase recovery (vector hit only)", async () => {
      const t = await makeToken({
        slug: "dedicated-runtime",
        concept: "dedicated runtime for each customer",
      });

      await upsertTokenEmbedding(db, {
        tokenId: t.id,
        embedding: [1, 0, 0, 0],
        model: MODEL,
        contentHash: "hash-t",
      });

      // Query "tenant isolation model" has no word overlap, but a high-similarity query vector
      const results = await searchTokensHybrid(db, "tenant isolation model", {
        queryEmbedding: [0.99, 0.1, 0, 0],
        model: MODEL,
      });

      expect(results.length).toBe(1);
      expect(results[0].slug).toBe("dedicated-runtime");
      expect(results[0].lexicalRank).toBeNull();
      expect(results[0].vectorRank).toBe(1);
      expect(results[0].similarity).toBeCloseTo(0.99, 2);
    });

    it("performs acronym recovery (lexical hit only, orthogonal vector)", async () => {
      const t = await makeToken({
        slug: "snat-port-exhaustion",
        concept: "SNAT port exhaustion",
      });

      await upsertTokenEmbedding(db, {
        tokenId: t.id,
        embedding: [0, 0, 1, 0],
        model: MODEL,
        contentHash: "hash-snat",
      });

      // Query "SNAT" with orthogonal query vector
      const results = await searchTokensHybrid(db, "SNAT", {
        queryEmbedding: [1, 0, 0, 0],
        model: MODEL,
      });

      expect(results.length).toBe(1);
      expect(results[0].slug).toBe("snat-port-exhaustion");
      expect(results[0].lexicalRank).toBe(1);
      expect(results[0].vectorRank).toBeNull();
      expect(results[0].similarity).toBeNull();
    });

    it("ranks tokens higher when hit by both legs (fusion)", async () => {
      // Create three tokens
      const t1 = await makeToken({
        slug: "token-one",
        concept: "Azure Kubernetes Service Cluster",
      });
      const t2 = await makeToken({
        slug: "token-two",
        concept: "Kubernetes Pod configuration",
      });
      const t3 = await makeToken({
        slug: "token-three",
        concept: "Random text without overlaps",
      });

      await upsertTokenEmbedding(db, {
        tokenId: t1.id,
        embedding: [1, 0, 0],
        model: MODEL,
        contentHash: "h1",
      });
      await upsertTokenEmbedding(db, {
        tokenId: t2.id,
        embedding: [0, 1, 0],
        model: MODEL,
        contentHash: "h2",
      });
      await upsertTokenEmbedding(db, {
        tokenId: t3.id,
        embedding: [0, 0, 1],
        model: MODEL,
        contentHash: "h3",
      });

      // Query has word overlap with t1 and t2 (lexical hit).
      // Let's stub query embedding so t2 gets the top vector hit, but t1 also has overlap.
      // t1 should have: lexical hit (rank 1) + vector hit (rank 2 or 3)
      // t2 should have: lexical hit (rank 2) + vector hit (rank 1)
      // Let's set query vector: [0.3, 0.9, 0] -> t2 similarity = 0.9, t1 similarity = 0.3
      const results = await searchTokensHybrid(db, "Kubernetes Cluster", {
        queryEmbedding: [0.3, 0.9, 0],
        model: MODEL,
        vectorTopK: 2,
      });

      // Both t1 and t2 should be hit by both legs and outrank t3 (which has none)
      expect(results.length).toBe(2);
      expect(results[0].lexicalRank).toBeDefined();
      expect(results[0].vectorRank).toBeDefined();
      expect(results[1].lexicalRank).toBeDefined();
      expect(results[1].vectorRank).toBeDefined();
    });

    it("skips rows with dimension mismatch without throwing", async () => {
      const t = await makeToken({
        slug: "dim-mismatch",
        concept: "Dimension mismatch test",
      });
      await upsertTokenEmbedding(db, {
        tokenId: t.id,
        embedding: [1, 0], // 2-dimensional
        model: MODEL,
        contentHash: "hash-dim",
      });

      // Query vector is 3-dimensional
      const results = await searchTokensHybrid(db, "test", {
        queryEmbedding: [1, 0, 0],
        model: MODEL,
      });

      // Lexical hit is returned, but similarity is null (skipped in vector leg)
      expect(results.length).toBe(1);
      expect(results[0].similarity).toBeNull();
      expect(results[0].vectorRank).toBeNull();
    });

    it("returns results in findTokens order if queryEmbedding is not provided", async () => {
      await makeToken({ slug: "apple", concept: "Apple fruit" });
      await makeToken({ slug: "banana", concept: "Banana fruit" });

      const results = await searchTokensHybrid(db, "fruit");
      expect(results.length).toBe(2);
      expect(results[0].lexicalRank).toBe(1);
      expect(results[1].lexicalRank).toBe(2);
    });

    it("does not include deprecated tokens or tokens without embeddings in the vector leg", async () => {
      const t1 = await makeToken({
        slug: "active-token",
        concept: "Active concept",
      });
      const t2 = await makeToken({
        slug: "deprecated-token",
        concept: "Deprecated concept",
      });

      await upsertTokenEmbedding(db, {
        tokenId: t1.id,
        embedding: [1, 0],
        model: MODEL,
        contentHash: "h1",
      });
      await upsertTokenEmbedding(db, {
        tokenId: t2.id,
        embedding: [1, 0],
        model: MODEL,
        contentHash: "h2",
      });

      await deprecateToken(db, t2.slug);

      const results = await searchTokensHybrid(db, "concept", {
        queryEmbedding: [1, 0],
        model: MODEL,
      });

      expect(results.length).toBe(1);
      expect(results[0].slug).toBe("active-token");
    });
  });

  // ── findPossibleDuplicates ────────────────────────────────────────────────

  describe("findPossibleDuplicates", () => {
    it("returns duplicates above threshold using injectable embed stub", async () => {
      const t = await makeToken({
        slug: "dedicated-runtime-dup",
        concept: "dedicated runtime for each customer",
      });

      await upsertTokenEmbedding(db, {
        tokenId: t.id,
        embedding: [1, 0, 0, 0],
        model: MODEL,
        contentHash: "hash-dup",
      });

      // Injectable stub returning high similarity query vector
      const embedStub = async () => {
        return { vector: [0.99, 0.1, 0, 0], model: MODEL };
      };

      const dups = await findPossibleDuplicates(
        db,
        { concept: "tenant isolation model" },
        embedStub,
      );

      expect(dups.length).toBe(1);
      expect(dups[0].slug).toBe("dedicated-runtime-dup");
      expect(dups[0].similarity).toBeCloseTo(0.99, 2);
    });

    it("filters out duplicates below threshold", async () => {
      const t = await makeToken({
        slug: "unrelated-token",
        concept: "unrelated concept description",
      });

      await upsertTokenEmbedding(db, {
        tokenId: t.id,
        embedding: [0, 0, 1, 0],
        model: MODEL,
        contentHash: "hash-unrelated",
      });

      // Injectable stub returning orthogonal vector (similarity 0.0)
      const embedStub = async () => {
        return { vector: [1, 0, 0, 0], model: MODEL };
      };

      const dups = await findPossibleDuplicates(
        db,
        { concept: "tenant isolation model" },
        embedStub,
      );

      expect(dups.length).toBe(0);
    });

    it("obeys search.dedup_threshold custom setting", async () => {
      const t = await makeToken({
        slug: "threshold-token",
        concept: "threshold test concept",
      });

      await upsertTokenEmbedding(db, {
        tokenId: t.id,
        embedding: [0.8, 0.6, 0, 0],
        model: MODEL,
        contentHash: "hash-threshold",
      });

      // Stub returns similarity of 0.8
      const embedStub = async () => {
        return { vector: [1, 0, 0, 0], model: MODEL };
      };

      // Set custom threshold of 0.90
      await setSetting(db, "search.dedup_threshold", "0.90");

      let dups = await findPossibleDuplicates(
        db,
        { concept: "test concept" },
        embedStub,
      );
      expect(dups.length).toBe(0); // 0.8 < 0.9

      // Set custom threshold of 0.75
      await setSetting(db, "search.dedup_threshold", "0.75");

      dups = await findPossibleDuplicates(
        db,
        { concept: "test concept" },
        embedStub,
      );
      expect(dups.length).toBe(1); // 0.8 >= 0.75
      expect(dups[0].slug).toBe("threshold-token");
    });

    it("returns [] if embedding query fails (returns null)", async () => {
      const embedStub = async () => null;

      const dups = await findPossibleDuplicates(
        db,
        { concept: "tenant isolation model" },
        embedStub,
      );

      expect(dups).toEqual([]);
    });
  });
});
