/**
 * Red threads beyond prerequisites (ADR 2026-10-13, Decision 7): nutzt,
 * Schnittstelle, ist ein and Verbindung, shared by the library, and a
 * learner's own threads, which may also be a Voraussetzung.
 *
 * - **Direction.** `a` is always the dependent end: a builds on b, a uses b,
 *   a consumes the interface b provides, a is a special case of b. A
 *   Verbindung has no direction.
 * - **Planets** (Decision 2). Threads cross planets in one direction only: if
 *   a is world knowledge, b is too, so world knowledge never learns about a
 *   Firma or Privat unit. A Verbindung swaps its ends instead of refusing.
 *   Firma and Privat never meet, as they never share a database.
 * - **A shared Voraussetzung** is a prerequisite: it stays in the
 *   prerequisite tables (`zam_link_prereq`), which feed blocking.
 * - **A learner's own threads** are learning state and never feed blocking:
 *   `src/kernel/scheduler/blocker.ts` reads only the prerequisite tables.
 * - **A thread is a hint for learning,** never a statement of identity. An
 *   "ist ein" thread never dedupes units or moves learning state.
 */

import { ulid } from "ulid";
import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";
import { loadBindings, loadUnits, type UnitRow } from "./lenses.js";
import { PlanetError } from "./planet-error.js";
import { loadUnitPlanets, ownPlanetOf } from "./planets.js";
import {
  type PlanetKind,
  THREAD_KINDS,
  type ThreadKind,
  type UnitKey,
} from "./types.js";

/** A thread's note is a short sentence: why the two belong together. */
export const MAX_THREAD_NOTE = 280;

export type ConnectionScope = "personal" | "shared";
/** Who wrote a shared thread: an agent through a tool, or a person in the Studio. */
export type ConnectionAuthor = "agent" | "curator";

export type ConnectionErrorCode =
  | "invalid-kind"
  | "same-unit"
  | "unknown-unit"
  | "world-to-own"
  | "shared-prerequisite"
  | "not-curator"
  | "note-too-long"
  | "unknown-connection";

/** A thread write that the rules refuse. */
export class ConnectionError extends Error {
  constructor(
    readonly code: ConnectionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ConnectionError";
  }
}

export function parseThreadKind(raw: unknown): ThreadKind | null {
  return typeof raw === "string" &&
    (THREAD_KINDS as readonly string[]).includes(raw)
    ? (raw as ThreadKind)
    : null;
}

export interface ThreadEnd {
  key: UnitKey;
  planet: PlanetKind;
}

/**
 * Pure: a thread's ends as stored. A thread from world knowledge to an own
 * planet is refused; a Verbindung turns around instead, and on one side of
 * that line it is stored in key order, so one pair is one Verbindung.
 */
export function orientThread(
  kind: ThreadKind,
  a: ThreadEnd,
  b: ThreadEnd,
): { a: ThreadEnd; b: ThreadEnd; swapped: boolean } {
  const worldToOwn = a.planet === "welt" && b.planet !== "welt";
  if (kind === "verbindung") {
    const mixed = (a.planet === "welt") !== (b.planet === "welt");
    const swap = mixed ? worldToOwn : a.key > b.key;
    return swap ? { a: b, b: a, swapped: true } : { a, b, swapped: false };
  }
  if (worldToOwn) {
    throw new ConnectionError(
      "world-to-own",
      "World knowledge never depends on a Firma or Privat unit: a thread runs from the own planet to world knowledge.",
    );
  }
  return { a, b, swapped: false };
}

/** A note as stored: trimmed, null when empty. */
function cleanNote(note: string | null | undefined): string | null {
  const text = (note ?? "").replace(/\s+/g, " ").trim();
  if (text.length > MAX_THREAD_NOTE) {
    throw new ConnectionError(
      "note-too-long",
      `A thread's note holds at most ${MAX_THREAD_NOTE} characters.`,
    );
  }
  return text === "" ? null : text;
}

/** The unit a key names; a token of an atom names the atom's unit. */
function findUnit(units: readonly UnitRow[], key: string): UnitRow {
  const unit =
    units.find((u) => u.key === key) ??
    (key.startsWith("token:")
      ? units.find((u) => u.tokenIds.includes(key.slice(6)))
      : undefined);
  if (!unit) {
    throw new ConnectionError(
      "unknown-unit",
      `"${key}" names no unit of this library. Use atom:<id> or token:<id>.`,
    );
  }
  return unit;
}

async function atomUri(db: Database, key: UnitKey): Promise<string | null> {
  if (!key.startsWith("atom:")) return null;
  const row = (await db
    .prepare("SELECT atom_uri FROM learning_atoms WHERE id = ?")
    .get(key.slice(5))) as { atom_uri: string | null } | undefined;
  return row?.atom_uri ?? null;
}

export interface AddConnectionInput {
  /** The dependent end (a Verbindung has none). */
  a: string;
  b: string;
  kind: string;
  note?: string | null;
  /** `personal` (the default) or the library's, which needs `mayWriteKnowledge`. */
  scope?: ConnectionScope;
  userId: string;
  /** Whether this connection may write knowledge (`mayWriteKnowledge`). */
  mayWriteKnowledge: boolean;
  author?: ConnectionAuthor;
  now?: Date;
}

export interface AddConnectionResult {
  id: string;
  scope: ConnectionScope;
  a: UnitKey;
  b: UnitKey;
  kind: ThreadKind;
  note: string | null;
  /** A Verbindung was turned around. */
  swapped: boolean;
  /** False when the same thread was there already; a new note replaces its note. */
  created: boolean;
}

/** Spin a thread (see the module comment for the rules). */
export async function addConnection(
  db: Database,
  input: AddConnectionInput,
): Promise<AddConnectionResult> {
  const kind = parseThreadKind(input.kind);
  if (!kind) {
    throw new ConnectionError(
      "invalid-kind",
      `Unknown thread kind "${input.kind}". Choose ${THREAD_KINDS.join(", ")}.`,
    );
  }
  const scope = input.scope ?? "personal";
  if (scope === "shared" && kind === "voraussetzung") {
    throw new ConnectionError(
      "shared-prerequisite",
      "A shared Voraussetzung is a prerequisite: link it with zam_link_prereq.",
    );
  }
  if (scope === "shared" && !input.mayWriteKnowledge) {
    throw new ConnectionError(
      "not-curator",
      "Only someone who may write this library's knowledge spins a shared thread.",
    );
  }
  const note = cleanNote(input.note);
  const units = await loadUnits(db);
  const unitA = findUnit(units, input.a);
  const unitB = findUnit(units, input.b);
  if (unitA.key === unitB.key) {
    throw new ConnectionError("same-unit", "A thread joins two units.");
  }
  const planets = await loadUnitPlanets(
    db,
    [unitA, unitB],
    await loadBindings(db),
    await ownPlanetOf(db),
  );
  const end = (unit: UnitRow): ThreadEnd => ({
    key: unit.key,
    planet: planets.get(unit.key) ?? "welt",
  });
  const { a, b, swapped } = orientThread(kind, end(unitA), end(unitB));
  const shared = scope === "shared";
  const table = shared ? "connections" : "learner_connections";
  const owner = shared ? "" : "user_id = ? AND ";
  const ownerArgs = shared ? [] : [input.userId];
  const existing = (await db
    .prepare(
      `SELECT id, note FROM ${table}
        WHERE ${owner}a_key = ? AND b_key = ? AND kind = ?`,
    )
    .get(...ownerArgs, a.key, b.key, kind)) as
    | { id: string; note: string | null }
    | undefined;
  if (existing) {
    if (note !== null && note !== existing.note) {
      await db
        .prepare(`UPDATE ${table} SET note = ? WHERE id = ?`)
        .run(note, existing.id);
    }
    return {
      id: existing.id,
      scope,
      a: a.key,
      b: b.key,
      kind,
      note: note ?? existing.note,
      swapped,
      created: false,
    };
  }
  const id = ulid();
  const now = nowIso(input.now);
  const aUri = await atomUri(db, a.key);
  const bUri = await atomUri(db, b.key);
  if (shared) {
    await db
      .prepare(
        `INSERT INTO connections (id, a_key, b_key, a_uri, b_uri, kind, note, author, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        a.key,
        b.key,
        aUri,
        bUri,
        kind,
        note,
        input.author ?? "agent",
        now,
      );
  } else {
    await db
      .prepare(
        `INSERT INTO learner_connections (id, user_id, a_key, b_key, a_uri, b_uri, kind, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, input.userId, a.key, b.key, aUri, bUri, kind, note, now);
  }
  return { id, scope, a: a.key, b: b.key, kind, note, swapped, created: true };
}

/**
 * Cut a thread by id: the learner's own, or the library's with the right to
 * write knowledge.
 */
export async function removeConnection(
  db: Database,
  input: { id: string; userId: string; mayWriteKnowledge: boolean },
): Promise<{ scope: ConnectionScope }> {
  const own = await db
    .prepare("DELETE FROM learner_connections WHERE id = ? AND user_id = ?")
    .run(input.id, input.userId);
  if (own.changes > 0) return { scope: "personal" };
  const shared = await db
    .prepare("SELECT 1 FROM connections WHERE id = ?")
    .get(input.id);
  if (!shared) {
    throw new ConnectionError(
      "unknown-connection",
      `No thread ${input.id} of yours or of this library.`,
    );
  }
  if (!input.mayWriteKnowledge) {
    throw new ConnectionError(
      "not-curator",
      "Only someone who may write this library's knowledge cuts a shared thread.",
    );
  }
  await db.prepare("DELETE FROM connections WHERE id = ?").run(input.id);
  return { scope: "shared" };
}

export interface StoredThread {
  id: string;
  a: UnitKey;
  b: UnitKey;
  kind: ThreadKind;
  note: string | null;
  scope: ConnectionScope;
}

/**
 * Refuse a prerequisite from world knowledge to a Firma or Privat unit: the
 * planet rule every thread keeps, for the prerequisite tables that
 * `zam_link_prereq` writes. Tokens of one unit are not checked.
 */
export async function assertPrerequisitePlanets(
  db: Database,
  tokenId: string,
  requiresId: string,
): Promise<void> {
  const units = await loadUnits(db);
  const unitOf = (id: string) => units.find((u) => u.tokenIds.includes(id));
  const dependent = unitOf(tokenId);
  const required = unitOf(requiresId);
  if (!dependent || !required || dependent.key === required.key) return;
  const planets = await loadUnitPlanets(
    db,
    [dependent, required],
    await loadBindings(db),
    await ownPlanetOf(db),
  );
  const end = (unit: UnitRow): ThreadEnd => ({
    key: unit.key,
    planet: planets.get(unit.key) ?? "welt",
  });
  orientThread("voraussetzung", end(dependent), end(required));
}

/**
 * Every directed thread as stored, the dependent end first: the library's,
 * the learners' own as far as this connection may read them, and the
 * prerequisites between units. A Verbindung has no direction. Reads only.
 */
export async function directedThreadEnds(
  db: Database,
  units: readonly UnitRow[],
): Promise<Array<{ a: UnitKey; b: UnitKey }>> {
  const ends: Array<{ a: UnitKey; b: UnitKey }> = [];
  for (const table of ["connections", "learner_connections"]) {
    const rows = (await db
      .prepare(`SELECT a_key, b_key FROM ${table} WHERE kind <> 'verbindung'`)
      .all()) as Array<{ a_key: string; b_key: string }>;
    for (const row of rows) {
      ends.push({ a: row.a_key as UnitKey, b: row.b_key as UnitKey });
    }
  }
  const unitOfToken = new Map<string, UnitKey>();
  for (const unit of units) {
    for (const id of unit.tokenIds) unitOfToken.set(id, unit.key);
  }
  const prerequisites = (await db
    .prepare("SELECT token_id, requires_id FROM prerequisites")
    .all()) as Array<{ token_id: string; requires_id: string }>;
  for (const edge of prerequisites) {
    const a = unitOfToken.get(edge.token_id);
    const b = unitOfToken.get(edge.requires_id);
    if (a && b && a !== b) ends.push({ a, b });
  }
  return ends;
}

/**
 * Pure: the units moving to `planet` that must stay where they are, each with
 * the unit that holds it, because moving it would let a thread run from
 * world knowledge to a Firma or Privat unit. Ends that move together stay
 * together; a thread that broke the rule before the move holds nothing.
 */
export function unitsHeldByThreads(
  ends: ReadonlyArray<{ a: UnitKey; b: UnitKey }>,
  moving: ReadonlySet<UnitKey>,
  planet: PlanetKind,
  planetOf: ReadonlyMap<UnitKey, PlanetKind>,
): Map<UnitKey, UnitKey> {
  const still = new Set(moving);
  const held = new Map<UnitKey, UnitKey>();
  const after = (key: UnitKey) => (still.has(key) ? planet : planetOf.get(key));
  // Holding one unit back can hold the next: repeat until nothing changes.
  for (let changed = true; changed; ) {
    changed = false;
    for (const { a, b } of ends) {
      const from = after(a);
      const to = after(b);
      if (from !== "welt" || to === undefined || to === "welt") continue;
      const stays = still.has(a) ? a : still.has(b) ? b : null;
      if (!stays) continue;
      still.delete(stays);
      held.set(stays, stays === a ? b : a);
      changed = true;
    }
  }
  return held;
}

/**
 * Pure: the first directed thread that runs from world knowledge to a Firma
 * or Privat unit after a change, where it did not before; null when none.
 */
export function newWorldCrossing(
  ends: ReadonlyArray<{ a: UnitKey; b: UnitKey }>,
  before: ReadonlyMap<UnitKey, PlanetKind>,
  after: ReadonlyMap<UnitKey, PlanetKind>,
): { a: UnitKey; b: UnitKey } | null {
  const crosses = (
    planets: ReadonlyMap<UnitKey, PlanetKind>,
    a: UnitKey,
    b: UnitKey,
  ) => {
    const to = planets.get(b);
    return planets.get(a) === "welt" && to !== undefined && to !== "welt";
  };
  return (
    ends.find(({ a, b }) => crosses(after, a, b) && !crosses(before, a, b)) ??
    null
  );
}

/**
 * Refuse a token's new domain when it moves the token's unit to another
 * planet (a world rule starts or stops covering it) and world knowledge would
 * then depend on a Firma or Privat unit (Decision 2). Checked before the
 * write; reads only.
 */
export async function assertDomainKeepsPlanets(
  db: Database,
  tokenId: string,
  domain: string,
): Promise<void> {
  const units = await loadUnits(db);
  const unit = units.find((u) => u.tokenIds.includes(tokenId));
  if (!unit || unit.atomId || unit.domain === domain) return;
  const bindings = await loadBindings(db);
  const own = await ownPlanetOf(db);
  const before = await loadUnitPlanets(db, units, bindings, own);
  const after = await loadUnitPlanets(
    db,
    units.map((u) => (u.key === unit.key ? { ...u, domain } : u)),
    bindings,
    own,
  );
  if (before.get(unit.key) === after.get(unit.key)) return;
  const crossing = newWorldCrossing(
    await directedThreadEnds(db, units),
    before,
    after,
  );
  if (crossing) {
    throw new PlanetError(
      "held-by-thread",
      `The domain "${domain}" would put ${unit.key} on the ${after.get(unit.key)} planet, and a thread or prerequisite between ${crossing.a} and ${crossing.b} would let world knowledge depend on a Firma or Privat unit.`,
    );
  }
}

/** The library's threads, then the learner's own. Reads only. */
export async function loadConnections(
  db: Database,
  userId: string,
): Promise<StoredThread[]> {
  type Row = {
    id: string;
    a_key: string;
    b_key: string;
    kind: string;
    note: string | null;
  };
  const toThread =
    (scope: ConnectionScope) =>
    (row: Row): StoredThread | null => {
      const kind = parseThreadKind(row.kind);
      return kind
        ? {
            id: row.id,
            a: row.a_key as UnitKey,
            b: row.b_key as UnitKey,
            kind,
            note: row.note,
            scope,
          }
        : null;
    };
  const shared = (await db
    .prepare("SELECT id, a_key, b_key, kind, note FROM connections ORDER BY id")
    .all()) as Row[];
  const personal = (await db
    .prepare(
      `SELECT id, a_key, b_key, kind, note FROM learner_connections
        WHERE user_id = ? ORDER BY id`,
    )
    .all(userId)) as Row[];
  return [
    ...shared.map(toThread("shared")),
    ...personal.map(toThread("personal")),
  ].filter((thread): thread is StoredThread => thread !== null);
}
