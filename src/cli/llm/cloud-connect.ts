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
} from "./cloud-providers.js";
import {
  loadModelRegistry,
  type ResolvedModelEntry,
  saveModelRegistry,
} from "./model-registry.js";

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

  const models = await loadModelRegistry(db);
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
    order: existing?.order ?? models.length,
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
  const shared: ResolvedModelEntry = { ...saved, apiKey: key };
  const next = existing
    ? models.map((entry) => (entry.id === existing.id ? shared : entry))
    : [...models, shared];
  await saveModelRegistry(db, next);

  // The registry path is gated on llm.enabled for recall/text (client.ts);
  // connecting a working cloud model is exactly the moment to open that gate.
  // llm.vision.enabled stays untouched — it doubles as the screen-capture
  // consent gate and is a deliberate, separate opt-in.
  await setSetting(db, "llm.enabled", "true");

  return { ok: true, entry: validation.entry, created: !existing };
}
