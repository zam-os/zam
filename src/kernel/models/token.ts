/**
 * Token repository — typed wrappers around the tokens table.
 *
 * Tokens are atomic knowledge concepts with Bloom taxonomy levels
 * and optional symbiosis modes (shadowing / copilot / autonomy).
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import type { CardState } from "./card.js";
import { deleteCardForUser, ensureCard, getCard } from "./card.js";

// ── Types ────────────────────────────────────────────────────────────────────

export type BloomLevel = 1 | 2 | 3 | 4 | 5;

export type SymbiosisMode = "shadowing" | "copilot" | "autonomy";

export type EditorialState = "draft" | "in_review" | "published" | "deprecated";

/**
 * Who authored a token's current recall question. LLM healing only
 * overwrites questions whose source is not 'manual'.
 */
export type QuestionSource = "manual" | "llm" | "template";

export interface Token {
  id: string;
  slug: string;
  title: string;
  concept: string;
  domain: string;
  bloom_level: BloomLevel;
  context: string;
  symbiosis_mode: SymbiosisMode | null;
  source_link: string | null;
  question: string | null;
  question_source: QuestionSource;
  created_at: string;
  updated_at: string;
  deprecated_at: string | null;
  provider: string | null;
  topic_id: string | null;
  /** Maintenance state (ADR 2026-07-18): set when the token's source
   * binding is unclear (stale source_link, ambiguous re-import). Cards of
   * a token in maintenance leave the review queue; learning state is
   * preserved. NULL = healthy. */
  maintenance_at: string | null;
  maintenance_reason: string | null;
  /** Editorial state (ADR 2026-07-04 Phase 3: 'draft' | 'in_review' | 'published' | 'deprecated'). */
  editorial_state: EditorialState;
  /** Published learning atom this practice item realises (ADR 2026-08-14). */
  atom_id: string | null;
}

export interface CreateTokenInput {
  id?: string;
  slug: string;
  title?: string;
  concept: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
  source_link?: string | null;
  question?: string | null;
  question_source?: QuestionSource;
  provider?: string | null;
  topic_id?: string | null;
  editorial_state?: EditorialState;
  atom_id?: string | null;
}

export interface UpdateTokenInput {
  title?: string | null;
  concept?: string;
  domain?: string;
  bloom_level?: BloomLevel;
  context?: string;
  symbiosis_mode?: SymbiosisMode | null;
  source_link?: string | null;
  question?: string | null;
  question_source?: QuestionSource;
  provider?: string | null;
  topic_id?: string | null;
  editorial_state?: EditorialState;
}

export interface ListTokensOptions {
  domain?: string;
  editorialState?: EditorialState;
  /**
   * Filter by domain prefix using `/` as separator (e.g. "company-team").
   * Matches exact or startsWith(prefix + "/").
   */
  domainPrefix?: string;
  /**
   * Filter by knowledge context name (e.g. "work-company").
   */
  knowledgeContext?: string;
  /**
   * Filter by source-link base(s): tokens whose `source_link` is one of the
   * bases exactly or `<base>#<anchor>` (the anchored form OKF imports
   * write). Same matching rule as `getTokensBySourceLinkBase`, OR-ed over
   * all bases. An empty array matches nothing.
   */
  sourceLinkBases?: string[];
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

const VALID_QUESTION_SOURCES: QuestionSource[] = ["manual", "llm", "template"];

function validateQuestionSource(value: QuestionSource): void {
  if (!VALID_QUESTION_SOURCES.includes(value)) {
    throw new Error(
      `Invalid question_source: ${value} (expected one of ${VALID_QUESTION_SOURCES.join(", ")})`,
    );
  }
}

/**
 * Create a new knowledge token.
 * Throws if a token with the same slug already exists.
 */
/**
 * Insert a token and return its id, without reading the row back.
 *
 * The read-back in `createToken` is one extra statement — free on a local
 * file, a full network round trip on a remote library. A bulk importer that
 * only needs the id (to hang a binding and a card off it) uses this instead.
 */
export async function insertToken(
  db: Database,
  input: CreateTokenInput,
): Promise<string> {
  const id = input.id ?? ulid();
  const now = new Date().toISOString();

  const bloom = input.bloom_level ?? 1;
  if (bloom < 1 || bloom > 5) {
    throw new Error(`bloom_level must be between 1 and 5, got ${bloom}`);
  }

  const title = input.title ?? "";
  const questionSource = input.question_source ?? "manual";
  validateQuestionSource(questionSource);

  const editorialState = input.editorial_state ?? "published";
  const validStates: EditorialState[] = [
    "draft",
    "in_review",
    "published",
    "deprecated",
  ];
  if (!validStates.includes(editorialState)) {
    throw new Error(`Invalid editorial_state: ${editorialState}`);
  }

  await db
    .prepare(`
    INSERT INTO tokens (id, slug, title, concept, domain, bloom_level, context, symbiosis_mode, source_link, question, question_source, provider, topic_id, created_at, updated_at, editorial_state, atom_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      id,
      input.slug,
      title,
      input.concept,
      input.domain ?? "",
      bloom,
      input.context ?? "",
      input.symbiosis_mode ?? null,
      input.source_link ?? null,
      input.question ?? null,
      questionSource,
      input.provider ?? null,
      input.topic_id ?? null,
      now,
      now,
      editorialState,
      input.atom_id ?? null,
    );

  return id;
}

export async function createToken(
  db: Database,
  input: CreateTokenInput,
): Promise<Token> {
  return (await getTokenById(db, await insertToken(db, input))) as Token;
}

function parseTokenFallback(token: Token | undefined): void {
  if (token && !token.provider && token.source_link) {
    if (token.source_link.includes("lehrplanplus.bayern.de")) {
      token.provider = "lehrplanplus-bayern";
      const match = token.source_link.match(/#(.*)$/);
      if (match) {
        token.topic_id = match[1];
      }
    }
  }
}

/**
 * Look up a token by its unique slug.
 * Returns undefined if not found.
 */
export async function getTokenBySlug(
  db: Database,
  slug: string,
): Promise<Token | undefined> {
  const token = (await db
    .prepare("SELECT * FROM tokens WHERE slug = ?")
    .get(slug)) as Token | undefined;
  parseTokenFallback(token);
  return token;
}

/**
 * Look up many tokens by slug in a single query.
 * Returns a map keyed by slug; slugs without a token are simply absent.
 */
export async function getTokensBySlugs(
  db: Database,
  slugs: string[],
): Promise<Map<string, Token>> {
  const tokens = new Map<string, Token>();
  const unique = [...new Set(slugs)];
  if (unique.length === 0) return tokens;

  const placeholders = unique.map(() => "?").join(",");
  const rows = (await db
    .prepare(`SELECT * FROM tokens WHERE slug IN (${placeholders})`)
    .all(...unique)) as Token[];
  for (const token of rows) {
    parseTokenFallback(token);
    tokens.set(token.slug, token);
  }
  return tokens;
}

/**
 * Look up a token by its ULID.
 * Returns undefined if not found.
 */
export async function getTokenById(
  db: Database,
  id: string,
): Promise<Token | undefined> {
  const token = (await db
    .prepare("SELECT * FROM tokens WHERE id = ?")
    .get(id)) as Token | undefined;
  parseTokenFallback(token);
  return token;
}

/**
 * Update mutable fields on a token.
 *
 * Slug is intentionally immutable in v1 because it is referenced by other
 * parts of the system (for example agent skill metadata).
 */
export async function updateToken(
  db: Database,
  slug: string,
  updates: UpdateTokenInput,
): Promise<Token> {
  const token = await getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.title !== undefined) {
    fields.push("title = ?");
    values.push(updates.title ?? "");
  }
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
      throw new Error(
        `bloom_level must be between 1 and 5, got ${updates.bloom_level}`,
      );
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
    if (
      updates.symbiosis_mode !== null &&
      !validModes.includes(updates.symbiosis_mode)
    ) {
      throw new Error(`Invalid symbiosis_mode: ${updates.symbiosis_mode}`);
    }
    fields.push("symbiosis_mode = ?");
    values.push(updates.symbiosis_mode);
  }
  if (updates.source_link !== undefined) {
    fields.push("source_link = ?");
    values.push(updates.source_link);
  }
  if (updates.question !== undefined) {
    fields.push("question = ?");
    values.push(updates.question);
  }
  // A question edit without a declared source is a human edit: default to
  // 'manual' so LLM healing stops overwriting it. Automated writers (the
  // heal path) must declare question_source explicitly.
  const questionSource =
    updates.question_source ??
    (updates.question !== undefined ? "manual" : undefined);
  if (questionSource !== undefined) {
    validateQuestionSource(questionSource);
    fields.push("question_source = ?");
    values.push(questionSource);
  }
  if (updates.provider !== undefined) {
    fields.push("provider = ?");
    values.push(updates.provider);
  }
  if (updates.topic_id !== undefined) {
    fields.push("topic_id = ?");
    values.push(updates.topic_id);
  }
  if (updates.editorial_state !== undefined) {
    const validStates: EditorialState[] = [
      "draft",
      "in_review",
      "published",
      "deprecated",
    ];
    if (!validStates.includes(updates.editorial_state)) {
      throw new Error(`Invalid editorial_state: ${updates.editorial_state}`);
    }
    fields.push("editorial_state = ?");
    values.push(updates.editorial_state);
  }

  if (fields.length === 0) {
    throw new Error("updateToken called with no fields to update");
  }

  fields.push("updated_at = ?");
  values.push(new Date().toISOString());
  values.push(slug);

  await db
    .prepare(`UPDATE tokens SET ${fields.join(", ")} WHERE slug = ?`)
    .run(...values);
  return (await getTokenBySlug(db, slug)) as Token;
}

/**
 * Mark a token as deprecated. Deprecated tokens are excluded from review queues
 * and search results but are not deleted — they can still be consulted.
 *
 * Throws if the token does not exist or is already deprecated.
 */
export async function deprecateToken(
  db: Database,
  slug: string,
): Promise<Token> {
  const token = await getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }
  if (token.deprecated_at) {
    throw new Error(`Token already deprecated: ${slug}`);
  }

  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE tokens SET deprecated_at = ?, editorial_state = 'deprecated', updated_at = ? WHERE slug = ?",
    )
    .run(now, now, slug);

  return (await getTokenBySlug(db, slug)) as Token;
}

/**
 * All non-deprecated tokens whose source_link is `base` or `base#<anchor>`
 * — i.e. the tokens previously imported from one OKF article (ADR
 * 2026-07-18). `base` is matched literally, not as a pattern.
 */
export async function getTokensBySourceLinkBase(
  db: Database,
  base: string,
): Promise<Token[]> {
  return (await db
    .prepare(
      `SELECT * FROM tokens
       WHERE (source_link = ? OR source_link LIKE ? || '#%' ESCAPE '\\')
         AND deprecated_at IS NULL`,
    )
    .all(base, escapeLike(base))) as Token[];
}

/** Escape LIKE wildcards so a literal base cannot over-match. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/**
 * Put a token into maintenance (ADR 2026-07-18): its source binding needs
 * repair — manually or via doctor auto-heal — and its cards leave the
 * review queue until cleared. Learning state is preserved. Idempotent:
 * re-entering maintenance refreshes the timestamp and reason.
 */
export async function setTokenMaintenance(
  db: Database,
  slug: string,
  reason: string,
): Promise<Token> {
  const token = await getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }
  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE tokens SET maintenance_at = ?, maintenance_reason = ?, updated_at = ? WHERE slug = ?",
    )
    .run(now, reason, now, slug);
  return (await getTokenBySlug(db, slug)) as Token;
}

/** Clear a token's maintenance state — its cards re-enter scheduling. */
export async function clearTokenMaintenance(
  db: Database,
  slug: string,
): Promise<Token> {
  const token = await getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }
  const now = new Date().toISOString();
  await db
    .prepare(
      "UPDATE tokens SET maintenance_at = NULL, maintenance_reason = NULL, updated_at = ? WHERE slug = ?",
    )
    .run(now, slug);
  return (await getTokenBySlug(db, slug)) as Token;
}

/**
 * Preview the rows that will be removed or updated when deleting a token.
 */
export async function getTokenDeleteImpact(
  db: Database,
  slug: string,
): Promise<TokenDeleteImpact> {
  const token = await getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }

  const cards = (await db
    .prepare("SELECT COUNT(*) AS n FROM cards WHERE token_id = ?")
    .get(token.id)) as { n: number };
  const reviewLogs = (await db
    .prepare("SELECT COUNT(*) AS n FROM review_logs WHERE token_id = ?")
    .get(token.id)) as { n: number };
  const prereqsFrom = (await db
    .prepare("SELECT COUNT(*) AS n FROM prerequisites WHERE token_id = ?")
    .get(token.id)) as { n: number };
  const prereqsTo = (await db
    .prepare("SELECT COUNT(*) AS n FROM prerequisites WHERE requires_id = ?")
    .get(token.id)) as { n: number };
  const sessionSteps = (await db
    .prepare("SELECT COUNT(*) AS n FROM session_steps WHERE token_id = ?")
    .get(token.id)) as { n: number };
  const sessionsTouched = (await db
    .prepare(
      "SELECT COUNT(DISTINCT session_id) AS n FROM session_steps WHERE token_id = ?",
    )
    .get(token.id)) as { n: number };

  const skillRows = (await db
    .prepare("SELECT token_slugs FROM agent_skills")
    .all()) as Array<{ token_slugs: string }>;
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
export async function deleteToken(
  db: Database,
  slug: string,
): Promise<DeleteTokenResult> {
  const token = await getTokenBySlug(db, slug);
  if (!token) {
    throw new Error(`Token not found: ${slug}`);
  }

  const impact = await getTokenDeleteImpact(db, slug);

  await db.transaction(async (tx) => {
    const now = new Date().toISOString();
    const skillRows = (await tx
      .prepare("SELECT id, token_slugs FROM agent_skills")
      .all()) as Array<{ id: string; token_slugs: string }>;

    const skillUpdateStmt = tx.prepare(
      "UPDATE agent_skills SET token_slugs = ?, updated_at = ? WHERE id = ?",
    );
    for (const row of skillRows) {
      const tokenSlugs = JSON.parse(row.token_slugs) as string[];
      const filtered = tokenSlugs.filter((tokenSlug) => tokenSlug !== slug);
      if (filtered.length !== tokenSlugs.length) {
        await skillUpdateStmt.run(JSON.stringify(filtered), now, row.id);
      }
    }

    await tx.prepare("DELETE FROM tokens WHERE id = ?").run(token.id);
  });

  return { token, impact };
}

/**
 * Fuzzy search for tokens by keyword query.
 *
 * Uses SQLite LIKE queries on slug, concept, and domain to avoid loading
 * every non-deprecated token into memory.  Each search term runs its own
 * LIKE query; results are aggregated in JS with a word-overlap score plus
 * a substring bonus on the concept field.  Results are returned sorted by
 * relevance score descending.
 *
 * For very small search terms (< 3 chars) a light in-memory fallback is
 * used to avoid matching every token.
 */
export async function findTokens(
  db: Database,
  query: string,
): Promise<ScoredToken[]> {
  const normalised = query.toLowerCase();
  const searchTokens = normalised
    .split(/[\s,.\-_/\\:;!?()[\]{}]+/)
    .filter((t) => t.length > 0);

  if (searchTokens.length === 0) return [];

  // Short terms: fall back to in-memory scan (cheap — few tokens match anyway)
  const shortTerms = searchTokens.filter((t) => t.length <= 2);
  const longTerms = searchTokens.filter((t) => t.length > 2);

  const scoreMap = new Map<string, { token: Token; score: number }>();

  // Per-term SQL LIKE queries for each substantive search token.
  const likeSQL =
    `SELECT * FROM tokens WHERE deprecated_at IS NULL AND ` +
    `(lower(slug) LIKE ? OR lower(title) LIKE ? OR lower(concept) LIKE ? OR lower(domain) LIKE ?)`;

  const likeStmt = db.prepare(likeSQL);
  for (const term of longTerms) {
    const pattern = `%${term}%`;
    const rows = (await likeStmt.all(
      pattern,
      pattern,
      pattern,
      pattern,
    )) as Token[];
    for (const row of rows) {
      const entry = scoreMap.get(row.id);
      if (entry) {
        entry.score++;
      } else {
        scoreMap.set(row.id, { token: row, score: 1 });
      }
    }
  }

  // If there were short terms, or all terms were short, scan in-memory.
  if (shortTerms.length > 0 || longTerms.length === 0) {
    const allTokens = (await db
      .prepare("SELECT * FROM tokens WHERE deprecated_at IS NULL")
      .all()) as Token[];

    for (const token of allTokens) {
      const words =
        `${token.slug} ${token.title} ${token.concept} ${token.domain}`
          .toLowerCase()
          .split(/[\s,.\-_/\\:;!?()[\]{}]+/)
          .filter(Boolean);

      let matchCount = 0;
      for (const term of shortTerms.length > 0 ? shortTerms : searchTokens) {
        for (const w of words) {
          if (w === term) matchCount++;
        }
      }

      if (matchCount > 0) {
        const entry = scoreMap.get(token.id);
        if (entry) {
          entry.score += matchCount;
        } else {
          scoreMap.set(token.id, { token, score: matchCount });
        }
      }
    }
  }

  // Apply substring bonus and build result.
  const scored: ScoredToken[] = [];
  for (const { token, score } of scoreMap.values()) {
    let finalScore = score;
    if (token.concept.toLowerCase().includes(normalised.slice(0, 25))) {
      finalScore += 3;
    }
    scored.push({ score: finalScore, ...token });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * List all tokens, optionally filtered by domain or knowledge context.
 * Results are ordered by bloom_level then domain then slug (or bloom_level then slug if domain-filtered).
 */
export async function listTokens(
  db: Database,
  options?: ListTokensOptions,
): Promise<Token[]> {
  const whereClauses: string[] = ["deprecated_at IS NULL"];
  const params: unknown[] = [];

  if (options?.editorialState) {
    whereClauses.push("editorial_state = ?");
    params.push(options.editorialState);
  }

  if (options?.domain) {
    whereClauses.push("domain = ?");
    params.push(options.domain);
  } else if (options?.domainPrefix) {
    const prefix = options.domainPrefix;
    whereClauses.push("(domain = ? OR domain LIKE ?)");
    params.push(prefix, `${prefix}/%`);
  }

  if (options?.knowledgeContext) {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM token_contexts tc
      INNER JOIN contexts c ON c.id = tc.context_id
      WHERE tc.token_id = tokens.id AND c.name = ?
    )`);
    params.push(options.knowledgeContext);
  }

  if (options?.sourceLinkBases) {
    const clauses = options.sourceLinkBases.map(
      () => `(source_link = ? OR source_link LIKE ? || '#%' ESCAPE '\\')`,
    );
    // An explicit empty list means "nothing matches", not "no filter".
    whereClauses.push(clauses.length ? `(${clauses.join(" OR ")})` : "0 = 1");
    for (const base of options.sourceLinkBases) {
      params.push(base, escapeLike(base));
    }
  }

  const orderBy =
    options?.domain || options?.domainPrefix
      ? "ORDER BY bloom_level, slug"
      : "ORDER BY bloom_level, domain, slug";

  const sql = `SELECT * FROM tokens WHERE ${whereClauses.join(" AND ")} ${orderBy}`;
  const tokens = (await db.prepare(sql).all(...params)) as Token[];

  for (const token of tokens) {
    parseTokenFallback(token);
  }
  return tokens;
}

export interface PersonalCard {
  tokenId: string;
  slug: string;
  title: string;
  concept: string;
  domain: string;
  bloomLevel: BloomLevel;
  context: string;
  symbiosisMode: SymbiosisMode | null;
  sourceLink: string | null;
  question: string | null;
  createdAt: string;
  updatedAt: string;

  cardId: string | null;
  state: CardState | null;
  dueAt: string | null;
  /**
   * When the learner set this card aside (ADR 2026-07-04 Decision 10), or null
   * while it is scheduled. The row is returned either way — a detached card
   * keeps its history and can be picked up again — so a caller that does not
   * read this cannot tell the two apart.
   */
  detachedAt: string | null;
  stability: number | null;
  difficulty: number | null;
  reps: number | null;
  lapses: number | null;
  elapsedDays: number | null;
  scheduledDays: number | null;
  blocked: number | null;
  provider: string | null;
  topicId: string | null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Strip domain prefix (using / separator) from slug for display.
 */
export function getShortSlug(
  slug: string,
  domainPrefix?: string | null,
): string {
  if (domainPrefix) {
    const folded = domainPrefix
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (folded && slug.startsWith(`${folded}-`)) {
      return slug.substring(folded.length + 1);
    }
  }
  return slug;
}

/**
 * Primary display name for a token: human title if present, else short slug.
 * Never falls back to concept (which is a spoiler).
 */
export function getDisplayTitle(
  t: { title?: string | null; slug: string },
  activeDomainScope?: string | null,
): string {
  if (t.title?.trim()) return t.title.trim();
  return getShortSlug(t.slug, activeDomainScope);
}

/**
 * Slug derivation without a database, given a way to test for collisions.
 *
 * Split out so a bulk importer can resolve hundreds of slugs against one
 * preloaded set instead of one query per card: on a remote (Turso) library
 * every one of those queries is a network round trip. `generateTokenSlug` is
 * this function with a database-backed predicate, so both paths can never
 * disagree about the naming rules.
 */
export function buildTokenSlug(
  domain: string,
  concept: string,
  question: string | null | undefined,
  isTaken: (slug: string) => boolean,
): string {
  const baseText = question && question.trim().length > 0 ? question : concept;
  const cleanDomain = slugify(domain || "");
  const cleanBase = slugify(baseText);

  let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
  if (baseSlug.length > 60) {
    baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
  }
  if (!baseSlug) {
    baseSlug = "token";
  }

  let slug = baseSlug;
  let counter = 1;
  while (isTaken(slug)) {
    const suffix = `-${counter}`;
    slug = baseSlug.slice(0, 60 - suffix.length).replace(/-$/, "") + suffix;
    counter++;
  }
  return slug;
}

export async function generateTokenSlug(
  db: Database,
  domain: string,
  concept: string,
  question?: string | null,
): Promise<string> {
  // buildTokenSlug is synchronous, so its collision test cannot query. Ask it
  // for a candidate, check that one, and feed a hit back as "taken" until a
  // free name comes out — the same sequence the loop used to walk inline.
  const taken = new Set<string>();
  while (true) {
    const slug = buildTokenSlug(domain, concept, question, (value) =>
      taken.has(value),
    );
    const existing = await db
      .prepare("SELECT id FROM tokens WHERE slug = ?")
      .get(slug);
    if (!existing) return slug;
    taken.add(slug);
  }
}

export async function listPersonalCards(
  db: Database,
  userId: string,
  options?: { query?: string; domain?: string; knowledgeContext?: string },
): Promise<PersonalCard[]> {
  let sql = `
    SELECT 
      t.id AS tokenId,
      t.slug,
      t.title,
      t.concept,
      t.domain,
      t.bloom_level AS bloomLevel,
      t.context,
      t.symbiosis_mode AS symbiosisMode,
      COALESCE(
        t.source_link,
        (
          SELECT s.uri
          FROM token_sources ts
          INNER JOIN sources s ON s.id = ts.source_id
          WHERE ts.token_id = t.id
          ORDER BY s.created_at DESC, s.id DESC
          LIMIT 1
        )
      ) AS sourceLink,
      t.question,
      t.created_at AS createdAt,
      t.updated_at AS updatedAt,
      t.provider,
      t.topic_id AS topicId,
      c.id AS cardId,
      c.state,
      c.due_at AS dueAt,
      c.stability,
      c.difficulty,
      c.reps,
      c.lapses,
      c.elapsed_days AS elapsedDays,
      c.scheduled_days AS scheduledDays,
      c.blocked,
      c.detached_at AS detachedAt
    FROM tokens t
    INNER JOIN cards c ON c.token_id = t.id AND c.user_id = ?
    WHERE t.deprecated_at IS NULL
  `;

  const values: unknown[] = [userId];

  if (options?.domain) {
    sql += " AND t.domain = ?";
    values.push(options.domain);
  }

  if (options?.knowledgeContext) {
    sql += ` AND EXISTS (
      SELECT 1 FROM token_contexts tc
      INNER JOIN contexts kc ON kc.id = tc.context_id
      WHERE tc.token_id = t.id AND kc.name = ?
    )`;
    values.push(options.knowledgeContext);
  }

  if (options?.query) {
    const terms = options.query.toLowerCase().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      sql += ` AND (lower(t.slug) LIKE ? OR lower(t.concept) LIKE ? OR lower(t.domain) LIKE ? OR lower(t.question) LIKE ?)`;
      const pattern = `%${term}%`;
      values.push(pattern, pattern, pattern, pattern);
    }
  }

  sql += " ORDER BY t.created_at DESC";

  const rows = (await db.prepare(sql).all(...values)) as PersonalCard[];
  for (const row of rows) {
    if (!row.provider && row.sourceLink) {
      if (row.sourceLink.includes("lehrplanplus.bayern.de")) {
        row.provider = "lehrplanplus-bayern";
        const match = row.sourceLink.match(/#(.*)$/);
        if (match) {
          row.topicId = match[1];
        }
      }
    }
  }
  return rows;
}

export interface CurriculumCardInput {
  question: string;
  concept: string;
  title?: string;
  domain: string;
  source_link?: string | null;
  context?: string;
  bloom_level?: number;
  symbiosis_mode?: string | null;
  provider?: string | null;
  topic_id?: string | null;
  /** Explicit prerequisite slugs (in-batch or existing). If omitted, auto-inferred. */
  prerequisites?: string[];
}

export interface ImportCurriculumResult {
  createdCount: number;
  ensuredCount: number;
}

/**
 * Match tokens tagged with a Lernbereich or any of its sub-units
 * (`parentTopicId@kuN`).
 */
function curriculumTopicScopeClause(): string {
  return `(t.topic_id = ? OR t.topic_id LIKE ? || '@%')`;
}

/** Whether a token belongs to a curriculum provider + Lernbereich scope. */
export function tokenMatchesCurriculumTopicScope(
  token: Pick<Token, "provider" | "topic_id">,
  provider: string,
  topicId: string,
): boolean {
  if (token.provider !== provider || !token.topic_id) return false;
  return token.topic_id === topicId || token.topic_id.startsWith(`${topicId}@`);
}

/**
 * Delete a user's FSRS card only when the token matches curriculum scope.
 * Throws when the slug exists but is outside the allowed topic scope.
 */
export async function deleteCurriculumCardForUser(
  db: Database,
  userId: string,
  slug: string,
  provider: string,
  topicId: string,
): Promise<boolean> {
  const token = await getTokenBySlug(db, slug);
  if (!token) return false;
  if (!tokenMatchesCurriculumTopicScope(token, provider, topicId)) {
    throw new Error(
      `Token "${slug}" is not removable for curriculum topic "${topicId}"`,
    );
  }
  const card = await getCard(db, token.id, userId);
  if (!card) return false;
  await deleteCardForUser(db, token.id, userId);
  return true;
}

/**
 * Count FSRS cards a user already has for a curriculum topic scope.
 */
export async function countUserCardsForCurriculumTopic(
  db: Database,
  userId: string,
  provider: string,
  topicId: string,
): Promise<number> {
  const row = (await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM cards c
       INNER JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ?
         AND t.provider = ?
         AND ${curriculumTopicScopeClause()}`,
    )
    .get(userId, provider, topicId, topicId)) as { count: number } | undefined;
  return row?.count ?? 0;
}

export interface CurriculumTopicCard {
  slug: string;
  question: string | null;
  concept: string;
  domain: string;
  bloomLevel: number;
  symbiosisMode: string | null;
  topicId: string | null;
}

/**
 * List a user's FSRS cards for a curriculum topic scope (Lernbereich + sub-units).
 */
export async function listUserCardsForCurriculumTopic(
  db: Database,
  userId: string,
  provider: string,
  topicId: string,
): Promise<CurriculumTopicCard[]> {
  const rows = (await db
    .prepare(
      `SELECT
         t.slug,
         t.question,
         t.concept,
         t.domain,
         t.bloom_level AS bloomLevel,
         t.symbiosis_mode AS symbiosisMode,
         t.topic_id AS topicId
       FROM cards c
       INNER JOIN tokens t ON t.id = c.token_id
       WHERE c.user_id = ?
         AND t.provider = ?
         AND ${curriculumTopicScopeClause()}
       ORDER BY t.slug`,
    )
    .all(userId, provider, topicId, topicId)) as CurriculumTopicCard[];
  return rows;
}

/**
 * Import curriculum cards in a single transaction.
 * Reuses existing tokens on slug match and ensures FSRS cards exist.
 * Prerequisite edges are created from explicit `prerequisites` slugs or
 * inferred from bloom level and domain when omitted.
 */
export async function importCurriculumCards(
  db: Database,
  userId: string,
  cards: CurriculumCardInput[],
): Promise<ImportCurriculumResult> {
  let createdCount = 0;
  let ensuredCount = 0;

  // ── Pass 1: create / link tokens ────────────────────────────────────────
  const slugByIndex: string[] = [];
  const tokenBySlug = new Map<string, Token>();

  await db.transaction(async (tx) => {
    for (const card of cards) {
      const bloom = (
        card.bloom_level !== undefined ? card.bloom_level : 1
      ) as BloomLevel;
      if (bloom < 1 || bloom > 5) {
        throw new Error(`bloom_level must be between 1 and 5, got ${bloom}`);
      }

      let symbiosisMode: SymbiosisMode | null = null;
      if (card.symbiosis_mode) {
        if (
          !["shadowing", "copilot", "autonomy", "none"].includes(
            card.symbiosis_mode,
          )
        ) {
          throw new Error(`Invalid symbiosis_mode: ${card.symbiosis_mode}`);
        }
        symbiosisMode =
          card.symbiosis_mode === "none"
            ? null
            : (card.symbiosis_mode as SymbiosisMode);
      }

      // Check for exact base slug duplicate
      const baseText =
        card.question && card.question.trim().length > 0
          ? card.question
          : card.concept;
      const cleanDomain = slugify(card.domain || "");
      const cleanBase = slugify(baseText);
      let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
      if (baseSlug.length > 60) {
        baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
      }
      if (!baseSlug) {
        baseSlug = "token";
      }

      let token = await getTokenBySlug(tx, baseSlug);
      if (!token) {
        const finalSlug = await generateTokenSlug(
          tx,
          card.domain,
          card.concept,
          card.question,
        );
        token = await createToken(tx, {
          slug: finalSlug,
          title: card.title,
          concept: card.concept,
          domain: card.domain,
          bloom_level: bloom,
          context: card.context || "",
          symbiosis_mode: symbiosisMode,
          source_link: card.source_link || null,
          question: card.question || null,
          // Curriculum cards are LLM-extracted; their questions are LLM
          // inventions, not human-authored content.
          question_source: "llm",
          provider: card.provider || null,
          topic_id: card.topic_id || null,
        });
        createdCount++;
      } else {
        if (!token.provider && card.provider) {
          await updateToken(tx, token.slug, {
            provider: card.provider,
            topic_id: card.topic_id || null,
          });
        }
      }

      slugByIndex.push(token.slug);
      tokenBySlug.set(token.slug, token);

      const existingCard = await getCard(tx, token.id, userId);
      if (!existingCard) {
        await ensureCard(tx, token.id, userId);
        ensuredCount++;
      }
    }

    // ── Pass 2: wire prerequisite edges ─────────────────────────────────────
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const tokenSlug = slugByIndex[i];
      const token = tokenBySlug.get(tokenSlug);
      if (!token) continue;

      const prereqTokens: Token[] = [];

      if (card.prerequisites && card.prerequisites.length > 0) {
        for (const ref of card.prerequisites) {
          const target = await resolvePrerequisiteToken(
            tx,
            ref,
            tokenBySlug,
            cards,
            slugByIndex,
          );
          if (target) prereqTokens.push(target);
        }
      }

      // Auto-infer if no explicit prerequisites matched or were provided
      if (prereqTokens.length === 0) {
        const inferredSlugs = await inferPrerequisitesFromBatch(
          cards,
          i,
          tokenBySlug,
          tx,
        );
        for (const slug of inferredSlugs) {
          const target =
            tokenBySlug.get(slug) ?? (await getTokenBySlug(tx, slug));
          if (target) prereqTokens.push(target);
        }
      }

      for (const prereqToken of prereqTokens) {
        if (prereqToken.id === token.id) continue;

        // Cycle check
        const cycleCheck = (await tx
          .prepare(
            `WITH RECURSIVE dependents(token_id) AS (
               SELECT token_id FROM prerequisites WHERE requires_id = ?
               UNION
               SELECT p.token_id FROM prerequisites p
               JOIN dependents d ON p.requires_id = d.token_id
             )
             SELECT COUNT(*) as n FROM dependents WHERE token_id = ?`,
          )
          .get(prereqToken.id, token.id)) as { n: number };
        if (cycleCheck.n > 0) continue;

        await tx
          .prepare(
            "INSERT INTO prerequisites (token_id, requires_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
          )
          .run(token.id, prereqToken.id);
      }
    }
  });

  return { createdCount, ensuredCount };
}

/**
 * Resolve a prerequisite reference (slug, title, or concept) to a Token,
 * checking the current import batch first, then the database.
 */
async function resolvePrerequisiteToken(
  db: Database,
  ref: string,
  tokenBySlug: Map<string, Token>,
  items: Array<{ title?: string; concept: string; domain: string }>,
  slugByIndex: string[],
): Promise<Token | null> {
  const trimmed = ref.trim();
  if (!trimmed) return null;

  // 1. Direct slug match in current batch
  const bySlug = tokenBySlug.get(trimmed);
  if (bySlug) return bySlug;

  const lowerRef = trimmed.toLowerCase();

  // 2. Title or concept match in current batch
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const slug = slugByIndex[idx];
    if (!slug) continue;
    const token = tokenBySlug.get(slug);
    if (!token) continue;

    if (
      (item.title && item.title.trim().toLowerCase() === lowerRef) ||
      (token.title && token.title.trim().toLowerCase() === lowerRef) ||
      item.concept.trim().toLowerCase() === lowerRef ||
      token.concept.trim().toLowerCase() === lowerRef
    ) {
      return token;
    }
  }

  // 3. Slugified ref match in current batch
  const cleanRef = slugify(trimmed);
  if (cleanRef) {
    for (const token of tokenBySlug.values()) {
      if (token.slug === cleanRef || token.slug.endsWith(`-${cleanRef}`)) {
        return token;
      }
    }
  }

  // 4. Database lookup: exact slug
  const dbToken = await getTokenBySlug(db, trimmed);
  if (dbToken) return dbToken;

  // 5. Database lookup: slugified ref
  if (cleanRef && cleanRef !== trimmed) {
    const dbTokenClean = await getTokenBySlug(db, cleanRef);
    if (dbTokenClean) return dbTokenClean;
  }

  // 6. Database lookup: exact title or concept
  try {
    const match = (await db
      .prepare(
        `SELECT slug FROM tokens WHERE (LOWER(title) = ? OR LOWER(concept) = ?) AND maintenance_at IS NULL LIMIT 1`,
      )
      .get(lowerRef, lowerRef)) as { slug: string } | undefined;
    if (match) {
      return (await getTokenBySlug(db, match.slug)) ?? null;
    }
  } catch {
    // best-effort
  }

  return null;
}

/**
 * Infer prerequisite slugs for an imported item based on bloom level, domain, and batch sequence.
 * Strategy:
 * 1. Link to highest-bloom lower-bloom token in same domain earlier in batch.
 * 2. If no lower-bloom token exists earlier in batch, fallback to preceding same-domain token in batch.
 * 3. Fallback: query existing lower-bloom token in database for the same domain.
 */
async function inferPrerequisitesFromBatch<
  T extends { domain: string; bloom_level?: number; concept: string },
>(
  items: T[],
  currentIndex: number,
  tokenBySlug: Map<string, Token>,
  db: Database,
): Promise<string[]> {
  const item = items[currentIndex];
  const cardDomain = (item.domain || "").toLowerCase();
  const cardBloom = item.bloom_level ?? 1;

  let bestBatchSlug: string | null = null;
  let bestBatchBloom = -1;
  let prevSameDomainSlug: string | null = null;

  for (let j = 0; j < currentIndex; j++) {
    const other = items[j];
    if ((other.domain || "").toLowerCase() !== cardDomain) continue;

    for (const t of tokenBySlug.values()) {
      if (t.concept === other.concept && t.domain === other.domain) {
        prevSameDomainSlug = t.slug;
        break;
      }
    }

    const otherBloom = other.bloom_level ?? 1;
    if (otherBloom < cardBloom && otherBloom > bestBatchBloom) {
      if (prevSameDomainSlug) {
        bestBatchSlug = prevSameDomainSlug;
        bestBatchBloom = otherBloom;
      }
    }
  }
  if (bestBatchSlug) return [bestBatchSlug];

  // If no lower bloom in batch, use preceding same-domain item in batch if available
  if (prevSameDomainSlug) return [prevSameDomainSlug];

  // Fallback: query existing lower-bloom token in database
  try {
    const existing = (await db
      .prepare(
        `SELECT slug FROM tokens WHERE LOWER(domain) = ? AND bloom_level < ? AND maintenance_at IS NULL ORDER BY bloom_level DESC LIMIT 1`,
      )
      .get(cardDomain, cardBloom)) as { slug: string } | undefined;
    if (existing) return [existing.slug];
  } catch {
    // best-effort
  }

  return [];
}

export interface SplitProposalInput {
  question: string;
  concept: string;
  domain: string;
  context?: string;
  bloom_level?: number;
  symbiosis_mode?: string | null;
  source_link?: string | null;
}

/**
 * Confirm a card split transaction.
 * Creates proposal cards, links them as prerequisites to the original card,
 * and either blocks the original card (surfacing proposals) or deletes it.
 */
export async function confirmCardSplit(
  db: Database,
  userId: string,
  originalSlug: string,
  action: "block" | "remove",
  originalQuestion: string,
  originalConcept: string,
  proposals: SplitProposalInput[],
): Promise<ImportCurriculumResult> {
  if (action !== "block" && action !== "remove") {
    throw new Error(`Invalid split action: ${action}`);
  }
  if (proposals.length < 2 || proposals.length > 4) {
    throw new Error("A card split requires between 2 and 4 proposals");
  }

  const originalToken = await getTokenBySlug(db, originalSlug);
  if (!originalToken) {
    throw new Error(`Original token not found: ${originalSlug}`);
  }

  let createdCount = 0;
  let ensuredCount = 0;

  await db.transaction(async (tx) => {
    const originalCard = await getCard(tx, originalToken.id, userId);
    if (!originalCard) {
      throw new Error(
        `Card not found for token ${originalSlug} and user ${userId}`,
      );
    }

    // 1. Create or resolve all proposals
    const proposalTokens: Token[] = [];
    for (const card of proposals) {
      const bloom = (
        card.bloom_level !== undefined ? card.bloom_level : 1
      ) as BloomLevel;
      if (bloom < 1 || bloom > 5) {
        throw new Error(`bloom_level must be between 1 and 5, got ${bloom}`);
      }

      let symbiosisMode: SymbiosisMode | null = null;
      if (card.symbiosis_mode) {
        if (
          !["shadowing", "copilot", "autonomy", "none"].includes(
            card.symbiosis_mode,
          )
        ) {
          throw new Error(`Invalid symbiosis_mode: ${card.symbiosis_mode}`);
        }
        symbiosisMode =
          card.symbiosis_mode === "none"
            ? null
            : (card.symbiosis_mode as SymbiosisMode);
      }

      const baseText =
        card.question && card.question.trim().length > 0
          ? card.question
          : card.concept;
      const cleanDomain = slugify(card.domain || "");
      const cleanBase = slugify(baseText);
      let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
      if (baseSlug.length > 60) {
        baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
      }
      if (!baseSlug) {
        baseSlug = "token";
      }

      let token = await getTokenBySlug(tx, baseSlug);
      if (!token) {
        const finalSlug = await generateTokenSlug(
          tx,
          card.domain,
          card.concept,
          card.question,
        );
        token = await createToken(tx, {
          slug: finalSlug,
          concept: card.concept,
          domain: card.domain,
          bloom_level: bloom,
          context: card.context || "",
          symbiosis_mode: symbiosisMode,
          source_link: card.source_link || originalToken.source_link || null,
          question: card.question || null,
        });
        createdCount++;
      }
      if (token.id === originalToken.id) {
        throw new Error("A token cannot be a prerequisite of itself");
      }
      await assertPrerequisiteDoesNotCreateCycle(
        tx,
        originalToken.id,
        token.id,
      );
      proposalTokens.push(token);

      const existingCard = await getCard(tx, token.id, userId);
      if (!existingCard) {
        await ensureCard(tx, token.id, userId);
        ensuredCount++;
      }
    }

    // 2. original card handling
    if (action === "block") {
      // Update original token fields
      await tx
        .prepare(
          "UPDATE tokens SET question = ?, concept = ?, updated_at = ? WHERE id = ?",
        )
        .run(
          originalQuestion || null,
          originalConcept,
          new Date().toISOString(),
          originalToken.id,
        );

      // Link proposal tokens as prerequisites of original token
      const insertPrereqStmt = tx.prepare(
        "INSERT INTO prerequisites (token_id, requires_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
      );
      for (const propToken of proposalTokens) {
        await insertPrereqStmt.run(originalToken.id, propToken.id);
      }

      // Block original card
      await tx
        .prepare(
          "UPDATE cards SET blocked = 1 WHERE token_id = ? AND user_id = ?",
        )
        .run(originalToken.id, userId);

      // Surface all prerequisites. A freshly created proposal card is already
      // unblocked and due now, so this only matters when a proposal reuses an
      // existing token whose card is currently blocked with no prerequisites of
      // its own. In that case make it reviewable again by clearing the block and
      // marking it due — but never wipe its FSRS scheduling state. The learning
      // history is preserved (ADR principle 5), and clearing the FSRS columns to
      // NULL would in any case violate their NOT NULL constraints and abort the
      // whole split.
      const checkPrereqsStmt = tx.prepare(
        "SELECT COUNT(*) as n FROM prerequisites WHERE token_id = ?",
      );
      const unblockCardStmt = tx.prepare(
        "UPDATE cards SET blocked = 0, due_at = ? WHERE id = ?",
      );
      for (const propToken of proposalTokens) {
        const card = await ensureCard(tx, propToken.id, userId);
        if (card.blocked === 1) {
          const prereqOfPrereq = (await checkPrereqsStmt.get(propToken.id)) as {
            n: number;
          };
          if (prereqOfPrereq.n === 0) {
            const now = new Date().toISOString();
            await unblockCardStmt.run(now, card.id);
          }
        }
      }
    } else if (action === "remove") {
      await deleteCardForUser(tx, originalToken.id, userId);
    }
  });

  return { createdCount, ensuredCount };
}

export interface FoundationProposalInput {
  question: string;
  concept: string;
  domain: string;
  title?: string;
  context?: string;
  bloom_level?: number;
  symbiosis_mode?: string | null;
  source_link?: string | null;
  exists: boolean;
  slug?: string | null;
}

export interface ConfirmFoundationsResult {
  createdCount: number;
  linkedCount: number;
}

/**
 * Confirm foundations import.
 * Reuses existing tokens or creates new ones, then links them as prerequisites to the original card.
 */
export async function confirmFoundations(
  db: Database,
  userId: string,
  originalSlug: string,
  proposals: FoundationProposalInput[],
): Promise<ConfirmFoundationsResult> {
  const originalToken = await getTokenBySlug(db, originalSlug);
  if (!originalToken) {
    throw new Error(`Original token not found: ${originalSlug}`);
  }

  let createdCount = 0;
  let linkedCount = 0;

  await db.transaction(async (tx) => {
    const originalCard = await getCard(tx, originalToken.id, userId);
    if (!originalCard) {
      throw new Error(
        `Card not found for token ${originalSlug} and user ${userId}`,
      );
    }

    for (const card of proposals) {
      let targetTokenId: string;

      if (card.exists && card.slug) {
        const existingToken = await getTokenBySlug(tx, card.slug);
        if (!existingToken) {
          throw new Error(`Prerequisite token not found by slug: ${card.slug}`);
        }
        targetTokenId = existingToken.id;

        const existingCard = await getCard(tx, existingToken.id, userId);
        if (!existingCard) {
          await ensureCard(tx, existingToken.id, userId);
        }
        linkedCount++;
      } else {
        const bloom = (
          card.bloom_level !== undefined ? card.bloom_level : 1
        ) as BloomLevel;
        if (bloom < 1 || bloom > 5) {
          throw new Error(`bloom_level must be between 1 and 5, got ${bloom}`);
        }

        let symbiosisMode: SymbiosisMode | null = null;
        if (card.symbiosis_mode) {
          if (
            !["shadowing", "copilot", "autonomy", "none"].includes(
              card.symbiosis_mode,
            )
          ) {
            throw new Error(`Invalid symbiosis_mode: ${card.symbiosis_mode}`);
          }
          symbiosisMode =
            card.symbiosis_mode === "none"
              ? null
              : (card.symbiosis_mode as SymbiosisMode);
        }

        const baseText =
          card.question && card.question.trim().length > 0
            ? card.question
            : card.concept;
        const cleanDomain = slugify(card.domain || "");
        const cleanBase = slugify(baseText);
        let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
        if (baseSlug.length > 60) {
          baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
        }
        if (!baseSlug) {
          baseSlug = "token";
        }

        let token = await getTokenBySlug(tx, baseSlug);
        if (!token) {
          const finalSlug = await generateTokenSlug(
            tx,
            card.domain,
            card.concept,
            card.question,
          );
          token = await createToken(tx, {
            slug: finalSlug,
            title: card.title,
            concept: card.concept,
            domain: card.domain,
            bloom_level: bloom,
            context: card.context || "",
            symbiosis_mode: symbiosisMode,
            source_link: card.source_link || originalToken.source_link || null,
            question: card.question || null,
          });
          createdCount++;
        }
        targetTokenId = token.id;

        const existingCard = await getCard(tx, token.id, userId);
        if (!existingCard) {
          await ensureCard(tx, token.id, userId);
        }
      }

      if (targetTokenId === originalToken.id) {
        throw new Error("A token cannot be a prerequisite of itself");
      }

      await assertPrerequisiteDoesNotCreateCycle(
        tx,
        originalToken.id,
        targetTokenId,
      );

      await tx
        .prepare(
          "INSERT INTO prerequisites (token_id, requires_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
        )
        .run(originalToken.id, targetTokenId);
    }
  });

  return { createdCount, linkedCount };
}

export interface SourceProposalInput {
  question: string;
  concept: string;
  domain: string;
  title?: string;
  bloom_level: number;
  symbiosis_mode: string;
  excerpt: string;
  page_number?: string | null;
  provider?: string | null;
  topic_id?: string | null;
  source_id?: string | null;
  /** Explicit prerequisite slugs (in-batch or existing). If omitted, auto-inferred. */
  prerequisites?: string[];
}

/**
 * Apply source proposals on an open database handle (caller may wrap in a transaction).
 *
 * Creates tokens, ensures cards, and wires prerequisite edges. When a proposal
 * carries explicit `prerequisites`, those slugs are used (in-batch or existing).
 * Otherwise prerequisites are inferred from bloom level and domain: a token
 * links to the highest-bloom same-domain token that precedes it in the batch,
 * or to existing lower-bloom tokens in the same domain from the database.
 */
export async function applySourceProposals(
  db: Database,
  userId: string,
  sourceId: string,
  proposals: SourceProposalInput[],
): Promise<ConfirmFoundationsResult> {
  let createdCount = 0;
  let linkedCount = 0;

  // ── Pass 1: create / link tokens ────────────────────────────────────────
  const slugByIndex: string[] = [];
  const tokenBySlug = new Map<string, Token>();

  for (const card of proposals) {
    const cardSourceId = card.source_id || sourceId;
    const source = await db
      .prepare("SELECT id FROM sources WHERE id = ?")
      .get(cardSourceId);
    if (!source) {
      throw new Error(`Source not found: ${cardSourceId}`);
    }

    const baseText =
      card.question && card.question.trim().length > 0
        ? card.question
        : card.concept;
    const cleanDomain = slugify(card.domain || "");
    const cleanBase = slugify(baseText);
    let baseSlug = cleanDomain ? `${cleanDomain}-${cleanBase}` : cleanBase;
    if (baseSlug.length > 60) {
      baseSlug = baseSlug.slice(0, 60).replace(/-$/, "");
    }
    if (!baseSlug) {
      baseSlug = "token";
    }

    let token = await getTokenBySlug(db, baseSlug);
    if (!token) {
      const finalSlug = await generateTokenSlug(
        db,
        card.domain,
        card.concept,
        card.question,
      );
      const bloom = (
        card.bloom_level !== undefined ? card.bloom_level : 1
      ) as BloomLevel;
      let symbiosisMode: SymbiosisMode | null = null;
      if (card.symbiosis_mode && card.symbiosis_mode !== "none") {
        symbiosisMode = card.symbiosis_mode as SymbiosisMode;
      }

      token = await createToken(db, {
        slug: finalSlug,
        title: card.title,
        concept: card.concept,
        domain: card.domain,
        bloom_level: bloom,
        context: card.excerpt || "",
        symbiosis_mode: symbiosisMode,
        question: card.question || null,
        provider: card.provider || null,
        topic_id: card.topic_id || null,
      });
      createdCount++;
    } else {
      linkedCount++;
      if (!token.provider && card.provider) {
        await updateToken(db, token.slug, {
          provider: card.provider,
          topic_id: card.topic_id || null,
        });
      }
    }

    slugByIndex.push(token.slug);
    tokenBySlug.set(token.slug, token);

    const existingCard = await getCard(db, token.id, userId);
    if (!existingCard) {
      await ensureCard(db, token.id, userId);
    }

    await db
      .prepare(
        `INSERT INTO token_sources (token_id, source_id, excerpt, page_number)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(token_id, source_id) DO UPDATE SET
           excerpt = excluded.excerpt,
           page_number = excluded.page_number`,
      )
      .run(
        token.id,
        cardSourceId,
        card.excerpt || "",
        card.page_number || null,
      );
  }

  // ── Pass 2: wire prerequisite edges ─────────────────────────────────────
  for (let i = 0; i < proposals.length; i++) {
    const card = proposals[i];
    const tokenSlug = slugByIndex[i];
    const token = tokenBySlug.get(tokenSlug);
    if (!token) continue;

    const prereqTokens: Token[] = [];

    if (card.prerequisites && card.prerequisites.length > 0) {
      for (const ref of card.prerequisites) {
        const target = await resolvePrerequisiteToken(
          db,
          ref,
          tokenBySlug,
          proposals,
          slugByIndex,
        );
        if (target) prereqTokens.push(target);
      }
    }

    // Auto-infer if no explicit prerequisites matched or were provided
    if (prereqTokens.length === 0) {
      const inferredSlugs = await inferPrerequisitesFromBatch(
        proposals,
        i,
        tokenBySlug,
        db,
      );
      for (const slug of inferredSlugs) {
        const target =
          tokenBySlug.get(slug) ?? (await getTokenBySlug(db, slug));
        if (target) prereqTokens.push(target);
      }
    }

    for (const prereqToken of prereqTokens) {
      if (prereqToken.id === token.id) continue;

      // Cycle check via recursive CTE
      const cycleCheck = (await db
        .prepare(
          `WITH RECURSIVE dependents(token_id) AS (
             SELECT token_id FROM prerequisites WHERE requires_id = ?
             UNION
             SELECT p.token_id FROM prerequisites p
             JOIN dependents d ON p.requires_id = d.token_id
           )
           SELECT COUNT(*) as n FROM dependents WHERE token_id = ?`,
        )
        .get(prereqToken.id, token.id)) as { n: number };
      if (cycleCheck.n > 0) continue;

      await db
        .prepare(
          "INSERT INTO prerequisites (token_id, requires_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
        )
        .run(token.id, prereqToken.id);
    }
  }

  return { createdCount, linkedCount };
}

/**
 * Confirm source import transaction.
 * Saves tokens, maps them to the source in token_sources, and ensures cards exist for the user.
 */
export async function confirmSourceImport(
  db: Database,
  userId: string,
  sourceId: string,
  proposals: SourceProposalInput[],
): Promise<ConfirmFoundationsResult> {
  let result: ConfirmFoundationsResult = { createdCount: 0, linkedCount: 0 };
  await db.transaction(async (tx) => {
    result = await applySourceProposals(tx, userId, sourceId, proposals);
  });
  return result;
}

async function assertPrerequisiteDoesNotCreateCycle(
  db: Database,
  tokenId: string,
  prerequisiteId: string,
): Promise<void> {
  const cycleCheck = (await db
    .prepare(
      `WITH RECURSIVE dependents(token_id) AS (
         SELECT token_id FROM prerequisites WHERE requires_id = ?
         UNION
         SELECT p.token_id FROM prerequisites p
         JOIN dependents d ON p.requires_id = d.token_id
       )
       SELECT COUNT(*) as n FROM dependents WHERE token_id = ?`,
    )
    .get(tokenId, prerequisiteId)) as { n: number };

  if (cycleCheck.n > 0) {
    throw new Error("Cannot add prerequisite: would create a cycle");
  }
}
