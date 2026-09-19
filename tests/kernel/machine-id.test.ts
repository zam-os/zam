import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getMachineId,
  loadInstallConfig,
  setInstallMode,
} from "../../src/kernel/system/install-config.js";

/**
 * The machine id behind machine-scoped settings (ADR 2026-09-04 Decision 4):
 * minted once per install, kept for its life, and nothing but a ULID — it
 * must never encode the device.
 */
describe("getMachineId", () => {
  const dirs: string[] = [];
  function configPath(): string {
    const dir = mkdtempSync(join(tmpdir(), "zam-machine-id-"));
    dirs.push(dir);
    return join(dir, "config.json");
  }
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("mints a ULID once and returns the same id afterwards", () => {
    const path = configPath();
    const first = getMachineId(path);
    expect(first).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(getMachineId(path)).toBe(first);
    expect(JSON.parse(readFileSync(path, "utf-8"))).toEqual({
      machine: { id: first },
    });
  });

  it("survives other writers of the config and never reads a hostname", () => {
    const path = configPath();
    const id = getMachineId(path);
    setInstallMode("default", path);
    expect(getMachineId(path)).toBe(id);
    expect(loadInstallConfig(path)).toEqual({
      machine: { id },
      mode: "default",
    });
    expect(JSON.stringify(loadInstallConfig(path))).not.toMatch(
      /hostname|serial/i,
    );
  });

  it("gives two installs two ids", () => {
    expect(getMachineId(configPath())).not.toBe(getMachineId(configPath()));
  });
});
