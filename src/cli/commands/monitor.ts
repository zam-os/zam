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
import {
  isPowerShellShell,
  normalizeShell,
  openTerminalWindow,
  psSingleQuoted,
  resolveZamInvocation,
  selectWindowsExecutable,
  type TerminalShell,
} from "../terminal-open.js";

export { selectWindowsExecutable };

type MonitorShell = TerminalShell;

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

    openTerminalWindow({
      shellSetup,
      label: `monitor-${opts.session}`,
      dir,
      shell,
    });
  });
