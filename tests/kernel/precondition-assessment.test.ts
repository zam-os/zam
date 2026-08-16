import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assessPreconditionHandler,
  getPreconditionsHandler,
} from "../../src/cli/bridge-handlers.js";
import {
  assessPrecondition,
  buildReviewQueue,
  type Database,
  enrolBundledCell,
  getCard,
  getBundledCellTile,
  getPreconditionCandidates,
  heldAtomIds,
  installKvtTile,
  liftPreconditionBury,
  openDatabase,
  PRECONDITION_BURIED_REASON,
  PRECONDITION_HORIZON_DAYS,
  PRECONDITION_STAGGER_DAYS,
} from "../../src/kernel/index.js";

describe("Precondition Self-Assessment (Phase 3)", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-precond-test-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("identifies foundational preconditions for a cell", async () => {
    const user = "test-learner";

    // Enrol in Realschule cell
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const preconds = await getPreconditionCandidates(
      db,
      user,
      "de-by:realschule-optik",
    );
    expect(preconds.length).toBeGreaterThanOrEqual(1);

    const atom001 = preconds.find(
      (p) => p.atomId === "01K3X9A7R4B8C1D2E3F4G5A001",
    );
    expect(atom001).toBeDefined();
    expect(atom001?.title).toBe("Lichtstrahl und Einfallslot");
    expect(atom001?.assessmentState).toBe("unassessed");
  });

  it("rejects an unknown cellId instead of listing every prerequisite", async () => {
    await expect(
      getPreconditionCandidates(db, "test-learner", "de-by:does-not-exist"),
    ).rejects.toThrow("Bundled cell not found: de-by:does-not-exist");
  });

  it("accepts assessments only for atoms used as hard preconditions", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    await installKvtTile(db, getBundledCellTile("de-by:bos-10-optik")!);

    // Snellius is now a hard prerequisite in the globally installed BOS graph,
    // but the learner is not enrolled in the BOS target it gates. Installation
    // alone cannot turn unrelated shared content into a self-certified card.
    await expect(
      assessPrecondition(db, {
        userId: user,
        atomId: "01K3X9A7R4B8C1D2E3F4G5A004",
        decision: "known",
      }),
    ).rejects.toThrow("not a hard precondition of the learner's active work");

    const listed = await getPreconditionCandidates(db, user);
    expect(
      listed.some(
        (candidate) => candidate.atomId === "01K3X9A7R4B8C1D2E3F4G5A004",
      ),
    ).toBe(false);
  });

  it("handles 'known' decision by burying card without modifying FSRS state", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";

    // 1. Self-assess as 'known'
    const result = await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });

    expect(result.success).toBe(true);
    expect(result.decision).toBe("known");
    expect(result.buried).toBe(true);
    expect(result.buriedReason).toBe(PRECONDITION_BURIED_REASON);

    // 2. Verify card in database
    const card = (await db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(result.cardId)) as any;

    // A deferral, not an opt-out: the claim is checked on a real date.
    expect(card.buried_until).toBe(result.buriedUntil);
    expect(card.buried_reason).toBe(PRECONDITION_BURIED_REASON);
    const waitDays = (Date.parse(card.buried_until) - Date.now()) / 86_400_000;
    expect(waitDays).toBeGreaterThan(PRECONDITION_HORIZON_DAYS - 1);
    expect(waitDays).toBeLessThan(PRECONDITION_HORIZON_DAYS + 1);
    // Invariant: FSRS parameters are untouched!
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0.5);
    expect(card.reps).toBe(0);
    expect(card.state).toBe("new");

    // 3. Invariant: Atom is strictly NOT held because reps == 0
    const held = await heldAtomIds(db, user);
    expect(held.has(atomId)).toBe(false);

    // 4. Invariant: every live card for the atom is buried, not just the
    // representative. Realschule Optik materialises two items per atom.
    const atomCards = (await db
      .prepare(
        `SELECT c.id, c.buried_reason
           FROM cards c
           JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ? AND t.atom_id = ? AND c.detached_at IS NULL`,
      )
      .all(user, atomId)) as Array<{
      id: string;
      buried_reason: string | null;
    }>;
    expect(atomCards.length).toBe(2);
    expect(
      atomCards.every(
        (card) => card.buried_reason === PRECONDITION_BURIED_REASON,
      ),
    ).toBe(true);

    const queue = await buildReviewQueue(db, { userId: user });
    const buriedIds = new Set(atomCards.map((card) => card.id));
    expect(queue.items.some((item) => buriedIds.has(item.cardId))).toBe(false);

    // 5. Candidate status reports 'buried_known'
    const preconds = await getPreconditionCandidates(
      db,
      user,
      "de-by:realschule-optik",
    );
    const atomCandidate = preconds.find((p) => p.atomId === atomId);
    expect(atomCandidate?.assessmentState).toBe("buried_known");
  });

  /**
   * The owner's rule: cards are created and "even at maximum self-assessment
   * they get asked eventually". A deferral that never ends is an opt-out, and
   * an opt-out removes the only thing that makes an unverified claim safe.
   */
  it("asks the claim eventually — the deferral has an end", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";

    const result = await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });

    const dayBefore = new Date(
      Date.parse(result.buriedUntil as string) - 86_400_000,
    );
    const dayAfter = new Date(
      Date.parse(result.buriedUntil as string) + 86_400_000,
    );

    const before = await buildReviewQueue(db, { userId: user, now: dayBefore });
    expect(before.items.some((item) => item.atomId === atomId)).toBe(false);

    const after = await buildReviewQueue(db, { userId: user, now: dayAfter });
    expect(after.items.some((item) => item.atomId === atomId)).toBe(true);
  });

  it("does not let a replay extend an expired claim or bury retrieved evidence", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";

    const first = await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });
    const repeated = await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });
    expect(repeated.buriedUntil).toBe(first.buriedUntil);

    await db
      .prepare(
        `UPDATE cards SET buried_until = '2000-01-01T00:00:00.000Z'
          WHERE user_id = ? AND token_id IN (
            SELECT id FROM tokens WHERE atom_id = ?
          )`,
      )
      .run(user, atomId);
    await expect(
      assessPrecondition(db, { userId: user, atomId, decision: "known" }),
    ).rejects.toThrow("has expired; retrieve the card now");

    await db
      .prepare(
        `UPDATE cards SET reps = 1, state = 'review'
          WHERE id = ?`,
      )
      .run(first.cardId);
    await expect(
      assessPrecondition(db, { userId: user, atomId, decision: "known" }),
    ).rejects.toThrow("already has retrieval evidence");
  });

  it("staggers deferrals so they do not all return on the same day", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");
    await enrolBundledCell(db, user, "de-by:gymnasium-8-optik");

    const preconds = await getPreconditionCandidates(db, user);
    expect(preconds.length).toBeGreaterThanOrEqual(2);

    const dates: number[] = [];
    for (const candidate of preconds.slice(0, 3)) {
      const result = await assessPrecondition(db, {
        userId: user,
        atomId: candidate.atomId,
        decision: "known",
      });
      dates.push(Date.parse(result.buriedUntil as string));
    }

    // Strictly increasing, by roughly the stagger, so four declined
    // preconditions come back as a trickle rather than as one pile.
    for (let i = 1; i < dates.length; i++) {
      const gapDays = (dates[i]! - dates[i - 1]!) / 86_400_000;
      expect(gapDays).toBeGreaterThan(PRECONDITION_STAGGER_DAYS - 1);
      expect(gapDays).toBeLessThan(PRECONDITION_STAGGER_DAYS + 1);
    }
  });

  it("handles 'learn' decision and lifts precondition bury", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";

    // First mark as known (buried)
    await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });

    // Then switch decision to 'learn'
    const result = await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "learn",
    });

    expect(result.success).toBe(true);
    expect(result.decision).toBe("learn");
    expect(result.buried).toBe(false);
    expect(result.buriedReason).toBeNull();

    // Verify card is unburied in DB
    const card = (await db
      .prepare("SELECT * FROM cards WHERE id = ?")
      .get(result.cardId)) as any;

    expect(card.buried_until).toBeNull();
    expect(card.buried_reason).toBeNull();

    // "learn" lifts the bury; reps are still 0, so the atom stays unassessed
    // until a real retrieval. Enrolment or a learn click is not mastery.
    const preconds = await getPreconditionCandidates(
      db,
      user,
      "de-by:realschule-optik",
    );
    const atomCandidate = preconds.find((p) => p.atomId === atomId);
    expect(atomCandidate?.assessmentState).toBe("unassessed");
  });

  it("supports liftPreconditionBury directly", async () => {
    const user = "test-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const atomId = "01K3X9A7R4B8C1D2E3F4G5A001";
    await assessPrecondition(db, {
      userId: user,
      atomId,
      decision: "known",
    });

    const lifted = await liftPreconditionBury(db, user, atomId);
    expect(lifted).toBe(true);

    // Lifting again returns false (already unburied)
    const liftedAgain = await liftPreconditionBury(db, user, atomId);
    expect(liftedAgain).toBe(false);
  });

  it("handles bridge handlers for precondition assessment", async () => {
    const user = "bridge-learner";
    await enrolBundledCell(db, user, "de-by:realschule-optik");

    const listRes = await getPreconditionsHandler(db, {
      cellId: "de-by:realschule-optik",
      user,
    });
    expect(listRes.success).toBe(true);
    expect(listRes.candidates.length).toBeGreaterThanOrEqual(1);

    const atomId = listRes.candidates[0]!.atomId;

    const assessRes = await assessPreconditionHandler(db, {
      atomId,
      decision: "known",
      user,
    });
    expect(assessRes.success).toBe(true);
    expect(assessRes.decision).toBe("known");
    expect(assessRes.buried).toBe(true);
  });
});
