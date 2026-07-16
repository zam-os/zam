/**
 * Companion context server-side orchestration (ADR 2026-07-16 §Decision 3/4/5,
 * 0.11.0 Phase 2/3).
 *
 * Wires the pure `zam_companion_context` wire contract
 * (`src/vscode-extension/companion-context.ts`, Phase 1) to real machine-local
 * persistence (the `companion` section of `~/.zam/config.json`,
 * `src/kernel/system/install-config.ts`) and to discovery this repo already
 * has — `inspectConnectHarnesses` for the configured-harness inventory and
 * `readDatabaseUserSummaries` for learner profiles — so this module adds no
 * parallel discovery logic of its own.
 *
 * Routability (0.11.0 Phase 3) is truthful and surface-dependent, never
 * guessed:
 * - `vscode-lm` is routable only when the requesting native host IS the VS
 *   Code Companion (`nativeHost.normalizedId === "vscode-companion"`,
 *   negotiated from the MCP `clientInfo` handshake) — only that surface has
 *   an adapter (`src/vscode-extension/companion-adapters.ts`) that can reach
 *   `vscode.lm` at all. This module cannot itself call `vscode.lm` (it runs
 *   as a Node CLI/MCP-server process, not inside the VS Code extension host)
 *   — routability here is "an adapter exists for this connection", not "a
 *   model is live right now"; the live, model-specific check happens inside
 *   the Companion extension when it actually evaluates an answer.
 * - `native-mcp-host` is routable only when the connecting MCP client is NOT
 *   the VS Code Companion AND it advertised `sampling` capability during the
 *   `initialize` handshake (`ClientCapabilities.sampling`, threaded in via
 *   `CompanionContextServerOptions.clientSamplingCapable`). The ADR also
 *   mentions a host advertising `ui/message` as an alternative signal, but
 *   that capability is negotiated between the MCP App and its rendering host
 *   over the App Bridge protocol, not visible to this server-side process —
 *   so it is not claimed here rather than guessed at.
 * - Every detached harness (Claude Code, Codex, opencode, goose) stays
 *   configured-but-unroutable: the relay is deferred past 0.11.0.
 *
 * Runs in the CLI/host layer, not the kernel: it holds a `Database` handle
 * and calls harness-detection code, so it must never be imported from
 * `src/kernel/`.
 */

import {
  type Database,
  getMachineCompanionConfig,
  getSetting,
  type MachineCompanionConfigUpdate,
  updateMachineCompanionConfig,
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
  type HarnessStatusReport,
  inspectConnectHarnesses,
} from "./agent-connect.js";
import { readDatabaseUserSummaries } from "./commands/bridge.js";

export interface CompanionContextServerOptions {
  /** Machine-local config path override — tests point this at a temp file. */
  configPath?: string;
  /**
   * Whether the connecting MCP client advertised `sampling` capability
   * during the `initialize` handshake (`ClientCapabilities.sampling`). The
   * only genuinely observable, non-guessed signal this server-side process
   * has for whether the `native-mcp-host` adapter could reach this
   * connection (ADR 2026-07-16 §Decision 5). Defaults to `false` — absent
   * evidence, never routable.
   */
  clientSamplingCapable?: boolean;
  /**
   * The connecting MCP client's negotiated identity. `readCompanionContext`
   * and `resolveOpeningCompanionContext` derive this from their own
   * request/argument instead; `writeCompanionContext` takes it here so its
   * post-write read is assembled against the *same* connection identity a
   * read on this connection would use — a write must not silently drop back
   * to an anonymous/undefined native host and under-report routability
   * (e.g. `vscode-lm`) right after a Companion-initiated write.
   */
  clientInfo?: NativeClientInfo;
}

// ── Harness-report memoization (0.11.0 perf finding) ───────────────────────
//
// `inspectConnectHarnesses` re-probes every configured harness's config file
// from disk on every call. Every context read/write/open call in one process
// hits it, so a burst of Companion activity (opening Recall, then Graph, then
// writing a selection) re-reads the same handful of files repeatedly for
// data that changes only when the user runs `zam agent connect` again.
// Memoized for a short TTL — long enough to absorb a burst, short enough
// that a freshly-run `agent connect` is reflected without a restart.

const HARNESS_REPORT_TTL_MS = 30_000;

let cachedHarnessReport:
  | { report: HarnessStatusReport; expiresAt: number }
  | undefined;

function getHarnessReportCached(): HarnessStatusReport {
  const now = Date.now();
  if (cachedHarnessReport && cachedHarnessReport.expiresAt > now) {
    return cachedHarnessReport.report;
  }
  const report = inspectConnectHarnesses();
  cachedHarnessReport = { report, expiresAt: now + HARNESS_REPORT_TTL_MS };
  return report;
}

/**
 * Test-only: clears the memoized harness report so a test's fake FS/PATH
 * state (or a freshly-written `.mcp.json`) is reflected immediately instead
 * of waiting out the TTL.
 */
export function resetCompanionHarnessReportCache(): void {
  cachedHarnessReport = undefined;
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
 * The evaluator route list for one context read. `quick-mode` is always
 * routable. `vscode-lm` and `native-mcp-host` are truthful and
 * surface-dependent (0.11.0 Phase 3, see module docstring) — never both
 * routable at once, since they are mutually exclusive facts about the same
 * connection: either the connecting client IS the VS Code Companion, or it
 * is some other MCP client that may or may not advertise sampling. Every
 * configured detached harness (Claude Code, Codex, opencode, goose) is
 * represented honestly as configured-but-unroutable per the ADR — the relay
 * is deferred past 0.11.0.
 */
function buildEvaluatorRouteInputs(
  harnessReport: ReturnType<typeof inspectConnectHarnesses>,
  nativeHost: NativeHostIdentity | undefined,
  clientSamplingCapable: boolean,
): EvaluatorRouteInput[] {
  const detachedStatusById = new Map(
    harnessReport.harnesses.map((harness) => [harness.harness, harness]),
  );

  const isVscodeCompanion =
    nativeHost?.normalizedId === "vscode-companion" ||
    nativeHost?.normalizedId === "antigravity-companion";
  const nativeHostRoutable = !isVscodeCompanion && clientSamplingCapable;

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
      routable: nativeHostRoutable,
      reason: nativeHostRoutable
        ? undefined
        : isVscodeCompanion
          ? "The VS Code Companion routes through the VS Code language-model adapter, not native host sampling."
          : "This MCP client did not advertise sampling support when it connected.",
    },
    {
      id: "vscode-lm",
      displayIdentity: { provider: "VS Code language models" },
      configured: true,
      routable: isVscodeCompanion,
      reason: isVscodeCompanion
        ? undefined
        : "VS Code language-model routing is only available from the VS Code Companion extension.",
    },
    {
      id: "zam-text-model",
      displayIdentity: { provider: "ZAM text model" },
      configured: true,
      routable: true,
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
  clientSamplingCapable?: boolean;
}

/** Shared assembly used by both the read action and the opening tools. */
async function assembleCompanionContext(
  db: Database,
  input: AssembleContextInput,
): Promise<CompanionContextReadResult> {
  // One load of the `companion` config section instead of three separate
  // getters (each of which used to re-load and re-normalize the whole
  // section on its own).
  const companionConfig = getMachineCompanionConfig(input.configPath);
  const persistedUserId = companionConfig.selectedUserId;
  const isAntigravity =
    input.nativeHost?.normalizedId === "antigravity-companion";
  const persistedEvaluatorIdRaw = isAntigravity
    ? (companionConfig.selectedAntigravityEvaluatorId ??
      companionConfig.selectedEvaluatorId)
    : (companionConfig.selectedVscodeEvaluatorId ??
      companionConfig.selectedEvaluatorId);
  const persistedEvaluatorId: EvaluatorId | undefined = isEvaluatorId(
    persistedEvaluatorIdRaw,
  )
    ? persistedEvaluatorIdRaw
    : undefined;
  const collapsedRaw = companionConfig.collapsed ?? {};

  const harnessReport = getHarnessReportCached();
  const clientSamplingCapable = input.clientSamplingCapable ?? false;
  const isVscodeCompanion =
    input.nativeHost?.normalizedId === "vscode-companion";

  // Three independent reads against the same db handle — run concurrently
  // rather than serially awaiting each in turn:
  // - the legacy database default `user.id`, exactly as every other MCP
  //   tool already resolves it (never throws; an unset default just leaves
  //   `fallback` undefined, matching `buildCompanionContext`'s documented
  //   backward-compatible behavior);
  // - the learner profile list for the picker; and
  // - the legacy `recall.quick_mode` setting, which seeds (never overrides)
  //   the default evaluator below.
  const [fallbackUserIdRaw, profiles, quickModeRaw] = await Promise.all([
    getSetting(db, "user.id"),
    readDatabaseUserSummaries(db),
    getSetting(db, "recall.quick_mode"),
  ]);
  const fallbackUserId = fallbackUserIdRaw ?? undefined;
  const quickModeSettingIsOn = quickModeRaw === "true";

  // No persisted preference yet: default to the one adapter that is
  // actually routable for this connection (Phase 3) rather than always
  // naming quick mode — a Companion opened for the first time should show
  // the Agent pill it will really use, not a conservative placeholder. This
  // is a *default*, not a fallback-after-failure: it only applies when
  // nothing has been explicitly selected or persisted (see
  // `resolveSelection`'s precedence order), so it never overrides an
  // existing choice.
  //
  // The legacy `recall.quick_mode` setting seeds this default to quick mode
  // regardless of connection when it is "true" — so a machine that opted
  // into the pre-0.11.0 quick-mode-only behavior sees an Agent pill that
  // matches what Recall actually does, without that legacy setting ever
  // overriding an explicit/persisted evaluator choice (it only occupies the
  // `fallback` slot of the selection precedence, same as `isVscodeCompanion`
  // below).
  const defaultEvaluatorId: EvaluatorId = quickModeSettingIsOn
    ? "quick-mode"
    : isVscodeCompanion
      ? "vscode-lm"
      : clientSamplingCapable
        ? "native-mcp-host"
        : "quick-mode";

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
      fallback: defaultEvaluatorId,
    },
    evaluatorRouteInputs: buildEvaluatorRouteInputs(
      harnessReport,
      input.nativeHost,
      clientSamplingCapable,
    ),
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
    clientSamplingCapable: options.clientSamplingCapable,
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
    clientSamplingCapable: options.clientSamplingCapable,
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
  // Accumulate every touched field and persist them with one batched
  // load-apply-save (`updateMachineCompanionConfig`) instead of the
  // individual setters' one-load-one-save-per-field pattern — a write that
  // sets userId, evaluatorId, and collapsed all at once now does one read
  // and one write of `~/.zam/config.json`, not three.
  const update: MachineCompanionConfigUpdate = {};

  if (request.userId !== undefined) {
    const selection = resolveSelection<string | undefined>({
      manual: request.userId,
      fallback: undefined,
    });
    if (isPersistableSelection(selection) && selection.value) {
      update.selectedUserId = selection.value;
      reloadRequired = true;
    }
  }

  if (request.evaluatorId !== undefined) {
    const selection = resolveSelection<EvaluatorId | undefined>({
      manual: request.evaluatorId,
      fallback: undefined,
    });
    if (isPersistableSelection(selection) && selection.value) {
      const nativeHost = normalizeNativeHostIdentity(options.clientInfo);
      const isAntigravity =
        nativeHost?.normalizedId === "antigravity-companion";
      if (isAntigravity) {
        update.selectedAntigravityEvaluatorId = selection.value;
      } else {
        update.selectedVscodeEvaluatorId = selection.value;
      }
      reloadRequired = true;
    }
  }

  if (request.collapsed !== undefined) {
    update.collapsed = { surface: request.surface, value: request.collapsed };
  }

  if (Object.keys(update).length > 0) {
    updateMachineCompanionConfig(update, configPath);
  }

  // Assemble the post-write read against the *same* connection identity a
  // read on this connection would use (finding: the write path must not
  // drop it) — otherwise a write from a Companion-identified connection
  // would report `vscode-lm` as unroutable and silently fall back to
  // `quick-mode` immediately after the write that just set it.
  const read = await assembleCompanionContext(db, {
    surface: request.surface,
    nativeHost: normalizeNativeHostIdentity(options.clientInfo),
    configPath,
    clientSamplingCapable: options.clientSamplingCapable,
  });
  return { read, reloadRequired };
}
