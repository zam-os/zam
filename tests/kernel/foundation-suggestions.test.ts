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

    const target = await makeToken({ slug: "target", concept: "Target Concept" });
    await setEmbedding(target, makeUnitVector(0.60));

    const active = await makeToken({ slug: "active", concept: "Active Concept" });
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

    const target = await makeToken({ slug: "target", concept: "Target Concept" });
    const prereq = await makeToken({ slug: "prereq", concept: "Prerequisite Concept" });
    const nonPrereq = await makeToken({
      slug: "non-prereq",
      concept: "Non-Prerequisite Concept",
    });

    await setEmbedding(prereq, makeUnitVector(0.60));
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
    const dependent = await makeToken({ slug: "dependent", concept: "Dependent" });

    await setEmbedding(dependent, makeUnitVector(0.60));

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

    await setEmbedding(level1, makeUnitVector(0.60));
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
    await setEmbedding(a, makeUnitVector(0.60));
    await setEmbedding(b, makeUnitVector(0.60));
    await setEmbedding(c, makeUnitVector(0.60));

    const suggestions = await suggestFoundations(db, {
      queryEmbedding: queryVec,
      model: MODEL,
      limit: 2,
    });

    expect(suggestions.map((s) => s.token.slug)).toEqual(["a", "b"]);
  });

  it("handles empty targetId gracefully with all flags false", async () => {
    const queryVec = [1, 0, 0, 0];
    const a = await makeToken({ slug: "a", concept: "Concept A", bloom_level: 3 });
    await setEmbedding(a, makeUnitVector(0.60));

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
});
