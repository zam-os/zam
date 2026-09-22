import { resolveCredentials } from "../kernel/credentials.js";
import { registerEntraCliPasswordSupplier } from "./db/entra-cli.js";
import { registerCliSettingsScope } from "./users/identity.js";

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
  registerEntraCliPasswordSupplier();
  registerCliSettingsScope();
}
