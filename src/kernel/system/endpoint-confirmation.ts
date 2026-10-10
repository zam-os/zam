/**
 * Keys follow endpoints (ADR 2026-10-08b D5).
 *
 * A synced model row carries URL and key together, and whoever holds the
 * library's token can rewrite the URL. So each device remembers, in its own
 * `~/.zam/config.json`, the endpoint it last confirmed for each row, and sends
 * that row's key nowhere else until the learner confirms the new endpoint in
 * Settings or with `zam trust endpoint`. A row seen for the first time is
 * confirmed as it stands.
 */
import { loadInstallConfig, updateInstallConfig } from "./install-config.js";

function normalize(url: string): string {
  return url.trim().replace(/\/+$/, "").toLowerCase();
}

/** The endpoint this device last confirmed for a row, if any. */
export function confirmedEndpointFor(
  id: string,
  configPath?: string,
): string | undefined {
  return loadInstallConfig(configPath).ai?.confirmedEndpoints?.[id];
}

/** Record that the learner confirmed `url` for row `id` on this device. */
export function confirmEndpoint(
  id: string,
  url: string,
  configPath?: string,
): void {
  updateInstallConfig((config) => {
    config.ai = {
      ...config.ai,
      confirmedEndpoints: { ...(config.ai?.confirmedEndpoints ?? {}), [id]: url },
    };
  }, configPath);
}

/** Whether row `id`'s URL differs from the one this device confirmed. */
export function isEndpointUnconfirmed(
  id: string,
  url: string,
  configPath?: string,
): boolean {
  const confirmed = confirmedEndpointFor(id, configPath);
  return confirmed !== undefined && normalize(confirmed) !== normalize(url);
}

/**
 * Whether this device may send row `id`'s key to `url`. The first sighting
 * of a row is recorded and allowed; afterwards only the confirmed endpoint is.
 */
export function keyMaySendTo(
  id: string,
  url: string,
  configPath?: string,
): boolean {
  const confirmed = confirmedEndpointFor(id, configPath);
  if (confirmed === undefined) {
    confirmEndpoint(id, url, configPath);
    return true;
  }
  return normalize(confirmed) === normalize(url);
}
