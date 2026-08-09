/**
 * ZAM Learning Kernel — SQLite Schema
 *
 * Evolves the PoC's schema with:
 * - FSRS scheduling fields (replaces SM-2's ef/interval_days)
 * - Bloom taxonomy levels on tokens
 * - Symbiosis modes (shadowing/copilot/autonomy)
 * - ULID-based IDs
 * - Immutable review log
 */

/**
 * Table definitions only. Split from the indexes because some indexes cover
 * columns that migrations add (`idx_tokens_title` needs M010's `tokens.title`),
 * so provisioning an older database has to run: tables → migrations → indexes.
 * See `applySchemaAndMigrations` in provision.ts.
 */
export const SCHEMA_TABLES = `
-- PRAGMAs (WAL, foreign_keys) are set programmatically in connection.ts,
-- not here, because libsql embedded replicas manage their own WAL.

-- Knowledge tokens: atomic concepts/facts with Bloom levels
CREATE TABLE IF NOT EXISTS tokens (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL DEFAULT '',
  concept       TEXT NOT NULL,
  domain        TEXT NOT NULL DEFAULT '',
  bloom_level   INTEGER NOT NULL DEFAULT 1 CHECK (bloom_level BETWEEN 1 AND 5),
  context       TEXT NOT NULL DEFAULT '',
  symbiosis_mode TEXT CHECK (symbiosis_mode IN ('shadowing', 'copilot', 'autonomy')),
  source_link   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  deprecated_at TEXT,
  question      TEXT,
  provider      TEXT,
  topic_id      TEXT,
  -- Who authored the current question ('manual' | 'llm' | 'template');
  -- validated in code, not via CHECK. Column default is 'llm' so unlabeled
  -- writes (pre-M013 rows, old snapshot restores) count as LLM-era content;
  -- createToken() defaults to 'manual' for API callers instead.
  question_source TEXT NOT NULL DEFAULT 'llm',
  -- Maintenance state (ADR 2026-07-18): when set, the token's binding to
  -- its source is unclear (e.g. stale source_link after an article split,
  -- or an ambiguous re-import). Cards of a token in maintenance are
  -- excluded from scheduling until repaired; learning state is preserved.
  maintenance_at     TEXT,
  -- Version of the token's *substance* (ADR 2026-07-04 Decision 3). Only a
  -- curator's material change bumps it; cosmetic edits (typo, phrasing) leave
  -- it alone so nobody is re-tested for a reworded question.
  content_version    INTEGER NOT NULL DEFAULT 1,
  maintenance_reason TEXT,
  -- Provenance for content revisions (ADR 2026-07-04 Phase 1).
  published_by       TEXT,
  published_at       TEXT,
  -- Editorial state (ADR 2026-07-04 Phase 3: 'draft' | 'in_review' | 'published' | 'deprecated').
  editorial_state    TEXT NOT NULL DEFAULT 'published'
);

-- Prerequisite dependency graph: "to learn A, first know B"
CREATE TABLE IF NOT EXISTS prerequisites (
  token_id    TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  requires_id TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  PRIMARY KEY (token_id, requires_id)
);

-- Knowledge assignments (ADR 2026-07-04 Decision 10)
CREATE TABLE IF NOT EXISTS assignments (
  id           TEXT PRIMARY KEY,
  token_id     TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  assigner_id  TEXT NOT NULL,
  assignee_id  TEXT NOT NULL,
  due_date     TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  withdrawn_at TEXT
);

-- Per-user scheduling state for each token (FSRS fields)
CREATE TABLE IF NOT EXISTS cards (
  id            TEXT PRIMARY KEY,
  token_id      TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL,
  stability     REAL NOT NULL DEFAULT 0.0,
  difficulty    REAL NOT NULL DEFAULT 0.5,
  elapsed_days  REAL NOT NULL DEFAULT 0.0,
  scheduled_days REAL NOT NULL DEFAULT 0.0,
  reps          INTEGER NOT NULL DEFAULT 0,
  lapses        INTEGER NOT NULL DEFAULT 0,
  state         TEXT NOT NULL DEFAULT 'new' CHECK (state IN ('new', 'learning', 'review', 'relearning')),
  -- Zero-based position in the active learning/relearning step sequence.
  -- NULL for new/review cards and legacy cards awaiting their next answer.
  learning_step INTEGER,
  due_at        TEXT NOT NULL DEFAULT (datetime('now')),
  last_review_at TEXT,
  blocked       INTEGER NOT NULL DEFAULT 0,
  -- Which content_version of the token this learner actually learned. Lower
  -- than the token's means a material change has landed since and the card is
  -- awaiting a re-test (ADR 2026-07-04 Decision 3).
  learned_content_version INTEGER NOT NULL DEFAULT 1,
  -- Assignment binding provenance (ADR 2026-07-04 Decision 10).
  assigned_by   TEXT,
  assignment_id TEXT REFERENCES assignments(id) ON DELETE SET NULL,
  -- "Not for me" (ADR 2026-07-04 Decision 10): the learner declined this
  -- shared content. Stops scheduling but keeps the card and its review
  -- history — unlike deleting, which destroys both. NULL = attached.
  detached_at   TEXT,
  UNIQUE(token_id, user_id)
);

-- Work+learning sessions
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  task          TEXT NOT NULL,
  started_at    TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at  TEXT
);

-- Immutable review log: every rating event
CREATE TABLE IF NOT EXISTS review_logs (
  id              TEXT PRIMARY KEY,
  card_id         TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  token_id        TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 4),
  response_time_ms INTEGER,
  reviewed_at     TEXT NOT NULL DEFAULT (datetime('now')),
  scheduled_at    TEXT NOT NULL,
  session_id      TEXT REFERENCES sessions(id)
);

-- Steps within a session: who did what
CREATE TABLE IF NOT EXISTS session_steps (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token_id    TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  done_by     TEXT NOT NULL CHECK (done_by IN ('user', 'agent')),
  rating      INTEGER CHECK (rating BETWEEN 1 AND 4),
  notes       TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Confirmed ratings synthesized from monitor evidence.
-- The composite primary key makes repeated synthesis idempotent per token.
CREATE TABLE IF NOT EXISTS session_syntheses (
  session_id       TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token_id         TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  card_id          TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  inferred_rating  INTEGER NOT NULL CHECK (inferred_rating BETWEEN 1 AND 4),
  confirmed_rating INTEGER NOT NULL CHECK (confirmed_rating BETWEEN 1 AND 4),
  confidence       TEXT NOT NULL CHECK (confidence IN ('medium', 'high')),
  evidence         TEXT NOT NULL DEFAULT '{}',
  review_log_id    TEXT NOT NULL REFERENCES review_logs(id) ON DELETE CASCADE,
  session_step_id  TEXT NOT NULL REFERENCES session_steps(id) ON DELETE CASCADE,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (session_id, token_id)
);

-- Sources: textbook files, web links, or scan paths
CREATE TABLE IF NOT EXISTS sources (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('file', 'web', 'scan')),
  uri         TEXT NOT NULL UNIQUE,
  content     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Token sources: mapping between tokens and their sources
CREATE TABLE IF NOT EXISTS token_sources (
  token_id    TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  source_id   TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  excerpt     TEXT NOT NULL DEFAULT '',
  page_number TEXT,
  PRIMARY KEY (token_id, source_id)
);

-- User configuration
CREATE TABLE IF NOT EXISTS user_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Token embeddings: one vector per token for semantic search (ADR 2026-07-03).
-- Not a column on tokens: hot paths do SELECT * FROM tokens and a ~3KB blob
-- per row would ride along on all of them.
CREATE TABLE IF NOT EXISTS token_embeddings (
  token_id     TEXT PRIMARY KEY REFERENCES tokens(id) ON DELETE CASCADE,
  embedding    BLOB NOT NULL,
  model        TEXT NOT NULL,
  dims         INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  embedded_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agent skills: task recipes the agent learns from user guidance
CREATE TABLE IF NOT EXISTS agent_skills (
  id          TEXT PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  steps       TEXT NOT NULL DEFAULT '[]',       -- JSON array of step strings
  token_slugs TEXT NOT NULL DEFAULT '[]',       -- JSON array of related token slugs
  source      TEXT NOT NULL DEFAULT 'learned'
    CHECK(source IN ('learned', 'builtin')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Knowledge contexts: work, school, private
CREATE TABLE IF NOT EXISTS contexts (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  label      TEXT,
  language   TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Join table mapping tokens to their knowledge contexts
CREATE TABLE IF NOT EXISTS token_contexts (
  token_id   TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  context_id TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  PRIMARY KEY (token_id, context_id)
);

`;

/** Performance indexes. Applied after migrations — see `SCHEMA_TABLES`. */
export const SCHEMA_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_tokens_domain ON tokens(domain);
CREATE INDEX IF NOT EXISTS idx_tokens_slug ON tokens(slug);
CREATE INDEX IF NOT EXISTS idx_prereqs_token ON prerequisites(token_id);
CREATE INDEX IF NOT EXISTS idx_prereqs_requires ON prerequisites(requires_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_due ON cards(user_id, blocked, due_at);
CREATE INDEX IF NOT EXISTS idx_cards_token_user ON cards(token_id, user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_card ON review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_user ON review_logs(user_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_session_steps_session ON session_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_tokens_title ON tokens(title);
CREATE INDEX IF NOT EXISTS idx_token_contexts_context ON token_contexts(context_id);
`;

/**
 * The full schema, tables then indexes. Safe on a database that is already
 * current (every statement is `IF NOT EXISTS`); on one that predates a
 * column-adding migration, use `applySchemaAndMigrations` instead.
 */
export const SCHEMA = `${SCHEMA_TABLES}${SCHEMA_INDEXES}`;
