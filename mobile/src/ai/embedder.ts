/**
 * Embeddings on the device.
 *
 * The kernel stores vectors and ranks them (`token-embedding.ts`,
 * `search/hybrid.ts`); this file is the part that does HTTP, which is exactly
 * the split the desktop keeps between `src/kernel/` and `src/cli/llm/`.
 *
 * OpenRouter gained an OpenAI-shaped `/embeddings` endpoint that takes the
 * same key as chat, so semantic search costs the learner one paste and no
 * second account. There is no free embedding model, so batches are kept
 * small, run in the background, and never block a review.
 *
 * The desktop's `src/cli/llm/embedder.ts` cannot be imported: it reaches the
 * provider system through Node. What must not drift is the **canonical model
 * id** every vector is tagged with — a device that tags differently re-embeds
 * a shared library on the next search. That id lives in `connect.ts` and is
 * pinned by `tests/mobile/ai-connect.test.ts`.
 */

import type { ZamPairLlmEndpoint } from "../../../src/bridge/mobile-pairing.js";
import type { Database } from "../../../src/kernel/db/types.js";
import {
  computeContentHash,
  listTokensNeedingEmbedding,
  upsertTokenEmbedding,
} from "../../../src/kernel/models/token-embedding.js";
import { resolveMobileCloudChain } from "../model-registry.js";
import { CLOUD_EMBEDDING_MODEL_ID } from "./connect.js";

/** Tokens embedded per pass. Small on purpose: every vector costs money. */
export const EMBED_BATCH = 16;

export interface EmbedResult {
  embedded: number;
  /** Tokens still waiting after this pass. */
  remaining: number;
  error?: string;
}

interface EmbeddingsResponse {
  data?: Array<{ embedding?: number[] }>;
}

/**
 * Ask the endpoint for one vector per input, in order.
 *
 * Exported for the test suite, which injects `fetch`; the device path always
 * goes through `embedPendingTokens`.
 */
export async function requestEmbeddings(
  endpoint: ZamPairLlmEndpoint,
  inputs: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<number[][]> {
  const response = await fetchImpl(`${endpoint.url}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(endpoint.apiKey
        ? { Authorization: `Bearer ${endpoint.apiKey}` }
        : {}),
    },
    body: JSON.stringify({
      model: endpoint.model,
      input: inputs,
      encoding_format: "float",
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    // Surface the provider's body when present: OpenRouter uses 404 for "this
    // model is not an embedding model / not in the catalogue", which is the
    // only signal a learner (or a developer reading Settings) can act on.
    const detail = await response.text().catch(() => "");
    const snippet = detail.trim().slice(0, 180);
    throw new Error(
      snippet
        ? `embeddings request failed (HTTP ${response.status}): ${snippet}`
        : `embeddings request failed (HTTP ${response.status})`,
    );
  }

  const body = (await response.json()) as EmbeddingsResponse;
  const vectors = (body.data ?? []).map((entry) => entry.embedding);
  if (vectors.length !== inputs.length || vectors.some((v) => !v?.length)) {
    throw new Error(
      `embeddings response returned ${vectors.length} vectors for ${inputs.length} inputs`,
    );
  }
  return vectors as number[][];
}

/**
 * Embed one batch of tokens that need it, and report what is left.
 *
 * Returns quietly when no embedding model is configured: a learner without a
 * key still gets full-text search, and nagging them about a capability they
 * did not ask for is not an error worth showing.
 */
export async function embedPendingTokens(
  db: Database,
  options: {
    limit?: number;
    fetchImpl?: typeof fetch;
    resolve?: typeof resolveMobileCloudChain;
  } = {},
): Promise<EmbedResult> {
  const resolve = options.resolve ?? resolveMobileCloudChain;
  const endpoint = await resolve(db, "embedding");
  if (!endpoint) return { embedded: 0, remaining: 0 };

  const limit = options.limit ?? EMBED_BATCH;
  const pending = await listTokensNeedingEmbedding(
    db,
    CLOUD_EMBEDDING_MODEL_ID,
    { limit: limit + 1 },
  );
  if (pending.length === 0) return { embedded: 0, remaining: 0 };

  const batch = pending.slice(0, limit);
  // The kernel hands back the canonical text it also hashes against, so the
  // device never rebuilds that string itself — a second recipe here would
  // eventually disagree and mark every token stale.
  const inputs = batch.map((entry) => entry.text);

  let vectors: number[][];
  try {
    vectors = await requestEmbeddings(endpoint, inputs, options.fetchImpl);
  } catch (error) {
    return {
      embedded: 0,
      remaining: pending.length,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  for (const [index, entry] of batch.entries()) {
    await upsertTokenEmbedding(db, {
      tokenId: entry.token.id,
      embedding: vectors[index] as number[],
      model: CLOUD_EMBEDDING_MODEL_ID,
      contentHash: computeContentHash(inputs[index] as string),
    });
  }

  return {
    embedded: batch.length,
    remaining: Math.max(0, pending.length - batch.length),
  };
}

/**
 * Work through everything outstanding, a batch at a time.
 *
 * Stops on the first failure rather than retrying: the two reasons a batch
 * fails are no network and no credit, and neither improves by asking again
 * immediately. The next import or app start picks up where this left off,
 * because what is outstanding is derived from the database, not remembered.
 */
export async function embedInBackground(
  db: Database,
  options: { maxBatches?: number; fetchImpl?: typeof fetch } = {},
): Promise<EmbedResult> {
  const maxBatches = options.maxBatches ?? 8;
  let embedded = 0;
  let remaining = 0;
  for (let pass = 0; pass < maxBatches; pass++) {
    const result = await embedPendingTokens(db, {
      fetchImpl: options.fetchImpl,
    });
    embedded += result.embedded;
    remaining = result.remaining;
    if (result.error) return { embedded, remaining, error: result.error };
    if (remaining === 0) break;
  }
  // A non-zero `remaining` after the cap simply means the next pass continues;
  // an import of a whole chapter should not hold the app hostage in one go.
  return { embedded, remaining };
}
