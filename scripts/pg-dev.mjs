#!/usr/bin/env node
/**
 * Local PostgreSQL for development and tests (ADR 2026-07-04, Phase C0).
 *
 * The Postgres-backed suites — the provider contract and, more importantly,
 * the RLS isolation suite that guards Deployment B's privacy boundary — skip
 * unless `POSTGRES_URL` is set. Skipping silently is how a security boundary
 * stops being tested, so this makes a matching database a one-liner:
 *
 *   npm run pg:up      # start it, print the URL
 *   npm run pg:test    # run the Postgres-backed suites against it (any OS)
 *   npm run pg:down    # stop it
 *
 * Two backends, picked automatically, because contributors differ:
 *
 * - **Docker** — `postgres:18-alpine`, byte-identical to CI. Preferred.
 * - **Local binaries** — a project-local cluster under `.pgdata/`, for
 *   machines without a container runtime (`brew install postgresql@18`).
 *
 * Both listen on port 55432, not 5432, so a system PostgreSQL or another
 * project's container is never disturbed.
 *
 * PostgreSQL **18**: the team library runs on 18 (ADR 2026-09-04 supersedes
 * the earlier 17 pin — Entra sign-in on 18 was verified on the real server),
 * so local work matches it.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 55432;
const USER = "zam";
const PASSWORD = "zam_password";
const DB = "zam_test";
const CONTAINER = "zam-pg-dev";
const PGDATA = join(ROOT, ".pgdata");
const IMAGE = "postgres:18-alpine";

export const POSTGRES_URL = `postgres://${USER}:${PASSWORD}@localhost:${PORT}/${DB}`;

function has(cmd, args = ["--version"]) {
  const r = spawnSync(cmd, args, { stdio: "ignore" });
  return r.status === 0;
}

function dockerUsable() {
  return spawnSync("docker", ["info"], { stdio: "ignore" }).status === 0;
}

/** Locate PostgreSQL 18 binaries: PATH first, then the usual Homebrew spots. */
function findPgBin() {
  if (has("pg_ctl")) return "";
  for (const prefix of [
    "/opt/homebrew/opt/postgresql@18/bin",
    "/usr/local/opt/postgresql@18/bin",
    "/usr/lib/postgresql/18/bin",
  ]) {
    if (existsSync(join(prefix, "pg_ctl"))) return prefix;
  }
  return null;
}

const pgBin = (name) => {
  const prefix = findPgBin();
  return prefix === null ? null : prefix === "" ? name : join(prefix, name);
};

/**
 * PostgreSQL 18 on recent macOS aborts at startup with "Postmaster became
 * multithreaded during startup" unless a concrete locale is set — the
 * Homebrew caveat says the same. Harmless elsewhere, so it is set for every
 * local invocation rather than guarded by platform.
 */
const PG_ENV = { ...process.env, LC_ALL: process.env.LC_ALL ?? "en_US.UTF-8" };

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { stdio: "inherit", env: PG_ENV, ...opts });
}

// ── Docker backend ─────────────────────────────────────────────────────────

function dockerUp() {
  const existing = execFileSync("docker", [
    "ps", "-aq", "--filter", `name=^${CONTAINER}$`,
  ]).toString().trim();
  if (existing) {
    run("docker", ["start", CONTAINER]);
  } else {
    run("docker", [
      "run", "-d", "--name", CONTAINER,
      "-e", `POSTGRES_USER=${USER}`,
      "-e", `POSTGRES_PASSWORD=${PASSWORD}`,
      "-e", `POSTGRES_DB=${DB}`,
      "-p", `${PORT}:5432`,
      IMAGE,
    ]);
  }
  // The container reports ready before it accepts connections; wait for real.
  for (let i = 0; i < 60; i++) {
    const r = spawnSync("docker", ["exec", CONTAINER, "pg_isready", "-U", USER], {
      stdio: "ignore",
    });
    if (r.status === 0) return;
    spawnSync("sleep", ["1"]);
  }
  throw new Error(`${CONTAINER} did not become ready in 60s`);
}

function dockerDown() {
  spawnSync("docker", ["stop", CONTAINER], { stdio: "inherit" });
}

// ── Local-binaries backend ─────────────────────────────────────────────────

function localUp() {
  const initdb = pgBin("initdb");
  const pgCtl = pgBin("pg_ctl");
  const psql = pgBin("psql");
  if (!pgCtl) throw new Error("no pg_ctl");

  if (!existsSync(PGDATA)) {
    mkdirSync(PGDATA, { recursive: true });
    // Password authentication like the Docker image: under `trust` the server
    // never challenges the client, so the provider's per-connection password
    // supplier is never called and `postgres-open.test.ts` cannot observe it.
    const pwfile = join(dirname(PGDATA), ".pgdata-password");
    writeFileSync(pwfile, `${PASSWORD}\n`);
    try {
      run(initdb, [
        "-D",
        PGDATA,
        "-U",
        USER,
        "--auth=scram-sha-256",
        `--pwfile=${pwfile}`,
        "-E",
        "UTF8",
      ]);
    } finally {
      rmSync(pwfile, { force: true });
    }
    // Loopback only — a dev database must not be reachable from the network.
    writeFileSync(
      join(PGDATA, "postgresql.conf"),
      `port = ${PORT}\nlisten_addresses = 'localhost'\nfsync = off\nfull_page_writes = off\n`,
      { flag: "a" },
    );
  }

  const status = spawnSync(pgCtl, ["-D", PGDATA, "status"], {
    stdio: "ignore",
    env: PG_ENV,
  });
  if (status.status !== 0) {
    run(pgCtl, ["-D", PGDATA, "-l", join(PGDATA, "server.log"), "start"]);
  }

  for (let i = 0; i < 60; i++) {
    const r = spawnSync(pgBin("pg_isready"), ["-p", String(PORT), "-U", USER], {
      stdio: "ignore",
      env: PG_ENV,
    });
    if (r.status === 0) break;
    spawnSync("sleep", ["1"]);
  }

  // Idempotent: create the role's password and the database if absent.
  const q = (sql, db = "postgres") =>
    spawnSync(psql, ["-p", String(PORT), "-U", USER, "-d", db, "-tAc", sql], {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...PG_ENV, PGPASSWORD: PASSWORD },
    });
  q(`ALTER ROLE ${USER} WITH PASSWORD '${PASSWORD}'`);
  const exists = q(
    `SELECT 1 FROM pg_database WHERE datname = '${DB}'`,
  ).stdout.toString().trim();
  if (exists !== "1") q(`CREATE DATABASE ${DB} OWNER ${USER}`);
}

function localDown() {
  const pgCtl = pgBin("pg_ctl");
  if (pgCtl && existsSync(PGDATA)) {
    spawnSync(pgCtl, ["-D", PGDATA, "stop", "-m", "fast"], {
      stdio: "inherit",
      env: PG_ENV,
    });
  }
}

// ── Entry point ────────────────────────────────────────────────────────────

const command = process.argv[2] ?? "up";
const backend = dockerUsable() ? "docker" : findPgBin() !== null ? "local" : null;

if (command === "url") {
  process.stdout.write(POSTGRES_URL);
  process.exit(0);
}

if (backend === null) {
  console.error(
    [
      "No PostgreSQL backend found. Either:",
      "  • start Docker (preferred — same image as CI), or",
      "  • install binaries: brew install postgresql@18",
      "",
      "The Postgres-backed suites skip without POSTGRES_URL; see docs/plans/.",
    ].join("\n"),
  );
  process.exit(1);
}

if (command === "up") {
  backend === "docker" ? dockerUp() : localUp();
  console.log(`\nPostgreSQL 18 ready via ${backend}.`);
  console.log(`POSTGRES_URL=${POSTGRES_URL}\n`);
  console.log("Run the Postgres-backed suites with:  npm run pg:test");
} else if (command === "down") {
  backend === "docker" ? dockerDown() : localDown();
} else if (command === "test") {
  // `POSTGRES_URL=$(…) vitest run …` only works in a POSIX shell; npm runs
  // scripts through cmd.exe on Windows, so the env is set here instead.
  const suites = [
    "tests/kernel/postgres-rls.test.ts",
    "tests/kernel/provider-contract.test.ts",
    "tests/kernel/postgres-provider.test.ts",
    "tests/kernel/postgres-provision.test.ts",
    "tests/kernel/postgres-presentation.test.ts",
    "tests/kernel/postgres-open.test.ts",
    "tests/kernel/postgres-identity.test.ts",
    "tests/kernel/postgres-team.test.ts",
    "tests/kernel/analytics-stats.test.ts",
    "tests/kernel/progress.test.ts",
    "tests/kernel/due-summary.test.ts",
  ];
  const extra = process.argv.slice(3);
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vitest", "run", ...(extra.length > 0 ? extra : suites)],
    {
      stdio: "inherit",
      env: { ...process.env, POSTGRES_URL },
      shell: process.platform === "win32",
    },
  );
  process.exit(result.status ?? 1);
} else {
  console.error(`Unknown command: ${command} (use up | down | url | test)`);
  process.exit(1);
}
