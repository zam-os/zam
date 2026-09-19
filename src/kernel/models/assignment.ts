/**
 * Assignment repository — typed wrappers around the assignments table.
 *
 * ADR 2026-07-04 Decision 10:
 * An assignment binds while it stands (learner cannot detach the card).
 * When withdrawn or completed, the card and its full FSRS history stay
 * with the learner to keep, detach, or delete.
 *
 * The assigner writes only the assignment row. The assignee's card is
 * created and bound by the assignee's own client the next time it builds a
 * review queue ({@link bindStandingAssignments}). On the team library
 * (ADR 2026-09-04) row-level security lets a learner write nothing but their
 * own learning state, so the assigner *cannot* create the card — and the
 * personal library follows the same rule rather than growing a second path.
 */

import { ulid } from "ulid";
import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";
import { type Card, ensureCard } from "./card.js";

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
 *
 * Writes the assignment row only; the assignee's card appears when their
 * client next builds a queue ({@link bindStandingAssignments}). The
 * assignment binds from this moment regardless — detaching and deleting
 * consult the assignments table, not the card's cached `assignment_id`.
 */
export async function createAssignment(
  db: Database,
  input: CreateAssignmentInput,
): Promise<Assignment> {
  const id = ulid();
  const now = nowIso();

  const assignment: Assignment = {
    id,
    token_id: input.tokenId,
    assigner_id: input.assignerId,
    assignee_id: input.assigneeId,
    due_date: input.dueDate ?? null,
    created_at: now,
    withdrawn_at: null,
  };

  await db
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

  return assignment;
}

/**
 * Materialise the cards for every assignment that stands against
 * `assigneeId` and is not yet bound to an attached card of theirs. Runs as
 * the assignee, so it is the one write path an assignment needs into a
 * learner's state — and the learner performs it themselves.
 *
 * Idempotent: once a card is attached and bound to *a* standing assignment
 * for its token, further standing assignments for the same token leave it
 * alone (no flip-flopping between two assigners). A withdrawn binding, a
 * missing card, or a card the learner had declined earlier is picked up
 * again — clearing `detached_at` is deliberate: an assignment binds, so it
 * overrides an earlier "not for me" (ADR 2026-07-04 Decision 10).
 *
 * Called by the queue builder; returns the cards it bound in this call.
 */
export async function bindStandingAssignments(
  db: Database,
  assigneeId: string,
): Promise<Card[]> {
  const pending = (await db
    .prepare(
      `SELECT * FROM assignments a
        WHERE a.assignee_id = ?
          AND a.withdrawn_at IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM cards c
             WHERE c.user_id = a.assignee_id
               AND c.token_id = a.token_id
               AND c.detached_at IS NULL
               AND c.assignment_id IN (
                 SELECT b.id FROM assignments b WHERE b.withdrawn_at IS NULL))
        ORDER BY a.created_at, a.id`,
    )
    .all(assigneeId)) as Assignment[];
  if (pending.length === 0) return [];

  const bound: Card[] = [];
  await db.transaction(async (tx) => {
    // Two standing assignments for one token: the older binds, the younger
    // waits its turn (it takes over if the older one is withdrawn).
    const tokensBound = new Set<string>();
    for (const assignment of pending) {
      if (tokensBound.has(assignment.token_id)) continue;
      tokensBound.add(assignment.token_id);
      const card = await ensureCard(tx, assignment.token_id, assigneeId);
      await tx
        .prepare(
          "UPDATE cards SET assigned_by = ?, assignment_id = ?, detached_at = NULL WHERE id = ?",
        )
        .run(assignment.assigner_id, assignment.id, card.id);
      bound.push({
        ...card,
        assigned_by: assignment.assigner_id,
        assignment_id: assignment.id,
        detached_at: null,
      });
    }
  });
  return bound;
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

  const now = nowIso();
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
