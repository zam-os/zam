/**
 * `zam monitor` — Shell observation for real-time task monitoring.
 *
 * Installs shell hooks (zsh/bash/PowerShell) that capture commands with timing,
 * exit codes, and working directory to a JSONL file. The agent reads
 * this log to infer ratings for knowledge tokens.
 *
 * Usage:
 *   eval "$(zam monitor start --session <id>)"                 # zsh/bash
 *   Invoke-Expression (& zam monitor start --session <id>)     # PowerShell
 *   zam monitor status --session <id>             # check log stats
 */

import { execFileSync, execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { Command } from "commander";
import type { Database, MonitorEvent } from "../../kernel/index.js";
import {
  ensureMonitorDir,
  generateBashHooks,
  generateBashUnhooks,
  generatePowerShellHooks,
  generatePowerShellUnhooks,
  generateZshHooks,
  generateZshUnhooks,
  getMonitorLogStats,
  getMonitorPath,
  getSetting,
  monitorLogExists,
  openDatabase,
  pairCommands,
  readMonitorLog,
  setSetting,
  writeMonitorEvent,
} from "../../kernel/index.js";

type MonitorShell = "zsh" | "bash" | "pwsh" | "powershell";

function isPowerShellShell(shell: MonitorShell): boolean {
  return shell === "pwsh" || shell === "powershell";
}

function normalizeShell(shell: string | undefined): MonitorShell {
  if (!shell) return detectShell();
  const normalized = shell.toLowerCase();
  if (
    normalized === "zsh" ||
    normalized === "bash" ||
    normalized === "pwsh" ||
    normalized === "powershell"
  ) {
    return normalized;
  }
  throw new Error(
    `Unsupported shell: ${shell}. Expected zsh, bash, pwsh, or powershell.`,
  );
}

function psSingleQuoted(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

function detectShell(): MonitorShell {
  if (process.platform === "win32")
    return findExecutable("pwsh.exe") ? "pwsh" : "powershell";
  const shell = process.env.SHELL ?? "";
  return basename(shell) === "bash" ? "bash" : "zsh";
}

export const monitorCommand = new Command("monitor").description(
  "Shell observation for real-time task monitoring",
);

// ── zam monitor start ─────────────────────────────────────────────────────

monitorCommand
  .command("start")
  .description("Output shell hook code to install monitoring")
  .requiredOption("--session <id>", "Session ID to monitor")
  .option(
    "--shell <type>",
    "Shell type: zsh | bash | pwsh | powershell (auto-detected)",
  )
  .action(async (opts) => {
    let shell: MonitorShell;
    try {
      shell = normalizeShell(opts.shell);
    } catch (err) {
      console.error(`# Error: ${(err as Error).message}`);
      process.exit(1);
    }

    // Validate session exists
    let db: Database | undefined;
    try {
      db = await openDatabase();
      const session = (await db
        .prepare("SELECT id, completed_at FROM sessions WHERE id = ?")
        .get(opts.session)) as
        | { id: string; completed_at: string | null }
        | undefined;

      if (!session) {
        console.error(`# Error: Session not found: ${opts.session}`);
        process.exit(1);
      }
      if (session.completed_at) {
        console.error(`# Error: Session already completed: ${opts.session}`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`# Error: ${(err as Error).message}`);
      process.exit(1);
    } finally {
      await db?.close();
    }

    ensureMonitorDir();
    const monitorFile = getMonitorPath(opts.session);

    // Write initial meta event
    const meta: MonitorEvent = {
      type: "monitor_meta",
      ts: new Date().toISOString(),
      event: "start",
      session_id: opts.session,
      shell,
      pid: process.pid,
    };
    writeMonitorEvent(opts.session, meta);

    // Output hook code to stdout
    if (shell === "bash") {
      console.log(generateBashHooks(monitorFile, opts.session));
    } else if (isPowerShellShell(shell)) {
      console.log(generatePowerShellHooks(monitorFile, opts.session));
    } else {
      console.log(generateZshHooks(monitorFile, opts.session));
    }
  });

// ── zam monitor stop ──────────────────────────────────────────────────────

monitorCommand
  .command("stop")
  .description("Output shell code to remove monitoring hooks")
  .requiredOption("--session <id>", "Session ID")
  .option(
    "--shell <type>",
    "Shell type: zsh | bash | pwsh | powershell (auto-detected)",
  )
  .action((opts) => {
    // Write stop meta event
    if (monitorLogExists(opts.session)) {
      const meta: MonitorEvent = {
        type: "monitor_meta",
        ts: new Date().toISOString(),
        event: "stop",
        session_id: opts.session,
      };
      writeMonitorEvent(opts.session, meta);
    }

    let shell: MonitorShell;
    try {
      shell = normalizeShell(opts.shell);
    } catch (err) {
      console.error(`# Error: ${(err as Error).message}`);
      process.exit(1);
    }

    if (shell === "bash") {
      console.log(generateBashUnhooks());
    } else if (isPowerShellShell(shell)) {
      console.log(generatePowerShellUnhooks());
    } else {
      console.log(generateZshUnhooks());
    }
  });

// ── zam monitor status ────────────────────────────────────────────────────

monitorCommand
  .command("status")
  .description("Show monitoring status for a session")
  .requiredOption("--session <id>", "Session ID")
  .option("--json", "Output as JSON")
  .action((opts) => {
    const stats = getMonitorLogStats(opts.session);

    if (!stats.exists) {
      if (opts.json) {
        console.log(JSON.stringify({ exists: false }));
      } else {
        console.log(`No monitor log found for session ${opts.session}`);
      }
      return;
    }

    const events = readMonitorLog(opts.session);
    const commands = pairCommands(events);
    const errors = commands.filter(
      (c) => c.exitCode != null && c.exitCode !== 0,
    ).length;

    const meta = events.find(
      (e) => e.type === "monitor_meta" && e.event === "start",
    );
    const stopped = events.some(
      (e) => e.type === "monitor_meta" && e.event === "stop",
    );

    const result = {
      sessionId: opts.session,
      exists: true,
      active: !stopped,
      shell: meta?.shell ?? "unknown",
      totalCommands: commands.length,
      errors,
      sizeBytes: stats.sizeBytes,
      timeSpan:
        commands.length > 0
          ? {
              start: commands[0].startedAt,
              end:
                commands[commands.length - 1].endedAt ??
                commands[commands.length - 1].startedAt,
            }
          : null,
    };

    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`Monitor: ${opts.session}`);
    console.log(`  Status:   ${result.active ? "active" : "stopped"}`);
    console.log(`  Shell:    ${result.shell}`);
    console.log(`  Commands: ${result.totalCommands}`);
    console.log(`  Errors:   ${result.errors}`);
    if (result.timeSpan) {
      console.log(`  From:     ${result.timeSpan.start}`);
      console.log(`  To:       ${result.timeSpan.end}`);
    }
  });

// ── zam monitor open ─────────────────────────────────────────────────────

/**
 * Resolve the `zam` invocation — built CLI if available, otherwise tsx source.
 * This ensures the spawned terminal uses the correct entrypoint.
 */
function findExecutable(command: string): string | null {
  try {
    const lookup =
      process.platform === "win32"
        ? `where.exe ${command}`
        : `command -v ${command}`;
    const result = execSync(lookup, { encoding: "utf-8" })
      .split(/\r?\n/)[0]
      ?.trim();
    return result || null;
  } catch {
    return null;
  }
}

function resolveZamInvocation(shell: MonitorShell): string {
  const installed = findExecutable("zam");
  if (installed) {
    return isPowerShellShell(shell)
      ? `& ${psSingleQuoted(installed)}`
      : installed;
  }

  const projectRoot = join(import.meta.dirname, "..", "..", "..");
  const cliSource = join(projectRoot, "src/cli/index.ts");
  if (isPowerShellShell(shell)) {
    return `& npx --prefix ${psSingleQuoted(projectRoot)} tsx ${psSingleQuoted(cliSource)}`;
  }
  return `npx --prefix ${JSON.stringify(projectRoot)} tsx ${JSON.stringify(cliSource)}`;
}

function buildMonitorSetupCommand(
  dir: string,
  sessionId: string,
  shell: MonitorShell,
): string {
  const zamInvocation = resolveZamInvocation(shell);
  if (isPowerShellShell(shell)) {
    return [
      `Set-Location -LiteralPath ${psSingleQuoted(dir)}`,
      `$__zamHook = ${zamInvocation} monitor start --session ${psSingleQuoted(sessionId)} --shell ${shell}`,
      "Invoke-Expression ($__zamHook -join [Environment]::NewLine)",
      "Remove-Variable __zamHook",
    ].join("; ");
  }

  return `cd ${JSON.stringify(dir)} && eval "$(${zamInvocation} monitor start --session ${sessionId} --shell ${shell})"`;
}

/**
 * Detect whether iTerm2 is running (preferred on macOS).
 */
function isItermRunning(): boolean {
  try {
    const result = execSync(
      'osascript -e \'tell application "System Events" to (name of processes) contains "iTerm2"\' 2>/dev/null',
      { encoding: "utf-8" },
    ).trim();
    return result === "true";
  } catch {
    return false;
  }
}

monitorCommand
  .command("open")
  .description("Open a new monitored terminal window for a session")
  .requiredOption("--session <id>", "Session ID to monitor")
  .option("--dir <path>", "Working directory (defaults to cwd)")
  .option(
    "--shell <type>",
    "Shell type: zsh | bash | pwsh | powershell (auto-detected)",
  )
  .action(async (opts) => {
    let shell: MonitorShell;
    try {
      shell = normalizeShell(opts.shell);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }

    // Validate session exists
    let db: Database | undefined;
    try {
      db = await openDatabase();
      const session = (await db
        .prepare("SELECT id, completed_at FROM sessions WHERE id = ?")
        .get(opts.session)) as
        | { id: string; completed_at: string | null }
        | undefined;

      if (!session) {
        console.error(`Error: Session not found: ${opts.session}`);
        process.exit(1);
      }
      if (session.completed_at) {
        console.error(`Error: Session already completed: ${opts.session}`);
        process.exit(1);
      }

      // Save monitor preference so the agent knows to default to terminal
      if (!(await getSetting(db, "monitor_method"))) {
        await setSetting(db, "monitor_method", "terminal");
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    } finally {
      await db?.close();
    }

    const dir = opts.dir ?? process.cwd();
    const shellSetup = buildMonitorSetupCommand(dir, opts.session, shell);

    if (process.platform === "darwin" && !isPowerShellShell(shell)) {
      openMacTerminal(shellSetup, opts.session, dir);
    } else if (process.platform === "win32" && isPowerShellShell(shell)) {
      openWindowsPowerShell(shellSetup, opts.session, dir, shell);
    } else {
      console.log(`Run this in a new terminal:\n`);
      console.log(`  ${shellSetup}\n`);
      console.log(
        `(Automatic terminal opening is only supported on macOS Terminal/iTerm2 and Windows PowerShell for now.)`,
      );
    }
  });

/**
 * Open a macOS terminal window via AppleScript.
 * Uses a temp .scpt file to avoid shell quoting hell.
 */
function openMacTerminal(
  shellSetup: string,
  sessionId: string,
  dir: string,
): void {
  const useIterm = isItermRunning();
  const escaped = shellSetup.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const appleScript = useIterm
    ? `tell application "iTerm2"
  activate
  set newWindow to (create window with default profile)
  tell current session of newWindow
    write text "${escaped}"
  end tell
end tell`
    : `tell application "Terminal"
  activate
  do script "${escaped}"
end tell`;

  const tmpFile = join(tmpdir(), `zam-monitor-${sessionId}.scpt`);
  try {
    writeFileSync(tmpFile, appleScript);
    execSync(`osascript ${JSON.stringify(tmpFile)}`, { stdio: "ignore" });
    console.log(
      `Opened ${useIterm ? "iTerm2" : "Terminal.app"} window with monitoring for session ${sessionId}`,
    );
    console.log(`  Directory: ${dir}`);
  } catch (err) {
    console.error(`Failed to open terminal: ${(err as Error).message}`);
    console.log(`\nRun this manually in a new terminal:\n`);
    console.log(`  ${shellSetup}`);
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Open a Windows PowerShell/pwsh window with monitoring installed.
 */
function openWindowsPowerShell(
  shellSetup: string,
  sessionId: string,
  dir: string,
  requestedShell: MonitorShell,
): void {
  const requestedExecutable =
    requestedShell === "powershell" ? "powershell.exe" : "pwsh.exe";
  const executable = findExecutable(requestedExecutable)
    ? requestedExecutable
    : "powershell.exe";
  const startCommand = [
    "Start-Process",
    `-FilePath ${psSingleQuoted(executable)}`,
    `-ArgumentList @('-NoExit','-NoProfile','-Command',${psSingleQuoted(shellSetup)})`,
  ].join(" ");

  try {
    execFileSync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", startCommand],
      {
        stdio: "ignore",
      },
    );
    console.log(
      `Opened ${executable === "pwsh.exe" ? "PowerShell" : "Windows PowerShell"} window with monitoring for session ${sessionId}`,
    );
    console.log(`  Directory: ${dir}`);
  } catch (err) {
    console.error(`Failed to open PowerShell: ${(err as Error).message}`);
    console.log(`\nRun this manually in a new PowerShell terminal:\n`);
    console.log(`  ${shellSetup}`);
  }
}
