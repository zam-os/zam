/**
 * Companion app-context contract (ADR 2026-07-16 §Decision 1, 3, 4; 0.11.0
 * Phase 1).
 *
 * This is the shared read/write contract for the compact context bar every
 * focused MCP App (Recall, Graph, Settings) and the legacy Studio app will
 * render: which surface is open, who the learner is, which native MCP host
 * rendered the app (if any), which harnesses are configured, and which
 * evaluator is configured/routable/selected/active for this request.
 *
 * Everything here is pure — parsing, normalization, and one context builder
 * function. No `~/.zam/config.json` I/O, no `vscode` import, no HTTP: this
 * module must be importable from a plain Vitest test and, unchanged, from
 * both the `zam mcp` server bundle and the VS Code Companion host bundle
 * (Phase 2 wires the persistence; Phase 4 wires the UI).
 *
 * Only a `Rating` *type* is imported from the kernel — the kernel itself
 * stays AI-agnostic and never imports anything from this module.
 */

import type { ConnectHarnessId } from "../cli/agent-harness.js";
import type { Rating } from "../kernel/index.js";
import {
  activateSelectedEvaluator,
  buildEvaluatorRoutes,
  type EvaluatorId,
  type EvaluatorRoute,
  type EvaluatorRouteInput,
  EvaluatorUnavailableError,
  isEvaluatorId,
} from "./companion-evaluator.js";
import {
  resolveSelection,
  type SelectionCandidates,
  type SelectionResult,
  type SelectionSource,
} from "./companion-selection.js";

/** Every surface that gets the shared context bar. */
export const COMPANION_SURFACES = [
  "recall",
  "graph",
  "settings",
  "studio",
  "okf",
] as const;

export type CompanionSurface = (typeof COMPANION_SURFACES)[number];

export function isCompanionSurface(value: unknown): value is CompanionSurface {
  return (
    typeof value === "string" &&
    (COMPANION_SURFACES as readonly string[]).includes(value)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ── Native host identity (ADR "Resolved questions" §2) ───────────────────

export interface NativeClientInfo {
  name: string;
  version?: string;
}

export interface NativeHostIdentity {
  /** The MCP `clientInfo.name` (or override) exactly as reported. */
  rawName: string;
  version?: string;
  /** Set only when `rawName`/override matched a known entry — never guessed. */
  normalizedId?: string;
  /** Display label: the known mapping's label, or the raw name unmodified. */
  label: string;
}

/**
 * Confirmed MCP `clientInfo.name` → normalized identity. The Companion
 * extension identifies itself as `vscode-zam-companion` (see
 * `src/vscode-extension/host.ts`). Add an entry here only once a client's
 * `clientInfo.name` has actually been observed — an unknown name keeps its
 * raw text (see `normalizeNativeHostIdentity`) rather than being guessed at.
 */
const KNOWN_NATIVE_HOSTS: Record<
  string,
  { normalizedId: string; label: string }
> = {
  "vscode-zam-companion": {
    normalizedId: "vscode-companion",
    label: "VS Code Companion",
  },
  "antigravity-zam-companion": {
    normalizedId: "antigravity-companion",
    label: "Antigravity Companion",
  },
};

/**
 * Normalize a native MCP host's identity. `harnessOverride` — an explicit
 * harness id passed as an opening argument — takes precedence over
 * `clientInfo` for launch presets and tests (ADR "Resolved questions" §2); an
 * unrecognized name or override is kept verbatim as both `rawName` and
 * `label`, never mapped to a guessed identity.
 */
export function normalizeNativeHostIdentity(
  clientInfo: NativeClientInfo | undefined,
  harnessOverride?: string,
): NativeHostIdentity | undefined {
  if (harnessOverride) {
    const known = KNOWN_NATIVE_HOSTS[harnessOverride];
    return {
      rawName: clientInfo?.name ?? harnessOverride,
      version: clientInfo?.version,
      normalizedId: known?.normalizedId,
      label: known?.label ?? harnessOverride,
    };
  }
  if (!clientInfo) return undefined;
  const known = KNOWN_NATIVE_HOSTS[clientInfo.name];
  return {
    rawName: clientInfo.name,
    version: clientInfo.version,
    normalizedId: known?.normalizedId,
    label: known?.label ?? clientInfo.name,
  };
}

// ── Learner profiles (0.11.0 Phase 2) ─────────────────────────────────────

/**
 * One learning profile the shared database knows about, for the Companion's
 * learner picker. Mirrors `DatabaseUserSummary` from
 * `src/cli/commands/bridge.ts` (`database-status`) — Phase 2 reuses that
 * existing query rather than adding a parallel one.
 */
export interface CompanionLearnerProfile {
  id: string;
  cardCount: number;
}

// ── Configured harness inventory ──────────────────────────────────────────

/**
 * One row of "ZAM MCP configuration exists for this harness" — reuses the
 * same harness ids `zam agent connect` already detects/writes
 * (`src/cli/agent-harness.ts`), so Phase 2 can fill this from the existing
 * detection logic instead of a parallel registry.
 */
export interface ConfiguredHarnessInfo {
  id: ConnectHarnessId;
  label: string;
  configured: boolean;
}

// ── Collapsed state per surface ───────────────────────────────────────────

export type CompanionCollapsedState = Partial<
  Record<CompanionSurface, boolean>
>;

/** Collapsed defaults to expanded (`false`) for a surface never persisted. */
export function resolveCollapsedForSurface(
  state: CompanionCollapsedState | undefined,
  surface: CompanionSurface,
): boolean {
  return state?.[surface] ?? false;
}

// ── User context ──────────────────────────────────────────────────────────

export interface CompanionUserState {
  /** The learner in scope for this request — may be undefined pre-setup. */
  currentId?: string;
  /** The persisted Companion learner, independent of any invocation override. */
  persistedId?: string;
  source: SelectionSource;
}

/** The one rating-call shape the Companion ever submits (mirrors `zam_submit_review`). */
export interface CompanionRatingRequest {
  /** Always the resolved user shown in the title bar — never inferred server-side. */
  user: string;
  cardId?: string;
  tokenId?: string;
  rating?: Rating;
  sessionId?: string;
  doneBy?: "user" | "agent";
}

/**
 * Attach the Companion's resolved user to a rating call. Throws instead of
 * submitting an unattributed rating: the visible User pill is part of the
 * FSRS safety boundary (ADR "Safety and privacy"), so a context with no
 * resolved user must fail the call rather than let it fall through to some
 * other implicit default.
 */
export function attachCompanionUser(
  user: CompanionUserState,
  params: Omit<CompanionRatingRequest, "user">,
): CompanionRatingRequest {
  if (!user.currentId) {
    throw new Error(
      "Companion context has no resolved user; refusing to submit a rating " +
        "without the user shown in the title bar.",
    );
  }
  return { user: user.currentId, ...params };
}

// ── The app-context read/write contract ───────────────────────────────────

export interface CompanionContextReadRequest {
  surface: CompanionSurface;
  clientInfo?: NativeClientInfo;
  harnessOverride?: string;
}

export interface CompanionContextReadResult {
  surface: CompanionSurface;
  nativeHost?: NativeHostIdentity;
  user: CompanionUserState;
  /** Every learning profile the shared database knows about (Phase 2). */
  profiles: CompanionLearnerProfile[];
  harnesses: ConfiguredHarnessInfo[];
  evaluators: EvaluatorRoute[];
  selectedEvaluatorId?: EvaluatorId;
  activeEvaluatorId?: EvaluatorId;
  collapsed: boolean;
}

export interface CompanionContextWriteRequest {
  surface: CompanionSurface;
  userId?: string;
  evaluatorId?: EvaluatorId;
  collapsed?: boolean;
}

/** Parse an untrusted `zam_companion_context` read-action payload. */
export function parseCompanionContextReadRequest(
  value: unknown,
): CompanionContextReadRequest {
  if (!isRecord(value) || !isCompanionSurface(value.surface)) {
    throw new Error("Invalid companion context read request");
  }
  const rawClientInfo = value.clientInfo;
  const clientInfo =
    isRecord(rawClientInfo) && typeof rawClientInfo.name === "string"
      ? {
          name: rawClientInfo.name,
          version:
            typeof rawClientInfo.version === "string"
              ? rawClientInfo.version
              : undefined,
        }
      : undefined;
  const harnessOverride =
    typeof value.harnessOverride === "string"
      ? value.harnessOverride
      : undefined;
  return { surface: value.surface, clientInfo, harnessOverride };
}

/**
 * Parse an untrusted `zam_companion_context` write-action payload. The write
 * operation changes only the selected user, evaluator, or collapsed state
 * (ADR §Decision 3) — at least one of the three must be present.
 */
export function parseCompanionContextWriteRequest(
  value: unknown,
): CompanionContextWriteRequest {
  if (!isRecord(value) || !isCompanionSurface(value.surface)) {
    throw new Error("Invalid companion context write request");
  }
  const userId = typeof value.userId === "string" ? value.userId : undefined;
  let evaluatorId: EvaluatorId | undefined;
  if (value.evaluatorId !== undefined) {
    if (!isEvaluatorId(value.evaluatorId)) {
      throw new Error(
        `Unknown evaluator id in companion context write request: ${String(value.evaluatorId)}`,
      );
    }
    evaluatorId = value.evaluatorId;
  }
  const collapsed =
    typeof value.collapsed === "boolean" ? value.collapsed : undefined;
  if (
    userId === undefined &&
    evaluatorId === undefined &&
    collapsed === undefined
  ) {
    throw new Error(
      "Companion context write request must set userId, evaluatorId, and/or collapsed",
    );
  }
  return { surface: value.surface, userId, evaluatorId, collapsed };
}

// ── Assembling one context read result ────────────────────────────────────

export interface BuildCompanionContextInput {
  surface: CompanionSurface;
  nativeHost?: NativeHostIdentity;
  userSelection: SelectionCandidates<string | undefined>;
  evaluatorSelection: SelectionCandidates<EvaluatorId>;
  evaluatorRouteInputs: EvaluatorRouteInput[];
  /** Optional for backward compatibility with pre-Phase-2 callers/tests; defaults to `[]`. */
  profiles?: CompanionLearnerProfile[];
  harnesses: ConfiguredHarnessInfo[];
  collapsed?: CompanionCollapsedState;
}

export interface CompanionContextBuildResult {
  read: CompanionContextReadResult;
  userSelection: SelectionResult<string | undefined>;
  evaluatorSelection: SelectionResult<EvaluatorId>;
  /**
   * Set when the selected evaluator could not be activated. `read.evaluators`
   * still lists it (selected, not active, with its reason) — nothing in this
   * builder ever substitutes a different route as active instead.
   */
  activeEvaluatorError?: EvaluatorUnavailableError;
}

/**
 * Build one `zam_companion_context` read result. Backward-compatible
 * default: with no invocation/manual/persisted candidates supplied for
 * either selection, the result falls back to the caller-supplied legacy
 * defaults (e.g. the database's `user.id`, and a `quick-mode` evaluator)
 * without throwing — an old caller that never learned about Companion
 * context still gets a usable, honestly-labeled result.
 */
export function buildCompanionContext(
  input: BuildCompanionContextInput,
): CompanionContextBuildResult {
  const userSelection = resolveSelection(input.userSelection);
  const evaluatorSelection = resolveSelection(input.evaluatorSelection);

  const routes = buildEvaluatorRoutes(
    input.evaluatorRouteInputs,
    evaluatorSelection.value,
  );

  let activeEvaluatorId: EvaluatorId | undefined;
  let activeEvaluatorError: EvaluatorUnavailableError | undefined;
  try {
    activateSelectedEvaluator(routes, evaluatorSelection.value);
    activeEvaluatorId = evaluatorSelection.value;
  } catch (error) {
    if (error instanceof EvaluatorUnavailableError) {
      activeEvaluatorError = error;
    } else {
      throw error;
    }
  }
  const evaluators = activeEvaluatorId
    ? routes.map((route) =>
        route.id === activeEvaluatorId ? { ...route, active: true } : route,
      )
    : routes;

  return {
    read: {
      surface: input.surface,
      nativeHost: input.nativeHost,
      user: {
        currentId: userSelection.value,
        persistedId: input.userSelection.persisted,
        source: userSelection.source,
      },
      profiles: input.profiles ?? [],
      harnesses: input.harnesses,
      evaluators,
      selectedEvaluatorId: evaluatorSelection.value,
      activeEvaluatorId,
      collapsed: resolveCollapsedForSurface(input.collapsed, input.surface),
    },
    userSelection,
    evaluatorSelection,
    activeEvaluatorError,
  };
}
