/**
 * Cloud model resolution on the companion, from the synced learner database
 * (ADR 2026-07-23 decision 4).
 *
 * The desktop keeps local endpoints and harness-backed entries in
 * `~/.zam/config.json` and everything hosted in the database, so this is the
 * phone's whole view of the registry — and the reason the pairing code no
 * longer carries a model matrix. Changing a model on the desktop reaches the
 * device on the next sync, without re-pairing.
 *
 * The desktop reader (`src/cli/llm/model-registry.ts`) cannot be imported here:
 * it reaches `~/.zam/config.json` through Node's `fs`, which does not exist in
 * a WebView. `tests/mobile/model-registry.test.ts` pins the setting key and the
 * selection rules against the desktop's, so the two cannot drift.
 */

import type { ZamPairLlmEndpoint } from "../../src/bridge/mobile-pairing.js";
import type { Database } from "../../src/kernel/db/types.js";
import { getSetting } from "../../src/kernel/models/settings.js";

/** Must equal `CLOUD_MODELS_SETTING` in src/cli/llm/model-registry.ts. */
export const CLOUD_MODELS_SETTING = "ai.models.cloud";

/**
 * The capabilities a companion can actually use a cloud model for.
 *
 * `embedding` joined the list when the app became standalone: semantic search
 * needs vectors, and on a device there is no Ollama to produce them. It is
 * served by the same provider and the same key as text and image — only the
 * model differs, and a model is what a row *is*, so connecting writes one row
 * per capability rather than one row with overrides (see `ai/connect.ts`).
 */
export type MobileModelCapability =
  | "text"
  | "stt"
  | "tts"
  | "image"
  | "embedding";

interface CloudModelRow {
  id?: string;
  label?: string;
  url?: string;
  model?: string;
  local?: boolean;
  apiFlavor?: string;
  apiKey?: string;
  order?: number;
  capabilities?: Record<string, boolean>;
  detectedCapabilities?: Record<string, boolean>;
  transport?: string;
}

function isLoopbackUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "[::1]" ||
      host === "::1"
    );
  } catch {
    return true;
  }
}

/**
 * Whether this device could call the row at all.
 *
 * A `local` or loopback endpoint runs on the desktop and is unreachable from a
 * phone by construction; an `agent` row is a CLI process there. None of these
 * should be in the database in the first place — the desktop keeps them
 * machine-local — but a row hand-edited or written by an older build must not
 * become an endpoint that always fails.
 */
function isReachable(row: CloudModelRow): boolean {
  return Boolean(
    row.url &&
      row.model &&
      !row.local &&
      row.transport !== "agent" &&
      !isLoopbackUrl(row.url) &&
      // Only the OpenAI shape is implemented on mobile, for chat and audio
      // alike.
      row.apiFlavor === "chat-completions",
  );
}

/**
 * Rows the learner enabled for a capability *and* a probe confirmed, in
 * priority order — the same two-sided filter `resolveCapability` applies on the
 * desktop. A capability the learner ticked but no probe ever detected is a
 * wish, not an endpoint.
 */
function selectRows(
  rows: CloudModelRow[],
  capability: MobileModelCapability,
): CloudModelRow[] {
  return rows
    .filter(
      (row) =>
        isReachable(row) &&
        row.capabilities?.[capability] === true &&
        row.detectedCapabilities?.[capability] === true,
    )
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function toEndpoint(row: CloudModelRow): ZamPairLlmEndpoint {
  return {
    enabled: true,
    url: row.url as string,
    model: row.model as string,
    apiFlavor: "chat-completions",
    ...(row.apiKey ? { apiKey: row.apiKey } : {}),
    local: false,
    ...(row.label ? { label: row.label } : {}),
  };
}

async function readCloudRows(db: Database): Promise<CloudModelRow[]> {
  const raw = await getSetting(db, CLOUD_MODELS_SETTING);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CloudModelRow[]) : [];
  } catch {
    return [];
  }
}

/**
 * The chain of cloud endpoints for one capability, primary first.
 *
 * Returned in the shape the evaluation and speech paths already take, with
 * `fallback` links so a failing primary is followed by the next model rather
 * than ending the session.
 */
export async function resolveMobileCloudChain(
  db: Database,
  capability: MobileModelCapability,
): Promise<ZamPairLlmEndpoint | null> {
  const rows = selectRows(await readCloudRows(db), capability);
  if (rows.length === 0) return null;
  let chain: ZamPairLlmEndpoint | undefined;
  for (const row of [...rows].reverse()) {
    const endpoint = toEndpoint(row);
    if (chain) endpoint.fallback = chain;
    chain = endpoint;
  }
  return chain ?? null;
}
