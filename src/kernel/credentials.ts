/**
 * Credential store — reads/writes ~/.zam/credentials.json
 *
 * Connector secrets (Turso URL/token, ADO PAT, etc.) live here instead of
 * inside the SQLite database. This ensures credentials survive db deletion,
 * which is required when migrating from plain SQLite to a libsql embedded
 * replica (Turso cloud sync).
 *
 * Secret fields may be literal strings or vault references
 * (`{ "$secret": "bw://item/field" }`). `resolveCredentials()` resolves
 * references once into an in-memory snapshot; synchronous accessors read
 * from that snapshot (ADR 2026-07-30b).
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
import {
  ensureDefaultSecretBackends,
  isSecretRef,
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

/** Resolved view — every secret field is a plain string. Accessor return type. */
export interface Credentials {
  turso?: Partial<TursoCredentials>;
  ado?: Partial<ADOCredentials>;
  /**
   * API keys for named LLM providers, keyed by the provider's reference name
   * (the `apiKeyRef` in the `llm.providers` setting). Kept here — not in the
   * database — so workspace exports / DB snapshots never carry provider keys.
   */
  llmProviders?: Record<string, { apiKey: string }>;
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
  llmProviders?: Record<string, { apiKey: StoredSecret }>;
}

export type { SecretRef, StoredSecret };

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
  // Restores persisted BW_SESSION (≤30 days) when present.
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
  if (stored.turso && isSecretRef(stored.turso.token)) return true;
  if (stored.ado && isSecretRef(stored.ado.pat)) return true;
  if (stored.llmProviders) {
    for (const entry of Object.values(stored.llmProviders)) {
      if (isSecretRef(entry?.apiKey)) return true;
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
  if (!stored.turso?.url || !isSecretRef(stored.turso.token)) return false;
  return getTursoCredentials(path) === null;
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
