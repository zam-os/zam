/**
 * Bonus candidates: atoms outside the learner's cell that sit at the edge of
 * what they can already do.
 *
 * ADR 2026-08-14 Decision 6 offers such atoms; it never schedules them. This
 * module answers only *which* atoms are offerable and in what order. Nothing
 * here writes: no card, no FSRS field, no persisted score.
 *
 * The three definitions the Codex hardening review (R2) asked for are the three
 * exported functions, and they are deliberately **derived** rather than stored.
 * A persisted "mastery" value beside the card is the second source of truth the
 * whole design has refused twice.
 */

import type { Database } from "../db/types.js";

export interface BonusCandidate {
  atomId: string;
  title: string;
  /** Atoms that become eligible the moment this one is held. Learner-relative. */
  unlockCount: number;
  /** Hard-edge descendants in the whole graph. Static, and see the caveats. */
  reachabilityCount: number;
  /** The atoms already held that make this one offerable — the "because". */
  restsOn: string[];
}

export interface BonusOptions {
  /**
   * Atoms the learner's own curriculum already covers. They are not bonuses,
   * whether or not they are held.
   *
   * Passed in rather than derived: "which overlay am I following" is a personal
   * enrolment, and that object does not exist yet (ADR 2026-08-14b).
   */
  inScopeAtomIds: string[];
  /** Cap on returned candidates. Ranking is defined; the cut is the caller's. */
  limit?: number;
}

interface EdgeRow {
  atom_id: string;
  requires_id: string;
}

/**
 * Does this learner hold this atom?
 *
 * **One observed retrieval of the atom's representative item, and the card is
 * not blocked.** Deliberately the same predicate `unblockReady` uses for
 * "prerequisite satisfied", so the system does not carry two different meanings
 * of "you have this".
 *
 * Consequences worth stating, because each was a choice:
 *
 * - A card buried by precondition self-assessment has `reps = 0` and is
 *   therefore **not** held. The bonus surface never rides on an assumption —
 *   only on observed retrieval.
 * - There is **no retrievability threshold**. A card whose stability has decayed
 *   still counts. Adding a threshold would create a second, competing notion of
 *   mastery next to FSRS, and the card comes due on its own anyway. The
 *   falsification is measurable: bonus atoms accepted on the back of a decayed
 *   foundation should fail at a noticeably higher rate.
 * - Evidence comes from the atom's **representative** item, not from all of
 *   them. Requiring every item would make an atom with a Tier 2 essay harder to
 *   hold than one with a single Tier 1 tap — punishing richer curation. The
 *   representative is currently the lowest stored item id, which is
 *   deterministic but not a didactic statement (ADR 2026-08-14b, question 4).
 */
export async function heldAtomIds(
  db: Database,
  userId: string,
): Promise<Set<string>> {
  const rows = (await db
    .prepare(
      `SELECT t.atom_id AS atom_id
         FROM tokens t
         JOIN cards c ON c.token_id = t.id
        WHERE c.user_id = ?
          AND t.atom_id IS NOT NULL
          AND c.reps >= 1
          AND c.blocked = 0
          AND t.id = (
            SELECT id FROM tokens r
             WHERE r.atom_id = t.atom_id
             ORDER BY r.id LIMIT 1
          )`,
    )
    .all(userId)) as Array<{ atom_id: string }>;
  return new Set(rows.map((row) => row.atom_id));
}

/** Hard atom edges, as child -> required. Soft edges never gate. */
async function hardEdges(db: Database): Promise<EdgeRow[]> {
  return (await db
    .prepare(
      `SELECT atom_id, requires_id FROM atom_prerequisites
        WHERE kind = 'hard' ORDER BY atom_id, requires_id`,
    )
    .all()) as EdgeRow[];
}

/**
 * How many atoms this one unlocks *for this learner, right now*.
 *
 * `|{ w : u is a hard prerequisite of w, and every other hard prerequisite of w
 * is already held }|`
 *
 * This is the number a bonus label may name — "learning this opens four more" —
 * because it is exactly what would become offerable. It is learner-relative and
 * costs one level of the graph.
 *
 * Not to be confused with {@link reachabilityCounts}. The hardening review found
 * both meanings used interchangeably in the design notes; they are different
 * quantities and only this one is a promise about the learner's next step.
 */
function unlockCounts(edges: EdgeRow[], held: Set<string>): Map<string, number> {
  const requiredBy = new Map<string, string[]>();
  const requirements = new Map<string, string[]>();
  for (const edge of edges) {
    const dependents = requiredBy.get(edge.requires_id) ?? [];
    dependents.push(edge.atom_id);
    requiredBy.set(edge.requires_id, dependents);

    const needs = requirements.get(edge.atom_id) ?? [];
    needs.push(edge.requires_id);
    requirements.set(edge.atom_id, needs);
  }

  const counts = new Map<string, number>();
  for (const [candidate, dependents] of requiredBy) {
    let unlocked = 0;
    for (const dependent of dependents) {
      if (held.has(dependent)) continue;
      const others = (requirements.get(dependent) ?? []).filter(
        (id) => id !== candidate,
      );
      if (others.every((id) => held.has(id))) unlocked += 1;
    }
    counts.set(candidate, unlocked);
  }
  return counts;
}

/**
 * Hard-edge descendants of every atom — the *static* leverage.
 *
 * Exact for the graph as it stands and therefore tempting to read as a
 * didactic value. It is not. It moves with atom granularity, how far curation
 * has reached, how many curricula were imported, and whether alternative routes
 * were modelled — and it says nothing about the difficulty or importance of
 * those descendants. Used only as a tiebreaker.
 *
 * Cost is a memoised DFS over the hard graph, which is acyclic by construction.
 */
function reachabilityCounts(edges: EdgeRow[]): Map<string, number> {
  const dependents = new Map<string, string[]>();
  for (const edge of edges) {
    const list = dependents.get(edge.requires_id) ?? [];
    list.push(edge.atom_id);
    dependents.set(edge.requires_id, list);
  }

  const memo = new Map<string, Set<string>>();
  function descendants(atom: string): Set<string> {
    const cached = memo.get(atom);
    if (cached) return cached;
    const reached = new Set<string>();
    memo.set(atom, reached); // guards against a cycle slipping in
    for (const child of dependents.get(atom) ?? []) {
      reached.add(child);
      for (const deeper of descendants(child)) reached.add(deeper);
    }
    return reached;
  }

  const counts = new Map<string, number>();
  for (const atom of dependents.keys()) {
    counts.set(atom, descendants(atom).size);
  }
  return counts;
}

/**
 * Atoms outside the learner's curriculum whose hard prerequisites they hold.
 *
 * Ranked by {@link unlockCounts}, then static reachability, then atom id so the
 * order is stable.
 *
 * **Only hard edges gate.** Alternative prerequisite sets ("A or B suffices")
 * cannot be expressed by the current AND-only graph (ADR 2026-08-14b,
 * question 3 / Codex 6.2). For a bonus that is the safe direction: an atom
 * genuinely reachable by an unmodelled second route is simply not offered.
 * Under-offering costs an option the learner never sees; over-offering costs a
 * dead end they accepted. Those are not symmetric.
 */
export async function bonusCandidates(
  db: Database,
  userId: string,
  options: BonusOptions,
): Promise<BonusCandidate[]> {
  const held = await heldAtomIds(db, userId);
  const inScope = new Set(options.inScopeAtomIds);
  const edges = await hardEdges(db);

  const requirements = new Map<string, string[]>();
  for (const edge of edges) {
    const needs = requirements.get(edge.atom_id) ?? [];
    needs.push(edge.requires_id);
    requirements.set(edge.atom_id, needs);
  }

  const unlocks = unlockCounts(edges, held);
  const reach = reachabilityCounts(edges);

  const atoms = (await db
    .prepare("SELECT id, title FROM learning_atoms ORDER BY id")
    .all()) as Array<{ id: string; title: string }>;

  const candidates: BonusCandidate[] = [];
  for (const atom of atoms) {
    if (held.has(atom.id) || inScope.has(atom.id)) continue;
    const needs = requirements.get(atom.id) ?? [];
    // An atom with no prerequisites has nothing to rest on; offering it is not
    // an edge-of-the-known suggestion, so it is left to explicit search.
    if (needs.length === 0) continue;
    if (!needs.every((id) => held.has(id))) continue;

    candidates.push({
      atomId: atom.id,
      title: atom.title,
      unlockCount: unlocks.get(atom.id) ?? 0,
      reachabilityCount: reach.get(atom.id) ?? 0,
      restsOn: [...needs].sort(),
    });
  }

  candidates.sort(
    (a, b) =>
      b.unlockCount - a.unlockCount ||
      b.reachabilityCount - a.reachabilityCount ||
      a.atomId.localeCompare(b.atomId),
  );

  return options.limit ? candidates.slice(0, options.limit) : candidates;
}
