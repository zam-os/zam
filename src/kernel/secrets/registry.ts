/**
 * Scheme → SecretBackend registry (mirrors the provider-registry pattern).
 */

import type { SecretBackend } from "./types.js";
import { parseSecretUri, SecretResolutionError } from "./types.js";

const backends = new Map<string, SecretBackend>();

/** Register (or replace) a secret backend by its scheme id. */
export function registerSecretBackend(backend: SecretBackend): void {
  backends.set(backend.id.toLowerCase(), backend);
}

/** Remove a backend. Intended for tests. */
export function unregisterSecretBackend(id: string): void {
  backends.delete(id.toLowerCase());
}

/** Clear every registered backend. Intended for tests. */
export function clearSecretBackends(): void {
  backends.clear();
}

export function getSecretBackend(id: string): SecretBackend | undefined {
  return backends.get(id.toLowerCase());
}

export function listSecretBackends(): SecretBackend[] {
  return [...backends.values()];
}

/**
 * Resolve a full reference URI (`bw://item/field`) through the registered
 * backend for its scheme. Unknown schemes fail hard — a ref-shaped string
 * must never be treated as a literal token.
 */
export async function resolveSecretUri(uri: string): Promise<string> {
  const parsed = parseSecretUri(uri);
  if (!parsed) {
    throw new SecretResolutionError(
      "backend-error",
      uri,
      `Invalid secret reference "${uri}". Expected scheme://locator (e.g. bw://item/field).`,
    );
  }
  const backend = getSecretBackend(parsed.scheme);
  if (!backend) {
    throw new SecretResolutionError(
      "not-installed",
      uri,
      `No secret backend registered for scheme "${parsed.scheme}". ` +
        (parsed.scheme === "bw"
          ? "Install the Bitwarden CLI: npm install -g @bitwarden/cli"
          : `Supported schemes: ${
              listSecretBackends()
                .map((b) => b.id)
                .join(", ") || "(none)"
            }.`),
    );
  }
  try {
    return await backend.resolve(parsed.locator);
  } catch (err) {
    if (err instanceof SecretResolutionError) {
      // Re-tag with the full URI so diagnostics always name the ref the
      // learner wrote, not just the backend-local locator.
      throw new SecretResolutionError(err.reason, uri, err.message);
    }
    throw new SecretResolutionError(
      "backend-error",
      uri,
      `Secret backend "${parsed.scheme}" failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}
