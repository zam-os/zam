/**
 * Cross-platform helpers for spawning an interactive shell in a new window.
 * Used by `zam monitor open` and `zam learn open`.
 */

import { execFileSync, execSync } from "node:child_process";
import { unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

export type TerminalShell = "zsh" | "bash" | "pwsh" | "powershell";

export function isPowerShellShell(shell: TerminalShell): boolean {
  return shell === "pwsh" || shell === "powershell";
}

export function psSingleQuoted(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

export function detectShell(): TerminalShell {
  if (process.platform === "win32")
    return findExecutable("pwsh.exe") ? "pwsh" : "powershell";
  const shell = process.env.SHELL ?? "";
  return basename(shell) === "bash" ? "bash" : "zsh";
}

export function normalizeShell(shell: string | undefined): TerminalShell {
  if (!shell) return detectShell();
  const normalized = shell.toLowerCase();
  if (
    normalized === "zsh" ||
    normalized === "bash" ||
    normalized === "pwsh" ||
    normalized === "powershell"
  ) {
    return normalized;
  }
  throw new Error(
    `Unsupported shell: ${shell}. Expected zsh, bash, pwsh, or powershell.`,
  );
}

/**
 * Pick the path PowerShell/cmd can actually run from `where.exe` output.
 */
export function selectWindowsExecutable(
  results: string[],
  pathext: string = process.env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD",
): string | null {
  if (results.length === 0) return null;
  const extensions = pathext
    .split(";")
    .map((ext) => ext.trim().toLowerCase())
    .filter(Boolean);
  const runnable = results.find((result) =>
    extensions.some((ext) => result.toLowerCase().endsWith(ext)),
  );
  return runnable ?? results[0];
}

export function findExecutable(command: string): string | null {
  try {
    const lookup =
      process.platform === "win32"
        ? `where.exe ${command}`
        : `command -v ${command}`;
    const results = execSync(lookup, { encoding: "utf-8" })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (results.length === 0) return null;

    if (process.platform === "win32") {
      return selectWindowsExecutable(results);
    }

    return results[0];
  } catch {
    return null;
  }
}

export function resolveZamInvocation(shell: TerminalShell): string {
  const installed = findExecutable("zam");
  if (installed) {
    return isPowerShellShell(shell)
      ? `& ${psSingleQuoted(installed)}`
      : installed;
  }

  const projectRoot = join(import.meta.dirname, "..", "..");
  const cliSource = join(projectRoot, "src/cli/index.ts");
  if (isPowerShellShell(shell)) {
    return `& npx --prefix ${psSingleQuoted(projectRoot)} tsx ${psSingleQuoted(cliSource)}`;
  }
  return `npx --prefix ${JSON.stringify(projectRoot)} tsx ${JSON.stringify(cliSource)}`;
}

export function buildShellSetupCommand(
  dir: string,
  shell: TerminalShell,
  command: string,
): string {
  if (isPowerShellShell(shell)) {
    return [`Set-Location -LiteralPath ${psSingleQuoted(dir)}`, command].join(
      "; ",
    );
  }

  return `cd ${JSON.stringify(dir)} && ${command}`;
}

function isItermRunning(): boolean {
  try {
    const result = execSync(
      'osascript -e \'tell application "System Events" to (name of processes) contains "iTerm2"\' 2>/dev/null',
      { encoding: "utf-8" },
    ).trim();
    return result === "true";
  } catch {
    return false;
  }
}

function openMacTerminal(shellSetup: string, label: string, dir: string): void {
  const useIterm = isItermRunning();
  const escaped = shellSetup.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const appleScript = useIterm
    ? `tell application "iTerm2"
  activate
  set newWindow to (create window with default profile)
  tell current session of newWindow
    write text "${escaped}"
  end tell
end tell`
    : `tell application "Terminal"
  activate
  do script "${escaped}"
end tell`;

  const tmpFile = join(tmpdir(), `zam-terminal-${label}.scpt`);
  try {
    writeFileSync(tmpFile, appleScript);
    execSync(`osascript ${JSON.stringify(tmpFile)}`, { stdio: "ignore" });
    console.log(
      `Opened ${useIterm ? "iTerm2" : "Terminal.app"} window (${label})`,
    );
    console.log(`  Directory: ${dir}`);
  } catch (err) {
    console.error(`Failed to open terminal: ${(err as Error).message}`);
    console.log(`\nRun this manually in a new terminal:\n`);
    console.log(`  ${shellSetup}`);
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

function openWindowsPowerShell(
  shellSetup: string,
  label: string,
  dir: string,
  requestedShell: TerminalShell,
): void {
  const requestedExecutable =
    requestedShell === "powershell" ? "powershell.exe" : "pwsh.exe";
  const executable = findExecutable(requestedExecutable)
    ? requestedExecutable
    : "powershell.exe";
  const startCommand = [
    "Start-Process",
    `-FilePath ${psSingleQuoted(executable)}`,
    `-ArgumentList @('-NoExit','-NoProfile','-Command',${psSingleQuoted(shellSetup)})`,
  ].join(" ");

  const launcher = findExecutable("pwsh.exe") ? "pwsh.exe" : "powershell.exe";

  try {
    execFileSync(
      launcher,
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", startCommand],
      {
        stdio: "ignore",
      },
    );
    console.log(
      `Opened ${executable === "pwsh.exe" ? "PowerShell" : "Windows PowerShell"} window (${label})`,
    );
    console.log(`  Directory: ${dir}`);
  } catch (err) {
    console.error(`Failed to open PowerShell: ${(err as Error).message}`);
    console.log(`\nRun this manually in a new PowerShell terminal:\n`);
    console.log(`  ${shellSetup}`);
  }
}

export function openTerminalWindow(opts: {
  shellSetup: string;
  label: string;
  dir: string;
  shell: TerminalShell;
}): void {
  const { shellSetup, label, dir, shell } = opts;

  if (process.platform === "darwin" && !isPowerShellShell(shell)) {
    openMacTerminal(shellSetup, label, dir);
    return;
  }

  if (process.platform === "win32" && isPowerShellShell(shell)) {
    openWindowsPowerShell(shellSetup, label, dir, shell);
    return;
  }

  console.log(`Run this in a new terminal:\n`);
  console.log(`  ${shellSetup}\n`);
  console.log(
    `(Automatic terminal opening is only supported on macOS Terminal/iTerm2 and Windows PowerShell for now.)`,
  );
}
