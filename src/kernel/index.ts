/**
 * ZAM Learning Kernel — Public API
 *
 * The kernel is AI-agnostic: it contains zero LLM dependencies.
 * It is pure learning science logic.
 */

// Database
export { openDatabase, openDatabaseWithSync, getDefaultDbPath } from "./db/connection.js";

// Models
export {
  createToken,
  getTokenBySlug,
  getTokenById,
  updateToken,
  findTokens,
  listTokens,
  deprecateToken,
  getTokenDeleteImpact,
  deleteToken,
} from "./models/token.js";
export type {
  Token,
  CreateTokenInput,
  UpdateTokenInput,
  BloomLevel,
  SymbiosisMode,
  TokenDeleteImpact,
  DeleteTokenResult,
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
  getCardById,
  updateCard,
  getCardDeletionImpact,
  deleteCardForUser,
  getDueCards,
  getBlockedCards,
} from "./models/card.js";
export type {
  Card,
  CardState,
  UpdateCardInput,
  CardDeletionImpact,
  DeleteCardResult,
} from "./models/card.js";

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
  ExecutionContext,
  CreateSessionInput,
  LogStepInput,
  SessionSummary,
} from "./models/session.js";

export {
  createAgentSkill,
  getAgentSkill,
  listAgentSkills,
} from "./models/agent-skill.js";
export type {
  AgentSkill,
  SkillSource,
  CreateAgentSkillInput,
} from "./models/agent-skill.js";

export {
  getSetting,
  getAllSettings,
  getAllSettingsDetailed,
  setSetting,
  deleteSetting,
} from "./models/settings.js";
export type { UserSetting } from "./models/settings.js";

// Scheduler
export { createFSRS } from "./scheduler/fsrs.js";
export type { Rating, SchedulingCard, FSRSParameters } from "./scheduler/fsrs.js";

export { cascadeBlock, unblockReady } from "./scheduler/blocker.js";
export type { CascadeBlockResult, UnblockResult } from "./scheduler/blocker.js";

export { interleave } from "./scheduler/interleaver.js";

export { buildReviewQueue } from "./scheduler/queue.js";
export type { ReviewQueue, ReviewQueueItem, ReviewQueueOptions } from "./scheduler/queue.js";

// Recall
export { generatePrompt, generateConceptFreeCue } from "./recall/prompter.js";
export type { RecallPrompt, PromptInput } from "./recall/prompter.js";
export { generateQuestionViaLLM, evaluateAnswerViaLLM, ensureLocalLlmRunning, isLlmOnline, translateQuestionViaLLM } from "./recall/llm.js";
export {
  resolveReference,
  resolveReviewContext,
  matchesFilePath,
  normalizePath,
  DEFAULT_REVIEW_CONTEXT_MAX_CHARS,
} from "./recall/reference-resolver.js";
export type { ResolvedReference, ReviewContext } from "./recall/reference-resolver.js";

export { evaluateRating } from "./recall/evaluator.js";
export type { EvaluateInput, EvaluateResult } from "./recall/evaluator.js";

export { executeReviewAction } from "./recall/actions.js";
export type { ExecuteReviewActionInput, ReviewActionResult, ReviewActionType } from "./recall/actions.js";

// Analytics
export { getUserStats, getDomainCompetence } from "./analytics/stats.js";
export type { UserStats, DomainCompetence } from "./analytics/stats.js";

// Observation
export {
  parseMonitorLog,
  pairCommands,
  analyzeObservation,
} from "./observation/analyzer.js";
export type {
  MonitorEvent,
  CommandRecord,
  TokenPattern,
  ObservationRating,
  AnalysisResult,
} from "./observation/analyzer.js";

export {
  getMonitorDir,
  getMonitorPath,
  ensureMonitorDir,
  writeMonitorEvent,
  readMonitorLog,
  monitorLogExists,
  getMonitorLogStats,
} from "./observation/monitor-io.js";

export {
  generateZshHooks,
  generateBashHooks,
  generatePowerShellHooks,
  generateZshUnhooks,
  generateBashUnhooks,
  generatePowerShellUnhooks,
} from "./observation/shell-hooks.js";

export { discoverSkills } from "./observation/skill-discovery.js";
export type {
  CommandSequence,
  SkillProposal,
  DiscoveryOptions,
} from "./observation/skill-discovery.js";

// Goals
export {
  listGoals,
  getGoal,
  createGoal,
  updateGoalStatus,
  getGoalTree,
} from "./goals/engine.js";
export type { GoalSummary, CreateGoalInput } from "./goals/engine.js";

export {
  parseGoalFile,
  serializeGoal,
  extractTasks,
  extractTokenRefs,
} from "./goals/parser.js";
export type { Goal, GoalStatus, GoalFrontmatter } from "./goals/parser.js";

// Credentials (stored in ~/.zam/credentials.json, survives db deletion)
export {
  loadCredentials,
  saveCredentials,
  getTursoCredentials,
  setTursoCredentials,
  clearTursoCredentials,
  getADOCredentials,
  setADOCredentials,
  clearADOCredentials,
} from "./credentials.js";
export type { Credentials, TursoCredentials, ADOCredentials } from "./credentials.js";

// Connectors
export { loadADOConfig, fetchActiveWorkItems } from "./connectors/azure-devops.js";
export type { ADOConfig, WorkItem } from "./connectors/azure-devops.js";

// System Profiling & Onboarding
export { getSystemProfile } from "./system/profiler.js";
export type { SystemProfile } from "./system/profiler.js";
export { hasCommand, installFastFlowLM, installOllama } from "./system/installer.js";
export type { InstallResult } from "./system/installer.js";
export { getPackageSkillPath, distributeGlobalSkills, injectShellHooks } from "./system/hooks.js";
export { detectSystemLocale, normalizeLocale } from "./system/locale.js";
export type { SupportedLocale } from "./system/locale.js";
export { t } from "./system/i18n.js";
export type { TranslationKey } from "./system/i18n.js";
