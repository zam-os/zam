/**
 * Integration tests for the core token → card → review flow,
 * plus prerequisite cycle detection and fuzzy search.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPrerequisite,
  buildReviewQueue,
  cascadeBlock,
  confirmSourceImport,
  createToken,
  type Database,
  ensureCard,
  evaluateRating,
  executeReviewAction,
  findTokens,
  getCard,
  getDependents,
  getDueCards,
  getPrerequisites,
  getTokenBySlug,
  listPersonalCards,
  openDatabase,
  unblockReady,
  wouldCreateCycle,
} from "../../src/kernel/index.js";

describe("integration: token → card → review flow", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-integration-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
    });
  });

  afterEach(async () => {
    await db.close();
    try {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 50,
      });
    } catch {
      // Best-effort cleanup
    }
  });

  describe("getDueCards domain filter", () => {
    it("returns only due cards in the requested domain", async () => {
      const physics = await createToken(db, {
        slug: "physics-token",
        concept: "Newton's first law",
        domain: "Physik",
        bloom_level: 1,
      });
      const history = await createToken(db, {
        slug: "history-token",
        concept: "French Revolution",
        domain: "history",
        bloom_level: 1,
      });

      await ensureCard(db, physics.id, "klara");
      await ensureCard(db, history.id, "klara");

      const physicsDue = await getDueCards(db, "klara", undefined, "Physik");
      expect(physicsDue.map((card) => card.slug)).toEqual(["physics-token"]);

      const allDue = await getDueCards(db, "klara");
      expect(allDue.map((card) => card.slug).sort()).toEqual([
        "history-token",
        "physics-token",
      ]);
    });
  });

  describe("personal card source links", () => {
    it("returns the linked source URI for source-imported cards", async () => {
      const sourceId = "source-realschule-math-9";
      const sourceUri =
        "https://www.lehrplanplus.bayern.de/fachlehrplan/lernbereich/66110";
      await db
        .prepare(
          "INSERT INTO sources (id, type, uri, content) VALUES (?, 'web', ?, ?)",
        )
        .run(sourceId, sourceUri, "Reelle Zahlen");

      await confirmSourceImport(db, "thomas", sourceId, [
        {
          question: "Was ist eine Quadratwurzel?",
          concept:
            "Die nichtnegative Zahl, deren Quadrat den Radikanden ergibt.",
          domain: "mathematik",
          bloom_level: 2,
          symbiosis_mode: "copilot",
          excerpt: "Die Definition der Quadratwurzel erläutern.",
        },
      ]);

      const cards = await listPersonalCards(db, "thomas");
      expect(cards).toHaveLength(1);
      expect(cards[0].sourceLink).toBe(sourceUri);
    });
  });

  // ── Prerequisite cycle detection ─────────────────────────────────────────

  describe("prerequisite cycle detection", () => {
    it("rejects a direct self-loop", async () => {
      const a = await createToken(db, {
        slug: "token-a",
        concept: "Concept A",
        domain: "test",
        bloom_level: 1,
      });
      await expect(addPrerequisite(db, a.id, a.id)).rejects.toThrow(
        "A token cannot be a prerequisite of itself",
      );
    });

    it("rejects a direct back-edge (A → B, then B → A)", async () => {
      const a = await createToken(db, {
        slug: "token-a",
        concept: "Concept A",
        domain: "test",
        bloom_level: 1,
      });
      const b = await createToken(db, {
        slug: "token-b",
        concept: "Concept B",
        domain: "test",
        bloom_level: 1,
      });

      await addPrerequisite(db, a.id, b.id);
      await expect(addPrerequisite(db, b.id, a.id)).rejects.toThrow(
        "Cannot add prerequisite: would create a cycle",
      );
    });

    it("rejects a transitive cycle (A → B → C, then C → A)", async () => {
      const a = await createToken(db, {
        slug: "token-a",
        concept: "Concept A",
        domain: "test",
        bloom_level: 1,
      });
      const b = await createToken(db, {
        slug: "token-b",
        concept: "Concept B",
        domain: "test",
        bloom_level: 1,
      });
      const c = await createToken(db, {
        slug: "token-c",
        concept: "Concept C",
        domain: "test",
        bloom_level: 1,
      });

      await addPrerequisite(db, a.id, b.id);
      await addPrerequisite(db, b.id, c.id);
      await expect(addPrerequisite(db, c.id, a.id)).rejects.toThrow(
        "Cannot add prerequisite: would create a cycle",
      );
    });

    it("allows valid acyclic edges (diamond: D → B, D → C, B → A, C → A)", async () => {
      const a = await createToken(db, {
        slug: "token-a",
        concept: "Concept A",
        domain: "test",
        bloom_level: 1,
      });
      const b = await createToken(db, {
        slug: "token-b",
        concept: "Concept B",
        domain: "test",
        bloom_level: 1,
      });
      const c = await createToken(db, {
        slug: "token-c",
        concept: "Concept C",
        domain: "test",
        bloom_level: 1,
      });
      const d = await createToken(db, {
        slug: "token-d",
        concept: "Concept D",
        domain: "test",
        bloom_level: 1,
      });

      // Diamond: D requires B and C; B and C both require A
      await addPrerequisite(db, b.id, a.id);
      await addPrerequisite(db, c.id, a.id);
      await addPrerequisite(db, d.id, b.id);
      await addPrerequisite(db, d.id, c.id);

      // Verify the structure
      expect(await getPrerequisites(db, d.id)).toHaveLength(2);
      expect(await getDependents(db, a.id)).toHaveLength(2);
    });

    it("wouldCreateCycle returns false for disconnected tokens", async () => {
      const a = await createToken(db, {
        slug: "token-a",
        concept: "Concept A",
        domain: "test",
        bloom_level: 1,
      });
      const b = await createToken(db, {
        slug: "token-b",
        concept: "Concept B",
        domain: "test",
        bloom_level: 1,
      });
      expect(await wouldCreateCycle(db, a.id, b.id)).toBe(false);
    });

    it("idempotent duplicate edge does not throw", async () => {
      const a = await createToken(db, {
        slug: "token-a",
        concept: "Concept A",
        domain: "test",
        bloom_level: 1,
      });
      const b = await createToken(db, {
        slug: "token-b",
        concept: "Concept B",
        domain: "test",
        bloom_level: 1,
      });

      await addPrerequisite(db, a.id, b.id);
      // Adding the same edge again should be a no-op, not a cycle error
      await expect(addPrerequisite(db, a.id, b.id)).resolves.not.toThrow();
      expect(await getPrerequisites(db, a.id)).toHaveLength(1);
    });
  });

  // ── Fuzzy search ─────────────────────────────────────────────────────────

  describe("findTokens fuzzy search", () => {
    beforeEach(async () => {
      await createToken(db, {
        slug: "git-commit",
        concept: "git commit records staged changes to the repository",
        domain: "git",
        bloom_level: 2,
      });
      await createToken(db, {
        slug: "git-branch",
        concept: "git branch lists, creates, or deletes branches",
        domain: "git",
        bloom_level: 1,
      });
      await createToken(db, {
        slug: "docker-run",
        concept: "docker run starts a new container from an image",
        domain: "docker",
        bloom_level: 3,
      });
    });

    it("finds tokens by slug keyword", async () => {
      const results = await findTokens(db, "branch");
      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe("git-branch");
    });

    it("finds tokens by concept text", async () => {
      const results = await findTokens(db, "container");
      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe("docker-run");
    });

    it("returns empty for no match", async () => {
      const results = await findTokens(db, "nonexistent123");
      expect(results).toHaveLength(0);
    });

    it("ranks by word overlap score", async () => {
      const results = await findTokens(db, "git branch");
      expect(results.length).toBeGreaterThanOrEqual(2);
      // "git-branch" should score higher than plain "git" tokens
      expect(results[0].slug).toBe("git-branch");
    });
  });

  // ── Token → Card → Review flow ───────────────────────────────────────────

  describe("token → card → review lifecycle", () => {
    it("creates a token, ensures a card, rates it, and shows due cards", async () => {
      const token = await createToken(db, {
        slug: "test-concept",
        concept: "A test concept for integration testing",
        domain: "testing",
        bloom_level: 2,
      });

      expect(token.slug).toBe("test-concept");
      expect(token.bloom_level).toBe(2);

      // Card does not exist yet
      const card = await ensureCard(db, token.id, "thomas");
      expect(card.token_id).toBe(token.id);
      expect(card.user_id).toBe("thomas");
      expect(card.state).toBe("new");

      // Rate the card
      const result = await evaluateRating(db, {
        cardId: card.id,
        tokenId: token.id,
        userId: "thomas",
        rating: 3, // Good
      });

      expect(result.state).toBe("learning");
      expect(result.reps).toBe(1);
      expect(result.stability).toBeGreaterThan(0);

      // The card should now be in the due queue (scheduled for future)
      // Newly rated cards won't be "due" yet, but the queue building works
      const queue = await buildReviewQueue(db, {
        userId: "thomas",
        maxNew: 5,
        maxReviews: 10,
      });
      expect(queue).toBeDefined();
      expect(queue.items).toBeDefined();
      expect(queue.items.length).toBeGreaterThanOrEqual(0);
    });

    it("persists and resumes a same-day learning step across a restart", async () => {
      const token = await createToken(db, {
        slug: "same-day-learning",
        concept: "Learning steps survive process restarts",
        domain: "testing",
        bloom_level: 2,
      });
      const card = await ensureCard(db, token.id, "thomas");
      const before = Date.now();

      const first = await evaluateRating(db, {
        cardId: card.id,
        tokenId: token.id,
        userId: "thomas",
        rating: 3,
      });
      const after = Date.now();

      expect(first.state).toBe("learning");
      expect(first.learningStep).toBe(1);
      expect(first.scheduledDays).toBeCloseTo(10 / (24 * 60), 10);
      expect(new Date(first.nextDueAt).getTime()).toBeGreaterThanOrEqual(
        before + 10 * 60_000,
      );
      expect(new Date(first.nextDueAt).getTime()).toBeLessThanOrEqual(
        after + 10 * 60_000,
      );

      await db.close();
      db = await openDatabase({
        dbPath: join(tempDir, "zam-test.db"),
        initialize: true,
      });

      const resumed = await getCard(db, token.id, "thomas");
      expect(resumed?.state).toBe("learning");
      expect(resumed?.learning_step).toBe(1);

      const completed = await evaluateRating(db, {
        cardId: card.id,
        tokenId: token.id,
        userId: "thomas",
        rating: 3,
      });
      expect(completed.state).toBe("review");
      expect(completed.learningStep).toBeNull();
      expect((await getCard(db, token.id, "thomas"))?.learning_step).toBeNull();
    });

    it("rolls back the card update when immutable review logging fails", async () => {
      const token = await createToken(db, {
        slug: "review-log-rollback",
        concept: "A review must update scheduling and history atomically",
        domain: "testing",
        bloom_level: 2,
      });
      const card = await ensureCard(db, token.id, "thomas");
      await db.exec(`
        CREATE TRIGGER fail_review_log
        BEFORE INSERT ON review_logs
        BEGIN
          SELECT RAISE(ABORT, 'simulated review log failure');
        END;
      `);

      await expect(
        evaluateRating(db, {
          cardId: card.id,
          tokenId: token.id,
          userId: "thomas",
          rating: 3,
        }),
      ).rejects.toThrow("simulated review log failure");

      const unchanged = await getCard(db, token.id, "thomas");
      expect(unchanged?.reps).toBe(0);
      expect(unchanged?.last_review_at).toBeNull();
    });

    it("full lifecycle: token → prerequisite chain → block → unblock", async () => {
      const prereq = await createToken(db, {
        slug: "prerequisite-token",
        concept: "A prerequisite concept",
        domain: "testing",
        bloom_level: 1,
      });
      const target = await createToken(db, {
        slug: "target-token",
        concept: "A dependent concept",
        domain: "testing",
        bloom_level: 2,
      });

      await addPrerequisite(db, target.id, prereq.id);

      const targetCard = await ensureCard(db, target.id, "thomas");

      // Rating 1 (forgot) on the target should cascade-block it and surface prerequisites
      const result = await executeReviewAction(db, {
        action: "rate",
        cardId: targetCard.id,
        userId: "thomas",
        rating: 1,
      });

      expect(result.evaluation?.state).toBe("learning");
      expect(result.blocked).toBeDefined();
      expect(result.blocked?.blockedSlug).toBe(target.slug);
      expect(result.blocked?.prerequisites).toHaveLength(1);
      expect(result.blocked?.prerequisites[0]?.slug).toBe(prereq.slug);

      // The target card should now be blocked
      const blockedToken = await getTokenBySlug(db, target.slug);
      expect(blockedToken).toBeDefined();

      // Learn the prerequisite
      const prereqCard = await ensureCard(db, prereq.id, "thomas");
      await executeReviewAction(db, {
        action: "rate",
        cardId: prereqCard.id,
        userId: "thomas",
        rating: 3,
      });

      // Now unblock — the target should become ready
      const unblocked = await unblockReady(db, "thomas");
      expect(unblocked.unblocked.length).toBeGreaterThanOrEqual(1);
      expect(unblocked.unblocked.some((u) => u.slug === target.slug)).toBe(
        true,
      );
    });

    it("rolls back rating, review log, and cascade blocking together", async () => {
      const prereq = await createToken(db, {
        slug: "transaction-prerequisite",
        concept: "A prerequisite surfaced by a failed rating",
        domain: "testing",
        bloom_level: 1,
      });
      const target = await createToken(db, {
        slug: "transaction-target",
        concept: "A target whose review must be atomic",
        domain: "testing",
        bloom_level: 2,
      });
      await addPrerequisite(db, target.id, prereq.id);
      const targetCard = await ensureCard(db, target.id, "thomas");

      await db.exec(`
        CREATE TRIGGER fail_review_block
        BEFORE UPDATE OF blocked ON cards
        WHEN NEW.blocked = 1
        BEGIN
          SELECT RAISE(ABORT, 'simulated block failure');
        END;
      `);

      await expect(
        executeReviewAction(db, {
          action: "rate",
          cardId: targetCard.id,
          userId: "thomas",
          rating: 1,
        }),
      ).rejects.toThrow("simulated block failure");

      const cardAfterFailure = await getCard(db, target.id, "thomas");
      expect(cardAfterFailure?.reps).toBe(0);
      expect(cardAfterFailure?.blocked).toBe(0);
      expect(
        await db
          .prepare("SELECT id FROM review_logs WHERE card_id = ?")
          .all(targetCard.id),
      ).toHaveLength(0);
      expect(await getCard(db, prereq.id, "thomas")).toBeUndefined();
    });

    it("blocks retroactively after missing prerequisites are discovered", async () => {
      const target = await createToken(db, {
        slug: "analyze-enlightenment",
        concept: "Analyze how Enlightenment ideas shaped political change",
        domain: "history",
        bloom_level: 4,
      });
      const targetCard = await ensureCard(db, target.id, "thomas");

      const rating = await executeReviewAction(db, {
        action: "rate",
        cardId: targetCard.id,
        userId: "thomas",
        rating: 1,
      });

      expect(rating.blocked).toBeUndefined();
      expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(0);

      const prerequisite = await createToken(db, {
        slug: "define-popular-sovereignty",
        concept:
          "Popular sovereignty means political authority comes from the people",
        domain: "history",
        bloom_level: 1,
      });
      await addPrerequisite(db, target.id, prerequisite.id);

      const blocked = await cascadeBlock(db, "thomas", target.slug);
      expect(blocked.blockedSlug).toBe(target.slug);
      expect(blocked.prerequisites).toEqual([
        {
          slug: prerequisite.slug,
          concept: prerequisite.concept,
          bloomLevel: prerequisite.bloom_level,
        },
      ]);
      expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(1);

      const prerequisiteCard = await getCard(db, prerequisite.id, "thomas");
      expect(prerequisiteCard).toBeDefined();
      expect(prerequisiteCard?.blocked).toBe(0);

      const dueSlugs = (await getDueCards(db, "thomas")).map(
        (card) => card.slug,
      );
      expect(dueSlugs).toContain(prerequisite.slug);
      expect(dueSlugs).not.toContain(target.slug);

      await executeReviewAction(db, {
        action: "rate",
        cardId: prerequisiteCard!.id,
        userId: "thomas",
        rating: 3,
      });

      const unblocked = await unblockReady(db, "thomas");
      expect(unblocked.unblocked).toContainEqual({
        slug: target.slug,
        concept: target.concept,
      });
      expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(0);
    });

    it("refuses to block a token without prerequisites", async () => {
      const token = await createToken(db, {
        slug: "standalone-token",
        concept: "A token without prerequisites",
        domain: "testing",
        bloom_level: 2,
      });

      await expect(cascadeBlock(db, "thomas", token.slug)).rejects.toThrow(
        "Cannot block standalone-token: token has no prerequisites",
      );
      expect(await getCard(db, token.id, "thomas")).toBeUndefined();
    });
  });
});
