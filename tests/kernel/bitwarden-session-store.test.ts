import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearPersistedBwSession,
  getPersistedBwSessionMeta,
  restoreBwSessionToEnv,
  savePersistedBwSession,
} from "../../src/kernel/secrets/session-store.js";

describe("Bitwarden session store (30-day persistence)", () => {
  let dir: string;
  const prevPath = process.env.ZAM_BW_SESSION_PATH;
  const prevSession = process.env.BW_SESSION;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-bw-session-"));
    process.env.ZAM_BW_SESSION_PATH = join(dir, "bitwarden-session.json");
    delete process.env.BW_SESSION;
  });

  afterEach(() => {
    clearPersistedBwSession();
    if (prevPath === undefined) delete process.env.ZAM_BW_SESSION_PATH;
    else process.env.ZAM_BW_SESSION_PATH = prevPath;
    if (prevSession === undefined) delete process.env.BW_SESSION;
    else process.env.BW_SESSION = prevSession;
    rmSync(dir, { recursive: true, force: true });
  });

  it("restores a fresh session into the environment", () => {
    savePersistedBwSession("session-token-abc", { email: "a@b.c" });
    expect(restoreBwSessionToEnv()).toBe(true);
    expect(process.env.BW_SESSION).toBe("session-token-abc");
    const meta = getPersistedBwSessionMeta();
    expect(meta.present).toBe(true);
    expect(meta.email).toBe("a@b.c");
    expect(meta.expiresAt).toBeTruthy();
  });

  it("does not restore an expired session", () => {
    savePersistedBwSession("old", { maxAgeMs: -1000 });
    expect(restoreBwSessionToEnv()).toBe(false);
    expect(process.env.BW_SESSION).toBeUndefined();
    expect(getPersistedBwSessionMeta().present).toBe(false);
  });

  it("leaves an existing env session alone", () => {
    process.env.BW_SESSION = "already";
    savePersistedBwSession("other");
    expect(restoreBwSessionToEnv()).toBe(true);
    expect(process.env.BW_SESSION).toBe("already");
  });
});
