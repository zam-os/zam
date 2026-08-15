import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getPullForwardCandidatesHandler,
  pullForwardCardsHandler,
} from "../../src/cli/bridge-handlers.js";
import {
  assessPrecondition,
  buildReviewQueue,
  type Database,
  enrolBundledCell,
  executeReviewAction,
  getPreconditionCandidates,
  getPullForwardCandidates,
  openDatabase,
  PRECONDITION_BURIED_REASON,
  PRECONDITION_READY_REASON,
  pullForwardCards,
} from "../../src/kernel/index.js";

describe("Pull Forward on Empty Queue (Phase 4)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-pull-forward-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("offers a declined precondition, but never ahead of unseen curriculum", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    // Bury Atom 001 as known precondition
    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";
    await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });

    const candidates = await getPullForwardCandidates(db, user);
    expect(candidates.length).toBeGreaterThanOrEqual(1);

    const atom001Candidate = candidates.find((c) => c.atomId === atomId);
    expect(atom001Candidate).toBeDefined();
    expect(atom001Candidate?.reason).toBe("precondition_buried");
    expect(atom001Candidate?.buriedReason).toBe(PRECONDITION_BURIED_REASON);

    // "Keep going" must not answer with the thing the learner just set aside.
    const newCards = candidates.filter((c) => c.reason === "new_in_scope");
    expect(newCards.length).toBeGreaterThan(0);
    for (const fresh of newCards) {
      expect(fresh.priorityScore).toBeGreaterThan(
        atom001Candidate?.priorityScore ?? 0,
      );
    }
    expect(candidates[0]?.reason).toBe("new_in_scope");
  });

  it("does not re-offer an expired precondition marker", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";
    await assessPrecondition(db, { userId: user, atomId, decision: "known" });
    await db
      .prepare(
        `UPDATE cards SET buried_until = '2000-01-01T00:00:00.000Z'
          WHERE user_id = ? AND token_id IN (
            SELECT id FROM tokens WHERE atom_id = ?
          )`,
      )
      .run(user, atomId);

    const candidates = await getPullForwardCandidates(db, user);
    expect(
      candidates.some(
        (candidate) =>
          candidate.atomId === atomId &&
          candidate.reason === "precondition_buried",
      ),
    ).toBe(false);
  });

  it("treats unseen-card acceptance as a session budget, not a fake due-date write", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    const candidate = (
      await getPullForwardCandidates(db, user, { includeFutureDue: false })
    ).find((item) => item.reason === "new_in_scope")!;

    expect((await buildReviewQueue(db, { userId: user, maxNew: 0 })).items).toHaveLength(0);
    const result = await pullForwardCards(db, user, [candidate.cardId]);
    expect(result).toEqual({ pulledCount: 1, cardIds: [candidate.cardId] });
    expect((await buildReviewQueue(db, { userId: user, maxNew: 0 })).items).toHaveLength(0);
    expect(
      (await buildReviewQueue(db, { userId: user, maxNew: 1 })).newCount,
    ).toBe(1);
  });

  it("rejects invalid candidate limits", async () => {
    await expect(
      getPullForwardCandidates(db, "test-learner", { limit: 0 }),
    ).rejects.toThrow("between 1 and 1000");
  });

  it("pulls forward buried precondition cards so they immediately appear in review queue", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";
    const assessRes = await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });

    // Verify card is not in review queue while buried
    let queue = await buildReviewQueue(db, { userId: user });
    let inQueue = queue.items.some((i) => i.cardId === assessRes.cardId);
    expect(inQueue).toBe(false);

    // Pull forward the card
    const pullResult = await pullForwardCards(db, user, [assessRes.cardId]);
    expect(pullResult.pulledCount).toBe(1);
    expect(pullResult.cardIds).toEqual([assessRes.cardId]);

    // Verify card is unburied in DB
    const card = (await db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(assessRes.cardId)) as any;
    expect(card.buried_until).toBeNull();
    expect(card.buried_reason).toBe(PRECONDITION_READY_REASON);

    // Verify card now enters the active review queue!
    queue = await buildReviewQueue(db, { userId: user });
    inQueue = queue.items.some((i) => i.cardId === assessRes.cardId);
    expect(inQueue).toBe(true);

    // The persisted ready marker prevents every surface from asking the same
    // self-assessment question again after the explicit keep-going choice.
    const preconditions = await getPreconditionCandidates(db, user);
    expect(
      preconditions.find((candidate) => candidate.atomId === atomId)
        ?.assessmentState,
    ).toBe("ready");
    expect(
      (await getPullForwardCandidates(db, user)).some(
        (candidate) => candidate.cardId === assessRes.cardId,
      ),
    ).toBe(false);
    expect(await pullForwardCards(db, user, [assessRes.cardId])).toEqual({
      pulledCount: 0,
      cardIds: [],
    });

    await executeReviewAction(db, {
      action: "rate",
      cardId: assessRes.cardId,
      userId: user,
      rating: 3,
    });
    expect(
      await db
        .prepare("SELECT buried_reason FROM cards WHERE id = ?")
        .get(assessRes.cardId),
    ).toEqual({ buried_reason: null });
  });

  it("handles future-due cards and brings due_at to now", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    // Push a reviewed card's due_at 10 days into the future
    const futureDue = new Date(Date.now() + 10 * 86400000).toISOString();
    const firstCard = (await db
      .prepare("SELECT id FROM cards WHERE user_id = ? LIMIT 1")
      .get(user)) as { id: string };

    await db
      .prepare("UPDATE cards SET state = 'review', reps = 1, due_at = ? WHERE id = ?")
      .run(futureDue, firstCard.id);

    const candidates = await getPullForwardCandidates(db, user);
    const candidate = candidates.find((c) => c.cardId === firstCard.id);
    expect(candidate).toBeDefined();
    expect(candidate?.reason).toBe("future_due");

    // Pull forward
    const pullRes = await pullForwardCards(db, user, [firstCard.id]);
    expect(pullRes.pulledCount).toBe(1);

    const updatedCard = (await db
      .prepare("SELECT due_at FROM cards WHERE id = ?")
      .get(firstCard.id)) as { due_at: string };
    expect(new Date(updatedCard.due_at).getTime()).toBeLessThanOrEqual(
      Date.now() + 1000,
    );
  });

  it("works seamlessly through bridge handlers", async () => {
    const user = "bridge-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";
    const assessRes = await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });

    const listRes = await getPullForwardCandidatesHandler(db, { user });
    expect(listRes.success).toBe(true);
    expect(listRes.candidates.length).toBeGreaterThanOrEqual(1);

    const execRes = await pullForwardCardsHandler(db, {
      cardIds: [assessRes.cardId],
      user,
    });
    expect(execRes.success).toBe(true);
    expect(execRes.pulledCount).toBe(1);
  });

  it("excludes detached cards and honors includeFutureDue", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const futureDue = new Date(Date.now() + 10 * 86400000).toISOString();
    const firstCard = (await db
      .prepare("SELECT id FROM cards WHERE user_id = ? LIMIT 1")
      .get(user)) as { id: string };

    await db
      .prepare(
        "UPDATE cards SET state = 'review', reps = 1, due_at = ? WHERE id = ?",
      )
      .run(futureDue, firstCard.id);

    const withFuture = await getPullForwardCandidates(db, user, {
      includeFutureDue: true,
    });
    expect(withFuture.some((c) => c.cardId === firstCard.id)).toBe(true);

    const withoutFuture = await getPullForwardCandidates(db, user, {
      includeFutureDue: false,
    });
    expect(withoutFuture.some((c) => c.cardId === firstCard.id)).toBe(false);

    await db
      .prepare("UPDATE cards SET detached_at = ? WHERE id = ?")
      .run(new Date().toISOString(), firstCard.id);

    const afterDetach = await getPullForwardCandidates(db, user, {
      includeFutureDue: true,
    });
    expect(afterDetach.some((c) => c.cardId === firstCard.id)).toBe(false);

    const pullDetached = await pullForwardCards(db, user, [firstCard.id]);
    expect(pullDetached.pulledCount).toBe(0);
  });
});
