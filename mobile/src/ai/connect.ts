/**
 * Connecting a cloud model from the device (ADR 2026-07-24 §5).
 *
 * One field, one button. The learner pastes a key, ZAM verifies it against the
 * provider's own key endpoint and writes registry rows; text/image, embeddings
 * and speech-to-text all come from that same key, because OpenRouter serves
 * chat, embeddings and `/audio/transcriptions` under one account.
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
import {
  type CloudProviderDescriptor,
  OPENROUTER_LEGACY_DEFAULT_MODELS,
  OPENROUTER_PROVIDER,
} from "../../../src/cli/llm/cloud-providers.js";
import type { Database } from "../../../src/kernel/db/types.js";
import { getSetting, setSetting } from "../../../src/kernel/models/settings.js";
import { CLOUD_MODELS_SETTING } from "../model-registry.js";

/**
 * Model requested for the `embedding` capability of the connected provider.
 *
 * OpenRouter's catalogue no longer lists `qwen/qwen3-embedding-0.6b` (HTTP 404
 * on `/embeddings`, verified 2026-08-08). The 4B sibling is the smallest Qwen3
 * embedding model still available and keeps the same multilingual family.
 */
export const CLOUD_EMBEDDING_MODEL = "qwen/qwen3-embedding-4b";

/**
 * Canonical id every stored vector is tagged with, mirroring
 * `canonicalEmbeddingModelId` in `src/cli/llm/embedder.ts`. Fixing it matters
 * on a shared database: a device that tags its vectors differently re-embeds
 * the whole library the first time anyone searches.
 */
export const CLOUD_EMBEDDING_MODEL_ID = "qwen3-embedding-4b";

/** Former embedding wire names ZAM wrote; migrate in place when still present. */
export const CLOUD_EMBEDDING_LEGACY_MODELS = [
  "qwen/qwen3-embedding-0.6b",
  "qwen/qwen3-embedding-0.6b:free",
] as const;

/**
 * Cloud speech-to-text model for voice mode (OpenRouter audio catalogue).
 *
 * Dedicated STT — not a chat model. Registered as its own registry row with
 * only the `stt` flag so `resolveMobileCloudChain(db, "stt")` never picks the
 * Luna/chat endpoint. Mobile already POSTs to `/audio/transcriptions`
 * (`speech.ts`); this is the model id that path sends.
 */
export const CLOUD_STT_MODEL = "openai/gpt-transcribe";

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
 * Verify the key, then register the chosen (or default) model for text, image
 * and embeddings. Idempotent: reconnecting with a new key updates the existing
 * row rather than stacking a second one. Former ZAM defaults on the same
 * provider URL are replaced in place so a reconnect upgrades a broken model
 * without leaving a dead fallback in the chain.
 */
export async function connectCloudModel(
  db: Database,
  apiKey: string,
  options: {
    descriptor?: CloudProviderDescriptor;
    /** Chat model id; defaults to the provider descriptor's default. */
    model?: string;
    verify?: typeof verifyKey;
  } = {},
): Promise<ConnectResult> {
  const descriptor = options.descriptor ?? OPENROUTER_PROVIDER;
  const verify = options.verify ?? verifyKey;
  const chatModel = (options.model?.trim() || descriptor.defaultModel).trim();
  if (!chatModel) return { ok: false, error: "empty_model" };

  // Changing the model after a first connect must not force the learner to
  // re-paste the key: reuse the one already stored for this provider.
  const pasted = apiKey.trim();
  const rows = await readRows(db);
  const storedKey =
    pasted ||
    rows.find((row) => row.url === descriptor.baseUrl && row.apiKey)?.apiKey ||
    "";
  const key = storedKey.trim();
  if (!key) return { ok: false, error: "empty" };

  // Only hit the network when the learner typed a key. A model-only switch
  // reuses a key we already accepted.
  if (pasted) {
    const check = await verify(key, descriptor);
    if (!check.valid) return { ok: false, error: check.reason ?? "rejected" };
  }

  // `capabilities` is what the learner asked for and `detectedCapabilities`
  // what a probe confirmed; `resolveMobileCloudChain` requires both. A
  // verified key on a provider whose catalogue we know is the probe here —
  // there is no per-capability endpoint to ask.
  //
  // **Two rows, not one with an embedding override.** A registry row is an
  // endpoint, and an endpoint is a URL *and a model*: `resolveCapability` on
  // the desktop reads `row.model` and knows nothing else. A single row
  // carrying the chat model plus an `embeddingModel` field worked on the
  // device and left a desktop sharing the same server database resolving the
  // `embedding` role to a chat model — 4xx on every request, and every vector
  // the iPad wrote counted as stale because the model ids disagreed.
  const now = new Date().toISOString();
  const chatFlags = {
    text: true,
    image: descriptor.capabilities.includes("image"),
    embedding: false,
    video: false,
    stt: false,
    tts: false,
  };
  const embeddingFlags = {
    text: false,
    image: false,
    embedding: true,
    video: false,
    stt: false,
    tts: false,
  };
  const sttFlags = {
    text: false,
    image: false,
    embedding: false,
    video: false,
    stt: true,
    tts: false,
  };

  // Drop superseded ZAM defaults for this provider so they cannot sit ahead of
  // the working row and burn the evaluation budget (or 404 on embeddings).
  const legacyChat = new Set<string>(OPENROUTER_LEGACY_DEFAULT_MODELS);
  if (chatModel !== descriptor.defaultModel) {
    // The learner explicitly picked something else; the previous default is
    // also legacy for this reconnect.
    legacyChat.add(descriptor.defaultModel);
  }
  legacyChat.delete(chatModel);

  const legacyEmbed = new Set<string>(CLOUD_EMBEDDING_LEGACY_MODELS);
  legacyEmbed.delete(CLOUD_EMBEDDING_MODEL);

  const kept = rows.filter((row) => {
    if (row.url !== descriptor.baseUrl) return true;
    if (legacyChat.has(row.model) && !row.capabilities?.embedding) return false;
    if (legacyEmbed.has(row.model) && row.capabilities?.embedding) return false;
    // One chat model per provider from this connect path: switching replaces
    // the previous chat row so dead fallbacks do not pile up. Leave embedding
    // and stt rows alone — they are separate endpoints.
    if (
      row.capabilities?.text &&
      !row.capabilities?.embedding &&
      !row.capabilities?.stt &&
      row.model !== chatModel
    ) {
      return false;
    }
    return true;
  });

  const wanted: Array<{ model: string; flags: typeof chatFlags }> = [
    { model: chatModel, flags: chatFlags },
    { model: CLOUD_EMBEDDING_MODEL, flags: embeddingFlags },
    { model: CLOUD_STT_MODEL, flags: sttFlags },
  ];

  let created = false;
  for (const [index, entry] of wanted.entries()) {
    const existing = kept.find(
      (row) => row.url === descriptor.baseUrl && row.model === entry.model,
    );
    if (existing) {
      existing.apiKey = key;
      existing.label = descriptor.label;
      existing.capabilities = { ...entry.flags };
      existing.detectedCapabilities = { ...entry.flags };
      existing.probedAt = now;
      // Prefer the models this connect just verified over any older cloud rows
      // that may still sit in the shared database (desktop multi-model setup).
      existing.order = index;
      continue;
    }
    created = true;
    kept.push({
      id: ulid(),
      label: descriptor.label,
      url: descriptor.baseUrl,
      model: entry.model,
      local: false,
      apiFlavor: "chat-completions",
      apiKey: key,
      order: index,
      capabilities: { ...entry.flags },
      detectedCapabilities: { ...entry.flags },
      probedAt: now,
    });
  }

  // Bump every other reachable row so the freshly connected models stay first
  // without rewriting foreign providers' relative order.
  let nextOrder = wanted.length;
  for (const row of kept) {
    if (
      row.url === descriptor.baseUrl &&
      wanted.some((entry) => entry.model === row.model)
    ) {
      continue;
    }
    row.order = nextOrder++;
  }

  await writeRows(db, kept);
  return { ok: true, created };
}

/**
 * Upgrade known-stale ZAM defaults that already carry a key, without asking
 * the learner to reconnect. Only rewrites models ZAM itself once chose as the
 * default — never a model the learner picked by hand.
 *
 * Returns true when anything changed.
 */
export async function migrateStaleCloudDefaults(
  db: Database,
  descriptor: CloudProviderDescriptor = OPENROUTER_PROVIDER,
): Promise<boolean> {
  const rows = await readRows(db);
  let changed = false;
  const now = new Date().toISOString();

  for (const row of rows) {
    if (row.url !== descriptor.baseUrl || !row.apiKey) continue;

    if (
      row.capabilities?.text &&
      (OPENROUTER_LEGACY_DEFAULT_MODELS as readonly string[]).includes(
        row.model,
      )
    ) {
      row.model = descriptor.defaultModel;
      row.label = descriptor.label;
      row.capabilities = {
        text: true,
        image: descriptor.capabilities.includes("image"),
        embedding: false,
        video: false,
        stt: false,
        tts: false,
      };
      row.detectedCapabilities = { ...row.capabilities };
      row.probedAt = now;
      changed = true;
      continue;
    }

    if (
      row.capabilities?.embedding &&
      (CLOUD_EMBEDDING_LEGACY_MODELS as readonly string[]).includes(row.model)
    ) {
      row.model = CLOUD_EMBEDDING_MODEL;
      row.label = descriptor.label;
      row.capabilities = {
        text: false,
        image: false,
        embedding: true,
        video: false,
        stt: false,
        tts: false,
      };
      row.detectedCapabilities = { ...row.capabilities };
      row.probedAt = now;
      changed = true;
    }
  }

  // OpenRouter key already present, but no STT row yet (connect before
  // gpt-transcribe was wired): add it so voice mode can use cloud recognition
  // without asking the learner to reconnect.
  const openrouterKey = rows.find(
    (row) => row.url === descriptor.baseUrl && row.apiKey,
  )?.apiKey;
  const hasStt = rows.some(
    (row) =>
      row.url === descriptor.baseUrl &&
      row.capabilities?.stt &&
      row.detectedCapabilities?.stt,
  );
  if (openrouterKey && !hasStt) {
    rows.push({
      id: ulid(),
      label: descriptor.label,
      url: descriptor.baseUrl,
      model: CLOUD_STT_MODEL,
      local: false,
      apiFlavor: "chat-completions",
      apiKey: openrouterKey,
      order: rows.length,
      capabilities: {
        text: false,
        image: false,
        embedding: false,
        video: false,
        stt: true,
        tts: false,
      },
      detectedCapabilities: {
        text: false,
        image: false,
        embedding: false,
        video: false,
        stt: true,
        tts: false,
      },
      probedAt: now,
    });
    changed = true;
  }

  if (changed) await writeRows(db, rows);
  return changed;
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
