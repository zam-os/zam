/**
 * ADR 2026-10-08b D5: turning "Use this key on my other devices" off moves a
 * key that reached this device only inside the row into this machine's own
 * storage, and the long-running bridge can still read it afterwards.
 */

import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { executeBridgeCommandJson } from "../../src/cli/commands/bridge.js";
import {
  CLOUD_MODELS_SETTING,
  saveModelRegistry,
} from "../../src/cli/llm/model-registry.js";
import {
  type Database,
  emptyCapabilityFlags,
  getProviderApiKey,
  getSetting,
  type OsSecretStore,
  openDatabase,
  resetCredentialsResolutionState,
  setOsSecretStoreForTests,
} from "../../src/kernel/index.js";

const KEY = "sk-only-in-the-row-0123456789";

function fakeStore(): OsSecretStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    kind: "keychain",
    values,
    available: async () => true,
    get: async (name) => values.get(name) ?? null,
    set: async (name, value) => {
      values.set(name, value);
      return true;
    },
    delete: async (name) => {
      values.delete(name);
    },
  };
}

describe("model-key-sync --off", () => {
  let base: string;
  let db: Database;
  let previousConfigPath: string | undefined;
  const credentialsFile = join(homedir(), ".zam", "credentials.json");

  beforeEach(async () => {
    base = mkdtempSync(join(tmpdir(), "zam-key-sync-"));
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(base, "config.json");
    resetCredentialsResolutionState();
    db = await openDatabase({
      dbPath: join(base, "test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    setOsSecretStoreForTests(undefined);
    resetCredentialsResolutionState();
    await db.close();
    rmSync(credentialsFile, { force: true });
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(base, { recursive: true, force: true });
  });

  it("moves the row's key into OS storage and keeps it readable here", async () => {
    const store = fakeStore();
    setOsSecretStoreForTests(store);
    // A row synced from another device: the key arrived inline, with no
    // reference this machine can resolve.
    await saveModelRegistry(db, [
      {
        id: "01JROW",
        label: "Cloud",
        url: "https://models.example/v1",
        model: "m",
        local: false,
        apiFlavor: "chat-completions",
        order: 0,
        capabilities: emptyCapabilityFlags(),
        detectedCapabilities: emptyCapabilityFlags(),
        apiKey: KEY,
      },
    ]);

    const result = (await executeBridgeCommandJson(
      "model-key-sync",
      ["--id", "01JROW", "--off"],
      { database: db },
    )) as { model: { keySync: boolean; keyState: string } };

    expect(result.model.keySync).toBe(false);
    expect(result.model.keyState).toBe("set");
    // Readable in this process after the move, without a restart.
    expect(getProviderApiKey("model-key-01jrow")).toBe(KEY);
    // Not in the plain file, not in the shared row; in OS storage.
    expect(existsSync(credentialsFile)).toBe(true);
    expect(readFileSync(credentialsFile, "utf-8")).not.toContain(KEY);
    expect([...store.values.values()]).toContain(KEY);
    expect((await getSetting(db, CLOUD_MODELS_SETTING)) ?? "").not.toContain(
      KEY,
    );
  });
});
