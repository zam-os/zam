import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AGENT_HARNESSES,
  type AgentHarness,
  connectHarnessMcp,
  detectInstalledConnectHarnesses,
  getHarness,
  launchHarness,
  planHarnessLaunch,
  resolveAntigravityIdeExecutable,
  resolveHarnessExecutable,
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
        "grok",
        "hermes",
        "opencode",
        "goose",
        "copilot",
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

  it("resolves antigravity-ide on PATH for antigravity harness", () => {
    const antigravity = getHarness("antigravity") as AgentHarness;
    expect(
      resolveHarnessExecutable(antigravity, undefined, {
        find: (c) =>
          c === "antigravity-ide" ? "/usr/local/bin/antigravity-ide" : null,
      }),
    ).toBe("/usr/local/bin/antigravity-ide");
  });

  it("resolves antigravity candidate paths on macOS", () => {
    const antigravity = getHarness("antigravity") as AgentHarness;
    expect(
      resolveHarnessExecutable(antigravity, undefined, {
        find: () => null,
        exists: (p) =>
          p ===
          "/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide",
        platform: "darwin",
      }),
    ).toBe(
      "/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide",
    );
  });

  it("resolves only the VS Code-compatible Antigravity IDE for extensions", () => {
    expect(
      resolveAntigravityIdeExecutable({
        find: () => null,
        exists: (path) =>
          path ===
          "/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide",
        platform: "darwin",
      }),
    ).toBe(
      "/Applications/Antigravity IDE.app/Contents/Resources/app/bin/antigravity-ide",
    );

    expect(
      resolveAntigravityIdeExecutable({
        find: () => null,
        exists: (path) =>
          path === "/Applications/Antigravity.app/Contents/MacOS/Antigravity",
        platform: "darwin",
      }),
    ).toBeNull();
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

describe("detectInstalledConnectHarnesses", () => {
  it("detects user-scoped Codex, VS Code, and Copilot targets", () => {
    const detected = detectInstalledConnectHarnesses({
      home: "/home/user",
      platform: "darwin",
      find: (command) =>
        command === "codex" || command === "claude"
          ? `/usr/local/bin/${command}`
          : null,
      // The source builds candidate paths with path.join, which uses
      // backslashes on Windows — normalize before comparing (issue #159).
      exists: (path) => {
        const key = path.replaceAll("\\", "/");
        return (
          key ===
            "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" ||
          key === "/home/user/.copilot"
        );
      },
    });

    expect(detected).toEqual(["codex", "vscode", "copilot"]);
    expect(detected).not.toContain("claude-code");
  });

  it("returns no targets when no supported user host is installed", () => {
    expect(
      detectInstalledConnectHarnesses({
        home: "/home/user",
        platform: "linux",
        find: () => null,
        exists: () => false,
      }),
    ).toEqual([]);
  });

  it("detects Antigravity IDE by its CLI name", () => {
    expect(
      detectInstalledConnectHarnesses({
        home: "/home/user",
        platform: "linux",
        find: (command) =>
          command === "antigravity-ide" ? "/usr/bin/antigravity-ide" : null,
        exists: () => false,
      }),
    ).toEqual(["antigravity"]);
  });

  it("detects Hermes by its CLI name or its ~/.hermes directory", () => {
    expect(
      detectInstalledConnectHarnesses({
        home: "/home/user",
        platform: "linux",
        find: (command) => (command === "hermes" ? "/usr/bin/hermes" : null),
        exists: () => false,
      }),
    ).toEqual(["hermes"]);

    expect(
      detectInstalledConnectHarnesses({
        home: "/home/user",
        platform: "linux",
        find: () => null,
        exists: (path) =>
          path.replaceAll("\\", "/") === "/home/user/.hermes",
      }),
    ).toEqual(["hermes"]);
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
  const tsxImport = import.meta.resolve("tsx");
  const mockFiles: Record<string, string> = {};

  // connectHarnessMcp joins paths with the host separator; normalize to
  // POSIX so the same expectations hold on Windows and Linux.
  const posix = (p: string) => p.replaceAll("\\", "/");

  const mockDeps = {
    zamPath: "/usr/local/bin/zam",
    cwd: "/work",
    home: "/home/user",
    readFile: (p: string) => {
      const key = posix(p);
      if (mockFiles[key] === undefined) throw new Error("ENOENT");
      return mockFiles[key];
    },
  };

  beforeEach(() => {
    for (const key of Object.keys(mockFiles)) {
      delete mockFiles[key];
    }
  });

  it("claude-code fresh write", () => {
    const res = connectHarnessMcp("claude-code", mockDeps);
    expect(posix(res.path)).toBe("/work/.mcp.json");
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
    expect(posix(res.path)).toBe("/home/user/.gemini/config/mcp_config.json");
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        zam: {
          command: "/usr/local/bin/zam",
          args: ["mcp"],
        },
      },
    });
  });

  it("opencode merges the global JSON config", () => {
    mockFiles["/home/user/.config/opencode/opencode.json"] = JSON.stringify({
      theme: "system",
      mcp: { other: { type: "remote", url: "https://example.test/mcp" } },
    });

    const res = connectHarnessMcp("opencode", mockDeps);
    expect(posix(res.path)).toBe("/home/user/.config/opencode/opencode.json");
    expect(JSON.parse(res.content)).toEqual({
      theme: "system",
      mcp: {
        other: { type: "remote", url: "https://example.test/mcp" },
        zam: {
          type: "local",
          command: ["/usr/local/bin/zam", "mcp"],
          enabled: true,
        },
      },
    });
  });

  it("codex appends TOML block when missing", () => {
    mockFiles["/home/user/.codex/config.toml"] =
      `# existing Codex config\n[other]\nvalue = 42\n`;
    const res = connectHarnessMcp("codex", mockDeps);
    expect(posix(res.path)).toBe("/home/user/.codex/config.toml");
    expect(res.alreadyConfigured).toBe(false);
    expect(res.content).toContain("[mcp_servers.zam]");
    expect(res.content).toContain('command = "/usr/local/bin/zam"');
    expect(res.content).toContain('default_tools_approval_mode = "approve"');
    expect(res.content).toContain('approval_mode = "prompt"');
    expect(res.content).toContain("[other]");
  });

  it("codex no-ops and returns alreadyConfigured when present", () => {
    const existing = `[mcp_servers.zam]\ncommand = "/usr/local/bin/zam"\nargs = ["mcp"]\n`;
    mockFiles["/home/user/.codex/config.toml"] = existing;
    const res = connectHarnessMcp("codex", mockDeps);
    expect(res.alreadyConfigured).toBe(true);
    expect(res.content).toBe(existing);
  });

  it("vscode merges the user config and preserves servers and inputs", () => {
    mockFiles["/home/user/Library/Application Support/Code/User/mcp.json"] =
      JSON.stringify({
        servers: { other: { command: "other-mcp" } },
        inputs: [{ id: "token", type: "promptString" }],
        custom: true,
      });
    const res = connectHarnessMcp("vscode", {
      ...mockDeps,
      platform: "darwin",
    });

    expect(posix(res.path)).toBe(
      "/home/user/Library/Application Support/Code/User/mcp.json",
    );
    expect(JSON.parse(res.content)).toEqual({
      servers: {
        other: { command: "other-mcp" },
        zam: { command: "/usr/local/bin/zam", args: ["mcp"] },
      },
      inputs: [{ id: "token", type: "promptString" }],
      custom: true,
    });
    expect(res.alreadyConfigured).toBe(false);
  });

  it("vscode reports an existing complete setup as configured", () => {
    mockFiles["/home/user/.config/Code/User/mcp.json"] = JSON.stringify({
      servers: {
        zam: { command: "/usr/local/bin/zam", args: ["mcp"] },
      },
      inputs: [],
    });
    const res = connectHarnessMcp("vscode", {
      ...mockDeps,
      platform: "linux",
    });
    expect(res.alreadyConfigured).toBe(true);
  });

  it("vscode refuses to replace malformed server configuration", () => {
    mockFiles["/home/user/.config/Code/User/mcp.json"] = JSON.stringify({
      servers: [],
    });
    expect(() =>
      connectHarnessMcp("vscode", {
        ...mockDeps,
        platform: "linux",
      }),
    ).toThrow("servers must be a JSON object");
  });

  it("goose fresh write creates a valid extensions map", () => {
    const res = connectHarnessMcp("goose", mockDeps);
    expect(posix(res.path)).toBe("/home/user/.config/goose/config.yaml");
    expect(res.alreadyConfigured).toBe(false);
    expect(res.content).toBe(
      "extensions:\n" +
        "  zam:\n" +
        "    name: ZAM\n" +
        "    cmd: /usr/local/bin/zam\n" +
        "    args:\n" +
        "      - mcp\n" +
        "    enabled: true\n" +
        "    type: stdio\n" +
        "    timeout: 300\n" +
        "    description: Symbiotic learning agent with spaced repetition\n",
    );
  });

  it("goose inserts zam inside extensions when top-level keys follow it", () => {
    // Regression: the merge must nest zam under `extensions:`, not append it at
    // end-of-file where trailing top-level keys would push it out of the map.
    mockFiles["/home/user/.config/goose/config.yaml"] =
      "GOOSE_TELEMETRY_ENABLED: true\n" +
      "extensions:\n" +
      "  developer:\n" +
      "    enabled: true\n" +
      "    type: platform\n" +
      "    name: developer\n" +
      "active_provider: openrouter\n";
    const res = connectHarnessMcp("goose", mockDeps);
    expect(res.alreadyConfigured).toBe(false);
    const lines = res.content.split("\n");
    // zam is the first child of the extensions map...
    expect(lines[lines.indexOf("extensions:") + 1]).toBe("  zam:");
    // ...the sibling extension is preserved...
    expect(res.content).toContain("  developer:");
    // ...and the trailing top-level key stays top-level (not swallowed by zam).
    expect(res.content).toContain("\nactive_provider: openrouter\n");
  });

  it("goose no-ops when a zam extension already runs zam mcp", () => {
    const existing =
      "extensions:\n" +
      "  zam:\n" +
      "    name: ZAM\n" +
      "    cmd: /usr/local/bin/zam\n" +
      "    args:\n" +
      "      - mcp\n" +
      "    enabled: true\n" +
      "    type: stdio\n";
    mockFiles["/home/user/.config/goose/config.yaml"] = existing;
    const res = connectHarnessMcp("goose", mockDeps);
    expect(res.alreadyConfigured).toBe(true);
    expect(res.content).toBe(existing);
  });

  it("goose still installs when only an unrelated providers.zam entry exists", () => {
    // A `zam:` key under `providers:` (no `- mcp`) must not be mistaken for the
    // MCP extension being already configured.
    mockFiles["/home/user/.config/goose/config.yaml"] =
      "extensions:\n" +
      "  developer:\n" +
      "    enabled: true\n" +
      "providers:\n" +
      "  zam:\n" +
      "    enabled: true\n" +
      "    configured: false\n";
    const res = connectHarnessMcp("goose", mockDeps);
    expect(res.alreadyConfigured).toBe(false);
    const lines = res.content.split("\n");
    expect(lines[lines.indexOf("extensions:") + 1]).toBe("  zam:");
  });

  it("hermes fresh write creates a valid mcp_servers map", () => {
    const res = connectHarnessMcp("hermes", mockDeps);
    expect(posix(res.path)).toBe("/home/user/.hermes/config.yaml");
    expect(res.alreadyConfigured).toBe(false);
    expect(res.content).toBe(
      "mcp_servers:\n" +
        "  zam:\n" +
        "    command: /usr/local/bin/zam\n" +
        "    args:\n" +
        "      - mcp\n",
    );
    expect(res.hint).toContain("hermes gateway");
  });

  it("hermes inserts zam inside mcp_servers when top-level keys follow it", () => {
    // Same reasoning as the goose writer: appending at end-of-file would land
    // outside the map when other top-level keys (gateway, model, …) follow.
    mockFiles["/home/user/.hermes/config.yaml"] =
      "model: hermes-4\n" +
      "mcp_servers:\n" +
      "  github:\n" +
      "    command: npx\n" +
      "    args:\n" +
      '      - "-y"\n' +
      '      - "@modelcontextprotocol/server-github"\n' +
      "gateway:\n" +
      "  channels:\n" +
      "    - telegram\n";
    const res = connectHarnessMcp("hermes", mockDeps);
    expect(res.alreadyConfigured).toBe(false);
    const lines = res.content.split("\n");
    // zam is the first child of the mcp_servers map...
    expect(lines[lines.indexOf("mcp_servers:") + 1]).toBe("  zam:");
    // ...the sibling server is preserved...
    expect(res.content).toContain("  github:");
    // ...and the trailing top-level keys stay top-level.
    expect(res.content).toContain("\ngateway:\n");
    expect(res.content).toContain("model: hermes-4");
  });

  it("hermes adds an mcp_servers map to a config that lacks one", () => {
    mockFiles["/home/user/.hermes/config.yaml"] = "model: hermes-4\n";
    const res = connectHarnessMcp("hermes", mockDeps);
    expect(res.alreadyConfigured).toBe(false);
    expect(res.content).toBe(
      "model: hermes-4\n" +
        "mcp_servers:\n" +
        "  zam:\n" +
        "    command: /usr/local/bin/zam\n" +
        "    args:\n" +
        "      - mcp\n",
    );
  });

  it("hermes no-ops when a zam server already runs zam mcp", () => {
    const existing =
      "mcp_servers:\n" +
      "  zam:\n" +
      "    command: /usr/local/bin/zam\n" +
      "    args:\n" +
      "      - mcp\n";
    mockFiles["/home/user/.hermes/config.yaml"] = existing;
    const res = connectHarnessMcp("hermes", mockDeps);
    expect(res.alreadyConfigured).toBe(true);
    expect(res.content).toBe(existing);
  });

  it("hermes wraps a .js zam path in the node executable", () => {
    const res = connectHarnessMcp("hermes", {
      ...mockDeps,
      zamPath: "/opt/zam/dist/cli/index.js",
    });
    expect(res.content).toBe(
      "mcp_servers:\n" +
        "  zam:\n" +
        `    command: ${process.execPath}\n` +
        "    args:\n" +
        "      - /opt/zam/dist/cli/index.js\n" +
        "      - mcp\n",
    );
  });

  it("copilot fresh write", () => {
    const res = connectHarnessMcp("copilot", mockDeps);
    expect(posix(res.path)).toBe("/home/user/.copilot/mcp-config.json");
    expect(res.alreadyConfigured).toBe(false);
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        zam: {
          type: "local",
          command: "/usr/local/bin/zam",
          args: ["mcp"],
          tools: ["*"],
        },
      },
    });
  });

  it("copilot honors an explicit Copilot home", () => {
    const res = connectHarnessMcp("copilot", {
      ...mockDeps,
      copilotHome: "/custom/copilot",
    });
    expect(posix(res.path)).toBe("/custom/copilot/mcp-config.json");
  });

  it("claude-desktop fresh write targets the platform config", () => {
    const res = connectHarnessMcp("claude-desktop", {
      ...mockDeps,
      platform: "win32",
    });
    expect(posix(res.path)).toBe(
      "/home/user/AppData/Roaming/Claude/claude_desktop_config.json",
    );
    expect(res.alreadyConfigured).toBe(false);
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        zam: {
          command: "/usr/local/bin/zam",
          args: ["mcp"],
        },
      },
    });
  });

  it("claude-desktop merges on macOS and preserves other servers", () => {
    mockFiles[
      "/home/user/Library/Application Support/Claude/claude_desktop_config.json"
    ] = JSON.stringify({
      mcpServers: { other: { command: "other-server" } },
    });

    const res = connectHarnessMcp("claude-desktop", {
      ...mockDeps,
      platform: "darwin",
    });
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        other: { command: "other-server" },
        zam: {
          command: "/usr/local/bin/zam",
          args: ["mcp"],
        },
      },
    });
  });

  it("treats an empty stub file as a fresh config", () => {
    // VS Code auto-creates mcp.json as a single newline on first launch; that
    // empty stub must be treated as {}, not rejected as invalid JSON.
    mockFiles["/home/user/.config/Code/User/mcp.json"] = "\n";
    const res = connectHarnessMcp("vscode", {
      ...mockDeps,
      platform: "linux",
    });
    expect(JSON.parse(res.content)).toEqual({
      servers: {
        zam: { command: "/usr/local/bin/zam", args: ["mcp"] },
      },
      inputs: [],
    });
    expect(res.alreadyConfigured).toBe(false);
  });

  it("treats a whitespace-only stub as an empty object", () => {
    mockFiles["/work/.mcp.json"] = "   \n\t\n";
    const res = connectHarnessMcp("claude-code", mockDeps);
    expect(JSON.parse(res.content)).toEqual({
      mcpServers: {
        zam: { command: "/usr/local/bin/zam", args: ["mcp"] },
      },
    });
  });

  it("refuses to overwrite malformed JSON configuration", () => {
    mockFiles["/work/.mcp.json"] = "{ definitely not JSON";

    expect(() => connectHarnessMcp("claude-code", mockDeps)).toThrow(
      "existing file is not valid JSON",
    );
  });

  it("refuses to replace a non-object mcpServers value", () => {
    mockFiles["/work/.mcp.json"] = JSON.stringify({ mcpServers: [] });

    expect(() => connectHarnessMcp("claude-code", mockDeps)).toThrow(
      "mcpServers must be a JSON object",
    );
  });

  it("e2e: command connect --print outputs path and content", () => {
    const cliPath = join(process.cwd(), "src", "cli", "index.ts");
    const output = execFileSync(
      process.execPath,
      [
        "--import",
        tsxImport,
        cliPath,
        "agent",
        "connect",
        "claude-code",
        "--print",
      ],
      { encoding: "utf8" },
    );
    expect(output).toContain("Path:");
    expect(output).toContain("Content:");
    expect(output).toContain("mcpServers");
    expect(output).toContain("zam");
  });
});
