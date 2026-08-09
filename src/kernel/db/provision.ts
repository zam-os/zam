/**
 * Schema provisioning — the one place that turns an empty database into a ZAM
 * database, expressed purely through the async `Database` contract.
 *
 * This module is deliberately **free of Node built-ins**. `connection.ts` owns
 * file paths, drivers and credentials and therefore imports `node:fs`, which a
 * WebView cannot load. The mobile companion runs the same kernel inside that
 * WebView, so from the moment iOS opens its own local database (ADR
 * 2026-08-08) it needs the schema and the migration chain without dragging the
 * driver layer along.
 *
 * `connection.ts` calls straight into here, so there is exactly one migration
 * path for every platform — a second copy would drift the day someone adds
 * M021 on one side only.
 */

import { SCHEMA_INDEXES, SCHEMA_TABLES } from "./schema.js";
import type { Database } from "./types.js";

/** Column names of a table, or an empty list when the table does not exist. */
async function columnsOf(db: Database, table: string): Promise<string[]> {
  const rows = (await db.pragma(`table_info(${table})`)) as Array<{
    name: string;
  }>;
  return rows.map((row) => row.name);
}

/**
 * Run incremental schema migrations. Every migration is idempotent — safe to
 * run on every open, on a fresh file and on a decade-old library alike.
 */
export async function runMigrations(db: Database): Promise<void> {
  // M001: add execution_context to sessions
  const sessionCols = await columnsOf(db, "sessions");
  if (sessionCols.length > 0 && !sessionCols.includes("execution_context")) {
    await db.exec(
      `ALTER TABLE sessions ADD COLUMN execution_context TEXT NOT NULL DEFAULT 'shell'`,
    );
  }

  // M002: add deprecated_at to tokens
  const tokenCols = await columnsOf(db, "tokens");
  if (tokenCols.length > 0 && !tokenCols.includes("deprecated_at")) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN deprecated_at TEXT`);
  }

  // M004: add source_link to tokens
  if (tokenCols.length > 0 && !tokenCols.includes("source_link")) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN source_link TEXT`);
  }

  // M005: add question to tokens
  if (tokenCols.length > 0 && !tokenCols.includes("question")) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN question TEXT`);
  }

  // M003: create agent_skills table (idempotent via IF NOT EXISTS in SCHEMA,
  // but also needed for databases that skipped the init path)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS agent_skills (
      id          TEXT PRIMARY KEY,
      slug        TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      steps       TEXT NOT NULL DEFAULT '[]',
      token_slugs TEXT NOT NULL DEFAULT '[]',
      source      TEXT NOT NULL DEFAULT 'learned',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // M006: persist confirmed monitor-derived ratings for audit and idempotence.
  await db.exec(`
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
    )
  `);

  // M007: create sources and token_sources tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sources (
      id          TEXT PRIMARY KEY,
      type        TEXT NOT NULL CHECK (type IN ('file', 'web', 'scan')),
      uri         TEXT NOT NULL UNIQUE,
      content     TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_sources (
      token_id    TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
      source_id   TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      excerpt     TEXT NOT NULL DEFAULT '',
      page_number TEXT,
      PRIMARY KEY (token_id, source_id)
    )
  `);

  // M008: add provider and topic_id columns to tokens table
  if (tokenCols.length > 0) {
    if (!tokenCols.includes("provider")) {
      await db.exec(`ALTER TABLE tokens ADD COLUMN provider TEXT`);
    }
    if (!tokenCols.includes("topic_id")) {
      await db.exec(`ALTER TABLE tokens ADD COLUMN topic_id TEXT`);
    }
  }

  // M009: create token_embeddings table (semantic search, ADR 2026-07-03)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_embeddings (
      token_id     TEXT PRIMARY KEY REFERENCES tokens(id) ON DELETE CASCADE,
      embedding    BLOB NOT NULL,
      model        TEXT NOT NULL,
      dims         INTEGER NOT NULL,
      content_hash TEXT NOT NULL,
      embedded_at  TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // M010: add title column to tokens for human-friendly graph display
  // (separate from slug; supports Unicode, no domain prefix, auto-generated)
  if (tokenCols.length > 0 && !tokenCols.includes("title")) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN title TEXT NOT NULL DEFAULT ''`,
    );
  }

  // M011: add indexes for title search and domain prefix filtering
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tokens_title ON tokens(title)`);
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_tokens_domain ON tokens(domain)`,
  );

  // M012: create contexts and token_contexts tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS contexts (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL UNIQUE,
      label      TEXT,
      language   TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS token_contexts (
      token_id   TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
      context_id TEXT NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
      PRIMARY KEY (token_id, context_id)
    )
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_token_contexts_context ON token_contexts(context_id)
  `);

  // M013: add question provenance to tokens (ADR 2026-06-15 item 3).
  // The column default 'llm' doubles as the backfill: pre-provenance rows
  // (and rows from old snapshots, which INSERT without this column) count
  // as LLM-era content. Human-authored questions are marked 'manual' by the
  // API layer (createToken/updateToken) from now on.
  if (tokenCols.length > 0 && !tokenCols.includes("question_source")) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN question_source TEXT NOT NULL DEFAULT 'llm'`,
    );
  }

  // M014: token maintenance state (ADR 2026-07-18). NULL = healthy; a
  // timestamp marks the token as needing repair (stale source binding,
  // ambiguous re-import) — its cards leave the review queue until cleared.
  if (tokenCols.length > 0 && !tokenCols.includes("maintenance_at")) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN maintenance_at TEXT`);
    await db.exec(`ALTER TABLE tokens ADD COLUMN maintenance_reason TEXT`);
  }

  // M015: content versioning for curated libraries (ADR 2026-07-04 Decision 3).
  // A token carries the version of its *substance*; a card records which
  // version its owner actually learned. Only a curator's **material** change
  // bumps the token, so `card.learned_content_version < token.content_version`
  // means exactly "this learner has not been re-tested since the meaning
  // changed" — the card is set due and the next rating recalibrates FSRS.
  //
  // Both default to 1, which is the backfill: existing tokens and cards are in
  // sync on migration and nobody is re-tested for upgrading.
  if (tokenCols.length > 0 && !tokenCols.includes("content_version")) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN content_version INTEGER NOT NULL DEFAULT 1`,
    );
  }
  const cardCols = await columnsOf(db, "cards");
  if (cardCols.length > 0 && !cardCols.includes("learned_content_version")) {
    await db.exec(
      `ALTER TABLE cards ADD COLUMN learned_content_version INTEGER NOT NULL DEFAULT 1`,
    );
  }

  // M016: provenance columns for published revisions (ADR 2026-07-04 Phase 1).
  if (tokenCols.length > 0 && !tokenCols.includes("published_by")) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN published_by TEXT`);
    await db.exec(`ALTER TABLE tokens ADD COLUMN published_at TEXT`);
  }

  // M017: editorial state for tokens (ADR 2026-07-04 Phase 3).
  if (tokenCols.length > 0 && !tokenCols.includes("editorial_state")) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN editorial_state TEXT NOT NULL DEFAULT 'published'`,
    );
    await db.exec(
      `UPDATE tokens SET editorial_state = 'deprecated' WHERE deprecated_at IS NOT NULL`,
    );
  }

  // M018: knowledge assignments (ADR 2026-07-04 Decision 10).
  if (cardCols.length > 0 && !cardCols.includes("assigned_by")) {
    await db.exec(`ALTER TABLE cards ADD COLUMN assigned_by TEXT`);
    await db.exec(
      `ALTER TABLE cards ADD COLUMN assignment_id TEXT REFERENCES assignments(id) ON DELETE SET NULL`,
    );
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS assignments (
      id           TEXT PRIMARY KEY,
      token_id     TEXT NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
      assigner_id  TEXT NOT NULL,
      assignee_id  TEXT NOT NULL,
      due_date     TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      withdrawn_at TEXT
    );
  `);

  // M019: "not for me" (ADR 2026-07-04 Decision 10). Distinct from deleting:
  // detaching stops scheduling but keeps the card and its review history, so
  // a learner can decline shared content without destroying what they did.
  // NULL = attached, which is the backfill for every existing card.
  if (cardCols.length > 0 && !cardCols.includes("detached_at")) {
    await db.exec(`ALTER TABLE cards ADD COLUMN detached_at TEXT`);
  }

  // M020: persist the zero-based cursor for short learning and relearning
  // steps (ADR 2026-08-09). NULL is the compatibility backfill: legacy cards
  // keep their state and graduate on their next successful answer rather than
  // being forced through a newly introduced sequence from the beginning.
  if (cardCols.length > 0 && !cardCols.includes("learning_step")) {
    await db.exec(`ALTER TABLE cards ADD COLUMN learning_step INTEGER`);
  }
}

/**
 * Bring any database up to the current schema. Safe to call unconditionally:
 * every statement is `IF NOT EXISTS` or guarded, so this is the whole setup on
 * an empty database and a no-op on a current one.
 *
 * The three-step order is load-bearing. Indexes come **after** the migrations
 * because some of them cover columns a migration adds: `idx_tokens_title`
 * needs `tokens.title`, which M010 introduces. Creating tables and indexes in
 * one pass works on an empty database and fails on one provisioned before that
 * migration — the case the companion hits when it attaches an older server
 * database.
 */
export async function applySchemaAndMigrations(db: Database): Promise<void> {
  await db.exec(SCHEMA_TABLES);
  await runMigrations(db);
  await db.exec(SCHEMA_INDEXES);
}
