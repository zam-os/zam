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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { ulid } from "ulid";
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
  /** Machine-local paths to existing personal/team/community workspaces. */
  workspaces?: WorkspaceConfig[];
  /** Machine-local id of the workspace currently active in this install. */
  activeWorkspaceId?: string;
}

export interface MachineAgentConfig {
  /** True once first-run agent auto-connect ran on THIS machine (`--auto-once`). */
  connectAutoDone?: boolean;
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

/** Persist the install config, preserving any unrelated keys already on disk. */
export function saveInstallConfig(
  config: InstallConfig,
  path = defaultConfigPath(),
): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
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
  const config = loadInstallConfig(path);
  config.mode = mode;
  saveInstallConfig(config, path);
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
  const config = loadInstallConfig(path);
  config.channel = channel;
  saveInstallConfig(config, path);
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
  const config = loadInstallConfig(path);
  config.ai = ai;
  saveInstallConfig(config, path);
}

const sanitizedMachineRolePaths = new Set<string>();

/** Drop deprecated per-machine text bindings (text always follows recall). */
export function ensureMachineProviderRolesSanitized(
  path = defaultConfigPath(),
): void {
  if (sanitizedMachineRolePaths.has(path)) return;
  sanitizedMachineRolePaths.add(path);

  const ai = getMachineAiConfig(path);
  if (!ai.roles?.text) return;

  const roles = { ...ai.roles };
  delete roles.text;
  saveMachineAiConfig({ ...ai, roles }, path);
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
  const ai = getMachineAiConfig(path);
  saveMachineAiConfig({ ...ai, models }, path);
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
  const ai = getMachineAiConfig(path);
  if (ai.models && ai.models.length > 0) return ai.models;
  if (migratedModelConfigPaths.has(path)) return ai.models ?? [];
  migratedModelConfigPaths.add(path);

  const models = migrateMachineRolesToModels(ai);
  if (!models) return [];
  saveMachineAiConfig({ ...ai, models }, path);
  return models;
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
  const config = loadInstallConfig(path);
  if (done) {
    config.agent = { ...(config.agent ?? {}), connectAutoDone: true };
  } else if (config.agent) {
    delete config.agent.connectAutoDone;
  }
  saveInstallConfig(config, path);
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
  const config = loadInstallConfig(path);
  config.workspaces = workspaces;
  if (
    config.activeWorkspaceId &&
    !workspaces.some((workspace) => workspace.id === config.activeWorkspaceId)
  ) {
    config.activeWorkspaceId = workspaces[0]?.id;
  }
  saveInstallConfig(config, path);
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
  const config = loadInstallConfig(path);
  if (id) {
    config.activeWorkspaceId = id;
  } else {
    delete config.activeWorkspaceId;
  }
  saveInstallConfig(config, path);
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
  const config = loadInstallConfig(path);
  const current = config.workspaces ?? [];
  const next = [
    ...current.filter((candidate) => candidate.id !== workspace.id),
    workspace,
  ];
  config.workspaces = next;
  saveInstallConfig(config, path);
  return next;
}

export function removeConfiguredWorkspace(
  id: string,
  path = defaultConfigPath(),
): WorkspaceConfig[] {
  const config = loadInstallConfig(path);
  const next = (config.workspaces ?? []).filter(
    (workspace) => workspace.id !== id,
  );
  config.workspaces = next;
  if (config.activeWorkspaceId === id) {
    config.activeWorkspaceId = next[0]?.id;
  }
  saveInstallConfig(config, path);
  return next;
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
  const config = loadInstallConfig(path);
  const activeId = config.activeWorkspaceId;
  if (activeId && config.workspaces) {
    const workspace = config.workspaces.find((w) => w.id === activeId);
    if (workspace) {
      if (contextName) {
        workspace.activeKnowledgeContext = contextName;
      } else {
        delete workspace.activeKnowledgeContext;
      }
      saveInstallConfig(config, path);
      return true;
    }
  }
  return false;
}
