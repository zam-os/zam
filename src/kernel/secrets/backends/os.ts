/**
 * `os://<name>` — a secret in this machine's OS-protected storage
 * (ADR 2026-10-08b D5): the Keychain, the Secret Service or DPAPI.
 *
 * `credentials.json` points here once its literal keys have moved
 * (`moveLiteralSecretsToOsStore`). Reads that arrive together — the parallel
 * jobs of one `resolveCredentials()` — go to the store as one batch, so on
 * Windows a start costs one PowerShell launch, not one per key.
 */

import { defaultOsSecretStore, type OsSecretStore } from "../os-store.js";
import { type SecretBackend, SecretResolutionError } from "../types.js";

/** The scheme credentials.json uses for a secret in OS storage. */
export const OS_SECRET_SCHEME = "os";

export function createOsSecretBackend(
  storeOf: () => OsSecretStore | null = defaultOsSecretStore,
): SecretBackend {
  let pending: {
    names: Set<string>;
    result: Promise<Map<string, string | null>>;
  } | null = null;

  const readBatched = (
    store: OsSecretStore,
    name: string,
  ): Promise<string | null> => {
    if (!pending) {
      const names = new Set<string>();
      const result = new Promise<Map<string, string | null>>(
        (resolve, reject) => {
          // Let every job of this resolution pass join before the store runs.
          setImmediate(() => {
            pending = null;
            const list = [...names];
            const read = store.getMany
              ? store.getMany(list)
              : Promise.all(list.map((n) => store.get(n))).then(
                  (values) => new Map(list.map((n, i) => [n, values[i]])),
                );
            read.then(resolve, reject);
          });
        },
      );
      pending = { names, result };
    }
    pending.names.add(name);
    return pending.result.then((values) => values.get(name) ?? null);
  };

  return {
    id: OS_SECRET_SCHEME,
    async isAvailable() {
      const store = storeOf();
      return store ? store.available().catch(() => false) : false;
    },
    async resolve(locator) {
      const uri = `${OS_SECRET_SCHEME}://${locator}`;
      const store = storeOf();
      if (!store) {
        throw new SecretResolutionError(
          "not-installed",
          uri,
          "This computer offers no OS secret storage ZAM can read.",
        );
      }
      let value: string | null;
      try {
        value = await readBatched(store, locator);
      } catch (err) {
        throw new SecretResolutionError(
          "backend-error",
          uri,
          err instanceof Error ? err.message : String(err),
        );
      }
      if (value === null || value === "") {
        throw new SecretResolutionError(
          "not-found",
          uri,
          "The secret is not in this computer's keychain, or the keychain is locked.",
        );
      }
      return value;
    },
  };
}
