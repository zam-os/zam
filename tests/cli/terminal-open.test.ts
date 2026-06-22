import { describe, expect, it } from "vitest";
import {
  buildShellSetupCommand,
  isPowerShellShell,
  normalizeShell,
  psSingleQuoted,
} from "../../src/cli/terminal-open.js";

// `selectWindowsExecutable` is exercised via the monitor.js re-export in
// monitor.test.ts; here we cover the rest of the extracted shared helpers.

describe("isPowerShellShell", () => {
  it("is true for PowerShell variants", () => {
    expect(isPowerShellShell("pwsh")).toBe(true);
    expect(isPowerShellShell("powershell")).toBe(true);
  });

  it("is false for POSIX shells", () => {
    expect(isPowerShellShell("bash")).toBe(false);
    expect(isPowerShellShell("zsh")).toBe(false);
  });
});

describe("psSingleQuoted", () => {
  it("wraps a plain value in single quotes", () => {
    expect(psSingleQuoted("C:\\proj")).toBe("'C:\\proj'");
  });

  it("doubles embedded single quotes (PowerShell escaping)", () => {
    expect(psSingleQuoted("it's a path")).toBe("'it''s a path'");
  });
});

describe("normalizeShell", () => {
  it("passes valid shells through, lowercased", () => {
    expect(normalizeShell("pwsh")).toBe("pwsh");
    expect(normalizeShell("PowerShell")).toBe("powershell");
    expect(normalizeShell("BASH")).toBe("bash");
  });

  it("throws on an unsupported shell", () => {
    expect(() => normalizeShell("fish")).toThrow(/Unsupported shell/);
  });
});

describe("buildShellSetupCommand", () => {
  it("uses Set-Location + `;` for PowerShell", () => {
    expect(buildShellSetupCommand("C:\\proj", "pwsh", "zam learn")).toBe(
      "Set-Location -LiteralPath 'C:\\proj'; zam learn",
    );
  });

  it("uses cd + `&&` for POSIX shells", () => {
    expect(buildShellSetupCommand("/home/me/proj", "bash", "zam learn")).toBe(
      'cd "/home/me/proj" && zam learn',
    );
  });
});
