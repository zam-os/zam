import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assessPrecondition,
  bonusCandidates,
  buildReviewQueue,
  type Database,
  enrolBonusAtom,
  enrolBundledCell,
  getBundledCellsWithStatus,
  getBundledCellTile,
  getPreconditionCandidates,
  getPullForwardCandidates,
  heldAtomIds,
  installKvtTile,
  listBundledCells,
  openDatabase,
  PRECONDITION_BURIED_REASON,
  pullForwardCards,
} from "../../src/kernel/index.js";

describe("Central Learning Field-Test Slice — Complete End-to-End Lifecycle", () => {
  let tempDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-e2e-slice-"));
    dbPath = join(tempDir, "test.db");
    db = await openDatabase({ dbPath });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("executes the entire 5-phase field test journey end-to-end", async () => {
    const learnerId = "klara-field-tester";

    // ── Phase 1: Bundled Cell Discovery and Enrolment ───────────────────────
    // 1.1 List available bundled learning cells
    const cellList = listBundledCells();
    expect(cellList.length).toBeGreaterThanOrEqual(4);
    const rsCell = cellList.find((c) => c.id === "de-by:realschule-optik");
    expect(rsCell).toBeDefined();
    expect(rsCell?.title).toContain("Optik");

    // 1.2 Check initial enrolment status (all uninstalled/not enrolled)
    const initialStatus = await getBundledCellsWithStatus(db, learnerId);
    expect(initialStatus.every((s) => !s.installed && !s.enrolled)).toBe(true);

    // 1.3 Enrol in Realschule Optik cell
    const enrolResult = await enrolBundledCell(
      db,
      learnerId,
      "de-by:realschule-optik",
    );
    expect(enrolResult.success).toBe(true);
    expect(enrolResult.cardsCreated).toBe(6); // 3 in-scope atoms * 2 items each
    expect(enrolResult.alreadyEnrolled).toBe(false);

    // 1.4 Verify idempotency
    const secondEnrol = await enrolBundledCell(
      db,
      learnerId,
      "de-by:realschule-optik",
    );
    expect(secondEnrol.alreadyEnrolled).toBe(true);
    expect(secondEnrol.cardsCreated).toBe(0);

    // ── Phase 2: Subject-Matter Verification ────────────────────────────────
    const rsTile = getBundledCellTile("de-by:realschule-optik")!;
    expect(rsTile.atoms).toHaveLength(4);
    const atom001 = rsTile.atoms.find((a) => a.slug === "strahlengang-lot")!;
    expect(atom001.practice_items[0]!.question).toContain("Einfallslot");
    expect(atom001.practice_items[0]!.concept).toContain("senkrecht");

    // ── Phase 3: Precondition Self-Assessment (Entry Problem) ───────────────
    // Precondition atom 001 for Realschule Optik
    const preconds = await getPreconditionCandidates(
      db,
      learnerId,
      "de-by:realschule-optik",
    );
    expect(preconds.length).toBeGreaterThanOrEqual(1);

    // Learner says "I already know strahlengang-lot" (decision: known)
    const assessKnown = await assessPrecondition(db, {
      userId: learnerId,
      atomId: atom001.id,
      decision: "known",
    });
    expect(assessKnown.success).toBe(true);
    expect(assessKnown.buried).toBe(true);
    expect(assessKnown.buriedReason).toBe(PRECONDITION_BURIED_REASON);

    // Invariant: Mastery evidence remains honest (reps == 0, not held)
    let held = await heldAtomIds(db, learnerId);
    expect(held.has(atom001.id)).toBe(false);

    // Invariant: Buried card is excluded from the active review queue
    let queue = await buildReviewQueue(db, { userId: learnerId });
    let inQueue = queue.items.some((i) => i.cardId === assessKnown.cardId);
    expect(inQueue).toBe(false);

    // ── Phase 4: Empty Queue & Pull-Forward ─────────────────────────────────
    // Learner wants to voluntarily practice the buried precondition
    const pullCandidates = await getPullForwardCandidates(db, learnerId);
    expect(pullCandidates.length).toBeGreaterThanOrEqual(1);
    const buriedCand = pullCandidates.find((c) => c.cardId === assessKnown.cardId);
    expect(buriedCand).toBeDefined();
    expect(buriedCand?.reason).toBe("precondition_buried");

    // Execute pull-forward
    const pullExec = await pullForwardCards(db, learnerId, [assessKnown.cardId]);
    expect(pullExec.pulledCount).toBe(1);

    // Card is immediately unburied and enters active review queue
    queue = await buildReviewQueue(db, { userId: learnerId });
    inQueue = queue.items.some((i) => i.cardId === assessKnown.cardId);
    expect(inQueue).toBe(true);

    // ── Phase 5: Tier Interaction & Bonus Offer Surface ─────────────────────
    // 5.1 Also install neighbouring Gymnasium 8 cell into KB
    await installKvtTile(db, getBundledCellTile("de-by:gymnasium-8-optik")!);

    // Learner reviews and masters atom 001
    await db
      .prepare(
        "UPDATE cards SET reps = 1, state = 'review', stability = 5 WHERE id = ?",
      )
      .run(assessKnown.cardId);

    held = await heldAtomIds(db, learnerId);
    expect(held.has(atom001.id)).toBe(true);

    // Bonus atom 005 (Reflexionsgesetz, requiring 001) surfaces!
    const bonuses = await bonusCandidates(db, learnerId, {
      inScopeAtomIds: ["01K3X9A7R4B8C1D2E3F4G5A001", "01K3X9A7R4B8C1D2E3F4G5A002", "01K3X9A7R4B8C1D2E3F4G5A003"],
    });
    expect(bonuses.length).toBeGreaterThanOrEqual(1);
    const reflBonus = bonuses.find((b) => b.atomId === "01K3X9A7R4B8C1D2E3F4G5A005");
    expect(reflBonus).toBeDefined();
    expect(reflBonus?.title).toBe("Reflexionsgesetz");

    // Learner accepts and enrols in the bonus atom
    const enrolBonus = await enrolBonusAtom(
      db,
      learnerId,
      "01K3X9A7R4B8C1D2E3F4G5A005",
    );
    expect(enrolBonus.success).toBe(true);
    expect(enrolBonus.cardsCreated).toBeGreaterThanOrEqual(1);

    // Bonus cards are now active in the learner's queue
    queue = await buildReviewQueue(db, { userId: learnerId });
    const hasBonusInQueue = queue.items.some((item) =>
      enrolBonus.cardIds.includes(item.cardId),
    );
    expect(hasBonusInQueue).toBe(true);
  });
});
