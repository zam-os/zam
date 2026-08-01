/**
 * Locating the Bitwarden CLI on Windows (ADR 2026-07-30b).
 *
 * On POSIX `execFile("bw", …)` is enough. On Windows it is not, for two
 * separate reasons:
 *
 * 1. `execFile` goes through CreateProcess, which does **not** apply PATHEXT,
 *    so a `bw.cmd` sitting on PATH is never found and the vault reports
 *    "not installed". The npm package `@bitwarden/cli` installs exactly such
 *    a shim; only the standalone `bw.exe` works without help.
 * 2. Since the CVE-2024-27980 fix, Node refuses to spawn a `.cmd` or `.bat`
 *    at all unless `shell: true`.
 *
 * Turning on a shell would solve both and is the wrong answer: ADR 2026-07-30b
 * Decision 11 moved the master password out of argv precisely because argv is
 * readable by other processes, and a password-bearing command line routed
 * through cmd.exe would hand it back — with quoting hazards on top.
 *
 * So: prefer a real executable (`bw.exe`), and when only an npm shim exists,
 * read the script path out of it and run it with this process's own Node.
 * Both paths spawn a real binary directly, with arguments passed as an array.
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { delimiter, isAbsolute, join, resolve } from "node:path";

/** What to spawn, and any arguments that must come before the caller's. */
export interface BwCommand {
  file: string;
  prefixArgs: string[];
}

const POSIX_COMMAND: BwCommand = { file: "bw", prefixArgs: [] };

/** Extensions worth trying on Windows, most directly spawnable first. */
const WINDOWS_CANDIDATES = [".exe", ".com", ".cmd", ".bat", ""];

let cached: BwCommand | undefined;

/** Drop the memoized lookup — for tests, and after an install is detected. */
export function resetBwExecutableCache(): void {
  cached = undefined;
}

function pathEntries(env: NodeJS.ProcessEnv): string[] {
  // process.env is case-insensitive on Windows, so PATH covers Path/PATH.
  return (env.PATH ?? "")
    .split(delimiter)
    .map((entry) => entry.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

function isFile(candidate: string): boolean {
  try {
    return statSync(candidate).isFile();
  } catch {
    return false;
  }
}

/**
 * Pull the JavaScript entry point out of an npm-generated `.cmd` shim.
 *
 * Shims end with a line like:
 *   … "%_prog%"  "%dp0%\node_modules\@bitwarden\cli\build\bw.js" %*
 * The exact preamble differs between npm versions, so this looks for any
 * quoted `.js` path rather than matching a whole template, and resolves it
 * against the shim's own directory the way `%dp0%` would.
 */
export function scriptFromWindowsShim(
  shimContents: string,
  shimDir: string,
): string | null {
  const matches = shimContents.matchAll(/"([^"]*?\.js)"/gi);
  for (const match of matches) {
    const raw = match[1]
      .replace(/%~?dp0%?[\\/]?/gi, "")
      // Backslashes are separators on Windows but ordinary characters
      // elsewhere; normalizing lets this be tested off Windows, and
      // path.resolve accepts forward slashes on Windows too.
      .replace(/\\/g, "/")
      .trim();
    if (!raw) continue;
    const candidate = isAbsolute(raw) ? raw : resolve(shimDir, raw);
    if (isFile(candidate)) return candidate;
  }
  return null;
}

/**
 * Resolve how to invoke the Bitwarden CLI.
 *
 * Returns the POSIX default when nothing better is found, so behaviour is
 * never worse than before — a missing CLI still surfaces as ENOENT and is
 * reported as "not installed".
 */
export function resolveBwCommand(
  options: {
    platform?: NodeJS.Platform;
    env?: NodeJS.ProcessEnv;
    /** Skip the memo; the cache is per-process and installs are rare. */
    useCache?: boolean;
  } = {},
): BwCommand {
  const platform = options.platform ?? process.platform;
  const env = options.env ?? process.env;
  const useCache = options.useCache ?? true;

  if (platform !== "win32") return POSIX_COMMAND;
  if (useCache && cached) return cached;

  for (const dir of pathEntries(env)) {
    for (const ext of WINDOWS_CANDIDATES) {
      const candidate = join(dir, `bw${ext}`);
      if (!existsSync(candidate) || !isFile(candidate)) continue;

      if (ext === ".cmd" || ext === ".bat") {
        // Node will not spawn these without a shell; run the script they
        // wrap with our own Node instead.
        let script: string | null = null;
        try {
          script = scriptFromWindowsShim(readFileSync(candidate, "utf8"), dir);
        } catch {
          script = null;
        }
        if (!script) continue;
        const resolved = { file: process.execPath, prefixArgs: [script] };
        if (useCache) cached = resolved;
        return resolved;
      }

      const resolved = { file: candidate, prefixArgs: [] };
      if (useCache) cached = resolved;
      return resolved;
    }
  }

  // Nothing found: fall through to the plain name and let the spawn fail the
  // way it always has, so the caller's "not installed" message still applies.
  return POSIX_COMMAND;
}
