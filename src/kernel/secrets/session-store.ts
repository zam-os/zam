/**
 * Persist Bitwarden CLI session (BW_SESSION) for this machine so learners are
 * not prompted on every ZAM start. Default lifetime: 30 days.
 *
 * Stored under ~/.zam/ with mode 0o600 — never in the shared database.
 * Invalid/expired sessions are cleared automatically.
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

/** How long a stored session is trusted without re-login (30 days). */
export const BITWARDEN_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface PersistedSession {
  session: string;
  /** ISO expiry time */
  expiresAt: string;
  email?: string;
  savedAt: string;
}

function sessionFilePath(): string {
  return (
    process.env.ZAM_BW_SESSION_PATH ||
    join(homedir(), ".zam", "bitwarden-session.json")
  );
}

function readFile(): PersistedSession | null {
  const p = sessionFilePath();
  if (!existsSync(p)) return null;
  try {
    const raw = JSON.parse(readFileSync(p, "utf-8")) as PersistedSession;
    if (
      typeof raw.session !== "string" ||
      raw.session.length === 0 ||
      typeof raw.expiresAt !== "string"
    ) {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}

/** Save a live BW_SESSION for up to 30 days (or custom maxAgeMs). */
export function savePersistedBwSession(
  session: string,
  opts?: { email?: string; maxAgeMs?: number },
): void {
  const trimmed = session.trim();
  if (!trimmed) return;
  const maxAge = opts?.maxAgeMs ?? BITWARDEN_SESSION_MAX_AGE_MS;
  const now = Date.now();
  const payload: PersistedSession = {
    session: trimmed,
    expiresAt: new Date(now + maxAge).toISOString(),
    savedAt: new Date(now).toISOString(),
    ...(opts?.email ? { email: opts.email } : {}),
  };
  const p = sessionFilePath();
  const dir = dirname(p);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  writeFileSync(p, `${JSON.stringify(payload, null, 2)}\n`, {
    encoding: "utf-8",
    mode: 0o600,
  });
  if (process.platform !== "win32") {
    try {
      chmodSync(p, 0o600);
    } catch {
      /* best effort */
    }
  }
}

export function clearPersistedBwSession(): void {
  const p = sessionFilePath();
  if (existsSync(p)) {
    try {
      unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

/**
 * If process.env.BW_SESSION is empty, load a non-expired stored session into
 * the environment. Returns true when a session is available afterward.
 * On each successful restore, rolls the 30-day window forward (sliding expiry).
 */
export function restoreBwSessionToEnv(): boolean {
  if (process.env.BW_SESSION?.trim()) return true;
  const stored = readFile();
  if (!stored) return false;
  if (Date.parse(stored.expiresAt) <= Date.now()) {
    clearPersistedBwSession();
    return false;
  }
  process.env.BW_SESSION = stored.session;
  // Sliding 30-day window: active use keeps the session alive.
  savePersistedBwSession(stored.session, {
    email: stored.email,
  });
  return true;
}

/** Drop env + file after a failed vault call (session revoked/expired). */
export function invalidateBwSession(): void {
  delete process.env.BW_SESSION;
  clearPersistedBwSession();
}

export function getPersistedBwSessionMeta(): {
  present: boolean;
  expiresAt: string | null;
  email: string | null;
} {
  const stored = readFile();
  if (!stored) {
    return { present: false, expiresAt: null, email: null };
  }
  if (Date.parse(stored.expiresAt) <= Date.now()) {
    clearPersistedBwSession();
    return { present: false, expiresAt: null, email: null };
  }
  return {
    present: true,
    expiresAt: stored.expiresAt,
    email: stored.email ?? null,
  };
}
