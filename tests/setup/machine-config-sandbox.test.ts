import { homedir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { saveMachineAiModels } from "../../src/kernel/index.js";

describe("machine config sandbox", () => {
  it("points every test file at a throw-away config, never the developer's", () => {
    const configPath = process.env.ZAM_CONFIG_PATH;

    expect(configPath).toBeTruthy();
    expect(configPath).not.toBe(join(homedir(), ".zam", "config.json"));
    expect(configPath?.startsWith(join(homedir(), ".zam"))).toBe(false);
  });

  it("absorbs a write that forgot its own isolation", () => {
    // Without the sandbox this call is the one that rewrote a real config.
    saveMachineAiModels([]);

    expect(process.env.ZAM_CONFIG_PATH).not.toContain(join(homedir(), ".zam"));
  });
});
