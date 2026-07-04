/**
 * `zam bridge` — Machine-readable JSON protocol for AI integration.
 *
 * All output is valid JSON only. No human-readable formatting.
 * Errors are also JSON: { "error": "message" }
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Command } from "commander";
import { ulid } from "ulid";
import type {
  BloomLevel,
  Database,
  NeighborhoodToken,
  Rating,
  ReviewActionType,
  SymbiosisMode,
  TokenPattern,
} from "../../kernel/index.js";
import {
  analyzeObservation,
  appendUiObservationReport,
  BUILT_IN_SENSITIVE_MATCHERS,
  buildReviewQueue,
  clearProviderApiKey,
  confirmCardSplit,
  confirmFoundations,
  confirmSourceImport,
  createToken,
  decidePostCapture,
  decidePreCapture,
  deleteCardForUser,
  deleteToken,
  discoverSkills,
  embeddingContentForToken,
  endSession,
  ensureCard,
  executeReviewAction,
  generateConceptFreeCue,
  generatePrompt,
  generateTokenSlug,
  getAgentSkill,
  getCard,
  getCardDeletionImpact,
  getConfiguredWorkspaces,
  getDatabaseTargetInfo,
  getDueCards,
  getProviderApiKey,
  getSetting,
  getSystemProfile,
  getTokenBySlug,
  getTokenDeleteImpact,
  getTokenNeighborhood,
  hasCommand,
  importCurriculumCards,
  isObserverPolicyConfigured,
  isOllamaInstalled,
  listAgentSkills,
  listPersonalCards,
  listProviderApiKeyRefs,
  listTokens,
  monitorLogExists,
  OBSERVER_POLICY_UNSET_HINT,
  openDatabase,
  pairCommands,
  readMonitorLog,
  readUiObservationLog,
  resolveObserverPolicy,
  resolveReviewContext,
  searchTokensHybrid,
  setProviderApiKey,
  setSetting,
  slugify,
  startSession,
  suggestFoundations,
  syncObserverSidecarPolicy,
  uiObservationLogExists,
  updateToken,
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
  AGENT_HARNESSES,
  getHarness,
  launchHarness,
  resolveHarnessExecutable,
} from "../agent-harness.js";
import {
  CURRICULUM_PROVIDERS,
  type CurriculumBreadcrumb,
  type CurriculumLevel,
  type CurriculumSelection,
  getCurriculumProvider,
  getLastCurriculumSelection,
  setLastCurriculumSelection,
  type TopicNode,
} from "../curriculum/index.js";
import {
  type ApiFlavor,
  checkVisionReadiness,
  DEFAULT_LLM_MODEL,
  DEFAULT_LLM_URL,
  ensureHighQualityQuestion,
  ensureLlmReadyHeadless,
  evaluateAnswerViaLLM,
  generateFoundationsProposalsViaLLM,
  generateSplitProposalsViaLLM,
  getAvailableModels,
  getCloudModelRecommendation,
  getLlmConfig,
  getProviderForRole,
  getProviderRoleStatus,
  importCurriculumViaLLM,
  isLlmOnline,
  type LlmRole,
  translateQuestionViaLLM,
} from "../llm/client.js";
import {
  embedQuery,
  ensureTokenEmbeddings,
  findPossibleDuplicates,
} from "../llm/embedder.js";
import { observeUiSnapshotViaLLM } from "../llm/vision.js";
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
  upsertProviderRecord,
  VALID_API_FLAVORS,
  VALID_ROLES,
  withProviderScope,
  writeScopedProviders,
  writeScopedRoles,
} from "../providers/config.js";
import {
  inspectSkillLinks,
  parseSetupAgents,
  type SkillLinkHealth,
  type SkillLinkState,
  summarizeSkillLinkHealth,
  wireSkills,
} from "../provisioning/index.js";
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
import { withDb as sharedWithDb } from "./shared/db.js";

let isServeMode = false;
let serveStdinPayload: string | undefined;

function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
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

interface ReviewTargetRow {
  card_id: string;
  token_id: string;
  user_id: string;
  slug: string;
}

async function getReviewTarget(
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

function parseTokenUpdates(opts: {
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
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const dueCards = await getDueCards(db, userId, undefined, opts.domain);
      const domains = [
        ...new Set(dueCards.map((c) => c.domain).filter(Boolean)),
      ].sort();

      jsonOut({
        userId,
        domain: opts.domain ?? null,
        dueCount: dueCards.length,
        domains,
        cards: dueCards.map((c) => ({
          cardId: c.id,
          tokenId: c.token_id,
          slug: c.slug,
          concept: c.concept,
          domain: c.domain,
          bloomLevel: c.bloom_level,
          state: c.state,
          dueAt: c.due_at,
        })),
      });
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

// ── zam bridge workspace-info / set-workspace-dir ──────────────────────────

bridgeCommand
  .command("workspace-info")
  .description("Report the workspace dir, its default, and the data dir (JSON)")
  .action(async () => {
    await withDb(async (db) => {
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
    await withDb(async (db) => {
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
      });
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
    await withDb(async (db) => {
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

    await withDb(async (db) => {
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
    await withDb(async (db) => {
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
      const harnesses = await Promise.all(
        AGENT_HARNESSES.map(async (h) => {
          const override =
            (await getSetting(db, `agent.${h.id}.command`)) || undefined;
          return {
            id: h.id,
            label: h.label,
            kind: h.kind,
            detected: resolveHarnessExecutable(h, override) !== null,
          };
        }),
      );
      const fallbackDefault = harnesses.find((h) => h.detected)?.id ?? null;
      jsonOut({ harnesses, default: configuredDefault ?? fallbackDefault });
    });
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
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const queue = await buildReviewQueue(db, {
        userId,
        maxReviews: 1,
        maxNew: 1,
      });

      if (queue.items.length === 0) {
        jsonOut({
          userId,
          hasReview: false,
          card: null,
          prompt: null,
          resolvedContext: null,
          queueSize: 0,
        });
        return;
      }

      const item = queue.items[0];
      const isLlmEnabled = (await getSetting(db, "llm.enabled")) === "true";

      // Dynamically generate a fresh, living active-recall question if LLM is enabled
      let resolvedQuestion = item.question;
      let questionSource: "llm" | "original" = "original";
      let questionModel: string | undefined;
      if (isLlmEnabled && opts.dynamicQuestion !== false) {
        try {
          const healed = await ensureHighQualityQuestion(db, {
            id: item.tokenId,
            slug: item.slug,
            concept: item.concept,
            domain: item.domain,
            bloomLevel: item.bloomLevel as BloomLevel,
            sourceLink: item.sourceLink,
            question: item.question,
          });
          if (healed) {
            resolvedQuestion = healed.question;
            questionSource = healed.source;
            questionModel = healed.model;
          }
        } catch {
          // ignore and proceed
        }
      }

      const prompt = generatePrompt({
        cardId: item.cardId,
        tokenId: item.tokenId,
        slug: item.slug,
        concept: item.concept,
        domain: item.domain,
        bloomLevel: item.bloomLevel as BloomLevel,
        sourceLink: item.sourceLink,
        question: resolvedQuestion,
      });

      // Resolve the source_link into ready-to-use context for the AI client.
      // Defensive: never let a bad/unreachable reference break the review payload.
      let resolvedContext = null;
      if (opts.resolve !== false) {
        try {
          resolvedContext = await resolveReviewContext(item.sourceLink);
        } catch {
          resolvedContext = null;
        }
      }

      // Get full queue size for context
      const fullQueue = await buildReviewQueue(db, { userId });

      jsonOut({
        userId,
        hasReview: true,
        card: item,
        prompt,
        questionSource,
        questionModel: questionModel ?? null,
        resolvedContext,
        queueSize: fullQueue.items.length,
      });
    });
  });

// ── zam bridge submit ─────────────────────────────────────────────────────

bridgeCommand
  .command("submit")
  .description("Submit a rating for a card (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--card-id <id>", "Card ID")
  .requiredOption("--rating <n>", "Rating (1-4)")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const rating = Number(opts.rating) as Rating;
      if (rating < 1 || rating > 4) {
        jsonError("Rating must be between 1 and 4");
      }

      const result = await executeReviewAction(db, {
        action: "rate",
        cardId: opts.cardId,
        userId,
        rating,
      });

      jsonOut({
        success: true,
        rating,
        evaluation: result.evaluation,
        blocked: result.blocked ?? null,
      });
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
      const userId = await resolveUser(opts, db, { json: true });
      const action = opts.action as ReviewActionType;
      const validActions: ReviewActionType[] = [
        "rate",
        "skip",
        "edit-token",
        "deprecate-token",
        "delete-token",
        "delete-card",
        "stop",
      ];
      if (!validActions.includes(action)) {
        jsonError(`Unsupported action: ${opts.action}`);
      }

      const target = await getReviewTarget(db, opts.cardId, userId);
      if (
        (action === "delete-token" || action === "delete-card") &&
        !opts.confirm
      ) {
        if (action === "delete-token") {
          jsonOut({
            success: true,
            action,
            preview: true,
            requiresConfirmation: true,
            token: { slug: target.slug, tokenId: target.token_id },
            impact: await getTokenDeleteImpact(db, target.slug),
          });
          return;
        }

        jsonOut({
          success: true,
          action,
          preview: true,
          requiresConfirmation: true,
          token: { slug: target.slug, tokenId: target.token_id },
          impact: await getCardDeletionImpact(db, target.token_id, userId),
        });
        return;
      }

      const rating =
        opts.rating !== undefined ? (Number(opts.rating) as Rating) : undefined;
      if (action === "rate" && (rating == null || rating < 1 || rating > 4)) {
        jsonError("Rating must be between 1 and 4 for action=rate");
      }

      const result = await executeReviewAction(db, {
        action,
        cardId: opts.cardId,
        userId,
        rating,
        tokenUpdates:
          action === "edit-token" ? parseTokenUpdates(opts) : undefined,
      });

      jsonOut({
        success: true,
        action,
        token: {
          slug: result.token.slug,
          tokenId: result.token.id,
        },
        rating: rating ?? null,
        evaluation: result.evaluation ?? null,
        blocked: result.blocked ?? null,
        updatedToken: result.updatedToken ?? null,
        deletedToken: result.deletedToken ?? null,
        deletedCard: result.deletedCard ?? null,
        skipped: result.skipped ?? false,
        stopped: result.stopped ?? false,
      });
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
      const userId = await resolveUser(opts, db, { json: true });
      const session = await startSession(db, {
        user_id: userId,
        task: opts.task,
        execution_context: context,
      });
      const observerPolicyHint =
        context === "ui" && !(await isObserverPolicyConfigured(db))
          ? OBSERVER_POLICY_UNSET_HINT
          : undefined;
      jsonOut({
        id: session.id,
        userId: session.user_id,
        task: session.task,
        executionContext: session.execution_context,
        startedAt: session.started_at,
        completedAt: session.completed_at,
        ...(observerPolicyHint ? { observerPolicyHint } : {}),
      });
    });
  });

bridgeCommand
  .command("end-session")
  .description("Complete an active ZAM learning session (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action(async (opts) => {
    await withDb(async (db) => {
      const session = await endSession(db, opts.session);
      jsonOut({
        id: session.id,
        userId: session.user_id,
        task: session.task,
        executionContext: session.execution_context,
        startedAt: session.started_at,
        completedAt: session.completed_at,
      });
    });
  });

// ── zam bridge get-monitor ────────────────────────────────────────────────

bridgeCommand
  .command("get-monitor")
  .description("Read monitor log for a session (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action((opts) => {
    if (!monitorLogExists(opts.session)) {
      jsonOut({
        sessionId: opts.session,
        exists: false,
        commands: [],
        timeSpan: null,
      });
      return;
    }

    const events = readMonitorLog(opts.session);
    const commands = pairCommands(events);

    let timeSpan: { start: string; end: string; durationMs: number } | null =
      null;
    if (commands.length > 0) {
      const first = commands[0];
      const last = commands[commands.length - 1];
      const endTs = last.endedAt ?? last.startedAt;
      timeSpan = {
        start: first.startedAt,
        end: endTs,
        durationMs:
          new Date(endTs).getTime() - new Date(first.startedAt).getTime(),
      };
    }

    jsonOut({
      sessionId: opts.session,
      exists: true,
      commands: commands.map((c) => ({
        seq: c.seq,
        command: c.command,
        cwd: c.cwd,
        startedAt: c.startedAt,
        endedAt: c.endedAt,
        durationMs: c.durationMs,
        exitCode: c.exitCode,
      })),
      timeSpan,
    });
  });

// ── zam bridge analyze-monitor ───────────────────────────────────────────

bridgeCommand
  .command("analyze-monitor")
  .description("Analyze monitor log with token patterns from stdin (JSON)")
  .requiredOption("--session <id>", "Session ID")
  .action(async (opts) => {
    try {
      if (!monitorLogExists(opts.session)) {
        jsonOut({
          sessionId: opts.session,
          ratings: [],
          unmatchedCommands: [],
          timeSpan: null,
        });
        return;
      }

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

      const events = readMonitorLog(opts.session);
      const commands = pairCommands(events);
      const result = analyzeObservation(commands, data?.patterns);

      jsonOut({
        sessionId: opts.session,
        ...result,
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
    await withDb(async (db) => {
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
        concept: string;
        domain?: string;
        bloom_level?: number;
        context?: string;
        symbiosis_mode?: string | null;
        source_link?: string | null;
        question?: string | null;
      };

      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      if (!data?.slug || !data?.concept) {
        jsonError("JSON must include 'slug' and 'concept' fields");
      }

      const userId = await resolveUser(opts, db, { json: true });

      const possibleDuplicates = await findPossibleDuplicates(db, {
        concept: data?.concept,
        question: data?.question ?? null,
        domain: data?.domain,
      });

      const token = await createToken(db, {
        slug: data?.slug,
        concept: data?.concept,
        domain: data?.domain,
        bloom_level: (data?.bloom_level ?? 1) as BloomLevel,
        context: data?.context,
        symbiosis_mode: data?.symbiosis_mode as
          | "shadowing"
          | "copilot"
          | "autonomy"
          | null
          | undefined,
        source_link: data?.source_link ?? null,
        question: data?.question ?? null,
      });

      const card = await ensureCard(db, token.id, userId);

      // Best effort embedding top-up so this token is immediately search-ready.
      try {
        await ensureTokenEmbeddings(db, { limit: 8 });
      } catch {
        // ignore
      }

      jsonOut({
        success: true,
        token,
        card: {
          id: card.id,
          tokenId: card.token_id,
          userId: card.user_id,
          state: card.state,
          dueAt: card.due_at,
          blocked: card.blocked,
        },
        possible_duplicates: possibleDuplicates,
      });
    });
  });

// ── zam bridge relevant-tokens ────────────────────────────────────────────

bridgeCommand
  .command("relevant-tokens")
  .description("Find tokens relevant to a given context")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
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

      const userId = await resolveUser(opts, db, { json: true });

      // Truncate to 2000 chars before embedding
      const truncatedContext = data.context.slice(0, 2000);

      const q = await embedQuery(db, truncatedContext);

      // Best effort embedding top-up, including same-model dimension changes.
      try {
        await ensureTokenEmbeddings(db, {
          limit: 32,
          dims: q?.vector.length,
        });
      } catch {
        // ignore
      }

      let limit = data.limit ?? 10;
      if (typeof limit !== "number" || limit <= 0 || !Number.isInteger(limit)) {
        limit = 10;
      }
      if (limit > 100) {
        limit = 100;
      }

      const results = await searchTokensHybrid(db, truncatedContext, {
        queryEmbedding: q?.vector,
        model: q?.model,
        limit,
      });

      const tokens = [];
      for (const t of results) {
        const card = await getCard(db, t.id, userId);
        tokens.push({
          slug: t.slug,
          concept: t.concept,
          domain: t.domain,
          bloom_level: t.bloom_level,
          score: t.score,
          similarity: t.similarity,
          card: card
            ? {
                state: card.state,
                due_at: card.due_at,
                blocked: card.blocked,
              }
            : null,
        });
      }

      jsonOut({
        semantic: q !== null,
        tokens,
      });
    });
  });

// ── zam bridge suggest-foundations ────────────────────────────────────────

bridgeCommand
  .command("suggest-foundations")
  .description("Propose existing tokens as foundation/prerequisite candidates")
  .option("--user <id>", "User ID (default: whoami)")
  .action(async (opts) => {
    await withDb(async (db) => {
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
        bloom_level?: number;
        limit?: number;
      };

      try {
        data = JSON.parse(raw);
      } catch {
        jsonError("Invalid JSON input");
      }

      let queryText = "";
      let targetTokenId: string | undefined;
      let targetBloomLevel: BloomLevel | undefined;
      let targetJson: { slug: string } | null = null;

      if (data?.slug !== undefined) {
        if (typeof data.slug !== "string" || data.slug.trim() === "") {
          jsonError("Invalid slug");
        }
        const token = await getTokenBySlug(db, data.slug);
        if (!token) {
          jsonError(`Token not found: ${data.slug}`);
        }
        queryText = embeddingContentForToken(token);
        targetTokenId = token.id;
        targetBloomLevel = token.bloom_level;
        targetJson = { slug: token.slug };
      } else {
        if (
          !data?.concept ||
          typeof data.concept !== "string" ||
          data.concept.trim() === ""
        ) {
          jsonError("JSON must include a non-empty 'slug' or 'concept' field");
        }
        queryText = embeddingContentForToken({
          concept: data.concept,
          question: typeof data.question === "string" ? data.question : null,
          domain: typeof data.domain === "string" ? data.domain : "",
        });
        if (data.bloom_level !== undefined) {
          if (
            typeof data.bloom_level !== "number" ||
            !Number.isInteger(data.bloom_level) ||
            data.bloom_level < 1 ||
            data.bloom_level > 5
          ) {
            jsonError("bloom_level must be an integer between 1 and 5");
          }
          targetBloomLevel = data.bloom_level as BloomLevel;
        }
      }

      let limit = data?.limit ?? 5;
      if (typeof limit !== "number" || limit <= 0 || !Number.isInteger(limit)) {
        limit = 5;
      }
      if (limit > 20) {
        limit = 20;
      }

      const _userId = await resolveUser(opts, db, { json: true });

      const q = await embedQuery(db, queryText);
      if (q === null) {
        jsonOut({
          semantic: false,
          target: targetJson,
          suggestions: [],
        });
        return;
      }

      try {
        await ensureTokenEmbeddings(db, {
          limit: 100,
          dims: q.vector.length,
        });
      } catch {
        // ignore
      }

      const thresholdStr = await getSetting(db, "search.dedup_threshold");
      const parsedThreshold = thresholdStr
        ? Number.parseFloat(thresholdStr)
        : Number.NaN;
      const maxSimilarity =
        Number.isFinite(parsedThreshold) &&
        parsedThreshold > 0 &&
        parsedThreshold <= 1
          ? parsedThreshold
          : 0.85;

      const minSimilarityStr = await getSetting(
        db,
        "search.suggest_min_similarity",
      );
      const parsedMin = minSimilarityStr
        ? Number.parseFloat(minSimilarityStr)
        : Number.NaN;
      const minSimilarity =
        Number.isFinite(parsedMin) && parsedMin > 0 && parsedMin <= 1
          ? parsedMin
          : 0.45;

      const suggestions = await suggestFoundations(db, {
        queryEmbedding: q.vector,
        model: q.model,
        targetTokenId,
        targetBloomLevel,
        limit,
        minSimilarity,
        maxSimilarity,
      });

      jsonOut({
        semantic: true,
        target: targetJson,
        suggestions: suggestions.map((s) => ({
          slug: s.token.slug,
          concept: s.token.concept,
          domain: s.token.domain,
          bloom_level: s.token.bloom_level,
          similarity: s.similarity,
          already_prerequisite: s.alreadyPrerequisite,
          would_create_cycle: s.wouldCreateCycle,
          bloom_above_target: s.bloomAboveTarget,
        })),
      });
    });
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
      const nextRoles = bindRoleProviders(
        roles,
        opts.role as LlmRole,
        opts.primary,
        opts.fallback,
      );
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
  .requiredOption("--key <value>", "API key value (write-only)")
  .action((opts) => {
    const key = opts.key.trim();
    if (!key) jsonError("No key provided.");
    setProviderApiKey(opts.ref, key);
    jsonOut({ ok: true, ref: opts.ref, masked: maskSecret(key) });
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

bridgeCommand
  .command("cloud-model-hint")
  .description("Suggest a cloud model for an endpoint URL (JSON)")
  .requiredOption("--url <url>", "Endpoint base URL")
  .action((opts) => {
    jsonOut({ recommendation: getCloudModelRecommendation(opts.url) });
  });

bridgeCommand
  .command("local-llm-hints")
  .description("Detect installed local LLM servers and suggest defaults (JSON)")
  .action(() => {
    const profile = getSystemProfile();
    const flmInstalled =
      hasCommand("flm") || existsSync("C:\\Program Files\\flm\\flm.exe");
    const ollamaInstalled = isOllamaInstalled();
    const runners = [
      { id: "flm", label: "FastFlowLM", installed: flmInstalled },
      { id: "ollama", label: "Ollama", installed: ollamaInstalled },
      {
        id: "foundry-local",
        label: "Foundry Local",
        installed: false,
      },
    ];

    let recommended = "ollama";
    if (profile.recommendedRunner === "fastflowlm" && flmInstalled) {
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
      recommended === "ollama" ? "http://localhost:11434/v1" : DEFAULT_LLM_URL;

    jsonOut({
      runners,
      recommended,
      defaultUrl,
      defaultModel: profile.recommendedModel || DEFAULT_LLM_MODEL,
    });
  });

// Settings the Studio UI may write through the generic setter. Secret-bearing
// keys (llm.api_key) and structured provider config (llm.providers/llm.roles)
// must go through their dedicated commands, never this escape hatch.
const UI_WRITABLE_SETTINGS = new Set([
  "llm.enabled",
  "llm.vision.enabled",
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
      jsonOut({
        userId,
        locale,
        llm: { enabled, url, model },
        activeWorkspaceId,
        workspaceDir,
        skillLinks,
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
      });
    });
  });

// ── zam bridge database-status / database-select-user ───────────────────────

interface DatabaseUserSummary {
  id: string;
  cardCount: number;
}

async function readDatabaseUserSummaries(
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
    const target = getDatabaseTargetInfo();
    await withDb(async (db) => {
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
  .option("--domain <domain>", "Filter by domain")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = opts.user
        ? await resolveUser(opts, db, { json: true })
        : undefined;
      const tokens = await listTokens(
        db,
        opts.domain ? { domain: opts.domain } : undefined,
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

      const out = tokens.map((t) => {
        const c = cardMap.get(t.id);
        return {
          id: t.id,
          slug: t.slug,
          concept: t.concept,
          domain: t.domain,
          bloomLevel: t.bloom_level,
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

      const mapToken = (nt: NeighborhoodToken) => ({
        id: nt.id,
        slug: nt.slug,
        concept: nt.concept,
        domain: nt.domain,
        bloomLevel: nt.bloom_level,
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
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const cards = await listPersonalCards(db, userId, {
        query: opts.query,
        domain: opts.domain,
      });
      jsonOut({ cards });
    });
  });

// ── zam bridge personal-card-create ────────────────────────────────────────

bridgeCommand
  .command("personal-card-create")
  .description("Atomically create a token and its personal card (JSON)")
  .option("--user <id>", "User ID (default: whoami)")
  .requiredOption("--concept <concept>", "Concept description / answer")
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
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });

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
          concept: opts.concept,
          domain: opts.domain,
          bloom_level: bloom,
          context: opts.context,
          symbiosis_mode: mode,
          source_link: opts.sourceLink || null,
          question,
        });
        const createdCard = await ensureCard(tx, createdToken.id, userId);
        return { token: createdToken, card: createdCard };
      });

      jsonOut({
        success: true,
        token: {
          id: token.id,
          slug: token.slug,
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
        concept?: string;
        domain?: string;
        bloom_level?: BloomLevel;
        context?: string;
        symbiosis_mode?: SymbiosisMode | null;
        source_link?: string | null;
        question?: string | null;
      } = {};

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
          token: { id: token.id, slug: token.slug },
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
          token: { id: token.id, slug: token.slug },
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
  .requiredOption("--text <text>", "Curriculum syllabus/content text")
  .requiredOption(
    "--domain <domain>",
    "Default category/domain for imported cards",
  )
  .option("--source <url>", "Provenance source link or URL")
  .option("--preview", "Return parsed cards without saving them")
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });

      const cards = await importCurriculumViaLLM(
        db,
        opts.text,
        opts.domain,
        opts.source || null,
      );

      if (opts.preview) {
        jsonOut({
          success: true,
          proposals: cards,
        });
        return;
      }

      const result = await importCurriculumCards(db, userId, cards);

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
  .action(async (opts) => {
    await withDb(async (db) => {
      const userId = await resolveUser(opts, db, { json: true });
      const proposals = JSON.parse(opts.proposals);

      const result = await confirmSourceImport(
        db,
        userId,
        opts.sourceId,
        proposals,
      );

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

async function fetchRawHtml(url: string): Promise<string> {
  if (!(await isSafeUrl(url))) {
    throw new Error(`Access denied to unsafe target URL: ${url}`);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "ZAM-Content-Studio/0.6.3",
      },
    });
    if (!res.ok) {
      throw new Error(`Web server responded with status ${res.status}`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    return await res.text();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Connection request timed out after 10 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

      // Group topics by their resolved source URI
      const topicsByUri = new Map<string, TopicNode[]>();
      for (const topic of topics) {
        const resolved = provider.resolveTopic(topic);
        const list = topicsByUri.get(resolved.uri) || [];
        list.push(topic);
        topicsByUri.set(resolved.uri, list);
      }

      const extracted: Array<{
        topicId: string;
        uri: string;
        sourceId: string;
        text: string;
      }> = [];

      for (const [uri, uriTopics] of topicsByUri.entries()) {
        const rawHtml = await fetchRawHtml(uri);

        let extractedTexts: Record<string, string> = {};
        if (provider.extractTopics) {
          const fullTopicIds = uriTopics.map((t) => `${t.sourceRef}#${t.id}`);
          extractedTexts = provider.extractTopics(rawHtml, fullTopicIds);
        } else {
          const cleanText = cleanHtml(rawHtml);
          for (const t of uriTopics) {
            extractedTexts[`${t.sourceRef}#${t.id}`] = cleanText;
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
          const text = extractedTexts[resolved.topicId] || "";
          extracted.push({
            topicId: resolved.topicId,
            uri,
            sourceId: record.id,
            text,
          });
        }
      }

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

    // Configure exitOverride so commander doesn't process.exit on parsing errors
    bridgeCommand.exitOverride();
    for (const cmd of bridgeCommand.commands) {
      cmd.exitOverride();
    }

    // Prevent Commander from writing directly to stdout/stderr
    let outputBuffer = "";
    const outputOpts = {
      writeOut: (str: string) => {
        outputBuffer += str;
      },
      writeErr: (str: string) => {
        outputBuffer += str;
      },
    };
    bridgeCommand.configureOutput(outputOpts);
    for (const cmd of bridgeCommand.commands) {
      cmd.configureOutput(outputOpts);
    }

    const processRequest = async (line: string): Promise<string> => {
      outputBuffer = "";
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

        try {
          await bridgeCommand.parseAsync(["node", "bridge", cmd, ...args]);
        } catch (err) {
          if (err instanceof Error && err.message.startsWith('{"error":')) {
            try {
              const parsed = JSON.parse(err.message);
              return JSON.stringify({ id: requestId, error: parsed.error });
            } catch {
              return JSON.stringify({ id: requestId, error: err.message });
            }
          }
          if ((err as { code?: string }).code?.startsWith("commander.")) {
            return JSON.stringify({
              id: requestId,
              error: outputBuffer.trim() || (err as Error).message,
            });
          }
          return JSON.stringify({
            id: requestId,
            error: (err as Error).message || String(err),
          });
        } finally {
          console.log = originalLog;
          console.error = originalError;
        }

        // Parse stdout accumulated output
        let result: unknown;
        const trimmed = outputBuffer.trim();
        try {
          result = JSON.parse(trimmed);
        } catch {
          result = trimmed;
        }

        return JSON.stringify({ id: requestId, result });
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

    // Process requests strictly one at a time. processRequest() relies on a
    // shared output buffer and temporarily swaps the global console methods, so
    // overlapping executions would corrupt each other's responses. Chaining on
    // a single promise serialises them regardless of how fast lines arrive.
    let pending: Promise<void> = Promise.resolve();
    rl.on("line", (line) => {
      if (!line.trim()) return;
      pending = pending.then(async () => {
        const response = await processRequest(line);
        process.stdout.write(`${response}\n`);
      });
    });
  });
