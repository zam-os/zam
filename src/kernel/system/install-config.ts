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
  unlinkSync,
  writeFileSync,
} from "node:fs";
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

/**
 * Machine-local first-run onboarding state (ADR 2026-07-24). Whether the
 * guided first-run flow has completed is per-install, not per-learner: a
 * paired phone or a second machine runs its own first-run. Deliberately never
 * the (Turso-shareable) database.
 */
export interface MachineOnboardingConfig {
  /** True once the first-run flow reached its final page on THIS machine. */
  done?: boolean;
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
  const config = loadInstallConfig(path);
  if (done) {
    config.onboarding = { ...(config.onboarding ?? {}), done: true };
  } else if (config.onboarding) {
    delete config.onboarding.done;
  }
  saveInstallConfig(config, path);
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
  const raw = loadInstallConfig(path).companion;
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
  const config = loadInstallConfig(path);
  config.companion = companion;
  saveInstallConfig(config, path);
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
  const companion = getMachineCompanionConfig(path);
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
  saveMachineCompanionConfig(companion, path);
  return companion;
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
  const companion = getMachineCompanionConfig(path);
  if (userId) {
    companion.selectedUserId = userId;
  } else {
    delete companion.selectedUserId;
  }
  saveMachineCompanionConfig(companion, path);
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
  const companion = getMachineCompanionConfig(path);
  if (evaluatorId) {
    companion.selectedEvaluatorId = evaluatorId;
  } else {
    delete companion.selectedEvaluatorId;
  }
  saveMachineCompanionConfig(companion, path);
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
  const companion = getMachineCompanionConfig(path);
  if (evaluatorId) {
    companion.selectedVscodeEvaluatorId = evaluatorId;
  } else {
    delete companion.selectedVscodeEvaluatorId;
  }
  saveMachineCompanionConfig(companion, path);
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
  const companion = getMachineCompanionConfig(path);
  if (evaluatorId) {
    companion.selectedAntigravityEvaluatorId = evaluatorId;
  } else {
    delete companion.selectedAntigravityEvaluatorId;
  }
  saveMachineCompanionConfig(companion, path);
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
  const companion = getMachineCompanionConfig(path);
  if (modelId) {
    companion.selectedVscodeModelId = modelId;
  } else {
    delete companion.selectedVscodeModelId;
  }
  saveMachineCompanionConfig(companion, path);
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
  const companion = getMachineCompanionConfig(path);
  if (modelId) {
    companion.selectedAntigravityModelId = modelId;
  } else {
    delete companion.selectedAntigravityModelId;
  }
  saveMachineCompanionConfig(companion, path);
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
  const companion = getMachineCompanionConfig(path);
  companion.collapsed = {
    ...(companion.collapsed ?? {}),
    [surface]: collapsed,
  };
  saveMachineCompanionConfig(companion, path);
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
  const config = loadInstallConfig(path);
  config.lastRepairedVersion = version;
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
