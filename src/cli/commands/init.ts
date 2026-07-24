/**
 * `zam init` — Guided interactive onboarding wizard.
 *
 * Bootstraps a fresh ZAM installation:
 * 1. Initializes a zero-dependency "Local Sandbox" workspace.
 * 2. Runs hardware profiling to detect NPUs/CPUs.
 * 3. Connects an AI model — OpenRouter cloud (default, privacy enforced per
 *    request) or the hardware-optimized local runtime (flm or Ollama).
 * 4. Automatically distributes global agent skill files and hooks.
 * 5. Sets up the local database and configuration.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { confirm, input, password, select } from "@inquirer/prompts";
import { Command } from "commander";
import {
  deleteSetting,
  detectSystemLocale,
  distributeGlobalSkills,
  getSystemProfile,
  injectShellHooks,
  installFastFlowLM,
  installOllama,
  openDatabaseWithSync,
  prepareLocalModel,
  setActiveWorkspaceId,
  setOnboardingDone,
  setSetting,
  upsertConfiguredWorkspace,
} from "../../kernel/index.js";
import { connectCloudProvider } from "../llm/cloud-connect.js";
import { OPENROUTER_PROVIDER } from "../llm/cloud-providers.js";
import { parseSetupAgents, wireSkills } from "../provisioning/index.js";

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
      "utf8",
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
      "utf8",
    );
  }
}

export const initCommand = new Command("init")
  .description("Launch the guided interactive onboarding wizard")
  .action(async () => {
    printLine();
    console.log(
      "\x1b[1m\x1b[32m          ZAM — The Symbiotic Learning Agent Onboarding\x1b[0m",
    );
    console.log(
      "\x1b[2m  Welcome! ZAM helps you build conceptual skills while you work.\x1b[0m",
    );
    printLine();

    // ── STEP 1: Workspace Selection ──────────────────────────────────────────
    console.log("\n\x1b[1m[1/5] Setting up Local Workspace Sandbox\x1b[0m");
    const defaultWorkspace = join(HOME, "Documents", "zam");

    const workspacePath = resolve(
      await input({
        message: "Choose your ZAM workspace directory:",
        default: defaultWorkspace,
      }),
    );

    try {
      bootstrapSandboxWorkspace(workspacePath);
      wireSkills(workspacePath, parseSetupAgents());
      upsertConfiguredWorkspace({
        id: "personal",
        label: "Personal",
        kind: "personal",
        path: workspacePath,
      });
      setActiveWorkspaceId("personal");
      console.log(
        `\x1b[32m✓ Local Sandbox created at: ${workspacePath}\x1b[0m`,
      );
    } catch (err) {
      console.error(
        `\x1b[31m✗ Failed to create workspace: ${(err as Error).message}\x1b[0m`,
      );
      process.exit(1);
    }

    // ── STEP 2: Hardware Auto-Detection ──────────────────────────────────────
    console.log("\n\x1b[1m[2/5] Running Hardware Profiling...\x1b[0m");
    const profile = getSystemProfile();

    console.log(`  OS Detected:      \x1b[36m${profile.os}\x1b[0m`);
    console.log(`  CPU Architecture: \x1b[36m${profile.arch}\x1b[0m`);
    if (profile.hasRyzenNPU) {
      console.log(
        "  NPU Detected:     \x1b[32mAMD Ryzen AI NPU detected! (Optimum Setup)\x1b[0m",
      );
    } else if (profile.hasAppleSilicon) {
      console.log(
        "  CPU Brand:        \x1b[32mmacOS Apple Silicon detected! (Optimum Setup)\x1b[0m",
      );
    } else {
      console.log("  Hardware:         \x1b[33mStandard CPU detected.\x1b[0m");
    }

    const runnerLabel =
      profile.recommendedRunner === "fastflowlm"
        ? "FastFlowLM (NPU Optimized)"
        : "Ollama";
    console.log(
      `\n  \x1b[1mRecommendation:\x1b[0m ZAM suggests installing \x1b[32m${runnerLabel}\x1b[0m with \x1b[36m${profile.recommendedModel}\x1b[0m.`,
    );

    // ── STEP 3: AI model — cloud (default) or local runner ──────────────────
    // Same offer as onboarding page 3 (ADR 2026-07-24 §5): OpenRouter first,
    // the local runtime as the equal-billing second choice, skip stays honest.
    console.log("\n\x1b[1m[3/5] Connecting an AI model\x1b[0m");
    const aiChoice = await select({
      message: "How should ZAM connect its AI?",
      choices: [
        {
          name: `${OPENROUTER_PROVIDER.label} cloud — ${OPENROUTER_PROVIDER.defaultModel} (recommended)`,
          value: "cloud",
          description: `Privacy enforced on every request; $${OPENROUTER_PROVIDER.minTopUpUsd} prepaid minimum, no subscription.`,
        },
        {
          name: `Local runner — ${runnerLabel} with ${profile.recommendedModel}`,
          value: "local",
          description: "Everything stays on this machine; larger download.",
        },
        { name: "Skip for now", value: "skip" },
      ],
      default: "cloud",
    });

    let llmReady = false;
    let cloudKey = "";
    if (aiChoice === "cloud") {
      console.log(
        `\n  \x1b[1mTwo things to know about ${OPENROUTER_PROVIDER.label}:\x1b[0m`,
      );
      console.log(
        "  1. Privacy is enforced per request: ZAM forbids storing your data and\n" +
          '     training on it (data_collection: "deny", zdr: true) on every call.',
      );
      console.log(
        `  2. Cost is bounded: $${OPENROUTER_PROVIDER.minTopUpUsd} prepaid credit is the minimum top-up and\n` +
          "     covers weeks of regular learning. No subscription.",
      );
      console.log(
        `\n  Create the account, credit, and key yourself (ZAM never does):\n` +
          `    Key:     \x1b[36m${OPENROUTER_PROVIDER.keysUrl}\x1b[0m\n` +
          `    Credit:  \x1b[36m${OPENROUTER_PROVIDER.creditsUrl}\x1b[0m\n` +
          `    Privacy: \x1b[36m${OPENROUTER_PROVIDER.privacyUrl}\x1b[0m`,
      );
      cloudKey = (
        await password({
          message: `Paste your ${OPENROUTER_PROVIDER.label} API key (Enter to skip):`,
          mask: "*",
        })
      ).trim();
      if (!cloudKey) {
        console.log(
          "\x1b[33m⚠ No key pasted — continuing without a cloud model.\x1b[0m",
        );
      }
    } else if (aiChoice === "local") {
      const proceedInstall = await confirm({
        message: `Would you like ZAM to install and configure ${runnerLabel} automatically?`,
        default: true,
      });

      if (proceedInstall) {
        let result: ReturnType<typeof installFastFlowLM> | undefined;
        if (profile.recommendedRunner === "fastflowlm") {
          result = installFastFlowLM();
        } else {
          result = installOllama();
        }

        if (result.success) {
          console.log(`\x1b[32m✓ ${result.message}\x1b[0m`);
          const modelResult = prepareLocalModel(
            profile.recommendedRunner,
            profile.recommendedModel,
          );
          if (modelResult.success) {
            console.log(`\x1b[32m✓ ${modelResult.message}\x1b[0m`);
            llmReady = true;
          } else {
            console.warn(
              `\x1b[33m⚠ Model setup incomplete: ${modelResult.message}\x1b[0m`,
            );
          }
        } else {
          console.warn(
            `\x1b[33m⚠ Installation failed: ${result.message}\x1b[0m`,
          );
          console.log(
            "You can install it manually or continue with offline templates.",
          );
        }
      }
    }

    // ── STEP 4: Initialize Database & Write Local Settings ─────────────────
    console.log("\n\x1b[1m[4/5] Bootstrapping database & settings...\x1b[0m");
    let db: Awaited<ReturnType<typeof openDatabaseWithSync>> | undefined;
    try {
      db = await openDatabaseWithSync({ initialize: true });

      // Workspace selection is stored in machine-local config; clear the legacy
      // DB setting so future runs do not migrate stale paths back in.
      await deleteSetting(db, "personal.workspace_dir");

      // Auto-detect and save system locale
      const detectedLocale = detectSystemLocale();
      await setSetting(db, "system.locale", detectedLocale);
      console.log(
        `\x1b[32m✓ Detected and set system language to: ${detectedLocale}\x1b[0m`,
      );

      // Cloud connect shares the exact implementation behind the desktop
      // wizard's model page (cloud-connect.ts), so the two fronts cannot
      // drift: verify key → store under the credential ref → register the
      // default model in the capability registry → enable the text LLM.
      let cloudConnected = false;
      if (cloudKey) {
        const result = await connectCloudProvider(
          db,
          OPENROUTER_PROVIDER.id,
          cloudKey,
        );
        if (result.ok && result.entry) {
          cloudConnected = true;
          console.log(
            `\x1b[32m✓ Connected ${OPENROUTER_PROVIDER.label} — ${result.entry.model} registered; privacy preferences enforced on every request.\x1b[0m`,
          );
        } else {
          console.warn(
            `\x1b[33m⚠ Cloud connect failed: ${result.error}\x1b[0m`,
          );
        }
      }

      if (llmReady) {
        await setSetting(db, "llm.enabled", "true");
        if (profile.recommendedRunner === "fastflowlm") {
          await setSetting(db, "llm.url", "http://localhost:8000/v1");
        } else {
          await setSetting(db, "llm.url", "http://localhost:11434/v1");
        }
        await setSetting(db, "llm.model", profile.recommendedModel);
        console.log(
          "\x1b[32m✓ Configured LLM runner settings in database.\x1b[0m",
        );
      } else if (!cloudConnected) {
        await setSetting(db, "llm.enabled", "false");
      }
      await db.close();
      console.log("\x1b[32m✓ Database initialized successfully.\x1b[0m");
    } catch (err) {
      console.error(
        `\x1b[31m✗ Database setup failed: ${(err as Error).message}\x1b[0m`,
      );
      await db?.close();
    }

    // ── STEP 5: Distribute Agent Skills & Helpers ────────────────────────────
    console.log(
      "\n\x1b[1m[5/5] Wiring Developer Agents & Terminal Helpers\x1b[0m",
    );
    const proceedHooks = await confirm({
      message:
        "Distribute ZAM skills and install optional monitored-session shell helpers?",
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

      console.log("Installing monitored-session helpers in shell profiles...");
      const hookResults = injectShellHooks();
      for (const res of hookResults) {
        if (res.success) {
          const action = res.alreadyHooked
            ? "already up-to-date"
            : "installed successfully";
          console.log(`  \x1b[32m✓ ${res.shell} helper: ${action}\x1b[0m`);
        } else {
          console.log(
            `  \x1b[31m✗ Failed to install helper in ${res.shell} (${res.file})\x1b[0m`,
          );
        }
      }
      console.log(
        "  Start monitoring with zam-monitor-session <id> (bash/zsh) or Start-ZamMonitor <id> (PowerShell).",
      );
    }

    // Shared first-run gate (ADR 2026-07-24): finishing the CLI onboarding
    // marks this machine as onboarded, so the desktop app does not re-show its
    // guided first-run flow to someone who already set up from the terminal.
    setOnboardingDone(true);

    printLine();
    console.log(
      "\x1b[1m\x1b[32m         Congratulations! ZAM Onboarding Complete!\x1b[0m",
    );
    console.log(
      "\x1b[1m  You are now ready to start your symbiotic learning journey.\x1b[0m",
    );
    console.log("\n  \x1b[1mUseful commands to get started:\x1b[0m");
    console.log(
      "   \x1b[36mzam stats\x1b[0m           — Display your learning queue stats",
    );
    console.log(
      "   \x1b[36mzam learn\x1b[0m           — Start a standalone learning session",
    );
    console.log(
      "   \x1b[36mzam workspace publish\x1b[0m — Publish your workspace sandbox to GitHub",
    );
    printLine();
  });
