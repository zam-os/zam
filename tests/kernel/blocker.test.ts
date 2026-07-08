import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  addPrerequisite,
  createToken,
  type Database,
  ensureCard,
  getCard,
  openDatabase,
  type Token,
  unblockReady,
} from "../../src/kernel/index.js";

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
