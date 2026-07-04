/**
 * Foundation suggestions for tokens.
 * Suggests existing tokens that are semantically related as prerequisite candidates.
 *
 * This module is pure math + database queries — zero LLM dependencies, no HTTP.
 */

import type { Database } from "../db/types.js";
import { getPrerequisites, wouldCreateCycle } from "../models/prerequisite.js";
import type { BloomLevel, Token } from "../models/token.js";
import { listEmbeddedTokens } from "../models/token-embedding.js";
import { cosineSimilarity } from "./hybrid.js";

export interface FoundationSuggestion {
  token: Token;
  similarity: number;
  alreadyPrerequisite: boolean;
  wouldCreateCycle: boolean;
  /** Candidate's bloom_level is higher than the target's — unusual for a foundation. */
  bloomAboveTarget: boolean;
}

export interface SuggestFoundationsOptions {
  queryEmbedding: ArrayLike<number>;
  /** Canonical embedding model id the stored vectors must match. */
  model: string;
  /** Set when the target token already exists (register-after / rating-1 flow). */
  targetTokenId?: string;
  /** Used for the bloomAboveTarget flag; defaults to 5 (nothing flagged). */
  targetBloomLevel?: BloomLevel;
  limit?: number; // default 5
  minSimilarity?: number; // default 0.45
  maxSimilarity?: number; // default 0.85 (exclusive upper bound)
}

/**
 * Suggests existing tokens that are semantically related as prerequisite candidates.
 * Filters by similarity range and ranks descending by similarity.
 */
export async function suggestFoundations(
  db: Database,
  opts: SuggestFoundationsOptions,
): Promise<FoundationSuggestion[]> {
  const minSimilarity = opts.minSimilarity ?? 0.45;
  const maxSimilarity = opts.maxSimilarity ?? 0.85;
  const limit = opts.limit ?? 5;
  const targetBloomLevel = opts.targetBloomLevel ?? 5;

  const embedded = await listEmbeddedTokens(db, opts.model);
  const queryVec = Float32Array.from(opts.queryEmbedding);

  const candidates: Array<{ token: Token; similarity: number }> = [];

  for (const row of embedded) {
    if (opts.targetTokenId && row.token.id === opts.targetTokenId) {
      continue;
    }

    const similarity = cosineSimilarity(queryVec, row.embedding);
    if (similarity >= minSimilarity && similarity < maxSimilarity) {
      candidates.push({ token: row.token, similarity });
    }
  }

  // Sort by similarity descending, tie-break by slug ascending
  candidates.sort((a, b) => {
    if (Math.abs(a.similarity - b.similarity) > 1e-9) {
      return b.similarity - a.similarity;
    }
    return a.token.slug.localeCompare(b.token.slug);
  });

  const topCandidates = candidates.slice(0, limit);

  // Pre-fetch prerequisites for alreadyPrerequisite check if target exists
  const prereqIds = new Set<string>();
  if (opts.targetTokenId) {
    const prereqs = await getPrerequisites(db, opts.targetTokenId);
    for (const p of prereqs) {
      prereqIds.add(p.requires_id);
    }
  }

  const results: FoundationSuggestion[] = [];
  for (const cand of topCandidates) {
    let alreadyPrerequisite = false;
    let wouldCreateCycleFlag = false;
    const bloomAboveTarget = cand.token.bloom_level > targetBloomLevel;

    if (opts.targetTokenId) {
      alreadyPrerequisite = prereqIds.has(cand.token.id);
      wouldCreateCycleFlag = await wouldCreateCycle(
        db,
        opts.targetTokenId,
        cand.token.id,
      );
    }

    results.push({
      token: cand.token,
      similarity: cand.similarity,
      alreadyPrerequisite,
      wouldCreateCycle: wouldCreateCycleFlag,
      bloomAboveTarget,
    });
  }

  return results;
}
