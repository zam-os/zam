import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  checkCredentials,
  clearPostgresCredentials,
  credentialsNeedVaultAccess,
  getPostgresCredentials,
  postgresVaultAccessPending,
  resetCredentialsResolutionState,
  setPostgresCredentials,
  setTursoCredentials,
} from "../../src/kernel/credentials.js";
import {
  describePostgresTarget,
  getDatabaseTargetInfo,
  postgresSslFor,
} from "../../src/kernel/db/connection.js";

describe("postgresSslFor", () => {
  it("encrypts every non-loopback connection whatever the stored flag says", () => {
    expect(postgresSslFor({ host: "localhost", ssl: false })).toBe(false);
    expect(postgresSslFor({ host: "127.0.0.1", ssl: false })).toBe(false);
    // Local Docker is plain by default; TLS on loopback is an explicit choice.
    expect(postgresSslFor({ host: "localhost" })).toBe(false);
    expect(postgresSslFor({ host: "localhost", ssl: true })).toBe(true);
    // `connector setup` refuses --no-ssl for these; a hand-edited credentials
    // file or a caller passing ssl:false must not send a token in the clear.
    expect(
      postgresSslFor({ host: "team.postgres.database.azure.com", ssl: false }),
    ).toBe(true);
    expect(postgresSslFor({ host: "10.0.0.5", ssl: false })).toBe(true);
    expect(postgresSslFor({ host: "team.postgres.database.azure.com" })).toBe(
      true,
    );
  });
});

/**
 * The PostgreSQL block of credentials.json (ADR 2026-09-04 Decisions 3 and 6):
 * host, database and username are plain values, the auth mode decides whether
 * a password is needed at all, and a password may be a vault reference like
 * every other secret in the store.
 */
const tempDirs: string[] = [];

function tempCredsPath(): string {
  const root = mkdtempSync(join(tmpdir(), "zam-pg-credentials-"));
  tempDirs.push(root);
  const dir = join(root, ".zam");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return join(dir, "credentials.json");
}

afterEach(() => {
  resetCredentialsResolutionState();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("PostgreSQL credentials", () => {
  it("stores an Entra target without any secret and reads it back complete", () => {
    const path = tempCredsPath();
    setPostgresCredentials(
      {
        host: "team-pg.example.postgres.database.azure.com",
        database: "zam_prod",
        username: "learner@example.org",
        auth: "entra-cli",
      },
      path,
    );

    expect(getPostgresCredentials(path)).toEqual({
      host: "team-pg.example.postgres.database.azure.com",
      database: "zam_prod",
      username: "learner@example.org",
      auth: "entra-cli",
    });
    // Nothing secret is written: the file holds host, database and role only.
    expect(readFileSync(path, "utf-8")).not.toMatch(/password|token/);
    expect(credentialsNeedVaultAccess(path)).toBe(false);
    expect(checkCredentials(path)).toEqual([]);
  });

  it("treats a password target without a resolved password as unconfigured", () => {
    const path = tempCredsPath();
    setPostgresCredentials(
      {
        host: "localhost",
        port: 55432,
        database: "zam_test",
        username: "zam",
        auth: "password",
        password: { $secret: "bw://zam-team-db/password" },
        ssl: false,
      },
      path,
    );

    // Before resolution a vault reference is unset — and the pending check
    // tells the Studio to ask for the vault rather than open a local library.
    expect(getPostgresCredentials(path)).toBeNull();
    expect(postgresVaultAccessPending(path)).toBe(true);
    expect(credentialsNeedVaultAccess(path)).toBe(true);
    expect(checkCredentials(path)).toEqual([
      expect.objectContaining({
        field: "postgres.password",
        kind: "reference",
        ref: "bw://zam-team-db/password",
        ok: false,
      }),
    ]);
  });

  it("reads a literal password target complete, with port and ssl kept", () => {
    const path = tempCredsPath();
    setPostgresCredentials(
      {
        host: "localhost",
        port: 55432,
        database: "zam_test",
        username: "zam",
        auth: "password",
        password: "zam_password",
        ssl: false,
      },
      path,
    );
    expect(getPostgresCredentials(path)).toEqual({
      host: "localhost",
      port: 55432,
      database: "zam_test",
      username: "zam",
      auth: "password",
      password: "zam_password",
      ssl: false,
    });
    expect(postgresVaultAccessPending(path)).toBe(false);
    expect(checkCredentials(path)).toEqual([
      { field: "postgres.password", kind: "literal", ok: true },
    ]);

    clearPostgresCredentials(path);
    expect(getPostgresCredentials(path)).toBeNull();
  });

  it("keeps the Turso block untouched beside it", () => {
    const path = tempCredsPath();
    setTursoCredentials("libsql://db.turso.io", "tok", path, "remote");
    setPostgresCredentials(
      {
        host: "h",
        database: "d",
        username: "u",
        auth: "entra-cli",
      },
      path,
    );
    const stored = JSON.parse(readFileSync(path, "utf-8")) as {
      turso?: unknown;
      postgres?: unknown;
    };
    expect(stored.turso).toBeDefined();
    expect(stored.postgres).toBeDefined();
  });
});

describe("PostgreSQL database target", () => {
  it("describes an explicit PostgreSQL target without credentials", () => {
    const target = {
      host: "team-pg.example.postgres.database.azure.com",
      database: "zam_test",
      username: "learner@example.org",
      auth: "entra-cli" as const,
    };
    expect(describePostgresTarget(target)).toBe(
      "postgres://team-pg.example.postgres.database.azure.com:5432/zam_test",
    );
    expect(getDatabaseTargetInfo({ postgres: target })).toEqual({
      kind: "postgres",
      provider: "postgres",
      location:
        "postgres://team-pg.example.postgres.database.azure.com:5432/zam_test",
    });
  });
});
