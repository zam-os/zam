/**
 * Write-back sync robustness for the Android companion.
 *
 * The paired replica syncs through libsql's synced database (WAL push/pull);
 * card-state conflicts resolve last-write-wins at the frame level and
 * `review_logs` merges without loss (append-only ULIDs) — see the sync ADR.
 * This module adds the app-level policy around a single `sync()` call:
 * transient failures retry with bounded backoff, while an authentication
 * failure (expired or rotated token) is surfaced immediately so the UI can
 * route the learner to re-pairing instead of silently retrying dead
 * credentials.
 */

export type SyncErrorKind = "auth" | "transient";

export class SyncError extends Error {
  readonly kind: SyncErrorKind;

  constructor(kind: SyncErrorKind, message: string) {
    super(message);
    this.name = "SyncError";
    this.kind = kind;
  }
}

// Substrings that mark a credential rejection rather than a recoverable
// network hiccup. Matched case-insensitively against the libsql/Turso error
// text that crosses the Tauri boundary as a plain string.
const AUTH_SIGNALS = [
  "401",
  "403",
  "unauthorized",
  "forbidden",
  "authentication",
  "auth token",
  "invalid token",
  "expired",
  "permission denied",
] as const;

export function classifySyncError(message: string): SyncErrorKind {
  const normalized = message.toLowerCase();
  return AUTH_SIGNALS.some((signal) => normalized.includes(signal))
    ? "auth"
    : "transient";
}

function toSyncError(error: unknown): SyncError {
  if (error instanceof SyncError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new SyncError(classifySyncError(message), message);
}

export interface SyncRetryInfo {
  attempt: number;
  delayMs: number;
  error: SyncError;
}

export interface SyncRetryOptions {
  /** Total attempts including the first (default 3). */
  attempts?: number;
  /** Base backoff in ms, doubled each retry (default 500). */
  backoffMs?: number;
  /** Upper bound for a single backoff wait (default 4000). */
  maxBackoffMs?: number;
  /** Injectable wait so tests do not sleep in real time. */
  delay?: (ms: number) => Promise<void>;
  /** Notified before each retry wait (never for auth failures). */
  onRetry?: (info: SyncRetryInfo) => void;
}

const defaultDelay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Run `sync`, retrying only transient failures with capped exponential
 * backoff. Auth failures throw immediately (kind `"auth"`); after the last
 * attempt the final transient failure is thrown (kind `"transient"`).
 */
export async function syncWithRetry(
  sync: () => Promise<void>,
  options: SyncRetryOptions = {},
): Promise<void> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const backoffMs = Math.max(0, options.backoffMs ?? 500);
  const maxBackoffMs = Math.max(backoffMs, options.maxBackoffMs ?? 4000);
  const delay = options.delay ?? defaultDelay;

  let lastError = new SyncError("transient", "sync did not run");
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await sync();
      return;
    } catch (error) {
      lastError = toSyncError(error);
      if (lastError.kind === "auth" || attempt === attempts) {
        throw lastError;
      }
      const delayMs = Math.min(maxBackoffMs, backoffMs * 2 ** (attempt - 1));
      options.onRetry?.({ attempt, delayMs, error: lastError });
      await delay(delayMs);
    }
  }
  // Unreachable: the final attempt always returns or throws above.
  throw lastError;
}
