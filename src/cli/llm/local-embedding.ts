/**
 * Local embedding enhancement (ADR 2026-07-24 §5a): the shared flow behind
 * the onboarding model page's "make search understand meaning" control and
 * the `zam bridge embedding-enable` command.
 *
 * Embeddings are local-only by decision — the `embedding` role never rides a
 * cloud key, because embeddings run over the learner's actual study text and
 * computing them on-device means that text never leaves the machine. The
 * canonical model is EmbeddingGemma served by Ollama on the desktop; enabling
 * is optional and off the blocking first-run path (semantic search degrades
 * to lexical without it).
 *
 * Honesty rules: ZAM does not install Ollama from this flow and does not
 * start its server — both states are reported so the UI can guide the user;
 * the only automated step is pulling the small embedding model when the
 * server is already running.
 */

import { execFileSync } from "node:child_process";
import { ulid } from "ulid";
import {
  type Database,
  emptyCapabilityFlags,
  isOllamaInstalled,
  type ModelEntry,
  resolveOllamaCommand,
  setSetting,
} from "../../kernel/index.js";
import {
  probeModelCapabilities,
  validateModelSave,
} from "./capability-probe.js";
import { getAvailableModels, isLlmOnline } from "./client.js";
import {
  DEFAULT_EMBEDDING_MODEL,
  resolveUsableEmbeddingEndpoint,
} from "./embedder.js";
import { loadModelRegistry, saveModelRegistry } from "./model-registry.js";

export const OLLAMA_BASE_URL = "http://localhost:11434/v1";
export const OLLAMA_DOWNLOAD_URL = "https://ollama.com/download";
const OLLAMA_EMBEDDING_LABEL = "Ollama EmbeddingGemma";

/** Ollama tags carry a `:latest`/`:300m` suffix; compare the base name. */
function isEmbeddingGemmaTag(id: string): boolean {
  const base = id.trim().toLowerCase().split(":")[0];
  return base === "embeddinggemma" || base === "embed-gemma";
}

export interface LocalEmbeddingStatus {
  ollamaInstalled: boolean;
  serverOnline: boolean;
  modelPresent: boolean;
  /** An embedding-capable Ollama entry exists in the model registry. */
  registered: boolean;
  /** The embedding role resolves to a live endpoint right now. */
  usable: boolean;
}

export interface LocalEmbeddingDeps {
  isInstalled: () => boolean;
  isOnline: (url: string) => Promise<boolean>;
  listModels: (url: string) => Promise<string[]>;
  pullModel: (model: string) => void;
  probe: typeof probeModelCapabilities;
}

function defaultDeps(): LocalEmbeddingDeps {
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
      // stdio "pipe", never "inherit": this runs inside `zam bridge`, whose
      // stdout must stay pure JSON — ollama's progress bars would corrupt it.
      execFileSync(command, ["pull", model], { stdio: "pipe" });
    },
    probe: probeModelCapabilities,
  };
}

export async function getLocalEmbeddingStatus(
  db: Database,
  deps: LocalEmbeddingDeps = defaultDeps(),
): Promise<LocalEmbeddingStatus> {
  const ollamaInstalled = deps.isInstalled();
  const serverOnline =
    ollamaInstalled && (await deps.isOnline(OLLAMA_BASE_URL));
  const modelPresent =
    serverOnline &&
    (await deps.listModels(OLLAMA_BASE_URL)).some(isEmbeddingGemmaTag);
  const registered = (await loadModelRegistry(db)).some(
    (entry) => entry.url === OLLAMA_BASE_URL && entry.capabilities.embedding,
  );
  const usable = (await resolveUsableEmbeddingEndpoint(db)) !== null;
  return { ollamaInstalled, serverOnline, modelPresent, registered, usable };
}

export interface EnableLocalEmbeddingResult {
  ok: boolean;
  error?: string;
  /** True when the missing piece is the Ollama install itself. */
  needsOllama?: boolean;
  /** True when the embedding model was pulled during this call. */
  pulled?: boolean;
  status: LocalEmbeddingStatus;
}

/**
 * Enable local semantic search: ensure the EmbeddingGemma model is present in
 * a running Ollama, register it as a local `embedding` registry entry
 * (idempotent — the existing entry is updated in place), and open the
 * `llm.enabled` gate the embedding role resolution rides on.
 */
export async function enableLocalEmbedding(
  db: Database,
  deps: LocalEmbeddingDeps = defaultDeps(),
): Promise<EnableLocalEmbeddingResult> {
  if (!deps.isInstalled()) {
    return {
      ok: false,
      needsOllama: true,
      error: `Ollama is not installed. Install it from ${OLLAMA_DOWNLOAD_URL}, then retry.`,
      status: await getLocalEmbeddingStatus(db, deps),
    };
  }
  if (!(await deps.isOnline(OLLAMA_BASE_URL))) {
    return {
      ok: false,
      error:
        "Ollama is installed but its server is not running. Start Ollama, then retry.",
      status: await getLocalEmbeddingStatus(db, deps),
    };
  }

  let pulled = false;
  let available = await deps.listModels(OLLAMA_BASE_URL);
  if (!available.some(isEmbeddingGemmaTag)) {
    try {
      deps.pullModel(DEFAULT_EMBEDDING_MODEL);
      pulled = true;
      available = await deps.listModels(OLLAMA_BASE_URL);
    } catch (err) {
      return {
        ok: false,
        error: `Could not download ${DEFAULT_EMBEDDING_MODEL}: ${(err as Error).message}`,
        status: await getLocalEmbeddingStatus(db, deps),
      };
    }
  }

  // Register under the tag Ollama actually advertises (`embeddinggemma:latest`)
  // rather than the bare default: the embedding-role resolver checks the entry
  // model against the served catalog by exact name, and the canonical-id alias
  // map (embedder.ts) folds every tag back to `embeddinggemma-300m` for stored
  // vectors, so cross-machine compatibility is unaffected.
  const wireModel =
    available.find(isEmbeddingGemmaTag) ?? DEFAULT_EMBEDDING_MODEL;

  const models = await loadModelRegistry(db);
  const existing = models.find(
    (entry) =>
      entry.url === OLLAMA_BASE_URL && isEmbeddingGemmaTag(entry.model),
  );
  const capabilities = emptyCapabilityFlags();
  capabilities.embedding = true;
  const candidate: ModelEntry = {
    id: existing?.id ?? ulid(),
    label: existing?.label ?? OLLAMA_EMBEDDING_LABEL,
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

  const probe = await deps.probe(candidate, { embeddingDimProbe: true });
  const validation = validateModelSave(candidate, probe);
  const saved = validation.entry;
  if (!validation.ok || !saved) {
    return {
      ok: false,
      error: validation.error ?? "Embedding model could not be saved.",
      status: await getLocalEmbeddingStatus(db, deps),
    };
  }

  const next = existing
    ? models.map((entry) => (entry.id === existing.id ? saved : entry))
    : [...models, saved];
  await saveModelRegistry(db, next);

  // The embedding role resolution is gated on llm.enabled like recall/text
  // (client.ts resolveCapability); without this, a registered embedder would
  // resolve as disabled. Vision's separate consent gate stays untouched.
  await setSetting(db, "llm.enabled", "true");

  return { ok: true, pulled, status: await getLocalEmbeddingStatus(db, deps) };
}
