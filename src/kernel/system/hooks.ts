import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const HOME = homedir();

/** The skills ZAM ships: the main skill and the guided-work skill (ADR 2026-11-15). */
export type PackageSkillName = "zam" | "zam-work";

/**
 * Get the path to one of ZAM's packaged SKILL.md files.
 */
export function getPackageSkillPath(
  agent: "default" | "claude" | "codex" = "default",
  skill: PackageSkillName = "zam",
): string {
  // Support source modules plus the dist/index.js and dist/cli/index.js bundles.
  const packageRoot =
    [
      fileURLToPath(new URL("../../..", import.meta.url)),
      fileURLToPath(new URL("../..", import.meta.url)),
      fileURLToPath(new URL("..", import.meta.url)),
    ].find((candidate) => existsSync(join(candidate, "package.json"))) ?? "";

  if (!packageRoot) return "";

  const candidates =
    agent === "codex"
      ? [".agents"]
      : agent === "claude"
        ? [".claude"]
        : [".agent", ".claude"];
  for (const root of candidates) {
    const path = join(packageRoot, root, "skills", skill, "SKILL.md");
    if (existsSync(path)) return path;
  }
  return "";
}

/** One global skill folder per harness, and which packaged copy it takes. */
const GLOBAL_SKILL_TARGETS: Array<{
  name: string;
  dir: string[];
  source: "default" | "claude" | "codex";
}> = [
  { name: "Claude Code Global", dir: [".claude", "skills"], source: "claude" },
  { name: "Gemini CLI Global", dir: [".gemini", "skills"], source: "default" },
  { name: "Codex Global", dir: [".agents", "skills"], source: "codex" },
  { name: "Goose Global", dir: [".goose", "skills"], source: "default" },
];

/**
 * Distribute ZAM's skills globally: the main skill and the guided-work
 * skill, copied into the global skill folder of each supported harness.
 * Entries for the main skill keep their harness name; the guided-work
 * skill's entries carry "(zam-work)".
 */
export function distributeGlobalSkills(home: string = HOME): Array<{
  name: string;
  path: string;
  success: boolean;
}> {
  const results: Array<{ name: string; path: string; success: boolean }> = [];

  if (!getPackageSkillPath()) {
    console.warn("Could not find ZAM source SKILL.md in the package folder.");
    return results;
  }

  for (const skill of ["zam", "zam-work"] as const) {
    for (const target of GLOBAL_SKILL_TARGETS) {
      const name = skill === "zam" ? target.name : `${target.name} (${skill})`;
      const skillDir = join(home, ...target.dir, skill);
      try {
        const source = getPackageSkillPath(target.source, skill);
        if (!source) {
          throw new Error(`${skill} skill source not found`);
        }
        mkdirSync(skillDir, { recursive: true });
        copyFileSync(source, join(skillDir, "SKILL.md"));
        results.push({ name, path: join(skillDir, "SKILL.md"), success: true });
      } catch (_err) {
        results.push({ name, path: skillDir, success: false });
      }
    }
  }

  return results;
}

const POSIX_OLD_HOOK = `
# ZAM Shell Observation Hooks
if (command -v zam >/dev/null 2>&1); then eval "$(zam monitor start --quiet)"; fi
`;
const POWERSHELL_OLD_HOOK = `
# ZAM Shell Observation Hooks
if (Get-Command zam -ErrorAction SilentlyContinue) { Invoke-Expression (& zam monitor start --quiet pwsh) }
`;
const HOOK_MARKER = "# ZAM Monitor Session Helper";

function posixHook(shell: "bash" | "zsh"): string {
  return `
${HOOK_MARKER}
zam-monitor-session() {
  local session_id="\${1:-}"
  if [ -z "$session_id" ]; then
    printf 'Usage: zam-monitor-session <session-id>\n' >&2
    return 2
  fi
  eval "$(command zam monitor start --session "$session_id" --shell ${shell})"
}
`;
}

const POWERSHELL_HOOK = `
${HOOK_MARKER}
function Start-ZamMonitor {
  param([Parameter(Mandatory = $true)][string]$Session)
  Invoke-Expression (& zam monitor start --session $Session --shell pwsh)
}
`;

function installHook(
  file: string,
  hook: string,
  oldHook: string,
): { success: boolean; alreadyHooked: boolean } {
  try {
    const content = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (content.includes(HOOK_MARKER)) {
      return { success: true, alreadyHooked: true };
    }

    if (content.includes(oldHook.trim())) {
      writeFileSync(file, content.replace(oldHook.trim(), hook.trim()), "utf8");
    } else {
      appendFileSync(file, hook);
    }
    return { success: true, alreadyHooked: false };
  } catch {
    return { success: false, alreadyHooked: false };
  }
}

/**
 * Add opt-in helpers for starting a monitored session to user shell profiles.
 */
export function injectShellHooks(home: string = HOME): Array<{
  shell: string;
  file: string;
  success: boolean;
  alreadyHooked: boolean;
}> {
  const results: Array<{
    shell: string;
    file: string;
    success: boolean;
    alreadyHooked: boolean;
  }> = [];

  // 1. Zsh profile (~/.zshrc)
  const zshrc = join(home, ".zshrc");
  if (existsSync(zshrc)) {
    const status = installHook(zshrc, posixHook("zsh"), POSIX_OLD_HOOK);
    results.push({ shell: "zsh", file: zshrc, ...status });
  }

  // 2. Bash profile (~/.bashrc)
  const bashrc = join(home, ".bashrc");
  if (existsSync(bashrc)) {
    const status = installHook(bashrc, posixHook("bash"), POSIX_OLD_HOOK);
    results.push({ shell: "bash", file: bashrc, ...status });
  }

  // 3. PowerShell Profile ($HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1)
  // Check both PowerShell and WindowsPowerShell
  const pwshDirs = [
    join(home, "Documents", "PowerShell"),
    join(home, "Documents", "WindowsPowerShell"),
  ];

  for (const dir of pwshDirs) {
    const profileFile = join(dir, "Microsoft.PowerShell_profile.ps1");
    try {
      mkdirSync(dir, { recursive: true });
      const status = installHook(
        profileFile,
        POWERSHELL_HOOK,
        POWERSHELL_OLD_HOOK,
      );
      results.push({
        shell: "powershell",
        file: profileFile,
        ...status,
      });
    } catch {
      results.push({
        shell: "powershell",
        file: profileFile,
        success: false,
        alreadyHooked: false,
      });
    }
  }

  return results;
}
