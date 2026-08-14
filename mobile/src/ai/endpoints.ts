/**
 * Managing cloud endpoints by hand, from the device.
 *
 * The one-paste OpenRouter flow (`connect.ts`) is the way in, and it stays the
 * only thing a new learner ever sees. This is the other end: someone who
 * already pays for a provider — a prepaid Xiaomi account, a university
 * gateway, a self-hosted server — and wants ZAM to use it directly rather than
 * through a reseller. On the desktop that is the AI provider editor; this is
 * the same job in the space a tablet has.
 *
 * **No endpoint at all is a legitimate state**, not an empty broken list
 * (ADR 2026-08-09 §1). Nothing here is a prerequisite for reviewing, importing
 * or searching, and the screen says so rather than implying something is
 * missing.
 *
 * Resolution is unchanged: `resolveMobileCloudChain` walks rows by `order` and
 * picks the first that claims a capability, so ordering *is* the priority and
 * there is no separate role binding to maintain — the desktop needs one only
 * because it also has local runners and agent transports to arbitrate.
 */

import { ulid } from "ulid";
import type { Database } from "../../../src/kernel/db/types.js";
import { getSetting, setSetting } from "../../../src/kernel/models/settings.js";
import { CLOUD_MODELS_SETTING } from "../model-registry.js";

/** Capabilities a hand-managed endpoint can be asked to serve. */
export const ENDPOINT_CAPABILITIES = [
  "text",
  "image",
  "embedding",
  "stt",
] as const;

export type EndpointCapability = (typeof ENDPOINT_CAPABILITIES)[number];

export interface ManagedEndpoint {
  id: string;
  label: string;
  url: string;
  model: string;
  apiKey: string;
  order: number;
  capabilities: Record<string, boolean>;
  detectedCapabilities: Record<string, boolean>;
  local?: boolean;
  apiFlavor?: string;
  transport?: string;
  probedAt?: string;
}

export interface EndpointDraft {
  id?: string;
  label: string;
  url: string;
  model: string;
  apiKey: string;
  capabilities: Record<string, boolean>;
}

export type EndpointError =
  | "empty_label"
  | "empty_url"
  | "bad_url"
  | "empty_model"
  | "no_capability";

async function readRows(db: Database): Promise<ManagedEndpoint[]> {
  const raw = await getSetting(db, CLOUD_MODELS_SETTING);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ManagedEndpoint[]) : [];
  } catch {
    return [];
  }
}

async function writeRows(db: Database, rows: ManagedEndpoint[]): Promise<void> {
  // Renumber on every write so `order` stays dense and comparable; a gap left
  // by a deletion would otherwise decide priority by accident.
  const ordered = rows.map((row, index) => ({ ...row, order: index }));
  await setSetting(db, CLOUD_MODELS_SETTING, JSON.stringify(ordered));
}

/** Every configured endpoint, in the order the chain will try them. */
export async function listEndpoints(db: Database): Promise<ManagedEndpoint[]> {
  const rows = await readRows(db);
  return [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Reject what cannot work before it is stored.
 *
 * A row with no capability ticked is invisible to `resolveMobileCloudChain` —
 * it would sit in the list looking configured and never be called, which is
 * worse than being told now.
 */
export function validateDraft(draft: EndpointDraft): EndpointError | null {
  if (!draft.label.trim()) return "empty_label";
  const url = draft.url.trim();
  if (!url) return "empty_url";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return "bad_url";
    }
  } catch {
    return "bad_url";
  }
  if (!draft.model.trim()) return "empty_model";
  if (!ENDPOINT_CAPABILITIES.some((cap) => draft.capabilities[cap])) {
    return "no_capability";
  }
  return null;
}

/**
 * Create or update one endpoint.
 *
 * `detectedCapabilities` mirrors what the learner ticked. On the desktop that
 * field is a probe result and the two are intersected, but there is no probe
 * behind a hand-typed URL — asking the endpoint what it can do is not a thing
 * the OpenAI-compatible shape supports. Someone who types a model id into this
 * form is asserting it; `checkEndpoint` proves only that the host answers.
 */
export async function saveEndpoint(
  db: Database,
  draft: EndpointDraft,
): Promise<{ ok: boolean; error?: EndpointError; id?: string }> {
  const error = validateDraft(draft);
  if (error) return { ok: false, error };

  const rows = await readRows(db);
  const capabilities: Record<string, boolean> = {};
  for (const cap of ENDPOINT_CAPABILITIES) {
    capabilities[cap] = Boolean(draft.capabilities[cap]);
  }
  const id = draft.id ?? ulid();
  const existing = rows.find((row) => row.id === id);
  const row: ManagedEndpoint = {
    ...existing,
    id,
    label: draft.label.trim(),
    url: draft.url.trim().replace(/\/+$/, ""),
    model: draft.model.trim(),
    apiKey: draft.apiKey.trim(),
    local: false,
    apiFlavor: "chat-completions",
    order: existing?.order ?? rows.length,
    capabilities,
    detectedCapabilities: { ...capabilities },
  };

  await writeRows(
    db,
    existing
      ? rows.map((entry) => (entry.id === id ? row : entry))
      : [...rows, row],
  );
  return { ok: true, id };
}

export async function removeEndpoint(db: Database, id: string): Promise<void> {
  const rows = await readRows(db);
  await writeRows(
    db,
    rows.filter((row) => row.id !== id),
  );
}

/**
 * Move an endpoint one place up or down the chain.
 *
 * Up and down buttons rather than drag and drop: dragging a list row on a
 * touch screen fights the scroll gesture, and the list is short enough that
 * two taps beat a gesture that misfires.
 */
export async function moveEndpoint(
  db: Database,
  id: string,
  direction: "up" | "down",
): Promise<boolean> {
  const rows = await listEndpoints(db);
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return false;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return false;
  const reordered = [...rows];
  const [moved] = reordered.splice(index, 1);
  reordered.splice(target, 0, moved as ManagedEndpoint);
  await writeRows(db, reordered);
  return true;
}

/**
 * Ask the host whether it is there and whether the key is accepted.
 *
 * `GET {base}/models` is the one call every OpenAI-compatible server answers
 * without spending tokens. It cannot confirm that the model id exists or that
 * the endpoint can embed — only that the address resolves and the key is not
 * rejected, which is what a typo in either produces.
 */
export async function checkEndpoint(
  draft: Pick<EndpointDraft, "url" | "apiKey">,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const base = draft.url.trim().replace(/\/+$/, "");
  if (!base) return { ok: false, error: "empty_url" };
  const headers: Record<string, string> = {};
  if (draft.apiKey.trim()) {
    headers.Authorization = `Bearer ${draft.apiKey.trim()}`;
  }
  try {
    const response = await fetchImpl(`${base}/models`, { headers });
    if (response.ok) return { ok: true, status: response.status };
    return { ok: false, status: response.status };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
