/**
 * Monitor I/O — read/write JSONL files for shell observation.
 *
 * Monitor logs live at ~/.zam/monitor/<session-id>.jsonl.
 * Separated from analyzer.ts so the analyzer remains pure-function testable.
 */

import { existsSync, mkdirSync, readFileSync, appendFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { MonitorEvent } from "./analyzer.js";
import { parseMonitorLog } from "./analyzer.js";

const MONITOR_DIR = join(homedir(), ".zam", "monitor");

/** Get the monitor directory path. */
export function getMonitorDir(): string {
  return MONITOR_DIR;
}

/** Get the JSONL file path for a session. */
export function getMonitorPath(sessionId: string): string {
  return join(MONITOR_DIR, `${sessionId}.jsonl`);
}

/** Ensure the monitor directory exists (mode 0700 for privacy). */
export function ensureMonitorDir(): void {
  if (!existsSync(MONITOR_DIR)) {
    mkdirSync(MONITOR_DIR, { recursive: true, mode: 0o700 });
  }
}

/** Append a single event to the session's JSONL file. */
export function writeMonitorEvent(sessionId: string, event: MonitorEvent): void {
  ensureMonitorDir();
  const path = getMonitorPath(sessionId);
  appendFileSync(path, JSON.stringify(event) + "\n");
}

/** Read and parse all events from a session's monitor log. */
export function readMonitorLog(sessionId: string): MonitorEvent[] {
  const path = getMonitorPath(sessionId);
  if (!existsSync(path)) {
    return [];
  }
  const content = readFileSync(path, "utf-8");
  return parseMonitorLog(content);
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
