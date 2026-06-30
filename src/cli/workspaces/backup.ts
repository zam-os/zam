import { mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Database } from "../../kernel/index.js";

/**
 * Consistent single-file backup of the open database into
 * `<targetDir>/zam-backups/`. Uses SQLite `VACUUM INTO`, which writes a clean
 * snapshot even in WAL mode with a live connection. Returns the backup path.
 */
export async function backupDatabaseTo(
  db: Database,
  targetDir: string,
): Promise<string> {
  const backupDir = join(targetDir, "zam-backups");
  mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = join(backupDir, `zam-${stamp}.db`);
  await db.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
  return dest;
}
