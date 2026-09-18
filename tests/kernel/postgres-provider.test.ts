import { describe, expect, it } from "vitest";
import {
  openPostgresDatabase,
  translatePlaceholders,
  translateSqlForPostgres,
} from "../../src/kernel/db/postgres.js";

describe("PostgreSQL provider helpers", () => {
  it("translates ? placeholders to $1, $2, ... outside string literals", () => {
    expect(
      translatePlaceholders(
        "SELECT * FROM tokens WHERE slug = ? AND domain = ?",
      ),
    ).toBe("SELECT * FROM tokens WHERE slug = $1 AND domain = $2");

    expect(
      translatePlaceholders(
        "SELECT 'is this ? a question' AS text, ? AS param",
      ),
    ).toBe("SELECT 'is this ? a question' AS text, $1 AS param");
  });

  it("translates SQLite DDL and datetime keywords for PostgreSQL", () => {
    // ISO-8601 UTC text with millisecond precision — byte-compatible with the
    // `toISOString()` values the kernel writes, unlike a bare timestamptz
    // cast (ADR 2026-09-04 Decision 5).
    expect(translateSqlForPostgres("DEFAULT (datetime('now'))")).toBe(
      `DEFAULT (to_char(timezone('UTC', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))`,
    );
    expect(
      translateSqlForPostgres("UPDATE t SET updated_at = datetime('now')"),
    ).toBe(
      `UPDATE t SET updated_at = to_char(timezone('UTC', now()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
    );
    expect(
      translateSqlForPostgres("id INTEGER PRIMARY KEY AUTOINCREMENT"),
    ).toBe("id SERIAL PRIMARY KEY");
    expect(translateSqlForPostgres("weight REAL, payload BLOB")).toBe(
      "weight DOUBLE PRECISION, payload BYTEA",
    );
  });
});
