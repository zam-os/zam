/**
 * VS Code Companion evaluator adapters (ADR 2026-07-16 §Decision 5/6, 0.11.0
 * Phase 3).
 *
 * Factored out of `extension.ts` so the adapter boundary is unit-testable
 * without a real VS Code extension host. Every dependency on the `vscode`
 * namespace is passed in as a narrow, injectable surface — {@link
 * VscodeLmSurface} — rather than imported directly, so a test can supply a
 * fake shaped exactly like the OBSERVED runtime. In particular, the fake used
 * by this module's tests never exposes a `CancellationToken.None`-like
 * shortcut: `createCancellationTokenSource()` is the only way to obtain a
 * token, matching the real extension host and closing the gap that let the
 * 0.10.11 crash slip through a locally invented `.d.ts` (see `vscode.d.ts`).
 *
 * Only `vscode-lm` has a real implementation here:
 * - `quick-mode` never calls a model — the Recall MCP App panel
 *   (`desktop/src/panel/recall.ts`) skips sampling entirely in quick mode, so
 *   there is nothing to route. Its adapter below exists only to satisfy code
 *   that enumerates every `RoutableEvaluatorId` uniformly, and throws if ever
 *   asked to evaluate — that would be a caller bug, not a legitimate call.
 * - `native-mcp-host` has no adapter here at all. A genuinely different
 *   MCP-Apps host (e.g. Codex Desktop) fulfills `sampling/createMessage`
 *   itself, through its own App Bridge host implementation, entirely outside
 *   this extension — the VS Code Companion never receives that request.
 */

import type {
  EvaluatorAdapter,
  EvaluatorAvailability,
  EvaluatorDisplayIdentity,
  EvaluatorTurnResult,
} from "./companion-evaluator.js";
import { EvaluatorUnavailableError } from "./companion-evaluator.js";
import type { NormalizedSamplingRequest } from "./protocol.js";

/**
 * The narrow subset of a real `vscode.LanguageModelChat` this adapter reads
 * or calls. Structurally compatible with the corrected `vscode.d.ts` shape,
 * but declared independently so this module never needs to import `vscode`.
 */
export interface VscodeChatModelLike {
  readonly id: string;
  readonly vendor: string;
  readonly name: string;
  sendRequest(
    messages: unknown[],
    options: { justification?: string },
    token: unknown,
  ): PromiseLike<{ text: AsyncIterable<string> }>;
}

/**
 * The narrow subset of the `vscode` namespace this adapter needs. Every
 * method here has a real, currently-declared counterpart in `vscode.d.ts`;
 * none of them is `CancellationToken.None`.
 */
export interface VscodeLmSurface {
  selectChatModels(
    selector?: Record<string, string>,
  ): PromiseLike<VscodeChatModelLike[]>;
  chatMessageUser(content: string): unknown;
  chatMessageAssistant(content: string): unknown;
  /** Mirrors `new vscode.CancellationTokenSource()`. */
  createCancellationTokenSource(): {
    readonly token: unknown;
    dispose(): void;
  };
}

/** Read/write access to the persisted explicit VS Code model choice. */
export interface VscodeModelSelection {
  getSelectedModelId(): string | undefined;
  setSelectedModelId(id: string): void;
}

/** "copilot" -> "Copilot"; never returns an empty string. */
function vendorLabel(vendor: string): string {
  const trimmed = vendor.trim();
  if (!trimmed) return "VS Code language model";
  return trimmed
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

type ModelResolution =
  | { ok: true; model: VscodeChatModelLike }
  | { ok: false; reason: string };

/**
 * Resolve which VS Code model the adapter should use, honoring a persisted
 * explicit choice and never silently substituting another model once one has
 * been chosen (ADR 2026-07-16 §Decision 5): if the persisted model id is no
 * longer among `selectChatModels`'s results, this reports unavailable rather
 * than falling back to whatever VS Code returns first.
 *
 * With no persisted choice yet, the first model VS Code returns is adopted
 * AND persisted as of this call — from then on it is the explicit choice
 * above, not re-derived from registration order on every request. This is
 * what makes Smart Recall work out of the box while keeping the pill's
 * identity stable (the ADR explicitly rejects "keep `selectChatModels({})[0]`"
 * as a *repeated, invisible* default — adopting it once, visibly, and then
 * freezing it is a different and honest behavior).
 */
async function resolveModel(
  vscodeLm: VscodeLmSurface,
  selection: VscodeModelSelection,
): Promise<ModelResolution> {
  let models: VscodeChatModelLike[];
  try {
    models = await vscodeLm.selectChatModels({});
  } catch (error) {
    return {
      ok: false,
      reason: `Could not list VS Code language models: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  const persistedId = selection.getSelectedModelId();
  if (persistedId) {
    const match = models.find((model) => model.id === persistedId);
    if (match) return { ok: true, model: match };
    return {
      ok: false,
      reason:
        `The previously selected VS Code language model ("${persistedId}") ` +
        "is no longer available. Choose another model for ZAM Recall.",
    };
  }

  if (models.length === 0) {
    return {
      ok: false,
      reason:
        "No VS Code language model is available. Sign in to a model " +
        "provider (e.g. GitHub Copilot) or use ZAM Recall's quick mode.",
    };
  }

  const [first] = models;
  selection.setSelectedModelId(first.id);
  return { ok: true, model: first };
}

/** The real `vscode-lm` evaluator adapter (ADR §Decision 5, 6). */
export function createVscodeLmAdapter(
  vscodeLm: VscodeLmSurface,
  selection: VscodeModelSelection,
): EvaluatorAdapter {
  async function requireModel(): Promise<VscodeChatModelLike> {
    const resolved = await resolveModel(vscodeLm, selection);
    if (!resolved.ok) {
      throw new EvaluatorUnavailableError("vscode-lm", resolved.reason);
    }
    return resolved.model;
  }

  // Evaluation and follow-up turns are the exact same text-completion call:
  // the Recall panel (desktop/src/panel/recall.ts /
  // recall-evaluation.ts) folds the "evaluate" vs. "follow-up" framing into
  // the messages it sends over MCP sampling, and that wire shape carries no
  // signal distinguishing the two turn kinds. There is nothing for this
  // adapter to do differently, so `evaluateAnswer` and `followUp` below are
  // the same function — both real, both tested, both routed through the
  // model the learner is shown in the Agent pill.
  async function complete(
    request: NormalizedSamplingRequest,
  ): Promise<EvaluatorTurnResult> {
    const model = await requireModel();
    const messages = request.messages.map((message) =>
      message.role === "assistant"
        ? vscodeLm.chatMessageAssistant(message.text)
        : vscodeLm.chatMessageUser(message.text),
    );
    // The 0.10.11 crash: `vscode.CancellationToken.None` was undefined at
    // runtime, so `sendRequest` failed before the request was even sent
    // (ADR §Decision 6). A real `CancellationTokenSource` is created and
    // disposed for every request instead.
    const tokenSource = vscodeLm.createCancellationTokenSource();
    try {
      const response = await model.sendRequest(
        messages,
        {
          justification:
            "ZAM Recall checks the answer you submitted and answers your " +
            "follow-up questions.",
        },
        tokenSource.token,
      );
      let text = "";
      for await (const fragment of response.text) text += fragment;
      if (!text.trim()) {
        throw new Error("The VS Code language model returned no text");
      }
      return { model: model.id, text: text.trim() };
    } finally {
      tokenSource.dispose();
    }
  }

  return {
    id: "vscode-lm",
    async displayIdentity(): Promise<EvaluatorDisplayIdentity> {
      const resolved = await resolveModel(vscodeLm, selection);
      if (!resolved.ok) return { provider: "VS Code language model" };
      return {
        provider: vendorLabel(resolved.model.vendor),
        model: resolved.model.name,
      };
    },
    async availability(): Promise<EvaluatorAvailability> {
      const resolved = await resolveModel(vscodeLm, selection);
      return resolved.ok
        ? { available: true }
        : { available: false, reason: resolved.reason };
    },
    evaluateAnswer: complete,
    followUp: complete,
  };
}

/**
 * Never invoked for a real answer (see module docstring). Kept alongside
 * `createVscodeLmAdapter` so anything that enumerates the routable adapter
 * set can construct one uniformly; deliberately throws instead of returning
 * empty/placeholder text if that assumption is ever wrong.
 */
export function createQuickModeAdapter(): EvaluatorAdapter {
  function refuse(): Promise<EvaluatorTurnResult> {
    return Promise.reject(
      new EvaluatorUnavailableError(
        "quick-mode",
        "Quick mode is model-free by design and must never be asked to evaluate an answer.",
      ),
    );
  }
  return {
    id: "quick-mode",
    displayIdentity: () => ({ provider: "Quick mode — no agent" }),
    availability: () => ({ available: true }),
    evaluateAnswer: refuse,
    followUp: refuse,
  };
}
