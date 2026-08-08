/**
 * Moving a device-local library onto a server database (ADR 2026-08-08).
 *
 * This is the step that turns "my iPad" into "my devices", and it is the one
 * place in the app where the learner can lose something. The order below is
 * chosen so that every failure leaves them exactly where they started:
 *
 *   1. read the whole local library into a portable snapshot — *before*
 *      touching anything remote, so a failure here changes nothing;
 *   2. open the remote database and provision its schema;
 *   3. refuse to continue if the remote already holds cards, unless the
 *      learner said to replace them;
 *   4. import the snapshot;
 *   5. only then store the pairing, which is what makes the switch permanent.
 *
 * The local file is never deleted. It costs a few hundred kilobytes and it is
 * the only copy of a learner's history if a token is later revoked.
 */

import { applySchemaAndMigrations } from "../../../src/kernel/db/provision.js";
import {
  exportSnapshot,
  importSnapshot,
} from "../../../src/kernel/db/snapshot.js";
import type { Database } from "../../../src/kernel/db/types.js";
import { readLocalSetup } from "./first-run.js";

export type UpgradeStage =
  | "reading"
  | "connecting"
  | "provisioning"
  | "transferring"
  | "done";

export interface UpgradeProgress {
  stage: UpgradeStage;
}

export interface UpgradeOptions {
  /** libsql:// or https:// URL of the server database. */
  url: string;
  authToken: string;
  /** Overwrite a server database that already holds cards. */
  replaceRemote?: boolean;
  onProgress?(progress: UpgradeProgress): void;
}

export interface UpgradeResult {
  ok: boolean;
  /** Rows transferred, summed across tables. */
  transferred?: number;
  /** `remote_not_empty` when the target holds cards and replace was not set. */
  error?: string;
  /** Learner id the server database is now keyed to. */
  userId?: string;
}

/**
 * What the caller must provide to reach both databases. Injected rather than
 * imported so the test suite can run the whole path in process.
 */
export interface UpgradeIo {
  /** The currently open device-local database. */
  local: Database;
  /** Close the local connection and open the remote one. */
  openRemote(url: string, authToken: string): Promise<Database>;
  /** Re-open the device-local database after a failed switch. */
  reopenLocal(): Promise<Database>;
}

const REMOTE_NOT_EMPTY = "remote_not_empty";

/**
 * Copy this device's library onto a server database and switch to it.
 *
 * On any failure after the remote is open, the local database is reopened and
 * returned as the active one — the learner keeps learning on the device and
 * can try again.
 */
export async function upgradeToServerDatabase(
  io: UpgradeIo,
  options: UpgradeOptions,
): Promise<UpgradeResult & { db: Database }> {
  const report = (stage: UpgradeStage) => options.onProgress?.({ stage });

  report("reading");
  const setup = await readLocalSetup(io.local);
  const snapshot = await exportSnapshot(io.local);

  report("connecting");
  let remote: Database;
  try {
    remote = await io.openRemote(options.url.trim(), options.authToken.trim());
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      db: await io.reopenLocal(),
    };
  }

  try {
    report("provisioning");
    // A freshly created Turso database has no tables at all, and one made by
    // an older ZAM may predate a migration — both are handled here.
    await applySchemaAndMigrations(remote);

    const existing = (await remote
      .prepare("SELECT COUNT(*) AS n FROM cards")
      .get()) as { n: number };
    if (Number(existing.n) > 0 && !options.replaceRemote) {
      return {
        ok: false,
        error: REMOTE_NOT_EMPTY,
        db: await io.reopenLocal(),
      };
    }

    report("transferring");
    const result = await importSnapshot(remote, snapshot, {
      force: Boolean(options.replaceRemote),
    });

    report("done");
    return {
      ok: true,
      transferred: result.total,
      userId: setup?.userId,
      db: remote,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      db: await io.reopenLocal(),
    };
  }
}

export { REMOTE_NOT_EMPTY };
