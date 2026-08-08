/**
 * Moving a device-local library onto a server database.
 *
 * This is the one flow in the app where a learner can lose their history, so
 * the tests are mostly about the failure paths: every one of them has to end
 * with the learner still on their device, with everything intact.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTauriDatabase } from "../../mobile/src/provider.js";
import {
  completeFirstRun,
  LOCAL_USER_ID,
} from "../../mobile/src/setup/first-run.js";
import { starterCards } from "../../mobile/src/setup/starter-content.js";
import {
  REMOTE_NOT_EMPTY,
  upgradeToServerDatabase,
} from "../../mobile/src/setup/upgrade.js";
import { applySchemaAndMigrations } from "../../src/kernel/db/provision.js";
import type { Database } from "../../src/kernel/db/types.js";
import { buildReviewQueue } from "../../src/kernel/scheduler/queue.js";
import { createTauriInvokeStub } from "../helpers/tauri-invoke-stub.js";

const cleanups: Array<() => void> = [];

afterEach(() => {
  while (cleanups.length > 0) (cleanups.pop() as () => void)();
});

function dir(): string {
  const path = mkdtempSync(join(tmpdir(), "zam-upgrade-"));
  cleanups.push(() => rmSync(path, { recursive: true, force: true }));
  return path;
}

function open(path: string): Database {
  const stub = createTauriInvokeStub(path);
  cleanups.push(() => stub.close());
  return createTauriDatabase(stub.invoke);
}

/** A device with a first run behind it, plus the io the upgrade needs. */
async function scenario(options: { seedRemote?: boolean } = {}) {
  const workspace = dir();
  const localPath = join(workspace, "zam-local.db");
  const remotePath = join(workspace, "server.db");

  let local = open(localPath);
  await completeFirstRun(local, {
    locale: "de",
    persona: "school",
    starterCards: starterCards("de"),
  });

  if (options.seedRemote) {
    const seeded = open(remotePath);
    await applySchemaAndMigrations(seeded);
    await seeded
      .prepare(
        `INSERT INTO tokens (id, slug, title, concept, domain, bloom_level, created_at, updated_at)
         VALUES ('t-remote', 'fremd/karte', 'Fremd', 'Schon da', 'fremd', 1,
                 datetime('now'), datetime('now'))`,
      )
      .run();
    await seeded
      .prepare(
        `INSERT INTO cards (id, token_id, user_id, due_at, state)
         VALUES ('c-remote', 't-remote', 'me', datetime('now'), 'new')`,
      )
      .run();
  }

  const openRemote = vi.fn(async () => open(remotePath));
  const reopenLocal = vi.fn(async () => {
    local = open(localPath);
    return local;
  });

  return {
    io: { local, openRemote, reopenLocal },
    localPath,
    remotePath,
    openRemote,
    reopenLocal,
  };
}

describe("upgradeToServerDatabase", () => {
  it("copies the whole library onto an empty server database", async () => {
    const { io } = await scenario();
    const stages: string[] = [];

    const result = await upgradeToServerDatabase(io, {
      url: "libsql://example.turso.io",
      authToken: "token",
      onProgress: ({ stage }) => stages.push(stage),
    });

    expect(result.ok).toBe(true);
    expect(result.userId).toBe(LOCAL_USER_ID);
    expect(stages).toEqual([
      "reading",
      "connecting",
      "provisioning",
      "transferring",
      "done",
    ]);

    // The learner opens the server database and finds their queue as it was.
    const queue = await buildReviewQueue(result.db, { userId: LOCAL_USER_ID });
    expect(queue.items).toHaveLength(3);
  });

  it("provisions a server database that has no tables at all", async () => {
    // The state a freshly created Turso database is actually in.
    const { io, remotePath } = await scenario();
    const result = await upgradeToServerDatabase(io, {
      url: "libsql://example.turso.io",
      authToken: "token",
    });
    expect(result.ok).toBe(true);

    const fresh = open(remotePath);
    const tables = (await fresh
      .prepare(
        `SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name='review_logs'`,
      )
      .get()) as { n: number };
    expect(Number(tables.n)).toBe(1);
  });

  it("refuses a server database that already holds cards", async () => {
    const { io, reopenLocal } = await scenario({ seedRemote: true });
    const result = await upgradeToServerDatabase(io, {
      url: "libsql://example.turso.io",
      authToken: "token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(REMOTE_NOT_EMPTY);
    // Left where they started: back on the device, nothing transferred.
    expect(reopenLocal).toHaveBeenCalled();
    const queue = await buildReviewQueue(result.db, { userId: LOCAL_USER_ID });
    expect(queue.items).toHaveLength(3);
  });

  it("replaces an occupied server database when the learner says so", async () => {
    const { io } = await scenario({ seedRemote: true });
    const result = await upgradeToServerDatabase(io, {
      url: "libsql://example.turso.io",
      authToken: "token",
      replaceRemote: true,
    });

    expect(result.ok).toBe(true);
    const rows = (await result.db
      .prepare("SELECT slug FROM tokens ORDER BY slug")
      .all()) as Array<{ slug: string }>;
    expect(rows.map((row) => row.slug)).not.toContain("fremd/karte");
    expect(rows).toHaveLength(3);
  });

  it("refuses a server database that holds rows but no cards", async () => {
    // The shape a desktop leaves behind after merely connecting: settings
    // rows, no cards. Gating on `cards` let this through, and importSnapshot
    // then refused with a raw English message while the caller kept the
    // "replace" button hidden — an unusable dead end.
    const { io, remotePath, reopenLocal } = await scenario();
    const seeded = open(remotePath);
    await applySchemaAndMigrations(seeded);
    await seeded
      .prepare(`INSERT INTO user_config (key, value) VALUES ('system.locale', 'de')`)
      .run();

    const result = await upgradeToServerDatabase(io, {
      url: "libsql://example.turso.io",
      authToken: "token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe(REMOTE_NOT_EMPTY);
    expect(reopenLocal).toHaveBeenCalled();
    const queue = await buildReviewQueue(result.db, { userId: LOCAL_USER_ID });
    expect(queue.items).toHaveLength(3);
  });

  it("replaces a database holding only settings when asked", async () => {
    const { io, remotePath } = await scenario();
    const seeded = open(remotePath);
    await applySchemaAndMigrations(seeded);
    await seeded
      .prepare(`INSERT INTO user_config (key, value) VALUES ('system.locale', 'en')`)
      .run();

    const result = await upgradeToServerDatabase(io, {
      url: "libsql://example.turso.io",
      authToken: "token",
      replaceRemote: true,
    });
    expect(result.ok).toBe(true);
    const queue = await buildReviewQueue(result.db, { userId: LOCAL_USER_ID });
    expect(queue.items).toHaveLength(3);
  });

  it("keeps the learner on their device when the server cannot be reached", async () => {
    const { io, reopenLocal } = await scenario();
    io.openRemote = vi.fn(async () => {
      throw new Error("cannot reach server database (online required)");
    });

    const result = await upgradeToServerDatabase(io, {
      url: "libsql://nope.turso.io",
      authToken: "token",
    });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("cannot reach server database");
    expect(reopenLocal).toHaveBeenCalled();
    const queue = await buildReviewQueue(result.db, { userId: LOCAL_USER_ID });
    expect(queue.items).toHaveLength(3);
  });

  it("reads the snapshot before touching anything remote", async () => {
    // If the export failed the learner would not want a half-provisioned
    // server database left behind, so the order is load-bearing.
    const { io, openRemote } = await scenario();
    const stages: string[] = [];
    await upgradeToServerDatabase(io, {
      url: "libsql://example.turso.io",
      authToken: "token",
      onProgress: ({ stage }) => {
        stages.push(stage);
        if (stage === "connecting") {
          expect(stages[0]).toBe("reading");
        }
      },
    });
    expect(openRemote).toHaveBeenCalledTimes(1);
  });
});
