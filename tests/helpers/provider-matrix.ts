/**
 * Provider matrix for kernel model suites (ADR 2026-09-04 Decision 5).
 *
 * The kernel's queries are provider-neutral by contract, but the only proof
 * is running the real suites against a real PostgreSQL — the toy tables of the
 * provider contract never caught a `datetime('now')` comparison or a
 * `strftime` bucket. Wrap a suite in `describeWithProviders` and it runs once
 * on local SQLite and, when `POSTGRES_URL` is set (always in CI, locally via
 * `npm run pg:up`), once more on a schema-isolated PostgreSQL database.
 *
 * Each test gets a fresh, fully provisioned database; the PostgreSQL leg uses
 * one schema per suite (`search_path`) so a failed run cannot poison the next.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe } from "vitest";
import { openDatabase } from "../../src/kernel/db/connection.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database, SqlDialect } from "../../src/kernel/db/types.js";

export interface ProvidedDatabase {
  db: Database;
  cleanup(): Promise<void>;
}

export interface TestProvider {
  dialect: SqlDialect;
  name: string;
  open(): Promise<ProvidedDatabase>;
}

const POSTGRES_URL = process.env.POSTGRES_URL;

function sqliteProvider(): TestProvider {
  return {
    dialect: "sqlite",
    name: "SQLite",
    async open() {
      const dir = mkdtempSync(join(tmpdir(), "zam-matrix-"));
      const db = await openDatabase({
        dbPath: join(dir, "zam.db"),
        initialize: true,
        useConfiguredCloud: false,
      });
      return {
        db,
        async cleanup() {
          await db.close();
          rmSync(dir, { recursive: true, force: true });
        },
      };
    },
  };
}

function postgresProvider(schema: string): TestProvider {
  const url = POSTGRES_URL as string;
  const admin = () => openPostgresDatabase({ connectionString: url });
  return {
    dialect: "postgres",
    name: "PostgreSQL",
    async open() {
      const control = admin();
      await control.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await control.exec(`CREATE SCHEMA ${schema}`);
      await control.close();
      const db = openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
      await applySchemaAndMigrations(db);
      return {
        db,
        async cleanup() {
          await db.close();
          const control = admin();
          await control.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
          await control.close();
        },
      };
    },
  };
}

/**
 * Run `body` once per available provider. `schema` names the PostgreSQL
 * schema the suite owns — unique per suite, lowercase, no dashes.
 */
export function describeWithProviders(
  name: string,
  schema: string,
  body: (provider: TestProvider) => void,
): void {
  const providers = [sqliteProvider()];
  if (POSTGRES_URL) providers.push(postgresProvider(schema));
  for (const provider of providers) {
    describe(`${name} [${provider.name}]`, () => body(provider));
  }
}
