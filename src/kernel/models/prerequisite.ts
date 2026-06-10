/**
 * Prerequisite repository — typed wrappers around the prerequisites table.
 *
 * Models the dependency graph: "to learn token A, first know token B."
 * The graph must remain acyclic — cycles are rejected at insert time.
 */

import type { Database } from "../db/types.js";

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

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Collect all prerequisite edges as an adjacency map: child → parent set.
 * Only used for cycle detection; the full graph is loaded once per
 * addPrerequisite call (small N in practice).
 */
async function buildAncestorMap(
  db: Database,
): Promise<Map<string, Set<string>>> {
  const rows = (await db
    .prepare("SELECT token_id, requires_id FROM prerequisites")
    .all()) as Array<{ token_id: string; requires_id: string }>;
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    let ancestors = map.get(row.token_id);
    if (!ancestors) {
      ancestors = new Set();
      map.set(row.token_id, ancestors);
    }
    ancestors.add(row.requires_id);
  }
  return map;
}

/**
 * Returns true if adding edge (tokenId → requiresId) would create a cycle.
 * Uses BFS from requiresId: if tokenId is reachable, adding the edge closes
 * a loop.
 */
export async function wouldCreateCycle(
  db: Database,
  tokenId: string,
  requiresId: string,
): Promise<boolean> {
  if (tokenId === requiresId) return true;

  const ancestors = await buildAncestorMap(db);
  const visited = new Set<string>();
  const queue = [requiresId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === tokenId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const parents = ancestors.get(current);
    if (parents) {
      for (const parent of parents) {
        if (!visited.has(parent)) queue.push(parent);
      }
    }
  }
  return false;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Add a prerequisite edge: tokenId requires requiresId.
 *
 * Idempotent — silently ignores duplicate edges.
 * Throws if either token ID does not exist (FK constraint).
 * Throws if a token is declared as its own prerequisite.
 * Throws if the edge would create a cycle in the prerequisite graph.
 */
export async function addPrerequisite(
  db: Database,
  tokenId: string,
  requiresId: string,
): Promise<void> {
  if (tokenId === requiresId) {
    throw new Error("A token cannot be a prerequisite of itself");
  }

  if (await wouldCreateCycle(db, tokenId, requiresId)) {
    throw new Error(
      `Cannot add prerequisite: would create a cycle. ` +
        `${requiresId} already depends on ${tokenId} (directly or transitively).`,
    );
  }

  await db
    .prepare(
      "INSERT OR IGNORE INTO prerequisites (token_id, requires_id) VALUES (?, ?)",
    )
    .run(tokenId, requiresId);
}

/**
 * Get the direct prerequisites of a token — "what does token X require?"
 *
 * Returns prerequisite rows joined with the required token's details.
 */
export async function getPrerequisites(
  db: Database,
  tokenId: string,
): Promise<PrerequisiteWithToken[]> {
  return (await db
    .prepare(
      `SELECT p.token_id, p.requires_id, t.slug, t.concept, t.domain, t.bloom_level
       FROM prerequisites p
       JOIN tokens t ON t.id = p.requires_id
       WHERE p.token_id = ?`,
    )
    .all(tokenId)) as PrerequisiteWithToken[];
}

/**
 * Get the direct dependents of a token — "what depends on token X?"
 *
 * Returns prerequisite rows joined with the dependent token's details.
 */
export async function getDependents(
  db: Database,
  tokenId: string,
): Promise<PrerequisiteWithToken[]> {
  return (await db
    .prepare(
      `SELECT p.token_id, p.requires_id, t.slug, t.concept, t.domain, t.bloom_level
       FROM prerequisites p
       JOIN tokens t ON t.id = p.token_id
       WHERE p.requires_id = ?`,
    )
    .all(tokenId)) as PrerequisiteWithToken[];
}
