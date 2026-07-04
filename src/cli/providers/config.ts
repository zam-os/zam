import type { Database } from "../../kernel/index.js";
import {
  getMachineAiConfig,
  getProviderApiKey,
  getSetting,
  saveMachineAiConfig,
  setSetting,
} from "../../kernel/index.js";
import { withDb } from "../commands/shared/db.js";
import { type ApiFlavor, inferApiFlavor, type LlmRole } from "../llm/client.js";

export const VALID_API_FLAVORS: ApiFlavor[] = [
  "chat-completions",
  "anthropic-messages",
];
export const VALID_ROLES: LlmRole[] = ["vision", "recall", "text", "embedding"];

export interface ProviderRecord {
  label?: string;
  url?: string;
  model?: string;
  apiFlavor?: ApiFlavor;
  apiKeyRef?: string;
  local?: boolean;
  runner?: string;
}
export type ProvidersMap = Record<string, ProviderRecord>;
export interface RoleBinding {
  primary?: string;
  fallback?: string;
}
export type RolesMap = Partial<Record<LlmRole, RoleBinding>>;

/** Merge the provided (non-undefined) fields into the named provider record. */
export function upsertProviderRecord(
  providers: ProvidersMap,
  name: string,
  patch: ProviderRecord,
): ProvidersMap {
  const merged: ProviderRecord = { ...(providers[name] ?? {}) };
  if (patch.url !== undefined) merged.url = patch.url;
  if (patch.model !== undefined) merged.model = patch.model;
  if (patch.apiFlavor !== undefined) merged.apiFlavor = patch.apiFlavor;
  if (patch.apiKeyRef !== undefined) merged.apiKeyRef = patch.apiKeyRef;
  if (patch.label !== undefined) merged.label = patch.label;
  if (patch.local !== undefined) merged.local = patch.local;
  if (patch.runner !== undefined) merged.runner = patch.runner;
  return { ...providers, [name]: merged };
}

/** Drop a provider record. `removed` is false when the name was not present. */
export function removeProviderRecord(
  providers: ProvidersMap,
  name: string,
): { providers: ProvidersMap; removed: boolean } {
  if (!(name in providers)) return { providers, removed: false };
  const next = { ...providers };
  delete next[name];
  return { providers: next, removed: true };
}

/** Roles that reference `name` as their primary or fallback provider. */
export function rolesReferencing(roles: RolesMap, name: string): LlmRole[] {
  return VALID_ROLES.filter((role) => {
    const binding = roles[role];
    return binding?.primary === name || binding?.fallback === name;
  });
}

/** Bind a role to a primary (and optional fallback) provider. */
export function bindRoleProviders(
  roles: RolesMap,
  role: LlmRole,
  primary: string,
  fallback?: string,
): RolesMap {
  const binding: RoleBinding = { primary };
  if (fallback) binding.fallback = fallback;
  return { ...roles, [role]: binding };
}

/** Show a stored key as a recognizable, non-revealing last-4 fingerprint. */
export function maskSecret(key: string): string {
  return key.length <= 4 ? "••••" : `…${key.slice(-4)}`;
}

export interface ProviderListingRow {
  name: string;
  url?: string;
  model?: string;
  apiFlavor: ApiFlavor;
  apiKeyRef?: string;
  label?: string;
  local?: boolean;
  runner?: string;
  keyState: "set" | "missing" | "none";
}

/** Project provider records into display rows, resolving flavor and key state. */
export function buildProviderListing(
  providers: ProvidersMap,
  hasKey: (ref: string) => boolean,
): ProviderListingRow[] {
  return Object.entries(providers).map(([name, rec]) => {
    const apiFlavor =
      rec.apiFlavor ?? (rec.url ? inferApiFlavor(rec.url) : "chat-completions");
    let keyState: ProviderListingRow["keyState"];
    if (!rec.apiKeyRef) keyState = "none";
    else keyState = hasKey(rec.apiKeyRef) ? "set" : "missing";
    const row: ProviderListingRow = {
      name,
      url: rec.url,
      model: rec.model,
      apiFlavor,
      apiKeyRef: rec.apiKeyRef,
      keyState,
    };
    if (rec.label !== undefined) row.label = rec.label;
    if (rec.local !== undefined) row.local = rec.local;
    if (rec.runner !== undefined) row.runner = rec.runner;
    return row;
  });
}

/** Stored key refs that no provider record references (safe to clear). */
export function findOrphanKeyRefs(
  storedRefs: string[],
  providers: ProvidersMap,
): string[] {
  const used = new Set(
    Object.values(providers)
      .map((rec) => rec.apiKeyRef)
      .filter((ref): ref is string => !!ref),
  );
  return storedRefs.filter((ref) => !used.has(ref));
}

async function readJson<T>(db: Database, key: string, fallback: T): Promise<T> {
  const raw = await getSetting(db, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const readProviders = (db: Database): Promise<ProvidersMap> =>
  readJson<ProvidersMap>(db, "llm.providers", {});
const readRoles = (db: Database): Promise<RolesMap> =>
  readJson<RolesMap>(db, "llm.roles", {});

export async function readScopedProviders(
  db: Database | undefined,
  machine: boolean,
): Promise<ProvidersMap> {
  if (machine) return getMachineAiConfig().providers ?? {};
  if (!db)
    throw new Error("Database is required for shared provider settings.");
  return readProviders(db);
}

export async function readScopedRoles(
  db: Database | undefined,
  machine: boolean,
): Promise<RolesMap> {
  if (machine) return getMachineAiConfig().roles ?? {};
  if (!db)
    throw new Error("Database is required for shared provider settings.");
  return readRoles(db);
}

export async function writeScopedProviders(
  db: Database | undefined,
  machine: boolean,
  p: ProvidersMap,
): Promise<void> {
  if (machine) {
    const config = getMachineAiConfig();
    saveMachineAiConfig({ ...config, providers: p });
    return;
  }
  if (!db)
    throw new Error("Database is required for shared provider settings.");
  await setSetting(db, "llm.providers", JSON.stringify(p));
}

export async function writeScopedRoles(
  db: Database | undefined,
  machine: boolean,
  r: RolesMap,
): Promise<void> {
  if (machine) {
    const config = getMachineAiConfig();
    saveMachineAiConfig({ ...config, roles: r });
    return;
  }
  if (!db)
    throw new Error("Database is required for shared provider settings.");
  await setSetting(db, "llm.roles", JSON.stringify(r));
}

export async function withProviderScope(
  machine: boolean,
  action: (db: Database | undefined) => Promise<void>,
): Promise<void> {
  if (machine) {
    await action(undefined);
    return;
  }
  await withDb(action);
}

export function providerApiKeyIsSet(ref: string): boolean {
  return getProviderApiKey(ref) !== null;
}
