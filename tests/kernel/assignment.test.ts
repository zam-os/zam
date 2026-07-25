import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createAssignment,
  createToken,
  type Database,
  deleteCardForUser,
  evaluateRating,
  getCard,
  listAssignmentsByAssigner,
  listAssignmentsForLearner,
  openDatabase,
  withdrawAssignment,
} from "../../src/kernel/index.js";

describe("Phase D — Knowledge Assignments (ADR Decision 10)", () => {
  let db: Database;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-assignment-"));
    db = await openDatabase({
      dbPath: join(tempDir, "assignment.db"),
    });
  });

  afterEach(async () => {
    await db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("creates an assignment and binds a card for the assignee", async () => {
    const token = await createToken(db, {
      slug: "assigned-token",
      concept: "Assigned Knowledge Concept",
    });

    const assignment = await createAssignment(db, {
      tokenId: token.id,
      assignerId: "lead_alice",
      assigneeId: "learner_bob",
      dueDate: "2026-12-31T23:59:59Z",
    });

    expect(assignment.id).toBeDefined();
    expect(assignment.token_id).toBe(token.id);
    expect(assignment.assigner_id).toBe("lead_alice");
    expect(assignment.assignee_id).toBe("learner_bob");
    expect(assignment.due_date).toBe("2026-12-31T23:59:59Z");
    expect(assignment.withdrawn_at).toBeNull();

    // Verify card was automatically created and bound for learner_bob
    const card = await getCard(db, token.id, "learner_bob");
    expect(card).toBeDefined();
    expect(card?.assigned_by).toBe("lead_alice");
    expect(card?.assignment_id).toBe(assignment.id);
  });

  it("prevents the learner from detaching an actively assigned card", async () => {
    const token = await createToken(db, {
      slug: "protected-token",
      concept: "Protected Concept",
    });

    await createAssignment(db, {
      tokenId: token.id,
      assignerId: "lead_alice",
      assigneeId: "learner_bob",
    });

    // Learner attempts to detach/delete card while assignment is active
    await expect(
      deleteCardForUser(db, token.id, "learner_bob"),
    ).rejects.toThrow("Cannot detach card: card is bound by an active assignment.");
  });

  it("allows card detachment after the assignment is withdrawn, preserving review history", async () => {
    const token = await createToken(db, {
      slug: "withdrawable-token",
      concept: "Withdrawable Concept",
    });

    const assignment = await createAssignment(db, {
      tokenId: token.id,
      assignerId: "lead_alice",
      assigneeId: "learner_bob",
    });

    const card = await getCard(db, token.id, "learner_bob");
    expect(card).toBeDefined();

    // Bob rates the card to create review log history
    await evaluateRating(db, {
      cardId: card!.id,
      tokenId: token.id,
      userId: "learner_bob",
      rating: 3,
    });

    // Lead withdraws the assignment
    const withdrawn = await withdrawAssignment(db, assignment.id, "lead_alice");
    expect(withdrawn.withdrawn_at).not.toBeNull();

    // Card and learning history still exist for learner_bob
    const cardAfterWithdrawal = await getCard(db, token.id, "learner_bob");
    expect(cardAfterWithdrawal).toBeDefined();

    // Learner can now detach/delete the card
    const deleteResult = await deleteCardForUser(db, token.id, "learner_bob");
    expect(deleteResult.card.id).toBe(card!.id);
    expect(deleteResult.impact.review_logs).toBe(1);

    // Card is deleted for learner_bob
    const cardDeleted = await getCard(db, token.id, "learner_bob");
    expect(cardDeleted).toBeUndefined();
  });

  it("lists assignments by assignee and assigner", async () => {
    const tok1 = await createToken(db, {
      slug: "tok-1",
      concept: "Concept 1",
    });
    const tok2 = await createToken(db, {
      slug: "tok-2",
      concept: "Concept 2",
    });

    await createAssignment(db, {
      tokenId: tok1.id,
      assignerId: "lead_alice",
      assigneeId: "learner_bob",
    });
    await createAssignment(db, {
      tokenId: tok2.id,
      assignerId: "lead_alice",
      assigneeId: "learner_bob",
    });

    const bobAssignments = await listAssignmentsForLearner(db, "learner_bob");
    expect(bobAssignments).toHaveLength(2);

    const aliceAssignments = await listAssignmentsByAssigner(db, "lead_alice");
    expect(aliceAssignments).toHaveLength(2);
  });

  it("rejects withdrawing an assignment by a non-assigner user", async () => {
    const token = await createToken(db, {
      slug: "perm-token",
      concept: "Perm Concept",
    });

    const assignment = await createAssignment(db, {
      tokenId: token.id,
      assignerId: "lead_alice",
      assigneeId: "learner_bob",
    });

    await expect(
      withdrawAssignment(db, assignment.id, "unauthorized_user"),
    ).rejects.toThrow("Permission denied: only assigner lead_alice may withdraw this assignment.");
  });
});
