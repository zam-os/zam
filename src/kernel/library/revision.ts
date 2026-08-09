/**
 * Publishing a revision of curated learning content
 * (ADR 2026-07-04 Decision 3, "Closed-Group Learning Library").
 *
 * The point of a curated library is that a correction reaches the people who
 * learned the broken version. Without that, a curator fixes a wrong card and
 * everyone who already memorised the wrong answer stays confidently wrong on a
 * comfortable review interval.
 *
 * So every publish is classified, and ZAM never guesses:
 *
 * - **cosmetic** — typo, clearer wording, formatting. Learners keep their FSRS
 *   state untouched and the card simply updates.
 * - **material** — the answer changed, the scope changed, it was wrong. The
 *   token's `content_version` is bumped and every card that learned an older
 *   version becomes **due now**.
 *
 * A material change deliberately does *not* reset stability. It **re-tests**:
 * the learner answers, and their rating recalibrates FSRS from real evidence.
 * A hard reset would throw away history the scheduler could use and punish
 * people who already knew the correction; a "soft reset" would need a
 * stability penalty nobody can justify. FSRS already distinguishes "still knew
 * it" from "did not" — so let it.
 *
 * Kernel-only: no LLM, no HTTP, no notion of who a curator is. Deciding *that*
 * a change is material is the caller's job (a curator in the Studio); applying
 * the consequence is this module's.
 */

import type { Database } from "../db/types.js";

/** How a publish affects people who already learned the token. */
export type RevisionMateriality = "cosmetic" | "material";

/** Token fields a revision may change. Omitted fields are left alone. */
export interface RevisionChanges {
  title?: string;
  question?: string;
  concept?: string;
  context?: string;
  domain?: string;
  bloomLevel?: number;
  sourceLink?: string | null;
}

export interface PublishRevisionInput {
  tokenId: string;
  /** Never defaulted — the caller must decide (ADR Decision 3). */
  materiality: RevisionMateriality;
  changes?: RevisionChanges;
  /** Optional author/curator who published this revision. */
  publishedBy?: string;
}

export interface PublishRevisionResult {
  tokenId: string;
  materiality: RevisionMateriality;
  /** The token's content version after publishing. */
  contentVersion: number;
  /** Cards set due by this publish; 0 for a cosmetic change. */
  cardsRetested: number;
  publishedBy?: string | null;
  publishedAt?: string | null;
}

/** Map a change field to its column, keeping the SQL construction explicit. */
const CHANGE_COLUMNS: Array<[keyof RevisionChanges, string]> = [
  ["title", "title"],
  ["question", "question"],
  ["concept", "concept"],
  ["context", "context"],
  ["domain", "domain"],
  ["bloomLevel", "bloom_level"],
  ["sourceLink", "source_link"],
];

/**
 * Publish a revision of a token and apply its consequence for learners.
 *
 * Runs in one transaction: a material bump and the cards it re-tests must not
 * be observable apart, or a learner could be handed the new wording while
 * still counted as having learned the old version.
 */
export async function publishTokenRevision(
  db: Database,
  input: PublishRevisionInput,
): Promise<PublishRevisionResult> {
  if (input.materiality !== "cosmetic" && input.materiality !== "material") {
    throw new Error(
      `materiality must be "cosmetic" or "material", got: ${String(input.materiality)}`,
    );
  }
  return db.transaction((tx) => publishTokenRevisionInTransaction(tx, input));
}

/**
 * Apply a revision when the caller already owns the surrounding transaction.
 *
 * The public import pipeline needs this form so a source binding, token
 * revision, and personal card are committed or rolled back together. Callers
 * that are not already inside `db.transaction()` must use
 * `publishTokenRevision()` instead.
 */
export async function publishTokenRevisionInTransaction(
  db: Database,
  input: PublishRevisionInput,
): Promise<PublishRevisionResult> {
  const token = (await db
    .prepare("SELECT id, content_version FROM tokens WHERE id = ?")
    .get(input.tokenId)) as { id: string; content_version: number } | undefined;

  if (!token) throw new Error(`Token not found: ${input.tokenId}`);

  const changes = input.changes ?? {};
  const setClauses: string[] = [];
  const params: unknown[] = [];
  for (const [key, column] of CHANGE_COLUMNS) {
    const value = changes[key];
    if (value !== undefined) {
      setClauses.push(`${column} = ?`);
      params.push(value);
    }
  }

  if (input.publishedBy !== undefined) {
    setClauses.push("published_by = ?");
    params.push(input.publishedBy);
  }

  const material = input.materiality === "material";
  const nextVersion = material
    ? token.content_version + 1
    : token.content_version;
  if (material) setClauses.push("content_version = content_version + 1");
  const nowISO = new Date().toISOString();
  setClauses.push("published_at = ?");
  params.push(nowISO);
  setClauses.push("editorial_state = 'published'");
  setClauses.push("updated_at = datetime('now')");

  await db
    .prepare(`UPDATE tokens SET ${setClauses.join(", ")} WHERE id = ?`)
    .run(...params, input.tokenId);

  if (!material) {
    return {
      tokenId: input.tokenId,
      materiality: input.materiality,
      contentVersion: nextVersion,
      cardsRetested: 0,
      publishedBy: input.publishedBy ?? null,
      publishedAt: nowISO,
    };
  }

  // Re-test everyone still holding an older version. `due_at` alone is the
  // whole mechanism — stability, difficulty, reps and lapses stay untouched so
  // the next rating can recalibrate from what the learner actually answers.
  // Blocked cards are left alone: a prerequisite gate outranks a re-test, and
  // the card will surface once it unblocks and is already due.
  const result = await db
    .prepare(
      `UPDATE cards
          SET due_at = datetime('now')
        WHERE token_id = ?
          AND learned_content_version < ?
          AND state <> 'new'`,
    )
    .run(input.tokenId, nextVersion);

  return {
    tokenId: input.tokenId,
    materiality: input.materiality,
    contentVersion: nextVersion,
    cardsRetested: result.changes,
    publishedBy: input.publishedBy ?? null,
    publishedAt: nowISO,
  };
}

/**
 * True when this card's owner has not yet been re-tested since a material
 * change. Callers use it to explain *why* a card came back — an unexplained
 * reappearance is the reset feeling like a bug.
 */
export async function isAwaitingRetest(
  db: Database,
  cardId: string,
): Promise<boolean> {
  const row = (await db
    .prepare(
      `SELECT c.learned_content_version AS learned, t.content_version AS current
         FROM cards c
         JOIN tokens t ON t.id = c.token_id
        WHERE c.id = ?`,
    )
    .get(cardId)) as { learned: number; current: number } | undefined;
  return row ? row.learned < row.current : false;
}

export interface RevisionImpact {
  tokenId: string;
  currentContentVersion: number;
  totalCards: number;
  affectedLearners: number;
}

/**
 * Calculate the release impact of publishing a revision for a token.
 * Shows how many existing cards/learners will be affected if a material
 * change is published.
 */
export async function getRevisionImpact(
  db: Database,
  tokenId: string,
): Promise<RevisionImpact> {
  const token = (await db
    .prepare("SELECT id, content_version FROM tokens WHERE id = ?")
    .get(tokenId)) as { id: string; content_version: number } | undefined;

  if (!token) throw new Error(`Token not found: ${tokenId}`);

  const totalRow = (await db
    .prepare("SELECT COUNT(*) as count FROM cards WHERE token_id = ?")
    .get(tokenId)) as { count: number };

  const affectedRow = (await db
    .prepare(
      `SELECT COUNT(*) as count
         FROM cards
        WHERE token_id = ?
          AND learned_content_version <= ?
          AND state <> 'new'`,
    )
    .get(tokenId, token.content_version)) as { count: number };

  return {
    tokenId: token.id,
    currentContentVersion: token.content_version,
    totalCards: totalRow ? totalRow.count : 0,
    affectedLearners: affectedRow ? affectedRow.count : 0,
  };
}
