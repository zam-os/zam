/**
 * Hybrid lexical/vector token search using reciprocal-rank fusion (RRF).
 * (ADR 2026-07-03)
 *
 * This module is pure math + database queries — zero LLM dependencies, no HTTP.
 */

import type { Database } from "../db/types.js";
import { findTokens, type Token } from "../models/token.js";
import { listEmbeddedTokens } from "../models/token-embedding.js";

export interface HybridSearchOptions {
  queryEmbedding?: ArrayLike<number>;
  /** Model the stored vectors must match; required when queryEmbedding is set. */
  model?: string;
  limit?: number; // default 20
  rrfK?: number; // default 60
  vectorTopK?: number; // default 10 — how many vector hits enter the fusion
}

export interface HybridScoredToken extends Token {
  score: number; // fused RRF score
  lexicalRank: number | null; // 1-based, null if not a lexical hit
  vectorRank: number | null; // 1-based, null if not a vector hit
  similarity: number | null; // cosine, null if not a vector hit
}

/** Calculates the cosine similarity between two float vectors. Returns 0 if either norm is 0. */
export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = a.length;
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Performs a hybrid search over active tokens.
 * Combines lexical relevance rankings with vector cosine similarities.
 */
export async function searchTokensHybrid(
  db: Database,
  query: string,
  opts?: HybridSearchOptions,
): Promise<HybridScoredToken[]> {
  const limit = opts?.limit ?? 20;
  const rrfK = opts?.rrfK ?? 60;
  const vectorTopK = opts?.vectorTopK ?? 10;

  // 1. Lexical leg
  const lexicalHits = await findTokens(db, query);

  // 2. Vector leg (only when queryEmbedding + model given)
  let vectorHits: Array<{ token: Token; similarity: number }> = [];
  if (opts?.queryEmbedding && opts?.model) {
    const queryVec = Float32Array.from(opts.queryEmbedding);
    const embedded = await listEmbeddedTokens(db, opts.model);

    const candidates: Array<{ token: Token; similarity: number }> = [];
    for (const row of embedded) {
      if (row.embedding.length !== queryVec.length) {
        continue;
      }
      const similarity = cosineSimilarity(queryVec, row.embedding);
      if (similarity <= 0) {
        continue;
      }
      candidates.push({ token: row.token, similarity });
    }

    // Sort descending by similarity
    candidates.sort((a, b) => b.similarity - a.similarity);
    vectorHits = candidates.slice(0, vectorTopK);
  }

  // 3. Fusion
  const tokenMap = new Map<string, HybridScoredToken>();

  const getOrCreateEntry = (token: Token): HybridScoredToken => {
    let entry = tokenMap.get(token.id);
    if (!entry) {
      entry = {
        ...token,
        score: 0,
        lexicalRank: null,
        vectorRank: null,
        similarity: null,
      };
      tokenMap.set(token.id, entry);
    }
    return entry;
  };

  // Process lexical ranks
  for (let i = 0; i < lexicalHits.length; i++) {
    const hit = lexicalHits[i];
    const entry = getOrCreateEntry(hit);
    entry.lexicalRank = i + 1;
    entry.score += 1 / (rrfK + entry.lexicalRank);
  }

  // Process vector ranks
  for (let j = 0; j < vectorHits.length; j++) {
    const hit = vectorHits[j];
    const entry = getOrCreateEntry(hit.token);
    entry.vectorRank = j + 1;
    entry.similarity = hit.similarity;
    entry.score += 1 / (rrfK + entry.vectorRank);
  }

  const results = Array.from(tokenMap.values());

  // 4. Sort by score desc, tie-break by slug asc
  results.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 1e-9) {
      return b.score - a.score;
    }
    return a.slug.localeCompare(b.slug);
  });

  return results.slice(0, limit);
}
