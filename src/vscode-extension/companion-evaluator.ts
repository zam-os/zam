/**
 * Companion evaluator adapter contract (ADR 2026-07-16 §Decision 2 and §5,
 * 0.11.0 Phase 1).
 *
 * "Evaluator" is the internal contract vocabulary for whatever checks a
 * learner's typed answer and can hold a grounded follow-up turn. The UI-only
 * label is "Agent" (see the Companion context bar); nothing in this module
 * renders UI, so it uses the honest contract term throughout.
 *
 * The initial routable adapter set (ADR §Decision 5) is:
 * - `native-mcp-host` — authoritative when the app's own MCP host advertises
 *   sampling or `ui/message`;
 * - `vscode-lm` — VS Code's `vscode.lm` API, scoped to models an installed
 *   extension actually contributed (e.g. Copilot's roster);
 * - `quick-mode` — the model-free, reveal-and-self-rate fallback.
 *
 * Claude Code, Codex, opencode, and goose are *not* adapters here: no tested
 * adapter can reach a detached harness's own conversation in 0.11.0 (the
 * relay is deferred — see the ADR's "Resolved questions" §1/§4). They are
 * represented as configured-but-unroutable entries in the same evaluator
 * route list, never as something that could become "active".
 *
 * This module defines the adapter interface and pure route/selection helpers
 * only. No adapter implementation, `vscode.lm` call, or sampling change
 * belongs here — those are Phase 3.
 */

import type { NormalizedSamplingRequest } from "./protocol.js";

/** Adapters that can actually route an evaluation request in 0.11.0. */
export const ROUTABLE_EVALUATOR_IDS = [
  "native-mcp-host",
  "vscode-lm",
  "quick-mode",
] as const;

export type RoutableEvaluatorId = (typeof ROUTABLE_EVALUATOR_IDS)[number];

/**
 * Detached harnesses the Companion can *name* but not yet route to. Kept as a
 * closed list matching the ADR rather than reusing the broader harness-connect
 * registry, so adding a new MCP-configurable harness there does not silently
 * imply Companion routing support.
 */
export const DETACHED_HARNESS_EVALUATOR_IDS = [
  "claude-code",
  "codex",
  "opencode",
  "goose",
] as const;

export type DetachedHarnessEvaluatorId =
  (typeof DETACHED_HARNESS_EVALUATOR_IDS)[number];

export type EvaluatorId = RoutableEvaluatorId | DetachedHarnessEvaluatorId;

export function isEvaluatorId(value: unknown): value is EvaluatorId {
  return (
    typeof value === "string" &&
    ((ROUTABLE_EVALUATOR_IDS as readonly string[]).includes(value) ||
      (DETACHED_HARNESS_EVALUATOR_IDS as readonly string[]).includes(value))
  );
}

/**
 * What the Agent pill actually names. Must carry the concrete provider and,
 * when there is one, the concrete model — never a generic host name alone.
 * `formatEvaluatorLabel` enforces the "never a bare VS Code / bare Claude"
 * acceptance criterion at the point where the two are joined into text.
 */
export interface EvaluatorDisplayIdentity {
  /** Contributing provider or route, e.g. "Copilot", "Native host", "Quick mode". */
  provider: string;
  /** Concrete model, when the adapter has one, e.g. "Claude Sonnet 5". */
  model?: string;
}

export interface EvaluatorAvailability {
  available: boolean;
  /** Required explanation whenever `available` is false. */
  reason?: string;
}

export interface EvaluatorTurnResult {
  /** Concrete model id actually used; feeds `createSamplingResult` in protocol.ts. */
  model: string;
  text: string;
}

/**
 * One evaluator's behavior. Availability and identity may be async (a real
 * `vscode.lm` adapter probes `selectChatModels`); evaluation and follow-up
 * reuse the same text-sampling shape already validated by
 * `normalizeSamplingRequest` in protocol.ts, so an adapter's output can be
 * handed straight to `createSamplingResult`.
 */
export interface EvaluatorAdapter {
  readonly id: RoutableEvaluatorId;
  displayIdentity():
    | EvaluatorDisplayIdentity
    | Promise<EvaluatorDisplayIdentity>;
  availability(): EvaluatorAvailability | Promise<EvaluatorAvailability>;
  evaluateAnswer(
    input: NormalizedSamplingRequest,
  ): Promise<EvaluatorTurnResult>;
  followUp(input: NormalizedSamplingRequest): Promise<EvaluatorTurnResult>;
}

const DISHONEST_BARE_PROVIDERS = new Set(["vs code", "vscode", "claude"]);

/**
 * Render the Agent pill value. Throws rather than returning a misleading
 * label for the two specific dishonest shapes the ADR calls out: a bare
 * "VS Code" (hides which extension's models are in play) and a bare "Claude"
 * (could be mistaken for the detached Claude Code harness rather than a
 * Copilot-served Claude model).
 */
export function formatEvaluatorLabel(
  identity: EvaluatorDisplayIdentity,
): string {
  const provider = identity.provider.trim();
  if (!provider) {
    throw new Error("Evaluator display identity requires a non-empty provider");
  }
  if (!identity.model && DISHONEST_BARE_PROVIDERS.has(provider.toLowerCase())) {
    throw new Error(
      `Evaluator display identity must not be a bare "${provider}" — name the ` +
        'concrete provider and model (e.g. "Copilot: Claude Sonnet 5").',
    );
  }
  return identity.model ? `${provider}: ${identity.model}` : provider;
}

/** One row of the evaluator route list before selection/activation is applied. */
export interface EvaluatorRouteInput {
  id: EvaluatorId;
  displayIdentity: EvaluatorDisplayIdentity;
  /** ZAM MCP configuration exists for this harness/adapter. */
  configured: boolean;
  /** The current surface has an implemented adapter that can reach it. */
  routable: boolean;
  /** Required whenever `routable` is false — shown next to the disabled entry. */
  reason?: string;
}

/** The four-state model (ADR §Decision 2) plus the identity used to render it. */
export interface EvaluatorRoute extends EvaluatorRouteInput {
  /** The user chose this evaluator as their preferred one. */
  selected: boolean;
  /** The current Recall/Graph/Settings request is actually using it. */
  active: boolean;
}

/**
 * Assemble the evaluator route list for one context read. Only marks
 * `selected`; `active` is decided separately by `activateSelectedEvaluator`
 * so that an unroutable selection can never be marked active by construction.
 */
export function buildEvaluatorRoutes(
  inputs: EvaluatorRouteInput[],
  selectedId?: EvaluatorId,
): EvaluatorRoute[] {
  return inputs.map((input) => {
    if (!input.routable && !input.reason) {
      throw new Error(
        `Unroutable evaluator "${input.id}" must carry an availability reason`,
      );
    }
    return { ...input, selected: input.id === selectedId, active: false };
  });
}

/** Thrown by `activateSelectedEvaluator` — never caught-and-substituted. */
export class EvaluatorUnavailableError extends Error {
  public readonly evaluatorId: string;

  constructor(evaluatorId: string, reason: string) {
    super(`Evaluator "${evaluatorId}" is unavailable: ${reason}`);
    this.name = "EvaluatorUnavailableError";
    this.evaluatorId = evaluatorId;
  }
}

/**
 * Activate the selected evaluator for the current request. Returns the same
 * route with `active: true` on success. On failure — unknown id or a
 * configured-but-unroutable one — throws `EvaluatorUnavailableError` and
 * returns nothing: there is deliberately no code path here that picks a
 * different route from `routes` instead (ADR: "Unavailable harnesses stay
 * unavailable rather than silently falling back to a different model").
 */
export function activateSelectedEvaluator(
  routes: EvaluatorRoute[],
  selectedId: EvaluatorId,
): EvaluatorRoute {
  const route = routes.find((candidate) => candidate.id === selectedId);
  if (!route) {
    throw new EvaluatorUnavailableError(selectedId, "not configured");
  }
  if (!route.routable) {
    throw new EvaluatorUnavailableError(
      selectedId,
      route.reason ?? "not routable on this surface",
    );
  }
  return { ...route, active: true };
}
