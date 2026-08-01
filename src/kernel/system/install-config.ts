/**
 * Per-machine install configuration — Increment 12, Phase 3.
 *
 * Records whether this machine runs ZAM in "developer" mode (source checkout,
 * git-backed workspace, manual `git`/`npm` updates) or "default" mode (an
 * installed application updated through a package manager or the in-app
 * updater). Stored in ~/.zam/config.json — a per-machine file, NOT the database
 * and NOT the personal folder, so the mode never travels through a shared Turso
 * database or a synced folder, where it would be wrong for the other machine.
 *
 * Workspace selection is machine-local too: `activeWorkspaceId` points at one
 * entry in `workspaces`, while legacy database settings are migrated by the CLI.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { ulid } from "ulid";
import {
  DEFAULT_PERSONA_ID,
  isPersonaId,
  type PersonaId,
} from "../models/persona.js";
import type { InstallChannel } from "./update-check.js";

export type InstallMode = "developer" | "default";

export interface InstallConfig {
  mode?: InstallMode;
  /** How this copy was installed; drives the self-update mechanism. */
  channel?: InstallChannel;
  /** Machine-local AI provider choices; never synchronized through the DB. */
  ai?: MachineAiConfig;
  /** Machine-local agent-connect state; harness installs are per-machine. */
  agent?: MachineAgentConfig;
  /**
   * Machine-local Companion UI preferences (ADR 2026-07-16 §Decision 4,
   * 0.11.0 Phase 2): selected learner, selected evaluator, and per-surface
   * collapsed state. Deliberately never the Turso-shared learning database —
   * changing the Companion learner must not rewrite the database-wide
   * `user.id` default used by unrelated CLI or harness sessions.
   */
  companion?: MachineCompanionConfig;
  /** Machine-local first-run onboarding state (ADR 2026-07-24). */
  onboarding?: MachineOnboardingConfig;
  /**
   * Machine-local Bitwarden secret sync (ADR 2026-07-30b). Opt-in: when
   * `autoSync` is true, ZAM pushes machine-local secrets (mainly the server
   * DB token) into the learner's vault after unlock. Never the shared DB —
   * vault login is per machine / per install.
   */
  bitwarden?: MachineBitwardenConfig;
  /**
   * Machine-local voice-mode preferences (ADR 2026-07-31). Never the
   * Turso-shared database: whether on-device speech is the right choice
   * depends on the hardware in front of the learner, so a phone's answer must
   * not be pushed onto their desktop.
   */
  voice?: MachineVoiceConfig;
  /** Machine-local paths to existing personal/team/community workspaces. */
  workspaces?: WorkspaceConfig[];
  /** Machine-local id of the workspace currently active in this install. */
  activeWorkspaceId?: string;
  /** App version that last ran the install verify/repair pass on this machine. */
  lastRepairedVersion?: string;
}

export interface MachineAgentConfig {
  /** True once first-run agent auto-connect ran on THIS machine (`--auto-once`). */
  connectAutoDone?: boolean;
}

/** Bitwarden vault sync preferences for this install (ADR 2026-07-30b). */
export interface MachineBitwardenConfig {
  /**
   * Master switch for the whole alpha vault feature. Absent or false means
   * off: Settings shows only the opt-in checkbox, and no vault code runs on
   * any path — in particular the dashboard never probes the vault or asks
   * for a master password. A learner who has not asked for this must never
   * meet it.
   */
  enabled?: boolean;
  /** After a successful sync, keep pushing secret changes while unlocked. */
  autoSync?: boolean;
  /** Preferred cloud region for CLI config (eu | us). */
  region?: "eu" | "us";
  /** ISO timestamp of the last successful vault seed/sync. */
  lastSyncAt?: string;
}

/**
 * Machine-local first-run onboarding state (ADR 2026-07-24). Whether the
 * guided first-run flow has completed is per-install, not per-learner: a
 * paired phone or a second machine runs its own first-run. Deliberately never
 * the (Turso-shareable) database.
 */
export interface MachineOnboardingConfig {
  /** True once the first-run flow reached its final page on THIS machine. */
  done?: boolean;
  /**
   * Chosen start persona (ADR 2026-07-24 §2). Machine-local like the rest of
   * this section; when unset or invalid, readers fall back to the "free
   * learner" default (`private`).
   */
  persona?: PersonaId;
}

/**
 * Machine-local Companion preferences (0.11.0 Phase 2). `selectedEvaluatorId`
 * is stored as a plain string, not the `EvaluatorId` union from
 * `src/vscode-extension/companion-evaluator.ts` — this module is part of the
 * AI-agnostic kernel, so it never imports harness/evaluator types; the CLI
 * layer validates the string against `isEvaluatorId` on read.
 */
export interface MachineCompanionConfig {
  /** Persisted Companion learner selection — never the shared `user.id`. */
  selectedUserId?: string;
  /** Persisted Companion evaluator selection (generic/fallback). */
  selectedEvaluatorId?: string;
  /** Persisted explicit VS Code evaluator selection. */
  selectedVscodeEvaluatorId?: string;
  /** Persisted explicit Antigravity evaluator selection. */
  selectedAntigravityEvaluatorId?: string;
  /**
   * Persisted explicit VS Code language-model choice for the `vscode-lm`
   * evaluator adapter (0.11.0 Phase 3) — the model's `vscode.lm` id
   * (`LanguageModelChat.id`). Kept separate from `selectedEvaluatorId`
   * because choosing "vscode-lm" as the evaluator and choosing *which*
   * VS Code model it uses are two different decisions (ADR 2026-07-16
   * §Decision 5: "an explicit model choice"). Machine-local only, like the
   * rest of this section — never inferred by picking the first result of
   * `selectChatModels` on every call.
   */
  selectedVscodeModelId?: string;
  /**
   * Persisted explicit Antigravity model choice for the `vscode-lm`
   * evaluator adapter (0.11.0 Phase 3) — the model's `vscode.lm` id.
   */
  selectedAntigravityModelId?: string;
  /** Collapsed state for the shared context bar, keyed by surface name. */
  collapsed?: Record<string, boolean>;
}

export interface MachineVoiceConfig {
  /**
   * Which speech tier voice mode prefers on this machine. Values are the
   * `VoiceEnginePreference` union from `recall/voice-review.ts`; stored as a
   * plain string so this module stays free of recall imports.
   */
  enginePreference?: string;
}

export type MachineAiRole = "vision" | "recall" | "text" | "embedding";
export type MachineApiFlavor = "chat-completions" | "anthropic-messages";

export interface MachineProviderRecord {
  label?: string;
  url?: string;
  model?: string;
  apiFlavor?: MachineApiFlavor;
  apiKeyRef?: string;
  local?: boolean;
  runner?: string;
}

export interface MachineRoleBinding {
  primary?: string;
  fallback?: string;
}

/**
 * Model capabilities in the unified registry (ADR 2026-07-12). `text` covers
 * every chat-completions job (recall coaching, curriculum import, translation);
 * `image`/`video` are the Observer vision paths; `stt`/`tts` are future audio.
 */
export type ModelCapability =
  | "text"
  | "embedding"
  | "image"
  | "video"
  | "stt"
  | "tts";

export const ALL_CAPABILITIES: ModelCapability[] = [
  "text",
  "embedding",
  "image",
  "video",
  "stt",
  "tts",
];

export type CapabilityFlags = Record<ModelCapability, boolean>;

export function emptyCapabilityFlags(): CapabilityFlags {
  return {
    text: false,
    embedding: false,
    image: false,
    video: false,
    stt: false,
    tts: false,
  };
}

/**
 * One endpoint in the ordered capability registry. Runtime selection walks the
 * list by `order` and picks the first entry that is user-enabled and probe-
 * detected for the requested capability (ADR 2026-07-12).
 */
export interface ModelEntry {
  /** Stable id (ULID) for this config row. */
  id: string;
  /** Human label shown in Settings. */
  label: string;
  url: string;
  model: string;
  local: boolean;
  apiFlavor: MachineApiFlavor;
  /** Optional runner hint for local stacks (foundry, ollama, …). */
  runner?: string;
  /** Credential ref into ~/.zam/credentials.json — never inline. */
  apiKeyRef?: string;
  /** Sort key: lower = higher priority. */
  order: number;
  /** User-selected capabilities (may only shrink after the first probe). */
  capabilities: CapabilityFlags;
  /** Last successful metadata probe; drives the checkbox ceiling. */
  detectedCapabilities: CapabilityFlags;
  /** ISO timestamp of the last probe; undefined until probed. */
  probedAt?: string;
  /**
   * How ZAM reaches this model (ADR 2026-07-12a). Absent/"http" is the direct
   * HTTP path (local or cloud). "agent" delegates generation through a connected
   * agent harness named by {@link agentHarness}; `url`/`apiFlavor` are then
   * ignored. Pure config — the kernel never acts on it; the CLI's agent-llm
   * layer interprets it.
   */
  transport?: "http" | "agent";
  /**
   * Harness id (e.g. "claude-code") that backs an `agent`-transport entry.
   * Matches an `AgentHarnessId` in the CLI layer; stored as a plain string so
   * the kernel stays harness-agnostic.
   */
  agentHarness?: string;
  /**
   * Optional reasoning effort for harnesses that accept it (e.g. Copilot
   * `--effort`). Pure config — interpreted by the CLI agent-llm adapters.
   * When absent, adapters pick a default from the model id.
   */
  effort?: "none" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max";
}

export interface MachineAiConfig {
  /** @deprecated Legacy named endpoints; superseded by `models` (ADR 2026-07-12). */
  providers?: Record<string, MachineProviderRecord>;
  /** @deprecated Legacy role bindings; superseded by `models` (ADR 2026-07-12). */
  roles?: Partial<Record<MachineAiRole, MachineRoleBinding>>;
  /**
   * Unified capability-based model registry (ADR 2026-07-12). An ordered list
   * that supersedes `providers` + `roles`; runtime selection walks it by
   * `order` and returns the first entry enabled and detected for a capability.
   */
  models?: ModelEntry[];
}

export type WorkspaceKind =
  | "personal"
  | "team"
  | "family"
  | "community"
  | "organization"
  | "custom";

export type WorkspaceSourceControl = "github" | "azure-devops" | "git" | "none";

export interface WorkspaceConfig {
  id: string;
  label?: string;
  kind: WorkspaceKind;
  path: string;
  sourceControl?: WorkspaceSourceControl;
  knowledgeScopes?: string[];
  defaultAgent?: string;
  activeKnowledgeContext?: string;
}

function defaultConfigPath(): string {
  return process.env.ZAM_CONFIG_PATH || join(homedir(), ".zam", "config.json");
}

/** Load ~/.zam/config.json. Returns an empty config if missing or unreadable. */
export function loadInstallConfig(path = defaultConfigPath()): InstallConfig {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as InstallConfig;
  } catch {
    return {};
  }
}

/**
 * Persist the install config, preserving any unrelated keys already on disk.
 *
 * Writes atomically: the JSON is written to a temp file in the same
 * directory (same volume, so the following rename is a single filesystem
 * operation) and then renamed over the target — the same handoff pattern
 * `writeUiIntent` uses for the UI-intent file (`src/cli/ui-intent.ts`). A
 * reader (or a process crash mid-write) can therefore never observe a
 * half-written `config.json`; the worst case is losing this one write, never
 * a torn/truncated file. `renameSync` replaces an existing destination on
 * both POSIX and Windows (libuv issues `MoveFileExW` with
 * `MOVEFILE_REPLACE_EXISTING` on Windows), so no unlink-first step is needed
 * in the common case — the fallback below only matters if some other
 * process (antivirus/indexer) transiently holds the destination open.
 */
export function saveInstallConfig(
  config: InstallConfig,
  path = defaultConfigPath(),
): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const tempPath = join(dir, `.config-${process.pid}-${Date.now()}.tmp`);
  writeFileSync(tempPath, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
  try {
    renameSync(tempPath, path);
  } catch (error) {
    // Windows fallback: a stale reader transiently holding the destination
    // open can make an overwrite-rename fail even though replace-on-rename
    // is the default. Unlink then retry once before giving up.
    try {
      unlinkSync(path);
      renameSync(tempPath, path);
    } catch {
      throw error;
    }
  }
}

/** How long to wait for another process to finish its read-modify-write. */
const CONFIG_LOCK_TIMEOUT_MS = 2_000;
/** A lock older than this belonged to a process that died holding it. */
const CONFIG_LOCK_STALE_MS = 5_000;
const CONFIG_LOCK_POLL_MS = 15;

type LockAttempt = "acquired" | "busy" | "unavailable";

/** Block this thread without spinning; the lock is held for microseconds. */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function tryAcquireLock(lockPath: string): LockAttempt {
  try {
    // "wx" fails when the file exists, which makes creation the atomic
    // test-and-set every platform agrees on.
    writeFileSync(lockPath, `${process.pid}\n`, {
      encoding: "utf-8",
      flag: "wx",
    });
    return "acquired";
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EEXIST"
      ? "busy"
      : "unavailable";
  }
}

/**
 * Serialize one read-modify-write cycle against `path` across processes.
 *
 * `saveInstallConfig` replaces the file atomically, so a reader never sees a
 * torn file — but every setter loads, mutates, and saves the *whole* config,
 * and two processes interleaving those steps silently drop one of the two
 * changes. With several editor windows each running their own `zam mcp`,
 * that lost update is a Companion setting that reverts by itself.
 *
 * Returns `undefined` when no lock could be taken. Failing to lock must never
 * stop ZAM from saving its own config, so the caller then proceeds unlocked —
 * back to the pre-lock behavior rather than an error.
 */
function acquireInstallConfigLock(path: string): (() => void) | undefined {
  const lockPath = `${path}.lock`;
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const release = () => {
    try {
      unlinkSync(lockPath);
    } catch {
      // Already released, or broken by a waiter that timed us out.
    }
  };

  const deadline = Date.now() + CONFIG_LOCK_TIMEOUT_MS;
  for (;;) {
    const attempt = tryAcquireLock(lockPath);
    if (attempt === "acquired") return release;
    if (attempt === "unavailable") return undefined;
    let heldForMs: number;
    try {
      heldForMs = Date.now() - statSync(lockPath).mtimeMs;
    } catch {
      // The holder released it between the two calls — retry immediately.
      continue;
    }
    if (heldForMs > CONFIG_LOCK_STALE_MS || Date.now() >= deadline) break;
    sleepSync(CONFIG_LOCK_POLL_MS);
  }

  // Break a stale or pathologically slow lock exactly once. Looping here
  // instead would let two waiters break each other's lock indefinitely.
  try {
    unlinkSync(lockPath);
  } catch {
    // Another waiter broke it first; the acquire below still decides.
  }
  return tryAcquireLock(lockPath) === "acquired" ? release : undefined;
}

/**
 * Load, mutate, and save the config as one cross-process-atomic step.
 *
 * Every setter in this module goes through here: the load happens *inside*
 * the lock, so a concurrent writer's change is read back rather than
 * overwritten. Returns whatever `mutate` returns.
 */
export function updateInstallConfig<T>(
  mutate: (config: InstallConfig) => T,
  path = defaultConfigPath(),
): T {
  const release = acquireInstallConfigLock(path);
  try {
    const config = loadInstallConfig(path);
    const result = mutate(config);
    saveInstallConfig(config, path);
    return result;
  } finally {
    release?.();
  }
}

/**
 * This machine's install mode. Defaults to "developer" — the only historical
 * mode — so existing source/CLI installs keep their behavior. A packaged
 * "default" install writes mode explicitly at install time.
 */
export function getInstallMode(path = defaultConfigPath()): InstallMode {
  return loadInstallConfig(path).mode ?? "developer";
}

export function setInstallMode(
  mode: InstallMode,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.mode = mode;
  }, path);
}

/**
 * How this copy was installed, used to pick the self-update mechanism. Falls
 * back to "developer" for developer mode and "direct" for an installed app
 * whose channel was not recorded.
 */
export function getInstallChannel(path = defaultConfigPath()): InstallChannel {
  const config = loadInstallConfig(path);
  if (config.channel) return config.channel;
  return (config.mode ?? "developer") === "developer" ? "developer" : "direct";
}

export function setInstallChannel(
  channel: InstallChannel,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.channel = channel;
  }, path);
}

export function getMachineAiConfig(
  path = defaultConfigPath(),
): MachineAiConfig {
  return loadInstallConfig(path).ai ?? {};
}

export function saveMachineAiConfig(
  ai: MachineAiConfig,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.ai = ai;
  }, path);
}

const sanitizedMachineRolePaths = new Set<string>();

/** Drop deprecated per-machine text bindings (text always follows recall). */
export function ensureMachineProviderRolesSanitized(
  path = defaultConfigPath(),
): void {
  if (sanitizedMachineRolePaths.has(path)) return;
  sanitizedMachineRolePaths.add(path);

  updateInstallConfig((config) => {
    if (!config.ai?.roles?.text) return;
    const roles = { ...config.ai.roles };
    delete roles.text;
    config.ai = { ...config.ai, roles };
  }, path);
}

// ── Unified capability-based model registry (ADR 2026-07-12) ─────────────────

/** Read the ordered model registry from `~/.zam/config.json` (`ai.models`). */
export function getMachineAiModels(path = defaultConfigPath()): ModelEntry[] {
  return getMachineAiConfig(path).models ?? [];
}

/** Persist the ordered model registry, preserving other `ai.*` keys. */
export function saveMachineAiModels(
  models: ModelEntry[],
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.ai = { ...(config.ai ?? {}), models };
  }, path);
}

function isAnthropicUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith("anthropic.com");
  } catch {
    return false;
  }
}

function isLocalUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".local")
    );
  } catch {
    return false;
  }
}

const ROLE_TO_CAPABILITY: Record<MachineAiRole, ModelCapability> = {
  recall: "text",
  text: "text",
  vision: "image",
  embedding: "embedding",
};

/**
 * Flatten legacy machine `providers` + `roles` into an ordered capability
 * registry. Each provider's capabilities are inferred from the roles that
 * pointed at it (`recall`/`text` → text, `vision` → image, `embedding` →
 * embedding). Order follows former role priority — primary then fallback across
 * recall, text, vision, embedding — with any unbound providers appended. Until
 * a probe runs, legacy bindings are authoritative, so `detectedCapabilities`
 * mirrors `capabilities` (ADR migration §4). Returns `null` when there is
 * nothing to migrate.
 */
export function migrateMachineRolesToModels(
  ai: MachineAiConfig,
): ModelEntry[] | null {
  const providers = ai.providers ?? {};
  const providerNames = Object.keys(providers);
  if (providerNames.length === 0) return null;
  const roles = ai.roles ?? {};

  const capsByName = new Map<string, CapabilityFlags>();
  const capsFor = (name: string): CapabilityFlags => {
    let flags = capsByName.get(name);
    if (!flags) {
      flags = emptyCapabilityFlags();
      capsByName.set(name, flags);
    }
    return flags;
  };

  const priorityRoles: MachineAiRole[] = [
    "recall",
    "text",
    "vision",
    "embedding",
  ];
  for (const role of priorityRoles) {
    const binding = roles[role];
    if (!binding) continue;
    const capability = ROLE_TO_CAPABILITY[role];
    for (const ref of [binding.primary, binding.fallback]) {
      if (ref && providers[ref]) capsFor(ref)[capability] = true;
    }
  }

  const ordered: string[] = [];
  const pushName = (name?: string): void => {
    if (name && providers[name] && !ordered.includes(name)) ordered.push(name);
  };
  for (const role of priorityRoles) {
    pushName(roles[role]?.primary);
    pushName(roles[role]?.fallback);
  }
  for (const name of providerNames) pushName(name);

  return ordered.map((name, index) => {
    const rec = providers[name];
    const url = rec.url ?? "";
    const capabilities = capsByName.get(name) ?? emptyCapabilityFlags();
    const entry: ModelEntry = {
      id: ulid(),
      label: rec.label ?? name,
      url,
      model: rec.model ?? "",
      local: rec.local ?? isLocalUrl(url),
      apiFlavor:
        rec.apiFlavor ??
        (isAnthropicUrl(url) ? "anthropic-messages" : "chat-completions"),
      order: index,
      capabilities,
      detectedCapabilities: { ...capabilities },
    };
    if (rec.runner) entry.runner = rec.runner;
    if (rec.apiKeyRef) entry.apiKeyRef = rec.apiKeyRef;
    return entry;
  });
}

const migratedModelConfigPaths = new Set<string>();

/**
 * One-time, idempotent migration of legacy machine `providers`/`roles` into the
 * ordered `ai.models` registry. A no-op once `ai.models` exists or when there is
 * nothing to migrate. Legacy `providers`/`roles` are preserved for now and only
 * removed in the ADR's Phase 4 cleanup. Returns the resolved registry.
 */
export function ensureMachineAiModelsMigrated(
  path = defaultConfigPath(),
): ModelEntry[] {
  const existing = getMachineAiConfig(path);
  if (existing.models && existing.models.length > 0) return existing.models;
  if (migratedModelConfigPaths.has(path)) return existing.models ?? [];
  migratedModelConfigPaths.add(path);

  return updateInstallConfig((config) => {
    const ai = config.ai ?? {};
    if (ai.models && ai.models.length > 0) return ai.models;
    const models = migrateMachineRolesToModels(ai);
    if (!models) return [];
    config.ai = { ...ai, models };
    return models;
  }, path);
}

/**
 * First-run agent auto-connect marker. Machine-local by design: the database
 * can be shared across machines (Turso), but which harnesses are installed
 * and configured is a property of this machine, so the marker must not travel.
 */
export function getAgentConnectAutoDone(path = defaultConfigPath()): boolean {
  return loadInstallConfig(path).agent?.connectAutoDone === true;
}

export function setAgentConnectAutoDone(
  done: boolean,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    if (done) {
      config.agent = { ...(config.agent ?? {}), connectAutoDone: true };
    } else if (config.agent) {
      delete config.agent.connectAutoDone;
    }
  }, path);
}

/**
 * Whether the guided first-run onboarding flow has completed on THIS machine
 * (ADR 2026-07-24). Machine-local, following the `agentConnectAutoDone`
 * precedent: the learning database can be shared across machines, but whether
 * a given install has been walked through first-run is a property of the
 * install, so the marker must not travel.
 */
export function getOnboardingDone(path = defaultConfigPath()): boolean {
  return loadInstallConfig(path).onboarding?.done === true;
}

export function setOnboardingDone(
  done: boolean,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    if (done) {
      config.onboarding = { ...(config.onboarding ?? {}), done: true };
    } else if (config.onboarding) {
      delete config.onboarding.done;
    }
  }, path);
}

export function getBitwardenSyncConfig(
  path = defaultConfigPath(),
): MachineBitwardenConfig {
  return { ...(loadInstallConfig(path).bitwarden ?? {}) };
}

export function setBitwardenSyncConfig(
  patch: MachineBitwardenConfig,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.bitwarden = { ...(config.bitwarden ?? {}), ...patch };
  }, path);
}

/**
 * Is the alpha vault feature switched on for this install? Off by default —
 * the learner has to tick the box in Settings first.
 */
export function isBitwardenVaultEnabled(path = defaultConfigPath()): boolean {
  return loadInstallConfig(path).bitwarden?.enabled === true;
}

/**
 * Turn the alpha vault feature on or off.
 *
 * Switching it off also stops auto-sync, so an unlocked session cannot keep
 * pushing secrets after the learner has said no. Existing `{$secret}`
 * references are left untouched: they are the learner's data, and
 * `zam credentials disconnect` is the deliberate way to resolve them back to
 * literals.
 */
export function setBitwardenVaultEnabled(
  enabled: boolean,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    if (enabled) {
      config.bitwarden = { ...(config.bitwarden ?? {}), enabled: true };
      return;
    }
    if (config.bitwarden) {
      config.bitwarden = {
        ...config.bitwarden,
        enabled: false,
        autoSync: false,
      };
    }
  }, path);
}

/** Enable auto-sync after a successful first transfer, or turn it off. */
export function setBitwardenAutoSync(
  enabled: boolean,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    if (enabled) {
      config.bitwarden = {
        ...(config.bitwarden ?? {}),
        autoSync: true,
        lastSyncAt: new Date().toISOString(),
      };
    } else if (config.bitwarden) {
      config.bitwarden = { ...config.bitwarden, autoSync: false };
    }
  }, path);
}

/** Clear Bitwarden linkage for this install (offboarding). */
export function clearBitwardenSyncConfig(path = defaultConfigPath()): void {
  updateInstallConfig((config) => {
    delete config.bitwarden;
  }, path);
}

/**
 * The start persona chosen during first-run onboarding (ADR 2026-07-24 §2).
 * Defaults to `private` ("free learner") when never chosen — the plan's
 * resolution of ADR open question 4 — and when the on-disk value is not a
 * known persona (hand-edited config), so callers always get a valid id.
 */
export function getOnboardingPersona(path = defaultConfigPath()): PersonaId {
  const raw = loadInstallConfig(path).onboarding?.persona;
  return typeof raw === "string" && isPersonaId(raw) ? raw : DEFAULT_PERSONA_ID;
}

export function setOnboardingPersona(
  persona: PersonaId | undefined,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    if (persona) {
      config.onboarding = { ...(config.onboarding ?? {}), persona };
    } else if (config.onboarding) {
      delete config.onboarding.persona;
    }
  }, path);
}

/**
 * Machine-local Companion preferences (0.11.0 Phase 2). Defensively
 * normalizes whatever is on disk instead of trusting the raw JSON shape: a
 * hand-edited or partially-written `companion` section (wrong types, a stray
 * array) must fall back to sensible defaults rather than crash the `zam mcp`
 * process the Companion depends on for first paint.
 */
export function getMachineCompanionConfig(
  path = defaultConfigPath(),
): MachineCompanionConfig {
  return normalizeCompanionConfig(loadInstallConfig(path).companion);
}

function normalizeCompanionConfig(
  raw: MachineCompanionConfig | undefined,
): MachineCompanionConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const result: MachineCompanionConfig = {};
  if (typeof raw.selectedUserId === "string") {
    result.selectedUserId = raw.selectedUserId;
  }
  if (typeof raw.selectedEvaluatorId === "string") {
    result.selectedEvaluatorId = raw.selectedEvaluatorId;
  }
  if (typeof raw.selectedVscodeEvaluatorId === "string") {
    result.selectedVscodeEvaluatorId = raw.selectedVscodeEvaluatorId;
  }
  if (typeof raw.selectedAntigravityEvaluatorId === "string") {
    result.selectedAntigravityEvaluatorId = raw.selectedAntigravityEvaluatorId;
  }
  if (typeof raw.selectedVscodeModelId === "string") {
    result.selectedVscodeModelId = raw.selectedVscodeModelId;
  }
  if (typeof raw.selectedAntigravityModelId === "string") {
    result.selectedAntigravityModelId = raw.selectedAntigravityModelId;
  }
  if (
    raw.collapsed &&
    typeof raw.collapsed === "object" &&
    !Array.isArray(raw.collapsed)
  ) {
    const collapsed: Record<string, boolean> = {};
    for (const [surface, value] of Object.entries(raw.collapsed)) {
      if (typeof value === "boolean") collapsed[surface] = value;
    }
    result.collapsed = collapsed;
  }
  return result;
}

/** Persist the Companion preferences, preserving other top-level config keys. */
export function saveMachineCompanionConfig(
  companion: MachineCompanionConfig,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.companion = companion;
  }, path);
}

/**
 * Change the Companion section under the config lock, re-reading it inside
 * the lock. The individual setters below must not `getMachineCompanionConfig`
 * first and save the result afterwards: with an editor window per workspace,
 * two `zam mcp` processes doing that concurrently drop one of the two
 * selections, which the learner sees as a model or evaluator choice reverting
 * on its own.
 */
function updateCompanionConfig(
  mutate: (companion: MachineCompanionConfig) => void,
  path = defaultConfigPath(),
): MachineCompanionConfig {
  return updateInstallConfig((config) => {
    const companion = normalizeCompanionConfig(config.companion);
    mutate(companion);
    config.companion = companion;
    return companion;
  }, path);
}

/**
 * Read this machine's voice-mode preference (ADR 2026-07-31).
 *
 * Returns `undefined` rather than a default when nothing is stored, so the
 * caller decides what the default is — the kernel's
 * `DEFAULT_VOICE_ENGINE_PREFERENCE` owns that, not the config file.
 */
export function getMachineVoicePreference(
  path = defaultConfigPath(),
): string | undefined {
  const raw = loadInstallConfig(path).voice;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  return typeof raw.enginePreference === "string"
    ? raw.enginePreference
    : undefined;
}

/** Persist the voice-mode preference, preserving other top-level config keys. */
export function setMachineVoicePreference(
  preference: string | undefined,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    const voice: MachineVoiceConfig = { ...(config.voice ?? {}) };
    if (preference === undefined) {
      delete voice.enginePreference;
    } else {
      voice.enginePreference = preference;
    }
    config.voice = voice;
  }, path);
}

/**
 * One batched Companion preference change. A key is only touched when
 * present on the update object — `"selectedUserId" in update` (not a plain
 * truthiness check), so `{ selectedUserId: undefined }` still clears the
 * field, mirroring `setCompanionSelectedUserId(undefined, ...)`. `collapsed`
 * merges into the existing per-surface map rather than replacing it, like
 * `setCompanionCollapsed`.
 */
export interface MachineCompanionConfigUpdate {
  selectedUserId?: string;
  selectedEvaluatorId?: string;
  selectedVscodeEvaluatorId?: string;
  selectedAntigravityEvaluatorId?: string;
  selectedVscodeModelId?: string;
  selectedAntigravityModelId?: string;
  collapsed?: { surface: string; value: boolean };
}

/**
 * Apply a batch of Companion preference changes with one load and one save,
 * instead of calling the individual setters below in sequence (each of which
 * does its own load-apply-save). A write that touches the learner, the
 * evaluator, and the collapsed state all at once — e.g.
 * `writeCompanionContext` — does one read and one write here instead of
 * three. Fields absent from `update` are left exactly as they were; this is
 * the same merge behavior as the individual setters, just batched.
 */
export function updateMachineCompanionConfig(
  update: MachineCompanionConfigUpdate,
  path = defaultConfigPath(),
): MachineCompanionConfig {
  return updateCompanionConfig((companion) => {
    applyCompanionUpdate(companion, update);
  }, path);
}

function applyCompanionUpdate(
  companion: MachineCompanionConfig,
  update: MachineCompanionConfigUpdate,
): void {
  if ("selectedUserId" in update) {
    if (update.selectedUserId) {
      companion.selectedUserId = update.selectedUserId;
    } else {
      delete companion.selectedUserId;
    }
  }
  if ("selectedEvaluatorId" in update) {
    if (update.selectedEvaluatorId) {
      companion.selectedEvaluatorId = update.selectedEvaluatorId;
    } else {
      delete companion.selectedEvaluatorId;
    }
  }
  if ("selectedVscodeEvaluatorId" in update) {
    if (update.selectedVscodeEvaluatorId) {
      companion.selectedVscodeEvaluatorId = update.selectedVscodeEvaluatorId;
    } else {
      delete companion.selectedVscodeEvaluatorId;
    }
  }
  if ("selectedAntigravityEvaluatorId" in update) {
    if (update.selectedAntigravityEvaluatorId) {
      companion.selectedAntigravityEvaluatorId =
        update.selectedAntigravityEvaluatorId;
    } else {
      delete companion.selectedAntigravityEvaluatorId;
    }
  }
  if ("selectedVscodeModelId" in update) {
    if (update.selectedVscodeModelId) {
      companion.selectedVscodeModelId = update.selectedVscodeModelId;
    } else {
      delete companion.selectedVscodeModelId;
    }
  }
  if ("selectedAntigravityModelId" in update) {
    if (update.selectedAntigravityModelId) {
      companion.selectedAntigravityModelId = update.selectedAntigravityModelId;
    } else {
      delete companion.selectedAntigravityModelId;
    }
  }
  if (update.collapsed) {
    companion.collapsed = {
      ...(companion.collapsed ?? {}),
      [update.collapsed.surface]: update.collapsed.value,
    };
  }
}

/** The persisted Companion learner, independent of the shared `user.id`. */
export function getCompanionSelectedUserId(
  path = defaultConfigPath(),
): string | undefined {
  return getMachineCompanionConfig(path).selectedUserId;
}

export function setCompanionSelectedUserId(
  userId: string | undefined,
  path = defaultConfigPath(),
): void {
  updateCompanionConfig((companion) => {
    if (userId) {
      companion.selectedUserId = userId;
    } else {
      delete companion.selectedUserId;
    }
  }, path);
}

/** The persisted Companion evaluator id (validated against `EvaluatorId` by callers). */
export function getCompanionSelectedEvaluatorId(
  path = defaultConfigPath(),
): string | undefined {
  return getMachineCompanionConfig(path).selectedEvaluatorId;
}

export function setCompanionSelectedEvaluatorId(
  evaluatorId: string | undefined,
  path = defaultConfigPath(),
): void {
  updateCompanionConfig((companion) => {
    if (evaluatorId) {
      companion.selectedEvaluatorId = evaluatorId;
    } else {
      delete companion.selectedEvaluatorId;
    }
  }, path);
}

export function getCompanionSelectedVscodeEvaluatorId(
  path = defaultConfigPath(),
): string | undefined {
  return getMachineCompanionConfig(path).selectedVscodeEvaluatorId;
}

export function setCompanionSelectedVscodeEvaluatorId(
  evaluatorId: string | undefined,
  path = defaultConfigPath(),
): void {
  updateCompanionConfig((companion) => {
    if (evaluatorId) {
      companion.selectedVscodeEvaluatorId = evaluatorId;
    } else {
      delete companion.selectedVscodeEvaluatorId;
    }
  }, path);
}

export function getCompanionSelectedAntigravityEvaluatorId(
  path = defaultConfigPath(),
): string | undefined {
  return getMachineCompanionConfig(path).selectedAntigravityEvaluatorId;
}

export function setCompanionSelectedAntigravityEvaluatorId(
  evaluatorId: string | undefined,
  path = defaultConfigPath(),
): void {
  updateCompanionConfig((companion) => {
    if (evaluatorId) {
      companion.selectedAntigravityEvaluatorId = evaluatorId;
    } else {
      delete companion.selectedAntigravityEvaluatorId;
    }
  }, path);
}

/** The persisted explicit VS Code model choice for the `vscode-lm` adapter. */
export function getCompanionSelectedVscodeModelId(
  path = defaultConfigPath(),
): string | undefined {
  return getMachineCompanionConfig(path).selectedVscodeModelId;
}

export function setCompanionSelectedVscodeModelId(
  modelId: string | undefined,
  path = defaultConfigPath(),
): void {
  updateCompanionConfig((companion) => {
    if (modelId) {
      companion.selectedVscodeModelId = modelId;
    } else {
      delete companion.selectedVscodeModelId;
    }
  }, path);
}

/** The persisted explicit Antigravity model choice for the `vscode-lm` adapter. */
export function getCompanionSelectedAntigravityModelId(
  path = defaultConfigPath(),
): string | undefined {
  return getMachineCompanionConfig(path).selectedAntigravityModelId;
}

export function setCompanionSelectedAntigravityModelId(
  modelId: string | undefined,
  path = defaultConfigPath(),
): void {
  updateCompanionConfig((companion) => {
    if (modelId) {
      companion.selectedAntigravityModelId = modelId;
    } else {
      delete companion.selectedAntigravityModelId;
    }
  }, path);
}

/** Collapsed state for every surface that has been explicitly set. */
export function getCompanionCollapsed(
  path = defaultConfigPath(),
): Record<string, boolean> {
  return getMachineCompanionConfig(path).collapsed ?? {};
}

export function setCompanionCollapsed(
  surface: string,
  collapsed: boolean,
  path = defaultConfigPath(),
): void {
  updateCompanionConfig((companion) => {
    companion.collapsed = {
      ...(companion.collapsed ?? {}),
      [surface]: collapsed,
    };
  }, path);
}

/**
 * Version stamp of the last install verify/repair pass. Machine-local: shims,
 * PATH entries, and companion extensions are properties of this machine, so
 * the marker must not travel through a shared database.
 */
export function getLastRepairedVersion(
  path = defaultConfigPath(),
): string | undefined {
  return loadInstallConfig(path).lastRepairedVersion;
}

export function setLastRepairedVersion(
  version: string,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.lastRepairedVersion = version;
  }, path);
}

export function getConfiguredWorkspaces(
  path = defaultConfigPath(),
): WorkspaceConfig[] {
  return loadInstallConfig(path).workspaces ?? [];
}

export function saveConfiguredWorkspaces(
  workspaces: WorkspaceConfig[],
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    config.workspaces = workspaces;
    if (
      config.activeWorkspaceId &&
      !workspaces.some((workspace) => workspace.id === config.activeWorkspaceId)
    ) {
      config.activeWorkspaceId = workspaces[0]?.id;
    }
  }, path);
}

export function getActiveWorkspaceId(
  path = defaultConfigPath(),
): string | undefined {
  return loadInstallConfig(path).activeWorkspaceId;
}

export function setActiveWorkspaceId(
  id: string | undefined,
  path = defaultConfigPath(),
): void {
  updateInstallConfig((config) => {
    if (id) {
      config.activeWorkspaceId = id;
    } else {
      delete config.activeWorkspaceId;
    }
  }, path);
}

export function getActiveWorkspace(
  path = defaultConfigPath(),
): WorkspaceConfig | undefined {
  const config = loadInstallConfig(path);
  const id = config.activeWorkspaceId;
  return id
    ? config.workspaces?.find((workspace) => workspace.id === id)
    : undefined;
}

export function upsertConfiguredWorkspace(
  workspace: WorkspaceConfig,
  path = defaultConfigPath(),
): WorkspaceConfig[] {
  return updateInstallConfig((config) => {
    const next = [
      ...(config.workspaces ?? []).filter(
        (candidate) => candidate.id !== workspace.id,
      ),
      workspace,
    ];
    config.workspaces = next;
    return next;
  }, path);
}

export function removeConfiguredWorkspace(
  id: string,
  path = defaultConfigPath(),
): WorkspaceConfig[] {
  return updateInstallConfig((config) => {
    const next = (config.workspaces ?? []).filter(
      (workspace) => workspace.id !== id,
    );
    config.workspaces = next;
    if (config.activeWorkspaceId === id) {
      config.activeWorkspaceId = next[0]?.id;
    }
    return next;
  }, path);
}

/**
 * Best-effort detection of the file-sync provider a folder lives in, from its
 * path. Used only for friendly messaging ("this folder syncs via OneDrive —
 * good for moving snapshots between machines"), never for behavior.
 */
export function detectSyncProvider(dir: string): string | null {
  const p = dir.toLowerCase();
  if (p.includes("onedrive")) return "OneDrive";
  if (p.includes("dropbox")) return "Dropbox";
  if (
    p.includes("google drive") ||
    p.includes("googledrive") ||
    p.includes("/my drive")
  ) {
    return "Google Drive";
  }
  if (p.includes("icloud") || p.includes("mobile documents")) {
    return "iCloud Drive";
  }
  return null;
}

export function getActiveWorkspaceContext(
  path = defaultConfigPath(),
): string | undefined {
  const activeWorkspace = getActiveWorkspace(path);
  return activeWorkspace?.activeKnowledgeContext;
}

export function setActiveWorkspaceContext(
  contextName: string | undefined,
  path = defaultConfigPath(),
): boolean {
  return updateInstallConfig((config) => {
    const activeId = config.activeWorkspaceId;
    const workspace = activeId
      ? config.workspaces?.find((w) => w.id === activeId)
      : undefined;
    if (!workspace) return false;
    if (contextName) {
      workspace.activeKnowledgeContext = contextName;
    } else {
      delete workspace.activeKnowledgeContext;
    }
    return true;
  }, path);
}
