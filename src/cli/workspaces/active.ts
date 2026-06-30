import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import {
  type Database,
  deleteSetting,
  getActiveWorkspace,
  getConfiguredWorkspaces,
  getSetting,
  removeConfiguredWorkspace,
  setActiveWorkspaceId,
  upsertConfiguredWorkspace,
  type WorkspaceConfig,
  type WorkspaceKind,
} from "../../kernel/index.js";

const LEGACY_WORKSPACE_DIR_KEY = "personal.workspace_dir";
const DEFAULT_WORKSPACE_ID = "personal";

export function defaultWorkspaceDir(): string {
  return join(homedir(), "Documents", "zam");
}

function normalizeWorkspacePath(path: string): string {
  const resolved = resolve(path);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function sameWorkspacePath(left: string, right: string): boolean {
  return normalizeWorkspacePath(left) === normalizeWorkspacePath(right);
}

function labelFromPath(path: string): string {
  return basename(path) || "ZAM";
}

export function workspaceIdFromPath(dir: string): string {
  const base = basename(dir)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const prefix = base || "workspace";
  const existing = new Set(getConfiguredWorkspaces().map((item) => item.id));
  if (!existing.has(prefix)) return prefix;
  let index = 2;
  while (existing.has(`${prefix}-${index}`)) index++;
  return `${prefix}-${index}`;
}

function findWorkspaceByPath(dir: string): WorkspaceConfig | undefined {
  return getConfiguredWorkspaces().find((workspace) =>
    sameWorkspacePath(workspace.path, dir),
  );
}

async function clearLegacyWorkspaceDir(db: Database): Promise<void> {
  await deleteSetting(db, LEGACY_WORKSPACE_DIR_KEY);
}

export async function migrateLegacyWorkspaceDir(
  db: Database,
): Promise<WorkspaceConfig | undefined> {
  const legacyDir = await getSetting(db, LEGACY_WORKSPACE_DIR_KEY);
  if (!legacyDir) return undefined;

  const path = resolve(legacyDir);
  const existing = findWorkspaceByPath(path);
  const migrated =
    existing ??
    ({
      id: getConfiguredWorkspaces().some(
        (workspace) => workspace.id === DEFAULT_WORKSPACE_ID,
      )
        ? workspaceIdFromPath(path)
        : DEFAULT_WORKSPACE_ID,
      label: labelFromPath(path),
      kind: "personal",
      path,
    } satisfies WorkspaceConfig);

  if (!existing) {
    upsertConfiguredWorkspace(migrated);
  }
  if (!getActiveWorkspace()) {
    setActiveWorkspaceId(migrated.id);
  }
  await clearLegacyWorkspaceDir(db);
  return migrated;
}

export async function ensureActiveWorkspace(
  db: Database,
): Promise<WorkspaceConfig> {
  await migrateLegacyWorkspaceDir(db);

  const active = getActiveWorkspace();
  if (active) {
    mkdirSync(active.path, { recursive: true });
    return active;
  }

  const configured = getConfiguredWorkspaces()[0];
  if (configured) {
    setActiveWorkspaceId(configured.id);
    mkdirSync(configured.path, { recursive: true });
    return configured;
  }

  const workspace: WorkspaceConfig = {
    id: DEFAULT_WORKSPACE_ID,
    label: "Personal",
    kind: "personal",
    path: defaultWorkspaceDir(),
  };
  mkdirSync(workspace.path, { recursive: true });
  upsertConfiguredWorkspace(workspace);
  setActiveWorkspaceId(workspace.id);
  await clearLegacyWorkspaceDir(db);
  return workspace;
}

export async function activateWorkspace(
  db: Database,
  workspace: WorkspaceConfig,
): Promise<WorkspaceConfig> {
  upsertConfiguredWorkspace(workspace);
  setActiveWorkspaceId(workspace.id);
  await clearLegacyWorkspaceDir(db);
  return workspace;
}

export async function activateWorkspacePath(
  db: Database,
  dir: string,
  opts: {
    id?: string;
    label?: string;
    kind?: WorkspaceKind;
  } = {},
): Promise<WorkspaceConfig> {
  await migrateLegacyWorkspaceDir(db);
  const path = resolve(dir);
  const existing = opts.id ? undefined : findWorkspaceByPath(path);
  if (existing) {
    setActiveWorkspaceId(existing.id);
    await clearLegacyWorkspaceDir(db);
    return existing;
  }

  const workspace: WorkspaceConfig = {
    id: opts.id || workspaceIdFromPath(path),
    label: opts.label || labelFromPath(path),
    kind: opts.kind || "personal",
    path,
  };
  return activateWorkspace(db, workspace);
}

export async function removeWorkspaceAndResolveActive(
  db: Database,
  id: string,
): Promise<{
  activeWorkspace: WorkspaceConfig;
  workspaces: WorkspaceConfig[];
}> {
  removeConfiguredWorkspace(id);
  await clearLegacyWorkspaceDir(db);
  const activeWorkspace = await ensureActiveWorkspace(db);
  return {
    activeWorkspace,
    workspaces: getConfiguredWorkspaces(),
  };
}

export function existingWorkspaceDirOrHome(workspace: WorkspaceConfig): string {
  return existsSync(workspace.path) ? workspace.path : homedir();
}
