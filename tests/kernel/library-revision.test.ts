import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildReviewQueue,
  createToken,
  type Database,
  ensureCard,
  evaluateRating,
  getCard,
  getRevisionImpact,
  isAwaitingRetest,
  openDatabase,
  publishTokenRevision,
  type Token,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-07-04 Decision 3: a curator's material change must reach the people
 * who already learned the old version, and it does so by *re-testing* rather
 * than resetting — the card becomes due and the next rating recalibrates FSRS.
 */
describe("publishTokenRevision", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-revision-"));
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

  /** A card in `review` state, comfortably in the future and already in sync. */
  async function learnedCard(
    tokenId: string,
    userId: string,
    dueInDays = 30,
  ): Promise<string> {
    const card = await ensureCard(db, tokenId, userId);
    const due = new Date(Date.now() + dueInDays * 86_400_000).toISOString();
    await db
      .prepare(
        `UPDATE cards
            SET state = 'review', reps = 4, stability = 40.0, difficulty = 0.3,
                due_at = ?
          WHERE id = ?`,
      )
      .run(due, card.id);
    return card.id;
  }

  async function versions(
    cardId: string,
  ): Promise<{ learned: number; current: number }> {
    return (await db
      .prepare(
        `SELECT c.learned_content_version AS learned, t.content_version AS current
           FROM cards c JOIN tokens t ON t.id = c.token_id
          WHERE c.id = ?`,
      )
      .get(cardId)) as { learned: number; current: number };
  }

  it("leaves scheduling untouched for a cosmetic change", async () => {
    const token = await makeToken("cosmetic-token");
    const cardId = await learnedCard(token.id, "alice");
    const before = await getCard(db, token.id, "alice");

    const result = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "cosmetic",
      changes: { question: "Which city is the capital of Bavaria?" },
    });

    expect(result.cardsRetested).toBe(0);
    expect(result.contentVersion).toBe(1);

    const after = await getCard(db, token.id, "alice");
    expect(after?.due_at).toBe(before?.due_at);
    expect(after?.stability).toBe(before?.stability);
    expect(await isAwaitingRetest(db, cardId)).toBe(false);

    // The text really did change — cosmetic is not a no-op.
    const row = (await db
      .prepare("SELECT question FROM tokens WHERE id = ?")
      .get(token.id)) as { question: string };
    expect(row.question).toBe("Which city is the capital of Bavaria?");
  });

  it("makes the card due now on a material change", async () => {
    const token = await makeToken("material-token");
    const cardId = await learnedCard(token.id, "alice");

    const result = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
      changes: { concept: "Munich — corrected from an earlier wrong answer" },
    });

    expect(result.cardsRetested).toBe(1);
    expect(result.contentVersion).toBe(2);

    // Compare against the *database's* clock, not Date.now(). due_at is written
    // as datetime('now'), which truncates to the second — so it is never in the
    // future by SQLite's own reckoning. Node's clock is a different source and
    // can read several milliseconds behind SQLite's, which made a Date.now()
    // comparison fail whenever the write landed just past a second boundary.
    const card = await getCard(db, token.id, "alice");
    const dbNow = (await db
      .prepare("SELECT datetime('now') AS now")
      .get()) as { now: string };
    expect(card!.due_at <= dbNow.now).toBe(true);
    expect(await isAwaitingRetest(db, cardId)).toBe(true);
  });

  it("leaves the retested card immediately selectable by the queue", async () => {
    const token = await makeToken("due-now-token");
    await learnedCard(token.id, "alice");

    await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
      changes: { concept: "Munich — corrected again" },
    });

    // The property that actually matters, pinned in the terms the scheduler
    // uses: "due now" means the queue picks the card up on the very next build,
    // with no wait for a clock to catch up.
    const queue = await buildReviewQueue(db, { userId: "alice" });
    expect(queue.items.map((item) => item.tokenId)).toContain(token.id);
  });

  it("records revision provenance and surfaces contentChanged in review queue", async () => {
    const token = await makeToken("provenance-token");
    await learnedCard(token.id, "alice");

    const result = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
      publishedBy: "curator@example.com",
      changes: { concept: "Updated concept with provenance" },
    });

    expect(result.publishedBy).toBe("curator@example.com");
    expect(result.publishedAt).toBeDefined();

    const queue = await buildReviewQueue(db, { userId: "alice" });
    const item = queue.items.find((i) => i.tokenId === token.id);
    expect(item).toBeDefined();
    expect(item?.contentChanged).toBe(true);
    expect(item?.publishedBy).toBe("curator@example.com");
    expect(item?.publishedAt).toBe(result.publishedAt);
  });

  it("re-tests rather than resets: FSRS history survives the bump", async () => {
    // The distinguishing property of Decision 3. A hard reset would zero these.
    const token = await makeToken("retest-token");
    const cardId = await learnedCard(token.id, "alice");
    const before = await getCard(db, token.id, "alice");

    await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
    });

    const after = await getCard(db, token.id, "alice");
    expect(after?.stability).toBe(before?.stability);
    expect(after?.difficulty).toBe(before?.difficulty);
    expect(after?.reps).toBe(before?.reps);
    expect(after?.lapses).toBe(before?.lapses);
    expect(after?.state).toBe("review");
    expect(await isAwaitingRetest(db, cardId)).toBe(true);
  });

  it("brings the card back in sync once it is answered", async () => {
    const token = await makeToken("sync-token");
    const cardId = await learnedCard(token.id, "alice");

    await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
    });
    expect(await isAwaitingRetest(db, cardId)).toBe(true);

    await evaluateRating(db, {
      cardId,
      tokenId: token.id,
      userId: "alice",
      rating: 3,
    });

    expect(await isAwaitingRetest(db, cardId)).toBe(false);
    expect((await versions(cardId)).learned).toBe(2);
  });

  /**
   * ADR 2026-08-14 Decision 9: which wording earned a rating has to survive,
   * because a rebuild of the knowledge base classifies items by what the
   * learner actually answered. The card row holds only the current version, so
   * the log has to carry it per event.
   */
  it("records which content version each rating was earned on", async () => {
    const token = await makeToken("versioned-token");
    const cardId = await learnedCard(token.id, "alice");

    await evaluateRating(db, {
      cardId,
      tokenId: token.id,
      userId: "alice",
      rating: 3,
      now: new Date("2030-01-01T00:00:00.000Z"),
    });
    await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
    });
    await evaluateRating(db, {
      cardId,
      tokenId: token.id,
      userId: "alice",
      rating: 3,
      now: new Date("2030-01-02T00:00:00.000Z"),
    });

    const logged = (await db
      .prepare(
        `SELECT content_version FROM review_logs
          WHERE card_id = ? ORDER BY reviewed_at, id`,
      )
      .all(cardId)) as Array<{ content_version: number | null }>;
    expect(logged.map((row) => row.content_version)).toEqual([1, 2]);
  });

  it("does not pull an already re-tested card forward on a later publish", async () => {
    // Regression: without syncing on review, every publish would re-test
    // everyone forever, including people who had just answered.
    const token = await makeToken("repeat-token");
    const cardId = await learnedCard(token.id, "alice");

    await publishTokenRevision(db, { tokenId: token.id, materiality: "material" });
    await evaluateRating(db, {
      cardId,
      tokenId: token.id,
      userId: "alice",
      rating: 3,
    });
    const settled = await getCard(db, token.id, "alice");

    // A cosmetic publish afterwards must not disturb the new schedule.
    const cosmetic = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "cosmetic",
    });
    expect(cosmetic.cardsRetested).toBe(0);
    const after = await getCard(db, token.id, "alice");
    expect(after?.due_at).toBe(settled?.due_at);
  });

  it("re-tests every learner holding an outdated version, and only those", async () => {
    const token = await makeToken("shared-token");
    const aliceCard = await learnedCard(token.id, "alice");
    const bobCard = await learnedCard(token.id, "bob");

    // Bob answers after the first material change; Alice does not.
    await publishTokenRevision(db, { tokenId: token.id, materiality: "material" });
    await evaluateRating(db, {
      cardId: bobCard,
      tokenId: token.id,
      userId: "bob",
      rating: 3,
    });

    expect(await isAwaitingRetest(db, aliceCard)).toBe(true);
    expect(await isAwaitingRetest(db, bobCard)).toBe(false);

    // A second material change catches both again.
    const second = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
    });
    expect(second.contentVersion).toBe(3);
    expect(second.cardsRetested).toBe(2);
  });

  it("leaves brand-new cards alone", async () => {
    // A card never answered has nothing to re-test; it is already queued as new.
    const token = await makeToken("new-token");
    await ensureCard(db, token.id, "alice");

    const result = await publishTokenRevision(db, {
      tokenId: token.id,
      materiality: "material",
    });

    expect(result.cardsRetested).toBe(0);
    const card = await getCard(db, token.id, "alice");
    expect(card?.state).toBe("new");
  });

  it("refuses to guess materiality", async () => {
    const token = await makeToken("guard-token");
    await expect(
      publishTokenRevision(db, {
        tokenId: token.id,
        // biome-ignore lint/suspicious/noExplicitAny: exercising the guard
        materiality: undefined as any,
      }),
    ).rejects.toThrow(/cosmetic.*material/i);
  });

  it("rejects an unknown token", async () => {
    await expect(
      publishTokenRevision(db, { tokenId: "nope", materiality: "cosmetic" }),
    ).rejects.toThrow(/Token not found/);
  });

  it("migrates a pre-M015 database without re-testing anyone", async () => {
    // The upgrade path is the risky half: an existing learner must not have
    // their whole deck pulled forward merely by installing a new ZAM. Both
    // columns default to 1, so migrated tokens and cards land in sync.
    const dbPath = join(tempDir, "legacy.db");
    let legacyDb = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    const token = await createToken(legacyDb, {
      slug: "pre-versioning",
      concept: "Learned long before content versioning existed",
      domain: "testing",
      bloom_level: 2,
    });
    const card = await ensureCard(legacyDb, token.id, "alice");
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
    await legacyDb
      .prepare(
        "UPDATE cards SET state = 'review', reps = 5, due_at = ? WHERE id = ?",
      )
      .run(future, card.id);

    // Emulate the pre-M015 shape.
    await legacyDb.exec("ALTER TABLE tokens DROP COLUMN content_version");
    await legacyDb.exec("ALTER TABLE cards DROP COLUMN learned_content_version");
    await legacyDb.close();

    legacyDb = await openDatabase({
      dbPath,
      initialize: true,
      useConfiguredCloud: false,
    });
    try {
      expect(await isAwaitingRetest(legacyDb, card.id)).toBe(false);
      const migrated = await getCard(legacyDb, token.id, "alice");
      expect(migrated?.due_at).toBe(future);

      // And versioning works from there on.
      const result = await publishTokenRevision(legacyDb, {
        tokenId: token.id,
        materiality: "material",
      });
      expect(result.contentVersion).toBe(2);
      expect(result.cardsRetested).toBe(1);
    } finally {
      await legacyDb.close();
    }
  });

  describe("getRevisionImpact (Phase 2 Studio release step)", () => {
    it("reports release impact accurately before publishing", async () => {
      const token = await makeToken("impact-token");
      await learnedCard(token.id, "alice");
      await learnedCard(token.id, "bob");
      await ensureCard(db, token.id, "charlie"); // brand new card

      const impact = await getRevisionImpact(db, token.id);
      expect(impact.tokenId).toBe(token.id);
      expect(impact.currentContentVersion).toBe(1);
      expect(impact.totalCards).toBe(3);
      expect(impact.affectedLearners).toBe(2); // alice and bob (learned), charlie is new
    });

    it("updates affectedLearners count after material publish and re-test sync", async () => {
      const token = await makeToken("impact-sync-token");
      const aliceCard = await learnedCard(token.id, "alice");
      const bobCard = await learnedCard(token.id, "bob");

      await publishTokenRevision(db, {
        tokenId: token.id,
        materiality: "material",
      });

      expect(await isAwaitingRetest(db, aliceCard)).toBe(true);
      expect(await isAwaitingRetest(db, bobCard)).toBe(true);

      // Alice answers and re-tests
      await evaluateRating(db, {
        cardId: aliceCard,
        tokenId: token.id,
        userId: "alice",
        rating: 3,
      });

      // Alice is in sync with v2; Bob is still awaiting re-test for v2
      expect(await isAwaitingRetest(db, aliceCard)).toBe(false);
      expect(await isAwaitingRetest(db, bobCard)).toBe(true);

      const impact = await getRevisionImpact(db, token.id);
      expect(impact.currentContentVersion).toBe(2);
      expect(impact.totalCards).toBe(2);
      expect(impact.affectedLearners).toBe(2);
    });
  });

  describe("Phase 3 — editorial state", () => {
    it("excludes draft and in_review tokens from review queues", async () => {
      const draftToken = await createToken(db, {
        slug: "draft-token",
        concept: "Draft concept",
        editorial_state: "draft",
      });
      await ensureCard(db, draftToken.id, "alice");

      const inReviewToken = await createToken(db, {
        slug: "review-token",
        concept: "In-review concept",
        editorial_state: "in_review",
      });
      await ensureCard(db, inReviewToken.id, "alice");

      const publishedToken = await createToken(db, {
        slug: "published-token",
        concept: "Published concept",
        editorial_state: "published",
      });
      await ensureCard(db, publishedToken.id, "alice");

      const queue = await buildReviewQueue(db, { userId: "alice" });
      const slugs = queue.items.map((i) => i.slug);
      expect(slugs).toContain("published-token");
      expect(slugs).not.toContain("draft-token");
      expect(slugs).not.toContain("review-token");
    });

    it("transitions draft token to published upon revision release", async () => {
      const token = await createToken(db, {
        slug: "publish-transition",
        concept: "Draft to be published",
        editorial_state: "draft",
      });
      await ensureCard(db, token.id, "alice");

      let queue = await buildReviewQueue(db, { userId: "alice" });
      expect(queue.items.map((i) => i.slug)).not.toContain("publish-transition");

      await publishTokenRevision(db, {
        tokenId: token.id,
        materiality: "cosmetic",
      });

      queue = await buildReviewQueue(db, { userId: "alice" });
      expect(queue.items.map((i) => i.slug)).toContain("publish-transition");
    });
  });
});
