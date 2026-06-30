/**
 * Local LLM client — CLI/harness layer.
 *
 * This module talks to a user-run, OpenAI-compatible local LLM server
 * (FastFlowLM `flm serve`, Ollama, LM Studio, …). It deliberately lives in the
 * CLI layer, NOT the kernel: the kernel is AI-agnostic and carries zero LLM
 * dependencies (see CLAUDE.md). Everything that does HTTP, spawns runner
 * processes, prints to the terminal, or prompts interactively belongs here.
 *
 * Config is read from kernel settings via a single `getLlmConfig` helper so the
 * default model lives in exactly one place (it changes every few weeks as local
 * models improve).
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import type { Database, SupportedLocale } from "../../kernel/index.js";
import {
  getMachineAiConfig,
  getProviderApiKey,
  getSetting,
  getSystemProfile,
  hasCommand,
  resolveReviewContext,
  t,
  updateToken,
} from "../../kernel/index.js";

/** Single source of truth for connection defaults (easy to bump as models evolve). */
export const DEFAULT_LLM_URL = "http://localhost:8000/v1";

/** Default completion budget for open-ended tasks (vision, translation, …). */
export const DEFAULT_LLM_MAX_TOKENS = 10_000;

/** Tight output caps for recall — short questions/evaluations, faster round-trips. */
export const RECALL_QUESTION_MAX_OUTPUT_TOKENS = 400;
export const RECALL_EVALUATION_MAX_OUTPUT_TOKENS = 1200;

const RECALL_ENDPOINT_CACHE_MS = 60_000;
let cachedRecallEndpoint: {
  endpoint: ProviderConfig;
  signature: string;
  expiresAt: number;
} | null = null;

/** Clear the in-process recall-endpoint cache (used by tests and explicit resets). */
export function clearRecallEndpointCache(): void {
  cachedRecallEndpoint = null;
}

/**
 * Compact fingerprint of the resolved recall provider. When any of these change
 * — a role rebind, a provider url/model/flavor edit, or an enable toggle — the
 * cached endpoint is treated as stale even within its TTL, so a configuration
 * change in Studio takes effect on the next card instead of after up to
 * RECALL_ENDPOINT_CACHE_MS.
 */
function recallEndpointSignature(cfg: ProviderConfig): string {
  return [
    cfg.enabled ? "on" : "off",
    cfg.providerName ?? "",
    cfg.url,
    cfg.model,
    cfg.apiFlavor,
    cfg.fallback?.url ?? "",
    cfg.fallback?.model ?? "",
  ].join("|");
}
export const DEFAULT_LLM_MODEL = "qwen3.5:4b";
export const DEFAULT_LLM_API_KEY = "sk-none";

export interface LlmConfig {
  enabled: boolean;
  url: string;
  model: string;
  apiKey: string;
  locale: SupportedLocale;
  maxFrames?: number;
}

/** Read all LLM-related settings at once, applying defaults in one place. */
export async function getLlmConfig(db: Database): Promise<LlmConfig> {
  return {
    enabled: (await getSetting(db, "llm.enabled")) === "true",
    url: (await getSetting(db, "llm.url")) || DEFAULT_LLM_URL,
    model: (await getSetting(db, "llm.model")) || DEFAULT_LLM_MODEL,
    apiKey: (await getSetting(db, "llm.api_key")) || DEFAULT_LLM_API_KEY,
    locale: ((await getSetting(db, "system.locale")) ||
      "en") as SupportedLocale,
  };
}

/**
 * Vision/UI-observer model settings, kept separate from the text-chat config.
 *
 * The default text model (e.g. a local German chat model) cannot interpret
 * images, so screen snapshots must target a deliberately chosen multimodal
 * endpoint. `llm.vision.enabled` is therefore an explicit, default-off opt-in:
 * it doubles as the consent gate for sending captured screen content to a
 * provider. `url`/`model`/`apiKey` fall back to the base `llm.*` config so a
 * single multimodal endpoint only needs `llm.vision.enabled=true`.
 */
export type ApiFlavor = "chat-completions" | "anthropic-messages";

export interface CloudModelRecommendation {
  model: string;
  flavor: ApiFlavor;
}

/** Suggests a cheap/appropriate cloud model and API flavor based on the endpoint URL. */
export function getCloudModelRecommendation(
  url: string,
): CloudModelRecommendation | null {
  const lowercase = url.toLowerCase();
  if (lowercase.includes("openrouter.ai")) {
    return { model: "openrouter/free", flavor: "chat-completions" };
  }
  if (lowercase.includes("openai.com") || lowercase.includes("api.openai")) {
    return { model: "gpt-5-mini", flavor: "chat-completions" };
  }
  if (lowercase.includes("googleapis.com") || lowercase.includes("google")) {
    return { model: "gemini-3.5-flash", flavor: "chat-completions" };
  }
  if (lowercase.includes("deepseek.com")) {
    return { model: "deepseek-v4-flash", flavor: "chat-completions" };
  }
  if (lowercase.includes("mimo")) {
    return { model: "mimo-v2.5", flavor: "chat-completions" };
  }
  if (lowercase.includes("anthropic.com")) {
    return {
      model: "claude-haiku-4-5-20251001",
      flavor: "anthropic-messages",
    };
  }
  return null;
}

// ── Role-based provider resolution (ADR 2026-06-23) ──────────────────────────

export type LlmRole = "vision" | "recall" | "text";

/** A resolved endpoint for one role, with an optional fallback to try next. */
export interface ProviderConfig {
  enabled: boolean;
  url: string;
  model: string;
  apiKey: string;
  apiFlavor: ApiFlavor;
  locale: SupportedLocale;
  providerName?: string;
  label?: string;
  source: "legacy" | "shared" | "machine";
  local: boolean;
  /** Optional hint for which local server process to auto-start (flm, ollama, …). */
  runner?: string;
  /** Vision only: max frames to sample from a recording. */
  maxFrames?: number;
  /** Optional next endpoint to try when the primary is unusable. */
  fallback?: ProviderConfig;
}

/** Infer the wire protocol from the endpoint host (anthropic.com → Messages API). */
export function inferApiFlavor(url: string): ApiFlavor {
  try {
    return new URL(url).hostname.toLowerCase().endsWith("anthropic.com")
      ? "anthropic-messages"
      : "chat-completions";
  } catch {
    return "chat-completions";
  }
}

interface ProviderRecord {
  label?: string;
  url?: string;
  model?: string;
  apiFlavor?: ApiFlavor;
  apiKey?: string;
  apiKeyRef?: string;
  local?: boolean;
  runner?: string;
}
type ProvidersMap = Record<string, ProviderRecord>;
interface RoleBinding {
  primary?: string;
  fallback?: string;
}
type RolesMap = Partial<Record<LlmRole, RoleBinding>>;

async function readJsonSetting<T>(
  db: Database,
  key: string,
): Promise<T | null> {
  const raw = await getSetting(db, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function resolveProviderApiKey(rec: ProviderRecord): string {
  if (rec.apiKey) return rec.apiKey;
  if (rec.apiKeyRef) {
    const key = getProviderApiKey(rec.apiKeyRef);
    if (key) return key;
  }
  return DEFAULT_LLM_API_KEY;
}

/**
 * Resolve the configured provider for a role.
 *
 * New-style config: JSON `llm.providers` (named endpoint records) + `llm.roles`
 * (role → {primary, fallback}). When either is absent, falls back to the legacy
 * `llm.*` / `llm.vision.*` keys, so existing installs behave identically.
 *
 * Enablement stays on the existing gates — `llm.enabled` for recall/text,
 * `llm.vision.enabled` for vision — so the vision consent/privacy semantics are
 * preserved regardless of how providers are wired.
 */
export async function getProviderForRole(
  db: Database,
  role: LlmRole,
): Promise<ProviderConfig> {
  const enabled =
    role === "vision"
      ? (await getSetting(db, "llm.vision.enabled")) === "true"
      : (await getSetting(db, "llm.enabled")) === "true";

  const base = await getLegacyRoleConfig(db, role, enabled);

  const providers = await readJsonSetting<ProvidersMap>(db, "llm.providers");
  const roles = await readJsonSetting<RolesMap>(db, "llm.roles");
  const binding = roles?.[role];

  let resolved = base;
  if (providers && binding?.primary && providers[binding.primary]) {
    const primary = materializeProvider(
      providers[binding.primary],
      base,
      role,
      {
        providerName: binding.primary,
        source: "shared",
      },
    );
    const fallback =
      binding.fallback && providers[binding.fallback]
        ? materializeProvider(providers[binding.fallback], base, role, {
            providerName: binding.fallback,
            source: "shared",
          })
        : undefined;
    resolved = { ...primary, fallback };
  }

  const machine = getMachineAiConfig();
  const machineProviders = machine.providers as ProvidersMap | undefined;
  const machineBinding = machine.roles?.[role];
  if (
    machineProviders &&
    machineBinding?.primary &&
    machineProviders[machineBinding.primary]
  ) {
    const primary = materializeProvider(
      machineProviders[machineBinding.primary],
      resolved,
      role,
      { providerName: machineBinding.primary, source: "machine" },
    );
    const fallback =
      machineBinding.fallback && machineProviders[machineBinding.fallback]
        ? materializeProvider(
            machineProviders[machineBinding.fallback],
            resolved,
            role,
            { providerName: machineBinding.fallback, source: "machine" },
          )
        : undefined;
    return { ...primary, fallback };
  }

  return resolved;
}

function materializeProvider(
  rec: ProviderRecord,
  base: ProviderConfig,
  role: LlmRole,
  meta: {
    providerName: string;
    source: ProviderConfig["source"];
  },
): ProviderConfig {
  const url = rec.url || base.url;
  return {
    enabled: base.enabled,
    url,
    model: rec.model || base.model,
    apiKey: resolveProviderApiKey(rec),
    apiFlavor: rec.apiFlavor || inferApiFlavor(url),
    locale: base.locale,
    providerName: meta.providerName,
    label: rec.label,
    source: meta.source,
    local: rec.local ?? isLocalEndpoint(url),
    ...(rec.runner ? { runner: rec.runner } : {}),
    ...(role === "vision" ? { maxFrames: base.maxFrames } : {}),
  };
}

/** Legacy `llm.*` / `llm.vision.*` resolution — the back-compat default. */
async function getLegacyRoleConfig(
  db: Database,
  role: LlmRole,
  enabled: boolean,
): Promise<ProviderConfig> {
  const base = await getLlmConfig(db);

  if (role === "vision") {
    const maxFramesStr = await getSetting(db, "llm.vision.max_frames");
    const parsed = maxFramesStr ? parseInt(maxFramesStr, 10) : 100;
    const url = (await getSetting(db, "llm.vision.url")) || base.url;
    const recommendation = getCloudModelRecommendation(url);
    let model = await getSetting(db, "llm.vision.model");
    if (!model) model = recommendation?.model || base.model;
    return {
      enabled,
      url,
      model,
      apiKey: (await getSetting(db, "llm.vision.api_key")) || base.apiKey,
      apiFlavor: recommendation?.flavor || inferApiFlavor(url),
      locale: base.locale,
      source: "legacy",
      local: isLocalEndpoint(url),
      maxFrames: Number.isNaN(parsed) ? 100 : parsed,
    };
  }

  // recall / text both map to the base text endpoint today.
  return {
    enabled,
    url: base.url,
    model: base.model,
    apiKey: base.apiKey,
    apiFlavor: inferApiFlavor(base.url),
    locale: base.locale,
    source: "legacy",
    local: isLocalEndpoint(base.url),
  };
}

/** Guard for paths that only speak chat-completions (recall text today). */
function assertChatCompletions(cfg: ProviderConfig): void {
  if (cfg.apiFlavor !== "chat-completions") {
    throw new Error(
      `This role is configured for a "${cfg.apiFlavor}" provider, which is not ` +
        `supported here yet. Use a chat-completions provider for the recall role.`,
    );
  }
}

/**
 * Vision/UI-observer config in the legacy `LlmConfig` shape, for callers that
 * don't need flavor/fallback (e.g. `checkVisionReadiness`). Delegates to
 * {@link getProviderForRole} so the role config stays the single source.
 */
export async function getVisionConfig(db: Database): Promise<LlmConfig> {
  const p = await getProviderForRole(db, "vision");
  return {
    enabled: p.enabled,
    url: p.url,
    model: p.model,
    apiKey: p.apiKey,
    locale: p.locale,
    maxFrames: p.maxFrames,
  };
}

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
};

const LOCALIZED_RATING_PREFIX: Record<SupportedLocale, string> = {
  en: "Suggested rating",
  de: "Empfohlene Bewertung",
  es: "Calificación sugerida",
  fr: "Note suggérée",
  pt: "Avaliação sugerida",
  zh: "建议评分",
  ja: "推奨評価",
};

const BLOOM_VERBS = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Synthesize",
} as const;

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

/** Extract the assistant message content from an OpenAI-compatible response. */
async function readChatContent(res: Response, label: string): Promise<string> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `${label} failed: ${res.statusText} (${res.status}) - ${errorText}`,
    );
  }
  const data = (await res.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from LLM");
  }
  return content.trim();
}

/**
 * Generate a high-quality, concept-free active-recall question using the local LLM.
 */
export async function generateQuestionViaLLM(
  db: Database,
  input: {
    slug: string;
    concept: string;
    domain: string;
    bloomLevel: number;
    context?: string;
    sourceLinkContent?: string | null;
  },
): Promise<LlmTextResult> {
  const cfg = await getProviderForRole(db, "recall");
  const endpoint = await resolveUsableRecallEndpoint(db);

  const bloom = (
    input.bloomLevel >= 1 && input.bloomLevel <= 5 ? input.bloomLevel : 1
  ) as keyof typeof BLOOM_VERBS;
  const verb = BLOOM_VERBS[bloom];

  const langName = LANGUAGE_NAMES[cfg.locale] || "English";

  const systemPrompt = `You are ZAM, a highly precise agentic skills trainer.
Your task is to generate a single, clear, conceptual active-recall question (flashcard front) in ${langName} for a knowledge token.

Guidelines:
1. The question MUST match the Bloom level: ${verb} (Level ${bloom}).
2. CRITICAL: The question MUST NOT contain or reveal the concept text itself! The concept is the answer (flashcard back) that the learner needs to recall.
3. Keep the question concise, highly specific, and clear. Avoid generic prompts like "What is the concept of..." if possible, and ask about the core mechanism, function, or purpose of the slug/concept without giving the answer away.
4. Output ONLY the raw question text in ${langName}. Do not include any preamble, headers, markdown fences, or conversational filler.`;

  const userPrompt = `Domain: ${input.domain}
Slug: ${input.slug}
Concept to Recall (DO NOT REVEAL IN QUESTION): ${input.concept}
Context: ${input.context || "(none)"}
${input.sourceLinkContent ? `Source Reference:\n${input.sourceLinkContent}` : ""}

Active-Recall Question:`;

  const res = await fetchWithInteractiveTimeout(
    `${endpoint.url}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.apiKey}`,
      },
      body: JSON.stringify({
        model: endpoint.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: RECALL_QUESTION_MAX_OUTPUT_TOKENS,
      }),
      locale: cfg.locale,
    },
  );

  const text = await readChatContent(res, "LLM request");
  return {
    text,
    model: endpoint.model,
    providerName: endpoint.providerName,
  };
}

/**
 * Warmly evaluate the learner's active-recall answer against the target concept.
 * Suggests an FSRS rating (1-4) and explains in the active locale with praise/motivation.
 */
export async function evaluateAnswerViaLLM(
  db: Database,
  input: {
    slug: string;
    concept: string;
    domain: string;
    bloomLevel: number;
    context?: string;
    question: string;
    userAnswer: string;
    sourceLinkContent?: string | null;
  },
): Promise<LlmTextResult> {
  const cfg = await getProviderForRole(db, "recall");
  const endpoint = await resolveUsableRecallEndpoint(db);
  const langName = LANGUAGE_NAMES[cfg.locale] || "English";
  const ratingPrefix =
    LOCALIZED_RATING_PREFIX[cfg.locale] || "Suggested rating";

  const systemPrompt = `You are ZAM, an extremely warm, encouraging, and patient skills trainer.
Your mission is to build lasting autonomy through conceptual knowledge, not rote procedure.
Compare the learner's active-recall answer against the target concept, context, and optional source code.

FSRS Rating scale:
- 1: drew a blank / completely forgot or wrong (Again)
- 2: hard recall / partially correct (Hard)
- 3: knew it / mostly correct (Good)
- 4: perfect, instant, and accurate recall (Easy)

Guidelines:
1. Provide a constructive, encouraging evaluation in ${langName} (2-3 sentences) to promote the joy of learning. Seamlessly weave a brief explanation of the correct solution (target concept) into your feedback paragraphs. Do NOT append a separate, duplicate reference answer or raw "Musterlösung" block at the end of your response.
2. Celebrate every honest attempt! Offer high praise or a motivating word of encouragement in ${langName} if they did well or tried hard.
3. CRITICAL: ZAM is a strict one-shot card flow, NOT an interactive chat. The correct Musterlösung (reference answer) is revealed alongside your feedback. Therefore, NEVER ask the user to think further, keep guessing, or suggest they try to solve the remaining parts of the question. Instead, immediately evaluate what they wrote, explain the complete solution and target concept directly.
4. Suggest a clear FSRS rating (1 to 4) at the very end of your response in the exact format: "${ratingPrefix}: X" in ${langName}.
5. Output ONLY the evaluation and rating suggestion. Keep it concise, friendly, and clean. No conversational introduction or markdown wrapper.`;

  const userPrompt = `Domain: ${input.domain}
Slug: ${input.slug}
Recall Question: ${input.question}
Learner's Answer: ${input.userAnswer}

Target Concept (Correct Answer): ${input.concept}
Target Context: ${input.context || "(none)"}
${input.sourceLinkContent ? `Source Code Reference:\n${input.sourceLinkContent}` : ""}

Evaluation:`;

  const res = await fetchWithInteractiveTimeout(
    `${endpoint.url}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.apiKey}`,
      },
      body: JSON.stringify({
        model: endpoint.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: RECALL_EVALUATION_MAX_OUTPUT_TOKENS,
      }),
      locale: cfg.locale,
    },
  );

  const text = await readChatContent(res, "LLM evaluation");
  return {
    text,
    model: endpoint.model,
    providerName: endpoint.providerName,
  };
}

/**
 * Translate a question into the active locale using the local LLM.
 */
export async function translateQuestionViaLLM(
  db: Database,
  question: string,
): Promise<string> {
  const cfg = await getProviderForRole(db, "recall");
  const endpoint = await resolveUsableRecallEndpoint(db);
  const targetLang = LANGUAGE_NAMES[cfg.locale] || "English";

  const systemPrompt = `You are a highly precise translator. Translate the given active-recall question into clear, natural ${targetLang}.
Output ONLY the raw translation. Do not include any headers, preamble, quotes, or conversational filler.`;

  const res = await fetchWithInteractiveTimeout(
    `${endpoint.url}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.apiKey}`,
      },
      body: JSON.stringify({
        model: endpoint.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.1,
        max_tokens: DEFAULT_LLM_MAX_TOKENS,
      }),
      locale: cfg.locale,
    },
  );

  return readChatContent(res, "Translation");
}

/**
 * Checks if the LLM server is online and responsive at the specified URL.
 * A reachable server returning any HTTP status counts as online; only network
 * failures / timeouts count as offline.
 */
export async function isLlmOnline(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1500);
    // Check OpenAI standard /models list to verify readiness
    const res = await fetch(`${url}/models`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

/**
 * List the model ids the server actually serves (OpenAI `/v1/models`).
 * Returns [] on any error so callers can treat "unknown" as "skip validation".
 */
export async function getAvailableModels(
  url: string,
  apiKey = DEFAULT_LLM_API_KEY,
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${url}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: Array<{ id?: string }> };
    return (data.data ?? [])
      .map((m) => m.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export interface VisionReadyResult {
  enabled: boolean;
  online: boolean;
  url: string;
  model: string;
  modelAvailable: boolean;
  availableModels: string[];
  usable: boolean;
  /** True when llm.vision.model is explicitly configured (not a fallback). */
  visionModelExplicit: boolean;
  /** Human-readable warning when usable but likely misconfigured. */
  warning?: string;
}

interface ProviderEndpointReadiness {
  endpoint: ProviderConfig;
  online: boolean;
  availableModels: string[];
  modelAvailable: boolean;
}

function isLocalEndpoint(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("[::1]") ||
    url.includes("::1")
  );
}

async function checkProviderEndpoint(
  endpoint: ProviderConfig,
): Promise<ProviderEndpointReadiness> {
  const online = await isLlmOnline(endpoint.url);
  if (!online) {
    return {
      endpoint,
      online: false,
      availableModels: [],
      modelAvailable: false,
    };
  }

  const availableModels = await getAvailableModels(
    endpoint.url,
    endpoint.apiKey,
  );
  const modelAvailable =
    availableModels.length === 0 ||
    availableModels.some(
      (candidate) => candidate.toLowerCase() === endpoint.model.toLowerCase(),
    );

  return { endpoint, online, availableModels, modelAvailable };
}

function isEndpointUsable(readiness: ProviderEndpointReadiness): boolean {
  return readiness.online && readiness.modelAvailable;
}

function providerChain(primary: ProviderConfig): ProviderConfig[] {
  return [primary, ...(primary.fallback ? [primary.fallback] : [])];
}

async function checkProviderChain(primary: ProviderConfig): Promise<{
  primary: ProviderEndpointReadiness;
  firstUsable?: ProviderEndpointReadiness;
}> {
  let first: ProviderEndpointReadiness | undefined;
  for (const endpoint of providerChain(primary)) {
    const readiness = await checkProviderEndpoint(endpoint);
    first ??= readiness;
    if (isEndpointUsable(readiness)) {
      return { primary: first, firstUsable: readiness };
    }
  }
  return { primary: first! };
}

/** LLM-generated or stored text plus the model that produced it (when applicable). */
export interface LlmTextResult {
  text: string;
  model: string;
  providerName?: string;
}

/** How a review question was resolved for display in the UI. */
export interface QuestionResolution {
  question: string;
  source: "llm" | "original";
  model?: string;
}

export async function resolveUsableRecallEndpoint(
  db: Database,
): Promise<ProviderConfig> {
  // Resolve the role config first (cheap, local reads) so configuration changes
  // are observed immediately. The cached value reuses only the *network* health
  // check, and only while the resolved provider signature is unchanged AND the
  // TTL holds — so the enable gate and a Studio rebind both take effect at once.
  const cfg = await getProviderForRole(db, "recall");
  if (!cfg.enabled) {
    throw new Error("LLM integration is disabled in settings (llm.enabled)");
  }
  assertChatCompletions(cfg);

  const signature = recallEndpointSignature(cfg);
  if (
    cachedRecallEndpoint &&
    cachedRecallEndpoint.signature === signature &&
    cachedRecallEndpoint.expiresAt > Date.now()
  ) {
    return cachedRecallEndpoint.endpoint;
  }

  const chain = await checkProviderChain(cfg);
  const selected = chain.firstUsable;
  if (!selected || !isEndpointUsable(selected)) {
    throw new Error("No recall LLM endpoint is online");
  }
  cachedRecallEndpoint = {
    endpoint: selected.endpoint,
    signature,
    expiresAt: Date.now() + RECALL_ENDPOINT_CACHE_MS,
  };
  return selected.endpoint;
}

async function prepareRecallChain(
  db: Database,
  opts: { timeoutMs: number; interactive: boolean },
): Promise<LlmReadyResult> {
  const cfg = await getProviderForRole(db, "recall");
  const fail = (
    reason: LlmReadiness["reason"],
    partial: Partial<LlmReadyResult> = {},
  ): LlmReadyResult => ({
    usable: false,
    reason,
    online: false,
    model: cfg.model,
    availableModels: [],
    providerName: cfg.providerName,
    label: cfg.label,
    local: cfg.local ?? isLocalEndpoint(cfg.url),
    activeTier: "primary",
    ...partial,
  });

  if (!cfg.enabled) return fail("disabled");
  if (cfg.apiFlavor !== "chat-completions") return fail("unsupported-provider");

  const chain = providerChain(cfg);
  const deadline = Date.now() + opts.timeoutMs;
  let lastReason: LlmReadiness["reason"] = "offline";
  let lastOnline = false;
  let lastModel = cfg.model;
  let lastAvailable: string[] = [];

  for (let index = 0; index < chain.length; index++) {
    const endpoint = chain[index];
    let online = await isLlmOnline(endpoint.url);

    if (!online && (endpoint.local ?? isLocalEndpoint(endpoint.url))) {
      if (opts.interactive) {
        online = await startLocalRunner(
          endpoint.url,
          endpoint.model,
          cfg.locale,
          endpoint.runner,
        );
      } else {
        spawnLocalRunner(endpoint.url, endpoint.model, endpoint.runner);
        while (Date.now() < deadline) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          if (await isLlmOnline(endpoint.url)) {
            online = true;
            break;
          }
        }
      }
    }

    lastOnline = online;
    lastModel = endpoint.model;

    if (!online) {
      lastReason = "offline";
      continue;
    }

    const availableModels = await getAvailableModels(
      endpoint.url,
      endpoint.apiKey,
    );
    lastAvailable = availableModels;
    const modelKnown =
      availableModels.length === 0 ||
      availableModels.some(
        (candidate) => candidate.toLowerCase() === endpoint.model.toLowerCase(),
      );
    if (!modelKnown) {
      lastReason = "model-not-found";
      continue;
    }

    return {
      usable: true,
      online: true,
      model: endpoint.model,
      availableModels,
      providerName: endpoint.providerName,
      label: endpoint.label,
      local: endpoint.local ?? isLocalEndpoint(endpoint.url),
      activeTier: index === 0 ? "primary" : "fallback",
    };
  }

  return fail(lastReason, {
    online: lastOnline,
    model: lastModel,
    availableModels: lastAvailable,
  });
}

async function isVisionProviderModelExplicit(
  db: Database,
  active: ProviderConfig,
): Promise<boolean> {
  if (await getSetting(db, "llm.vision.model")) return true;

  const providers = await readJsonSetting<ProvidersMap>(db, "llm.providers");
  const roles = await readJsonSetting<RolesMap>(db, "llm.roles");
  const binding = roles?.vision;
  const sharedExplicit = [binding?.primary, binding?.fallback].some((id) => {
    if (!id) return false;
    const rec = providers?.[id];
    return (
      rec?.model === active.model &&
      (rec.url === undefined || rec.url === active.url)
    );
  });
  if (sharedExplicit) return true;

  const machine = getMachineAiConfig();
  const machineBinding = machine.roles?.vision;
  return [machineBinding?.primary, machineBinding?.fallback].some((id) => {
    if (!id) return false;
    const rec = machine.providers?.[id];
    return (
      rec?.model === active.model &&
      (rec.url === undefined || rec.url === active.url)
    );
  });
}

/** Non-starting readiness check for the opt-in UI observer vision endpoint. */
export async function checkVisionReadiness(
  db: Database,
): Promise<VisionReadyResult> {
  const cfg = await getProviderForRole(db, "vision");
  const chain = cfg.enabled ? await checkProviderChain(cfg) : undefined;
  const selected = chain?.firstUsable ?? chain?.primary;
  const active = selected?.endpoint ?? cfg;
  const online = selected?.online ?? false;
  const availableModels = selected?.availableModels ?? [];
  const modelAvailable = selected?.modelAvailable ?? false;
  const visionModelExplicit = await isVisionProviderModelExplicit(db, active);

  // Warn when vision falls back to the base text model — it is almost
  // certainly a text-only model that cannot interpret images.
  let warning: string | undefined;
  if (cfg.enabled && online && modelAvailable && !visionModelExplicit) {
    const cloudRec = getCloudModelRecommendation(active.url);
    if (cloudRec && active.model === cloudRec.model) {
      // Auto-recommended cloud vision model is active; do not warn about text-only fallback.
    } else {
      warning =
        `No explicit vision model configured (llm.vision.model). ` +
        `Falling back to base model "${active.model}", which may not support image input. ` +
        `Set a multimodal model: zam settings set llm.vision.model <model>`;
    }
  }

  return {
    enabled: cfg.enabled,
    online,
    url: active.url,
    model: active.model,
    modelAvailable,
    availableModels,
    usable: cfg.enabled && online && modelAvailable,
    visionModelExplicit,
    warning,
  };
}

export interface ProviderRoleStatus {
  role: LlmRole;
  enabled: boolean;
  providerName?: string;
  label?: string;
  source: ProviderConfig["source"];
  url: string;
  model: string;
  apiFlavor: ApiFlavor;
  local: boolean;
  online: boolean;
  modelAvailable: boolean;
  availableModels: string[];
  usable: boolean;
  reason?: "disabled" | "offline" | "model-not-found" | "unsupported-provider";
  fallback?: {
    providerName?: string;
    label?: string;
    source: ProviderConfig["source"];
    url: string;
    model: string;
    apiFlavor: ApiFlavor;
    local: boolean;
  };
}

function summarizeFallback(
  provider: ProviderConfig | undefined,
): ProviderRoleStatus["fallback"] {
  if (!provider) return undefined;
  return {
    providerName: provider.providerName,
    label: provider.label,
    source: provider.source,
    url: provider.url,
    model: provider.model,
    apiFlavor: provider.apiFlavor,
    local: provider.local,
  };
}

/** Secret-safe status for a provider role, suitable for bridge/UI output. */
export async function getProviderRoleStatus(
  db: Database,
  role: LlmRole,
): Promise<ProviderRoleStatus> {
  const cfg = await getProviderForRole(db, role);
  const unsupportedProvider =
    role !== "vision" && cfg.apiFlavor !== "chat-completions";

  if (!cfg.enabled) {
    return {
      role,
      enabled: false,
      providerName: cfg.providerName,
      label: cfg.label,
      source: cfg.source,
      url: cfg.url,
      model: cfg.model,
      apiFlavor: cfg.apiFlavor,
      local: cfg.local,
      online: false,
      modelAvailable: false,
      availableModels: [],
      usable: false,
      reason: "disabled",
      fallback: summarizeFallback(cfg.fallback),
    };
  }

  if (unsupportedProvider) {
    return {
      role,
      enabled: true,
      providerName: cfg.providerName,
      label: cfg.label,
      source: cfg.source,
      url: cfg.url,
      model: cfg.model,
      apiFlavor: cfg.apiFlavor,
      local: cfg.local,
      online: false,
      modelAvailable: false,
      availableModels: [],
      usable: false,
      reason: "unsupported-provider",
      fallback: summarizeFallback(cfg.fallback),
    };
  }

  const chain = await checkProviderChain(cfg);
  const selected = chain.firstUsable ?? chain.primary;
  const active = selected.endpoint;
  const usable = selected.online && selected.modelAvailable;
  const reason = usable
    ? undefined
    : selected.online
      ? "model-not-found"
      : "offline";

  return {
    role,
    enabled: true,
    providerName: active.providerName,
    label: active.label,
    source: active.source,
    url: active.url,
    model: active.model,
    apiFlavor: active.apiFlavor,
    local: active.local,
    online: selected.online,
    modelAvailable: selected.modelAvailable,
    availableModels: selected.availableModels,
    usable,
    reason,
    fallback: summarizeFallback(cfg.fallback),
  };
}

/** Whether the local LLM can actually be used this session, and if not, why. */
export interface LlmReadiness {
  usable: boolean;
  reason?: "disabled" | "offline" | "model-not-found" | "unsupported-provider";
}

type RunnerKind = "fastflowlm" | "ollama" | "generic" | "unknown";

function runnerKindFromHint(hint?: string): RunnerKind | undefined {
  if (!hint) return undefined;
  const normalized = hint.trim().toLowerCase();
  if (normalized === "flm" || normalized === "fastflowlm") {
    return "fastflowlm";
  }
  if (normalized === "ollama") return "ollama";
  if (
    normalized === "foundry-local" ||
    normalized === "foundry" ||
    normalized === "generic"
  ) {
    return "generic";
  }
  return undefined;
}

function defaultPortForRunner(runner: RunnerKind, url: string): string {
  try {
    const urlObj = new URL(url);
    const explicit = urlObj.port;
    if (explicit) return explicit;
    if (runner === "ollama") return "11434";
    if (urlObj.protocol === "https:") return "443";
    return "80";
  } catch {
    return runner === "ollama" ? "11434" : "8000";
  }
}

/** Pick the local runner from an explicit hint, else URL port / model name. */
function detectRunner(
  url: string,
  model: string,
  hint?: string,
): { runner: RunnerKind; port: string } {
  const fromHint = runnerKindFromHint(hint);
  if (fromHint) {
    return { runner: fromHint, port: defaultPortForRunner(fromHint, url) };
  }

  let runner: RunnerKind = "unknown";
  let port = "8000";
  try {
    const urlObj = new URL(url);
    port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
    if (
      port === "8000" ||
      port === "8080" ||
      model.includes("qwen") ||
      model.includes("gemma")
    ) {
      runner = "fastflowlm";
    } else if (port === "11434" || model.includes("llama")) {
      runner = "ollama";
    }
  } catch {
    runner = getSystemProfile().recommendedRunner;
  }
  return { runner, port };
}

/**
 * Best-effort, SILENT runner start for non-interactive contexts (bridge / GUI).
 * No console output, no prompts — just spawn the detached server if we can.
 */
function spawnLocalRunner(url: string, model: string, hint?: string): void {
  const { runner, port } = detectRunner(url, model, hint);
  try {
    if (runner === "fastflowlm") {
      const flmExe = existsSync("C:\\Program Files\\flm\\flm.exe")
        ? "C:\\Program Files\\flm\\flm.exe"
        : "flm";
      if (!hasCommand("flm") && flmExe === "flm") return;
      spawn(flmExe, ["serve", model, "--port", port], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    } else if (runner === "ollama" || runner === "generic") {
      if (!hasCommand("ollama")) return;
      spawn("ollama", ["serve"], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    }
  } catch {
    // best-effort: caller polls for the server and reports offline if it fails
  }
}

/**
 * Detect the configured runner and start it, then poll until the server is
 * online (or the user opts out). Returns true once reachable, false otherwise.
 */
async function startLocalRunner(
  url: string,
  model: string,
  locale: SupportedLocale,
  hint?: string,
): Promise<boolean> {
  const { runner, port } = detectRunner(url, model, hint);

  if (runner === "fastflowlm") {
    const flmExe = existsSync("C:\\Program Files\\flm\\flm.exe")
      ? "C:\\Program Files\\flm\\flm.exe"
      : "flm";
    if (!hasCommand("flm") && flmExe === "flm") {
      console.warn(
        "\x1b[31m✗ FastFlowLM is configured but could not be found on the system.\x1b[0m",
      );
      console.warn("Please run 'zam init' or install it manually.");
      return false;
    }
    const args = ["serve", model, "--port", port];
    console.log(
      `\x1b[36mStarting FastFlowLM serve process: ${flmExe} ${args.join(" ")}\x1b[0m`,
    );
    try {
      spawn(flmExe, args, {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    } catch (err) {
      console.error(
        `\x1b[31m✗ Failed to launch FastFlowLM process: ${(err as Error).message}\x1b[0m`,
      );
      return false;
    }
  } else if (runner === "ollama" || runner === "generic") {
    if (!hasCommand("ollama")) {
      console.warn(
        "\x1b[31m✗ Ollama is configured but the 'ollama' command is not available in PATH.\x1b[0m",
      );
      console.warn("Please run 'zam init' or install it manually.");
      return false;
    }
    console.log("\x1b[36mStarting Ollama serve process: ollama serve\x1b[0m");
    try {
      spawn("ollama", ["serve"], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    } catch (err) {
      console.error(
        `\x1b[31m✗ Failed to launch Ollama process: ${(err as Error).message}\x1b[0m`,
      );
      return false;
    }
  } else {
    console.warn(
      "\x1b[33m⚠ Unknown local LLM runner configured. Cannot auto-start.\x1b[0m",
    );
    return false;
  }

  // Poll until the server is online (or the user opts out).
  console.log(
    "Waiting for LLM server to become responsive and load the model...",
  );
  let attempts = 0;
  const dotsPerLine = 30;
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (await isLlmOnline(url)) {
      if (attempts > 0) process.stdout.write("\n");
      return true;
    }
    attempts++;
    process.stdout.write(".");
    if (attempts % dotsPerLine === 0) process.stdout.write("\n");

    // 60 attempts * 500ms = 30 seconds
    if (attempts >= 60) {
      process.stdout.write("\n");
      console.log(`\x1b[33m${t(locale, "wait_warning")}\x1b[0m`);
      console.log(`\x1b[2m${t(locale, "wait_info")}\x1b[0m`);

      const { confirm } = await import("@inquirer/prompts");
      const keepWaiting = await confirm({
        message: t(locale, "keep_waiting_llm"),
        default: true,
      }).catch(() => false);

      if (!keepWaiting) {
        return false;
      }
      attempts = 0;
    }
  }
}

/**
 * Make the local LLM ready for the session and report whether it is usable.
 *
 * Starts the local runner if needed, then — crucially — verifies the configured
 * model is actually served. A wrong model name otherwise leaves the server
 * reachable but every request hanging/failing, which previously looked like
 * "the AI is just slow". We now fail fast with an actionable message instead.
 */
export async function ensureLocalLlmRunning(
  db: Database,
): Promise<LlmReadiness> {
  const result = await prepareRecallChain(db, {
    timeoutMs: 25_000,
    interactive: true,
  });
  if (result.usable) {
    const location = result.local ? "local" : "cloud";
    console.log(
      `\x1b[32m✓ Recall LLM ready (${location}: ${result.model}).\x1b[0m`,
    );
    return { usable: true };
  }
  if (result.reason === "unsupported-provider") {
    console.warn(
      `\x1b[31m✗ Recall provider is not supported for active recall.\x1b[0m`,
    );
  } else if (result.reason === "model-not-found") {
    console.warn(
      `\x1b[31m✗ Configured model "${result.model}" is not available on the server.\x1b[0m`,
    );
    console.warn(`  Available models: ${result.availableModels.join(", ")}`);
  } else if (result.reason === "offline") {
    console.warn(
      `\x1b[33m⚠ No recall LLM endpoint is reachable. Continuing without AI coaching.\x1b[0m\n`,
    );
  }
  return { usable: false, reason: result.reason };
}

/** Readiness plus the live status details a UI needs to render. */
export interface LlmReadyResult extends LlmReadiness {
  online: boolean;
  model: string;
  availableModels: string[];
  providerName?: string;
  label?: string;
  local?: boolean;
  activeTier?: "primary" | "fallback";
}

/**
 * Non-interactive readiness check for the bridge / desktop GUI: start the local
 * runner if needed, wait (bounded) for it to come online, validate the model —
 * all WITHOUT console output or prompts, so the bridge's JSON stays clean.
 */
export async function ensureLlmReadyHeadless(
  db: Database,
  opts: { timeoutMs?: number } = {},
): Promise<LlmReadyResult> {
  return prepareRecallChain(db, {
    timeoutMs: opts.timeoutMs ?? 25_000,
    interactive: false,
  });
}

/**
 * Wraps a fetch call in an interactive wait loop with progress dots.
 * Every `timeoutMs`, prompts the user (in their locale) to keep waiting or skip.
 * In non-TTY / bridge contexts the timeout is a hard deadline because there
 * is no interactive prompt that can ask whether to keep waiting.
 */
export async function fetchWithInteractiveTimeout(
  url: string,
  options: RequestInit & {
    timeoutMs?: number;
    hardTimeoutMs?: number;
    locale?: SupportedLocale;
  } = {},
): Promise<Response> {
  const {
    timeoutMs = 20000,
    hardTimeoutMs = 120000,
    locale = "en",
    ...fetchOptions
  } = options;
  const controller = new AbortController();
  const fetchPromise = fetch(url, {
    ...fetchOptions,
    signal: controller.signal,
  });

  if (!process.stdout.isTTY || process.env.ZAM_BRIDGE === "true") {
    let timeoutId: NodeJS.Timeout | undefined;
    const hardTimeout = new Promise<never>((_resolve, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`LLM request timed out after ${hardTimeoutMs}ms`));
        controller.abort();
      }, hardTimeoutMs);
    });
    try {
      return await Promise.race([fetchPromise, hardTimeout]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  let attempts = 0;
  const dotsPerLine = 30;
  while (true) {
    let timeoutId: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<"timeout">((resolve) => {
      timeoutId = setTimeout(() => resolve("timeout"), timeoutMs);
    });
    const dotsInterval = setInterval(() => {
      process.stdout.write(".");
      attempts++;
      if (attempts % dotsPerLine === 0) process.stdout.write("\n");
    }, 500);

    try {
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      clearInterval(dotsInterval);
      clearTimeout(timeoutId);

      if (result !== "timeout") {
        if (attempts > 0) process.stdout.write("\n");
        return result;
      }

      // Timeout hit — ask the learner whether to keep waiting.
      console.log(`\n\x1b[33m${t(locale, "local_ai_working")}\x1b[0m`);
      const { confirm } = await import("@inquirer/prompts");
      const keepWaiting = await confirm({
        message: t(locale, "keep_waiting"),
        default: true,
      }).catch(() => false);

      if (!keepWaiting) {
        controller.abort();
        console.log(`\x1b[33m${t(locale, "proceeding_offline")}\x1b[0m\n`);
        throw new Error("User cancelled waiting for slow LLM response");
      }
      attempts = 0;
    } catch (err) {
      clearInterval(dotsInterval);
      clearTimeout(timeoutId);
      if (attempts > 0) process.stdout.write("\n");
      throw err;
    }
  }
}

/**
 * Ensures a token has a high-quality active-recall question.
 * When LLM is enabled, generates a fresh question on the fly, self-heals it into
 * the database, and returns it. Otherwise falls back to the stored question.
 */
export async function ensureHighQualityQuestion(
  db: Database,
  token: {
    id: string;
    slug: string;
    concept: string;
    domain: string;
    bloomLevel: number;
    sourceLink?: string | null;
    question?: string | null;
  },
): Promise<QuestionResolution | null> {
  const { enabled } = await getLlmConfig(db);

  if (enabled) {
    try {
      let sourceLinkContent: string | null = null;
      if (token.sourceLink) {
        const resolved = await resolveReviewContext(token.sourceLink).catch(
          () => null,
        );
        if (resolved) {
          sourceLinkContent = resolved.content;
        }
      }

      const generated = await generateQuestionViaLLM(db, {
        slug: token.slug,
        concept: token.concept,
        domain: token.domain,
        bloomLevel: token.bloomLevel,
        sourceLinkContent,
      });

      if (generated.text.trim().length > 0) {
        // Persist the latest high-quality question as the offline fallback.
        await updateToken(db, token.slug, { question: generated.text });
        return {
          question: generated.text,
          source: "llm",
          model: generated.model,
        };
      }
    } catch {
      // Fail silently and fall back to the stored database question.
    }
  }

  if (token.question && token.question.trim().length > 0) {
    return {
      question: token.question.trim(),
      source: "original",
    };
  }

  return null;
}
