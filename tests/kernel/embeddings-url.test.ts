import { describe, expect, it } from "vitest";

import { embeddingsEndpointUrl } from "../../src/kernel/util/embeddings-url.js";

// OpenRouter omits every embedding model from its chat `/models` catalogue and
// publishes them at `/api/v1/embeddings/models` instead, so a row configured
// against OpenRouter must point at the embeddings endpoint to survive
// capability validation. A blind append then asked for
// `/embeddings/embeddings` and got a 404 (2026-09-09).
describe("embeddingsEndpointUrl", () => {
  it("appends the path to a provider base URL", () => {
    expect(embeddingsEndpointUrl("https://openrouter.ai/api/v1")).toBe(
      "https://openrouter.ai/api/v1/embeddings",
    );
  });

  it("does not double the path when the URL is already the endpoint", () => {
    expect(
      embeddingsEndpointUrl("https://openrouter.ai/api/v1/embeddings"),
    ).toBe("https://openrouter.ai/api/v1/embeddings");
  });

  it("tolerates a trailing slash on either spelling", () => {
    expect(embeddingsEndpointUrl("https://api.openai.com/v1/")).toBe(
      "https://api.openai.com/v1/embeddings",
    );
    expect(
      embeddingsEndpointUrl("https://openrouter.ai/api/v1/embeddings/"),
    ).toBe("https://openrouter.ai/api/v1/embeddings");
  });

  it("keeps a local runner's base URL intact", () => {
    expect(embeddingsEndpointUrl("http://localhost:11434/v1")).toBe(
      "http://localhost:11434/v1/embeddings",
    );
  });
});
