import { execSync } from "node:child_process";

export interface SystemProfile {
  os: "windows" | "macos" | "linux" | "unknown";
  arch: "x64" | "arm64" | "unknown";
  hasRyzenNPU: boolean;
  hasAppleSilicon: boolean;
  recommendedRunner: "fastflowlm" | "ollama" | "generic";
  recommendedModel: string;
}

/**
 * Run a shell command synchronously and return stdout.
 * Returns empty string on failure.
 */
function runCommand(cmd: string): string {
  try {
    return execSync(cmd, { stdio: "pipe", encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function detectWindowsNPU(): boolean {
  if (process.platform !== "win32") return false;

  // Query for devices belonging to ComputeAccelerator class (standard for modern NPUs/IPUs under MCDM)
  // or names matching known NPU/IPU vendor terms (AMD IPU/NPU, Qualcomm Hexagon NPU, Intel AI Boost NPU).
  const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPClass -eq 'ComputeAccelerator' -or $_.Name -like '*AMD IPU*' -or $_.Name -like '*AMD NPU*' -or $_.Name -like '*Qualcomm*NPU*' -or $_.Name -like '*Hexagon*NPU*' -or $_.Name -like '*Intel*AI Boost*' -or $_.Name -like '*NPU Compute*' -or $_.Name -like '*Ryzen AI*' } | Select-Object -First 1 -ExpandProperty Name"`;
  const output = runCommand(cmd);

  return Boolean(output && output.length > 0);
}

/**
 * Profile the active system hardware and software capabilities.
 */
export function getSystemProfile(): SystemProfile {
  const platform = process.platform;
  const archStr = process.arch;

  let os: "windows" | "macos" | "linux" | "unknown" = "unknown";
  if (platform === "win32") os = "windows";
  else if (platform === "darwin") os = "macos";
  else if (platform === "linux") os = "linux";

  let arch: "x64" | "arm64" | "unknown" = "unknown";
  if (archStr === "x64") arch = "x64";
  else if (archStr === "arm64") arch = "arm64";

  const hasNpu = os === "windows" && detectWindowsNPU();
  const hasAppleSilicon = os === "macos" && arch === "arm64";

  let recommendedRunner: "fastflowlm" | "ollama" | "generic" = "generic";
  let recommendedModel = "qwen3.5:4b";

  if (hasNpu) {
    const isQualcomm =
      runCommand(
        `powershell -NoProfile -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.Name -like '*Qualcomm*' } | Select-Object -First 1"`,
      ).length > 0;
    if (isQualcomm) {
      // Snapdragon NPU PC runs Microsoft Foundry Local (generic/external service)
      recommendedRunner = "generic";
      recommendedModel = "qwen3.5-4b";
    } else {
      recommendedRunner = "fastflowlm";
      recommendedModel = "qwen3.5:4b";
    }
  } else if (hasAppleSilicon) {
    recommendedRunner = "ollama";
    recommendedModel = "llama3.2:3b";
  } else if (os === "macos" || os === "linux" || os === "windows") {
    // Standard PC / generic Mac
    recommendedRunner = "ollama";
    recommendedModel = "llama3.2:3b";
  }

  return {
    os,
    arch,
    hasRyzenNPU: hasNpu && !archStr.includes("arm64"), // backwards compatibility flag
    hasAppleSilicon,
    recommendedRunner,
    recommendedModel,
  };
}
