import { describe, expect, it } from "vitest";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";

/**
 * Schema provisioning against a **real** PostgreSQL.
 *
 * `runMigrations` is a single path shared by every `Database` implementation,
 * and the Codex hardening review (H1) found the first version of M024 reaching
 * straight into `sqlite_master` on it — a table PostgreSQL does not have. The
 * existing PostgreSQL suites did not catch it: `postgres-provider.test.ts`
 * exercises only the translation helpers, and the provider contract never
 * provisions the ZAM schema. So the migration path itself was untested on the
 * provider it could break.
 *
 * This closes that hole. It skips without `POSTGRES_URL` for the same reason
 * the RLS suite does, and is wired the same way:
 *
 *   npm run pg:up && npm run pg:test
 *
 * CI sets `POSTGRES_URL` for the whole run (`postgres:17-alpine`), so it runs
 * there automatically.
 */

const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

/** A schema-isolated database, so a failed run cannot poison the next one. */
async function freshSchema(name: string): Promise<Database> {
  const admin = openPostgresDatabase({
    connectionString: POSTGRES_URL as string,
  });
  await admin.exec(`DROP SCHEMA IF EXISTS ${name} CASCADE`);
  await admin.exec(`CREATE SCHEMA ${name}`);
  await admin.close();
  return openPostgresDatabase({
    connectionString: `${POSTGRES_URL}?options=-c%20search_path%3D${name}`,
  });
}

/**
 * Leave nothing behind: these schemas hold tables named like the real ones, and
 * an unqualified `pg_class` lookup elsewhere in the suite would otherwise get
 * an answer about the wrong `cards`.
 */
async function dropSchema(name: string): Promise<void> {
  const admin = openPostgresDatabase({
    connectionString: POSTGRES_URL as string,
  });
  await admin.exec(`DROP SCHEMA IF EXISTS ${name} CASCADE`);
  await admin.close();
}

describeWithPostgres("PostgreSQL provisioning (needs POSTGRES_URL)", () => {
  it("provisions the whole schema and stays repeatable", async () => {
    const db = await freshSchema("zam_provision_a");
    try {
      await applySchemaAndMigrations(db);
      // Running it again is the everyday case: provisioning happens on open.
      await applySchemaAndMigrations(db);

      const tokenColumns = (await db.pragma("table_info(tokens)")) as Array<{
        name: string;
      }>;
      expect(tokenColumns.map((column) => column.name)).toEqual(
        expect.arrayContaining([
          "atom_id",
          "language",
          "tier",
          "fast_check",
          "content_version",
        ]),
      );

      const atomColumns = (await db.pragma(
        "table_info(atom_curriculum_bindings)",
      )) as Array<{ name: string }>;
      expect(atomColumns.length).toBeGreaterThan(0);
    } finally {
      await db.close();
      await dropSchema("zam_provision_a");
    }
  });

  // H1: the migration used to reach into sqlite_master here.
  it("makes a grade-less binding idempotent on PostgreSQL too", async () => {
    const db = await freshSchema("zam_provision_b");
    try {
      await applySchemaAndMigrations(db);
      await db
        .prepare("INSERT INTO learning_atoms (id, title) VALUES (?, ?)")
        .run("01K3X9A7R4B8C1D2E3F4G5B002", "PG");

      const insert = `INSERT INTO atom_curriculum_bindings
           (atom_id, provider, school_type, grade, track, subject,
            topic_code, topic_title, exam_relevant)
         VALUES (?, 'lp', 'realschule', NULL, '', 'physik', 'T1', ?, 0)
         ON CONFLICT (atom_id, provider, topic_code, COALESCE(grade, -1), track)
         DO UPDATE SET topic_title = excluded.topic_title`;

      for (const title of ["Optik", "Optik", "Optik"]) {
        await db.prepare(insert).run("01K3X9A7R4B8C1D2E3F4G5B002", title);
      }

      const row = (await db
        .prepare("SELECT COUNT(*) AS n FROM atom_curriculum_bindings")
        .get()) as { n: number | string };
      expect(Number(row.n)).toBe(1);
    } finally {
      await db.close();
      await dropSchema("zam_provision_b");
    }
  });
});
