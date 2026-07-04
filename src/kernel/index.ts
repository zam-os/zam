/**
 * ZAM Learning Kernel — Public API
 *
 * The kernel is AI-agnostic: it contains zero LLM dependencies.
 * It is pure learning science logic.
 */

export type { DomainCompetence, UserStats } from "./analytics/stats.js";
// Analytics
export { getDomainCompetence, getUserStats } from "./analytics/stats.js";
export type { ADOConfig, WorkItem } from "./connectors/azure-devops.js";
// Connectors
export {
  fetchActiveWorkItems,
  loadADOConfig,
} from "./connectors/azure-devops.js";
export type {
  ADOCredentials,
  Credentials,
  TursoCredentials,
} from "./credentials.js";
// Credentials (stored in ~/.zam/credentials.json, survives db deletion)
export {
  clearADOCredentials,
  clearProviderApiKey,
  clearTursoCredentials,
  getADOCredentials,
  getProviderApiKey,
  getTursoCredentials,
  listProviderApiKeyRefs,
  loadCredentials,
  saveCredentials,
  setADOCredentials,
  setProviderApiKey,
  setTursoCredentials,
} from "./credentials.js";
// Database
export type {
  ConnectionOptions,
  DatabaseProvider,
  DatabaseTargetInfo,
} from "./db/connection.js";
export {
  getDatabaseTargetInfo,
  getDefaultDbPath,
  openDatabase,
  openDatabaseWithSync,
} from "./db/connection.js";
export type { RemoteDatabaseOptions } from "./db/remote/provider.js";
export { openRemoteDatabase } from "./db/remote/provider.js";
export type { ImportResult, SnapshotManifest } from "./db/snapshot.js";
export {
  exportSnapshot,
  importSnapshot,
  parseSnapshot,
  SNAPSHOT_VERSION,
  verifySnapshot,
} from "./db/snapshot.js";
export type {
  Database,
  DatabaseValue,
  RunResult,
  Statement,
} from "./db/types.js";
export type { CreateGoalInput, GoalSummary } from "./goals/engine.js";
// Goals
export {
  createGoal,
  getGoal,
  getGoalTree,
  listGoals,
  updateGoalStatus,
} from "./goals/engine.js";
export type { Goal, GoalFrontmatter, GoalStatus } from "./goals/parser.js";
export {
  extractTasks,
  extractTokenRefs,
  parseGoalFile,
  serializeGoal,
} from "./goals/parser.js";
export type {
  AgentSkill,
  CreateAgentSkillInput,
  SkillSource,
} from "./models/agent-skill.js";
export {
  createAgentSkill,
  getAgentSkill,
  listAgentSkills,
} from "./models/agent-skill.js";
export type {
  Card,
  CardDeletionImpact,
  CardState,
  DeleteCardResult,
  UpdateCardInput,
} from "./models/card.js";
export {
  deleteCardForUser,
  ensureCard,
  getBlockedCards,
  getCard,
  getCardById,
  getCardDeletionImpact,
  getDueCards,
  updateCard,
} from "./models/card.js";
export type {
  Neighborhood,
  NeighborhoodToken,
  Prerequisite,
  PrerequisiteWithToken,
} from "./models/prerequisite.js";
export {
  addPrerequisite,
  getDependents,
  getPrerequisites,
  getTokenNeighborhood,
  wouldCreateCycle,
} from "./models/prerequisite.js";
export type { CreateReviewInput, ReviewLog } from "./models/review.js";
export {
  getReviewsForCard,
  getReviewsForUser,
  logReview,
} from "./models/review.js";
export type {
  CreateSessionInput,
  ExecutionContext,
  LogStepInput,
  Session,
  SessionStep,
  SessionSummary,
} from "./models/session.js";
export {
  endSession,
  getSessionSummary,
  logStep,
  startSession,
} from "./models/session.js";
export type { UserSetting } from "./models/settings.js";
export {
  deleteSetting,
  getAllSettings,
  getAllSettingsDetailed,
  getSetting,
  setSetting,
} from "./models/settings.js";
export type {
  BloomLevel,
  ConfirmFoundationsResult,
  CreateTokenInput,
  CurriculumCardInput,
  DeleteTokenResult,
  FoundationProposalInput,
  ImportCurriculumResult,
  PersonalCard,
  SourceProposalInput,
  SplitProposalInput,
  SymbiosisMode,
  Token,
  TokenDeleteImpact,
  UpdateTokenInput,
} from "./models/token.js";
// Models
export {
  confirmCardSplit,
  confirmFoundations,
  confirmSourceImport,
  createToken,
  deleteToken,
  deprecateToken,
  findTokens,
  generateTokenSlug,
  getTokenById,
  getTokenBySlug,
  getTokenDeleteImpact,
  importCurriculumCards,
  listPersonalCards,
  listTokens,
  slugify,
  updateToken,
} from "./models/token.js";
export type {
  EmbeddedTokenRow,
  EmbeddingCoverage,
  EmbeddingStaleness,
  TokenEmbedding,
  TokenNeedingEmbedding,
} from "./models/token-embedding.js";
export {
  computeContentHash,
  decodeEmbedding,
  embeddingContentForToken,
  encodeEmbedding,
  getEmbeddingCoverage,
  getTokenEmbedding,
  listEmbeddedTokens,
  listTokensNeedingEmbedding,
  upsertTokenEmbedding,
} from "./models/token-embedding.js";
export type {
  AnalysisResult,
  CommandRecord,
  MonitorEvent,
  ObservationRating,
  TokenPattern,
} from "./observation/analyzer.js";
// Observation
export {
  analyzeObservation,
  pairCommands,
  parseMonitorLog,
} from "./observation/analyzer.js";
export {
  ensureMonitorDir,
  getMonitorDir,
  getMonitorLogStats,
  getMonitorPath,
  monitorLogExists,
  readMonitorLog,
  writeMonitorEvent,
} from "./observation/monitor-io.js";
export type { SidecarPrivacyPolicy } from "./observation/observer-sidecar-policy.js";
export {
  SIDECAR_POLICY_FILE,
  syncObserverSidecarPolicy,
  toSidecarPrivacyPolicy,
} from "./observation/observer-sidecar-policy.js";
export type {
  CaptureDecision,
  CaptureDenialReason,
  CaptureRequest,
  ObserverConsent,
  ObserverPolicy,
  ObserverRetention,
  ObserverScope,
  ObserverSettingKey,
  ResolvedCaptureTarget,
} from "./observation/policy.js";
export {
  BUILT_IN_SENSITIVE_MATCHERS,
  DEFAULT_OBSERVER_POLICY,
  decidePostCapture,
  decidePreCapture,
  isObserverPolicyConfigured,
  matchBuiltInSensitive,
  matchDenylist,
  OBSERVER_POLICY_UNSET_HINT,
  OBSERVER_POLICY_VERSION,
  parseObserverList,
  parseObserverPolicy,
  resolveObserverPolicy,
} from "./observation/policy.js";
export type {
  ApplySessionSynthesisInput,
  ApplySessionSynthesisResult,
  PrepareSessionSynthesisInput,
  SessionSynthesisCandidate,
  SessionSynthesisEvidence,
  SessionSynthesisPreview,
  SessionSynthesisRecord,
  SynthesisConfidence,
} from "./observation/session-synthesis.js";
export {
  applySessionSynthesis,
  getSessionSynthesisRecords,
  prepareSessionSynthesis,
} from "./observation/session-synthesis.js";
export {
  generateBashHooks,
  generateBashUnhooks,
  generatePowerShellHooks,
  generatePowerShellUnhooks,
  generateZshHooks,
  generateZshUnhooks,
} from "./observation/shell-hooks.js";
export type {
  CommandSequence,
  DiscoveryOptions,
  SkillProposal,
} from "./observation/skill-discovery.js";
export { discoverSkills } from "./observation/skill-discovery.js";
export type {
  UiActionType,
  UiApplicationContext,
  UiCandidateToken,
  UiEvidenceRef,
  UiEvidenceType,
  UiObservationKind,
  UiObservationReport,
  UiObservedAction,
} from "./observation/ui-observer.js";
export {
  isUiObservationReport,
  parseUiObservationLog,
  UI_OBSERVATION_PROTOCOL_VERSION,
} from "./observation/ui-observer.js";
export {
  appendUiObservationReport,
  ensureUiObserverDir,
  getUiObservationPath,
  getUiObserverDir,
  readUiObservationLog,
  uiObservationLogExists,
} from "./observation/ui-observer-io.js";
export {
  buildUiSynthesisCandidates,
  uiObservationTimeSpan,
} from "./observation/ui-observer-synthesis.js";
export type {
  ExecuteReviewActionInput,
  ReviewActionResult,
  ReviewActionType,
} from "./recall/actions.js";
export { executeReviewAction } from "./recall/actions.js";
export type { EvaluateInput, EvaluateResult } from "./recall/evaluator.js";
export { evaluateRating } from "./recall/evaluator.js";
export type { PromptInput, RecallPrompt } from "./recall/prompter.js";
// Recall
export { generateConceptFreeCue, generatePrompt } from "./recall/prompter.js";
export type {
  ResolvedReference,
  ReviewContext,
} from "./recall/reference-resolver.js";
// NOTE: LLM integration is intentionally NOT part of the kernel. The kernel is
// AI-agnostic (zero LLM dependencies). The local-LLM client lives in the CLI
// layer at src/cli/llm/client.ts.
export {
  clearReviewContextCache,
  DEFAULT_REVIEW_CONTEXT_MAX_CHARS,
  matchesFilePath,
  normalizePath,
  REVIEW_CONTEXT_CACHE_TTL_MS,
  resolveReference,
  resolveReviewContext,
} from "./recall/reference-resolver.js";
export type { CascadeBlockResult, UnblockResult } from "./scheduler/blocker.js";
export { cascadeBlock, unblockReady } from "./scheduler/blocker.js";
export type {
  FSRSParameters,
  Rating,
  SchedulingCard,
} from "./scheduler/fsrs.js";
// Scheduler
export { createFSRS } from "./scheduler/fsrs.js";
export { interleave } from "./scheduler/interleaver.js";
export type {
  ReviewQueue,
  ReviewQueueItem,
  ReviewQueueOptions,
} from "./scheduler/queue.js";
export { buildReviewQueue } from "./scheduler/queue.js";
// Search
export type {
  HybridScoredToken,
  HybridSearchOptions,
} from "./search/hybrid.js";
export {
  cosineSimilarity,
  searchTokensHybrid,
} from "./search/hybrid.js";
export {
  distributeGlobalSkills,
  getPackageSkillPath,
  injectShellHooks,
} from "./system/hooks.js";
export type { TranslationKey } from "./system/i18n.js";
export { t } from "./system/i18n.js";
export type {
  InstallConfig,
  InstallMode,
  MachineAiConfig,
  MachineProviderRecord,
  MachineRoleBinding,
  WorkspaceConfig,
  WorkspaceKind,
  WorkspaceSourceControl,
} from "./system/install-config.js";
export {
  detectSyncProvider,
  getActiveWorkspace,
  getActiveWorkspaceId,
  getConfiguredWorkspaces,
  getInstallChannel,
  getInstallMode,
  getMachineAiConfig,
  loadInstallConfig,
  removeConfiguredWorkspace,
  saveConfiguredWorkspaces,
  saveInstallConfig,
  saveMachineAiConfig,
  setActiveWorkspaceId,
  setInstallChannel,
  setInstallMode,
  upsertConfiguredWorkspace,
} from "./system/install-config.js";
export type {
  InstallPlan,
  InstallResult,
  LocalLLMRunner,
  OllamaDetectionOptions,
} from "./system/installer.js";
export {
  hasCommand,
  installFastFlowLM,
  installOllama,
  installOpenCode,
  isOllamaInstalled,
  planOpenCodeInstall,
  prepareLocalModel,
  resolveOllamaCommand,
} from "./system/installer.js";
export type { SupportedLocale } from "./system/locale.js";
export { detectSystemLocale, normalizeLocale } from "./system/locale.js";
export type { SystemProfile } from "./system/profiler.js";
// System Profiling & Onboarding
export { getSystemProfile } from "./system/profiler.js";
export type { RepoPaths } from "./system/repos.js";
export {
  getRepoPaths,
  resolveAllBeliefPaths,
  resolveAllGoalPaths,
  resolveRepoPath,
} from "./system/repos.js";
export type {
  InstallChannel,
  UpdateActionKind,
  UpdateDecision,
  UpdateStep,
  UpdateStepKind,
} from "./system/update-check.js";
export {
  compareVersions,
  decideUpdate,
  HOMEBREW_CASK,
  planUpdate,
  WINGET_PACKAGE_ID,
} from "./system/update-check.js";
