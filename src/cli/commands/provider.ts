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
  getProviderApiKey,
  getSetting,
  listProviderApiKeyRefs,
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
  url?: string;
  model?: string;
  apiFlavor?: ApiFlavor;
  apiKeyRef?: string;
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
    return {
      name,
      url: rec.url,
      model: rec.model,
      apiFlavor,
      apiKeyRef: rec.apiKeyRef,
      keyState,
    };
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

async function writeProviders(db: Database, p: ProvidersMap): Promise<void> {
  await setSetting(db, "llm.providers", JSON.stringify(p));
}
async function writeRoles(db: Database, r: RolesMap): Promise<void> {
  await setSetting(db, "llm.roles", JSON.stringify(r));
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
  .action(async (opts) => {
    await withDb(async (db) => {
      const providers = await readProviders(db);
      const roles = await readRoles(db);
      const rows = buildProviderListing(
        providers,
        (ref) => getProviderApiKey(ref) !== null,
      );
      const orphans = findOrphanKeyRefs(listProviderApiKeyRefs(), providers);

      if (opts.json) {
        console.log(
          JSON.stringify({ providers: rows, roles, orphans }, null, 2),
        );
        return;
      }

      console.log("Providers (llm.providers):\n");
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
  .option("--url <url>", "Endpoint base URL (e.g. https://api.deepseek.com/v1)")
  .option("--model <model>", "Model id (e.g. deepseek-v4-flash)")
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

    await withDb(async (db) => {
      const providers = await readProviders(db);
      const next = upsertProviderRecord(providers, name, {
        url: opts.url,
        model: opts.model,
        apiFlavor,
        apiKeyRef,
      });
      await writeProviders(db, next);
      if (opts.key && apiKeyRef) setProviderApiKey(apiKeyRef, opts.key);

      const rec = next[name];
      console.log(`Provider "${name}" saved:`);
      console.log(`  url:     ${rec.url ?? "(inherits llm.url)"}`);
      console.log(`  model:   ${rec.model ?? "(inherits llm.model)"}`);
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
  .action(async (name) => {
    await withDb(async (db) => {
      const providers = await readProviders(db);
      const { providers: next, removed } = removeProviderRecord(
        providers,
        name,
      );
      if (!removed) {
        console.log(`No such provider: ${name}`);
        return;
      }
      await writeProviders(db, next);
      console.log(`Removed provider "${name}".`);

      const referencing = rolesReferencing(await readRoles(db), name);
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
  .action(async (role, opts) => {
    if (!VALID_ROLES.includes(role)) {
      console.error(`Invalid role: ${role}. Use ${VALID_ROLES.join(", ")}.`);
      process.exit(1);
    }
    if (!opts.primary) {
      console.error("--primary is required.");
      process.exit(1);
    }
    await withDb(async (db) => {
      const providers = await readProviders(db);
      await writeRoles(
        db,
        bindRoleProviders(
          await readRoles(db),
          role,
          opts.primary,
          opts.fallback,
        ),
      );
      const fb = opts.fallback ? `, fallback: ${opts.fallback}` : "";
      console.log(`Role "${role}" → primary: ${opts.primary}${fb}`);

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
