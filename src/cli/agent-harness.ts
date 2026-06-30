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
import { existsSync } from "node:fs";
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
  | "antigravity";

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
