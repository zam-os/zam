/**
 * `zam monitor` — Shell observation for real-time task monitoring.
 *
 * Installs shell hooks (zsh/bash) that capture commands with timing,
 * exit codes, and working directory to a JSONL file. The agent reads
 * this log to infer ratings for knowledge tokens.
 *
 * Usage:
 *   eval "$(zam monitor start --session <id>)"   # install hooks
 *   eval "$(zam monitor stop --session <id>)"     # remove hooks
 *   zam monitor status --session <id>             # check log stats
 */

import { Command } from "commander";
import { basename, join } from "node:path";
import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import type { Database } from "better-sqlite3";
import {
  openDatabase,
  ensureMonitorDir,
  getMonitorPath,
  writeMonitorEvent,
  readMonitorLog,
  pairCommands,
  monitorLogExists,
  getMonitorLogStats,
  generateZshHooks,
  generateBashHooks,
  generateZshUnhooks,
  generateBashUnhooks,
} from "../../kernel/index.js";
import type { MonitorEvent } from "../../kernel/index.js";

function detectShell(): "zsh" | "bash" {
  const shell = process.env.SHELL ?? "";
  return basename(shell) === "bash" ? "bash" : "zsh";
}

export const monitorCommand = new Command("monitor")
  .description("Shell observation for real-time task monitoring");

// ── zam monitor start ─────────────────────────────────────────────────────

monitorCommand
  .command("start")
  .description("Output shell hook code to install monitoring (wrap with eval)")
  .requiredOption("--session <id>", "Session ID to monitor")
  .option("--shell <type>", "Shell type: zsh | bash (auto-detected from $SHELL)")
  .action((opts) => {
    // Validate session exists
    let db: Database | undefined;
    try {
      db = openDatabase();
      const session = db
        .prepare("SELECT id, completed_at FROM sessions WHERE id = ?")
        .get(opts.session) as { id: string; completed_at: string | null } | undefined;

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
      db?.close();
    }

    ensureMonitorDir();
    const monitorFile = getMonitorPath(opts.session);

    // Write initial meta event
    const meta: MonitorEvent = {
      type: "monitor_meta",
      ts: new Date().toISOString(),
      event: "start",
      session_id: opts.session,
      shell: opts.shell ?? detectShell(),
      pid: process.pid,
    };
    writeMonitorEvent(opts.session, meta);

    // Output hook code to stdout
    const shell = opts.shell ?? detectShell();
    if (shell === "bash") {
      console.log(generateBashHooks(monitorFile, opts.session));
    } else {
      console.log(generateZshHooks(monitorFile, opts.session));
    }
  });

// ── zam monitor stop ──────────────────────────────────────────────────────

monitorCommand
  .command("stop")
  .description("Output shell code to remove monitoring hooks (wrap with eval)")
  .requiredOption("--session <id>", "Session ID")
  .option("--shell <type>", "Shell type: zsh | bash (auto-detected from $SHELL)")
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

    const shell = opts.shell ?? detectShell();
    if (shell === "bash") {
      console.log(generateBashUnhooks());
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
    const errors = commands.filter((c) => c.exitCode != null && c.exitCode !== 0).length;

    const meta = events.find((e) => e.type === "monitor_meta" && e.event === "start");
    const stopped = events.some((e) => e.type === "monitor_meta" && e.event === "stop");

    const result = {
      sessionId: opts.session,
      exists: true,
      active: !stopped,
      shell: meta?.shell ?? "unknown",
      totalCommands: commands.length,
      errors,
      sizeBytes: stats.sizeBytes,
      timeSpan: commands.length > 0
        ? {
            start: commands[0].startedAt,
            end: commands[commands.length - 1].endedAt ?? commands[commands.length - 1].startedAt,
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
 * Resolve the `zam` binary path — built CLI if available, otherwise tsx source.
 * This ensures the eval in the spawned terminal uses the correct entrypoint.
 */
function resolveZamBin(): string {
  try {
    // Prefer the built CLI (installed via npm link or global install)
    const which = execSync("which zam 2>/dev/null", { encoding: "utf-8" }).trim();
    if (which) return which;
  } catch {
    // not installed globally
  }
  // Fallback: use absolute path to the built CLI or source
  const projectRoot = join(import.meta.dirname, "..", "..", "..");
  return `npx --prefix ${JSON.stringify(projectRoot)} tsx ${join(projectRoot, "src/cli/index.ts")}`;
}

/**
 * Detect whether iTerm2 is running (preferred on macOS).
 */
function isItermRunning(): boolean {
  try {
    const result = execSync(
      "osascript -e 'tell application \"System Events\" to (name of processes) contains \"iTerm2\"' 2>/dev/null",
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
  .option("--shell <type>", "Shell type: zsh | bash (auto-detected from $SHELL)")
  .action((opts) => {
    // Validate session exists
    let db: Database | undefined;
    try {
      db = openDatabase();
      const session = db
        .prepare("SELECT id, completed_at FROM sessions WHERE id = ?")
        .get(opts.session) as { id: string; completed_at: string | null } | undefined;

      if (!session) {
        console.error(`Error: Session not found: ${opts.session}`);
        process.exit(1);
      }
      if (session.completed_at) {
        console.error(`Error: Session already completed: ${opts.session}`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    } finally {
      db?.close();
    }

    const dir = opts.dir ?? process.cwd();
    const zamBin = resolveZamBin();
    const shellSetup = `cd ${JSON.stringify(dir)} && eval "$(${zamBin} monitor start --session ${opts.session})"`;

    if (process.platform === "darwin") {
      openMacTerminal(shellSetup, opts.session, dir);
    } else {
      console.log(`Run this in a new terminal:\n`);
      console.log(`  ${shellSetup}\n`);
      console.log(`(Automatic terminal opening is only supported on macOS for now.)`);
    }
  });

/**
 * Open a macOS terminal window via AppleScript.
 * Uses a temp .scpt file to avoid shell quoting hell.
 */
function openMacTerminal(shellSetup: string, sessionId: string, dir: string): void {
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
    console.log(`Opened ${useIterm ? "iTerm2" : "Terminal.app"} window with monitoring for session ${sessionId}`);
    console.log(`  Directory: ${dir}`);
  } catch (err) {
    console.error(`Failed to open terminal: ${(err as Error).message}`);
    console.log(`\nRun this manually in a new terminal:\n`);
    console.log(`  ${shellSetup}`);
  } finally {
    try { unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
