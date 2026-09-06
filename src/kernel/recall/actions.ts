import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { cancelMatchingPreconditionDeferrals } from "../library/precondition-assessment.js";
import type { DeleteCardResult } from "../models/card.js";
import { deleteCardForUser, getCardById } from "../models/card.js";
import { getPrerequisites } from "../models/prerequisite.js";
import type { SessionStep } from "../models/session.js";
import { logStep } from "../models/session.js";
import type {
  DeleteTokenResult,
  Token,
  UpdateTokenInput,
} from "../models/token.js";
import {
  deleteToken,
  deprecateToken,
  getTokenById,
  updateToken,
} from "../models/token.js";
import {
  type AttemptActor,
  type AttemptChannel,
  AttemptConflictError,
  assertAttemptAllowsRating,
  getAttemptById,
  type ReviewAttempt,
  recordAttempt,
} from "../observation/attempts.js";
import type { CascadeBlockResult } from "../scheduler/blocker.js";
import { cascadeBlock } from "../scheduler/blocker.js";
import type { Rating } from "../scheduler/fsrs.js";
import { findPresentationByAttemptId } from "../scheduler/presentation.js";
import type { EvaluateResult } from "./evaluator.js";
import { evaluateRatingWithinTransaction } from "./evaluator.js";

export type ReviewActionType =
  | "rate"
  | "skip"
  | "edit-token"
  | "deprecate-token"
  | "delete-token"
  | "delete-card"
  | "stop";

export interface ExecuteReviewActionInput {
  cardId: string;
  userId: string;
  action: ReviewActionType;
  rating?: Rating;
  sessionId?: string;
  responseTimeMs?: number;
  tokenUpdates?: UpdateTokenInput;
  now?: Date;
  attemptId?: string;
  activity?: string;
  actor?: AttemptActor;
  permittedTools?: string[];
  assistance?: string;
  independent?: boolean | null;
  channel?: AttemptChannel;
}

export interface ReviewActionResult {
  action: ReviewActionType;
  token: Token;
  evaluation?: EvaluateResult;
  blocked?: CascadeBlockResult;
  sessionStep?: SessionStep;
  updatedToken?: Token;
  deletedToken?: DeleteTokenResult;
  deletedCard?: DeleteCardResult;
  skipped?: boolean;
  stopped?: boolean;
  attemptId?: string;
  applied?: boolean;
}

/** Assisted or agent-completed work: a session step and an attempt, no FSRS. */
export interface RecordAssistedStepInput {
  cardId: string;
  userId: string;
  sessionId: string;
  actor: AttemptActor;
  /** Why no rating is written; stored as the step's notes. */
  reason?: string;
  attemptId?: string;
  activity?: string;
  assistance?: string;
  permittedTools?: string[];
  now?: Date;
}

export interface RecordAssistedStepResult {
  token: Token;
  sessionStep: SessionStep;
  attemptId: string;
  /** True when the same attempt was already recorded; nothing was written. */
  replayed: boolean;
}

async function getReviewTarget(
  db: Database,
  cardId: string,
  userId: string,
): Promise<{ cardId: string; token: Token }> {
  const card = await getCardById(db, cardId);
  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }
  if (card.user_id !== userId) {
    throw new Error(`Card ${cardId} does not belong to user ${userId}`);
  }

  const token = await getTokenById(db, card.token_id);
  if (!token) {
    throw new Error(`Token not found for card ${cardId}`);
  }

  return { cardId: card.id, token };
}

/** A rating or recorded step is evidence about published learning content. */
function assertReviewableToken(token: Token, cardId: string): void {
  if (token.deprecated_at || token.editorial_state !== "published") {
    throw new Error(
      `Card ${cardId} cannot be reviewed: token ${token.slug} is ${
        token.deprecated_at ? "deprecated" : token.editorial_state
      }`,
    );
  }
}

/**
 * The session must exist and belong to the learner. A rating may still land
 * on a completed session: confirmed synthesis candidates arrive after
 * `zam_session_end`, and the evidence belongs to that session, not to a new
 * one. Record-only steps require the session to be open.
 */
async function assertSessionForUser(
  db: Database,
  sessionId: string,
  userId: string,
  options: { requireActive: boolean },
): Promise<void> {
  const session = (await db
    .prepare("SELECT user_id, completed_at FROM sessions WHERE id = ?")
    .get(sessionId)) as
    | { user_id: string; completed_at: string | null }
    | undefined;
  if (!session) throw new Error(`Session not found: ${sessionId}`);
  if (session.user_id !== userId) {
    throw new Error(`Session ${sessionId} does not belong to user ${userId}`);
  }
  if (options.requireActive && session.completed_at) {
    throw new Error(`Session already completed: ${sessionId}`);
  }
}

/**
 * An attempt id names one learner's attempt at one card. Before the id is
 * honoured for replay detection, it has to be that learner's and that card's;
 * a stale id from the previous card must not swallow this card's rating.
 */
function assertAttemptMatchesTarget(
  attempt: ReviewAttempt,
  userId: string,
  target: { cardId: string; token: Token },
): void {
  if (attempt.user_id !== userId) {
    throw new Error(`Attempt ${attempt.id} does not belong to user ${userId}`);
  }
  if (
    attempt.token_id !== target.token.id ||
    (attempt.card_id !== null && attempt.card_id !== target.cardId)
  ) {
    throw new Error(
      `Attempt ${attempt.id} is for a different card than ${target.cardId}`,
    );
  }
}

/**
 * Resolve the attempt an id refers to and check it is this learner's attempt
 * at this card. An id that no attempt row holds yet is still bound: the
 * admission that issued it recorded the learner and card it was handed out
 * for, so a client cannot spend one card's attempt id on another card.
 */
async function resolveAttemptForTarget(
  db: Database,
  attemptId: string,
  userId: string,
  target: { cardId: string; token: Token },
): Promise<ReviewAttempt | undefined> {
  const existing = await getAttemptById(db, attemptId);
  if (existing) {
    assertAttemptMatchesTarget(existing, userId, target);
    return existing;
  }
  const issued = await findPresentationByAttemptId(db, attemptId);
  if (
    issued &&
    (issued.user_id !== userId || issued.card_id !== target.cardId)
  ) {
    throw new Error(
      `Attempt ${attemptId} was issued for a different card than ${target.cardId}`,
    );
  }
  return undefined;
}

export async function recordAssistedStep(
  db: Database,
  input: RecordAssistedStepInput,
): Promise<RecordAssistedStepResult> {
  return db.transaction(async (tx) => {
    const target = await getReviewTarget(tx, input.cardId, input.userId);
    assertReviewableToken(target.token, target.cardId);
    await assertSessionForUser(tx, input.sessionId, input.userId, {
      requireActive: true,
    });

    const existing = input.attemptId
      ? await resolveAttemptForTarget(tx, input.attemptId, input.userId, target)
      : undefined;
    if (existing) {
      if (existing.status !== "recorded") {
        throw new AttemptConflictError(existing.id, existing.rating, null);
      }
      const step = existing.session_step_id
        ? ((await tx
            .prepare("SELECT * FROM session_steps WHERE id = ?")
            .get(existing.session_step_id)) as SessionStep | undefined)
        : undefined;
      if (!step) {
        throw new Error(`Attempt ${existing.id} has no session step`);
      }
      return {
        token: target.token,
        sessionStep: step,
        attemptId: existing.id,
        replayed: true,
      };
    }

    const sessionStep = await logStep(tx, {
      session_id: input.sessionId,
      token_id: target.token.id,
      done_by: input.actor,
      notes: input.reason,
    });
    const recorded = await recordAttempt(tx, {
      id: input.attemptId,
      userId: input.userId,
      cardId: target.cardId,
      tokenId: target.token.id,
      sessionId: input.sessionId,
      activity: input.activity ?? input.reason,
      actor: input.actor,
      permittedTools: input.permittedTools,
      assistance: input.assistance ?? input.reason,
      independent: false,
      channel: "direct",
      sessionStepId: sessionStep.id,
      status: "recorded",
      now: input.now,
    });
    return {
      token: target.token,
      sessionStep,
      attemptId: recorded.attempt.id,
      replayed: false,
    };
  });
}

export async function executeReviewAction(
  db: Database,
  input: ExecuteReviewActionInput,
): Promise<ReviewActionResult> {
  if (input.action === "rate") {
    if (input.rating == null) {
      throw new Error("rating is required for action=rate");
    }
    const rating = input.rating;

    return db.transaction(async (tx) => {
      const target = await getReviewTarget(tx, input.cardId, input.userId);
      assertReviewableToken(target.token, target.cardId);
      if (input.sessionId) {
        await assertSessionForUser(tx, input.sessionId, input.userId, {
          requireActive: false,
        });
      }

      const existingAttempt = input.attemptId
        ? await resolveAttemptForTarget(
            tx,
            input.attemptId,
            input.userId,
            target,
          )
        : undefined;
      const actor = existingAttempt?.actor ?? input.actor ?? "user";
      const independent =
        input.independent !== undefined
          ? input.independent
          : (existingAttempt?.independent ?? true);
      const attemptId = existingAttempt?.id ?? input.attemptId ?? ulid();
      if (
        existingAttempt &&
        (existingAttempt.status === "rated" ||
          existingAttempt.status === "recorded" ||
          existingAttempt.status === "conflict") &&
        existingAttempt.rating !== rating
      ) {
        throw new AttemptConflictError(
          existingAttempt.id,
          existingAttempt.rating,
          rating,
        );
      }
      assertAttemptAllowsRating(independent, rating, actor);
      if (
        existingAttempt?.status === "rated" &&
        existingAttempt.rating === rating
      ) {
        const card = await getCardById(tx, target.cardId);
        return {
          action: input.action,
          token: target.token,
          evaluation: card
            ? {
                nextDueAt: card.due_at,
                stability: card.stability,
                difficulty: card.difficulty,
                state: card.state,
                learningStep: card.learning_step,
                scheduledDays: card.scheduled_days,
                reps: card.reps,
                lapses: card.lapses,
                buriedSiblings: 0,
                buriedUntil: card.buried_until,
              }
            : undefined,
          attemptId: existingAttempt.id,
          applied: false,
        };
      }

      const reviewLogId = ulid();
      const evaluation = await evaluateRatingWithinTransaction(tx, {
        cardId: target.cardId,
        tokenId: target.token.id,
        userId: input.userId,
        rating,
        sessionId: input.sessionId,
        responseTimeMs: input.responseTimeMs,
        reviewLogId,
        attemptId,
        now: input.now,
      });

      let blocked: CascadeBlockResult | undefined;
      if (rating === 1) {
        const prereqs = await getPrerequisites(tx, target.token.id);
        if (prereqs.length > 0) {
          blocked = await cascadeBlock(tx, input.userId, target.token.slug);
        }
        await cancelMatchingPreconditionDeferrals(tx, {
          userId: input.userId,
          tokenId: target.token.id,
        });
      }

      const sessionStep = input.sessionId
        ? await logStep(tx, {
            session_id: input.sessionId,
            token_id: target.token.id,
            done_by: "user",
            rating,
          })
        : undefined;

      await recordAttempt(tx, {
        id: attemptId,
        userId: input.userId,
        cardId: target.cardId,
        tokenId: target.token.id,
        sessionId: input.sessionId,
        activity: input.activity,
        actor,
        permittedTools: input.permittedTools,
        assistance: input.assistance,
        independent,
        channel: input.channel ?? (input.sessionId ? "direct" : "recall"),
        rating,
        reviewLogId,
        sessionStepId: sessionStep?.id,
        status: "rated",
        now: input.now,
      });

      return {
        action: input.action,
        token: target.token,
        evaluation,
        blocked,
        sessionStep,
        attemptId,
        applied: true,
      };
    });
  }

  const target = await getReviewTarget(db, input.cardId, input.userId);

  switch (input.action) {
    case "skip":
      return { action: input.action, token: target.token, skipped: true };

    case "stop":
      return { action: input.action, token: target.token, stopped: true };

    case "edit-token": {
      const updatedToken = await updateToken(
        db,
        target.token.slug,
        input.tokenUpdates ?? {},
      );
      return {
        action: input.action,
        token: target.token,
        updatedToken,
      };
    }

    case "deprecate-token": {
      const updatedToken = await deprecateToken(db, target.token.slug);
      return {
        action: input.action,
        token: target.token,
        updatedToken,
      };
    }

    case "delete-token": {
      const deletedToken = await deleteToken(db, target.token.slug);
      return {
        action: input.action,
        token: target.token,
        deletedToken,
      };
    }

    case "delete-card": {
      const deletedCard = await deleteCardForUser(
        db,
        target.token.id,
        input.userId,
      );
      return {
        action: input.action,
        token: target.token,
        deletedCard,
      };
    }

    default: {
      const exhaustive: never = input.action;
      throw new Error(`Unsupported review action: ${exhaustive}`);
    }
  }
}
