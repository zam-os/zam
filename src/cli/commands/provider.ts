/**
 * `zam provider` — Configure role-based AI providers (ADR 2026-06-23).
 *
 * Providers are named endpoint records in the `llm.providers` setting, bound to
 * roles (vision/recall/text) via `llm.roles`. API keys never live in the DB or
 * the provider record: they go to `~/.zam/credentials.json` under an `apiKeyRef`
 * (see `src/kernel/credentials.ts`), so workspace exports never carry secrets.
 *
 * This command is the entry path that makes `apiKeyRef` usable — previously the
 * kernel could read a stored key but nothing could write one.
 */

import { password } from "@inquirer/prompts";
import { Command } from "commander";
import type { Database } from "../../kernel/index.js";
import {
  clearProviderApiKey,
  getMachineAiConfig,
  getProviderApiKey,
  getSetting,
  listProviderApiKeyRefs,
  saveMachineAiConfig,
  setProviderApiKey,
  setSetting,
} from "../../kernel/index.js";
import { type ApiFlavor, inferApiFlavor, type LlmRole } from "../llm/client.js";
import { withDb } from "./shared/db.js";

export const VALID_API_FLAVORS: ApiFlavor[] = [
  "chat-completions",
  "anthropic-messages",
];
export const VALID_ROLES: LlmRole[] = ["vision", "recall", "text"];

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

// ── Pure helpers (unit-tested; no DB/fs) ─────────────────────────────────────

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

// ── Settings I/O ─────────────────────────────────────────────────────────────

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

async function readScopedProviders(
  db: Database | undefined,
  machine: boolean,
): Promise<ProvidersMap> {
  if (machine) return getMachineAiConfig().providers ?? {};
  if (!db)
    throw new Error("Database is required for shared provider settings.");
  return readProviders(db);
}

async function readScopedRoles(
  db: Database | undefined,
  machine: boolean,
): Promise<RolesMap> {
  if (machine) return getMachineAiConfig().roles ?? {};
  if (!db)
    throw new Error("Database is required for shared provider settings.");
  return readRoles(db);
}

async function writeScopedProviders(
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

async function writeScopedRoles(
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

async function withProviderScope(
  machine: boolean,
  action: (db: Database | undefined) => Promise<void>,
): Promise<void> {
  if (machine) {
    await action(undefined);
    return;
  }
  await withDb(action);
}

// ── Command ──────────────────────────────────────────────────────────────────

export const providerCommand = new Command("provider").description(
  "Configure role-based AI providers (url/model/flavor/key, per role)",
);

// ── zam provider list ────────────────────────────────────────────────────────

providerCommand
  .command("list")
  .description("Show configured providers, role bindings, and key status")
  .option("--json", "Output as JSON")
  .option("--machine", "Read machine-local providers from ~/.zam/config.json")
  .action(async (opts) => {
    const machine = Boolean(opts.machine);
    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      const roles = await readScopedRoles(db, machine);
      const rows = buildProviderListing(
        providers,
        (ref) => getProviderApiKey(ref) !== null,
      );
      const orphans = findOrphanKeyRefs(listProviderApiKeyRefs(), providers);

      if (opts.json) {
        console.log(
          JSON.stringify(
            {
              scope: machine ? "machine" : "shared",
              providers: rows,
              roles,
              orphans,
            },
            null,
            2,
          ),
        );
        return;
      }

      console.log(
        `Providers (${opts.machine ? "~/.zam/config.json ai.providers" : "llm.providers"}):\n`,
      );
      if (rows.length === 0) {
        console.log(
          "  (none) — add one: zam provider add <name> --url <url> --model <model>",
        );
      } else {
        for (const row of rows) {
          const key =
            row.keyState === "set"
              ? "\x1b[32mkey ✓\x1b[0m"
              : row.keyState === "missing"
                ? `\x1b[31mkey ✗ (set: zam provider set-key ${row.apiKeyRef})\x1b[0m`
                : "\x1b[90mno key\x1b[0m";
          console.log(`  \x1b[36m${row.name.padEnd(12)}\x1b[0m ${key}`);
          console.log(`      url:    ${row.url ?? "(inherits llm.url)"}`);
          console.log(`      model:  ${row.model ?? "(inherits llm.model)"}`);
          console.log(`      flavor: ${row.apiFlavor}`);
          if (row.label) console.log(`      label:  ${row.label}`);
          if (row.local !== undefined) {
            console.log(`      local:  ${row.local ? "yes" : "no"}`);
          }
          if (row.runner) console.log(`      runner: ${row.runner}`);
          if (row.apiKeyRef) console.log(`      key-ref: ${row.apiKeyRef}`);
        }
      }

      console.log("\nRoles (llm.roles):\n");
      for (const role of VALID_ROLES) {
        const binding = roles[role];
        if (!binding?.primary) {
          console.log(`  ${role.padEnd(7)} \x1b[90m(unset)\x1b[0m`);
        } else {
          const fb = binding.fallback ? ` → fallback: ${binding.fallback}` : "";
          console.log(`  ${role.padEnd(7)} primary: ${binding.primary}${fb}`);
        }
      }

      if (orphans.length > 0) {
        console.log(
          `\n\x1b[33mOrphan keys (stored but unreferenced):\x1b[0m ${orphans.join(", ")}`,
        );
      }
    });
  });

// ── zam provider add ─────────────────────────────────────────────────────────

providerCommand
  .command("add <name>")
  .description("Add or update a provider record in llm.providers")
  .option("--label <label>", "Human-readable provider label")
  .option("--url <url>", "Endpoint base URL (e.g. https://api.deepseek.com/v1)")
  .option("--model <model>", "Model id (e.g. deepseek-v4-flash)")
  .option("--local", "Mark this provider as a local/on-device endpoint")
  .option(
    "--runner <runner>",
    "Local runner hint (flm, foundry-local, ollama, ...)",
  )
  .option(
    "--flavor <flavor>",
    `Wire protocol: ${VALID_API_FLAVORS.join(" | ")} (default: inferred from URL)`,
  )
  .option(
    "--key-ref <ref>",
    "Credential reference for the API key (default: <name> when --key is given)",
  )
  .option(
    "--key <value>",
    "Store this API key now (prefer `set-key` to keep it out of shell history)",
  )
  .option("--machine", "Store this provider in ~/.zam/config.json")
  .action(async (name, opts) => {
    let apiFlavor: ApiFlavor | undefined;
    if (opts.flavor) {
      if (!VALID_API_FLAVORS.includes(opts.flavor)) {
        console.error(
          `Invalid --flavor: ${opts.flavor}. Use ${VALID_API_FLAVORS.join(" or ")}.`,
        );
        process.exit(1);
      }
      apiFlavor = opts.flavor;
    }
    const apiKeyRef: string | undefined =
      opts.keyRef ?? (opts.key ? name : undefined);

    const machine = Boolean(opts.machine);
    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      const next = upsertProviderRecord(providers, name, {
        label: opts.label,
        url: opts.url,
        model: opts.model,
        apiFlavor,
        apiKeyRef,
        local: opts.local ? true : undefined,
        runner: opts.runner,
      });
      await writeScopedProviders(db, machine, next);
      if (opts.key && apiKeyRef) setProviderApiKey(apiKeyRef, opts.key);

      const rec = next[name];
      console.log(
        `Provider "${name}" saved (${machine ? "machine-local" : "shared"}):`,
      );
      console.log(`  url:     ${rec.url ?? "(inherits llm.url)"}`);
      console.log(`  model:   ${rec.model ?? "(inherits llm.model)"}`);
      if (rec.label) console.log(`  label:   ${rec.label}`);
      if (rec.local !== undefined) {
        console.log(`  local:   ${rec.local ? "yes" : "no"}`);
      }
      if (rec.runner) console.log(`  runner:  ${rec.runner}`);
      console.log(
        `  flavor:  ${
          rec.apiFlavor ??
          `${rec.url ? inferApiFlavor(rec.url) : "chat-completions"} (inferred)`
        }`,
      );
      console.log(`  key-ref: ${rec.apiKeyRef ?? "(none — uses default key)"}`);
      if (opts.key) {
        console.log(`  key:     stored (${maskSecret(opts.key)})`);
      } else if (rec.apiKeyRef && getProviderApiKey(rec.apiKeyRef) === null) {
        console.log(
          `\n  ⚠ No key stored for "${rec.apiKeyRef}". Run: zam provider set-key ${rec.apiKeyRef}`,
        );
      }
      if (!rec.url) {
        console.log(
          "\n  ⚠ No --url set; this provider inherits the base llm.url.",
        );
      }
      console.log(
        `\nBind it to a role: zam provider use recall --primary ${name}`,
      );
    });
  });

// ── zam provider remove ──────────────────────────────────────────────────────

providerCommand
  .command("remove <name>")
  .description("Remove a provider record from llm.providers")
  .option("--machine", "Remove from ~/.zam/config.json instead of the DB")
  .action(async (name, opts) => {
    const machine = Boolean(opts.machine);
    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      const { providers: next, removed } = removeProviderRecord(
        providers,
        name,
      );
      if (!removed) {
        console.log(`No such provider: ${name}`);
        return;
      }
      await writeScopedProviders(db, machine, next);
      console.log(
        `Removed provider "${name}" (${machine ? "machine-local" : "shared"}).`,
      );

      const referencing = rolesReferencing(
        await readScopedRoles(db, machine),
        name,
      );
      if (referencing.length > 0) {
        console.log(
          `  ⚠ Still referenced by role(s): ${referencing.join(", ")} — rebind with: zam provider use <role> --primary <name>`,
        );
      }
    });
  });

// ── zam provider use ─────────────────────────────────────────────────────────

providerCommand
  .command("use <role>")
  .description(`Bind providers to a role (${VALID_ROLES.join(" | ")})`)
  .option("--primary <name>", "Primary provider")
  .option("--fallback <name>", "Fallback provider (optional)")
  .option("--machine", "Bind the role in ~/.zam/config.json")
  .action(async (role, opts) => {
    if (!VALID_ROLES.includes(role)) {
      console.error(`Invalid role: ${role}. Use ${VALID_ROLES.join(", ")}.`);
      process.exit(1);
    }
    if (!opts.primary) {
      console.error("--primary is required.");
      process.exit(1);
    }
    const machine = Boolean(opts.machine);
    await withProviderScope(machine, async (db) => {
      const providers = await readScopedProviders(db, machine);
      await writeScopedRoles(
        db,
        machine,
        bindRoleProviders(
          await readScopedRoles(db, machine),
          role,
          opts.primary,
          opts.fallback,
        ),
      );
      const fb = opts.fallback ? `, fallback: ${opts.fallback}` : "";
      console.log(
        `Role "${role}" → primary: ${opts.primary}${fb} (${machine ? "machine-local" : "shared"})`,
      );

      for (const [label, ref] of [
        ["primary", opts.primary],
        ["fallback", opts.fallback],
      ] as const) {
        if (ref && !(ref in providers)) {
          console.log(
            `  ⚠ ${label} "${ref}" is not a defined provider yet. Add it: zam provider add ${ref} --url <url> --model <model>`,
          );
        }
      }
    });
  });

// ── zam provider set-key ─────────────────────────────────────────────────────

providerCommand
  .command("set-key <ref>")
  .description(
    "Store an API key for a provider reference (in credentials.json)",
  )
  .option(
    "--key <value>",
    "The API key (omit to enter it interactively, hidden)",
  )
  .action(async (ref, opts) => {
    try {
      const key: string =
        opts.key ?? (await password({ message: `API key for "${ref}":` }));
      if (!key || key.trim().length === 0) {
        console.error("No key provided.");
        process.exit(1);
      }
      setProviderApiKey(ref, key.trim());
      console.log(`Stored API key for "${ref}" (${maskSecret(key.trim())}).`);
    } catch (err) {
      if ((err as Error).name === "ExitPromptError") {
        console.log("\nCancelled.");
        process.exit(0);
      }
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

// ── zam provider clear-key ───────────────────────────────────────────────────

providerCommand
  .command("clear-key <ref>")
  .description("Remove a stored API key")
  .action((ref) => {
    clearProviderApiKey(ref);
    console.log(`Cleared API key for "${ref}".`);
  });
