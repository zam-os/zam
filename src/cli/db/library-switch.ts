/**
 * Switching a machine between its two possible libraries — a personal
 * Turso/sqld database and the team library on PostgreSQL (ADR 2026-09-04
 * Decision 6, pilot plan phase 7).
 *
 * ZAM binds a machine to one library at a time. A switch keeps the replaced
 * connection as the *previous* library (`credentials.json`), so switching
 * back is one step and needs no new token. Every function here returns the
 * secret-free facts a surface shows; the Studio's Settings card and the
 * `zam connector` commands are thin callers.
 */

import type {
  Database,
  DatabaseTargetInfo,
  PostgresAuthMode,
  PreviousLibrary,
} from "../../kernel/index.js";
import {
  clearPostgresCredentials,
  configuredLibraryKind,
  describePostgresTarget,
  getDatabaseTargetInfo,
  getPostgresCredentials,
  getPreviousLibrary,
  keepLibraryAsPrevious,
  loadStoredCredentials,
  openDatabaseWithSync,
  resolveCredentials,
  restorePreviousLibrary,
  setPostgresCredentials,
} from "../../kernel/index.js";
import { describeIdentity } from "../users/identity.js";
import { entraCliSignedInUpn } from "./entra-cli.js";

/** The other library kind is configured and the caller did not ask to replace it. */
export class LibraryConfiguredError extends Error {
  readonly code = "LIBRARY_CONFIGURED";
  constructor(readonly configured: "turso" | "postgres") {
    super(
      configured === "turso"
        ? "LIBRARY_CONFIGURED: A personal server database (Turso) is configured on this machine. Switch with --replace; it is kept as the previous library."
        : "LIBRARY_CONFIGURED: A team library (PostgreSQL) is configured on this machine. Switch with --replace; it is kept as the previous library.",
    );
    this.name = "LibraryConfiguredError";
  }
}

export interface TeamConnectInput {
  host: string;
  port?: number;
  database: string;
  /** Read from the Azure CLI when omitted with `entra-cli`. */
  username?: string;
  auth?: PostgresAuthMode;
  /** Only with `auth: "password"` — local Docker development. */
  password?: string;
  /** Keep a configured Turso database as the previous library and switch. */
  replace?: boolean;
}

/** What a surface needs to know after a switch or a status read. */
export interface LibraryStatus {
  target: DatabaseTargetInfo;
  /** Verified by opening the library. */
  connected: boolean;
  /** False when the server answered but the library is not provisioned yet. */
  provisioned: boolean;
  /** The learner id — on the team library derived from the connection. */
  userId: string | null;
  /** The database role the connection runs as (team library only). */
  role: string | null;
  /** True when the connected account is a mapped member. */
  member: boolean;
  previous: PreviousLibrary | null;
  /** Set when verification failed but the switch itself was kept. */
  verifyError?: string;
}

export interface TeamConnectDeps {
  signedInUpn: () => Promise<string>;
  open: () => Promise<Database>;
}

const defaultDeps: TeamConnectDeps = {
  signedInUpn: () => entraCliSignedInUpn(),
  open: () => openDatabaseWithSync(),
};

/** Open the configured library once and report who is connected. */
async function verifyConfiguredLibrary(
  open: () => Promise<Database>,
): Promise<Omit<LibraryStatus, "previous">> {
  const target = getDatabaseTargetInfo();
  let db: Database;
  try {
    db = await open();
  } catch (err) {
    if (/not provisioned yet/.test((err as Error).message)) {
      return {
        target,
        connected: true,
        provisioned: false,
        userId: null,
        // The role is known before the library opens: it is the configured
        // username, what the administrator will map.
        role: getPostgresCredentials()?.username ?? null,
        member: false,
      };
    }
    throw err;
  }
  try {
    const identity = await describeIdentity(db);
    return {
      target,
      connected: true,
      provisioned: true,
      userId: identity.userId,
      role: identity.role,
      member: identity.userId !== null,
    };
  } finally {
    await db.close().catch(() => undefined);
  }
}

/**
 * Point this machine at the team library and verify the connection. A
 * configured Turso database is refused unless `replace` is set, in which
 * case it is kept as the previous library. When verification fails for a
 * reason other than "not provisioned yet" or "not a member yet", the switch
 * is undone: the machine is left exactly as it was.
 */
export async function connectTeamLibrary(
  input: TeamConnectInput,
  deps: TeamConnectDeps = defaultDeps,
): Promise<LibraryStatus> {
  const host = input.host.trim();
  const database = input.database.trim();
  if (!host || !database) {
    throw new Error("Host and database are required.");
  }
  const stored = loadStoredCredentials();
  if (stored.turso?.url && !input.replace) {
    throw new LibraryConfiguredError("turso");
  }
  const auth: PostgresAuthMode = input.auth ?? "entra-cli";
  if (auth === "password" && !input.password) {
    throw new Error("A password is required with password authentication.");
  }
  const username =
    input.username?.trim() ||
    (auth === "entra-cli" ? await deps.signedInUpn() : "");
  if (!username) {
    throw new Error(
      auth === "password"
        ? "A username is required with password authentication."
        : "The Azure CLI did not report a signed-in account. Sign in first, or pass --username <upn>.",
    );
  }

  const earlierPostgres = stored.postgres;
  const keptTurso = stored.turso?.url ? keepLibraryAsPrevious("turso") : false;
  setPostgresCredentials({
    host,
    database,
    username,
    auth,
    ...(input.port !== undefined ? { port: input.port } : {}),
    ...(auth === "password" && input.password
      ? { password: input.password }
      : {}),
  });
  await resolveCredentials();
  if (!getPostgresCredentials()) {
    throw new Error("PostgreSQL credentials incomplete after setup.");
  }

  try {
    const status = await verifyConfiguredLibrary(deps.open);
    return { ...status, previous: getPreviousLibrary() };
  } catch (err) {
    // Undo: the learner keeps the library that worked.
    if (keptTurso) {
      restorePreviousLibrary(undefined, { keepCurrent: false });
    } else if (earlierPostgres?.host) {
      setPostgresCredentials({
        host: earlierPostgres.host,
        database: earlierPostgres.database ?? "",
        username: earlierPostgres.username ?? "",
        auth: earlierPostgres.auth ?? "entra-cli",
        ...(earlierPostgres.port !== undefined
          ? { port: earlierPostgres.port }
          : {}),
        ...(earlierPostgres.password !== undefined
          ? { password: earlierPostgres.password }
          : {}),
        ...(earlierPostgres.ssl !== undefined
          ? { ssl: earlierPostgres.ssl }
          : {}),
      });
    } else {
      clearPostgresCredentials();
    }
    await resolveCredentials();
    throw err;
  }
}

/**
 * Make the previous library the current one again, keeping the one being
 * left as the new previous. Verification failure does not undo the switch —
 * the learner asked for the library that used to work — but is reported.
 */
export async function restoreLibrary(
  open: () => Promise<Database> = () => openDatabaseWithSync(),
): Promise<LibraryStatus> {
  restorePreviousLibrary();
  await resolveCredentials();
  return statusAfterSwitch(open);
}

/**
 * Leave the team library ("Learn locally instead"): back to the previous
 * library when one is kept, else to the local SQLite file.
 */
export async function leaveTeamLibrary(
  open: () => Promise<Database> = () => openDatabaseWithSync(),
): Promise<LibraryStatus> {
  if (configuredLibraryKind() !== "postgres") {
    throw new Error("No team library is configured on this machine.");
  }
  if (getPreviousLibrary()) {
    restorePreviousLibrary(undefined, { keepCurrent: false });
  } else {
    clearPostgresCredentials();
  }
  await resolveCredentials();
  return statusAfterSwitch(open);
}

async function statusAfterSwitch(
  open: () => Promise<Database>,
): Promise<LibraryStatus> {
  try {
    const status = await verifyConfiguredLibrary(open);
    return { ...status, previous: getPreviousLibrary() };
  } catch (err) {
    return {
      target: getDatabaseTargetInfo(),
      connected: false,
      provisioned: false,
      userId: null,
      role: null,
      member: false,
      previous: getPreviousLibrary(),
      verifyError: (err as Error).message,
    };
  }
}

/** Where a configured team library points, for messages. */
export function describeConfiguredTeamLibrary(): string | null {
  const target = getPostgresCredentials();
  return target ? describePostgresTarget(target) : null;
}
