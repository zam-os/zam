/**
 * Runs the provider contract against every Database implementation and adds
 * remote-transport-specific cases (auth, offline, timeout).
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import BetterSqlite3 from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { toHttpUrl } from "../../src/kernel/db/remote/hrana.js";
import { openRemoteDatabase } from "../../src/kernel/db/remote/provider.js";
import { wrapSyncDatabase } from "../../src/kernel/db/sync-adapter.js";
import type { SyncDatabase } from "../../src/kernel/db/types.js";
import { describeDatabaseContract } from "../helpers/db-contract.js";
import { startHranaStub } from "../helpers/hrana-stub.js";

describeDatabaseContract("local SQLite (better-sqlite3)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "zam-contract-"));
  const driver = new BetterSqlite3(
    join(dir, "contract.db"),
  ) as unknown as SyncDatabase;
  const db = wrapSyncDatabase(driver);
  return {
    db,
    async cleanup() {
      await db.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
});

describeDatabaseContract("remote Turso over HTTP (hrana stub)", async () => {
  const stub = await startHranaStub();
  const db = openRemoteDatabase({ url: stub.url });
  return {
    db,
    async cleanup() {
      await db.close();
      await stub.close();
    },
  };
});

if (process.env.POSTGRES_URL) {
  describeDatabaseContract("PostgreSQL (pg)", async () => {
    const { openPostgresDatabase } = await import(
      "../../src/kernel/db/postgres.js"
    );
    const db = openPostgresDatabase({
      connectionString: process.env.POSTGRES_URL,
    });
    return {
      db,
      async cleanup() {
        await db.exec(
          "DROP TABLE IF EXISTS items; DROP TABLE IF EXISTS audit;",
        );
        await db.close();
      },
    };
  });
} else {
  // Report the gap instead of registering nothing: a provider that silently
  // is not contract-tested looks identical to one that passes.
  describe.skip("PostgreSQL (pg) — needs POSTGRES_URL", () => {
    it("runs the shared provider contract", () => {});
  });
}

describe("remote provider transport behavior", () => {
  it("authenticates with the configured bearer token", async () => {
    const stub = await startHranaStub({ authToken: "secret" });
    try {
      const db = openRemoteDatabase({ url: stub.url, authToken: "secret" });
      expect(await db.prepare("SELECT 1 AS one").get()).toEqual({ one: 1 });
    } finally {
      await stub.close();
    }
  });

  it("reports rejected credentials with an actionable message", async () => {
    const stub = await startHranaStub({ authToken: "secret" });
    try {
      const db = openRemoteDatabase({ url: stub.url, authToken: "wrong" });
      // Token-only: a rejected token says nothing about the URL, and sending
      // someone through the full setup flow to re-paste one they never changed
      // is what makes this repair feel bigger than it is.
      await expect(db.prepare("SELECT 1").get()).rejects.toThrow(
        /zam connector token turso/,
      );
    } finally {
      await stub.close();
    }
  });

  it("reports unreachable hosts with an actionable offline message", async () => {
    const db = openRemoteDatabase({
      url: "http://127.0.0.1:9",
      maxAttempts: 2,
    });
    await expect(db.prepare("SELECT 1").get()).rejects.toThrow(
      /Cannot reach the Turso database .*ZAM_DB_PROVIDER=local/s,
    );
  });

  it("times out slow servers instead of hanging", async () => {
    const stub = await startHranaStub({ delayMs: 500 });
    try {
      const db = openRemoteDatabase({ url: stub.url, timeoutMs: 50 });
      await expect(db.prepare("SELECT 1").get()).rejects.toThrow(
        /Cannot reach the Turso database/,
      );
    } finally {
      await stub.close();
    }
  });

  it("normalizes libsql:// and ws:// URLs to HTTP equivalents", () => {
    expect(toHttpUrl("libsql://db.example.turso.io")).toBe(
      "https://db.example.turso.io",
    );
    expect(toHttpUrl("wss://db.example.turso.io/")).toBe(
      "https://db.example.turso.io",
    );
    expect(toHttpUrl("ws://127.0.0.1:8080")).toBe("http://127.0.0.1:8080");
    expect(toHttpUrl("https://db.example.turso.io")).toBe(
      "https://db.example.turso.io",
    );
  });
});
