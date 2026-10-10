/**
 * ADR 2026-10-08b D5: the Bitwarden session lives in memory, reaches `bw`
 * only through that child's environment, and is remembered only in
 * OS-protected storage, for seven days.
 */

import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BITWARDEN_SESSION_MAX_AGE_MS,
  bwChildEnv,
  currentBwSession,
  forgetBwSession,
  getBwSessionMeta,
  loadBwSession,
  type OsSecretStore,
  rememberBwSession,
  resetBwSessionForTests,
} from "../../src/kernel/index.js";

function fakeStore(available = true): OsSecretStore & {
  values: Map<string, string>;
} {
  const values = new Map<string, string>();
  return {
    kind: "keychain",
    values,
    available: async () => available,
    get: async (name) => values.get(name) ?? null,
    set: async (name, value) => {
      if (!available) return false;
      values.set(name, value);
      return true;
    },
    delete: async (name) => {
      values.delete(name);
    },
  };
}

describe("Bitwarden session store (seven days, OS storage only)", () => {
  let dir: string;
  let originalSession: string | undefined;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-bw-session-"));
    process.env.ZAM_BW_SESSION_PATH = join(dir, "bitwarden-session.json");
    originalSession = process.env.BW_SESSION;
    delete process.env.BW_SESSION;
    resetBwSessionForTests();
  });

  afterEach(() => {
    delete process.env.ZAM_BW_SESSION_PATH;
    if (originalSession === undefined) delete process.env.BW_SESSION;
    else process.env.BW_SESSION = originalSession;
    resetBwSessionForTests();
    rmSync(dir, { recursive: true, force: true });
  });

  it("remembers a session in OS storage for seven days, never in the environment", async () => {
    const store = fakeStore();
    const before = Date.now();
    expect(
      await rememberBwSession("sess-1", { email: "a@b.c" }, store),
    ).toEqual({
      remembered: true,
    });
    expect(process.env.BW_SESSION).toBeUndefined();
    expect(currentBwSession()).toBe("sess-1");

    const stored = JSON.parse(store.values.get("bitwarden-session") ?? "{}");
    expect(stored.session).toBe("sess-1");
    const age = Date.parse(stored.expiresAt) - before;
    expect(age).toBeGreaterThanOrEqual(BITWARDEN_SESSION_MAX_AGE_MS - 1000);
    expect(age).toBeLessThanOrEqual(BITWARDEN_SESSION_MAX_AGE_MS + 1000);
    expect(BITWARDEN_SESSION_MAX_AGE_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("loads a remembered session after a restart", async () => {
    const store = fakeStore();
    await rememberBwSession("sess-2", {}, store);
    resetBwSessionForTests();
    expect(currentBwSession()).toBeNull();
    expect(await loadBwSession(store)).toBe("sess-2");
    expect(process.env.BW_SESSION).toBeUndefined();
  });

  it("drops an expired session", async () => {
    const store = fakeStore();
    store.values.set(
      "bitwarden-session",
      JSON.stringify({ session: "old", expiresAt: "2020-01-01T00:00:00.000Z" }),
    );
    expect(await loadBwSession(store)).toBeNull();
    expect(store.values.has("bitwarden-session")).toBe(false);
  });

  it("does not remember a session without OS storage", async () => {
    expect(await rememberBwSession("sess-3", {}, null)).toEqual({
      remembered: false,
    });
    expect(currentBwSession()).toBe("sess-3");
    resetBwSessionForTests();
    expect(await loadBwSession(null)).toBeNull();

    const unavailable = fakeStore(false);
    expect(await rememberBwSession("sess-4", {}, unavailable)).toEqual({
      remembered: false,
    });
    expect(unavailable.values.size).toBe(0);
  });

  it("moves the plain file of older releases into OS storage and deletes it", async () => {
    const file = join(dir, "bitwarden-session.json");
    writeFileSync(
      file,
      JSON.stringify({
        session: "legacy",
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        savedAt: new Date().toISOString(),
      }),
    );
    const store = fakeStore();
    expect(await loadBwSession(store)).toBe("legacy");
    expect(existsSync(file)).toBe(false);
    expect(
      JSON.parse(store.values.get("bitwarden-session") ?? "{}").session,
    ).toBe("legacy");
  });

  it("deletes the plain file even where there is no OS storage", async () => {
    const file = join(dir, "bitwarden-session.json");
    writeFileSync(
      file,
      JSON.stringify({
        session: "legacy",
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    );
    expect(await loadBwSession(null)).toBe("legacy");
    expect(existsSync(file)).toBe(false);
  });

  it("uses a session the learner exported, but never exports one", async () => {
    process.env.BW_SESSION = "from-shell";
    expect(await loadBwSession(fakeStore())).toBe("from-shell");
    delete process.env.BW_SESSION;
    expect(currentBwSession()).toBe("from-shell");
    expect(process.env.BW_SESSION).toBeUndefined();
  });

  it("gives the session to a bw child only", async () => {
    await rememberBwSession("sess-5", {}, null);
    const child = bwChildEnv({ BW_PASSWORD: "pw" }, { PATH: "/bin" });
    expect(child).toEqual({
      PATH: "/bin",
      BW_PASSWORD: "pw",
      BW_SESSION: "sess-5",
    });
    expect(process.env.BW_SESSION).toBeUndefined();
  });

  it("forgets the session everywhere", async () => {
    const store = fakeStore();
    const file = join(dir, "bitwarden-session.json");
    await rememberBwSession("sess-6", {}, store);
    writeFileSync(file, "{}");
    await forgetBwSession(store);
    expect(currentBwSession()).toBeNull();
    expect(store.values.size).toBe(0);
    expect(existsSync(file)).toBe(false);
    expect(await getBwSessionMeta(store)).toEqual({
      present: false,
      expiresAt: null,
      email: null,
      storage: "none",
    });
  });

  it("reports where a session is kept, never the session itself", async () => {
    const store = fakeStore();
    await rememberBwSession("sess-7", { email: "a@b.c" }, store);
    const meta = await getBwSessionMeta(store);
    expect(meta).toMatchObject({
      present: true,
      email: "a@b.c",
      storage: "os",
    });
    expect(JSON.stringify(meta)).not.toContain("sess-7");
  });
});
