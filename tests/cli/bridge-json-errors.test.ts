import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("zam bridge Commander errors", () => {
  const cliPath = join(process.cwd(), "dist", "cli", "index.js");

  function run(args: string[]) {
    return spawnSync(process.execPath, [cliPath, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
      env: { ...process.env, ZAM_NO_AUTO_HEAL: "1" },
    });
  }

  it.each([
    {
      name: "missing required option",
      args: ["bridge", "get-neighborhood"],
      message: /required option '--focus <slug>' not specified/,
    },
    {
      name: "unknown option",
      args: ["bridge", "check-due", "--unknown-option"],
      message: /unknown option '--unknown-option'/,
    },
  ])("returns JSON for $name", ({ args, message }) => {
    const result = run(args);

    expect(result.status).toBe(1);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      error: expect.stringMatching(message),
    });
  });

  it("does not append an error envelope to requested help", () => {
    const result = run(["bridge", "get-neighborhood", "--help"]);

    expect(result.status).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: zam bridge get-neighborhood");
    expect(result.stdout).not.toContain('"error"');
  });
});
