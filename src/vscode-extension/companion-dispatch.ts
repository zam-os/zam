/**
 * VS Code Companion extension-side dispatch helpers (0.11.0 review findings
 * 1/2 on ADR 2026-07-16 §Decision 2/5).
 *
 * Factored out of `extension.ts`, like `companion-adapters.ts`, so both
 * findings are unit-testable without a real VS Code extension host:
 *
 * - Finding 1 — the Agent pill is the single source of truth for which
 *   evaluator a sampling request should use. The Recall MCP App panel
 *   (`desktop/src/panel/recall.ts`) only ever sends a "sampling" message when
 *   its own state agrees quick mode is off, but `extension.ts` must not trust
 *   that alone: a persisted selection that names a detached harness or
 *   quick-mode (changed from another surface, or a hand-edited config) must
 *   not silently fall through to `vscode-lm` regardless.
 *   `assertSamplingRoutableToVscodeLm` throws `EvaluatorUnavailableError`
 *   with the same honest reason the context bar itself would show for that
 *   route, instead.
 * - Finding 2 — the Agent pill's label must name the concrete provider/model
 *   actually in play, not the generic "VS Code language models" the
 *   server-side builder emits (`src/cli/companion-context-server.ts` — that
 *   process cannot call `vscode.lm` itself, so its label stays the honest,
 *   un-enriched fallback for non-Companion surfaces).
 *   `enrichCallToolResultForVscodeLm` patches the routable `vscode-lm`
 *   route's `displayIdentity` in a forwarded tool result, using the real
 *   adapter's `displayIdentity()` — a non-persisting peek (see
 *   `companion-adapters.ts`'s split `resolveModel`/`peekModel`) so opening a
 *   panel never silently adopts/freezes a model as a side effect of merely
 *   rendering the pill.
 */

import type { EvaluatorAdapter } from "./companion-evaluator.js";
import {
  DETACHED_HARNESS_EVALUATOR_IDS,
  type DetachedHarnessEvaluatorId,
  EvaluatorUnavailableError,
} from "./companion-evaluator.js";

/**
 * Display labels for the detached-harness evaluator ids (ADR §Decision 5).
 * Mirrors `CONNECT_HARNESS_LABELS` in `src/cli/agent-connect.ts` for the four
 * harnesses that can appear as a Companion evaluator selection — kept as its
 * own tiny map instead of importing `agent-connect.ts`'s much heavier CLI
 * module (child_process, fs-based installers) into the VS Code extension
 * bundle just to look up four strings.
 */
export const DETACHED_HARNESS_EVALUATOR_LABELS: Record<
  DetachedHarnessEvaluatorId,
  string
> = {
  "claude-code": "Claude Code",
  codex: "Codex",
  opencode: "OpenCode",
  goose: "Goose",
};

function isDetachedHarnessEvaluatorId(
  value: string,
): value is DetachedHarnessEvaluatorId {
  return (DETACHED_HARNESS_EVALUATOR_IDS as readonly string[]).includes(value);
}

/**
 * The honest reason a given persisted evaluator selection cannot receive a
 * VS Code Companion sampling request — mirrors the reasons
 * `companion-context-server.ts`'s `buildEvaluatorRouteInputs` already shows
 * next to the same route in the Agent pill, so the panel's inline error and
 * the pill's own disabled-option tooltip never disagree.
 */
export function unroutableVscodeLmReason(selectedEvaluatorId: string): string {
  if (selectedEvaluatorId === "quick-mode") {
    return "Quick mode is model-free by design and must never be asked to evaluate an answer.";
  }
  if (selectedEvaluatorId === "native-mcp-host") {
    return "The VS Code Companion routes through the VS Code language-model adapter, not native host sampling.";
  }
  if (isDetachedHarnessEvaluatorId(selectedEvaluatorId)) {
    return `${DETACHED_HARNESS_EVALUATOR_LABELS[selectedEvaluatorId]} has no MCP sampling relay in 0.11.0`;
  }
  return `Evaluator "${selectedEvaluatorId}" is not routable from the VS Code Companion.`;
}

/**
 * Guard the one real sampling path the VS Code Companion has. Throws
 * `EvaluatorUnavailableError` when the persisted selection names anything
 * other than `vscode-lm` — including quick-mode and every detached harness.
 * No persisted selection at all defaults to `vscode-lm`, the only adapter
 * this extension has ever routed sampling to. Never silently substitutes
 * `vscode-lm` for a different *explicit* selection.
 */
export function assertSamplingRoutableToVscodeLm(
  selectedEvaluatorId: string | undefined,
): void {
  if (
    !selectedEvaluatorId ||
    selectedEvaluatorId === "vscode-lm" ||
    selectedEvaluatorId === "zam-text-model"
  )
    return;
  throw new EvaluatorUnavailableError(
    selectedEvaluatorId,
    unroutableVscodeLmReason(selectedEvaluatorId),
  );
}

interface EvaluatorRouteLike {
  id?: unknown;
  routable?: unknown;
  displayIdentity?: unknown;
}

function isRoutableVscodeLmRoute(value: unknown): value is EvaluatorRouteLike {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    (value as EvaluatorRouteLike).id === "vscode-lm" &&
    (value as EvaluatorRouteLike).routable === true
  );
}

function findRoutableVscodeLmRoute(
  companionContextLike: unknown,
): EvaluatorRouteLike | undefined {
  if (!companionContextLike || typeof companionContextLike !== "object") {
    return undefined;
  }
  const evaluators = (companionContextLike as { evaluators?: unknown })
    .evaluators;
  if (!Array.isArray(evaluators)) return undefined;
  return evaluators.find(isRoutableVscodeLmRoute);
}

/**
 * A forwarded tool result's payload carries a `companionContext`-shaped
 * object in one of three positions, depending on which tool produced it:
 * - `zam_open_recall`/`zam_show_graph`/`zam_open_settings`: nested under a
 *   `companionContext` key alongside other fields (see e.g. `OpenRecallResult`
 *   in `desktop/src/panel/recall.ts`);
 * - `zam_companion_context` (`action: "read"`): the payload itself IS the
 *   context (`CompanionContextReadResult`, has `evaluators` directly);
 * - `zam_companion_context` (`action: "write"`): nested under a `read` key
 *   alongside `reloadRequired` (`CompanionContextWriteOutcome`).
 * Returns every position actually present, so a caller can patch whichever
 * one applies without hard-coding a single tool's shape.
 */
function extractCompanionContextCandidates(value: unknown): unknown[] {
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const candidates: unknown[] = [];
  if (Array.isArray(record.evaluators)) candidates.push(record);
  if (record.companionContext) candidates.push(record.companionContext);
  if (record.read) candidates.push(record.read);
  return candidates;
}

/** The narrow shape of a `CallToolResult` this module reads/mutates. */
export interface CallToolResultLike {
  isError?: unknown;
  structuredContent?: unknown;
  content?: Array<{ type?: unknown; text?: unknown }>;
}

/**
 * Enrich a `CallToolResult` about to be forwarded to the webview (a
 * `zam_companion_context` read/write result, or an opening tool's result) in
 * place: patch the routable `vscode-lm` route's `displayIdentity` in both
 * `structuredContent` and the `content[0].text` JSON — `desktop/src/panel/*`
 * only ever reads the latter (`wrapHandler` never puts JSON on
 * `structuredContent` for a bare-array result; the panels' own `callTool`
 * helpers therefore parse `content[0].text`), but `structuredContent` is
 * patched too for any other consumer of this same forwarded result. A no-op
 * on an error result or a result with no companionContext at all.
 */
export async function enrichCallToolResultForVscodeLm(
  result: CallToolResultLike,
  adapter: EvaluatorAdapter,
): Promise<void> {
  if (result.isError) return;

  const structuredRoutes = extractCompanionContextCandidates(
    result.structuredContent,
  )
    .map(findRoutableVscodeLmRoute)
    .filter((route): route is EvaluatorRouteLike => Boolean(route));

  const first = result.content?.[0];
  let parsedText: unknown;
  let textRoutes: EvaluatorRouteLike[] = [];
  if (first && first.type === "text" && typeof first.text === "string") {
    try {
      parsedText = JSON.parse(first.text);
      textRoutes = extractCompanionContextCandidates(parsedText)
        .map(findRoutableVscodeLmRoute)
        .filter((route): route is EvaluatorRouteLike => Boolean(route));
    } catch {
      // Not JSON — nothing to enrich in content[0].text.
    }
  }

  if (structuredRoutes.length === 0 && textRoutes.length === 0) return;

  const identity = await adapter.displayIdentity();
  for (const route of structuredRoutes) route.displayIdentity = identity;
  if (textRoutes.length > 0 && first) {
    for (const route of textRoutes) route.displayIdentity = identity;
    first.text = JSON.stringify(parsedText, null, 2);
  }
}
