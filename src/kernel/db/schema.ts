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

-- Provider-neutral schema marker. A current database open reads this one row
-- instead of replaying every idempotent migration over a remote connection.
-- The row itself is written only after tables, migrations and indexes succeed.
CREATE TABLE IF NOT EXISTS zam_schema_version (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  version   INTEGER NOT NULL CHECK (version >= 0)
);

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
  editorial_state    TEXT NOT NULL DEFAULT 'published',
  -- Published learning atom this practice item realises (ADR 2026-08-14).
  atom_id            TEXT,
  -- PracticeItem substance (ADR 2026-08-14, owner decision): the language it is
  -- asked in, the interaction tier, and the structured fast-check payload.
  -- Substance, not presentation — changing one is a material revision, because
  -- a learner who mastered a German binary check has not mastered an English
  -- free recall of the same objective.
  language           TEXT,
  tier               TEXT,
  fast_check         TEXT,
  -- Declared edge representative of its atom (KVT tile flag, M032). Token
  -- prerequisites derived from atom edges point at this item; without the
  -- flag the first published Tier-1 item by id represents the atom.
  edge_representative INTEGER NOT NULL DEFAULT 0
);

-- Stable provenance for deterministic local-file imports (ADR 2026-08-09).
-- The imported content is shared; personal scheduling remains in cards.
CREATE TABLE IF NOT EXISTS imported_card_bindings (
  id            TEXT PRIMARY KEY,
  external_id   TEXT NOT NULL UNIQUE,
  token_id      TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  format        TEXT NOT NULL CHECK (format IN ('apkg', 'csv', 'tsv')),
  source_name   TEXT NOT NULL,
  note_guid     TEXT,
  card_ordinal  INTEGER,
  deck_path     TEXT NOT NULL DEFAULT '',
  tags_json     TEXT NOT NULL DEFAULT '[]',
  source        TEXT,
  author        TEXT,
  license       TEXT,
  content_hash  TEXT NOT NULL,
  metadata_hash TEXT NOT NULL,
  imported_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Untrusted package media is stored by digest, never by an archive path.
-- Multiple imported cards can therefore share one bounded, verified payload.
CREATE TABLE IF NOT EXISTS media_assets (
  hash          TEXT PRIMARY KEY,
  mime_type     TEXT NOT NULL,
  byte_size     INTEGER NOT NULL CHECK (byte_size >= 0),
  data          BLOB NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Presentation-safe media attached to one side of a token. Image-occlusion
-- geometry is declarative JSON; no Anki template code is retained or run.
CREATE TABLE IF NOT EXISTS token_media (
  token_id       TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  asset_hash     TEXT NOT NULL REFERENCES media_assets(hash) ON DELETE RESTRICT,
  side           TEXT NOT NULL CHECK (side IN ('question', 'answer')),
  kind           TEXT NOT NULL CHECK (kind IN ('image', 'audio')),
  ordinal        INTEGER NOT NULL DEFAULT 0 CHECK (ordinal >= 0),
  original_name  TEXT NOT NULL,
  alt_text       TEXT,
  occlusion_json TEXT,
  PRIMARY KEY (token_id, side, ordinal)
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
  -- Temporary, personal queue suppression. Sibling burying expires at the
  -- learner's next local day and never changes FSRS state.
  buried_until  TEXT,
  buried_reason TEXT,
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

-- Confirmed and reserved presentations of a practice item. A queue fetch is
-- not an exposure; reservation/confirmation happens immediately before display.
-- Abandoned reservations release the atom sibling slot and are not exposures.
CREATE TABLE IF NOT EXISTS card_presentations (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  card_id       TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  token_id      TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  atom_id       TEXT,
  session_id    TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  learning_day  TEXT NOT NULL,
  time_zone     TEXT NOT NULL,
  reserved_at   TEXT NOT NULL,
  presented_at  TEXT,
  abandoned_at  TEXT,
  -- Attempt id handed to the surface at admission (M032). A presentation is
  -- not an attempt: once this id is rated or recorded, the next admission of
  -- the same card mints a new one, so a same-day learning step is new evidence.
  attempt_id    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
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
  session_id      TEXT REFERENCES sessions(id),
  -- Which content_version of the token this rating was actually earned on
  -- (ADR 2026-08-14 Decision 9). Observed learning evidence is the durable
  -- half of a learner's state; a rating whose wording is unknown cannot be
  -- classified later as the same item or a materially revised one. NULL means
  -- the row predates this column -- not version 1, because assuming 1 would
  -- invent evidence.
  content_version INTEGER,
  -- Shared attempt identity (Phase 4). NULL means a historical rating with
  -- no attempt record; never invent a match from text similarity.
  attempt_id      TEXT
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

-- Observed attempts: one identity for direct submit, monitor/UI candidates,
-- confirmation and synthesis. Same attempt → one review; a different
-- independent attempt is new evidence even in the same session.
CREATE TABLE IF NOT EXISTS review_attempts (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  card_id          TEXT REFERENCES cards(id) ON DELETE SET NULL,
  token_id         TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  content_version  INTEGER,
  session_id       TEXT REFERENCES sessions(id) ON DELETE SET NULL,
  activity         TEXT NOT NULL DEFAULT '',
  actor            TEXT NOT NULL CHECK (actor IN ('user', 'agent')),
  permitted_tools  TEXT NOT NULL DEFAULT '[]',
  assistance       TEXT NOT NULL DEFAULT '',
  independent      INTEGER,
  channel          TEXT NOT NULL,
  evidence         TEXT NOT NULL DEFAULT '{}',
  evidence_key     TEXT,
  suggested_rating INTEGER CHECK (suggested_rating BETWEEN 1 AND 4),
  rating           INTEGER CHECK (rating BETWEEN 1 AND 4),
  review_log_id    TEXT REFERENCES review_logs(id) ON DELETE SET NULL,
  session_step_id  TEXT REFERENCES session_steps(id) ON DELETE SET NULL,
  status           TEXT NOT NULL CHECK (status IN ('suggestion', 'recorded', 'rated', 'conflict')),
  conflict_note    TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Confirmed ratings synthesized from monitor evidence.
-- Row identity is the attempt, not (session, token): two real attempts in
-- one session must not collapse. A missing attempt_id is a historical row.
CREATE TABLE IF NOT EXISTS session_syntheses (
  id               TEXT PRIMARY KEY,
  session_id       TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  token_id         TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
  attempt_id       TEXT UNIQUE,
  card_id          TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  inferred_rating  INTEGER CHECK (inferred_rating BETWEEN 1 AND 4),
  confirmed_rating INTEGER NOT NULL CHECK (confirmed_rating BETWEEN 1 AND 4),
  confidence       TEXT NOT NULL CHECK (confidence IN ('medium', 'high')),
  evidence         TEXT NOT NULL DEFAULT '{}',
  review_log_id    TEXT NOT NULL REFERENCES review_logs(id) ON DELETE CASCADE,
  session_step_id  TEXT NOT NULL REFERENCES session_steps(id) ON DELETE CASCADE,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
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

-- Published learning atoms and their n:m facets (ADR 2026-08-14).
CREATE TABLE IF NOT EXISTS learning_atoms (
  -- Row identity is a ULID like everything else (AGENTS.md). The published
  -- identity is atom_uri, opaque by construction; namespace and slug are the
  -- readable address and may change without breaking a single reference
  -- (ADR 2026-08-14, Decision 8).
  id              TEXT PRIMARY KEY,
  atom_uri        TEXT UNIQUE,
  namespace       TEXT NOT NULL DEFAULT '',
  slug            TEXT NOT NULL DEFAULT '',
  title           TEXT NOT NULL,
  domain          TEXT NOT NULL DEFAULT '',
  reduction       TEXT NOT NULL DEFAULT '',
  typical_age_min REAL,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Every address an atom was ever published under. A renamed namespace or a
-- merged atom stays resolvable instead of becoming a dangling reference.
CREATE TABLE IF NOT EXISTS atom_uri_aliases (
  alias      TEXT PRIMARY KEY,
  atom_id    TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
  noted_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS atom_alignments (
  atom_id         TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
  target_uri      TEXT NOT NULL,
  target_label    TEXT,
  alignment_type  TEXT NOT NULL,
  provenance      TEXT,
  PRIMARY KEY (atom_id, target_uri)
);

CREATE TABLE IF NOT EXISTS atom_curriculum_bindings (
  atom_id         TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,
  school_type     TEXT NOT NULL DEFAULT '',
  grade           INTEGER,
  track           TEXT NOT NULL DEFAULT '',
  subject         TEXT NOT NULL DEFAULT '',
  topic_code      TEXT NOT NULL,
  topic_title     TEXT,
  exam_relevant   INTEGER NOT NULL DEFAULT 0
);


CREATE TABLE IF NOT EXISTS atom_prerequisites (
  atom_id     TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
  requires_id TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL DEFAULT 'hard' CHECK (kind IN ('hard', 'soft')),
  rationale   TEXT,
  PRIMARY KEY (atom_id, requires_id)
);

-- Declared succession between practice items (ADR 2026-08-14 Decision 9).
--
-- A mapping from a retired item to its successor is an editorial statement by
-- a named publisher, never a derivation: question equality, slug similarity
-- and embedding proximity may propose one, none may decide one. The tile that
-- ships the successor carries the declaration; this table outlives the tile,
-- so the evidence is still here when the central model arrives.
--
-- Deliberately no foreign key on either side: the old item may already be gone
-- and the new one may not be installed yet, and losing the statement in either
-- case is exactly the loss this table exists to prevent.
CREATE TABLE IF NOT EXISTS practice_item_replacements (
  old_item_id  TEXT NOT NULL,
  new_item_id  TEXT NOT NULL,
  declared_by  TEXT NOT NULL,
  noted_at     TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (old_item_id, new_item_id)
);

`;

/** Performance indexes. Applied after migrations — see `SCHEMA_TABLES`. */
export const SCHEMA_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_tokens_domain ON tokens(domain);
CREATE INDEX IF NOT EXISTS idx_imported_card_bindings_token ON imported_card_bindings(token_id);
CREATE INDEX IF NOT EXISTS idx_imported_card_bindings_note ON imported_card_bindings(note_guid);
CREATE INDEX IF NOT EXISTS idx_token_media_asset ON token_media(asset_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_slug ON tokens(slug);
CREATE INDEX IF NOT EXISTS idx_prereqs_token ON prerequisites(token_id);
CREATE INDEX IF NOT EXISTS idx_prereqs_requires ON prerequisites(requires_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_due ON cards(user_id, blocked, due_at);
CREATE INDEX IF NOT EXISTS idx_cards_user_buried ON cards(user_id, buried_until);
CREATE INDEX IF NOT EXISTS idx_cards_token_user ON cards(token_id, user_id);
CREATE INDEX IF NOT EXISTS idx_card_presentations_day
  ON card_presentations(user_id, learning_day, atom_id);
CREATE INDEX IF NOT EXISTS idx_card_presentations_card
  ON card_presentations(card_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_card_presentations_atom_day
  ON card_presentations(user_id, learning_day, atom_id)
  WHERE atom_id IS NOT NULL AND abandoned_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_card_presentations_card_day
  ON card_presentations(user_id, learning_day, card_id)
  WHERE abandoned_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_review_logs_card ON review_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_user ON review_logs(user_id, reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_logs_attempt ON review_logs(attempt_id);
CREATE INDEX IF NOT EXISTS idx_review_attempts_session
  ON review_attempts(session_id, token_id, evidence_key);
CREATE INDEX IF NOT EXISTS idx_session_steps_session ON session_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_tokens_title ON tokens(title);
CREATE INDEX IF NOT EXISTS idx_token_contexts_context ON token_contexts(context_id);
CREATE INDEX IF NOT EXISTS idx_tokens_atom ON tokens(atom_id);
CREATE INDEX IF NOT EXISTS idx_atom_bindings_provider
  ON atom_curriculum_bindings(provider, topic_code);
-- Uniqueness over COALESCE(grade, -1) rather than a composite key: grade is
-- nullable ("this Lernbereich names no year"), and NULL never equals NULL, so a
-- composite PRIMARY KEY let the same binding re-insert on every install. M024
-- repairs databases that already accumulated those duplicates, which is why
-- this lives with the indexes — it must run after that migration, not before.
CREATE UNIQUE INDEX IF NOT EXISTS ux_atom_binding
  ON atom_curriculum_bindings(
    atom_id, provider, topic_code, COALESCE(grade, -1), track);
`;

/**
 * The full schema, tables then indexes. Safe on a database that is already
 * current (every statement is `IF NOT EXISTS`); on one that predates a
 * column-adding migration, use `applySchemaAndMigrations` instead.
 */
export const SCHEMA = `${SCHEMA_TABLES}${SCHEMA_INDEXES}`;
