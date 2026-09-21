import { beforeEach, describe, expect, it } from "vitest";
import { registerMcpProcessServices } from "../../src/cli/commands/mcp.js";
import {
  hasPostgresPasswordSupplier,
  resetPostgresPasswordSuppliers,
} from "../../src/kernel/db/connection.js";
import {
  hasSettingsScopeResolver,
  registerSettingsScopeResolver,
} from "../../src/kernel/models/settings.js";

/**
 * tsup builds the MCP transport as its own bundle with its own copy of the
 * kernel (no shared chunks, ADR 2026-07-07), so whatever app.ts registers at
 * startup is invisible inside `zam mcp`. On a team library that surfaced as
 * "ENTRA_LOGIN_REQUIRED: no entra-cli token source is registered in this
 * process" (2026-09-21); settings would likewise have stayed library-wide.
 *
 * The credentials snapshot the function also refreshes reads the machine's
 * credentials file read-only; literals need no backend, so this stays inert
 * on a developer machine and on CI alike.
 */
describe("registerMcpProcessServices", () => {
  beforeEach(() => {
    resetPostgresPasswordSuppliers();
    registerSettingsScopeResolver(null);
  });

  it("plugs the Entra token supplier and the settings scope into its own module graph", async () => {
    expect(hasPostgresPasswordSupplier("entra-cli")).toBe(false);
    expect(hasSettingsScopeResolver()).toBe(false);

    await registerMcpProcessServices();

    expect(hasPostgresPasswordSupplier("entra-cli")).toBe(true);
    expect(hasSettingsScopeResolver()).toBe(true);
  });
});
