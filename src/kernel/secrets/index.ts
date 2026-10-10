/**
 * Secret backends public surface (ADR 2026-07-30b).
 */

export { createBitwardenBackend } from "./backends/bitwarden.js";
export {
  createOsSecretBackend,
  OS_SECRET_SCHEME,
} from "./backends/os.js";
export type {
  OsCommandRunner,
  OsSecretStore,
  OsSecretStoreKind,
} from "./os-store.js";
export {
  createOsSecretStore,
  defaultOsSecretStore,
  osCommandRunner,
  runOsCommand,
  setOsSecretStoreForTests,
} from "./os-store.js";
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
  bwChildEnv,
  currentBwSession,
  forgetBwSession,
  getBwSessionMeta,
  loadBwSession,
  rememberBwSession,
  resetBwSessionForTests,
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
import { createOsSecretBackend, OS_SECRET_SCHEME } from "./backends/os.js";
import { getSecretBackend, registerSecretBackend } from "./registry.js";

/** Register built-in backends once (idempotent). */
export function ensureDefaultSecretBackends(): void {
  if (!getSecretBackend("bw")) {
    registerSecretBackend(createBitwardenBackend());
  }
  // Always registered: without OS storage an `os://` reference then fails as
  // "not-installed" rather than as an unknown scheme.
  if (!getSecretBackend(OS_SECRET_SCHEME)) {
    registerSecretBackend(createOsSecretBackend());
  }
  // The session is loaded when a vault read needs it (ADR 2026-10-08b D5).
}
