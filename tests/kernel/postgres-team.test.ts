import { describe, expect, it } from "vitest";
import {
  addTeamMember,
  listTeamMembers,
  type PrincipalDirectory,
  provisionTeamLibrary,
  removeTeamMember,
  TEAM_CONTEXT_NAME,
} from "../../src/cli/deploy/team-provision.js";
import { resolveLearnerId } from "../../src/cli/users/identity.js";
import {
  openDatabase,
  openPostgresAdministration,
} from "../../src/kernel/db/connection.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import { CURRENT_SCHEMA_VERSION } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";
import { createToken, ensureCard } from "../../src/kernel/index.js";

/**
 * `zam team` end to end on a real PostgreSQL (ADR 2026-09-04 Decisions 2, 7
 * and 8): provision → add-member → connect as that member → review state is
 * private under RLS → remove-member revokes the login. Plain password roles
 * stand in for Entra principals through the injected directory; the Azure
 * flavour differs only in how the login role comes to exist.
 *
 *   npm run pg:up   →   POSTGRES_URL=... vitest run tests/kernel/postgres-team.test.ts
 */
const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

describeWithPostgres("zam team on PostgreSQL (needs POSTGRES_URL)", () => {
  const url = POSTGRES_URL as string;
  const admin = new URL(url);
  const schema = "zam_team";
  const database = admin.pathname.replace(/^\//, "");
  const created: string[] = [];

  /** Local stand-in for pgaadauth: a password role per "principal". */
  const localDirectory: PrincipalDirectory = {
    async ensurePrincipal(upn) {
      const db = openPostgresDatabase({ connectionString: url });
      try {
        await db.exec(`
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${upn}') THEN
              CREATE ROLE "${upn}" LOGIN PASSWORD 'pw' NOSUPERUSER NOBYPASSRLS;
            END IF;
          END
          $$;
          ALTER ROLE "${upn}" SET search_path = ${schema};
        `);
        created.push(upn);
      } finally {
        await db.close();
      }
      return { objectId: `oid-${upn}` };
    },
  };

  function adminDb(): Database {
    return openPostgresDatabase({
      connectionString: `${url}?options=-c%20search_path%3D${schema}`,
    });
  }

  function connectAs(upn: string): Promise<Database> {
    return openDatabase({
      postgres: {
        host: admin.hostname,
        port: Number(admin.port || 5432),
        database,
        username: upn,
        auth: "password",
        password: "pw",
        ssl: false,
      },
    });
  }

  async function reset(): Promise<void> {
    const db = openPostgresDatabase({ connectionString: url });
    try {
      await db.exec(
        `DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema};`,
      );
      for (const upn of new Set(created.splice(0))) {
        await db.exec(`DROP OWNED BY "${upn}"; DROP ROLE IF EXISTS "${upn}";`);
      }
    } finally {
      await db.close();
    }
  }

  it("provisions, maps members, isolates their learning state and revokes logins", async () => {
    await reset();
    try {
      // ── provision (twice: idempotent) ────────────────────────────────
      const control = adminDb();
      try {
        const first = await provisionTeamLibrary(control, { schema });
        expect(first.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
        expect(first.contextCreated).toBe(true);
        const second = await provisionTeamLibrary(control, { schema });
        expect(second.contextCreated).toBe(false);
        expect(second.contextId).toBe(first.contextId);
        const ctx = (await control
          .prepare("SELECT name FROM contexts WHERE name = ?")
          .get(TEAM_CONTEXT_NAME)) as { name: string };
        expect(ctx.name).toBe(TEAM_CONTEXT_NAME);

        // ── add two members; the second without curator rights ─────────
        const alice = await addTeamMember(control, localDirectory, {
          upn: "alice@example.org",
          database,
        });
        const bob = await addTeamMember(control, localDirectory, {
          upn: "bob@example.org",
          database,
          curator: false,
        });
        expect(alice.created).toBe(true);
        expect(alice.objectId).toBe("oid-alice@example.org");
        // Re-adding keeps the ULID — history belongs to the person.
        const again = await addTeamMember(control, localDirectory, {
          upn: "alice@example.org",
          database,
        });
        expect(again.created).toBe(false);
        expect(again.userId).toBe(alice.userId);

        const token = await createToken(control, {
          slug: "team-token",
          concept: "Shared knowledge",
          domain: "team",
        });

        // ── members connect as themselves ─────────────────────────────
        const asAlice = await connectAs("alice@example.org");
        const asBob = await connectAs("bob@example.org");
        try {
          expect(await resolveLearnerId(asAlice)).toBe(alice.userId);
          expect(await resolveLearnerId(asBob)).toBe(bob.userId);

          // Alice writes her learning state; Bob cannot see it (RLS).
          await ensureCard(asAlice, token.id, alice.userId);
          const aliceCards = await asAlice
            .prepare("SELECT id FROM cards")
            .all();
          const bobCards = await asBob.prepare("SELECT id FROM cards").all();
          expect(aliceCards).toHaveLength(1);
          expect(bobCards).toHaveLength(0);

          // Curator may publish knowledge, a plain member may not.
          await createToken(asAlice, {
            slug: "alice-publishes",
            concept: "By a curator",
          });
          await expect(
            createToken(asBob, { slug: "bob-publishes", concept: "Denied" }),
          ).rejects.toThrow(/permission denied/i);
        } finally {
          await asAlice.close();
          await asBob.close();
        }

        // ── listing and revocation ─────────────────────────────────────
        const members = await listTeamMembers(control);
        expect(members.map((m) => [m.upn, m.canLogin, m.curator])).toEqual([
          ["alice@example.org", true, true],
          ["bob@example.org", true, false],
        ]);

        const removed = await removeTeamMember(control, "bob@example.org");
        expect(removed.wasMapped).toBe(true);
        await expect(connectAs("bob@example.org")).rejects.toThrow(
          /not permitted to log in|password authentication failed/i,
        );
        const after = await listTeamMembers(control);
        expect(after.find((m) => m.upn === "bob@example.org")?.canLogin).toBe(
          false,
        );
        // Bob's row survives the revocation.
        const bobRow = await control
          .prepare(
            "SELECT zam_user_id FROM learner_principals WHERE db_role = ?",
          )
          .get("bob@example.org");
        expect(bobRow).toBeDefined();
      } finally {
        await control.close();
      }

      // The administration open skips the schema gate; the learner open
      // enforces it — both against the same target.
      const raw = openPostgresAdministration({
        host: admin.hostname,
        port: Number(admin.port || 5432),
        database,
        username: decodeURIComponent(admin.username),
        auth: "password",
        password: decodeURIComponent(admin.password),
        ssl: false,
      });
      await raw.prepare("SELECT 1 AS one").get();
      await raw.close();
    } finally {
      await reset();
    }
  });
});
