import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, release } from "node:os";
import { dirname, join } from "node:path";

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

/**
 * One PowerShell session answers all three Windows questions. Starting
 * PowerShell is the expensive part (6 s on a Windows-on-ARM laptop with
 * Defender scanning, which made three separate calls take ~10 s), so the
 * probes share a single start instead of paying it three times.
 */
const WINDOWS_PROBE_SEPARATOR = "@@ZAM-SECTION@@";
const WINDOWS_PROBE_SCRIPT = [
  "$ErrorActionPreference = 'SilentlyContinue'",
  '(Get-CimInstance Win32_Processor | Select-Object -ExpandProperty Name) -join "`n"',
  `'${WINDOWS_PROBE_SEPARATOR}'`,
  "(Get-CimInstance Win32_PnPEntity | Where-Object { $_.PNPClass -eq 'ComputeAccelerator' -or $_.Name -like '*AMD IPU*' -or $_.Name -like '*AMD NPU*' -or $_.Name -like '*Ryzen AI*' -or $_.Name -like '*Qualcomm*NPU*' -or $_.Name -like '*Hexagon*NPU*' } | Select-Object -ExpandProperty Name) -join \"`n\"",
  `'${WINDOWS_PROBE_SEPARATOR}'`,
  '(Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name) -join "`n"',
].join("; ");
const WINDOWS_PROBE_QUERY = `powershell -NoProfile -EncodedCommand ${Buffer.from(WINDOWS_PROBE_SCRIPT, "utf16le").toString("base64")}`;
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

/** Hardware does not change under a running install; re-probe monthly. */
const PROBE_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface ProbeCacheFile extends LocalAiHardwareFingerprint {
  osRelease: string;
  savedAt: number;
}

function probeCachePath(): string {
  return join(homedir(), ".zam", "system-profile.json");
}

function readProbeCache(
  platform: NodeJS.Platform,
  arch: string,
): LocalAiHardwareFingerprint | undefined {
  try {
    const cached = JSON.parse(
      readFileSync(probeCachePath(), "utf8"),
    ) as ProbeCacheFile;
    if (
      cached.platform === platform &&
      cached.arch === arch &&
      cached.osRelease === release() &&
      Date.now() - cached.savedAt < PROBE_CACHE_MAX_AGE_MS
    ) {
      return {
        platform,
        arch,
        processorName: cached.processorName,
        acceleratorNames: cached.acceleratorNames,
        gpuNames: cached.gpuNames,
      };
    }
  } catch {
    // Missing or unreadable cache: probe again.
  }
  return undefined;
}

function writeProbeCache(fingerprint: LocalAiHardwareFingerprint): void {
  try {
    const file: ProbeCacheFile = {
      ...fingerprint,
      osRelease: release(),
      savedAt: Date.now(),
    };
    mkdirSync(dirname(probeCachePath()), { recursive: true });
    writeFileSync(probeCachePath(), JSON.stringify(file), "utf8");
  } catch {
    // A read-only home only costs the next start another probe.
  }
}

function probeHardwareFingerprint(
  platform: NodeJS.Platform,
  arch: string,
): LocalAiHardwareFingerprint {
  const cached = readProbeCache(platform, arch);
  if (cached) return cached;

  let fingerprint: LocalAiHardwareFingerprint;
  if (platform === "win32") {
    const [processorName = "", acceleratorNames = "", gpuNames = ""] =
      runCommand(WINDOWS_PROBE_QUERY)
        .split(WINDOWS_PROBE_SEPARATOR)
        .map((section) => section.trim());
    fingerprint = { platform, arch, processorName, acceleratorNames, gpuNames };
    // An all-empty answer means the probe itself failed (PowerShell blocked or
    // timed out), not that the machine has no processor. Never persist that:
    // it would pin "unsupported" for a month.
    if (!processorName && !acceleratorNames && !gpuNames) return fingerprint;
  } else {
    fingerprint = {
      platform,
      arch,
      gpuNames: platform === "linux" ? runCommand(LINUX_GPU_QUERY) : undefined,
    };
  }
  writeProbeCache(fingerprint);
  return fingerprint;
}

let memoizedProfile: SystemProfile | undefined;

/**
 * Profile the active system hardware and software capabilities.
 */
export function getSystemProfile(): SystemProfile {
  memoizedProfile ??= computeSystemProfile();
  return memoizedProfile;
}

function computeSystemProfile(): SystemProfile {
  const platform = process.platform;
  const archStr = process.arch;

  let os: "windows" | "macos" | "linux" | "unknown" = "unknown";
  if (platform === "win32") os = "windows";
  else if (platform === "darwin") os = "macos";
  else if (platform === "linux") os = "linux";

  let arch: "x64" | "arm64" | "unknown" = "unknown";
  if (archStr === "x64") arch = "x64";
  else if (archStr === "arm64") arch = "arm64";

  const localAiHardware = classifyLocalAiHardware(
    probeHardwareFingerprint(platform, archStr),
  );
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
