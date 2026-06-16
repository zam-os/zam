import { readFileSync } from "node:fs";
import { basename } from "node:path";
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
  UI_OBSERVATION_PROTOCOL_VERSION,
} from "../../kernel/index.js";
import {
  DEFAULT_LLM_API_KEY,
  fetchWithInteractiveTimeout,
  getVisionConfig,
} from "./client.js";

const LANGUAGE_NAMES: Record<SupportedLocale, string> = {
  en: "English",
  de: "German",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  zh: "Chinese",
  ja: "Japanese",
};

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
  const cfg = await getVisionConfig(db);
  if (!cfg.enabled) {
    throw new Error(
      "Vision observation is disabled in settings (llm.vision.enabled)",
    );
  }

  const imageBytes = readFileSync(input.imagePath);
  const imageUrl = `data:image/png;base64,${imageBytes.toString("base64")}`;
  const model = input.model ?? cfg.model;
  const content = await requestVisionDraft({
    url: cfg.url,
    apiKey: cfg.apiKey || DEFAULT_LLM_API_KEY,
    model,
    locale: cfg.locale,
    imageUrl,
    input,
  });

  let draft: VisionObservationDraft;
  try {
    draft = extractDraft(content);
  } catch {
    return uncertainReport(
      input,
      "Vision model returned output that could not be parsed as JSON.",
    );
  }

  const report = buildReport(input, draft);
  if (!isUiObservationReport(report)) {
    return uncertainReport(
      input,
      "Vision model returned an invalid UI report draft.",
    );
  }
  return report;
}

async function requestVisionDraft(args: {
  url: string;
  apiKey: string;
  model: string;
  locale: SupportedLocale;
  imageUrl: string;
  input: UiSnapshotObservationInput;
}): Promise<string> {
  const language = LANGUAGE_NAMES[args.locale] ?? "English";
  const schema = `{
  "kind": "progress | step-completed | error | help-seeking | uncertain",
  "summary": "short factual UI summary in ${language}",
  "actions": [{"type": "click | shortcut | typing | scroll | window-change", "target": "optional UI target", "result": "optional visible result"}],
  "candidateTokens": [{"slug": "optional-kebab-case-skill-token", "confidence": 0.0, "rationale": "why this token may matter"}],
  "confidence": 0.0
}`;

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
          {
            role: "system",
            content:
              "You are ZAM's UI observer. Return only strict JSON. Do not include markdown, prose, or fields outside the requested schema.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Observe this Windows application snapshot for a learning session.
Application process: ${args.input.application.processName}
Window title: ${args.input.application.windowTitle ?? "(unknown)"}

Return this JSON draft only:
${schema}`,
              },
              {
                type: "image_url",
                image_url: { url: args.imageUrl },
              },
            ],
          },
        ],
        temperature: 0,
        max_tokens: args.input.maxTokens ?? 450,
      }),
      locale: args.locale,
      hardTimeoutMs: args.input.hardTimeoutMs ?? 180000,
    },
  );

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `Vision LLM request failed: ${res.statusText} (${res.status}) - ${errorText}`,
    );
  }

  const data = (await res.json()) as ChatCompletionResponse;
  if (data.error !== undefined) {
    throw new Error(`Vision model failed: ${formatModelError(data.error)}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("Empty response from vision model");
  }
  return content.trim();
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
