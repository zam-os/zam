/**
 * Prerequisite repository — typed wrappers around the prerequisites table.
 *
 * Models the dependency graph: "to learn token A, first know token B."
 */

import type { Database } from "libsql";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Prerequisite {
  token_id: string;
  requires_id: string;
}

/** A prerequisite row joined with the token it points to. */
export interface PrerequisiteWithToken extends Prerequisite {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Add a prerequisite edge: tokenId requires requiresId.
 *
 * Idempotent — silently ignores duplicate edges.
 * Throws if either token ID does not exist (FK constraint).
 * Throws if a token is declared as its own prerequisite.
 */
export function addPrerequisite(
  db: Database,
  tokenId: string,
  requiresId: string,
): void {
  if (tokenId === requiresId) {
    throw new Error("A token cannot be a prerequisite of itself");
  }

  db.prepare(
    "INSERT OR IGNORE INTO prerequisites (token_id, requires_id) VALUES (?, ?)",
  ).run(tokenId, requiresId);
}

/**
 * Get the direct prerequisites of a token — "what does token X require?"
 *
 * Returns prerequisite rows joined with the required token's details.
 */
export function getPrerequisites(
  db: Database,
  tokenId: string,
): PrerequisiteWithToken[] {
  return db
    .prepare(
      `SELECT p.token_id, p.requires_id, t.slug, t.concept, t.domain, t.bloom_level
       FROM prerequisites p
       JOIN tokens t ON t.id = p.requires_id
       WHERE p.token_id = ?`,
    )
    .all(tokenId) as PrerequisiteWithToken[];
}

/**
 * Get the direct dependents of a token — "what depends on token X?"
 *
 * Returns prerequisite rows joined with the dependent token's details.
 */
export function getDependents(
  db: Database,
  tokenId: string,
): PrerequisiteWithToken[] {
  return db
    .prepare(
      `SELECT p.token_id, p.requires_id, t.slug, t.concept, t.domain, t.bloom_level
       FROM prerequisites p
       JOIN tokens t ON t.id = p.token_id
       WHERE p.requires_id = ?`,
    )
    .all(tokenId) as PrerequisiteWithToken[];
}
