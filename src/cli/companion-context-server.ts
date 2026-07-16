/**
 * Companion context server-side orchestration (ADR 2026-07-16 §Decision 3/4,
 * 0.11.0 Phase 2).
 *
 * Wires the pure `zam_companion_context` wire contract
 * (`src/vscode-extension/companion-context.ts`, Phase 1) to real machine-local
 * persistence (the `companion` section of `~/.zam/config.json`,
 * `src/kernel/system/install-config.ts`) and to discovery this repo already
 * has — `inspectConnectHarnesses` for the configured-harness inventory and
 * `readDatabaseUserSummaries` for learner profiles — so this module adds no
 * parallel discovery logic of its own.
 *
 * Deliberately NOT Phase 3: every evaluator other than `quick-mode` is
 * reported `routable: false` here. Phase 2's goal is "make menu launches
 * deterministic without yet broadening model routing" (0.11.0 plan) — actual
 * adapter routing (native host sampling, `vscode.lm`) is Phase 3's job.
 *
 * Runs in the CLI/host layer, not the kernel: it holds a `Database` handle
 * and calls harness-detection code, so it must never be imported from
 * `src/kernel/`.
 */

import {
  type Database,
  getCompanionCollapsed,
  getCompanionSelectedEvaluatorId,
  getCompanionSelectedUserId,
  getSetting,
  setCompanionCollapsed,
  setCompanionSelectedEvaluatorId,
  setCompanionSelectedUserId,
} from "../kernel/index.js";
import {
  buildCompanionContext,
  COMPANION_SURFACES,
  type CompanionCollapsedState,
  type CompanionContextReadRequest,
  type CompanionContextReadResult,
  type CompanionContextWriteRequest,
  type CompanionSurface,
  type ConfiguredHarnessInfo,
  type NativeClientInfo,
  type NativeHostIdentity,
  normalizeNativeHostIdentity,
} from "../vscode-extension/companion-context.js";
import {
  DETACHED_HARNESS_EVALUATOR_IDS,
  type EvaluatorId,
  type EvaluatorRouteInput,
  isEvaluatorId,
} from "../vscode-extension/companion-evaluator.js";
import {
  isPersistableSelection,
  resolveSelection,
} from "../vscode-extension/companion-selection.js";
import {
  CONNECT_HARNESS_LABELS,
  type ConnectHarnessId,
  inspectConnectHarnesses,
} from "./agent-connect.js";
import { readDatabaseUserSummaries } from "./commands/bridge.js";

export interface CompanionContextServerOptions {
  /** Machine-local config path override — tests point this at a temp file. */
  configPath?: string;
}

export interface CompanionContextWriteOutcome {
  read: CompanionContextReadResult;
  /**
   * True when this write crossed a user/evaluator context boundary (ADR
   * §Decision 4: "Changing user or evaluator is a context boundary ...
   * reloads against the new context"). Collapsed-only writes never require a
   * reload — Phase 4 owns the actual remount/reload UI; this flag is the
   * plumbing it will act on.
   */
  reloadRequired: boolean;
}

function toConnectHarnessId(id: string): ConnectHarnessId {
  return id as ConnectHarnessId;
}

function buildHarnessInventory(
  harnesses: ReturnType<typeof inspectConnectHarnesses>["harnesses"],
): ConfiguredHarnessInfo[] {
  return harnesses.map((harness) => ({
    id: harness.harness,
    label: harness.label,
    configured: harness.configured,
  }));
}

/**
 * The evaluator route list for one context read. Only `quick-mode` is
 * routable in Phase 2 (see module docstring); `native-mcp-host` and
 * `vscode-lm` are named but not yet routable, and every configured detached
 * harness (Claude Code, Codex, opencode, goose) is represented honestly as
 * configured-but-unroutable per the ADR.
 */
function buildEvaluatorRouteInputs(
  harnessReport: ReturnType<typeof inspectConnectHarnesses>,
): EvaluatorRouteInput[] {
  const detachedStatusById = new Map(
    harnessReport.harnesses.map((harness) => [harness.harness, harness]),
  );

  const inputs: EvaluatorRouteInput[] = [
    {
      id: "quick-mode",
      displayIdentity: { provider: "Quick mode — no agent" },
      configured: true,
      routable: true,
    },
    {
      id: "native-mcp-host",
      displayIdentity: { provider: "Native host" },
      configured: true,
      routable: false,
      reason: "Native-host sampling routing lands in 0.11.0 Phase 3",
    },
    {
      id: "vscode-lm",
      displayIdentity: { provider: "VS Code language models" },
      configured: true,
      routable: false,
      reason: "VS Code language-model routing lands in 0.11.0 Phase 3",
    },
  ];

  for (const id of DETACHED_HARNESS_EVALUATOR_IDS) {
    const status = detachedStatusById.get(toConnectHarnessId(id));
    const label = CONNECT_HARNESS_LABELS[toConnectHarnessId(id)] ?? id;
    inputs.push({
      id,
      displayIdentity: { provider: label },
      configured: status?.configured ?? false,
      routable: false,
      reason: `${label} has no MCP sampling relay in 0.11.0`,
    });
  }

  return inputs;
}

function toCompanionCollapsedState(
  raw: Record<string, boolean>,
): CompanionCollapsedState {
  const state: CompanionCollapsedState = {};
  for (const surface of COMPANION_SURFACES) {
    if (typeof raw[surface] === "boolean") state[surface] = raw[surface];
  }
  return state;
}

interface AssembleContextInput {
  surface: CompanionSurface;
  nativeHost?: NativeHostIdentity;
  invocationUserId?: string;
  configPath?: string;
}

/** Shared assembly used by both the read action and the opening tools. */
async function assembleCompanionContext(
  db: Database,
  input: AssembleContextInput,
): Promise<CompanionContextReadResult> {
  const persistedUserId = getCompanionSelectedUserId(input.configPath);
  const persistedEvaluatorRaw = getCompanionSelectedEvaluatorId(
    input.configPath,
  );
  const persistedEvaluatorId: EvaluatorId | undefined = isEvaluatorId(
    persistedEvaluatorRaw,
  )
    ? persistedEvaluatorRaw
    : undefined;
  const collapsedRaw = getCompanionCollapsed(input.configPath);

  // Legacy fallback: the shared database's `user.id`, exactly as every other
  // MCP tool already resolves it. Never throws — an unset default just
  // leaves `fallback` undefined, matching `buildCompanionContext`'s
  // documented backward-compatible behavior.
  const fallbackUserId = (await getSetting(db, "user.id")) ?? undefined;

  const harnessReport = inspectConnectHarnesses();
  const profiles = await readDatabaseUserSummaries(db);

  const { read } = buildCompanionContext({
    surface: input.surface,
    nativeHost: input.nativeHost,
    userSelection: {
      invocation: input.invocationUserId,
      persisted: persistedUserId,
      fallback: fallbackUserId,
    },
    evaluatorSelection: {
      persisted: persistedEvaluatorId,
      // Phase 2 does not broaden model routing (see module docstring), so the
      // legacy default is "no evaluator" rather than guessing at one that
      // cannot yet be activated.
      fallback: "quick-mode",
    },
    evaluatorRouteInputs: buildEvaluatorRouteInputs(harnessReport),
    profiles,
    harnesses: buildHarnessInventory(harnessReport.harnesses),
    collapsed: toCompanionCollapsedState(collapsedRaw),
  });
  return read;
}

/** Handle a `zam_companion_context` read action. */
export async function readCompanionContext(
  db: Database,
  request: CompanionContextReadRequest,
  options: CompanionContextServerOptions = {},
): Promise<CompanionContextReadResult> {
  const nativeHost = normalizeNativeHostIdentity(
    request.clientInfo,
    request.harnessOverride,
  );
  return assembleCompanionContext(db, {
    surface: request.surface,
    nativeHost,
    configPath: options.configPath,
  });
}

/**
 * Resolve the context needed for first paint when `zam_open_recall`,
 * `zam_show_graph`, or `zam_open_settings` open a panel — precedence:
 * explicit tool argument (session-scoped) > persisted Companion selection >
 * legacy default user (ADR §Decision 4; the "manual" tier only exists inside
 * an already-mounted app and is not part of an opening call).
 */
export async function resolveOpeningCompanionContext(
  db: Database,
  surface: CompanionSurface,
  invocationUserId: string | undefined,
  clientInfo: NativeClientInfo | undefined,
  options: CompanionContextServerOptions = {},
): Promise<CompanionContextReadResult> {
  return assembleCompanionContext(db, {
    surface,
    nativeHost: normalizeNativeHostIdentity(clientInfo),
    invocationUserId,
    configPath: options.configPath,
  });
}

/**
 * Handle a `zam_companion_context` write action. Every field on a write
 * request is, by contract, a manual context-bar choice (the parsed request
 * shape has no invocation tier at all) — `resolveSelection`/
 * `isPersistableSelection` are still run explicitly so the same Phase 1 gate
 * that keeps an invocation value out of persisted storage stays the single
 * code path deciding what may reach disk, rather than writing unconditionally
 * here and duplicating that judgment call.
 */
export async function writeCompanionContext(
  db: Database,
  request: CompanionContextWriteRequest,
  options: CompanionContextServerOptions = {},
): Promise<CompanionContextWriteOutcome> {
  const configPath = options.configPath;
  let reloadRequired = false;

  if (request.userId !== undefined) {
    const selection = resolveSelection<string | undefined>({
      manual: request.userId,
      fallback: undefined,
    });
    if (isPersistableSelection(selection) && selection.value) {
      setCompanionSelectedUserId(selection.value, configPath);
      reloadRequired = true;
    }
  }

  if (request.evaluatorId !== undefined) {
    const selection = resolveSelection<EvaluatorId | undefined>({
      manual: request.evaluatorId,
      fallback: undefined,
    });
    if (isPersistableSelection(selection) && selection.value) {
      setCompanionSelectedEvaluatorId(selection.value, configPath);
      reloadRequired = true;
    }
  }

  if (request.collapsed !== undefined) {
    setCompanionCollapsed(request.surface, request.collapsed, configPath);
  }

  const read = await assembleCompanionContext(db, {
    surface: request.surface,
    configPath,
  });
  return { read, reloadRequired };
}
