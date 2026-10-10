/**
 * The Bitwarden CLI session (BW_SESSION) of this machine (ADR 2026-10-08b
 * D5, amending ADR 2026-07-30b Decision 7).
 *
 * - The session lives in this process's memory and reaches `bw` only through
 *   that child's environment (`bwChildEnv`), never as `--session` and never in
 *   ZAM's own `process.env`, so agent harnesses and other children ZAM starts
 *   do not inherit it.
 * - It is remembered across starts only in OS-protected storage, for seven
 *   days with a sliding window (owner decision 2026-10-10). Where there is no
 *   such storage — Linux without a keyring daemon, SSH, WSL — it is not
 *   remembered and the learner unlocks at each start.
 * - The plain file of older releases (`~/.zam/bitwarden-session.json`) is
 *   read once, moved into OS storage when there is one, and deleted.
 */

import { existsSync, readFileSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { defaultOsSecretStore, type OsSecretStore } from "./os-store.js";

/** How long a remembered session stays valid without use (seven days). */
export const BITWARDEN_SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const STORE_NAME = "bitwarden-session";

interface RememberedSession {
  session: string;
  /** ISO expiry time */
  expiresAt: string;
  email?: string;
}

let current: { session: string; email?: string } | null = null;
let loaded = false;

function legacyFilePath(): string {
  return (
    process.env.ZAM_BW_SESSION_PATH ||
    join(homedir(), ".zam", "bitwarden-session.json")
  );
}

function parseRemembered(raw: string | null): RememberedSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RememberedSession;
    if (
      typeof parsed.session !== "string" ||
      !parsed.session ||
      typeof parsed.expiresAt !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function live(remembered: RememberedSession | null): boolean {
  return remembered !== null && Date.parse(remembered.expiresAt) > Date.now();
}

async function writeRemembered(
  store: OsSecretStore,
  session: string,
  email: string | undefined,
): Promise<boolean> {
  const payload: RememberedSession = {
    session,
    expiresAt: new Date(
      Date.now() + BITWARDEN_SESSION_MAX_AGE_MS,
    ).toISOString(),
    ...(email ? { email } : {}),
  };
  try {
    return await store.set(STORE_NAME, JSON.stringify(payload));
  } catch {
    return false;
  }
}

/** The plain-file session of older releases, read once and deleted. */
function takeLegacySession(): RememberedSession | null {
  const path = legacyFilePath();
  if (!existsSync(path)) return null;
  let remembered: RememberedSession | null = null;
  try {
    remembered = parseRemembered(readFileSync(path, "utf-8"));
  } catch {
    remembered = null;
  }
  rmSync(path, { force: true });
  return live(remembered) ? remembered : null;
}

/** The session in memory, if any. Never reads storage. */
export function currentBwSession(): string | null {
  return current?.session ?? null;
}

/**
 * The session for a `bw` call: memory first, then OS storage (sliding its
 * expiry forward), then the legacy file once. A session the learner exported
 * as BW_SESSION before starting ZAM is used as well, but never re-exported.
 */
export async function loadBwSession(
  store: OsSecretStore | null = defaultOsSecretStore(),
): Promise<string | null> {
  if (current) return current.session;
  const inherited = process.env.BW_SESSION?.trim();
  if (inherited) {
    current = { session: inherited };
    return inherited;
  }
  if (loaded) return null;
  loaded = true;

  const legacy = takeLegacySession();
  if (legacy) {
    current = { session: legacy.session, email: legacy.email };
    if (store && (await store.available().catch(() => false))) {
      await writeRemembered(store, legacy.session, legacy.email);
    }
    return legacy.session;
  }

  if (!store) return null;
  let remembered: RememberedSession | null = null;
  try {
    remembered = parseRemembered(await store.get(STORE_NAME));
  } catch {
    remembered = null;
  }
  if (!remembered) return null;
  if (!live(remembered)) {
    await store.delete(STORE_NAME).catch(() => undefined);
    return null;
  }
  current = { session: remembered.session, email: remembered.email };
  await writeRemembered(store, remembered.session, remembered.email);
  return remembered.session;
}

/**
 * Keep a fresh session for this process and, where the OS offers protected
 * storage, for seven days. Returns where it was kept.
 */
export async function rememberBwSession(
  session: string,
  opts: { email?: string } = {},
  store: OsSecretStore | null = defaultOsSecretStore(),
): Promise<{ remembered: boolean }> {
  const trimmed = session.trim();
  if (!trimmed) return { remembered: false };
  current = { session: trimmed, email: opts.email };
  loaded = true;
  if (!store || !(await store.available().catch(() => false))) {
    return { remembered: false };
  }
  return { remembered: await writeRemembered(store, trimmed, opts.email) };
}

/** Drop the session from memory, storage and the legacy file. */
export async function forgetBwSession(
  store: OsSecretStore | null = defaultOsSecretStore(),
): Promise<void> {
  current = null;
  loaded = true;
  rmSync(legacyFilePath(), { force: true });
  await store?.delete(STORE_NAME).catch(() => undefined);
}

/** What Settings shows about the remembered session. Never the session. */
export async function getBwSessionMeta(
  store: OsSecretStore | null = defaultOsSecretStore(),
): Promise<{
  present: boolean;
  expiresAt: string | null;
  email: string | null;
  storage: "os" | "memory" | "none";
}> {
  let remembered: RememberedSession | null = null;
  if (store) {
    try {
      remembered = parseRemembered(await store.get(STORE_NAME));
    } catch {
      remembered = null;
    }
  }
  if (live(remembered)) {
    return {
      present: true,
      expiresAt: remembered?.expiresAt ?? null,
      email: remembered?.email ?? null,
      storage: "os",
    };
  }
  if (current) {
    return {
      present: true,
      expiresAt: null,
      email: current.email ?? null,
      storage: "memory",
    };
  }
  return { present: false, expiresAt: null, email: null, storage: "none" };
}

/**
 * The environment for one `bw` child: the session goes here and nowhere
 * else. `extra` carries per-call values such as BW_PASSWORD.
 */
export function bwChildEnv(
  extra: NodeJS.ProcessEnv = {},
  base: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...base, ...extra };
  const session = currentBwSession();
  if (session) env.BW_SESSION = session;
  return env;
}

/** Forget the in-memory state. Tests only. */
export function resetBwSessionForTests(): void {
  current = null;
  loaded = false;
}
