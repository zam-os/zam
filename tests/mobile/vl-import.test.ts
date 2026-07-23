import { describe, expect, it, vi } from "vitest";
import type { MobileVisionEndpoint } from "../../mobile/src/vision-config.js";
import {
  buildVlChatCompletionsBody,
  chatCompletionsUrl,
  decomposeImageViaVision,
  extractChatCompletionsContent,
  parseVlDecomposeResponse,
  visionRequestHeaders,
} from "../../mobile/src/vl-import.js";

const endpoint: MobileVisionEndpoint = {
  enabled: true,
  url: "https://api.openai.com/v1",
  model: "gpt-4o",
  apiKey: "sk-test",
  apiFlavor: "chat-completions",
  label: "gpt-4o",
};

describe("vl-import request shaping", () => {
  it("builds a chat-completions multimodal body", () => {
    const body = buildVlChatCompletionsBody(
      endpoint,
      "data:image/jpeg;base64,abc",
      "de",
    );
    expect(body.model).toBe("gpt-4o");
    expect(body.messages[0]?.role).toBe("system");
    const user = body.messages[1];
    expect(user?.role).toBe("user");
    expect(Array.isArray(user?.content)).toBe(true);
    const parts = user?.content as Array<{ type: string }>;
    expect(parts.some((p) => p.type === "text")).toBe(true);
    expect(parts.some((p) => p.type === "image_url")).toBe(true);
  });

  it("normalizes the completions URL and auth header", () => {
    expect(chatCompletionsUrl("https://api.openai.com/v1/")).toBe(
      "https://api.openai.com/v1/chat/completions",
    );
    expect(
      chatCompletionsUrl("https://api.openai.com/v1/chat/completions"),
    ).toBe("https://api.openai.com/v1/chat/completions");
    expect(visionRequestHeaders(endpoint)).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer sk-test",
    });
  });
});

describe("vl-import response parsing", () => {
  it("parses a fenced JSON array into image-vl drafts with provider stamp", () => {
    const content = `\`\`\`json
[
  {
    "slug": "newton-two",
    "title": "Newton II",
    "concept": "F = m a",
    "domain": "physik",
    "bloomLevel": 2,
    "question": "Wie lautet Newton II?"
  },
  {
    "slug": "inertia",
    "concept": "Trägheit",
    "domain": "physik",
    "bloom_level": 1
  }
]
\`\`\``;

    const drafts = parseVlDecomposeResponse(content, "vision:gpt-4o");
    expect(drafts).toHaveLength(2);
    expect(drafts[0]).toMatchObject({
      origin: "image-vl",
      slug: "newton-two",
      provider: "vision:gpt-4o",
      question: "Wie lautet Newton II?",
    });
    expect(drafts[1]).toMatchObject({
      origin: "image-vl",
      slug: "inertia",
      bloomLevel: 1,
    });
  });

  it("tolerates a single object and skips invalid entries", () => {
    const drafts = parseVlDecomposeResponse(
      JSON.stringify({
        slug: "only-one",
        concept: "One concept",
        domain: "test",
        bloomLevel: 1,
      }),
      "vision:gpt-4o",
    );
    expect(drafts).toHaveLength(1);

    expect(() =>
      parseVlDecomposeResponse(
        JSON.stringify([{ domain: "missing-slug-and-concept" }]),
        "vision:gpt-4o",
      ),
    ).toThrow(/no usable learning tokens/i);
  });

  it("extracts content and surfaces multimodal-model hints", () => {
    expect(
      extractChatCompletionsContent(
        JSON.stringify({
          choices: [{ message: { content: '[{"slug":"a","concept":"b"}]' } }],
        }),
      ),
    ).toBe('[{"slug":"a","concept":"b"}]');

    expect(() =>
      extractChatCompletionsContent(
        JSON.stringify({
          error: { message: "this model does not support image input" },
        }),
      ),
    ).toThrow(/multimodal model/i);
  });
});

describe("decomposeImageViaVision", () => {
  it("end-to-end builds, requests, and normalizes drafts", async () => {
    const request = vi.fn(async () =>
      JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  slug: "ws-1",
                  concept: "Arbeitsblatt Begriff",
                  domain: "mathe",
                  bloomLevel: 2,
                  question: "Was ist das?",
                },
              ]),
            },
          },
        ],
      }),
    );

    const drafts = await decomposeImageViaVision({
      endpoint,
      imageDataUrl: "data:image/jpeg;base64,xx",
      locale: "de",
      request,
    });

    expect(request).toHaveBeenCalledOnce();
    const args = request.mock.calls[0]?.[0];
    expect(args?.url).toContain("/chat/completions");
    expect(args?.headers.Authorization).toBe("Bearer sk-test");
    expect(drafts[0]).toMatchObject({
      origin: "image-vl",
      slug: "ws-1",
      provider: "vision:gpt-4o",
    });
  });
});
