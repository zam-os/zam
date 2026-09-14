/**
 * Join an embedding endpoint's URL with the `/embeddings` path exactly once.
 *
 * A stored endpoint URL may be either the provider base
 * (`https://api.openai.com/v1`) or the embeddings endpoint itself
 * (`https://openrouter.ai/api/v1/embeddings`). Both spellings occur because
 * some providers list their embedding models at `{base}/embeddings/models`
 * rather than at `{base}/models`, so only the longer URL lets a caller
 * discover the model it is configured for.
 */
export function embeddingsEndpointUrl(url: string): string {
  return `${url.replace(/\/+$/, "").replace(/\/embeddings$/i, "")}/embeddings`;
}
