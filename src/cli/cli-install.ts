/**
 * CLI shim installation — makes `zam` work as a terminal command on machines
 * that only have the desktop app (no npm/global install). The desktop bundle
 * ships the built CLI plus a Node runtime in its resources; this module writes
 * a tiny launcher into `~/.zam/bin` that points at them and makes sure that
 * directory is on the user's PATH (HKCU environment on Windows, login-shell
 * profile on macOS/Linux).
 *
 * Idempotent and self-healing: rerunning refreshes a shim whose target moved
 * (app update, reinstall) and never touches a `zam` that is already provided
 * by another install (npm global, dev checkout on PATH).
 */

import { execFileSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { findExecutable } from "./terminal-open.js";

export type CliInstallStatus =
  /** Shim written for the first time. */
  | "installed"
  /** Shim existed but pointed at a stale runtime/CLI and was rewritten. */
  | "refreshed"
  /** Shim already correct. */
  | "ok"
  /** A non-shim `zam` is already on PATH — left untouched. */
  | "external"
  /** Not running from a built `dist/cli/index.js` (dev/tsx run). */
  | "skipped"
  | "error";

export interface CliInstallReport {
  status: CliInstallStatus;
  binDir: string;
  shimPath: string;
  nodePath: string;
  cliPath: string;
  /** Best knowledge whether `zam` resolves in a (possibly new) terminal. */
  onPath: boolean;
  /** True when the persistent user PATH was modified in this run. */
  pathUpdated: boolean;
  /** PATH changes only reach terminals opened after this run. */
  needsNewTerminal: boolean;
  detail?: string;
}

export interface CliInstallOptions {
  home?: string;
  platform?: NodeJS.Platform;
  /** Node runtime the shim should launch; default: this process. */
  nodePath?: string;
  /** Built CLI entry the shim should run; default: this process's script. */
  cliPath?: string;
  env?: NodeJS.ProcessEnv;
  find?: (command: string) => string | null;
  /**
   * Ensure the persistent user PATH contains `binDir`; returns whether it was
   * modified. Injectable so tests never touch the Windows registry or shell
   * profiles. Default: registry via PowerShell on Windows, login profile
   * append on macOS/Linux.
   */
  ensureUserPath?: (binDir: string) => boolean;
}

const BUILT_CLI_PATTERN = /[\\/]dist[\\/]cli[\\/]index\.js$/;

function normalizeForCompare(path: string, platform: NodeJS.Platform): string {
  const resolved = resolve(path);
  return platform === "win32" ? resolved.toLowerCase() : resolved;
}

export function windowsShimContent(nodePath: string, cliPath: string): string {
  return `@echo off\r\n"${nodePath}" "${cliPath}" %*\r\n`;
}

export function unixShimContent(nodePath: string, cliPath: string): string {
  return `#!/bin/sh\nexec "${nodePath}" "${cliPath}" "$@"\n`;
}

/** Single-quote a value for embedding in a PowerShell script. */
function psQuote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Append `binDir` to the per-user PATH in the Windows registry, preserving the
 * raw (unexpanded) REG_EXPAND_SZ value — `setx` would expand and truncate it.
 * Broadcasts WM_SETTINGCHANGE so newly launched terminals pick it up.
 */
function ensureWindowsUserPath(binDir: string): boolean {
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "$key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey('Environment', $true)",
    "$old = [string]$key.GetValue('Path', '', [Microsoft.Win32.RegistryValueOptions]::DoNotExpandEnvironmentNames)",
    `$target = ${psQuote(binDir)}`,
    "$expanded = ($old -split ';') | Where-Object { $_ -ne '' } | ForEach-Object { [Environment]::ExpandEnvironmentVariables($_).TrimEnd('\\') }",
    "if ($expanded -contains $target.TrimEnd('\\')) { 'present'; exit 0 }",
    "$new = if ($old -and -not $old.EndsWith(';')) { $old + ';' + $target } else { $old + $target }",
    "$key.SetValue('Path', $new, [Microsoft.Win32.RegistryValueKind]::ExpandString)",
    "$sig = '[DllImport(\"user32.dll\", SetLastError = true, CharSet = CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);'",
    "$type = Add-Type -MemberDefinition $sig -Name 'ZamEnvBroadcast' -Namespace 'ZamInstall' -PassThru",
    "[UIntPtr]$result = [UIntPtr]::Zero",
    "$null = $type::SendMessageTimeout([IntPtr]0xffff, 0x001A, [UIntPtr]::Zero, 'Environment', 2, 5000, [ref]$result)",
    "'updated'",
  ].join("; ");
  const output = execFileSync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
  )
    .toString()
    .trim();
  return output.endsWith("updated");
}

/**
 * Make login shells see `~/.zam/bin` by appending a guarded export to the
 * platform's login profile (zsh on macOS, `~/.profile` elsewhere).
 */
function ensureUnixUserPath(home: string, platform: NodeJS.Platform): boolean {
  const profile = join(home, platform === "darwin" ? ".zprofile" : ".profile");
  const existing = existsSync(profile) ? readFileSync(profile, "utf8") : "";
  if (existing.includes(".zam/bin")) return false;
  const block = `\n# Added by ZAM: keep the zam CLI on PATH\nexport PATH="$HOME/.zam/bin:$PATH"\n`;
  writeFileSync(profile, existing + block, "utf8");
  return true;
}

/**
 * Install (or repair) the `zam` shim and PATH entry. Never throws — failures
 * are reported as `status: "error"` so callers can render them.
 */
export function installCliShim(
  options: CliInstallOptions = {},
): CliInstallReport {
  const home = options.home ?? homedir();
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const find = options.find ?? findExecutable;
  const nodePath = resolve(options.nodePath ?? process.execPath);
  const cliPath = resolve(options.cliPath ?? process.argv[1] ?? "");
  const binDir = join(home, ".zam", "bin");
  const shimPath = join(binDir, platform === "win32" ? "zam.cmd" : "zam");

  const report: CliInstallReport = {
    status: "ok",
    binDir,
    shimPath,
    nodePath,
    cliPath,
    onPath: false,
    pathUpdated: false,
    needsNewTerminal: false,
  };

  if (!BUILT_CLI_PATTERN.test(cliPath) || !existsSync(cliPath)) {
    report.status = "skipped";
    report.detail = `Not running from a built CLI entry (${cliPath}); nothing to link.`;
    return report;
  }

  try {
    // A `zam` that is not our shim (npm global, dev checkout) wins — never
    // shadow or rewrite it.
    const existing = find("zam");
    if (
      existing &&
      normalizeForCompare(existing, platform) !==
        normalizeForCompare(shimPath, platform)
    ) {
      report.status = "external";
      report.onPath = true;
      report.detail = existing;
      return report;
    }

    const content =
      platform === "win32"
        ? windowsShimContent(nodePath, cliPath)
        : unixShimContent(nodePath, cliPath);
    const existed = existsSync(shimPath);
    const changed = !existed || readFileSync(shimPath, "utf8") !== content;
    if (changed) {
      mkdirSync(binDir, { recursive: true });
      writeFileSync(shimPath, content, "utf8");
      if (platform !== "win32") chmodSync(shimPath, 0o755);
    }
    report.status = !existed ? "installed" : changed ? "refreshed" : "ok";

    const processPathHasBin = (env.PATH ?? "")
      .split(delimiter)
      .map((entry) => normalizeForCompare(entry.trim() || ".", platform))
      .includes(normalizeForCompare(binDir, platform));

    if (processPathHasBin) {
      report.onPath = true;
      return report;
    }

    const ensureUserPath =
      options.ensureUserPath ??
      (platform === "win32"
        ? ensureWindowsUserPath
        : () => ensureUnixUserPath(home, platform));
    report.pathUpdated = ensureUserPath(binDir);
    // Whether we appended just now or a previous run did: the persistent user
    // PATH contains the shim directory, only new terminals see it.
    report.onPath = true;
    report.needsNewTerminal = true;
    return report;
  } catch (error) {
    report.status = "error";
    report.detail = error instanceof Error ? error.message : String(error);
    return report;
  }
}
