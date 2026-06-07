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

/**
 * Get the path to ZAM's internal package SKILL.md.
 */
export function getPackageSkillPath(
  agent: "default" | "claude" | "codex" = "default",
): string {
  // Support source modules plus the dist/index.js and dist/cli/index.js bundles.
  const packageRoot =
    [
      fileURLToPath(new URL("../../..", import.meta.url)),
      fileURLToPath(new URL("../..", import.meta.url)),
      fileURLToPath(new URL("..", import.meta.url)),
    ].find((candidate) => existsSync(join(candidate, "package.json"))) ?? "";

  if (!packageRoot) return "";

  if (agent === "codex") {
    const codexPath = join(packageRoot, ".agents", "skills", "zam", "SKILL.md");
    if (existsSync(codexPath)) return codexPath;
    return "";
  }

  if (agent === "claude") {
    const claudePath = join(
      packageRoot,
      ".claude",
      "skills",
      "zam",
      "SKILL.md",
    );
    if (existsSync(claudePath)) return claudePath;
    return "";
  }

  // Try .agent first
  let path = join(packageRoot, ".agent", "skills", "zam", "SKILL.md");
  if (existsSync(path)) return path;

  // Try .claude
  path = join(packageRoot, ".claude", "skills", "zam", "SKILL.md");
  if (existsSync(path)) return path;

  return "";
}

/**
 * Distribute the ZAM active-recall training skill globally.
 * Copies SKILL.md into global directories for supported coding agents.
 */
export function distributeGlobalSkills(home: string = HOME): Array<{
  name: string;
  path: string;
  success: boolean;
}> {
  const sourceSkill = getPackageSkillPath();
  const claudeSourceSkill = getPackageSkillPath("claude");
  const codexSourceSkill = getPackageSkillPath("codex");
  const results: Array<{ name: string; path: string; success: boolean }> = [];

  if (!sourceSkill) {
    console.warn("Could not find ZAM source SKILL.md in the package folder.");
    return results;
  }

  // 1. Claude Code global directory
  const claudeSkillsDir = join(home, ".claude", "skills", "zam");
  try {
    if (!claudeSourceSkill) {
      throw new Error("Claude skill source not found");
    }
    mkdirSync(claudeSkillsDir, { recursive: true });
    copyFileSync(claudeSourceSkill, join(claudeSkillsDir, "SKILL.md"));
    results.push({
      name: "Claude Code Global",
      path: join(claudeSkillsDir, "SKILL.md"),
      success: true,
    });
  } catch (_err) {
    results.push({
      name: "Claude Code Global",
      path: claudeSkillsDir,
      success: false,
    });
  }

  // 2. Gemini/agy global directory
  const geminiSkillsDir = join(home, ".gemini", "skills", "zam");
  try {
    mkdirSync(geminiSkillsDir, { recursive: true });
    copyFileSync(sourceSkill, join(geminiSkillsDir, "SKILL.md"));
    results.push({
      name: "Gemini CLI Global",
      path: join(geminiSkillsDir, "SKILL.md"),
      success: true,
    });
  } catch (_err) {
    results.push({
      name: "Gemini CLI Global",
      path: geminiSkillsDir,
      success: false,
    });
  }

  // 3. Codex global skills directory
  const codexSkillsDir = join(home, ".agents", "skills", "zam");
  try {
    if (!codexSourceSkill) {
      throw new Error("Codex skill source not found");
    }
    mkdirSync(codexSkillsDir, { recursive: true });
    copyFileSync(codexSourceSkill, join(codexSkillsDir, "SKILL.md"));
    results.push({
      name: "Codex Global",
      path: join(codexSkillsDir, "SKILL.md"),
      success: true,
    });
  } catch (_err) {
    results.push({
      name: "Codex Global",
      path: codexSkillsDir,
      success: false,
    });
  }

  // 4. Goose skills directory
  const gooseSkillsDir = join(home, ".goose", "skills", "zam");
  try {
    mkdirSync(gooseSkillsDir, { recursive: true });
    copyFileSync(sourceSkill, join(gooseSkillsDir, "SKILL.md"));
    results.push({
      name: "Goose Global",
      path: join(gooseSkillsDir, "SKILL.md"),
      success: true,
    });
  } catch (_err) {
    results.push({
      name: "Goose Global",
      path: gooseSkillsDir,
      success: false,
    });
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
