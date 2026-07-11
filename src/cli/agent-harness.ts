/**
 * Agent-harness registry (ADR 2026-06-23 §Decision 2 / action item 5).
 *
 * A *harness* is the external AI the learner works *with* — it drives ZAM via
 * `zam bridge`. This is the "Open Agent" axis, deliberately separate from the
 * providers ZAM calls itself (see `llm/client.ts` `getProviderForRole`).
 *
 * CLI harnesses open in a terminal in the workspace (reusing `terminal-open.ts`);
 * app harnesses are launched as a detached process with the workspace as an
 * argument. Commands/paths are best-effort and overridable per harness via the
 * `agent.<id>.command` setting, since these tools churn and install paths vary.
 */

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import {
  buildShellSetupCommand,
  findExecutable,
  isPowerShellShell,
  openTerminalWindow,
  psSingleQuoted,
  type TerminalShell,
} from "./terminal-open.js";

export type AgentHarnessId =
  | "claude-code"
  | "codex"
  | "opencode"
  | "cursor"
  | "copilot"
  | "antigravity"
  | "goose";

export interface AgentHarness {
  id: AgentHarnessId;
  label: string;
  kind: "cli" | "app";
  /** Default executable / CLI command; override via `agent.<id>.command`. */
  command: string;
  /** Best-effort absolute paths to probe for app harnesses, per platform. */
  candidatePaths?: Partial<Record<NodeJS.Platform, string[]>>;
}

/**
 * Known harnesses. CLI-first ones (Claude Code, Codex, opencode) launch in a
 * terminal; GUI apps (Cursor, Copilot, Antigravity) launch as a process. The
 * commands are sensible defaults — when a tool isn't on PATH under that name,
 * the user points us at it with `zam settings set agent.<id>.command <path>`.
 */
export const AGENT_HARNESSES: AgentHarness[] = [
  { id: "claude-code", label: "Claude Code", kind: "cli", command: "claude" },
  { id: "codex", label: "Codex", kind: "cli", command: "codex" },
  { id: "opencode", label: "opencode", kind: "cli", command: "opencode" },
  {
    id: "cursor",
    label: "Cursor",
    kind: "app",
    command: "cursor",
    candidatePaths: {
      win32: [
        join(homedir(), "AppData", "Local", "Programs", "cursor", "Cursor.exe"),
      ],
      darwin: ["/Applications/Cursor.app/Contents/MacOS/Cursor"],
    },
  },
  { id: "copilot", label: "GitHub Copilot", kind: "app", command: "copilot" },
  {
    id: "antigravity",
    label: "Antigravity",
    kind: "app",
    command: "antigravity",
  },
  { id: "goose", label: "goose", kind: "cli", command: "goose" },
];

export function getHarness(id: string): AgentHarness | undefined {
  return AGENT_HARNESSES.find((h) => h.id === id);
}

export interface ResolveDeps {
  find?: (command: string) => string | null;
  exists?: (path: string) => boolean;
  platform?: NodeJS.Platform;
}

/**
 * Resolve the runnable executable for a harness, or null if not detected.
 * Tries the (possibly overridden) command on PATH first, then — for app
 * harnesses — the per-platform candidate paths. Dependencies are injectable so
 * the resolution logic is unit-testable without touching the real system.
 */
export function resolveHarnessExecutable(
  harness: AgentHarness,
  overrideCommand?: string,
  deps: ResolveDeps = {},
): string | null {
  const find = deps.find ?? findExecutable;
  const exists = deps.exists ?? existsSync;
  const platform = deps.platform ?? process.platform;

  const found = find(overrideCommand || harness.command);
  if (found) return found;

  if (harness.kind === "app") {
    for (const candidate of harness.candidatePaths?.[platform] ?? []) {
      if (exists(candidate)) return candidate;
    }
  }
  return null;
}

export type AgentLaunchPlan =
  | { kind: "cli"; shellSetup: string; shell: TerminalShell }
  | { kind: "app"; executable: string; args: string[] };

/** Pure: build the launch plan for a resolved harness (no side effects). */
export function planHarnessLaunch(
  harness: AgentHarness,
  opts: { executable: string; workspace: string; shell: TerminalShell },
): AgentLaunchPlan {
  if (harness.kind === "cli") {
    const invocation = isPowerShellShell(opts.shell)
      ? `& ${psSingleQuoted(opts.executable)}`
      : JSON.stringify(opts.executable);
    return {
      kind: "cli",
      shell: opts.shell,
      shellSetup: buildShellSetupCommand(
        opts.workspace,
        opts.shell,
        invocation,
      ),
    };
  }
  return { kind: "app", executable: opts.executable, args: [opts.workspace] };
}

/** Launch the harness: a terminal window for CLI, a detached process for app. */
export function launchHarness(
  harness: AgentHarness,
  opts: {
    executable: string;
    workspace: string;
    shell: TerminalShell;
    silent?: boolean;
    platform?: NodeJS.Platform;
  },
): void {
  const plan = planHarnessLaunch(harness, opts);
  if (plan.kind === "cli") {
    openTerminalWindow({
      shellSetup: plan.shellSetup,
      label: `agent-${harness.id}`,
      dir: opts.workspace,
      shell: plan.shell,
      silent: opts.silent,
      platform: opts.platform,
    });
    return;
  }
  spawn(plan.executable, plan.args, {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  }).unref();
  if (!opts.silent) {
    console.log(`Launched ${harness.label} in ${opts.workspace}`);
  }
}

export interface ConnectResult {
  path: string;
  content: string;
  alreadyConfigured: boolean;
  hint: string;
}

export type ConnectHarnessId =
  | "claude-code"
  | "claude-desktop"
  | "antigravity"
  | "codex"
  | "vscode"
  | "opencode"
  | "goose"
  | "copilot";

export interface DetectConnectHarnessesOptions {
  home?: string;
  platform?: NodeJS.Platform;
  find?: (command: string) => string | null;
  exists?: (path: string) => boolean;
  copilotHome?: string;
}

/**
 * Detect user-scoped harness targets for parameterless `zam agent connect`.
 * Claude Code is deliberately excluded because its existing MCP target is the
 * current workspace; users can still configure it explicitly.
 */
export function detectInstalledConnectHarnesses(
  options: DetectConnectHarnessesOptions = {},
): ConnectHarnessId[] {
  const home = options.home ?? homedir();
  const platform = options.platform ?? process.platform;
  const find = options.find ?? findExecutable;
  const exists = options.exists ?? existsSync;
  const detected: ConnectHarnessId[] = [];

  const hasCommandOrPath = (command: string, paths: string[] = []) =>
    Boolean(find(command)) || paths.some((path) => exists(path));

  if (
    hasCommandOrPath("codex", [
      join(home, ".codex"),
      ...(platform === "darwin"
        ? ["/Applications/Codex.app"]
        : platform === "win32"
          ? [join(home, "AppData", "Local", "Programs", "Codex")]
          : []),
    ])
  ) {
    detected.push("codex");
  }

  const vscodePaths =
    platform === "darwin"
      ? [
          "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
          join(
            home,
            "Applications",
            "Visual Studio Code.app",
            "Contents",
            "Resources",
            "app",
            "bin",
            "code",
          ),
        ]
      : platform === "win32"
        ? [
            join(
              home,
              "AppData",
              "Local",
              "Programs",
              "Microsoft VS Code",
              "bin",
              "code.cmd",
            ),
          ]
        : ["/usr/bin/code", "/usr/local/bin/code", "/snap/bin/code"];
  if (hasCommandOrPath("code", vscodePaths)) detected.push("vscode");

  const copilotHome = options.copilotHome ?? join(home, ".copilot");
  if (
    hasCommandOrPath("copilot", [
      copilotHome,
      ...(platform === "darwin" ? ["/Applications/GitHub Copilot.app"] : []),
    ])
  ) {
    detected.push("copilot");
  }

  if (hasCommandOrPath("opencode", [join(home, ".config", "opencode")])) {
    detected.push("opencode");
  }
  if (hasCommandOrPath("goose", [join(home, ".config", "goose")])) {
    detected.push("goose");
  }
  if (
    hasCommandOrPath("antigravity", [
      join(home, ".gemini", "config"),
      ...(platform === "darwin" ? ["/Applications/Antigravity.app"] : []),
    ])
  ) {
    detected.push("antigravity");
  }
  const claudeDesktopPath =
    platform === "darwin"
      ? "/Applications/Claude.app"
      : platform === "win32"
        ? join(home, "AppData", "Local", "AnthropicClaude")
        : join(home, ".config", "Claude");
  if (exists(claudeDesktopPath)) detected.push("claude-desktop");

  return detected;
}

interface McpJsonConfig {
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

function parseMcpJsonConfig(path: string, content: string): McpJsonConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Cannot update ${path}: existing file is not valid JSON (${error instanceof Error ? error.message : String(error)})`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Cannot update ${path}: expected a JSON object`);
  }

  const config = parsed as McpJsonConfig;
  if (
    config.mcpServers !== undefined &&
    (typeof config.mcpServers !== "object" ||
      config.mcpServers === null ||
      Array.isArray(config.mcpServers))
  ) {
    throw new Error(`Cannot update ${path}: mcpServers must be a JSON object`);
  }
  return config;
}

/**
 * Pure helper to build the target path and expected MCP server configuration.
 */
export function connectHarnessMcp(
  harnessId: ConnectHarnessId,
  opts: {
    zamPath: string;
    cwd: string;
    home: string;
    copilotHome?: string;
    readFile?: (path: string) => string;
    platform?: NodeJS.Platform;
  },
): ConnectResult {
  const exists = (p: string) => {
    if (opts.readFile) {
      try {
        opts.readFile(p);
        return true;
      } catch {
        return false;
      }
    }
    return existsSync(p);
  };

  const read = (p: string) => {
    if (opts.readFile) return opts.readFile(p);
    return readFileSync(p, "utf-8");
  };

  let targetPath = "";
  let content = "";
  let alreadyConfigured = false;
  let hint = "";

  const mergeMcpServersJson = (path: string): string => {
    let existing: McpJsonConfig = {};
    if (exists(path)) {
      existing = parseMcpJsonConfig(path, read(path));
    }
    if (!existing.mcpServers) {
      existing.mcpServers = {};
    }
    existing.mcpServers.zam = {
      command: opts.zamPath,
      args: ["mcp"],
    };
    return JSON.stringify(existing, null, 2);
  };

  if (harnessId === "claude-code") {
    targetPath = join(opts.cwd, ".mcp.json");
    hint =
      "Claude Code will prompt you to approve the 'zam' MCP server on next launch.";
    content = mergeMcpServersJson(targetPath);
  } else if (harnessId === "claude-desktop") {
    const platform = opts.platform ?? process.platform;
    targetPath =
      platform === "win32"
        ? join(
            opts.home,
            "AppData",
            "Roaming",
            "Claude",
            "claude_desktop_config.json",
          )
        : platform === "darwin"
          ? join(
              opts.home,
              "Library",
              "Application Support",
              "Claude",
              "claude_desktop_config.json",
            )
          : join(opts.home, ".config", "Claude", "claude_desktop_config.json");
    hint =
      "Restart Claude Desktop to load the 'zam' MCP server; MCP Apps panels render inline in the chat.";
    content = mergeMcpServersJson(targetPath);
  } else if (harnessId === "antigravity") {
    targetPath = join(opts.home, ".gemini", "config", "mcp_config.json");
    hint =
      "Shared config read by Antigravity CLI and IDE (2.0+); older IDE builds read ~/.gemini/antigravity/mcp_config.json instead. Refresh Installed MCP Servers; the first tool call may still require approval.";
    let existing: McpJsonConfig = {};
    if (exists(targetPath)) {
      existing = parseMcpJsonConfig(targetPath, read(targetPath));
    }
    if (!existing.mcpServers) {
      existing.mcpServers = {};
    }
    existing.mcpServers.zam = {
      command: opts.zamPath,
      args: ["mcp"],
    };
    content = JSON.stringify(existing, null, 2);
  } else if (harnessId === "opencode") {
    targetPath = join(opts.home, ".config", "opencode", "opencode.json");
    hint = "OpenCode will load the enabled 'zam' MCP server on next launch.";
    let existing: McpJsonConfig = {};
    if (exists(targetPath)) {
      existing = parseMcpJsonConfig(targetPath, read(targetPath));
    }
    const mcp = existing.mcp;
    if (
      mcp !== undefined &&
      (typeof mcp !== "object" || mcp === null || Array.isArray(mcp))
    ) {
      throw new Error(`Cannot update ${targetPath}: mcp must be a JSON object`);
    }
    const servers = (mcp ?? {}) as Record<string, unknown>;
    servers.zam = {
      type: "local",
      command: [opts.zamPath, "mcp"],
      enabled: true,
    };
    existing.mcp = servers;
    content = JSON.stringify(existing, null, 2);
  } else if (harnessId === "codex") {
    targetPath = join(opts.home, ".codex", "config.toml");
    hint =
      "Codex will prompt for tool execution approvals or respect the TOML approval modes.";
    let existingStr = "";
    if (exists(targetPath)) {
      existingStr = read(targetPath);
    }
    if (existingStr.includes("[mcp_servers.zam]")) {
      alreadyConfigured = true;
      content = existingStr;
    } else {
      const block = `
[mcp_servers.zam]
command = ${JSON.stringify(opts.zamPath)}
args = ["mcp"]
default_tools_approval_mode = "approve"

[mcp_servers.zam.tools.zam_review_action]
approval_mode = "prompt"
`;
      content = existingStr ? `${existingStr.trimEnd()}\n${block}` : block;
    }
  } else if (harnessId === "vscode") {
    const platform = opts.platform ?? process.platform;
    targetPath =
      platform === "win32"
        ? join(opts.home, "AppData", "Roaming", "Code", "User", "mcp.json")
        : platform === "darwin"
          ? join(
              opts.home,
              "Library",
              "Application Support",
              "Code",
              "User",
              "mcp.json",
            )
          : join(opts.home, ".config", "Code", "User", "mcp.json");
    hint =
      "Reload VS Code after setup. ZAM Companion stays separate from the Codex chat and can be moved to any panel or sidebar.";
    let existing: McpJsonConfig & { servers?: Record<string, unknown> } = {};
    if (exists(targetPath)) {
      existing = parseMcpJsonConfig(targetPath, read(targetPath));
    }
    if (
      existing.servers !== undefined &&
      (typeof existing.servers !== "object" ||
        existing.servers === null ||
        Array.isArray(existing.servers))
    ) {
      throw new Error(
        `Cannot update ${targetPath}: servers must be a JSON object`,
      );
    }
    if (existing.inputs !== undefined && !Array.isArray(existing.inputs)) {
      throw new Error(`Cannot update ${targetPath}: inputs must be an array`);
    }
    if (!existing.servers) existing.servers = {};
    const expectedServer = { command: opts.zamPath, args: ["mcp"] };
    const currentServer = existing.servers.zam;
    alreadyConfigured =
      Array.isArray(existing.inputs) &&
      typeof currentServer === "object" &&
      currentServer !== null &&
      !Array.isArray(currentServer) &&
      JSON.stringify(currentServer) === JSON.stringify(expectedServer);
    existing.servers.zam = expectedServer;
    if (!existing.inputs) existing.inputs = [];
    content = JSON.stringify(existing, null, 2);
  } else if (harnessId === "goose") {
    targetPath = join(opts.home, ".config", "goose", "config.yaml");
    hint =
      "goose will load the 'zam' extension on next session start. Run 'goose configure' to manage extensions.";
    // The `zam` entry, indented for placement directly under the `extensions:` map.
    const zamExtension = [
      "  zam:",
      "    name: ZAM",
      `    cmd: ${opts.zamPath}`,
      "    args:",
      "      - mcp",
      "    enabled: true",
      "    type: stdio",
      "    timeout: 300",
      "    description: Symbiotic learning agent with spaced repetition",
    ].join("\n");
    let existingStr = "";
    if (exists(targetPath)) {
      existingStr = read(targetPath);
    }
    if (/^\s+zam:\s*$/m.test(existingStr) && existingStr.includes("- mcp")) {
      // An indented `zam:` extension wired to `zam mcp` is already present.
      alreadyConfigured = true;
      content = existingStr;
    } else if (/^extensions:[ \t]*$/m.test(existingStr)) {
      // Insert as the first child of the existing `extensions:` map. Appending at
      // end-of-file is wrong: goose configs carry top-level keys (providers, model,
      // …) after `extensions:`, so an appended block lands outside the map — or
      // under a trailing scalar — producing YAML that goose silently drops.
      content = existingStr.replace(
        /^extensions:[ \t]*$/m,
        (line) => `${line}\n${zamExtension}`,
      );
    } else if (existingStr.trim()) {
      // Config exists but has no `extensions:` map yet — add one.
      content = `${existingStr.trimEnd()}\nextensions:\n${zamExtension}\n`;
    } else {
      content = `extensions:\n${zamExtension}\n`;
    }
  } else if (harnessId === "copilot") {
    targetPath = join(
      opts.copilotHome ?? join(opts.home, ".copilot"),
      "mcp-config.json",
    );
    hint =
      "Restart GitHub Copilot or start a new session to load the 'zam' MCP server and its focused Recall, Graph, and Settings canvases.";
    let existing: McpJsonConfig = {};
    if (exists(targetPath)) {
      existing = parseMcpJsonConfig(targetPath, read(targetPath));
    }
    if (!existing.mcpServers) {
      existing.mcpServers = {};
    }
    existing.mcpServers.zam = {
      type: "local",
      command: opts.zamPath,
      args: ["mcp"],
      tools: ["*"],
    };
    content = JSON.stringify(existing, null, 2);
  }

  return {
    path: targetPath,
    content,
    alreadyConfigured,
    hint,
  };
}
