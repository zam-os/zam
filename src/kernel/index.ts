/**
 * ZAM Learning Kernel — Public API
 *
 * The kernel is AI-agnostic: it contains zero LLM dependencies.
 * It is pure learning science logic.
 */

export type {
  AiCapability,
  AiPlatform,
  AiTier,
  AiTierAvailability,
  AiTierDecision,
  AiTierPlan,
  AiTierPreference,
  AiTierReason,
} from "./ai/tier-preference.js";
export {
  AI_CAPABILITIES,
  AI_TIER_PREFERENCES,
  DEFAULT_AI_TIER_PREFERENCES,
  DEVICE_TIER_SUPPORT,
  decideAiTier,
  hasDeviceTier,
  isAiPreferenceConfigurable,
  isAiTierPreference,
  resolveAiCapabilityTier,
  resolveAiTierPlan,
} from "./ai/tier-preference.js";

export type {
  ActivityBucketLabelOptions,
  ActivityPeriod,
  GetReviewActivityOptions,
  ParsedActivityBucket,
  ReviewActivity,
  ReviewActivityBucket,
} from "./analytics/progress.js";
// Analytics
export {
  DEFAULT_ACTIVITY_WINDOWS,
  formatActivityBucketLabel,
  getReviewActivity,
  parseActivityBucket,
  STUDY_TIME_CAP_MS,
} from "./analytics/progress.js";
export type { DomainCompetence, UserStats } from "./analytics/stats.js";
export { getDomainCompetence, getUserStats } from "./analytics/stats.js";
export type { ADOConfig, WorkItem } from "./connectors/azure-devops.js";
// Connectors
export {
  fetchActiveWorkItems,
  loadADOConfig,
} from "./connectors/azure-devops.js";
export type {
  ADOCredentials,
  CredentialCheckEntry,
  Credentials,
  StoredCredentials,
  TursoCredentials,
} from "./credentials.js";
// Credentials (stored in ~/.zam/credentials.json, survives db deletion)
export {
  checkCredentials,
  clearADOCredentials,
  clearProviderApiKey,
  clearTursoCredentials,
  credentialsNeedVaultAccess,
  getADOCredentials,
  getProviderApiKey,
  getTursoCredentials,
  invalidateCredentialsSnapshot,
  listProviderApiKeyRefs,
  loadCredentials,
  loadStoredCredentials,
  looksLikeSecretUri,
  resetCredentialsResolutionState,
  resolveCredentials,
  saveCredentials,
  secretRefFromUri,
  setADOCredentials,
  setProviderApiKey,
  setTursoCredentials,
  tursoVaultAccessPending,
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
  isTransientRemoteDatabaseError,
  openDatabase,
  openDatabaseWithSync,
  openReadOnlySqliteDatabase,
} from "./db/connection.js";
export type { PostgresDatabaseOptions } from "./db/postgres.js";
export { openPostgresDatabase } from "./db/postgres.js";
// Provisioning is deliberately also importable directly from
// `db/provision.js`: the mobile WebView cannot load this barrel, which reaches
// Node through the driver layer. Both entrances lead to the same code.
export {
  applySchemaAndMigrations,
  CURRENT_SCHEMA_VERSION,
  ensureSchemaAndMigrations,
  runMigrations,
} from "./db/provision.js";
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
  TextImportAction,
  TextImportAssetInput,
  TextImportCardInput,
  TextImportCommitOptions,
  TextImportCommitResult,
  TextImportCounts,
  TextImportDeckPreview,
  TextImportDocument,
  TextImportFormat,
  TextImportMediaReference,
  TextImportNotice,
  TextImportPreview,
  TextImportPreviewCard,
  TextImportProgress,
} from "./import/text-import.js";
export {
  commitTextImport,
  previewTextImport,
} from "./import/text-import.js";
export type {
  BonusCandidate,
  BonusOptions,
  EnrolBonusResult,
} from "./library/bonus.js";
export {
  bonusCandidates,
  enrolBonusAtom,
  heldAtomIds,
} from "./library/bonus.js";
export type {
  BundledCellEnrolResult,
  BundledCellInfo,
  BundledCellStatus,
  CurriculumScope,
} from "./library/bundled-cells.js";
export {
  BUNDLED_CELLS,
  BUNDLED_TILES,
  enrolBundledCell,
  findBundledCellsForScope,
  getBundledCell,
  getBundledCellEnrolment,
  getBundledCellsWithStatus,
  getBundledCellTile,
  isBundledCellInstalled,
  listBundledCells,
  needsGenericCurriculumImport,
} from "./library/bundled-cells.js";
export type {
  InstallKvtResult,
  KvtAtom,
  KvtPracticeItem,
  KvtTile,
  MaterialiseKvtResult,
} from "./library/kvt-attach.js";
export {
  ATOM_ID_PATTERN,
  installKvtTile,
  materialiseKvtCards,
} from "./library/kvt-attach.js";
export type {
  AssessPreconditionInput,
  AssessPreconditionResult,
  PreconditionCandidate,
} from "./library/precondition-assessment.js";
export {
  assessPrecondition,
  getPreconditionCandidates,
  liftPreconditionBury,
  PRECONDITION_BURIED_REASON,
  PRECONDITION_HORIZON_DAYS,
  PRECONDITION_READY_REASON,
  PRECONDITION_STAGGER_DAYS,
  preconditionBuriedUntil,
} from "./library/precondition-assessment.js";
export type {
  PullForwardCandidate,
  PullForwardOptions,
  PullForwardResult,
} from "./library/pull-forward.js";
export {
  getPullForwardCandidates,
  pullForwardCards,
} from "./library/pull-forward.js";
export type {
  PublishRevisionInput,
  PublishRevisionResult,
  RevisionChanges,
  RevisionImpact,
  RevisionMateriality,
} from "./library/revision.js";
export {
  getRevisionImpact,
  isAwaitingRetest,
  publishTokenRevision,
  publishTokenRevisionInTransaction,
} from "./library/revision.js";
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
  Assignment,
  CreateAssignmentInput,
} from "./models/assignment.js";
export {
  createAssignment,
  getAssignment,
  listAssignmentsByAssigner,
  listAssignmentsForLearner,
  withdrawAssignment,
} from "./models/assignment.js";
export type {
  Card,
  CardDeletionImpact,
  CardState,
  DeleteCardResult,
  UpdateCardInput,
} from "./models/card.js";
export {
  deleteCardForUser,
  detachCardForUser,
  ensureCard,
  getBlockedCards,
  getCard,
  getCardById,
  getCardDeletionImpact,
  getDueCards,
  reattachCardForUser,
  resetCardsForToken,
  updateCard,
} from "./models/card.js";
export type {
  CreateKnowledgeContextInput,
  KnowledgeContext,
  UpdateKnowledgeContextInput,
} from "./models/knowledge-context.js";
export {
  assignTokenToContext,
  createKnowledgeContext,
  deleteKnowledgeContext,
  getKnowledgeContextById,
  getKnowledgeContextByName,
  listContextsForToken,
  listKnowledgeContexts,
  unassignTokenFromContext,
  updateKnowledgeContext,
} from "./models/knowledge-context.js";
export type {
  ImageOcclusionShape,
  TokenMedia,
  TokenMediaKind,
  TokenMediaSide,
} from "./models/media.js";
export { getTokenMedia } from "./models/media.js";
export type {
  PersonaContextSeedResult,
  PersonaDescriptor,
  PersonaId,
  PersonaImportPath,
} from "./models/persona.js";
export {
  DEFAULT_PERSONA_ID,
  getPersonaDescriptor,
  isPersonaId,
  PERSONA_DESCRIPTORS,
  seedPersonaKnowledgeContext,
} from "./models/persona.js";
export type {
  Neighborhood,
  NeighborhoodToken,
  Prerequisite,
  PrerequisiteWithToken,
} from "./models/prerequisite.js";
export {
  addPrerequisite,
  buildAncestorMap,
  getDependents,
  getPrerequisites,
  getTokenNeighborhood,
  removePrerequisite,
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
  CurriculumTopicCard,
  DeleteTokenResult,
  EditorialState,
  FoundationProposalInput,
  ImportCurriculumResult,
  ListTokensOptions,
  PersonalCard,
  QuestionSource,
  SourceProposalInput,
  SplitProposalInput,
  SymbiosisMode,
  Token,
  TokenDeleteImpact,
  UpdateTokenInput,
} from "./models/token.js";
// Models
export {
  applySourceProposals,
  buildTokenSlug,
  clearTokenMaintenance,
  confirmCardSplit,
  confirmFoundations,
  confirmSourceImport,
  countUserCardsForCurriculumTopic,
  createToken,
  deleteCurriculumCardForUser,
  deleteToken,
  deprecateToken,
  findTokens,
  generateTokenSlug,
  getDisplayTitle,
  getShortSlug,
  getTokenById,
  getTokenBySlug,
  getTokenDeleteImpact,
  getTokensBySourceLinkBase,
  importCurriculumCards,
  listPersonalCards,
  listTokens,
  listUserCardsForCurriculumTopic,
  setTokenMaintenance,
  slugify,
  tokenMatchesCurriculumTopicScope,
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
export type {
  VoiceAvailability,
  VoiceCapability,
  VoiceEngineDecision,
  VoiceEnginePlan,
  VoiceEnginePreference,
  VoiceEngineReason,
  VoiceEngineTier,
  VoiceEvaluationSpeech,
  VoiceLocale,
  VoicePort,
  VoiceReviewAdapter,
  VoiceReviewCard,
  VoiceTierAvailability,
} from "./recall/voice-review.js";
// Hands-free voice review (ADR 2026-07-31). Platform-free: the surfaces inject
// a VoicePort backed by native OS speech or a cloud stt/tts model entry.
export {
  DEFAULT_VOICE_ENGINE_PREFERENCE,
  HandsFreeReviewController,
  isVoiceEnginePreference,
  isVoiceModeUsable,
  parseSpokenRating,
  planLeavesDevice,
  resolveVoiceEnginePlan,
  resolveVoiceLocale,
  VOICE_ENGINE_PREFERENCES,
} from "./recall/voice-review.js";
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
  ReviewFastCheck,
  ReviewQueue,
  ReviewQueueItem,
  ReviewQueueOptions,
} from "./scheduler/queue.js";
export {
  buildReviewQueue,
  parseReviewFastCheck,
  presentFastCheck,
  TIER1_FIRST_RULE,
} from "./scheduler/queue.js";
export type { BurySiblingResult } from "./scheduler/siblings.js";
export {
  burySiblingCards,
  nextLocalDay,
  unburySiblingCards,
} from "./scheduler/siblings.js";
export type {
  StudyWorkloadPreset,
  StudyWorkloadSettings,
  UpdateStudyWorkloadInput,
} from "./scheduler/study-settings.js";
export {
  DEFAULT_STUDY_WORKLOAD,
  getStudyWorkloadSettings,
  isStudyWorkloadPreset,
  STUDY_WORKLOAD_PRESETS,
  setStudyWorkloadSettings,
} from "./scheduler/study-settings.js";
// Search
export type {
  HybridScoredToken,
  HybridSearchOptions,
} from "./search/hybrid.js";
export {
  cosineSimilarity,
  searchTokensHybrid,
} from "./search/hybrid.js";
export type {
  FoundationSuggestion,
  SuggestFoundationsOptions,
} from "./search/suggestions.js";
export { suggestFoundations } from "./search/suggestions.js";
export type {
  SecretBackend,
  SecretRef,
  SecretResolutionReason,
  StoredSecret,
} from "./secrets/index.js";
// Secret backends (vault references in credentials.json — ADR 2026-07-30b)
export {
  clearSecretBackends,
  createBitwardenBackend,
  ensureDefaultSecretBackends,
  getSecretBackend,
  isSecretRef,
  listSecretBackends,
  parseSecretUri,
  registerSecretBackend,
  resolveSecretUri,
  SecretResolutionError,
  unregisterSecretBackend,
} from "./secrets/index.js";
export {
  distributeGlobalSkills,
  getPackageSkillPath,
  injectShellHooks,
} from "./system/hooks.js";
export type { TranslationKey } from "./system/i18n.js";
export { t } from "./system/i18n.js";
export type {
  CapabilityFlags,
  InstallConfig,
  InstallMode,
  MachineAgentConfig,
  MachineAiConfig,
  MachineCompanionConfig,
  MachineCompanionConfigUpdate,
  MachineOnboardingConfig,
  MachineProviderRecord,
  MachineRoleBinding,
  MachineVoiceConfig,
  ModelCapability,
  ModelEntry,
  WorkspaceConfig,
  WorkspaceKind,
  WorkspaceSourceControl,
} from "./system/install-config.js";
export {
  ALL_CAPABILITIES,
  clearBitwardenSyncConfig,
  detectSyncProvider,
  emptyCapabilityFlags,
  ensureMachineAiModelsMigrated,
  ensureMachineProviderRolesSanitized,
  getActiveWorkspace,
  getActiveWorkspaceContext,
  getActiveWorkspaceId,
  getAgentConnectAutoDone,
  getBitwardenSyncConfig,
  getCompanionCollapsed,
  getCompanionSelectedAntigravityEvaluatorId,
  getCompanionSelectedAntigravityModelId,
  getCompanionSelectedEvaluatorId,
  getCompanionSelectedUserId,
  getCompanionSelectedVscodeEvaluatorId,
  getCompanionSelectedVscodeModelId,
  getConfiguredWorkspaces,
  getInstallChannel,
  getInstallMode,
  getLastRepairedVersion,
  getMachineAiConfig,
  getMachineAiModels,
  getMachineCompanionConfig,
  getMachineVoicePreference,
  getOnboardingDone,
  getOnboardingPersona,
  isBitwardenVaultEnabled,
  loadInstallConfig,
  migrateMachineRolesToModels,
  removeConfiguredWorkspace,
  saveConfiguredWorkspaces,
  saveInstallConfig,
  saveMachineAiConfig,
  saveMachineAiModels,
  saveMachineCompanionConfig,
  setActiveWorkspaceContext,
  setActiveWorkspaceId,
  setAgentConnectAutoDone,
  setBitwardenAutoSync,
  setBitwardenSyncConfig,
  setBitwardenVaultEnabled,
  setCompanionCollapsed,
  setCompanionSelectedAntigravityEvaluatorId,
  setCompanionSelectedAntigravityModelId,
  setCompanionSelectedEvaluatorId,
  setCompanionSelectedUserId,
  setCompanionSelectedVscodeEvaluatorId,
  setCompanionSelectedVscodeModelId,
  setInstallChannel,
  setInstallMode,
  setLastRepairedVersion,
  setMachineVoicePreference,
  setOnboardingDone,
  setOnboardingPersona,
  updateInstallConfig,
  updateMachineCompanionConfig,
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
// Frontends import ./system/language-names.js directly rather than through this
// barrel: it is deliberately free of runtime dependencies, while the barrel
// reaches Node-only code a browser bundle cannot take.
export { LANGUAGE_NAMES, languageName } from "./system/language-names.js";
export type { SupportedLocale } from "./system/locale.js";
export { detectSystemLocale, normalizeLocale } from "./system/locale.js";
export type {
  LocalAiAcceleration,
  LocalAiHardware,
  LocalAiHardwareFingerprint,
  SystemProfile,
} from "./system/profiler.js";
// System Profiling & Onboarding
export {
  classifyLocalAiHardware,
  getSystemProfile,
  supportsLocalGeneration,
} from "./system/profiler.js";
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
export { sha256Hex, sha256HexBytes } from "./util/sha256.js";
