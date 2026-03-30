/**
 * Token repository — typed wrappers around the tokens table.
 *
 * Tokens are atomic knowledge concepts with Bloom taxonomy levels
 * and optional symbiosis modes (shadowing / copilot / autonomy).
 */

import type { Database } from "libsql";
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
  deprecated_at: string | null;
}

export interface CreateTokenInput {
  slug: string;
  concept: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
}

export interface UpdateTokenInput {
  concept?: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
}

export interface ListTokensOptions {
  domain?: string;
}

export interface TokenDeleteImpact {
  cards: number;
  review_logs: number;
  prerequisite_edges_from_token: number;
  prerequisite_edges_to_token: number;
  session_steps: number;
  sessions_touched: number;
  agent_skills: number;
}

export interface DeleteTokenResult {
  token: Token;
  impact: TokenDeleteImpact;
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
 * Update mutable fields on a token.
 *
 * Slug is intentionally immutable in v1 because it is referenced by other
 * parts of the system (for example agent skill metadata).
 */
export function updateToken(
  db: Database,
  slug: string,
  updates: UpdateTokenInput,
): Token {
  const token = getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.concept !== undefined) {
    fields.push("concept = ?");
    values.push(updates.concept);
  }
  if (updates.domain !== undefined) {
    fields.push("domain = ?");
    values.push(updates.domain);
  }
  if (updates.bloom_level !== undefined) {
    if (updates.bloom_level < 1 || updates.bloom_level > 5) {
      throw new Error(`bloom_level must be between 1 and 5, got ${updates.bloom_level}`);
    }
    fields.push("bloom_level = ?");
    values.push(updates.bloom_level);
  }
  if (updates.context !== undefined) {
    fields.push("context = ?");
    values.push(updates.context);
  }
  if (updates.symbiosis_mode !== undefined) {
    const validModes = ["shadowing", "copilot", "autonomy"];
    if (updates.symbiosis_mode !== null && !validModes.includes(updates.symbiosis_mode)) {
      throw new Error(`Invalid symbiosis_mode: ${updates.symbiosis_mode}`);
    }
    fields.push("symbiosis_mode = ?");
    values.push(updates.symbiosis_mode);
  }

  if (fields.length === 0) {
    throw new Error("updateToken called with no fields to update");
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(slug);

  db.prepare(`UPDATE tokens SET ${fields.join(", ")} WHERE slug = ?`).run(...values);
  return getTokenBySlug(db, slug)!;
}

/**
 * Mark a token as deprecated. Deprecated tokens are excluded from review queues
 * and search results but are not deleted — they can still be consulted.
 *
 * Throws if the token does not exist or is already deprecated.
 */
export function deprecateToken(db: Database, slug: string): Token {
  const token = getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }
  if (token.deprecated_at) {
    throw new Error(`Token already deprecated: ${slug}`);
  }

  const now = new Date().toISOString();
  db.prepare("UPDATE tokens SET deprecated_at = ?, updated_at = ? WHERE slug = ?").run(
    now,
    now,
    slug,
  );

  return getTokenBySlug(db, slug)!;
}

/**
 * Preview the rows that will be removed or updated when deleting a token.
 */
export function getTokenDeleteImpact(
  db: Database,
  slug: string,
): TokenDeleteImpact {
  const token = getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }

  const cards = db
    .prepare("SELECT COUNT(*) AS n FROM cards WHERE token_id = ?")
    .get(token.id) as { n: number };
  const reviewLogs = db
    .prepare("SELECT COUNT(*) AS n FROM review_logs WHERE token_id = ?")
    .get(token.id) as { n: number };
  const prereqsFrom = db
    .prepare("SELECT COUNT(*) AS n FROM prerequisites WHERE token_id = ?")
    .get(token.id) as { n: number };
  const prereqsTo = db
    .prepare("SELECT COUNT(*) AS n FROM prerequisites WHERE requires_id = ?")
    .get(token.id) as { n: number };
  const sessionSteps = db
    .prepare("SELECT COUNT(*) AS n FROM session_steps WHERE token_id = ?")
    .get(token.id) as { n: number };
  const sessionsTouched = db
    .prepare("SELECT COUNT(DISTINCT session_id) AS n FROM session_steps WHERE token_id = ?")
    .get(token.id) as { n: number };

  const skillRows = db
    .prepare("SELECT token_slugs FROM agent_skills")
    .all() as Array<{ token_slugs: string }>;
  const agentSkills = skillRows.filter((row) => {
    const tokenSlugs = JSON.parse(row.token_slugs) as string[];
    return tokenSlugs.includes(slug);
  }).length;

  return {
    cards: cards.n,
    review_logs: reviewLogs.n,
    prerequisite_edges_from_token: prereqsFrom.n,
    prerequisite_edges_to_token: prereqsTo.n,
    session_steps: sessionSteps.n,
    sessions_touched: sessionsTouched.n,
    agent_skills: agentSkills,
  };
}

/**
 * Hard-delete a token and clean up non-FK references that point at its slug.
 */
export function deleteToken(
  db: Database,
  slug: string,
): DeleteTokenResult {
  const token = getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }

  const impact = getTokenDeleteImpact(db, slug);

  db.exec("BEGIN");
  try {
    const now = new Date().toISOString();
    const skillRows = db
      .prepare("SELECT id, token_slugs FROM agent_skills")
      .all() as Array<{ id: string; token_slugs: string }>;

    for (const row of skillRows) {
      const tokenSlugs = JSON.parse(row.token_slugs) as string[];
      const filtered = tokenSlugs.filter((tokenSlug) => tokenSlug !== slug);
      if (filtered.length !== tokenSlugs.length) {
        db.prepare("UPDATE agent_skills SET token_slugs = ?, updated_at = ? WHERE id = ?")
          .run(JSON.stringify(filtered), now, row.id);
      }
    }

    db.prepare("DELETE FROM tokens WHERE id = ?").run(token.id);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return { token, impact };
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

  const tokens = db
    .prepare("SELECT * FROM tokens WHERE deprecated_at IS NULL")
    .all() as Token[];

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
      .prepare(
        "SELECT * FROM tokens WHERE domain = ? AND deprecated_at IS NULL ORDER BY bloom_level, slug",
      )
      .all(options.domain) as Token[];
  }
  return db
    .prepare(
      "SELECT * FROM tokens WHERE deprecated_at IS NULL ORDER BY bloom_level, domain, slug",
    )
    .all() as Token[];
}
