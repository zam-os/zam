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
import {
  clearProviderApiKey,
  getProviderApiKey,
  listProviderApiKeyRefs,
  setProviderApiKey,
} from "../../kernel/index.js";
import { type ApiFlavor, inferApiFlavor } from "../llm/client.js";
import {
  bindRoleProviders,
  buildProviderListing,
  findOrphanKeyRefs,
  maskSecret,
  readScopedProviders,
  readScopedRoles,
  removeProviderRecord,
  rolesReferencing,
  upsertProviderRecord,
  VALID_API_FLAVORS,
  VALID_ROLES,
  withProviderScope,
  writeScopedProviders,
  writeScopedRoles,
} from "../providers/config.js";

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
