/**
 * Split model registry: cloud rows in the synced database, local rows on the
 * machine (ADR 2026-07-23 decision 4).
 *
 * ADR 2026-07-12 put the whole ordered registry in `~/.zam/config.json`. That
 * is right for a local Ollama endpoint or a harness-backed entry — both are
 * properties of *one machine* — and wrong for a hosted endpoint, which every
 * client of the same learner should see. Keeping cloud rows machine-local left
 * the companion with no way to learn about them, which is why the pairing QR
 * grew an embedded model matrix it was never meant to carry (decision 5).
 *
 * The split is by reachability, not by taste:
 *
 * - **Machine-local** — `local` endpoints (loopback, LAN, a runner) and
 *   `agent`-transport entries, which delegate to a CLI process on this machine.
 *   Neither can be reached by another device, so sharing them would be a lie.
 * - **Database** — everything else: a hosted endpoint any online client can
 *   call.
 *
 * Cloud rows carry their API key inline. `apiKeyRef` stays the rule for
 * `config.json` (ADR 2026-07-12: "never inline"), but a reference into a
 * credentials file on one machine is meaningless to a phone. The key travels in
 * the learner's own database, reached with the token the pairing code carries —
 * the same trade `llm.vision.api_key` has always made.
 */

import type { Database, ModelEntry } from "../../kernel/index.js";
import { getSetting, setSetting } from "../../kernel/models/settings.js";
import {
  getMachineAiModels,
  saveMachineAiModels,
} from "../../kernel/system/install-config.js";

/** JSON array of cloud rows, in the synced learner database. */
export const CLOUD_MODELS_SETTING = "ai.models.cloud";

/**
 * A registry row with its secret resolved.
 *
 * `apiKey` is only ever populated for database rows; it is stripped before a
 * row is written back to `config.json`, so the "never inline" rule that applies
 * to the machine registry still holds.
 */
export interface ResolvedModelEntry extends ModelEntry {
  apiKey?: string;
}

/**
 * Whether this row describes something only *this* machine can reach.
 *
 * An `agent` entry is generation delegated to a harness process here, and a
 * `local` entry is a loopback or LAN endpoint. Both are unreachable from
 * another device by construction, so both stay out of the shared database.
 */
export function isMachineLocalEntry(entry: ModelEntry): boolean {
  return entry.local || entry.transport === "agent";
}

function stripSecret(entry: ResolvedModelEntry): ModelEntry {
  const { apiKey: _apiKey, ...rest } = entry;
  return rest;
}

async function readCloudModels(db: Database): Promise<ResolvedModelEntry[]> {
  const raw = await getSetting(db, CLOUD_MODELS_SETTING);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ResolvedModelEntry[]) : [];
  } catch {
    // A hand-edited or half-written row must not take the whole registry with
    // it — the machine rows below still resolve.
    return [];
  }
}

async function writeCloudModels(
  db: Database,
  entries: ResolvedModelEntry[],
): Promise<void> {
  await setSetting(db, CLOUD_MODELS_SETTING, JSON.stringify(entries));
}

const migratedDatabases = new WeakSet<object>();

/**
 * Move cloud rows out of `config.json` and into the database, once.
 *
 * Idempotent and conservative: it runs only while the database holds no cloud
 * rows at all, so a second machine attaching to the same database adds its own
 * local models without re-uploading a registry that is already there. Rows it
 * moves are removed from `config.json`, because two writable copies of the same
 * endpoint is precisely the drift this split exists to end.
 */
export async function ensureCloudModelsMigrated(db: Database): Promise<void> {
  if (migratedDatabases.has(db as unknown as object)) return;
  migratedDatabases.add(db as unknown as object);

  if ((await readCloudModels(db)).length > 0) return;
  const machine = getMachineAiModels();
  const cloud = machine.filter((entry) => !isMachineLocalEntry(entry));
  if (cloud.length === 0) return;

  await writeCloudModels(db, cloud);
  saveMachineAiModels(machine.filter(isMachineLocalEntry));
}

/**
 * The registry as the resolver sees it: machine rows and database rows in one
 * list, ordered by `order`.
 *
 * A tie goes to the machine row. Two entries claiming the same slot is a
 * configuration accident rather than a choice, and when it happens the
 * cheaper, more private endpoint is the better guess.
 */
export async function loadModelRegistry(
  db: Database,
): Promise<ResolvedModelEntry[]> {
  await ensureCloudModelsMigrated(db);
  const machine: ResolvedModelEntry[] = getMachineAiModels();
  const cloud = await readCloudModels(db);
  return [...machine, ...cloud].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return Number(isMachineLocalEntry(b)) - Number(isMachineLocalEntry(a));
  });
}

/**
 * Persist a whole registry, routing each row to where it belongs.
 *
 * Callers edit one merged list — the Settings table does not need to know which
 * half a row lives in — and this decides. A row that changes from local to
 * cloud (or back) therefore moves stores on save, without a separate step.
 */
export async function saveModelRegistry(
  db: Database,
  entries: ResolvedModelEntry[],
): Promise<void> {
  // Claim the migration slot first: writing the split list *is* the migration,
  // and letting a later lazy pass run would re-upload rows just removed.
  migratedDatabases.add(db as unknown as object);
  saveMachineAiModels(entries.filter(isMachineLocalEntry).map(stripSecret));
  await writeCloudModels(
    db,
    entries.filter((entry) => !isMachineLocalEntry(entry)),
  );
}

/**
 * Move an explicitly chosen machine model to the front while keeping the
 * remaining entries as deterministic fallbacks.
 */
export function promoteModelToPrimary<
  T extends { id: string; order: number },
>(models: readonly T[], modelId: string): T[] {
  const selected = models.find((entry) => entry.id === modelId);
  if (!selected) return [...models];
  return [selected, ...models.filter((entry) => entry.id !== modelId)].map(
    (entry, order) => ({ ...entry, order }),
  );
}
