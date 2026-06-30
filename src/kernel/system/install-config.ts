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
import type { InstallChannel } from "./update-check.js";

export type InstallMode = "developer" | "default";

export interface InstallConfig {
  mode?: InstallMode;
  /** How this copy was installed; drives the self-update mechanism. */
  channel?: InstallChannel;
  /** Machine-local AI provider choices; never synchronized through the DB. */
  ai?: MachineAiConfig;
  /** Machine-local paths to existing personal/team/community workspaces. */
  workspaces?: WorkspaceConfig[];
  /** Machine-local id of the workspace currently active in this install. */
  activeWorkspaceId?: string;
}

export type MachineAiRole = "vision" | "recall" | "text";
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

export interface MachineAiConfig {
  providers?: Record<string, MachineProviderRecord>;
  roles?: Partial<Record<MachineAiRole, MachineRoleBinding>>;
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
