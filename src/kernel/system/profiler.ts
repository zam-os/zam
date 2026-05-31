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

function detectWindowsAMDIPU(): boolean {
  if (process.platform !== "win32") return false;

  // WMI query for AMD IPU (Image Processing Unit), NPU, Ryzen AI CPUs, and modern NPU compute devices (DEV_1502, DEV_17F0)
  const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.Name -like '*AMD IPU*' -or $_.Name -like '*AMD NPU*' -or $_.Name -like '*NPU Compute*' -or $_.Name -like '*Ryzen AI*' -or $_.HardwareID -like '*VEN_1022&DEV_1502*' -or $_.HardwareID -like '*VEN_1022&DEV_17F0*' } | Select-Object -First 1 -ExpandProperty Name"`;
  const output = runCommand(cmd);

  return Boolean(
    output &&
      (output.toLowerCase().includes("amd") ||
        output.toLowerCase().includes("ipu") ||
        output.toLowerCase().includes("npu") ||
        output.toLowerCase().includes("ryzen")),
  );
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

  const hasRyzenNPU = os === "windows" && detectWindowsAMDIPU();
  const hasAppleSilicon = os === "macos" && arch === "arm64";

  let recommendedRunner: "fastflowlm" | "ollama" | "generic" = "generic";
  let recommendedModel = "qwen3.5:4b";

  if (hasRyzenNPU) {
    recommendedRunner = "fastflowlm";
    recommendedModel = "qwen3.5:4b";
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
    hasRyzenNPU,
    hasAppleSilicon,
    recommendedRunner,
    recommendedModel,
  };
}
