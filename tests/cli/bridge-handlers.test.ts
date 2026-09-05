import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addToken,
  admitReview,
  backupCreate,
  endSession,
  getReview,
  getReviewsBatch,
  linkPrereq,
  listDrafts,
  publishRevision,
  startSession,
  submitReview,
  updateCheck,
} from "../../src/cli/bridge-handlers.js";
import {
  AtomSiblingOccupiedError,
  buildReviewQueue,
  commitTextImport,
  endSession as completeSession,
  createToken,
  enrolBundledCell,
  ensureCard,
  getCard,
  getPrerequisites,
  getReviewsForCard,
  getTokenBySlug,
  openDatabase,
  previewTextImport,
  type TextImportDocument,
  verifySnapshot,
} from "../../src/kernel/index.js";

describe("bridge-handlers unit tests", () => {
  let tempDir: string;
  let dbPath: string;
  let db: any;
  let previousConfigPath: string | undefined;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-bridge-handlers-test-"));
    dbPath = join(tempDir, "test.db");
    // Isolate from the developer's machine config (~/.zam/config.json) so an
    // active workspace knowledge context on the host cannot leak into tests.
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(tempDir, "machine-config.json");
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
    if (previousConfigPath === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = previousConfigPath;
    }
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

  it("does not treat a queue prefetch as a presentation", async () => {
    const atomId = ulid();
    await db
      .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
      .run(atomId, "P");
    const p1 = await createToken(db, {
      slug: "p1-prefetch",
      concept: "P1",
      domain: "math",
      question: "P1?",
      atom_id: atomId,
    });
    const p2 = await createToken(db, {
      slug: "p2-prefetch",
      concept: "P2",
      domain: "math",
      question: "P2?",
      atom_id: atomId,
    });
    await ensureCard(db, p1.id, "thomas");
    const p2Card = await ensureCard(db, p2.id, "thomas");

    const batch = await getReviewsBatch(db, {
      user: "thomas",
      includeQuestions: true,
      noResolve: true,
      noDynamicQuestion: true,
      respectWorkload: true,
      maxNew: 10,
    });
    expect(batch.cards.length).toBeGreaterThanOrEqual(2);
    expect(
      (await db
        .prepare("SELECT COUNT(*) AS n FROM card_presentations")
        .get()) as { n: number },
    ).toEqual({ n: 0 });

    await getReview(db, {
      user: "thomas",
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(
      (await db
        .prepare("SELECT COUNT(*) AS n FROM card_presentations")
        .get()) as { n: number },
    ).toEqual({ n: 0 });

    await admitReview(db, {
      user: "thomas",
      cardId: p2Card.id,
      timeZone: "UTC",
    });
    await expect(
      admitReview(db, {
        user: "thomas",
        cardId: (await getCard(db, p1.id, "thomas"))!.id,
        timeZone: "UTC",
      }),
    ).rejects.toBeInstanceOf(AtomSiblingOccupiedError);
  });

  it("applies session admission, tier ordering, and structured fast checks on learner surfaces", async () => {
    await enrolBundledCell(db, "thomas", "de-by:realschule-optik");

    const closed = await getReview(db, {
      user: "thomas",
      maxNew: 0,
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(closed.hasReview).toBe(false);

    const next = await getReview(db, {
      user: "thomas",
      maxNew: 1,
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(next.card?.tier).toBe("tier1_fast");
    // The position is deliberately not asserted: every authored fast check
    // stores the correct answer first, and shipping it there would let the
    // learner tap by position instead of recalling. What must hold is that the
    // index still points at the correct *text*.
    const shown = next.card?.fastCheck;
    expect(shown?.type).toBe("binary_choice");
    expect(shown?.options).toHaveLength(2);
    const stored = (await db
      .prepare("SELECT fast_check FROM tokens WHERE id = ?")
      .get(next.card?.tokenId)) as { fast_check: string };
    const raw = JSON.parse(stored.fast_check) as {
      options: string[];
      correct_index: number;
    };
    expect(shown?.options?.slice().sort()).toEqual(raw.options.slice().sort());
    expect(shown?.options?.[shown.correctIndex]).toBe(
      raw.options[raw.correct_index],
    );

    const workloadBatch = await getReviewsBatch(db, {
      user: "thomas",
      includeQuestions: true,
      noResolve: true,
      noDynamicQuestion: true,
      respectWorkload: true,
      maxNew: 20,
    });
    expect(workloadBatch.cards).toHaveLength(3);
    expect(
      workloadBatch.cards.every((card) => card.tier === "tier1_fast"),
    ).toBe(true);
    expect(
      workloadBatch.cards.every(
        (card) => card.fastCheck?.type === "binary_choice",
      ),
    ).toBe(true);

    const unboundedBatch = await getReviewsBatch(db, {
      user: "thomas",
      includeQuestions: true,
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(unboundedBatch.cards).toHaveLength(6);
  });

  it("getReview inlines media bytes only for a rendering surface", async () => {
    const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 4, 5, 6]);
    const input: TextImportDocument = {
      format: "apkg",
      sourceName: "media.apkg",
      cards: [
        {
          externalId: "anki:media-note:0",
          noteGuid: "media-note",
          cardOrdinal: 0,
          question: "Name the highlighted structure.",
          answer: "Mitochondrion",
          media: [{ assetName: "cell.png", side: "question", kind: "image" }],
        },
      ],
      assets: [
        { name: "cell.png", mimeType: "image/png", kind: "image", data: bytes },
      ],
    };
    const preview = await previewTextImport(db, "thomas", input);
    await commitTextImport(db, "thomas", input, preview.planHash);

    const lean = await getReview(db, {
      user: "thomas",
      noResolve: true,
      noDynamicQuestion: true,
    });
    expect(lean.card?.hasQuestionMedia).toBe(true);
    expect(lean.card?.media).toEqual([]);

    const rendered = await getReview(db, {
      user: "thomas",
      noResolve: true,
      noDynamicQuestion: true,
      includeMedia: true,
    });
    expect(rendered.card?.media).toHaveLength(1);
    expect(rendered.card?.media?.[0].dataBase64).toBe(
      Buffer.from(bytes).toString("base64"),
    );
  });

  it("submitReview logs reviews and rejects an invalid session without a partial FSRS write", async () => {
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
      responseTimeMs: 2_500,
    });
    expect(res1.success).toBe(true);
    expect(res1.rating).toBe(3);
    expect(res1.evaluation).toBeDefined();

    // Verify review log was written
    const logs = await getReviewsForCard(db, card.id);
    expect(logs).toHaveLength(1);
    expect(logs[0].rating).toBe(3);
    expect(logs[0].response_time_ms).toBe(2_500);

    const repsAfterValid = (await getCard(db, token.id, "thomas"))!.reps;
    await expect(
      submitReview(db, {
        user: "thomas",
        cardId: card.id,
        rating: 4,
        sessionId: "non-existent-session-ulid",
      }),
    ).rejects.toThrow("Session not found");
    expect((await getCard(db, token.id, "thomas"))!.reps).toBe(repsAfterValid);
  });

  it("writes a rated review and session step in one transaction", async () => {
    const token = await createToken(db, {
      slug: "session-rate-token",
      concept: "Session rate",
      domain: "math",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "thomas");
    const session = await startSession(db, {
      user: "thomas",
      task: "Rated work",
    });

    const result = await submitReview(db, {
      user: "thomas",
      cardId: card.id,
      rating: 3,
      sessionId: session.id,
    });
    expect(result.success).toBe(true);
    expect(result.rating).toBe(3);
    expect(result.stepError).toBeUndefined();
    expect((await getCard(db, token.id, "thomas"))!.reps).toBe(1);
    const steps = await db
      .prepare("SELECT * FROM session_steps WHERE session_id = ?")
      .all(session.id);
    expect(steps).toHaveLength(1);
    expect(steps[0].rating).toBe(3);
    expect(steps[0].done_by).toBe("user");
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

  it("records assisted user work without advancing FSRS", async () => {
    const token = await createToken(db, {
      slug: "assisted-user-token",
      concept: "Assisted work",
      domain: "math",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "thomas");
    const session = await startSession(db, {
      user: "thomas",
      task: "Assisted first run",
    });

    const result = await submitReview(db, {
      user: "thomas",
      cardId: card.id,
      sessionId: session.id,
      doneBy: "user",
      recordOnly: true,
      reason: "followed demonstrated steps",
    });

    expect(result).toMatchObject({
      success: true,
      rating: null,
      evaluation: null,
      recordedOnly: true,
    });
    expect((await getCard(db, token.id, "thomas"))!.reps).toBe(0);
    expect(await getReviewsForCard(db, card.id)).toHaveLength(0);
    const step = await db
      .prepare("SELECT * FROM session_steps WHERE session_id = ?")
      .get(session.id);
    expect(step.done_by).toBe("user");
    expect(step.rating).toBeNull();
    expect(step.notes).toBe("followed demonstrated steps");

    await expect(
      submitReview(db, {
        user: "thomas",
        cardId: card.id,
        sessionId: session.id,
        recordOnly: true,
        reason: "demo",
        rating: 2,
      }),
    ).rejects.toThrow("must not include a rating");

    await expect(
      submitReview(db, {
        user: "thomas",
        cardId: card.id,
        sessionId: session.id,
        doneBy: "agent",
        recordOnly: true,
        reason: "demo",
      }),
    ).rejects.toThrow("recordOnly is for assisted user work");
  });

  it("rejects record-only against another learner, a completed session, or a foreign card", async () => {
    const token = await createToken(db, {
      slug: "record-only-guard",
      concept: "Guard",
      domain: "math",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "thomas");
    const otherCard = await ensureCard(db, token.id, "other");
    const session = await startSession(db, {
      user: "thomas",
      task: "Own session",
    });
    const otherSession = await startSession(db, {
      user: "other",
      task: "Other session",
    });
    await completeSession(db, session.id);

    await expect(
      submitReview(db, {
        user: "thomas",
        cardId: card.id,
        sessionId: session.id,
        recordOnly: true,
        reason: "too late",
      }),
    ).rejects.toThrow("already completed");
    await expect(
      submitReview(db, {
        user: "thomas",
        cardId: card.id,
        sessionId: otherSession.id,
        recordOnly: true,
        reason: "wrong learner",
      }),
    ).rejects.toThrow("does not belong");
    const live = await startSession(db, {
      user: "thomas",
      task: "Live",
    });
    await expect(
      submitReview(db, {
        user: "thomas",
        cardId: otherCard.id,
        sessionId: live.id,
        recordOnly: true,
        reason: "foreign card",
      }),
    ).rejects.toThrow("does not belong");
    expect((await getCard(db, token.id, "thomas"))!.reps).toBe(0);
    expect((await getCard(db, token.id, "other"))!.reps).toBe(0);
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

  it("addToken marks agent-provided questions as llm", async () => {
    await addToken(db, {
      user: "thomas",
      slug: "agent-authored",
      concept: "A concept whose question the agent wrote",
      domain: "testing",
      question: "What did the agent ask?",
    });

    const token = await getTokenBySlug(db, "agent-authored");
    expect(token?.question_source).toBe("llm");
    expect(token?.editorial_state).toBe("draft");
  });

  it("addToken writes a draft that stays out of the queue until publish", async () => {
    const result = await addToken(db, {
      user: "thomas",
      slug: "capture-draft",
      concept: "Force equals mass times acceleration.",
      question: "How are force, mass and acceleration related?",
      domain: "physics",
    });
    expect(result.token.editorial_state).toBe("draft");
    await db
      .prepare("UPDATE cards SET due_at = '2000-01-01T00:00:00.000Z'")
      .run();
    const before = await buildReviewQueue(db, { userId: "thomas" });
    expect(before.items.some((item) => item.tokenId === result.token.id)).toBe(
      false,
    );

    const drafts = await listDrafts(db);
    expect(drafts.tokens.map((token) => token.slug)).toContain("capture-draft");

    await expect(
      publishRevision(db, {
        slug: "capture-draft",
        materiality: "cosmetic",
        changes: { question: "" },
      }),
    ).rejects.toThrow(/question is required/i);

    await publishRevision(db, {
      slug: "capture-draft",
      materiality: "cosmetic",
    });
    const after = await buildReviewQueue(db, { userId: "thomas" });
    expect(after.items.some((item) => item.tokenId === result.token.id)).toBe(
      true,
    );
  });

  it("getReviewsBatch serves fresh question variations and never mutates stored questions", async () => {
    const { setSetting } = await import("../../src/kernel/index.js");
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://dummy/v1");

    const manual = await createToken(db, {
      slug: "manual-question",
      concept: "Human-authored question",
      domain: "testing",
      question: "What did the human write?",
      // createToken defaults to question_source 'manual'
    });
    const generated = await createToken(db, {
      slug: "generated-question",
      concept: "LLM-authored question",
      domain: "testing",
      question: "Old generated question?",
      question_source: "llm",
    });
    await ensureCard(db, manual.id, "thomas");
    await ensureCard(db, generated.id, "thomas");
    await db
      .prepare("UPDATE cards SET due_at = '2000-01-01T00:00:00.000Z'")
      .run();

    const originalFetch = global.fetch;
    global.fetch = (async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Fresh generated question?" } }],
        }),
      )) as typeof fetch;

    try {
      const res = await getReviewsBatch(db, {
        user: "thomas",
        includeQuestions: true,
        noResolve: true,
      });

      const manualCard = res.cards.find((c: any) => c.slug === manual.slug);
      const generatedCard = res.cards.find(
        (c: any) => c.slug === generated.slug,
      );
      // Both get an ephemeral variation — manual questions too, so the
      // learner cannot memorize the exact phrasing.
      expect(manualCard?.question).toBe("Fresh generated question?");
      expect(generatedCard?.question).toBe("Fresh generated question?");

      // Reviews never mutate content: both stored questions are untouched.
      const storedManual = await getTokenBySlug(db, manual.slug);
      expect(storedManual?.question).toBe("What did the human write?");
      expect(storedManual?.question_source).toBe("manual");

      const storedGenerated = await getTokenBySlug(db, generated.slug);
      expect(storedGenerated?.question).toBe("Old generated question?");
      expect(storedGenerated?.question_source).toBe("llm");
    } finally {
      global.fetch = originalFetch;
    }
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

  it("backupCreate writes a verifiable snapshot file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "zam-snap-"));
    try {
      const res = await backupCreate(db, { dir });
      expect(res.ok).toBe(true);
      expect(res.path.endsWith(".sql")).toBe(true);
      const manifest = verifySnapshot(readFileSync(res.path, "utf-8"));
      expect(manifest.tables).toBeDefined();
      expect(res.checksum).toBe(manifest.checksum);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("updateCheck decides deterministically with injected latest", async () => {
    const res = await updateCheck({ latest: "99.0.0", channel: "developer" });
    expect(res.updateAvailable).toBe(true);
    expect(res.latestVersion).toBe("99.0.0");
    expect(res.channel).toBe("developer");
  });
});
