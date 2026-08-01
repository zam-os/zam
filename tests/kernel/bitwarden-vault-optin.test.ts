import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  getBitwardenSyncConfig,
  isBitwardenVaultEnabled,
  setBitwardenAutoSync,
  setBitwardenSyncConfig,
  setBitwardenVaultEnabled,
} from "../../src/kernel/index.js";

/**
 * ADR 2026-07-30b, revised: the Bitwarden vault is an alpha feature that is
 * off until the learner ticks a box in Settings. It used to be a first-run
 * onboarding page, which only confused newcomers who will never own a second
 * computer.
 */
describe("Bitwarden vault opt-in", () => {
  let dir: string;
  let path: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "zam-bw-optin-"));
    path = join(dir, "config.json");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("is off on a fresh install", () => {
    expect(isBitwardenVaultEnabled(path)).toBe(false);
  });

  it("turns on and off again", () => {
    setBitwardenVaultEnabled(true, path);
    expect(isBitwardenVaultEnabled(path)).toBe(true);

    setBitwardenVaultEnabled(false, path);
    expect(isBitwardenVaultEnabled(path)).toBe(false);
  });

  it("stops auto-sync when switched off", () => {
    // Otherwise an already-unlocked session would keep pushing secrets into
    // the vault after the learner said no.
    setBitwardenVaultEnabled(true, path);
    setBitwardenAutoSync(true, path);
    expect(getBitwardenSyncConfig(path).autoSync).toBe(true);

    setBitwardenVaultEnabled(false, path);
    expect(getBitwardenSyncConfig(path).autoSync).toBe(false);
  });

  it("keeps the region choice across an off/on cycle", () => {
    // Region is where the learner's vault account actually lives; forgetting
    // it would silently point the CLI at the wrong cloud on re-enable.
    setBitwardenSyncConfig({ region: "eu" }, path);
    setBitwardenVaultEnabled(true, path);
    setBitwardenVaultEnabled(false, path);
    setBitwardenVaultEnabled(true, path);
    expect(getBitwardenSyncConfig(path).region).toBe("eu");
  });

  it("treats a config that predates the switch as off", () => {
    // Installs from before this flag existed have `bitwarden` without
    // `enabled`. They must not silently start prompting for a master
    // password on the next dashboard load.
    setBitwardenSyncConfig({ region: "us", autoSync: true }, path);
    expect(isBitwardenVaultEnabled(path)).toBe(false);
  });
});
