import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface InstallResult {
  success: boolean;
  message: string;
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
