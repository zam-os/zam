import { execSync } from "node:child_process";

export type LocalAiHardware =
  | "ryzen-ai"
  | "snapdragon-x"
  | "apple-silicon"
  | "discrete-gpu"
  | "unsupported";
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
  "powershell -NoProfile -Command \"Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPClass -eq 'ComputeAccelerator' -or $_.Name -like '*AMD IPU*' -or $_.Name -like '*AMD NPU*' -or $_.Name -like '*Ryzen AI*' -or $_.Name -like '*Qualcomm*NPU*' -or $_.Name -like '*Hexagon*NPU*' } | Select-Object -ExpandProperty Name\"";
const WINDOWS_GPU_QUERY =
  'powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"';
/** `nvidia-smi` is the only probe that is present exactly when the driver is. */
const LINUX_GPU_QUERY = "nvidia-smi --query-gpu=name --format=csv,noheader";

/**
 * Discrete accelerators fast enough to serve interactive generation. Integrated
 * graphics are deliberately absent: an iGPU shares system memory and bandwidth
 * with the CPU and lands in the same "too slow to review with" band, so
 * matching it would re-introduce exactly the path this allowlist exists to
 * exclude.
 */
const DISCRETE_GPU_PATTERNS = [
  /\bnvidia\b/,
  /\bgeforce\b/,
  /\brtx\s*[a-z]?\d/,
  /\bgtx\s*\d/,
  /\bquadro\b/,
  /\btesla\b/,
  /\bradeon\s+(?:rx|pro|vii)\b/,
  /\bintel\s*\(r\)?\s*arc\b/,
  /\barc\s+[ab]\d{3}/,
];

export interface LocalAiHardwareFingerprint {
  platform: NodeJS.Platform;
  arch: string;
  processorName?: string;
  acceleratorNames?: string;
  gpuNames?: string;
}

function hasDiscreteGpu(gpuNames: string | undefined): boolean {
  if (!gpuNames) return false;
  const names = gpuNames.toLowerCase();
  return DISCRETE_GPU_PATTERNS.some((pattern) => pattern.test(names));
}

/**
 * Recognize only hardware with an accelerated inference route ZAM can actually
 * drive. This answers "is there a supported accelerated route here", not "does
 * this machine contain an accelerator" — an NPU with no usable runtime and an
 * integrated GPU are both `unsupported`, because a route ZAM cannot drive is
 * indistinguishable, for the learner, from no route at all.
 *
 * NPU classifications win over a discrete GPU only because they are the
 * established routes; a machine with both keeps the behaviour it had before GPU
 * detection existed.
 */
export function classifyLocalAiHardware(
  fingerprint: LocalAiHardwareFingerprint,
): LocalAiHardware {
  if (fingerprint.platform === "darwin") {
    return fingerprint.arch === "arm64" ? "apple-silicon" : "unsupported";
  }
  if (fingerprint.platform === "linux") {
    return hasDiscreteGpu(fingerprint.gpuNames)
      ? "discrete-gpu"
      : "unsupported";
  }
  if (fingerprint.platform !== "win32") return "unsupported";

  const hardware =
    `${fingerprint.processorName ?? ""} ${fingerprint.acceleratorNames ?? ""}`.toLowerCase();
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

  if (hasDiscreteGpu(fingerprint.gpuNames)) return "discrete-gpu";
  return "unsupported";
}

/**
 * Whether ZAM offers its guided local text and image setup on this hardware.
 *
 * CPU-only generation is fast enough for embeddings and too slow to review
 * with, so the guided path is withheld rather than handing the learner a local
 * model that makes them stop reviewing. Adding a model by hand stays possible.
 */
export function supportsLocalGeneration(
  acceleration: LocalAiAcceleration,
): boolean {
  return acceleration !== "none";
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
    gpuNames:
      os === "windows"
        ? runCommand(WINDOWS_GPU_QUERY)
        : os === "linux"
          ? runCommand(LINUX_GPU_QUERY)
          : undefined,
  });
  const localAiAcceleration: LocalAiAcceleration =
    localAiHardware === "apple-silicon" || localAiHardware === "discrete-gpu"
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
  } else if (hasAppleSilicon || localAiHardware === "discrete-gpu") {
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
