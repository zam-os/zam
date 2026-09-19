import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  addTeamMember,
  type PrincipalDirectory,
  provisionTeamLibrary,
} from "../../src/cli/deploy/team-provision.js";
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";
import type { Database } from "../../src/kernel/db/types.js";

/**
 * Switching a machine between its libraries through the built CLI, the way
 * the Studio does it (pilot plan phase 7): a configured Turso database is
 * refused without `--replace`, kept as the previous library with it, a switch
 * that does not verify is undone, and `library-restore` flips back and forth
 * without a new token. The PostgreSQL leg needs `POSTGRES_URL`
 * (`npm run pg:up`); the refusal and undo cases run everywhere.
 */
const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

const FAKE_TURSO = {
  url: "libsql://previous-library.turso.io",
  token: "turso-token-that-must-survive",
  mode: "remote" as const,
};

interface BridgeResult {
  success?: boolean;
  error?: string;
  target?: { kind: string; location: string };
  connected?: boolean;
  provisioned?: boolean;
  userId?: string | null;
  role?: string | null;
  member?: boolean;
  previous?: { kind: string; location: string } | null;
  verifyError?: string;
}

function makeProfile(): { home: string; cwd: string; credentials: string } {
  const home = mkdtempSync(join(tmpdir(), "zam-switch-home-"));
  const cwd = mkdtempSync(join(tmpdir(), "zam-switch-cwd-"));
  mkdirSync(join(home, ".zam"), { recursive: true });
  return { home, cwd, credentials: join(home, ".zam", "credentials.json") };
}

function bridge(
  profile: { home: string; cwd: string },
  args: string[],
): BridgeResult {
  const cliPath = join(process.cwd(), "dist", "cli", "index.js");
  try {
    const output = execFileSync("node", [cliPath, "bridge", ...args], {
      cwd: profile.cwd,
      env: {
        ...process.env,
        HOME: profile.home,
        USERPROFILE: profile.home,
        ZAM_CONFIG_PATH: join(profile.home, ".zam", "config.json"),
      },
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return JSON.parse(output) as BridgeResult;
  } catch (err) {
    const stdout = (err as { stdout?: string }).stdout ?? "";
    return JSON.parse(stdout || '{"error":"no output"}') as BridgeResult;
  }
}

function storedCredentials(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("bridge library switch — refusal and undo", () => {
  const profile = makeProfile();
  afterAll(() => {
    rmSync(profile.home, { recursive: true, force: true });
    rmSync(profile.cwd, { recursive: true, force: true });
  });

  it("refuses to sit beside a configured Turso database without --replace, and undoes a switch that does not verify", () => {
    writeFileSync(
      profile.credentials,
      JSON.stringify({ turso: FAKE_TURSO }, null, 2),
    );

    const refused = bridge(profile, [
      "team-db-connect",
      "--host",
      "127.0.0.1",
      "--port",
      "1",
      "--database",
      "zam_test",
      "--username",
      "nobody",
      "--auth",
      "password",
      "--password",
      "pw",
    ]);
    expect(refused.error).toMatch(/LIBRARY_CONFIGURED/);
    expect(storedCredentials(profile.credentials)).toEqual({
      turso: FAKE_TURSO,
    });

    // Port 1 answers nobody: the switch is attempted, fails to verify, and
    // the machine is left exactly as it was — Turso back, no previous.
    const failed = bridge(profile, [
      "team-db-connect",
      "--host",
      "127.0.0.1",
      "--port",
      "1",
      "--database",
      "zam_test",
      "--username",
      "nobody",
      "--auth",
      "password",
      "--password",
      "pw",
      "--replace",
    ]);
    expect(failed.error).toBeTruthy();
    expect(failed.error).not.toMatch(/LIBRARY_CONFIGURED/);
    expect(storedCredentials(profile.credentials)).toEqual({
      turso: FAKE_TURSO,
    });

    expect(bridge(profile, ["library-restore"]).error).toMatch(
      /No previous library/,
    );
  });
});

describeWithPostgres(
  "bridge library switch on PostgreSQL (needs POSTGRES_URL)",
  () => {
    const url = POSTGRES_URL as string;
    const admin = POSTGRES_URL ? new URL(url) : ({} as URL);
    const schema = "zam_switch";
    const role = "zam_switch_learner";
    const database = admin.pathname ? admin.pathname.replace(/^\//, "") : "";
    const profile = makeProfile();
    let learnerId = "";

    /** Local stand-in for pgaadauth: one password role with its own search_path. */
    const directory: PrincipalDirectory = {
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
        } finally {
          await db.close();
        }
        return { roleName: upn, objectId: null };
      },
    };

    function control(): Database {
      return openPostgresDatabase({
        connectionString: `${url}?options=-c%20search_path%3D${schema}`,
      });
    }

    beforeAll(async () => {
      const reset = openPostgresDatabase({ connectionString: url });
      try {
        await reset.exec(
          `DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema};`,
        );
        await reset
          .exec(`DROP OWNED BY "${role}"; DROP ROLE IF EXISTS "${role}";`)
          .catch(() => undefined);
      } finally {
        await reset.close();
      }
      const db = control();
      try {
        await provisionTeamLibrary(db, { schema });
        const member = await addTeamMember(db, directory, {
          upn: role,
          database,
        });
        learnerId = member.userId;
      } finally {
        await db.close();
      }
    });

    afterAll(async () => {
      const reset = openPostgresDatabase({ connectionString: url });
      try {
        await reset.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`);
        await reset.exec(
          `DROP OWNED BY "${role}"; DROP ROLE IF EXISTS "${role}";`,
        );
      } finally {
        await reset.close();
      }
      rmSync(profile.home, { recursive: true, force: true });
      rmSync(profile.cwd, { recursive: true, force: true });
    });

    it("switches from Turso to the team library and back, keeping the token", () => {
      writeFileSync(
        profile.credentials,
        JSON.stringify({ turso: FAKE_TURSO }, null, 2),
      );
      const connectArgs = [
        "team-db-connect",
        "--host",
        admin.hostname,
        "--port",
        admin.port || "5432",
        "--database",
        database,
        "--username",
        role,
        "--auth",
        "password",
        "--password",
        "pw",
        "--replace",
      ];

      const joined = bridge(profile, connectArgs);
      expect(joined).toMatchObject({
        success: true,
        connected: true,
        provisioned: true,
        member: true,
        userId: learnerId,
        role,
        target: { kind: "postgres" },
        previous: { kind: "turso", location: FAKE_TURSO.url },
      });

      const status = bridge(profile, ["database-status"]);
      expect(status).toMatchObject({
        success: true,
        target: { kind: "postgres" },
        userId: learnerId,
        role,
        previous: { kind: "turso", location: FAKE_TURSO.url },
      });

      // Back to Turso: the switch succeeds even though the fake host cannot
      // be verified, the token is intact, and the team library is now the
      // previous one.
      const back = bridge(profile, ["library-restore"]);
      expect(back.success).toBe(true);
      expect(back.target?.kind).toMatch(/^turso/);
      expect(back.verifyError).toBeTruthy();
      expect(back.previous).toMatchObject({ kind: "postgres" });
      expect(storedCredentials(profile.credentials).turso).toEqual(FAKE_TURSO);

      // …and forth: the team library again, verified, with Turso kept.
      const forth = bridge(profile, ["library-restore"]);
      expect(forth).toMatchObject({
        success: true,
        connected: true,
        member: true,
        userId: learnerId,
        previous: { kind: "turso" },
      });

      // "Learn locally instead" leaves for the previous library and keeps nothing.
      const left = bridge(profile, ["team-db-disconnect"]);
      expect(left.success).toBe(true);
      expect(left.target?.kind).toMatch(/^turso/);
      expect(left.previous).toBeNull();
      expect(storedCredentials(profile.credentials)).toEqual({
        turso: FAKE_TURSO,
      });
    });
  },
);
