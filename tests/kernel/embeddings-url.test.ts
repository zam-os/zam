import { describe, expect, it } from "vitest";

import { embeddingsEndpointUrl } from "../../src/kernel/util/embeddings-url.js";

// A configured endpoint URL may be the provider base or the embeddings
// endpoint itself, so the join has to be idempotent: appending blindly to the
// longer spelling asks for `/embeddings/embeddings` and gets a 404.
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
