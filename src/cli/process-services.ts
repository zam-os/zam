import {
  moveLiteralSecretsToOsStore,
  resolveCredentials,
} from "../kernel/credentials.js";
import { registerEntraCliPasswordSupplier } from "./db/entra-cli.js";
import { registerCliSettingsScope } from "./users/identity.js";

/**
 * Move literal secrets in credentials.json into OS-protected storage
 * (ADR 2026-10-08b D5). Never fails a command: a secret that cannot move
 * stays where it is and is tried again next time.
 */
export async function secureStoredSecrets(): Promise<void> {
  try {
    await moveLiteralSecretsToOsStore();
  } catch {
    // Left literal; the next start tries again.
  }
}

/**
 * The plugs the CLI layer gives the kernel once per process: the credentials
 * snapshot (ADR 2026-07-30b), the Entra token supplier for the team library
 * (ADR 2026-09-04 Decision 3) and the settings scope (Decision 4). tsup copies
 * the kernel into every entry bundle, so a registration made in one bundle is
 * invisible in another: each entry (app.ts, zam mcp) must call this itself.
 * Idempotent.
 */
export async function registerCliProcessServices(): Promise<void> {
  await resolveCredentials();
  await secureStoredSecrets();
  registerEntraCliPasswordSupplier();
  registerCliSettingsScope();
}
