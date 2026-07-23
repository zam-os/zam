/**
 * Resolve the cloud vision endpoint for mobile image import from the synced
 * learner database settings (not from the pairing QR).
 *
 * Reads the same legacy keys the desktop CLI uses (`llm.vision.*` with
 * `llm.*` fallbacks). Machine-local `~/.zam/config.json` is not available on
 * the phone — operators must set vision on the server DB for field test.
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
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
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

/** Provider stamp for tokens created via image VL import. */
export function visionProviderStamp(model: string): string {
  const cleaned = model.trim() || "unknown";
  return `vision:${cleaned}`;
}

/** Human-readable reason when image import cannot run. */
export async function visionImportUnavailableReason(
  db: Database,
): Promise<string | null> {
  if ((await getSetting(db, "llm.vision.enabled")) !== "true") {
    return "Cloud vision is not enabled on this library (llm.vision.enabled).";
  }
  const endpoint = await resolveMobileVisionEndpoint(db);
  if (endpoint) return null;

  const url =
    (await getSetting(db, "llm.vision.url"))?.trim() ||
    (await getSetting(db, "llm.url"))?.trim() ||
    "";
  if (!url) {
    return "No vision endpoint URL is configured (llm.vision.url).";
  }
  if (isLocalEndpoint(url)) {
    return "Vision endpoint is local/loopback and cannot be reached from the phone.";
  }
  const model =
    (await getSetting(db, "llm.vision.model"))?.trim() ||
    (await getSetting(db, "llm.model"))?.trim() ||
    "";
  if (!model) {
    return "No vision model is configured (llm.vision.model).";
  }
  return "Cloud vision is not available for image import.";
}
