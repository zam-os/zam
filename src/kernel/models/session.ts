/**
 * Session repository — typed wrappers around sessions and session_steps.
 *
 * A session represents a work+learning episode. Steps within a session
 * record which tokens were touched and by whom (user or agent).
 */

import type { Database } from "better-sqlite3";
import { ulid } from "ulid";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Session {
  id: string;
  user_id: string;
  task: string;
  started_at: string;
  completed_at: string | null;
}

export interface SessionStep {
  id: string;
  session_id: string;
  token_id: string;
  done_by: "user" | "agent";
  rating: number | null; // 1-4 or null
  notes: string | null;
  created_at: string;
}

export interface CreateSessionInput {
  user_id: string;
  task: string;
}

export interface LogStepInput {
  session_id: string;
  token_id: string;
  done_by: "user" | "agent";
  rating?: number | null;
  notes?: string | null;
}

/** A step joined with its token details, returned by getSessionSummary. */
export interface StepWithToken extends SessionStep {
  slug: string;
  concept: string;
  domain: string;
  bloom_level: number;
}

export interface SessionSummary {
  session: Session;
  steps: StepWithToken[];
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Start a new session. Returns the created session.
 *
 * Ported from the PoC's start-session command.
 */
export function startSession(db: Database, input: CreateSessionInput): Session {
  const id = ulid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, task, started_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, input.user_id, input.task, now);

  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(id) as Session;
}

/**
 * End a session by setting its completed_at timestamp.
 *
 * Throws if the session does not exist or is already completed.
 *
 * Ported from the PoC's end-session command.
 */
export function endSession(db: Database, sessionId: string): Session {
  const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as
    | Session
    | undefined;

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  if (session.completed_at) {
    throw new Error(`Session already completed: ${sessionId}`);
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE sessions SET completed_at = ? WHERE id = ?").run(now, sessionId);

  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as Session;
}

/**
 * Log a step within a session.
 *
 * Validates that done_by is 'user' or 'agent' and that the rating
 * (if provided) is between 1 and 4.
 *
 * Ported from the PoC's log-step command.
 */
export function logStep(db: Database, input: LogStepInput): SessionStep {
  if (input.done_by !== "user" && input.done_by !== "agent") {
    throw new Error(`done_by must be 'user' or 'agent', got '${input.done_by}'`);
  }
  if (input.rating != null && (input.rating < 1 || input.rating > 4)) {
    throw new Error(`Rating must be between 1 and 4, got ${input.rating}`);
  }

  // Verify the session exists
  const session = db.prepare("SELECT id FROM sessions WHERE id = ?").get(input.session_id);
  if (!session) {
    throw new Error(`Session not found: ${input.session_id}`);
  }

  const id = ulid();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO session_steps (id, session_id, token_id, done_by, rating, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.session_id,
    input.token_id,
    input.done_by,
    input.rating ?? null,
    input.notes ?? null,
    now,
  );

  return db.prepare("SELECT * FROM session_steps WHERE id = ?").get(id) as SessionStep;
}

/**
 * Get a full session summary: the session record plus all steps
 * joined with their token details.
 *
 * Ported from the PoC's session-summary command.
 * Throws if the session does not exist.
 */
export function getSessionSummary(
  db: Database,
  sessionId: string,
): SessionSummary {
  const session = db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId) as Session | undefined;

  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  const steps = db
    .prepare(
      `SELECT ss.*, t.slug, t.concept, t.domain, t.bloom_level
       FROM session_steps ss
       JOIN tokens t ON t.id = ss.token_id
       WHERE ss.session_id = ?
       ORDER BY ss.created_at ASC`,
    )
    .all(sessionId) as StepWithToken[];

  return { session, steps };
}
