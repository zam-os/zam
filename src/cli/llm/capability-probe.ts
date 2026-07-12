/**
 * Capability detection for the unified model registry (ADR 2026-07-12, phase 2).
 *
 * CLI-layer HTTP only (kernel stays AI-agnostic). On add / edit / re-probe we
 * query endpoint metadata — primarily the OpenAI `/v1/models` catalog plus
 * model-family heuristics — and never run functional text/vision smoke tests.
 * The one documented exception is an optional single `/v1/embeddings` dimension
 * probe when the catalog is silent about embeddings.
 *
 * The classification step is a pure function so it is deterministic and unit-
 * testable without a live endpoint; `probeModelCapabilities` is the thin HTTP
 * wrapper around it.
 */

import {
  type CapabilityFlags,
  emptyCapabilityFlags,
  getProviderApiKey,
  type ModelEntry,
} from "../../kernel/index.js";
import {
  DEFAULT_LLM_API_KEY,
  getAvailableModels,
  isLlmOnline,
} from "./client.js";
import { embedTexts } from "./embedder.js";

/** Model-name fragments that mark an embeddings model. */
const EMBEDDING_MODEL_HINTS = [
  "embed",
  "text-embedding",
  "bge-",
  "gte-",
  "nomic",
  "mxbai",
];

/** Model-name fragments that mark a multimodal (image-capable) chat model. */
const VISION_MODEL_HINTS = [
  "vision",
  "-vl",
  "vl-",
  "vlm",
  "llava",
  "gpt-4o",
  "gpt-4.1",
  "gpt-5",
  "gemini",
  "pixtral",
  "minicpm-v",
  "internvl",
  "moondream",
  "llama-3.2",
  "llama3.2",
];

function matchesAny(id: string, hints: string[]): boolean {
  const lower = id.toLowerCase();
  return hints.some((hint) => lower.includes(hint));
}

function catalogHasModel(catalog: string[], model: string): boolean {
  const lower = model.toLowerCase();
  return catalog.some((id) => id.toLowerCase() === lower);
}

/** What `probeModelCapabilities` learned about an endpoint. */
export interface CapabilityProbeResult {
  /** Whether the endpoint answered at all (drives the offline-save guard). */
  reachable: boolean;
  /** Model ids the endpoint advertised (`/v1/models`), when any. */
  catalog: string[];
  /** Capabilities the metadata actually supports. */
  detected: CapabilityFlags;
}

/**
 * Classify capabilities from endpoint metadata alone — no network. `catalog` is
 * the `/v1/models` list (empty + `catalogKnown=false` means the endpoint served
 * no catalog, common for single-model local runners). `dimProbeEmbedding`
 * records the outcome of the optional embeddings dimension probe (see below).
 */
export function classifyCapabilities(
  entry: Pick<ModelEntry, "model" | "apiFlavor">,
  catalog: string[],
  catalogKnown: boolean,
  dimProbeEmbedding = false,
): CapabilityFlags {
  const detected = emptyCapabilityFlags();

  // Anthropic Messages API: text + image (vision) only — no OpenAI-shaped
  // embedding or audio routes.
  if (entry.apiFlavor === "anthropic-messages") {
    detected.text = true;
    detected.image = true;
    return detected;
  }

  const looksEmbedding = matchesAny(entry.model, EMBEDDING_MODEL_HINTS);
  const looksVision = matchesAny(entry.model, VISION_MODEL_HINTS);
  const inCatalog = catalogHasModel(catalog, entry.model);

  detected.embedding = looksEmbedding || dimProbeEmbedding;
  detected.image = looksVision;
  // A chat-completions endpoint serves text unless the model is embedding-only.
  // When the catalog is silent (single-model local server) we cannot disprove
  // text, so we trust the chat-completions flavor.
  detected.text = !detected.embedding && (inCatalog || !catalogKnown);
  return detected;
}

function resolveApiKey(apiKeyRef?: string): string {
  if (!apiKeyRef) return DEFAULT_LLM_API_KEY;
  return getProviderApiKey(apiKeyRef) ?? DEFAULT_LLM_API_KEY;
}

/**
 * Probe an endpoint's capabilities over HTTP. Metadata-only by default; when
 * the catalog is silent about embeddings and `embeddingDimProbe` is set, makes
 * one cheap `/v1/embeddings` call to confirm (the documented exception).
 */
export async function probeModelCapabilities(
  entry: Pick<ModelEntry, "url" | "model" | "apiFlavor" | "apiKeyRef">,
  opts: { embeddingDimProbe?: boolean } = {},
): Promise<CapabilityProbeResult> {
  const apiKey = resolveApiKey(entry.apiKeyRef);

  // Anthropic: we cannot cheaply enumerate the catalog; reachability alone
  // decides, and classification is fixed to text+image.
  if (entry.apiFlavor === "anthropic-messages") {
    const online = await isLlmOnline(entry.url);
    return {
      reachable: online,
      catalog: [],
      detected: classifyCapabilities(entry, [], false),
    };
  }

  const online = await isLlmOnline(entry.url);
  if (!online) {
    return { reachable: false, catalog: [], detected: emptyCapabilityFlags() };
  }

  const catalog = await getAvailableModels(entry.url, apiKey);
  const catalogKnown = catalog.length > 0;

  let dimProbeEmbedding = false;
  const looksEmbedding = matchesAny(entry.model, EMBEDDING_MODEL_HINTS);
  if (opts.embeddingDimProbe && !catalogKnown && !looksEmbedding) {
    try {
      const [vector] = await embedTexts(
        { url: entry.url, model: entry.model, apiKey },
        ["capability probe"],
      );
      dimProbeEmbedding = Array.isArray(vector) && vector.length > 0;
    } catch {
      dimProbeEmbedding = false;
    }
  }

  return {
    reachable: true,
    catalog,
    detected: classifyCapabilities(
      entry,
      catalog,
      catalogKnown,
      dimProbeEmbedding,
    ),
  };
}

/**
 * Reconcile user-selected capabilities against a fresh probe: keep only the
 * flags the user wants AND the probe detected (ADR save rule 1 — auto-uncheck
 * unsupported). The only-shrink-until-reprobe rule is enforced by callers that
 * offer the checkbox ceiling; this function is the final intersection.
 */
export function reconcileCapabilities(
  userSelected: CapabilityFlags,
  detected: CapabilityFlags,
): CapabilityFlags {
  const result = emptyCapabilityFlags();
  for (const key of Object.keys(result) as (keyof CapabilityFlags)[]) {
    result[key] = userSelected[key] && detected[key];
  }
  return result;
}

export interface ModelSaveValidation {
  ok: boolean;
  error?: string;
  /** The reconciled entry to persist, present only when `ok`. */
  entry?: ModelEntry;
}

/**
 * Apply the ADR save rules to a would-be registry entry using a fresh probe:
 * block when the endpoint is unreachable (rule 2 — no persisting unreachable
 * capabilities), otherwise stamp `detectedCapabilities`/`probedAt` and shrink
 * `capabilities` to the detected intersection (rule 1).
 */
export function validateModelSave(
  entry: ModelEntry,
  probe: CapabilityProbeResult,
  now: () => string = () => new Date().toISOString(),
): ModelSaveValidation {
  if (!probe.reachable) {
    return {
      ok: false,
      error:
        "Endpoint is unreachable — cannot verify capabilities. Bring it online and retry.",
    };
  }
  return {
    ok: true,
    entry: {
      ...entry,
      capabilities: reconcileCapabilities(entry.capabilities, probe.detected),
      detectedCapabilities: probe.detected,
      probedAt: now(),
    },
  };
}
