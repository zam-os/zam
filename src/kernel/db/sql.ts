/**
 * Provider-neutral SQL helpers (ADR 2026-09-04 Decision 5).
 *
 * The kernel used to lean on SQLite's `datetime('now')`, `date(...)` and
 * `strftime(...)` inside its queries, which PostgreSQL either rejects or
 * evaluates differently (a `TEXT` column compared against a `timestamp`).
 * The rule now: **every instant the kernel writes or compares is an ISO-8601
 * UTC string produced by JavaScript and passed as a parameter.** Schema
 * defaults keep `datetime('now')` on SQLite; the PostgreSQL provider
 * translates that default to an expression yielding the same kind of ISO
 * text, so both engines store comparable values.
 */

import type { Database, SqlDialect } from "./types.js";

/** The instant `now` (default: the current time) as the kernel stores it. */
export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

/** Dialect of a database handle; providers that do not declare one are SQLite. */
export function dialectOf(db: Pick<Database, "dialect">): SqlDialect {
  return db.dialect ?? "sqlite";
}

const SQLITE_UTC_TIMESTAMP = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
const HAS_ZONE_DESIGNATOR = /(?:[zZ]|[+-]\d{2}:?\d{2})$/;

/**
 * Epoch milliseconds of a stored timestamp, treating zone-less values as UTC.
 *
 * Three shapes exist in real libraries: ISO strings with `Z` (what the kernel
 * writes), SQLite's `YYYY-MM-DD HH:MM:SS` (schema defaults and older rows,
 * UTC by SQLite's definition), and zone-less `YYYY-MM-DDTHH:MM:SS` from early
 * importers. `Date.parse` reads the last two as *local* time, which shifts a
 * review by the learner's UTC offset; this parser does not. Returns `NaN` for
 * text that is not a timestamp at all.
 */
export function parseStoredTimestampUtc(value: string): number {
  const text = value.trim();
  if (SQLITE_UTC_TIMESTAMP.test(text)) {
    return Date.parse(`${text.replace(" ", "T")}Z`);
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(text) && !HAS_ZONE_DESIGNATOR.test(text)) {
    return Date.parse(`${text}Z`);
  }
  return Date.parse(text);
}

/**
 * PostgreSQL expression that yields the current instant as the same ISO-8601
 * UTC text JavaScript's `toISOString()` produces (millisecond precision, `Z`).
 * Used when translating SQLite's `datetime('now')` schema defaults so text
 * comparisons against kernel-written values stay meaningful.
 */
export const POSTGRES_ISO_NOW_SQL = `to_char(timezone('UTC', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
