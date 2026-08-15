/** Sibling-aware queue suppression for cards rendered from the same note. */

import type { Database } from "../db/types.js";
import { getStudyWorkloadSettings } from "./study-settings.js";

export interface BurySiblingResult {
  buried: number;
  until: string | null;
}

/** Start of the next local calendar day, represented as an ISO instant. */
export function nextLocalDay(now: Date): string {
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  return next.toISOString();
}

/**
 * Bury eligible new/review siblings after a rating.
 *
 * Short-step learning and relearning siblings intentionally remain available:
 * their same-day steps are already in progress and must not be deferred.
 */
export async function burySiblingCards(
  db: Database,
  input: {
    cardId: string;
    tokenId: string;
    userId: string;
    now: Date;
  },
): Promise<BurySiblingResult> {
  const settings = await getStudyWorkloadSettings(db, input.userId);
  if (!settings.buryNewSiblings && !settings.buryReviewSiblings) {
    return { buried: 0, until: null };
  }

  const binding = (await db
    .prepare(
      `SELECT note_guid FROM imported_card_bindings
        WHERE token_id = ? AND note_guid IS NOT NULL AND note_guid <> ''
        LIMIT 1`,
    )
    .get(input.tokenId)) as { note_guid: string } | undefined;
  if (!binding) return { buried: 0, until: null };

  const until = nextLocalDay(input.now);
  const result = await db
    .prepare(
      `UPDATE cards
          SET buried_until = ?, buried_reason = 'sibling'
        WHERE user_id = ?
          AND id <> ?
          AND token_id IN (
            SELECT token_id FROM imported_card_bindings WHERE note_guid = ?
          )
          AND (
            (state = 'new' AND ? = 1) OR
            (state = 'review' AND ? = 1)
          )
          -- A day-long sibling bury must not overwrite a precondition claim:
          -- doing so would shorten a three-week deferral to tomorrow and lose
          -- the record that the learner claimed the atom at all. Narrow today
          -- (KVT items carry no Anki binding), but the invariant is the point.
          AND (buried_reason IS NULL OR buried_reason = 'sibling')`,
    )
    .run(
      until,
      input.userId,
      input.cardId,
      binding.note_guid,
      settings.buryNewSiblings ? 1 : 0,
      settings.buryReviewSiblings ? 1 : 0,
    );
  return { buried: result.changes, until: result.changes > 0 ? until : null };
}

/** Make all temporarily buried sibling cards visible again for a learner. */
export async function unburySiblingCards(
  db: Database,
  userId: string,
): Promise<number> {
  const result = await db
    .prepare(
      `UPDATE cards
          SET buried_until = NULL, buried_reason = NULL
        WHERE user_id = ? AND buried_reason = 'sibling'`,
    )
    .run(userId);
  return result.changes;
}
