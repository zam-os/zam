import { existsSync, realpathSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { saveMachineAiModels } from "../../src/kernel/index.js";

describe("machine config sandbox", () => {
  it("absorbs a write that forgot its own isolation", () => {
    // These assertions guard the write below: without the sandbox it would
    // replace the model list in the developer's real config.
    expect(
      realpathSync(homedir()).startsWith(realpathSync(tmpdir()) + sep),
    ).toBe(true);
    expect(process.env.ZAM_CONFIG_PATH).toBeUndefined();

    const configPath = join(homedir(), ".zam", "config.json");
    expect(existsSync(configPath)).toBe(false);

    saveMachineAiModels([]);

    expect(existsSync(configPath)).toBe(true);
  });
});
