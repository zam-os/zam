/**
 * ADR 2026-10-08b D5: literal keys in credentials.json move to OS-protected
 * storage. A field is rewritten only after its value reads back unchanged,
 * and an entry ZAM created is deleted only once nothing refers to it at a
 * later start.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  credentialsNeedVaultAccess,
  getProviderApiKey,
  getTursoCredentials,
  libraryOsSecretPending,
  loadStoredCredentials,
  moveLiteralSecretsToOsStore,
  type OsSecretStore,
  resetCredentialsResolutionState,
  resolveCredentials,
  setOsSecretStoreForTests,
  setProviderApiKey,
  type StoredCredentials,
} from "../../src/kernel/index.js";

const TOKEN = "turso-token-0123456789";
const KEY = "sk-provider-0123456789";

function fakeStore(
  opts: { available?: boolean; corruptReadBack?: boolean } = {},
): OsSecretStore & { values: Map<string, string>; batches: string[][] } {
  const values = new Map<string, string>();
  const batches: string[][] = [];
  return {
    kind: "keychain",
    values,
    batches,
    available: async () => opts.available ?? true,
    get: async (name) => values.get(name) ?? null,
    getMany: async (names) => {
      batches.push(names);
      return new Map(names.map((n) => [n, values.get(n) ?? null]));
    },
    set: async (name, value) => {
      values.set(name, opts.corruptReadBack ? `${value}x` : value);
      return values.get(name) === value;
    },
    delete: async (name) => {
      values.delete(name);
    },
  };
}

describe("literal secrets move into OS storage", () => {
  let dir: string;
  let path: string;

  function write(doc: StoredCredentials): void {
    writeFileSync(path, JSON.stringify(doc, null, 2));
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-cred-os-"));
    path = join(dir, "credentials.json");
    resetCredentialsResolutionState();
  });

  afterEach(() => {
    setOsSecretStoreForTests(undefined);
    resetCredentialsResolutionState();
    rmSync(dir, { recursive: true, force: true });
  });

  it("stores each literal, reads it back and leaves an os:// reference", async () => {
    const store = fakeStore();
    setOsSecretStoreForTests(store);
    write({
      turso: { url: "libsql://lib.example", token: TOKEN },
      llmProviders: { openrouter: { apiKey: KEY } },
    });

    const result = await moveLiteralSecretsToOsStore(path, store);
    expect(result.moved.sort()).toEqual([
      "llmProviders.openrouter.apiKey",
      "turso.token",
    ]);

    const raw = readFileSync(path, "utf-8");
    expect(raw).not.toContain(TOKEN);
    expect(raw).not.toContain(KEY);
    const stored = loadStoredCredentials(path);
    expect(stored.turso?.token).toMatchObject({
      $secret: expect.stringMatching(/^os:\/\/credential:turso\.token:/),
    });
    expect(stored.osSecrets).toHaveLength(2);
    expect(credentialsNeedVaultAccess(path)).toBe(false);

    // A later start resolves them through the store, in one batch.
    resetCredentialsResolutionState();
    await resolveCredentials(path);
    expect(getTursoCredentials(path)?.token).toBe(TOKEN);
    expect(getProviderApiKey("openrouter", path)).toBe(KEY);
    expect(store.batches).toHaveLength(1);
    expect(store.batches[0]).toHaveLength(2);
  });

  it("keeps the resolved values usable in the process that moved them", async () => {
    const store = fakeStore();
    write({ llmProviders: { openrouter: { apiKey: KEY } } });
    await resolveCredentials(path);
    await moveLiteralSecretsToOsStore(path, store);
    expect(getProviderApiKey("openrouter", path)).toBe(KEY);
  });

  it("leaves a field literal when its value does not read back", async () => {
    const store = fakeStore({ corruptReadBack: true });
    write({ llmProviders: { openrouter: { apiKey: KEY } } });
    const result = await moveLiteralSecretsToOsStore(path, store);
    expect(result).toMatchObject({
      moved: [],
      failed: ["llmProviders.openrouter.apiKey"],
    });
    expect(loadStoredCredentials(path).llmProviders?.openrouter.apiKey).toBe(
      KEY,
    );
    expect(store.values.size).toBe(0);
  });

  it("changes nothing where the OS offers no storage", async () => {
    write({ llmProviders: { openrouter: { apiKey: KEY } } });
    const before = readFileSync(path, "utf-8");
    await moveLiteralSecretsToOsStore(path, null);
    await moveLiteralSecretsToOsStore(path, fakeStore({ available: false }));
    expect(readFileSync(path, "utf-8")).toBe(before);
  });

  it("leaves a field another writer changed meanwhile alone", async () => {
    const store = fakeStore();
    write({ llmProviders: { openrouter: { apiKey: KEY } } });
    const racing: OsSecretStore = {
      ...store,
      set: async (name, value) => {
        // Another command replaces the key while this one stores it.
        write({ llmProviders: { openrouter: { apiKey: "sk-newer" } } });
        return store.set(name, value);
      },
    };
    const result = await moveLiteralSecretsToOsStore(path, racing);
    expect(result.moved).toEqual([]);
    expect(loadStoredCredentials(path).llmProviders?.openrouter.apiKey).toBe(
      "sk-newer",
    );
    expect(store.values.size).toBe(0);
  });

  it("deletes a replaced entry at the next start, not at once", async () => {
    const store = fakeStore();
    write({ llmProviders: { openrouter: { apiKey: KEY } } });
    await moveLiteralSecretsToOsStore(path, store);
    const [first] = [...store.values.keys()];

    setProviderApiKey("openrouter", "sk-replacement", path);
    expect(store.values.has(first)).toBe(true);

    const next = await moveLiteralSecretsToOsStore(path, store);
    expect(next.removed).toEqual([first]);
    expect(store.values.has(first)).toBe(false);
    expect([...store.values.values()]).toEqual(["sk-replacement"]);
    expect(loadStoredCredentials(path).osSecrets).toHaveLength(1);
  });

  it("keeps an entry an undo pointed back at", async () => {
    const store = fakeStore();
    write({ turso: { url: "libsql://lib.example", token: TOKEN } });
    await moveLiteralSecretsToOsStore(path, store);
    const earlier = loadStoredCredentials(path).turso;

    // A connect that does not verify writes a new token, then undoes itself.
    write({
      ...loadStoredCredentials(path),
      turso: { url: "libsql://other.example", token: "unverified" },
    });
    write({ ...loadStoredCredentials(path), turso: earlier });

    const next = await moveLiteralSecretsToOsStore(path, store);
    expect(next.removed).toEqual([]);
    resetCredentialsResolutionState();
    setOsSecretStoreForTests(store);
    await resolveCredentials(path);
    expect(getTursoCredentials(path)?.token).toBe(TOKEN);
  });

  it("says when the library's token sits in a keychain ZAM cannot read", async () => {
    const store = fakeStore();
    write({ turso: { url: "libsql://lib.example", token: TOKEN } });
    await moveLiteralSecretsToOsStore(path, store);

    // Another session: the keychain answers nothing.
    setOsSecretStoreForTests(fakeStore());
    resetCredentialsResolutionState();
    await resolveCredentials(path);
    expect(getTursoCredentials(path)).toBeNull();
    expect(libraryOsSecretPending(path)).toBe("turso.token");
    // It is not a Bitwarden matter.
    expect(credentialsNeedVaultAccess(path)).toBe(false);
  });
});

describe("Bitwarden sees secrets in OS storage as local", () => {
  afterEach(() => {
    setOsSecretStoreForTests(undefined);
    resetCredentialsResolutionState();
  });

  it("counts them as secrets the vault could take over", async () => {
    const { countPendingLiteralSecrets } = await import(
      "../../src/cli/secrets-bridge.js"
    );
    const { homedir } = await import("node:os");
    const { mkdirSync } = await import("node:fs");
    mkdirSync(join(homedir(), ".zam"), { recursive: true });
    const file = join(homedir(), ".zam", "credentials.json");
    writeFileSync(
      file,
      JSON.stringify({
        turso: {
          url: "libsql://lib.example",
          token: { $secret: "os://credential:turso.token:abc" },
        },
        ado: {
          org_url: "https://dev.azure.com/x",
          project: "p",
          pat: { $secret: "bw://zam-ado/pat" },
        },
        llmProviders: { openrouter: { apiKey: KEY } },
      }),
    );
    // The OS-stored token and the literal key count; the vault one does not.
    expect(countPendingLiteralSecrets()).toBe(2);
    rmSync(file, { force: true });
  });
});
