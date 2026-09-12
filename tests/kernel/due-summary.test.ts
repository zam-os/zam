import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createToken,
  type Database,
  ensureCard,
  getDueCards,
  getDueSummary,
  openDatabase,
} from "../../src/kernel/index.js";

const PAST = "2026-01-01T00:00:00.000Z";
const FUTURE = "2030-01-01T00:00:00.000Z";

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

/**
 * getDueSummary must agree with getDueCards on what is due — it feeds the
 * dashboard from the bootstrap payload, and a disagreement with the queue
 * would show a count the first started session then contradicts.
 */
describe("getDueSummary", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-due-summary-"));
    db = await openDatabase({
      dbPath: join(tempDir, "zam.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  async function dueCardWith(
    slug: string,
    tokenUpdate: Record<string, string | null>,
    cardUpdate: Record<string, string | number | null>,
    domain = "math",
  ) {
    const token = await createToken(db, {
      slug,
      concept: slug,
      domain,
    });
    for (const [column, value] of Object.entries(tokenUpdate)) {
      await db.prepare(`UPDATE tokens SET ${column} = ? WHERE id = ?`).run(
        value,
        token.id,
      );
    }
    const card = await ensureCard(db, token.id, "carol");
    for (const [column, value] of Object.entries(cardUpdate)) {
      await db.prepare(`UPDATE cards SET ${column} = ? WHERE id = ?`).run(
        value,
        card.id,
      );
    }
  }

  it("matches the review queue's eligibility, deck-wide", async () => {
    const user = "carol";
    // Due on a named domain: counted, and the domain listed.
    await dueCardWith("sum-due", {}, { due_at: PAST });
    // Not due yet: excluded from both.
    await dueCardWith("sum-future", {}, { due_at: FUTURE });
    // Blocked: excluded from the queue.
    await dueCardWith("sum-blocked", {}, { due_at: PAST, blocked: 1 });
    // Buried into the future: excluded from the queue.
    await dueCardWith(
      "sum-buried",
      {},
      { due_at: PAST, buried_until: FUTURE },
    );
    // Draft token: not learning content yet.
    await dueCardWith(
      "sum-draft",
      { editorial_state: "draft" },
      { due_at: PAST },
    );
    // Deprecated token: not learning content any more.
    await dueCardWith(
      "sum-deprecated",
      { deprecated_at: PAST },
      { due_at: PAST },
    );
    // Token in maintenance: excluded from scheduling.
    await dueCardWith(
      "sum-maintenance",
      { maintenance_at: PAST },
      { due_at: PAST },
    );
    // Detached card: not this learner's to learn.
    await dueCardWith("sum-detached", {}, { due_at: PAST, detached_at: PAST });
    // Due on an unnamed domain: counted, but no domain badge for it.
    await dueCardWith("sum-unnamed", {}, { due_at: PAST }, "");

    const cards = await getDueCards(db, user);
    const summary = await getDueSummary(db, user);

    expect(summary.dueCount).toBe(cards.length);
    expect(summary.domains).toEqual(
      [...new Set(cards.map((c) => c.domain).filter(Boolean))].sort(),
    );
    expect(summary.dueCount).toBe(2); // sum-due and sum-unnamed
    expect(summary.domains).toEqual(["math"]);
    expect(summary.cardsInDeck).toBe(9);
  });

  it("reports an empty deck as all zeros", async () => {
    await createToken(db, { slug: "sum-solo", concept: "solo" });
    const summary = await getDueSummary(db, "nobody");
    expect(summary).toEqual({ dueCount: 0, domains: [], cardsInDeck: 0 });
  });

  it("reads all three numbers in one statement", async () => {
    const counter = { count: 0 };
    await getDueSummary(countPrepares(db, counter), "carol");
    expect(counter.count).toBe(1);
  });
});
