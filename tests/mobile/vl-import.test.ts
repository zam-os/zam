import { describe, expect, it } from "vitest";
import {
  extractChatCompletionsContent,
  type MobileMaterialEndpoint,
  readMaterialOnDevice,
  type VisionRequestFn,
  visionRequestHeaders,
} from "../../mobile/src/vl-import.js";
import type { MaterialAttachment } from "../../src/cli/llm/material-prompt.js";

/**
 * The phone sends the desktop's built-in request (ADR 2026-10-05, Phase 8)
 * through the native `vision_request` command, mocked here.
 */

const photo: MaterialAttachment = {
  name: "IMG_1.jpg",
  kind: "image",
  mime: "image/jpeg",
  base64: "AAAA",
};

function endpoint(over: Partial<MobileMaterialEndpoint> = {}) {
  return {
    url: "https://openrouter.ai/api/v1",
    model: "openai/gpt-6-luna",
    apiKey: "sk-or",
    label: "Luna",
    readsPdf: false,
    ...over,
  };
}

const reply = JSON.stringify({
  choices: [
    {
      message: {
        content:
          '```json\n{"analysis":{"title":"Notizen"},"proposals":[{"question":"q"}]}\n```',
      },
    },
  ],
});

describe("mobile material reading", () => {
  it("sends the shared request to the chat-completions URL with the key", async () => {
    const calls: Array<Parameters<VisionRequestFn>[0]> = [];
    const result = await readMaterialOnDevice({
      endpoints: [endpoint()],
      instructions: "RULES",
      attachments: [photo],
      request: async (args) => {
        calls.push(args);
        return reply;
      },
    });
    expect(result.reply).toEqual({
      analysis: { title: "Notizen" },
      proposals: [{ question: "q" }],
    });
    expect(calls[0].url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(calls[0].headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer sk-or",
    });
    const body = JSON.parse(calls[0].body);
    expect(body.messages[0]).toEqual({ role: "system", content: "RULES" });
    expect(body.messages[1].content[0]).toEqual({
      type: "image_url",
      image_url: { url: "data:image/jpeg;base64,AAAA" },
    });
    // OpenRouter: JSON mode.
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("tries the next model when one fails, and refuses a PDF without the file capability", async () => {
    const tried: string[] = [];
    const result = await readMaterialOnDevice({
      endpoints: [
        endpoint({ model: "first", label: "First" }),
        endpoint({ model: "second", label: "Second" }),
      ],
      instructions: "RULES",
      attachments: [photo],
      request: async ({ body }) => {
        const model = JSON.parse(body).model as string;
        tried.push(model);
        if (model === "first") throw new Error("vision request HTTP 429: busy");
        return reply;
      },
    });
    expect(tried).toEqual(["first", "second"]);
    expect(result.endpoint.label).toBe("Second");

    await expect(
      readMaterialOnDevice({
        endpoints: [endpoint()],
        instructions: "RULES",
        attachments: [
          { name: "a.pdf", kind: "pdf", mime: "application/pdf", base64: "J" },
        ],
        request: async () => reply,
      }),
    ).rejects.toThrow(/does not read PDFs itself/);
  });

  it("reads assistant text and names a provider error", () => {
    expect(extractChatCompletionsContent(reply)).toContain('"analysis"');
    expect(extractChatCompletionsContent("plain text")).toBe("plain text");
    expect(() =>
      extractChatCompletionsContent(
        JSON.stringify({ error: { message: "no credit" } }),
      ),
    ).toThrow(/no credit/);
    expect(visionRequestHeaders({})).toEqual({
      "Content-Type": "application/json",
    });
  });
});
