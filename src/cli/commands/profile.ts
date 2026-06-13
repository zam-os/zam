/**
 * `zam profile` — show or change this machine's ZAM install profile.
 *
 * Surfaces where everything lives so a non-developer never has to guess:
 *   - install mode (developer vs default),
 *   - the personal-content folder (beliefs/goals/identity), which may sit in a
 *     file-synced directory (Drive, OneDrive, Dropbox, iCloud) — no GitHub,
 *   - the data directory and database path.
 *
 * (Increment 12, Phase 3.)
 */

import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { Command } from "commander";
import {
  type Database,
  detectSyncProvider,
  getDefaultDbPath,
  getInstallMode,
  getSetting,
  type InstallMode,
  openDatabaseWithSync,
  setInstallMode,
  setSetting,
} from "../../kernel/index.js";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
};

function defaultPersonalDir(): string {
  return join(homedir(), "Documents", "zam");
}

interface Profile {
  mode: InstallMode;
  personalDir: string;
  syncProvider: string | null;
  dataDir: string;
  dbPath: string;
}

function render(profile: Profile): void {
  const sync = profile.syncProvider
    ? `${C.green}${profile.syncProvider}${C.reset} ${C.dim}(good for cross-device snapshots)${C.reset}`
    : `${C.dim}local folder (use a synced folder or snapshots to move between machines)${C.reset}`;

  console.log(`${C.bold}ZAM install profile${C.reset}`);
  console.log(`  mode:          ${C.cyan}${profile.mode}${C.reset}`);
  console.log(`  personal dir:  ${C.cyan}${profile.personalDir}${C.reset}`);
  console.log(`  sync:          ${sync}`);
  console.log(`  data dir:      ${C.cyan}${profile.dataDir}${C.reset}`);
  console.log(`  database:      ${C.cyan}${profile.dbPath}${C.reset}`);
}

export const profileCommand = new Command("profile")
  .description("Show or change this machine's ZAM install profile")
  .option("--mode <mode>", "Set install mode: developer | default")
  .option("--dir <path>", "Set the personal-content folder")
  .option("--json", "Output as JSON")
  .action(async (opts: { mode?: string; dir?: string; json?: boolean }) => {
    if (opts.mode && opts.mode !== "developer" && opts.mode !== "default") {
      console.error(`Invalid --mode: ${opts.mode}. Use developer or default.`);
      process.exit(1);
    }

    let db: Database | undefined;
    try {
      if (opts.mode) setInstallMode(opts.mode as InstallMode);

      db = await openDatabaseWithSync({ initialize: true });
      if (opts.dir) {
        await setSetting(db, "personal.workspace_dir", resolve(opts.dir));
      }
      const personalDir =
        (await getSetting(db, "personal.workspace_dir")) ||
        defaultPersonalDir();
      await db.close();
      db = undefined;

      const dbPath = getDefaultDbPath();
      const profile: Profile = {
        mode: getInstallMode(),
        personalDir,
        syncProvider: detectSyncProvider(personalDir),
        dataDir: dirname(dbPath),
        dbPath,
      };

      if (opts.json) {
        console.log(JSON.stringify(profile, null, 2));
        return;
      }
      render(profile);
    } catch (err) {
      await db?.close();
      console.error("Error:", (err as Error).message);
      process.exit(1);
    }
  });
