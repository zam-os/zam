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

import { ulid } from "ulid";
import { SCHEMA_INDEXES, SCHEMA_TABLES } from "./schema.js";
import type { Database } from "./types.js";

/**
 * Increment whenever a numbered migration is added — a database stamped with
 * this version skips the chain entirely, so a migration added without the bump
 * never runs on any existing library. `tests/kernel/provision.test.ts` guards
 * the constant against the M-series markers below.
 */
export const CURRENT_SCHEMA_VERSION = 33;

const SCHEMA_VERSION_TABLE = "zam_schema_version";

function isMissingSchemaVersionTable(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "42P01") return true; // PostgreSQL undefined_table

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.toLowerCase().includes(SCHEMA_VERSION_TABLE) &&
    (/no such table/i.test(message) || /does not exist/i.test(message))
  );
}

/** Read the marker without turning transport/authentication failures into DDL. */
async function readSchemaVersion(db: Database): Promise<number | null> {
  let row: { version?: unknown } | undefined;
  try {
    row = (await db
      .prepare(
        `SELECT version FROM ${SCHEMA_VERSION_TABLE} WHERE singleton = 1`,
      )
      .get()) as { version?: unknown } | undefined;
  } catch (error) {
    if (isMissingSchemaVersionTable(error)) return null;
    throw error;
  }

  if (row?.version == null) return null;
  const version = Number(row.version);
  return Number.isSafeInteger(version) && version >= 0 ? version : null;
}

async function writeSchemaVersion(db: Database): Promise<void> {
  await db
    .prepare(
      `INSERT INTO ${SCHEMA_VERSION_TABLE} (singleton, version)
       VALUES (1, ?)
       ON CONFLICT(singleton) DO UPDATE SET version = excluded.version`,
    )
    .run(CURRENT_SCHEMA_VERSION);
}

/** Column names of a table, or an empty list when the table does not exist. */
async function columnsOf(db: Database, table: string): Promise<string[]> {
  const rows = (await db.pragma(`table_info(${table})`)) as Array<{
    name: string;
  }>;
  return rows.map((row) => row.name);
}

interface LegacySessionSynthesisRow {
  session_id: string;
  token_id: string;
  card_id: string;
  inferred_rating: number;
  confirmed_rating: number;
  confidence: string;
  evidence: string;
  review_log_id: string;
  session_step_id: string;
  created_at: string;
}

/**
 * Replace the (session_id, token_id) synthesis key with a row id plus an
 * optional attempt_id. Two real attempts in one session must not collapse.
 */
async function migrateSessionSynthesesToAttemptKeyed(
  db: Database,
): Promise<void> {
  const cols = await columnsOf(db, "session_syntheses");
  if (cols.length === 0 || cols.includes("id")) return;

  // A run interrupted between the copy and the rename leaves a half-filled
  // staging table behind; copying into it again would duplicate every row.
  // Start from an empty staging table and make copy, drop and rename one
  // transaction so the legacy table is only gone once its rows are over.
  await db.exec(`DROP TABLE IF EXISTS session_syntheses_m031`);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS session_syntheses_m031 (
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
  `);

  await db.transaction(async (tx) => {
    const rows = (await tx
      .prepare(
        `SELECT session_id, token_id, card_id, inferred_rating, confirmed_rating,
                confidence, evidence, review_log_id, session_step_id, created_at
           FROM session_syntheses`,
      )
      .all()) as LegacySessionSynthesisRow[];

    for (const row of rows) {
      await tx
        .prepare(
          `INSERT INTO session_syntheses_m031 (
             id, session_id, token_id, attempt_id, card_id, inferred_rating,
             confirmed_rating, confidence, evidence, review_log_id,
             session_step_id, created_at
           ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          ulid(),
          row.session_id,
          row.token_id,
          row.card_id,
          row.inferred_rating,
          row.confirmed_rating,
          row.confidence,
          row.evidence,
          row.review_log_id,
          row.session_step_id,
          row.created_at,
        );
    }

    await tx.exec(`DROP TABLE session_syntheses`);
    await tx.exec(
      `ALTER TABLE session_syntheses_m031 RENAME TO session_syntheses`,
    );
  });
}

const ATOM_BINDING_UNIQUE_INDEX = `CREATE UNIQUE INDEX IF NOT EXISTS ux_atom_binding
   ON atom_curriculum_bindings(
     atom_id, provider, topic_code, COALESCE(grade, -1), track)`;

interface AtomBindingRow {
  atom_id: string;
  provider: string;
  school_type: string;
  grade: number | null;
  track: string;
  subject: string;
  topic_code: string;
  topic_title: string | null;
  exam_relevant: number;
}

/**
 * Collapse the duplicate curriculum bindings M023 allowed to accumulate.
 *
 * Only runs when the unique index refuses to build. Duplicates that agree in
 * every column are reduced to one row by deleting the group and re-inserting a
 * row that actually existed — never a column-wise `MAX()` composite, which can
 * synthesise a record no release ever published. Duplicates that disagree are
 * a curation conflict this migration cannot arbitrate without release
 * provenance, so it fails loudly instead of guessing.
 */
async function collapseDuplicateAtomBindings(db: Database): Promise<void> {
  const rows = (await db
    .prepare(
      `SELECT atom_id, provider, school_type, grade, track, subject,
              topic_code, topic_title, exam_relevant
         FROM atom_curriculum_bindings`,
    )
    .all()) as AtomBindingRow[];

  const groups = new Map<string, AtomBindingRow[]>();
  for (const row of rows) {
    const key = [
      row.atom_id,
      row.provider,
      row.topic_code,
      row.grade ?? -1,
      row.track,
    ].join("\u0000");
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const [first] = group;
    const conflicting = group.some(
      (row) =>
        row.school_type !== first.school_type ||
        row.subject !== first.subject ||
        row.topic_title !== first.topic_title ||
        row.exam_relevant !== first.exam_relevant,
    );
    if (conflicting) {
      throw new Error(
        `M024: conflicting duplicate curriculum bindings for ${first.atom_id} ` +
          `(${first.provider} ${first.topic_code}). Resolve them by hand — ` +
          `this migration will not merge disagreeing rows into a record that ` +
          `was never published.`,
      );
    }
    await db
      .prepare(
        `DELETE FROM atom_curriculum_bindings
          WHERE atom_id = ? AND provider = ? AND topic_code = ?
            AND track = ? AND COALESCE(grade, -1) = ?`,
      )
      .run(
        first.atom_id,
        first.provider,
        first.topic_code,
        first.track,
        first.grade ?? -1,
      );
    await db
      .prepare(
        `INSERT INTO atom_curriculum_bindings
           (atom_id, provider, school_type, grade, track, subject,
            topic_code, topic_title, exam_relevant)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        first.atom_id,
        first.provider,
        first.school_type,
        first.grade,
        first.track,
        first.subject,
        first.topic_code,
        first.topic_title,
        first.exam_relevant,
      );
  }
}

/**
 * Run incremental schema migrations. Every migration is idempotent — safe to
 * repeat on a fresh file and on a decade-old library alike when the schema
 * marker says that provisioning is required.
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

  // M021: stable external identity and provenance for model-free APKG and
  // delimited-text imports (ADR 2026-08-09). Content bindings are global;
  // each learner still gets an independent row in cards.
  await db.exec(`
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
  `);
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_imported_card_bindings_token
       ON imported_card_bindings(token_id)`,
  );

  // M022: bounded, content-addressed Anki media plus temporary personal
  // sibling burying (ADR 2026-08-09 phase 4). Existing cards remain visible.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS media_assets (
      hash          TEXT PRIMARY KEY,
      mime_type     TEXT NOT NULL,
      byte_size     INTEGER NOT NULL CHECK (byte_size >= 0),
      data          BLOB NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
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
  `);
  if (cardCols.length > 0 && !cardCols.includes("buried_until")) {
    await db.exec(`ALTER TABLE cards ADD COLUMN buried_until TEXT`);
  }
  if (cardCols.length > 0 && !cardCols.includes("buried_reason")) {
    await db.exec(`ALTER TABLE cards ADD COLUMN buried_reason TEXT`);
  }
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_imported_card_bindings_note
       ON imported_card_bindings(note_guid)`,
  );
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_token_media_asset ON token_media(asset_hash)`,
  );
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_cards_user_buried
       ON cards(user_id, buried_until)`,
  );

  // M023: published learning atoms (ADR 2026-08-14). Practice items stay
  // on tokens; atom_id is a nullable pointer, not a second FSRS key.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS learning_atoms (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      domain          TEXT NOT NULL DEFAULT '',
      reduction       TEXT NOT NULL DEFAULT '',
      typical_age_min REAL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS atom_alignments (
      atom_id         TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
      target_uri      TEXT NOT NULL,
      target_label    TEXT,
      alignment_type  TEXT NOT NULL,
      provenance      TEXT,
      PRIMARY KEY (atom_id, target_uri)
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS atom_curriculum_bindings (
      atom_id         TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
      provider        TEXT NOT NULL,
      school_type     TEXT NOT NULL DEFAULT '',
      grade           INTEGER,
      track           TEXT NOT NULL DEFAULT '',
      subject         TEXT NOT NULL DEFAULT '',
      topic_code      TEXT NOT NULL,
      topic_title     TEXT,
      exam_relevant   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (atom_id, provider, topic_code, grade, track)
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS atom_prerequisites (
      atom_id     TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
      requires_id TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
      kind        TEXT NOT NULL DEFAULT 'hard' CHECK (kind IN ('hard', 'soft')),
      rationale   TEXT,
      PRIMARY KEY (atom_id, requires_id)
    );
  `);
  if (tokenCols.length > 0 && !tokenCols.includes("atom_id")) {
    await db.exec(`ALTER TABLE tokens ADD COLUMN atom_id TEXT`);
  }
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_tokens_atom ON tokens(atom_id)`,
  );
  await db.exec(
    `CREATE INDEX IF NOT EXISTS idx_atom_bindings_provider
       ON atom_curriculum_bindings(provider, topic_code)`,
  );

  // M024: make a curriculum binding without a grade idempotent. M023 put the
  // nullable `grade` into the primary key, and NULL never equals NULL — so
  // `ON CONFLICT` never fired and every re-install appended another copy of the
  // same binding. The operative constraint becomes a unique index over
  // COALESCE(grade, -1); the column stays nullable, because "names no grade" is
  // a real statement about a Lernbereich, not a sentinel.
  //
  // The legacy composite primary key is deliberately left in place on migrated
  // databases. It constrains a strict subset of what the index constrains, so
  // it is redundant rather than wrong — and keeping it avoids a table rebuild,
  // which could not be made both crash-resumable and provider-neutral here.
  // Fresh databases get the table without it (see schema.ts).
  //
  // Creating the index is the whole migration on the common path. It only fails
  // when a database already accumulated the duplicates M023 permitted, and that
  // failure is the signal to collapse them and retry. Both steps are repeatable
  // on their own, so an abort at any point leaves the next run able to finish.
  try {
    await db.exec(ATOM_BINDING_UNIQUE_INDEX);
  } catch {
    await collapseDuplicateAtomBindings(db);
    await db.exec(ATOM_BINDING_UNIQUE_INDEX);
  }

  // M026: opaque published atom identity (ADR 2026-08-14 Decision 8).
  //
  // M023 minted `atom:zam:<namespace>:<slug>` and called it opaque. It was not:
  // a subject partition sat in the primary key, so moving an atom under a
  // better taxonomy would have been an identity migration across every
  // published tile — the pattern ADR 2026-07-04 already rejected one level
  // down for tokens. Row identity is a ULID, the published identity the opaque
  // `atom_uri`, and namespace/slug are the mutable address.
  //
  // There is deliberately **no rewrite of legacy ids**. M023 never left this
  // feature branch — no tag contains `learning_atoms`, and neither does `main`
  // — so no database outside a one-day branch checkout can hold the old form.
  // The rewrite that used to live here minted a fresh `ulid()` per row, which
  // gave the same atom a different identity on every machine that ran it and
  // then wedged the next install against the fixtures' fixed ids. Pilot
  // projections are rebuilt, not migrated (ADR 2026-08-14 Decision 9): a
  // checkout from that window deletes its `~/.zam/zam.db` and reinstalls.
  const atomCols = await columnsOf(db, "learning_atoms");
  if (atomCols.length > 0) {
    if (!atomCols.includes("atom_uri")) {
      await db.exec(`ALTER TABLE learning_atoms ADD COLUMN atom_uri TEXT`);
    }
    if (!atomCols.includes("namespace")) {
      await db.exec(
        `ALTER TABLE learning_atoms ADD COLUMN namespace TEXT NOT NULL DEFAULT ''`,
      );
    }
    if (!atomCols.includes("slug")) {
      await db.exec(
        `ALTER TABLE learning_atoms ADD COLUMN slug TEXT NOT NULL DEFAULT ''`,
      );
    }
  }
  await db.exec(`
    CREATE TABLE IF NOT EXISTS atom_uri_aliases (
      alias      TEXT PRIMARY KEY,
      atom_id    TEXT NOT NULL REFERENCES learning_atoms(id) ON DELETE CASCADE,
      noted_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(
    `CREATE UNIQUE INDEX IF NOT EXISTS ux_learning_atom_uri
       ON learning_atoms(atom_uri)`,
  );

  // M025: PracticeItem substance (ADR 2026-08-14, owner decision 2026-08-14).
  // Tiles already carried language, interaction tier and the structured fast
  // check; the installer accepted and dropped all three, so a published item
  // could not be read back as it was published. They are substance, not
  // presentation: changing one is a material revision.
  if (tokenCols.length > 0) {
    if (!tokenCols.includes("language")) {
      await db.exec(`ALTER TABLE tokens ADD COLUMN language TEXT`);
    }
    if (!tokenCols.includes("tier")) {
      await db.exec(`ALTER TABLE tokens ADD COLUMN tier TEXT`);
    }
    if (!tokenCols.includes("fast_check")) {
      await db.exec(`ALTER TABLE tokens ADD COLUMN fast_check TEXT`);
    }
  }

  // M027: record which content_version a review was actually answered against
  // (ADR 2026-08-14 Decision 9).
  //
  // The log kept the rating and the timestamp but not the wording. Personal
  // learning evidence is the part of a learner's state that must survive a
  // rebuild of the knowledge base, and a rating whose question is unknown
  // cannot be classified as "same item" or "materially revised" later.
  // `cards.learned_content_version` holds only the current value, so it cannot
  // answer the question for a review that happened three revisions ago.
  //
  // NULL means "written before this column existed", not version 1 — the
  // distinction matters, because guessing 1 would fabricate evidence.
  const reviewLogCols = await columnsOf(db, "review_logs");
  if (reviewLogCols.length > 0 && !reviewLogCols.includes("content_version")) {
    await db.exec(`ALTER TABLE review_logs ADD COLUMN content_version INTEGER`);
  }

  // M028: declared practice-item replacements (ADR 2026-08-14 Decision 9).
  //
  // A mapping from an old item id to its successor is an editorial statement
  // with a human author. Nothing derives it: question equality, slug similarity
  // and embedding proximity may propose a mapping, but none may decide one.
  // The tile that ships the successor carries the declaration; this table is
  // where it is kept, so the evidence survives the tile.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS practice_item_replacements (
      old_item_id  TEXT NOT NULL,
      new_item_id  TEXT NOT NULL,
      declared_by  TEXT NOT NULL,
      noted_at     TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (old_item_id, new_item_id)
    );
  `);

  // M029: provider-neutral schema version marker. The table belongs in both
  // the current schema and the migration chain, but the row is deliberately
  // not written here: applySchemaAndMigrations stamps it only after the final
  // index batch succeeds, so an interrupted provisioning run remains repairable.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS zam_schema_version (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      version   INTEGER NOT NULL CHECK (version >= 0)
    );
  `);

  // M030: presentation records for atom sibling separation. A queue fetch is
  // not an exposure; reservation/confirmation is written immediately before
  // display. Abandoned reservations are not presentations.
  await db.exec(`
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
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_card_presentations_day
      ON card_presentations(user_id, learning_day, atom_id);
  `);
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_card_presentations_card
      ON card_presentations(card_id);
  `);

  // M031: observed-attempt identity. Direct submit, monitor/UI candidates
  // and synthesis share one attempt ULID so the same work cannot create two
  // FSRS reviews. Historical ratings keep a NULL attempt_id.
  await db.exec(`
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
  `);
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_review_attempts_session
      ON review_attempts(session_id, token_id, evidence_key);
  `);
  const reviewLogColsM031 = await columnsOf(db, "review_logs");
  if (
    reviewLogColsM031.length > 0 &&
    !reviewLogColsM031.includes("attempt_id")
  ) {
    await db.exec(`ALTER TABLE review_logs ADD COLUMN attempt_id TEXT`);
  }
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_review_logs_attempt ON review_logs(attempt_id);
  `);
  await migrateSessionSynthesesToAttemptKeyed(db);

  // M032: a presentation is not an attempt. The admission hands the surface
  // an attempt id and remembers it on the presentation; once that attempt is
  // rated or recorded, the next admission of the same card mints a new one,
  // so a same-day learning step is new evidence rather than a replay. Tiles
  // also declare which practice item represents its atom for derived edges;
  // the flag has to live on the token because edges are reconciled from the
  // stored atom graph, not from the tile that happens to be installing.
  const presentationColsM032 = await columnsOf(db, "card_presentations");
  if (
    presentationColsM032.length > 0 &&
    !presentationColsM032.includes("attempt_id")
  ) {
    await db.exec(`ALTER TABLE card_presentations ADD COLUMN attempt_id TEXT`);
  }
  const tokenColsM032 = await columnsOf(db, "tokens");
  if (
    tokenColsM032.length > 0 &&
    !tokenColsM032.includes("edge_representative")
  ) {
    await db.exec(
      `ALTER TABLE tokens ADD COLUMN edge_representative INTEGER NOT NULL DEFAULT 0`,
    );
  }

  // M033: check-then-insert cannot exclude a sibling across PostgreSQL
  // connections. One live presentation per atom (and per card) per learner
  // and local day is the uniqueness the admission path relies on.
  await db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_card_presentations_atom_day
      ON card_presentations(user_id, learning_day, atom_id)
      WHERE atom_id IS NOT NULL AND abandoned_at IS NULL
  `);
  await db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_card_presentations_card_day
      ON card_presentations(user_id, learning_day, card_id)
      WHERE abandoned_at IS NULL
  `);
}

/**
 * Bring any database up to the current schema through the complete provisioning
 * path. Every statement is `IF NOT EXISTS` or guarded, so this is safe on both
 * an empty database and a current one.
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
  await writeSchemaVersion(db);
}

/**
 * Bring a database up to date, using one prepared read on the everyday path.
 *
 * A newer marker also skips migrations: releases add migrations monotonically,
 * and an older client must never attempt to downgrade a library already opened
 * by a newer one. Missing or invalid markers take the full repairable path.
 *
 * The marker is trusted, so this does not re-create schema objects dropped
 * from an already-stamped database. Repairing one is `applySchemaAndMigrations`
 * directly, which `openDatabase({ initialize: true })` still reaches.
 */
export async function ensureSchemaAndMigrations(db: Database): Promise<void> {
  const version = await readSchemaVersion(db);
  if (version !== null && version >= CURRENT_SCHEMA_VERSION) return;
  await applySchemaAndMigrations(db);
}
