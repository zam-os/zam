/**
 * `zam trust` — the folders ZAM may read files from (ADR 2026-10-08b D1).
 *
 * Source links and agent tools read files only inside the folders trusted
 * here and the agent app's own workspace folders. A learner command only:
 * no bridge command for the Studio panel and no MCP tool can trust a folder.
 */

import { Command } from "commander";
import {
  addTrustedFolder,
  getTrustedFolders,
  removeTrustedFolder,
} from "../../kernel/index.js";
import { suggestTrustedFolders } from "../trusted-folders.js";
import { withDb } from "./shared/db.js";

export const trustCommand = new Command("trust").description(
  "Folders ZAM may read files from (source links, knowledge bases, agent tools)",
);

trustCommand
  .command("list")
  .description("Show trusted folders and the folders your cards link into")
  .option("--json", "Output as JSON")
  .action(async (opts) => {
    await withDb(async (db) => {
      const folders = getTrustedFolders();
      const suggestions = await suggestTrustedFolders(db);
      if (opts.json) {
        console.log(JSON.stringify({ folders, suggestions }, null, 2));
        return;
      }
      if (folders.length === 0) {
        console.log("No trusted folders yet.");
      } else {
        console.log("Trusted folders:");
        for (const folder of folders) console.log(`  ${folder}`);
      }
      if (suggestions.length > 0) {
        console.log(
          "\nYour cards link into knowledge bases in folders ZAM may not read yet:",
        );
        for (const { folder, cards } of suggestions) {
          console.log(`  ${folder}  (${cards} card${cards === 1 ? "" : "s"})`);
        }
        console.log("\nTrust them with: zam trust suggested");
      }
    });
  });

trustCommand
  .command("add")
  .description("Trust a folder")
  .argument("<folder>", "Folder to trust")
  .action((folder: string) => {
    try {
      console.log(`Trusted ${addTrustedFolder(folder)}`);
    } catch (err) {
      console.error((err as Error).message);
      process.exit(1);
    }
  });

trustCommand
  .command("remove")
  .description("Stop trusting a folder")
  .argument("<folder>", "Folder to stop trusting")
  .action((folder: string) => {
    console.log(
      removeTrustedFolder(folder)
        ? `No longer trusted: ${folder}`
        : `Was not trusted: ${folder}`,
    );
  });

trustCommand
  .command("suggested")
  .description(
    "Trust every folder your cards link into that holds a knowledge base",
  )
  .action(async () => {
    await withDb(async (db) => {
      const suggestions = await suggestTrustedFolders(db);
      if (suggestions.length === 0) {
        console.log(
          "Nothing to trust: every knowledge base your cards use is readable.",
        );
        return;
      }
      for (const { folder } of suggestions) {
        console.log(`Trusted ${addTrustedFolder(folder)}`);
      }
    });
  });
