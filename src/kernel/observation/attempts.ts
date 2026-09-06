/**
 * Observed-attempt identity: one ULID links a direct submission, a
 * monitor/UI candidate, confirmation and session synthesis. The same
 * attempt cannot write two FSRS reviews. A different independent attempt
 * is new evidence even when it shares a session and token.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { getCardById } from "../models/card.js";
import { getTokenById } from "../models/token.js";
import type { Rating } from "../scheduler/fsrs.js";

export type AttemptChannel =
  | "direct"
  | "monitor"
  | "ui_observer"
  | "synthesis"
  | "recall";

export type AttemptStatus = "suggestion" | "recorded" | "rated" | "conflict";
export type AttemptActor = "user" | "agent";

export class AttemptConflictError extends Error {
  readonly attemptId: string;
  readonly existingRating: number | null;
  readonly proposedRating: number | null;

  constructor(
    attemptId: string,
    existingRating: number | null,
    proposedRating: number | null,
  ) {
    super("This attempt already has a different assessment");
    this.name = "AttemptConflictError";
    this.attemptId = attemptId;
    this.existingRating = existingRating;
    this.proposedRating = proposedRating;
  }
}

export class AssistedSuccessError extends Error {
  constructor() {
    super("Assisted work cannot be recorded as an FSRS success");
    this.name = "AssistedSuccessError";
  }
}

export interface ReviewAttempt {
  id: string;
  user_id: string;
  card_id: string | null;
  token_id: string;
  content_version: number | null;
  session_id: string | null;
  activity: string;
  actor: AttemptActor;
  permitted_tools: string[];
  assistance: string;
  independent: boolean | null;
  channel: AttemptChannel;
  evidence: Record<string, unknown>;
  evidence_key: string | null;
  suggested_rating: Rating | null;
  rating: Rating | null;
  review_log_id: string | null;
  session_step_id: string | null;
  status: AttemptStatus;
  conflict_note: string | null;
  created_at: string;
  updated_at: string;
}

interface AttemptRow {
  id: string;
  user_id: string;
  card_id: string | null;
  token_id: string;
  content_version: number | null;
  session_id: string | null;
  activity: string;
  actor: AttemptActor;
  permitted_tools: string;
  assistance: string;
  independent: number | null;
  channel: AttemptChannel;
  evidence: string;
  evidence_key: string | null;
  suggested_rating: Rating | null;
  rating: Rating | null;
  review_log_id: string | null;
  session_step_id: string | null;
  status: AttemptStatus;
  conflict_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecordAttemptInput {
  id?: string;
  userId: string;
  cardId?: string | null;
  tokenId: string;
  sessionId?: string | null;
  activity?: string;
  actor: AttemptActor;
  permittedTools?: string[];
  assistance?: string;
  independent?: boolean | null;
  channel: AttemptChannel;
  evidence?: Record<string, unknown>;
  evidenceKey?: string | null;
  suggestedRating?: Rating | null;
  rating?: Rating | null;
  reviewLogId?: string | null;
  sessionStepId?: string | null;
  status: AttemptStatus;
  conflictNote?: string | null;
  now?: Date;
}

function parseTools(raw: string): string[] {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string")
      : [];
  } catch {
    return [];
  }
}

function parseEvidence(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw) as unknown;
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseAttempt(row: AttemptRow): ReviewAttempt {
  return {
    ...row,
    permitted_tools: parseTools(row.permitted_tools),
    evidence: parseEvidence(row.evidence),
    independent: row.independent == null ? null : row.independent === 1,
  };
}

export function observationEvidenceKey(matchedCommandTexts: string[]): string {
  return matchedCommandTexts
    .map((text) => text.trim())
    .filter(Boolean)
    .join("\n");
}

export async function getAttemptById(
  db: Database,
  attemptId: string,
): Promise<ReviewAttempt | undefined> {
  const row = (await db
    .prepare("SELECT * FROM review_attempts WHERE id = ?")
    .get(attemptId)) as AttemptRow | undefined;
  return row ? parseAttempt(row) : undefined;
}

export async function findAttemptByEvidenceKey(
  db: Database,
  input: { sessionId: string; tokenId: string; evidenceKey: string },
): Promise<ReviewAttempt | undefined> {
  if (input.evidenceKey == null) return undefined;
  const row = (await db
    .prepare(
      `SELECT * FROM review_attempts
        WHERE session_id = ? AND token_id = ? AND evidence_key = ?
        ORDER BY created_at
        LIMIT 1`,
    )
    .get(input.sessionId, input.tokenId, input.evidenceKey)) as
    | AttemptRow
    | undefined;
  return row ? parseAttempt(row) : undefined;
}

export function assertAttemptAllowsRating(
  independent: boolean | null | undefined,
  rating: Rating | null | undefined,
  actor: AttemptActor,
): void {
  if (rating == null) return;
  if (actor === "agent") {
    throw new Error("Agent-completed steps must not include a rating");
  }
  if (independent === false && rating >= 2) {
    throw new AssistedSuccessError();
  }
}

/**
 * Insert or update an attempt row. Same id with a conflicting rated
 * assessment is refused; identical retries return the existing row.
 */
export async function recordAttempt(
  db: Database,
  input: RecordAttemptInput,
): Promise<{ attempt: ReviewAttempt; created: boolean; replayed: boolean }> {
  const now = (input.now ?? new Date()).toISOString();
  let existing: ReviewAttempt | undefined;
  if (input.id) {
    existing = await getAttemptById(db, input.id);
  } else if (input.sessionId && input.evidenceKey) {
    existing = await findAttemptByEvidenceKey(db, {
      sessionId: input.sessionId,
      tokenId: input.tokenId,
      evidenceKey: input.evidenceKey,
    });
  }

  if (existing) {
    if (existing.user_id !== input.userId) {
      throw new Error(
        `Attempt ${existing.id} does not belong to user ${input.userId}`,
      );
    }
    if (existing.token_id !== input.tokenId) {
      throw new Error(
        `Attempt ${existing.id} is for a different item than ${input.tokenId}`,
      );
    }
    const existingRating = existing.rating;
    const proposed = input.rating ?? null;
    if (existing.status === "rated" && existingRating != null) {
      if (proposed != null && proposed !== existingRating) {
        await db
          .prepare(
            `UPDATE review_attempts
                SET status = 'conflict',
                    conflict_note = ?,
                    updated_at = ?
              WHERE id = ?`,
          )
          .run(
            `existing ${existingRating}, proposed ${proposed}`,
            now,
            existing.id,
          );
        throw new AttemptConflictError(existing.id, existingRating, proposed);
      }
      return { attempt: existing, created: false, replayed: true };
    }
    if (existing.status === "recorded" && input.status === "rated") {
      throw new AttemptConflictError(existing.id, existing.rating, proposed);
    }
    if (existing.status === "recorded" && input.status === "recorded") {
      return { attempt: existing, created: false, replayed: true };
    }
    if (existing.status === "conflict") {
      throw new AttemptConflictError(existing.id, existing.rating, proposed);
    }
  }

  const token = await getTokenById(db, input.tokenId);
  if (!token) throw new Error(`Token not found: ${input.tokenId}`);
  const versionRow = (await db
    .prepare("SELECT content_version FROM tokens WHERE id = ?")
    .get(input.tokenId)) as { content_version: number } | undefined;
  if (input.cardId) {
    const card = await getCardById(db, input.cardId);
    if (!card) throw new Error(`Card not found: ${input.cardId}`);
    if (card.user_id !== input.userId) {
      throw new Error(
        `Card ${input.cardId} does not belong to user ${input.userId}`,
      );
    }
  }

  assertAttemptAllowsRating(
    input.independent ?? existing?.independent ?? null,
    input.rating ?? null,
    input.actor,
  );

  const id = existing?.id ?? input.id ?? ulid();
  const independent =
    input.independent === undefined
      ? (existing?.independent ?? null)
      : input.independent;
  const tools = JSON.stringify(
    input.permittedTools ?? existing?.permitted_tools ?? [],
  );
  const evidence = JSON.stringify(input.evidence ?? existing?.evidence ?? {});

  if (existing) {
    await db
      .prepare(
        `UPDATE review_attempts
            SET card_id = COALESCE(?, card_id),
                session_id = COALESCE(?, session_id),
                activity = CASE WHEN ? = '' THEN activity ELSE ? END,
                permitted_tools = ?,
                assistance = CASE WHEN ? = '' THEN assistance ELSE ? END,
                independent = ?,
                evidence = ?,
                evidence_key = COALESCE(?, evidence_key),
                suggested_rating = COALESCE(?, suggested_rating),
                rating = COALESCE(?, rating),
                review_log_id = COALESCE(?, review_log_id),
                session_step_id = COALESCE(?, session_step_id),
                status = ?,
                conflict_note = ?,
                updated_at = ?
          WHERE id = ?`,
      )
      .run(
        input.cardId ?? null,
        input.sessionId ?? null,
        input.activity ?? "",
        input.activity ?? "",
        tools,
        input.assistance ?? "",
        input.assistance ?? "",
        independent == null ? null : independent ? 1 : 0,
        evidence,
        input.evidenceKey ?? null,
        input.suggestedRating ?? null,
        input.rating ?? null,
        input.reviewLogId ?? null,
        input.sessionStepId ?? null,
        input.status,
        input.conflictNote ?? null,
        now,
        id,
      );
  } else {
    await db
      .prepare(
        `INSERT INTO review_attempts (
           id, user_id, card_id, token_id, content_version, session_id,
           activity, actor, permitted_tools, assistance, independent,
           channel, evidence, evidence_key, suggested_rating, rating,
           review_log_id, session_step_id, status, conflict_note,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.userId,
        input.cardId ?? null,
        input.tokenId,
        versionRow?.content_version ?? null,
        input.sessionId ?? null,
        input.activity ?? "",
        input.actor,
        tools,
        input.assistance ?? "",
        independent == null ? null : independent ? 1 : 0,
        input.channel,
        evidence,
        input.evidenceKey ?? null,
        input.suggestedRating ?? null,
        input.rating ?? null,
        input.reviewLogId ?? null,
        input.sessionStepId ?? null,
        input.status,
        input.conflictNote ?? null,
        now,
        now,
      );
  }

  const attempt = await getAttemptById(db, id);
  if (!attempt) throw new Error(`Attempt not found after write: ${id}`);
  return { attempt, created: !existing, replayed: false };
}
