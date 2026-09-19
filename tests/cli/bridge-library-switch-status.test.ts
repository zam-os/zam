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
import { openPostgresDatabase } from "../../src/kernel/db/postgres.js";

/**
 * The recovery states of the Studio's library switch (pilot plan phase 7,
 * review round of 2026-09-19): a team library that nobody provisioned yet is
 * a *state* `database-status` reports, not an error that paints the card
 * local; and a Turso connect that does not verify hands the earlier Turso
 * credentials back instead of leaving the bad ones on disk.
 */
const POSTGRES_URL = process.env.POSTGRES_URL;
const describeWithPostgres = POSTGRES_URL ? describe : describe.skip;

const FAKE_TURSO = {
  url: "libsql://kept-library.turso.io",
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
  configured?: "turso" | "postgres" | null;
}

function makeProfile(): { home: string; cwd: string; credentials: string } {
  const home = mkdtempSync(join(tmpdir(), "zam-switch-status-home-"));
  const cwd = mkdtempSync(join(tmpdir(), "zam-switch-status-cwd-"));
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

describe("server-db-connect keeps the earlier Turso credentials when the new ones do not verify", () => {
  const profile = makeProfile();
  afterAll(() => {
    rmSync(profile.home, { recursive: true, force: true });
    rmSync(profile.cwd, { recursive: true, force: true });
  });

  it("restores what was there before the failed connect", () => {
    writeFileSync(
      profile.credentials,
      JSON.stringify({ turso: FAKE_TURSO }, null, 2),
    );
    const failed = bridge(profile, [
      "server-db-connect",
      "--url",
      "libsql://does-not-exist.turso.io",
      "--token",
      "wrong-token",
      "--mode",
      "remote",
    ]);
    expect(failed.error).toBeTruthy();
    expect(JSON.parse(readFileSync(profile.credentials, "utf8"))).toEqual({
      turso: FAKE_TURSO,
    });
  });
});

describeWithPostgres(
  "an unprovisioned team library is a state, not an error (needs POSTGRES_URL)",
  () => {
    const url = POSTGRES_URL as string;
    const admin = POSTGRES_URL ? new URL(url) : ({} as URL);
    const schema = "zam_switch_empty";
    const role = "zam_switch_newcomer";
    const database = admin.pathname ? admin.pathname.replace(/^\//, "") : "";
    const profile = makeProfile();

    beforeAll(async () => {
      const db = openPostgresDatabase({ connectionString: url });
      try {
        await db.exec(
          `DROP SCHEMA IF EXISTS ${schema} CASCADE; CREATE SCHEMA ${schema};`,
        );
        await db
          .exec(`DROP OWNED BY "${role}"; DROP ROLE IF EXISTS "${role}";`)
          .catch(() => undefined);
        await db.exec(`
          CREATE ROLE "${role}" LOGIN PASSWORD 'pw' NOSUPERUSER NOBYPASSRLS;
          ALTER ROLE "${role}" SET search_path = ${schema};
          GRANT USAGE ON SCHEMA ${schema} TO "${role}";
        `);
      } finally {
        await db.close();
      }
    });

    afterAll(async () => {
      const db = openPostgresDatabase({ connectionString: url });
      try {
        await db.exec(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`);
        await db.exec(
          `DROP OWNED BY "${role}"; DROP ROLE IF EXISTS "${role}";`,
        );
      } finally {
        await db.close();
      }
      rmSync(profile.home, { recursive: true, force: true });
      rmSync(profile.cwd, { recursive: true, force: true });
    });

    it("connects, reports provisioned: false on status, and leaves cleanly", () => {
      const joined = bridge(profile, [
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
      ]);
      expect(joined).toMatchObject({
        success: true,
        connected: true,
        provisioned: false,
        member: false,
        target: { kind: "postgres" },
      });

      // The card reloads through database-status: the team library stays the
      // configured target, with the administrator's next step, not an error
      // that repaints the machine as local.
      const status = bridge(profile, ["database-status"]);
      expect(status).toMatchObject({
        success: true,
        connected: true,
        provisioned: false,
        target: { kind: "postgres" },
        role,
        configured: "postgres",
        userId: null,
      });
      expect(status.error).toMatch(/not provisioned yet/);

      const left = bridge(profile, ["team-db-disconnect"]);
      expect(left).toMatchObject({
        success: true,
        target: { kind: "local" },
        previous: null,
      });
      expect(bridge(profile, ["database-status"])).toMatchObject({
        success: true,
        target: { kind: "local" },
        configured: null,
      });
    });
  },
);
