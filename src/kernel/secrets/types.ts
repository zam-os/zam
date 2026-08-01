/**
 * Credential secret backends — vault references resolved at process start.
 *
 * See ADR 2026-07-30b. A stored secret is either a literal string or a
 * reference (`{ "$secret": "bw://item/field" }`). Accessors stay synchronous
 * by reading an in-memory snapshot filled once by `resolveCredentials()`.
 */

/** Backend-qualified locator, e.g. `"bw://zam-turso/token"`. */
export interface SecretRef {
  $secret: string;
}

/** On-disk form of a secret field: plain string or vault reference. */
export type StoredSecret = string | SecretRef;

/** Why resolving a vault reference failed. Each reason needs different guidance. */
export type SecretResolutionReason =
  | "not-installed"
  | "locked"
  | "not-found"
  | "backend-error";

export class SecretResolutionError extends Error {
  readonly reason: SecretResolutionReason;
  readonly ref: string;

  constructor(reason: SecretResolutionReason, ref: string, message: string) {
    super(message);
    this.name = "SecretResolutionError";
    this.reason = reason;
    this.ref = ref;
  }
}

/**
 * Pluggable vault reader. Deliberately read-only: ZAM never creates or
 * modifies vault items, and never holds a master password or session token.
 */
export interface SecretBackend {
  /** Scheme this backend claims, e.g. `"bw"`. */
  readonly id: string;
  /** CLI present and vault reachable — cheap, no secret access. */
  isAvailable(): Promise<boolean>;
  /** Resolve one locator (the part after `scheme://`). Throws SecretResolutionError. */
  resolve(locator: string): Promise<string>;
}

export function isSecretRef(value: unknown): value is SecretRef {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as SecretRef).$secret === "string" &&
    (value as SecretRef).$secret.length > 0
  );
}

/** Parse `"bw://item/field"` into scheme + locator. Returns null if malformed. */
export function parseSecretUri(
  uri: string,
): { scheme: string; locator: string } | null {
  const match = /^([a-z][a-z0-9+.-]*):\/\/(.+)$/i.exec(uri.trim());
  if (!match) return null;
  const scheme = match[1].toLowerCase();
  const locator = match[2];
  if (!locator) return null;
  return { scheme, locator };
}
