/**
 * Embedding generation — CLI/harness layer (ADR 2026-07-03).
 *
 * Talks to an OpenAI-compatible `/v1/embeddings` endpoint (Ollama, FastFlowLM
 * server mode, …) via the `embedding` role in the provider system
 * (client.ts). Lives here — NOT in the kernel — for the same reason the rest
 * of `src/cli/llm/` does: the kernel is AI-agnostic and carries zero LLM
 * dependencies. The kernel only stores vectors and derives staleness
 * (`src/kernel/models/token-embedding.ts`); everything that does HTTP belongs
 * here.
 */

import type { Database } from "../../kernel/index.js";
import {
  computeContentHash,
  embeddingContentForToken,
  embeddingTextForQuery,
  getEmbeddingCoverage,
  getSetting,
  listTokensNeedingEmbedding,
  searchTokensHybrid,
  upsertTokenEmbedding,
} from "../../kernel/index.js";
import {
  DEFAULT_LLM_API_KEY,
  getAvailableModels,
  getProviderForRole,
  isLlmOnline,
  type ProviderConfig,
} from "./client.js";

/** Single source of truth for the default embedding model (see canonicalEmbeddingModelId). */
export const DEFAULT_EMBEDDING_MODEL = "embeddinggemma";

/** Canonical model id every stored vector and kernel call uses. */
const CANONICAL_EMBEDDING_MODEL_ID = "embeddinggemma-300m";

/**
 * Different runtimes serve the same EmbeddingGemma weights under different
 * wire tags (Ollama `embeddinggemma`, FastFlowLM `embed-gemma` /
 * `embed-gemma:300m`, Hugging Face `google/embeddinggemma-300m`). Every
 * stored vector and kernel call must use one canonical id so a Turso-synced
 * DB does not re-embed everything whenever a differently-tagged machine runs
 * a search. The configured raw model name is still used on the wire (the
 * HTTP request body) — only the DB-facing id is canonicalized. Unknown ids
 * pass through lowercased, unchanged.
 */
const EMBEDDINGGEMMA_ALIASES = new Set([
  "embeddinggemma",
  "embeddinggemma:300m",
  "embeddinggemma-300m",
  "embed-gemma",
  "embed-gemma:300m",
  "google/embeddinggemma-300m",
]);

export function canonicalEmbeddingModelId(model: string): string {
  const lowered = model.trim().toLowerCase();
  if (EMBEDDINGGEMMA_ALIASES.has(lowered)) {
    return CANONICAL_EMBEDDING_MODEL_ID;
  }
  return lowered;
}

/**
 * Resolve a usable embedding endpoint, or null when unavailable — never
 * throws. Semantic search is a pure capability add: the caller always has a
 * lexical fallback, so any failure here must degrade quietly instead of
 * raising. Does NOT auto-start a local runner (consistent with the
 * no-autostart rule for the embedding role — FastFlowLM's embedding server
 * mode in particular must be started manually alongside an LLM).
 */
export async function resolveUsableEmbeddingEndpoint(
  db: Database,
): Promise<ProviderConfig | null> {
  const cfg = await getProviderForRole(db, "embedding");
  if (!cfg.enabled) return null;

  for (const endpoint of [cfg, ...(cfg.fallback ? [cfg.fallback] : [])]) {
    if (endpoint.apiFlavor !== "chat-completions") continue;
    const online = await isLlmOnline(endpoint.url);
    if (!online) continue;

    const availableModels = await getAvailableModels(
      endpoint.url,
      endpoint.apiKey,
    );
    const modelAvailable =
      availableModels.length === 0 ||
      availableModels.some(
        (candidate) => candidate.toLowerCase() === endpoint.model.toLowerCase(),
      );
    if (modelAvailable) return endpoint;
  }

  return null;
}

interface EmbeddingsResponseItem {
  embedding?: unknown;
  index?: unknown;
}

interface EmbeddingsResponse {
  data?: EmbeddingsResponseItem[];
}

/** POST `${url}/embeddings` for a batch of texts; returns vectors in input order. */
export async function embedTexts(
  endpoint: { url: string; model: string; apiKey: string },
  texts: string[],
): Promise<number[][]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(`${endpoint.url}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${endpoint.apiKey || DEFAULT_LLM_API_KEY}`,
      },
      body: JSON.stringify({ model: endpoint.model, input: texts }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Embedding request failed: ${res.statusText} (${res.status}) - ${body}`,
    );
  }

  const data = (await res.json()) as EmbeddingsResponse;
  const items = data.data ?? [];
  if (items.length !== texts.length) {
    throw new Error(
      `Embedding response returned ${items.length} vectors for ${texts.length} inputs`,
    );
  }

  const ordered: number[][] = new Array(texts.length);
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const index = typeof item.index === "number" ? item.index : i;
    if (!Number.isInteger(index)) {
      throw new Error("Embedding response item is missing a valid index");
    }
    if (index < 0 || index >= texts.length) {
      throw new Error(`Embedding response index out of range: ${index}`);
    }
    if (
      !Array.isArray(item.embedding) ||
      item.embedding.length === 0 ||
      !item.embedding.every((n) => typeof n === "number" && Number.isFinite(n))
    ) {
      throw new Error(
        `Embedding response at index ${index} is not a non-empty array of finite numbers`,
      );
    }
    ordered[index] = item.embedding as number[];
  }

  const firstLength = ordered[0]?.length;
  if (ordered.some((vec) => vec === undefined || vec.length !== firstLength)) {
    throw new Error("Embedding response vectors have inconsistent lengths");
  }

  return ordered;
}

/** How many texts to send per embedding request during a backfill pass. */
const EMBED_BATCH_SIZE = 16;

export interface EnsureTokenEmbeddingsResult {
  status: "ok" | "unavailable";
  embedded: number;
  remaining: number;
  reason?: string;
}

/**
 * Lazily top up embeddings for tokens that are missing, stale, or embedded
 * under a different model. Bounded by `opts.limit` (default 64) so a search
 * or dedup check never blocks on embedding the entire token base; `zam token
 * reembed` calls this in a loop with a much larger cap to backfill
 * exhaustively.
 */
export async function ensureTokenEmbeddings(
  db: Database,
  opts?: { limit?: number; force?: boolean; dims?: number },
): Promise<EnsureTokenEmbeddingsResult> {
  const endpoint = await resolveUsableEmbeddingEndpoint(db);
  if (!endpoint) {
    const reason = await describeUnavailableReason(db);
    return { status: "unavailable", embedded: 0, remaining: 0, reason };
  }

  const model = canonicalEmbeddingModelId(endpoint.model);
  const pending = await listTokensNeedingEmbedding(db, model, {
    limit: opts?.limit ?? 64,
    force: opts?.force,
    dims: opts?.dims,
  });

  // The upfront endpoint check cannot rule out mid-flight failures (server
  // dies between health check and embed call, model 404s at embed time).
  // Those must degrade like any other unavailability — with the partial
  // progress kept — instead of throwing into a search path.
  let embedded = 0;
  let failure: string | undefined;
  try {
    for (let i = 0; i < pending.length; i += EMBED_BATCH_SIZE) {
      const batch = pending.slice(i, i + EMBED_BATCH_SIZE);
      const vectors = await embedTexts(
        { url: endpoint.url, model: endpoint.model, apiKey: endpoint.apiKey },
        batch.map((item) => item.text),
      );
      for (const [index, item] of batch.entries()) {
        await upsertTokenEmbedding(db, {
          tokenId: item.token.id,
          embedding: vectors[index],
          model,
          contentHash: computeContentHash(item.text),
        });
        embedded++;
      }
    }
  } catch (err) {
    failure = err instanceof Error ? err.message : String(err);
  }

  const coverage = await getEmbeddingCoverage(db, model, { dims: opts?.dims });
  const remaining = coverage.missing + coverage.stale;
  if (failure !== undefined) {
    return { status: "unavailable", embedded, remaining, reason: failure };
  }
  return { status: "ok", embedded, remaining };
}

async function describeUnavailableReason(db: Database): Promise<string> {
  const cfg = await getProviderForRole(db, "embedding");
  if (!cfg.enabled) {
    return "embedding role is disabled in settings (llm.enabled)";
  }
  const endpoints = [cfg, ...(cfg.fallback ? [cfg.fallback] : [])];
  const online = await Promise.all(
    endpoints.map((endpoint) => isLlmOnline(endpoint.url)),
  );
  if (!online.some(Boolean)) {
    return `embedding endpoints offline (${endpoints.map((endpoint) => endpoint.url).join(", ")})`;
  }
  return `no configured embedding model is available (${endpoints.map((endpoint) => endpoint.model).join(", ")})`;
}

export interface EmbedQueryResult {
  vector: number[];
  model: string;
}

/**
 * Embed a single query string. Returns null when the embedder is unavailable
 * OR on any network error — semantic search must never break search; callers
 * fall back to lexical-only results.
 */
export async function embedQuery(
  db: Database,
  text: string,
): Promise<EmbedQueryResult | null> {
  const endpoint = await resolveUsableEmbeddingEndpoint(db);
  if (!endpoint) return null;

  try {
    const [vector] = await embedTexts(
      { url: endpoint.url, model: endpoint.model, apiKey: endpoint.apiKey },
      [embeddingTextForQuery(text)],
    );
    return { vector, model: canonicalEmbeddingModelId(endpoint.model) };
  } catch {
    return null;
  }
}

/**
 * Identify existing tokens whose concepts/questions/domains are highly similar
 * to a new candidate token. Returns an empty array when the embedder is unavailable.
 */
export async function findPossibleDuplicates(
  db: Database,
  candidate: { concept: string; question?: string | null; domain?: string },
  embed: typeof embedQuery = embedQuery,
): Promise<Array<{ slug: string; concept: string; similarity: number }>> {
  const queryText = embeddingContentForToken({
    concept: candidate.concept,
    question: candidate.question ?? null,
    domain: candidate.domain ?? "",
  });

  const q = await embed(db, queryText);
  if (!q) {
    return [];
  }

  // Registration-time dedup must cover an upgraded or previously-offline DB,
  // not just the subset that already happened to have vectors. This exhaustive
  // pass is normally a no-op after the first successful semantic operation.
  await ensureTokenEmbeddings(db, {
    limit: Number.MAX_SAFE_INTEGER,
    dims: q.vector.length,
  });

  const thresholdStr = await getSetting(db, "search.dedup_threshold");
  const parsed = thresholdStr ? Number.parseFloat(thresholdStr) : Number.NaN;
  // A malformed setting must not silently disable (NaN compares false) or
  // flood (negative) the dedup warnings — fall back to the default.
  const threshold =
    Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 0.85;

  const hits = await searchTokensHybrid(db, queryText, {
    queryEmbedding: q.vector,
    model: q.model,
    limit: 1000,
    vectorTopK: 1000,
  });

  const results: Array<{ slug: string; concept: string; similarity: number }> =
    [];
  for (const hit of hits) {
    if (hit.similarity !== null && hit.similarity >= threshold) {
      results.push({
        slug: hit.slug,
        concept: hit.concept,
        similarity: hit.similarity,
      });
    }
  }

  return results;
}
