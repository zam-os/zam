import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  bindStandingAssignments,
  buildReviewQueue,
  createAssignment,
  createToken,
  type Database,
  deleteCardForUser,
  detachCardForUser,
  evaluateRating,
  getCard,
  hasStandingAssignment,
  listAssignmentsByAssigner,
  listAssignmentsForLearner,
  openDatabase,
  withdrawAssignment,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-07-04 Decision 10, as the team library forces it to be
 * (ADR 2026-09-04): the assigner writes only the assignment row; the
 * assignee's own client creates and binds the card when it next builds a
 * queue. The binding holds from the moment the assignment exists.
 */
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

  it("creates the assignment row; the assignee's next queue build binds the card", async () => {
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

    // Nothing was written into Bob's learning state on Alice's behalf …
    expect(await getCard(db, token.id, "learner_bob")).toBeUndefined();
    expect(await hasStandingAssignment(db, token.id, "learner_bob")).toBe(true);

    // … the card appears when Bob's client builds his queue, and is in it.
    const queue = await buildReviewQueue(db, { userId: "learner_bob" });
    const card = await getCard(db, token.id, "learner_bob");
    expect(card).toBeDefined();
    expect(card?.assigned_by).toBe("lead_alice");
    expect(card?.assignment_id).toBe(assignment.id);
    expect(queue.items.map((item) => item.cardId)).toContain(card?.id);

    // Idempotent: a bound card is left alone.
    expect(await bindStandingAssignments(db, "learner_bob")).toEqual([]);
  });

  it("does not flip a card between two standing assignments, and rebinds after a withdrawal", async () => {
    const token = await createToken(db, { slug: "twice", concept: "Twice" });
    const first = await createAssignment(db, {
      tokenId: token.id,
      assignerId: "lead_alice",
      assigneeId: "learner_bob",
    });
    const second = await createAssignment(db, {
      tokenId: token.id,
      assignerId: "lead_carol",
      assigneeId: "learner_bob",
    });

    // One card, bound to one of the two (both were created within the same
    // millisecond, so which one is not the point — stability is).
    const bound = await bindStandingAssignments(db, "learner_bob");
    expect(bound).toHaveLength(1);
    let card = await getCard(db, token.id, "learner_bob");
    const winner = [first, second].find((a) => a.id === card?.assignment_id);
    const loser = winner === first ? second : first;
    expect(winner).toBeDefined();
    expect(await bindStandingAssignments(db, "learner_bob")).toEqual([]);
    expect((await getCard(db, token.id, "learner_bob"))?.assignment_id).toBe(
      winner?.id,
    );

    // The binding assigner withdraws; the other assignment still binds.
    await withdrawAssignment(db, winner!.id, winner!.assigner_id);
    await expect(
      detachCardForUser(db, token.id, "learner_bob"),
    ).rejects.toThrow(/active assignment/i);
    expect(await bindStandingAssignments(db, "learner_bob")).toHaveLength(1);
    card = await getCard(db, token.id, "learner_bob");
    expect(card?.assignment_id).toBe(loser.id);
    expect(card?.assigned_by).toBe(loser.assigner_id);

    await withdrawAssignment(db, loser.id, loser.assigner_id);
    expect(await bindStandingAssignments(db, "learner_bob")).toEqual([]);
    expect(await hasStandingAssignment(db, token.id, "learner_bob")).toBe(
      false,
    );
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
    await bindStandingAssignments(db, "learner_bob");

    // Both ways out are refused while the assignment stands. Detach and
    // delete are distinct actions now (ADR Decision 10: keep, detach, or
    // delete), so the binding has to hold against each of them.
    await expect(
      deleteCardForUser(db, token.id, "learner_bob"),
    ).rejects.toThrow(/active assignment/i);
    await expect(
      detachCardForUser(db, token.id, "learner_bob"),
    ).rejects.toThrow(/active assignment/i);
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
    await bindStandingAssignments(db, "learner_bob");

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
    ).rejects.toThrow(
      "Permission denied: only assigner lead_alice may withdraw this assignment.",
    );
  });
});
