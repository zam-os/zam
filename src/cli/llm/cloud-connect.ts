/**
 * Cloud provider connect flow (ADR 2026-07-24 §5): the shared implementation
 * behind the onboarding model page (`zam bridge cloud-connect`) and the
 * `zam init` cloud path, so the two front-ends cannot drift.
 *
 * Sequence: verify the pasted key against the provider's authenticated
 * key-metadata endpoint → store it under the descriptor's credential ref →
 * upsert the default model as a cloud registry entry (idempotent: an existing
 * entry for the same endpoint+model is updated in place, never duplicated) →
 * probe + validate like every other registry save → flip `llm.enabled`.
 */

import { ulid } from "ulid";
import {
  type Database,
  emptyCapabilityFlags,
  type ModelEntry,
  setProviderApiKey,
  setSetting,
} from "../../kernel/index.js";
import {
  type CapabilityProbeResult,
  probeModelCapabilities,
  validateModelSave,
} from "./capability-probe.js";
import {
  type CloudProviderDescriptor,
  getCloudProvider,
  OPENROUTER_LEGACY_DEFAULT_MODELS,
} from "./cloud-providers.js";
import {
  loadModelRegistry,
  type ResolvedModelEntry,
  saveModelRegistry,
} from "./model-registry.js";

/**
 * OpenRouter embedding model registered alongside the chat default so every
 * client of a shared database (desktop + mobile) resolves the same vectors.
 * Must stay aligned with `CLOUD_EMBEDDING_MODEL` in `mobile/src/ai/connect.ts`.
 */
export const OPENROUTER_EMBEDDING_MODEL = "qwen/qwen3-embedding-4b";

const OPENROUTER_EMBEDDING_LEGACY_MODELS = [
  "qwen/qwen3-embedding-0.6b",
  "qwen/qwen3-embedding-0.6b:free",
] as const;

export interface CloudKeyCheck {
  valid: boolean;
  /** Human-readable reason when invalid (never echoes the key). */
  reason?: string;
}

/**
 * Verify an API key against the provider's authenticated key-metadata
 * endpoint (OpenRouter: GET /auth/key). 401/403 means a bad key; a network
 * failure is reported as such rather than as an invalid key.
 */
export async function verifyCloudProviderKey(
  descriptor: CloudProviderDescriptor,
  apiKey: string,
): Promise<CloudKeyCheck> {
  let res: Response;
  try {
    res = await fetch(`${descriptor.baseUrl}${descriptor.keyCheckPath}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return {
      valid: false,
      reason: `${descriptor.label} is unreachable — check your connection and retry.`,
    };
  }
  if (res.ok) return { valid: true };
  if (res.status === 401 || res.status === 403) {
    return {
      valid: false,
      reason: `${descriptor.label} rejected the key (HTTP ${res.status}). Paste the key exactly as created.`,
    };
  }
  return {
    valid: false,
    reason: `${descriptor.label} answered HTTP ${res.status} while verifying the key.`,
  };
}

export interface CloudConnectResult {
  ok: boolean;
  error?: string;
  /** Present on success. */
  entry?: ModelEntry;
  /** True when a new registry entry was created (false = updated in place). */
  created?: boolean;
}

export interface CloudConnectDeps {
  probe: typeof probeModelCapabilities;
  verifyKey: typeof verifyCloudProviderKey;
  /** Persist the key under the credential ref (tests inject a recorder). */
  storeKey: (ref: string, apiKey: string) => void;
}

export async function connectCloudProvider(
  db: Database,
  providerId: string,
  apiKey: string,
  deps: CloudConnectDeps = {
    probe: probeModelCapabilities,
    verifyKey: verifyCloudProviderKey,
    storeKey: setProviderApiKey,
  },
): Promise<CloudConnectResult> {
  const descriptor = getCloudProvider(providerId);
  if (!descriptor) {
    return { ok: false, error: `Unknown cloud provider: ${providerId}` };
  }
  const key = apiKey.trim();
  if (!key) return { ok: false, error: "No API key provided." };

  const check = await deps.verifyKey(descriptor, key);
  if (!check.valid) {
    return { ok: false, error: check.reason ?? "The API key is not valid." };
  }
  deps.storeKey(descriptor.apiKeyRef, key);

  let models = await loadModelRegistry(db);

  // Drop former ZAM defaults for this provider so they cannot sit ahead of the
  // working row (slow reasoning models, retired embedding catalogue entries).
  if (descriptor.id === "openrouter") {
    const dropChat = new Set<string>(OPENROUTER_LEGACY_DEFAULT_MODELS);
    dropChat.delete(descriptor.defaultModel);
    const dropEmbed = new Set<string>(OPENROUTER_EMBEDDING_LEGACY_MODELS);
    dropEmbed.delete(OPENROUTER_EMBEDDING_MODEL);
    models = models.filter((entry) => {
      if (entry.url !== descriptor.baseUrl) return true;
      if (dropChat.has(entry.model) && entry.capabilities?.text) return false;
      if (dropEmbed.has(entry.model) && entry.capabilities?.embedding) {
        return false;
      }
      return true;
    });
  }

  const existing = models.find(
    (entry) =>
      entry.url === descriptor.baseUrl &&
      entry.model === descriptor.defaultModel,
  );

  const capabilities = emptyCapabilityFlags();
  for (const capability of descriptor.capabilities) {
    capabilities[capability] = true;
  }
  const candidate: ModelEntry = {
    id: existing?.id ?? ulid(),
    label: existing?.label ?? descriptor.label,
    url: descriptor.baseUrl,
    model: descriptor.defaultModel,
    local: false,
    apiFlavor: "chat-completions",
    apiKeyRef: descriptor.apiKeyRef,
    order: 0,
    capabilities,
    detectedCapabilities:
      existing?.detectedCapabilities ?? emptyCapabilityFlags(),
  };

  const probe: CapabilityProbeResult = await deps.probe(candidate, {});
  const validation = validateModelSave(candidate, probe);
  const saved = validation.entry;
  if (!validation.ok || !saved) {
    return {
      ok: false,
      error: validation.error ?? "Model could not be saved.",
    };
  }

  // The row goes to the database (it is a hosted endpoint), and carries the key
  // with it so every client of this learner can call it — an `apiKeyRef` points
  // into a credentials file on this machine and means nothing to a phone
  // (ADR 2026-07-23). The ref is kept as well, so the desktop still resolves if
  // the shared row is ever cleared.
  const shared: ResolvedModelEntry = { ...saved, apiKey: key, order: 0 };
  let next = existing
    ? models.map((entry) => (entry.id === existing.id ? shared : entry))
    : [...models, shared];

  // Same OpenRouter key serves embeddings; register a second row so desktop and
  // mobile resolve `embedding` to a real embedding model, not the chat model.
  if (descriptor.id === "openrouter") {
    const embedExisting = next.find(
      (entry) =>
        entry.url === descriptor.baseUrl &&
        entry.model === OPENROUTER_EMBEDDING_MODEL,
    );
    const embedFlags = emptyCapabilityFlags();
    embedFlags.embedding = true;
    const embedRow: ResolvedModelEntry = {
      id: embedExisting?.id ?? ulid(),
      label: descriptor.label,
      url: descriptor.baseUrl,
      model: OPENROUTER_EMBEDDING_MODEL,
      local: false,
      apiFlavor: "chat-completions",
      apiKeyRef: descriptor.apiKeyRef,
      apiKey: key,
      order: 1,
      capabilities: embedFlags,
      // Confirmed by catalogue membership, not a chat probe: probing an
      // embedding model through chat-completions would report no text and
      // wipe the flag we need.
      detectedCapabilities: { ...embedFlags },
      probedAt: new Date().toISOString(),
    };
    next = embedExisting
      ? next.map((entry) => (entry.id === embedExisting.id ? embedRow : entry))
      : [...next, embedRow];
  }

  // Keep the freshly connected models first without scrambling foreign rows.
  let order = 2;
  next = next.map((entry) => {
    if (
      entry.url === descriptor.baseUrl &&
      (entry.model === descriptor.defaultModel ||
        entry.model === OPENROUTER_EMBEDDING_MODEL)
    ) {
      return entry;
    }
    return { ...entry, order: order++ };
  });

  await saveModelRegistry(db, next);

  // The registry path is gated on llm.enabled for recall/text (client.ts);
  // connecting a working cloud model is exactly the moment to open that gate.
  // llm.vision.enabled stays untouched — it doubles as the screen-capture
  // consent gate and is a deliberate, separate opt-in.
  await setSetting(db, "llm.enabled", "true");

  return { ok: true, entry: validation.entry, created: !existing };
}
