import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  MOBILE_REVIEW_STORAGE_KEY,
  MobileReviewSession,
  type ReviewSessionStorage,
} from "../../mobile/src/review-session.js";
import {
  addPrerequisite,
  createToken,
  type Database,
  ensureCard,
  executeReviewAction,
  getCard,
  openDatabase,
} from "../../src/kernel/index.js";

class MemoryStorage implements ReviewSessionStorage {
  readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("mobile review session", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-mobile-review-"));
    db = await openDatabase({
      dbPath: join(tempDir, "review.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("accepts an explicit keep-going new-card budget and preserves fast checks", async () => {
    const token = await createToken(db, {
      slug: "mobile-fast-check",
      concept: "The normal is perpendicular.",
      domain: "optik",
      bloom_level: 1,
      question: "How does the normal meet the surface?",
      tier: "tier1_fast",
      fast_check: JSON.stringify({
        type: "binary_choice",
        options: ["Perpendicular", "Parallel"],
        correct_index: 0,
      }),
    });
    await ensureCard(db, token.id, "student-9");

    const closed = new MobileReviewSession(db, new MemoryStorage(), () => 1);
    expect(await closed.start("student-9", { maxNew: 0 })).toBe(false);

    const open = new MobileReviewSession(db, new MemoryStorage(), () => 1);
    expect(await open.start("student-9", { maxNew: 1 })).toBe(true);
    expect(open.progress).toEqual({ current: 1, total: 1 });
    // Options are permuted per card so the correct answer is not always the
    // first button; what has to hold is that the index still names the right
    // text. Asserting the stored order here made this test pass only when the
    // permutation happened to be the identity.
    const fastCheck = open.currentItem?.fastCheck;
    expect(fastCheck?.type).toBe("binary_choice");
    expect(fastCheck?.options.slice().sort()).toEqual([
      "Parallel",
      "Perpendicular",
    ]);
    expect(fastCheck?.options[fastCheck.correctIndex]).toBe("Perpendicular");
  });

  it("skips a prefetched atom sibling after the current card is shown", async () => {
    const atomId = ulid();
    await db
      .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
      .run(atomId, "P");
    const p1 = await createToken(db, {
      slug: "a-p1",
      concept: "P1",
      domain: "math",
      bloom_level: 1,
      question: "P1?",
      atom_id: atomId,
    });
    const p2 = await createToken(db, {
      slug: "b-p2",
      concept: "P2",
      domain: "math",
      bloom_level: 1,
      question: "P2?",
      atom_id: atomId,
    });
    const other = await createToken(db, {
      slug: "c-other",
      concept: "Other atom",
      domain: "math",
      bloom_level: 1,
      question: "Other?",
    });
    await ensureCard(db, p1.id, "student-9");
    await ensureCard(db, p2.id, "student-9");
    await ensureCard(db, other.id, "student-9");

    const session = new MobileReviewSession(db, new MemoryStorage(), () => 1);
    expect(await session.start("student-9")).toBe(true);
    expect(session.currentItem?.tokenId).toBe(p1.id);
    expect(session.progress.total).toBe(3);

    session.updateDraftAnswer("ok");
    session.reveal();
    const rated = await session.rate(3);
    expect(rated.summary).toBeUndefined();
    expect(session.currentItem?.tokenId).toBe(other.id);
  });

  it("restores the current answer, rates through FSRS, blocks, and summarizes", async () => {
    const prerequisite = await createToken(db, {
      slug: "prerequisite",
      concept: "A required foundation",
      domain: "test",
      bloom_level: 1,
    });
    const target = await createToken(db, {
      slug: "a-target",
      concept: "A concept with a prerequisite",
      domain: "test",
      bloom_level: 1,
      question: "Was ist das Zielkonzept?",
    });
    const other = await createToken(db, {
      slug: "z-other",
      concept: "A second concept",
      domain: "test",
      bloom_level: 2,
    });
    await addPrerequisite(db, target.id, prerequisite.id);
    await ensureCard(db, target.id, "student-9");
    await ensureCard(db, other.id, "student-9");

    const storage = new MemoryStorage();
    let now = 1_000;
    const first = new MobileReviewSession(db, storage, () => now);
    expect(await first.start("student-9")).toBe(true);
    expect(first.currentItem?.tokenId).toBe(target.id);
    first.updateDraftAnswer("Meine Antwort");
    first.reveal();

    now = 2_250;
    const restored = new MobileReviewSession(db, storage, () => now);
    expect(await restored.restore("student-9")).toEqual({ kind: "active" });
    expect(restored.draftAnswer).toBe("Meine Antwort");
    expect(restored.revealed).toBe(true);

    const again = await restored.rate(1);
    expect(again.blockedPrerequisites).toEqual([prerequisite.slug]);
    expect(restored.currentItem?.tokenId).toBe(other.id);
    expect((await getCard(db, target.id, "student-9"))?.blocked).toBe(1);

    restored.updateDraftAnswer("Zweite Antwort");
    restored.reveal();
    now = 3_000;
    const done = await restored.rate(3);

    expect(done.summary).toMatchObject({
      completedCount: 2,
      totalCount: 2,
      againCount: 1,
      stopped: false,
    });
    expect(done.summary?.nextDueAt).not.toBeNull();
    expect(storage.getItem(MOBILE_REVIEW_STORAGE_KEY)).toBeNull();
    expect(
      await db
        .prepare(
          "SELECT rating, session_id, response_time_ms FROM review_logs ORDER BY rowid",
        )
        .all(),
    ).toEqual([
      {
        rating: 1,
        session_id: done.summary?.sessionId,
        response_time_ms: 1_250,
      },
      {
        rating: 3,
        session_id: done.summary?.sessionId,
        response_time_ms: 750,
      },
    ]);
    expect(
      await db.prepare("SELECT COUNT(*) AS count FROM session_steps").get(),
    ).toEqual({ count: 2 });
    expect(
      await db
        .prepare("SELECT completed_at FROM sessions WHERE id = ?")
        .get(done.summary?.sessionId),
    ).toMatchObject({ completed_at: expect.any(String) });
  });

  it("reconciles a stale snapshot after a rating committed before persistence", async () => {
    const token = await createToken(db, {
      slug: "resume-after-commit",
      concept: "Session steps make resume idempotent",
      domain: "test",
      bloom_level: 1,
    });
    const card = await ensureCard(db, token.id, "student-9");
    const storage = new MemoryStorage();
    const session = new MobileReviewSession(db, storage, () => 1_000);
    await session.start("student-9");

    const persisted = JSON.parse(
      storage.getItem(MOBILE_REVIEW_STORAGE_KEY) ?? "{}",
    ) as { sessionId: string };
    await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "student-9",
      rating: 4,
      sessionId: persisted.sessionId,
    });

    const restored = new MobileReviewSession(db, storage, () => 2_000);
    const result = await restored.restore("student-9");
    expect(result).toMatchObject({
      kind: "completed",
      summary: { completedCount: 1, totalCount: 1, stopped: false },
    });
    expect(storage.getItem(MOBILE_REVIEW_STORAGE_KEY)).toBeNull();
  });

  /**
   * Repairing a card is a review-time job — a wrong-language or nonsense
   * question is noticed while answering it, not while browsing the library.
   * Both of these change the queue that is already running, which is the part
   * that can go wrong quietly.
   */
  describe("fixing a card mid-session", () => {
    async function twoCardSession(storage: MemoryStorage) {
      const first = await createToken(db, {
        slug: "a-first",
        concept: "First concept",
        domain: "test",
        bloom_level: 1,
        question: "Which problem did version 0.9.0 solve?",
      });
      const second = await createToken(db, {
        slug: "z-second",
        concept: "Second concept",
        domain: "test",
        bloom_level: 1,
      });
      await ensureCard(db, first.id, "student-9");
      await ensureCard(db, second.id, "student-9");
      const session = new MobileReviewSession(db, storage, () => 1_000);
      expect(await session.start("student-9")).toBe(true);
      return { session, first, second };
    }

    it("shows the corrected wording on the very next repaint", async () => {
      // The queue is a snapshot from session start. Without this the learner
      // fixes a card, sees the old question again immediately, and concludes
      // the save did nothing.
      const storage = new MemoryStorage();
      const { session } = await twoCardSession(storage);
      expect(session.currentPrompt?.question).toContain("0.9.0");

      session.applyCardEdit({
        question: "What does an MCP server offer over a plain skill?",
        concept: "Tools a host can call, described once and discovered.",
      });

      expect(session.currentPrompt?.question).toBe(
        "What does an MCP server offer over a plain skill?",
      );
      expect(session.currentPrompt?.concept).toContain("described once");
      // And it survives the app being closed mid-session.
      const restored = new MobileReviewSession(db, storage, () => 1_100);
      await restored.restore("student-9");
      expect(restored.currentPrompt?.question).toContain("MCP server");
    });

    it("drops an atom sibling that cannot be shown today instead of counting it", async () => {
      const atomId = ulid();
      await db
        .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
        .run(atomId, "Sibling atom");
      for (const slug of ["sib-a", "sib-b"]) {
        const token = await createToken(db, {
          slug,
          concept: `Criterion for ${slug}`,
          domain: "test",
          bloom_level: 1,
          question: `Question for ${slug}?`,
          atom_id: atomId,
        });
        await ensureCard(db, token.id, "student-9");
      }
      const session = new MobileReviewSession(
        db,
        new MemoryStorage(),
        () => 1_000,
      );
      expect(await session.start("student-9")).toBe(true);
      expect(session.progress).toEqual({ current: 1, total: 2 });
      session.reveal({ allowEmpty: true });
      const result = await session.rate(3);
      // The second sibling was never shown, so the session was one card long.
      expect(result.summary).toMatchObject({
        completedCount: 1,
        totalCount: 1,
        stopped: false,
      });
    });

    it("drops a deleted card without rating it", async () => {
      const storage = new MemoryStorage();
      const { session, second } = await twoCardSession(storage);
      expect(session.progress).toEqual({ current: 1, total: 2 });

      expect(await session.dropCurrent()).toBeNull();

      expect(session.currentItem?.tokenId).toBe(second.id);
      // One card shorter than it started: a session that lost a card is a
      // session of one, not "1 of 2" with a hole in it.
      expect(session.progress).toEqual({ current: 1, total: 1 });
      // No FSRS outcome was recorded — the card is gone, not "again".
      expect(
        await db.prepare("SELECT COUNT(*) AS n FROM review_logs").get(),
      ).toEqual({ n: 0 });
    });

    it("ends the session when the deleted card was the last one", async () => {
      const storage = new MemoryStorage();
      const { session } = await twoCardSession(storage);
      await session.dropCurrent();
      const summary = await session.dropCurrent();
      expect(summary).toMatchObject({ completedCount: 0, totalCount: 0 });
      expect(session.active).toBe(false);
      expect(storage.getItem(MOBILE_REVIEW_STORAGE_KEY)).toBeNull();
    });

    it("does nothing outside a session", async () => {
      const idle = new MobileReviewSession(db, new MemoryStorage(), () => 1);
      expect(await idle.dropCurrent()).toBeNull();
      expect(() => {
        idle.applyCardEdit({ question: "ignored" });
      }).not.toThrow();
    });
  });

  it("drops remaining cards of an assessed atom and remembers the decision", async () => {
    const known = await createToken(db, {
      slug: "a-known",
      concept: "Known foundation",
      domain: "optik",
      bloom_level: 1,
      atom_id: "atom-known",
    });
    const sibling = await createToken(db, {
      slug: "b-known-sibling",
      concept: "Same atom, other item",
      domain: "optik",
      bloom_level: 2,
      atom_id: "atom-known",
    });
    const other = await createToken(db, {
      slug: "z-other-atom",
      concept: "Different atom",
      domain: "optik",
      bloom_level: 1,
      atom_id: "atom-other",
    });
    await ensureCard(db, known.id, "student-9");
    await ensureCard(db, sibling.id, "student-9");
    await ensureCard(db, other.id, "student-9");

    const storage = new MemoryStorage();
    const session = new MobileReviewSession(db, storage, () => 1_000);
    expect(await session.start("student-9")).toBe(true);
    expect(session.isAtomAssessed("atom-known")).toBe(false);
    session.markAtomAssessed("atom-known");
    expect(session.isAtomAssessed("atom-known")).toBe(true);

    const summary = await session.dropAtom("atom-known");
    expect(summary).toBeNull();
    expect(session.currentItem?.atomId).toBe("atom-other");
    expect(session.currentItem?.tokenId).toBe(other.id);
  });

  it("allows reveal without draft answer when allowEmpty is true", async () => {
    const token = await createToken(db, {
      slug: "flash-reveal-test",
      concept: "Flashcard concept",
      domain: "chemie",
      bloom_level: 1,
      question: "Flash question?",
    });
    await ensureCard(db, token.id, "student-flash");

    const storage = new MemoryStorage();
    const session = new MobileReviewSession(db, storage);
    expect(await session.start("student-flash")).toBe(true);

    // Default reveal without draft answer throws
    expect(() => session.reveal()).toThrow("Answer is required before reveal");
    expect(session.revealed).toBe(false);

    // reveal with allowEmpty: true succeeds
    session.reveal({ allowEmpty: true });
    expect(session.revealed).toBe(true);
  });
});
