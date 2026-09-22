import { beforeEach, describe, expect, it } from "vitest";
import { registerCliProcessServices } from "../../src/cli/process-services.js";
import {
  hasPostgresPasswordSupplier,
  resetPostgresPasswordSuppliers,
} from "../../src/kernel/db/connection.js";
import {
  hasSettingsScopeResolver,
  registerSettingsScopeResolver,
} from "../../src/kernel/models/settings.js";

/**
 * app.ts and zam mcp are separate tsup bundles with separate kernel copies,
 * so both call this; the test pins what one call plugs in. The credentials
 * snapshot it also refreshes reads the machine file read-only.
 */
describe("registerCliProcessServices", () => {
  beforeEach(() => {
    resetPostgresPasswordSuppliers();
    registerSettingsScopeResolver(null);
  });

  it("plugs the Entra token supplier and the settings scope into the module graph", async () => {
    expect(hasPostgresPasswordSupplier("entra-cli")).toBe(false);
    expect(hasSettingsScopeResolver()).toBe(false);

    await registerCliProcessServices();

    expect(hasPostgresPasswordSupplier("entra-cli")).toBe(true);
    expect(hasSettingsScopeResolver()).toBe(true);
  });
});
