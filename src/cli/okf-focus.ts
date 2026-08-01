/**
 * Machine-local "currently focused OKF article" state.
 *
 * The OKF panel records which article its reader is showing; any agent —
 * Claude Code, Copilot, Codex, whatever else speaks to `zam mcp` — can then
 * resolve "import the currently focused okf article" without the panel
 * needing a conversation surface of its own.
 *
 * The focus is scoped per Companion window, using the host registry from
 * `src/cli/ui-intent.ts`. A single machine-global snapshot meant two editor
 * windows each browsing the knowledge base overwrote one another, and
 * `zam_okf_focused` then handed the agent the *other* window's article — the
 * same class of bug the UI-intent handoff had. The writer learns its window
 * from `ZAM_COMPANION_HOST_ID`, injected by the extension into the `zam mcp`
 * child it spawns; the reader resolves the window from its own working
 * directory through `selectUiHost`.
 *
 * `~/.zam/okf-focus.json` stays as the unscoped fallback, for surfaces
 * outside an editor window (the desktop app) and for readers older than 0.25.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import {
  getUiHostFocusPath,
  getUiHostsDirPath,
  readUiHosts,
  selectUiHost,
} from "./ui-intent.js";

export interface OkfFocus {
  version: 1;
  /** Article file name inside the bundle (flat kebab-case `.md`). */
  file: string;
  /** Absolute bundle directory the panel was browsing, when known. */
  bundleDir?: string;
  updatedAt: string;
}

export interface OkfFocusOptions {
  /** Explicit file to use, bypassing host scoping entirely. */
  path?: string;
  /** Home directory the `~/.zam` paths hang off; defaults to `homedir()`. */
  home?: string;
  /** Registry directory; defaults to `<home>/.zam/hosts`. */
  hostsDir?: string;
  now?: () => Date;
}

export interface WriteOkfFocusOptions extends OkfFocusOptions {
  /** Window this panel belongs to; defaults to `ZAM_COMPANION_HOST_ID`. */
  hostId?: string;
}

export interface ReadOkfFocusOptions extends OkfFocusOptions {
  /** Working directory used to resolve the window; defaults to `process.cwd()`. */
  cwd?: string;
}

export function getOkfFocusPath(home: string = homedir()): string {
  return join(home, ".zam", "okf-focus.json");
}

/** The unscoped file, honoring the explicit path and env overrides. */
function resolveFallbackPath(explicit?: string, home?: string): string {
  return explicit ?? process.env.ZAM_OKF_FOCUS_PATH ?? getOkfFocusPath(home);
}

function resolveHostId(explicit?: string): string | undefined {
  return explicit ?? process.env.ZAM_COMPANION_HOST_ID ?? undefined;
}

async function writeFocusFile(path: string, focus: OkfFocus): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  // Scope the temp name by pid: two `zam mcp` processes writing at once would
  // otherwise rename the same `<path>.tmp` out from under each other.
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(focus, null, 2)}\n`, "utf8");
  await rename(tmp, path);
}

/**
 * Record the focused article for this window, and in the unscoped file.
 *
 * Both are written: the per-host file is what a current reader resolves, and
 * the unscoped one keeps a non-window surface (or an older reader) working.
 * With an explicit `path` — the test and `ZAM_OKF_FOCUS_PATH` route — only
 * that file is touched.
 */
export async function writeOkfFocus(
  file: string,
  bundleDir?: string,
  opts: WriteOkfFocusOptions = {},
): Promise<OkfFocus> {
  if (file.includes("/") || file.includes("\\") || !file.endsWith(".md")) {
    throw new Error(`invalid article file name: ${file}`);
  }
  const focus: OkfFocus = {
    version: 1,
    file,
    ...(bundleDir ? { bundleDir } : {}),
    updatedAt: (opts.now?.() ?? new Date()).toISOString(),
  };

  const explicitPath = opts.path ?? process.env.ZAM_OKF_FOCUS_PATH;
  if (explicitPath) {
    await writeFocusFile(explicitPath, focus);
    return focus;
  }

  const hostId = resolveHostId(opts.hostId);
  if (hostId) {
    await writeFocusFile(getUiHostFocusPath(hostId, opts.home), focus);
  }
  await writeFocusFile(getOkfFocusPath(opts.home), focus);
  return focus;
}

function parseFocus(raw: string): OkfFocus | null {
  const parsed = JSON.parse(raw) as Partial<OkfFocus>;
  if (
    parsed.version !== 1 ||
    typeof parsed.file !== "string" ||
    typeof parsed.updatedAt !== "string"
  ) {
    return null;
  }
  return {
    version: 1,
    file: parsed.file,
    ...(typeof parsed.bundleDir === "string"
      ? { bundleDir: parsed.bundleDir }
      : {}),
    updatedAt: parsed.updatedAt,
  };
}

async function readFocusFile(path: string): Promise<OkfFocus | null> {
  try {
    return parseFocus(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * The focused article of the window this process belongs to, or null.
 *
 * Resolution order: an explicit path, then the window whose workspace holds
 * this process's working directory, then the unscoped file. The per-host file
 * wins over the unscoped one even when the latter is newer — the agent asking
 * is working inside one window, and that window's reader is the one it means.
 */
export async function readOkfFocus(
  opts: ReadOkfFocusOptions = {},
): Promise<OkfFocus | null> {
  const explicitPath = opts.path ?? process.env.ZAM_OKF_FOCUS_PATH;
  if (explicitPath) return readFocusFile(explicitPath);

  const hostsDir = opts.hostsDir ?? getUiHostsDirPath(opts.home);
  const host = selectUiHost(await readUiHosts(hostsDir), {
    now: (opts.now?.() ?? new Date()).getTime(),
    cwd: opts.cwd ?? process.cwd(),
  });
  if (host) {
    const scoped = await readFocusFile(
      getUiHostFocusPath(host.hostId, opts.home),
    );
    if (scoped) return scoped;
  }
  return readFocusFile(resolveFallbackPath(undefined, opts.home));
}
