/**
 * Machine-local "currently focused OKF article" state.
 *
 * The OKF panel records which article its reader is showing; any agent —
 * Claude Code, Copilot, Codex, whatever else speaks to `zam mcp` — can then
 * resolve "import the currently focused okf article" without the panel
 * needing a conversation surface of its own. Mirrors the ui-intent pattern
 * (src/cli/ui-intent.ts): a last-write-wins snapshot file under `~/.zam`,
 * written atomically via rename; a newer focus supersedes an older one.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface OkfFocus {
  version: 1;
  /** Article file name inside the bundle (flat kebab-case `.md`). */
  file: string;
  /** Absolute bundle directory the panel was browsing, when known. */
  bundleDir?: string;
  updatedAt: string;
}

export function getOkfFocusPath(home: string = homedir()): string {
  return join(home, ".zam", "okf-focus.json");
}

function resolvePath(explicit?: string): string {
  return explicit ?? process.env.ZAM_OKF_FOCUS_PATH ?? getOkfFocusPath();
}

export async function writeOkfFocus(
  file: string,
  bundleDir?: string,
  opts: { path?: string; now?: () => Date } = {},
): Promise<OkfFocus> {
  if (file.includes("/") || file.includes("\\") || !file.endsWith(".md")) {
    throw new Error(`invalid article file name: ${file}`);
  }
  const path = resolvePath(opts.path);
  const focus: OkfFocus = {
    version: 1,
    file,
    ...(bundleDir ? { bundleDir } : {}),
    updatedAt: (opts.now?.() ?? new Date()).toISOString(),
  };
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  await writeFile(tmp, `${JSON.stringify(focus, null, 2)}\n`, "utf8");
  await rename(tmp, path);
  return focus;
}

/** The last recorded focus, or null when absent or unreadable. */
export async function readOkfFocus(
  opts: { path?: string } = {},
): Promise<OkfFocus | null> {
  try {
    const raw = await readFile(resolvePath(opts.path), "utf8");
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
  } catch {
    return null;
  }
}
