/**
 * Shared `agent connect` core (ADR 2026-07-11): harness detection, per-harness
 * MCP configuration, companion-extension installs, and the global-skill
 * refresh, returned as one structured report. The interactive CLI
 * (`zam agent connect`), the JSON bridge (`zam bridge agent-connect`), the
 * desktop App settings, and `zam setup` all render this single behavior, so
 * connect stays idempotent and non-destructive in every surface.
 *
 * Unlike the original CLI loop, a failure on one harness does not abort the
 * others: each outcome carries its own `error` so a broken host config cannot
 * block connecting the rest.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { distributeGlobalSkills } from "../kernel/index.js";
import {
  type ConnectHarnessId,
  connectHarnessMcp,
  detectInstalledConnectHarnesses,
  resolveAntigravityIdeExecutable,
} from "./agent-harness.js";
import { installCopilotExtension } from "./copilot-extension.js";
import { findExecutable } from "./terminal-open.js";
import { installVscodeExtension } from "./vscode-extension.js";

export type { ConnectHarnessId } from "./agent-harness.js";

export const CONNECT_HARNESSES: ConnectHarnessId[] = [
  "claude-code",
  "claude-desktop",
  "antigravity",
  "codex",
  "vscode",
  "opencode",
  "goose",
  "copilot",
];

/**
 * Harnesses with a user-scoped MCP target, i.e. the ones auto-detection and
 * the App settings can act on. Claude Code stays explicit-only because its
 * MCP target is the current workspace (`.mcp.json`).
 */
export const USER_SCOPED_CONNECT_HARNESSES: ConnectHarnessId[] = [
  "claude-desktop",
  "antigravity",
  "codex",
  "vscode",
  "opencode",
  "goose",
  "copilot",
];

export const CONNECT_HARNESS_LABELS: Record<ConnectHarnessId, string> = {
  "claude-code": "Claude Code",
  "claude-desktop": "Claude Desktop",
  antigravity: "Antigravity",
  codex: "Codex",
  vscode: "VS Code",
  opencode: "OpenCode",
  goose: "Goose",
  copilot: "GitHub Copilot",
};

export function isConnectHarnessId(value: string): value is ConnectHarnessId {
  return (CONNECT_HARNESSES as string[]).includes(value);
}

/** Injectable dependencies so tests never touch the real filesystem or PATH. */
export interface AgentConnectDeps {
  home?: string;
  cwd?: string;
  copilotHome?: string;
  findZam?: () => string | null;
  detect?: () => ConnectHarnessId[];
  connectMcp?: typeof connectHarnessMcp;
  writeConfig?: (path: string, content: string) => void;
  installCopilot?: typeof installCopilotExtension;
  installVscode?: typeof installVscodeExtension;
  resolveAntigravity?: () => string | null;
  refreshSkills?: (home: string) => Array<{ success: boolean }>;
}

export interface HarnessExtensionOutcome {
  kind: "copilot" | "vscode";
  action: string;
  /** Copilot: extension directory; VS Code: installed `.vsix` path. */
  location: string;
  /** Copilot: launch command line; VS Code: launch config path. */
  detail: string;
}

export interface HarnessConnectOutcome {
  harness: ConnectHarnessId;
  label: string;
  path: string;
  content: string;
  alreadyConfigured: boolean;
  wrote: boolean;
  hint: string;
  extension: HarnessExtensionOutcome | null;
  error?: string;
}

export interface AgentConnectReport {
  /** True when no per-harness outcome carries an error. */
  success: boolean;
  detected: ConnectHarnessId[];
  zamPath: string;
  zamOnPath: boolean;
  results: HarnessConnectOutcome[];
  /** Global-skill refresh summary; null on dry runs and empty detections. */
  skills: { refreshed: number; total: number } | null;
}

function resolveDeps(deps: AgentConnectDeps) {
  const home = deps.home ?? homedir();
  const cwd = deps.cwd ?? process.cwd();
  const copilotHome = deps.copilotHome ?? process.env.COPILOT_HOME;
  return {
    home,
    cwd,
    copilotHome,
    findZam:
      deps.findZam ??
      (() => {
        const globalZam = findExecutable("zam");
        if (globalZam) return globalZam;
        if (process.argv[1]?.endsWith("index.js")) {
          return process.argv[1];
        }
        return null;
      }),
    detect:
      deps.detect ??
      (() => detectInstalledConnectHarnesses({ home, copilotHome })),
    connectMcp: deps.connectMcp ?? connectHarnessMcp,
    writeConfig:
      deps.writeConfig ??
      ((path: string, content: string) => {
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, content, "utf-8");
      }),
    installCopilot: deps.installCopilot ?? installCopilotExtension,
    installVscode: deps.installVscode ?? installVscodeExtension,
    resolveAntigravity:
      deps.resolveAntigravity ?? resolveAntigravityIdeExecutable,
    refreshSkills: deps.refreshSkills ?? distributeGlobalSkills,
  };
}

/**
 * Run the connect flow for one explicit harness or every detected one.
 * Idempotent: existing `zam` MCP entries are left untouched, config writes
 * only happen for missing entries, and `dryRun` plans everything without
 * writing files or invoking `code --install-extension`.
 */
export function performAgentConnect(
  opts: { harness?: ConnectHarnessId; dryRun?: boolean } = {},
  deps: AgentConnectDeps = {},
): AgentConnectReport {
  const d = resolveDeps(deps);
  const dryRun = Boolean(opts.dryRun);
  const detected = opts.harness ? [opts.harness] : d.detect();
  const foundZam = d.findZam();
  const zamPath = foundZam ?? "zam";

  const results: HarnessConnectOutcome[] = [];
  for (const harness of detected) {
    const label = CONNECT_HARNESS_LABELS[harness];
    try {
      const prepared = d.connectMcp(harness, {
        zamPath,
        cwd: d.cwd,
        home: d.home,
        copilotHome: d.copilotHome,
      });

      let extension: HarnessExtensionOutcome | null = null;
      if (harness === "copilot") {
        const installed = d.installCopilot({
          home: d.home,
          zamPath,
          dryRun,
        });
        extension = {
          kind: "copilot",
          action: installed.action,
          location: installed.destinationDir,
          detail: `${installed.launch.command} ${installed.launch.args.join(" ")}`,
        };
      } else if (harness === "vscode") {
        const installed = d.installVscode({ home: d.home, zamPath, dryRun });
        extension = {
          kind: "vscode",
          action: installed.action,
          location: installed.vsixPath,
          detail: installed.launchConfigPath,
        };
      } else if (harness === "antigravity") {
        const antigravityPath = d.resolveAntigravity();
        if (antigravityPath) {
          const installed = d.installVscode({
            home: d.home,
            zamPath,
            codePath: antigravityPath,
            dryRun,
          });
          extension = {
            kind: "vscode",
            action: installed.action,
            location: installed.vsixPath,
            detail: installed.launchConfigPath,
          };
        }
      }

      let wrote = false;
      if (!prepared.alreadyConfigured && !dryRun) {
        d.writeConfig(prepared.path, prepared.content);
        wrote = true;
      }

      results.push({
        harness,
        label,
        path: prepared.path,
        content: prepared.content,
        alreadyConfigured: prepared.alreadyConfigured,
        wrote,
        hint: prepared.hint,
        extension,
      });
    } catch (error) {
      results.push({
        harness,
        label,
        path: "",
        content: "",
        alreadyConfigured: false,
        wrote: false,
        hint: "",
        extension: null,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let skills: AgentConnectReport["skills"] = null;
  if (!dryRun && detected.length > 0) {
    const skillResults = d.refreshSkills(d.home);
    skills = {
      refreshed: skillResults.filter((result) => result.success).length,
      total: skillResults.length,
    };
  }

  return {
    success: results.every((result) => !result.error),
    detected,
    zamPath,
    zamOnPath: Boolean(foundZam),
    results,
    skills,
  };
}

export interface HarnessStatus {
  harness: ConnectHarnessId;
  label: string;
  installed: boolean;
  configured: boolean;
  configPath: string;
  /** Present when the existing host config could not be inspected. */
  note?: string;
}

export interface HarnessStatusReport {
  zamOnPath: boolean;
  harnesses: HarnessStatus[];
}

/**
 * Read-only detection + configuration probe for the user-scoped harnesses.
 * `connectHarnessMcp` is a pure builder, so probing never writes anything.
 */
export function inspectConnectHarnesses(
  deps: AgentConnectDeps = {},
): HarnessStatusReport {
  const d = resolveDeps(deps);
  const foundZam = d.findZam();
  const zamPath = foundZam ?? "zam";
  const installed = new Set(d.detect());

  const harnesses = USER_SCOPED_CONNECT_HARNESSES.map((harness) => {
    const status: HarnessStatus = {
      harness,
      label: CONNECT_HARNESS_LABELS[harness],
      installed: installed.has(harness),
      configured: false,
      configPath: "",
    };
    try {
      const probe = d.connectMcp(harness, {
        zamPath,
        cwd: d.cwd,
        home: d.home,
        copilotHome: d.copilotHome,
      });
      status.configured = probe.alreadyConfigured;
      status.configPath = probe.path;
    } catch (error) {
      status.note = error instanceof Error ? error.message : String(error);
    }
    return status;
  });

  return { zamOnPath: Boolean(foundZam), harnesses };
}
