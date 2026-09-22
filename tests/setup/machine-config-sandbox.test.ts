import { existsSync, realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { saveMachineAiModels } from "../../src/kernel/index.js";

describe("machine config sandbox", () => {
  it("points every test file at a throw-away home, never the developer's", () => {
    expect(realpathSync(homedir()).startsWith(realpathSync(tmpdir()))).toBe(
      true,
    );
    expect(process.env.ZAM_CONFIG_PATH).toBeUndefined();
  });

  it("absorbs a write that forgot its own isolation", () => {
    // Without the sandbox this call is the one that rewrote a real config.
    saveMachineAiModels([]);

    expect(existsSync(join(homedir(), ".zam", "config.json"))).toBe(true);
  });
});
