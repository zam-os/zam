/**
 * Secret backends public surface (ADR 2026-07-30b).
 */

export { createBitwardenBackend } from "./backends/bitwarden.js";
export {
  clearSecretBackends,
  getSecretBackend,
  listSecretBackends,
  registerSecretBackend,
  resolveSecretUri,
  unregisterSecretBackend,
} from "./registry.js";
export {
  BITWARDEN_SESSION_MAX_AGE_MS,
  clearPersistedBwSession,
  getPersistedBwSessionMeta,
  invalidateBwSession,
  restoreBwSessionToEnv,
  savePersistedBwSession,
} from "./session-store.js";
export type {
  SecretBackend,
  SecretRef,
  SecretResolutionReason,
  StoredSecret,
} from "./types.js";
export {
  isSecretRef,
  parseSecretUri,
  SecretResolutionError,
} from "./types.js";

import { createBitwardenBackend } from "./backends/bitwarden.js";
import { getSecretBackend, registerSecretBackend } from "./registry.js";
import { restoreBwSessionToEnv } from "./session-store.js";

/** Register built-in backends once (idempotent). */
export function ensureDefaultSecretBackends(): void {
  if (!getSecretBackend("bw")) {
    registerSecretBackend(createBitwardenBackend());
  }
  // Restore a still-valid 30-day session before any vault read.
  restoreBwSessionToEnv();
}
