/**
 * Token repository — typed wrappers around the tokens table.
 *
 * Tokens are atomic knowledge concepts with Bloom taxonomy levels
 * and optional symbiosis modes (shadowing / copilot / autonomy).
 */

import type { Database } from "better-sqlite3";
import { ulid } from "ulid";

// ── Types ────────────────────────────────────────────────────────────────────

export type BloomLevel = 1 | 2 | 3 | 4 | 5;

export type SymbiosisMode = "shadowing" | "copilot" | "autonomy";

export interface Token {
  id: string;
  slug: string;
  concept: string;
  domain: string;
  bloom_level: BloomLevel;
  context: string;
  symbiosis_mode: SymbiosisMode | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTokenInput {
  slug: string;
  concept: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
}

export interface ListTokensOptions {
  domain?: string;
}

// ── Scored result from fuzzy search ──────────────────────────────────────────

export interface ScoredToken extends Token {
  score: number;
}

// ── Functions ────────────────────────────────────────────────────────────────

/**
 * Create a new knowledge token.
 * Throws if a token with the same slug already exists.
 */
export function createToken(db: Database, input: CreateTokenInput): Token {
  const id = ulid();
  const now = new Date().toISOString();

  const bloom = input.bloom_level ?? 1;
  if (bloom < 1 || bloom > 5) {
    throw new Error(`bloom_level must be between 1 and 5, got ${bloom}`);
  }

  db.prepare(`
    INSERT INTO tokens (id, slug, concept, domain, bloom_level, context, symbiosis_mode, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.slug,
    input.concept,
    input.domain ?? "",
    bloom,
    input.context ?? "",
    input.symbiosis_mode ?? null,
    now,
    now,
  );

  return getTokenById(db, id)!;
}

/**
 * Look up a token by its unique slug.
 * Returns undefined if not found.
 */
export function getTokenBySlug(db: Database, slug: string): Token | undefined {
  return db.prepare("SELECT * FROM tokens WHERE slug = ?").get(slug) as Token | undefined;
}

/**
 * Look up a token by its ULID.
 * Returns undefined if not found.
 */
export function getTokenById(db: Database, id: string): Token | undefined {
  return db.prepare("SELECT * FROM tokens WHERE id = ?").get(id) as Token | undefined;
}

/**
 * Fuzzy search for tokens by keyword query.
 *
 * Ported from the PoC's find-token command: splits the query into word
 * tokens, scores each database token by word overlap plus a substring
 * bonus on the concept field, and returns all matches sorted by score
 * descending.
 */
export function findTokens(db: Database, query: string): ScoredToken[] {
  const normalised = query.toLowerCase();
  const qTokens = new Set(
    normalised
      .split(/[\s,.\-_/\\:;!?()\[\]{}]+/)
      .filter((t) => t.length > 2),
  );

  const tokens = db.prepare("SELECT * FROM tokens").all() as Token[];

  const scored: ScoredToken[] = [];

  for (const t of tokens) {
    const words = (t.slug + " " + t.concept + " " + t.domain)
      .toLowerCase()
      .split(/[\s,.\-_/\\:;!?()\[\]{}]+/)
      .filter(Boolean);

    let score = 0;
    for (const w of words) {
      if (qTokens.has(w)) score++;
    }

    // Substring bonus: if the concept contains the start of the query
    if (t.concept.toLowerCase().includes(normalised.slice(0, 25))) {
      score += 3;
    }

    if (score > 0) {
      scored.push({ score, ...t });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * List all tokens, optionally filtered by domain.
 * Results are ordered by bloom_level then slug.
 */
export function listTokens(db: Database, options?: ListTokensOptions): Token[] {
  if (options?.domain) {
    return db
      .prepare("SELECT * FROM tokens WHERE domain = ? ORDER BY bloom_level, slug")
      .all(options.domain) as Token[];
  }
  return db
    .prepare("SELECT * FROM tokens ORDER BY bloom_level, domain, slug")
    .all() as Token[];
}
