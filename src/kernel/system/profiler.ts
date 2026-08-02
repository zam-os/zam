import { execSync } from "node:child_process";

export type LocalAiHardware = "ryzen-ai" | "snapdragon-x" | "apple-silicon" | "unsupported";
export type LocalAiAcceleration = "npu" | "gpu" | "none";

export interface SystemProfile {
  os: "windows" | "macos" | "linux" | "unknown";
  arch: "x64" | "arm64" | "unknown";
  /** Backward-compatible AMD-specific detection; never true for Intel NPUs. */
  hasRyzenNPU: boolean;
  hasSnapdragonX: boolean;
  hasAppleSilicon: boolean;
  /** Only hardware with an explicitly supported accelerated inference route. */
  localAiHardware: LocalAiHardware;
  localAiAcceleration: LocalAiAcceleration;
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

const WINDOWS_PROCESSOR_QUERY =
  'powershell -NoProfile -Command "Get-CimInstance Win32_Processor | Select-Object -ExpandProperty Name"';
const WINDOWS_ACCELERATOR_QUERY =
  'powershell -NoProfile -Command "Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPClass -eq \'ComputeAccelerator\' -or $_.Name -like \'*AMD IPU*\' -or $_.Name -like \'*AMD NPU*\' -or $_.Name -like \'*Ryzen AI*\' -or $_.Name -like \'*Qualcomm*NPU*\' -or $_.Name -like \'*Hexagon*NPU*\' } | Select-Object -ExpandProperty Name"';

export interface LocalAiHardwareFingerprint {
  platform: NodeJS.Platform;
  arch: string;
  processorName?: string;
  acceleratorNames?: string;
}

/** Recognize only platforms with an explicit accelerated local-AI policy. */
export function classifyLocalAiHardware(
  fingerprint: LocalAiHardwareFingerprint,
): LocalAiHardware {
  if (fingerprint.platform === "darwin" && fingerprint.arch === "arm64") {
    return "apple-silicon";
  }
  if (fingerprint.platform !== "win32") return "unsupported";

  const hardware = `${fingerprint.processorName ?? ""} ${fingerprint.acceleratorNames ?? ""}`.toLowerCase();
  const isSnapdragon =
    fingerprint.arch === "arm64" &&
    (/snapdragon\s*(?:\(r\))?\s*x\b/.test(hardware) ||
      (hardware.includes("qualcomm") && hardware.includes("hexagon npu")));
  if (isSnapdragon) return "snapdragon-x";

  const isRyzen =
    /amd\s+ryzen\s+ai/.test(hardware) ||
    (hardware.includes("amd") &&
      (hardware.includes("amd ipu") || hardware.includes("amd npu")));
  if (isRyzen) return "ryzen-ai";
  return "unsupported";
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

  const localAiHardware = classifyLocalAiHardware({
    platform,
    arch: archStr,
    processorName:
      os === "windows" ? runCommand(WINDOWS_PROCESSOR_QUERY) : undefined,
    acceleratorNames:
      os === "windows" ? runCommand(WINDOWS_ACCELERATOR_QUERY) : undefined,
  });
  const localAiAcceleration: LocalAiAcceleration =
    localAiHardware === "apple-silicon"
      ? "gpu"
      : localAiHardware === "unsupported"
        ? "none"
        : "npu";
  const hasRyzenNPU = localAiHardware === "ryzen-ai";
  const hasSnapdragonX = localAiHardware === "snapdragon-x";
  const hasAppleSilicon = localAiHardware === "apple-silicon";

  let recommendedRunner: "fastflowlm" | "ollama" | "generic" = "generic";
  let recommendedModel = "qwen3.5:4b";

  if (hasSnapdragonX) {
    recommendedRunner = "generic";
    recommendedModel = "phi-3.5-mini-instruct-qnn-npu";
  } else if (hasRyzenNPU) {
    recommendedRunner = "fastflowlm";
  } else if (hasAppleSilicon) {
    recommendedRunner = "ollama";
    recommendedModel = "qwen3.5:4b";
  }

  return {
    os,
    arch,
    hasRyzenNPU,
    hasSnapdragonX,
    hasAppleSilicon,
    localAiHardware,
    localAiAcceleration,
    recommendedRunner,
    recommendedModel,
  };
}
