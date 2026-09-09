/**
 * Join an embedding endpoint's base URL with the `/embeddings` path exactly
 * once.
 *
 * The stored convention is a base URL (`https://openrouter.ai/api/v1`), and
 * both embedders append `/embeddings` to it. But a base URL is not what a
 * learner can configure against OpenRouter: its chat `/models` catalogue
 * omits every embedding model, so `resolveUsableEmbeddingEndpoint` and
 * `validateModelSave` both reject the row as a model the endpoint does not
 * offer. Pointing the row at `https://openrouter.ai/api/v1/embeddings`
 * fixes that — OpenRouter publishes the embedding catalogue at
 * `/api/v1/embeddings/models` — and then a blind append produced
 * `/embeddings/embeddings`, a 404.
 *
 * So both spellings are accepted: the configured URL may be the provider
 * base or the embeddings endpoint itself.
 */
export function embeddingsEndpointUrl(url: string): string {
  return `${url.replace(/\/+$/, "").replace(/\/embeddings$/i, "")}/embeddings`;
}
