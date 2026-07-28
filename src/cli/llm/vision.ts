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

  const imageUrls: string[] = [];
  const isVideo = /\.(mp4|mov|m4v|avi|mkv|webm)$/i.test(input.imagePath);

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
        imageUrls.push(`data:image/png;base64,${bytes.toString("base64")}`);
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
    imageUrls.push(`data:${mime};base64,${imageBytes.toString("base64")}`);
  }

  if (imageUrls.length === 0) {
    throw new Error("No image data available for vision analysis");
  }

  // Try the role's primary endpoint, then its configured fallback. The
  // frame-sampled `imageUrls` are shared across endpoints; only the endpoint
  // (url/key/model/flavor) changes. `input.model` overrides the primary only.
  const endpoints: Array<
    Pick<VisionRequestArgs, "url" | "apiKey" | "model" | "apiFlavor">
  > = [
    {
      url: cfg.url,
      apiKey: cfg.apiKey || DEFAULT_LLM_API_KEY,
      model: input.model ?? cfg.model,
      apiFlavor: cfg.apiFlavor,
    },
  ];
  if (cfg.fallback) {
    endpoints.push({
      url: cfg.fallback.url,
      apiKey: cfg.fallback.apiKey || DEFAULT_LLM_API_KEY,
      model: cfg.fallback.model,
      apiFlavor: cfg.fallback.apiFlavor,
    });
  }

  let lastRequestError: Error | undefined;
  let sawUnparseableDraft = false;
  let sawInvalidDraft = false;

  for (const endpoint of endpoints) {
    let content: string;
    try {
      content = await requestVisionDraft({
        ...endpoint,
        locale: cfg.locale,
        imageUrls,
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
  imageUrls: string[];
  input: UiSnapshotObservationInput;
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
    args.imageUrls.length > 1
      ? "Observe this sequence of Windows/macOS application snapshots showing a task performed over time."
      : "Observe this Windows/macOS application snapshot for a learning session.";
  return `${intro}
Application process: ${args.input.application.processName}
Window title: ${args.input.application.windowTitle ?? "(unknown)"}

Return this JSON draft only:
${visionSchema(language)}`;
}

/** Dispatch to the configured wire protocol for the vision endpoint. */
async function requestVisionDraft(args: VisionRequestArgs): Promise<string> {
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
              ...args.imageUrls.map((url) => ({
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
            ...args.imageUrls.map(dataUrlToAnthropicImage),
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
