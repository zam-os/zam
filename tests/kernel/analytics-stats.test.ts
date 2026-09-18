import { ulid } from "ulid";
import { afterEach, beforeEach, expect, it } from "vitest";
import {
  createToken,
  type Database,
  ensureCard,
  getUserStats,
} from "../../src/kernel/index.js";
import {
  describeWithProviders,
  type ProvidedDatabase,
} from "../helpers/provider-matrix.js";

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

const PAST = "2026-01-01T00:00:00.000Z";
const FUTURE = "2030-01-01T00:00:00.000Z";

describeWithProviders("getUserStats", "zam_stats", (provider) => {
  let provided: ProvidedDatabase;
  let db: Database;

  beforeEach(async () => {
    provided = await provider.open();
    db = provided.db;
  });

  afterEach(async () => {
    await provided.cleanup();
  });

  it("reads every aggregate in one statement", async () => {
    const counter = { count: 0 };
    await getUserStats(countPrepares(db, counter), "nobody");
    expect(counter.count).toBe(1);
  });

  it("computes the same values the per-aggregate reads produced", async () => {
    const alice = "alice";
    const bob = "bob";

    const alpha = await createToken(db, {
      slug: "stats-alpha",
      concept: "alpha",
      domain: "math",
    });
    const beta = await createToken(db, {
      slug: "stats-beta",
      concept: "beta",
      domain: "bio",
    });
    const gamma = await createToken(db, {
      slug: "stats-gamma",
      concept: "gamma",
      domain: "math",
    });
    const delta = await createToken(db, {
      slug: "stats-delta",
      concept: "delta",
      domain: "bio",
    });
    await createToken(db, { slug: "stats-epsilon", concept: "epsilon" });

    // Due and reviewed: counts toward dueToday and the stability average.
    const cardA = await ensureCard(db, alpha.id, alice);
    await db
      .prepare(
        "UPDATE cards SET due_at = ?, reps = 1, stability = 4 WHERE id = ?",
      )
      .run(PAST, cardA.id);

    // Mature and not due: counts toward mature and the average, not dueToday.
    const cardB = await ensureCard(db, beta.id, alice);
    await db
      .prepare(
        "UPDATE cards SET due_at = ?, reps = 5, stability = 30 WHERE id = ?",
      )
      .run(FUTURE, cardB.id);

    // Blocked: counted as blocked, not as due.
    const cardC = await ensureCard(db, gamma.id, alice);
    await db
      .prepare("UPDATE cards SET due_at = ?, blocked = 1 WHERE id = ?")
      .run(PAST, cardC.id);

    // Buried into the future: still due by the raw scheduling rule — the
    // review queue's burial filter must not leak into this count.
    const cardD = await ensureCard(db, delta.id, alice);
    await db
      .prepare("UPDATE cards SET due_at = ?, buried_until = ? WHERE id = ?")
      .run(PAST, FUTURE, cardD.id);

    // Another learner's card: in the global token count, not in Alice's deck.
    await ensureCard(db, alpha.id, bob);

    await db
      .prepare(
        "INSERT INTO sessions (id, user_id, task, started_at) VALUES (?, ?, ?, ?)",
      )
      .run(ulid(), alice, "earlier", "2026-03-01T10:00:00.000Z");
    await db
      .prepare(
        "INSERT INTO sessions (id, user_id, task, started_at) VALUES (?, ?, ?, ?)",
      )
      .run(ulid(), alice, "latest", "2026-04-01T10:00:00.000Z");

    const stats = await getUserStats(db, alice);
    expect(stats).toEqual({
      userId: alice,
      totalTokens: 5, // tokens are global; no user filter
      cardsInDeck: 4,
      dueToday: 2, // cardA and the buried cardD; burial is not subtracted
      blocked: 1,
      mature: 1,
      avgStability: 17, // (4 + 30) / 2 over cards with reps > 0
      totalSessions: 2,
      lastSession: "2026-04-01T10:00:00.000Z",
    });
  });

  it("returns zeroed aggregates for a user without cards", async () => {
    await createToken(db, { slug: "stats-solo", concept: "solo" });
    const stats = await getUserStats(db, "empty-user");
    expect(stats.cardsInDeck).toBe(0);
    expect(stats.dueToday).toBe(0);
    expect(stats.blocked).toBe(0);
    expect(stats.mature).toBe(0);
    expect(stats.avgStability).toBeNull();
    expect(stats.totalSessions).toBe(0);
    expect(stats.lastSession).toBeNull();
    expect(stats.totalTokens).toBe(1);
  });
});
