/**
 * Per-machine install configuration — Increment 12, Phase 3.
 *
 * Records whether this machine runs ZAM in "developer" mode (source checkout,
 * git-backed workspace, manual `git`/`npm` updates) or "default" mode (an
 * installed application updated through a package manager or the in-app
 * updater). Stored in ~/.zam/config.json — a per-machine file, NOT the database
 * and NOT the personal folder, so the mode never travels through a shared Turso
 * database or a synced folder, where it would be wrong for the other machine.
 *
 * The personal-content folder itself is unchanged: it stays the existing
 * `personal.workspace_dir` setting, and can already point at any local or
 * file-synced directory (Drive, OneDrive, Dropbox, iCloud) — no GitHub required.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type InstallMode = "developer" | "default";

export interface InstallConfig {
  mode?: InstallMode;
}

const DEFAULT_CONFIG_PATH = join(homedir(), ".zam", "config.json");

/** Load ~/.zam/config.json. Returns an empty config if missing or unreadable. */
export function loadInstallConfig(path = DEFAULT_CONFIG_PATH): InstallConfig {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as InstallConfig;
  } catch {
    return {};
  }
}

/** Persist the install config, preserving any unrelated keys already on disk. */
export function saveInstallConfig(
  config: InstallConfig,
  path = DEFAULT_CONFIG_PATH,
): void {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
}

/**
 * This machine's install mode. Defaults to "developer" — the only historical
 * mode — so existing source/CLI installs keep their behavior. A packaged
 * "default" install writes mode explicitly at install time.
 */
export function getInstallMode(path = DEFAULT_CONFIG_PATH): InstallMode {
  return loadInstallConfig(path).mode ?? "developer";
}

export function setInstallMode(
  mode: InstallMode,
  path = DEFAULT_CONFIG_PATH,
): void {
  const config = loadInstallConfig(path);
  config.mode = mode;
  saveInstallConfig(config, path);
}

/**
 * Best-effort detection of the file-sync provider a folder lives in, from its
 * path. Used only for friendly messaging ("this folder syncs via OneDrive —
 * good for moving snapshots between machines"), never for behavior.
 */
export function detectSyncProvider(dir: string): string | null {
  const p = dir.toLowerCase();
  if (p.includes("onedrive")) return "OneDrive";
  if (p.includes("dropbox")) return "Dropbox";
  if (
    p.includes("google drive") ||
    p.includes("googledrive") ||
    p.includes("/my drive")
  ) {
    return "Google Drive";
  }
  if (p.includes("icloud") || p.includes("mobile documents")) {
    return "iCloud Drive";
  }
  return null;
}
