import { describe, expect, it } from "vitest";
import {
  openDatabase,
  registerPostgresPasswordSupplier,
  resetPostgresPasswordSuppliers,
} from "../../src/kernel/db/connection.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import {
  applySchemaAndMigrations,
  CURRENT_SCHEMA_VERSION,
} from "../../src/kernel/db/provision.js";

/**
 * `openDatabase` with a PostgreSQL target (ADR 2026-09-04 Decisions 3 and 6):
 * the password comes from a supplier called per new connection, the schema is
 * never provisioned from a learner's connection, and an unprovisioned or
 * stale library is a clear message rather than DDL.
 *
 *   npm run pg:up   →   POSTGRES_URL=... vitest run tests/kernel/postgres-open.test.ts
 */
const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

function parseUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 5432),
    database: u.pathname.replace(/^\//, ""),
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
  };
}

describeWithPostgres(
  "openDatabase against PostgreSQL (needs POSTGRES_URL)",
  () => {
    const url = POSTGRES_URL as string;
    const parsed = parseUrl(url);
    const schema = "zam_open_target";

    async function withSchema<T>(fn: () => Promise<T>): Promise<T> {
      const admin = openPostgresDatabase({ connectionString: url });
      await admin.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.exec(`CREATE SCHEMA ${schema}`);
      await admin.close();
      try {
        return await fn();
      } finally {
        const cleanup = openPostgresDatabase({ connectionString: url });
        await cleanup.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        await cleanup.close();
      }
    }

    /** The target used by the tests — the search_path pins the test schema. */
    function target(overrides: Record<string, unknown> = {}) {
      return {
        host: parsed.host,
        port: parsed.port,
        // `options=-c search_path=…` is not expressible through the credential
        // block, so the schema is selected via the role's default instead.
        database: parsed.database,
        username: parsed.username,
        auth: "password" as const,
        password: parsed.password,
        ssl: false,
        ...overrides,
      };
    }

    async function provisionInSchema(): Promise<void> {
      const db = openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
      await applySchemaAndMigrations(db);
      await db.close();
    }

    async function setRoleSearchPath(path: string): Promise<void> {
      const admin = openPostgresDatabase({ connectionString: url });
      await admin.exec(
        `ALTER ROLE "${parsed.username}" SET search_path = ${path}`,
      );
      await admin.close();
    }

    it("refuses an unprovisioned library instead of running DDL as a learner", async () => {
      await withSchema(async () => {
        await setRoleSearchPath(schema);
        try {
          await expect(openDatabase({ postgres: target() })).rejects.toThrow(
            /not provisioned yet[\s\S]*zam team provision/,
          );
          const probe = openPostgresDatabase({
            connectionString: `${url}?options=-c%20search_path%3D${schema}`,
          });
          const tables = (await probe
            .prepare(
              "SELECT count(*) AS n FROM information_schema.tables WHERE table_schema = ?",
            )
            .get(schema)) as { n: number | string };
          await probe.close();
          expect(Number(tables.n)).toBe(0);
        } finally {
          await setRoleSearchPath("public");
        }
      });
    });

    it("opens a provisioned library with a per-connection password supplier", async () => {
      await withSchema(async () => {
        await provisionInSchema();
        await setRoleSearchPath(schema);
        resetPostgresPasswordSuppliers();
        // entra-cli without a registered supplier is a typed refusal…
        await expect(
          openDatabase({ postgres: target({ auth: "entra-cli" }) }),
        ).rejects.toThrow(/ENTRA_LOGIN_REQUIRED/);

        let supplied = 0;
        registerPostgresPasswordSupplier("entra-cli", async () => {
          supplied += 1;
          return parsed.password;
        });
        try {
          const db = await openDatabase({
            postgres: target({ auth: "entra-cli" }),
          });
          expect(db.dialect).toBe("postgres");
          const version = (await db
            .prepare(
              "SELECT version FROM zam_schema_version WHERE singleton = 1",
            )
            .get()) as { version: number };
          expect(Number(version.version)).toBe(CURRENT_SCHEMA_VERSION);
          await db.close();
          // …and with one the supplier was asked for the password.
          expect(supplied).toBeGreaterThanOrEqual(1);
        } finally {
          resetPostgresPasswordSuppliers();
          await setRoleSearchPath("public");
        }
      });
    });
  },
);
