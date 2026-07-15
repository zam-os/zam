/**
 * Install verify & repair — one idempotent pass over everything a machine
 * needs beyond the app bundle itself: the `zam` CLI shim + PATH entry,
 * skill links in every configured workspace, and the agent harness configs
 * including the ZAM Companion extensions. The desktop app runs it from the
 * "Check for updates" button (when no newer version exists) and once after
 * every app update (`ifVersionChanged`), so an update also refreshes the
 * shim and the Companion in VS Code.
 *
 * Every part is best-effort: one broken surface must not block repairing the
 * others, so failures land in the report instead of throwing.
 */

import { existsSync } from "node:fs";
import {
  getConfiguredWorkspaces,
  getLastRepairedVersion,
  setLastRepairedVersion,
} from "../kernel/index.js";
import { type AgentConnectDeps, performAgentConnect } from "./agent-connect.js";
import {
  type CliInstallOptions,
  type CliInstallReport,
  installCliShim,
} from "./cli-install.js";
import { parseSetupAgents, wireSkills } from "./provisioning/index.js";
import { currentVersion } from "./update/latest-version.js";

export interface InstallRepairWorkspaceSummary {
  /** Workspaces whose directory exists and was (re)provisioned. */
  provisioned: number;
  /** Configured workspaces whose directory is missing (offline drive, …). */
  missing: number;
  /** Skill links newly created or replaced in this run. */
  relinked: number;
  error?: string;
}

export interface InstallRepairAgentSummary {
  success: boolean;
  detected: string[];
  /** Harnesses whose ZAM MCP config is in place after this run. */
  connected: number;
  /** ZAM Companion (VS Code/Antigravity) action: installed/updated/unchanged. */
  companion: string | null;
  errors: string[];
}

export interface InstallRepairReport {
  version: string;
  /** True when `ifVersionChanged` was set and this version already ran. */
  skipped: boolean;
  cli: CliInstallReport | null;
  workspaces: InstallRepairWorkspaceSummary | null;
  agents: InstallRepairAgentSummary | null;
}

export interface InstallRepairDeps {
  version?: () => string;
  getLastRepaired?: () => string | undefined;
  setLastRepaired?: (version: string) => void;
  installCli?: (options?: CliInstallOptions) => CliInstallReport;
  repairWorkspaces?: () => InstallRepairWorkspaceSummary;
  connectAgents?: (deps: AgentConnectDeps) => InstallRepairAgentSummary;
}

function defaultRepairWorkspaces(): InstallRepairWorkspaceSummary {
  const summary: InstallRepairWorkspaceSummary = {
    provisioned: 0,
    missing: 0,
    relinked: 0,
  };
  try {
    const agents = parseSetupAgents();
    for (const workspace of getConfiguredWorkspaces()) {
      if (!existsSync(workspace.path)) {
        summary.missing += 1;
        continue;
      }
      const results = wireSkills(workspace.path, agents, { quiet: true });
      summary.provisioned += 1;
      summary.relinked += results.filter(
        (result) => result.action === "linked" || result.action === "relinked",
      ).length;
    }
  } catch (error) {
    summary.error = error instanceof Error ? error.message : String(error);
  }
  return summary;
}

function defaultConnectAgents(
  deps: AgentConnectDeps,
): InstallRepairAgentSummary {
  const report = performAgentConnect({}, deps);
  const companion =
    report.results.find((result) => result.extension?.kind === "vscode")
      ?.extension?.action ?? null;
  return {
    success: report.success,
    detected: report.detected,
    connected: report.results.filter(
      (result) => !result.error && (result.alreadyConfigured || result.wrote),
    ).length,
    companion,
    errors: report.results.flatMap((result) =>
      result.error ? [`${result.label}: ${result.error}`] : [],
    ),
  };
}

/**
 * Run the verify/repair pass. With `ifVersionChanged`, the pass is skipped
 * when this app version already ran it on this machine — the cheap form the
 * desktop app fires on every launch so an update refreshes shim + Companion
 * exactly once.
 */
export function performInstallRepair(
  opts: { ifVersionChanged?: boolean } = {},
  deps: InstallRepairDeps = {},
): InstallRepairReport {
  const version = (deps.version ?? currentVersion)();
  const getLastRepaired = deps.getLastRepaired ?? getLastRepairedVersion;
  if (opts.ifVersionChanged && getLastRepaired() === version) {
    return {
      version,
      skipped: true,
      cli: null,
      workspaces: null,
      agents: null,
    };
  }

  const cli = (deps.installCli ?? installCliShim)();
  const workspaces = (deps.repairWorkspaces ?? defaultRepairWorkspaces)();

  // When the shim is in place, point agent configs (MCP entries, Companion
  // launch config) at it: `~/.zam/bin` is stable across app updates, unlike
  // the bundle's resource path. An external `zam` keeps the default lookup.
  const agentDeps: AgentConnectDeps = {};
  if (
    cli.status === "installed" ||
    cli.status === "refreshed" ||
    cli.status === "ok"
  ) {
    agentDeps.findZam = () => cli.shimPath;
  }
  let agents: InstallRepairAgentSummary;
  try {
    agents = (deps.connectAgents ?? defaultConnectAgents)(agentDeps);
  } catch (error) {
    agents = {
      success: false,
      detected: [],
      connected: 0,
      companion: null,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }

  (deps.setLastRepaired ?? setLastRepairedVersion)(version);

  return { version, skipped: false, cli, workspaces, agents };
}
