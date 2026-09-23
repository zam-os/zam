import { describe, expect, it } from "vitest";

import {
  endpointUrl,
  mapEndpointPath,
} from "../../src/kernel/util/endpoint-url.js";

// Issue #363: every route used to be `${base}/route`, which puts the route
// inside the query value of an Azure-style `…/v1?api-version=…` base.
describe("endpointUrl", () => {
  it("appends the route to a plain base URL", () => {
    expect(endpointUrl("http://localhost:11434/v1", "models")).toBe(
      "http://localhost:11434/v1/models",
    );
    expect(endpointUrl("https://openrouter.ai/api/v1/", "chat/completions")).toBe(
      "https://openrouter.ai/api/v1/chat/completions",
    );
    expect(endpointUrl("http://localhost:8080", "/models")).toBe(
      "http://localhost:8080/models",
    );
  });

  it("keeps the base's query and puts the route in the path", () => {
    expect(
      endpointUrl(
        "https://x.azure.com/openai/v1?api-version=2025",
        "chat/completions",
      ),
    ).toBe("https://x.azure.com/openai/v1/chat/completions?api-version=2025");
  });

  it("encodes query parameters and merges them into the base's query", () => {
    expect(
      endpointUrl("https://openrouter.ai/api/v1", "models", {
        output_modalities: "speech",
      }),
    ).toBe("https://openrouter.ai/api/v1/models?output_modalities=speech");
    expect(
      endpointUrl("https://openrouter.ai/api/v1", "models", {
        filter: "a b&c=d",
      }),
    ).toBe("https://openrouter.ai/api/v1/models?filter=a+b%26c%3Dd");
    expect(
      endpointUrl("https://x.azure.com/openai/v1?api-version=2025", "models", {
        output_modalities: "transcription",
      }),
    ).toBe(
      "https://x.azure.com/openai/v1/models?api-version=2025&output_modalities=transcription",
    );
  });

  it("falls back to plain concatenation for a base that is not an http(s) URL", () => {
    // Unparseable, and scheme-less: `localhost:11434/v1` parses as a
    // `localhost:` URL whose opaque path would silently drop the route.
    expect(
      endpointUrl("not a url", "models", { output_modalities: "speech" }),
    ).toBe("not a url/models?output_modalities=speech");
    expect(endpointUrl("localhost:11434/v1", "models")).toBe(
      "localhost:11434/v1/models",
    );
  });

  it("still puts the route in the path when a fallback base carries a query", () => {
    expect(
      endpointUrl("localhost:11434/v1?api-version=x", "models", {
        output_modalities: "speech",
      }),
    ).toBe("localhost:11434/v1/models?api-version=x&output_modalities=speech");
  });
});

describe("mapEndpointPath", () => {
  it("rewrites the path only", () => {
    // The Anthropic vision route: a base with or without `/v1` reaches
    // `/v1/messages` once.
    const messages = (base: string) =>
      mapEndpointPath(base, (path) => `${path.replace(/\/v1$/, "")}/v1/messages`);
    expect(messages("https://api.anthropic.com")).toBe(
      "https://api.anthropic.com/v1/messages",
    );
    expect(messages("https://api.anthropic.com/v1/")).toBe(
      "https://api.anthropic.com/v1/messages",
    );
    expect(messages("https://proxy.example/v1?tenant=a")).toBe(
      "https://proxy.example/v1/messages?tenant=a",
    );
  });

  it("strips a /v1 the query used to hide (Ollama's native chat route)", () => {
    const ollamaChat = (base: string) =>
      mapEndpointPath(base, (path) => `${path.replace(/\/v1$/, "")}/api/chat`);
    expect(ollamaChat("http://localhost:11434/v1")).toBe(
      "http://localhost:11434/api/chat",
    );
    expect(ollamaChat("http://host:11434/v1?x=1")).toBe(
      "http://host:11434/api/chat?x=1",
    );
  });
});
