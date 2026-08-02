/**
 * Local vision enhancement backed by Ollama.
 *
 * Foundry Local is a strong on-device text runtime on Windows, but the
 * currently available service does not reliably accept image input through its
 * OpenAI-shaped endpoint. Ollama's native chat endpoint does, so this module
 * owns the deliberately separate, learner-facing picture-analysis setup.
 */

import { execFileSync } from "node:child_process";
import { ulid } from "ulid";
import {
  type Database,
  emptyCapabilityFlags,
  getSystemProfile,
  isOllamaInstalled,
  type ModelEntry,
  resolveOllamaCommand,
  setSetting,
  supportsLocalGeneration,
} from "../../kernel/index.js";
import {
  probeModelCapabilities,
  validateModelSave,
} from "./capability-probe.js";
import {
  getAvailableModels,
  isLlmOnline,
  resolveCapability,
} from "./client.js";
import { OLLAMA_BASE_URL, OLLAMA_DOWNLOAD_URL } from "./local-embedding.js";
import {
  loadModelRegistry,
  promoteModelToPrimary,
  saveModelRegistry,
} from "./model-registry.js";

/** Compact enough for ordinary PCs while retaining reliable OCR and UI vision. */
export const DEFAULT_LOCAL_VISION_MODEL = "qwen3-vl:4b";
const OLLAMA_VISION_LABEL = "Ollama Qwen3-VL 4B";

function isRecommendedVisionTag(id: string): boolean {
  return id.trim().toLowerCase() === DEFAULT_LOCAL_VISION_MODEL;
}

export interface LocalVisionStatus {
  ollamaInstalled: boolean;
  serverOnline: boolean;
  modelPresent: boolean;
  /** A Qwen3-VL 4B Ollama entry exists in the machine-local registry. */
  registered: boolean;
  /** This machine has an NPU or discrete GPU, so local vision is worth offering. */
  accelerated: boolean;
  /** The enabled image role resolves to that live local endpoint. */
  usable: boolean;
}

export interface LocalVisionDeps {
  isInstalled: () => boolean;
  isOnline: (url: string) => Promise<boolean>;
  listModels: (url: string) => Promise<string[]>;
  pullModel: (model: string) => void;
  isAccelerated: () => boolean;
  probe: typeof probeModelCapabilities;
}

function defaultDeps(): LocalVisionDeps {
  return {
    isInstalled: () => isOllamaInstalled(),
    isOnline: (url) => isLlmOnline(url),
    listModels: (url) => getAvailableModels(url),
    pullModel: (model) => {
      const command = resolveOllamaCommand();
      if (!command) {
        throw new Error(
          "Ollama's command is not available yet — restart, then retry.",
        );
      }
      // Keep bridge stdout pure JSON while Ollama renders download progress.
      execFileSync(command, ["pull", model], { stdio: "pipe" });
    },
    isAccelerated: () =>
      supportsLocalGeneration(getSystemProfile().localAiAcceleration),
    probe: probeModelCapabilities,
  };
}

export async function getLocalVisionStatus(
  db: Database,
  deps: LocalVisionDeps = defaultDeps(),
): Promise<LocalVisionStatus> {
  const ollamaInstalled = deps.isInstalled();
  const serverOnline =
    ollamaInstalled && (await deps.isOnline(OLLAMA_BASE_URL));
  const modelPresent =
    serverOnline &&
    (await deps.listModels(OLLAMA_BASE_URL)).some(isRecommendedVisionTag);
  const registered = (await loadModelRegistry(db)).some(
    (entry) =>
      entry.url === OLLAMA_BASE_URL &&
      entry.runner === "ollama" &&
      entry.capabilities.image &&
      isRecommendedVisionTag(entry.model),
  );
  const accelerated = deps.isAccelerated();
  const primary = await resolveCapability(db, "image");
  const usable =
    serverOnline &&
    modelPresent &&
    primary?.enabled === true &&
    primary.runner === "ollama" &&
    isRecommendedVisionTag(primary.model);
  return {
    ollamaInstalled,
    serverOnline,
    modelPresent,
    registered,
    accelerated,
    usable,
  };
}

export interface EnableLocalVisionResult {
  ok: boolean;
  error?: string;
  /** True when the learner needs to install Ollama before retrying. */
  needsOllama?: boolean;
  /** True when the vision model was downloaded during this call. */
  pulled?: boolean;
  status: LocalVisionStatus;
}

function disableLegacyFoundryVision(entry: ModelEntry): ModelEntry {
  // Earlier preview setup offered this exact entry. Preserve it for text use,
  // but never retain it as an image fallback after the native Ollama path is
  // chosen: an unavailable image transport must not become a silent fallback.
  if (entry.runner !== "foundry" || entry.label !== "Foundry Local Vision") {
    return entry;
  }
  return {
    ...entry,
    capabilities: { ...entry.capabilities, image: false },
  };
}

/**
 * Pull and register Qwen3-VL 4B for private screenshot/image analysis.
 *
 * This deliberately does not install or start Ollama. The desktop shows a
 * clear installation action first, while a running service gives the learner
 * one simple setup click with no model identifier to copy.
 */
export async function enableLocalVision(
  db: Database,
  deps: LocalVisionDeps = defaultDeps(),
): Promise<EnableLocalVisionResult> {
  if (!deps.isAccelerated()) {
    return {
      ok: false,
      error:
        "This computer has no supported NPU or discrete GPU, so local image analysis would be too slow to be useful. Use a cloud vision model instead.",
      status: await getLocalVisionStatus(db, deps),
    };
  }
  if (!deps.isInstalled()) {
    return {
      ok: false,
      needsOllama: true,
      error: `Ollama is not installed. Install it from ${OLLAMA_DOWNLOAD_URL}, then retry.`,
      status: await getLocalVisionStatus(db, deps),
    };
  }
  if (!(await deps.isOnline(OLLAMA_BASE_URL))) {
    return {
      ok: false,
      error:
        "Ollama is installed but its server is not running. Start Ollama, then retry.",
      status: await getLocalVisionStatus(db, deps),
    };
  }

  let pulled = false;
  let available = await deps.listModels(OLLAMA_BASE_URL);
  if (!available.some(isRecommendedVisionTag)) {
    try {
      deps.pullModel(DEFAULT_LOCAL_VISION_MODEL);
      pulled = true;
      available = await deps.listModels(OLLAMA_BASE_URL);
    } catch (error) {
      return {
        ok: false,
        error: `Could not download ${DEFAULT_LOCAL_VISION_MODEL}: ${(error as Error).message}`,
        status: await getLocalVisionStatus(db, deps),
      };
    }
  }

  const wireModel =
    available.find(isRecommendedVisionTag) ?? DEFAULT_LOCAL_VISION_MODEL;
  const models = await loadModelRegistry(db);
  const existing = models.find(
    (entry) =>
      entry.url === OLLAMA_BASE_URL &&
      entry.runner === "ollama" &&
      isRecommendedVisionTag(entry.model),
  );
  const capabilities = emptyCapabilityFlags();
  capabilities.image = true;
  const candidate: ModelEntry = {
    id: existing?.id ?? ulid(),
    label: existing?.label ?? OLLAMA_VISION_LABEL,
    url: OLLAMA_BASE_URL,
    model: wireModel,
    local: true,
    apiFlavor: "chat-completions",
    runner: "ollama",
    order: existing?.order ?? models.length,
    capabilities,
    detectedCapabilities:
      existing?.detectedCapabilities ?? emptyCapabilityFlags(),
  };

  const probe = await deps.probe(candidate);
  const validation = validateModelSave(candidate, probe);
  const saved = validation.entry;
  if (!validation.ok || !saved) {
    return {
      ok: false,
      error: validation.error ?? "Vision model could not be saved.",
      status: await getLocalVisionStatus(db, deps),
    };
  }

  const withVision = existing
    ? models.map((entry) => (entry.id === existing.id ? saved : entry))
    : [...models, saved];
  const next = promoteModelToPrimary(
    withVision.map(disableLegacyFoundryVision),
    saved.id,
  );
  await saveModelRegistry(db, next);
  await setSetting(db, "llm.vision.enabled", "true");

  return {
    ok: true,
    pulled,
    status: await getLocalVisionStatus(db, deps),
  };
}
