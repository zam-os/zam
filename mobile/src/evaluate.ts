/**
 * Intelligent answer evaluation for the mobile companions.
 *
 * Android prefers on-device Gemini Nano (AICore → Tensor NPU) and treats a
 * reachable paired endpoint as the secondary HTTP path. iOS has no on-device
 * evaluator, so the paired cloud endpoint is its only path. When neither is
 * usable the caller falls back to self-rating.
 */

import {
  buildRecallEvaluationPrompt,
  parseRecallEvaluation,
  RECALL_EVALUATION_MAX_OUTPUT_TOKENS,
  RECALL_EVALUATION_RETRY_OUTPUT_TOKENS,
  type RecallEvaluation,
  type RecallEvaluationCard,
} from "../../desktop/src/panel/recall-evaluation.js";
import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import { OPENROUTER_EVALUATION_REASONING_EFFORT } from "../../src/cli/llm/cloud-providers.js";

export type EvaluationBackend = "on-device" | "http" | "none";

export interface MobileEvaluationResult {
  evaluation: RecallEvaluation;
  backend: EvaluationBackend;
  modelLabel: string;
}

export interface OnDeviceLlmStatus {
  status: string;
  available: boolean;
  downloadable: boolean;
}

export interface OnDeviceLlmGenerateResult {
  text: string;
  backend: string;
}

export interface EvaluationPorts {
  checkOnDeviceStatus(): Promise<OnDeviceLlmStatus>;
  generateOnDevice(prompt: string): Promise<OnDeviceLlmGenerateResult>;
  /** Injected so tests can stub network. Defaults to global fetch. */
  fetchText?(url: string, init: RequestInit): Promise<string>;
}

export interface EvaluateAnswerInput {
  card: RecallEvaluationCard;
  learnerAnswer: string;
  /**
   * Language the evaluation should be written in. The learner's setting from
   * the database, not the UI locale: the UI ships de/en, while the model can
   * answer in any supported language.
   */
  locale: string | null | undefined;
  /** Paired recall endpoint; its fallback chain is walked for a cloud target. */
  endpoint?: ZamPairLlmEndpoint | null;
  /**
   * Whether this platform has an on-device evaluator at all. iOS does not
   * (`platform_features.onDeviceEvaluation`), so attempting it there only
   * buys a guaranteed rejection and an error message that blames the wrong
   * thing. Defaults to true, which is Android's answer.
   */
  onDeviceAvailable?: boolean;
  ports: EvaluationPorts;
}

function isLoopbackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "::1"
    );
  } catch {
    return false;
  }
}

/** Whether the paired endpoint is a usable non-loopback HTTP cloud target. */
export function isCloudHttpEndpoint(
  endpoint: ZamPairLlmEndpoint | null | undefined,
): boolean {
  return Boolean(
    endpoint?.enabled &&
      !endpoint.local &&
      !isLoopbackUrl(endpoint.url) &&
      endpoint.apiFlavor === "chat-completions" &&
      // Without a key every cloud host answers 401; trying it only pollutes the
      // "automatic evaluation failed" message with dead fallbacks (MiMo direct,
      // DeepSeek, …) that were never configured on this device.
      Boolean(endpoint.apiKey),
  );
}

function isOpenRouterEndpoint(endpoint: ZamPairLlmEndpoint): boolean {
  try {
    const host = new URL(endpoint.url).hostname.toLowerCase();
    return host === "openrouter.ai" || host.endsWith(".openrouter.ai");
  } catch {
    return false;
  }
}

/** Depth cap so a malformed paired payload cannot loop the walk forever. */
const MAX_FALLBACK_DEPTH = 8;

/**
 * First cloud-usable endpoint in the paired chain, head included.
 *
 * The desktop projects its whole fallback chain into the pairing payload
 * (`src/cli/mobile-pairing.ts`), but only the head was ever inspected. A phone
 * or tablet cannot reach the desktop's localhost model, so when the learner's
 * primary recall model is local the head is unusable *by construction* — and
 * the cloud model sitting right behind it was ignored. On Android that stayed
 * invisible because Gemini Nano answers first; on iOS, which has no on-device
 * evaluator, it meant no evaluation at all (reported on an iPad 9, 2026-07-31).
 */
export function selectCloudHttpEndpoints(
  endpoint: ZamPairLlmEndpoint | null | undefined,
): ZamPairLlmEndpoint[] {
  const usable: ZamPairLlmEndpoint[] = [];
  let candidate = endpoint ?? null;
  for (let depth = 0; candidate && depth < MAX_FALLBACK_DEPTH; depth++) {
    if (isCloudHttpEndpoint(candidate)) usable.push(candidate);
    candidate = candidate.fallback ?? null;
  }
  return usable;
}

/** First cloud-usable endpoint in the chain, or null. */
export function selectCloudHttpEndpoint(
  endpoint: ZamPairLlmEndpoint | null | undefined,
): ZamPairLlmEndpoint | null {
  return selectCloudHttpEndpoints(endpoint)[0] ?? null;
}

/**
 * Preferred backend label for UI/tests.
 *
 * Android keeps the NPU-first stance, so it reports on-device for every paired
 * configuration. Where the platform has no on-device evaluator the honest
 * answer is what will actually run: the cloud endpoint, or nothing.
 */
export function resolveEvaluationBackend(
  endpoint: ZamPairLlmEndpoint | null | undefined,
  onDeviceAvailable = true,
): EvaluationBackend {
  if (!onDeviceAvailable) {
    return selectCloudHttpEndpoint(endpoint) ? "http" : "none";
  }
  // Mobile field-test stance: NPU first. Cloud is fallback only.
  return "on-device";
}

/**
 * The model ran out of output budget before finishing. Typed so the caller can
 * retry with more room instead of giving up — for a reasoning model the whole
 * budget can disappear into thinking before a single visible token.
 */
export class EvaluationTruncatedError extends Error {
  constructor() {
    super("the model hit its output limit before finishing the evaluation");
    this.name = "EvaluationTruncatedError";
  }
}

async function defaultFetchText(
  url: string,
  init: RequestInit,
): Promise<string> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `HTTP ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }
  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  };
  const choice = payload.choices?.[0];
  const text = choice?.message?.content?.trim();
  // A truncated answer and an absent one are different failures, and saying
  // "empty content" for both hides the only one the user can act on.
  if (choice?.finish_reason === "length") {
    throw new EvaluationTruncatedError();
  }
  if (!text) throw new Error("evaluation endpoint returned empty content");
  return text;
}

async function generateViaHttp(
  endpoint: ZamPairLlmEndpoint,
  prompt: string,
  fetchText: EvaluationPorts["fetchText"],
  maxTokens: number = RECALL_EVALUATION_MAX_OUTPUT_TOKENS,
): Promise<string> {
  if (endpoint.apiFlavor !== "chat-completions") {
    throw new Error(
      `API flavor ${endpoint.apiFlavor} is not supported on mobile yet`,
    );
  }
  const base = endpoint.url.replace(/\/+$/, "");
  const url = base.endsWith("/chat/completions")
    ? base
    : `${base}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (endpoint.apiKey) headers.Authorization = `Bearer ${endpoint.apiKey}`;

  // Evaluation wants a short JSON object, not a multi-page chain of thought.
  // Reasoning models (MiMo V2.5 especially) otherwise spend the whole output
  // budget thinking and return `finish_reason: length` with empty content.
  // `low` is the product default for GPT-5.6 Luna: enough for honest grading,
  // cheap and fast enough for a review loop. Non-OpenRouter hosts omit the key.
  const body: Record<string, unknown> = {
    model: endpoint.model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: maxTokens,
  };
  if (isOpenRouterEndpoint(endpoint)) {
    body.reasoning = { effort: OPENROUTER_EVALUATION_REASONING_EFFORT };
  }

  return (fetchText ?? defaultFetchText)(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Evaluate a learner answer. Tries on-device Nano first, then optional cloud
 * HTTP. Returns null only for blank answers — callers fall back to self-rate
 * when this throws.
 */
export async function evaluateMobileAnswer(
  input: EvaluateAnswerInput,
): Promise<MobileEvaluationResult | null> {
  const answer = input.learnerAnswer.trim();
  if (!answer) return null;

  const prompt = buildRecallEvaluationPrompt(input.card, answer, input.locale);
  const errors: string[] = [];

  if (input.onDeviceAvailable !== false) {
    try {
      const generated = await input.ports.generateOnDevice(prompt);
      return {
        evaluation: parseRecallEvaluation(generated.text),
        backend: "on-device",
        modelLabel: "Gemini Nano (on-device)",
      };
    } catch (error) {
      errors.push(
        `on-device: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Try every reachable endpoint in the chain, not just the first. A paired
  // payload can advertise an endpoint that cannot actually serve the request —
  // an agent-transport entry projected before that was fixed at the source
  // carries a defaulted URL and looks like an ordinary cloud target. Falling
  // through to the next one repairs an already-paired device without asking
  // the learner to pair again.
  const cloudEndpoints = selectCloudHttpEndpoints(input.endpoint);
  for (const cloud of cloudEndpoints) {
    try {
      let text: string;
      try {
        text = await generateViaHttp(cloud, prompt, input.ports.fetchText);
      } catch (error) {
        if (!(error instanceof EvaluationTruncatedError)) throw error;
        // One retry with real room. A model that thinks its way past even that
        // is the wrong model for this job, and the error below says so.
        text = await generateViaHttp(
          cloud,
          prompt,
          input.ports.fetchText,
          RECALL_EVALUATION_RETRY_OUTPUT_TOKENS,
        );
      }
      return {
        evaluation: parseRecallEvaluation(text),
        backend: "http",
        modelLabel: cloud.label || cloud.model,
      };
    } catch (error) {
      const detail =
        error instanceof EvaluationTruncatedError
          ? `spent its whole output budget before answering, even at ${RECALL_EVALUATION_RETRY_OUTPUT_TOKENS} tokens — a reasoning model may be a poor fit for card evaluation`
          : error instanceof Error
            ? error.message
            : String(error);
      errors.push(`http (${cloud.label || cloud.model}): ${detail}`);
    }
  }
  if (cloudEndpoints.length === 0 && input.endpoint) {
    // Distinguish "your models are unreachable from here" from "nothing was
    // paired at all" — only the first is something the learner can fix.
    errors.push(
      "no cloud model: the paired models are all local to the desktop and cannot be reached from this device",
    );
  }

  throw new Error(errors.join("; ") || "no evaluation backend available");
}

export function ratingLabel(
  rating: 1 | 2 | 3 | 4,
  locale: "de" | "en",
): string {
  if (locale === "en") {
    return ({ 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" } as const)[rating];
  }
  return ({ 1: "Nochmal", 2: "Schwer", 3: "Gut", 4: "Leicht" } as const)[
    rating
  ];
}

/** Spoken summary for hands-free mode. */
export function evaluationSpeech(
  evaluation: RecallEvaluation,
  locale: "de" | "en",
): string {
  const rating = ratingLabel(evaluation.suggestedRating, locale);
  if (locale === "en") {
    return [
      evaluation.feedback,
      `Suggested rating: ${rating}.`,
      "Say Again, Hard, Good, or Easy to confirm or change.",
    ].join(" ");
  }
  return [
    evaluation.feedback,
    `Vorgeschlagene Bewertung: ${rating}.`,
    "Sage Nochmal, Schwer, Gut oder Leicht zum Bestätigen oder Ändern.",
  ].join(" ");
}
