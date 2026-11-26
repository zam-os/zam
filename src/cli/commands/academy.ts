/**
 * `zam academy provider` — the private Academy providers this learner trusts
 * on this machine (ADR 2026-11-25 Decision 3).
 *
 * Adding a provider decides where ZAM sends a login token, so `add` shows
 * what the provider file says and asks before it saves. Learner commands
 * only: no Studio-panel bridge command and no MCP tool can add, change or
 * remove a provider.
 */

import { createInterface } from "node:readline/promises";
import { Command } from "commander";
import {
  academyProviderAddHandler,
  academyProviderCheckHandler,
  academyProviderListHandler,
  academyProviderRemoveHandler,
  type ProviderSummary,
} from "../academy/provider-handlers.js";

export const academyCommand = new Command("academy").description(
  "ZAM Academy and the private Academy providers on this machine",
);

const providerCommand = academyCommand
  .command("provider")
  .description("Private Academy providers this machine trusts");

function describe(summary: ProviderSummary): string[] {
  return [
    `  ${summary.title}`,
    `  Publisher: ${summary.publisher}`,
    `  Host:      ${summary.host}`,
    `  Login:     ${summary.auth === "entra-cli" ? "Microsoft (Azure CLI)" : "none"}`,
    `  Reports:   ${summary.feedbackHost ?? "(none)"}`,
    `  Id:        ${summary.id}`,
  ];
}

providerCommand
  .command("add <url>")
  .description("Check a provider and add it after you confirm")
  .option("--yes", "Add without asking (scripts)")
  .option("--json", "Output as JSON")
  .action(async (url: string, opts: { yes?: boolean; json?: boolean }) => {
    try {
      if (opts.json && !opts.yes) {
        throw new Error("Pass --yes to confirm a provider when using --json");
      }
      const check = await academyProviderCheckHandler({ url });
      if (!opts.json) {
        console.log("This provider says:");
        for (const line of describe(check.provider)) console.log(line);
        if (check.alreadyConfirmed) {
          console.log(
            check.changed.length > 0
              ? `\nAlready added; changed since: ${check.changed.join(", ")}.`
              : "\nAlready added; nothing changed.",
          );
        }
      }
      if (!opts.yes) {
        if (!process.stdin.isTTY) {
          throw new Error("Not a terminal: pass --yes to add without asking");
        }
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        const answer = (
          await rl.question(`\nAdd ${check.provider.host}? [y/N] `)
        )
          .trim()
          .toLowerCase();
        rl.close();
        if (answer !== "y" && answer !== "yes" && answer !== "j") {
          console.log("Not added.");
          return;
        }
      }
      const added = await academyProviderAddHandler({
        url,
        sha256: check.sha256,
      });
      if (opts.json) {
        console.log(JSON.stringify(added, null, 2));
      } else {
        console.log(`Added ${added.provider.title} (${added.provider.id}).`);
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      if (opts.json) console.log(JSON.stringify({ success: false, error }));
      else console.error(error);
      process.exitCode = 1;
    }
  });

providerCommand
  .command("list")
  .description("Show the providers added on this machine")
  .option("--json", "Output as JSON")
  .action((opts: { json?: boolean }) => {
    const { providers } = academyProviderListHandler();
    if (opts.json) {
      console.log(JSON.stringify({ providers }, null, 2));
      return;
    }
    if (providers.length === 0) {
      console.log("No private Academy providers on this machine.");
      return;
    }
    for (const provider of providers) {
      for (const line of describe(provider)) console.log(line);
      console.log("");
    }
  });

providerCommand
  .command("remove <id>")
  .description("Forget a provider and its cache; your cards stay")
  .option("--json", "Output as JSON")
  .action((id: string, opts: { json?: boolean }) => {
    const result = academyProviderRemoveHandler({ id });
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    console.log(result.removed ? `Removed ${id}.` : `${id} was not added.`);
  });
