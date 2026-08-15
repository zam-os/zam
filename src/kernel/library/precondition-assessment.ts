/**
 * Precondition Self-Assessment (Entry Problem).
 *
 * Implements the voluntary self-assessment flow for foundational prerequisites
 * of a learning cell (ADR 2026-08-14, arbitration 2026-08-14):
 *
 * - When a learner states they already know a foundational prerequisite ("Kann ich schon"):
 *   Every live card for that atom is buried until a finite date
 *   ({@link preconditionBuriedUntil}) with `buried_reason = 'precondition'`. FSRS
 *   fields are never modified, so `heldAtomIds` still refuses the atom until a
 *   real retrieval — and the claim is checked once the deferral runs out.
 *
 * - When a learner chooses to learn the prerequisite ("Bitte mitlernen"):
 *   Any precondition bury on those cards is lifted, so they can enter the queue.
 *
 * A card that exists after enrolment is not a decision. `unassessed` is `reps = 0`
 * and no precondition bury — enrolment must not look like "chose to learn".
 */

import type { Database } from "../db/types.js";
import { ensureCard } from "../models/card.js";
import { getBundledCell } from "./bundled-cells.js";

export const PRECONDITION_BURIED_REASON = "precondition";

/**
 * How long a self-assessed precondition waits before it is asked for real.
 *
 * **This horizon is the whole mechanism.** The owner's rule is that a card is
 * deferred, not removed — "even at maximum self-assessment it gets asked
 * eventually". Without a finite horizon the feature is not a deferral but an
 * opt-out, and the safety argument for allowing self-assessment at all
 * disappears: what makes an unverified claim acceptable is that it is verified
 * later, cheaply, once it no longer blocks anything.
 *
 * Three weeks is a pilot value, not a finding. It is long enough that four
 * declined preconditions do not delay today's work, short enough that a wrong
 * claim surfaces inside one field-test cycle rather than after it. Change it
 * when learner feedback says so — that is what it is here for.
 */
export const PRECONDITION_HORIZON_DAYS = 21;

/**
 * Extra days per precondition the learner already deferred.
 *
 * Burying every declined precondition to the same day only moves the pile-up
 * the feature exists to prevent: four preconditions declined on Monday would
 * all come back on the same Monday three weeks later. Each further deferral
 * lands a few days after the previous one, so they return as a trickle.
 */
export const PRECONDITION_STAGGER_DAYS = 4;

/**
 * When a newly declined precondition should come back, given how many the
 * learner has already deferred. Deterministic — no randomness in scheduling.
 */
export function preconditionBuriedUntil(
  existingDeferrals: number,
  now: Date = new Date(),
): string {
  const days =
    PRECONDITION_HORIZON_DAYS +
    Math.max(0, existingDeferrals) * PRECONDITION_STAGGER_DAYS;
  return new Date(now.getTime() + days * 86_400_000).toISOString();
}

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
  /** When the claim gets checked. Never null for a `known` decision. */
  buriedUntil: string | null;
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
    if (!cell) {
      throw new Error(`Bundled cell not found: ${cellId}`);
    }
    atomIds = cell.inScopeAtomIds;
    if (atomIds.length === 0) {
      return [];
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

    const cardRows = (await db
      .prepare(
        `SELECT c.id, c.token_id, c.reps, c.buried_until, c.buried_reason
           FROM cards c
           JOIN tokens t ON t.id = c.token_id
          WHERE t.atom_id = ?
            AND c.user_id = ?
            AND c.detached_at IS NULL
          ORDER BY c.id ASC`,
      )
      .all(row.atom_id, userId)) as CardStateRow[];

    const representativeCard =
      cardRows.find((card) => card.token_id === tokenRow.id) ?? cardRows[0];

    let assessmentState: "unassessed" | "buried_known" | "learning" =
      "unassessed";
    if (
      cardRows.some((card) => card.buried_reason === PRECONDITION_BURIED_REASON)
    ) {
      assessmentState = "buried_known";
    } else if (cardRows.some((card) => card.reps > 0)) {
      assessmentState = "learning";
    }

    candidates.push({
      atomId: row.atom_id,
      title: row.title,
      slug: row.slug,
      assessmentState,
      cardId: representativeCard?.id,
      tokenId: tokenRow.id,
      buriedUntil: representativeCard?.buried_until,
      buriedReason: representativeCard?.buried_reason,
      reps: representativeCard?.reps ?? 0,
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

  const tokenRows = (await db
    .prepare(
      `SELECT id FROM tokens
        WHERE atom_id = ?
        ORDER BY id ASC`,
    )
    .all(atomId)) as Array<{ id: string }>;

  if (tokenRows.length === 0) {
    throw new Error(`No token found for atom: ${atomId}`);
  }

  const cards = [];
  for (const tokenRow of tokenRows) {
    cards.push(await ensureCard(db, tokenRow.id, userId));
  }
  const representative = cards[0]!;

  if (decision === "known") {
    // Count the atoms already deferred, not the cards: an atom with three
    // practice items is one claim, and counting rows would push its own
    // successors weeks away.
    const deferred = (await db
      .prepare(
        `SELECT COUNT(DISTINCT t.atom_id) AS n
           FROM cards c
           JOIN tokens t ON t.id = c.token_id
          WHERE c.user_id = ?
            AND c.buried_reason = ?
            AND t.atom_id IS NOT NULL
            AND t.atom_id <> ?`,
      )
      .get(userId, PRECONDITION_BURIED_REASON, atomId)) as { n: number };

    const buriedUntil = preconditionBuriedUntil(deferred.n);
    const placeholders = tokenRows.map(() => "?").join(",");
    await db
      .prepare(
        `UPDATE cards
            SET buried_until = ?,
                buried_reason = ?
          WHERE user_id = ?
            AND token_id IN (${placeholders})
            AND detached_at IS NULL`,
      )
      .run(
        buriedUntil,
        PRECONDITION_BURIED_REASON,
        userId,
        ...tokenRows.map((row) => row.id),
      );

    return {
      success: true,
      atomId,
      decision: "known",
      cardId: representative.id,
      buried: true,
      buriedUntil,
      buriedReason: PRECONDITION_BURIED_REASON,
    };
  }

  if (decision === "learn") {
    await liftPreconditionBury(db, userId, atomId);

    return {
      success: true,
      atomId,
      decision: "learn",
      cardId: representative.id,
      buried: false,
      buriedUntil: null,
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
