/**
 * The cloud vision endpoint set on the learner's library before the model
 * registry reached the phone (`llm.vision.*` with `llm.*` fallbacks).
 *
 * A material import reads photos with the registry's `image` rows first and
 * falls back to this endpoint (ADR 2026-10-05, Phase 8). Machine-local
 * `~/.zam/config.json` is not available on the phone.
 */

import type { Database } from "../../src/kernel/db/types.js";
import { getSetting } from "../../src/kernel/models/settings.js";

export interface MobileVisionEndpoint {
  enabled: true;
  url: string;
  model: string;
  apiKey: string;
  /** Always chat-completions for Phase 7 MVP. */
  apiFlavor: "chat-completions";
  label: string;
}

const DEFAULT_API_KEY = "sk-none";

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

function isLocalEndpoint(url: string): boolean {
  if (isLoopbackUrl(url)) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    // Common on-LAN host patterns — not usable from a field-test phone.
    return (
      host.endsWith(".local") ||
      host.startsWith("192.168.") ||
      host.startsWith("10.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    );
  } catch {
    return true;
  }
}

/**
 * Load a usable cloud vision endpoint from DB settings, or null when image
 * import must stay unavailable (missing config, local-only, loopback).
 */
export async function resolveMobileVisionEndpoint(
  db: Database,
): Promise<MobileVisionEndpoint | null> {
  if ((await getSetting(db, "llm.vision.enabled")) !== "true") {
    return null;
  }

  const baseUrl = (await getSetting(db, "llm.url"))?.trim() || "";
  const baseModel = (await getSetting(db, "llm.model"))?.trim() || "";
  const baseKey =
    (await getSetting(db, "llm.api_key"))?.trim() || DEFAULT_API_KEY;

  const url = (await getSetting(db, "llm.vision.url"))?.trim() || baseUrl || "";
  const model =
    (await getSetting(db, "llm.vision.model"))?.trim() || baseModel || "";
  const apiKey =
    (await getSetting(db, "llm.vision.api_key"))?.trim() || baseKey;

  if (!url || !model) return null;
  try {
    // HTTPS only: the phone sends the cloud API key on this request, so a
    // plain-http endpoint would leak it on the wire. Cloud vision is https.
    if (new URL(url).protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }
  if (isLocalEndpoint(url)) return null;

  return {
    enabled: true,
    url: url.replace(/\/+$/, ""),
    model,
    apiKey,
    apiFlavor: "chat-completions",
    label: model,
  };
}
