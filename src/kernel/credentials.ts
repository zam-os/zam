/**
 * Credential store — reads/writes ~/.zam/credentials.json
 *
 * Connector secrets (Turso URL/token, ADO PAT, etc.) live here instead of
 * inside the SQLite database. This ensures credentials survive db deletion,
 * which is required when migrating from plain SQLite to a libsql embedded
 * replica (Turso cloud sync).
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

export interface Credentials {
  turso?: Partial<TursoCredentials>;
  ado?: Partial<ADOCredentials>;
}

/** Load credentials from ~/.zam/credentials.json. Returns empty object if missing. */
export function loadCredentials(path?: string): Credentials {
  const p = path ?? DEFAULT_CREDENTIALS_PATH;
  if (!existsSync(p)) return {};
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as Credentials;
  } catch {
    return {};
  }
}

/** Save credentials to ~/.zam/credentials.json. */
export function saveCredentials(creds: Credentials, path?: string): void {
  const p = path ?? DEFAULT_CREDENTIALS_PATH;
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
}

/** Get complete Turso credentials, or null if incomplete. */
export function getTursoCredentials(path?: string): TursoCredentials | null {
  const creds = loadCredentials(path);
  if (creds.turso?.url && creds.turso?.token) {
    return {
      url: creds.turso.url,
      token: creds.turso.token,
      ...(creds.turso.mode ? { mode: creds.turso.mode } : {}),
    };
  }
  return null;
}

/** Set Turso credentials. */
export function setTursoCredentials(
  url: string,
  token: string,
  path?: string,
  mode?: TursoCredentials["mode"],
): void {
  const creds = loadCredentials(path);
  creds.turso = { url, token, ...(mode ? { mode } : {}) };
  saveCredentials(creds, path);
}

/** Clear Turso credentials. */
export function clearTursoCredentials(path?: string): void {
  const creds = loadCredentials(path);
  delete creds.turso;
  saveCredentials(creds, path);
}

/** Get complete ADO credentials, or null if incomplete. */
export function getADOCredentials(path?: string): ADOCredentials | null {
  const creds = loadCredentials(path);
  if (creds.ado?.org_url && creds.ado?.project && creds.ado?.pat) {
    return {
      org_url: creds.ado.org_url,
      project: creds.ado.project,
      pat: creds.ado.pat,
    };
  }
  return null;
}

/** Set ADO credentials. */
export function setADOCredentials(
  orgUrl: string,
  project: string,
  pat: string,
  path?: string,
): void {
  const creds = loadCredentials(path);
  creds.ado = { org_url: orgUrl, project, pat };
  saveCredentials(creds, path);
}

/** Clear ADO credentials. */
export function clearADOCredentials(path?: string): void {
  const creds = loadCredentials(path);
  delete creds.ado;
  saveCredentials(creds, path);
}
