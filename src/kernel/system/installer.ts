import { execFileSync, execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface InstallResult {
  success: boolean;
  message: string;
}

export type LocalLLMRunner = "fastflowlm" | "ollama" | "generic";

/** A resolved way to install a tool: a human label and the command to run. */
export interface InstallPlan {
  method: string;
  command: string;
}

/**
 * Check if a command is executable on the system.
 */
export function hasCommand(cmd: string): boolean {
  try {
    const checkCmd =
      process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`;
    execSync(checkCmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Install FastFlowLM via winget on Windows.
 */
export function installFastFlowLM(): InstallResult {
  if (process.platform !== "win32") {
    return {
      success: false,
      message: "FastFlowLM is only supported on Windows.",
    };
  }

  // Check if already installed
  const hasFlm =
    hasCommand("flm") || existsSync("C:\\Program Files\\flm\\flm.exe");
  if (hasFlm) {
    return { success: true, message: "FastFlowLM is already installed." };
  }

  if (!hasCommand("winget")) {
    return {
      success: false,
      message: "winget package manager was not found on this system.",
    };
  }

  console.log("Installing FastFlowLM via winget...");
  try {
    // -e option exact match, --accept-source-agreements --accept-package-agreements
    execSync(
      "winget install -e --id FastFlowLM --accept-source-agreements --accept-package-agreements",
      { stdio: "inherit" },
    );
    return { success: true, message: "FastFlowLM installed successfully." };
  } catch (err) {
    return {
      success: false,
      message: `Failed to install FastFlowLM: ${(err as Error).message}`,
    };
  }
}

/**
 * Install Ollama via Homebrew on macOS.
 */
export function installOllama(): InstallResult {
  // Check if already installed
  const isMac = process.platform === "darwin";
  const isWin = process.platform === "win32";
  const hasOllama =
    hasCommand("ollama") ||
    (isMac && existsSync("/Applications/Ollama.app")) ||
    (isWin &&
      existsSync(
        join(homedir(), "AppData", "Local", "Programs", "Ollama", "ollama.exe"),
      ));

  if (hasOllama) {
    return { success: true, message: "Ollama is already installed." };
  }

  if (process.platform === "darwin") {
    if (!hasCommand("brew")) {
      return {
        success: false,
        message:
          "Homebrew was not found. Please install Homebrew from brew.sh first.",
      };
    }
    console.log("Installing Ollama via Homebrew Cask...");
    try {
      execSync("brew install --cask ollama", { stdio: "inherit" });
      return { success: true, message: "Ollama installed successfully." };
    } catch (err) {
      return {
        success: false,
        message: `Failed to install Ollama: ${(err as Error).message}`,
      };
    }
  } else if (process.platform === "win32") {
    if (!hasCommand("winget")) {
      return {
        success: false,
        message: "winget was not found. Please install winget first.",
      };
    }
    console.log("Installing Ollama via winget...");
    try {
      execSync(
        "winget install -e --id Ollama.Ollama --accept-source-agreements --accept-package-agreements",
        { stdio: "inherit" },
      );
      return { success: true, message: "Ollama installed successfully." };
    } catch (err) {
      return {
        success: false,
        message: `Failed to install Ollama: ${(err as Error).message}`,
      };
    }
  } else {
    // Linux installer script
    console.log("Installing Ollama via official installer script...");
    try {
      execSync("curl -fsSL https://ollama.com/install.sh | sh", {
        stdio: "inherit",
      });
      return { success: true, message: "Ollama installed successfully." };
    } catch (err) {
      return {
        success: false,
        message: `Failed to install Ollama: ${(err as Error).message}`,
      };
    }
  }
}

function resolveOllamaCommand(): string | undefined {
  if (hasCommand("ollama")) return "ollama";

  const candidates =
    process.platform === "win32"
      ? [
          join(
            homedir(),
            "AppData",
            "Local",
            "Programs",
            "Ollama",
            "ollama.exe",
          ),
        ]
      : process.platform === "darwin"
        ? ["/Applications/Ollama.app/Contents/Resources/ollama"]
        : [];

  return candidates.find((candidate) => existsSync(candidate));
}

/**
 * Prepare the recommended model after installing a local LLM runner.
 */
export function prepareLocalModel(
  runner: LocalLLMRunner,
  model: string,
): InstallResult {
  if (runner === "fastflowlm") {
    return {
      success: true,
      message: `${model} will be downloaded by FastFlowLM on first use.`,
    };
  }

  if (runner !== "ollama") {
    return {
      success: false,
      message: "No supported local LLM runner was selected.",
    };
  }

  const ollamaCommand = resolveOllamaCommand();
  if (!ollamaCommand) {
    return {
      success: false,
      message:
        "Ollama was installed but its command is not available yet. Restart the terminal, then run " +
        `ollama pull ${model}.`,
    };
  }

  console.log(`Downloading ${model} with Ollama...`);
  try {
    execFileSync(ollamaCommand, ["pull", model], { stdio: "inherit" });
    return { success: true, message: `${model} is ready in Ollama.` };
  } catch (err) {
    return {
      success: false,
      message:
        `Could not prepare ${model}: ${(err as Error).message}. ` +
        `Start Ollama and run: ollama pull ${model}`,
    };
  }
}

/**
 * Pick how to install the opencode agent for the current machine.
 *
 * npm is preferred on every platform: ZAM already requires Node, and the
 * `opencode-ai` package pulls the correct native binary for Apple Silicon and
 * Windows on ARM — avoiding the bash-on-Windows and Homebrew-tap caveats.
 * Returns null when no automatic method is available (e.g. Windows without npm,
 * Scoop, or Chocolatey).
 */
export function planOpenCodeInstall(env: {
  platform: NodeJS.Platform;
  hasNpm: boolean;
  hasBrew: boolean;
  hasScoop: boolean;
  hasChoco: boolean;
}): InstallPlan | null {
  if (env.hasNpm) {
    return { method: "npm", command: "npm install -g opencode-ai" };
  }
  if (env.platform === "darwin") {
    if (env.hasBrew) {
      return {
        method: "homebrew",
        command: "brew install anomalyco/tap/opencode",
      };
    }
    return {
      method: "script",
      command: "curl -fsSL https://opencode.ai/install | bash",
    };
  }
  if (env.platform === "win32") {
    if (env.hasScoop)
      return { method: "scoop", command: "scoop install opencode" };
    if (env.hasChoco) {
      return { method: "chocolatey", command: "choco install opencode" };
    }
    return null;
  }
  // Linux and other Unix-likes.
  return {
    method: "script",
    command: "curl -fsSL https://opencode.ai/install | bash",
  };
}

/**
 * Install the opencode agent (the default agent ZAM provisions). opencode reads
 * the AGENTS.md that `zam setup` writes, so it picks up the ZAM skill once both
 * are present.
 */
export function installOpenCode(): InstallResult {
  if (hasCommand("opencode")) {
    return { success: true, message: "opencode is already installed." };
  }

  const plan = planOpenCodeInstall({
    platform: process.platform,
    hasNpm: hasCommand("npm"),
    hasBrew: hasCommand("brew"),
    hasScoop: hasCommand("scoop"),
    hasChoco: hasCommand("choco"),
  });

  if (!plan) {
    return {
      success: false,
      message:
        "Could not find a way to install opencode automatically. Install npm, " +
        "Scoop, or Chocolatey, or follow https://opencode.ai/docs (native " +
        "Apple Silicon and Windows on ARM builds are available).",
    };
  }

  console.log(`Installing opencode via ${plan.method}...`);
  try {
    execSync(plan.command, { stdio: "inherit" });
    return { success: true, message: `opencode installed via ${plan.method}.` };
  } catch (err) {
    return {
      success: false,
      message:
        `Failed to install opencode: ${(err as Error).message}. ` +
        `Try manually: ${plan.command}`,
    };
  }
}
