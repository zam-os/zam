/**
 * Card repository — typed wrappers around the cards table.
 *
 * Each card tracks one user's scheduling state for one token,
 * using FSRS fields (stability, difficulty, elapsed_days, etc.).
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type CardState = "new" | "learning" | "review" | "relearning";

export interface Card {
  id: string;
  token_id: string;
  user_id: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: CardState;
  learning_step: number | null;
  buried_until: string | null;
  buried_reason: string | null;
  due_at: string;
  last_review_at: string | null;
  blocked: number; // 0 or 1
  assigned_by?: string | null;
  assignment_id?: string | null;
  /** "Not for me": declined by the learner; kept, but not scheduled. */
  detached_at?: string | null;
}

export interface UpdateCardInput {
  stability?: number;
  difficulty?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  reps?: number;
  lapses?: number;
  state?: CardState;
  learning_step?: number | null;
  buried_until?: string | null;
  buried_reason?: string | null;
  due_at?: string;
  last_review_at?: string | null;
  blocked?: number;
}

export interface CardDeletionImpact {
  review_logs: number;
}

export interface DeleteCardResult {
  card: Card;
  impact: CardDeletionImpact;
}

/** A due card joined with its token details. */
export interface DueCard extends Card {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
}

/** A blocked card joined with its token details. */
export interface BlockedCard extends Card {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Ensure a card exists for the given token+user pair.
 *
 * If one already exists, return it. Otherwise create a new card with
 * default FSRS values (due immediately) and return it.
 *
 * Ported from the PoC's ensureCard helper.
 */
/**
 * Create a learner's card for a token, without looking first or reading back.
 *
 * Only safe where the caller already knows no card exists — a bulk importer
 * inside the transaction that just created the token, for instance. Everyone
 * else wants `ensureCard`; this exists because its two extra statements are a
 * network round trip each on a remote library.
 */
export async function insertCard(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<string> {
  const id = ulid();
  await db
    .prepare(
      `INSERT INTO cards (id, token_id, user_id, due_at)
     VALUES (?, ?, ?, ?)`,
    )
    .run(id, tokenId, userId, new Date().toISOString());
  return id;
}

export async function ensureCard(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<Card> {
  const existing = (await db
    .prepare("SELECT * FROM cards WHERE token_id = ? AND user_id = ?")
    .get(tokenId, userId)) as Card | undefined;

  if (existing) return existing;

  const id = ulid();
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO cards (id, token_id, user_id, due_at)
     VALUES (?, ?, ?, ?)`,
    )
    .run(id, tokenId, userId, now);

  return (await db.prepare("SELECT * FROM cards WHERE id = ?").get(id)) as Card;
}

/**
 * Get a card by token+user. Returns undefined if no card exists.
 */
export async function getCard(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<Card | undefined> {
  return (await db
    .prepare("SELECT * FROM cards WHERE token_id = ? AND user_id = ?")
    .get(tokenId, userId)) as Card | undefined;
}

/**
 * Get a card by its ULID.
 */
export async function getCardById(
  db: Database,
  cardId: string,
): Promise<Card | undefined> {
  return (await db.prepare("SELECT * FROM cards WHERE id = ?").get(cardId)) as
    | Card
    | undefined;
}

/**
 * Update a card's scheduling fields.
 *
 * Only the fields present in `updates` are changed. Throws if the card
 * does not exist.
 */
export async function updateCard(
  db: Database,
  cardId: string,
  updates: UpdateCardInput,
): Promise<Card> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.stability !== undefined) {
    fields.push("stability = ?");
    values.push(updates.stability);
  }
  if (updates.difficulty !== undefined) {
    fields.push("difficulty = ?");
    values.push(updates.difficulty);
  }
  if (updates.elapsed_days !== undefined) {
    fields.push("elapsed_days = ?");
    values.push(updates.elapsed_days);
  }
  if (updates.scheduled_days !== undefined) {
    fields.push("scheduled_days = ?");
    values.push(updates.scheduled_days);
  }
  if (updates.reps !== undefined) {
    fields.push("reps = ?");
    values.push(updates.reps);
  }
  if (updates.lapses !== undefined) {
    fields.push("lapses = ?");
    values.push(updates.lapses);
  }
  if (updates.state !== undefined) {
    fields.push("state = ?");
    values.push(updates.state);
  }
  if (updates.learning_step !== undefined) {
    fields.push("learning_step = ?");
    values.push(updates.learning_step);
  }
  if (updates.buried_until !== undefined) {
    fields.push("buried_until = ?");
    values.push(updates.buried_until);
  }
  if (updates.buried_reason !== undefined) {
    fields.push("buried_reason = ?");
    values.push(updates.buried_reason);
  }
  if (updates.due_at !== undefined) {
    fields.push("due_at = ?");
    values.push(updates.due_at);
  }
  if (updates.last_review_at !== undefined) {
    fields.push("last_review_at = ?");
    values.push(updates.last_review_at);
  }
  if (updates.blocked !== undefined) {
    fields.push("blocked = ?");
    values.push(updates.blocked);
  }

  if (fields.length === 0) {
    throw new Error("updateCard called with no fields to update");
  }

  values.push(cardId);

  const result = await db
    .prepare(`UPDATE cards SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  if (result.changes === 0) {
    throw new Error(`Card not found: ${cardId}`);
  }

  return (await db
    .prepare("SELECT * FROM cards WHERE id = ?")
    .get(cardId)) as Card;
}

/**
 * Preview the review-log rows that will be removed when deleting a user's card.
 */
/**
 * Reset the learning state of every user's card for a token back to the
 * beginning (ADR 2026-07-18): when a concept changed on re-import, the old
 * knowledge is irrelevant and must be learned fresh. Values mirror a
 * brand-new card's schema defaults. `blocked` is left untouched — it is
 * derived from prerequisites, not from learning progress.
 *
 * Returns the number of cards reset.
 */
export async function resetCardsForToken(
  db: Database,
  tokenId: string,
  now?: string,
): Promise<number> {
  const ts = now ?? new Date().toISOString();
  const result = await db
    .prepare(
      `UPDATE cards SET
         stability = 0.0,
         difficulty = 0.5,
         elapsed_days = 0.0,
         scheduled_days = 0.0,
         reps = 0,
         lapses = 0,
         state = 'new',
         learning_step = NULL,
         buried_until = NULL,
         buried_reason = NULL,
         due_at = ?,
         last_review_at = NULL
       WHERE token_id = ?`,
    )
    .run(ts, tokenId);
  return result.changes;
}

export async function getCardDeletionImpact(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<CardDeletionImpact> {
  const card = await getCard(db, tokenId, userId);
  if (!card) {
    throw new Error(`Card not found for token ${tokenId} and user ${userId}`);
  }

  const reviewLogs = (await db
    .prepare("SELECT COUNT(*) AS n FROM review_logs WHERE card_id = ?")
    .get(card.id)) as { n: number };

  return { review_logs: reviewLogs.n };
}

/**
 * Refuse an action while an assignment still stands (ADR 2026-07-04
 * Decision 10). The inability to opt out is what makes an assignment an
 * assignment rather than a suggestion; once withdrawn, the learner regains
 * full control of the card.
 */
async function assertNotBoundByAssignment(
  db: Database,
  card: Card,
  action: string,
): Promise<void> {
  if (!card.assignment_id) return;
  const assignment = (await db
    .prepare("SELECT withdrawn_at FROM assignments WHERE id = ?")
    .get(card.assignment_id)) as { withdrawn_at: string | null } | undefined;
  if (assignment && assignment.withdrawn_at === null) {
    throw new Error(`Cannot ${action} card: bound by an active assignment.`);
  }
}

/**
 * "Not for me" — decline a card without destroying anything
 * (ADR 2026-07-04 Decision 10).
 *
 * Detaching stops scheduling but keeps the card row and every review log
 * attached to it. That is the whole difference from {@link deleteCardForUser}:
 * a learner who decides a piece of shared content is not for them should not
 * have to erase the work they already did on it to say so, and should be able
 * to change their mind ({@link reattachCardForUser}).
 *
 * Idempotent; refused while an assignment still binds the card.
 */
export async function detachCardForUser(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<Card> {
  const card = await getCard(db, tokenId, userId);
  if (!card) {
    throw new Error(`Card not found for token ${tokenId} and user ${userId}`);
  }
  await assertNotBoundByAssignment(db, card, "detach");

  if (!card.detached_at) {
    await db
      .prepare("UPDATE cards SET detached_at = ? WHERE id = ?")
      .run(new Date().toISOString(), card.id);
  }
  return (await getCard(db, tokenId, userId)) as Card;
}

/**
 * Undo a detach. Scheduling state is untouched throughout, so a card picked
 * back up resumes where it left off rather than starting over. Idempotent.
 */
export async function reattachCardForUser(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<Card> {
  const card = await getCard(db, tokenId, userId);
  if (!card) {
    throw new Error(`Card not found for token ${tokenId} and user ${userId}`);
  }
  if (card.detached_at) {
    await db
      .prepare("UPDATE cards SET detached_at = NULL WHERE id = ?")
      .run(card.id);
  }
  return (await getCard(db, tokenId, userId)) as Card;
}

/**
 * Delete one user's card for a token. Review logs cascade via FK.
 */
export async function deleteCardForUser(
  db: Database,
  tokenId: string,
  userId: string,
): Promise<DeleteCardResult> {
  const card = await getCard(db, tokenId, userId);
  if (!card) {
    throw new Error(`Card not found for token ${tokenId} and user ${userId}`);
  }

  await assertNotBoundByAssignment(db, card, "delete");

  const impact = await getCardDeletionImpact(db, tokenId, userId);
  await db.prepare("DELETE FROM cards WHERE id = ?").run(card.id);

  return { card, impact };
}

/**
 * Get all cards that are due for review.
 *
 * A card is due when it is not blocked/buried and due_at <= now.
 * Results are ordered by bloom_level ascending (fundamentals first),
 * then by due_at ascending (oldest first).
 *
 * Ported from the PoC's due-tokens command.
 *
 * When `domain` or `knowledgeContext` is set, only matching due cards are
 * returned.
 */
export async function getDueCards(
  db: Database,
  userId: string,
  now?: string,
  domain?: string,
  knowledgeContext?: string,
): Promise<DueCard[]> {
  const cutoff = now ?? new Date().toISOString();

  // Same eligibility as the review queue: a draft is not learning content
  // yet, a deprecated token is not learning content any more.
  let sql = `SELECT c.*, t.slug, t.concept, t.domain, t.bloom_level
    FROM cards c
    JOIN tokens t ON t.id = c.token_id
    WHERE c.user_id = ? AND c.blocked = 0 AND c.due_at <= ?
      AND (c.buried_until IS NULL OR c.buried_until <= ?)
      AND t.maintenance_at IS NULL
      AND t.deprecated_at IS NULL
      AND t.editorial_state = 'published'
      AND c.detached_at IS NULL`;
  const params: unknown[] = [userId, cutoff, cutoff];

  if (domain) {
    sql += " AND t.domain = ?";
    params.push(domain);
  }

  if (knowledgeContext) {
    sql += ` AND EXISTS (
      SELECT 1 FROM token_contexts tc
      INNER JOIN contexts context_filter ON context_filter.id = tc.context_id
      WHERE tc.token_id = t.id AND context_filter.name = ?
    )`;
    params.push(knowledgeContext);
  }

  sql += " ORDER BY t.bloom_level ASC, c.due_at ASC";
  return (await db.prepare(sql).all(...params)) as DueCard[];
}

/**
 * Get all blocked cards for a user.
 *
 * Returns cards joined with their token details so the caller can
 * see what is waiting and why.
 */
export async function getBlockedCards(
  db: Database,
  userId: string,
): Promise<BlockedCard[]> {
  return (await db
    .prepare(
      `SELECT c.*, t.slug, t.concept, t.domain, t.bloom_level
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ? AND c.blocked = 1
       ORDER BY t.bloom_level ASC, t.slug ASC`,
    )
    .all(userId)) as BlockedCard[];
}
