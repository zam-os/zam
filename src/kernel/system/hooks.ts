import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
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

/**
 * Inject the ZAM shell observation hook into user profile scripts so monitoring
 * is automatically initialized on startup.
 */
export function injectShellHooks(): Array<{
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
  const hookLine = `\n# ZAM Shell Observation Hooks\nif (command -v zam >/dev/null 2>&1); then eval "$(zam monitor start --quiet)"; fi\n`;
  const pwshHookLine = `\n# ZAM Shell Observation Hooks\nif (Get-Command zam -ErrorAction SilentlyContinue) { Invoke-Expression (& zam monitor start --quiet pwsh) }\n`;

  // 1. Zsh profile (~/.zshrc)
  const zshrc = join(HOME, ".zshrc");
  if (existsSync(zshrc)) {
    try {
      const content = readFileSync(zshrc, "utf8");
      if (content.includes("zam monitor start")) {
        results.push({
          shell: "zsh",
          file: zshrc,
          success: true,
          alreadyHooked: true,
        });
      } else {
        appendFileSync(zshrc, hookLine);
        results.push({
          shell: "zsh",
          file: zshrc,
          success: true,
          alreadyHooked: false,
        });
      }
    } catch {
      results.push({
        shell: "zsh",
        file: zshrc,
        success: false,
        alreadyHooked: false,
      });
    }
  }

  // 2. Bash profile (~/.bashrc)
  const bashrc = join(HOME, ".bashrc");
  if (existsSync(bashrc)) {
    try {
      const content = readFileSync(bashrc, "utf8");
      if (content.includes("zam monitor start")) {
        results.push({
          shell: "bash",
          file: bashrc,
          success: true,
          alreadyHooked: true,
        });
      } else {
        appendFileSync(bashrc, hookLine);
        results.push({
          shell: "bash",
          file: bashrc,
          success: true,
          alreadyHooked: false,
        });
      }
    } catch {
      results.push({
        shell: "bash",
        file: bashrc,
        success: false,
        alreadyHooked: false,
      });
    }
  }

  // 3. PowerShell Profile ($HOME\Documents\PowerShell\Microsoft.PowerShell_profile.ps1)
  // Check both PowerShell and WindowsPowerShell
  const pwshDirs = [
    join(HOME, "Documents", "PowerShell"),
    join(HOME, "Documents", "WindowsPowerShell"),
  ];

  for (const dir of pwshDirs) {
    const profileFile = join(dir, "Microsoft.PowerShell_profile.ps1");
    try {
      mkdirSync(dir, { recursive: true });
      let content = "";
      if (existsSync(profileFile)) {
        content = readFileSync(profileFile, "utf8");
      }

      if (content.includes("zam monitor start")) {
        results.push({
          shell: "powershell",
          file: profileFile,
          success: true,
          alreadyHooked: true,
        });
      } else {
        appendFileSync(profileFile, pwshHookLine);
        results.push({
          shell: "powershell",
          file: profileFile,
          success: true,
          alreadyHooked: false,
        });
      }
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
