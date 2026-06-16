/**
 * Read observer-agent reports from ~/.zam/observer/<session-id>.reports.jsonl.
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { UiObservationReport } from "./ui-observer.js";
import { parseUiObservationLog } from "./ui-observer.js";

const UI_OBSERVER_DIR = join(homedir(), ".zam", "observer");

export function getUiObserverDir(): string {
  return UI_OBSERVER_DIR;
}

export function getUiObservationPath(sessionId: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(sessionId)) {
    throw new Error(`Invalid observer session ID: ${sessionId}`);
  }
  return join(UI_OBSERVER_DIR, `${sessionId}.reports.jsonl`);
}

export function ensureUiObserverDir(): void {
  if (!existsSync(UI_OBSERVER_DIR)) {
    mkdirSync(UI_OBSERVER_DIR, { recursive: true, mode: 0o700 });
  }
}

export function readUiObservationLog(sessionId: string): UiObservationReport[] {
  const path = getUiObservationPath(sessionId);
  if (!existsSync(path)) return [];
  return parseUiObservationLog(readFileSync(path, "utf8"));
}
