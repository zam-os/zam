/**
 * Reading photos or a PDF on the phone for a material import (ADR 2026-10-05,
 * Decisions 1 and 10).
 *
 * The request is the desktop's built-in one (`material-prompt.ts`): the same
 * instructions, the same body, the same strict PDF gate. It goes through the
 * native `vision_request` command (injected for tests), which refuses bodies
 * over 8 MB, so photos travel in batches under that limit and the replies are
 * merged.
 */

import {
  buildMaterialRequest,
  type MaterialAttachment,
  type MaterialReply,
  parseMaterialReply,
} from "../../src/cli/llm/material-prompt.js";
import { chatCompletionsUrl } from "./ai/chat-url.js";

/** Just under the native command's 8 MB body limit, for the JSON around it. */
export const MOBILE_REQUEST_MAX_BYTES = 7_500_000;
/** Reading a page of notes and writing its cards can take minutes. */
export const MOBILE_MATERIAL_TIMEOUT_MS = 300_000;

/** One model a request can go to; the chain is tried in order. */
export interface MobileMaterialEndpoint {
  url: string;
  model: string;
  apiKey?: string;
  label: string;
  /** The row's `file` capability: it reads PDFs itself. */
  readsPdf: boolean;
}

export function visionRequestHeaders(endpoint: {
  apiKey?: string;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (endpoint.apiKey) {
    headers.Authorization = `Bearer ${endpoint.apiKey}`;
  }
  return headers;
}

function isOpenRouter(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "openrouter.ai" || host.endsWith(".openrouter.ai");
  } catch {
    return false;
  }
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

/**
 * One batch of attachments through the chain: the first model that answers
 * with a readable reply wins. The last failure is thrown when none does.
 */
export async function readMaterialOnDevice(input: {
  endpoints: MobileMaterialEndpoint[];
  instructions: string;
  attachments: MaterialAttachment[];
  request: VisionRequestFn;
}): Promise<{ reply: MaterialReply; endpoint: MobileMaterialEndpoint }> {
  let lastError: unknown = new Error("No model can read this material.");
  for (const endpoint of input.endpoints) {
    try {
      const request = buildMaterialRequest(
        "chat-completions",
        { model: endpoint.model, readsPdf: endpoint.readsPdf },
        {
          instructions: input.instructions,
          attachments: input.attachments,
          openRouter: isOpenRouter(endpoint.url),
        },
      );
      const responseText = await input.request({
        url: chatCompletionsUrl(endpoint.url),
        headers: visionRequestHeaders(endpoint),
        body: JSON.stringify(request.body),
        timeoutMs: MOBILE_MATERIAL_TIMEOUT_MS,
      });
      const reply = parseMaterialReply(
        extractChatCompletionsContent(responseText),
      );
      return { reply, endpoint };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
