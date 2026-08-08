/**
 * Token embedding repository — stores per-token vectors for semantic search
 * (ADR 2026-07-03) and derives staleness from a content hash.
 *
 * This module is pure storage + classification: no HTTP, no LLM calls. The
 * CLI layer (`src/cli/llm/embedder.ts`) generates vectors and calls in here.
 */

import type { Database } from "../db/types.js";
import { sha256Hex } from "../util/sha256.js";
import type { Token } from "./token.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TokenEmbedding {
  token_id: string;
  model: string;
  dims: number;
  content_hash: string;
  embedded_at: string;
  embedding: Float32Array;
}

export type EmbeddingStaleness =
  | "missing"
  | "content-changed"
  | "model-changed"
  | "dimension-changed";

export interface TokenNeedingEmbedding {
  token: Token;
  /** Canonical text to embed — already hashed the same way. */
  text: string;
  reason: EmbeddingStaleness;
}

export interface EmbeddingCoverage {
  tokens: number;
  embedded: number;
  missing: number;
  stale: number;
}

export interface EmbeddedTokenRow {
  token: Token;
  embedding: Float32Array;
}

// ── Canonical text + hashing ─────────────────────────────────────────────────

/**
 * The canonical text embedded for a token. Every stored hash and every stored
 * vector derives from exactly this string — never the slug, which is an
 * identifier, not meaning.
 */
export function embeddingContentForToken(
  t: Pick<Token, "concept" | "question" | "domain"> & { title?: string | null },
): string {
  return `${t.concept}\n${t.question ?? ""}\n${t.domain}\n${t.title ?? ""}`;
}

export function computeContentHash(text: string): string {
  return sha256Hex(text);
}

// ── BLOB encode/decode ───────────────────────────────────────────────────────

/**
 * Encode a vector as a little-endian float32 BLOB. Builds a fresh buffer (no
 * aliasing into the caller's array) so the row can be stored independently of
 * whatever produced the vector.
 */
export function encodeEmbedding(vec: ArrayLike<number>): Uint8Array {
  const f = Float32Array.from(vec);
  return new Uint8Array(f.buffer);
}

/**
 * Decode a stored BLOB back into a Float32Array.
 *
 * BLOB values come back as `Buffer` (better-sqlite3) or `Uint8Array` (remote
 * provider). better-sqlite3 Buffers are views into a shared pool and may have
 * a non-zero, non-4-aligned `byteOffset` — constructing a Float32Array
 * directly over such a buffer throws (RangeError) or silently reads garbage.
 * Copying guarantees a fresh, 0-offset backing buffer — but `blob.slice()`
 * cannot be used for this: `Buffer.prototype.slice` overrides
 * `Uint8Array.prototype.slice` to return a *view* into the same backing
 * buffer (a legacy Node.js Buffer API quirk), not a copy, so it would still
 * carry the misaligned offset. Uint8Array's own `slice` must be borrowed
 * explicitly to force an actual copy.
 */
export function decodeEmbedding(blob: Uint8Array): Float32Array {
  if (blob.byteLength % 4 !== 0) {
    throw new Error(
      "Invalid embedding blob size: must be a multiple of 4 bytes",
    );
  }
  if (blob.byteOffset % 4 === 0) {
    return new Float32Array(blob.buffer, blob.byteOffset, blob.byteLength / 4);
  }
  // better-sqlite3 Buffers are pool-backed and may be unaligned — copy.
  const copy = Uint8Array.prototype.slice.call(blob) as Uint8Array;
  return new Float32Array(copy.buffer, 0, copy.byteLength / 4);
}

// ── Repository functions ─────────────────────────────────────────────────────

interface TokenEmbeddingRow {
  token_id: string;
  embedding: Uint8Array;
  model: string;
  dims: number;
  content_hash: string;
  embedded_at: string;
}

function decodeRow(row: TokenEmbeddingRow): TokenEmbedding {
  return {
    token_id: row.token_id,
    model: row.model,
    dims: row.dims,
    content_hash: row.content_hash,
    embedded_at: row.embedded_at,
    embedding: decodeEmbedding(row.embedding),
  };
}

export async function upsertTokenEmbedding(
  db: Database,
  input: {
    tokenId: string;
    embedding: ArrayLike<number>;
    model: string;
    contentHash: string;
  },
): Promise<void> {
  const encoded = encodeEmbedding(input.embedding);
  const dims = input.embedding.length;
  const embeddedAt = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO token_embeddings (token_id, embedding, model, dims, content_hash, embedded_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(token_id) DO UPDATE SET
        embedding = excluded.embedding,
        model = excluded.model,
        dims = excluded.dims,
        content_hash = excluded.content_hash,
        embedded_at = excluded.embedded_at
    `)
    .run(
      input.tokenId,
      encoded,
      input.model,
      dims,
      input.contentHash,
      embeddedAt,
    );
}

export async function getTokenEmbedding(
  db: Database,
  tokenId: string,
): Promise<TokenEmbedding | undefined> {
  const row = (await db
    .prepare("SELECT * FROM token_embeddings WHERE token_id = ?")
    .get(tokenId)) as TokenEmbeddingRow | undefined;
  return row ? decodeRow(row) : undefined;
}

interface TokenWithEmbeddingMeta extends Token {
  emb_model: string | null;
  emb_dims: number | null;
  emb_hash: string | null;
}

/**
 * Classify every non-deprecated token against a target embedding model:
 * missing (no stored row), model-changed (stored under a different model
 * id), or content-changed (stored hash no longer matches the canonical
 * text). `force: true` returns every token regardless of freshness, tagged
 * `content-changed` since that is the closest-fitting reason to re-embed.
 */
export async function listTokensNeedingEmbedding(
  db: Database,
  model: string,
  opts?: { limit?: number; force?: boolean; dims?: number },
): Promise<TokenNeedingEmbedding[]> {
  const rows = (await db
    .prepare(`
      SELECT t.*, e.model AS emb_model, e.dims AS emb_dims, e.content_hash AS emb_hash
      FROM tokens t
      LEFT JOIN token_embeddings e ON e.token_id = t.id
      WHERE t.deprecated_at IS NULL
    `)
    .all()) as TokenWithEmbeddingMeta[];

  const needing: TokenNeedingEmbedding[] = [];
  for (const row of rows) {
    let reason: EmbeddingStaleness | null = null;
    let text = "";

    if (opts?.force) {
      reason = "content-changed";
    } else if (row.emb_model === null) {
      reason = "missing";
    } else if (row.emb_model !== model) {
      reason = "model-changed";
    } else if (opts?.dims !== undefined && row.emb_dims !== opts.dims) {
      reason = "dimension-changed";
    } else {
      const computedText = embeddingContentForToken(row);
      const hash = computeContentHash(computedText);
      if (row.emb_hash !== hash) {
        reason = "content-changed";
        text = computedText;
      }
    }

    if (reason) {
      if (!text) {
        text = embeddingContentForToken(row);
      }
      needing.push({ token: row as Token, text, reason });
    }
  }

  if (opts?.limit !== undefined) {
    return needing.slice(0, opts.limit);
  }
  return needing;
}

/** Same classification scan as {@link listTokensNeedingEmbedding}, counts only. */
export async function getEmbeddingCoverage(
  db: Database,
  model: string,
  opts?: { dims?: number },
): Promise<EmbeddingCoverage> {
  const rows = (await db
    .prepare(`
      SELECT t.*, e.model AS emb_model, e.dims AS emb_dims, e.content_hash AS emb_hash
      FROM tokens t
      LEFT JOIN token_embeddings e ON e.token_id = t.id
      WHERE t.deprecated_at IS NULL
    `)
    .all()) as TokenWithEmbeddingMeta[];

  let missing = 0;
  let stale = 0;
  for (const row of rows) {
    if (row.emb_model === null) {
      missing++;
      continue;
    }
    if (row.emb_model !== model) {
      stale++;
      continue;
    }
    if (opts?.dims !== undefined && row.emb_dims !== opts.dims) {
      stale++;
      continue;
    }
    const hash = computeContentHash(embeddingContentForToken(row));
    if (row.emb_hash !== hash) {
      stale++;
    }
  }

  const tokens = rows.length;
  return {
    tokens,
    embedded: tokens - missing - stale,
    missing,
    stale,
  };
}

/**
 * All tokens with a fresh vector under `model` to enter the vector search leg.
 * Re-hashes rows here because lazy top-up is intentionally bounded: a stale
 * row beyond the current batch must never participate with its old meaning.
 */
export async function listEmbeddedTokens(
  db: Database,
  model: string,
): Promise<EmbeddedTokenRow[]> {
  const rows = (await db
    .prepare(`
      SELECT t.*, e.embedding AS embedding, e.content_hash AS emb_hash
      FROM token_embeddings e
      JOIN tokens t ON t.id = e.token_id
      WHERE e.model = ? AND t.deprecated_at IS NULL
    `)
    .all(model)) as Array<Token & { embedding: Uint8Array; emb_hash: string }>;

  return rows.flatMap((row) => {
    const { embedding, emb_hash, ...token } = row;
    if (emb_hash !== computeContentHash(embeddingContentForToken(token))) {
      return [];
    }
    try {
      return [{ token: token as Token, embedding: decodeEmbedding(embedding) }];
    } catch (err) {
      console.warn(
        `Warning: Corrupted embedding for token ${token.slug} (${token.id}) ignored: ${
          (err as Error).message
        }`,
      );
      return [];
    }
  });
}
