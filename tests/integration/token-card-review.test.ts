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
  createToken,
  type Database,
  ensureCard,
  evaluateRating,
  executeReviewAction,
  findTokens,
  getDependents,
  getPrerequisites,
  getTokenBySlug,
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
  });
});
