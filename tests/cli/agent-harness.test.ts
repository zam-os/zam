import { describe, expect, it } from "vitest";
import {
  type AgentHarness,
  AGENT_HARNESSES,
  getHarness,
  planHarnessLaunch,
  resolveHarnessExecutable,
} from "../../src/cli/agent-harness.js";

describe("agent harness registry", () => {
  it("includes the documented harnesses (ADR 2026-06-23)", () => {
    const ids = AGENT_HARNESSES.map((h) => h.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "claude-code",
        "codex",
        "opencode",
        "cursor",
        "copilot",
        "antigravity",
      ]),
    );
  });

  it("resolves a harness by id", () => {
    expect(getHarness("claude-code")?.kind).toBe("cli");
    expect(getHarness("cursor")?.kind).toBe("app");
    expect(getHarness("nope")).toBeUndefined();
  });
});

describe("resolveHarnessExecutable", () => {
  const claude = getHarness("claude-code") as AgentHarness;

  it("returns the resolved command for a CLI harness on PATH", () => {
    expect(
      resolveHarnessExecutable(claude, undefined, {
        find: () => "/usr/bin/claude",
      }),
    ).toBe("/usr/bin/claude");
  });

  it("returns null for a CLI harness that isn't on PATH", () => {
    expect(
      resolveHarnessExecutable(claude, undefined, { find: () => null }),
    ).toBeNull();
  });

  it("honors an override command", () => {
    const probed: string[] = [];
    resolveHarnessExecutable(claude, "/opt/claude", {
      find: (c) => {
        probed.push(c);
        return null;
      },
    });
    expect(probed).toEqual(["/opt/claude"]);
  });

  it("falls back to a candidate app path when the command isn't on PATH", () => {
    const app: AgentHarness = {
      id: "cursor",
      label: "X",
      kind: "app",
      command: "x",
      candidatePaths: { linux: ["/opt/x/x"] },
    };
    expect(
      resolveHarnessExecutable(app, undefined, {
        find: () => null,
        exists: (p) => p === "/opt/x/x",
        platform: "linux",
      }),
    ).toBe("/opt/x/x");
  });

  it("does not probe candidate paths for CLI harnesses", () => {
    expect(
      resolveHarnessExecutable(claude, undefined, {
        find: () => null,
        exists: () => true,
      }),
    ).toBeNull();
  });
});

describe("planHarnessLaunch", () => {
  const claude = getHarness("claude-code") as AgentHarness;
  const cursor = getHarness("cursor") as AgentHarness;

  it("builds a PowerShell terminal setup for a CLI harness", () => {
    expect(
      planHarnessLaunch(claude, {
        executable: "C:/bin/claude.cmd",
        workspace: "C:/work",
        shell: "pwsh",
      }),
    ).toEqual({
      kind: "cli",
      shell: "pwsh",
      shellSetup: "Set-Location -LiteralPath 'C:/work'; & 'C:/bin/claude.cmd'",
    });
  });

  it("builds a POSIX terminal setup for a CLI harness", () => {
    expect(
      planHarnessLaunch(claude, {
        executable: "/usr/bin/claude",
        workspace: "/home/me/work",
        shell: "bash",
      }),
    ).toEqual({
      kind: "cli",
      shell: "bash",
      shellSetup: 'cd "/home/me/work" && "/usr/bin/claude"',
    });
  });

  it("launches an app harness with the workspace as an argument", () => {
    expect(
      planHarnessLaunch(cursor, {
        executable: "/Applications/Cursor.app/Contents/MacOS/Cursor",
        workspace: "/home/me/work",
        shell: "bash",
      }),
    ).toEqual({
      kind: "app",
      executable: "/Applications/Cursor.app/Contents/MacOS/Cursor",
      args: ["/home/me/work"],
    });
  });
});
