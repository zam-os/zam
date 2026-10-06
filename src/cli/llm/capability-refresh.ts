/**
 * Look again at cloud models whose detection is out of date (ADR 2026-09-13:
 * capabilities are detected, not chosen).
 *
 * A row keeps what its last probe found. Two things make that stale without
 * anyone noticing: ZAM learns a new capability (`file` for PDFs, ADR
 * 2026-10-05 — every row probed before it reads as "no PDFs"), and providers
 * add modalities to existing models (a row once probed as text-only stays
 * that way). Nobody presses "Re-check" for that, so the Studio asks here.
 *
 * Kept cheap and safe on purpose:
 *
 * - **Only when due.** A row is due when it was never probed, was probed
 *   before {@link CAPABILITIES_CHANGED_AT}, or more than
 *   {@link CAPABILITY_REFRESH_AFTER_MS} ago. Deciding that reads no network.
 * - **Cloud rows only.** A local runtime is expensive to start and an agent
 *   row is a harness process; both keep the manual "Re-check".
 * - **Metadata only.** The probe reads the provider's model catalogue; no
 *   model is called.
 * - **Widen only.** What the provider declares now is added and switched on,
 *   as a manual re-check would; nothing is taken away. A catalogue that
 *   answers without the model, or not at all, changes nothing and leaves the
 *   row due for the next start.
 */

import {
  ALL_CAPABILITIES,
  type CapabilityFlags,
  type Database,
  emptyCapabilityFlags,
  type ModelCapability,
  type ModelEntry,
} from "../../kernel/index.js";
import {
  type CapabilityProbeResult,
  catalogHasModel,
  mergeProbeCapabilities,
  probeModelCapabilities,
} from "./capability-probe.js";
import { isLocalEndpoint } from "./client.js";
import {
  isMachineLocalEntry,
  loadModelRegistry,
  type ResolvedModelEntry,
  saveModelRegistry,
} from "./model-registry.js";

/** When ZAM's capability list last grew: `file` (ADR 2026-10-05). */
export const CAPABILITIES_CHANGED_AT = "2026-10-05T00:00:00.000Z";

/** Providers add modalities to existing models; look again after this long. */
export const CAPABILITY_REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

/** Whether the Studio should ask the provider about this row again. */
export function needsCapabilityRefresh(entry: ModelEntry, now: Date): boolean {
  if (isMachineLocalEntry(entry) || isLocalEndpoint(entry.url)) return false;
  if (!entry.probedAt) return true;
  const probed = Date.parse(entry.probedAt);
  return (
    !Number.isFinite(probed) ||
    probed < Date.parse(CAPABILITIES_CHANGED_AT) ||
    now.getTime() - probed > CAPABILITY_REFRESH_AFTER_MS
  );
}

function flags(value: Partial<CapabilityFlags> | undefined): CapabilityFlags {
  const result = emptyCapabilityFlags();
  for (const key of ALL_CAPABILITIES) result[key] = value?.[key] === true;
  return result;
}

/**
 * The row with what the probe found added: newly detected capabilities are
 * switched on (the manual re-check's rule), the learner's toggles stay.
 */
export function widenCapabilities(
  entry: Pick<ModelEntry, "capabilities" | "detectedCapabilities">,
  found: CapabilityFlags,
): {
  capabilities: CapabilityFlags;
  detectedCapabilities: CapabilityFlags;
  added: ModelCapability[];
} {
  const before = flags(entry.detectedCapabilities);
  const detected = emptyCapabilityFlags();
  for (const key of ALL_CAPABILITIES) detected[key] = before[key] || found[key];
  return {
    capabilities: mergeProbeCapabilities(
      flags(entry.capabilities),
      before,
      detected,
    ),
    detectedCapabilities: detected,
    added: ALL_CAPABILITIES.filter((key) => detected[key] && !before[key]),
  };
}

/** Whether a probe speaks for this exact model, rather than guessing. */
function probeKnowsModel(
  entry: ModelEntry,
  probe: CapabilityProbeResult,
): boolean {
  if (!probe.reachable) return false;
  // The Anthropic Messages API publishes no catalogue; its modalities are
  // fixed by the API itself.
  if (entry.apiFlavor === "anthropic-messages") return true;
  return catalogHasModel(probe.catalog, entry.model);
}

export interface CapabilityRefreshResult {
  /** Rows that were due and asked about. */
  checked: number;
  /** Rows that gained a capability. */
  refreshed: Array<{ id: string; label: string; added: ModelCapability[] }>;
}

/** The rows that are due, without asking anyone. */
export async function staleCapabilityRows(
  db: Database,
  now: Date = new Date(),
): Promise<ResolvedModelEntry[]> {
  return (await loadModelRegistry(db)).filter((entry) =>
    needsCapabilityRefresh(entry, now),
  );
}

/** Ask the providers about every due cloud row and store what they declare. */
export async function refreshStaleCapabilities(
  db: Database,
  deps: {
    probe?: (entry: ModelEntry) => Promise<CapabilityProbeResult>;
    now?: Date;
  } = {},
): Promise<CapabilityRefreshResult> {
  const now = deps.now ?? new Date();
  const due = await staleCapabilityRows(db, now);
  if (due.length === 0) return { checked: 0, refreshed: [] };
  const probe = deps.probe ?? ((entry) => probeModelCapabilities(entry));
  const answers = new Map<string, CapabilityFlags>();
  await Promise.all(
    due.map(async (entry) => {
      try {
        const result = await probe(entry);
        if (probeKnowsModel(entry, result)) {
          answers.set(entry.id, result.detected);
        }
      } catch {
        // Offline or refused: the row stays due for the next start.
      }
    }),
  );
  if (answers.size === 0) return { checked: due.length, refreshed: [] };

  // Read again, so a toggle the learner made while the catalogues loaded is
  // kept: only the rows that were asked about change, and only by widening.
  const refreshed: CapabilityRefreshResult["refreshed"] = [];
  const current = await loadModelRegistry(db);
  const next = current.map((entry) => {
    const found = answers.get(entry.id);
    if (!found) return entry;
    const widened = widenCapabilities(entry, found);
    if (widened.added.length > 0) {
      refreshed.push({
        id: entry.id,
        label: entry.label || entry.model,
        added: widened.added,
      });
    }
    return {
      ...entry,
      capabilities: widened.capabilities,
      detectedCapabilities: widened.detectedCapabilities,
      probedAt: now.toISOString(),
    };
  });
  await saveModelRegistry(db, next);
  return { checked: due.length, refreshed };
}
