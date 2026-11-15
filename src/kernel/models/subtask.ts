/**
 * Subtasks of a guided-work session (ADR 2026-11-15, Decisions 1, 4 and 6).
 *
 * A subtask is a piece of work with an owner. The owner is who took it;
 * `done_by` is who finished it. A colleague is `other`: their work comes in
 * from a board through {@link planSubtasks} and never counts as the
 * learner's. `session_steps` is not involved: it stays the record that a
 * token was exercised.
 *
 * A subtask is addressed by its ordinal (1–9) within its session. Ordinals
 * never change, so a plan can name what a subtask waits for before any row
 * exists.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";

// ── Types ────────────────────────────────────────────────────────────────────

export const MAX_SUBTASKS = 9;

export type SubtaskOwner = "user" | "agent" | "other";
export type SubtaskState = "open" | "handed_over" | "done" | "cancelled";
export type SubtaskKind = "text" | "terminal" | "computer_use";
export type SubtaskCheck = "passed" | "failed" | "not_checked";
export type SubtaskHelp = "none" | "pointer" | "pattern" | "agent_did_it";

export interface Subtask {
  id: string;
  session_id: string;
  ordinal: number;
  title: string;
  done_criterion: string;
  kind: SubtaskKind;
  owner: SubtaskOwner;
  state: SubtaskState;
  /** Ordinals of the subtasks this one waits for. */
  waits_for: number[];
  /** Derived: open or handed over, and waiting for one that has not ended. */
  blocked: boolean;
  external_ref: string | null;
  done_by: SubtaskOwner | null;
  checked: SubtaskCheck | null;
  help: SubtaskHelp | null;
  commit_id: string | null;
  handed_over_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * One entry of a plan. With an ordinal that exists it changes that subtask;
 * otherwise it adds one. Only the fields that are given are changed.
 */
export interface PlanSubtaskInput {
  ordinal: number;
  title?: string;
  doneCriterion?: string;
  kind?: SubtaskKind;
  owner?: SubtaskOwner;
  waitsFor?: number[];
  externalRef?: string | null;
  /**
   * What happened on the board (Decision 4): a colleague finished the item,
   * or it was removed. A subtask never becomes done by the learner or the
   * agent this way; that is {@link closeSubtask}.
   */
  state?: "done_by_other" | "cancelled";
}

export interface PlanSubtasksInput {
  sessionId: string;
  subtasks: PlanSubtaskInput[];
}

export interface HandOverSubtaskInput {
  sessionId: string;
  ordinal: number;
}

export interface CloseSubtaskInput {
  sessionId: string;
  ordinal: number;
  doneBy: "user" | "agent";
  checked: SubtaskCheck;
  help?: SubtaskHelp;
  commitId?: string | null;
}

/** A refusal by one of the subtask rules, as opposed to a broken call. */
export class SubtaskRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SubtaskRuleError";
  }
}

// ── Limits ───────────────────────────────────────────────────────────────────

const TITLE_MAX = 120;
const CRITERION_MAX = 300;
const EXTERNAL_REF_MAX = 300;
const EXTERNAL_ID = /^[A-Za-z0-9#_.-]{1,64}$/;
const COMMIT_ID = /^[0-9a-f]{7,40}$/;
const KINDS: readonly SubtaskKind[] = ["text", "terminal", "computer_use"];
const OWNERS: readonly SubtaskOwner[] = ["user", "agent", "other"];
const CHECKS: readonly SubtaskCheck[] = ["passed", "failed", "not_checked"];
const HELPS: readonly SubtaskHelp[] = [
  "none",
  "pointer",
  "pattern",
  "agent_did_it",
];

function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return true;
  }
  return false;
}

function cleanText(
  value: string,
  label: string,
  max: number,
  allowEmpty: boolean,
): string {
  const text = value.trim();
  if (!allowEmpty && text.length === 0) {
    throw new SubtaskRuleError(`${label} must not be empty`);
  }
  if (text.length > max) {
    throw new SubtaskRuleError(`${label} must be at most ${max} characters`);
  }
  if (hasControlCharacter(text)) {
    throw new SubtaskRuleError(
      `${label} must be plain text on one line, without control characters`,
    );
  }
  return text;
}

/** A link or an id for people. It is stored and returned, never fetched. */
function cleanExternalRef(value: string | null): string | null {
  if (value === null) return null;
  const ref = value.trim();
  if (ref.length === 0) return null;
  if (ref.length > EXTERNAL_REF_MAX || hasControlCharacter(ref)) {
    throw new SubtaskRuleError(
      `externalRef must be at most ${EXTERNAL_REF_MAX} plain characters`,
    );
  }
  if (EXTERNAL_ID.test(ref)) return ref;
  let url: URL;
  try {
    url = new URL(ref);
  } catch {
    throw new SubtaskRuleError(
      "externalRef must be an http(s) link or a short id",
    );
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SubtaskRuleError(
      "externalRef must be an http(s) link or a short id",
    );
  }
  return ref;
}

function checkOrdinal(ordinal: unknown): number {
  if (
    typeof ordinal !== "number" ||
    !Number.isInteger(ordinal) ||
    ordinal < 1 ||
    ordinal > MAX_SUBTASKS
  ) {
    throw new SubtaskRuleError(
      `ordinal must be a whole number from 1 to ${MAX_SUBTASKS}`,
    );
  }
  return ordinal;
}

function checkWaitsFor(waitsFor: unknown): number[] {
  if (!Array.isArray(waitsFor)) {
    throw new SubtaskRuleError("waitsFor must be a list of ordinals");
  }
  return [...new Set(waitsFor.map(checkOrdinal))].sort((a, b) => a - b);
}

// ── Rows ─────────────────────────────────────────────────────────────────────

interface SubtaskRow {
  id: string;
  session_id: string;
  ordinal: number;
  title: string;
  done_criterion: string;
  kind: SubtaskKind;
  owner: SubtaskOwner;
  state: SubtaskState;
  waits_for: string;
  external_ref: string | null;
  done_by: SubtaskOwner | null;
  checked: SubtaskCheck | null;
  help: SubtaskHelp | null;
  commit_id: string | null;
  handed_over_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

function parseWaits(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => Number.isInteger(n))
      : [];
  } catch {
    return [];
  }
}

const hasEnded = (state: SubtaskState): boolean =>
  state === "done" || state === "cancelled";

function toSubtasks(rows: SubtaskRow[]): Subtask[] {
  const sorted = [...rows].sort((a, b) => a.ordinal - b.ordinal);
  const stateOf = new Map(sorted.map((row) => [row.ordinal, row.state]));
  return sorted.map((row) => {
    const waits = parseWaits(row.waits_for);
    const blocked =
      !hasEnded(row.state) &&
      waits.some((ordinal) => {
        const state = stateOf.get(ordinal);
        return state !== undefined && !hasEnded(state);
      });
    return { ...row, waits_for: waits, blocked };
  });
}

async function loadRows(
  db: Database,
  sessionId: string,
): Promise<SubtaskRow[]> {
  return (await db
    .prepare(
      "SELECT * FROM session_subtasks WHERE session_id = ? ORDER BY ordinal",
    )
    .all(sessionId)) as SubtaskRow[];
}

/** Throws when the session is missing, or has ended and `write` is set. */
async function requireSession(
  db: Database,
  sessionId: string,
  write: boolean,
): Promise<void> {
  const session = (await db
    .prepare("SELECT id, completed_at FROM sessions WHERE id = ?")
    .get(sessionId)) as { id: string; completed_at: string | null } | undefined;
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  if (write && session.completed_at) {
    throw new SubtaskRuleError(
      `Session already completed: ${sessionId}. Its subtasks can no longer change.`,
    );
  }
}

async function writeRow(db: Database, row: SubtaskRow, insert: boolean) {
  if (insert) {
    await db
      .prepare(
        `INSERT INTO session_subtasks
           (id, session_id, ordinal, title, done_criterion, kind, owner, state,
            waits_for, external_ref, done_by, checked, help, commit_id,
            handed_over_at, closed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        row.id,
        row.session_id,
        row.ordinal,
        row.title,
        row.done_criterion,
        row.kind,
        row.owner,
        row.state,
        row.waits_for,
        row.external_ref,
        row.done_by,
        row.checked,
        row.help,
        row.commit_id,
        row.handed_over_at,
        row.closed_at,
        row.created_at,
        row.updated_at,
      );
    return;
  }
  await db
    .prepare(
      `UPDATE session_subtasks
          SET title = ?, done_criterion = ?, kind = ?, owner = ?, state = ?,
              waits_for = ?, external_ref = ?, done_by = ?, checked = ?,
              help = ?, commit_id = ?, handed_over_at = ?, closed_at = ?,
              updated_at = ?
        WHERE id = ?`,
    )
    .run(
      row.title,
      row.done_criterion,
      row.kind,
      row.owner,
      row.state,
      row.waits_for,
      row.external_ref,
      row.done_by,
      row.checked,
      row.help,
      row.commit_id,
      row.handed_over_at,
      row.closed_at,
      row.updated_at,
      row.id,
    );
}

// ── Plan ─────────────────────────────────────────────────────────────────────

function newRow(
  sessionId: string,
  entry: PlanSubtaskInput,
  ordinal: number,
  now: string,
): SubtaskRow {
  if (entry.title === undefined || entry.kind === undefined) {
    throw new SubtaskRuleError(
      `Subtask ${ordinal} is new and needs a title and a kind`,
    );
  }
  if (entry.owner === undefined) {
    throw new SubtaskRuleError(`Subtask ${ordinal} is new and needs an owner`);
  }
  if (entry.state !== undefined) {
    throw new SubtaskRuleError(
      `Subtask ${ordinal} is new and cannot start as ended`,
    );
  }
  if (!KINDS.includes(entry.kind)) {
    throw new SubtaskRuleError(`Subtask ${ordinal}: unknown kind`);
  }
  if (!OWNERS.includes(entry.owner)) {
    throw new SubtaskRuleError(`Subtask ${ordinal}: unknown owner`);
  }
  return {
    id: ulid(),
    session_id: sessionId,
    ordinal,
    title: cleanText(entry.title, "title", TITLE_MAX, false),
    done_criterion: cleanText(
      entry.doneCriterion ?? "",
      "doneCriterion",
      CRITERION_MAX,
      true,
    ),
    kind: entry.kind,
    owner: entry.owner,
    state: "open",
    waits_for: JSON.stringify(checkWaitsFor(entry.waitsFor ?? [])),
    external_ref: cleanExternalRef(entry.externalRef ?? null),
    done_by: null,
    checked: null,
    help: null,
    commit_id: null,
    handed_over_at: null,
    closed_at: null,
    created_at: now,
    updated_at: now,
  };
}

/** An ended subtask keeps everything but its reference. */
function changeEndedRow(
  row: SubtaskRow,
  entry: PlanSubtaskInput,
  now: string,
): SubtaskRow {
  const sameState =
    entry.state === undefined ||
    (entry.state === "cancelled" && row.state === "cancelled") ||
    (entry.state === "done_by_other" &&
      row.state === "done" &&
      row.done_by === "other");
  const unchanged =
    sameState &&
    (entry.title === undefined || entry.title.trim() === row.title) &&
    (entry.doneCriterion === undefined ||
      entry.doneCriterion.trim() === row.done_criterion) &&
    (entry.kind === undefined || entry.kind === row.kind) &&
    (entry.owner === undefined || entry.owner === row.owner) &&
    (entry.waitsFor === undefined ||
      JSON.stringify(checkWaitsFor(entry.waitsFor)) === row.waits_for);
  if (!unchanged) {
    throw new SubtaskRuleError(
      `Subtask ${row.ordinal} has ended. Only its reference can still change.`,
    );
  }
  if (entry.externalRef === undefined) return row;
  return {
    ...row,
    external_ref: cleanExternalRef(entry.externalRef),
    updated_at: now,
  };
}

function changeLiveRow(
  row: SubtaskRow,
  entry: PlanSubtaskInput,
  now: string,
): SubtaskRow {
  const next: SubtaskRow = { ...row, updated_at: now };
  if (entry.title !== undefined) {
    next.title = cleanText(entry.title, "title", TITLE_MAX, false);
  }
  if (entry.doneCriterion !== undefined) {
    next.done_criterion = cleanText(
      entry.doneCriterion,
      "doneCriterion",
      CRITERION_MAX,
      true,
    );
  }
  if (entry.kind !== undefined) {
    if (!KINDS.includes(entry.kind)) {
      throw new SubtaskRuleError(`Subtask ${row.ordinal}: unknown kind`);
    }
    next.kind = entry.kind;
  }
  if (entry.owner !== undefined) {
    if (!OWNERS.includes(entry.owner)) {
      throw new SubtaskRuleError(`Subtask ${row.ordinal}: unknown owner`);
    }
    next.owner = entry.owner;
    // Only the learner's own subtask can be handed over to them.
    if (next.owner !== "user" && next.state === "handed_over") {
      next.state = "open";
      next.handed_over_at = null;
    }
  }
  if (entry.waitsFor !== undefined) {
    next.waits_for = JSON.stringify(checkWaitsFor(entry.waitsFor));
  }
  if (entry.externalRef !== undefined) {
    next.external_ref = cleanExternalRef(entry.externalRef);
  }
  if (entry.state === "cancelled") {
    next.state = "cancelled";
    next.closed_at = now;
  } else if (entry.state === "done_by_other") {
    next.state = "done";
    next.done_by = "other";
    next.closed_at = now;
  } else if (entry.state !== undefined) {
    throw new SubtaskRuleError(
      `Subtask ${row.ordinal}: a plan can only cancel a subtask or record that a colleague finished it`,
    );
  }
  return next;
}

/** Every ordinal a subtask waits for must exist, and nothing may wait in a circle. */
function checkWaitGraph(rows: Map<number, SubtaskRow>): void {
  const waits = new Map<number, number[]>();
  for (const row of rows.values()) {
    const list = parseWaits(row.waits_for);
    for (const ordinal of list) {
      if (ordinal === row.ordinal) {
        throw new SubtaskRuleError(
          `Subtask ${row.ordinal} cannot wait for itself`,
        );
      }
      if (!rows.has(ordinal)) {
        throw new SubtaskRuleError(
          `Subtask ${row.ordinal} waits for subtask ${ordinal}, which does not exist`,
        );
      }
    }
    waits.set(row.ordinal, list);
  }
  const done = new Set<number>();
  const onPath = new Set<number>();
  const visit = (ordinal: number): void => {
    if (done.has(ordinal)) return;
    if (onPath.has(ordinal)) {
      throw new SubtaskRuleError(
        `Subtask ${ordinal} waits for itself through other subtasks`,
      );
    }
    onPath.add(ordinal);
    for (const next of waits.get(ordinal) ?? []) visit(next);
    onPath.delete(ordinal);
    done.add(ordinal);
  };
  for (const ordinal of waits.keys()) visit(ordinal);
}

/**
 * Record or update the plan of a session and return its current list.
 *
 * The call can be repeated: it adds subtasks, attaches board references and
 * applies what changed on a board. With an empty list it only reads, which
 * also works for a session that has ended.
 */
export async function planSubtasks(
  db: Database,
  input: PlanSubtasksInput,
): Promise<Subtask[]> {
  if (!Array.isArray(input.subtasks)) {
    throw new SubtaskRuleError("subtasks must be a list");
  }
  if (input.subtasks.length === 0) {
    await requireSession(db, input.sessionId, false);
    return toSubtasks(await loadRows(db, input.sessionId));
  }

  return db.transaction(async (tx) => {
    await requireSession(tx, input.sessionId, true);
    const rows = new Map(
      (await loadRows(tx, input.sessionId)).map((row) => [row.ordinal, row]),
    );
    const now = new Date().toISOString();
    const inserts = new Set<number>();
    const touched = new Set<number>();

    for (const entry of input.subtasks) {
      const ordinal = checkOrdinal(entry.ordinal);
      if (touched.has(ordinal)) {
        throw new SubtaskRuleError(
          `Subtask ${ordinal} appears twice in one plan`,
        );
      }
      touched.add(ordinal);
      const existing = rows.get(ordinal);
      if (!existing) {
        rows.set(ordinal, newRow(input.sessionId, entry, ordinal, now));
        inserts.add(ordinal);
      } else if (hasEnded(existing.state)) {
        rows.set(ordinal, changeEndedRow(existing, entry, now));
      } else {
        rows.set(ordinal, changeLiveRow(existing, entry, now));
      }
    }

    checkWaitGraph(rows);

    for (const ordinal of touched) {
      const row = rows.get(ordinal);
      if (row) await writeRow(tx, row, inserts.has(ordinal));
    }
    return toSubtasks([...rows.values()]);
  });
}

// ── Hand over and close ──────────────────────────────────────────────────────

async function requireSubtask(
  db: Database,
  sessionId: string,
  ordinal: number,
): Promise<{ row: SubtaskRow; all: SubtaskRow[] }> {
  const all = await loadRows(db, sessionId);
  const row = all.find((candidate) => candidate.ordinal === ordinal);
  if (!row) {
    throw new SubtaskRuleError(
      `Subtask ${ordinal} does not exist in session ${sessionId}`,
    );
  }
  return { row, all };
}

function isBlocked(row: SubtaskRow, all: SubtaskRow[]): boolean {
  return (
    toSubtasks(all).find((subtask) => subtask.ordinal === row.ordinal)
      ?.blocked ?? false
  );
}

/**
 * Mark the learner's subtask as handed over (Decision 6). Repeating the
 * call for a subtask that is already handed over changes nothing.
 */
export async function handOverSubtask(
  db: Database,
  input: HandOverSubtaskInput,
): Promise<Subtask[]> {
  const ordinal = checkOrdinal(input.ordinal);
  return db.transaction(async (tx) => {
    await requireSession(tx, input.sessionId, true);
    const { row, all } = await requireSubtask(tx, input.sessionId, ordinal);
    if (row.owner !== "user") {
      throw new SubtaskRuleError(
        `Subtask ${ordinal} is not the learner's, so it cannot be handed over`,
      );
    }
    if (row.state === "handed_over") return toSubtasks(all);
    if (row.state !== "open") {
      throw new SubtaskRuleError(`Subtask ${ordinal} has already ended`);
    }
    if (isBlocked(row, all)) {
      throw new SubtaskRuleError(
        `Subtask ${ordinal} still waits for another subtask`,
      );
    }
    const now = new Date().toISOString();
    const next: SubtaskRow = {
      ...row,
      state: "handed_over",
      handed_over_at: now,
      updated_at: now,
    };
    await writeRow(tx, next, false);
    return toSubtasks(all.map((r) => (r.id === next.id ? next : r)));
  });
}

/**
 * Close a subtask this session finished, with who did it and its evidence
 * (Decisions 5 and 6).
 *
 * `doneBy: "user"` needs the learner's subtask in the state `handed_over`.
 * `doneBy: "agent"` closes the agent's own subtask, or the learner's when
 * the agent did it for them (`help: "agent_did_it"`). A colleague's work is
 * not closed here; it comes in through {@link planSubtasks}.
 */
export async function closeSubtask(
  db: Database,
  input: CloseSubtaskInput,
): Promise<Subtask[]> {
  const ordinal = checkOrdinal(input.ordinal);
  if (input.doneBy !== "user" && input.doneBy !== "agent") {
    throw new SubtaskRuleError("doneBy must be user or agent");
  }
  if (!CHECKS.includes(input.checked)) {
    throw new SubtaskRuleError("checked must be passed, failed or not_checked");
  }
  if (input.help !== undefined && !HELPS.includes(input.help)) {
    throw new SubtaskRuleError(
      "help must be none, pointer, pattern or agent_did_it",
    );
  }
  const commitId = input.commitId?.trim() || null;
  if (commitId !== null && !COMMIT_ID.test(commitId)) {
    throw new SubtaskRuleError("commitId must be 7 to 40 hex characters");
  }

  return db.transaction(async (tx) => {
    await requireSession(tx, input.sessionId, true);
    const { row, all } = await requireSubtask(tx, input.sessionId, ordinal);
    if (hasEnded(row.state)) {
      throw new SubtaskRuleError(`Subtask ${ordinal} has already ended`);
    }
    if (row.owner === "other") {
      throw new SubtaskRuleError(
        `Subtask ${ordinal} belongs to a colleague. Record what they did with the plan.`,
      );
    }

    let help: SubtaskHelp | null;
    if (input.doneBy === "user") {
      if (row.owner !== "user") {
        throw new SubtaskRuleError(
          `Subtask ${ordinal} is the agent's and cannot close as the learner's work`,
        );
      }
      if (row.state !== "handed_over") {
        throw new SubtaskRuleError(
          `Subtask ${ordinal} was not handed over, so it cannot close as the learner's work`,
        );
      }
      help = input.help ?? "none";
      if (help === "agent_did_it") {
        throw new SubtaskRuleError(
          `Subtask ${ordinal}: work the agent did closes with doneBy agent`,
        );
      }
    } else if (row.owner === "user") {
      if (input.help !== "agent_did_it") {
        throw new SubtaskRuleError(
          `Subtask ${ordinal} is the learner's. The agent closes it only with help agent_did_it.`,
        );
      }
      help = "agent_did_it";
    } else {
      if (isBlocked(row, all)) {
        throw new SubtaskRuleError(
          `Subtask ${ordinal} still waits for another subtask`,
        );
      }
      help = null;
    }

    const now = new Date().toISOString();
    const next: SubtaskRow = {
      ...row,
      state: "done",
      done_by: input.doneBy,
      checked: input.checked,
      help,
      commit_id: commitId,
      closed_at: now,
      updated_at: now,
    };
    await writeRow(tx, next, false);
    return toSubtasks(all.map((r) => (r.id === next.id ? next : r)));
  });
}

/** The subtasks of a session, in their order. */
export async function listSubtasks(
  db: Database,
  sessionId: string,
): Promise<Subtask[]> {
  await requireSession(db, sessionId, false);
  return toSubtasks(await loadRows(db, sessionId));
}
