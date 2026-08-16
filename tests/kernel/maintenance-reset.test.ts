import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearTokenMaintenance,
  createToken,
  type Database,
  ensureCard,
  evaluateRating,
  getCard,
  getDueCards,
  getTokenBySlug,
  openDatabase,
  resetCardsForToken,
  setTokenMaintenance,
} from "../../src/kernel/index.js";
import { buildReviewQueue } from "../../src/kernel/scheduler/queue.js";

const USER = "maintenance-tester";

describe("token maintenance state (ADR 2026-07-18)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-maintenance-"));
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

  it("set/clear round-trips and stamps a reason", async () => {
    const token = await createToken(db, {
      slug: "maint-a",
      concept: "Concept A",
    });
    expect(token.maintenance_at).toBeNull();

    const flagged = await setTokenMaintenance(
      db,
      "maint-a",
      "absent from re-import of output-contract.md",
    );
    expect(flagged.maintenance_at).toBeTruthy();
    expect(flagged.maintenance_reason).toBe(
      "absent from re-import of output-contract.md",
    );

    const cleared = await clearTokenMaintenance(db, "maint-a");
    expect(cleared.maintenance_at).toBeNull();
    expect(cleared.maintenance_reason).toBeNull();
  });

  it("excludes a maintenance token's cards from the queue and due list, and restores them on clear", async () => {
    const token = await createToken(db, {
      slug: "maint-queued",
      concept: "Queued concept",
    });
    await ensureCard(db, token.id, USER);

    // New card appears in the queue while healthy.
    let queue = await buildReviewQueue(db, { userId: USER });
    expect(queue.items.some((item) => item.slug === "maint-queued")).toBe(true);

    await setTokenMaintenance(db, "maint-queued", "stale source link");
    queue = await buildReviewQueue(db, { userId: USER });
    expect(queue.items.some((item) => item.slug === "maint-queued")).toBe(
      false,
    );

    // Due leg too: rate the card into review state first, then flag.
    await clearTokenMaintenance(db, "maint-queued");
    const card = await getCard(db, token.id, USER);
    if (!card) throw new Error("card missing");
    await evaluateRating(db, {
      cardId: card.id,
      tokenId: token.id,
      userId: USER,
      rating: 3,
    });
    const future = "2027-01-01T00:00:00.000Z";
    expect(
      (await getDueCards(db, USER, future)).some(
        (due) => due.slug === "maint-queued",
      ),
    ).toBe(true);
    await setTokenMaintenance(db, "maint-queued", "stale source link");
    expect(
      (await getDueCards(db, USER, future)).some(
        (due) => due.slug === "maint-queued",
      ),
    ).toBe(false);
  });

  it("migrates an existing database (M014 idempotent)", async () => {
    // openDatabase in beforeEach already ran migrations; reopening must not
    // fail and the columns must exist.
    await db.close();
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
    const cols = (await db.pragma("table_info(tokens)")) as Array<{
      name: string;
    }>;
    expect(cols.some((c) => c.name === "maintenance_at")).toBe(true);
    expect(cols.some((c) => c.name === "maintenance_reason")).toBe(true);
  });
});

describe("resetCardsForToken (ADR 2026-07-18)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-reset-"));
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

  it("returns every user's card to a brand-new learning state", async () => {
    const token = await createToken(db, {
      slug: "reset-me",
      concept: "Concept whose meaning changed",
    });
    await ensureCard(db, token.id, "user-one");
    await ensureCard(db, token.id, "user-two");

    // Progress user-one's card so the reset has something to undo.
    const card = await getCard(db, token.id, "user-one");
    if (!card) throw new Error("card missing");
    await evaluateRating(db, {
      cardId: card.id,
      tokenId: token.id,
      userId: "user-one",
      rating: 3,
    });
    const progressed = await getCard(db, token.id, "user-one");
    expect(progressed?.reps).toBeGreaterThan(0);
    expect(progressed?.state).not.toBe("new");

    const resetCount = await resetCardsForToken(db, token.id);
    expect(resetCount).toBe(2);

    for (const user of ["user-one", "user-two"]) {
      const fresh = await getCard(db, token.id, user);
      if (!fresh) throw new Error("card missing after reset");
      expect(fresh.state).toBe("new");
      expect(fresh.reps).toBe(0);
      expect(fresh.lapses).toBe(0);
      expect(fresh.stability).toBe(0);
      expect(fresh.difficulty).toBe(0.5);
      expect(fresh.learning_step).toBeNull();
      expect(fresh.last_review_at).toBeNull();
    }
  });

  it("leaves the prerequisite-derived blocked flag untouched", async () => {
    const token = await createToken(db, {
      slug: "reset-blocked",
      concept: "Blocked concept",
    });
    await ensureCard(db, token.id, USER);
    const card = await getCard(db, token.id, USER);
    if (!card) throw new Error("card missing");
    await db.prepare("UPDATE cards SET blocked = 1 WHERE id = ?").run(card.id);

    await resetCardsForToken(db, token.id);
    const after = await getCard(db, token.id, USER);
    expect(after?.blocked).toBe(1);
  });

  it("does not touch maintenance token metadata", async () => {
    const token = await createToken(db, {
      slug: "reset-meta",
      concept: "Meta concept",
    });
    await ensureCard(db, token.id, USER);
    await setTokenMaintenance(db, "reset-meta", "why not");
    await resetCardsForToken(db, token.id);
    const t = await getTokenBySlug(db, "reset-meta");
    expect(t?.maintenance_at).toBeTruthy();
  });
});
