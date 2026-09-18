/**
 * Microsoft Entra tokens from the Azure CLI (ADR 2026-09-04 Decision 3).
 *
 * The team library authenticates every new PostgreSQL connection with an
 * Entra access token. The Azure CLI already holds the colleague's login on
 * every pilot machine, so ZAM borrows it: one subprocess per new pooled
 * connection, no MSAL, no app registration, no secret at rest. This module is
 * the only place that spawns `az`; the kernel's provider receives a plain
 * password-supplier function.
 */

import { execFile } from "node:child_process";
import { registerPostgresPasswordSupplier } from "../../kernel/db/connection.js";

/** Resource the token must be issued for — Azure Database for PostgreSQL. */
export const ENTRA_POSTGRES_RESOURCE_TYPE = "oss-rdbms";

export type EntraLoginFailure =
  | "az-missing"
  | "not-logged-in"
  | "no-token"
  | "az-error";

/**
 * Thrown when the Azure CLI cannot hand out a token. The message is the one
 * the surfaces show; `code` lets `zam doctor` and the Studio branch without
 * parsing prose.
 */
export class EntraLoginRequiredError extends Error {
  readonly code = "ENTRA_LOGIN_REQUIRED";
  constructor(
    readonly failure: EntraLoginFailure,
    message: string,
  ) {
    super(`ENTRA_LOGIN_REQUIRED: ${message}`);
    this.name = "EntraLoginRequiredError";
  }
}

export interface ExecResult {
  code: number | null;
  stdout: string;
  stderr: string;
  /** Set when the process could not be started at all (e.g. ENOENT). */
  spawnError?: NodeJS.ErrnoException;
}

export type ExecFn = (file: string, args: string[]) => Promise<ExecResult>;

const defaultExec: ExecFn = (file, args) =>
  new Promise((resolve) => {
    execFile(
      file,
      args,
      {
        encoding: "utf8",
        // `az` is a .cmd shim on Windows, which only a shell can start.
        shell: process.platform === "win32",
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout, stderr) => {
        if (error && (error as NodeJS.ErrnoException).code === "ENOENT") {
          resolve({
            code: null,
            stdout: "",
            stderr: "",
            spawnError: error as NodeJS.ErrnoException,
          });
          return;
        }
        resolve({
          code: error ? ((error as { code?: number }).code ?? 1) : 0,
          stdout: String(stdout ?? ""),
          stderr: String(stderr ?? ""),
        });
      },
    );
  });

function looksNotLoggedIn(stderr: string): boolean {
  return /az login|not logged in|no subscription found|AADSTS|interactive authentication is needed|refresh token has expired|Please run 'az login'/i.test(
    stderr,
  );
}

function isMissingBinary(result: ExecResult): boolean {
  if (result.spawnError?.code === "ENOENT") return true;
  // With `shell: true` a missing command surfaces as the shell's own message.
  return (
    result.code !== 0 &&
    /not recognized as an internal or external command|command not found|No such file or directory/i.test(
      result.stderr,
    )
  );
}

function classifyFailure(result: ExecResult): EntraLoginRequiredError {
  if (isMissingBinary(result)) {
    return new EntraLoginRequiredError(
      "az-missing",
      "The Azure CLI (az) was not found. Install it (https://aka.ms/installazurecli), then run `az login` and try again.",
    );
  }
  if (looksNotLoggedIn(result.stderr)) {
    return new EntraLoginRequiredError(
      "not-logged-in",
      "Run `az login` and try again.",
    );
  }
  const detail = result.stderr.trim().split(/\r?\n/).at(-1) ?? "";
  return new EntraLoginRequiredError(
    "az-error",
    `The Azure CLI could not provide a token${detail ? `: ${detail}` : ""}. Run \`az login\` and try again.`,
  );
}

/**
 * A fresh Entra access token for Azure Database for PostgreSQL, used as the
 * connection password. Tokens live roughly an hour; the provider calls this
 * once per new pooled connection, so nothing here caches.
 */
export async function entraCliAccessToken(
  exec: ExecFn = defaultExec,
): Promise<string> {
  const result = await exec("az", [
    "account",
    "get-access-token",
    "--resource-type",
    ENTRA_POSTGRES_RESOURCE_TYPE,
    "--query",
    "accessToken",
    "-o",
    "tsv",
  ]);
  if (result.code !== 0 || result.spawnError) throw classifyFailure(result);
  const token = result.stdout.trim();
  if (!token) {
    throw new EntraLoginRequiredError(
      "no-token",
      "The Azure CLI returned an empty token. Run `az login` and try again.",
    );
  }
  return token;
}

/**
 * The signed-in user's principal name — the database role a colleague
 * connects as. Read once at setup and stored as a non-secret beside host and
 * database (ADR 2026-09-04 Decision 3).
 */
export async function entraCliSignedInUpn(
  exec: ExecFn = defaultExec,
): Promise<string> {
  const result = await exec("az", [
    "ad",
    "signed-in-user",
    "show",
    "--query",
    "userPrincipalName",
    "-o",
    "tsv",
  ]);
  if (result.code !== 0 || result.spawnError) throw classifyFailure(result);
  const upn = result.stdout.trim();
  if (!upn) {
    throw new EntraLoginRequiredError(
      "no-token",
      "The Azure CLI did not report a signed-in user. Run `az login` and try again.",
    );
  }
  return upn;
}

/**
 * Make the Azure CLI the `entra-cli` password source for every PostgreSQL
 * database this process opens. Called once by the CLI bootstrap; hosts that
 * embed the kernel without the CLI (none today) would register their own.
 */
export function registerEntraCliPasswordSupplier(): void {
  registerPostgresPasswordSupplier("entra-cli", () => entraCliAccessToken());
}

/** True for the typed failure this module raises — surfaces branch on it. */
export function isEntraLoginRequired(
  error: unknown,
): error is EntraLoginRequiredError {
  return (
    error instanceof EntraLoginRequiredError ||
    (error instanceof Error && /ENTRA_LOGIN_REQUIRED/.test(error.message))
  );
}
