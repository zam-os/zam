/**
 * `zam ui` — one-word launcher for the ZAM Desktop GUI (Tauri Studio).
 *
 * The desktop app is a Tauri shell that re-uses the compiled CLI bridge
 * (dist/cli/index.js), so it needs:
 *   - a built CLI (npm run build at the repo root), and
 *   - either a previously built native binary, or the Rust toolchain to
 *     compile one.
 *
 * Usage:
 *   zam ui              launch the GUI (built binary if present, else guide)
 *   zam ui --dev        run in hot-reload dev mode (needs Rust)
 *   zam ui --build      build the native installer (needs Rust, one-time)
 *   zam ui --shortcut   create Desktop + Start-menu shortcuts to the GUI
 */

import { type SpawnSyncOptions, spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { hasCommand } from "../../kernel/index.js";

const C = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

/** Walk up from cwd and from this module to find the repo's `desktop/` dir. */
function findDesktopDir(): string | null {
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
function findBuiltApp(desktopDir: string): string | null {
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
function findInstalledApp(): string | null {
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

/** npm is npm.cmd on Windows, so child processes need a shell there. */
function runNpm(args: string[], opts: SpawnSyncOptions): number {
  const res = spawnSync("npm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts,
  });
  return res.status ?? 1;
}

function ensureDesktopDeps(desktopDir: string): boolean {
  if (existsSync(join(desktopDir, "node_modules"))) return true;
  console.log(
    `${C.cyan}Installing desktop dependencies (one-time)...${C.reset}`,
  );
  return runNpm(["install"], { cwd: desktopDir }) === 0;
}

function prepareDesktopBridge(repoRoot: string): boolean {
  console.log(`${C.cyan}Preparing self-contained desktop bridge...${C.reset}`);
  return (
    runNpm(["run", "desktop:prepare", "--", "--bundle-node"], {
      cwd: repoRoot,
    }) === 0
  );
}

function requireRust(): boolean {
  if (hasCommand("cargo")) return true;
  console.error(
    `${C.red}✗ The desktop GUI needs the Rust toolchain to compile.${C.reset}`,
  );
  console.error("  Install it once, then re-run this command:");
  console.error(
    `    ${C.cyan}winget install Rustlang.Rustup${C.reset}   (or https://rustup.rs)`,
  );
  return false;
}

/**
 * On Windows the default MSVC Rust target needs the Visual Studio C++ linker
 * (link.exe), which rustup does NOT install. Detect it via vswhere so we fail
 * with guidance up front instead of after minutes of compiling.
 */
function hasMsvcBuildTools(): boolean {
  if (process.platform !== "win32") return true;
  const pf86 = process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)";
  const vswhere = join(
    pf86,
    "Microsoft Visual Studio",
    "Installer",
    "vswhere.exe",
  );
  if (!existsSync(vswhere)) return false;
  const res = spawnSync(
    vswhere,
    [
      "-latest",
      "-products",
      "*",
      "-requires",
      "Microsoft.VisualStudio.Component.VC.Tools.x86.x64",
      "-property",
      "installationPath",
    ],
    { encoding: "utf8" },
  );
  return (res.stdout ?? "").trim().length > 0;
}

function requireMsvcOnWindows(): boolean {
  if (hasMsvcBuildTools()) return true;
  console.error(
    `${C.red}✗ The MSVC C++ linker (link.exe) is missing.${C.reset}`,
  );
  console.error(
    "  Rust on Windows needs the Visual Studio Build Tools with the C++ workload",
  );
  console.error("  (rustup does not include it). Install it once (~a few GB),");
  console.error("  then open a NEW terminal and retry:");
  console.error(
    `    ${C.cyan}winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"${C.reset}`,
  );
  return false;
}

function warnIfCliMissing(repoRoot: string): void {
  if (!existsSync(join(repoRoot, "dist", "cli", "index.js"))) {
    console.warn(
      `${C.yellow}⚠ CLI build not found (dist/cli/index.js). The GUI bridge needs it — run 'npm run build' at the repo root.${C.reset}`,
    );
  }
}

function launchApp(appPath: string, workingDir: string): void {
  console.log(`${C.green}✓ Launching ZAM Desktop...${C.reset}`);
  if (process.platform === "darwin" && appPath.endsWith(".app")) {
    spawn("open", [appPath], {
      cwd: workingDir,
      detached: true,
      stdio: "ignore",
    }).unref();
  } else {
    spawn(appPath, [], {
      cwd: workingDir,
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).unref();
  }
}

function createShortcuts(appPath: string, repoRoot: string): void {
  if (process.platform !== "win32") {
    console.error(
      `${C.red}✗ --shortcut is currently implemented for Windows only.${C.reset}`,
    );
    console.error(
      "  On macOS drag ZAM.app to the Dock; on Linux create a .desktop entry.",
    );
    return;
  }
  // WScript.Shell creates a .lnk on the Desktop and in the Start menu.
  const ps = [
    "$ws = New-Object -ComObject WScript.Shell",
    "foreach ($dir in @([Environment]::GetFolderPath('Desktop'), [Environment]::GetFolderPath('Programs'))) {",
    "  $lnk = $ws.CreateShortcut((Join-Path $dir 'ZAM.lnk'))",
    `  $lnk.TargetPath = '${appPath}'`,
    `  $lnk.WorkingDirectory = '${repoRoot}'`,
    `  $lnk.IconLocation = '${appPath},0'`,
    "  $lnk.Description = 'ZAM Active-Recall Studio'",
    "  $lnk.Save()",
    "}",
  ].join("\n");
  const res = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps],
    { stdio: "inherit" },
  );
  if (res.status === 0) {
    console.log(
      `${C.green}✓ Created 'ZAM' shortcuts on your Desktop and in the Start menu.${C.reset}`,
    );
  } else {
    console.error(`${C.red}✗ Could not create shortcuts.${C.reset}`);
  }
}

export const uiCommand = new Command("ui")
  .description("Launch the ZAM Desktop GUI (Active-Recall Studio)")
  .option("--dev", "Run in hot-reload development mode (needs Rust)")
  .option(
    "--build",
    "Build the native installer for your OS (needs Rust, one-time)",
  )
  .option("--shortcut", "Create Desktop + Start-menu shortcuts to the GUI")
  .action((opts) => {
    const installedApp = findInstalledApp();
    if (!opts.dev && !opts.build && !opts.shortcut && installedApp) {
      launchApp(installedApp, homedir());
      return;
    }

    const desktopDir = findDesktopDir();
    if (!desktopDir) {
      console.error(
        `${C.red}✗ Could not find the desktop/ app. Run 'zam ui' from inside the ZAM repository.${C.reset}`,
      );
      process.exit(1);
    }
    const repoRoot = dirname(desktopDir);

    // --build: compile the native installer.
    if (opts.build) {
      if (!requireRust()) process.exit(1);
      if (!requireMsvcOnWindows()) process.exit(1);
      if (!ensureDesktopDeps(desktopDir)) process.exit(1);
      if (!prepareDesktopBridge(repoRoot)) process.exit(1);
      console.log(
        `${C.cyan}Building the native ZAM installer (this takes a few minutes)...${C.reset}`,
      );
      const code = runNpm(["run", "tauri", "build"], { cwd: desktopDir });
      if (code === 0) {
        const bundle = join(
          desktopDir,
          "src-tauri",
          "target",
          "release",
          "bundle",
        );
        console.log(
          `\n${C.green}✓ Done. Installer is in:${C.reset}\n  ${bundle}`,
        );
        console.log(
          `${C.dim}Run that installer once — it adds ZAM to the Start menu and Desktop automatically.${C.reset}`,
        );
        console.log(
          `${C.dim}The installer includes the CLI bridge and Node runtime.${C.reset}`,
        );
      }
      process.exit(code);
    }

    // --dev: hot-reload development mode.
    if (opts.dev) {
      if (!requireRust()) process.exit(1);
      if (!requireMsvcOnWindows()) process.exit(1);
      if (!ensureDesktopDeps(desktopDir)) process.exit(1);
      warnIfCliMissing(repoRoot);
      console.log(
        `${C.cyan}Starting ZAM Desktop in dev mode (Ctrl+C to stop)...${C.reset}`,
      );
      process.exit(runNpm(["run", "tauri", "dev"], { cwd: desktopDir }));
    }

    const builtApp = findBuiltApp(desktopDir);

    // --shortcut: needs a built binary to point at.
    if (opts.shortcut) {
      const shortcutTarget = installedApp || builtApp;
      if (!shortcutTarget) {
        console.error(
          `${C.red}✗ No built app yet. Build it first:${C.reset} ${C.cyan}zam ui --build${C.reset}`,
        );
        process.exit(1);
      }
      createShortcuts(shortcutTarget, dirname(shortcutTarget));
      return;
    }

    // Default: launch the built app, or guide the user to get one.
    if (builtApp) {
      launchApp(builtApp, repoRoot);
      return;
    }

    console.log(
      `${C.yellow}The ZAM Desktop GUI hasn't been built yet.${C.reset}\n`,
    );
    if (hasCommand("cargo")) {
      console.log("Pick one:");
      console.log(
        `  ${C.cyan}zam ui --build${C.reset}    Build a native installer (Start-menu + Desktop entry)`,
      );
      console.log(
        `  ${C.cyan}zam ui --dev${C.reset}      Just run it now in dev mode`,
      );
    } else {
      console.log("To get a clickable Start-menu app, do this once:");
      console.log(
        `  1. Install Rust:   ${C.cyan}winget install Rustlang.Rustup${C.reset}`,
      );
      console.log(`  2. Build the app:  ${C.cyan}zam ui --build${C.reset}`);
      console.log(
        `  3. Run the installer it prints — ZAM then lives in your Start menu.`,
      );
      console.log(
        `\n${C.dim}After that, 'zam ui' launches it directly.${C.reset}`,
      );
    }
  });
