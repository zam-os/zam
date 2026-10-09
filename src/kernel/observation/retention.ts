/**
 * Observation retention — ADR 2026-10-08 R6.
 *
 * A session's raw observation files (its monitor log, and its observer
 * reports for as long as those exist) are evidence only while it is captured:
 * they are deleted when the session ends, right after its synthesis was
 * prepared, and a session that never ends loses them after
 * `observation.retentionDays` (default 1, so 24 hours) in the machine-local
 * config.json. Before a monitor log goes, ZAM keeps a value-free digest of it
 * — the redacted, normalized command prefixes skill discovery compares — so
 * discovery survives the deletion.
 *
 * Files are machine-local while confirmation lives in the shared database:
 * confirming on one machine deletes nothing on another, where only the window
 * applies. The sweep therefore never consults the database.
 *
 * Files from sessions that started before retention first ran on this
 * machine are legacy. The sweep redacts their monitor logs but never deletes
 * them; they are listed by {@link inventoryObservationFiles} and deleted only
 * after the owner confirms that list.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { decodeTime, isValid as isValidUlid } from "ulid";
import {
  ensureObservationRetentionSince,
  getObservationRetentionDays,
  loadInstallConfig,
} from "../system/install-config.js";
import type { CommandRecord } from "./analyzer.js";
import { pairCommands } from "./analyzer.js";
import {
  getMonitorDir,
  getMonitorPath,
  readMonitorLog,
  rewriteMonitorLogRedacted,
} from "./monitor-io.js";
import { digestCommandPrefixes } from "./skill-discovery.js";
import { getUiObservationPath, getUiObserverDir } from "./ui-observer-io.js";

const DAY_MS = 24 * 60 * 60 * 1000;
/** How often a long-running process sweeps again after its first sweep. */
export const OBSERVATION_SWEEP_INTERVAL_MS = 60 * 60 * 1000;
/** A log untouched this long belongs to no running command. */
const DEFAULT_IDLE_MS = 10 * 60 * 1000;
/** Digests are value-free, but they need not grow without bound. */
const MAX_DIGESTS = 200;
const SESSION_ID = /^[A-Za-z0-9_-]+$/;

// ── Digests ──────────────────────────────────────────────────────────────────

export interface SessionDigest {
  version: 1;
  sessionId: string;
  createdAt: string;
  /** Redacted, normalized command prefixes in session order. */
  prefixes: string[];
}

export function getDigestDir(): string {
  return join(getMonitorDir(), "digests");
}

function digestPath(sessionId: string): string {
  return join(getDigestDir(), `${sessionId}.json`);
}

function assertSessionId(sessionId: string): void {
  if (!SESSION_ID.test(sessionId)) {
    throw new Error(`Invalid session ID: ${sessionId}`);
  }
}

/** Store the digest of a session's (already redacted) commands. */
export function writeSessionDigest(
  sessionId: string,
  commands: CommandRecord[],
  now = new Date(),
): SessionDigest {
  assertSessionId(sessionId);
  const digest: SessionDigest = {
    version: 1,
    sessionId,
    createdAt: now.toISOString(),
    prefixes: digestCommandPrefixes(commands),
  };
  const dir = getDigestDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  writeFileSync(digestPath(sessionId), `${JSON.stringify(digest)}\n`, {
    encoding: "utf-8",
    mode: 0o600,
  });
  return digest;
}

export function readSessionDigest(sessionId: string): SessionDigest | null {
  if (!SESSION_ID.test(sessionId)) return null;
  const path = digestPath(sessionId);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf-8")) as SessionDigest;
    if (parsed?.version !== 1 || !Array.isArray(parsed.prefixes)) return null;
    return {
      ...parsed,
      prefixes: parsed.prefixes.filter((p) => typeof p === "string"),
    };
  } catch {
    return null;
  }
}

/** Session ids that have a digest, newest first. */
export function listSessionDigestIds(): string[] {
  const dir = getDigestDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.slice(0, -".json".length))
    .filter((id) => SESSION_ID.test(id))
    .sort((a, b) => b.localeCompare(a));
}

/** Session ids that still have a raw monitor log, newest first. */
export function listMonitorLogIds(): string[] {
  const dir = getMonitorDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".jsonl"))
    .map((name) => name.slice(0, -".jsonl".length))
    .filter((id) => SESSION_ID.test(id))
    .sort((a, b) => b.localeCompare(a));
}

// ── Closing a session's observation ──────────────────────────────────────────

export type ObservationFileKind =
  | "monitor-log"
  | "observer-reports"
  | "desktop-observer-session"
  | "temp-recording"
  | "temp-capture"
  | "temp-frames";

export interface CloseObservationResult {
  sessionId: string;
  /** Whether a digest of the monitor log was kept. */
  digested: boolean;
  /** Kinds of file deleted on this machine. */
  deleted: ObservationFileKind[];
}

/**
 * Keep the digest and delete the session's raw files on this machine. Session
 * end calls it once synthesis was prepared; called on its own, it drops the
 * evidence of a session still running or never ended, which then yields no
 * synthesis.
 */
export function closeSessionObservation(
  sessionId: string,
  now = new Date(),
): CloseObservationResult {
  assertSessionId(sessionId);
  const deleted: ObservationFileKind[] = [];
  let digested = false;
  const monitorPath = getMonitorPath(sessionId);
  if (existsSync(monitorPath)) {
    writeSessionDigest(sessionId, pairCommands(readMonitorLog(sessionId)), now);
    digested = true;
    rmSync(monitorPath, { force: true });
    deleted.push("monitor-log");
  }
  const reportsPath = getUiObservationPath(sessionId);
  if (existsSync(reportsPath)) {
    rmSync(reportsPath, { force: true });
    deleted.push("observer-reports");
  }
  return { sessionId, digested, deleted };
}

// ── Locations ────────────────────────────────────────────────────────────────

/**
 * Where the desktop app keeps its own observer watch logs: the app data
 * directory of `com.zam.app`, as Tauri resolves it on each platform.
 */
export function defaultDesktopObserverDir(): string {
  const appId = "com.zam.app";
  if (process.platform === "darwin") {
    return join(homedir(), "Library", "Application Support", appId, "observer");
  }
  if (process.platform === "win32") {
    const roaming =
      process.env.APPDATA || join(homedir(), "AppData", "Roaming");
    return join(roaming, appId, "observer");
  }
  const dataHome =
    process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
  return join(dataHome, appId, "observer");
}

/**
 * Where observation files live. The monitor and observer directories follow
 * `ZAM_MONITOR_DIR` and `ZAM_OBSERVER_DIR`, like every other reader; the
 * desktop and temp directories can be overridden for tests.
 */
export interface ObservationLocations {
  desktopObserverDir: string | null;
  tempDir: string;
}

function defaultLocations(
  overrides: Partial<ObservationLocations> = {},
): ObservationLocations & { monitorDir: string; observerDir: string } {
  return {
    monitorDir: getMonitorDir(),
    observerDir: getUiObserverDir(),
    desktopObserverDir:
      overrides.desktopObserverDir === undefined
        ? defaultDesktopObserverDir()
        : overrides.desktopObserverDir,
    tempDir: overrides.tempDir ?? tmpdir(),
  };
}

// ── Inventory ────────────────────────────────────────────────────────────────

export interface ObservationFile {
  kind: ObservationFileKind;
  path: string;
  sessionId: string | null;
  sizeBytes: number;
  modifiedAt: string;
  /** Started before retention first ran here: deleted only on confirmation. */
  legacy: boolean;
}

function safeStat(path: string) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}

function listDir(dir: string): string[] {
  try {
    return readdirSync(dir);
  } catch {
    return [];
  }
}

/** Size and newest modification of a file, or of a directory's files. */
function measure(path: string): { size: number; mtimeMs: number } | null {
  const stat = safeStat(path);
  if (!stat) return null;
  if (!stat.isDirectory()) return { size: stat.size, mtimeMs: stat.mtimeMs };
  let size = 0;
  let mtimeMs = stat.mtimeMs;
  for (const name of listDir(path)) {
    const inner = measure(join(path, name));
    if (!inner) continue;
    size += inner.size;
    mtimeMs = Math.max(mtimeMs, inner.mtimeMs);
  }
  return { size, mtimeMs };
}

function startedBefore(
  sessionId: string | null,
  mtimeMs: number,
  sinceMs: number,
): boolean {
  if (sessionId && isValidUlid(sessionId)) {
    return decodeTime(sessionId) < sinceMs;
  }
  return mtimeMs < sinceMs;
}

const TEMP_PREFIXES: Array<[string, ObservationFileKind]> = [
  ["zam-recording-", "temp-recording"],
  ["zam-capture-", "temp-capture"],
  ["zam-frames-", "temp-frames"],
];

function retentionSinceMs(configPath?: string): number {
  const since = loadInstallConfig(configPath).observation?.retentionSince;
  const parsed = typeof since === "string" ? Date.parse(since) : Number.NaN;
  // Before the first sweep everything on disk predates retention.
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

/**
 * Every raw observation file on this machine. Read only; the owner decides
 * what to delete (ADR 2026-10-08 R6, plan 0B.6).
 */
export function inventoryObservationFiles(
  options: {
    configPath?: string;
    locations?: Partial<ObservationLocations>;
  } = {},
): ObservationFile[] {
  const locations = defaultLocations(options.locations);
  const sinceMs = retentionSinceMs(options.configPath);
  const files: ObservationFile[] = [];
  const push = (
    kind: ObservationFileKind,
    path: string,
    sessionId: string | null,
  ) => {
    const measured = measure(path);
    if (!measured) return;
    files.push({
      kind,
      path,
      sessionId,
      sizeBytes: measured.size,
      modifiedAt: new Date(measured.mtimeMs).toISOString(),
      legacy: startedBefore(sessionId, measured.mtimeMs, sinceMs),
    });
  };

  for (const name of listDir(locations.monitorDir)) {
    if (name.endsWith(".jsonl")) {
      push(
        "monitor-log",
        join(locations.monitorDir, name),
        name.slice(0, -".jsonl".length),
      );
    }
  }
  for (const name of listDir(locations.observerDir)) {
    if (name.endsWith(".reports.jsonl")) {
      push(
        "observer-reports",
        join(locations.observerDir, name),
        name.slice(0, -".reports.jsonl".length),
      );
    }
  }
  if (locations.desktopObserverDir) {
    for (const name of listDir(locations.desktopObserverDir)) {
      const path = join(locations.desktopObserverDir, name);
      if (safeStat(path)?.isDirectory()) {
        push("desktop-observer-session", path, name);
      }
    }
  }
  for (const name of listDir(locations.tempDir)) {
    const match = TEMP_PREFIXES.find(([prefix]) => name.startsWith(prefix));
    if (match) push(match[1], join(locations.tempDir, name), null);
  }
  return files;
}

/** Delete files the owner confirmed from an inventory. */
export function deleteObservationFiles(files: ObservationFile[]): string[] {
  const deleted: string[] = [];
  for (const file of files) {
    try {
      if (file.kind === "monitor-log" && file.sessionId) {
        if (SESSION_ID.test(file.sessionId) && existsSync(file.path)) {
          writeSessionDigest(
            file.sessionId,
            pairCommands(readMonitorLog(file.sessionId)),
          );
        }
      }
      rmSync(file.path, { recursive: true, force: true });
      deleted.push(file.path);
    } catch {
      // A file another process holds stays; the next sweep tries again.
    }
  }
  return deleted;
}

// ── Sweep ────────────────────────────────────────────────────────────────────

export interface SweepOptions {
  now?: Date;
  configPath?: string;
  /** A log untouched for less than this is left alone (default 10 min). */
  idleMs?: number;
  locations?: Partial<ObservationLocations>;
}

export interface SweepResult {
  retentionDays: number;
  /** Null while config.json does not parse: then nothing is deleted. */
  retentionSince: string | null;
  /** Session ids whose monitor log was rewritten in redacted form. */
  redacted: string[];
  /** Files deleted because the window passed. */
  deleted: Array<{ kind: ObservationFileKind; sessionId: string | null }>;
  /** Legacy files kept for the owner's confirmation. */
  legacyKept: number;
}

/**
 * Redact idle monitor logs and delete raw files whose window passed. Runs at
 * session end, `zam monitor start`, MCP and bridge server start (which is
 * desktop start). Never throws: a file it cannot touch waits for next time.
 */
export function sweepObservationFiles(options: SweepOptions = {}): SweepResult {
  const now = options.now ?? new Date();
  const idleMs = options.idleMs ?? DEFAULT_IDLE_MS;
  const retentionDays = getObservationRetentionDays(options.configPath);
  const retentionSince = ensureObservationRetentionSince(
    now,
    options.configPath,
  );
  const cutoffMs = now.getTime() - retentionDays * DAY_MS;
  const result: SweepResult = {
    retentionDays,
    retentionSince,
    redacted: [],
    deleted: [],
    legacyKept: 0,
  };

  const files = inventoryObservationFiles({
    configPath: options.configPath,
    locations: options.locations,
  });
  for (const file of files) {
    try {
      const mtimeMs = Date.parse(file.modifiedAt);
      if (
        file.kind === "monitor-log" &&
        file.sessionId &&
        now.getTime() - mtimeMs >= idleMs &&
        rewriteMonitorLogRedacted(file.sessionId)
      ) {
        result.redacted.push(file.sessionId);
      }
      if (file.legacy) {
        result.legacyKept++;
        continue;
      }
      if (mtimeMs >= cutoffMs) continue;
      deleteObservationFiles([file]);
      if (!existsSync(file.path)) {
        result.deleted.push({ kind: file.kind, sessionId: file.sessionId });
      }
    } catch {
      // Best effort per file.
    }
  }

  try {
    for (const id of listSessionDigestIds().slice(MAX_DIGESTS)) {
      rmSync(digestPath(id), { force: true });
    }
  } catch {
    // Best effort.
  }
  return result;
}

/**
 * Sweep once off the caller's startup path, then every hour, in a process
 * that runs all day: the desktop bridge and the MCP server. Otherwise the log
 * of a session that crashed or never ended would wait for the next start to be
 * redacted or deleted. The timers never keep a process alive. Returns a
 * function that stops them.
 */
export function scheduleObservationSweeps(
  onError: (err: Error) => void = () => {},
  intervalMs = OBSERVATION_SWEEP_INTERVAL_MS,
): () => void {
  const sweep = () => {
    try {
      sweepObservationFiles();
    } catch (err) {
      onError(err as Error);
    }
  };
  const first = setTimeout(sweep, 0);
  const every = setInterval(sweep, intervalMs);
  first.unref?.();
  every.unref?.();
  return () => {
    clearTimeout(first);
    clearInterval(every);
  };
}
