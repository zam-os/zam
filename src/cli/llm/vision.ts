import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import type {
  Database,
  SupportedLocale,
  UiActionType,
  UiApplicationContext,
  UiCandidateToken,
  UiObservationKind,
  UiObservationReport,
  UiObservedAction,
} from "../../kernel/index.js";
import {
  isUiObservationReport,
  LANGUAGE_NAMES,
  UI_OBSERVATION_PROTOCOL_VERSION,
} from "../../kernel/index.js";
import {
  type ApiFlavor,
  DEFAULT_LLM_API_KEY,
  DEFAULT_LLM_MAX_TOKENS,
  fetchWithInteractiveTimeout,
  getProviderForRole,
  prepareFoundryEndpoint,
} from "./client.js";

const OBSERVATION_KINDS = new Set<UiObservationKind>([
  "progress",
  "step-completed",
  "error",
  "help-seeking",
  "uncertain",
  "privacy-pause",
  "heartbeat",
]);

const ACTION_TYPES = new Set<UiActionType>([
  "click",
  "shortcut",
  "typing",
  "scroll",
  "window-change",
]);

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: unknown;
}

interface VisionObservationDraft {
  kind?: unknown;
  summary?: unknown;
  actions?: unknown;
  candidateTokens?: unknown;
  confidence?: unknown;
}

export interface UiSnapshotObservationInput {
  sessionId: string;
  sequence: number;
  observedFrom: string;
  observedTo: string;
  imagePath: string;
  application: UiApplicationContext;
  evidenceRef?: string;
  redacted?: boolean;
  model?: string;
  maxTokens?: number;
  hardTimeoutMs?: number;
}
interface VisionImage {
  bytes: Buffer;
  mime: string;
}

function toDataUrl(image: VisionImage): string {
  return `data:${image.mime};base64,${image.bytes.toString("base64")}`;
}

export async function observeUiSnapshotViaLLM(
  db: Database,
  input: UiSnapshotObservationInput,
): Promise<UiObservationReport> {
  const cfg = await getProviderForRole(db, "vision");
  if (!cfg.enabled) {
    throw new Error(
      "Vision observation is disabled in settings (llm.vision.enabled)",
    );
  }

  const isVideo = /\.(mp4|mov|m4v|avi|mkv|webm)$/i.test(input.imagePath);
  const images: VisionImage[] = [];

  if (isVideo) {
    const { mkdirSync, readdirSync, rmSync } = await import("node:fs");
    const { execSync } = await import("node:child_process");
    const tempDir = join(
      tmpdir(),
      `zam-frames-${randomBytes(4).toString("hex")}`,
    );
    mkdirSync(tempDir, { recursive: true });

    try {
      execSync(
        `ffmpeg -i "${input.imagePath}" -vf "fps=1/3,scale=1280:-1" -vsync vfr "${tempDir}/frame_%03d.png"`,
        { stdio: "ignore" },
      );

      let files = readdirSync(tempDir)
        .filter((f) => f.endsWith(".png"))
        .sort();

      if (files.length === 0) {
        execSync(
          `ffmpeg -i "${input.imagePath}" -vframes 1 "${tempDir}/frame_001.png"`,
          { stdio: "ignore" },
        );
        files = readdirSync(tempDir)
          .filter((f) => f.endsWith(".png"))
          .sort();
      }

      const maxFrames = cfg.maxFrames ?? 100;
      let sampledFiles = files;
      if (files.length > maxFrames) {
        if (maxFrames <= 1) {
          sampledFiles = [files[0]];
        } else {
          const step = (files.length - 1) / (maxFrames - 1);
          sampledFiles = [];
          for (let i = 0; i < maxFrames; i++) {
            const index = Math.round(i * step);
            sampledFiles.push(files[index]);
          }
        }
      }

      for (const file of sampledFiles) {
        const bytes = readFileSync(join(tempDir, file));
        images.push({ bytes, mime: "image/png" });
      }
    } finally {
      try {
        rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  } else {
    const imageBytes = readFileSync(input.imagePath);
    const ext = input.imagePath.split(".").pop()?.toLowerCase();
    const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
    images.push({ bytes: imageBytes, mime });
  }

  if (images.length === 0) {
    throw new Error("No image data available for vision analysis");
  }

  // Try the role's primary endpoint, then its configured fallback. The
  // frame-sampled images are materialized for each endpoint; only the endpoint
  // (url/key/model/flavor) changes. `input.model` overrides the primary only.
  type VisionEndpoint = Pick<
    VisionRequestArgs,
    "url" | "apiKey" | "model" | "apiFlavor"
  > & { runner?: string };
  const endpoints: VisionEndpoint[] = [
    {
      url: cfg.url,
      apiKey: cfg.apiKey || DEFAULT_LLM_API_KEY,
      model: input.model ?? cfg.model,
      apiFlavor: cfg.apiFlavor,
      runner: cfg.runner,
    },
  ];
  if (cfg.fallback) {
    endpoints.push({
      url: cfg.fallback.url,
      apiKey: cfg.fallback.apiKey || DEFAULT_LLM_API_KEY,
      model: cfg.fallback.model,
      apiFlavor: cfg.fallback.apiFlavor,
      runner: cfg.fallback.runner,
    });
  }

  let lastRequestError: Error | undefined;
  let sawUnparseableDraft = false;
  let sawInvalidDraft = false;

  for (const endpoint of endpoints) {
    let content: string;
    try {
      const preparedEndpoint = await prepareFoundryEndpoint(endpoint);
      content = await requestVisionDraft({
        ...preparedEndpoint,
        locale: cfg.locale,
        images,
        input,
      });
    } catch (err) {
      lastRequestError = err as Error;
      continue;
    }

    let draft: VisionObservationDraft;
    try {
      draft = extractDraft(content);
    } catch {
      sawUnparseableDraft = true;
      continue;
    }

    const report = buildReport(input, draft);
    if (isUiObservationReport(report)) {
      return report;
    }
    sawInvalidDraft = true;
  }

  // All endpoints exhausted. Surface a hard request error only when no endpoint
  // produced any draft at all; otherwise return an uncertain report reflecting
  // the most informative failure seen.
  if (lastRequestError && !sawUnparseableDraft && !sawInvalidDraft) {
    throw lastRequestError;
  }
  if (sawInvalidDraft) {
    return uncertainReport(
      input,
      "Vision model returned an invalid UI report draft.",
    );
  }
  return uncertainReport(
    input,
    "Vision model returned output that could not be parsed as JSON.",
  );
}

type VisionRequestArgs = {
  url: string;
  apiKey: string;
  model: string;
  apiFlavor: ApiFlavor;
  locale: SupportedLocale;
  images: VisionImage[];
  input: UiSnapshotObservationInput;
  runner?: string;
};

const VISION_SYSTEM_PROMPT =
  "You are ZAM's UI observer. Return only strict JSON. Do not include markdown, prose, or fields outside the requested schema.";

function visionSchema(language: string): string {
  return `{
  "kind": "progress | step-completed | error | help-seeking | uncertain",
  "summary": "short factual UI summary in ${language}",
  "actions": [{"type": "click | shortcut | typing | scroll | window-change", "target": "optional UI target", "result": "optional visible result"}],
  "candidateTokens": [{"slug": "optional-kebab-case-skill-token", "confidence": 0.0, "rationale": "why this token may matter"}],
  "confidence": 0.0
}`;
}

function visionUserText(args: VisionRequestArgs, language: string): string {
  const intro =
    args.images.length > 1
      ? "Observe this sequence of Windows/macOS application snapshots showing a task performed over time."
      : "Observe this Windows/macOS application snapshot for a learning session.";
  return `${intro}
Application process: ${args.input.application.processName}
Window title: ${args.input.application.windowTitle ?? "(unknown)"}

Return this JSON draft only:
${visionSchema(language)}`;
}

function isOllamaVisionEndpoint(args: VisionRequestArgs): boolean {
  if (args.runner?.trim().toLowerCase() === "ollama") return true;
  try {
    return new URL(args.url).port === "11434";
  } catch {
    return false;
  }
}

/** Dispatch to the configured wire protocol for the vision endpoint. */
async function requestVisionDraft(args: VisionRequestArgs): Promise<string> {
  if (isOllamaVisionEndpoint(args)) {
    return requestOllamaVisionDraft(args);
  }
  if (args.apiFlavor === "anthropic-messages") {
    return requestAnthropicVisionDraft(args);
  }
  return requestChatCompletionsVisionDraft(args);
}

async function requestChatCompletionsVisionDraft(
  args: VisionRequestArgs,
): Promise<string> {
  const language = LANGUAGE_NAMES[args.locale] ?? "English";

  const res = await fetchWithInteractiveTimeout(
    `${args.url}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${args.apiKey}`,
      },
      body: JSON.stringify({
        model: args.model,
        messages: [
          { role: "system", content: VISION_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: visionUserText(args, language) },
              ...args.images.map(toDataUrl).map((url) => ({
                type: "image_url",
                image_url: { url },
              })),
            ],
          },
        ],
        temperature: 0,
        max_tokens: args.input.maxTokens ?? DEFAULT_LLM_MAX_TOKENS,
        ...(args.url.includes("11434") ||
        args.url.includes("localhost") ||
        args.url.includes("127.0.0.1")
          ? { options: { num_ctx: 32768 } }
          : {}),
      }),
      locale: args.locale,
      hardTimeoutMs: args.input.hardTimeoutMs ?? 180000,
    },
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    // Provide a clear hint when the model rejects image input — this
    // typically means the configured model is text-only.
    if (
      errorText.includes("image") &&
      (errorText.includes("not support") || errorText.includes("unsupported"))
    ) {
      throw new Error(
        `Vision model "${args.model}" does not support image input. ` +
          `Set a multimodal model: zam settings set llm.vision.model <model>`,
      );
    }
    throw new Error(
      `Vision LLM request failed: ${res.statusText} (${res.status}) - ${errorText}`,
    );
  }

  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error !== undefined) {
    const errorMsg = formatModelError(data.error);
    // Provide a clear hint when the model rejects image input.
    if (
      errorMsg.includes("image") &&
      (errorMsg.includes("not support") || errorMsg.includes("unsupported"))
    ) {
      throw new Error(
        `Vision model "${args.model}" does not support image input. ` +
          `Set a multimodal model: zam settings set llm.vision.model <model>`,
      );
    }
    throw new Error(`Vision model failed: ${errorMsg}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Empty response from vision model");
  }
  return content.trim();
}

interface AnthropicImageBlock {
  type: "image";
  source: { type: "base64"; media_type: string; data: string };
}

interface AnthropicMessageResponse {
  content?: Array<{ type?: string; text?: string }>;
  stop_reason?: string;
  error?: unknown;
}

function dataUrlToAnthropicImage(dataUrl: string): AnthropicImageBlock {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Unsupported image data for Anthropic vision request");
  }
  return {
    type: "image",
    source: { type: "base64", media_type: match[1], data: match[2] },
  };
}

/**
 * Anthropic Messages API vision request (ADR 2026-06-23 item 2). The Messages
 * API is not OpenAI-shaped: keys go on `x-api-key`, images are base64 source
 * blocks, and the reply is a content-block array.
 */
async function requestAnthropicVisionDraft(
  args: VisionRequestArgs,
): Promise<string> {
  const language = LANGUAGE_NAMES[args.locale] ?? "English";
  const base = args.url.replace(/\/+$/, "").replace(/\/v1$/, "");

  const res = await fetchWithInteractiveTimeout(`${base}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: args.input.maxTokens ?? DEFAULT_LLM_MAX_TOKENS,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: visionUserText(args, language) },
            ...args.images.map(toDataUrl).map(dataUrlToAnthropicImage),
          ],
        },
      ],
    }),
    locale: args.locale,
    hardTimeoutMs: args.input.hardTimeoutMs ?? 180000,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Vision LLM request failed: ${res.statusText} (${res.status}) - ${errorText}`,
    );
  }

  const data = (await res.json()) as AnthropicMessageResponse;
  if (data.error !== undefined) {
    throw new Error(`Vision model failed: ${formatModelError(data.error)}`);
  }
  if (data.stop_reason === "refusal") {
    throw new Error("Vision model refused the request (safety classifier).");
  }
  const text = data.content?.find(
    (b) => b.type === "text" && typeof b.text === "string",
  )?.text;
  if (!text) {
    throw new Error("Empty response from vision model");
  }
  return text.trim();
}

function extractDraft(content: string): VisionObservationDraft {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? content).trim();
  try {
    return JSON.parse(candidate) as VisionObservationDraft;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("no JSON object found");
    return JSON.parse(
      candidate.slice(start, end + 1),
    ) as VisionObservationDraft;
  }
}

function buildReport(
  input: UiSnapshotObservationInput,
  draft: VisionObservationDraft,
): UiObservationReport {
  return {
    version: UI_OBSERVATION_PROTOCOL_VERSION,
    sessionId: input.sessionId,
    sequence: input.sequence,
    observedFrom: input.observedFrom,
    observedTo: input.observedTo,
    kind: parseKind(draft.kind),
    application: input.application,
    summary: parseSummary(draft.summary),
    actions: parseActions(draft.actions),
    evidence: [
      {
        type: "keyframe",
        ref: input.evidenceRef ?? basename(input.imagePath),
        redacted: input.redacted ?? false,
      },
    ],
    candidateTokens: parseCandidateTokens(draft.candidateTokens),
    confidence: parseConfidence(draft.confidence, 0.35),
  };
}

function uncertainReport(
  input: UiSnapshotObservationInput,
  summary: string,
): UiObservationReport {
  return {
    version: UI_OBSERVATION_PROTOCOL_VERSION,
    sessionId: input.sessionId,
    sequence: input.sequence,
    observedFrom: input.observedFrom,
    observedTo: input.observedTo,
    kind: "uncertain",
    application: input.application,
    summary,
    actions: [],
    evidence: [
      {
        type: "keyframe",
        ref: input.evidenceRef ?? basename(input.imagePath),
        redacted: input.redacted ?? false,
      },
    ],
    candidateTokens: [],
    confidence: 0.1,
  };
}

function parseKind(value: unknown): UiObservationKind {
  if (
    typeof value === "string" &&
    OBSERVATION_KINDS.has(value as UiObservationKind)
  ) {
    return value as UiObservationKind;
  }
  return "uncertain";
}

function parseSummary(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return "Vision model did not provide a factual UI summary.";
}

function parseActions(value: unknown): UiObservedAction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): UiObservedAction[] => {
    if (!isRecord(item) || typeof item.type !== "string") return [];
    if (!ACTION_TYPES.has(item.type as UiActionType)) return [];
    const action: UiObservedAction = { type: item.type as UiActionType };
    if (typeof item.target === "string" && item.target.trim()) {
      action.target = item.target.trim();
    }
    if (typeof item.result === "string" && item.result.trim()) {
      action.result = item.result.trim();
    }
    return [action];
  });
}

function parseCandidateTokens(value: unknown): UiCandidateToken[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): UiCandidateToken[] => {
    if (!isRecord(item)) return [];
    if (typeof item.slug !== "string" || !/^[A-Za-z0-9._-]+$/.test(item.slug)) {
      return [];
    }
    if (typeof item.rationale !== "string" || !item.rationale.trim()) {
      return [];
    }
    return [
      {
        slug: item.slug,
        confidence: parseConfidence(item.confidence, 0.2),
        rationale: item.rationale.trim(),
      },
    ];
  });
}

function parseConfidence(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function formatModelError(error: unknown): string {
  if (typeof error === "string") return error;
  if (isRecord(error) && typeof error.message === "string") {
    return error.message;
  }
  return JSON.stringify(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

interface OllamaChatResponse {
  message?: { content?: unknown };
  error?: unknown;
}

const OLLAMA_VISION_CONTEXT_TOKENS = 8192;
const OLLAMA_VISION_TIMEOUT_MS = 600000;

async function readOllamaVisionResponse(
  response: Response,
  hardTimeoutMs: number,
): Promise<OllamaChatResponse> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Ollama vision response has no readable body.");
  }

  const decoder = new TextDecoder();
  const content: string[] = [];
  let pending = "";
  let modelError: unknown;
  const readLine = (line: string): void => {
    if (!line.trim()) return;
    let chunk: OllamaChatResponse;
    try {
      chunk = JSON.parse(line) as OllamaChatResponse;
    } catch {
      throw new Error("Ollama vision model returned invalid streamed JSON.");
    }
    if (chunk.error !== undefined) {
      modelError = chunk.error;
      return;
    }
    const fragment = chunk.message?.content;
    if (typeof fragment === "string") content.push(fragment);
  };

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    await Promise.race([
      (async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          pending += decoder.decode(value, { stream: true });
          const lines = pending.split(/\r?\n/);
          pending = lines.pop() ?? "";
          for (const line of lines) readLine(line);
        }
        pending += decoder.decode();
        if (pending.trim()) readLine(pending);
      })(),
      new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          void reader.cancel();
          reject(
            new Error(
              `Ollama vision request timed out after ${hardTimeoutMs}ms`,
            ),
          );
        }, hardTimeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }

  return modelError === undefined
    ? { message: { content: content.join("") } }
    : { error: modelError };
}

/**
 * Ollama's native chat endpoint accepts image bytes directly and honours
 * `think: false` for Qwen3-VL. Its OpenAI-compatible endpoint can otherwise
 * spend the response budget in a private reasoning field and leave `content`
 * empty, which is unsafe for an observer that requires structured output.
 */
async function requestOllamaVisionDraft(
  args: VisionRequestArgs,
): Promise<string> {
  const language = LANGUAGE_NAMES[args.locale] ?? "English";
  const base = args.url.replace(/\/+$/, "").replace(/\/v1$/, "");
  const hardTimeoutMs = args.input.hardTimeoutMs ?? OLLAMA_VISION_TIMEOUT_MS;
  const res = await fetchWithInteractiveTimeout(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: args.model,
      stream: true,
      think: false,
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: visionUserText(args, language),
          images: args.images.map((image) => image.bytes.toString("base64")),
        },
      ],
      options: {
        temperature: 0,
        num_ctx: OLLAMA_VISION_CONTEXT_TOKENS,
        num_predict: args.input.maxTokens ?? DEFAULT_LLM_MAX_TOKENS,
      },
    }),
    locale: args.locale,
    hardTimeoutMs,
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Ollama vision request failed: ${res.statusText} (${res.status}) - ${errorText}`,
    );
  }

  const data = await readOllamaVisionResponse(res, hardTimeoutMs);
  if (data.error !== undefined) {
    throw new Error(
      `Ollama vision model failed: ${formatModelError(data.error)}`,
    );
  }
  const content = data.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error(
      "Ollama vision model returned no visible answer. Try Qwen3-VL 4B again.",
    );
  }
  return content.trim();
}
