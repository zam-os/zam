import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addPrerequisite,
  applyDirectRating,
  buildReviewQueue,
  cascadeBlock,
  createToken,
  type Database,
  ensureCard,
  executeReviewAction,
  getCard,
  openDatabase,
  type Token,
  unblockReady,
} from "../../src/kernel/index.js";

/**
 * Wrap a Database so the first transaction's release scan finds nothing, as if
 * another foundation's success were still uncommitted while this rating ran
 * (two concurrent ratings on PostgreSQL). Later transactions see the truth.
 * `failLater` makes every later transaction throw instead.
 */
function staleFirstReleaseScan(
  db: Database,
  options: { failLater?: boolean } = {},
): Database {
  let transactions = 0;
  const blind = (tx: Database): Database => ({
    ...tx,
    prepare(sql: string) {
      if (!sql.includes("pc.reps >= 1")) return tx.prepare(sql);
      const statement = tx.prepare(sql);
      return { ...statement, all: async () => [] };
    },
  });
  const wrapper: Database = {
    prepare: (sql: string) => db.prepare(sql),
    exec: (sql: string) => db.exec(sql),
    pragma: (source: string) => db.pragma(source),
    transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
      transactions++;
      if (transactions === 1) return db.transaction((tx) => fn(blind(tx)));
      if (options.failLater) {
        return Promise.reject(new Error("recheck connection lost"));
      }
      return db.transaction(fn);
    },
    close: () => db.close(),
  };
  return wrapper;
}

/**
 * Wrap a Database with PostgreSQL's nesting rule: a transaction() inside an
 * open one runs inline instead of committing on its own.
 */
function inlineNestedTransactions(db: Database): Database {
  let open = false;
  const wrapper: Database = {
    prepare: (sql: string) => db.prepare(sql),
    exec: (sql: string) => db.exec(sql),
    pragma: (source: string) => db.pragma(source),
    async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
      if (open) return fn(wrapper);
      return db.transaction(async () => {
        open = true;
        try {
          return await fn(wrapper);
        } finally {
          open = false;
        }
      });
    },
    close: () => db.close(),
  };
  return wrapper;
}

/** Wrap a Database so every prepare() call is counted. */
function countPrepares(db: Database, counter: { count: number }): Database {
  return {
    prepare(sql: string) {
      counter.count++;
      return db.prepare(sql);
    },
    exec: (sql: string) => db.exec(sql),
    pragma: (source: string) => db.pragma(source),
    transaction: <T>(fn: (tx: Database) => Promise<T>) => db.transaction(fn),
    close: () => db.close(),
  };
}

describe("unblockReady", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-blocker-"));
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

  async function blockCard(tokenId: string, userId: string): Promise<void> {
    await ensureCard(db, tokenId, userId);
    await db
      .prepare(
        "UPDATE cards SET blocked = 1 WHERE token_id = ? AND user_id = ?",
      )
      .run(tokenId, userId);
  }

  async function learnCard(tokenId: string, userId: string): Promise<void> {
    await ensureCard(db, tokenId, userId);
    await db
      .prepare("UPDATE cards SET reps = 1 WHERE token_id = ? AND user_id = ?")
      .run(tokenId, userId);
  }

  it("unblocks a blocked card once all prerequisites are learned", async () => {
    const prereq = await makeToken("prereq");
    const target = await makeToken("target");
    await addPrerequisite(db, target.id, prereq.id);
    await learnCard(prereq.id, "thomas");
    await blockCard(target.id, "thomas");

    const result = await unblockReady(db, "thomas");

    expect(result.unblocked).toEqual([
      { slug: target.slug, concept: target.concept },
    ]);
    const card = await getCard(db, target.id, "thomas");
    expect(card?.blocked).toBe(0);
    expect(card?.due_at).toBeTruthy();
  });

  it("keeps a card blocked while any prerequisite is unmet", async () => {
    const met = await makeToken("met-prereq");
    const unmet = await makeToken("unmet-prereq");
    const target = await makeToken("target");
    await addPrerequisite(db, target.id, met.id);
    await addPrerequisite(db, target.id, unmet.id);
    await learnCard(met.id, "thomas");
    await ensureCard(db, unmet.id, "thomas"); // card exists but reps = 0
    await blockCard(target.id, "thomas");

    const result = await unblockReady(db, "thomas");

    expect(result.unblocked).toEqual([]);
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(1);
  });

  it("does not treat a missing prerequisite card as met", async () => {
    const prereq = await makeToken("cardless-prereq");
    const target = await makeToken("target");
    await addPrerequisite(db, target.id, prereq.id);
    await blockCard(target.id, "thomas");

    const result = await unblockReady(db, "thomas");

    expect(result.unblocked).toEqual([]);
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(1);
  });

  it("does not unblock a card whose prerequisite remains blocked", async () => {
    const root = await makeToken("root-prereq"); // never gets a card
    const mid = await makeToken("mid-prereq");
    const target = await makeToken("target");
    await addPrerequisite(db, mid.id, root.id);
    await addPrerequisite(db, target.id, mid.id);
    await learnCard(mid.id, "thomas");
    await blockCard(mid.id, "thomas"); // stays blocked: root is unmet
    await blockCard(target.id, "thomas");

    const result = await unblockReady(db, "thomas");

    expect(result.unblocked).toEqual([]);
    expect((await getCard(db, mid.id, "thomas"))?.blocked).toBe(1);
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(1);
  });

  it("cascades through a blocked prerequisite in a single call", async () => {
    const prereq = await makeToken("blocked-prereq");
    const target = await makeToken("target");
    await addPrerequisite(db, target.id, prereq.id);
    await learnCard(prereq.id, "thomas");
    await blockCard(prereq.id, "thomas");
    await blockCard(target.id, "thomas");

    const result = await unblockReady(db, "thomas");

    // The prerequisite has no prerequisites of its own, so it unblocks;
    // that makes it a met prerequisite (reps >= 1, unblocked), so the
    // target unblocks in the same call — regardless of row order.
    expect(result.unblocked).toEqual(
      expect.arrayContaining([
        { slug: prereq.slug, concept: prereq.concept },
        { slug: target.slug, concept: target.concept },
      ]),
    );
    expect(result.unblocked).toHaveLength(2);
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(0);
  });

  it("unblocks a blocked card that has no prerequisites", async () => {
    const orphan = await makeToken("orphan");
    await blockCard(orphan.id, "thomas");

    const result = await unblockReady(db, "thomas");

    expect(result.unblocked).toEqual([
      { slug: orphan.slug, concept: orphan.concept },
    ]);
    expect((await getCard(db, orphan.id, "thomas"))?.blocked).toBe(0);
  });

  it("only unblocks cards of the requested user", async () => {
    const prereq = await makeToken("shared-prereq");
    const target = await makeToken("shared-target");
    await addPrerequisite(db, target.id, prereq.id);
    await learnCard(prereq.id, "thomas");
    await blockCard(target.id, "thomas");
    await blockCard(target.id, "bob"); // bob has not learned the prerequisite

    const result = await unblockReady(db, "thomas");

    expect(result.unblocked).toEqual([
      { slug: target.slug, concept: target.concept },
    ]);
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(0);
    expect((await getCard(db, target.id, "bob"))?.blocked).toBe(1);
  });

  it("issues a constant number of queries regardless of blocked-card count", async () => {
    const makeUnmetBlockedTarget = async (i: number) => {
      const prereq = await makeToken(`scale-prereq-${i}`);
      const target = await makeToken(`scale-target-${i}`);
      await addPrerequisite(db, target.id, prereq.id);
      await blockCard(target.id, "thomas");
    };

    for (let i = 0; i < 2; i++) await makeUnmetBlockedTarget(i);
    const counter = { count: 0 };
    const counted = countPrepares(db, counter);
    await unblockReady(counted, "thomas");
    const queriesForTwoCards = counter.count;

    for (let i = 2; i < 7; i++) await makeUnmetBlockedTarget(i);
    counter.count = 0;
    await unblockReady(counted, "thomas");

    expect(counter.count).toBe(queriesForTwoCards);
  });
});

describe("blocking behind content the queue cannot show", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-blocker-unpublished-"));
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

  /**
   * An OKF import parks a token without a question as a draft but still
   * declares the edges around it, so a published item can end up requiring a
   * draft. A draft never enters a queue, so blocking behind one would take
   * the card away for good.
   */
  it("does not block a card behind a draft foundation", async () => {
    const foundation = await createToken(db, {
      slug: "draft-foundation",
      concept: "A foundation whose question is still missing",
      domain: "testing",
      editorial_state: "draft",
    });
    const target = await createToken(db, {
      slug: "published-target",
      concept: "A published item",
      domain: "testing",
      question: "What holds here?",
    });
    await addPrerequisite(db, target.id, foundation.id);
    const card = await ensureCard(db, target.id, "thomas");

    const result = await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 1,
    });

    expect(result.blocked).toBeUndefined();
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(0);
  });

  it("blocks behind a published foundation as before", async () => {
    const foundation = await createToken(db, {
      slug: "published-foundation",
      concept: "A foundation the learner can be sent to",
      domain: "testing",
      question: "What is the foundation?",
    });
    const target = await createToken(db, {
      slug: "dependent-target",
      concept: "A dependent item",
      domain: "testing",
      question: "What builds on it?",
    });
    await addPrerequisite(db, target.id, foundation.id);
    const card = await ensureCard(db, target.id, "thomas");

    await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 1,
    });

    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(1);
  });

  it("releases a card whose only foundation was retired after the block", async () => {
    const foundation = await createToken(db, {
      slug: "retired-foundation",
      concept: "A foundation that was replaced",
      domain: "testing",
      question: "What is the foundation?",
    });
    const target = await createToken(db, {
      slug: "orphaned-target",
      concept: "An item left waiting on it",
      domain: "testing",
      question: "What builds on it?",
    });
    await addPrerequisite(db, target.id, foundation.id);
    const card = await ensureCard(db, target.id, "thomas");
    await executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 1,
    });
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(1);

    await db
      .prepare("UPDATE tokens SET deprecated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), foundation.id);

    const released = await unblockReady(db, "thomas");
    expect(released.unblocked.map((entry) => entry.slug)).toContain(
      "orphaned-target",
    );
    expect((await getCard(db, target.id, "thomas"))?.blocked).toBe(0);
  });

  it("refuses an explicit cascadeBlock with only unpublished foundations", async () => {
    const foundation = await createToken(db, {
      slug: "only-draft-foundation",
      concept: "The single, unpublished foundation",
      domain: "testing",
      editorial_state: "draft",
    });
    const target = await createToken(db, {
      slug: "target-of-draft",
      concept: "An item above it",
      domain: "testing",
      question: "What builds on it?",
    });
    await addPrerequisite(db, target.id, foundation.id);
    await ensureCard(db, target.id, "thomas");

    await expect(cascadeBlock(db, "thomas", "target-of-draft")).rejects.toThrow(
      /no prerequisites/,
    );
  });
});

describe("release after a successful review (ADR 2026-11-21 Decision 7)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-blocker-release-"));
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

  async function item(slug: string): Promise<Token> {
    return createToken(db, {
      slug,
      concept: `Concept for ${slug}`,
      domain: "testing",
      question: `What is ${slug}?`,
    });
  }

  async function rate(
    token: Token,
    rating: 1 | 2 | 3 | 4,
  ): Promise<Awaited<ReturnType<typeof executeReviewAction>>> {
    const card = await ensureCard(db, token.id, "thomas");
    return executeReviewAction(db, {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating,
    });
  }

  async function queueSlugs(): Promise<string[]> {
    const queue = await buildReviewQueue(db, { userId: "thomas" });
    return queue.items.map((entry) => entry.slug);
  }

  // Studio, Mobile and the MCP panel rate only through executeReviewAction;
  // none of them calls unblockReady. This is their whole path.
  it("brings the dependent back into the queue through the rating alone", async () => {
    const foundation = await item("foundation");
    const dependent = await item("dependent");
    await addPrerequisite(db, dependent.id, foundation.id);

    await rate(dependent, 1);
    expect(await queueSlugs()).not.toContain("dependent");
    expect(await queueSlugs()).toContain("foundation");

    const result = await rate(foundation, 3);

    expect(result.unblocked).toEqual([
      { slug: "dependent", concept: dependent.concept },
    ]);
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(0);
    expect(await queueSlugs()).toContain("dependent");
  });

  it("releases a chain one successful review at a time", async () => {
    const base = await item("chain-base");
    const middle = await item("chain-middle");
    const top = await item("chain-top");
    await addPrerequisite(db, middle.id, base.id);
    await addPrerequisite(db, top.id, middle.id);

    // A rating of 1 resets reps to 0, so the middle card is unmet for the top
    // one until the learner recalls it again.
    await rate(middle, 1);
    await rate(top, 1);

    const afterBase = await rate(base, 3);
    expect(afterBase.unblocked?.map((entry) => entry.slug)).toEqual([
      "chain-middle",
    ]);
    expect((await getCard(db, top.id, "thomas"))?.blocked).toBe(1);

    const afterMiddle = await rate(middle, 3);
    expect(afterMiddle.unblocked?.map((entry) => entry.slug)).toEqual([
      "chain-top",
    ]);
    expect(await queueSlugs()).toContain("chain-top");
  });

  it("keeps the card blocked while a foundation is still unmet", async () => {
    const first = await item("first-foundation");
    const second = await item("second-foundation");
    const dependent = await item("two-foundation-dependent");
    await addPrerequisite(db, dependent.id, first.id);
    await addPrerequisite(db, dependent.id, second.id);

    await rate(dependent, 1);
    const result = await rate(first, 3);

    expect(result.unblocked).toBeUndefined();
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(1);
    expect(await queueSlugs()).not.toContain("two-foundation-dependent");
  });

  it("releases nothing on a failed review", async () => {
    const foundation = await item("failed-foundation");
    const dependent = await item("failed-dependent");
    await addPrerequisite(db, dependent.id, foundation.id);

    await rate(dependent, 1);
    const result = await rate(foundation, 1);

    expect(result.unblocked).toBeUndefined();
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(1);
  });
});

describe("release commits with its rating (ADR 2026-11-21 Decision 7)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-blocker-atomic-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function item(slug: string): Promise<Token> {
    return createToken(db, {
      slug,
      concept: `Concept for ${slug}`,
      domain: "testing",
      question: `What is ${slug}?`,
    });
  }

  /** A dependent blocked behind two foundations, the first already recalled. */
  async function blockedBehindTwo() {
    const first = await item("first");
    const second = await item("second");
    const dependent = await item("dependent");
    await addPrerequisite(db, dependent.id, first.id);
    await addPrerequisite(db, dependent.id, second.id);
    await applyDirectRating(db, {
      userId: "thomas",
      tokenId: dependent.id,
      rating: 1,
    });
    await applyDirectRating(db, {
      userId: "thomas",
      tokenId: first.id,
      rating: 3,
    });
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(1);
    return { first, second, dependent };
  }

  async function reviewLogCount(tokenId: string): Promise<number> {
    const row = (await db
      .prepare("SELECT COUNT(*) AS n FROM review_logs WHERE token_id = ?")
      .get(tokenId)) as { n: number };
    return row.n;
  }

  it("blocks and releases through applyDirectRating (zam card update)", async () => {
    const { second, dependent } = await blockedBehindTwo();

    const result = await applyDirectRating(db, {
      userId: "thomas",
      tokenId: second.id,
      rating: 3,
    });

    expect(result.unblocked).toEqual([
      { slug: "dependent", concept: dependent.concept },
    ]);
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(0);
  });

  it("leaves no review behind when the release write fails", async () => {
    const { second, dependent } = await blockedBehindTwo();
    await db.exec(`
      CREATE TRIGGER refuse_release BEFORE UPDATE OF blocked ON cards
      WHEN OLD.blocked = 1 AND NEW.blocked = 0
      BEGIN SELECT RAISE(ABORT, 'release refused'); END;
    `);

    await expect(
      applyDirectRating(db, {
        userId: "thomas",
        tokenId: second.id,
        rating: 3,
      }),
    ).rejects.toThrow(/release refused/);

    expect(await reviewLogCount(second.id)).toBe(0);
    const card = await getCard(db, second.id, "thomas");
    expect(card?.reps).toBe(0);
    expect(card?.last_review_at).toBeNull();
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(1);

    // A retry after the fault is gone writes exactly one review.
    await db.exec("DROP TRIGGER refuse_release");
    await applyDirectRating(db, {
      userId: "thomas",
      tokenId: second.id,
      rating: 3,
    });
    expect(await reviewLogCount(second.id)).toBe(1);
  });

  it("releases on the post-commit recheck when the rating's own scan was stale", async () => {
    const { second, dependent } = await blockedBehindTwo();
    const card = await ensureCard(db, second.id, "thomas");

    const result = await executeReviewAction(staleFirstReleaseScan(db), {
      action: "rate",
      cardId: card.id,
      userId: "thomas",
      rating: 3,
    });

    expect(result.unblocked).toEqual([
      { slug: "dependent", concept: dependent.concept },
    ]);
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(0);
  });

  it("rechecks after commit for applyDirectRating too", async () => {
    const { second } = await blockedBehindTwo();

    const result = await applyDirectRating(staleFirstReleaseScan(db), {
      userId: "thomas",
      tokenId: second.id,
      rating: 3,
    });

    expect(result.unblocked?.map((entry) => entry.slug)).toEqual([
      "dependent",
    ]);
  });

  it("keeps the committed rating when the recheck fails", async () => {
    const { second, dependent } = await blockedBehindTwo();
    const card = await ensureCard(db, second.id, "thomas");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await executeReviewAction(
      staleFirstReleaseScan(db, { failLater: true }),
      { action: "rate", cardId: card.id, userId: "thomas", rating: 3 },
    );

    expect(result.applied).toBe(true);
    expect(result.unblocked).toBeUndefined();
    expect(await reviewLogCount(second.id)).toBe(1);
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("recheck connection lost"),
    );
  });

  it("does not commit early inside a caller's transaction", async () => {
    const { second, dependent } = await blockedBehindTwo();
    const card = await ensureCard(db, second.id, "thomas");
    const nested = inlineNestedTransactions(db);

    await expect(
      nested.transaction(async (tx) => {
        const result = await executeReviewAction(tx, {
          action: "rate",
          cardId: card.id,
          userId: "thomas",
          rating: 3,
        });
        expect(result.unblocked?.map((entry) => entry.slug)).toEqual([
          "dependent",
        ]);
        throw new Error("caller rolls back");
      }),
    ).rejects.toThrow(/caller rolls back/);

    expect(await reviewLogCount(second.id)).toBe(0);
    expect((await getCard(db, dependent.id, "thomas"))?.blocked).toBe(1);
  });
});
