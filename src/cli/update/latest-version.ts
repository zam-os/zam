/**
 * Version-lookup helpers shared by `zam update check` (src/cli/commands/
 * update.ts) and the `update-check` bridge handler (src/cli/bridge-handlers.ts,
 * exposed to the Settings card via zam_studio_bridge). Extracted so both
 * callers resolve "current version" and "latest release" identically instead
 * of drifting (Increment: MCP-Apps card wave, Task 3).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const GITHUB_REPO = "zam-os/zam";

/** Read this build's version from the nearest package.json. */
export function currentVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  for (const up of ["..", "../..", "../../.."]) {
    try {
      const pkg = JSON.parse(
        readFileSync(join(here, up, "package.json"), "utf-8"),
      ) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // try the next candidate
    }
  }
  return "0.0.0";
}

export async function fetchLatestVersion(repo: string): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "zam-cli",
      },
    },
  );
  if (!res.ok) {
    throw new Error(
      `Could not reach the release server (HTTP ${res.status}). ` +
        "Pass --latest <version> to check offline.",
    );
  }
  const data = (await res.json()) as { tag_name?: string };
  if (!data.tag_name) throw new Error("No published release found yet.");
  return data.tag_name;
}
