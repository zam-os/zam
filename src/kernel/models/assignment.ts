/**
 * Assignment repository — typed wrappers around the assignments table.
 *
 * ADR 2026-07-04 Decision 10:
 * An assignment binds while it stands (learner cannot detach the card).
 * When withdrawn or completed, the card and its full FSRS history stay
 * with the learner to keep, detach, or delete.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { ensureCard } from "./card.js";

export interface Assignment {
  id: string;
  token_id: string;
  assigner_id: string;
  assignee_id: string;
  due_date: string | null;
  created_at: string;
  withdrawn_at: string | null;
}

export interface CreateAssignmentInput {
  tokenId: string;
  assignerId: string;
  assigneeId: string;
  dueDate?: string | null;
}

/**
 * Create a new assignment for a token to a learner.
 * Automatically ensures a card exists for the learner and binds it.
 */
export async function createAssignment(
  db: Database,
  input: CreateAssignmentInput,
): Promise<Assignment> {
  const id = ulid();
  const now = new Date().toISOString();

  const assignment: Assignment = {
    id,
    token_id: input.tokenId,
    assigner_id: input.assignerId,
    assignee_id: input.assigneeId,
    due_date: input.dueDate ?? null,
    created_at: now,
    withdrawn_at: null,
  };

  await db.transaction(async (tx) => {
    await tx
      .prepare(
        `INSERT INTO assignments (id, token_id, assigner_id, assignee_id, due_date, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.tokenId,
        input.assignerId,
        input.assigneeId,
        input.dueDate ?? null,
        now,
      );

    // Ensure a card exists for the assignee and bind it to this assignment
    const card = await ensureCard(tx, input.tokenId, input.assigneeId);
    await tx
      .prepare(
        // Clearing detached_at is deliberate: an assignment binds, so it
        // overrides an earlier "not for me" (ADR Decision 10). The learner
        // may decline again once the assignment is withdrawn.
        "UPDATE cards SET assigned_by = ?, assignment_id = ?, detached_at = NULL WHERE id = ?",
      )
      .run(input.assignerId, id, card.id);
  });

  return assignment;
}

/**
 * Withdraw an assignment.
 * Once withdrawn, the card and full learning history remain with the learner,
 * but the card is no longer bound (can be detached or deleted by the learner).
 */
export async function withdrawAssignment(
  db: Database,
  assignmentId: string,
  assignerId?: string,
): Promise<Assignment> {
  const assignment = (await db
    .prepare("SELECT * FROM assignments WHERE id = ?")
    .get(assignmentId)) as Assignment | undefined;

  if (!assignment) {
    throw new Error(`Assignment not found: ${assignmentId}`);
  }

  if (assignerId && assignment.assigner_id !== assignerId) {
    throw new Error(
      `Permission denied: only assigner ${assignment.assigner_id} may withdraw this assignment.`,
    );
  }

  if (assignment.withdrawn_at !== null) {
    throw new Error(`Assignment already withdrawn: ${assignmentId}`);
  }

  const now = new Date().toISOString();
  await db
    .prepare("UPDATE assignments SET withdrawn_at = ? WHERE id = ?")
    .run(now, assignmentId);

  return {
    ...assignment,
    withdrawn_at: now,
  };
}

/**
 * Get an assignment by ID.
 */
export async function getAssignment(
  db: Database,
  id: string,
): Promise<Assignment | undefined> {
  return (await db.prepare("SELECT * FROM assignments WHERE id = ?").get(id)) as
    | Assignment
    | undefined;
}

/**
 * List all assignments assigned to a specific learner.
 */
export async function listAssignmentsForLearner(
  db: Database,
  assigneeId: string,
): Promise<Assignment[]> {
  return (await db
    .prepare(
      "SELECT * FROM assignments WHERE assignee_id = ? ORDER BY created_at DESC",
    )
    .all(assigneeId)) as Assignment[];
}

/**
 * List all assignments created by a specific assigner.
 */
export async function listAssignmentsByAssigner(
  db: Database,
  assignerId: string,
): Promise<Assignment[]> {
  return (await db
    .prepare(
      "SELECT * FROM assignments WHERE assigner_id = ? ORDER BY created_at DESC",
    )
    .all(assignerId)) as Assignment[];
}
