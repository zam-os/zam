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

/**
 * Observed `vscode.lm` vendor ids → clean display labels. Both "copilot" and
 * "copilotcli" are GitHub Copilot surfaces; raw title-casing rendered the
 * latter as the awkward "Copilotcli" in the Agent pill (live 0.11.0 test).
 * Only vendors actually observed get an entry — unknown vendors keep the
 * title-cased raw id rather than a guessed brand name.
 */
const KNOWN_VENDOR_LABELS: Record<string, string> = {
  copilot: "Copilot",
  copilotcli: "Copilot",
};

/** "copilot"/"copilotcli" -> "Copilot"; never returns an empty string. */
function vendorLabel(vendor: string): string {
  const trimmed = vendor.trim();
  if (!trimmed) return "VS Code language model";
  const known = KNOWN_VENDOR_LABELS[trimmed.toLowerCase()];
  if (known) return known;
  return trimmed
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

type ModelResolution =
  | { ok: true; model: VscodeChatModelLike }
  | { ok: false; reason: string };

/** The palette title of {@link runChooseRecallModel}'s command registration — kept as one constant so every unavailable-reason string below stays in sync with the actual command name if it's ever renamed. */
export const CHOOSE_RECALL_MODEL_COMMAND_TITLE = "ZAM: Choose Recall Model";

/**
 * Resolve which VS Code model the adapter should use, honoring a persisted
 * explicit choice and never silently substituting another model once one has
 * been chosen (ADR 2026-07-16 §Decision 5): if the persisted model id is no
 * longer among `selectChatModels`'s results, this reports unavailable rather
 * than falling back to whatever VS Code returns first.
 *
 * `persist` controls whether discovering a model with no prior persisted
 * choice adopts (and freezes) it as of this call, or merely peeks at what
 * *would* be adopted:
 * - `persist: true` — used only by `evaluateAnswer`/`followUp` (the first
 *   real use of the model). This is what makes Smart Recall work out of the
 *   box while keeping the pill's identity stable (the ADR explicitly rejects
 *   "keep `selectChatModels({})[0]`" as a *repeated, invisible* default —
 *   adopting it once, visibly, and then freezing it is a different and
 *   honest behavior).
 * - `persist: false` — used by `displayIdentity`/`availability` (review
 *   finding 2): rendering the Agent pill, or merely probing whether a model
 *   is available, must never itself adopt/freeze a model as a side effect of
 *   being asked. `resolveModel`/`peekModel` below are the two thin callers of
 *   this shared implementation.
 */
async function resolveModelImpl(
  vscodeLm: VscodeLmSurface,
  selection: VscodeModelSelection,
  persist: boolean,
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
        `is no longer available. Run "${CHOOSE_RECALL_MODEL_COMMAND_TITLE}" ` +
        "from the Command Palette to pick another.",
    };
  }

  if (models.length === 0) {
    return {
      ok: false,
      reason:
        "No VS Code language model is available. Sign in to a model " +
        "provider (e.g. GitHub Copilot) or use ZAM Recall's quick mode. " +
        `Once one is available, run "${CHOOSE_RECALL_MODEL_COMMAND_TITLE}" ` +
        "from the Command Palette to select it.",
    };
  }

  const [first] = models;
  if (persist) selection.setSelectedModelId(first.id);
  return { ok: true, model: first };
}

/** Adopts and persists a not-yet-chosen model — only for a real evaluation turn. */
function resolveModel(
  vscodeLm: VscodeLmSurface,
  selection: VscodeModelSelection,
): Promise<ModelResolution> {
  return resolveModelImpl(vscodeLm, selection, true);
}

/** Peeks at the model that would be used, without adopting/persisting it. */
function peekModel(
  vscodeLm: VscodeLmSurface,
  selection: VscodeModelSelection,
): Promise<ModelResolution> {
  return resolveModelImpl(vscodeLm, selection, false);
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
      // A peek, never a persist (finding 2): rendering the Agent pill (or
      // probing availability) must not itself adopt/freeze a model as a side
      // effect — only a real evaluateAnswer/followUp call does that.
      const resolved = await peekModel(vscodeLm, selection);
      if (!resolved.ok) return { provider: "VS Code language model" };
      return {
        provider: vendorLabel(resolved.model.vendor),
        model: resolved.model.name,
      };
    },
    async availability(): Promise<EvaluatorAvailability> {
      const resolved = await peekModel(vscodeLm, selection);
      return resolved.ok
        ? { available: true }
        : { available: false, reason: resolved.reason };
    },
    evaluateAnswer: complete,
    followUp: complete,
  };
}

// ── Model recovery command (review finding 3) ─────────────────────────────
//
// `resolveModel`'s "no longer available"/"none available" reasons point the
// learner at running `CHOOSE_RECALL_MODEL_COMMAND_TITLE` from the Command
// Palette. `runChooseRecallModel` below is that command's handler logic,
// factored out from `extension.ts`'s `vscode.commands.registerCommand` call
// the same way the rest of this module is: every VS Code call goes through a
// narrow injected surface so the QuickPick flow is unit-testable with a fake,
// without a real extension host.

/** One row of the model QuickPick. `detail` shows the raw model id so two same-named models from different providers stay distinguishable. */
export interface ModelQuickPickItem {
  label: string;
  detail: string;
  modelId: string;
}

/** "copilot" + "Claude Sonnet 5" -> "Copilot — Claude Sonnet 5". Never returns an empty label. */
export function buildModelQuickPickItems(
  models: readonly VscodeChatModelLike[],
): ModelQuickPickItem[] {
  return models.map((model) => ({
    label: `${vendorLabel(model.vendor)} — ${model.name}`,
    detail: model.id,
    modelId: model.id,
  }));
}

/** The narrow VS Code surface {@link runChooseRecallModel} needs, injected like {@link VscodeLmSurface}. */
export interface ChooseRecallModelSurface {
  listModels(): PromiseLike<VscodeChatModelLike[]>;
  showQuickPick(
    items: ModelQuickPickItem[],
  ): PromiseLike<ModelQuickPickItem | undefined>;
  showInformationMessage(message: string): unknown;
  showWarningMessage(message: string): unknown;
}

/**
 * Handler for the `zam.chooseRecallModel` command ({@link
 * CHOOSE_RECALL_MODEL_COMMAND_TITLE} in the Command Palette): list every VS
 * Code language model, let the learner pick one via QuickPick, and persist
 * the choice through the same `VscodeModelSelection` the adapter reads —
 * this is the one recovery path back to a working Agent pill once
 * `resolveModel` has reported the persisted choice unavailable (ADR
 * 2026-07-16 §Decision 5: no silent substitution, but a visible way out).
 */
/** Returns true when the learner picked (and persisted) a model. */
export async function runChooseRecallModel(
  surface: ChooseRecallModelSurface,
  selection: VscodeModelSelection,
): Promise<boolean> {
  let models: VscodeChatModelLike[];
  try {
    models = await surface.listModels();
  } catch (error) {
    surface.showWarningMessage(
      `Could not list VS Code language models: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
  if (models.length === 0) {
    surface.showWarningMessage(
      "No VS Code language model is available. Sign in to a model provider " +
        "(e.g. GitHub Copilot) and try again.",
    );
    return false;
  }
  const picked = await surface.showQuickPick(buildModelQuickPickItems(models));
  if (!picked) return false; // learner dismissed the QuickPick — leave the choice untouched
  selection.setSelectedModelId(picked.modelId);
  surface.showInformationMessage(`ZAM Recall will use ${picked.label}.`);
  return true;
}
