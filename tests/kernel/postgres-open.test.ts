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
 * The suite owns a login role of its own whose default `search_path` points
 * at the suite's schema — never the shared `POSTGRES_URL` role, whose
 * settings other suites running in parallel rely on.
 *
 *   npm run pg:up   →   npm run pg:test
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
    const role = "zam_open_learner";

    async function withSchema<T>(fn: () => Promise<T>): Promise<T> {
      const admin = openPostgresDatabase({ connectionString: url });
      await admin.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.exec(`CREATE SCHEMA ${schema}`);
      await admin.exec(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN
            CREATE ROLE ${role} LOGIN PASSWORD 'pw' NOSUPERUSER NOBYPASSRLS;
          END IF;
        END
        $$;
        ALTER ROLE ${role} SET search_path = ${schema};
        GRANT USAGE ON SCHEMA ${schema} TO ${role};
        ALTER DEFAULT PRIVILEGES IN SCHEMA ${schema} GRANT SELECT ON TABLES TO ${role};
      `);
      await admin.close();
      try {
        return await fn();
      } finally {
        const cleanup = openPostgresDatabase({ connectionString: url });
        await cleanup.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        await cleanup.exec(
          `DROP OWNED BY ${role}; DROP ROLE IF EXISTS ${role}`,
        );
        await cleanup.close();
      }
    }

    /** The learner target: the suite's own role, whose search_path is the schema. */
    function target(overrides: Record<string, unknown> = {}) {
      return {
        host: parsed.host,
        port: parsed.port,
        database: parsed.database,
        username: role,
        auth: "password" as const,
        password: "pw",
        ssl: false,
        ...overrides,
      };
    }

    async function provisionInSchema(): Promise<void> {
      const db = openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
      await applySchemaAndMigrations(db);
      await db.exec(
        `GRANT SELECT ON ALL TABLES IN SCHEMA ${schema} TO ${role}`,
      );
      await db.close();
    }

    it("refuses an unprovisioned library instead of running DDL as a learner", async () => {
      await withSchema(async () => {
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
      });
    });

    it("opens a provisioned library with a per-connection password supplier", async () => {
      await withSchema(async () => {
        await provisionInSchema();
        resetPostgresPasswordSuppliers();
        // entra-cli without a registered supplier is a typed refusal…
        await expect(
          openDatabase({ postgres: target({ auth: "entra-cli" }) }),
        ).rejects.toThrow(/ENTRA_LOGIN_REQUIRED/);

        let supplied = 0;
        registerPostgresPasswordSupplier("entra-cli", async () => {
          supplied += 1;
          return "pw";
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
        }
      });
    });
  },
);
