import type { Database } from "../db/types.js";
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
import type { CascadeBlockResult } from "../scheduler/blocker.js";
import { cascadeBlock } from "../scheduler/blocker.js";
import type { Rating } from "../scheduler/fsrs.js";
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

async function assertActiveSessionForUser(
  db: Database,
  sessionId: string,
  userId: string,
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
  if (session.completed_at) {
    throw new Error(`Session already completed: ${sessionId}`);
  }
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
      if (input.sessionId) {
        await assertActiveSessionForUser(tx, input.sessionId, input.userId);
      }

      const evaluation = await evaluateRatingWithinTransaction(tx, {
        cardId: target.cardId,
        tokenId: target.token.id,
        userId: input.userId,
        rating,
        sessionId: input.sessionId,
        responseTimeMs: input.responseTimeMs,
        now: input.now,
      });

      let blocked: CascadeBlockResult | undefined;
      if (rating === 1) {
        const prereqs = await getPrerequisites(tx, target.token.id);
        if (prereqs.length > 0) {
          blocked = await cascadeBlock(tx, input.userId, target.token.slug);
        }
      }

      const sessionStep = input.sessionId
        ? await logStep(tx, {
            session_id: input.sessionId,
            token_id: target.token.id,
            done_by: "user",
            rating,
          })
        : undefined;

      return {
        action: input.action,
        token: target.token,
        evaluation,
        blocked,
        sessionStep,
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
