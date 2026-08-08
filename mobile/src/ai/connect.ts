/**
 * Connecting a cloud model from the device (ADR 2026-07-24 §5).
 *
 * One field, one button. The learner pastes a key, ZAM verifies it against the
 * provider's own key endpoint and writes a registry row; text, image and
 * embeddings all come from that single row, because OpenRouter serves all
 * three from the same key.
 *
 * **Why the key lands in the database.** `apiKeyRef` into a credentials file
 * is the rule for `~/.zam/config.json`, and it is meaningless on a device that
 * has no such file. Cloud rows therefore carry the key inline — the rule the
 * desktop already follows for exactly the same reason
 * (`src/cli/llm/model-registry.ts`). On a device-local library the database
 * never leaves the app sandbox; once a server database is attached the key
 * travels with it, which is what makes AI work on a second device without a
 * second paste, and which Phase 4 asks about explicitly.
 *
 * The desktop's `connectCloudProvider` cannot be imported here: it pulls in
 * `kernel/index.js` and the capability prober, both of which reach for Node.
 * The *descriptor* is a pure data leaf and is imported directly, so the URL,
 * the default model and the key-check path cannot drift;
 * `tests/mobile/ai-connect.test.ts` pins the rest against it.
 */

import { ulid } from "ulid";
import type { Database } from "../../../src/kernel/db/types.js";
import { getSetting, setSetting } from "../../../src/kernel/models/settings.js";
import {
  type CloudProviderDescriptor,
  OPENROUTER_PROVIDER,
} from "../../../src/cli/llm/cloud-providers.js";
import { CLOUD_MODELS_SETTING } from "../model-registry.js";

/** Model requested for the `embedding` capability of the connected provider. */
export const CLOUD_EMBEDDING_MODEL = "qwen/qwen3-embedding-0.6b";

/**
 * Canonical id every stored vector is tagged with, mirroring
 * `canonicalEmbeddingModelId` in `src/cli/llm/embedder.ts`. Fixing it matters
 * on a shared database: a device that tags its vectors differently re-embeds
 * the whole library the first time anyone searches.
 */
export const CLOUD_EMBEDDING_MODEL_ID = "qwen3-embedding-0.6b";

export interface CloudKeyCheck {
  valid: boolean;
  /** Human-readable reason when invalid. Never echoes the key. */
  reason?: string;
}

export interface ConnectResult {
  ok: boolean;
  error?: string;
  /** True when a row was added rather than updated in place. */
  created?: boolean;
}

interface CloudRow {
  id: string;
  label: string;
  url: string;
  model: string;
  local: boolean;
  apiFlavor: "chat-completions";
  apiKey: string;
  order: number;
  capabilities: Record<string, boolean>;
  detectedCapabilities: Record<string, boolean>;
  /** Model used for the embedding capability, when it differs from `model`. */
  embeddingModel?: string;
  probedAt?: string;
}

/**
 * Verify a key against the provider's authenticated key endpoint.
 *
 * OpenRouter's `/models` catalogue is public, so only an authenticated probe
 * can tell a bad key from a good one. A network failure is reported as a
 * network failure — telling a learner their key is wrong when the train went
 * into a tunnel is worse than saying nothing.
 */
export async function verifyKey(
  apiKey: string,
  descriptor: CloudProviderDescriptor = OPENROUTER_PROVIDER,
  fetchImpl: typeof fetch = fetch,
): Promise<CloudKeyCheck> {
  let response: Response;
  try {
    response = await fetchImpl(
      `${descriptor.baseUrl}${descriptor.keyCheckPath}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return { valid: false, reason: "unreachable" };
  }
  if (response.ok) return { valid: true };
  if (response.status === 401 || response.status === 403) {
    return { valid: false, reason: "rejected" };
  }
  return { valid: false, reason: `http_${response.status}` };
}

async function readRows(db: Database): Promise<CloudRow[]> {
  const raw = await getSetting(db, CLOUD_MODELS_SETTING);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CloudRow[]) : [];
  } catch {
    return [];
  }
}

async function writeRows(db: Database, rows: CloudRow[]): Promise<void> {
  await setSetting(db, CLOUD_MODELS_SETTING, JSON.stringify(rows));
}

/**
 * Verify the key, then register the provider's default model for text, image
 * and embeddings. Idempotent: reconnecting with a new key updates the existing
 * row rather than stacking a second one.
 */
export async function connectCloudModel(
  db: Database,
  apiKey: string,
  options: {
    descriptor?: CloudProviderDescriptor;
    verify?: typeof verifyKey;
  } = {},
): Promise<ConnectResult> {
  const descriptor = options.descriptor ?? OPENROUTER_PROVIDER;
  const verify = options.verify ?? verifyKey;

  const key = apiKey.trim();
  if (!key) return { ok: false, error: "empty" };

  const check = await verify(key, descriptor);
  if (!check.valid) return { ok: false, error: check.reason ?? "rejected" };

  const rows = await readRows(db);
  const existing = rows.find(
    (row) => row.url === descriptor.baseUrl && row.model === descriptor.defaultModel,
  );

  // `capabilities` is what the learner asked for and `detectedCapabilities`
  // what a probe confirmed; `resolveMobileCloudChain` requires both. A
  // verified key on a provider whose catalogue we know is the probe here —
  // there is no per-capability endpoint to ask.
  const flags = {
    text: true,
    image: descriptor.capabilities.includes("image"),
    embedding: true,
    video: false,
    stt: false,
    tts: false,
  };

  if (existing) {
    existing.apiKey = key;
    existing.capabilities = { ...flags };
    existing.detectedCapabilities = { ...flags };
    existing.embeddingModel = CLOUD_EMBEDDING_MODEL;
    existing.probedAt = new Date().toISOString();
    await writeRows(db, rows);
    return { ok: true, created: false };
  }

  rows.push({
    id: ulid(),
    label: descriptor.label,
    url: descriptor.baseUrl,
    model: descriptor.defaultModel,
    local: false,
    apiFlavor: "chat-completions",
    apiKey: key,
    order: rows.length,
    capabilities: { ...flags },
    detectedCapabilities: { ...flags },
    embeddingModel: CLOUD_EMBEDDING_MODEL,
    probedAt: new Date().toISOString(),
  });
  await writeRows(db, rows);
  return { ok: true, created: true };
}

/** Whether a usable cloud model is registered, for the settings screen. */
export async function connectedCloudLabel(
  db: Database,
): Promise<string | null> {
  const rows = await readRows(db);
  const row = rows.find((entry) => entry.apiKey && entry.capabilities?.text);
  return row ? `${row.label} · ${row.model}` : null;
}

/** Forget the connected model, key included. */
export async function disconnectCloudModel(
  db: Database,
  descriptor: CloudProviderDescriptor = OPENROUTER_PROVIDER,
): Promise<void> {
  const rows = await readRows(db);
  await writeRows(
    db,
    rows.filter((row) => row.url !== descriptor.baseUrl),
  );
}
