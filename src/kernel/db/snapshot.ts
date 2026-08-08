/**
 * Portable database snapshots — Increment 12, Phase 4.
 *
 * A snapshot is portable SQL text: a one-line JSON manifest comment followed by
 * `INSERT` statements for every data row. It deliberately does NOT copy the
 * live WAL database file, so a user can move their learning history between
 * machines through a file-sync folder (Google Drive, OneDrive, iCloud, …)
 * without risking the corruption that comes from syncing an open SQLite/WAL
 * file directly.
 *
 * The schema is NOT embedded. Importing into a freshly initialized database —
 * which always runs the current SCHEMA + migrations on open — keeps snapshots
 * forward compatible across schema changes. Columns are written explicitly so a
 * later-added column never breaks an older snapshot.
 */

import { sha256Hex } from "../util/sha256.js";
import type { Database } from "./types.js";

export const SNAPSHOT_FORMAT = "zam-snapshot";
export const SNAPSHOT_VERSION = 1;
const MANIFEST_PREFIX = "-- zam-snapshot: ";

/**
 * Data tables in foreign-key-safe insertion order (parents before children).
 * Deletes for a `force` restore walk this list in reverse.
 *
 * Every schema table must appear here unless its content is derived and
 * recomputable (currently only `token_embeddings`, which is re-embedded on
 * demand and would bloat the SQL text). The snapshot test suite guards this
 * classification against the actual schema.
 */
export const SNAPSHOT_TABLES = [
  "tokens",
  "assignments",
  "sessions",
  "cards",
  "prerequisites",
  "session_steps",
  "review_logs",
  "session_syntheses",
  "user_config",
  "agent_skills",
  "sources",
  "token_sources",
  "contexts",
  "token_contexts",
] as const;

export interface SnapshotManifest {
  format: string;
  version: number;
  createdAt: string;
  /** Row count per table at export time. */
  tables: Record<string, number>;
  /** SHA-256 of the snapshot body (everything after the manifest line). */
  checksum: string;
}

export interface ImportResult {
  /** Row count per table after the restore. */
  tables: Record<string, number>;
  total: number;
}

/** Render one SQL literal for a value read back from the database. */
function quoteValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
  if (value instanceof Uint8Array) {
    let hex = "";
    for (const byte of value) hex += byte.toString(16).padStart(2, "0");
    return `X'${hex}'`;
  }
  throw new Error(`Cannot serialize value of type ${typeof value} to SQL`);
}

/** Column names for a table, in definition order, adapting to migrations. */
async function getColumns(db: Database, table: string): Promise<string[]> {
  const cols = (await db.pragma(`table_info(${table})`)) as Array<{
    name: string;
  }>;
  return cols.map((c) => c.name);
}

async function countRows(db: Database, table: string): Promise<number> {
  const row = (await db
    .prepare(`SELECT COUNT(*) AS n FROM ${table}`)
    .get()) as { n: number };
  return Number(row.n);
}

/**
 * Serialize the active database to a portable SQL-text snapshot.
 */
export async function exportSnapshot(
  db: Database,
  options: { createdAt?: string } = {},
): Promise<string> {
  const createdAt = options.createdAt ?? new Date().toISOString();
  const tables: Record<string, number> = {};
  const sections: string[] = [];

  for (const table of SNAPSHOT_TABLES) {
    const columns = await getColumns(db, table);
    if (columns.length === 0) {
      // Table absent (older/partial database): record zero and skip.
      tables[table] = 0;
      continue;
    }

    const colList = columns.join(", ");
    const rows = (await db
      .prepare(`SELECT ${colList} FROM ${table}`)
      .all()) as Array<Record<string, unknown>>;

    tables[table] = rows.length;
    if (rows.length === 0) continue;

    const lines = [`-- ${table} (${rows.length})`];
    for (const row of rows) {
      const values = columns.map((c) => quoteValue(row[c])).join(", ");
      lines.push(`INSERT INTO ${table} (${colList}) VALUES (${values});`);
    }
    sections.push(lines.join("\n"));
  }

  const body = sections.length > 0 ? `${sections.join("\n\n")}\n` : "";
  const checksum = sha256Hex(body);
  const manifest: SnapshotManifest = {
    format: SNAPSHOT_FORMAT,
    version: SNAPSHOT_VERSION,
    createdAt,
    tables,
    checksum,
  };

  return `${MANIFEST_PREFIX}${JSON.stringify(manifest)}\n${body}`;
}

/** Split a snapshot into its manifest and body; validates the header only. */
export function parseSnapshot(snapshot: string): {
  manifest: SnapshotManifest;
  body: string;
} {
  const newline = snapshot.indexOf("\n");
  const header = (
    newline === -1 ? snapshot : snapshot.slice(0, newline)
  ).trim();
  const body = newline === -1 ? "" : snapshot.slice(newline + 1);

  if (!header.startsWith(MANIFEST_PREFIX)) {
    throw new Error("Not a ZAM snapshot: missing manifest header.");
  }

  let manifest: SnapshotManifest;
  try {
    manifest = JSON.parse(header.slice(MANIFEST_PREFIX.length));
  } catch {
    throw new Error("Snapshot manifest is not valid JSON.");
  }

  if (manifest.format !== SNAPSHOT_FORMAT) {
    throw new Error(`Unsupported snapshot format: ${manifest.format}`);
  }
  if (manifest.version > SNAPSHOT_VERSION) {
    throw new Error(
      `Snapshot version ${manifest.version} is newer than supported ` +
        `(${SNAPSHOT_VERSION}). Upgrade ZAM to import it.`,
    );
  }

  return { manifest, body };
}

/** Parse a snapshot and verify its body checksum. Returns the manifest. */
export function verifySnapshot(snapshot: string): SnapshotManifest {
  const { manifest, body } = parseSnapshot(snapshot);
  const actual = sha256Hex(body);
  if (actual !== manifest.checksum) {
    throw new Error("Snapshot is corrupted: checksum mismatch.");
  }
  return manifest;
}

/**
 * Restore a snapshot into `db`. The database must already carry the current
 * schema (open it with `initialize: true`). Refuses to overwrite a non-empty
 * database unless `force` is set, and verifies row counts inside the
 * transaction so any mismatch rolls the whole restore back.
 */
export async function importSnapshot(
  db: Database,
  snapshot: string,
  options: { force?: boolean } = {},
): Promise<ImportResult> {
  const { manifest, body } = parseSnapshot(snapshot);
  const actual = sha256Hex(body);
  if (actual !== manifest.checksum) {
    throw new Error("Snapshot is corrupted: checksum mismatch.");
  }

  return db.transaction(async (tx) => {
    let existing = 0;
    for (const table of SNAPSHOT_TABLES) {
      existing += await countRows(tx, table);
    }
    if (existing > 0 && !options.force) {
      throw new Error(
        `Target database already holds ${existing} row(s). ` +
          "Pass force to overwrite it.",
      );
    }

    if (options.force) {
      for (const table of [...SNAPSHOT_TABLES].reverse()) {
        await tx.exec(`DELETE FROM ${table};`);
      }
    }

    if (body.trim().length > 0) {
      await tx.exec(body);
    }

    const tables: Record<string, number> = {};
    let total = 0;
    for (const table of SNAPSHOT_TABLES) {
      const count = await countRows(tx, table);
      tables[table] = count;
      total += count;

      const expected = manifest.tables[table] ?? 0;
      if (count !== expected) {
        throw new Error(
          `Restore verification failed for ${table}: ` +
            `expected ${expected} row(s), found ${count}.`,
        );
      }
    }

    return { tables, total };
  });
}
