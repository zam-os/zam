/**
 * Precondition Self-Assessment (Entry Problem).
 *
 * Implements the voluntary self-assessment flow for foundational prerequisites
 * of a learning cell (ADR 2026-08-14, arbitration 2026-08-14):
 *
 * - When a learner states they already know a foundational prerequisite ("Kann ich schon"):
 *   The representative card for that atom is buried (`buried_until = '2099-12-31T23:59:59Z'`,
 *   `buried_reason = 'precondition'`).
 *   FSRS parameters (`stability`, `difficulty`, `reps`, `state`) are NEVER modified.
 *   Because `reps = 0`, the atom is strictly NOT held in `heldAtomIds`, keeping mastery
 *   evidence honest and derived only from observed retrieval.
 *
 * - When a learner chooses to learn the prerequisite ("Bitte mitlernen"):
 *   Any precondition bury is lifted (`buried_until = NULL`, `buried_reason = NULL`),
 *   allowing the card to enter the review queue normally.
 */

import type { Database } from "../db/types.js";
import { ensureCard, updateCard } from "../models/card.js";
import { getBundledCell } from "./bundled-cells.js";

export const PRECONDITION_BURIED_UNTIL = "2099-12-31T23:59:59.000Z";
export const PRECONDITION_BURIED_REASON = "precondition";

export interface PreconditionCandidate {
  atomId: string;
  title: string;
  slug: string;
  description?: string;
  assessmentState: "unassessed" | "buried_known" | "learning";
  cardId?: string;
  tokenId?: string;
  buriedUntil?: string | null;
  buriedReason?: string | null;
  reps: number;
}

export interface AssessPreconditionInput {
  userId: string;
  atomId: string;
  decision: "known" | "learn";
}

export interface AssessPreconditionResult {
  success: boolean;
  atomId: string;
  decision: "known" | "learn";
  cardId: string;
  buried: boolean;
  buriedReason: string | null;
}

interface AtomPrereqRow {
  atom_id: string;
  title: string;
  slug: string;
}

interface RepresentativeTokenRow {
  id: string;
  atom_id: string;
  slug: string;
  title: string;
}

interface CardStateRow {
  id: string;
  token_id: string;
  reps: number;
  buried_until: string | null;
  buried_reason: string | null;
  state: string;
}

/**
 * Get all foundational precondition atoms for a cell or set of atoms,
 * with the learner's current assessment and card status.
 */
export async function getPreconditionCandidates(
  db: Database,
  userId: string,
  cellId?: string,
): Promise<PreconditionCandidate[]> {
  if (!userId.trim()) {
    throw new Error("userId is required for precondition candidates");
  }

  let atomIds: string[] = [];
  if (cellId) {
    const cell = getBundledCell(cellId);
    if (cell) {
      atomIds = cell.inScopeAtomIds;
    }
  }

  let rows: AtomPrereqRow[] = [];
  if (atomIds.length > 0) {
    const placeholders = atomIds.map(() => "?").join(",");
    rows = (await db
      .prepare(
        `SELECT DISTINCT a.id AS atom_id, a.title, a.slug
           FROM atom_prerequisites ap
           JOIN learning_atoms a ON a.id = ap.requires_id
          WHERE ap.atom_id IN (${placeholders})
          ORDER BY a.title`,
      )
      .all(...atomIds)) as AtomPrereqRow[];
  } else {
    // If no specific cell, return all prerequisite atoms that gate other atoms
    rows = (await db
      .prepare(
        `SELECT DISTINCT a.id AS atom_id, a.title, a.slug
           FROM atom_prerequisites ap
           JOIN learning_atoms a ON a.id = ap.requires_id
          ORDER BY a.title`,
      )
      .all()) as AtomPrereqRow[];
  }

  const candidates: PreconditionCandidate[] = [];

  for (const row of rows) {
    // Representative token is lowest ID token for this atom
    const tokenRow = (await db
      .prepare(
        `SELECT id, atom_id, slug, title
           FROM tokens
          WHERE atom_id = ?
          ORDER BY id ASC
          LIMIT 1`,
      )
      .get(row.atom_id)) as RepresentativeTokenRow | undefined;

    if (!tokenRow) continue;

    const cardRow = (await db
      .prepare(
        `SELECT id, token_id, reps, buried_until, buried_reason, state
           FROM cards
          WHERE token_id = ? AND user_id = ?`,
      )
      .get(tokenRow.id, userId)) as CardStateRow | undefined;

    let assessmentState: "unassessed" | "buried_known" | "learning" =
      "unassessed";
    if (cardRow) {
      if (cardRow.buried_reason === PRECONDITION_BURIED_REASON) {
        assessmentState = "buried_known";
      } else {
        assessmentState = "learning";
      }
    }

    candidates.push({
      atomId: row.atom_id,
      title: row.title,
      slug: row.slug,
      assessmentState,
      cardId: cardRow?.id,
      tokenId: tokenRow.id,
      buriedUntil: cardRow?.buried_until,
      buriedReason: cardRow?.buried_reason,
      reps: cardRow?.reps ?? 0,
    });
  }

  return candidates;
}

/**
 * Record a learner's self-assessment decision for a foundational precondition atom.
 */
export async function assessPrecondition(
  db: Database,
  input: AssessPreconditionInput,
): Promise<AssessPreconditionResult> {
  const { userId, atomId, decision } = input;
  if (!userId.trim()) {
    throw new Error("userId is required to assess precondition");
  }
  if (!atomId.trim()) {
    throw new Error("atomId is required to assess precondition");
  }

  // Find representative token
  const tokenRow = (await db
    .prepare(
      `SELECT id FROM tokens
        WHERE atom_id = ?
        ORDER BY id ASC
        LIMIT 1`,
    )
    .get(atomId)) as { id: string } | undefined;

  if (!tokenRow) {
    throw new Error(`No token found for atom: ${atomId}`);
  }

  // Ensure card exists
  const card = await ensureCard(db, tokenRow.id, userId);

  if (decision === "known") {
    // Bury card with precondition reason — do NOT touch FSRS fields or reps
    await updateCard(db, card.id, {
      buried_until: PRECONDITION_BURIED_UNTIL,
      buried_reason: PRECONDITION_BURIED_REASON,
    });

    return {
      success: true,
      atomId,
      decision: "known",
      cardId: card.id,
      buried: true,
      buriedReason: PRECONDITION_BURIED_REASON,
    };
  }

  if (decision === "learn") {
    // If card was buried with precondition reason, lift the bury
    if (card.buried_reason === PRECONDITION_BURIED_REASON) {
      await updateCard(db, card.id, {
        buried_until: null,
        buried_reason: null,
      });
    }

    return {
      success: true,
      atomId,
      decision: "learn",
      cardId: card.id,
      buried: false,
      buriedReason: null,
    };
  }

  throw new Error(`Unknown precondition assessment decision: ${decision}`);
}

/**
 * Lift precondition burying on an atom or card so it can enter the queue.
 */
export async function liftPreconditionBury(
  db: Database,
  userId: string,
  atomId: string,
): Promise<boolean> {
  if (!userId.trim() || !atomId.trim()) return false;

  const result = await db
    .prepare(
      `UPDATE cards
          SET buried_until = NULL,
              buried_reason = NULL
        WHERE user_id = ?
          AND buried_reason = ?
          AND token_id IN (
            SELECT id FROM tokens WHERE atom_id = ?
          )`,
    )
    .run(userId, PRECONDITION_BURIED_REASON, atomId);

  return result.changes > 0;
}
