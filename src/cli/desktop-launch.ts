/**
 * Finding and starting the ZAM Desktop app (the Studio).
 *
 * Shared by `zam ui` and the material-import MCP tool, which brings the
 * Studio forward so the learner can decide the proposals an agent just
 * submitted (ADR 2026-10-05 Decision 2). A second launch of a running app
 * only focuses its window: the desktop shell enforces a single instance.
 *
 * Silent by design: the MCP server speaks JSON-RPC on stdout, so nothing here
 * may print.
 */

import { spawn as nodeSpawn, type SpawnOptions } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type Spawn = (
  command: string,
  args: string[],
  options: SpawnOptions,
) => { unref(): void; on?(event: "error", listener: () => void): unknown };

/** Walk up from cwd and from this module to find the repo's `desktop/` dir. */
export function findDesktopDir(): string | null {
  const starts = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  for (const start of starts) {
    let dir = start;
    for (let i = 0; i < 10; i++) {
      if (existsSync(join(dir, "desktop", "src-tauri", "tauri.conf.json"))) {
        return join(dir, "desktop");
      }
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return null;
}

/** Locate a previously built native binary, if any. */
export function findBuiltApp(desktopDir: string): string | null {
  const releaseDir = join(desktopDir, "src-tauri", "target", "release");
  if (process.platform === "win32") {
    for (const name of ["ZAM.exe", "zam.exe", "zam-desktop.exe"]) {
      const p = join(releaseDir, name);
      if (existsSync(p)) return p;
    }
  } else if (process.platform === "darwin") {
    const app = join(releaseDir, "bundle", "macos", "ZAM.app");
    if (existsSync(app)) return app;
  } else {
    for (const name of ["zam", "ZAM", "zam-desktop"]) {
      const p = join(releaseDir, name);
      if (existsSync(p)) return p;
    }
  }
  return null;
}

/** Locate an app installed by a released ZAM desktop installer. */
export function findInstalledApp(): string | null {
  const candidates =
    process.platform === "win32"
      ? [
          process.env.LOCALAPPDATA &&
            join(process.env.LOCALAPPDATA, "Programs", "ZAM", "ZAM.exe"),
          process.env.ProgramFiles &&
            join(process.env.ProgramFiles, "ZAM", "ZAM.exe"),
          process.env["ProgramFiles(x86)"] &&
            join(process.env["ProgramFiles(x86)"], "ZAM", "ZAM.exe"),
        ]
      : process.platform === "darwin"
        ? ["/Applications/ZAM.app", join(homedir(), "Applications", "ZAM.app")]
        : ["/opt/ZAM/zam", "/usr/bin/zam-desktop"];

  return (
    candidates.find((candidate) => candidate && existsSync(candidate)) || null
  );
}

/** Start the app detached; a running instance just comes to the front. */
export function launchApp(
  appPath: string,
  workingDir: string,
  spawn: Spawn = nodeSpawn,
): void {
  const child =
    process.platform === "darwin" && appPath.endsWith(".app")
      ? spawn("open", [appPath], {
          cwd: workingDir,
          detached: true,
          stdio: "ignore",
        })
      : spawn(appPath, [], {
          cwd: workingDir,
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        });
  // A failed start is reported asynchronously; unhandled, it would take the
  // calling process (the MCP server) down with it.
  child.on?.("error", () => {});
  child.unref();
}

export type StudioLaunchResult =
  | { opened: true; appPath: string }
  | { opened: false; reason: "not-installed" | "launch-failed" };

/**
 * Bring the Studio forward: the installed app first, else a developer build.
 * Never throws — an import that waits in the staging file is still there when
 * the learner opens the Studio by hand.
 */
export function focusOrLaunchStudio(
  deps: {
    spawn?: Spawn;
    findInstalled?: () => string | null;
    findBuilt?: () => string | null;
  } = {},
): StudioLaunchResult {
  const installed = (deps.findInstalled ?? findInstalledApp)();
  const appPath =
    installed ??
    (
      deps.findBuilt ??
      (() => {
        const desktopDir = findDesktopDir();
        return desktopDir ? findBuiltApp(desktopDir) : null;
      })
    )();
  if (!appPath) return { opened: false, reason: "not-installed" };
  try {
    launchApp(appPath, homedir(), deps.spawn);
    return { opened: true, appPath };
  } catch {
    return { opened: false, reason: "launch-failed" };
  }
}
