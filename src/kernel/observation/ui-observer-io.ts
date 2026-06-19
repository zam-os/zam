/**
 * Read and append observer-agent reports in ~/.zam/observer/<session-id>.reports.jsonl.
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { UiObservationReport } from "./ui-observer.js";
import { isUiObservationReport, parseUiObservationLog } from "./ui-observer.js";

const DEFAULT_UI_OBSERVER_DIR = join(homedir(), ".zam", "observer");

export function getUiObserverDir(): string {
  return process.env.ZAM_OBSERVER_DIR || DEFAULT_UI_OBSERVER_DIR;
}

export function getUiObservationPath(sessionId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(sessionId)) {
    throw new Error(`Invalid observer session ID: ${sessionId}`);
  }
  return join(getUiObserverDir(), `${sessionId}.reports.jsonl`);
}

export function ensureUiObserverDir(): void {
  const dir = getUiObserverDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
}

export function uiObservationLogExists(sessionId: string): boolean {
  return existsSync(getUiObservationPath(sessionId));
}

export function readUiObservationLog(sessionId: string): UiObservationReport[] {
  const path = getUiObservationPath(sessionId);
  if (!existsSync(path)) return [];
  return parseUiObservationLog(readFileSync(path, "utf8"));
}

export function appendUiObservationReport(report: UiObservationReport): void {
  if (!isUiObservationReport(report)) {
    throw new Error("Invalid UI observation report");
  }
  ensureUiObserverDir();
  appendFileSync(
    getUiObservationPath(report.sessionId),
    `${JSON.stringify(report)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}
