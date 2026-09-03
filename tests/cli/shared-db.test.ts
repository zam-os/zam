import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "../../src/kernel/index.js";

const mocks = vi.hoisted(() => ({
  openDatabase: vi.fn<() => Promise<Database>>(),
}));

vi.mock("../../src/kernel/index.js", () => ({
  openDatabase: mocks.openDatabase,
}));

import {
  createPersistentDatabaseHost,
  runWithDatabase,
  withDb,
  withOptionalDb,
} from "../../src/cli/commands/shared/db.js";

function fakeDatabase(value: string): {
  database: Database;
  close: ReturnType<typeof vi.fn>;
} {
  const close = vi.fn(async () => {});
  const database = {
    prepare: vi.fn(() => ({
      run: vi.fn(async () => ({ changes: 0, lastInsertRowid: 0 })),
      get: vi.fn(async () => ({ value })),
      all: vi.fn(async () => [{ value }]),
    })),
    exec: vi.fn(async () => {}),
    pragma: vi.fn(async () => []),
    transaction: vi.fn(async (fn: (db: Database) => Promise<unknown>) =>
      fn(database as Database),
    ),
    close,
  } as unknown as Database;
  return { database, close };
}

function rethrow(message: string): never {
  throw new Error(message);
}

describe("shared CLI database lifetime", () => {
  beforeEach(() => {
    mocks.openDatabase.mockReset();
  });

  it("keeps an injected database open and isolates later standalone calls", async () => {
    const injected = fakeDatabase("injected");
    const standalone = fakeDatabase("standalone");
    mocks.openDatabase.mockResolvedValue(standalone.database);

    await runWithDatabase(injected.database, () =>
      withDb((database) => {
        expect(database).toBe(injected.database);
      }, rethrow),
    );

    expect(mocks.openDatabase).not.toHaveBeenCalled();
    expect(injected.close).not.toHaveBeenCalled();

    await withDb((database) => {
      expect(database).toBe(standalone.database);
    }, rethrow);

    expect(mocks.openDatabase).toHaveBeenCalledTimes(1);
    expect(standalone.close).toHaveBeenCalledTimes(1);
    expect(injected.close).not.toHaveBeenCalled();
  });

  it("keeps concurrent injected execution contexts separate", async () => {
    const first = fakeDatabase("first");
    const second = fakeDatabase("second");

    const [seenFirst, seenSecond] = await Promise.all([
      runWithDatabase(first.database, async () => {
        await Promise.resolve();
        let seen: Database | undefined;
        await withDb((database) => {
          seen = database;
        }, rethrow);
        return seen;
      }),
      runWithDatabase(second.database, async () => {
        await Promise.resolve();
        let seen: Database | undefined;
        await withDb((database) => {
          seen = database;
        }, rethrow);
        return seen;
      }),
    ]);

    expect(seenFirst).toBe(first.database);
    expect(seenSecond).toBe(second.database);
    expect(mocks.openDatabase).not.toHaveBeenCalled();
  });

  it("shares one lazy open and closes the successful handle exactly once", async () => {
    const opened = fakeDatabase("shared");
    let releaseOpen: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseOpen = resolve;
    });
    const open = vi.fn(async () => {
      await gate;
      return opened.database;
    });
    const host = createPersistentDatabaseHost(open);

    const first = host.getDatabase();
    const second = host.database.prepare("SELECT 1").get();
    releaseOpen?.();

    expect(await first).toBe(opened.database);
    await expect(second).resolves.toEqual({ value: "shared" });
    expect(open).toHaveBeenCalledTimes(1);
    expect(opened.close).not.toHaveBeenCalled();

    await Promise.all([host.close(), host.close(), host.database.close()]);
    expect(opened.close).toHaveBeenCalledTimes(1);
    await expect(host.getDatabase()).rejects.toThrow("host is closed");
  });

  it("retries a failed open and preserves withOptionalDb's null fallback", async () => {
    const recovered = fakeDatabase("recovered");
    const open = vi
      .fn<() => Promise<Database>>()
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValue(recovered.database);
    const host = createPersistentDatabaseHost(open);

    let first: Database | null | undefined;
    await runWithDatabase(host, () =>
      withOptionalDb((database) => {
        first = database;
      }, rethrow),
    );
    expect(first).toBeNull();

    let second: Database | null | undefined;
    await runWithDatabase(host, () =>
      withOptionalDb((database) => {
        second = database;
      }, rethrow),
    );
    expect(second).toBe(recovered.database);
    expect(open).toHaveBeenCalledTimes(2);

    await host.close();
    expect(recovered.close).toHaveBeenCalledTimes(1);
  });

  it("does not open a database only to close an unused host", async () => {
    const open = vi.fn(async () => fakeDatabase("unused").database);
    const host = createPersistentDatabaseHost(open);

    await host.close();

    expect(open).not.toHaveBeenCalled();
  });
});
