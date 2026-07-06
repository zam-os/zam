import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AGENT_HARNESSES,
  type AgentHarness,
  getHarness,
  launchHarness,
  planHarnessLaunch,
  resolveHarnessExecutable,
  connectHarnessMcp,
} from "../../src/cli/agent-harness.js";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  describe("launchHarness", () => {
    it("passes silent mode through for CLI harness terminal output", () => {
      const claude = getHarness("claude-code") as AgentHarness;
      const log = vi.spyOn(console, "log").mockImplementation(() => {});

      launchHarness(claude, {
        executable: "/usr/bin/claude",
        workspace: "/work",
        shell: "bash",
        platform: "linux",
        silent: true,
      });

      expect(log).not.toHaveBeenCalled();
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

describe("connectHarnessMcp", () => {
  const mockFiles: Record<string, string> = {};

  const mockDeps = {
    zamPath: "/usr/local/bin/zam",
    cwd: "/work",
    home: "/home/user",
    readFile: (p: string) => {
      if (mockFiles[p] === undefined) throw new Error("ENOENT");
      return mockFiles[p];
    },
  };

  beforeEach(() => {
    for (const key of Object.keys(mockFiles)) {
      delete mockFiles[key];
    }
  });

  it("claude-code fresh write", () => {
    const res = connectHarnessMcp("claude-code", mockDeps);
    expect(res.path).toBe("/work/.mcp.json");
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        zam: {
          command: "/usr/local/bin/zam",
          args: ["mcp"],
        },
      },
    });
    expect(res.alreadyConfigured).toBe(false);
  });

  it("claude-code merges and preserves other servers", () => {
    mockFiles["/work/.mcp.json"] = JSON.stringify({
      mcpServers: {
        other: {
          command: "other-server",
        },
      },
    });

    const res = connectHarnessMcp("claude-code", mockDeps);
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        other: {
          command: "other-server",
        },
        zam: {
          command: "/usr/local/bin/zam",
          args: ["mcp"],
        },
      },
    });
  });

  it("antigravity fresh write", () => {
    const res = connectHarnessMcp("antigravity", mockDeps);
    expect(res.path).toBe("/home/user/.gemini/config/mcp_config.json");
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        zam: {
          command: "/usr/local/bin/zam",
          args: ["mcp"],
        },
      },
    });
  });

  it("codex appends TOML block when missing", () => {
    mockFiles["/home/user/.codex/config.toml"] = `# existing Codex config\n[other]\nvalue = 42\n`;
    const res = connectHarnessMcp("codex", mockDeps);
    expect(res.path).toBe("/home/user/.codex/config.toml");
    expect(res.alreadyConfigured).toBe(false);
    expect(res.content).toContain("[mcp_servers.zam]");
    expect(res.content).toContain('command = "/usr/local/bin/zam"');
    expect(res.content).toContain("approval_mode = \"prompt\"");
    expect(res.content).toContain("[other]");
  });

  it("codex no-ops and returns alreadyConfigured when present", () => {
    const existing = `[mcp_servers.zam]\ncommand = "/usr/local/bin/zam"\nargs = ["mcp"]\n`;
    mockFiles["/home/user/.codex/config.toml"] = existing;
    const res = connectHarnessMcp("codex", mockDeps);
    expect(res.alreadyConfigured).toBe(true);
    expect(res.content).toBe(existing);
  });

  it("e2e: command connect --print outputs path and content", () => {
    const cliPath = Symbol.for("cliPath") ? join(process.cwd(), "dist", "cli", "index.js") : "dist/cli/index.js";
    const output = execFileSync("node", [cliPath, "agent", "connect", "claude-code", "--print"], {
      encoding: "utf8",
    });
    expect(output).toContain("Path:");
    expect(output).toContain("Content:");
    expect(output).toContain("mcpServers");
    expect(output).toContain("zam");
  });
});
