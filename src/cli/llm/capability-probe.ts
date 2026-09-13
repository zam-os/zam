/**
 * Capability detection for the unified model registry (ADR 2026-07-12, phase 2;
 * ADR 2026-09-13).
 *
 * CLI-layer HTTP only (kernel stays AI-agnostic). On add / edit / re-probe we
 * query endpoint metadata — primarily the OpenAI `/v1/models` catalog plus
 * model-family heuristics — and never run functional text/vision smoke tests.
 * Two documented exceptions, both optional single calls: a `/v1/embeddings`
 * dimension probe when the catalog is silent about embeddings, and a
 * reasoning-effort probe (one tiny chat call) that learns which reasoning
 * level the endpoint accepts for evaluation.
 *
 * The classification step is a pure function so it is deterministic and unit-
 * testable without a live endpoint; `probeModelCapabilities` is the thin HTTP
 * wrapper around it.
 */

import {
  ALL_CAPABILITIES,
  type CapabilityFlags,
  embeddingsEndpointUrl,
  emptyCapabilityFlags,
  getProviderApiKey,
  type ModelEntry,
} from "../../kernel/index.js";
import {
  DEFAULT_LLM_API_KEY,
  getAvailableModelEntries,
  getAvailableModels,
  isOpenRouterUrl,
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
  // Foundry Local labels its newer multimodal Qwen family `qwen3.5-*`; the
  // text-only sibling is explicitly suffixed `-text` and is excluded below.
  "qwen3.5-",
  // Xiaomi MiMo(-VL) is multimodal; the plain "mimo-v*" tag carries no "-vl".
  "mimo",
];

/**
 * Model-name fragments that mark a speech-to-text model (ADR 2026-07-31).
 * Deliberately narrow: a false positive here would offer the learner a cloud
 * transcription path that 400s on the first spoken answer.
 */
const STT_MODEL_HINTS = [
  "whisper",
  "transcribe",
  "-stt",
  "stt-",
  "speech-to-text",
  "parakeet",
  "distil-whisper",
];

/** Model-name fragments that mark a text-to-speech model (ADR 2026-07-31). */
const TTS_MODEL_HINTS = [
  "-tts",
  "tts-",
  "text-to-speech",
  "speecht5",
  "kokoro",
  "piper",
  "xtts",
  "bark",
];

function matchesAny(id: string, hints: string[]): boolean {
  const lower = id.toLowerCase();
  return hints.some((hint) => lower.includes(hint));
}

function catalogHasModel(catalog: string[], model: string): boolean {
  const lower = model.toLowerCase();
  return catalog.some((id) => id.toLowerCase() === lower);
}

/**
 * The rest of a provider's catalogue, for a model the main listing omits.
 *
 * `/models` is not always the whole story. OpenRouter answers it with its
 * text models only: embedding ids live at `{base}/embeddings/models`, and
 * speech ids appear only behind a modality filter. A model missing from the
 * main listing is otherwise treated as one the endpoint does not offer, which
 * makes `validateModelSave` refuse to store the row at all — so a working
 * transcription or embedding model could not be added, nor even renamed.
 *
 * Asked only for a model whose *name* suggests a modality, and only after the
 * main listing came back without it, so an ordinary chat probe still costs one
 * request. An endpoint that does not know these paths or parameters answers
 * with nothing, or with its normal list, and the verdict is unchanged.
 */
async function modalityCatalogue(
  entry: Pick<ModelEntry, "url" | "model">,
  apiKey: string,
  looksEmbedding: boolean,
): Promise<string[]> {
  if (looksEmbedding) {
    const embeddingsUrl = embeddingsEndpointUrl(entry.url);
    if (embeddingsUrl === entry.url) return [];
    return getAvailableModels(embeddingsUrl, apiKey);
  }
  if (matchesAny(entry.model, STT_MODEL_HINTS)) {
    return getAvailableModels(
      entry.url,
      apiKey,
      "?output_modalities=transcription",
    );
  }
  if (matchesAny(entry.model, TTS_MODEL_HINTS)) {
    return getAvailableModels(entry.url, apiKey, "?output_modalities=speech");
  }
  return [];
}

/** What `probeModelCapabilities` learned about an endpoint. */
export interface CapabilityProbeResult {
  /** Whether the endpoint answered at all (drives the offline-save guard). */
  reachable: boolean;
  /** Model ids the endpoint advertised (`/v1/models`), when any. */
  catalog: string[];
  /** Capabilities the metadata actually supports. */
  detected: CapabilityFlags;
  /**
   * The reasoning-effort level the endpoint accepted during the optional
   * effort probe: "none" when the control is honored, "minimal" when the
   * model mandates reasoning at the lowest level. Absent = no verdict; the
   * row keeps its stored setting.
   */
  effort?: "none" | "minimal";
  /**
   * Verdict of the key-validity check, when the provider publishes a
   * key-metadata endpoint (OpenRouter `/auth/key`): true = the stored key
   * authenticated, false = rejected. Absent = no such endpoint or no verdict.
   */
  keyValid?: boolean;
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
  /**
   * What the endpoint's own architecture metadata says about this exact model
   * id: true declares the modality, false declares it absent, undefined means
   * the endpoint publishes no modalities. Declared metadata wins; the name
   * hints below only cover endpoints that publish none.
   */
  catalogImage?: boolean,
  catalogVideo?: boolean,
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
  const looksVision =
    matchesAny(entry.model, VISION_MODEL_HINTS) &&
    !entry.model.toLowerCase().includes("-text");
  const inCatalog = catalogHasModel(catalog, entry.model);

  const looksStt = matchesAny(entry.model, STT_MODEL_HINTS);
  const looksTts = matchesAny(entry.model, TTS_MODEL_HINTS);

  detected.embedding = looksEmbedding || dimProbeEmbedding;
  // Name hints age badly: `z-ai/glm-5.3-flash` and
  // `deepseek/deepseek-v4.1-flash` are vision-capable per catalog but matched
  // no hint, so every re-probe unchecked the learner's Vision box
  // (reported 2026-09-13) — while `gpt-5.6-luna` kept it on the bare "gpt-5"
  // substring. Where the catalog declares modalities, that answer beats the
  // substring guess in both directions. Video is metadata-only: video input is
  // rare and no name heuristic is worth a false positive, so endpoints without
  // architecture metadata never report it.
  detected.image = catalogImage ?? looksVision;
  detected.video = catalogVideo ?? false;
  // Speech is claimed from the model *name*, so it must be checked against the
  // provider's own catalog exactly as text is. Without that gate a name that
  // merely looks like a speech model — `mimo-v2.5-tts`, which Xiaomi does not
  // serve — was accepted, and the misconfiguration only surfaced mid-review as
  // a 404 from the gateway (reported 2026-08-01). An endpoint that publishes no
  // catalog is trusted, as everywhere else.
  detected.stt = looksStt && (inCatalog || !catalogKnown);
  detected.tts = looksTts && (inCatalog || !catalogKnown);
  // A chat-completions endpoint serves text unless it is a single-purpose
  // embedding or audio model. Audio models answer on /audio/*, not /chat, so
  // offering them for text would break recall coaching.
  detected.text =
    !detected.embedding &&
    !looksStt &&
    !looksTts &&
    (inCatalog || !catalogKnown);
  return detected;
}

function resolveApiKey(apiKeyRef?: string): string {
  if (!apiKeyRef) return DEFAULT_LLM_API_KEY;
  return getProviderApiKey(apiKeyRef) ?? DEFAULT_LLM_API_KEY;
}

/**
 * Learn which reasoning-effort level the endpoint accepts, with one tiny chat
 * call per level (the second documented probe exception, ADR 2026-09-13). The
 * reply is discarded — only the status matters: `none` honored → "none" (the
 * evaluation's cheapest setting); `none` rejected with a 400 → try "minimal",
 * which reasoning-mandatory models (GLM-5.3-Flash) keep reasoning at the
 * lowest level; anything else (other statuses, network errors) → no verdict,
 * so the row keeps its stored setting and the evaluation's 400 retry remains
 * the safety net.
 */
async function probeReasoningEffort(
  entry: Pick<ModelEntry, "url" | "model" | "apiKeyRef">,
  apiKey: string,
): Promise<"none" | "minimal" | undefined> {
  const attempt = async (effort: "none" | "minimal"): Promise<number> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${entry.url}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: entry.model,
          messages: [{ role: "user", content: "Reply with: OK" }],
          max_tokens: 16,
          reasoning: { effort },
        }),
        signal: controller.signal,
      });
      await res.text().catch(() => "");
      return res.status;
    } catch {
      return 0;
    } finally {
      clearTimeout(timeoutId);
    }
  };
  const noneStatus = await attempt("none");
  if (noneStatus >= 200 && noneStatus < 300) return "none";
  if (noneStatus !== 400) return undefined;
  const minimalStatus = await attempt("minimal");
  return minimalStatus >= 200 && minimalStatus < 300 ? "minimal" : undefined;
}

/**
 * Check the stored key against the provider's key-metadata endpoint
 * (OpenRouter `/auth/key`). One authenticated GET, no tokens consumed — and
 * the only way to notice a broken key from ZAM's side, because the `/models`
 * catalog this probe otherwise relies on is public: a row with an unusable
 * key probed clean and looked healthy until the first real chat call 401'd
 * (field report 2026-09-13, a 29-character wrong paste sat undetected on a
 * row whose `keyState` said "set"). 401/403 are a definitive false; every
 * other outcome is "no verdict" so a transient failure cannot mark a good
 * key bad.
 */
export async function probeKeyValidity(
  url: string,
  apiKey: string,
): Promise<boolean | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${url}/auth/key`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    await res.text().catch(() => "");
    if (res.ok) return true;
    if (res.status === 401 || res.status === 403) return false;
    return undefined;
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Probe an endpoint's capabilities over HTTP. Metadata-only by default; two
 * optional single-call exceptions: an embeddings dimension probe when the
 * catalog is silent (`embeddingDimProbe`), and a reasoning-effort probe for
 * OpenRouter chat models (`reasoningEffortProbe`) that stores the level the
 * evaluation should send. OpenRouter rows with a stored key additionally get
 * a key-validity check (`/auth/key`), whose verdict rides along as
 * `keyValid`.
 */
export async function probeModelCapabilities(
  entry: Pick<ModelEntry, "url" | "model" | "apiFlavor" | "apiKeyRef">,
  opts: { embeddingDimProbe?: boolean; reasoningEffortProbe?: boolean } = {},
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

  const chatEntries = await getAvailableModelEntries(entry.url, apiKey);
  const chatCatalog = chatEntries.map((e) => e.id);
  const looksEmbedding = matchesAny(entry.model, EMBEDDING_MODEL_HINTS);

  const catalog = catalogHasModel(chatCatalog, entry.model)
    ? chatCatalog
    : [
        ...chatCatalog,
        ...(await modalityCatalogue(entry, apiKey, looksEmbedding)),
      ];
  const catalogKnown = catalog.length > 0;

  // Image and video come from the matched catalog record's declared
  // modalities, when the endpoint publishes them for this id; anything else
  // (record missing, metadata without modalities) leaves the name hints in
  // charge.
  const catalogEntry = chatEntries.find(
    (e) => e.id.toLowerCase() === entry.model.toLowerCase(),
  );
  const declared = catalogEntry?.inputModalities;
  const catalogImage = declared ? declared.includes("image") : undefined;
  const catalogVideo = declared ? declared.includes("video") : undefined;

  let dimProbeEmbedding = false;
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

  const detected = classifyCapabilities(
    entry,
    catalog,
    catalogKnown,
    dimProbeEmbedding,
    catalogImage,
    catalogVideo,
  );

  // Key validity is only checkable where the provider publishes a key-metadata
  // endpoint, and only for rows that store a credential of their own — the
  // default sentinel would 401 and mark every keyless row broken.
  const keyValid =
    entry.apiKeyRef &&
    apiKey !== DEFAULT_LLM_API_KEY &&
    isOpenRouterUrl(entry.url)
      ? await probeKeyValidity(entry.url, apiKey)
      : undefined;

  // The effort level matters only where the evaluation sends the control —
  // OpenRouter URLs — and only for models that actually serve chat. A key the
  // endpoint rejected cannot probe effort: every call would 401.
  const effort =
    opts.reasoningEffortProbe &&
    detected.text &&
    keyValid !== false &&
    isOpenRouterUrl(entry.url)
      ? await probeReasoningEffort(entry, apiKey)
      : undefined;

  return {
    reachable: true,
    catalog,
    detected,
    effort,
    keyValid,
  };
}

/**
 * Merge a fresh probe into a row's capability state (ADR 2026-07-12 save
 * rule 1, reworked 2026-09-13 — capabilities are *detected*, not chosen):
 *
 * - detected and previously detected → keep the user's toggle, so a choice
 *   made in the overview survives every re-probe;
 * - detected but new since the last probe → switch on. A re-probe that
 *   widens the row must not hand the learner another chore, and a fresh
 *   row (nothing detected yet) starts with everything the endpoint offers;
 * - no longer detected → off. The probe is the ceiling.
 */
export function mergeProbeCapabilities(
  previous: CapabilityFlags,
  previousDetected: CapabilityFlags,
  detected: CapabilityFlags,
): CapabilityFlags {
  const result = emptyCapabilityFlags();
  for (const key of ALL_CAPABILITIES) {
    if (!detected[key]) continue;
    result[key] = previousDetected[key] ? previous[key] === true : true;
  }
  return result;
}

export interface ModelSaveValidation {
  ok: boolean;
  error?: string;
  /** The merged entry to persist, present only when `ok`. */
  entry?: ModelEntry;
}

/**
 * Apply the ADR save rules to a would-be registry entry using a fresh probe:
 * block when the endpoint is unreachable (rule 2 — no persisting unreachable
 * capabilities), otherwise stamp `detectedCapabilities`/`probedAt` and merge
 * `capabilities` with the detection (rule 1 — see
 * {@link mergeProbeCapabilities}).
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
  // The provider published a catalog and this id is not in it. Saving anyway
  // stores a row that can only fail later, at the worst moment: a mistyped
  // `mimo-v2.5-tts` looked like a speech model, passed every check, and ended
  // a review session with a 404 from the gateway. When the endpoint says which
  // models it has, that answer beats any name heuristic.
  //
  // Hosted endpoints only. A local runner's catalog is a moving target the
  // learner controls — `enableLocalEmbedding` pulls a model and saves it in one
  // step, and the catalog it read beforehand cannot list what it just fetched.
  if (
    !entry.local &&
    probe.catalog.length > 0 &&
    !catalogHasModel(probe.catalog, entry.model)
  ) {
    const shown = probe.catalog.slice(0, 8).join(", ");
    const more =
      probe.catalog.length > 8 ? ` (+${probe.catalog.length - 8} more)` : "";
    return {
      ok: false,
      error: `The endpoint does not offer a model called "${entry.model}". It lists: ${shown}${more}.`,
    };
  }
  return {
    ok: true,
    entry: {
      ...entry,
      // The probe verdict is the freshest statement about the endpoint, so it
      // overwrites whatever level the row stored before. No verdict → keep
      // the stored level (the evaluation's retry still covers stale rows).
      ...(probe.effort ? { effort: probe.effort } : {}),
      ...(probe.keyValid !== undefined ? { keyValid: probe.keyValid } : {}),
      capabilities: mergeProbeCapabilities(
        entry.capabilities,
        entry.detectedCapabilities,
        probe.detected,
      ),
      detectedCapabilities: probe.detected,
      probedAt: now(),
    },
  };
}
