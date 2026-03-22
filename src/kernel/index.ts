/**
 * ZAM Learning Kernel — Public API
 *
 * The kernel is AI-agnostic: it contains zero LLM dependencies.
 * It is pure learning science logic.
 */

// Database
export { openDatabase, getDefaultDbPath } from "./db/connection.js";

// Models
export {
  createToken,
  getTokenBySlug,
  getTokenById,
  findTokens,
  listTokens,
} from "./models/token.js";
export type {
  Token,
  CreateTokenInput,
  BloomLevel,
  SymbiosisMode,
} from "./models/token.js";

export {
  addPrerequisite,
  getPrerequisites,
  getDependents,
} from "./models/prerequisite.js";
export type { Prerequisite, PrerequisiteWithToken } from "./models/prerequisite.js";

export {
  ensureCard,
  getCard,
  updateCard,
  getDueCards,
  getBlockedCards,
} from "./models/card.js";
export type { Card, CardState, UpdateCardInput } from "./models/card.js";

export { logReview, getReviewsForCard, getReviewsForUser } from "./models/review.js";
export type { ReviewLog, CreateReviewInput } from "./models/review.js";

export {
  startSession,
  endSession,
  logStep,
  getSessionSummary,
} from "./models/session.js";
export type {
  Session,
  SessionStep,
  CreateSessionInput,
  LogStepInput,
  SessionSummary,
} from "./models/session.js";

// Scheduler
export { createFSRS } from "./scheduler/fsrs.js";
export type { Rating, SchedulingCard, FSRSParameters } from "./scheduler/fsrs.js";

export { cascadeBlock, unblockReady } from "./scheduler/blocker.js";
export type { CascadeBlockResult, UnblockResult } from "./scheduler/blocker.js";

export { interleave } from "./scheduler/interleaver.js";

export { buildReviewQueue } from "./scheduler/queue.js";
export type { ReviewQueue, ReviewQueueItem, ReviewQueueOptions } from "./scheduler/queue.js";

// Recall
export { generatePrompt } from "./recall/prompter.js";
export type { RecallPrompt, PromptInput } from "./recall/prompter.js";

export { evaluateRating } from "./recall/evaluator.js";
export type { EvaluateInput, EvaluateResult } from "./recall/evaluator.js";

// Analytics
export { getUserStats, getDomainCompetence } from "./analytics/stats.js";
export type { UserStats, DomainCompetence } from "./analytics/stats.js";
