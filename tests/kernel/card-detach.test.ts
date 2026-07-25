import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildReviewQueue,
  createAssignment,
  createToken,
  type Database,
  deleteCardForUser,
  detachCardForUser,
  ensureCard,
  evaluateRating,
  getCard,
  getDueCards,
  openDatabase,
  reattachCardForUser,
  type Token,
  withdrawAssignment,
} from "../../src/kernel/index.js";

/**
 * "Not for me" (ADR 2026-07-04 Decision 10). Detaching is the middle option
 * between keeping a card and deleting it: a learner declines shared content
 * without erasing the work they already did on it.
 */
describe("detachCardForUser", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-detach-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function makeToken(slug: string): Promise<Token> {
    return createToken(db, {
      slug,
      concept: `Concept for ${slug}`,
      domain: "testing",
      bloom_level: 2,
    });
  }

  /** A card with real review history, due now. */
  async function learnedCard(tokenId: string, userId: string): Promise<string> {
    const card = await ensureCard(db, tokenId, userId);
    await evaluateRating(db, { cardId: card.id, tokenId, userId, rating: 3 });
    await db
      .prepare("UPDATE cards SET due_at = ?, state = 'review' WHERE id = ?")
      .run(new Date(Date.now() - 60_000).toISOString(), card.id);
    return card.id;
  }

  async function reviewLogCount(cardId: string): Promise<number> {
    const row = (await db
      .prepare("SELECT COUNT(*) AS n FROM review_logs WHERE card_id = ?")
      .get(cardId)) as { n: number };
    return Number(row.n);
  }

  it("keeps the card and its history, unlike deleting", async () => {
    const token = await makeToken("declined");
    const cardId = await learnedCard(token.id, "alice");
    expect(await reviewLogCount(cardId)).toBe(1);

    const detached = await detachCardForUser(db, token.id, "alice");

    expect(detached.detached_at).toBeTruthy();
    // The distinguishing property: nothing was destroyed.
    expect(await getCard(db, token.id, "alice")).toBeDefined();
    expect(await reviewLogCount(cardId)).toBe(1);
  });

  it("removes the card from both scheduling paths", async () => {
    const token = await makeToken("out-of-queue");
    await learnedCard(token.id, "alice");

    expect(await getDueCards(db, "alice")).toHaveLength(1);
    expect((await buildReviewQueue(db, { userId: "alice" })).items).toHaveLength(1);

    await detachCardForUser(db, token.id, "alice");

    expect(await getDueCards(db, "alice")).toHaveLength(0);
    expect((await buildReviewQueue(db, { userId: "alice" })).items).toHaveLength(0);
  });

  it("resumes where it left off when picked back up", async () => {
    // Scheduling state is untouched throughout, so changing your mind does
    // not cost you your progress.
    const token = await makeToken("reconsidered");
    await learnedCard(token.id, "alice");
    const before = await getCard(db, token.id, "alice");

    await detachCardForUser(db, token.id, "alice");
    const after = await reattachCardForUser(db, token.id, "alice");

    expect(after.detached_at).toBeFalsy();
    expect(after.stability).toBe(before?.stability);
    expect(after.reps).toBe(before?.reps);
    expect(after.due_at).toBe(before?.due_at);
    expect(await getDueCards(db, "alice")).toHaveLength(1);
  });

  it("is idempotent in both directions", async () => {
    const token = await makeToken("idempotent");
    await learnedCard(token.id, "alice");

    const first = await detachCardForUser(db, token.id, "alice");
    const second = await detachCardForUser(db, token.id, "alice");
    expect(second.detached_at).toBe(first.detached_at);

    await reattachCardForUser(db, token.id, "alice");
    const again = await reattachCardForUser(db, token.id, "alice");
    expect(again.detached_at).toBeFalsy();
  });

  it("only affects the learner who declined", async () => {
    const token = await makeToken("shared");
    await learnedCard(token.id, "alice");
    await learnedCard(token.id, "bob");

    await detachCardForUser(db, token.id, "alice");

    expect(await getDueCards(db, "alice")).toHaveLength(0);
    expect(await getDueCards(db, "bob")).toHaveLength(1);
  });

  describe("against an assignment", () => {
    it("refuses while the assignment stands", async () => {
      // The inability to opt out is what makes it an assignment.
      const token = await makeToken("assigned");
      await createAssignment(db, {
        tokenId: token.id,
        assignerId: "lead",
        assigneeId: "alice",
      });

      await expect(
        detachCardForUser(db, token.id, "alice"),
      ).rejects.toThrow(/active assignment/i);
      await expect(
        deleteCardForUser(db, token.id, "alice"),
      ).rejects.toThrow(/active assignment/i);
    });

    it("allows it once withdrawn, with the history intact", async () => {
      const token = await makeToken("withdrawn");
      const assignment = await createAssignment(db, {
        tokenId: token.id,
        assignerId: "lead",
        assigneeId: "alice",
      });
      const card = await getCard(db, token.id, "alice");
      await evaluateRating(db, {
        cardId: card!.id,
        tokenId: token.id,
        userId: "alice",
        rating: 3,
      });

      await withdrawAssignment(db, assignment.id, "lead");

      const detached = await detachCardForUser(db, token.id, "alice");
      expect(detached.detached_at).toBeTruthy();
      expect(await reviewLogCount(card!.id)).toBe(1);
    });

    it("re-attaches a declined card when it is assigned again", async () => {
      // An assignment binds, so it overrides an earlier "not for me".
      const token = await makeToken("reassigned");
      await learnedCard(token.id, "alice");
      await detachCardForUser(db, token.id, "alice");
      expect(await getDueCards(db, "alice")).toHaveLength(0);

      await createAssignment(db, {
        tokenId: token.id,
        assignerId: "lead",
        assigneeId: "alice",
      });

      const card = await getCard(db, token.id, "alice");
      expect(card?.detached_at).toBeFalsy();
      expect(await getDueCards(db, "alice")).toHaveLength(1);
    });
  });

  it("migrates existing cards as attached", async () => {
    // The upgrade path: nobody's deck silently empties on install.
    const dbPath = join(tempDir, "legacy.db");
    let legacy = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    const token = await createToken(legacy, {
      slug: "pre-detach",
      concept: "Learned before detach existed",
      domain: "testing",
      bloom_level: 1,
    });
    const card = await ensureCard(legacy, token.id, "alice");
    await legacy
      .prepare("UPDATE cards SET state = 'review', due_at = ? WHERE id = ?")
      .run(new Date(Date.now() - 60_000).toISOString(), card.id);
    await legacy.exec("ALTER TABLE cards DROP COLUMN detached_at");
    await legacy.close();

    legacy = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      expect(await getDueCards(legacy, "alice")).toHaveLength(1);
      const migrated = await getCard(legacy, token.id, "alice");
      expect(migrated?.detached_at).toBeFalsy();
    } finally {
      await legacy.close();
    }
  });
});
