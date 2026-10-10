/**
 * Monitor I/O — read/write JSONL files for shell observation.
 *
 * Monitor logs live at ~/.zam/monitor/<session-id>.jsonl.
 * Separated from analyzer.ts so the analyzer remains pure-function testable.
 *
 * The shell hooks append command lines to the log themselves, so ZAM cannot
 * redact on write (ADR 2026-10-08 R5). It redacts on the way out instead:
 * {@link readMonitorLog} is the one read path, and every command it returns
 * has been through {@link redactCommand}. Monitor patterns, synthesis,
 * `zam_monitor`, the bridge monitor commands and skill discovery all read
 * through it, so none of them sees a raw command line.
 * {@link rewriteMonitorLogRedacted} also redacts the file itself, once
 * monitoring stops or the session ends.
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { MonitorEvent } from "./analyzer.js";
import { parseMonitorLog } from "./analyzer.js";
import { redactCommand } from "./redact.js";

/** Get the monitor directory path (`ZAM_MONITOR_DIR` overrides it). */
export function getMonitorDir(): string {
  return process.env.ZAM_MONITOR_DIR || join(homedir(), ".zam", "monitor");
}

/** Get the JSONL file path for a session. */
export function getMonitorPath(sessionId: string): string {
  return join(getMonitorDir(), `${sessionId}.jsonl`);
}

/** Ensure the monitor directory exists (mode 0700 for privacy). */
export function ensureMonitorDir(): void {
  const dir = getMonitorDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

/** Append a single event to the session's JSONL file. */
export function writeMonitorEvent(
  sessionId: string,
  event: MonitorEvent,
): void {
  ensureMonitorDir();
  const path = getMonitorPath(sessionId);
  appendFileSync(path, `${JSON.stringify(redactMonitorEvent(event))}\n`, {
    mode: 0o600,
  });
}

/** The event with its command line redacted (ADR 2026-10-08 R5). */
export function redactMonitorEvent(event: MonitorEvent): MonitorEvent {
  if (typeof event.command !== "string" && event.cwd === undefined) {
    return event;
  }
  // The working directory goes too: a project path is content, and no
  // analysis reads it.
  const { cwd: _cwd, ...rest } = event;
  return typeof rest.command === "string"
    ? { ...rest, command: redactCommand(rest.command) }
    : rest;
}

/**
 * Read and parse all events from a session's monitor log. Every command
 * comes back redacted and without its working directory; there is no raw
 * read path.
 */
export function readMonitorLog(sessionId: string): MonitorEvent[] {
  const path = getMonitorPath(sessionId);
  if (!existsSync(path)) {
    return [];
  }
  const content = readFileSync(path, "utf-8");
  return parseMonitorLog(content).map(redactMonitorEvent);
}

/**
 * Rewrite a session's log in redacted form (ADR 2026-10-08 R5). Lines that do
 * not parse are dropped: no reader can use them, and they may hold a command
 * the hooks failed to escape. The file is replaced in one rename, so a
 * reader never sees half of it. A hook that appends during the rewrite can
 * lose that one line, which is why callers rewrite only once a session is
 * stopped, ended or idle. Returns whether the file changed.
 */
export function rewriteMonitorLogRedacted(sessionId: string): boolean {
  const path = getMonitorPath(sessionId);
  if (!existsSync(path)) return false;
  const content = readFileSync(path, "utf-8");
  const lines = parseMonitorLog(content)
    .map((event) => JSON.stringify(redactMonitorEvent(event)))
    .join("\n");
  const next = lines ? `${lines}\n` : "";
  if (next === content) return false;
  // The rewrite keeps the file's times: retention counts from the last
  // command, not from the last redaction.
  const { atime, mtime } = statSync(path);
  const temp = `${path}.${process.pid}.redacting`;
  writeFileSync(temp, next, { encoding: "utf-8", mode: 0o600 });
  utimesSync(temp, atime, mtime);
  renameSync(temp, path);
  return true;
}

/** Check if a monitor log exists for a session. */
export function monitorLogExists(sessionId: string): boolean {
  return existsSync(getMonitorPath(sessionId));
}

/** Get basic stats about a monitor log without full parsing. */
export function getMonitorLogStats(sessionId: string): {
  exists: boolean;
  sizeBytes: number;
  lineCount: number;
} {
  const path = getMonitorPath(sessionId);
  if (!existsSync(path)) {
    return { exists: false, sizeBytes: 0, lineCount: 0 };
  }
  const stat = statSync(path);
  const content = readFileSync(path, "utf-8");
  const lineCount = content.split("\n").filter((l) => l.trim()).length;
  return { exists: true, sizeBytes: stat.size, lineCount };
}
