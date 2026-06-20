/**
 * `zam observer` — configure what the UI observer may capture (Layer 2 of the
 * two-layer consent model; see docs/adr/0001-observer-permission-model.md).
 *
 * Thin sugar over the `observer.*` settings that also keeps the native sidecar's
 * policy file in sync after every change. `grant`/`revoke` manage the allowlist
 * by process name; deny a specific app with `zam settings set observer.denylist`.
 */

import { Command } from "commander";
import {
  getSetting,
  parseObserverList,
  resolveObserverPolicy,
  setSetting,
  syncObserverSidecarPolicy,
} from "../../kernel/index.js";
import { withDb } from "./shared/db.js";

export const observerCommand = new Command("observer").description(
  "Configure what the UI observer may capture (Layer 2 policy)",
);

/**
 * Pure: add or remove an entry in a comma-separated observer list setting,
 * normalized (trimmed, lower-cased, de-duplicated) exactly like the policy
 * resolver parses it.
 */
export function applyObserverListChange(
  current: string | undefined,
  entry: string,
  op: "add" | "remove",
): string {
  const normalized = entry.trim().toLowerCase();
  const list = parseObserverList(current);
  const next =
    op === "add"
      ? [...new Set([...list, normalized])]
      : list.filter((item) => item !== normalized);
  return next.join(",");
}

// ── zam observer status ────────────────────────────────────────────────────

observerCommand
  .command("status")
  .description("Show the active observer policy")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      const policy = await resolveObserverPolicy(db);
      if (opts.json) {
        console.log(JSON.stringify(policy, null, 2));
        return;
      }
      console.log("Observer policy:\n");
      console.log(`  Scope:         ${policy.scope}`);
      console.log(`  Consent:       ${policy.consent}`);
      console.log(`  Retention:     ${policy.retention}`);
      console.log(
        `  Allowlist:     ${
          policy.allowlist.length
            ? policy.allowlist.join(", ")
            : "(any targeted window)"
        }`,
      );
      console.log(
        `  Denylist:      ${
          policy.denylist.length ? policy.denylist.join(", ") : "(none)"
        }`,
      );
      console.log(`  Redact titles: ${policy.redactWindowTitles}`);
      console.log(
        "\nBuilt-in sensitive surfaces (password managers, auth/UAC dialogs, " +
          "banking) are always refused and cannot be allowlisted.",
      );
    });
  });

// ── zam observer grant <process> ─────────────────────────────────────────────

observerCommand
  .command("grant <process>")
  .description(
    "Allow the observer to capture a process (adds it to observer.allowlist)",
  )
  .action(async (processName: string) => {
    await withDb(async (db) => {
      const next = applyObserverListChange(
        await getSetting(db, "observer.allowlist"),
        processName,
        "add",
      );
      await setSetting(db, "observer.allowlist", next);
      await syncObserverSidecarPolicy(db);
      console.log(`Granted: ${processName.trim().toLowerCase()}`);
      console.log(`observer.allowlist = ${next || "(empty)"}`);
    });
  });

// ── zam observer revoke <process> ────────────────────────────────────────────

observerCommand
  .command("revoke <process>")
  .description("Remove a process from observer.allowlist")
  .action(async (processName: string) => {
    await withDb(async (db) => {
      const next = applyObserverListChange(
        await getSetting(db, "observer.allowlist"),
        processName,
        "remove",
      );
      await setSetting(db, "observer.allowlist", next);
      await syncObserverSidecarPolicy(db);
      console.log(`Revoked: ${processName.trim().toLowerCase()}`);
      console.log(`observer.allowlist = ${next || "(empty)"}`);
    });
  });
