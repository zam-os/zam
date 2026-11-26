/**
 * The private Academy providers a learner confirmed on this machine
 * (ADR 2026-11-25, Decision 3).
 *
 * A provider decides where ZAM sends a login token, so this list is a
 * security switch: it lives machine-locally in `~/.zam/config.json`, never in
 * the library database, and only Studio and `zam academy provider` write it —
 * never an MCP tool or a Studio-panel bridge command. Every entry is checked
 * again on read, so a hand-edited config cannot widen what ZAM trusts.
 */

import { providerOrigin } from "../library/academy-catalog.js";
import {
  type AcademyProvider,
  parseAcademyProvider,
  reservedProviderIds,
} from "../library/academy-provider.js";
import { loadInstallConfig, updateInstallConfig } from "./install-config.js";

export interface ConfirmedAcademyProvider {
  /** Canonical https origin, e.g. `https://provider.example`. */
  origin: string;
  provider: AcademyProvider;
  /** SHA-256 of the provider file's bytes the learner confirmed. */
  sha256: string;
  confirmedAt: string;
}

/** The fields whose change needs the learner's confirmation again. */
export type ProviderChangedField = "id" | "auth" | "feedback";

const SHA256 = /^[0-9a-f]{64}$/;

function checked(entry: unknown): ConfirmedAcademyProvider | null {
  if (!entry || typeof entry !== "object") return null;
  const raw = entry as Record<string, unknown>;
  try {
    const origin = providerOrigin(String(raw.origin ?? ""));
    const provider = parseAcademyProvider(raw.provider);
    const sha256 = typeof raw.sha256 === "string" ? raw.sha256 : "";
    if (!SHA256.test(sha256)) return null;
    if (reservedProviderIds().has(provider.id)) return null;
    return {
      origin,
      provider,
      sha256,
      confirmedAt: typeof raw.confirmedAt === "string" ? raw.confirmedAt : "",
    };
  } catch {
    return null;
  }
}

/** Every confirmed provider that still passes the checks, by id. */
export function listConfirmedProviders(
  configPath?: string,
): ConfirmedAcademyProvider[] {
  const stored = loadInstallConfig(configPath).academy?.providers ?? [];
  const out: ConfirmedAcademyProvider[] = [];
  const seen = new Set<string>();
  for (const entry of stored) {
    const ok = checked(entry);
    if (!ok || seen.has(ok.provider.id)) continue;
    seen.add(ok.provider.id);
    out.push(ok);
  }
  return out.sort((a, b) => a.provider.id.localeCompare(b.provider.id));
}

/** The confirmed provider with this id, if any. */
export function confirmedProvider(
  id: string,
  configPath?: string,
): ConfirmedAcademyProvider | undefined {
  return listConfirmedProviders(configPath).find(
    (entry) => entry.provider.id === id,
  );
}

/**
 * Records the learner's confirmation. A provider file served again from the
 * same origin replaces that origin's entry (a re-confirmation); another
 * origin may not take an id that is already confirmed, and a reserved id is
 * refused.
 */
export function confirmProvider(
  entry: { origin: string; provider: AcademyProvider; sha256: string },
  configPath?: string,
): ConfirmedAcademyProvider {
  const origin = providerOrigin(entry.origin);
  const provider = parseAcademyProvider(entry.provider);
  if (!SHA256.test(entry.sha256)) {
    throw new Error("Provider file hash must be a SHA-256 hex digest");
  }
  if (reservedProviderIds().has(provider.id)) {
    throw new Error(`Provider id ${provider.id} is reserved`);
  }
  const confirmed: ConfirmedAcademyProvider = {
    origin,
    provider,
    sha256: entry.sha256,
    confirmedAt: new Date().toISOString(),
  };
  updateInstallConfig((config) => {
    const current = (config.academy?.providers ?? [])
      .map(checked)
      .filter((row): row is ConfirmedAcademyProvider => row !== null);
    const clash = current.find(
      (row) => row.provider.id === provider.id && row.origin !== origin,
    );
    if (clash) {
      throw new Error(
        `Provider id ${provider.id} is already confirmed for ${clash.origin}`,
      );
    }
    config.academy = {
      ...config.academy,
      providers: [...current.filter((row) => row.origin !== origin), confirmed],
    };
  }, configPath);
  return confirmed;
}

/** Removes a confirmed provider; true when there was one. */
export function removeConfirmedProvider(
  id: string,
  configPath?: string,
): boolean {
  return updateInstallConfig((config) => {
    const stored = config.academy?.providers ?? [];
    const kept = stored.filter((row) => checked(row)?.provider.id !== id);
    if (kept.length === stored.length) return false;
    config.academy = { ...config.academy, providers: kept };
    return true;
  }, configPath);
}

/** Which of `id`, `auth`, `feedback` differ between confirmed and served. */
export function providerChange(
  confirmed: AcademyProvider,
  served: AcademyProvider,
): ProviderChangedField[] {
  const changed: ProviderChangedField[] = [];
  if (confirmed.id !== served.id) changed.push("id");
  if (JSON.stringify(confirmed.auth) !== JSON.stringify(served.auth)) {
    changed.push("auth");
  }
  if (confirmed.feedback !== served.feedback) changed.push("feedback");
  return changed;
}

/**
 * Confirmed and previously remembered origins. The review also checks its
 * current database for installed provider tiles (ADR 2026-11-25 Decision 6).
 */
export function reviewSuppressedOrigins(configPath?: string): Set<string> {
  const origins = new Set(
    listConfirmedProviders(configPath).map((entry) => entry.origin),
  );
  for (const value of loadInstallConfig(configPath).academy?.lessonOrigins ??
    []) {
    try {
      origins.add(new URL(value).origin);
    } catch {
      // Not a URL: nothing to suppress.
    }
  }
  return origins;
}
