/**
 * Intelligent answer evaluation for the Android companion.
 *
 * Always prefer on-device Gemini Nano (AICore → Tensor NPU). Non-local paired
 * endpoints are a secondary HTTP fallback. When neither path is usable the
 * caller falls back to self-rating.
 */

import {
  buildRecallEvaluationPrompt,
  parseRecallEvaluation,
  type RecallEvaluation,
  type RecallEvaluationCard,
} from "../../desktop/src/panel/recall-evaluation.js";
import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";

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
  /** Paired recall endpoint; used as optional cloud fallback. */
  endpoint?: ZamPairLlmEndpoint | null;
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
      endpoint.apiFlavor === "chat-completions",
  );
}

/**
 * Preferred backend label for UI/tests.
 * On-device is always preferred; cloud HTTP only when no Nano path is intended.
 */
export function resolveEvaluationBackend(
  endpoint: ZamPairLlmEndpoint | null | undefined,
): EvaluationBackend {
  // Mobile field-test stance: NPU first. Cloud is fallback only.
  if (!endpoint?.enabled || endpoint.local || isLoopbackUrl(endpoint.url)) {
    return "on-device";
  }
  // Cloud-configured: still report on-device as primary; evaluateMobileAnswer
  // tries Nano first and only then HTTP.
  return "on-device";
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
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = payload.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("evaluation endpoint returned empty content");
  return text;
}

async function generateViaHttp(
  endpoint: ZamPairLlmEndpoint,
  prompt: string,
  fetchText: EvaluationPorts["fetchText"],
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

  return (fetchText ?? defaultFetchText)(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: endpoint.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 256,
    }),
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

  const prompt = buildRecallEvaluationPrompt(input.card, answer);
  const errors: string[] = [];

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

  if (isCloudHttpEndpoint(input.endpoint) && input.endpoint) {
    try {
      const text = await generateViaHttp(
        input.endpoint,
        prompt,
        input.ports.fetchText,
      );
      return {
        evaluation: parseRecallEvaluation(text),
        backend: "http",
        modelLabel: input.endpoint.label || input.endpoint.model,
      };
    } catch (error) {
      errors.push(
        `http: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
