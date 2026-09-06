/**
 * Session synthesis connects shell observation to durable learning state.
 *
 * A preview analyzes monitor commands without mutating the database. Applying
 * one confirmed candidate updates the card, review log, session step, blocking
 * state, and synthesis audit record in a single transaction.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { cancelMatchingPreconditionDeferrals } from "../library/precondition-assessment.js";
import { listAgentSkills } from "../models/agent-skill.js";
import { ensureCard } from "../models/card.js";
import { getPrerequisites } from "../models/prerequisite.js";
import type { Session } from "../models/session.js";
import { logStep } from "../models/session.js";
import type { Token } from "../models/token.js";
import { getTokenBySlug, getTokensBySlugs } from "../models/token.js";
import { evaluateRatingWithinTransaction } from "../recall/evaluator.js";
import { cascadeBlock } from "../scheduler/blocker.js";
import type { Rating } from "../scheduler/fsrs.js";
import type {
  CommandRecord,
  ObservationRating,
  TokenPattern,
} from "./analyzer.js";
import { analyzeObservation, pairCommands } from "./analyzer.js";
import {
  AttemptConflictError,
  findAttemptByEvidenceKey,
  getAttemptById,
  observationEvidenceKey,
  recordAttempt,
} from "./attempts.js";
import { readMonitorLog } from "./monitor-io.js";
import { readUiObservationLog } from "./ui-observer-io.js";
import {
  buildUiSynthesisCandidates,
  uiObservationTimeSpan,
} from "./ui-observer-synthesis.js";

export type SynthesisConfidence = "medium" | "high";

export interface SessionSynthesisCandidate {
  tokenId: string;
  tokenSlug: string;
  concept: string;
  domain: string;
  inferredRating: Rating | null;
  confidence: SynthesisConfidence;
  evidence: ObservationRating["evidence"];
  matchedCommandTexts: string[];
  evidenceKey: string;
}

export interface PrepareSessionSynthesisInput {
  sessionId: string;
  explicitPatterns?: TokenPattern[];
  minConfidence?: SynthesisConfidence;
  /** Test and integration hook; normal callers read the monitor log. */
  commands?: CommandRecord[];
}

export interface SessionSynthesisPreview {
  sessionId: string;
  userId: string;
  patternCount: number;
  commandCount: number;
  alreadyApplied: number;
  skippedLowConfidence: number;
  candidates: SessionSynthesisCandidate[];
  unmatchedCommands: string[];
  timeSpan: {
    start: string;
    end: string;
    durationMs: number;
  } | null;
}

export interface SessionSynthesisEvidence {
  signals: ObservationRating["evidence"];
  matchedCommandTexts: string[];
}

export interface SessionSynthesisRecord {
  id: string;
  session_id: string;
  token_id: string;
  attempt_id: string | null;
  card_id: string;
  inferred_rating: Rating | null;
  confirmed_rating: Rating;
  confidence: SynthesisConfidence;
  evidence: SessionSynthesisEvidence;
  review_log_id: string;
  session_step_id: string;
  created_at: string;
}

interface SessionSynthesisRow extends Omit<SessionSynthesisRecord, "evidence"> {
  evidence: string;
}

export interface ApplySessionSynthesisInput {
  sessionId: string;
  tokenSlug: string;
  inferredRating: Rating | null;
  confirmedRating: Rating;
  confidence: SynthesisConfidence;
  evidence: ObservationRating["evidence"];
  matchedCommandTexts: string[];
  attemptId?: string;
  independent?: boolean | null;
  activity?: string;
  assistance?: string;
  permittedTools?: string[];
}

export interface ApplySessionSynthesisResult {
  applied: boolean;
  record: SessionSynthesisRecord;
  blocked?: Awaited<ReturnType<typeof cascadeBlock>>;
}

function parseSynthesisRow(row: SessionSynthesisRow): SessionSynthesisRecord {
  return {
    ...row,
    evidence: JSON.parse(row.evidence) as SessionSynthesisEvidence,
  };
}

function confidenceRank(confidence: ObservationRating["confidence"]): number {
  return confidence === "high" ? 2 : confidence === "medium" ? 1 : 0;
}

function normalizeSkillStep(step: string): string[] {
  const codeSpans = [...step.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1].trim())
    .filter(Boolean);
  if (codeSpans.length > 0) return codeSpans;

  const normalized = step
    .trim()
    .replace(/^(?:[-*]|\d+[.)])\s+/, "")
    .replace(/^(?:run|execute)\s+/i, "")
    .replace(/^`|`$/g, "")
    .trim();
  return normalized ? [normalized] : [];
}

async function buildSkillPatterns(db: Database): Promise<TokenPattern[]> {
  const byToken = new Map<string, Set<string>>();

  for (const skill of await listAgentSkills(db)) {
    if (skill.token_slugs.length !== 1) continue;
    const patterns = skill.steps.flatMap(normalizeSkillStep);
    for (const slug of skill.token_slugs) {
      const tokenPatterns = byToken.get(slug) ?? new Set<string>();
      for (const pattern of patterns) tokenPatterns.add(pattern);
      byToken.set(slug, tokenPatterns);
    }
  }

  return [...byToken.entries()].map(([slug, patterns]) => ({
    slug,
    patterns: [...patterns],
  }));
}

function mergePatterns(
  automatic: TokenPattern[],
  explicit: TokenPattern[],
): TokenPattern[] {
  const merged = new Map<string, Set<string>>();
  for (const entry of [...automatic, ...explicit]) {
    const patterns = merged.get(entry.slug) ?? new Set<string>();
    for (const pattern of entry.patterns) {
      const trimmed = pattern.trim();
      if (trimmed) patterns.add(trimmed);
    }
    merged.set(entry.slug, patterns);
  }

  return [...merged.entries()]
    .filter(([, patterns]) => patterns.size > 0)
    .map(([slug, patterns]) => ({ slug, patterns: [...patterns] }));
}

async function getSession(db: Database, sessionId: string): Promise<Session> {
  const session = (await db
    .prepare("SELECT * FROM sessions WHERE id = ?")
    .get(sessionId)) as Session | undefined;
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  return session;
}

export async function getSessionSynthesisRecords(
  db: Database,
  sessionId: string,
): Promise<SessionSynthesisRecord[]> {
  const rows = (await db
    .prepare(
      "SELECT * FROM session_syntheses WHERE session_id = ? ORDER BY created_at",
    )
    .all(sessionId)) as SessionSynthesisRow[];
  return rows.map(parseSynthesisRow);
}

export async function prepareSessionSynthesis(
  db: Database,
  input: PrepareSessionSynthesisInput,
): Promise<SessionSynthesisPreview> {
  const session = await getSession(db, input.sessionId);
  const patterns = mergePatterns(
    await buildSkillPatterns(db),
    input.explicitPatterns ?? [],
  );

  const patternTokens = await getTokensBySlugs(
    db,
    patterns.map((pattern) => pattern.slug),
  );
  const validPatterns: TokenPattern[] = [];
  const tokens = new Map<string, Token>();
  for (const pattern of patterns) {
    const token = patternTokens.get(pattern.slug);
    if (!token || token.deprecated_at) continue;
    validPatterns.push(pattern);
    tokens.set(pattern.slug, token);
  }

  const applied = new Set(
    (await getSessionSynthesisRecords(db, input.sessionId)).map(
      (record) => record.token_id,
    ),
  );
  const minConfidence = input.minConfidence ?? "medium";

  if (session.execution_context === "ui") {
    const reports = readUiObservationLog(input.sessionId);
    const candidateTokens = await getTokensBySlugs(
      db,
      reports
        .flatMap((report) => report.candidateTokens)
        .map((candidate) => candidate.slug)
        .filter((slug) => !tokens.has(slug)),
    );
    for (const [slug, token] of candidateTokens) {
      if (!token.deprecated_at) {
        tokens.set(slug, token);
      }
    }

    const { candidates, skippedLowConfidence } = buildUiSynthesisCandidates(
      reports,
      tokens,
      new Set(),
      minConfidence,
    );
    const pending: SessionSynthesisCandidate[] = [];
    for (const candidate of candidates) {
      const existingAttempt = await findAttemptByEvidenceKey(db, {
        sessionId: session.id,
        tokenId: candidate.tokenId,
        evidenceKey: candidate.evidenceKey,
      });
      if (
        existingAttempt &&
        (existingAttempt.status === "rated" ||
          existingAttempt.status === "recorded")
      ) {
        continue;
      }
      pending.push(candidate);
    }

    return {
      sessionId: session.id,
      userId: session.user_id,
      patternCount: validPatterns.length,
      commandCount: reports.length,
      alreadyApplied: applied.size,
      skippedLowConfidence,
      candidates: pending,
      unmatchedCommands: [],
      timeSpan: uiObservationTimeSpan(reports),
    };
  }

  const commands =
    input.commands ?? pairCommands(readMonitorLog(input.sessionId));
  const analysis = analyzeObservation(commands, validPatterns);
  const minRank = confidenceRank(minConfidence);
  let skippedLowConfidence = 0;
  const candidates: SessionSynthesisCandidate[] = [];

  for (const rating of analysis.ratings) {
    const token = tokens.get(rating.tokenSlug);
    if (!token || rating.evidence.matchedCommands === 0) continue;
    if (confidenceRank(rating.confidence) < minRank) {
      skippedLowConfidence++;
      continue;
    }

    const evidenceKey = observationEvidenceKey(rating.matchedCommandTexts);
    const existingAttempt = await findAttemptByEvidenceKey(db, {
      sessionId: session.id,
      tokenId: token.id,
      evidenceKey,
    });
    if (
      existingAttempt &&
      (existingAttempt.status === "rated" ||
        existingAttempt.status === "recorded")
    ) {
      continue;
    }

    candidates.push({
      tokenId: token.id,
      tokenSlug: token.slug,
      concept: token.concept,
      domain: token.domain,
      inferredRating: rating.rating,
      confidence: rating.confidence as SynthesisConfidence,
      evidence: rating.evidence,
      matchedCommandTexts: rating.matchedCommandTexts,
      evidenceKey,
    });
  }

  return {
    sessionId: session.id,
    userId: session.user_id,
    patternCount: validPatterns.length,
    commandCount: commands.length,
    alreadyApplied: applied.size,
    skippedLowConfidence,
    candidates,
    unmatchedCommands: analysis.unmatchedCommands,
    timeSpan: analysis.timeSpan,
  };
}

export async function applySessionSynthesis(
  db: Database,
  input: ApplySessionSynthesisInput,
): Promise<ApplySessionSynthesisResult> {
  return db.transaction(async (tx) => {
    const session = await getSession(tx, input.sessionId);
    const token = await getTokenBySlug(tx, input.tokenSlug);
    if (!token || token.deprecated_at) {
      throw new Error(`Active token not found: ${input.tokenSlug}`);
    }

    const evidenceKey = observationEvidenceKey(input.matchedCommandTexts);
    const existingAttempt = input.attemptId
      ? await getAttemptById(tx, input.attemptId)
      : await findAttemptByEvidenceKey(tx, {
          sessionId: session.id,
          tokenId: token.id,
          evidenceKey,
        });

    if (existingAttempt?.status === "rated" && existingAttempt.review_log_id) {
      if (
        existingAttempt.rating != null &&
        existingAttempt.rating !== input.confirmedRating
      ) {
        await recordAttempt(tx, {
          id: existingAttempt.id,
          userId: session.user_id,
          tokenId: token.id,
          actor: "user",
          channel: "synthesis",
          status: "conflict",
          rating: input.confirmedRating,
          conflictNote: `existing ${existingAttempt.rating}, proposed ${input.confirmedRating}`,
        });
        throw new AttemptConflictError(
          existingAttempt.id,
          existingAttempt.rating,
          input.confirmedRating,
        );
      }
      const existing = (await tx
        .prepare(
          "SELECT * FROM session_syntheses WHERE attempt_id = ? OR review_log_id = ?",
        )
        .get(existingAttempt.id, existingAttempt.review_log_id)) as
        | SessionSynthesisRow
        | undefined;
      if (existing) {
        return { applied: false, record: parseSynthesisRow(existing) };
      }
      const card = await ensureCard(tx, token.id, session.user_id);
      const evidence: SessionSynthesisEvidence = {
        signals: input.evidence,
        matchedCommandTexts: input.matchedCommandTexts,
      };
      const synthesisId = ulid();
      await tx
        .prepare(
          `INSERT INTO session_syntheses (
             id, session_id, token_id, attempt_id, card_id, inferred_rating,
             confirmed_rating, confidence, evidence, review_log_id,
             session_step_id, created_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          synthesisId,
          session.id,
          token.id,
          existingAttempt.id,
          card.id,
          input.inferredRating,
          input.confirmedRating,
          input.confidence,
          JSON.stringify(evidence),
          existingAttempt.review_log_id,
          existingAttempt.session_step_id,
          new Date().toISOString(),
        );
      const linked = (await tx
        .prepare("SELECT * FROM session_syntheses WHERE id = ?")
        .get(synthesisId)) as SessionSynthesisRow;
      return { applied: false, record: parseSynthesisRow(linked) };
    }

    if (!input.attemptId && evidenceKey == null) {
      const legacy = (await tx
        .prepare(
          `SELECT * FROM session_syntheses
            WHERE session_id = ? AND token_id = ? AND attempt_id IS NULL`,
        )
        .get(session.id, token.id)) as SessionSynthesisRow | undefined;
      if (legacy) {
        return { applied: false, record: parseSynthesisRow(legacy) };
      }
    }

    const card = await ensureCard(tx, token.id, session.user_id);
    const attemptId = existingAttempt?.id ?? input.attemptId ?? ulid();
    const reviewLogId = ulid();
    await evaluateRatingWithinTransaction(tx, {
      cardId: card.id,
      tokenId: token.id,
      userId: session.user_id,
      rating: input.confirmedRating,
      sessionId: session.id,
      reviewLogId,
      attemptId,
    });

    let blocked: Awaited<ReturnType<typeof cascadeBlock>> | undefined;
    if (input.confirmedRating === 1) {
      const prerequisites = await getPrerequisites(tx, token.id);
      if (prerequisites.length > 0) {
        blocked = await cascadeBlock(tx, session.user_id, token.slug);
      }
      await cancelMatchingPreconditionDeferrals(tx, {
        userId: session.user_id,
        tokenId: token.id,
      });
    }

    const notes = `Observation synthesis (${input.confidence}, inferred ${input.inferredRating}): ${input.matchedCommandTexts.slice(0, 3).join(" | ")}`;
    const step = await logStep(tx, {
      session_id: session.id,
      token_id: token.id,
      done_by: "user",
      rating: input.confirmedRating,
      notes,
    });

    const evidence: SessionSynthesisEvidence = {
      signals: input.evidence,
      matchedCommandTexts: input.matchedCommandTexts,
    };
    const recorded = await recordAttempt(tx, {
      id: attemptId,
      userId: session.user_id,
      cardId: card.id,
      tokenId: token.id,
      sessionId: session.id,
      activity: input.activity ?? "observed work",
      actor: "user",
      permittedTools: input.permittedTools,
      assistance: input.assistance,
      independent: input.independent ?? true,
      channel: session.execution_context === "ui" ? "ui_observer" : "synthesis",
      evidence: {
        signals: input.evidence,
        matchedCommandTexts: input.matchedCommandTexts,
      },
      evidenceKey,
      suggestedRating: input.inferredRating,
      rating: input.confirmedRating,
      reviewLogId,
      sessionStepId: step.id,
      status: "rated",
    });

    const now = new Date().toISOString();
    const synthesisId = ulid();
    await tx
      .prepare(
        `INSERT INTO session_syntheses (
           id, session_id, token_id, attempt_id, card_id, inferred_rating,
           confirmed_rating, confidence, evidence, review_log_id,
           session_step_id, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        synthesisId,
        session.id,
        token.id,
        recorded.attempt.id,
        card.id,
        input.inferredRating,
        input.confirmedRating,
        input.confidence,
        JSON.stringify(evidence),
        reviewLogId,
        step.id,
        now,
      );

    const record = (await tx
      .prepare("SELECT * FROM session_syntheses WHERE id = ?")
      .get(synthesisId)) as SessionSynthesisRow;

    return {
      applied: true,
      record: parseSynthesisRow(record),
      blocked,
    };
  });
}
