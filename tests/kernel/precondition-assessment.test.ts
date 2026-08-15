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
  getPreconditionCandidates,
  heldAtomIds,
  installKvtTile,
  liftPreconditionBury,
  openDatabase,
  PRECONDITION_BURIED_REASON,
  PRECONDITION_BURIED_UNTIL,
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

    const atom001 = preconds.find((p) => p.atomId === "01K3X9A7R4B8C1D2E3F4G5A001");
    expect(atom001).toBeDefined();
    expect(atom001?.title).toBe("Lichtstrahl und Einfallslot");
    expect(atom001?.assessmentState).toBe("learning");
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

    expect(card.buried_until).toBe(PRECONDITION_BURIED_UNTIL);
    expect(card.buried_reason).toBe(PRECONDITION_BURIED_REASON);
    // Invariant: FSRS parameters are untouched!
    expect(card.stability).toBe(0);
    expect(card.difficulty).toBe(0.5);
    expect(card.reps).toBe(0);
    expect(card.state).toBe("new");

    // 3. Invariant: Atom is strictly NOT held because reps == 0
    const held = await heldAtomIds(db, user);
    expect(held.has(atomId)).toBe(false);

    // 4. Invariant: Buried card does not enter the active review queue
    const queue = await buildReviewQueue(db, { userId: user });
    const inQueue = queue.items.some((i) => i.cardId === result.cardId);
    expect(inQueue).toBe(false);

    // 5. Candidate status reports 'buried_known'
    const preconds = await getPreconditionCandidates(
      db,
      user,
      "de-by:realschule-optik",
    );
    const atomCandidate = preconds.find((p) => p.atomId === atomId);
    expect(atomCandidate?.assessmentState).toBe("buried_known");
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

    // Candidate status reports 'learning'
    const preconds = await getPreconditionCandidates(
      db,
      user,
      "de-by:realschule-optik",
    );
    const atomCandidate = preconds.find((p) => p.atomId === atomId);
    expect(atomCandidate?.assessmentState).toBe("learning");
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
