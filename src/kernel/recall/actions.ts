import type { Database } from "libsql";
import {
  getCardById,
  deleteCardForUser,
} from "../models/card.js";
import {
  getTokenById,
  updateToken,
  deprecateToken,
  deleteToken,
} from "../models/token.js";
import { getPrerequisites } from "../models/prerequisite.js";
import { cascadeBlock } from "../scheduler/blocker.js";
import { evaluateRating } from "./evaluator.js";
import type { Rating } from "../scheduler/fsrs.js";
import type { UpdateTokenInput, Token, DeleteTokenResult } from "../models/token.js";
import type { DeleteCardResult } from "../models/card.js";
import type { EvaluateResult } from "./evaluator.js";
import type { CascadeBlockResult } from "../scheduler/blocker.js";

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
  tokenUpdates?: UpdateTokenInput;
}

export interface ReviewActionResult {
  action: ReviewActionType;
  token: Token;
  evaluation?: EvaluateResult;
  blocked?: CascadeBlockResult;
  updatedToken?: Token;
  deletedToken?: DeleteTokenResult;
  deletedCard?: DeleteCardResult;
  skipped?: boolean;
  stopped?: boolean;
}

function getReviewTarget(
  db: Database,
  cardId: string,
  userId: string,
): { cardId: string; token: Token } {
  const card = getCardById(db, cardId);
  if (!card) {
    throw new Error(`Card not found: ${cardId}`);
  }
  if (card.user_id !== userId) {
    throw new Error(`Card ${cardId} does not belong to user ${userId}`);
  }

  const token = getTokenById(db, card.token_id);
  if (!token) {
    throw new Error(`Token not found for card ${cardId}`);
  }

  return { cardId: card.id, token };
}

export function executeReviewAction(
  db: Database,
  input: ExecuteReviewActionInput,
): ReviewActionResult {
  const target = getReviewTarget(db, input.cardId, input.userId);

  switch (input.action) {
    case "rate": {
      if (input.rating == null) {
        throw new Error("rating is required for action=rate");
      }

      const evaluation = evaluateRating(db, {
        cardId: target.cardId,
        tokenId: target.token.id,
        userId: input.userId,
        rating: input.rating,
      });

      let blocked: CascadeBlockResult | undefined;
      if (input.rating === 1) {
        const prereqs = getPrerequisites(db, target.token.id);
        if (prereqs.length > 0) {
          blocked = cascadeBlock(db, input.userId, target.token.slug);
        }
      }

      return {
        action: input.action,
        token: target.token,
        evaluation,
        blocked,
      };
    }

    case "skip":
      return { action: input.action, token: target.token, skipped: true };

    case "stop":
      return { action: input.action, token: target.token, stopped: true };

    case "edit-token": {
      const updatedToken = updateToken(db, target.token.slug, input.tokenUpdates ?? {});
      return {
        action: input.action,
        token: target.token,
        updatedToken,
      };
    }

    case "deprecate-token": {
      const updatedToken = deprecateToken(db, target.token.slug);
      return {
        action: input.action,
        token: target.token,
        updatedToken,
      };
    }

    case "delete-token": {
      const deletedToken = deleteToken(db, target.token.slug);
      return {
        action: input.action,
        token: target.token,
        deletedToken,
      };
    }

    case "delete-card": {
      const deletedCard = deleteCardForUser(db, target.token.id, input.userId);
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
