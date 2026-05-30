/**
 * `zam init` — Guided interactive onboarding wizard.
 *
 * Bootstraps a fresh ZAM installation:
 * 1. Initializes a zero-dependency "Local Sandbox" workspace.
 * 2. Runs hardware profiling to detect NPUs/CPUs.
 * 3. Installs and configures the hardware-optimized local LLM runtime (flm or Ollama).
 * 4. Automatically distributes global agent skill files and hooks.
 * 5. Sets up the local database and configuration.
 */

import { Command } from "commander";
import { confirm, input, select } from "@inquirer/prompts";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  openDatabaseWithSync,
  setSetting,
  getSystemProfile,
  installFastFlowLM,
  installOllama,
  distributeGlobalSkills,
  injectShellHooks,
} from "../../kernel/index.js";

const HOME = homedir();

/**
 * Helper to print thick borders.
 */
function printLine(char = "═", len = 60, color = "\x1b[36m") {
  console.log(`${color}${char.repeat(len)}\x1b[0m`);
}

/**
 * Bootstrap the default "Local Sandbox" workspace structure.
 */
function bootstrapSandboxWorkspace(workspaceDir: string) {
  mkdirSync(join(workspaceDir, "beliefs"), { recursive: true });
  mkdirSync(join(workspaceDir, "goals"), { recursive: true });
  mkdirSync(join(workspaceDir, "skills"), { recursive: true });

  const worldviewFile = join(workspaceDir, "beliefs", "worldview.md");
  if (!existsSync(worldviewFile)) {
    writeFileSync(
      worldviewFile,
      `# Personal Worldview

Here, I declare the core concepts and principles I want to master.

- **Conceptual Autonomy**: I value deep conceptual understanding over copy-pasting rote procedures.
- **Continuous Retention**: I use spaced repetition to prevent my professional skills from decaying.
`,
      "utf8"
    );
  }

  const goalsFile = join(workspaceDir, "goals", "goals.md");
  if (!existsSync(goalsFile)) {
    writeFileSync(
      goalsFile,
      `# Personal Goals

- **[ ] Learn Spaced Repetition Core Concepts**
  - #fsrs-stability
  - #fsrs-difficulty
`,
      "utf8"
    );
  }
}

export const initCommand = new Command("init")
  .description("Launch the guided interactive onboarding wizard")
  .action(async () => {
    printLine();
    console.log("\x1b[1m\x1b[32m          ZAM — The Symbiotic Learning Agent Onboarding\x1b[0m");
    console.log("\x1b[2m  Welcome! ZAM helps you build conceptual skills while you work.\x1b[0m");
    printLine();

    // ── STEP 1: Workspace Selection ──────────────────────────────────────────
    console.log("\n\x1b[1m[1/5] Setting up Local Workspace Sandbox\x1b[0m");
    const defaultWorkspace = join(HOME, "Documents", "zam");
    
    const workspacePath = await input({
      message: "Choose your ZAM workspace directory:",
      default: defaultWorkspace,
    });

    try {
      bootstrapSandboxWorkspace(workspacePath);
      console.log(`\x1b[32m✓ Local Sandbox created at: ${workspacePath}\x1b[0m`);
    } catch (err) {
      console.error(`\x1b[31m✗ Failed to create workspace: ${(err as Error).message}\x1b[0m`);
      process.exit(1);
    }

    // ── STEP 2: Hardware Auto-Detection ──────────────────────────────────────
    console.log("\n\x1b[1m[2/5] Running Hardware Profiling...\x1b[0m");
    const profile = getSystemProfile();

    console.log(`  OS Detected:      \x1b[36m${profile.os}\x1b[0m`);
    console.log(`  CPU Architecture: \x1b[36m${profile.arch}\x1b[0m`);
    if (profile.hasRyzenNPU) {
      console.log("  NPU Detected:     \x1b[32mAMD Ryzen AI NPU detected! (Optimum Setup)\x1b[0m");
    } else if (profile.hasAppleSilicon) {
      console.log("  CPU Brand:        \x1b[32mmacOS Apple Silicon detected! (Optimum Setup)\x1b[0m");
    } else {
      console.log("  Hardware:         \x1b[33mStandard CPU detected.\x1b[0m");
    }

    const runnerLabel = profile.recommendedRunner === "fastflowlm" ? "FastFlowLM (NPU Optimized)" : "Ollama";
    console.log(`\n  \x1b[1mRecommendation:\x1b[0m ZAM suggests installing \x1b[32m${runnerLabel}\x1b[0m with \x1b[36m${profile.recommendedModel}\x1b[0m.`);

    // ── STEP 3: Local LLM Runner Installation ───────────────────────────────
    console.log("\n\x1b[1m[3/5] Setting up Local LLM Runner\x1b[0m");
    const proceedInstall = await confirm({
      message: `Would you like ZAM to install and configure ${runnerLabel} automatically?`,
      default: true,
    });

    let installSuccess = false;
    if (proceedInstall) {
      let result;
      if (profile.recommendedRunner === "fastflowlm") {
        result = installFastFlowLM();
      } else {
        result = installOllama();
      }

      if (result.success) {
        console.log(`\x1b[32m✓ ${result.message}\x1b[0m`);
        installSuccess = true;
      } else {
        console.warn(`\x1b[33m⚠ Installation failed: ${result.message}\x1b[0m`);
        console.log("You can install it manually or continue with offline templates.");
      }
    }

    // ── STEP 4: Initialize Database & Write Local Settings ─────────────────
    console.log("\n\x1b[1m[4/5] Bootstrapping database & settings...\x1b[0m");
    let db;
    try {
      db = openDatabaseWithSync({ initialize: true });
      
      // Save workspace directory to settings
      setSetting(db, "personal.workspace_dir", workspacePath);

      if (installSuccess) {
        setSetting(db, "llm.enabled", "true");
        if (profile.recommendedRunner === "fastflowlm") {
          setSetting(db, "llm.url", "http://localhost:8000/v1");
          setSetting(db, "llm.model", "qwen3.5:4b");
        } else {
          setSetting(db, "llm.url", "http://localhost:11434/v1");
          setSetting(db, "llm.model", "llama3.2:3b");
        }
        console.log("\x1b[32m✓ Configured LLM runner settings in database.\x1b[0m");
      } else {
        setSetting(db, "llm.enabled", "false");
      }
      db.close();
      console.log("\x1b[32m✓ Database initialized successfully.\x1b[0m");
    } catch (err) {
      console.error(`\x1b[31m✗ Database setup failed: ${(err as Error).message}\x1b[0m`);
      db?.close();
    }

    // ── STEP 5: Distribute Agent Skills & Hooks ──────────────────────────────
    console.log("\n\x1b[1m[5/5] Wiring Developer Agents & Terminal Hooks\x1b[0m");
    const proceedHooks = await confirm({
      message: "Distribute ZAM active-recall skills and enable automatic terminal command observation?",
      default: true,
    });

    if (proceedHooks) {
      console.log("Copying SKILL.md into global agent directories...");
      const skillResults = distributeGlobalSkills();
      for (const res of skillResults) {
        if (res.success) {
          console.log(`  \x1b[32m✓ Installed ZAM Skill in ${res.name}\x1b[0m`);
        } else {
          console.log(`  \x1b[31m✗ Failed to install in ${res.name}\x1b[0m`);
        }
      }

      console.log("Injecting observation hooks into shell profiles...");
      const hookResults = injectShellHooks();
      for (const res of hookResults) {
        if (res.success) {
          const action = res.alreadyHooked ? "already up-to-date" : "injected successfully";
          console.log(`  \x1b[32m✓ ${res.shell} hook: ${action}\x1b[0m`);
        } else {
          console.log(`  \x1b[31m✗ Failed to inject hook in ${res.shell} (${res.file})\x1b[0m`);
        }
      }
    }

    printLine();
    console.log("\x1b[1m\x1b[32m         Congratulations! ZAM Onboarding Complete!\x1b[0m");
    console.log("\x1b[1m  You are now ready to start your symbiotic learning journey.\x1b[0m");
    console.log("\n  \x1b[1mUseful commands to get started:\x1b[0m");
    console.log("   \x1b[36mzam stats\x1b[0m           — Display your learning queue stats");
    console.log("   \x1b[36mzam learn\x1b[0m           — Start a standalone learning session");
    console.log("   \x1b[36mzam workspace publish\x1b[0m — Publish your workspace sandbox to GitHub");
    printLine();
  });
