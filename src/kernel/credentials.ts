/**
 * Credential store — reads/writes ~/.zam/credentials.json
 *
 * Connector secrets (Turso URL/token, ADO PAT, etc.) live here instead of
 * inside the SQLite database. This ensures credentials survive db deletion,
 * which is required when migrating from plain SQLite to a libsql embedded
 * replica (Turso cloud sync).
 *
 * Secret fields may be literal strings or references
 * (`{ "$secret": "bw://item/field" }`). `resolveCredentials()` resolves
 * references once into an in-memory snapshot; synchronous accessors read
 * from that snapshot (ADR 2026-07-30b).
 *
 * Literal secrets do not stay literal where the OS offers protected storage
 * (ADR 2026-10-08b D5): `moveLiteralSecretsToOsStore()` moves each into the
 * Keychain, the Secret Service or DPAPI and leaves an `os://` reference.
 * An `os://` reference is local to this machine, unlike a vault reference.
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { nowIso } from "./db/sql.js";
import {
  defaultOsSecretStore,
  ensureDefaultSecretBackends,
  isSecretRef,
  OS_SECRET_SCHEME,
  type OsSecretStore,
  parseSecretUri,
  resolveSecretUri,
  type SecretRef,
  SecretResolutionError,
  type StoredSecret,
} from "./secrets/index.js";

const DEFAULT_CREDENTIALS_PATH = join(homedir(), ".zam", "credentials.json");

export interface TursoCredentials {
  url: string;
  token: string;
  /**
   * Database access mode: "native" uses the legacy libsql driver, "remote"
   * uses the HTTP provider (no native bindings; required on Windows ARM64).
   */
  mode?: "native" | "remote";
}

export interface ADOCredentials {
  org_url: string;
  project: string;
  pat: string;
}

/**
 * How the PostgreSQL provider authenticates (ADR 2026-09-04 Decision 3).
 *
 * - `entra-cli`: the password of every new pooled connection is a fresh
 *   Microsoft Entra access token fetched from the Azure CLI by the host
 *   process — no secret at rest, no refresh loop.
 * - `password`: a literal or vault-referenced password, for local Docker
 *   development and for servers without Entra.
 */
export type PostgresAuthMode = "entra-cli" | "password";

/** Resolved PostgreSQL target — the team library (ADR 2026-09-04 Decision 6). */
export interface PostgresCredentials {
  host: string;
  port?: number;
  database: string;
  /** Database role to connect as; for Entra the user principal name. */
  username: string;
  auth: PostgresAuthMode;
  /** Only with `auth: "password"`; resolved to a plain string. */
  password?: string;
  /** TLS to the server. Defaults to on unless the host is loopback. */
  ssl?: boolean;
}

/** On-disk shape of the PostgreSQL block — the password may be a vault reference. */
export interface StoredPostgresCredentials {
  host: string;
  port?: number;
  database: string;
  username: string;
  auth: PostgresAuthMode;
  password?: StoredSecret;
  ssl?: boolean;
}

/** Resolved view — every secret field is a plain string. Accessor return type. */
export interface Credentials {
  turso?: Partial<TursoCredentials>;
  ado?: Partial<ADOCredentials>;
  postgres?: Partial<PostgresCredentials>;
  /**
   * API keys for named LLM providers, keyed by the provider's reference name
   * (the `apiKeyRef` in the `llm.providers` setting). Kept here — not in the
   * database — so workspace exports / DB snapshots never carry provider keys.
   */
  llmProviders?: Record<string, { apiKey: string }>;
}

/** The two library kinds a machine can be bound to (ADR 2026-09-04 Decision 6). */
export type LibraryKind = "turso" | "postgres";

/**
 * The connection a switch replaced, kept so switching back needs no new
 * token (pilot plan phase 7). Exactly one is kept: a second switch
 * overwrites it.
 */
export interface StoredPreviousLibrary {
  kind: LibraryKind;
  turso?: StoredCredentials["turso"];
  postgres?: Partial<StoredPostgresCredentials>;
  /** ISO-8601 UTC. */
  replacedAt: string;
}

/** Secret-free view of the kept connection, for status surfaces. */
export interface PreviousLibrary {
  kind: LibraryKind;
  location: string;
  replacedAt: string;
}

/** On-disk document — secret fields may be literals or vault references. */
export interface StoredCredentials {
  turso?: {
    url?: string;
    token?: StoredSecret;
    mode?: TursoCredentials["mode"];
  };
  ado?: {
    org_url?: string;
    project?: string;
    pat?: StoredSecret;
  };
  postgres?: Partial<StoredPostgresCredentials>;
  previous?: StoredPreviousLibrary;
  llmProviders?: Record<string, { apiKey: StoredSecret }>;
  /**
   * Names ZAM created in OS storage (ADR 2026-10-08b D5). One the document no
   * longer refers to is deleted at the next start — not at once, because an
   * undo within the same command may point a field back at it.
   */
  osSecrets?: string[];
}

export type { SecretRef, StoredSecret };

/** A reference into a vault the learner unlocks (Bitwarden), not OS storage. */
export function isVaultReference(value: unknown): value is SecretRef {
  return (
    isSecretRef(value) &&
    parseSecretUri(value.$secret)?.scheme !== OS_SECRET_SCHEME
  );
}

/** A reference into this machine's OS-protected storage (`os://`). */
export function isOsReference(value: unknown): value is SecretRef {
  return (
    isSecretRef(value) &&
    parseSecretUri(value.$secret)?.scheme === OS_SECRET_SCHEME
  );
}

// ── Process-lifetime resolution snapshot ────────────────────────────────────

interface SnapshotEntry {
  /** Fully resolved credentials (literals + vault values). */
  credentials: Credentials;
  /** Per-ref failure reasons for diagnostics / credentials check. */
  failures: Map<string, SecretResolutionError>;
  /** True after a successful resolveCredentials() for this path. */
  resolved: boolean;
}

const snapshots = new Map<string, SnapshotEntry>();
/** Paths that already emitted the one-time "accessed before resolve" warning. */
const preResolveWarned = new Set<string>();

function credentialsPath(path?: string): string {
  return path ?? DEFAULT_CREDENTIALS_PATH;
}

function getSnapshot(path?: string): SnapshotEntry | undefined {
  return snapshots.get(credentialsPath(path));
}

/** Drop the in-memory snapshot so the next read re-materializes from disk. */
export function invalidateCredentialsSnapshot(path?: string): void {
  snapshots.delete(credentialsPath(path));
}

/**
 * Test helper: wipe all snapshots and pre-resolve warning state so tests
 * do not leak across files.
 */
export function resetCredentialsResolutionState(): void {
  snapshots.clear();
  preResolveWarned.clear();
}

function emitDiagnostic(message: string): void {
  // stderr only — bridge keeps stdout JSON-clean.
  process.stderr.write(`${message}\n`);
}

function materializeLiteralsOnly(stored: StoredCredentials): Credentials {
  const out: Credentials = {};
  if (stored.turso) {
    const token =
      typeof stored.turso.token === "string" ? stored.turso.token : undefined;
    out.turso = {
      ...(stored.turso.url !== undefined ? { url: stored.turso.url } : {}),
      ...(token !== undefined ? { token } : {}),
      ...(stored.turso.mode !== undefined ? { mode: stored.turso.mode } : {}),
    };
  }
  if (stored.ado) {
    const pat = typeof stored.ado.pat === "string" ? stored.ado.pat : undefined;
    out.ado = {
      ...(stored.ado.org_url !== undefined
        ? { org_url: stored.ado.org_url }
        : {}),
      ...(stored.ado.project !== undefined
        ? { project: stored.ado.project }
        : {}),
      ...(pat !== undefined ? { pat } : {}),
    };
  }
  if (stored.postgres) {
    const pg = stored.postgres;
    const password = typeof pg.password === "string" ? pg.password : undefined;
    out.postgres = {
      ...(pg.host !== undefined ? { host: pg.host } : {}),
      ...(pg.port !== undefined ? { port: pg.port } : {}),
      ...(pg.database !== undefined ? { database: pg.database } : {}),
      ...(pg.username !== undefined ? { username: pg.username } : {}),
      ...(pg.auth !== undefined ? { auth: pg.auth } : {}),
      ...(password !== undefined ? { password } : {}),
      ...(pg.ssl !== undefined ? { ssl: pg.ssl } : {}),
    };
  }
  if (stored.llmProviders) {
    const providers: Record<string, { apiKey: string }> = {};
    for (const [name, entry] of Object.entries(stored.llmProviders)) {
      if (typeof entry?.apiKey === "string" && entry.apiKey.length > 0) {
        providers[name] = { apiKey: entry.apiKey };
      }
    }
    if (Object.keys(providers).length > 0) {
      out.llmProviders = providers;
    }
  }
  return out;
}

function storedHasReferences(stored: StoredCredentials): boolean {
  if (stored.turso && isSecretRef(stored.turso.token)) return true;
  if (stored.ado && isSecretRef(stored.ado.pat)) return true;
  if (stored.postgres && isSecretRef(stored.postgres.password)) return true;
  if (stored.llmProviders) {
    for (const entry of Object.values(stored.llmProviders)) {
      if (isSecretRef(entry?.apiKey)) return true;
    }
  }
  return false;
}

/**
 * Walk the on-disk document, resolve every vault reference in parallel, and
 * cache the result for synchronous accessors. Idempotent. Never writes
 * resolved plaintext back to disk.
 */
export async function resolveCredentials(path?: string): Promise<Credentials> {
  ensureDefaultSecretBackends();
  const p = credentialsPath(path);
  const stored = loadStoredCredentials(p);
  const resolved = materializeLiteralsOnly(stored);
  const failures = new Map<string, SecretResolutionError>();

  type Job = {
    label: string;
    uri: string;
    apply: (value: string) => void;
  };
  const jobs: Job[] = [];

  if (stored.turso && isSecretRef(stored.turso.token)) {
    const uri = stored.turso.token.$secret;
    jobs.push({
      label: "turso.token",
      uri,
      apply: (value) => {
        resolved.turso = { ...resolved.turso, token: value };
      },
    });
  }
  if (stored.ado && isSecretRef(stored.ado.pat)) {
    const uri = stored.ado.pat.$secret;
    jobs.push({
      label: "ado.pat",
      uri,
      apply: (value) => {
        resolved.ado = { ...resolved.ado, pat: value };
      },
    });
  }
  if (stored.postgres && isSecretRef(stored.postgres.password)) {
    const uri = stored.postgres.password.$secret;
    jobs.push({
      label: "postgres.password",
      uri,
      apply: (value) => {
        resolved.postgres = { ...resolved.postgres, password: value };
      },
    });
  }
  if (stored.llmProviders) {
    for (const [name, entry] of Object.entries(stored.llmProviders)) {
      if (isSecretRef(entry?.apiKey)) {
        const uri = entry.apiKey.$secret;
        jobs.push({
          label: `llmProviders.${name}.apiKey`,
          uri,
          apply: (value) => {
            resolved.llmProviders = {
              ...resolved.llmProviders,
              [name]: { apiKey: value },
            };
          },
        });
      }
    }
  }

  await Promise.all(
    jobs.map(async (job) => {
      try {
        const value = await resolveSecretUri(job.uri);
        if (value.length === 0) {
          throw new SecretResolutionError(
            "not-found",
            job.uri,
            `Secret reference "${job.uri}" resolved to an empty value.`,
          );
        }
        job.apply(value);
      } catch (err) {
        const failure =
          err instanceof SecretResolutionError
            ? err
            : new SecretResolutionError(
                "backend-error",
                job.uri,
                err instanceof Error ? err.message : String(err),
              );
        failures.set(job.label, failure);
        // Actionable diagnostic — names the ref and reason, never the value.
        emitDiagnostic(
          `zam: failed to resolve ${job.label} (${job.uri}): ${failure.reason} — ${failure.message}`,
        );
      }
    }),
  );

  snapshots.set(p, { credentials: resolved, failures, resolved: true });
  return resolved;
}

/**
 * Status of every secret field — for `zam credentials check`. Never includes
 * secret values.
 */
export interface CredentialCheckEntry {
  field: string;
  kind: "literal" | "reference" | "missing";
  ref?: string;
  ok: boolean;
  reason?: string;
  message?: string;
}

export function checkCredentials(path?: string): CredentialCheckEntry[] {
  const stored = loadStoredCredentials(path);
  const snap = getSnapshot(path);
  const entries: CredentialCheckEntry[] = [];

  const pushSecret = (
    field: string,
    value: StoredSecret | undefined,
    resolvedValue: string | undefined,
  ): void => {
    if (value === undefined) {
      entries.push({ field, kind: "missing", ok: false });
      return;
    }
    if (isSecretRef(value)) {
      const failure = snap?.failures.get(field);
      const ok =
        !failure &&
        typeof resolvedValue === "string" &&
        resolvedValue.length > 0;
      entries.push({
        field,
        kind: "reference",
        ref: value.$secret,
        ok,
        ...(failure
          ? { reason: failure.reason, message: failure.message }
          : ok
            ? {}
            : {
                reason: "backend-error",
                message: snap?.resolved
                  ? "Reference did not resolve to a value."
                  : "Credentials have not been resolved yet. Call resolveCredentials() first.",
              }),
      });
      return;
    }
    entries.push({
      field,
      kind: "literal",
      ok: value.length > 0,
      ...(value.length === 0
        ? { reason: "not-found", message: "Literal secret is empty." }
        : {}),
    });
  };

  // Only report fields that exist in the on-disk document (configured secrets).
  if (stored.turso?.token !== undefined) {
    pushSecret(
      "turso.token",
      stored.turso.token,
      snap?.credentials.turso?.token,
    );
  }
  if (stored.ado?.pat !== undefined) {
    pushSecret("ado.pat", stored.ado.pat, snap?.credentials.ado?.pat);
  }
  if (stored.postgres?.password !== undefined) {
    pushSecret(
      "postgres.password",
      stored.postgres.password,
      snap?.credentials.postgres?.password,
    );
  }

  for (const name of Object.keys(stored.llmProviders ?? {}).sort()) {
    pushSecret(
      `llmProviders.${name}.apiKey`,
      stored.llmProviders?.[name]?.apiKey,
      snap?.credentials.llmProviders?.[name]?.apiKey,
    );
  }

  return entries;
}

function readResolved(path?: string): Credentials {
  const p = credentialsPath(path);
  const snap = snapshots.get(p);
  if (snap?.resolved) {
    return snap.credentials;
  }

  // Degradation rule (ADR decision 5): before resolveCredentials(), return
  // literals only and treat references as missing. Warn once per path when
  // the document actually contains references.
  const stored = loadStoredCredentials(p);
  if (storedHasReferences(stored) && !preResolveWarned.has(p)) {
    preResolveWarned.add(p);
    emitDiagnostic(
      "zam: credentials accessed before resolveCredentials(); vault references are treated as unset until resolution runs.",
    );
  }
  return materializeLiteralsOnly(stored);
}

// ── Disk I/O ────────────────────────────────────────────────────────────────

/** Load the on-disk document (literals and references). Empty if missing. */
export function loadStoredCredentials(path?: string): StoredCredentials {
  const p = credentialsPath(path);
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as StoredCredentials;
  } catch {
    return {};
  }
}

/**
 * Load credentials. After `resolveCredentials()` this returns the resolved
 * snapshot; otherwise literals only (references omitted). Prefer the
 * typed accessors for production call sites.
 */
export function loadCredentials(path?: string): Credentials {
  return readResolved(path);
}

/** Every `os://` name a stored document refers to, wherever it sits. */
function osSecretNames(doc: unknown, into = new Set<string>()): Set<string> {
  if (isOsReference(doc)) {
    const parsed = parseSecretUri(doc.$secret);
    if (parsed) into.add(parsed.locator);
  } else if (doc && typeof doc === "object") {
    for (const value of Object.values(doc)) osSecretNames(value, into);
  }
  return into;
}

/** Save credentials to ~/.zam/credentials.json. Invalidates any snapshot. */
export function saveCredentials(
  creds: StoredCredentials | Credentials,
  path?: string,
): void {
  const p = credentialsPath(path);
  const dir = dirname(p);
  let createdDirectory = false;
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    createdDirectory = true;
  }
  if (
    process.platform !== "win32" &&
    (path === undefined || createdDirectory)
  ) {
    chmodSync(dir, 0o700);
  }
  writeFileSync(p, `${JSON.stringify(creds, null, 2)}\n`, {
    encoding: "utf-8",
    mode: 0o600,
  });
  if (process.platform !== "win32") {
    chmodSync(p, 0o600);
  }
  invalidateCredentialsSnapshot(p);
}

/** Get complete Turso credentials, or null if incomplete. */
export function getTursoCredentials(path?: string): TursoCredentials | null {
  const creds = readResolved(path);
  if (creds.turso?.url && creds.turso?.token) {
    return {
      url: creds.turso.url,
      token: creds.turso.token,
      ...(creds.turso.mode ? { mode: creds.turso.mode } : {}),
    };
  }
  return null;
}

/** Set Turso credentials. `token` may be a literal or a vault reference. */
export function setTursoCredentials(
  url: string,
  token: StoredSecret,
  path?: string,
  mode?: TursoCredentials["mode"],
): void {
  const creds = loadStoredCredentials(path);
  creds.turso = { url, token, ...(mode ? { mode } : {}) };
  saveCredentials(creds, path);
}

/** Clear Turso credentials. */
export function clearTursoCredentials(path?: string): void {
  const creds = loadStoredCredentials(path);
  delete creds.turso;
  saveCredentials(creds, path);
}

/**
 * Get the complete PostgreSQL target, or null if incomplete.
 *
 * "Complete" depends on the auth mode: `entra-cli` needs no password (the
 * host fetches a token per connection), `password` needs a resolved one — so
 * a vault-referenced password that failed to resolve reads as unconfigured,
 * and `postgresVaultAccessPending()` tells that case apart.
 */
export function getPostgresCredentials(
  path?: string,
): PostgresCredentials | null {
  const pg = readResolved(path).postgres;
  if (!pg?.host || !pg.database || !pg.username || !pg.auth) return null;
  if (pg.auth === "password" && !pg.password) return null;
  return {
    host: pg.host,
    database: pg.database,
    username: pg.username,
    auth: pg.auth,
    ...(pg.port !== undefined ? { port: pg.port } : {}),
    ...(pg.password !== undefined ? { password: pg.password } : {}),
    ...(pg.ssl !== undefined ? { ssl: pg.ssl } : {}),
  };
}

/** Store the PostgreSQL target. The password may be a literal or a vault reference. */
export function setPostgresCredentials(
  target: StoredPostgresCredentials,
  path?: string,
): void {
  const creds = loadStoredCredentials(path);
  creds.postgres = {
    host: target.host,
    database: target.database,
    username: target.username,
    auth: target.auth,
    ...(target.port !== undefined ? { port: target.port } : {}),
    ...(target.password !== undefined ? { password: target.password } : {}),
    ...(target.ssl !== undefined ? { ssl: target.ssl } : {}),
  };
  saveCredentials(creds, path);
}

/** Clear the PostgreSQL target. */
export function clearPostgresCredentials(path?: string): void {
  const creds = loadStoredCredentials(path);
  delete creds.postgres;
  saveCredentials(creds, path);
}

// ── Switching between libraries (pilot plan phase 7) ────────────────────────

function locationOf(
  kind: LibraryKind,
  block: StoredCredentials["turso"] | Partial<StoredPostgresCredentials>,
): string {
  if (kind === "turso") {
    return (block as StoredCredentials["turso"])?.url ?? "?";
  }
  const pg = block as Partial<StoredPostgresCredentials>;
  return `postgres://${pg.host ?? "?"}:${pg.port ?? 5432}/${pg.database ?? "?"}`;
}

/** Which library kind the document currently binds the machine to, if any. */
export function configuredLibraryKind(path?: string): LibraryKind | null {
  const creds = loadStoredCredentials(path);
  if (creds.postgres?.host) return "postgres";
  if (creds.turso?.url) return "turso";
  return null;
}

/**
 * Move the configured library of `kind` aside as the previous library, so
 * the other kind can take its place and the learner can switch back without
 * fetching a new token. Returns false when nothing of that kind was stored.
 */
export function keepLibraryAsPrevious(
  kind: LibraryKind,
  path?: string,
): boolean {
  const creds = loadStoredCredentials(path);
  const block = kind === "turso" ? creds.turso : creds.postgres;
  if (!block) return false;
  creds.previous = {
    kind,
    ...(kind === "turso"
      ? { turso: creds.turso }
      : { postgres: creds.postgres }),
    replacedAt: nowIso(),
  };
  delete creds[kind];
  saveCredentials(creds, path);
  return true;
}

/** The kept connection without its secret, or null. */
export function getPreviousLibrary(path?: string): PreviousLibrary | null {
  const previous = loadStoredCredentials(path).previous;
  if (!previous?.kind) return null;
  const block = previous.kind === "turso" ? previous.turso : previous.postgres;
  if (!block) return null;
  return {
    kind: previous.kind,
    location: locationOf(previous.kind, block),
    replacedAt: previous.replacedAt,
  };
}

/** Forget the kept connection (its token goes with it). */
export function clearPreviousLibrary(path?: string): void {
  const creds = loadStoredCredentials(path);
  delete creds.previous;
  saveCredentials(creds, path);
}

/**
 * Make the previous library the current one again. With `keepCurrent` (the
 * default) the library being left becomes the new previous, so a learner can
 * flip back and forth; without it the current connection is dropped — the
 * undo of a switch whose verification failed.
 */
export function restorePreviousLibrary(
  path?: string,
  options: { keepCurrent?: boolean } = {},
): { restored: LibraryKind; kept: LibraryKind | null } {
  const creds = loadStoredCredentials(path);
  const previous = creds.previous;
  const block =
    previous?.kind === "turso" ? previous.turso : previous?.postgres;
  if (!previous?.kind || !block) {
    throw new Error("No previous library is kept on this machine.");
  }
  const current: LibraryKind | null = creds.postgres?.host
    ? "postgres"
    : creds.turso?.url
      ? "turso"
      : null;
  const keepCurrent = options.keepCurrent ?? true;
  let kept: LibraryKind | null = null;
  if (current && keepCurrent && current !== previous.kind) {
    creds.previous = {
      kind: current,
      ...(current === "turso"
        ? { turso: creds.turso }
        : { postgres: creds.postgres }),
      replacedAt: nowIso(),
    };
    kept = current;
  } else {
    delete creds.previous;
  }
  if (current) delete creds[current];
  if (previous.kind === "turso") creds.turso = previous.turso;
  else creds.postgres = previous.postgres;
  saveCredentials(creds, path);
  return { restored: previous.kind, kept };
}

/**
 * True when a PostgreSQL password is a vault reference that has not resolved
 * into a usable value (vault locked / not logged in / resolve failed).
 */
export function postgresVaultAccessPending(path?: string): boolean {
  const stored = loadStoredCredentials(path);
  if (!stored.postgres?.host || !isVaultReference(stored.postgres.password)) {
    return false;
  }
  return getPostgresCredentials(path) === null;
}

/** Get complete ADO credentials, or null if incomplete. */
export function getADOCredentials(path?: string): ADOCredentials | null {
  const creds = readResolved(path);
  if (creds.ado?.org_url && creds.ado?.project && creds.ado?.pat) {
    return {
      org_url: creds.ado.org_url,
      project: creds.ado.project,
      pat: creds.ado.pat,
    };
  }
  return null;
}

/** Set ADO credentials. `pat` may be a literal or a vault reference. */
export function setADOCredentials(
  orgUrl: string,
  project: string,
  pat: StoredSecret,
  path?: string,
): void {
  const creds = loadStoredCredentials(path);
  creds.ado = { org_url: orgUrl, project, pat };
  saveCredentials(creds, path);
}

/** Clear ADO credentials. */
export function clearADOCredentials(path?: string): void {
  const creds = loadStoredCredentials(path);
  delete creds.ado;
  saveCredentials(creds, path);
}

/** Get a named LLM provider's API key (by `apiKeyRef`), or null if unset. */
export function getProviderApiKey(name: string, path?: string): string | null {
  const key = readResolved(path).llmProviders?.[name]?.apiKey;
  return key && key.length > 0 ? key : null;
}

/** Store a named LLM provider's API key. May be a literal or vault reference. */
export function setProviderApiKey(
  name: string,
  apiKey: StoredSecret,
  path?: string,
): void {
  const creds = loadStoredCredentials(path);
  creds.llmProviders = { ...creds.llmProviders, [name]: { apiKey } };
  saveCredentials(creds, path);
}

/** Remove a named LLM provider's stored API key. No-op if it was unset. */
export function clearProviderApiKey(name: string, path?: string): void {
  const creds = loadStoredCredentials(path);
  if (creds.llmProviders && name in creds.llmProviders) {
    delete creds.llmProviders[name];
    saveCredentials(creds, path);
  }
}

/** List the reference names (`apiKeyRef`) that currently have a stored key. */
export function listProviderApiKeyRefs(path?: string): string[] {
  // List from the on-disk document so refs that failed to resolve still appear.
  return Object.keys(loadStoredCredentials(path).llmProviders ?? {});
}

/** True when `value` looks like a vault reference URI (scheme://…). */
export function looksLikeSecretUri(value: string): boolean {
  return /^[a-z][a-z0-9+.-]*:\/\/.+/i.test(value.trim());
}

/**
 * True when credentials.json holds at least one vault reference. Desktop and
 * openDatabase use this to require Bitwarden access before falling back to an
 * empty local DB.
 */
export function credentialsNeedVaultAccess(path?: string): boolean {
  const stored = loadStoredCredentials(path);
  if (stored.turso && isVaultReference(stored.turso.token)) return true;
  if (stored.ado && isVaultReference(stored.ado.pat)) return true;
  if (stored.postgres && isVaultReference(stored.postgres.password)) {
    return true;
  }
  if (stored.llmProviders) {
    for (const entry of Object.values(stored.llmProviders)) {
      if (isVaultReference(entry?.apiKey)) return true;
    }
  }
  return false;
}

/**
 * True when a Turso vault ref is configured but not yet resolved into a usable
 * token (vault locked / not logged in / resolve failed).
 */
export function tursoVaultAccessPending(path?: string): boolean {
  const stored = loadStoredCredentials(path);
  if (!stored.turso?.url || !isVaultReference(stored.turso.token)) {
    return false;
  }
  return getTursoCredentials(path) === null;
}

/**
 * The configured library's secret when it sits in OS storage and did not
 * resolve: the keychain is locked, or this session cannot reach it (an SSH
 * login, another user). Null otherwise.
 */
export function libraryOsSecretPending(
  path?: string,
): "turso.token" | "postgres.password" | null {
  const stored = loadStoredCredentials(path);
  if (
    stored.postgres?.host &&
    isOsReference(stored.postgres.password) &&
    getPostgresCredentials(path) === null
  ) {
    return "postgres.password";
  }
  if (
    stored.turso?.url &&
    isOsReference(stored.turso.token) &&
    getTursoCredentials(path) === null
  ) {
    return "turso.token";
  }
  return null;
}

// ── Literal secrets into OS storage (ADR 2026-10-08b D5) ────────────────────

interface LiteralSecretSlot {
  /** Field label, as `zam credentials check` shows it. */
  field: string;
  value: string;
  /** Point the field in `doc` at `ref`, if it still holds `value`. */
  replace: (doc: StoredCredentials, ref: SecretRef) => boolean;
}

/** Every secret field of a stored document that still holds a literal. */
function literalSecretSlots(stored: StoredCredentials): LiteralSecretSlot[] {
  const slots: LiteralSecretSlot[] = [];
  const add = (
    field: string,
    value: StoredSecret | undefined,
    holder: (doc: StoredCredentials) => { [key: string]: unknown } | undefined,
    key: string,
  ): void => {
    if (typeof value !== "string" || value.length === 0) return;
    slots.push({
      field,
      value,
      replace: (doc, ref) => {
        const target = holder(doc);
        if (!target || target[key] !== value) return false;
        target[key] = ref;
        return true;
      },
    });
  };
  add("turso.token", stored.turso?.token, (d) => d.turso, "token");
  add("ado.pat", stored.ado?.pat, (d) => d.ado, "pat");
  add(
    "postgres.password",
    stored.postgres?.password,
    (d) => d.postgres,
    "password",
  );
  add(
    "previous.turso.token",
    stored.previous?.turso?.token,
    (d) => d.previous?.turso,
    "token",
  );
  add(
    "previous.postgres.password",
    stored.previous?.postgres?.password,
    (d) => d.previous?.postgres,
    "password",
  );
  for (const [name, entry] of Object.entries(stored.llmProviders ?? {})) {
    add(
      `llmProviders.${name}.apiKey`,
      entry?.apiKey,
      (d) => d.llmProviders?.[name],
      "apiKey",
    );
  }
  return slots;
}

/** A fresh store name per secret, so a kept previous library never collides. */
function osNameFor(field: string): string {
  const slug = field.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 80);
  const suffix = Math.random().toString(36).slice(2, 10);
  return `credential:${slug}:${suffix}`;
}

/**
 * Move every literal secret in credentials.json into OS-protected storage
 * and leave an `os://` reference in its place (ADR 2026-10-08b D5).
 *
 * A field is rewritten only after its value was stored and read back
 * unchanged; anything that fails stays literal and is tried again at the next
 * start. The document is re-read just before the write, and a field another
 * writer changed meanwhile is left alone. The resolved snapshot stays valid:
 * the values did not change, only where they are kept. Entries ZAM created
 * earlier that nothing refers to any more are deleted. Where the OS offers no
 * storage, nothing happens.
 */
export async function moveLiteralSecretsToOsStore(
  path?: string,
  store: OsSecretStore | null = defaultOsSecretStore(),
): Promise<{ moved: string[]; failed: string[]; removed: string[] }> {
  const none = { moved: [], failed: [], removed: [] };
  const p = credentialsPath(path);
  const current = loadStoredCredentials(p);
  const slots = literalSecretSlots(current);
  const referenced = osSecretNames(current);
  const orphans = (current.osSecrets ?? []).filter(
    (name) => !referenced.has(name),
  );
  if ((slots.length === 0 && orphans.length === 0) || !store) return none;
  if (!(await store.available().catch(() => false))) return none;

  for (const name of orphans) await store.delete(name).catch(() => undefined);

  const stored: Array<{ slot: LiteralSecretSlot; name: string }> = [];
  const failed: string[] = [];
  for (const slot of slots) {
    const name = osNameFor(slot.field);
    const ok = await store.set(name, slot.value).catch(() => false);
    if (ok) {
      stored.push({ slot, name });
    } else {
      failed.push(slot.field);
      await store.delete(name).catch(() => undefined);
    }
  }

  const doc = loadStoredCredentials(p);
  const moved: string[] = [];
  const created: string[] = [];
  for (const { slot, name } of stored) {
    if (slot.replace(doc, { $secret: `${OS_SECRET_SCHEME}://${name}` })) {
      moved.push(slot.field);
      created.push(name);
    } else {
      await store.delete(name).catch(() => undefined);
    }
  }
  const ledger = [
    ...(doc.osSecrets ?? []).filter((name) => !orphans.includes(name)),
    ...created,
  ];
  if (moved.length > 0 || orphans.length > 0) {
    if (ledger.length > 0) doc.osSecrets = ledger;
    else delete doc.osSecrets;
    const snapshot = snapshots.get(p);
    saveCredentials(doc, p);
    if (snapshot?.resolved) snapshots.set(p, snapshot);
  }
  return { moved, failed, removed: orphans };
}

/** Build a SecretRef from a URI, or throw if the URI is malformed. */
export function secretRefFromUri(uri: string): SecretRef {
  const trimmed = uri.trim();
  if (!looksLikeSecretUri(trimmed)) {
    throw new Error(
      `Invalid secret reference "${uri}". Expected scheme://locator (e.g. bw://item/field).`,
    );
  }
  return { $secret: trimmed };
}
