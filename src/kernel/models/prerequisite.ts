/**
 * Prerequisite repository — typed wrappers around the prerequisites table.
 *
 * Models the dependency graph: "to learn token A, first know token B."
 * The graph must remain acyclic — cycles are rejected at insert time.
 */

import type { Database } from "../db/types.js";
import { type Card, type CardState, getCard } from "./card.js";
import { getTokenById } from "./token.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Prerequisite {
  token_id: string;
  requires_id: string;
}

/** A prerequisite row joined with the token it points to. */
export interface PrerequisiteWithToken extends Prerequisite {
  slug: string;
  title: string;
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
export async function buildAncestorMap(
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
  ancestors?: Map<string, Set<string>>,
): Promise<boolean> {
  if (tokenId === requiresId) return true;

  const map = ancestors ?? (await buildAncestorMap(db));
  const visited = new Set<string>();
  const queue = [requiresId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === tokenId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const parents = map.get(current);
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
      "INSERT INTO prerequisites (token_id, requires_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
    )
    .run(tokenId, requiresId);
}

/**
 * Remove one prerequisite edge. Idempotent when the edge does not exist.
 * Callers that reconcile several edges should wrap the full change in one
 * Database transaction so a later validation failure restores the old graph.
 */
export async function removePrerequisite(
  db: Database,
  tokenId: string,
  requiresId: string,
): Promise<void> {
  await db
    .prepare("DELETE FROM prerequisites WHERE token_id = ? AND requires_id = ?")
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
      `SELECT p.token_id, p.requires_id, t.slug, t.title, t.concept, t.domain, t.bloom_level
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
      `SELECT p.token_id, p.requires_id, t.slug, t.title, t.concept, t.domain, t.bloom_level
       FROM prerequisites p
       JOIN tokens t ON t.id = p.token_id
       WHERE p.requires_id = ?`,
    )
    .all(tokenId)) as PrerequisiteWithToken[];
}

// ── Visualization Neighborhood (for 3D focus graph) ──────────────────────────

/** Token + optional per-user card snapshot, tailored for visual encoding (mastery, blocked state, bloom). */
export interface NeighborhoodToken {
  id: string;
  slug: string;
  title: string;
  concept: string;
  domain: string;
  bloom_level: number;
  card: {
    state: CardState;
    reps: number;
    stability: number;
    difficulty: number;
    blocked: boolean;
    due_at: string;
    last_review_at: string | null;
  } | null;
}

/**
 * The direct neighborhood for a focus-centric 3D view:
 * - center: the token in focus
 * - prerequisites: direct "basis" tokens required by the center (foundations, placed "below")
 * - dependents: direct tokens that require the center (higher-order abilities, placed "above")
 *
 * When userId is supplied, every node includes the user's Card state so the viz can
 * encode personal mastery (e.g. color by stability/reps, highlight blocked or due).
 */
export interface Neighborhood {
  center: NeighborhoodToken;
  prerequisites: NeighborhoodToken[];
  dependents: NeighborhoodToken[];
}

/**
 * Fetch the direct (depth-1) prerequisite neighborhood around one token.
 * This is the primary data source for the experimental 3D knowledge graph.
 */
export async function getTokenNeighborhood(
  db: Database,
  tokenId: string,
  userId?: string,
): Promise<Neighborhood> {
  const token = await getTokenById(db, tokenId);
  if (!token) {
    throw new Error(`Token not found: ${tokenId}`);
  }

  const centerCard = userId ? await getCard(db, tokenId, userId) : undefined;

  const prereqRows = await getPrerequisites(db, tokenId);
  const depRows = await getDependents(db, tokenId);

  // Collect all related token ids for batched card lookup (when userId given)
  const relatedTokenIds = new Set<string>();
  for (const p of prereqRows) relatedTokenIds.add(p.requires_id);
  for (const d of depRows) relatedTokenIds.add(d.token_id);

  const cardMap = new Map<string, Card>();
  if (userId && relatedTokenIds.size > 0) {
    const ids = Array.from(relatedTokenIds);
    const placeholders = ids.map(() => "?").join(",");
    const rows = (await db
      .prepare(
        `SELECT * FROM cards WHERE token_id IN (${placeholders}) AND user_id = ?`,
      )
      .all(...ids, userId)) as Card[];
    for (const row of rows) {
      cardMap.set(row.token_id, row);
    }
  }

  const toNode = (
    t: {
      id: string;
      slug: string;
      title?: string;
      concept: string;
      domain: string;
      bloom_level: number;
    },
    card?: Card,
  ): NeighborhoodToken => ({
    id: t.id,
    slug: t.slug,
    title: t.title ?? t.slug,
    concept: t.concept,
    domain: t.domain,
    bloom_level: t.bloom_level,
    card: card
      ? {
          state: card.state,
          reps: card.reps,
          stability: card.stability,
          difficulty: card.difficulty,
          blocked: card.blocked === 1,
          due_at: card.due_at,
          last_review_at: card.last_review_at,
        }
      : null,
  });

  const center: NeighborhoodToken = toNode(token, centerCard);

  const prerequisites: NeighborhoodToken[] = prereqRows.map((p) =>
    toNode(
      {
        id: p.requires_id,
        slug: p.slug,
        title: p.title,
        concept: p.concept,
        domain: p.domain,
        bloom_level: p.bloom_level,
      },
      cardMap.get(p.requires_id),
    ),
  );

  const dependents: NeighborhoodToken[] = depRows.map((d) =>
    toNode(
      {
        id: d.token_id,
        slug: d.slug,
        title: d.title,
        concept: d.concept,
        domain: d.domain,
        bloom_level: d.bloom_level,
      },
      cardMap.get(d.token_id),
    ),
  );

  return { center, prerequisites, dependents };
}
