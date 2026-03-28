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

export const SCHEMA = `
-- PRAGMAs (WAL, foreign_keys) are set programmatically in connection.ts,
-- not here, because libsql embedded replicas manage their own WAL.

-- Knowledge tokens: atomic concepts/facts with Bloom levels
CREATE TABLE IF NOT EXISTS tokens (
  id            TEXT PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  concept       TEXT NOT NULL,
  domain        TEXT NOT NULL DEFAULT '',
  bloom_level   INTEGER NOT NULL DEFAULT 1 CHECK (bloom_level BETWEEN 1 AND 5),
  context       TEXT NOT NULL DEFAULT '',
  symbiosis_mode TEXT CHECK (symbiosis_mode IN ('shadowing', 'copilot', 'autonomy')),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
  deprecated_at TEXT
);

-- Prerequisite dependency graph: "to learn A, first know B"
CREATE TABLE IF NOT EXISTS prerequisites (
  token_id    TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  requires_id TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  PRIMARY KEY (token_id, requires_id)
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
  due_at        TEXT NOT NULL DEFAULT (datetime('now')),
  last_review_at TEXT,
  blocked       INTEGER NOT NULL DEFAULT 0,
  UNIQUE(token_id, user_id)
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

-- Work+learning sessions
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  task          TEXT NOT NULL,
  started_at    TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at  TEXT
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

-- User configuration
CREATE TABLE IF NOT EXISTS user_config (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
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

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tokens_domain ON tokens(domain);
CREATE INDEX IF NOT EXISTS idx_tokens_slug ON tokens(slug);
CREATE INDEX IF NOT EXISTS idx_prereqs_token ON prerequisites(token_id);
CREATE INDEX IF NOT EXISTS idx_prereqs_requires ON prerequisites(requires_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_due ON cards(user_id, blocked, due_at);
CREATE INDEX IF NOT EXISTS idx_cards_token_user ON cards(token_id, user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_card ON review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_user ON review_logs(user_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_session_steps_session ON session_steps(session_id);
`;
