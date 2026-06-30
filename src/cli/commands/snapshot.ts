/**
 * `zam snapshot` — export / import / verify a portable SQL-text snapshot of the
 * learning database. (Increment 12, Phase 4.)
 *
 * Snapshots are safe to keep in a file-sync folder (Drive, OneDrive, iCloud):
 * unlike the live `~/.zam/zam.db` WAL database, a snapshot is plain SQL text and
 * is never written while half-applied. Export on one machine, import on another.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Command } from "commander";
import {
  exportSnapshot,
  importSnapshot,
  openDatabaseWithSync,
  verifySnapshot,
} from "../../kernel/index.js";
import { ensureActiveWorkspace } from "../workspaces/active.js";

/** `zam-snapshot-2026-06-13T09-41-22.sql` — sorts chronologically. */
function defaultOutName(): string {
  const stamp = new Date()
    .toISOString()
    .replace(/\.\d+Z$/, "")
    .replace(/:/g, "-");
  return `zam-snapshot-${stamp}.sql`;
}

function summarize(tables: Record<string, number>): {
  total: number;
  nonEmpty: string[];
} {
  let total = 0;
  const nonEmpty: string[] = [];
  for (const [name, count] of Object.entries(tables)) {
    total += count;
    if (count > 0) nonEmpty.push(`${name}: ${count}`);
  }
  return { total, nonEmpty };
}

const exportCmd = new Command("export")
  .description("Write a portable SQL-text snapshot of the database")
  .option("--out <file>", "Output file (use - for stdout)")
  .action(async (opts: { out?: string }) => {
    let db: Awaited<ReturnType<typeof openDatabaseWithSync>> | undefined;
    try {
      db = await openDatabaseWithSync({ initialize: true });
      const snapshot = await exportSnapshot(db);
      // Default snapshots into the personal folder (which may be file-synced),
      // so cross-device moves work without copying the live database.
      const personalDir = (await ensureActiveWorkspace(db)).path;
      await db.close();
      db = undefined;

      const manifest = verifySnapshot(snapshot);
      const { total, nonEmpty } = summarize(manifest.tables);

      if (opts.out === "-") {
        process.stdout.write(snapshot);
        return;
      }

      const out = opts.out ?? join(personalDir, "snapshots", defaultOutName());
      const dir = dirname(out);
      if (dir && dir !== "." && !existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(out, snapshot, "utf-8");

      console.log(`Snapshot written: ${out}`);
      console.log(
        `  ${total} row(s)${nonEmpty.length ? ` — ${nonEmpty.join(", ")}` : ""}`,
      );
    } catch (err) {
      await db?.close();
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

const importCmd = new Command("import")
  .description("Restore a snapshot into the database")
  .argument("<file>", "Snapshot file to restore")
  .option("--force", "Overwrite a non-empty database", false)
  .action(async (file: string, opts: { force: boolean }) => {
    let db: Awaited<ReturnType<typeof openDatabaseWithSync>> | undefined;
    try {
      if (!existsSync(file)) {
        console.error(`Error: Snapshot file not found: ${file}`);
        process.exit(1);
      }
      const snapshot = readFileSync(file, "utf-8");

      db = await openDatabaseWithSync({ initialize: true });
      const result = await importSnapshot(db, snapshot, { force: opts.force });
      await db.close();
      db = undefined;

      const { nonEmpty } = summarize(result.tables);
      console.log(`Snapshot restored from ${file}`);
      console.log(
        `  ${result.total} row(s)${nonEmpty.length ? ` — ${nonEmpty.join(", ")}` : ""}`,
      );
    } catch (err) {
      await db?.close();
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

const verifyCmd = new Command("verify")
  .description("Check a snapshot's manifest and checksum without importing")
  .argument("<file>", "Snapshot file to verify")
  .action((file: string) => {
    try {
      if (!existsSync(file)) {
        console.error(`Error: Snapshot file not found: ${file}`);
        process.exit(1);
      }
      const manifest = verifySnapshot(readFileSync(file, "utf-8"));
      const { total, nonEmpty } = summarize(manifest.tables);
      console.log(`Valid snapshot (format v${manifest.version})`);
      console.log(`  created: ${manifest.createdAt}`);
      console.log(
        `  ${total} row(s)${nonEmpty.length ? ` — ${nonEmpty.join(", ")}` : ""}`,
      );
    } catch (err) {
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });

export const snapshotCommand = new Command("snapshot")
  .description("Export, import, or verify a portable database snapshot")
  .addCommand(exportCmd)
  .addCommand(importCmd)
  .addCommand(verifyCmd);
