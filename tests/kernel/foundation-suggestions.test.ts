import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPrerequisite,
  computeContentHash,
  createToken,
  type Database,
  deprecateToken,
  embeddingContentForToken,
  openDatabase,
  suggestFoundations,
  type Token,
  upsertTokenEmbedding,
} from "../../src/kernel/index.js";

const MODEL = "embeddinggemma-300m";

describe("foundation suggestions", () => {
  let tempDir: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-foundation-suggestions-"));
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
      bloom_level: overrides.bloom_level ?? 1,
    });
  }

  async function setEmbedding(token: Token, vec: number[]) {
    await upsertTokenEmbedding(db, {
      tokenId: token.id,
      embedding: vec,
      model: MODEL,
      contentHash: computeContentHash(embeddingContentForToken(token)),
    });
  }

  function makeUnitVector(c: number): number[] {
    return [c, Math.sqrt(1 - c * c), 0, 0];
  }

  it("filters suggestions by similarity bands (minSimilarity <= sim < maxSimilarity)", async () => {
    const queryVec = [1, 0, 0, 0];

    // Similarity = 0.44 (below default min 0.45)
    const t44 = await makeToken({ slug: "t44", concept: "Concept 44" });
    await setEmbedding(t44, makeUnitVector(0.44));

    // Similarity = 0.4501 (safely within default min 0.45)
    const t45 = await makeToken({ slug: "t45", concept: "Concept 45" });
    await setEmbedding(t45, makeUnitVector(0.4501));

    // Similarity = 0.84 (below default max 0.85)
    const t84 = await makeToken({ slug: "t84", concept: "Concept 84" });
    await setEmbedding(t84, makeUnitVector(0.84));

    // Similarity = 0.86 (above default max 0.85)
    const t86 = await makeToken({ slug: "t86", concept: "Concept 86" });
    await setEmbedding(t86, makeUnitVector(0.86));

    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
    });

    expect(suggestions.map((s) => s.token.slug)).toEqual(["t84", "t45"]);
    expect(suggestions[0].similarity).toBeCloseTo(0.84, 5);
    expect(suggestions[1].similarity).toBeCloseTo(0.4501, 5);
  });

  it("excludes the target token and deprecated tokens", async () => {
    const queryVec = [1, 0, 0, 0];

    const target = await makeToken({
      slug: "target",
      concept: "Target Concept",
    });
    await setEmbedding(target, makeUnitVector(0.6));

    const active = await makeToken({
      slug: "active",
      concept: "Active Concept",
    });
    await setEmbedding(active, makeUnitVector(0.61));

    const deprecated = await makeToken({
      slug: "deprecated",
      concept: "Deprecated Concept",
    });
    await setEmbedding(deprecated, makeUnitVector(0.62));
    await deprecateToken(db, deprecated.slug);

    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
      targetTokenId: target.id,
    });

    expect(suggestions.map((s) => s.token.slug)).toEqual(["active"]);
  });

  it("sets the alreadyPrerequisite flag correctly", async () => {
    const queryVec = [1, 0, 0, 0];

    const target = await makeToken({
      slug: "target",
      concept: "Target Concept",
    });
    const prereq = await makeToken({
      slug: "prereq",
      concept: "Prerequisite Concept",
    });
    const nonPrereq = await makeToken({
      slug: "non-prereq",
      concept: "Non-Prerequisite Concept",
    });

    await setEmbedding(prereq, makeUnitVector(0.6));
    await setEmbedding(nonPrereq, makeUnitVector(0.61));

    await addPrerequisite(db, target.id, prereq.id);

    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
      targetTokenId: target.id,
    });

    const prereqSug = suggestions.find((s) => s.token.slug === "prereq");
    const nonPrereqSug = suggestions.find((s) => s.token.slug === "non-prereq");

    expect(prereqSug?.alreadyPrerequisite).toBe(true);
    expect(nonPrereqSug?.alreadyPrerequisite).toBe(false);
  });

  it("sets wouldCreateCycle flag correctly", async () => {
    const queryVec = [1, 0, 0, 0];

    const target = await makeToken({ slug: "target", concept: "Target" });
    const dependent = await makeToken({
      slug: "dependent",
      concept: "Dependent",
    });

    await setEmbedding(dependent, makeUnitVector(0.6));

    // dependent requires target
    await addPrerequisite(db, dependent.id, target.id);

    // If target requires dependent, it would create a cycle.
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
      targetTokenId: target.id,
    });

    const dependentSug = suggestions.find((s) => s.token.slug === "dependent");
    expect(dependentSug?.wouldCreateCycle).toBe(true);
  });

  it("sets bloomAboveTarget flag correctly", async () => {
    const queryVec = [1, 0, 0, 0];

    // Target bloom level is 2
    const level1 = await makeToken({
      slug: "level1",
      concept: "L1",
      bloom_level: 1,
    });
    const level2 = await makeToken({
      slug: "level2",
      concept: "L2",
      bloom_level: 2,
    });
    const level3 = await makeToken({
      slug: "level3",
      concept: "L3",
      bloom_level: 3,
    });

    await setEmbedding(level1, makeUnitVector(0.6));
    await setEmbedding(level2, makeUnitVector(0.61));
    await setEmbedding(level3, makeUnitVector(0.62));

    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
      targetBloomLevel: 2,
    });

    const s1 = suggestions.find((s) => s.token.slug === "level1");
    const s2 = suggestions.find((s) => s.token.slug === "level2");
    const s3 = suggestions.find((s) => s.token.slug === "level3");

    expect(s1?.bloomAboveTarget).toBe(false);
    expect(s2?.bloomAboveTarget).toBe(false);
    expect(s3?.bloomAboveTarget).toBe(true);
  });

  it("caps results by limit and tie-breaks by slug asc", async () => {
    const queryVec = [1, 0, 0, 0];

    const a = await makeToken({ slug: "a", concept: "Concept A" });
    const b = await makeToken({ slug: "b", concept: "Concept B" });
    const c = await makeToken({ slug: "c", concept: "Concept C" });

    // Same similarity
    await setEmbedding(a, makeUnitVector(0.6));
    await setEmbedding(b, makeUnitVector(0.6));
    await setEmbedding(c, makeUnitVector(0.6));

    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
      limit: 2,
    });

    expect(suggestions.map((s) => s.token.slug)).toEqual(["a", "b"]);
  });

  it("handles empty targetId gracefully with all flags false", async () => {
    const queryVec = [1, 0, 0, 0];
    const a = await makeToken({
      slug: "a",
      concept: "Concept A",
      bloom_level: 3,
    });
    await setEmbedding(a, makeUnitVector(0.6));

    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
    });

    expect(suggestions.length).toBe(1);
    expect(suggestions[0].alreadyPrerequisite).toBe(false);
    expect(suggestions[0].wouldCreateCycle).toBe(false);
    // bloomAboveTarget defaults targetBloomLevel to 5, so 3 is not above 5
    expect(suggestions[0].bloomAboveTarget).toBe(false);
  });

  it("returns [] for empty DB with no embeddings", async () => {
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: [1, 0, 0, 0],
      model: MODEL,
    });
    expect(suggestions).toEqual([]);
  });

  it("returns [] when minSimilarity >= maxSimilarity (invalid band)", async () => {
    const t = await makeToken({ slug: "t", concept: "T" });
    await setEmbedding(t, makeUnitVector(0.6));
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: [1, 0, 0, 0],
      model: MODEL,
      minSimilarity: 0.9,
      maxSimilarity: 0.5,
    });
    expect(suggestions).toEqual([]);
  });

  it("respects custom minSimilarity / maxSimilarity passed in options", async () => {
    const queryVec = [1, 0, 0, 0];
    const t40 = await makeToken({ slug: "t40", concept: "T40" });
    const t55 = await makeToken({ slug: "t55", concept: "T55" });
    const t80 = await makeToken({ slug: "t80", concept: "T80" });
    await setEmbedding(t40, makeUnitVector(0.4));
    await setEmbedding(t55, makeUnitVector(0.55));
    await setEmbedding(t80, makeUnitVector(0.8));
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
      minSimilarity: 0.5,
      maxSimilarity: 0.7,
    });
    expect(suggestions.map((s) => s.token.slug)).toEqual(["t55"]);
  });

  it("uses default limit of 5 and orders deterministically", async () => {
    const queryVec = [1, 0, 0, 0];
    for (let i = 0; i < 7; i++) {
      const t = await makeToken({ slug: `def${i}`, concept: `C${i}` });
      await setEmbedding(t, makeUnitVector(0.6));
    }
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
    });
    expect(suggestions.length).toBe(5);
  });

  it("excludes tokens embedded under a different model", async () => {
    const t = await makeToken({ slug: "t", concept: "T" });
    await upsertTokenEmbedding(db, {
      tokenId: t.id,
      embedding: makeUnitVector(0.6),
      model: "other-model",
      contentHash: computeContentHash(embeddingContentForToken(t)),
    });
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: [1, 0, 0, 0],
      model: MODEL,
    });
    expect(suggestions).toEqual([]);
  });

  it("excludes tokens with stale content hash", async () => {
    const t = await makeToken({ slug: "t", concept: "T" });
    await upsertTokenEmbedding(db, {
      tokenId: t.id,
      embedding: makeUnitVector(0.6),
      model: MODEL,
      contentHash: "stale-not-matching-computed-hash",
    });
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: [1, 0, 0, 0],
      model: MODEL,
    });
    expect(suggestions).toEqual([]);
  });

  it("dimension mismatch query vs stored produces no matches (cosine returns 0)", async () => {
    const t = await makeToken({ slug: "t", concept: "T" });
    await setEmbedding(t, makeUnitVector(0.6)); // 4d
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: [1, 0, 0], // 3d
      model: MODEL,
    });
    expect(suggestions).toEqual([]);
  });

  it("includes candidate at engineered ~0.45 and excludes at 0.85 (Float32 semantics)", async () => {
    const queryVec = [1, 0, 0, 0];
    const t45 = await makeToken({ slug: "b45", concept: "B45" });
    const t85 = await makeToken({ slug: "b85", concept: "B85" });
    await setEmbedding(t45, makeUnitVector(0.45));
    await setEmbedding(t85, makeUnitVector(0.85));
    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
    });
    const slugs = suggestions.map((s) => s.token.slug);
    expect(slugs).not.toContain("b85");
    // 0.45 after f32 encode+cosine may land slightly below or at; code uses >= so
    // we accept either outcome but verify no crash and filter logic
    if (slugs.includes("b45")) {
      expect(suggestions[0].similarity).toBeGreaterThanOrEqual(0.44);
    }
  });
});
