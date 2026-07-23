/**
 * Cloud vision-language OCR + decompose for mobile image import.
 *
 * Builds an OpenAI-compatible chat-completions multimodal request, sends it
 * through the native `vision_request` command (injected for tests), and
 * normalizes each JSON array entry into a MobileTokenDraft.
 */

import { type MobileTokenDraft, normalizeBridgeDraft } from "./import.js";
import {
  type MobileVisionEndpoint,
  visionProviderStamp,
} from "./vision-config.js";

export const VL_IMPORT_SYSTEM_PROMPT =
  "You are ZAM's learning-content importer. Return only strict JSON. Do not include markdown, prose, or fields outside the requested schema.";

export function buildVlDecomposeUserText(locale: string): string {
  const language = locale.toLowerCase().startsWith("de") ? "German" : "English";
  return `OCR this textbook, worksheet, or screenshot and decompose it into distinct learning tokens.

Return a JSON array only. Each element is one token object:
{
  "slug": "kebab-case-id",
  "title": "short human title",
  "concept": "the fact, definition, or skill to learn",
  "domain": "subject or topic",
  "bloomLevel": 1,
  "question": "optional active-recall question",
  "source_link": null
}

Rules:
- Prefer several focused tokens over one giant blob.
- Use ${language} for title, concept, question, and domain when the source is in that language.
- bloomLevel is an integer 1–5 (1 remember … 5 create).
- slug must be non-empty kebab-case (letters, digits, hyphens).
- If nothing educational is present, return [].`;
}

export interface ChatCompletionsVisionBody {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content:
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        >;
  }>;
  temperature: number;
  max_tokens: number;
}

/** Build the chat-completions request body for a single image data URL. */
export function buildVlChatCompletionsBody(
  endpoint: MobileVisionEndpoint,
  imageDataUrl: string,
  locale: string,
): ChatCompletionsVisionBody {
  return {
    model: endpoint.model,
    messages: [
      { role: "system", content: VL_IMPORT_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: buildVlDecomposeUserText(locale) },
          { type: "image_url", image_url: { url: imageDataUrl } },
        ],
      },
    ],
    temperature: 0,
    max_tokens: 4_000,
  };
}

export function chatCompletionsUrl(baseUrl: string): string {
  const base = baseUrl.replace(/\/+$/, "");
  return base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
}

export function visionRequestHeaders(
  endpoint: MobileVisionEndpoint,
): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (endpoint.apiKey) {
    headers.Authorization = `Bearer ${endpoint.apiKey}`;
  }
  return headers;
}

function extractJsonText(content: string): string {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? content).trim();
}

function parseJsonValue(content: string): unknown {
  const candidate = extractJsonText(content);
  try {
    return JSON.parse(candidate);
  } catch {
    const arrayStart = candidate.indexOf("[");
    const arrayEnd = candidate.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      return JSON.parse(candidate.slice(arrayStart, arrayEnd + 1));
    }
    const objStart = candidate.indexOf("{");
    const objEnd = candidate.lastIndexOf("}");
    if (objStart !== -1 && objEnd > objStart) {
      return JSON.parse(candidate.slice(objStart, objEnd + 1));
    }
    throw new Error("Vision model returned no JSON");
  }
}

function asObjectArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
    );
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    // Tolerate a single object or { tokens: [...] } / { drafts: [...] }.
    for (const key of ["tokens", "drafts", "items", "concepts"]) {
      if (Array.isArray(record[key])) {
        return asObjectArray(record[key]);
      }
    }
    return [record];
  }
  return [];
}

/**
 * Parse model output into zero or more bridge-token drafts (origin image-vl).
 * Invalid entries are skipped; if nothing valid remains, throws.
 */
export function parseVlDecomposeResponse(
  content: string,
  providerStamp: string,
): MobileTokenDraft[] {
  if (!content.trim()) {
    throw new Error("Vision model returned empty content");
  }

  let parsed: unknown;
  try {
    parsed = parseJsonValue(content);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Vision model returned unparseable output",
    );
  }

  const objects = asObjectArray(parsed);
  const drafts: MobileTokenDraft[] = [];
  for (const entry of objects) {
    try {
      const draft = normalizeBridgeDraft(entry, "image-vl");
      drafts.push({ ...draft, provider: providerStamp });
    } catch {
      // Skip malformed entries; one bad object must not kill the batch.
    }
  }

  if (drafts.length === 0) {
    throw new Error(
      "Vision model returned no usable learning tokens (need slug + concept)",
    );
  }
  return drafts;
}

/** Extract assistant text from a chat-completions HTTP body. */
export function extractChatCompletionsContent(responseText: string): string {
  let data: unknown;
  try {
    data = JSON.parse(responseText);
  } catch {
    // Some gateways return bare content; treat the whole body as content.
    return responseText.trim();
  }

  if (!data || typeof data !== "object") {
    throw new Error("Vision response is not a JSON object");
  }
  const record = data as {
    error?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  if (record.error !== undefined) {
    const msg =
      typeof record.error === "string"
        ? record.error
        : record.error &&
            typeof record.error === "object" &&
            "message" in record.error &&
            typeof (record.error as { message: unknown }).message === "string"
          ? (record.error as { message: string }).message
          : JSON.stringify(record.error);
    if (
      msg.toLowerCase().includes("image") &&
      (msg.toLowerCase().includes("not support") ||
        msg.toLowerCase().includes("unsupported"))
    ) {
      throw new Error(
        `Vision model does not support image input. Set a multimodal model (llm.vision.model).`,
      );
    }
    throw new Error(`Vision model failed: ${msg}`);
  }

  const content = record.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Empty response from vision model");
  }
  return content.trim();
}

export type VisionRequestFn = (args: {
  url: string;
  headers: Record<string, string>;
  body: string;
  timeoutMs?: number;
}) => Promise<string>;

export interface DecomposeImageInput {
  endpoint: MobileVisionEndpoint;
  imageDataUrl: string;
  locale: string;
  request: VisionRequestFn;
  timeoutMs?: number;
}

/** Full path: build → native HTTP → parse drafts. */
export async function decomposeImageViaVision(
  input: DecomposeImageInput,
): Promise<MobileTokenDraft[]> {
  if (input.endpoint.apiFlavor !== "chat-completions") {
    throw new Error(
      `API flavor ${input.endpoint.apiFlavor} is not supported for mobile vision import yet`,
    );
  }

  const body = buildVlChatCompletionsBody(
    input.endpoint,
    input.imageDataUrl,
    input.locale,
  );
  const responseText = await input.request({
    url: chatCompletionsUrl(input.endpoint.url),
    headers: visionRequestHeaders(input.endpoint),
    body: JSON.stringify(body),
    timeoutMs: input.timeoutMs,
  });

  const content = extractChatCompletionsContent(responseText);
  return parseVlDecomposeResponse(
    content,
    visionProviderStamp(input.endpoint.model),
  );
}
