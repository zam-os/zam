/**
 * Atom sibling admission and presentation records.
 *
 * At most one distinct practice item of a learning atom is shown to one
 * learner on one local learning day. A queue fetch is not an exposure;
 * reservation/confirmation happens immediately before display. Abandoned
 * reservations release the slot and do not count as presentations.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { getCardById } from "../models/card.js";
import { getSetting } from "../models/settings.js";
import { getTokenById } from "../models/token.js";

export const TIMEZONE_SETTING = "system.timezone";

export class AtomSiblingOccupiedError extends Error {
  readonly atomId: string;
  readonly occupyingCardId: string;

  constructor(atomId: string, occupyingCardId: string) {
    super("Another item of this atom was already presented today");
    this.name = "AtomSiblingOccupiedError";
    this.atomId = atomId;
    this.occupyingCardId = occupyingCardId;
  }
}

export class CardNotDueError extends Error {
  readonly cardId: string;
  readonly dueAt: string;

  constructor(cardId: string, dueAt: string) {
    super("This card is no longer due");
    this.name = "CardNotDueError";
    this.cardId = cardId;
    this.dueAt = dueAt;
  }
}

export class CardNotReviewableError extends Error {
  readonly cardId: string;
  readonly editorialState: string;

  constructor(cardId: string, editorialState: string) {
    super(`This card's token is ${editorialState}, not published`);
    this.name = "CardNotReviewableError";
    this.cardId = cardId;
    this.editorialState = editorialState;
  }
}

/**
 * Epoch milliseconds of a stored timestamp. The kernel writes ISO strings, but
 * SQLite's `datetime('now')` (schema defaults, older rows) has no zone marker
 * and is UTC; `Date.parse` would read it as local time and misjudge a due date
 * by the learner's UTC offset.
 */
export function parseStoredTimestamp(value: string): number {
  const sqliteUtc = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
  return Date.parse(
    sqliteUtc.test(value) ? `${value.replace(" ", "T")}Z` : value,
  );
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function hostTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Calendar date YYYY-MM-DD in the given IANA time zone. */
export function localLearningDay(now: Date, timeZone: string): string {
  if (!isValidTimeZone(timeZone)) {
    throw new Error(`Invalid time zone: ${timeZone}`);
  }
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  if (!year || !month || !day) {
    throw new Error(`Could not derive a local learning day in ${timeZone}`);
  }
  return `${year}-${month}-${day}`;
}

export async function resolvePresentationTimeZone(
  db: Database,
  override?: string,
): Promise<string> {
  const candidate =
    override?.trim() || (await getSetting(db, TIMEZONE_SETTING));
  if (candidate && isValidTimeZone(candidate)) return candidate;
  return hostTimeZone();
}

export interface CardPresentation {
  id: string;
  user_id: string;
  card_id: string;
  token_id: string;
  atom_id: string | null;
  session_id: string | null;
  learning_day: string;
  time_zone: string;
  reserved_at: string;
  presented_at: string | null;
  abandoned_at: string | null;
  /** Attempt id currently handed out for this presentation. */
  attempt_id: string | null;
}

export interface AdmitPresentationInput {
  userId: string;
  cardId: string;
  sessionId?: string | null;
  timeZone?: string;
  now?: Date;
  /** When true (default), this is a confirmed display, not a hold. */
  confirm?: boolean;
}

export interface PresentationAdmission {
  /**
   * Attempt id for the rating or record-only step that follows this display.
   * Surfaces pass it to submit so a retried submit stays one review, while a
   * later admission of the same card (a learning step later the same day)
   * receives a fresh id once this one is consumed.
   */
  attemptId: string;
  /** Row id of the presentation; one per card per learner per learning day. */
  presentationId: string;
  cardId: string;
  tokenId: string;
  atomId: string | null;
  learningDay: string;
  timeZone: string;
  presented: boolean;
}

interface OccupyingRow {
  id: string;
  card_id: string;
  presented_at: string | null;
  attempt_id: string | null;
}

async function occupyingRows(
  db: Database,
  userId: string,
  learningDay: string,
  atomId: string,
): Promise<OccupyingRow[]> {
  return (await db
    .prepare(
      `SELECT id, card_id, presented_at, attempt_id
         FROM card_presentations
        WHERE user_id = ?
          AND learning_day = ?
          AND atom_id = ?
          AND abandoned_at IS NULL`,
    )
    .all(userId, learningDay, atomId)) as OccupyingRow[];
}

/**
 * The attempt id a re-admitted presentation hands out. A pending id (no
 * `review_attempts` row yet) is reused so a retried submit stays idempotent;
 * a consumed one (rated, recorded or in conflict) means the learner is
 * attempting the card again, which is new evidence and gets a fresh id.
 */
async function currentAttemptId(
  db: Database,
  presentationId: string,
  existingAttemptId: string | null,
): Promise<string> {
  if (existingAttemptId) {
    const consumed = await db
      .prepare("SELECT 1 FROM review_attempts WHERE id = ?")
      .get(existingAttemptId);
    if (!consumed) return existingAttemptId;
  }
  const fresh = ulid();
  await db
    .prepare("UPDATE card_presentations SET attempt_id = ? WHERE id = ?")
    .run(fresh, presentationId);
  return fresh;
}

/**
 * Map of atom id → card ids that occupy that atom for this learner today.
 * Used by queue selection so it agrees with admission.
 */
export async function occupyingAtomCards(
  db: Database,
  userId: string,
  learningDay: string,
): Promise<Map<string, Set<string>>> {
  const rows = (await db
    .prepare(
      `SELECT atom_id, card_id
         FROM card_presentations
        WHERE user_id = ?
          AND learning_day = ?
          AND atom_id IS NOT NULL
          AND abandoned_at IS NULL`,
    )
    .all(userId, learningDay)) as Array<{ atom_id: string; card_id: string }>;
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = map.get(row.atom_id) ?? new Set<string>();
    set.add(row.card_id);
    map.set(row.atom_id, set);
  }
  return map;
}

/**
 * The learner and card an admission handed this attempt id out for, or
 * undefined for an id that no presentation issued (agent-minted ids stay
 * valid; they are bound on their first write instead).
 */
export async function findPresentationByAttemptId(
  db: Database,
  attemptId: string,
): Promise<{ user_id: string; card_id: string } | undefined> {
  return (await db
    .prepare(
      "SELECT user_id, card_id FROM card_presentations WHERE attempt_id = ?",
    )
    .get(attemptId)) as { user_id: string; card_id: string } | undefined;
}

export function cardAllowedForAtom(
  cardId: string,
  atomId: string | null | undefined,
  occupying: Map<string, Set<string>>,
): boolean {
  if (!atomId) return true;
  const cards = occupying.get(atomId);
  if (!cards || cards.size === 0) return true;
  return cards.has(cardId);
}

export async function admitPresentation(
  db: Database,
  input: AdmitPresentationInput,
): Promise<PresentationAdmission> {
  const confirm = input.confirm !== false;
  return db.transaction((tx) =>
    admitPresentationInTransaction(tx, input, confirm),
  );
}

export async function admitPresentationInTransaction(
  db: Database,
  input: AdmitPresentationInput,
  confirm = true,
): Promise<PresentationAdmission> {
  const card = await getCardById(db, input.cardId);
  if (!card) throw new Error(`Card not found: ${input.cardId}`);
  if (card.user_id !== input.userId) {
    throw new Error(
      `Card ${input.cardId} does not belong to user ${input.userId}`,
    );
  }
  const token = await getTokenById(db, card.token_id);
  if (!token) throw new Error(`Token not found for card ${input.cardId}`);
  // Only what the queue would build can be shown: a draft is not learning
  // content yet and a deprecated item is not learning content any more.
  if (token.deprecated_at || token.editorial_state !== "published") {
    throw new CardNotReviewableError(
      card.id,
      token.deprecated_at ? "deprecated" : token.editorial_state,
    );
  }

  const now = input.now ?? new Date();
  if (
    card.last_review_at &&
    parseStoredTimestamp(card.due_at) > now.getTime()
  ) {
    throw new CardNotDueError(card.id, card.due_at);
  }
  const timeZone = await resolvePresentationTimeZone(db, input.timeZone);
  const learningDay = localLearningDay(now, timeZone);
  const nowISO = now.toISOString();
  const atomId = token.atom_id;

  if (atomId) {
    const occupying = await occupyingRows(
      db,
      input.userId,
      learningDay,
      atomId,
    );
    const foreign = occupying.find((row) => row.card_id !== card.id);
    if (foreign) {
      throw new AtomSiblingOccupiedError(atomId, foreign.card_id);
    }
    const existing = occupying.find((row) => row.card_id === card.id);
    if (existing) {
      if (confirm && !existing.presented_at) {
        await db
          .prepare(
            `UPDATE card_presentations
                SET presented_at = ?
              WHERE id = ? AND presented_at IS NULL AND abandoned_at IS NULL`,
          )
          .run(nowISO, existing.id);
      }
      if (input.sessionId) {
        await db
          .prepare(
            `UPDATE card_presentations
                SET session_id = COALESCE(session_id, ?)
              WHERE id = ?`,
          )
          .run(input.sessionId, existing.id);
      }
      return {
        attemptId: await currentAttemptId(db, existing.id, existing.attempt_id),
        presentationId: existing.id,
        cardId: card.id,
        tokenId: token.id,
        atomId,
        learningDay,
        timeZone,
        presented: confirm || existing.presented_at !== null,
      };
    }
  } else if (confirm) {
    const existing = (await db
      .prepare(
        `SELECT id, card_id, presented_at, attempt_id
           FROM card_presentations
          WHERE user_id = ?
            AND card_id = ?
            AND learning_day = ?
            AND abandoned_at IS NULL
          ORDER BY reserved_at DESC
          LIMIT 1`,
      )
      .get(input.userId, card.id, learningDay)) as OccupyingRow | undefined;
    if (existing) {
      if (!existing.presented_at) {
        await db
          .prepare(
            `UPDATE card_presentations
                SET presented_at = ?
              WHERE id = ? AND presented_at IS NULL`,
          )
          .run(nowISO, existing.id);
      }
      return {
        attemptId: await currentAttemptId(db, existing.id, existing.attempt_id),
        presentationId: existing.id,
        cardId: card.id,
        tokenId: token.id,
        atomId: null,
        learningDay,
        timeZone,
        presented: true,
      };
    }
  }

  const id = ulid();
  const attemptId = ulid();
  await db
    .prepare(
      `INSERT INTO card_presentations (
         id, user_id, card_id, token_id, atom_id, session_id,
         learning_day, time_zone, reserved_at, presented_at, attempt_id,
         created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.userId,
      card.id,
      token.id,
      atomId,
      input.sessionId ?? null,
      learningDay,
      timeZone,
      nowISO,
      confirm ? nowISO : null,
      attemptId,
      nowISO,
    );

  return {
    attemptId,
    presentationId: id,
    cardId: card.id,
    tokenId: token.id,
    atomId,
    learningDay,
    timeZone,
    presented: confirm,
  };
}

/**
 * Release a hold that never became a display. Accepts the presentation id or
 * the attempt id the admission handed out.
 */
export async function abandonPresentation(
  db: Database,
  presentationOrAttemptId: string,
  now = new Date(),
): Promise<boolean> {
  const result = await db
    .prepare(
      `UPDATE card_presentations
          SET abandoned_at = ?
        WHERE (id = ? OR attempt_id = ?)
          AND presented_at IS NULL
          AND abandoned_at IS NULL`,
    )
    .run(now.toISOString(), presentationOrAttemptId, presentationOrAttemptId);
  return result.changes > 0;
}

/** Release holds that never became a display when a session ends. */
export async function abandonUnconfirmedForSession(
  db: Database,
  sessionId: string,
  now = new Date(),
): Promise<number> {
  const result = await db
    .prepare(
      `UPDATE card_presentations
          SET abandoned_at = ?
        WHERE session_id = ?
          AND presented_at IS NULL
          AND abandoned_at IS NULL`,
    )
    .run(now.toISOString(), sessionId);
  return result.changes;
}
