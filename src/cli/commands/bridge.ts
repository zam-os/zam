/**
 * `zam bridge` — Machine-readable JSON protocol for AI integration.
 *
 * All output is valid JSON only. No human-readable formatting.
 * Errors are also JSON: { "error": "message" }
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Command } from "commander";
import { ulid } from "ulid";
import { serializeZamPairPayload } from "../../bridge/mobile-pairing.js";
import type { DiscussionTurn } from "../../bridge/protocol.js";
import type {
  BloomLevel,
  Database,
  KnowledgeContext,
  ListTokensOptions,
  NeighborhoodToken,
  Rating,
  ReviewActionType,
  SourceProposalInput,
  SymbiosisMode,
  TokenPattern,
} from "../../kernel/index.js";
import {
  appendUiObservationReport,
  applySourceProposals,
  assignTokenToContext,
  BUILT_IN_SENSITIVE_MATCHERS,
  type CapabilityFlags,
  checkCredentials,
  clearProviderApiKey,
  commitTextImport,
  confirmCardSplit,
  confirmFoundations,
  confirmSourceImport,
  countUserCardsForCurriculumTopic,
  createGoal,
  createToken,
  credentialsNeedVaultAccess,
  DEFAULT_VOICE_ENGINE_PREFERENCE,
  decidePostCapture,
  decidePreCapture,
  deleteCardForUser,
  deleteCurriculumCardForUser,
  deleteToken,
  discoverSkills,
  emptyCapabilityFlags,
  ensureCard,
  ensureMachineAiModelsMigrated,
  generateConceptFreeCue,
  generateTokenSlug,
  getActiveWorkspaceContext,
  getAgentConnectAutoDone,
  getAgentSkill,
  getCard,
  getCardDeletionImpact,
  getConfiguredWorkspaces,
  getDatabaseTargetInfo,
  getDisplayTitle,
  getKnowledgeContextByName,
  getMachineVoicePreference,
  getOnboardingDone,
  getOnboardingPersona,
  getProviderApiKey,
  getReviewActivity,
  getSetting,
  getStudyWorkloadSettings,
  getSystemProfile,
  getTokenBySlug,
  getTokenDeleteImpact,
  getTokenNeighborhood,
  getTursoCredentials,
  hasCommand,
  importCurriculumCards,
  isBitwardenVaultEnabled,
  isOllamaInstalled,
  isPersonaId,
  isStudyWorkloadPreset,
  isVoiceEnginePreference,
  listAgentSkills,
  listKnowledgeContexts,
  listPersonalCards,
  listProviderApiKeyRefs,
  listTokens,
  listUserCardsForCurriculumTopic,
  loadStoredCredentials,
  type ModelCapability,
  type ModelEntry,
  openDatabase,
  openDatabaseWithSync,
  PERSONA_DESCRIPTORS,
  pairCommands,
  previewTextImport,
  readMonitorLog,
  readUiObservationLog,
  resolveCredentials,
  resolveObserverPolicy,
  resolveReviewContext,
  secretRefFromUri,
  seedPersonaKnowledgeContext,
  setActiveWorkspaceContext,
  setAgentConnectAutoDone,
  setBitwardenVaultEnabled,
  setMachineVoicePreference,
  setOnboardingDone,
  setOnboardingPersona,
  setProviderApiKey,
  setSetting,
  setStudyWorkloadSettings,
  setTursoCredentials,
  slugify,
  supportsLocalGeneration,
  syncObserverSidecarPolicy,
  tursoVaultAccessPending,
  uiObservationLogExists,
  unassignTokenFromContext,
  unburySiblingCards,
  updateToken,
  VOICE_ENGINE_PREFERENCES,
  type WorkspaceConfig,
  type WorkspaceKind,
} from "../../kernel/index.js";
import {
  cleanHtml,
  isSafeUrl,
  readImageOCR,
  readLocalFile,
  readWebLink,
} from "../adapters/source-reader.js";
import {
  type ConnectHarnessId,
  inspectConnectHarnesses,
  inspectHermesGateway,
  isConnectHarnessId,
  performAgentConnect,
} from "../agent-connect.js";
import {
  AGENT_HARNESSES,
  getHarness,
  launchHarness,
  resolveHarnessExecutable,
} from "../agent-harness.js";
import { AGENT_OFFERS } from "../agent-offers.js";
import {
  addToken as handleAddToken,
  analyzeMonitor as handleAnalyzeMonitor,
  assessPreconditionHandler as handleAssessPrecondition,
  backupCreate as handleBackupCreate,
  checkDue as handleCheckDue,
  createAssignmentHandler as handleCreateAssignment,
  endSession as handleEndSession,
  enrolBonusAtomHandler as handleEnrolBonusAtom,
  enrolBundledCellHandler as handleEnrolBundledCell,
  findTokens as handleFindTokens,
  getMonitor as handleGetMonitor,
  getPreconditionsHandler as handleGetPreconditions,
  getPullForwardCandidatesHandler as handleGetPullForwardCandidates,
  getReview as handleGetReview,
  getReviewsBatch as handleGetReviewsBatch,
  importOkfTokens as handleImportOkfTokens,
  listAssignmentsHandler as handleListAssignments,
  listBonusCandidatesHandler as handleListBonusCandidates,
  listBundledCellsHandler as handleListBundledCells,
  publishRevision as handlePublishRevision,
  pullForwardCardsHandler as handlePullForwardCards,
  reviewAction as handleReviewAction,
  revisionPreview as handleRevisionPreview,
  sessionOpen as handleSessionOpen,
  startSession as handleStartSession,
  submitReview as handleSubmitReview,
  suggestFoundations as handleSuggestFoundations,
  updateCheck as handleUpdateCheck,
  withdrawAssignmentHandler as handleWithdrawAssignment,
  type ImportOkfTokenInput,
} from "../bridge-handlers.js";
import { installCliShim } from "../cli-install.js";
import { mapWithConcurrency } from "../curriculum/concurrency.js";
import {
  assessCurriculumText,
  CURRICULUM_PROVIDERS,
  type CurriculumBreadcrumb,
  type CurriculumLevel,
  type CurriculumReadinessReason,
  type CurriculumSelection,
  type CurriculumTextReadiness,
  type CurriculumTopicAlternative,
  curriculumTopicContentStatus,
  findCurriculumTopicAlternatives,
  getCurriculumProvider,
  getLastCurriculumSelection,
  setLastCurriculumSelection,
  type TopicNode,
} from "../curriculum/index.js";
import {
  extractPdfText,
  isPdfUrl,
  plainTextToExtractableHtml,
} from "../curriculum/pdf-text.js";
import { readTextImportFile } from "../import/text-file.js";
import { performInstallRepair } from "../install-repair.js";
import { resolveOperationKnowledgeContexts } from "../knowledge-contexts.js";
import {
  probeModelCapabilities,
  validateModelSave,
} from "../llm/capability-probe.js";
import {
  type ApiFlavor,
  checkVisionReadiness,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_URL,
  discussReviewViaLLM,
  ensureLlmReadyHeadless,
  evaluateAnswerViaLLM,
  generateFoundationsProposalsViaLLM,
  generateGoalDecompositionViaLLM,
  generateSplitProposalsViaLLM,
  getAvailableModels,
  getCloudModelRecommendation,
  getLlmConfig,
  getProviderForRole,
  getProviderRoleStatus,
  importCurriculumViaLLM,
  inferApiFlavor,
  isLlmOnline,
  type LlmRole,
  translateQuestionViaLLM,
} from "../llm/client.js";
import { connectCloudProvider } from "../llm/cloud-connect.js";
import { CLOUD_PROVIDERS } from "../llm/cloud-providers.js";
import {
  FOUNDRY_DEFAULT_URL,
  type FoundrySetupRole,
  getFoundryLocalStatus,
} from "../llm/foundry-local.js";
import { setupFoundryLocalForZam } from "../llm/foundry-local-setup.js";
import {
  enableLocalEmbedding,
  getLocalEmbeddingStatus,
} from "../llm/local-embedding.js";
import {
  enableLocalVision,
  getLocalVisionStatus,
} from "../llm/local-vision.js";
import {
  isMachineLocalEntry,
  loadModelRegistry,
  type ResolvedModelEntry,
  saveModelRegistry,
} from "../llm/model-registry.js";
import {
  getCloudSpeechAvailability,
  resolveSpeechEndpoint,
  synthesizeSpeech,
  transcribeAudio,
} from "../llm/speech.js";
import { observeUiSnapshotViaLLM } from "../llm/vision.js";
import { createMobilePairingPayload } from "../mobile-pairing.js";
import { listOpenContentCatalog } from "../open-content/catalog.js";
import {
  confirmOpenContentImport,
  previewOpenContentImport,
} from "../open-content/service.js";
import {
  bindRoleProviders,
  buildProviderListing,
  findOrphanKeyRefs,
  maskSecret,
  type ProviderRecord,
  readScopedProviders,
  readScopedRoles,
  removeProviderRecord,
  rolesReferencing,
  unbindRole,
  upsertProviderRecord,
  VALID_API_FLAVORS,
  VALID_ROLES,
  withProviderScope,
  writeScopedProviders,
  writeScopedRoles,
} from "../providers/config.js";
import {
  ensureWorkspaceStructure,
  inspectSkillLinks,
  inspectWorkspaceStructure,
  parseSetupAgents,
  type SkillLinkHealth,
  type SkillLinkState,
  summarizeSkillLinkHealth,
  wireSkills,
} from "../provisioning/index.js";
import {
  configureBitwardenServer,
  disconnectBitwardenToLocalSecrets,
  getBitwardenCliStatus,
  loginBitwardenForProcess,
  maybeAutoSyncSecrets,
  seedProviderKeyIntoBitwarden,
  seedTursoIntoBitwarden,
  syncSecretsWithBitwarden,
  unlockBitwardenForProcess,
} from "../secrets-bridge.js";
import { normalizeShell } from "../terminal-open.js";
import { ensureDefaultUser, resolveUser } from "../users/identity.js";
import {
  activateWorkspacePath,
  defaultWorkspaceDir,
  ensureActiveWorkspace,
  existingWorkspaceDirOrHome,
  removeWorkspaceAndResolveActive,
} from "../workspaces/active.js";
import { backupDatabaseTo } from "../workspaces/backup.js";
import {
  resolveActivityPeriod,
  resolveActivityWindow,
} from "./shared/activity.js";
import {
  withDb as sharedWithDb,
  withOptionalDb as sharedWithOptionalDb,
} from "./shared/db.js";

let isServeMode = false;
let serveStdinPayload: string | undefined;

function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Progress for a long write, as one NDJSON object per line on **stderr**.
 *
 * stdout stays the JSON-only contract this CLI promises; stderr is where a
 * host can watch a slow command without parsing anything it must not see. A
 * 440-card import over a remote library takes minutes (field report,
 * 2026-08-09) and used to produce no output at all until it finished.
 */
function progressOut(event: {
  type: string;
  done: number;
  total: number;
}): void {
  process.stderr.write(`${JSON.stringify(event)}\n`);
}

/**
 * Emit at most one progress line per 25 items, plus the last.
 *
 * A terminal reading stderr should not receive 50,000 lines, and a host
 * repainting per card gains nothing over repainting per 25.
 */
function throttledProgress(
  type: string,
): (progress: { done: number; total: number }) => void {
  const step = 25;
  return ({ done, total }) => {
    if (done === total || done % step === 0) {
      progressOut({ type, done, total });
    }
  };
}

function jsonError(message: string): never {
  let msg = message;
  if (message.startsWith('{"error":')) {
    try {
      const parsed = JSON.parse(message);
      msg = parsed.error;
    } catch {
      // ignore
    }
  }

  if (isServeMode) {
    throw new Error(JSON.stringify({ error: msg }));
  }
  console.log(JSON.stringify({ error: msg }, null, 2));
  process.exit(1);
}

function parseKnowledgeContextNames(value: unknown): string[] {
  if (value == null) return [];
  if (
    !Array.isArray(value) ||
    value.some((name) => typeof name !== "string" || !name.trim())
  ) {
    jsonError("knowledgeContexts must be an array of non-empty context names");
  }
  return [...new Set(value.map((name) => name.trim()))];
}

async function resolveKnowledgeContexts(
  db: Database,
  names: string[],
): Promise<KnowledgeContext[]> {
  try {
    return await resolveOperationKnowledgeContexts(db, names);
  } catch (error) {
    jsonError((error as Error).message);
  }
}

function parseNonNegativeIntegerOption(name: string, value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    jsonError(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function parseProviderScope(scope: string | undefined): boolean {
  const value = scope ?? "machine";
  if (value === "machine") return true;
  if (value === "shared") return false;
  jsonError(`Invalid --scope: ${value}. Use machine or shared.`);
}

async function withDb(
  fn: (db: Database) => void | Promise<void>,
): Promise<void> {
  await sharedWithDb(fn, jsonError);
}

/**
 * For commands over machine-local state (workspaces, active knowledge
 * context): when the database cannot be opened — e.g. the configured cloud
 * database is unreachable — fn receives `null` and degrades gracefully
 * instead of failing the whole command (issue #162).
 */
async function withOptionalDb(
  fn: (db: Database | null) => void | Promise<void>,
): Promise<void> {
  await sharedWithOptionalDb(fn, jsonError);
}

interface ReviewTargetRow {
  card_id: string;
  token_id: string;
  user_id: string;
  slug: string;
}

async function _getReviewTarget(
  db: Database,
  cardId: string,
  userId: string,
): Promise<ReviewTargetRow> {
  const target = (await db
    .prepare(
      `SELECT c.id AS card_id, c.token_id, c.user_id, t.slug
       FROM cards c
       JOIN tokens t ON t.id = c.token_id
       WHERE c.id = ?`,
    )
    .get(cardId)) as ReviewTargetRow | undefined;

  if (!target) {
    jsonError(`Card not found: ${cardId}`);
  }
  if (target.user_id !== userId) {
    jsonError(`Card ${cardId} does not belong to user ${userId}`);
  }

  return target!;
}

function _parseTokenUpdates(opts: {
  concept?: string;
  domain?: string;
  bloom?: string;
  context?: string;
  mode?: string;
  sourceLink?: string;
}): {
  concept?: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
  source_link?: string | null;
} {
  const updates: {
    concept?: string;
    domain?: string;
    bloom_level?: BloomLevel;
    context?: string;
    symbiosis_mode?: SymbiosisMode | null;
    source_link?: string | null;
  } = {};

  if (opts.concept !== undefined) updates.concept = opts.concept;
  if (opts.domain !== undefined) updates.domain = opts.domain;
  if (opts.bloom !== undefined)
    updates.bloom_level = Number(opts.bloom) as BloomLevel;
  if (opts.context !== undefined) updates.context = opts.context;
  if (opts.sourceLink !== undefined) {
    updates.source_link = opts.sourceLink === "" ? null : opts.sourceLink;
  }
  if (opts.mode !== undefined) {
    const validModes = ["shadowing", "copilot", "autonomy", "none"];
    if (!validModes.includes(opts.mode)) {
      jsonError(`Invalid mode: ${opts.mode}`);
    }
    updates.symbiosis_mode =
      opts.mode === "none" ? null : (opts.mode as SymbiosisMode);
  }

  return updates;
}

export const bridgeCommand = new Command("bridge").description(
  "Machine-readable JSON protocol for AI integration",
);

// ── zam bridge check-due ──────────────────────────────────────────────────

bridgeCommand
  .command("check-due")
  .description("Check due cards for a user (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--domain <domain>", "Filter by knowledge domain")
  .option("--knowledge-context <context>", "Filter by knowledge context")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const result = await handleCheckDue(db, {
          user: userId,
          domain: opts.domain,
          knowledgeContext: opts.knowledgeContext,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge backup-db ──────────────────────────────────────────────────

bridgeCommand
  .command("backup-db")
  .description("Back up the local database into the workspace (JSON)")
  .option(
    "--dir <path>",
    "Target directory (default: workspace dir, else ~/Documents/zam)",
  )
  .action(async (opts) => {
    const target = getDatabaseTargetInfo();
    if (target.kind !== "local") {
      // Not an error: a Turso-backed database already lives in the cloud, so a
      // local file backup does not apply. Return a structured result the caller
      // (e.g. the Studio) can present as an informational, localized message.
      jsonOut({
        ok: false,
        reason: "remote",
        target: target.kind,
        location: target.location,
      });
      return;
    }
    await withDb(async (db) => {
      const workspaceDir = opts.dir || (await ensureActiveWorkspace(db)).path;
      const path = await backupDatabaseTo(db, workspaceDir);
      jsonOut({ ok: true, path });
    });
  });

// ── zam bridge backup-create ──────────────────────────────────────────────

bridgeCommand
  .command("backup-create")
  .description(
    "Create a portable SQL snapshot backup (kernel exportSnapshot), distinct from backup-db's VACUUM copy (JSON)",
  )
  .option(
    "--dir <path>",
    "Target directory (default: workspace dir, else ~/Documents/zam)",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleBackupCreate(db, { dir: opts.dir });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge update-check ────────────────────────────────────────────────

bridgeCommand
  .command("update-check")
  .description("Check whether a newer ZAM release is available (JSON)")
  .option(
    "--latest <version>",
    "Compare against this version instead of fetching (offline/deterministic checks)",
  )
  .option("--channel <channel>", "Override the detected install channel")
  .action(async (opts) => {
    try {
      const result = await handleUpdateCheck({
        latest: opts.latest,
        channel: opts.channel,
      });
      jsonOut(result);
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge workspace-info / set-workspace-dir ──────────────────────────

bridgeCommand
  .command("workspace-info")
  .description("Report the workspace dir, its default, and the data dir (JSON)")
  .action(async () => {
    await withOptionalDb(async (db) => {
      const activeWorkspace = await ensureActiveWorkspace(db);
      jsonOut({
        activeWorkspaceId: activeWorkspace.id,
        activeWorkspace,
        workspaceDir: activeWorkspace.path,
        defaultWorkspaceDir: defaultWorkspaceDir(),
        dataDir: join(homedir(), ".zam"),
      });
    });
  });

function provisionConfiguredWorkspaces(): ReturnType<typeof wireSkills> {
  return getConfiguredWorkspaces().flatMap((workspace) =>
    existsSync(workspace.path)
      ? wireSkills(workspace.path, parseSetupAgents(), { quiet: true })
      : [],
  );
}

interface WorkspaceLinkHealth {
  health: SkillLinkHealth;
  states: Record<string, SkillLinkState>;
}

/**
 * Report, per workspace id, whether ZAM is cleanly linked. Read-only — it never
 * mutates the filesystem, so listing a workspace cannot change its links.
 * Workspaces whose directory is missing (e.g. an offline drive) are omitted.
 */
function buildWorkspaceLinkHealth(
  workspaces: WorkspaceConfig[],
): Record<string, WorkspaceLinkHealth> {
  const agents = parseSetupAgents();
  const map: Record<string, WorkspaceLinkHealth> = {};
  for (const workspace of workspaces) {
    if (!existsSync(workspace.path)) continue;
    const links = inspectSkillLinks(workspace.path, agents);
    map[workspace.id] = {
      health: summarizeSkillLinkHealth(links),
      states: Object.fromEntries(
        links.map((link) => [link.agents.join("+"), link.state]),
      ),
    };
  }
  return map;
}

async function ensureDesktopWorkspace(db: Database): Promise<{
  workspaceDir: string;
  activeWorkspaceId: string;
  skillLinks: ReturnType<typeof wireSkills>;
}> {
  const activeWorkspace = await ensureActiveWorkspace(db);
  const skillLinks = provisionConfiguredWorkspaces();
  return {
    workspaceDir: activeWorkspace.path,
    activeWorkspaceId: activeWorkspace.id,
    skillLinks,
  };
}

bridgeCommand
  .command("workspace-list")
  .description("List configured ZAM workspaces (JSON)")
  .action(async () => {
    await withOptionalDb(async (db) => {
      const activeWorkspace = await ensureActiveWorkspace(db);
      const workspaces = getConfiguredWorkspaces();
      jsonOut({
        workspaces,
        activeWorkspaceId: activeWorkspace.id,
        activeWorkspace,
        workspaceDir: activeWorkspace.path,
        defaultWorkspaceDir: defaultWorkspaceDir(),
        dataDir: join(homedir(), ".zam"),
        linkHealth: buildWorkspaceLinkHealth(workspaces),
        // Structure health (plan Phase 6) — reported for EVERY workspace,
        // including those whose directory is gone: a registered path that
        // vanished must surface as a repairable state in the Studio instead
        // of being silently omitted (ADR 2026-07-24 §4).
        structure: Object.fromEntries(
          workspaces.map((workspace) => [
            workspace.id,
            inspectWorkspaceStructure(workspace.path),
          ]),
        ),
      });
    });
  });

// ── zam bridge workspace-repair ──────────────────────────────────────────────

bridgeCommand
  .command("workspace-repair")
  .description(
    "Create or repair a configured workspace additively (JSON): recreate the " +
      "directory and fresh-setup structure that is missing, re-link skills; " +
      "never overwrite or delete a user-authored file (ADR 2026-07-24 §4).",
  )
  .requiredOption("--id <id>", "Workspace id")
  .action((opts: { id: string }) => {
    const id = String(opts.id ?? "").trim();
    if (!id) jsonError("A non-empty --id is required");
    const workspace = getConfiguredWorkspaces().find((item) => item.id === id);
    if (!workspace) jsonError(`Workspace "${id}" is not configured`);

    // Unlike workspace-repair-links, a missing directory is not an error —
    // recreating regenerable infrastructure is exactly this command's job.
    mkdirSync(workspace.path, { recursive: true });
    const report = ensureWorkspaceStructure(workspace.path);
    const agents = parseSetupAgents();
    const skillLinks = wireSkills(workspace.path, agents, {
      force: true,
      quiet: true,
    });
    const links = inspectSkillLinks(workspace.path, agents);
    jsonOut({
      ok: true,
      workspace,
      created: report.created,
      preserved: report.preserved,
      skillLinks,
      structure: inspectWorkspaceStructure(workspace.path),
      linkHealth: {
        health: summarizeSkillLinkHealth(links),
        states: Object.fromEntries(
          links.map((link) => [link.agents.join("+"), link.state]),
        ),
      },
    });
  });

bridgeCommand
  .command("workspace-repair-links")
  .description(
    "Relink ZAM skill junctions for a configured workspace, replacing broken links and outdated copies (JSON)",
  )
  .requiredOption("--id <id>", "Workspace id")
  .option(
    "--agents <list>",
    "comma-separated agents to wire: all, claude, copilot, codex, agent",
  )
  .action(async (opts) => {
    const id = String(opts.id ?? "").trim();
    if (!id) jsonError("A non-empty --id is required");
    const workspace = getConfiguredWorkspaces().find((item) => item.id === id);
    if (!workspace) jsonError(`Workspace "${id}" is not configured`);
    if (!existsSync(workspace.path)) {
      jsonError(`Workspace path does not exist: ${workspace.path}`);
    }

    const agents = parseSetupAgents(opts.agents);
    // Force replaces anything that is not already a correct link — dangling
    // junctions and outdated copies alike. The Studio confirms before calling
    // this for a directory with no ZAM fingerprint.
    const skillLinks = wireSkills(workspace.path, agents, {
      force: true,
      quiet: true,
    });
    const links = inspectSkillLinks(workspace.path, agents);
    jsonOut({
      ok: true,
      workspace,
      skillLinks,
      linkHealth: {
        health: summarizeSkillLinkHealth(links),
        states: Object.fromEntries(
          links.map((link) => [link.agents.join("+"), link.state]),
        ),
      },
    });
  });

function parseBridgeWorkspaceKind(value?: string): WorkspaceKind {
  const kind = (value || "custom").toLowerCase();
  if (
    kind === "personal" ||
    kind === "team" ||
    kind === "family" ||
    kind === "community" ||
    kind === "organization" ||
    kind === "custom"
  ) {
    return kind;
  }
  jsonError(`Invalid workspace kind: ${value}`);
}

bridgeCommand
  .command("workspace-add")
  .description("Register an existing directory as a ZAM workspace (JSON)")
  .requiredOption("--path <dir>", "Existing workspace/repository directory")
  .option("--id <id>", "Workspace id")
  .option("--label <label>", "Human-readable label")
  .option("--kind <kind>", "Workspace kind", "custom")
  .action(async (opts) => {
    const raw = String(opts.path ?? "").trim();
    if (!raw) jsonError("A non-empty --path is required");
    const path = resolve(raw);
    if (!existsSync(path)) jsonError(`Workspace path does not exist: ${path}`);
    const id = opts.id ? String(opts.id).trim() : undefined;
    if (opts.id && !id) jsonError("A non-empty --id is required");
    const kind = parseBridgeWorkspaceKind(opts.kind);
    const skillLinks = wireSkills(path, parseSetupAgents(), { quiet: true });
    await withOptionalDb(async (db) => {
      const workspace = await activateWorkspacePath(db, path, {
        ...(id ? { id } : {}),
        ...(opts.label ? { label: opts.label } : {}),
        kind,
      });
      jsonOut({
        ok: true,
        workspace,
        workspaces: getConfiguredWorkspaces(),
        activeWorkspaceId: workspace.id,
        activeWorkspace: workspace,
        workspaceDir: workspace.path,
        skillLinks,
      });
    });
  });

bridgeCommand
  .command("workspace-remove")
  .description("Unregister a ZAM workspace without deleting its files (JSON)")
  .requiredOption("--id <id>", "Workspace id")
  .action(async (opts) => {
    const id = String(opts.id ?? "").trim();
    if (!id) jsonError("A non-empty --id is required");
    const workspace = getConfiguredWorkspaces().find((item) => item.id === id);
    if (!workspace) jsonError(`Workspace "${id}" is not configured`);

    await withOptionalDb(async (db) => {
      const { activeWorkspace, workspaces } =
        await removeWorkspaceAndResolveActive(db, id);
      const skillLinks = provisionConfiguredWorkspaces();

      jsonOut({
        ok: true,
        removed: workspace,
        workspaces,
        activeWorkspaceId: activeWorkspace.id,
        activeWorkspace,
        workspaceDir: activeWorkspace.path,
        skillLinks,
      });
    });
  });

bridgeCommand
  .command("set-workspace-dir")
  .description("Set the personal workspace directory (JSON)")
  .requiredOption("--dir <path>", "Path to the workspace directory")
  .action(async (opts) => {
    const raw = String(opts.dir ?? "").trim();
    if (!raw) jsonError("A non-empty --dir is required");
    const dir = resolve(raw);
    if (!existsSync(dir)) jsonError(`Workspace path does not exist: ${dir}`);
    const skillLinks = wireSkills(dir, parseSetupAgents(), { quiet: true });
    await withOptionalDb(async (db) => {
      const workspace = await activateWorkspacePath(db, dir);
      jsonOut({
        ok: true,
        workspace,
        workspaces: getConfiguredWorkspaces(),
        activeWorkspaceId: workspace.id,
        activeWorkspace: workspace,
        workspaceDir: workspace.path,
        skillLinks,
      });
    });
  });

// ── zam bridge agent-list / agent-open ─────────────────────────────────────

bridgeCommand
  .command("agent-list")
  .description("List agent harnesses with detection state + the default (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const configuredDefault = (await getSetting(db, "agent.default")) || null;
      // Lazy: keep the optional agent-llm surface out of the eager graph.
      const { getAgentAdapter, listAgentTextHarnessIds } = await import(
        "../agent-llm/adapter.js"
      );
      const { defaultAgentModel } = await import("../agent-llm/defaults.js");
      const outboundTextIds = new Set(listAgentTextHarnessIds());
      const harnesses = await Promise.all(
        AGENT_HARNESSES.map(async (h) => {
          const override =
            (await getSetting(db, `agent.${h.id}.command`)) || undefined;
          const adapter = outboundTextIds.has(h.id)
            ? getAgentAdapter(h.id)
            : null;
          const modalities = adapter?.modalities ?? { text: true };
          return {
            id: h.id,
            label: h.label,
            kind: h.kind,
            detected: resolveHarnessExecutable(h, override) !== null,
            /** True when this harness can back a `transport: "agent"` model. */
            outboundText: outboundTextIds.has(h.id),
            /** True when the outbound adapter accepts local image files. */
            outboundImage: modalities.image === true,
            /** True when the adapter forwards a reasoning-effort setting. */
            outboundEffort: adapter?.supportsEffort === true,
            /** Recommended cheap default model id for this harness. */
            defaultModel: defaultAgentModel(h.id) ?? null,
          };
        }),
      );
      const fallbackDefault = harnesses.find((h) => h.detected)?.id ?? null;
      jsonOut({ harnesses, default: configuredDefault ?? fallbackDefault });
    });
  });

bridgeCommand
  .command("agent-models")
  .description("List available models for an agent harness (JSON)")
  .requiredOption("--harness <id>", "Agent harness ID")
  .action(async (opts) => {
    try {
      const { getAgentAdapter } = await import("../agent-llm/adapter.js");
      const adapter = getAgentAdapter(opts.harness);
      const models = adapter?.listModels ? await adapter.listModels() : [];
      jsonOut({ harness: opts.harness, models });
    } catch {
      jsonOut({ harness: opts.harness, models: [] });
    }
  });

bridgeCommand
  .command("agent-open")
  .description("Launch an agent harness in the workspace (JSON)")
  .option(
    "--id <id>",
    "Harness id (default: agent.default setting, else first detected)",
  )
  .option("--workspace <id>", "Configured workspace id to open")
  .option("--dir <path>", "Explicit workspace directory to open")
  .action(async (opts) => {
    await withDb(async (db) => {
      let id: string | undefined =
        opts.id || (await getSetting(db, "agent.default")) || undefined;
      if (!id) {
        id = AGENT_HARNESSES.find((h) => resolveHarnessExecutable(h))?.id;
      }
      if (!id) {
        jsonError(
          "No agent harness configured or detected. Install one (Claude Code, Codex, opencode) or set agent.default.",
        );
      }
      const harness = getHarness(id);
      if (!harness) {
        jsonError(`Unknown harness: ${id}`);
      }
      const override =
        (await getSetting(db, `agent.${harness.id}.command`)) || undefined;
      const executable = resolveHarnessExecutable(harness, override);
      if (!executable) {
        jsonError(
          `${harness.label} was not detected. Set its path: zam settings set agent.${harness.id}.command <path>`,
        );
      }
      const configuredWorkspace = opts.workspace
        ? getConfiguredWorkspaces().find((item) => item.id === opts.workspace)
        : undefined;
      if (opts.workspace && !configuredWorkspace) {
        jsonError(`Workspace is not configured: ${opts.workspace}`);
      }
      const activeWorkspace = await ensureActiveWorkspace(db);
      const workspace = opts.dir
        ? existsSync(opts.dir)
          ? opts.dir
          : homedir()
        : existingWorkspaceDirOrHome(configuredWorkspace ?? activeWorkspace);
      launchHarness(harness, {
        executable,
        workspace,
        shell: normalizeShell(undefined),
        silent: true,
      });
      jsonOut({
        ok: true,
        id: harness.id,
        label: harness.label,
        kind: harness.kind,
        workspace,
      });
    });
  });

// ── zam bridge get-review ─────────────────────────────────────────────────

bridgeCommand
  .command("get-review")
  .description("Get next review card with prompt (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--no-resolve", "Skip resolving the token's source_link into context")
  .option(
    "--no-dynamic-question",
    "Use the stored question without generating a fresh LLM question",
  )
  .option("--knowledge-context <context>", "Filter cards by knowledge context")
  .option(
    "--media",
    "Inline the card's media as base64 (rendering surfaces only)",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const result = await handleGetReview(db, {
          user: userId,
          noResolve: opts.resolve === false,
          noDynamicQuestion: opts.dynamicQuestion === false,
          knowledgeContext: opts.knowledgeContext,
          includeMedia: opts.media === true,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge get-reviews ────────────────────────────────────────────────

bridgeCommand
  .command("get-reviews")
  .description("Get a batch of due cards (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--domain <domain>", "Filter cards by domain prefix")
  .option("--knowledge-context <context>", "Filter cards by knowledge context")
  .option("--include-questions", "Include question content in response")
  .option("--no-resolve", "Skip resolving the token's source_link into context")
  .option(
    "--no-dynamic-question",
    "Use the stored question without generating a fresh LLM question",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const result = await handleGetReviewsBatch(db, {
          user: userId,
          domain: opts.domain,
          knowledgeContext: opts.knowledgeContext,
          includeQuestions: opts.includeQuestions,
          noResolve: opts.resolve === false,
          noDynamicQuestion: opts.dynamicQuestion === false,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge submit ─────────────────────────────────────────────────────

bridgeCommand
  .command("submit")
  .description("Submit a rating for a card (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--card-id <id>", "Card ID")
  .option("--rating <n>", "User rating (1-4); omit with --done-by agent")
  .option("--session <id>", "Session ID to associate the review with")
  .option(
    "--done-by <user|agent>",
    "Done by user or agent (default: user)",
    "user",
  )
  .option(
    "--response-time-ms <n>",
    "Milliseconds between showing the card and this rating (study-time stats)",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const responseTimeMs =
          opts.responseTimeMs !== undefined
            ? Number(opts.responseTimeMs)
            : undefined;
        if (
          responseTimeMs !== undefined &&
          (!Number.isFinite(responseTimeMs) ||
            !Number.isInteger(responseTimeMs) ||
            responseTimeMs < 0)
        ) {
          throw new Error("--response-time-ms must be a non-negative integer");
        }
        const result = await handleSubmitReview(db, {
          user: userId,
          cardId: opts.cardId,
          rating:
            opts.rating !== undefined
              ? (Number(opts.rating) as Rating)
              : undefined,
          sessionId: opts.session,
          doneBy: opts.doneBy as "user" | "agent",
          responseTimeMs,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge stats-activity ───────────────────────────────────────────────

bridgeCommand
  .command("stats-activity")
  .description(
    "Review activity series per day/week/month with study time (JSON)",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .option("--period <day|week|month>", "Activity period (default: day)", "day")
  .option(
    "--window <n>",
    "How many periods to return (default: 30 days / 12 weeks / 6 months)",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const period = resolveActivityPeriod(opts.period);
        const result = await getReviewActivity(db, userId, {
          period,
          window: resolveActivityWindow(opts.window, period),
        });
        jsonOut({ userId, ...result });
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge review-action ───────────────────────────────────────────────

bridgeCommand
  .command("review-action")
  .description("Apply a review action (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--card-id <id>", "Card ID")
  .requiredOption(
    "--action <action>",
    "Action: rate | skip | edit-token | deprecate-token | delete-token | delete-card | stop",
  )
  .option("--rating <n>", "Rating (1-4) for action=rate")
  .option("--concept <concept>", "Updated concept text for action=edit-token")
  .option("--domain <domain>", "Updated domain for action=edit-token")
  .option("--bloom <level>", "Updated Bloom level for action=edit-token")
  .option("--context <context>", "Updated context for action=edit-token")
  .option("--mode <mode>", "Updated symbiosis mode for action=edit-token")
  .option("--source-link <link>", "Updated source link for action=edit-token")
  .option("--confirm", "Confirm destructive delete actions")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const result = await handleReviewAction(db, {
          user: userId,
          cardId: opts.cardId,
          action: opts.action as ReviewActionType,
          rating:
            opts.rating !== undefined
              ? (Number(opts.rating) as Rating)
              : undefined,
          concept: opts.concept,
          domain: opts.domain,
          bloomLevel: opts.bloom !== undefined ? Number(opts.bloom) : undefined,
          context: opts.context,
          symbiosisMode: opts.mode,
          sourceLink: opts.sourceLink,
          confirm: opts.confirm,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge get-skill ──────────────────────────────────────────────────

bridgeCommand
  .command("get-skill")
  .description("Get an agent skill by slug (JSON)")
  .requiredOption("--slug <slug>", "Skill slug")
  .action(async (opts) => {
    await withDb(async (db) => {
      const skill = await getAgentSkill(db, opts.slug);
      if (!skill) {
        jsonError(`Skill not found: ${opts.slug}`);
      }

      jsonOut({
        slug: skill?.slug,
        description: skill?.description,
        steps: skill?.steps,
        tokenSlugs: skill?.token_slugs,
        source: skill?.source,
      });
    });
  });

// ── zam bridge start-session / end-session ────────────────────────────────

bridgeCommand
  .command("start-session")
  .description("Start a ZAM learning session (JSON)")
  .requiredOption("--task <task>", "Session task description")
  .option(
    "--context <context>",
    "Execution context: shell | ui | reallife",
    "shell",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    const context = opts.context as "shell" | "ui" | "reallife";
    if (!["shell", "ui", "reallife"].includes(context)) {
      jsonError("context must be shell, ui, or reallife");
    }

    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const result = await handleStartSession(db, {
          user: userId,
          task: opts.task,
          context,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

bridgeCommand
  .command("end-session")
  .description("Complete an active ZAM learning session (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleEndSession(db, { session: opts.session });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge session-open ───────────────────────────────────────────────

bridgeCommand
  .command("session-open")
  .description(
    "Start a learning session and return due cards and relevant tokens (JSON)",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--task <task>", "Task description for the session")
  .option(
    "--context <context>",
    "Execution context: shell | ui | reallife",
    "shell",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const userId = await resolveUser(opts, db, { json: true });
        const result = await handleSessionOpen(db, {
          user: userId,
          task: opts.task,
          context: opts.context,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge get-monitor ────────────────────────────────────────────────

bridgeCommand
  .command("get-monitor")
  .description("Read monitor log for a session (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleGetMonitor(db, { session: opts.session });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge analyze-monitor ───────────────────────────────────────────

bridgeCommand
  .command("analyze-monitor")
  .description("Analyze monitor log with token patterns from stdin (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action(async (opts) => {
    try {
      let raw: string;
      if (isServeMode) {
        raw = serveStdinPayload ?? "";
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        raw = Buffer.concat(chunks).toString("utf-8").trim();
      }

      if (!raw) {
        jsonError("No input received on stdin. Pipe JSON with token patterns.");
      }

      let data: { patterns: TokenPattern[] };
      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      if (!Array.isArray(data?.patterns)) {
        jsonError("JSON must include 'patterns' array");
      }

      await withDb(async (db) => {
        try {
          const result = await handleAnalyzeMonitor(db, {
            session: opts.session,
            patterns: data.patterns,
          });
          jsonOut(result);
        } catch (err) {
          jsonError((err as Error).message);
        }
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge add-token ──────────────────────────────────────────────────

bridgeCommand
  .command("add-token")
  .description("Create a token + card from JSON stdin")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    try {
      let raw: string;
      if (isServeMode) {
        raw = serveStdinPayload ?? "";
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        raw = Buffer.concat(chunks).toString("utf-8").trim();
      }

      if (!raw) {
        jsonError("No input received on stdin. Pipe JSON with token data.");
      }

      let data: {
        slug: string;
        title?: string;
        concept: string;
        domain?: string;
        bloom_level?: number;
        context?: string;
        symbiosis_mode?: string | null;
        source_link?: string | null;
        question?: string | null;
        knowledgeContexts?: string[];
        knowledge_contexts?: string[];
        prerequisites?: string[];
      };

      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      if (!data?.slug || !data?.concept) {
        jsonError("JSON must include 'slug' and 'concept' fields");
      }

      await withDb(async (db) => {
        try {
          const userId = await resolveUser(opts, db, { json: true });
          const symbiosisMode = data.symbiosis_mode;
          if (
            symbiosisMode !== undefined &&
            symbiosisMode !== null &&
            !["shadowing", "copilot", "autonomy"].includes(symbiosisMode)
          ) {
            jsonError(`Invalid symbiosis_mode: ${symbiosisMode}`);
          }
          const result = await handleAddToken(db, {
            user: userId,
            slug: data.slug,
            title: data.title,
            concept: data.concept,
            domain: data.domain,
            bloomLevel: data.bloom_level,
            context: data.context,
            symbiosisMode: symbiosisMode as SymbiosisMode | null | undefined,
            sourceLink: data.source_link,
            question: data.question,
            knowledgeContexts: data.knowledgeContexts,
            knowledge_contexts: data.knowledge_contexts,
            prerequisites: data.prerequisites,
          });
          jsonOut(result);
        } catch (err) {
          jsonError((err as Error).message);
        }
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge okf-import ─────────────────────────────────────────────────

bridgeCommand
  .command("okf-import")
  .description(
    "Record an agent's decomposition of an OKF article as learning tokens (JSON stdin, ADR 2026-07-18)",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    try {
      let raw: string;
      if (isServeMode) {
        raw = serveStdinPayload ?? "";
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        raw = Buffer.concat(chunks).toString("utf-8").trim();
      }

      if (!raw) {
        jsonError(
          "No input received on stdin. Pipe JSON: { file, bundle_dir?, tokens: [...] }",
        );
      }

      let data: {
        file: string;
        bundle_dir?: string;
        tokens: ImportOkfTokenInput[];
      };
      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }
      if (!data?.file || !Array.isArray(data?.tokens)) {
        jsonError("JSON must include 'file' and a 'tokens' array");
      }

      await withDb(async (db) => {
        try {
          const userId = await resolveUser(opts, db, { json: true });
          const result = await handleImportOkfTokens(db, {
            user: userId,
            bundleDir: data.bundle_dir,
            file: data.file,
            tokens: data.tokens,
          });
          jsonOut(result);
        } catch (err) {
          jsonError((err as Error).message);
        }
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge relevant-tokens ────────────────────────────────────────────

bridgeCommand
  .command("relevant-tokens")
  .description("Find tokens relevant to a given context")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    try {
      let raw: string;
      if (isServeMode) {
        raw = serveStdinPayload ?? "";
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        raw = Buffer.concat(chunks).toString("utf-8").trim();
      }

      if (!raw) {
        jsonError("No input received on stdin. Pipe JSON with context.");
      }

      let data: {
        context: string;
        limit?: number;
      };

      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      if (!data?.context || data.context.trim() === "") {
        jsonError("JSON must include a non-empty 'context' field");
      }

      await withDb(async (db) => {
        try {
          const userId = await resolveUser(opts, db, { json: true });
          const result = await handleFindTokens(db, {
            user: userId,
            context: data.context,
            limit: data.limit,
          });
          jsonOut(result);
        } catch (err) {
          jsonError((err as Error).message);
        }
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge suggest-foundations ────────────────────────────────────────

bridgeCommand
  .command("suggest-foundations")
  .description("Propose existing tokens as foundation/prerequisite candidates")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    try {
      let raw: string;
      if (isServeMode) {
        raw = serveStdinPayload ?? "";
      } else {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer);
        }
        raw = Buffer.concat(chunks).toString("utf-8").trim();
      }

      if (!raw) {
        jsonError("No input received on stdin. Pipe JSON.");
      }

      let data: {
        slug?: string;
        concept?: string;
        question?: string;
        domain?: string;
        title?: string;
        bloom_level?: number;
        limit?: number;
      };

      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      await withDb(async (db) => {
        try {
          const userId = await resolveUser(opts, db, { json: true });
          const result = await handleSuggestFoundations(db, {
            user: userId,
            slug: data.slug,
            concept: data.concept,
            question: data.question,
            domain: data.domain,
            title: data.title,
            bloom_level: data.bloom_level,
            limit: data.limit,
          });
          jsonOut(result);
        } catch (err) {
          jsonError((err as Error).message);
        }
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge discover-skills ──────────────────────────────────────────────

bridgeCommand
  .command("discover-skills")
  .description(
    "Analyze monitor logs across sessions to discover recurring patterns",
  )
  .option(
    "--min-sessions <n>",
    "Minimum sessions a pattern must appear in (default: 2)",
    "2",
  )
  .option(
    "--limit <n>",
    "Max number of sessions to analyze (default: 20)",
    "20",
  )
  .action(async (opts) => {
    try {
      const monitorDir = join(homedir(), ".zam", "monitor");
      let files: string[];
      try {
        files = readdirSync(monitorDir).filter((f) => f.endsWith(".jsonl"));
      } catch {
        jsonOut({ proposals: [], message: "No monitor logs found." });
        return;
      }

      if (files.length === 0) {
        jsonOut({ proposals: [], message: "No monitor logs found." });
        return;
      }

      // Take the most recent N sessions by file modification time
      const limit = Number(opts.limit);
      const sorted = files
        .map((f) => ({ name: f, path: join(monitorDir, f) }))
        .sort((a, b) => b.name.localeCompare(a.name)) // ULID session IDs sort chronologically
        .slice(0, limit);

      // Load and parse each session's commands
      const sessionCommands = new Map<
        string,
        ReturnType<typeof pairCommands>
      >();
      for (const file of sorted) {
        const sessionId = file.name.replace(".jsonl", "");
        const events = readMonitorLog(sessionId);
        const commands = pairCommands(events);
        if (commands.length > 0) {
          sessionCommands.set(sessionId, commands);
        }
      }

      if (sessionCommands.size === 0) {
        jsonOut({ proposals: [], message: "No command data in monitor logs." });
        return;
      }

      // Get existing skills to exclude
      let existingSkillSlugs: string[] = [];
      let db: Database | undefined;
      try {
        db = await openDatabase();
        existingSkillSlugs = (await listAgentSkills(db)).map((s) => s.slug);
      } catch {
        // DB not available — proceed without exclusion
      } finally {
        await db?.close();
      }

      const proposals = discoverSkills(sessionCommands, {
        minSessions: Number(opts.minSessions),
        existingSkillSlugs,
      });

      jsonOut({
        sessionsAnalyzed: sessionCommands.size,
        proposals,
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge observe-ui-watch / get-observations ─────────────────────────

bridgeCommand
  .command("observe-ui-watch")
  .description(
    "Poll live UI observer watch reports for a ZAM learning session (JSON)",
  )
  .requiredOption(
    "--session <id>",
    "ZAM session ID (also the observer log key)",
  )
  .option("--after <n>", "Only return observations after this sequence")
  .option("--limit <n>", "Maximum observations to return", "100")
  .action(async (opts) => {
    await withDb(async (db) => {
      const session = (await db
        .prepare("SELECT id, execution_context FROM sessions WHERE id = ?")
        .get(opts.session)) as
        | { id: string; execution_context: string }
        | undefined;
      if (!session) {
        jsonError(`Session not found: ${opts.session}`);
      }

      const after =
        opts.after === undefined
          ? undefined
          : parseNonNegativeIntegerOption("after", opts.after);
      const limit = parseNonNegativeIntegerOption("limit", opts.limit);
      const observations = readUiObservationLog(opts.session)
        .filter((report) => after === undefined || report.sequence > after)
        .slice(0, limit);
      const last = observations[observations.length - 1];

      jsonOut({
        sessionId: opts.session,
        executionContext: session.execution_context,
        observationSource: "ui",
        logExists: uiObservationLogExists(opts.session),
        after: after ?? null,
        count: observations.length,
        nextSequence: last?.sequence ?? after ?? null,
        observations,
      });
    });
  });

bridgeCommand
  .command("get-observations")
  .description("Read UI observer reports for a session (JSON)")
  .requiredOption("--session <id>", "Observer session ID")
  .option("--after <n>", "Only return observations after this sequence")
  .option("--limit <n>", "Maximum observations to return", "100")
  .action((opts) => {
    try {
      const after =
        opts.after === undefined
          ? undefined
          : parseNonNegativeIntegerOption("after", opts.after);
      const limit = parseNonNegativeIntegerOption("limit", opts.limit);
      const observations = readUiObservationLog(opts.session)
        .filter((report) => after === undefined || report.sequence > after)
        .slice(0, limit);
      const last = observations[observations.length - 1];

      jsonOut({
        sessionId: opts.session,
        after: after ?? null,
        count: observations.length,
        nextSequence: last?.sequence ?? after ?? null,
        observations,
      });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

bridgeCommand
  .command("observe-ui-snapshot")
  .description(
    "Analyze a captured UI snapshot or video recording with the configured vision LLM (JSON)",
  )
  .requiredOption("--session <id>", "Observer session ID")
  .requiredOption("--sequence <n>", "Monotonic observation sequence number")
  .requiredOption("--image <path>", "PNG snapshot or video recording path")
  .requiredOption("--observed-from <iso>", "Observation window start time")
  .requiredOption("--observed-to <iso>", "Observation window end time")
  .requiredOption("--process-name <name>", "Observed application process name")
  .option("--process-id <n>", "Observed application process ID")
  .option("--window-title <title>", "Observed window title")
  .option("--evidence-ref <ref>", "Evidence reference to put in the report")
  .option("--model <model>", "Override configured LLM model for this request")
  .option("--max-tokens <n>", "Model response token budget")
  .option("--timeout <ms>", "Hard request timeout in milliseconds")
  .option("--redacted", "Mark the snapshot evidence as redacted")
  .option("--write-log", "Append the generated report to the session JSONL")
  .action(async (opts) => {
    const sequence = parseNonNegativeIntegerOption("sequence", opts.sequence);
    const processId =
      opts.processId === undefined
        ? undefined
        : parseNonNegativeIntegerOption("process-id", opts.processId);
    const maxTokens =
      opts.maxTokens === undefined
        ? undefined
        : parseNonNegativeIntegerOption("max-tokens", opts.maxTokens);
    const hardTimeoutMs =
      opts.timeout === undefined
        ? undefined
        : parseNonNegativeIntegerOption("timeout", opts.timeout);

    await withDb(async (db) => {
      const report = await observeUiSnapshotViaLLM(db, {
        sessionId: opts.session,
        sequence,
        observedFrom: opts.observedFrom,
        observedTo: opts.observedTo,
        imagePath: opts.image,
        application: {
          processName: opts.processName,
          processId,
          windowTitle: opts.windowTitle,
        },
        evidenceRef: opts.evidenceRef,
        redacted: opts.redacted === true,
        model: opts.model,
        maxTokens,
        hardTimeoutMs,
      });
      if (opts.writeLog === true) {
        appendUiObservationReport(report);
      }
      jsonOut(report);
    });
  });

// ── zam bridge capture-ui ──────────────────────────────────────────────────

/**
 * Resolve the PowerShell executable, preferring PowerShell 7+ (`pwsh`) over
 * the legacy Windows PowerShell 5.1 (`powershell`). pwsh 7 still ships the
 * Windows Desktop assemblies the screen-capture script needs, so it is the
 * default; `powershell` remains a fallback for machines without pwsh.
 */
function resolveWindowsPowerShell(): string {
  try {
    execFileSync("where.exe", ["pwsh.exe"], { stdio: "ignore" });
    return "pwsh";
  } catch {
    return "powershell";
  }
}

type CaptureTarget = {
  requestedHwnd: string | null;
  requestedProcessName: string | null;
  matchedBy: string;
  hwnd: number | null;
  processId: number | null;
  processName: string | null;
  windowTitle: string | null;
  bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } | null;
};

type CaptureResult = {
  method: string;
  target: CaptureTarget | null;
};

function captureScreenshot(
  outputPath: string,
  hwnd?: string,
  processName?: string,
): CaptureResult {
  const platform = process.platform;
  if (hwnd && !/^(0x)?[0-9a-fA-F]+$/.test(hwnd)) {
    throw new Error(`Invalid HWND format: ${hwnd}`);
  }
  if (processName && !/^[a-zA-Z0-9\-_.]+$/.test(processName)) {
    throw new Error(`Invalid process name format: ${processName}`);
  }

  if (platform === "win32") {
    const stdout = execFileSync(
      resolveWindowsPowerShell(),
      [
        "-NoProfile",
        "-Command",
        `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Runtime.InteropServices;

public class Win32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetProcessDPIAware();

    [DllImport("user32.dll")]
    public static extern bool SetProcessDpiAwarenessContext(IntPtr dpiContext);

    [DllImport("user32.dll")]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWnd, EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", SetLastError=true)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError=true)]
    public static extern int GetWindowTextLength(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
}
'@
Add-Type -TypeDefinition $code

try {
    # DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 = -4. Without this, Windows
    # can return logical window bounds while PrintWindow renders physical
    # pixels, causing high-DPI captures to crop the right/bottom edge.
    [Win32]::SetProcessDpiAwarenessContext([IntPtr](-4)) | Out-Null
} catch {
    try { [Win32]::SetProcessDPIAware() | Out-Null } catch {}
}

function Get-WindowTitle([IntPtr]$hWnd) {
    $length = [Win32]::GetWindowTextLength($hWnd)
    $capacity = [Math]::Max(1, $length + 1)
    $builder = New-Object System.Text.StringBuilder $capacity
    [Win32]::GetWindowText($hWnd, $builder, $builder.Capacity) | Out-Null
    $builder.ToString()
}

function Get-WindowProcess([IntPtr]$hWnd) {
    [uint32]$processId = 0
    [Win32]::GetWindowThreadProcessId($hWnd, [ref]$processId) | Out-Null
    if ($processId -eq 0) { return $null }
    Get-Process -Id $processId -ErrorAction SilentlyContinue
}

function Get-VisibleTopLevelWindows {
    $script:windowCandidates = New-Object System.Collections.ArrayList
    $callback = [Win32+EnumWindowsProc]{
        param([IntPtr]$candidateHwnd, [IntPtr]$lParam)
        if ([Win32]::IsWindowVisible($candidateHwnd)) {
            $candidateRect = New-Object Win32+RECT
            if ([Win32]::GetWindowRect($candidateHwnd, [ref]$candidateRect)) {
                $candidateWidth = $candidateRect.Right - $candidateRect.Left
                $candidateHeight = $candidateRect.Bottom - $candidateRect.Top
                if ($candidateWidth -gt 0 -and $candidateHeight -gt 0) {
                    [void]$script:windowCandidates.Add($candidateHwnd)
                }
            }
        }
        return $true
    }
    [Win32]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null
    $windows = $script:windowCandidates
    Remove-Variable -Name windowCandidates -Scope Script -ErrorAction SilentlyContinue
    $windows
}

function Find-TopLevelWindowByProcessName([string]$name) {
    foreach ($candidateHwnd in Get-VisibleTopLevelWindows) {
        $candidateProcess = Get-WindowProcess $candidateHwnd
        if ($candidateProcess -and $candidateProcess.ProcessName -ieq $name) {
            return [pscustomobject]@{
                Hwnd = $candidateHwnd
                MatchedBy = "process-top-level-window"
            }
        }

        $script:desiredChildProcessName = $name
        $script:foundChildProcessWindow = $false
        $childCallback = [Win32+EnumWindowsProc]{
            param([IntPtr]$childHwnd, [IntPtr]$lParam)
            $childProcess = Get-WindowProcess $childHwnd
            if ($childProcess -and $childProcess.ProcessName -ieq $script:desiredChildProcessName) {
                $script:foundChildProcessWindow = $true
                return $false
            }
            return $true
        }
        [Win32]::EnumChildWindows($candidateHwnd, $childCallback, [IntPtr]::Zero) | Out-Null
        $foundChild = $script:foundChildProcessWindow
        Remove-Variable -Name desiredChildProcessName -Scope Script -ErrorAction SilentlyContinue
        Remove-Variable -Name foundChildProcessWindow -Scope Script -ErrorAction SilentlyContinue

        if ($foundChild) {
            return [pscustomobject]@{
                Hwnd = $candidateHwnd
                MatchedBy = "process-child-window"
            }
        }
    }

    return $null
}

function New-CaptureTarget([IntPtr]$hWnd, [string]$matchedBy) {
    $target = [ordered]@{
        requestedHwnd = if ($targetHwnd -ne '') { $targetHwnd } else { $null }
        requestedProcessName = if ($processName -ne '') { $processName } else { $null }
        matchedBy = $matchedBy
        hwnd = $null
        processId = $null
        processName = $null
        windowTitle = $null
        bounds = $null
    }

    if ($hWnd -ne [IntPtr]::Zero) {
        $target.hwnd = $hWnd.ToInt64()
        $target.windowTitle = Get-WindowTitle $hWnd

        $windowProcess = Get-WindowProcess $hWnd
        if ($windowProcess) {
            $target.processId = $windowProcess.Id
            $target.processName = $windowProcess.ProcessName
        }

        $targetRect = New-Object Win32+RECT
        if ([Win32]::GetWindowRect($hWnd, [ref]$targetRect)) {
            $target.bounds = [ordered]@{
                left = $targetRect.Left
                top = $targetRect.Top
                right = $targetRect.Right
                bottom = $targetRect.Bottom
                width = $targetRect.Right - $targetRect.Left
                height = $targetRect.Bottom - $targetRect.Top
            }
        }
    }

    $target
}

function Write-CaptureResult([string]$method, [IntPtr]$hWnd, [string]$matchedBy) {
    $result = [ordered]@{
        method = $method
        target = New-CaptureTarget $hWnd $matchedBy
    }
    Write-Output ("CAPTURE_RESULT:" + ($result | ConvertTo-Json -Compress -Depth 6))
}

$hwndVal = [IntPtr]::Zero
$matchedBy = "fullscreen-fallback"
$targetHwnd = '${hwnd || ""}'
$processName = '${processName || ""}'

if ($targetHwnd -ne '') {
    if ($targetHwnd.StartsWith("0x")) {
        $hwndVal = [IntPtr][Convert]::ToInt64($targetHwnd, 16)
    } else {
        $hwndVal = [IntPtr][Convert]::ToInt64($targetHwnd, 10)
    }
    $matchedBy = "hwnd"
} elseif ($processName -ne '') {
    $proc = Get-Process -Name $processName -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowHandle -ne 0} | Select-Object -First 1
    if ($proc) {
        $hwndVal = $proc.MainWindowHandle
        $matchedBy = "process-main-window"
    } else {
        $proc = Get-Process -Name $processName -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($proc) {
            $hwndVal = $proc.MainWindowHandle
            $matchedBy = "process-zero-main-window"
        }
    }

    if ($hwndVal -eq [IntPtr]::Zero) {
        $windowMatch = Find-TopLevelWindowByProcessName $processName
        if ($windowMatch) {
            $hwndVal = $windowMatch.Hwnd
            $matchedBy = $windowMatch.MatchedBy
        }
    }
}

if ($hwndVal -ne [IntPtr]::Zero) {
    if ([Win32]::IsIconic($hwndVal)) {
        [Win32]::ShowWindow($hwndVal, 9) | Out-Null # SW_RESTORE = 9
        Start-Sleep -Milliseconds 250
    }

    $rect = New-Object Win32+RECT
    if ([Win32]::GetWindowRect($hwndVal, [ref]$rect)) {
        $width = $rect.Right - $rect.Left
        $height = $rect.Bottom - $rect.Top
        if ($width -gt 0 -and $height -gt 0) {
            $bitmap = New-Object System.Drawing.Bitmap($width, $height)
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            # PrintWindow renders the target window directly, regardless of
            # z-order, so an occluded or background window is still captured
            # correctly. SetForegroundWindow from a background process is
            # blocked by Windows, so CopyFromScreen would grab whatever sits
            # on top. PW_RENDERFULLCONTENT (0x2) handles modern/UWP windows.
            $hdc = $graphics.GetHdc()
            $printed = [Win32]::PrintWindow($hwndVal, $hdc, 2)
            $graphics.ReleaseHdc($hdc)
            $method = "printwindow"

            # Black-frame guard: PrintWindow can return a near-black frame on
            # some hardware-accelerated / DirectComposition surfaces. Sample a
            # sparse grid; if it is essentially black, fall back to a foreground
            # CopyFromScreen grab so the capture self-heals on those drivers.
            $needFallback = -not $printed
            if (-not $needFallback) {
                $sum = 0.0
                $cnt = 0
                $stepX = [Math]::Max(1, [int]($width / 12))
                $stepY = [Math]::Max(1, [int]($height / 12))
                for ($sy = 0; $sy -lt $height; $sy += $stepY) {
                    for ($sx = 0; $sx -lt $width; $sx += $stepX) {
                        $px = $bitmap.GetPixel($sx, $sy)
                        $sum += ($px.R + $px.G + $px.B) / 3.0
                        $cnt++
                    }
                }
                if ($cnt -gt 0 -and ($sum / $cnt) -lt 6) { $needFallback = $true }
            }

            if ($needFallback) {
                [Win32]::SetForegroundWindow($hwndVal) | Out-Null
                Start-Sleep -Milliseconds 250
                $graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)
                $method = "copyfromscreen"
            }
            $bitmap.Save('${outputPath.replace(/\\/g, "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png)
            $graphics.Dispose()
            $bitmap.Dispose()
            Write-CaptureResult $method $hwndVal $matchedBy
            exit 0
        }
    }
}

# Fallback: full primary screen
$screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap($screen.Width, $screen.Height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
$bitmap.Save('${outputPath.replace(/\\/g, "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-CaptureResult "fullscreen" $hwndVal $matchedBy
        `.trim(),
      ],
      { stdio: "pipe", encoding: "utf8" },
    );
    const resultMatch = /CAPTURE_RESULT:(\{.*\})/.exec(stdout ?? "");
    if (resultMatch) {
      const parsed = JSON.parse(resultMatch[1]) as CaptureResult;
      return parsed;
    }
    const methodMatch = /CAPTURE_METHOD:(\w+)/.exec(stdout ?? "");
    return {
      method: methodMatch ? methodMatch[1] : "unknown",
      target: null,
    };
  } else if (platform === "darwin") {
    if (hwnd) {
      const parsedHwnd = hwnd.startsWith("0x")
        ? parseInt(hwnd, 16)
        : parseInt(hwnd, 10);
      execFileSync("screencapture", ["-l", String(parsedHwnd), outputPath], {
        stdio: "pipe",
      });
      return { method: "screencapture-window", target: null };
    } else if (processName) {
      try {
        const windowId = execFileSync(
          "osascript",
          [
            "-e",
            `tell application "System Events" to get id of window 1 of process "${processName}"`,
          ],
          { encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] },
        ).trim();
        if (windowId && /^\d+$/.test(windowId)) {
          execFileSync("screencapture", ["-l", windowId, outputPath], {
            stdio: "pipe",
          });
          return { method: "screencapture-window", target: null };
        }
      } catch {
        // Fallback if AppleScript fails
      }
      execFileSync("screencapture", ["-x", outputPath], { stdio: "pipe" });
      return { method: "screencapture-full", target: null };
    } else {
      execFileSync("screencapture", ["-x", outputPath], { stdio: "pipe" });
      return { method: "screencapture-full", target: null };
    }
  } else {
    throw new Error(
      `Screen capture not supported on platform: ${platform}. Use zam-observer or provide --image.`,
    );
  }
}

bridgeCommand
  .command("capture-ui")
  .description("Capture a screenshot for agent-side vision analysis (JSON)")
  .option("--session <id>", "ZAM session ID (for metadata)")
  .option("--output <path>", "PNG output path (defaults to temp file)")
  .option("--image <path>", "Skip capture; return an existing image instead")
  .option("--hwnd <hwnd>", "Window handle (decimal or hex) to capture")
  .option("--process-name <name>", "Process name to capture")
  .action(async (opts) => {
    await withDb(async (db) => {
      const policy = await resolveObserverPolicy(db);
      const permission = {
        scope: policy.scope,
        consent: policy.consent,
        retention: policy.retention,
      };
      const isProvided = Boolean(opts.image);

      // A caller-provided --image is "analyze this file", not a capture: ZAM
      // is not holding the camera, so scope/target policy does not apply.
      // Live captures are gated below.
      if (!isProvided) {
        const pre = decidePreCapture(policy, {
          hasExplicitTarget: Boolean(opts.hwnd || opts.processName),
          requestedProcessName: opts.processName ?? null,
        });
        if (!pre.allowed) {
          jsonOut({
            sessionId: opts.session ?? null,
            granted: false,
            denied: true,
            denialReason: pre.denialReason,
            reason: pre.reason,
            capturedAt: new Date().toISOString(),
            platform: process.platform,
            permission: { ...permission, granted: false },
          });
          return;
        }
      }

      const outputPath =
        opts.image ??
        opts.output ??
        join(tmpdir(), `zam-capture-${randomBytes(4).toString("hex")}.png`);

      const captureResult = isProvided
        ? ({ method: "provided", target: null } satisfies CaptureResult)
        : captureScreenshot(outputPath, opts.hwnd, opts.processName);

      // Post-resolution gate: the real process/title are only known now, so
      // the sensitive/denylist check runs against the window actually
      // captured. If it fails, discard the pixels before they leave.
      if (!isProvided) {
        const post = decidePostCapture(policy, {
          method: captureResult.method,
          processName: captureResult.target?.processName ?? null,
          windowTitle: captureResult.target?.windowTitle ?? null,
        });
        if (!post.allowed) {
          if (!opts.output) {
            try {
              rmSync(outputPath, { force: true });
            } catch {
              // best-effort discard
            }
          }
          jsonOut({
            sessionId: opts.session ?? null,
            granted: false,
            denied: true,
            denialReason: post.denialReason,
            reason: post.reason,
            capturedAt: new Date().toISOString(),
            platform: process.platform,
            permission: { ...permission, granted: false },
          });
          return;
        }
      }

      const imageBytes = readFileSync(outputPath);
      const base64 = imageBytes.toString("base64");

      jsonOut({
        sessionId: opts.session ?? null,
        granted: true,
        imagePath: outputPath,
        base64,
        mimeType: "image/png",
        captureMethod: captureResult.method,
        captureTarget: captureResult.target,
        capturedAt: new Date().toISOString(),
        platform: process.platform,
        permission: { ...permission, granted: true },
      });
    });
  });

// ── zam bridge start-recording ──────────────────────────────────────────────

bridgeCommand
  .command("start-recording")
  .description("Start screen recording in the background (JSON)")
  .requiredOption("--session <id>", "ZAM session ID")
  .option("--output <path>", "Video output path")
  .action(async (opts) => {
    const platform = process.platform;
    if (platform !== "darwin" && platform !== "win32") {
      jsonOut({
        sessionId: opts.session,
        started: false,
        error:
          "Screen recording is only supported on macOS (darwin) and Windows (win32)",
      });
      return;
    }

    const sessionId = opts.session;
    const statePath = join(tmpdir(), `zam-recording-${sessionId}.json`);
    const defaultExt = platform === "win32" ? ".mkv" : ".mov";
    const outputPath =
      opts.output ?? join(tmpdir(), `zam-recording-${sessionId}${defaultExt}`);

    const { existsSync, writeFileSync, openSync, closeSync } = await import(
      "node:fs"
    );
    if (existsSync(statePath)) {
      jsonOut({
        sessionId,
        started: false,
        error: `Recording is already active for session ${sessionId}`,
      });
      return;
    }

    const logPath = join(tmpdir(), `zam-recording-${sessionId}.log`);
    let logFd: number;
    try {
      logFd = openSync(logPath, "w");
    } catch (e) {
      jsonOut({
        sessionId,
        started: false,
        error: `Failed to open log file at ${logPath}: ${(e as Error).message}`,
      });
      return;
    }

    const { spawn } = await import("node:child_process");
    const ffmpegArgs =
      platform === "darwin"
        ? [
            "-y",
            "-f",
            "avfoundation",
            "-r",
            "5",
            "-i",
            "0",
            "-pix_fmt",
            "yuv420p",
            outputPath,
          ]
        : [
            "-y",
            "-f",
            "gdigrab",
            "-framerate",
            "5",
            "-i",
            "desktop",
            "-pix_fmt",
            "yuv420p",
            outputPath,
          ];

    const child = spawn("ffmpeg", ffmpegArgs, {
      detached: true,
      stdio: ["pipe", logFd, logFd],
    });

    try {
      closeSync(logFd);
    } catch {}

    child.unref();

    if (child.pid) {
      writeFileSync(
        statePath,
        JSON.stringify({
          pid: child.pid,
          outputPath,
          startedAt: new Date().toISOString(),
        }),
        "utf8",
      );

      jsonOut({
        sessionId,
        started: true,
        outputPath,
        pid: child.pid,
      });
    } else {
      jsonOut({
        sessionId,
        started: false,
        error: "Failed to spawn ffmpeg process",
      });
    }
  });

// ── zam bridge stop-recording ───────────────────────────────────────────────

bridgeCommand
  .command("stop-recording")
  .description(
    "Stop active screen recording and apply idle-frame compression (JSON)",
  )
  .requiredOption("--session <id>", "ZAM session ID")
  .action(async (opts) => {
    const platform = process.platform;
    if (platform !== "darwin" && platform !== "win32") {
      jsonOut({
        sessionId: opts.session,
        stopped: false,
        error:
          "Screen recording is only supported on macOS (darwin) and Windows (win32)",
      });
      return;
    }

    const sessionId = opts.session;
    const statePath = join(tmpdir(), `zam-recording-${sessionId}.json`);
    const { existsSync, readFileSync, rmSync } = await import("node:fs");

    if (!existsSync(statePath)) {
      jsonOut({
        sessionId,
        stopped: false,
        error: `No active recording found for session ${sessionId}`,
      });
      return;
    }

    const state = JSON.parse(readFileSync(statePath, "utf8"));
    const { pid, outputPath } = state;

    try {
      process.kill(pid, "SIGINT");
    } catch (_e) {
      // Process might already be dead
    }

    const isProcessRunning = (pId: number) => {
      try {
        process.kill(pId, 0);
        return true;
      } catch (_e) {
        return false;
      }
    };

    let attempts = 0;
    while (isProcessRunning(pid) && attempts < 20) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      attempts++;
    }

    if (isProcessRunning(pid)) {
      try {
        process.kill(pid, "SIGKILL");
      } catch (_e) {}
    }

    try {
      rmSync(statePath, { force: true });
    } catch {}

    if (!existsSync(outputPath)) {
      jsonOut({
        sessionId,
        stopped: false,
        error: `Recording file not found at ${outputPath}`,
      });
      return;
    }

    const decimatedPath = outputPath.replace(/\.[^.]+$/, "-decimated.mp4");
    const { execSync } = await import("node:child_process");

    try {
      execSync(
        `ffmpeg -y -i "${outputPath}" -vf "mpdecimate,setpts=N/FRAME_RATE/TB" -an -pix_fmt yuv420p "${decimatedPath}"`,
        { stdio: "ignore" },
      );
    } catch (ffmpegErr) {
      jsonOut({
        sessionId,
        stopped: true,
        videoPath: outputPath,
        decimated: false,
        warning: `mpdecimate post-processing failed: ${(ffmpegErr as Error).message}`,
      });
      return;
    }

    try {
      rmSync(outputPath, { force: true });
    } catch {}

    jsonOut({
      sessionId,
      stopped: true,
      videoPath: decimatedPath,
      decimated: true,
    });
  });

// ── zam bridge get-observer-policy ─────────────────────────────────────────

bridgeCommand
  .command("get-observer-policy")
  .description(
    "Report the resolved observer policy so an agent can check before capturing (JSON)",
  )
  .action(async () => {
    await withDb(async (db) => {
      const policy = await resolveObserverPolicy(db);
      jsonOut({
        scope: policy.scope,
        consent: policy.consent,
        retention: policy.retention,
        allowlist: policy.allowlist,
        denylist: policy.denylist,
        redactWindowTitles: policy.redactWindowTitles,
        audioOptIn: policy.audioOptIn,
        builtInSensitiveAlwaysRefused: true,
        builtInSensitiveMatchers: [...BUILT_IN_SENSITIVE_MATCHERS],
      });
    });
  });

// ── zam bridge sync-observer-policy ────────────────────────────────────────

bridgeCommand
  .command("sync-observer-policy")
  .description(
    "Write the resolved observer policy to the native sidecar file (JSON)",
  )
  .action(async () => {
    await withDb(async (db) => {
      const { path, policy } = await syncObserverSidecarPolicy(db);
      jsonOut({ synced: true, path, policy });
    });
  });

// ── zam bridge check-llm ──────────────────────────────────────────────────

bridgeCommand
  .command("check-llm")
  .description("Check if LLM is enabled and online (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const provider = await getProviderForRole(db, "recall");
      const { enabled, url, model, apiKey } = provider;
      const unsupportedProvider = provider.apiFlavor !== "chat-completions";
      let online = false;
      let availableModels: string[] = [];
      let modelAvailable = false;
      if (enabled && !unsupportedProvider) {
        online = await isLlmOnline(url);
        if (online) {
          availableModels = await getAvailableModels(url, apiKey);
          // Empty list = server doesn't expose /models; don't claim it's wrong.
          modelAvailable =
            availableModels.length === 0 ||
            availableModels.some(
              (m) => m.toLowerCase() === model.toLowerCase(),
            );
        }
      }
      jsonOut({
        enabled,
        online,
        url,
        model,
        modelAvailable,
        availableModels,
        apiFlavor: provider.apiFlavor,
        unsupportedProvider,
      });
    });
  });

bridgeCommand
  .command("provider-status")
  .description("Show secret-safe provider status for LLM roles (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const [recall, vision, text, embedding] = await Promise.all([
        getProviderRoleStatus(db, "recall"),
        getProviderRoleStatus(db, "vision"),
        getProviderRoleStatus(db, "text"),
        getProviderRoleStatus(db, "embedding"),
      ]);
      jsonOut({ roles: { recall, vision, text, embedding } });
    });
  });

// ── zam bridge provider-config-* ───────────────────────────────────────────

bridgeCommand
  .command("provider-config-list")
  .description("List provider records and role bindings (JSON)")
  .option("--scope <scope>", "machine (default) or shared", "machine")
  .action(async (opts) => {
    const machine = parseProviderScope(opts.scope);
    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      const roles = await readScopedRoles(db, machine);
      const rows = buildProviderListing(
        providers,
        (ref) => getProviderApiKey(ref) !== null,
      );
      jsonOut({
        scope: machine ? "machine" : "shared",
        providers: rows,
        roles,
        orphans: findOrphanKeyRefs(listProviderApiKeyRefs(), providers),
      });
    });
  });

bridgeCommand
  .command("provider-config-upsert")
  .description("Add or update a provider record (JSON)")
  .requiredOption("--name <name>", "Provider name")
  .option("--label <label>", "Human-readable label")
  .option("--url <url>", "Endpoint base URL")
  .option("--model <model>", "Model id")
  .option(
    "--flavor <flavor>",
    `Wire protocol: ${VALID_API_FLAVORS.join(" | ")}`,
  )
  .option("--local", "Mark as local endpoint")
  .option("--no-local", "Mark as cloud/non-local endpoint")
  .option("--runner <runner>", "Local runner hint")
  .option("--key-ref <ref>", "Credential reference for API key")
  .option("--scope <scope>", "machine (default) or shared", "machine")
  .action(async (opts, command) => {
    const machine = parseProviderScope(opts.scope);
    let apiFlavor: ApiFlavor | undefined;
    if (opts.flavor) {
      if (!VALID_API_FLAVORS.includes(opts.flavor)) {
        jsonError(
          `Invalid --flavor: ${opts.flavor}. Use ${VALID_API_FLAVORS.join(" or ")}.`,
        );
      }
      apiFlavor = opts.flavor;
    }
    // Commander stores the `--local` / `--no-local` pair on opts.local (true /
    // false) — there is no opts.noLocal. Because `--no-local` defaults opts.local
    // to true, only treat it as set when a flag was actually passed; otherwise
    // leave `local` undefined so an update doesn't clobber the stored value.
    let local: boolean | undefined;
    if (command.getOptionValueSource("local") === "cli") {
      local = opts.local === true;
    }
    const patch: ProviderRecord = {};
    if (opts.label !== undefined) patch.label = opts.label;
    if (opts.url !== undefined) patch.url = opts.url;
    if (opts.model !== undefined) patch.model = opts.model;
    if (apiFlavor !== undefined) patch.apiFlavor = apiFlavor;
    if (opts.keyRef !== undefined) patch.apiKeyRef = opts.keyRef;
    if (local !== undefined) patch.local = local;
    if (opts.runner !== undefined) patch.runner = opts.runner;

    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      const next = upsertProviderRecord(providers, opts.name, patch);
      await writeScopedProviders(db, machine, next);
      const rows = buildProviderListing(
        next,
        (ref) => getProviderApiKey(ref) !== null,
      );
      const row = rows.find((entry) => entry.name === opts.name);
      jsonOut({
        ok: true,
        scope: machine ? "machine" : "shared",
        name: opts.name,
        provider: row,
        cloudModelHint: opts.url ? getCloudModelRecommendation(opts.url) : null,
      });
    });
  });

bridgeCommand
  .command("provider-config-remove")
  .description("Remove a provider record (JSON)")
  .requiredOption("--name <name>", "Provider name")
  .option("--scope <scope>", "machine (default) or shared", "machine")
  .action(async (opts) => {
    const machine = parseProviderScope(opts.scope);
    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      const { providers: next, removed } = removeProviderRecord(
        providers,
        opts.name,
      );
      if (!removed) {
        jsonError(`No such provider: ${opts.name}`);
      }
      await writeScopedProviders(db, machine, next);
      jsonOut({
        ok: true,
        scope: machine ? "machine" : "shared",
        name: opts.name,
        removed: true,
        referencingRoles: rolesReferencing(
          await readScopedRoles(db, machine),
          opts.name,
        ),
      });
    });
  });

bridgeCommand
  .command("provider-config-bind")
  .description("Bind providers to an LLM role (JSON)")
  .requiredOption("--role <role>", `Role: ${VALID_ROLES.join(" | ")}`)
  .requiredOption("--primary <name>", "Primary provider name")
  .option("--fallback <name>", "Fallback provider name")
  .option("--scope <scope>", "machine (default) or shared", "machine")
  .action(async (opts) => {
    if (!VALID_ROLES.includes(opts.role)) {
      jsonError(`Invalid --role: ${opts.role}. Use ${VALID_ROLES.join(", ")}.`);
    }
    const machine = parseProviderScope(opts.scope);
    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      const roles = await readScopedRoles(db, machine);
      let nextRoles = bindRoleProviders(
        roles,
        opts.role as LlmRole,
        opts.primary,
        opts.fallback,
      );
      // Text-role curriculum import inherits recall; one learner-facing binding.
      if (opts.role === "recall") {
        nextRoles = unbindRole(nextRoles, "text");
      }
      await writeScopedRoles(db, machine, nextRoles);
      const binding = nextRoles[opts.role as LlmRole];
      const primary = providers[opts.primary];
      jsonOut({
        ok: true,
        scope: machine ? "machine" : "shared",
        role: opts.role,
        binding,
        warnings: [
          ...(primary &&
          primary.apiFlavor === "anthropic-messages" &&
          (opts.role === "recall" || opts.role === "text")
            ? ["unsupported-provider-for-role"]
            : []),
          ...(opts.primary && !(opts.primary in providers)
            ? ["primary-provider-undefined"]
            : []),
          ...(opts.fallback && !(opts.fallback in providers)
            ? ["fallback-provider-undefined"]
            : []),
        ],
      });
    });
  });

bridgeCommand
  .command("provider-set-key")
  .description("Store an API key for a provider reference (JSON)")
  .requiredOption("--ref <ref>", "Credential reference name")
  .option("--key <value>", "API key value (write-only)")
  .option(
    "--key-from <secret-ref>",
    "Vault reference instead of --key (e.g. bw://item/apiKey)",
  )
  .action(async (opts) => {
    if (opts.key && opts.keyFrom) {
      jsonError("Use either --key or --key-from, not both.");
    }
    if (opts.keyFrom) {
      try {
        setProviderApiKey(opts.ref, secretRefFromUri(String(opts.keyFrom)));
      } catch (err) {
        jsonError(err instanceof Error ? err.message : String(err));
      }
      await resolveCredentials();
      if (getProviderApiKey(opts.ref) === null) {
        jsonError(
          `Could not resolve key reference "${opts.keyFrom}". Unlock Bitwarden in Settings or run credentials-check.`,
        );
      }
      jsonOut({
        ok: true,
        ref: opts.ref,
        kind: "reference",
        secretRef: opts.keyFrom,
      });
      return;
    }
    const key = String(opts.key ?? "").trim();
    if (!key) jsonError("Provide --key or --key-from.");
    setProviderApiKey(opts.ref, key);
    await resolveCredentials();
    await maybeAutoSyncSecrets();
    jsonOut({
      ok: true,
      ref: opts.ref,
      kind: "literal",
      masked: maskSecret(key),
    });
  });

// The endpoint's own answer to "which models do you have" — better than any
// name heuristic, and the only thing that catches a typo before it becomes a
// 404 in the middle of a review (reported 2026-08-01 for `mimo-v2.5-tts`).
bridgeCommand
  .command("model-catalog")
  .description("List the models an endpoint advertises (JSON)")
  .requiredOption("--url <url>", "Endpoint base URL")
  .option("--key-ref <ref>", "Stored credential reference")
  .option("--key <value>", "API key for an endpoint not yet saved")
  .action(async (opts) => {
    const apiKey =
      (opts.key as string | undefined)?.trim() ||
      (opts.keyRef ? (getProviderApiKey(opts.keyRef) ?? undefined) : undefined);
    // An endpoint that serves no catalog is a normal state, not an error: many
    // local runners have none, and the caller falls back to free typing.
    jsonOut({ models: await getAvailableModels(opts.url, apiKey) });
  });

bridgeCommand
  .command("provider-clear-key")
  .description("Remove a stored provider API key (JSON)")
  .requiredOption("--ref <ref>", "Credential reference name")
  .action((opts) => {
    clearProviderApiKey(opts.ref);
    jsonOut({ ok: true, ref: opts.ref });
  });

bridgeCommand
  .command("list-models")
  .description("List models exposed by an LLM endpoint (JSON)")
  .requiredOption("--url <url>", "Endpoint base URL")
  .option("--key-ref <ref>", "Resolve API key from credentials by reference")
  .action(async (opts) => {
    const apiKey = opts.keyRef
      ? (getProviderApiKey(opts.keyRef) ?? undefined)
      : undefined;
    const models = await getAvailableModels(opts.url, apiKey);
    jsonOut({ models });
  });

// ── zam bridge model-* (unified capability registry, ADR 2026-07-12) ─────────

/** Secret-safe projection of a registry entry for the Settings UI. */
function modelRow(entry: ModelEntry): Record<string, unknown> {
  return {
    id: entry.id,
    label: entry.label,
    url: entry.url,
    model: entry.model,
    local: entry.local,
    apiFlavor: entry.apiFlavor,
    runner: entry.runner,
    order: entry.order,
    capabilities: entry.capabilities,
    detectedCapabilities: entry.detectedCapabilities,
    probedAt: entry.probedAt,
    apiKeyRef: entry.apiKeyRef,
    keyState: entry.apiKeyRef
      ? getProviderApiKey(entry.apiKeyRef)
        ? "set"
        : "missing"
      : "none",
    // Agent transport fields (ADR 2026-07-12a). Absent/"http" for HTTP rows.
    transport: entry.transport ?? "http",
    agentHarness: entry.agentHarness,
    // Optional reasoning effort (e.g. Copilot --effort); unset = adapter default.
    effort: entry.effort,
  };
}

/** Parse a `{cap: true}` JSON object into a full capability flag record. */
function parseCapabilityFlags(json: string | undefined): CapabilityFlags {
  const flags = emptyCapabilityFlags();
  if (!json) return flags;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    jsonError("Invalid --capabilities JSON");
  }
  if (parsed && typeof parsed === "object") {
    const record = parsed as Record<string, unknown>;
    for (const key of Object.keys(flags) as ModelCapability[]) {
      if (record[key] === true) flags[key] = true;
    }
  }
  return flags;
}

function urlLooksLocal(url: string): boolean {
  return /localhost|127\.0\.0\.1|\[::1\]|::1/.test(url);
}

/**
 * Registry access for the `model-*` commands.
 *
 * They used to be purely machine-local. Half the registry now lives in the
 * learner database (ADR 2026-07-23), so they need a connection — but the
 * editing logic below is unchanged and still works on one merged list, which
 * is why this is two helpers rather than a `withDb` wrapper around each body.
 */
async function readRegistry(): Promise<ResolvedModelEntry[]> {
  let models: ResolvedModelEntry[] = [];
  await withDb(async (db) => {
    models = await loadModelRegistry(db);
  });
  return models;
}

async function writeRegistry(entries: ResolvedModelEntry[]): Promise<void> {
  await withDb(async (db) => {
    await saveModelRegistry(db, entries);
  });
}

bridgeCommand
  .command("model-list")
  .description("List the capability model registry, machine + cloud (JSON)")
  .action(async () => {
    // Reading the registry is where a freshly upgraded install first migrates
    // legacy providers/roles into ai.models (one-time, idempotent) and then
    // moves its cloud rows into the database (ADR 2026-07-23).
    ensureMachineAiModelsMigrated();
    await withDb(async (db) => {
      jsonOut({ models: (await loadModelRegistry(db)).map(modelRow) });
    });
  });

bridgeCommand
  .command("model-probe")
  .description("Detect capabilities of an endpoint via metadata (JSON)")
  .requiredOption("--url <url>", "Endpoint base URL")
  .requiredOption("--model <model>", "Model id")
  .option(
    "--flavor <flavor>",
    `Wire protocol: ${VALID_API_FLAVORS.join(" | ")}`,
  )
  .option("--key-ref <ref>", "Credential reference for API key")
  .option("--embedding-dim-probe", "Allow one cheap /v1/embeddings dim probe")
  .action(async (opts) => {
    if (opts.flavor && !VALID_API_FLAVORS.includes(opts.flavor)) {
      jsonError(`Invalid --flavor: ${opts.flavor}.`);
    }
    const apiFlavor: ApiFlavor = opts.flavor ?? inferApiFlavor(opts.url);
    const probe = await probeModelCapabilities(
      {
        url: opts.url,
        model: opts.model,
        apiFlavor,
        apiKeyRef: opts.keyRef,
      },
      { embeddingDimProbe: opts.embeddingDimProbe === true },
    );
    jsonOut({
      reachable: probe.reachable,
      catalog: probe.catalog,
      detected: probe.detected,
    });
  });

bridgeCommand
  .command("model-upsert")
  .description(
    "Add or update a registry entry; probes before persisting (JSON)",
  )
  .option("--id <id>", "Existing entry id (omit to create)")
  .option("--label <label>", "Human label")
  .option("--url <url>", "Endpoint base URL")
  .option("--model <model>", "Model id")
  .option(
    "--flavor <flavor>",
    `Wire protocol: ${VALID_API_FLAVORS.join(" | ")}`,
  )
  .option("--local", "Mark as local endpoint")
  .option("--no-local", "Mark as cloud/non-local endpoint")
  .option("--runner <runner>", "Local runner hint")
  .option("--key-ref <ref>", "Credential reference for API key")
  .option("--capabilities <json>", "JSON object of user-selected capabilities")
  .option("--order <n>", "Explicit sort order")
  .option(
    "--transport <transport>",
    'How ZAM reaches the model: "http" (default) or "agent" (ADR 2026-07-12a)',
  )
  .option(
    "--agent-harness <id>",
    'Harness id for transport "agent" (e.g. claude-code)',
  )
  .option(
    "--effort <level>",
    'Reasoning effort for agent harnesses that support it (auto|none|minimal|low|medium|high|xhigh|max). "auto" clears a stored value.',
  )
  .action(async (opts, command) => {
    if (opts.flavor && !VALID_API_FLAVORS.includes(opts.flavor)) {
      jsonError(`Invalid --flavor: ${opts.flavor}.`);
    }
    const models = await readRegistry();
    const existingIndex = opts.id
      ? models.findIndex((m) => m.id === opts.id)
      : -1;
    if (opts.id && existingIndex < 0) jsonError(`No such model: ${opts.id}`);
    const prev = existingIndex >= 0 ? models[existingIndex] : undefined;

    const transportRaw = (opts.transport ??
      prev?.transport ??
      "http") as string;
    if (transportRaw !== "http" && transportRaw !== "agent") {
      jsonError(`Invalid --transport: ${transportRaw}. Use http or agent.`);
    }
    const transport = transportRaw as "http" | "agent";
    const order =
      opts.order !== undefined
        ? Number.parseInt(opts.order, 10)
        : (prev?.order ?? models.length);

    // ── Agent transport (ADR 2026-07-12a): no HTTP endpoint to probe ────────
    if (transport === "agent") {
      const agentHarness = (opts.agentHarness ??
        prev?.agentHarness ??
        "") as string;
      if (!agentHarness) {
        jsonError("--agent-harness is required when --transport is agent");
      }
      const { getAgentAdapter, listAgentTextHarnessIds } = await import(
        "../agent-llm/adapter.js"
      );
      const adapter = getAgentAdapter(agentHarness);
      if (!adapter) {
        jsonError(
          `No agent-text adapter for harness "${agentHarness}". ` +
            `Supported today: ${listAgentTextHarnessIds().join(", ")}.`,
        );
      }
      const harnessMeta = getHarness(agentHarness);
      const { resolveAgentModelId } = await import("../agent-llm/defaults.js");
      const modelId = resolveAgentModelId(
        agentHarness,
        opts.model as string | undefined,
        prev?.model,
      );
      // An agent entry is identified by (harness, model id): the same pair
      // twice is one registry row, not two. Without --id -- which the add
      // forms have nothing to send -- every submit used to append, so a
      // re-click while the probe below was still running left the user with
      // duplicate rows competing for the same fallback order (issue: three
      // identical "Claude Code · haiku" entries from one add attempt).
      const targetIndex =
        existingIndex >= 0
          ? existingIndex
          : models.findIndex(
              (m) =>
                m.transport === "agent" &&
                m.agentHarness === agentHarness &&
                m.model === modelId,
            );
      const target = targetIndex >= 0 ? models[targetIndex] : undefined;
      const probe = await adapter.probe();
      const now = new Date().toISOString();
      const modalities = adapter.modalities ?? { text: true };
      const detected = emptyCapabilityFlags();
      // Probe gates readiness; modalities declare what the adapter can do.
      detected.text = probe.available && modalities.text !== false;
      detected.image = probe.available && modalities.image === true;
      const defaultCaps = {
        ...emptyCapabilityFlags(),
        text: true,
        // Multimodal agents default image on so vision OCR can use them.
        image: modalities.image === true,
      };
      const requested = opts.capabilities
        ? parseCapabilityFlags(opts.capabilities)
        : (target?.capabilities ?? defaultCaps);
      // User intent for text/image; resolveCapability still requires both
      // capabilities and detectedCapabilities for runtime selection.
      const capabilities = emptyCapabilityFlags();
      capabilities.text = requested.text !== false;
      capabilities.image =
        modalities.image === true && requested.image === true;
      const VALID_EFFORTS = new Set([
        "none",
        "minimal",
        "low",
        "medium",
        "high",
        "xhigh",
        "max",
      ]);
      // --effort auto (or empty) clears a stored override; omit keeps previous.
      let effort: ModelEntry["effort"] | undefined = target?.effort;
      if (opts.effort !== undefined) {
        const raw = String(opts.effort).trim().toLowerCase();
        if (raw === "" || raw === "auto") {
          effort = undefined;
        } else if (VALID_EFFORTS.has(raw)) {
          effort = raw as NonNullable<ModelEntry["effort"]>;
        } else {
          jsonError(
            `Invalid --effort: ${opts.effort}. Use auto|none|minimal|low|medium|high|xhigh|max.`,
          );
        }
      }
      const entry: ModelEntry = {
        id: opts.id ?? target?.id ?? ulid(),
        label:
          opts.label ?? target?.label ?? harnessMeta?.label ?? agentHarness,
        url: "",
        // Real harness model id (e.g. haiku, gpt-5.4-mini) — not a placeholder.
        model: modelId,
        local: false,
        apiFlavor: "chat-completions",
        // Keep the matched row's slot; only a genuinely new entry lands last.
        order: opts.order !== undefined ? order : (target?.order ?? order),
        capabilities,
        detectedCapabilities: detected,
        probedAt: now,
        transport: "agent",
        agentHarness,
        ...(effort ? { effort } : {}),
      };
      const next = [...models];
      if (targetIndex >= 0) next[targetIndex] = entry;
      else next.push(entry);
      await writeRegistry(next);
      jsonOut({
        ok: true,
        created: targetIndex < 0,
        model: modelRow(entry),
        probe: {
          reachable: probe.available,
          detected,
          detail: probe.detail,
        },
      });
      return;
    }

    // ── HTTP transport (local / cloud) ──────────────────────────────────────
    const url = opts.url ?? prev?.url ?? "";
    if (!url) jsonError("--url is required");
    const model = opts.model ?? prev?.model ?? "";
    if (!model) jsonError("--model is required");
    const apiFlavor: ApiFlavor =
      opts.flavor ?? prev?.apiFlavor ?? inferApiFlavor(url);
    const local =
      command.getOptionValueSource("local") === "cli"
        ? opts.local === true
        : (prev?.local ?? urlLooksLocal(url));

    const candidate: ModelEntry = {
      id: opts.id ?? ulid(),
      label: opts.label ?? prev?.label ?? model,
      url,
      model,
      local,
      apiFlavor,
      order,
      capabilities: opts.capabilities
        ? parseCapabilityFlags(opts.capabilities)
        : (prev?.capabilities ?? emptyCapabilityFlags()),
      detectedCapabilities:
        prev?.detectedCapabilities ?? emptyCapabilityFlags(),
    };
    const runner = opts.runner ?? prev?.runner;
    if (runner) candidate.runner = runner;
    const apiKeyRef = opts.keyRef ?? prev?.apiKeyRef;
    if (apiKeyRef) candidate.apiKeyRef = apiKeyRef;
    // Clearing agent fields when re-saving as HTTP keeps the row coherent.
    // (transport/agentHarness omitted = HTTP default.)

    const probe = await probeModelCapabilities(candidate, {
      embeddingDimProbe: true,
    });
    const validation = validateModelSave(candidate, probe);
    if (!validation.ok || !validation.entry) {
      jsonError(validation.error ?? "Model could not be saved.");
    }

    const next = [...models];
    if (existingIndex >= 0) next[existingIndex] = validation.entry;
    else next.push(validation.entry);
    await writeRegistry(next);

    jsonOut({
      ok: true,
      model: modelRow(validation.entry),
      probe: { reachable: probe.reachable, detected: probe.detected },
    });
  });

bridgeCommand
  .command("model-reprobe")
  .description("Re-run capability detection for an entry; may widen (JSON)")
  .requiredOption("--id <id>", "Registry entry id")
  .action(async (opts) => {
    const models = await readRegistry();
    const index = models.findIndex((m) => m.id === opts.id);
    if (index < 0) jsonError(`No such model: ${opts.id}`);
    const entry = models[index];

    // Agent transport: probe the harness CLI, not an HTTP endpoint.
    if (entry.transport === "agent") {
      if (!entry.agentHarness) {
        jsonError("Agent model is missing agentHarness.");
      }
      const { getAgentAdapter } = await import("../agent-llm/adapter.js");
      const adapter = getAgentAdapter(entry.agentHarness);
      if (!adapter) {
        jsonError(`No agent-text adapter for harness "${entry.agentHarness}".`);
      }
      const probe = await adapter.probe();
      const modalities = adapter.modalities ?? { text: true };
      const detected = emptyCapabilityFlags();
      detected.text = probe.available && modalities.text !== false;
      detected.image = probe.available && modalities.image === true;
      // Preserve user intent; detection alone gates runtime selection.
      const capabilities = emptyCapabilityFlags();
      capabilities.text = entry.capabilities.text === true;
      capabilities.image =
        entry.capabilities.image === true && modalities.image === true;
      const updated: ModelEntry = {
        ...entry,
        capabilities,
        detectedCapabilities: detected,
        probedAt: new Date().toISOString(),
      };
      const next = [...models];
      next[index] = updated;
      await writeRegistry(next);
      jsonOut({
        ok: true,
        model: modelRow(updated),
        probe: {
          reachable: probe.available,
          detected,
          detail: probe.detail,
        },
      });
      return;
    }

    const probe = await probeModelCapabilities(entry, {
      embeddingDimProbe: true,
    });
    const validation = validateModelSave(entry, probe);
    if (!validation.ok || !validation.entry) {
      jsonError(validation.error ?? "Re-probe failed.");
    }

    const next = [...models];
    next[index] = validation.entry;
    await writeRegistry(next);
    jsonOut({
      ok: true,
      model: modelRow(validation.entry),
      probe: { reachable: probe.reachable, detected: probe.detected },
    });
  });

bridgeCommand
  .command("model-remove")
  .description("Remove a registry entry (JSON)")
  .requiredOption("--id <id>", "Registry entry id")
  .action(async (opts) => {
    const models = await readRegistry();
    const next = models.filter((m) => m.id !== opts.id);
    if (next.length === models.length) jsonError(`No such model: ${opts.id}`);
    // Keep order contiguous after removal.
    next
      .sort((a, b) => a.order - b.order)
      .forEach((m, i) => {
        m.order = i;
      });
    await writeRegistry(next);
    jsonOut({ ok: true, id: opts.id, models: next.map(modelRow) });
  });

bridgeCommand
  .command("model-reorder")
  .description("Set registry order from an ordered id list (JSON)")
  .requiredOption("--ids <json>", "JSON array of entry ids in desired order")
  .action(async (opts) => {
    let ids: string[];
    try {
      ids = JSON.parse(opts.ids);
    } catch {
      jsonError("Invalid --ids JSON");
      return;
    }
    if (!Array.isArray(ids)) jsonError("--ids must be a JSON array");
    const models = await readRegistry();
    const rank = new Map(ids.map((id, i) => [id, i]));
    // Ids not listed keep their relative order after the listed ones.
    const next = [...models].sort((a, b) => {
      const ra = rank.get(a.id) ?? ids.length + a.order;
      const rb = rank.get(b.id) ?? ids.length + b.order;
      return ra - rb;
    });
    next.forEach((m, i) => {
      m.order = i;
    });
    await writeRegistry(next);
    jsonOut({ ok: true, models: next.map(modelRow) });
  });

bridgeCommand
  .command("model-set-capabilities")
  .description(
    "Set user-enabled capabilities within the detected ceiling (JSON)",
  )
  .requiredOption("--id <id>", "Registry entry id")
  .requiredOption(
    "--capabilities <json>",
    "JSON object of desired capabilities",
  )
  .action(async (opts) => {
    const models = await readRegistry();
    const index = models.findIndex((m) => m.id === opts.id);
    if (index < 0) jsonError(`No such model: ${opts.id}`);
    const requested = parseCapabilityFlags(opts.capabilities);
    // Enforce the ceiling: a capability can only be enabled if it was detected.
    const detected = models[index].detectedCapabilities;
    const capabilities = emptyCapabilityFlags();
    for (const key of Object.keys(capabilities) as ModelCapability[]) {
      capabilities[key] = requested[key] && detected[key];
    }
    const next = [...models];
    next[index] = { ...models[index], capabilities };
    await writeRegistry(next);
    jsonOut({ ok: true, model: modelRow(next[index]) });
  });

bridgeCommand
  .command("cloud-model-hint")
  .description("Suggest a cloud model for an endpoint URL (JSON)")
  .requiredOption("--url <url>", "Endpoint base URL")
  .action((opts) => {
    jsonOut({ recommendation: getCloudModelRecommendation(opts.url) });
  });

bridgeCommand
  .command("foundry-local-status")
  .description(
    "Inspect Microsoft Foundry Local and its recommended local models (JSON)",
  )
  .action(async () => {
    const profile = getSystemProfile();
    jsonOut({
      ...(await getFoundryLocalStatus()),
      hardware: profile.localAiHardware,
      acceleration: profile.localAiAcceleration,
      accelerated: supportsLocalGeneration(profile.localAiAcceleration),
      // Foundry Local is a Windows product and `installFoundryLocal` refuses
      // anywhere else. The settings UI needs to know that *before* it draws a
      // section, or it offers a Mac an installer that cannot run.
      os: profile.os,
      snapdragonX: profile.hasSnapdragonX,
    });
  });

bridgeCommand
  .command("foundry-local-setup")
  .description(
    "Install/start Foundry Local, prepare its recommended text model, and register it for ZAM (JSON)",
  )
  .requiredOption("--role <role>", "Only: text")
  .action(async (opts) => {
    if (opts.role !== "text") {
      jsonError('Invalid --role. Use "text".');
    }
    await withDb(async (db) => {
      jsonOut(await setupFoundryLocalForZam(db, opts.role as FoundrySetupRole));
    });
  });

bridgeCommand
  .command("local-llm-hints")
  .description("Detect installed local LLM servers and suggest defaults (JSON)")
  .action(async () => {
    const profile = getSystemProfile();
    const foundry = await getFoundryLocalStatus();
    const flmInstalled =
      hasCommand("flm") || existsSync("C:\\Program Files\\flm\\flm.exe");
    const ollamaInstalled = isOllamaInstalled();
    const runners = [
      { id: "flm", label: "FastFlowLM", installed: flmInstalled },
      { id: "ollama", label: "Ollama", installed: ollamaInstalled },
      {
        id: "foundry-local",
        label: "Foundry Local",
        installed: foundry.installed,
      },
    ];

    const accelerated = supportsLocalGeneration(profile.localAiAcceleration);

    let recommended = "ollama";
    if (
      accelerated &&
      foundry.installed &&
      profile.recommendedRunner === "generic"
    ) {
      recommended = "foundry-local";
    } else if (profile.recommendedRunner === "fastflowlm" && flmInstalled) {
      recommended = "flm";
    } else if (profile.recommendedRunner === "ollama" && ollamaInstalled) {
      recommended = "ollama";
    } else if (flmInstalled) {
      recommended = "flm";
    } else if (ollamaInstalled) {
      recommended = "ollama";
    } else if (profile.recommendedRunner === "fastflowlm") {
      recommended = "flm";
    }

    const defaultUrl =
      recommended === "foundry-local"
        ? (foundry.endpoint ?? FOUNDRY_DEFAULT_URL)
        : recommended === "ollama"
          ? "http://localhost:11434/v1"
          : DEFAULT_LLM_URL;
    const defaultModel =
      recommended === "foundry-local"
        ? (foundry.recommendations.text?.model ??
          profile.recommendedModel ??
          DEFAULT_LLM_MODEL)
        : profile.recommendedModel || DEFAULT_LLM_MODEL;

    jsonOut({
      runners,
      recommended,
      defaultUrl,
      defaultModel,
      foundry,
      hardware: profile.localAiHardware,
      acceleration: profile.localAiAcceleration,
      accelerated,
    });
  });

// Settings the Studio UI may write through the generic setter. Secret-bearing
// keys (llm.api_key) and structured provider config (llm.providers/llm.roles)
// must go through their dedicated commands, never this escape hatch.
const UI_WRITABLE_SETTINGS = new Set([
  "llm.enabled",
  // Default on. Disabling it serves the stored question verbatim and skips one
  // model round-trip per card (ADR 2026-06-15) — the setting existed from the
  // start but had no way to reach it short of writing the row by hand.
  "llm.dynamic_questions",
  "llm.vision.enabled",
  "recall.quick_mode",
  "system.locale",
]);

bridgeCommand
  .command("setting-set")
  .description("Set a single allowlisted ZAM setting value (JSON)")
  .requiredOption("--key <key>", "Setting key")
  .requiredOption("--value <value>", "Setting value")
  .action(async (opts) => {
    if (!UI_WRITABLE_SETTINGS.has(opts.key)) {
      jsonError(
        `Setting "${opts.key}" is not writable via setting-set. Allowed: ${[...UI_WRITABLE_SETTINGS].join(", ")}.`,
      );
    }
    await withDb(async (db) => {
      await setSetting(db, opts.key, opts.value);
      jsonOut({ ok: true, key: opts.key, value: opts.value });
    });
  });

// ── zam bridge voice-preference-get / -set ────────────────────────────────

// Voice mode's engine preference is machine-local, not a DB setting
// (ADR 2026-07-31): whether on-device speech is the right choice depends on
// the hardware in front of the learner, so a phone's answer must not be pushed
// onto their desktop through a shared database. That is why these are their own
// commands rather than two more keys in `setting-set`.

bridgeCommand
  .command("voice-preference-get")
  .description("Read this machine's voice-mode engine preference (JSON)")
  .action(() => {
    const stored = getMachineVoicePreference();
    jsonOut({
      preference: isVoiceEnginePreference(stored)
        ? stored
        : DEFAULT_VOICE_ENGINE_PREFERENCE,
      // Tell the caller whether it is looking at a real choice or the default,
      // so Settings can show "not chosen yet" instead of implying consent.
      explicit: isVoiceEnginePreference(stored),
    });
  });

bridgeCommand
  .command("voice-preference-set")
  .description("Set this machine's voice-mode engine preference (JSON)")
  .requiredOption(
    "--preference <preference>",
    `One of: ${VOICE_ENGINE_PREFERENCES.join(", ")}`,
  )
  .action((opts) => {
    if (!isVoiceEnginePreference(opts.preference)) {
      jsonError(
        `Unknown voice preference "${opts.preference}". Allowed: ${VOICE_ENGINE_PREFERENCES.join(", ")}.`,
      );
    }
    setMachineVoicePreference(opts.preference);
    jsonOut({ ok: true, preference: opts.preference });
  });

// ── zam bridge voice-availability / -transcribe / -synthesize ─────────────

bridgeCommand
  .command("voice-availability")
  .description("Report which cloud speech capabilities are configured (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      jsonOut(await getCloudSpeechAvailability(db));
    });
  });

// Audio comes in as a file path, not base64: even a few seconds of speech
// overflows the process argument limit once encoded. The recording is deleted
// as soon as it has been read, whether or not transcription succeeds — a
// spoken answer should not outlive the request that carried it.
bridgeCommand
  .command("voice-transcribe")
  .description("Transcribe a recorded answer via the cloud stt model (JSON)")
  .requiredOption("--audio-file <path>", "Path to the recording")
  .option("--mime <mime>", "MIME type of the recording", "audio/wav")
  .option("--locale <locale>", "BCP-47 locale hint", "de-DE")
  .action(async (opts) => {
    let audioBase64: string;
    try {
      audioBase64 = readFileSync(opts.audioFile).toString("base64");
    } catch (error) {
      jsonError(
        `Could not read the recording at ${opts.audioFile}: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      try {
        rmSync(opts.audioFile, { force: true });
      } catch {
        // Best effort; the OS reclaims the temp directory regardless.
      }
    }
    await withDb(async (db) => {
      jsonOut(
        await transcribeAudio(db, {
          audioBase64,
          mime: opts.mime,
          locale: opts.locale,
        }),
      );
    });
  });

// The reverse asymmetry: the input is short enough for an argument, and the
// audio comes back base64 in stdout, where size is not constrained. The
// WebView plays it from a blob, so no asset-protocol exposure is needed.
bridgeCommand
  .command("voice-synthesize")
  .description("Synthesize speech via the cloud tts model (JSON)")
  .requiredOption("--text <text>", "Text to read aloud")
  .option("--locale <locale>", "BCP-47 locale hint", "de-DE")
  .option("--voice <voice>", "Endpoint-specific voice id")
  .action(async (opts) => {
    await withDb(async (db) => {
      jsonOut(
        await synthesizeSpeech(db, {
          text: opts.text,
          locale: opts.locale,
          voice: opts.voice,
        }),
      );
    });
  });

// ── zam bridge check-vision ────────────────────────────────────────────────

bridgeCommand
  .command("check-vision")
  .description(
    "Check if UI observer vision analysis is enabled and ready (JSON)",
  )
  .action(async () => {
    await withDb(async (db) => {
      jsonOut(await checkVisionReadiness(db));
    });
  });

// ── zam bridge ensure-llm ─────────────────────────────────────────────────

bridgeCommand
  .command("ensure-llm")
  .description(
    "Start the local LLM server if needed and report readiness (JSON)",
  )
  .option(
    "--timeout <ms>",
    "Max time to wait for the server to come online",
    "25000",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const result = await ensureLlmReadyHeadless(db, {
        timeoutMs: Number(opts.timeout),
      });
      jsonOut(result);
    });
  });

// ── zam bridge translate-question ──────────────────────────────────────────

bridgeCommand
  .command("translate-question")
  .description("Translate a question dynamically using the local LLM (JSON)")
  .requiredOption("--question <text>", "Question in English to translate")
  .action(async (opts) => {
    await withDb(async (db) => {
      const isEnabled = (await getSetting(db, "llm.enabled")) === "true";
      if (!isEnabled) {
        jsonOut({
          success: false,
          error: "LLM integration is disabled",
          translation: opts.question,
        });
        return;
      }
      try {
        const translation = await translateQuestionViaLLM(db, opts.question);
        jsonOut({ success: true, translation });
      } catch (err) {
        jsonOut({
          success: false,
          error: (err as Error).message,
          translation: opts.question,
        });
      }
    });
  });

// ── zam bridge evaluate-answer ────────────────────────────────────────────

bridgeCommand
  .command("evaluate-answer")
  .description(
    "Evaluate the learner's active-recall answer using the local LLM (JSON)",
  )
  .requiredOption("--slug <slug>", "Token slug")
  .requiredOption("--concept <concept>", "Target concept text")
  .requiredOption("--domain <domain>", "Token domain")
  .requiredOption("--bloom-level <level>", "Bloom taxonomy level")
  .requiredOption("--question <question>", "Question prompt presented")
  .requiredOption("--user-answer <answer>", "User's typed answer")
  .option("--context <context>", "Optional token context details")
  .option("--source-link <link>", "Optional source link")
  .option(
    "--source-content <content>",
    "Pre-resolved source reference content (skips re-fetch when set)",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const isEnabled = (await getSetting(db, "llm.enabled")) === "true";
      if (!isEnabled) {
        jsonOut({
          success: false,
          error: "LLM integration is disabled",
          evaluation: "",
        });
        return;
      }

      let resolvedContextContent: string | null = opts.sourceContent ?? null;
      if (resolvedContextContent == null && opts.sourceLink) {
        try {
          const resolved = await resolveReviewContext(opts.sourceLink);
          resolvedContextContent = resolved?.content ?? null;
        } catch {
          // ignore context resolution errors
        }
      }

      try {
        const result = await evaluateAnswerViaLLM(db, {
          slug: opts.slug,
          concept: opts.concept,
          domain: opts.domain,
          bloomLevel: Number(opts.bloomLevel),
          context: opts.context,
          question: opts.question,
          userAnswer: opts.userAnswer,
          sourceLinkContent: resolvedContextContent,
        });
        jsonOut({
          success: true,
          evaluation: result.text,
          evaluationModel: result.model,
        });
      } catch (err) {
        jsonOut({
          success: false,
          error: (err as Error).message,
          evaluation: "",
        });
      }
    });
  });

// ── zam bridge discuss-review ─────────────────────────────────────────────

/**
 * Parse the `--thread` JSON payload into validated discussion turns. Throws
 * with a caller-friendly message on any shape violation so the command can
 * return it as a JSON error instead of sending garbage to the provider.
 */
function parseDiscussionThread(raw: string | undefined): DiscussionTurn[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid --thread: not valid JSON");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Invalid --thread: expected a JSON array of turns");
  }
  return parsed.map((turn, index) => {
    const candidate = turn as { role?: unknown; content?: unknown };
    if (
      (candidate?.role !== "user" && candidate?.role !== "assistant") ||
      typeof candidate?.content !== "string"
    ) {
      throw new Error(
        `Invalid --thread: turn ${index} must be {"role": "user"|"assistant", "content": string}`,
      );
    }
    return { role: candidate.role, content: candidate.content };
  });
}

bridgeCommand
  .command("discuss-review")
  .description(
    "Answer one turn of the post-reveal follow-up discussion about a card (JSON)",
  )
  .requiredOption("--slug <slug>", "Token slug")
  .requiredOption("--concept <concept>", "Target concept text")
  .requiredOption("--domain <domain>", "Token domain")
  .requiredOption("--bloom-level <level>", "Bloom taxonomy level")
  .requiredOption("--question <question>", "Question prompt presented")
  .requiredOption("--user-answer <answer>", "User's typed answer")
  .requiredOption("--message <text>", "The learner's newest discussion turn")
  .option("--feedback <text>", "AI feedback already shown for this answer")
  .option(
    "--thread <json>",
    'Prior turns, oldest first, as JSON: [{"role":"user"|"assistant","content":"…"},…]',
  )
  .option("--context <context>", "Optional token context details")
  .option("--source-link <link>", "Optional source link")
  .option(
    "--source-content <content>",
    "Pre-resolved source reference content (skips re-fetch when set)",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const isEnabled = (await getSetting(db, "llm.enabled")) === "true";
      if (!isEnabled) {
        jsonOut({
          success: false,
          error: "LLM integration is disabled",
          reply: "",
        });
        return;
      }

      let thread: DiscussionTurn[];
      try {
        thread = parseDiscussionThread(opts.thread);
      } catch (err) {
        jsonOut({
          success: false,
          error: (err as Error).message,
          reply: "",
        });
        return;
      }

      let resolvedContextContent: string | null = opts.sourceContent ?? null;
      if (resolvedContextContent == null && opts.sourceLink) {
        try {
          const resolved = await resolveReviewContext(opts.sourceLink);
          resolvedContextContent = resolved?.content ?? null;
        } catch {
          // ignore context resolution errors
        }
      }

      try {
        const result = await discussReviewViaLLM(db, {
          slug: opts.slug,
          concept: opts.concept,
          domain: opts.domain,
          bloomLevel: Number(opts.bloomLevel),
          context: opts.context,
          question: opts.question,
          userAnswer: opts.userAnswer,
          sourceLinkContent: resolvedContextContent,
          feedback: opts.feedback ?? null,
          thread,
          message: opts.message,
        });
        jsonOut({
          success: true,
          reply: result.text,
          replyModel: result.model,
        });
      } catch (err) {
        jsonOut({
          success: false,
          error: (err as Error).message,
          reply: "",
        });
      }
    });
  });

// ── zam bridge desktop-bootstrap / get-settings ───────────────────────────

bridgeCommand
  .command("desktop-bootstrap")
  .description("Initialize first-run desktop state (JSON)")
  .option("--user <id>", "Preferred user ID when none is configured")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await ensureDefaultUser(db, opts.user);
      const { enabled, url, model, locale } = await getLlmConfig(db);
      const { workspaceDir, activeWorkspaceId, skillLinks } =
        await ensureDesktopWorkspace(db);
      // Make `zam` usable from a terminal on machines that only have the
      // desktop app: link the bundled CLI onto the user's PATH. installCliShim
      // never throws and never shadows an externally installed `zam`.
      const cli = installCliShim();
      const profile = getSystemProfile();
      jsonOut({
        userId,
        locale,
        llm: { enabled, url, model },
        studyWorkload: await getStudyWorkloadSettings(db, userId),
        activeWorkspaceId,
        workspaceDir,
        skillLinks,
        cli,
        // First-run gate (ADR 2026-07-24): the desktop routes to the guided
        // onboarding flow instead of the dashboard while this is false.
        onboardingDone: getOnboardingDone(),
        // Persona page data (Phase 1): the descriptor list keeps the desktop
        // free of persona control-flow — a fifth persona is a kernel row plus
        // copy, not a wizard change. `onboardingPersona` preselects the card
        // on re-entry ("Run setup again") and already carries the "private"
        // default when nothing was chosen.
        onboardingPersona: getOnboardingPersona(),
        onboardingPersonas: PERSONA_DESCRIPTORS,
        // Model page data (Phase 2): cloud provider descriptors plus the
        // hardware hint that decides whether the local card carries the
        // "recommended for your hardware" line (copy only — never
        // auto-selected, ADR 2026-07-24 §5).
        cloudProviders: CLOUD_PROVIDERS,
        localAiCapable: profile.hasRyzenNPU || profile.hasAppleSilicon,
        // Embedding enhancement state (Phase 3): drives the model page's
        // semantic-search block and keeps its copy honest about what a click
        // will actually do (pull only vs. install-Ollama-first).
        embedding: await getLocalEmbeddingStatus(db),
        // Agent page offers (Phase 4): the descriptor table behind the
        // no-harness branch. Harness *detection* is deliberately not here —
        // the page probes it live via agent-harness-status when it opens.
        agentOffers: AGENT_OFFERS,
        // Workspace page state (Phase 6): the active workspace's fresh-setup
        // structure, so the page can offer create/repair honestly.
        workspaceStructure: inspectWorkspaceStructure(workspaceDir),
      });
    });
  });

// ── zam bridge onboarding-complete ───────────────────────────────────────────

bridgeCommand
  .command("onboarding-complete")
  .description(
    "Mark this machine's first-run onboarding as complete (JSON). Machine-local; " +
      "never written to the shared database (ADR 2026-07-24).",
  )
  .action(() => {
    try {
      setOnboardingDone(true);
      jsonOut({ onboardingDone: true });
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge onboarding-persona ─────────────────────────────────────────────

bridgeCommand
  .command("onboarding-persona")
  .description(
    "Select the first-run start persona (JSON). Persists it machine-local and " +
      "seeds the matching knowledge context if absent (ADR 2026-07-24 §2).",
  )
  .argument("<persona>", "persona id: school | study | work | private")
  .option(
    "--context-label <label>",
    "localized human label for a newly seeded knowledge context",
  )
  .action(async (persona: string, opts: { contextLabel?: string }) => {
    if (!isPersonaId(persona)) {
      jsonError(
        `Unknown persona: ${persona}. Use school, study, work or private.`,
      );
    }
    setOnboardingPersona(persona);
    // The context seed is the persona's only data-model side effect. The
    // persona itself is machine-local state, so an unreachable database
    // degrades to "persisted, not seeded" instead of failing the selection
    // (issue #162 precedent); re-running onboarding seeds it later.
    await withOptionalDb(async (db) => {
      if (!db) {
        jsonOut({ persona, knowledgeContext: null, seeded: false });
        return;
      }
      const result = await seedPersonaKnowledgeContext(
        db,
        persona,
        opts.contextLabel,
      );
      jsonOut({
        persona,
        knowledgeContext: result.context.name,
        seeded: result.created,
      });
    });
  });

// ── zam bridge cloud-connect ──────────────────────────────────────────────────

bridgeCommand
  .command("cloud-connect")
  .description(
    "Connect a cloud LLM provider (JSON): verify the key, store it, register " +
      "the default model in the capability registry, enable the text LLM " +
      "(ADR 2026-07-24 §5).",
  )
  .requiredOption("--key <key>", "API key created by the user on the provider")
  .option("--provider <id>", "Cloud provider id", "openrouter")
  .action(async (opts: { key: string; provider: string }) => {
    await withDb(async (db) => {
      const result = await connectCloudProvider(db, opts.provider, opts.key);
      if (!result.ok || !result.entry) {
        jsonError(result.error ?? "Cloud connect failed.");
      }
      jsonOut({
        ok: true,
        created: result.created === true,
        model: modelRow(result.entry),
      });
    });
  });

// ── zam bridge goal-decompose / goal-create ──────────────────────────────────

bridgeCommand
  .command("goal-decompose")
  .description(
    "Propose the next decomposition level of a learning goal via the text " +
      "LLM (JSON). One level at a time, user-confirmed — never bulk " +
      "generation (ADR 2026-07-24 §3).",
  )
  .requiredOption("--title <title>", "Goal title")
  .option("--description <text>", "Why the goal matters to the learner", "")
  .option(
    "--path <json>",
    "JSON array of already-confirmed sub-topic labels (drill-down path)",
    "[]",
  )
  .action(
    async (opts: { title: string; description: string; path: string }) => {
      await withDb(async (db) => {
        let path: string[] = [];
        try {
          const parsed = JSON.parse(opts.path);
          if (Array.isArray(parsed)) {
            path = parsed.filter(
              (item): item is string => typeof item === "string",
            );
          }
        } catch {
          jsonError("Invalid --path JSON");
        }
        try {
          const options = await generateGoalDecompositionViaLLM(db, {
            title: opts.title,
            description: opts.description ?? "",
            path,
          });
          jsonOut({
            success: true,
            options: options.map((option) => ({
              id: slugify(option.label) || "topic",
              ...option,
            })),
          });
        } catch (err) {
          jsonOut({ success: false, error: (err as Error).message });
        }
      });
    },
  );

bridgeCommand
  .command("goal-create")
  .description(
    "Create a goal markdown file (Lernziel) in the goals directory, with the " +
      "user-confirmed breakdown recorded in its body (JSON). The file is the " +
      "source_link every imported card cites (ADR 2026-07-24 §3).",
  )
  .requiredOption("--title <title>", "Goal title")
  .option("--description <text>", "Why the goal matters to the learner", "")
  .option(
    "--path <json>",
    "JSON array of confirmed drill-down labels above the outline",
    "[]",
  )
  .option(
    "--outline <json>",
    "JSON array of {label, description} — the confirmed breakdown",
    "[]",
  )
  .action(
    async (opts: {
      title: string;
      description: string;
      path: string;
      outline: string;
    }) => {
      await withDb(async (db) => {
        let path: string[] = [];
        let outline: Array<{ label: string; description: string }> = [];
        try {
          const parsedPath = JSON.parse(opts.path);
          if (Array.isArray(parsedPath)) {
            path = parsedPath.filter(
              (item): item is string => typeof item === "string",
            );
          }
          const parsedOutline = JSON.parse(opts.outline);
          if (Array.isArray(parsedOutline)) {
            outline = parsedOutline.filter(
              (item): item is { label: string; description: string } =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof item.label === "string" &&
                typeof item.description === "string",
            );
          }
        } catch {
          jsonError("Invalid --path or --outline JSON");
        }

        // Same resolution as `zam goal`: the explicit setting wins, else the
        // active workspace's goals/ directory (regenerable infrastructure).
        const configuredDir = await getSetting(db, "personal.goals_dir");
        const activeWorkspace = await ensureActiveWorkspace(db);
        const goalsDir = configuredDir
          ? resolve(configuredDir)
          : join(activeWorkspace.path, "goals");
        mkdirSync(goalsDir, { recursive: true });

        const base = slugify(opts.title) || "goal";
        let slug = base;
        for (let n = 2; existsSync(join(goalsDir, `${slug}.md`)); n++) {
          slug = `${base}-${n}`;
        }

        const breakdown =
          outline.length > 0
            ? [
                "",
                "### Breakdown",
                ...(path.length > 0 ? [`Path: ${path.join(" → ")}`, ""] : []),
                ...outline.map(
                  (item) => `- **${item.label}** — ${item.description}`,
                ),
              ].join("\n")
            : "";

        try {
          const goal = createGoal(goalsDir, {
            slug,
            title: opts.title,
            description: `${opts.description ?? ""}${breakdown}`.trim(),
          });
          jsonOut({
            success: true,
            slug: goal.slug,
            title: goal.title,
            filePath: goal.filePath,
          });
        } catch (err) {
          jsonError((err as Error).message);
        }
      });
    },
  );

// ── zam bridge embedding-status / embedding-enable ───────────────────────────

bridgeCommand
  .command("embedding-status")
  .description(
    "Report the local semantic-search enhancement state (JSON): Ollama " +
      "install/server, EmbeddingGemma presence, registry entry, usability " +
      "(ADR 2026-07-24 §5a).",
  )
  .action(async () => {
    await withDb(async (db) => {
      jsonOut(await getLocalEmbeddingStatus(db));
    });
  });

bridgeCommand
  .command("embedding-enable")
  .description(
    "Enable local semantic search (JSON): pull EmbeddingGemma into a running " +
      "Ollama if missing and register it for the embedding role. Never " +
      "installs Ollama itself (ADR 2026-07-24 §5a).",
  )
  .action(async () => {
    await withDb(async (db) => {
      const result = await enableLocalEmbedding(db);
      if (!result.ok) {
        jsonOut({
          ok: false,
          error: result.error,
          needsOllama: result.needsOllama === true,
          status: result.status,
        });
        return;
      }
      jsonOut({
        ok: true,
        pulled: result.pulled === true,
        status: result.status,
      });
    });
  });

bridgeCommand
  .command("get-settings")
  .description("Get active ZAM settings (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const { enabled, url, model, locale } = await getLlmConfig(db);
      jsonOut({
        locale,
        llm: {
          enabled,
          url,
          model,
        },
        recall: {
          quickMode: (await getSetting(db, "recall.quick_mode")) === "true",
          // Absent means on, matching ensureHighQualityQuestion's `!== "false"`.
          dynamicQuestions:
            (await getSetting(db, "llm.dynamic_questions")) !== "false",
        },
      });
    });
  });

function workloadBoolean(value: unknown, label: string): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  jsonError(`${label} must be true or false`);
}

bridgeCommand
  .command("study-workload-get")
  .description("Get persistent review workload controls for a learner (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      jsonOut({
        success: true,
        userId,
        settings: await getStudyWorkloadSettings(db, userId),
      });
    });
  });

bridgeCommand
  .command("study-workload-set")
  .description("Save persistent review workload controls for a learner (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--preset <name>", "balanced | exam | problems | custom")
  .option("--max-new <n>", "Maximum new cards per session")
  .option("--max-reviews <n>", "Maximum total cards per session")
  .option("--bury-new <true|false>", "Bury new siblings until tomorrow")
  .option("--bury-review <true|false>", "Bury review siblings until tomorrow")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      if (opts.preset !== undefined && !isStudyWorkloadPreset(opts.preset)) {
        jsonError("preset must be balanced, exam, problems, or custom");
      }
      const maxNew =
        opts.maxNew === undefined ? undefined : Number(opts.maxNew);
      const maxReviews =
        opts.maxReviews === undefined ? undefined : Number(opts.maxReviews);
      const settings = await setStudyWorkloadSettings(db, userId, {
        preset: opts.preset,
        maxNew,
        maxReviews,
        buryNewSiblings: workloadBoolean(opts.buryNew, "bury-new"),
        buryReviewSiblings: workloadBoolean(opts.buryReview, "bury-review"),
      });
      jsonOut({ success: true, userId, settings });
    });
  });

bridgeCommand
  .command("study-unbury")
  .description("Make all sibling-buried cards visible for a learner (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      jsonOut({
        success: true,
        userId,
        unburied: await unburySiblingCards(db, userId),
      });
    });
  });

// ── zam bridge install-repair ────────────────────────────────────────────────

bridgeCommand
  .command("install-repair")
  .description(
    "Verify and repair this machine's ZAM installation: CLI shim + PATH, " +
      "workspace skill links, agent configs and companion extensions (JSON)",
  )
  .option(
    "--if-version-changed",
    "Only run when the app version differs from the last repaired one; " +
      "reports skipped:true otherwise",
  )
  .action((opts: { ifVersionChanged?: boolean }) => {
    try {
      jsonOut(
        performInstallRepair({
          ifVersionChanged: Boolean(opts.ifVersionChanged),
        }),
      );
    } catch (err) {
      jsonError((err as Error).message);
    }
  });

// ── zam bridge agent-harness-status / agent-connect ─────────────────────────

bridgeCommand
  .command("agent-harness-status")
  .description(
    "Detect installed agent harnesses and their ZAM MCP configuration state (JSON)",
  )
  .action(() => {
    const report = inspectConnectHarnesses();
    // Hermes is the one harness with a runtime component (plan Phase 5): its
    // messaging gateway must be running for chat-surface reviews. Probe it
    // only when Hermes is installed, and surface the honest state on the row.
    const hermesRow = report.harnesses.find((h) => h.harness === "hermes");
    let hermesGateway: ReturnType<typeof inspectHermesGateway> | undefined;
    if (hermesRow?.installed) {
      hermesGateway = inspectHermesGateway();
      hermesRow.note = hermesRow.note ?? hermesGateway.detail;
    }
    jsonOut({
      success: true,
      zamOnPath: report.zamOnPath,
      connectAutoDone: getAgentConnectAutoDone(),
      harnesses: report.harnesses,
      ...(hermesGateway ? { hermesGateway } : {}),
    });
  });

bridgeCommand
  .command("agent-connect")
  .description(
    "Run the idempotent agent-connect flow for one or all detected harnesses (JSON)",
  )
  .option("--harness <id>", "Explicit harness id (default: all detected)")
  .option(
    "--auto-once",
    "First-run mode: skip when the auto-connect marker is already set; " +
      "set the marker after a run that detected at least one harness",
  )
  .action(async (opts: { harness?: string; autoOnce?: boolean }) => {
    if (opts.harness && !isConnectHarnessId(opts.harness)) {
      jsonOut({
        success: false,
        error: `Unsupported harness: ${opts.harness}`,
      });
      return;
    }
    const harness = opts.harness as ConnectHarnessId | undefined;

    // Strip the raw config `content` from the wire payload — the App renders
    // status, not file bodies (use `zam agent connect --print` for those).
    const run = () => {
      const report = performAgentConnect({ harness });
      return {
        success: report.success,
        detected: report.detected,
        zamOnPath: report.zamOnPath,
        results: report.results.map(({ content: _content, ...rest }) => rest),
        skills: report.skills,
      };
    };

    if (opts.autoOnce) {
      // Machine-local marker (~/.zam/config.json), NOT a database setting:
      // the database may be shared across machines via Turso, while harness
      // installs and their configs are strictly per-machine.
      if (getAgentConnectAutoDone()) {
        jsonOut({ success: true, skipped: true });
        return;
      }
      const payload = run();
      if (payload.detected.length > 0) {
        setAgentConnectAutoDone(true);
      }
      jsonOut(payload);
      return;
    }

    jsonOut(run());
  });

// ── zam bridge database-status / database-select-user ───────────────────────

export interface DatabaseUserSummary {
  id: string;
  cardCount: number;
}

/**
 * Learning profiles known to the current database, grouped by user with
 * their card count. Reused by the `zam_companion_context` MCP tool
 * (0.11.0 Phase 2) so the Companion learner picker never grows a second,
 * parallel query alongside `database-status`.
 */
export async function readDatabaseUserSummaries(
  db: Database,
): Promise<DatabaseUserSummary[]> {
  return (await db
    .prepare(
      `SELECT user_id AS id, COUNT(*) AS cardCount
       FROM cards
       GROUP BY user_id
       ORDER BY user_id`,
    )
    .all()) as DatabaseUserSummary[];
}

bridgeCommand
  .command("database-status")
  .description("Show the active database target and learning profiles (JSON)")
  .action(async () => {
    // Restore ≤30-day session and resolve vault refs before opening the DB.
    await resolveCredentials();
    if (tursoVaultAccessPending()) {
      const stored = loadStoredCredentials();
      jsonOut({
        success: false,
        connected: false,
        bitwardenRequired: true,
        target: {
          kind: "local",
          location: stored.turso?.url ?? "vault-locked",
        },
        tursoUrl: stored.turso?.url ?? null,
        userId: null,
        cardCount: 0,
        users: [],
        error:
          "BITWARDEN_REQUIRED: Server database token is in Bitwarden. Unlock once to continue (session lasts up to 30 days).",
      });
      return;
    }
    const target = getDatabaseTargetInfo();
    await withDb(async (db) => {
      const userId = (await getSetting(db, "user.id")) ?? null;
      const users = await readDatabaseUserSummaries(db);
      jsonOut({
        success: true,
        connected: true,
        bitwardenRequired: false,
        target,
        userId,
        cardCount: users.find((user) => user.id === userId)?.cardCount ?? 0,
        users,
      });
    });
  });

/**
 * Attach a Turso/sqld server database (issue #218 wizard / Studio form).
 * Stores credentials machine-locally and verifies connectivity before success.
 * Mobile pairing is only available once this (or CLI connector setup) succeeds.
 */
bridgeCommand
  .command("server-db-connect")
  .description(
    "Store and verify Turso/sqld credentials for the server database (JSON)",
  )
  .requiredOption("--url <url>", "libsql/https database URL")
  .option("--token <token>", "Auth token (literal)")
  .option(
    "--token-from <secret-ref>",
    "Vault reference instead of --token (e.g. bw://zam-turso/token)",
  )
  .option("--mode <mode>", "Access mode: remote | native")
  .action(async (opts) => {
    const url = String(opts.url ?? "").trim();
    const tokenLiteral = String(opts.token ?? "").trim();
    const tokenFrom = String(opts.tokenFrom ?? "").trim();
    if (tokenLiteral && tokenFrom) {
      jsonError("Use either --token or --token-from, not both.");
    }
    if (!url || (!tokenLiteral && !tokenFrom)) {
      jsonError("Provide --url and either --token or --token-from.");
    }
    try {
      // eslint-disable-next-line no-new -- validate absolute URL
      new URL(url.replace(/^libsql:/i, "https:"));
    } catch {
      jsonError("url must be an absolute libsql or https URL");
    }

    let mode: "remote" | "native" | undefined;
    if (opts.mode !== undefined) {
      const raw = String(opts.mode).trim().toLowerCase();
      if (raw !== "remote" && raw !== "native") {
        jsonError("mode must be remote or native");
      }
      mode = raw;
    }

    if (tokenFrom) {
      try {
        setTursoCredentials(url, secretRefFromUri(tokenFrom), undefined, mode);
      } catch (err) {
        jsonError(err instanceof Error ? err.message : String(err));
      }
      await resolveCredentials();
      if (!getTursoCredentials()) {
        jsonError(
          `Could not resolve token reference "${tokenFrom}". Unlock Bitwarden in Settings or fix the vault item.`,
        );
      }
    } else {
      setTursoCredentials(url, tokenLiteral, undefined, mode);
      await resolveCredentials();
      // If Bitwarden auto-sync is on, push the new token without re-asking.
      await maybeAutoSyncSecrets();
    }

    let db: Awaited<ReturnType<typeof openDatabaseWithSync>> | undefined;
    try {
      db = await openDatabaseWithSync({ initialize: true });
      await db.prepare("SELECT 1").get();
      const target = getDatabaseTargetInfo();
      if (target.kind === "local") {
        jsonError(
          "Credentials were stored but the active target is still local. Check URL/token.",
        );
      }
      const userId = (await getSetting(db, "user.id")) ?? null;
      const users = await readDatabaseUserSummaries(db);
      jsonOut({
        success: true,
        connected: true,
        target,
        userId,
        cardCount: users.find((user) => user.id === userId)?.cardCount ?? 0,
        users,
      });
    } catch (error) {
      jsonError(
        error instanceof Error
          ? error.message
          : `Server database connection failed: ${String(error)}`,
      );
    } finally {
      await db?.close().catch(() => undefined);
    }
  });

// ── Vault secrets (Bitwarden) for Studio — ADR 2026-07-30b ─────────────────

bridgeCommand
  .command("secrets-feature")
  .description(
    "Read or set the alpha Bitwarden vault opt-in for this machine (JSON)",
  )
  .option("--enable", "Switch the vault feature on")
  .option("--disable", "Switch it off (also stops auto-sync)")
  .action((opts) => {
    // Deliberately cheap: no `bw` call. Studio asks this on every Settings
    // paint to decide whether to show the feature at all, so it must not cost
    // a process spawn for the learners who never switch it on.
    if (opts.enable && opts.disable) {
      jsonError("Pass either --enable or --disable, not both.");
      return;
    }
    if (opts.enable || opts.disable) {
      setBitwardenVaultEnabled(Boolean(opts.enable));
    }
    jsonOut({ success: true, enabled: isBitwardenVaultEnabled() });
  });

bridgeCommand
  .command("secrets-status")
  .description("Bitwarden CLI status for Studio vault setup (JSON, no secrets)")
  .action(async () => {
    const status = await getBitwardenCliStatus();
    jsonOut({ success: true, ...status });
  });

bridgeCommand
  .command("secrets-configure-region")
  .description("Point Bitwarden CLI at EU or US cloud (JSON)")
  .requiredOption("--region <region>", "eu | us")
  .action(async (opts) => {
    const region = String(opts.region ?? "")
      .trim()
      .toLowerCase();
    if (region !== "eu" && region !== "us") {
      jsonError("region must be eu or us");
    }
    try {
      await configureBitwardenServer(region);
    } catch (err) {
      jsonError(
        err instanceof Error
          ? err.message
          : "Could not configure Bitwarden server region.",
      );
    }
    const status = await getBitwardenCliStatus();
    jsonOut({ success: true, ...status });
  });

bridgeCommand
  .command("secrets-require")
  .description(
    "Whether vault access is required and if Bitwarden is ready (JSON)",
  )
  .action(async () => {
    const needed = credentialsNeedVaultAccess();
    if (!needed) {
      // Nothing is stored as a `{$secret}` reference, so nothing can be
      // waiting on a vault. Answer without spawning `bw`: this runs on every
      // dashboard load, and a learner who never switched the alpha vault on
      // must never pay for it — let alone see a master-password prompt.
      jsonOut({
        success: true,
        needed: false,
        ready: true,
        kind: "unlocked",
        serverUrl: null,
        userEmail: null,
        region: "unknown",
        sessionInProcess: false,
        autoSync: false,
        lastSyncAt: null,
        pendingLiteralCount: 0,
        message: "",
      });
      return;
    }
    // References exist, so they must resolve even if the feature switch was
    // turned off afterwards — otherwise unticking a checkbox would lock the
    // learner out of their own database.
    // getBitwardenCliStatus restores a still-valid 30-day session into env.
    const status = await getBitwardenCliStatus();
    if (status.kind === "unlocked" && process.env.BW_SESSION?.trim()) {
      await resolveCredentials();
    }
    const ready = status.kind === "unlocked" && process.env.BW_SESSION?.trim();
    jsonOut({
      success: true,
      needed,
      ready: Boolean(ready),
      ...status,
    });
  });

bridgeCommand
  .command("secrets-login")
  .description(
    "Log in to Bitwarden CLI for this bridge process (JSON; password not stored)",
  )
  .requiredOption("--email <email>", "Bitwarden account email")
  .requiredOption("--password <password>", "Master password (not persisted)")
  .option("--code <code>", "Authenticator TOTP when 2FA is required")
  .action(async (opts) => {
    const result = await loginBitwardenForProcess({
      email: String(opts.email ?? ""),
      password: String(opts.password ?? ""),
      code: opts.code ? String(opts.code) : undefined,
    });
    if (!result.ok) {
      // Do not process.exit — desktop uses a long-lived bridge serve process.
      jsonOut({
        success: false,
        needs2fa: result.needs2fa === true,
        error: result.message,
      });
      return;
    }
    await resolveCredentials();
    await maybeAutoSyncSecrets();
    const status = await getBitwardenCliStatus();
    jsonOut({ success: true, loggedIn: true, ...status });
  });

bridgeCommand
  .command("secrets-unlock")
  .description(
    "Unlock Bitwarden for this bridge process only (JSON; password not stored)",
  )
  .requiredOption("--password <password>", "Master password (not persisted)")
  .action(async (opts) => {
    const result = await unlockBitwardenForProcess(String(opts.password ?? ""));
    // Clear from argv residual as much as possible — process title still may
    // show briefly; Desktop should prefer env-based handoff later if needed.
    if (!result.ok) jsonError(result.message);
    await resolveCredentials();
    // Resume auto-sync if the learner already connected Bitwarden earlier.
    await maybeAutoSyncSecrets();
    const status = await getBitwardenCliStatus();
    jsonOut({ success: true, unlocked: true, ...status });
  });

bridgeCommand
  .command("credentials-check")
  .description(
    "Report configured secrets as literal/reference ok/failed (JSON, no values)",
  )
  .action(async () => {
    await resolveCredentials();
    const entries = checkCredentials();
    jsonOut({
      success: true,
      credentials: entries,
      ok: entries.every((e) => e.ok || e.kind === "missing"),
    });
  });

/**
 * One-button connect: push secrets ZAM already knows (server DB token, any
 * machine-local API keys) into Bitwarden and enable auto-sync. No re-paste.
 */
bridgeCommand
  .command("secrets-sync")
  .description(
    "Sync known machine-local secrets into Bitwarden and enable auto-sync (JSON)",
  )
  .action(async () => {
    const result = await syncSecretsWithBitwarden();
    if (!result.ok) jsonError(result.message);
    const status = await getBitwardenCliStatus();
    jsonOut({
      success: true,
      ...status,
      autoSync: true,
      entries: result.entries.map((e) => ({
        field: e.field,
        secretRef: e.secretRef,
        itemName: e.itemName,
        seeded: e.seeded,
        skipped: e.skipped,
      })),
    });
  });

/**
 * Offboard: pull vault-backed secrets back into credentials.json as literals
 * and stop using Bitwarden on this machine. Vault items are left in place.
 */
bridgeCommand
  .command("secrets-disconnect")
  .description(
    "Restore vault secrets as local literals and disconnect Bitwarden (JSON)",
  )
  .action(async () => {
    const result = await disconnectBitwardenToLocalSecrets();
    if (!result.ok) jsonError(result.message);
    const status = await getBitwardenCliStatus();
    jsonOut({
      success: true,
      ...status,
      disconnected: true,
      autoSync: false,
      entries: result.entries.map((e) => ({
        field: e.field,
        restored: e.restored,
        skipped: e.skipped,
      })),
    });
  });

// Keep seed helpers for power users / tests (not shown in Studio UI).
bridgeCommand
  .command("secrets-seed-turso")
  .description(
    "Create zam-turso in Bitwarden and store a vault reference (JSON)",
  )
  .requiredOption("--url <url>", "libsql/https database URL")
  .requiredOption("--token <token>", "Auth token (written only to the vault)")
  .option("--mode <mode>", "Access mode: remote | native")
  .action(async (opts) => {
    let mode: "remote" | "native" | undefined;
    if (opts.mode !== undefined) {
      const raw = String(opts.mode).trim().toLowerCase();
      if (raw !== "remote" && raw !== "native") {
        jsonError("mode must be remote or native");
      }
      mode = raw;
    }
    const result = await seedTursoIntoBitwarden({
      url: String(opts.url ?? ""),
      token: String(opts.token ?? ""),
      mode,
    });
    if (!result.ok) jsonError(result.message);
    jsonOut({
      success: true,
      secretRef: result.secretRef,
      itemName: result.itemName,
      field: "token",
    });
  });

bridgeCommand
  .command("secrets-seed-provider-key")
  .description(
    "Create a zam-<ref> item in Bitwarden and store a vault reference (JSON)",
  )
  .requiredOption("--ref <ref>", "Provider apiKeyRef name")
  .requiredOption("--key <value>", "API key (written only to the vault)")
  .action(async (opts) => {
    const result = await seedProviderKeyIntoBitwarden({
      ref: String(opts.ref ?? ""),
      apiKey: String(opts.key ?? ""),
    });
    if (!result.ok) jsonError(result.message);
    jsonOut({
      success: true,
      ref: result.ref,
      secretRef: result.secretRef,
      itemName: result.itemName,
      field: "apiKey",
    });
  });

bridgeCommand
  .command("database-select-user")
  .description("Select an existing learning profile for this database (JSON)")
  .requiredOption("--user <id>", "Existing user ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = String(opts.user ?? "").trim();
      const users = await readDatabaseUserSummaries(db);
      const selected = users.find((user) => user.id === userId);
      if (!selected) {
        jsonError(`Learning profile not found: ${userId}`);
        return;
      }
      await setSetting(db, "user.id", userId);
      jsonOut({
        success: true,
        userId,
        cardCount: selected.cardCount,
      });
    });
  });

bridgeCommand
  .command("mobile-pairing-payload")
  .description(
    "Create a versioned mobile pairing payload from machine-local secrets (JSON)",
  )
  .requiredOption("--user <id>", "Learner ID to bind to the mobile device")
  .option("--create-user", "Create and select a learner without cards")
  .action(async (opts) => {
    const target = getDatabaseTargetInfo();
    if (target.kind === "local") {
      jsonError("Mobile pairing requires a configured server database.");
    }
    const credentials = getTursoCredentials();
    if (!credentials) {
      jsonError("Mobile pairing requires complete Turso/sqld credentials.");
    }

    await withDb(async (db) => {
      const userId = String(opts.user ?? "").trim();
      const hasControlCharacters = [...userId].some((character) => {
        const code = character.charCodeAt(0);
        return code <= 31 || code === 127;
      });
      if (!userId || userId.length > 128 || hasControlCharacters) {
        jsonError(
          "Learner ID must be 1-128 characters without control characters.",
        );
      }

      const users = await readDatabaseUserSummaries(db);
      const activeUserId = await getSetting(db, "user.id");
      const exists =
        activeUserId === userId || users.some((user) => user.id === userId);
      if (!exists && opts.createUser !== true) {
        jsonError(
          `Learning profile not found: ${userId}. Use --create-user to create it.`,
        );
      }
      if (!exists) {
        await setSetting(db, "user.id", userId);
      }

      const payload = createMobilePairingPayload({
        databaseUrl: credentials.url,
        databaseToken: credentials.token,
        userId,
        locale: (await getSetting(db, "system.locale")) ?? undefined,
      });
      // What the phone will find once it is online. Reported from the shared
      // registry rather than from the payload, because the payload no longer
      // carries models (ADR 2026-07-23) — the honest question is now "is
      // anything set up for this learner", not "did it fit in the code".
      const cloudModels = (await loadModelRegistry(db)).filter(
        (entry) => !isMachineLocalEntry(entry),
      );
      const [stt, tts] = await Promise.all([
        resolveSpeechEndpoint(db, "stt"),
        resolveSpeechEndpoint(db, "tts"),
      ]);
      jsonOut({
        success: true,
        payload: serializeZamPairPayload(payload),
        userId,
        cardCount: users.find((user) => user.id === userId)?.cardCount ?? 0,
        createdUser: !exists,
        hasLlm: cloudModels.some((entry) => entry.capabilities.text === true),
        hasSpeech: {
          stt: stt !== null && !stt.local,
          tts: tts !== null && !tts.local,
        },
      });
    });
  });

// ── zam bridge list-tokens (for graph pickers / entry points) ───────────────

bridgeCommand
  .command("list-tokens")
  .description(
    "List tokens (optionally enriched with user card state for viz) (JSON)",
  )
  .option(
    "--user <id>",
    "User ID (default: whoami) — when provided, includes personal card info",
  )
  .option("--domain <domain>", "Filter by exact domain")
  .option(
    "--domain-prefix <prefix>",
    "Filter by domain prefix (e.g. company-team) — uses / separator for hierarchy",
  )
  .option("--knowledge-context <context>", "Filter by knowledge context")
  .option(
    "--source-link-base <base>",
    "Filter by source-link base (exact or '<base>#<anchor>', as written by OKF imports); repeatable",
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = opts.user
        ? await resolveUser(opts, db, { json: true })
        : undefined;
      const listOpts: ListTokensOptions = {};
      if (opts.domain) listOpts.domain = opts.domain;
      if (opts.domainPrefix) listOpts.domainPrefix = opts.domainPrefix;
      if (opts.knowledgeContext)
        listOpts.knowledgeContext = opts.knowledgeContext;
      if (opts.sourceLinkBase.length)
        listOpts.sourceLinkBases = opts.sourceLinkBase;

      const tokens = await listTokens(
        db,
        Object.keys(listOpts).length ? listOpts : undefined,
      );

      const cardMap = new Map<
        string,
        {
          token_id: string;
          state: string;
          reps: number;
          stability: number;
          difficulty: number;
          blocked: number;
          due_at: string;
          last_review_at: string | null;
        }
      >();
      if (userId && tokens.length > 0) {
        const ids = tokens.map((t) => t.id);
        const placeholders = ids.map(() => "?").join(",");
        const cards = (await db
          .prepare(
            `SELECT token_id, state, reps, stability, difficulty, blocked, due_at, last_review_at
             FROM cards WHERE token_id IN (${placeholders}) AND user_id = ?`,
          )
          .all(...ids, userId)) as Array<{
          token_id: string;
          state: string;
          reps: number;
          stability: number;
          difficulty: number;
          blocked: number;
          due_at: string;
          last_review_at: string | null;
        }>;
        for (const c of cards) cardMap.set(c.token_id, c);
      }

      // Fetch knowledge context assignments for all listed tokens
      const contextMap = new Map<
        string,
        Array<{ name: string; label: string | null; language: string | null }>
      >();
      if (tokens.length > 0) {
        const ids = tokens.map((t) => t.id);
        const placeholders = ids.map(() => "?").join(",");
        const mappings = (await db
          .prepare(
            `SELECT tc.token_id, c.name, c.label, c.language
             FROM token_contexts tc
             INNER JOIN contexts c ON c.id = tc.context_id
             WHERE tc.token_id IN (${placeholders})`,
          )
          .all(...ids)) as Array<{
          token_id: string;
          name: string;
          label: string | null;
          language: string | null;
        }>;
        for (const m of mappings) {
          const list = contextMap.get(m.token_id) ?? [];
          list.push({ name: m.name, label: m.label, language: m.language });
          contextMap.set(m.token_id, list);
        }
      }

      const out = tokens.map((t) => {
        const c = cardMap.get(t.id);
        return {
          id: t.id,
          slug: t.slug,
          title: t.title,
          display_title: getDisplayTitle(t),
          concept: t.concept,
          domain: t.domain,
          bloomLevel: t.bloom_level,
          knowledgeContexts: contextMap.get(t.id) ?? [],
          card: c
            ? {
                state: c.state,
                reps: c.reps,
                stability: c.stability,
                difficulty: c.difficulty,
                blocked: c.blocked === 1,
                dueAt: c.due_at,
                lastReviewAt: c.last_review_at ?? null,
              }
            : null,
        };
      });

      jsonOut({ tokens: out });
    });
  });

// ── zam bridge get-neighborhood (core for 3D focus + direct prereqs/dependents) ─

bridgeCommand
  .command("get-neighborhood")
  .description(
    "Get direct prerequisite neighborhood around a token (for 3D graph viz) (JSON)",
  )
  .requiredOption("--focus <slug>", "Token slug to center the neighborhood on")
  .option(
    "--user <id>",
    "User ID (default: whoami) for personal card state in the result",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });

      const token = await getTokenBySlug(db, opts.focus);
      if (!token) {
        jsonError(`Token not found: ${opts.focus}`);
      }

      const nb = await getTokenNeighborhood(db, token!.id, userId);

      const allTokens = [nb.center, ...nb.prerequisites, ...nb.dependents];
      const contextMap = new Map<
        string,
        Array<{ name: string; label: string | null; language: string | null }>
      >();
      if (allTokens.length > 0) {
        const ids = allTokens.map((t) => t.id);
        const placeholders = ids.map(() => "?").join(",");
        const mappings = (await db
          .prepare(
            `SELECT tc.token_id, c.name, c.label, c.language
             FROM token_contexts tc
             INNER JOIN contexts c ON c.id = tc.context_id
             WHERE tc.token_id IN (${placeholders})`,
          )
          .all(...ids)) as Array<{
          token_id: string;
          name: string;
          label: string | null;
          language: string | null;
        }>;
        for (const m of mappings) {
          const list = contextMap.get(m.token_id) ?? [];
          list.push({ name: m.name, label: m.label, language: m.language });
          contextMap.set(m.token_id, list);
        }
      }

      const mapToken = (nt: NeighborhoodToken) => ({
        id: nt.id,
        slug: nt.slug,
        title: nt.title,
        display_title: getDisplayTitle(nt),
        concept: nt.concept,
        domain: nt.domain,
        bloomLevel: nt.bloom_level,
        knowledgeContexts: contextMap.get(nt.id) ?? [],
        card: nt.card
          ? {
              state: nt.card.state,
              reps: nt.card.reps,
              stability: nt.card.stability,
              difficulty: nt.card.difficulty,
              blocked: nt.card.blocked,
              dueAt: nt.card.due_at,
              lastReviewAt: nt.card.last_review_at,
            }
          : null,
      });

      jsonOut({
        focus: opts.focus,
        center: mapToken(nb.center),
        prerequisites: nb.prerequisites.map(mapToken),
        dependents: nb.dependents.map(mapToken),
      });
    });
  });

// ── zam bridge personal-card-list ──────────────────────────────────────────

bridgeCommand
  .command("personal-card-list")
  .description("List and search personal learning cards (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--query <query>", "Text search query")
  .option("--domain <domain>", "Filter by category/domain")
  .option("--knowledge-context <context>", "Filter by knowledge context")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const cards = await listPersonalCards(db, userId, {
        query: opts.query,
        domain: opts.domain,
        knowledgeContext: opts.knowledgeContext,
      });
      const contextMap = new Map<
        string,
        Array<{ name: string; label: string | null; language: string | null }>
      >();
      if (cards.length > 0) {
        const tokenIds = cards.map((card) => card.tokenId);
        const placeholders = tokenIds.map(() => "?").join(",");
        const mappings = (await db
          .prepare(
            `SELECT tc.token_id, c.name, c.label, c.language
             FROM token_contexts tc
             INNER JOIN contexts c ON c.id = tc.context_id
             WHERE tc.token_id IN (${placeholders})
             ORDER BY c.name`,
          )
          .all(...tokenIds)) as Array<{
          token_id: string;
          name: string;
          label: string | null;
          language: string | null;
        }>;
        for (const mapping of mappings) {
          const contexts = contextMap.get(mapping.token_id) ?? [];
          contexts.push({
            name: mapping.name,
            label: mapping.label,
            language: mapping.language,
          });
          contextMap.set(mapping.token_id, contexts);
        }
      }
      jsonOut({
        cards: cards.map((card) => ({
          ...card,
          knowledgeContexts: contextMap.get(card.tokenId) ?? [],
        })),
      });
    });
  });

// ── zam bridge personal-card-create ────────────────────────────────────────

bridgeCommand
  .command("personal-card-create")
  .description("Atomically create a token and its personal card (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--concept <concept>", "Concept description / answer")
  .option("--title <title>", "Human-friendly display title")
  .option("--domain <domain>", "Knowledge category / domain", "")
  .option("--question <question>", "Question prompt for recall")
  .option("--source-link <link>", "Source file path or reference URL")
  .option("--bloom <level>", "Bloom taxonomy level (1-5)", "1")
  .option(
    "--mode <mode>",
    "Symbiosis mode: shadowing | copilot | autonomy | none",
    "none",
  )
  .option("--context <context>", "Context description", "")
  .option(
    "--knowledge-context <context>",
    "Assign token to a knowledge context (repeatable)",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const contextNames = parseKnowledgeContextNames(
        opts.knowledgeContext || [],
      );
      const contexts = await resolveKnowledgeContexts(db, contextNames);

      const bloom = Number(opts.bloom) as BloomLevel;
      if (bloom < 1 || bloom > 5) {
        jsonError("bloom must be between 1 and 5");
      }

      const mode = opts.mode === "none" ? null : (opts.mode as SymbiosisMode);
      if (mode && !["shadowing", "copilot", "autonomy"].includes(mode)) {
        jsonError(`Invalid mode: ${opts.mode}`);
      }

      const slug = await generateTokenSlug(
        db,
        opts.domain,
        opts.concept,
        opts.question,
      );

      let question: string | null = opts.question || null;
      if (!question) {
        question = generateConceptFreeCue(bloom, slug, opts.domain);
      }

      const { token, card } = await db.transaction(async (tx) => {
        const createdToken = await createToken(tx, {
          slug,
          title: opts.title,
          concept: opts.concept,
          domain: opts.domain,
          bloom_level: bloom,
          context: opts.context,
          symbiosis_mode: mode,
          source_link: opts.sourceLink || null,
          question,
        });
        for (const context of contexts) {
          await assignTokenToContext(tx, createdToken.id, context.id);
        }
        const createdCard = await ensureCard(tx, createdToken.id, userId);
        return { token: createdToken, card: createdCard };
      });

      jsonOut({
        success: true,
        token: {
          id: token.id,
          slug: token.slug,
          title: token.title,
          display_title: getDisplayTitle(token),
          concept: token.concept,
          domain: token.domain,
          bloomLevel: token.bloom_level,
          context: token.context,
          symbiosisMode: token.symbiosis_mode,
          sourceLink: token.source_link,
          question: token.question,
          createdAt: token.created_at,
          updatedAt: token.updated_at,
          knowledgeContexts: contexts.map((context) => ({
            name: context.name,
            label: context.label,
            language: context.language,
          })),
        },
        card: {
          id: card.id,
          tokenId: card.token_id,
          userId: card.user_id,
          state: card.state,
          dueAt: card.due_at,
          blocked: card.blocked,
        },
      });
    });
  });

// ── zam bridge personal-card-update ────────────────────────────────────────

bridgeCommand
  .command("personal-card-update")
  .description("Update the mutable token fields of a personal card (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--slug <slug>", "Token slug to update")
  .option("--title <title>", "Updated display title")
  .option("--concept <concept>", "Updated concept text")
  .option("--domain <domain>", "Updated domain / category")
  .option("--bloom <level>", "Updated Bloom taxonomy level (1-5)")
  .option("--context <context>", "Updated context")
  .option(
    "--mode <mode>",
    "Updated symbiosis mode: shadowing | copilot | autonomy | none",
  )
  .option("--source-link <link>", "Updated source link")
  .option("--question <question>", "Updated question text")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const updates: {
        title?: string;
        concept?: string;
        domain?: string;
        bloom_level?: BloomLevel;
        context?: string;
        symbiosis_mode?: SymbiosisMode | null;
        source_link?: string | null;
        question?: string | null;
      } = {};

      if (opts.title !== undefined) updates.title = opts.title;
      if (opts.concept !== undefined) updates.concept = opts.concept;
      if (opts.domain !== undefined) updates.domain = opts.domain;
      if (opts.bloom !== undefined) {
        const bloom = Number(opts.bloom) as BloomLevel;
        if (bloom < 1 || bloom > 5) {
          jsonError("bloom must be between 1 and 5");
        }
        updates.bloom_level = bloom;
      }
      if (opts.context !== undefined) updates.context = opts.context;
      if (opts.sourceLink !== undefined) {
        updates.source_link = opts.sourceLink === "" ? null : opts.sourceLink;
      }
      if (opts.question !== undefined) {
        updates.question = opts.question === "" ? null : opts.question;
      }
      if (opts.mode !== undefined) {
        const validModes = ["shadowing", "copilot", "autonomy", "none"];
        if (!validModes.includes(opts.mode)) {
          jsonError(`Invalid mode: ${opts.mode}`);
        }
        updates.symbiosis_mode =
          opts.mode === "none" ? null : (opts.mode as SymbiosisMode);
      }

      const token = await db.transaction(async (tx) => {
        const existingToken = await getTokenBySlug(tx, opts.slug);
        if (!existingToken) {
          throw new Error(`Token not found: ${opts.slug}`);
        }
        const card = await getCard(tx, existingToken.id, userId);
        if (!card) {
          throw new Error(
            `Card not found for token ${opts.slug} and user ${userId}`,
          );
        }
        return updateToken(tx, opts.slug, updates);
      });

      jsonOut({
        success: true,
        token: {
          id: token.id,
          slug: token.slug,
          title: token.title,
          display_title: getDisplayTitle(token),
          concept: token.concept,
          domain: token.domain,
          bloomLevel: token.bloom_level,
          context: token.context,
          symbiosisMode: token.symbiosis_mode,
          sourceLink: token.source_link,
          question: token.question,
          createdAt: token.created_at,
          updatedAt: token.updated_at,
        },
      });
    });
  });

// ── zam bridge personal-card-publish-revision ────────────────────────────────

bridgeCommand
  .command("personal-card-publish-revision")
  .description(
    "Publish a token revision with forced cosmetic vs material classification (JSON)",
  )
  .requiredOption("--slug <slug>", "Token slug to publish revision for")
  .requiredOption(
    "--materiality <type>",
    "cosmetic or material (forced classification)",
  )
  .option("--published-by <author>", "Author/curator name")
  .option("--title <title>", "Updated title")
  .option("--concept <concept>", "Updated concept text")
  .option("--domain <domain>", "Updated domain")
  .option("--bloom <level>", "Updated Bloom taxonomy level (1-5)")
  .option("--context <context>", "Updated context")
  .option("--source-link <link>", "Updated source link")
  .option("--question <question>", "Updated question text")
  .action(async (opts) => {
    await withDb(async (db) => {
      const materiality = opts.materiality as "cosmetic" | "material";
      if (materiality !== "cosmetic" && materiality !== "material") {
        jsonError("materiality must be 'cosmetic' or 'material'");
      }

      const changes: Record<string, unknown> = {};
      if (opts.title !== undefined) changes.title = opts.title;
      if (opts.concept !== undefined) changes.concept = opts.concept;
      if (opts.domain !== undefined) changes.domain = opts.domain;
      if (opts.bloom !== undefined) changes.bloomLevel = Number(opts.bloom);
      if (opts.context !== undefined) changes.context = opts.context;
      if (opts.sourceLink !== undefined)
        changes.sourceLink = opts.sourceLink === "" ? null : opts.sourceLink;
      if (opts.question !== undefined) changes.question = opts.question;

      try {
        const result = await handlePublishRevision(db, {
          slug: opts.slug,
          materiality,
          publishedBy: opts.publishedBy,
          changes: Object.keys(changes).length > 0 ? changes : undefined,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge personal-card-revision-preview ────────────────────────────────

bridgeCommand
  .command("personal-card-revision-preview")
  .description("Preview learner/card impact of a revision publish (JSON)")
  .requiredOption("--slug <slug>", "Token slug to preview revision for")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleRevisionPreview(db, { slug: opts.slug });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge personal-card-create-assignment ──────────────────────────────

bridgeCommand
  .command("personal-card-create-assignment")
  .description("Assign a knowledge token to a learner (JSON)")
  .requiredOption("--slug <slug>", "Token slug to assign")
  .requiredOption("--assigner <id>", "Assigner user ID")
  .requiredOption("--assignee <id>", "Assignee user ID")
  .option("--due-date <date>", "Target completion date (ISO string)")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleCreateAssignment(db, {
          slug: opts.slug,
          assignerId: opts.assigner,
          assigneeId: opts.assignee,
          dueDate: opts.dueDate,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge personal-card-withdraw-assignment ────────────────────────────

bridgeCommand
  .command("personal-card-withdraw-assignment")
  .description("Withdraw an active assignment (JSON)")
  .requiredOption("--assignment-id <id>", "Assignment ID")
  .option("--assigner <id>", "Assigner user ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleWithdrawAssignment(db, {
          assignmentId: opts.assignmentId,
          assignerId: opts.assigner,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge personal-card-list-assignments ───────────────────────────────

bridgeCommand
  .command("personal-card-list-assignments")
  .description("List assignments by assignee or assigner (JSON)")
  .option("--assignee <id>", "Assignee user ID")
  .option("--assigner <id>", "Assigner user ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleListAssignments(db, {
          assigneeId: opts.assignee,
          assignerId: opts.assigner,
        });
        jsonOut(result);
      } catch (err) {
        jsonError((err as Error).message);
      }
    });
  });

// ── zam bridge personal-card-remove ────────────────────────────────────────

bridgeCommand
  .command("personal-card-remove")
  .description(
    "Remove a personal card (optionally previewing the effects) (JSON)",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--slug <slug>", "Token slug")
  .option("--confirm", "Perform the deletion instead of a preview")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const token = await getTokenBySlug(db, opts.slug);
      if (!token) {
        jsonError(`Token not found: ${opts.slug}`);
      }

      const card = await getCard(db, token.id, userId);
      if (!card) {
        jsonError(`Card not found for token ${opts.slug} and user ${userId}`);
      }

      if (!opts.confirm) {
        const impact = await getCardDeletionImpact(db, token.id, userId);
        jsonOut({
          success: true,
          preview: true,
          requiresConfirmation: true,
          token: {
            id: token.id,
            slug: token.slug,
            title: token.title,
            display_title: getDisplayTitle(token),
          },
          impact,
        });
        return;
      }

      const result = await deleteCardForUser(db, token.id, userId);
      jsonOut({
        success: true,
        deletedCard: {
          id: result.card.id,
          tokenId: result.card.token_id,
          userId: result.card.user_id,
        },
        impact: result.impact,
      });
    });
  });

// ── zam bridge personal-card-delete ────────────────────────────────────────

bridgeCommand
  .command("personal-card-delete")
  .description("Hard-delete a token and all its dependencies (JSON)")
  .requiredOption("--slug <slug>", "Token slug")
  .option("--confirm", "Perform the deletion instead of a preview")
  .action(async (opts) => {
    await withDb(async (db) => {
      const token = await getTokenBySlug(db, opts.slug);
      if (!token) {
        jsonError(`Token not found: ${opts.slug}`);
      }

      if (!opts.confirm) {
        const impact = await getTokenDeleteImpact(db, opts.slug);
        jsonOut({
          success: true,
          preview: true,
          requiresConfirmation: true,
          token: {
            id: token.id,
            slug: token.slug,
            title: token.title,
            display_title: getDisplayTitle(token),
          },
          impact,
        });
        return;
      }

      const result = await deleteToken(db, opts.slug);
      jsonOut({
        success: true,
        deletedToken: {
          id: result.token.id,
          slug: result.token.slug,
        },
        impact: result.impact,
      });
    });
  });

// ── zam bridge personal-card-import-curriculum ─────────────────────────────

bridgeCommand
  .command("personal-card-import-curriculum")
  .description("Parse curriculum text using LLM and import cards (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .option("--text <text>", "Curriculum syllabus/content text")
  .option(
    "--sourceId <id>",
    "Read curriculum text from a sources row (avoids large IPC payloads)",
  )
  .requiredOption(
    "--domain <domain>",
    "Default category/domain for imported cards",
  )
  .option("--source <url>", "Provenance source link or URL")
  .option("--preview", "Return parsed cards without saving them")
  .option(
    "--knowledge-context <context>",
    "Assign imported tokens to a knowledge context (repeatable)",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });

      let curriculumText = opts.text as string | undefined;
      if (opts.sourceId) {
        const row = (await db
          .prepare("SELECT content FROM sources WHERE id = ?")
          .get(opts.sourceId)) as { content: string | null } | undefined;
        if (!row) {
          jsonError(`Source not found: ${opts.sourceId}`);
        }
        curriculumText = row.content ?? "";
      }
      if (!curriculumText?.trim()) {
        jsonError("Curriculum text is required (--text or --sourceId)");
      }

      const contextNames = parseKnowledgeContextNames(
        opts.knowledgeContext || [],
      );
      const contexts = await resolveKnowledgeContexts(db, contextNames);
      const firstContext = contexts[0]?.name;

      const cards = await importCurriculumViaLLM(
        db,
        curriculumText,
        opts.domain,
        opts.source || null,
        { knowledgeContext: firstContext },
      );

      if (opts.preview) {
        jsonOut({
          success: true,
          proposals: cards,
        });
        return;
      }

      const result = await importCurriculumCards(db, userId, cards);

      for (const card of cards) {
        const baseText =
          card.question && card.question.trim().length > 0
            ? card.question
            : card.concept;
        const cleanDomain = slugify(card.domain || "");
        const cleanBase = slugify(baseText);
        let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
        if (baseSlug.length > 60) {
          baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
        }
        if (!baseSlug) {
          baseSlug = "token";
        }
        const token = await getTokenBySlug(db, baseSlug);
        if (token) {
          for (const context of contexts) {
            await assignTokenToContext(db, token.id, context.id);
          }
        }
      }

      jsonOut({
        success: true,
        createdCount: result.createdCount,
        ensuredCount: result.ensuredCount,
      });
    });
  });

// ── zam bridge personal-card-split-proposals ───────────────────────────────

bridgeCommand
  .command("personal-card-split-proposals")
  .description("Generate atomic proposals for splitting a card (JSON)")
  .requiredOption("--slug <slug>", "Original token slug")
  .action(async (opts) => {
    await withDb(async (db) => {
      const token = await getTokenBySlug(db, opts.slug);
      if (!token) {
        jsonError(`Token not found: ${opts.slug}`);
      }

      const proposals = await generateSplitProposalsViaLLM(db, token);
      jsonOut({
        success: true,
        proposals,
      });
    });
  });

// ── zam bridge personal-card-confirm-split ─────────────────────────────────

bridgeCommand
  .command("personal-card-confirm-split")
  .description("Save confirmed card split and modify original card (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--slug <slug>", "Original token slug")
  .requiredOption(
    "--action <action>",
    "Original card action: 'block' or 'remove'",
  )
  .requiredOption(
    "--original-question <question>",
    "Rewritten question of the original card",
  )
  .requiredOption(
    "--original-concept <concept>",
    "Rewritten concept of the original card",
  )
  .requiredOption(
    "--proposals <json>",
    "JSON string representing proposals array",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const proposals = JSON.parse(opts.proposals);

      const result = await confirmCardSplit(
        db,
        userId,
        opts.slug,
        opts.action as "block" | "remove",
        opts.originalQuestion,
        opts.originalConcept,
        proposals,
      );

      jsonOut({
        success: true,
        createdCount: result.createdCount,
        ensuredCount: result.ensuredCount,
      });
    });
  });

// ── zam bridge personal-card-foundations-proposals ─────────────────────────

bridgeCommand
  .command("personal-card-foundations-proposals")
  .description("Generate prerequisite suggestions for a card (JSON)")
  .requiredOption("--slug <slug>", "Original token slug")
  .action(async (opts) => {
    await withDb(async (db) => {
      const token = await getTokenBySlug(db, opts.slug);
      if (!token) {
        jsonError(`Token not found: ${opts.slug}`);
      }

      const proposals = await generateFoundationsProposalsViaLLM(db, token);

      const resolvedProposals = [];
      for (const prop of proposals) {
        const baseText =
          prop.question && prop.question.trim().length > 0
            ? prop.question
            : prop.concept;
        const cleanDomain = slugify(prop.domain || "");
        const cleanBase = slugify(baseText);
        let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
        if (baseSlug.length > 60) {
          baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
        }
        if (!baseSlug) {
          baseSlug = "token";
        }

        const existingToken = await getTokenBySlug(db, baseSlug);
        if (existingToken) {
          resolvedProposals.push({
            ...prop,
            exists: true,
            slug: existingToken.slug,
            question: existingToken.question || prop.question,
            concept: existingToken.concept,
            domain: existingToken.domain,
          });
        } else {
          resolvedProposals.push({
            ...prop,
            exists: false,
            slug: null,
          });
        }
      }

      jsonOut({
        success: true,
        proposals: resolvedProposals,
      });
    });
  });

// ── zam bridge personal-card-confirm-foundations ───────────────────────────

bridgeCommand
  .command("personal-card-confirm-foundations")
  .description("Save confirmed foundational prerequisites (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--slug <slug>", "Original token slug")
  .requiredOption(
    "--proposals <json>",
    "JSON string representing proposals array",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const proposals = JSON.parse(opts.proposals);

      const result = await confirmFoundations(db, userId, opts.slug, proposals);

      jsonOut({
        success: true,
        createdCount: result.createdCount,
        linkedCount: result.linkedCount,
      });
    });
  });

// ── zam bridge personal-card-import-file-* ─────────────────────────────────

bridgeCommand
  .command("open-content-list")
  .description("List curated, open-licensed learning decks (JSON)")
  .option("--query <text>", "Search titles, subjects, authors, and tags")
  .option("--language <code>", "Filter by content language")
  .option("--subject <subject>", "Filter by subject")
  .action((opts) => {
    const listing = listOpenContentCatalog({
      query: opts.query,
      language: opts.language,
      subject: opts.subject,
    });
    jsonOut({
      success: true,
      ...listing,
      policy: {
        curated: true,
        explicitLicenseRequired: true,
        ankiWebAutomated: false,
      },
    });
  });

bridgeCommand
  .command("open-content-preview")
  .description(
    "Download, verify, and preview a curated open-content deck (JSON)",
  )
  .requiredOption("--id <id>", "Curated catalog item ID")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const preview = await previewOpenContentImport(db, userId, opts.id);
      jsonOut({ success: true, ...preview });
    });
  });

bridgeCommand
  .command("open-content-confirm")
  .description(
    "Confirm a verified curated deck using its exact preview plan (JSON)",
  )
  .requiredOption("--id <id>", "Curated catalog item ID")
  .requiredOption("--plan-hash <hash>", "Plan hash returned by preview")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const result = await confirmOpenContentImport(
        db,
        userId,
        opts.id,
        opts.planHash,
        {},
        { onProgress: throttledProgress("import-progress") },
      );
      jsonOut({ success: true, ...result });
    });
  });

bridgeCommand
  .command("personal-card-import-file-preview")
  .description(
    "Preview a local APKG, CSV, or TSV card import without network or AI (JSON)",
  )
  .requiredOption("--path <path>", "Local .apkg, .csv, or .tsv file")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const document = await readTextImportFile(opts.path);
      const preview = await previewTextImport(db, userId, document);
      jsonOut({ success: true, ...preview });
    });
  });

bridgeCommand
  .command("personal-card-import-file-confirm")
  .description(
    "Atomically confirm a previously previewed local card import (JSON)",
  )
  .requiredOption("--path <path>", "Local .apkg, .csv, or .tsv file")
  .requiredOption("--plan-hash <hash>", "Plan hash returned by preview")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const document = await readTextImportFile(opts.path);
      const result = await commitTextImport(
        db,
        userId,
        document,
        opts.planHash,
        { onProgress: throttledProgress("import-progress") },
      );
      jsonOut({ success: true, ...result });
    });
  });

// ── zam bridge personal-source-import ──────────────────────────────────────

bridgeCommand
  .command("personal-source-import")
  .description(
    "Fetch and clean plain text from local file, web link, or vision scan (JSON)",
  )
  .requiredOption("--type <file|web|scan>", "Source type")
  .requiredOption("--uri <uri>", "Source path or URL")
  .option("--refresh", "Re-fetch an already cached web source")
  .action(async (opts) => {
    await withDb(async (db) => {
      if (opts.type === "web" && !opts.refresh) {
        const cached = (await db
          .prepare(
            "SELECT id, content FROM sources WHERE uri = ? AND type = 'web'",
          )
          .get(opts.uri)) as { id: string; content: string | null } | undefined;
        if (cached?.content) {
          jsonOut({
            success: true,
            sourceId: cached.id,
            content: cached.content,
            cached: true,
          });
          return;
        }
      }

      let content = "";
      if (opts.type === "file") {
        content = await readLocalFile(opts.uri);
      } else if (opts.type === "web") {
        content = await readWebLink(opts.uri);
      } else if (opts.type === "scan") {
        content = await readImageOCR(db, opts.uri);
      } else {
        throw new Error(`Invalid source type: ${opts.type}`);
      }

      const sourceId = ulid();
      await db
        .prepare(
          `INSERT INTO sources (id, type, uri, content)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(uri) DO UPDATE SET
             type = excluded.type,
             content = excluded.content`,
        )
        .run(sourceId, opts.type, opts.uri, content);

      const record = (await db
        .prepare("SELECT id, content FROM sources WHERE uri = ?")
        .get(opts.uri)) as { id: string; content: string };

      jsonOut({
        success: true,
        sourceId: record.id,
        content: record.content,
        cached: false,
      });
    });
  });

// ── zam bridge personal-source-confirm-import ──────────────────────────────

bridgeCommand
  .command("personal-source-confirm-import")
  .description(
    "Confirm and save cards generated from a source reference (JSON)",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--sourceId <id>", "Source database ID")
  .requiredOption(
    "--proposals <json>",
    "JSON string representing proposals array",
  )
  .option(
    "--knowledge-context <context>",
    "Assign confirmed tokens to a knowledge context (repeatable)",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const proposals = JSON.parse(opts.proposals);
      const contextNames = parseKnowledgeContextNames(
        opts.knowledgeContext || [],
      );
      const contexts = await resolveKnowledgeContexts(db, contextNames);

      const result = await confirmSourceImport(
        db,
        userId,
        opts.sourceId,
        proposals,
      );

      for (const p of proposals) {
        const baseText =
          p.question && p.question.trim().length > 0 ? p.question : p.concept;
        const cleanDomain = slugify(p.domain || "");
        const cleanBase = slugify(baseText);
        let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
        if (baseSlug.length > 60) {
          baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
        }
        if (!baseSlug) {
          baseSlug = "token";
        }
        const token = await getTokenBySlug(db, baseSlug);
        if (token) {
          for (const context of contexts) {
            await assignTokenToContext(db, token.id, context.id);
          }
        }
      }

      jsonOut({
        success: true,
        createdCount: result.createdCount,
        ensuredCount: result.linkedCount,
      });
    });
  });

// ── zam bridge curriculum-list-providers ────────────────────────────────────

bridgeCommand
  .command("curriculum-list-providers")
  .description("List registered curriculum providers (JSON)")
  .action(() => {
    jsonOut({
      success: true,
      providers: CURRICULUM_PROVIDERS.map((provider) => ({
        id: provider.id,
        country: provider.country,
        countryLabel: provider.countryLabel,
        region: provider.region,
        regionLabel: provider.regionLabel,
        label: provider.label,
      })),
    });
  });

// ── zam bridge curriculum-list-level ────────────────────────────────────────

const CURRICULUM_LEVELS: CurriculumLevel[] = [
  "schoolType",
  "grade",
  "subject",
  "track",
  "topic",
];

bridgeCommand
  .command("curriculum-list-level")
  .description("List taxonomy options for the next import-wizard step (JSON)")
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption(
    "--level <level>",
    `Level to list: ${CURRICULUM_LEVELS.join("|")}`,
  )
  .option("--selection <json>", "JSON selection made so far", "{}")
  .action((opts) => {
    const provider = getCurriculumProvider(opts.provider);
    if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

    if (!CURRICULUM_LEVELS.includes(opts.level)) {
      jsonError(
        `Invalid --level: ${opts.level}. Use one of ${CURRICULUM_LEVELS.join(", ")}.`,
      );
    }

    let selection: CurriculumSelection;
    try {
      selection = JSON.parse(opts.selection);
    } catch {
      jsonError("Invalid --selection JSON");
      return;
    }

    const level = opts.level as CurriculumLevel;
    if (level === "schoolType") {
      jsonOut({ success: true, options: provider.listSchoolTypes() });
      return;
    }

    if (!selection.schoolType) jsonError("selection.schoolType is required");
    if (level === "grade") {
      jsonOut({
        success: true,
        options: provider.listGrades(selection.schoolType),
      });
      return;
    }

    if (!selection.grade) jsonError("selection.grade is required");
    if (level === "subject") {
      jsonOut({
        success: true,
        options: provider.listSubjects(selection.schoolType, selection.grade),
      });
      return;
    }

    if (!selection.subject) jsonError("selection.subject is required");
    if (level === "track") {
      jsonOut({
        success: true,
        options: provider.listTracks(
          selection.schoolType,
          selection.grade,
          selection.subject,
        ),
      });
      return;
    }

    jsonOut({ success: true, options: provider.listTopics(selection) });
  });

// ── zam bridge curriculum-resolve-topics ─────────────────────────────────────

bridgeCommand
  .command("curriculum-resolve-topics")
  .description("Resolve selected curriculum topics to source URLs (JSON)")
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topics <json>", "JSON array of topic nodes to resolve")
  .action((opts) => {
    const provider = getCurriculumProvider(opts.provider);
    if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

    let topics: TopicNode[];
    try {
      topics = JSON.parse(opts.topics);
    } catch {
      jsonError("Invalid --topics JSON");
      return;
    }

    const resolved = topics.map((topic) => provider.resolveTopic(topic));
    jsonOut({ success: true, resolved });
  });

/**
 * Fetch a curriculum source document as extractable HTML.
 * PDF official sources (e.g. Bremen Bildungspläne) are converted via pdftotext.
 */
async function fetchRawHtml(url: string): Promise<string> {
  if (!(await isSafeUrl(url))) {
    throw new Error(`Access denied to unsafe target URL: ${url}`);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ZAM-Content-Studio/0.24.1",
      },
    });
    if (!res.ok) {
      throw new Error(`Web server responded with status ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (isPdfUrl(url, contentType)) {
      const bytes = new Uint8Array(await res.arrayBuffer());
      const text = extractPdfText(bytes);
      return plainTextToExtractableHtml(text);
    }
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml") &&
      !contentType.includes("text/plain")
    ) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    return await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Connection request timed out after 20 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const CURRICULUM_TOPIC_URI_PREFIX = "zam-curriculum-topic://";

function topicAlternatives(
  providerId: string,
  selection: CurriculumSelection,
  topic: TopicNode,
): CurriculumTopicAlternative[] {
  return findCurriculumTopicAlternatives(
    CURRICULUM_PROVIDERS,
    providerId,
    selection,
    topic,
  );
}

function assertVerifiedCurriculumTopic(
  provider: NonNullable<ReturnType<typeof getCurriculumProvider>>,
  topic: TopicNode,
): void {
  if (curriculumTopicContentStatus(provider, topic) !== "verified") {
    throw new Error(
      `Curriculum topic "${topic.id}" is marked missing because its official source has not been verified as sufficiently detailed.`,
    );
  }
}

function extractTopicTextFromRaw(
  provider: NonNullable<ReturnType<typeof getCurriculumProvider>>,
  topic: TopicNode,
  rawHtml: string,
): {
  resolvedTopicId: string;
  text: string;
  readiness: CurriculumTextReadiness;
} {
  if (!provider.extractTopics) {
    throw new Error(
      `Curriculum provider "${provider.id}" does not implement extractTopics; ` +
        `whole-page fallback is not allowed for selected-topic import.`,
    );
  }
  const resolved = provider.resolveTopic(topic);
  const text = (
    provider.extractTopics(rawHtml, [resolved.topicId])[resolved.topicId] ?? ""
  ).trim();
  return {
    resolvedTopicId: resolved.topicId,
    text,
    readiness: assessCurriculumText(text),
  };
}

function insufficientCurriculumTextError(
  topicId: string,
  readiness: CurriculumTextReadiness,
): Error {
  return new Error(
    `Curriculum topic "${topicId}" is missing sufficiently detailed content ` +
      `(${readiness.reason}; ${readiness.textLength} characters, ` +
      `${readiness.wordCount} words, ${readiness.sentenceCount} sentences).`,
  );
}

// ── zam bridge curriculum-topic-readiness ───────────────────────────────────

bridgeCommand
  .command("curriculum-topic-readiness")
  .description(
    "Check whether one topic has enough coherent source text and list verified alternatives (JSON)",
  )
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topic <json>", "Single topic node JSON")
  .requiredOption("--selection <json>", "Current curriculum selection JSON")
  .action(async (opts) => {
    try {
      const provider = getCurriculumProvider(opts.provider);
      if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

      let topic: TopicNode;
      let selection: CurriculumSelection;
      try {
        topic = JSON.parse(opts.topic);
        selection = JSON.parse(opts.selection);
      } catch {
        jsonError("Invalid --topic or --selection JSON");
        return;
      }

      const alternatives = topicAlternatives(provider.id, selection, topic);
      if (curriculumTopicContentStatus(provider, topic) !== "verified") {
        jsonOut({
          success: true,
          status: "missing",
          reason: "unverified_source" satisfies CurriculumReadinessReason,
          textLength: 0,
          wordCount: 0,
          sentenceCount: 0,
          alternatives,
        });
        return;
      }

      try {
        const resolved = provider.resolveTopic(topic);
        const rawHtml = await fetchRawHtml(resolved.uri);
        const { readiness } = extractTopicTextFromRaw(provider, topic, rawHtml);
        jsonOut({ success: true, ...readiness, alternatives });
      } catch (err) {
        jsonOut({
          success: true,
          status: "missing",
          reason: "source_error" satisfies CurriculumReadinessReason,
          textLength: 0,
          wordCount: 0,
          sentenceCount: 0,
          detail: err instanceof Error ? err.message : String(err),
          alternatives,
        });
      }
    } catch (err) {
      jsonError((err as Error).message || String(err));
    }
  });

interface StoredCurriculumTopic {
  topicId: string;
  uri: string;
  sourceId: string;
  topicSourceId: string;
  textLength: number;
}

async function extractAndStoreCurriculumTopics(
  db: Database,
  provider: NonNullable<ReturnType<typeof getCurriculumProvider>>,
  topics: TopicNode[],
): Promise<StoredCurriculumTopic[]> {
  const topicsByUri = new Map<string, TopicNode[]>();
  for (const topic of topics) {
    assertVerifiedCurriculumTopic(provider, topic);
    const resolved = provider.resolveTopic(topic);
    const list = topicsByUri.get(resolved.uri) || [];
    list.push(topic);
    topicsByUri.set(resolved.uri, list);
  }

  const extracted: StoredCurriculumTopic[] = [];

  for (const [uri, uriTopics] of topicsByUri.entries()) {
    const rawHtml = await fetchRawHtml(uri);

    if (!provider.extractTopics) {
      throw new Error(
        `Curriculum provider "${provider.id}" does not implement extractTopics; ` +
          `whole-page fallback is not allowed for selected-topic import.`,
      );
    }

    const fullTopicIds = uriTopics.map((t) => `${t.sourceRef}#${t.id}`);
    const extractedTexts = provider.extractTopics(rawHtml, fullTopicIds);

    // Strict selected-topic contract: every selected topic must yield its own
    // section text. Missing matches must not fall back to page body or labels.
    const missing = fullTopicIds.filter(
      (id) => !(extractedTexts[id] && extractedTexts[id].trim().length > 0),
    );
    if (missing.length > 0) {
      throw new Error(
        `No curriculum text extracted for topic(s): ${missing.join(", ")}. ` +
          `The source document must contain a matching section for each selected topic.`,
      );
    }

    for (const fullTopicId of fullTopicIds) {
      const readiness = assessCurriculumText(
        extractedTexts[fullTopicId].trim(),
      );
      if (readiness.status !== "verified") {
        throw insufficientCurriculumTextError(fullTopicId, readiness);
      }
    }

    const pageCleanedText = cleanHtml(rawHtml);
    const sourceId = ulid();
    await db
      .prepare(
        `INSERT INTO sources (id, type, uri, content)
         VALUES (?, 'web', ?, ?)
         ON CONFLICT(uri) DO UPDATE SET
           type = excluded.type,
           content = excluded.content`,
      )
      .run(sourceId, uri, pageCleanedText);

    const record = (await db
      .prepare("SELECT id FROM sources WHERE uri = ?")
      .get(uri)) as { id: string };

    for (const topic of uriTopics) {
      const resolved = provider.resolveTopic(topic);
      const text = extractedTexts[resolved.topicId].trim();
      const topicUri = `${CURRICULUM_TOPIC_URI_PREFIX}${resolved.topicId}`;
      const topicSourceId = ulid();
      await db
        .prepare(
          `INSERT INTO sources (id, type, uri, content)
           VALUES (?, 'web', ?, ?)
           ON CONFLICT(uri) DO UPDATE SET
             content = excluded.content`,
        )
        .run(topicSourceId, topicUri, text);

      const topicRecord = (await db
        .prepare("SELECT id FROM sources WHERE uri = ?")
        .get(topicUri)) as { id: string };

      extracted.push({
        topicId: resolved.topicId,
        uri,
        sourceId: record.id,
        topicSourceId: topicRecord.id,
        textLength: text.length,
      });
    }
  }

  return extracted;
}

async function assignConfirmedProposalContexts(
  db: Database,
  proposals: Array<{
    question: string;
    concept: string;
    domain: string;
  }>,
  contexts: KnowledgeContext[],
): Promise<void> {
  for (const p of proposals) {
    const baseText =
      p.question && p.question.trim().length > 0 ? p.question : p.concept;
    const cleanDomain = slugify(p.domain || "");
    const cleanBase = slugify(baseText);
    let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
    if (baseSlug.length > 60) {
      baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
    }
    if (!baseSlug) {
      baseSlug = "token";
    }
    const token = await getTokenBySlug(db, baseSlug);
    if (token) {
      for (const context of contexts) {
        await assignTokenToContext(db, token.id, context.id);
      }
    }
  }
}

// ── zam bridge curriculum-import-status ──────────────────────────────────────

bridgeCommand
  .command("curriculum-import-status")
  .description(
    "Check which selected curriculum topics are already imported for a user (JSON)",
  )
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topics <json>", "JSON array of selected topic nodes")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const provider = getCurriculumProvider(opts.provider);
      if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

      let topics: TopicNode[];
      try {
        topics = JSON.parse(opts.topics);
      } catch {
        jsonError("Invalid --topics JSON");
        return;
      }

      const status: Array<{
        topicId: string;
        shortId: string;
        cardCount: number;
        alreadyImported: boolean;
        error?: string;
      }> = [];

      for (const topic of topics) {
        try {
          const resolved = provider.resolveTopic(topic);
          const cardCount = await countUserCardsForCurriculumTopic(
            db,
            userId,
            provider.id,
            resolved.topicId,
          );
          status.push({
            topicId: resolved.topicId,
            shortId: topic.id,
            cardCount,
            alreadyImported: cardCount > 0,
          });
        } catch (err) {
          status.push({
            topicId: topic.id,
            shortId: topic.id,
            cardCount: 0,
            alreadyImported: false,
            error: (err as Error).message || String(err),
          });
        }
      }

      jsonOut({ success: true, status });
    });
  });

// ── zam bridge curriculum-import-topic ───────────────────────────────────────

bridgeCommand
  .command("curriculum-import-topic")
  .description(
    "Extract, LLM-preview, and confirm-import one curriculum topic server-side (JSON)",
  )
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topic <json>", "Single topic node JSON")
  .requiredOption("--domain <domain>", "Subject label for imported card domain")
  .option("--user <id>", "User ID (default: whoami)")
  .option(
    "--knowledge-context <context>",
    "Assign confirmed tokens to a knowledge context (repeatable)",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const provider = getCurriculumProvider(opts.provider);
      if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

      let topic: TopicNode;
      try {
        topic = JSON.parse(opts.topic);
      } catch {
        jsonError("Invalid --topic JSON");
        return;
      }

      const extracted = await extractAndStoreCurriculumTopics(db, provider, [
        topic,
      ]);
      const item = extracted[0];
      if (!item || item.textLength === 0) {
        jsonError(`No curriculum text extracted for topic "${topic.id}"`);
      }

      const contextNames = parseKnowledgeContextNames(
        opts.knowledgeContext || [],
      );
      const contexts = await resolveKnowledgeContexts(db, contextNames);
      const firstContext = contexts[0]?.name;

      const topicRow = (await db
        .prepare("SELECT content FROM sources WHERE id = ?")
        .get(item.topicSourceId)) as { content: string | null };
      const curriculumText = topicRow.content ?? "";

      const cards = await importCurriculumViaLLM(
        db,
        curriculumText,
        opts.domain,
        item.uri,
        { knowledgeContext: firstContext },
      );

      if (cards.length === 0) {
        jsonError(`No cards were generated for ${item.topicId}`);
      }

      const proposals = cards.map((card) => ({
        question: card.question,
        concept: card.concept,
        domain: card.domain,
        title: card.title,
        bloom_level: card.bloom_level,
        symbiosis_mode: card.symbiosis_mode || "none",
        excerpt: card.context || "",
        page_number: null,
        provider: provider.id,
        topic_id: item.topicId,
        prerequisites: card.prerequisites,
      }));

      const result = await confirmSourceImport(
        db,
        userId,
        item.sourceId,
        proposals,
      );

      await assignConfirmedProposalContexts(db, proposals, contexts);

      jsonOut({
        success: true,
        topicId: item.topicId,
        proposalCount: proposals.length,
        createdCount: result.createdCount,
        ensuredCount: result.linkedCount,
      });
    });
  });

function proposalBaseSlug(
  domain: string,
  question: string,
  concept: string,
): string {
  const baseText = question?.trim() ? question : concept;
  const cleanDomain = slugify(domain || "");
  const cleanBase = slugify(baseText);
  let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
  if (baseSlug.length > 60) {
    baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
  }
  return baseSlug || "token";
}

interface CurriculumConfirmOperation {
  sourceId: string;
  provider: string;
  topicId: string;
  create: SourceProposalInput[];
  removeSlugs: string[];
}

async function executeCurriculumConfirmOperations(
  db: Database,
  userId: string,
  operations: CurriculumConfirmOperation[],
  contexts: KnowledgeContext[],
): Promise<{
  createdCount: number;
  ensuredCount: number;
  removedCount: number;
}> {
  let createdCount = 0;
  let ensuredCount = 0;
  let removedCount = 0;

  await db.transaction(async (tx) => {
    for (const op of operations) {
      if (op.create.length > 0) {
        const result = await applySourceProposals(
          tx,
          userId,
          op.sourceId,
          op.create,
        );
        createdCount += result.createdCount;
        ensuredCount += result.linkedCount;
        await assignConfirmedProposalContexts(tx, op.create, contexts);
      }
      for (const slug of op.removeSlugs) {
        if (
          await deleteCurriculumCardForUser(
            tx,
            userId,
            slug,
            op.provider,
            op.topicId,
          )
        ) {
          removedCount++;
        }
      }
    }
  });

  return { createdCount, ensuredCount, removedCount };
}

// ── zam bridge curriculum-list-subtopics ─────────────────────────────────────

bridgeCommand
  .command("curriculum-list-subtopics")
  .description(
    "List finer units inside a Lernbereich for chunked import (JSON)",
  )
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topic <json>", "Single topic node JSON")
  .action(async (opts) => {
    try {
      const provider = getCurriculumProvider(opts.provider);
      if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);
      if (!provider.extractSubTopics) {
        jsonOut({ success: true, subTopics: [] });
        return;
      }

      let topic: TopicNode;
      try {
        topic = JSON.parse(opts.topic);
      } catch {
        jsonError("Invalid --topic JSON");
        return;
      }

      assertVerifiedCurriculumTopic(provider, topic);
      const resolved = provider.resolveTopic(topic);
      const rawHtml = await fetchRawHtml(resolved.uri);
      const { readiness } = extractTopicTextFromRaw(provider, topic, rawHtml);
      if (readiness.status !== "verified") {
        throw insufficientCurriculumTextError(resolved.topicId, readiness);
      }
      const subTopics = provider
        .extractSubTopics(rawHtml, resolved.topicId)
        .map(({ id, label, textLength }) => ({ id, label, textLength }));

      jsonOut({ success: true, topicId: resolved.topicId, subTopics });
    } catch (err) {
      jsonError((err as Error).message || String(err));
    }
  });

// ── zam bridge curriculum-preview-topic ──────────────────────────────────────

bridgeCommand
  .command("curriculum-preview-topic")
  .description(
    "Preview importable cards for one topic (existing + LLM proposals) (JSON)",
  )
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topic <json>", "Single topic node JSON")
  .requiredOption("--domain <domain>", "Subject label for imported card domain")
  .option("--subTopics <json>", "JSON array of sub-topic ids to include")
  .option("--user <id>", "User ID (default: whoami)")
  .option(
    "--knowledge-context <context>",
    "Knowledge context for LLM prompt (repeatable)",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const provider = getCurriculumProvider(opts.provider);
      if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

      let topic: TopicNode;
      try {
        topic = JSON.parse(opts.topic);
      } catch {
        jsonError("Invalid --topic JSON");
        return;
      }

      const resolved = provider.resolveTopic(topic);
      const extracted = await extractAndStoreCurriculumTopics(db, provider, [
        topic,
      ]);
      const item = extracted[0];
      if (!item || item.textLength === 0) {
        jsonError(`No curriculum text extracted for topic "${topic.id}"`);
      }

      const contextNames = parseKnowledgeContextNames(
        opts.knowledgeContext || [],
      );
      const contexts = await resolveKnowledgeContexts(db, contextNames);
      const firstContext = contexts[0]?.name;

      let subTopicIds: string[] | undefined;
      if (opts.subTopics) {
        try {
          subTopicIds = JSON.parse(opts.subTopics);
        } catch {
          jsonError("Invalid --subTopics JSON");
          return;
        }
      }

      const rawHtml = await fetchRawHtml(item.uri);
      const chunks: Array<{ subTopicId: string | null; text: string }> = [];

      if (provider.extractSubTopics) {
        const subTopics = provider.extractSubTopics(rawHtml, resolved.topicId);
        const selected =
          subTopicIds && subTopicIds.length > 0
            ? subTopics.filter((st) => subTopicIds!.includes(st.id))
            : subTopics;

        if (selected.length > 0) {
          for (const st of selected) {
            chunks.push({ subTopicId: st.id, text: st.text });
          }
        }
      }

      if (chunks.length === 0) {
        const topicRow = (await db
          .prepare("SELECT content FROM sources WHERE id = ?")
          .get(item.topicSourceId)) as { content: string | null };
        chunks.push({
          subTopicId: null,
          text: topicRow.content ?? "",
        });
      }

      const existingCards = await listUserCardsForCurriculumTopic(
        db,
        userId,
        provider.id,
        resolved.topicId,
      );
      const existingSlugs = new Set(existingCards.map((c) => c.slug));

      const items: Array<{
        id: string;
        slug: string | null;
        question: string;
        concept: string;
        domain: string;
        bloom_level: number;
        symbiosis_mode: string;
        excerpt: string;
        isExisting: boolean;
        selected: boolean;
        subTopicId: string | null;
        parentTopicId: string;
        proposal?: {
          question: string;
          concept: string;
          domain: string;
          bloom_level: number;
          symbiosis_mode: string;
          excerpt: string;
          page_number: string | null;
          provider: string;
          topic_id: string;
        };
      }> = [];

      for (const card of existingCards) {
        items.push({
          id: `existing:${card.slug}`,
          slug: card.slug,
          question: card.question ?? "",
          concept: card.concept,
          domain: card.domain,
          bloom_level: card.bloomLevel,
          symbiosis_mode: card.symbiosisMode ?? "none",
          excerpt: "",
          isExisting: true,
          selected: true,
          subTopicId: card.topicId?.includes("@")
            ? (card.topicId.split("@").pop() ?? null)
            : null,
          parentTopicId: resolved.topicId,
        });
      }

      const generationChunks = chunks.filter((chunk) => chunk.text.trim());
      const textProvider = await getProviderForRole(db, "text");
      const generatedChunks = await mapWithConcurrency(
        generationChunks,
        textProvider.local ? 1 : 3,
        async (chunk) => ({
          chunk,
          cards: await importCurriculumViaLLM(
            db,
            chunk.text,
            opts.domain,
            item.uri,
            { knowledgeContext: firstContext },
          ),
        }),
      );

      let proposalIndex = 0;
      for (const { chunk, cards } of generatedChunks) {
        const scopedTopicId = chunk.subTopicId
          ? `${resolved.topicId}@${chunk.subTopicId}`
          : resolved.topicId;

        for (const card of cards) {
          const targetDomain =
            (typeof opts.domain === "string" ? opts.domain.trim() : "") ||
            card.domain;
          const slug = proposalBaseSlug(
            targetDomain.split("/")[0] || targetDomain,
            card.question,
            card.concept,
          );
          if (existingSlugs.has(slug)) {
            continue;
          }

          const proposal = {
            question: card.question,
            concept: card.concept,
            domain: targetDomain,
            bloom_level: card.bloom_level,
            symbiosis_mode: card.symbiosis_mode || "none",
            excerpt: card.context || "",
            page_number: null as string | null,
            provider: provider.id,
            topic_id: scopedTopicId,
          };

          items.push({
            id: `new:${proposalIndex++}`,
            slug: null,
            question: proposal.question,
            concept: proposal.concept,
            domain: proposal.domain,
            bloom_level: proposal.bloom_level,
            symbiosis_mode: proposal.symbiosis_mode,
            excerpt: proposal.excerpt,
            isExisting: false,
            selected: true,
            subTopicId: chunk.subTopicId,
            parentTopicId: resolved.topicId,
            proposal,
          });
        }
      }

      if (items.length === 0) {
        jsonError(`No importable cards for topic "${topic.id}"`);
      }

      jsonOut({
        success: true,
        topicId: resolved.topicId,
        sourceId: item.sourceId,
        items,
      });
    });
  });

// ── zam bridge curriculum-confirm-topic ──────────────────────────────────────

bridgeCommand
  .command("curriculum-confirm-topic")
  .description(
    "Create selected new cards and remove deselected existing cards (JSON)",
  )
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topicId <id>", "Resolved curriculum topic id")
  .requiredOption("--sourceId <id>", "Parent page source database ID")
  .requiredOption(
    "--create <json>",
    "JSON array of SourceProposalInput objects to import",
  )
  .requiredOption(
    "--removeSlugs <json>",
    "JSON array of token slugs whose user cards should be deleted",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .option(
    "--knowledge-context <context>",
    "Assign confirmed tokens to a knowledge context (repeatable)",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const provider = getCurriculumProvider(opts.provider);
      if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

      let create: SourceProposalInput[];
      let removeSlugs: string[];
      try {
        create = JSON.parse(opts.create);
        removeSlugs = JSON.parse(opts.removeSlugs);
      } catch {
        jsonError("Invalid --create or --removeSlugs JSON");
        return;
      }

      const contextNames = parseKnowledgeContextNames(
        opts.knowledgeContext || [],
      );
      const contexts = await resolveKnowledgeContexts(db, contextNames);

      try {
        const result = await executeCurriculumConfirmOperations(
          db,
          userId,
          [
            {
              sourceId: opts.sourceId,
              provider: provider.id,
              topicId: opts.topicId,
              create,
              removeSlugs,
            },
          ],
          contexts,
        );
        jsonOut({ success: true, ...result });
      } catch (err) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

// ── zam bridge curriculum-confirm-batch ────────────────────────────────────────

bridgeCommand
  .command("curriculum-confirm-batch")
  .description("Atomically confirm multiple curriculum topic selections (JSON)")
  .requiredOption(
    "--operations <json>",
    "JSON array of {sourceId, provider, topicId, create, removeSlugs}",
  )
  .option("--user <id>", "User ID (default: whoami)")
  .option(
    "--knowledge-context <context>",
    "Assign confirmed tokens to a knowledge context (repeatable)",
    (val, memo: string[]) => {
      memo.push(val);
      return memo;
    },
    [],
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });

      let operations: CurriculumConfirmOperation[];
      try {
        operations = JSON.parse(opts.operations);
      } catch {
        jsonError("Invalid --operations JSON");
        return;
      }

      if (!Array.isArray(operations) || operations.length === 0) {
        jsonError("--operations must be a non-empty JSON array");
      }

      for (const op of operations) {
        if (!op?.sourceId || !op?.provider || !op?.topicId) {
          jsonError("Each operation requires sourceId, provider, and topicId");
        }
        if (!getCurriculumProvider(op.provider)) {
          jsonError(`Unknown curriculum provider: ${op.provider}`);
        }
        if (!Array.isArray(op.create) || !Array.isArray(op.removeSlugs)) {
          jsonError("Each operation requires create and removeSlugs arrays");
        }
      }

      const contextNames = parseKnowledgeContextNames(
        opts.knowledgeContext || [],
      );
      const contexts = await resolveKnowledgeContexts(db, contextNames);

      try {
        const result = await executeCurriculumConfirmOperations(
          db,
          userId,
          operations,
          contexts,
        );
        jsonOut({ success: true, ...result });
      } catch (err) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

// ── zam bridge curriculum-extract-topics ─────────────────────────────────────

bridgeCommand
  .command("curriculum-extract-topics")
  .description(
    "Fetch and extract specific texts for selected curriculum topics (JSON)",
  )
  .requiredOption("--provider <id>", "Curriculum provider id")
  .requiredOption("--topics <json>", "JSON array of selected topic nodes")
  .action(async (opts) => {
    await withDb(async (db) => {
      const provider = getCurriculumProvider(opts.provider);
      if (!provider) jsonError(`Unknown curriculum provider: ${opts.provider}`);

      let topics: TopicNode[];
      try {
        topics = JSON.parse(opts.topics);
      } catch {
        jsonError("Invalid --topics JSON");
        return;
      }

      const extracted = await extractAndStoreCurriculumTopics(
        db,
        provider,
        topics,
      );

      jsonOut({ success: true, extracted });
    });
  });

// ── zam bridge curriculum-get-last-selection ─────────────────────────────────

bridgeCommand
  .command("curriculum-get-last-selection")
  .description("Read the learner's last navigated curriculum path (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const breadcrumb = await getLastCurriculumSelection(db);
      jsonOut({ success: true, breadcrumb: breadcrumb ?? null });
    });
  });

// ── zam bridge curriculum-set-last-selection ─────────────────────────────────

bridgeCommand
  .command("curriculum-set-last-selection")
  .description("Persist the learner's last navigated curriculum path (JSON)")
  .requiredOption(
    "--breadcrumb <json>",
    "JSON breadcrumb: {providerId, schoolType?, grade?, subject?, track?}",
  )
  .action(async (opts) => {
    await withDb(async (db) => {
      let breadcrumb: CurriculumBreadcrumb;
      try {
        breadcrumb = JSON.parse(opts.breadcrumb);
      } catch {
        jsonError("Invalid --breadcrumb JSON");
        return;
      }
      if (!breadcrumb.providerId) {
        jsonError("breadcrumb.providerId is required");
        return;
      }
      await setLastCurriculumSelection(db, breadcrumb);
      jsonOut({ success: true });
    });
  });

// ── zam bridge list-knowledge-contexts ────────────────────────────────────────

bridgeCommand
  .command("list-knowledge-contexts")
  .description("List all knowledge contexts (JSON)")
  .action(async () => {
    await withDb(async (db) => {
      const contexts = await listKnowledgeContexts(db);
      jsonOut({ success: true, contexts });
    });
  });

// ── zam bridge assign-knowledge-context ───────────────────────────────────────

bridgeCommand
  .command("assign-knowledge-context")
  .description("Assign a token to a knowledge context (JSON)")
  .requiredOption("--token <slug>", "Token slug")
  .requiredOption("--context <name>", "Context name")
  .action(async (opts) => {
    await withDb(async (db) => {
      const context = await getKnowledgeContextByName(db, opts.context);
      if (!context) {
        jsonError(`Knowledge context not found: ${opts.context}`);
      }
      const token = await getTokenBySlug(db, opts.token);
      if (!token) {
        jsonError(`Token not found: ${opts.token}`);
      }
      await assignTokenToContext(db, token.id, context.id);
      jsonOut({ success: true, token: token.slug, context: context.name });
    });
  });

// ── zam bridge unassign-knowledge-context ─────────────────────────────────────

bridgeCommand
  .command("unassign-knowledge-context")
  .description("Remove a token from a knowledge context (JSON)")
  .requiredOption("--token <slug>", "Token slug")
  .requiredOption("--context <name>", "Context name")
  .action(async (opts) => {
    await withDb(async (db) => {
      const context = await getKnowledgeContextByName(db, opts.context);
      if (!context) {
        jsonError(`Knowledge context not found: ${opts.context}`);
      }
      const token = await getTokenBySlug(db, opts.token);
      if (!token) {
        jsonError(`Token not found: ${opts.token}`);
      }
      await unassignTokenFromContext(db, token.id, context.id);
      jsonOut({ success: true, token: token.slug, context: context.name });
    });
  });

// ── zam bridge get-active-knowledge-context ───────────────────────────────────

bridgeCommand
  .command("get-active-knowledge-context")
  .description("Get the active knowledge context name (JSON)")
  .action(async () => {
    await withOptionalDb(async (db) => {
      const configured = getActiveWorkspaceContext();
      if (!db) {
        // The name is machine-local; without a database it is reported
        // as-is instead of hiding the machine's configuration (issue #162).
        jsonOut({
          success: true,
          activeContext: configured ?? null,
          staleContext: null,
          validated: false,
        });
        return;
      }
      const active = configured
        ? await getKnowledgeContextByName(db, configured)
        : undefined;
      jsonOut({
        success: true,
        activeContext: active?.name ?? null,
        staleContext: configured && !active ? configured : null,
      });
    });
  });

// ── zam bridge set-active-knowledge-context ───────────────────────────────────

bridgeCommand
  .command("set-active-knowledge-context")
  .description("Set the active knowledge context name (JSON)")
  .argument("[name]", "Context name to use (use empty/none to clear)")
  .action(async (name) => {
    await withOptionalDb(async (db) => {
      if (!name || name === "none" || name === "null" || name === "undefined") {
        if (!setActiveWorkspaceContext(undefined)) {
          jsonError("No active workspace configured");
        }
        jsonOut({ success: true, activeContext: null });
        return;
      }
      if (!db) {
        // Without a database the name cannot be validated; it is still
        // stored machine-locally so the choice survives an outage (#162).
        if (!setActiveWorkspaceContext(name)) {
          jsonError("No active workspace configured");
        }
        jsonOut({ success: true, activeContext: name, validated: false });
        return;
      }
      const context = await getKnowledgeContextByName(db, name);
      if (!context) {
        jsonError(`Knowledge context not found: ${name}`);
        return;
      }
      if (!setActiveWorkspaceContext(context.name)) {
        jsonError("No active workspace configured");
      }
      jsonOut({ success: true, activeContext: context.name });
    });
  });

// ── zam bridge command execution (shared by `serve` and the Studio panel) ──

let commanderConfiguredForJsonExecution = false;

/**
 * Commander throws instead of calling process.exit() on a parse error (e.g.
 * a missing required option), so a malformed cmd/args pair degrades to a
 * JSON error instead of killing the long-lived host process (`bridge serve`
 * or `zam mcp`). Idempotent — safe to call before every execution.
 */
function ensureCommanderThrowsInsteadOfExiting(): void {
  if (commanderConfiguredForJsonExecution) return;
  bridgeCommand.exitOverride();
  for (const sub of bridgeCommand.commands) {
    sub.exitOverride();
  }
  commanderConfiguredForJsonExecution = true;
}

async function runBridgeCommandOnce(
  cmd: string,
  args: string[],
): Promise<unknown> {
  ensureCommanderThrowsInsteadOfExiting();

  // Prevent Commander from writing directly to stdout/stderr; collect it
  // alongside the action's own console output below so a Commander-level
  // parse error (caught via the exitOverride above) still has a message to
  // report.
  let outputBuffer = "";
  const captureOutput = (str: string) => {
    outputBuffer += str;
  };
  bridgeCommand.configureOutput({
    writeOut: captureOutput,
    writeErr: captureOutput,
  });
  for (const sub of bridgeCommand.commands) {
    sub.configureOutput({ writeOut: captureOutput, writeErr: captureOutput });
  }

  // Save whatever console.log/console.error currently are — NOT a
  // module-load-time original. `runMcpServer` rebinds console.log to
  // console.error to protect the stdio transport from stray writes; restoring
  // a stale pristine reference here would undo that protection for the rest
  // of the process.
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (...logArgs) => {
    outputBuffer += `${logArgs
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ")}\n`;
  };
  console.error = (...logArgs) => {
    outputBuffer += `${logArgs
      .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      .join(" ")}\n`;
  };

  // jsonError() only throws (instead of process.exit) in serve mode. Force
  // that mode for the duration of this call and restore it afterwards, so a
  // plain-CLI invocation elsewhere in the same process is unaffected.
  const wasServeMode = isServeMode;
  isServeMode = true;

  try {
    try {
      await bridgeCommand.parseAsync(["node", "bridge", cmd, ...args]);
    } catch (err) {
      let message: string;
      if (err instanceof Error && err.message.startsWith('{"error":')) {
        try {
          message = JSON.parse(err.message).error;
        } catch {
          message = err.message;
        }
      } else if ((err as { code?: string })?.code?.startsWith("commander.")) {
        message = outputBuffer.trim() || (err as Error).message;
      } else {
        message = (err as Error).message || String(err);
      }
      throw new Error(message);
    }
  } finally {
    console.log = originalLog;
    console.error = originalError;
    isServeMode = wasServeMode;
  }

  const trimmed = outputBuffer.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

// The console.log/console.error swap above is process-global, and the MCP
// SDK may run tool handlers concurrently — chain calls on a single promise so
// only one runs at a time. `bridge serve` is already sequential (one NDJSON
// line at a time), so this changes nothing for it.
let bridgeExecutionQueue: Promise<unknown> = Promise.resolve();

/**
 * Run one `zam bridge <cmd> [...args]` subcommand in-process and return its
 * parsed JSON output, or throw a plain Error on failure. This is the same
 * re-parse-through-Commander mechanism `bridge serve` has always used
 * internally; each call opens its own database via the command's own
 * `withDb()` — callers must not assume any particular db handle is threaded
 * through.
 */
export function executeBridgeCommandJson(
  cmd: string,
  args: string[],
): Promise<unknown> {
  const run = bridgeExecutionQueue.then(() => runBridgeCommandOnce(cmd, args));
  // Keep the queue moving regardless of this call's outcome — one caller's
  // rejection must not block, or itself reject, the next caller in line.
  bridgeExecutionQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

// ── zam bridge serve ──────────────────────────────────────────────────────

bridgeCommand
  .command("serve")
  .description("Start the persistent JSON-RPC stdin/stdout server")
  .option("--stdin", "Use stdin/stdout for communication")
  .action(async (_opts) => {
    isServeMode = true;

    // Diagnostic log. A windowed GUI swallows the daemon's stderr, so failures
    // that only happen when the bridge is spawned by the desktop app are
    // otherwise invisible. Logging the resolved environment makes a wrong
    // home directory (→ missing credentials → empty database) obvious.
    const {
      appendFileSync,
      existsSync: fileExists,
      mkdirSync: makeDir,
    } = await import("node:fs");
    const nodeOs = await import("node:os");
    const nodePath = await import("node:path");
    const logDir = nodePath.join(nodeOs.homedir(), ".zam");
    const logPath = nodePath.join(logDir, "desktop-bridge.log");
    const logDiag = (msg: string): void => {
      try {
        if (!fileExists(logDir)) makeDir(logDir, { recursive: true });
        appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
      } catch {
        // best-effort only — never let logging break the bridge
      }
    };
    logDiag(
      `serve start | homedir=${nodeOs.homedir()} | USERPROFILE=${
        process.env.USERPROFILE ?? ""
      } | HOME=${process.env.HOME ?? ""} | cwd=${process.cwd()}`,
    );

    const processRequest = async (line: string): Promise<string> => {
      let requestId: string | number | null = null;
      try {
        const req = JSON.parse(line);
        requestId = req.id ?? null;
        const cmd = req.cmd;
        const args = req.args ?? [];

        if (typeof req.stdin === "string") {
          serveStdinPayload = req.stdin;
        } else if (typeof req.stdin === "object" && req.stdin !== null) {
          serveStdinPayload = JSON.stringify(req.stdin);
        } else {
          serveStdinPayload = undefined;
        }

        if (!cmd) {
          return JSON.stringify({
            id: requestId,
            error: "Missing 'cmd' field",
          });
        }

        try {
          const result = await executeBridgeCommandJson(cmd, args);
          return JSON.stringify({ id: requestId, result });
        } catch (err) {
          return JSON.stringify({
            id: requestId,
            error: (err as Error).message || String(err),
          });
        }
      } catch (err) {
        return JSON.stringify({
          id: requestId,
          error: `Invalid JSON request: ${(err as Error).message}`,
        });
      } finally {
        serveStdinPayload = undefined;
      }
    };

    const readline = await import("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    // Process requests strictly one at a time. Responses must be written to
    // stdout in the order their requests arrived; executeBridgeCommandJson()
    // separately mutexes the console-swapping execution itself, but that
    // only serialises the swap, not response ordering. Chaining on a single
    // promise here guarantees both, regardless of how fast lines arrive.
    process.on("unhandledRejection", (reason) => {
      logDiag(`unhandledRejection: ${String(reason)}`);
    });

    let pending: Promise<void> = Promise.resolve();
    rl.on("line", (line) => {
      if (!line.trim()) return;
      pending = pending
        .then(async () => {
          const response = await processRequest(line);
          process.stdout.write(`${response}\n`);
        })
        .catch((err) => {
          logDiag(`serve request failed: ${(err as Error).message || err}`);
          try {
            process.stdout.write(
              `${JSON.stringify({ id: null, error: (err as Error).message || String(err) })}\n`,
            );
          } catch {
            // best-effort only
          }
        });
    });
  });

// ── zam bridge local-vision-status / local-vision-setup ─────────────────────

bridgeCommand
  .command("local-vision-status")
  .description(
    "Report local image-analysis readiness (JSON): Ollama install/server, " +
      "Qwen3-VL 4B presence, registry entry, and usability.",
  )
  .action(async () => {
    await withDb(async (db) => {
      jsonOut(await getLocalVisionStatus(db));
    });
  });

bridgeCommand
  .command("local-vision-setup")
  .description(
    "Enable local image analysis (JSON): pull Qwen3-VL 4B into a running " +
      "Ollama if needed and register it for ZAM's image role.",
  )
  .action(async () => {
    await withDb(async (db) => {
      const result = await enableLocalVision(db);
      if (!result.ok) {
        jsonOut({
          ok: false,
          error: result.error,
          needsOllama: result.needsOllama === true,
          status: result.status,
        });
        return;
      }
      jsonOut({
        ok: true,
        pulled: result.pulled === true,
        status: result.status,
      });
    });
  });

// ── zam bridge bundled-cells-list / bundled-cell-enrol ──────────────────────

bridgeCommand
  .command("bundled-cells-list")
  .description("List bundled learning cells and enrolment status (JSON)")
  .option("--user <userId>", "User ID to check status for")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleListBundledCells(db, { user: opts.user });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

bridgeCommand
  .command("bundled-cell-enrol <cellId>")
  .description("Install and enrol in a bundled learning cell (JSON)")
  .option("--user <userId>", "User ID to enrol")
  .action(async (cellId, opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleEnrolBundledCell(db, {
          cellId,
          user: opts.user,
        });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

// ── zam bridge preconditions-get / precondition-assess ──────────────────────

bridgeCommand
  .command("preconditions-get")
  .description(
    "Get foundational precondition atoms and assessment status (JSON)",
  )
  .option("--cell <cellId>", "Filter to prerequisites of a specific cell")
  .option("--user <userId>", "User ID to inspect")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleGetPreconditions(db, {
          cellId: opts.cell,
          user: opts.user,
        });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

bridgeCommand
  .command("precondition-assess <atomId> <decision>")
  .description(
    "Record self-assessment decision for a precondition atom ('known' | 'learn') (JSON)",
  )
  .option("--user <userId>", "User ID")
  .action(async (atomId, decision, opts) => {
    await withDb(async (db) => {
      try {
        if (decision !== "known" && decision !== "learn") {
          throw new Error("decision must be 'known' or 'learn'");
        }
        const result = await handleAssessPrecondition(db, {
          atomId,
          decision,
          user: opts.user,
        });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

// ── zam bridge pull-forward-candidates / pull-forward-execute ───────────────

bridgeCommand
  .command("pull-forward-candidates")
  .description(
    "List prioritized candidates that can be pulled forward into the queue (JSON)",
  )
  .option("--limit <count>", "Maximum number of candidates", parseInt)
  .option("--user <userId>", "User ID to inspect")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleGetPullForwardCandidates(db, {
          limit: opts.limit,
          user: opts.user,
        });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

bridgeCommand
  .command("pull-forward-execute")
  .description(
    "Pull forward specified cards into the review queue (JSON input via stdin or --cards)",
  )
  .option("--cards <cardIds...>", "List of card IDs to pull forward")
  .option("--user <userId>", "User ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const cardIds: string[] = opts.cards ?? [];
        const result = await handlePullForwardCards(db, {
          cardIds,
          user: opts.user,
        });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

// ── zam bridge bonus-candidates-list / bonus-atom-enrol ─────────────────────

bridgeCommand
  .command("bonus-candidates-list")
  .description(
    "List bonus learning candidate atoms sitting at the edge of current mastery (JSON)",
  )
  .option(
    "--cell <cellId>",
    "Curriculum cell ID (to exclude its in-scope atoms)",
  )
  .option("--limit <count>", "Maximum candidates to return", parseInt)
  .option("--user <userId>", "User ID to inspect")
  .action(async (opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleListBonusCandidates(db, {
          cellId: opts.cell,
          limit: opts.limit,
          user: opts.user,
        });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });

bridgeCommand
  .command("bonus-atom-enrol <atomId>")
  .description(
    "Accept and enrol in a bonus atom by creating practice cards (JSON)",
  )
  .option("--user <userId>", "User ID")
  .action(async (atomId, opts) => {
    await withDb(async (db) => {
      try {
        const result = await handleEnrolBonusAtom(db, {
          atomId,
          user: opts.user,
        });
        jsonOut(result);
      } catch (err: unknown) {
        jsonError((err as Error).message || String(err));
      }
    });
  });
