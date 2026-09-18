/**
 * Who is learning — the one place that answers it.
 *
 * On a personal library (SQLite, Turso) the identity is a stored setting,
 * `user.id`, with `--user` and `whoami --set` as overrides. On the **team
 * library** (PostgreSQL) the identity is the connection (ADR 2026-09-04
 * Decision 2): the database role a colleague connects as maps to a ZAM ULID
 * in `learner_principals`, `current_learner_id()` returns it, and nothing on
 * the client may announce a different one. A role without a mapping is a
 * lockout with one plain message — never a fallback to a local id, never
 * another colleague's queue.
 */

import type { Database } from "../../kernel/index.js";
import {
  dialectOf,
  getDatabaseTargetInfo,
  getSetting,
  setSetting,
} from "../../kernel/index.js";

export interface ResolveUserOptions {
  /** If true, output JSON error instead of console.error (for bridge commands). */
  json?: boolean;
}

/** The connected role has no `learner_principals` mapping. */
export class NotAMemberError extends Error {
  readonly code = "NOT_A_MEMBER";
  constructor(readonly role: string | null) {
    super(
      "NOT_A_MEMBER: Your account is not yet a member of this library. Ask the administrator to add you" +
        (role ? ` (database role: ${role}).` : "."),
    );
    this.name = "NotAMemberError";
  }
}

/** An explicit user id disagrees with the identity the connection carries. */
export class IdentityMismatchError extends Error {
  readonly code = "IDENTITY_MISMATCH";
  constructor(
    readonly requested: string,
    readonly derived: string,
  ) {
    super(
      `IDENTITY_MISMATCH: The team library identifies you as ${derived}; a different user (${requested}) cannot be selected here.`,
    );
    this.name = "IdentityMismatchError";
  }
}

/**
 * True when `db` is the team library. A lazily opened host handle does not
 * know its dialect before the first query, so the configured target decides
 * in that case — the same source `openDatabase()` used to pick the provider.
 */
export function isTeamLibrary(db: Database): boolean {
  if (db.dialect !== undefined) return dialectOf(db) === "postgres";
  try {
    return getDatabaseTargetInfo().kind === "postgres";
  } catch {
    return false;
  }
}

/**
 * One derivation per database handle: a host process (`zam mcp`,
 * `bridge serve`) resolves who is connected once and keeps it, exactly as
 * the ADR asks. A failed derivation is not cached, so a colleague who gets
 * mapped while the host runs is recognised on their next command.
 */
const derivedIdentities = new WeakMap<Database, Promise<DerivedIdentity>>();

export interface DerivedIdentity {
  userId: string;
  /** The PostgreSQL role the connection runs as. */
  role: string | null;
}

export async function deriveTeamIdentity(
  db: Database,
): Promise<DerivedIdentity> {
  let pending = derivedIdentities.get(db);
  if (!pending) {
    pending = (async () => {
      const row = (await db
        .prepare("SELECT current_user AS role, current_learner_id() AS learner")
        .get()) as
        | { role?: string | null; learner?: string | null }
        | undefined;
      const role = row?.role ?? null;
      if (!row?.learner) throw new NotAMemberError(role);
      return { userId: String(row.learner), role };
    })();
    pending.catch(() => {
      if (derivedIdentities.get(db) === pending) derivedIdentities.delete(db);
    });
    derivedIdentities.set(db, pending);
  }
  return pending;
}

/** Test hook: forget derived identities for a handle. */
export function forgetDerivedIdentity(db: Database): void {
  derivedIdentities.delete(db);
}

/**
 * The learner id for this database, throwing typed errors.
 *
 * Team library: the derived identity; an explicit id is accepted only when
 * it equals it. Personal library: the explicit id, else the stored
 * `user.id`, else `null`.
 */
export async function resolveLearnerId(
  db: Database,
  explicit?: string,
): Promise<string | null> {
  const requested = explicit?.trim() || undefined;
  if (isTeamLibrary(db)) {
    const { userId } = await deriveTeamIdentity(db);
    if (requested && requested !== userId) {
      throw new IdentityMismatchError(requested, userId);
    }
    return userId;
  }
  if (requested) return requested;
  return (await getSetting(db, "user.id")) ?? null;
}

/**
 * The active learner id or `null` — for status surfaces that must not fail
 * when nobody is configured or the connected role is not mapped yet.
 */
export async function currentUserIdOrNull(
  db: Database,
): Promise<string | null> {
  try {
    return await resolveLearnerId(db);
  } catch (error) {
    if (error instanceof NotAMemberError) return null;
    throw error;
  }
}

/**
 * Where the identity comes from — `whoami` shows it, and a surface can tell
 * a derived identity (not editable) from a configured one.
 */
export async function describeIdentity(db: Database): Promise<{
  userId: string | null;
  source: "team-library" | "configured" | "none";
  role: string | null;
}> {
  if (isTeamLibrary(db)) {
    try {
      const derived = await deriveTeamIdentity(db);
      return {
        userId: derived.userId,
        source: "team-library",
        role: derived.role,
      };
    } catch (error) {
      if (error instanceof NotAMemberError) {
        return { userId: null, source: "team-library", role: error.role };
      }
      throw error;
    }
  }
  const stored = (await getSetting(db, "user.id")) ?? null;
  return { userId: stored, source: stored ? "configured" : "none", role: null };
}

/**
 * Ensure the desktop has a usable identity on first launch.
 * Existing explicit configuration always wins; on the team library the
 * connection decides and nothing is written.
 */
export async function ensureDefaultUser(
  db: Database,
  preferredUserId?: string,
): Promise<string> {
  if (isTeamLibrary(db)) {
    return (await deriveTeamIdentity(db)).userId;
  }

  const stored = await getSetting(db, "user.id");
  if (stored) return stored;

  const userId =
    preferredUserId?.trim() ||
    process.env.ZAM_USER?.trim() ||
    process.env.USERNAME?.trim() ||
    process.env.USER?.trim() ||
    "default";
  await setSetting(db, "user.id", userId);
  return userId;
}

/** The message without its machine-readable `CODE: ` prefix, for people. */
export function humanIdentityMessage(message: string): string {
  return message.replace(/^(NOT_A_MEMBER|IDENTITY_MISMATCH): /, "");
}

/**
 * Bridge callers (`json: true`) get a thrown error: the bridge's own `withDb`
 * turns it into `{ "error": … }` and, in `bridge serve`, keeps the long-lived
 * host alive — a `process.exit` here would take the Studio's whole session
 * down with one bad `--user`. The plain CLI prints and exits as before.
 */
function fail(message: string, resolveOpts?: ResolveUserOptions): never {
  if (resolveOpts?.json) {
    throw new Error(message);
  }
  console.error(humanIdentityMessage(message));
  process.exit(1);
}

/**
 * Returns the user ID from the explicit --user flag, or falls back to the
 * stored `user.id` setting. On the team library the identity is derived from
 * the connection and `--user` must agree with it. Exits with an error when
 * no identity is available.
 */
export async function resolveUser(
  opts: { user?: string },
  db: Database,
  resolveOpts?: ResolveUserOptions,
): Promise<string> {
  let userId: string | null;
  try {
    userId = await resolveLearnerId(db, opts.user);
  } catch (error) {
    if (
      error instanceof NotAMemberError ||
      error instanceof IdentityMismatchError
    ) {
      return fail(error.message, resolveOpts);
    }
    throw error;
  }
  if (userId) return userId;
  return fail(
    "No user specified. Set a default with: zam whoami --set <id>",
    resolveOpts,
  );
}
