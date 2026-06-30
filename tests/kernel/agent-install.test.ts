import { describe, expect, it } from "vitest";
import { planOpenCodeInstall } from "../../src/kernel/index.js";

const NONE = { hasNpm: false, hasBrew: false, hasScoop: false, hasChoco: false };

describe("planOpenCodeInstall", () => {
  it("prefers npm on every platform (correct native arm64 binary)", () => {
    for (const platform of ["darwin", "win32", "linux"] as const) {
      const plan = planOpenCodeInstall({ platform, ...NONE, hasNpm: true });
      expect(plan).toEqual({
        method: "npm",
        command: "npm install -g opencode-ai",
      });
    }
  });

  it("uses Homebrew then the install script on macOS without npm", () => {
    expect(
      planOpenCodeInstall({ platform: "darwin", ...NONE, hasBrew: true }),
    ).toMatchObject({ method: "homebrew" });
    expect(
      planOpenCodeInstall({ platform: "darwin", ...NONE }),
    ).toMatchObject({ method: "script" });
  });

  it("uses the install script on Linux without npm", () => {
    expect(planOpenCodeInstall({ platform: "linux", ...NONE })).toMatchObject({
      method: "script",
    });
  });

  it("uses Scoop or Chocolatey on Windows without npm, else nothing", () => {
    expect(
      planOpenCodeInstall({ platform: "win32", ...NONE, hasScoop: true }),
    ).toMatchObject({ method: "scoop" });
    expect(
      planOpenCodeInstall({ platform: "win32", ...NONE, hasChoco: true }),
    ).toMatchObject({ method: "chocolatey" });
    expect(planOpenCodeInstall({ platform: "win32", ...NONE })).toBeNull();
  });
});
