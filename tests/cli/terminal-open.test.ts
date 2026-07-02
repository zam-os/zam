import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildShellSetupCommand,
  findExecutable,
  isPowerShellShell,
  normalizeShell,
  openTerminalWindow,
  psSingleQuoted,
} from "../../src/cli/terminal-open.js";

// `selectWindowsExecutable` is exercised via the monitor.js re-export in
// monitor.test.ts; here we cover the rest of the extracted shared helpers.

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
  vi.restoreAllMocks();
});

function makeExecutable(name: string): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-terminal-open-"));
  tempDirs.push(dir);
  const fileName = process.platform === "win32" ? `${name}.cmd` : name;
  const file = join(dir, fileName);
  writeFileSync(
    file,
    process.platform === "win32" ? "@echo off\r\n" : "#!/bin/sh\n",
  );
  if (process.platform !== "win32") chmodSync(file, 0o755);
  return file;
}
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

describe("findExecutable", () => {
  it("resolves a quoted executable path with spaces without shell interpolation", () => {
    const executable = makeExecutable("tool with spaces");
    expect(findExecutable(`"${executable}"`)).toBe(executable);
  });

  it("finds commands on PATH without invoking a shell command string", () => {
    const executable = makeExecutable("zam-path-probe");
    const originalPath = process.env.PATH;
    process.env.PATH = [dirname(executable), originalPath]
      .filter(Boolean)
      .join(delimiter);

    try {
      const resolved = findExecutable("zam-path-probe");
      if (process.platform === "win32") {
        expect(resolved?.toLowerCase()).toBe(executable.toLowerCase());
      } else {
        expect(resolved).toBe(executable);
      }
    } finally {
      process.env.PATH = originalPath;
    }
  });
});

describe("openTerminalWindow", () => {
  it("suppresses fallback instructions when silent", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});

    openTerminalWindow({
      shellSetup: "echo hello",
      label: "agent-codex",
      dir: "/work",
      shell: "bash",
      platform: "linux",
      silent: true,
    });

    expect(log).not.toHaveBeenCalled();
  });
});
