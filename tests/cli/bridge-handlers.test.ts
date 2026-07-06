import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  openDatabase,
  createToken,
  ensureCard,
  getCard,
  getTokenBySlug,
  getPrerequisites,
  getReviewsForCard,
} from "../../src/kernel/index.js";
import {
  addToken,
  endSession,
  getReviewsBatch,
  startSession,
  submitReview,
  linkPrereq,
} from "../../src/cli/bridge-handlers.js";

describe("bridge-handlers unit tests", () => {
  let tempDir: string;
  let dbPath: string;
  let db: any;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-bridge-handlers-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    // Set default user
    await db
      .prepare(
        "INSERT OR REPLACE INTO user_config (key, value) VALUES ('user.id', 'thomas')",
      )
      .run();
  });

  afterEach(async () => {
    if (db) {
      await db.close();
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("getReviewsBatch can return due cards with or without questions", async () => {
    const token1 = await createToken(db, {
      slug: "token-1",
      concept: "Concept 1",
      domain: "math",
      bloom_level: 1,
      question: "What is 1?",
    });

    const token2 = await createToken(db, {
      slug: "token-2",
      concept: "Concept 2",
      domain: "math",
      bloom_level: 2,
      question: "Explain 2.",
    });

    const card1 = await ensureCard(db, token1.id, "thomas");
    const card2 = await ensureCard(db, token2.id, "thomas");

    // Force due immediately by setting due_at to past
    await db
      .prepare("UPDATE cards SET due_at = '2000-01-01T00:00:00.000Z'")
      .run();

    // 1. Without questions
    const res1 = await getReviewsBatch(db, {
      user: "thomas",
      includeQuestions: false,
    });
    expect(res1.cards).toHaveLength(2);
    expect(res1.cards[0].question).toBeUndefined();
    expect(res1.cards[0].slug).toBe("token-1");

    // 2. With questions
    const res2 = await getReviewsBatch(db, {
      user: "thomas",
      includeQuestions: true,
      noResolve: true,
    });
    expect(res2.cards).toHaveLength(2);
    expect(res2.cards[0].question).toBe("What is 1?");
    expect(res2.cards[0].bloomVerb).toBe("Remember");
    expect(res2.cards[1].question).toBe("Explain 2.");
    expect(res2.cards[1].bloomVerb).toBe("Understand");
  });

  it("submitReview logs steps and reviews and handles stepError on session step write failure", async () => {
    const token = await createToken(db, {
      slug: "submit-token",
      concept: "Concept",
      domain: "math",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "thomas");

    // Submit review without sessionId
    const res1 = await submitReview(db, {
      user: "thomas",
      cardId: card.id,
      rating: 3,
    });
    expect(res1.success).toBe(true);
    expect(res1.rating).toBe(3);
    expect(res1.evaluation).toBeDefined();

    // Verify review log was written
    const logs = await getReviewsForCard(db, card.id);
    expect(logs).toHaveLength(1);
    expect(logs[0].rating).toBe(3);

    // Submit review with invalid sessionId (causes step write failure, should return stepError)
    const res2 = await submitReview(db, {
      user: "thomas",
      cardId: card.id,
      rating: 4,
      sessionId: "non-existent-session-ulid",
    });
    expect(res2.success).toBe(true);
    expect(res2.rating).toBe(4);
    expect(res2.stepError).toBeDefined();
    expect(res2.stepError).toContain("Session not found");
  });

  it("logs agent-completed steps without advancing FSRS", async () => {
    const token = await createToken(db, {
      slug: "agent-step-token",
      concept: "Agent step",
      domain: "math",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "thomas");
    const session = await startSession(db, {
      user: "thomas",
      task: "Agent-assisted work",
    });

    const result = await submitReview(db, {
      user: "thomas",
      cardId: card.id,
      sessionId: session.id,
      doneBy: "agent",
    });

    expect(result).toMatchObject({
      success: true,
      rating: null,
      evaluation: null,
      recordedOnly: true,
    });
    expect((await getCard(db, token.id, "thomas"))!.reps).toBe(0);
    const step = await db
      .prepare("SELECT * FROM session_steps WHERE session_id = ?")
      .get(session.id);
    expect(step.done_by).toBe("agent");
    expect(step.rating).toBeNull();

    await expect(
      submitReview(db, {
        user: "thomas",
        cardId: card.id,
        sessionId: session.id,
        doneBy: "agent",
        rating: 4,
      }),
    ).rejects.toThrow("must not include a rating");
  });

  it("creates a card only after a token-based synthesis rating is confirmed", async () => {
    const token = await createToken(db, {
      slug: "synthesis-only-token",
      concept: "Synthesis candidate",
      domain: "math",
      bloom_level: 2,
    });
    expect(await getCard(db, token.id, "thomas")).toBeUndefined();

    const result = await submitReview(db, {
      user: "thomas",
      tokenId: token.id,
      rating: 3,
    });

    expect(result.rating).toBe(3);
    expect((await getCard(db, token.id, "thomas"))!.reps).toBe(1);
  });

  it("linkPrereq adds prereq and blocks user card if blockUser is provided", async () => {
    const token1 = await createToken(db, {
      slug: "token-a",
      concept: "Concept A",
      domain: "math",
      bloom_level: 1,
    });

    const token2 = await createToken(db, {
      slug: "token-b",
      concept: "Concept B",
      domain: "math",
      bloom_level: 2,
    });

    const cardA = await ensureCard(db, token1.id, "thomas");

    // Check initially not blocked
    expect(cardA.blocked).toBe(0);

    // Link prereq with blockUser
    const res = await linkPrereq(db, {
      token: "token-a",
      requires: "token-b",
      blockUser: "thomas",
    });

    expect(res.success).toBe(true);
    expect(res.blockedCardId).toBe(cardA.id);

    // Verify database updates
    const prereqs = await getPrerequisites(db, token1.id);
    expect(prereqs).toHaveLength(1);
    expect(prereqs[0].requires_id).toBe(token2.id);

    const updatedCard = await getCard(db, token1.id, "thomas");
    expect(updatedCard!.blocked).toBe(1);
  });

  it("addToken validates and creates prerequisite edges", async () => {
    await createToken(db, {
      slug: "foundation",
      concept: "Foundation",
      domain: "math",
      bloom_level: 1,
    });

    const result = await addToken(db, {
      user: "thomas",
      slug: "advanced",
      concept: "Advanced",
      domain: "math",
      bloomLevel: 2,
      prerequisites: ["foundation", "foundation"],
    });

    const token = await getTokenBySlug(db, "advanced");
    expect(result.token.prerequisites).toEqual(["foundation"]);
    expect(await getPrerequisites(db, token!.id)).toHaveLength(1);

    await expect(
      addToken(db, {
        user: "thomas",
        slug: "invalid-advanced",
        concept: "Invalid advanced",
        prerequisites: ["missing-foundation"],
      }),
    ).rejects.toThrow("Prerequisite token not found");
    expect(await getTokenBySlug(db, "invalid-advanced")).toBeUndefined();
  });

  it("endSession can return synthesis candidates and the final summary", async () => {
    const session = await startSession(db, {
      user: "thomas",
      task: "Practice",
      context: "shell",
    });

    const result = await endSession(db, {
      session: session.id,
      synthesize: true,
      patterns: [],
    });

    expect(result.completedAt).not.toBeNull();
    expect(result.summary.session.id).toBe(session.id);
    expect(result.synthesis?.sessionId).toBe(session.id);
  });
});
