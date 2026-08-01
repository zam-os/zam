/**
 * `zam credentials` — inspect vault-backed secret references without
 * printing any secret values (ADR 2026-07-30b).
 */

import { Command } from "commander";
import {
  checkCredentials,
  resolveCredentials,
} from "../../kernel/credentials.js";
import { disconnectBitwardenToLocalSecrets } from "../secrets-bridge.js";

export const credentialsCommand = new Command("credentials").description(
  "Inspect stored credentials and optional vault references (never prints secret values)",
);

credentialsCommand
  .command("check")
  .description(
    "Report each configured secret as literal/reference and ok/failed (no values). Useful after opting into vault refs; harmless with paste-only setup.",
  )
  .option("--json", "Output as JSON")
  .action(async (opts: { json?: boolean }) => {
    // Always re-resolve so the report reflects the live vault state.
    await resolveCredentials();
    const entries = checkCredentials();

    if (opts.json) {
      console.log(JSON.stringify({ credentials: entries }, null, 2));
      const failed = entries.some((e) => !e.ok && e.kind !== "missing");
      if (failed) process.exitCode = 1;
      return;
    }

    if (entries.length === 0) {
      console.log("No credentials configured.");
      return;
    }

    let failed = 0;
    for (const entry of entries) {
      if (entry.kind === "missing") {
        console.log(`  · ${entry.field}: (not set)`);
        continue;
      }
      if (entry.kind === "literal") {
        if (entry.ok) {
          console.log(`  ✓ ${entry.field}: literal`);
        } else {
          failed += 1;
          console.log(`  ✗ ${entry.field}: literal (empty)`);
        }
        continue;
      }
      // reference
      if (entry.ok) {
        console.log(`  ✓ ${entry.field}: ${entry.ref}`);
      } else {
        failed += 1;
        const detail = entry.reason
          ? `${entry.reason}${entry.message ? ` — ${entry.message}` : ""}`
          : (entry.message ?? "failed");
        console.log(`  ✗ ${entry.field}: ${entry.ref} (${detail})`);
      }
    }

    if (failed > 0) {
      console.log(
        `\n${failed} reference(s) failed. Fix the vault item(s) or re-run setup with --token-from / --key-from.`,
      );
      process.exitCode = 1;
    } else {
      console.log("\nAll configured secrets resolved.");
    }
  });

credentialsCommand
  .command("disconnect-vault")
  .description(
    "Copy Bitwarden-backed secrets back into credentials.json as literals and stop using the vault on this machine (does not delete Bitwarden items)",
  )
  .option("--json", "Output as JSON")
  .action(async (opts: { json?: boolean }) => {
    const result = await disconnectBitwardenToLocalSecrets();
    if (!result.ok) {
      if (opts.json) {
        console.log(
          JSON.stringify(
            { ok: false, error: result.message, entries: result.entries },
            null,
            2,
          ),
        );
      } else {
        console.error(result.message);
      }
      process.exitCode = 1;
      return;
    }
    const restored = result.entries.filter((e) => e.restored).length;
    if (opts.json) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            disconnected: true,
            restored,
            entries: result.entries,
          },
          null,
          2,
        ),
      );
      return;
    }
    console.log(
      `Disconnected Bitwarden. Restored ${restored} secret(s) as local values in credentials.json.`,
    );
    console.log(
      "Vault items were left in Bitwarden (not deleted). Auto-sync is off.",
    );
  });
