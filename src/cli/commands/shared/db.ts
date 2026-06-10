/**
 * Shared database helpers for CLI commands.
 *
 * Every command needs the same openDatabase → execute → close → handle errors
 * pattern.  These wrappers keep command files focused on their domain logic.
 */

import type { Database } from "../../../kernel/index.js";
import { openDatabase } from "../../../kernel/index.js";

type ErrorHandler = (message: string) => void;

function defaultErrorHandler(message: string): void {
  console.error("Error:", message);
  process.exit(1);
}

/** Opens the DB, awaits fn, closes the DB, handles errors. */
export async function withDb(
  fn: (db: Database) => void | Promise<void>,
  onError: ErrorHandler = defaultErrorHandler,
): Promise<void> {
  let db: Database | undefined;
  try {
    db = await openDatabase();
    await fn(db);
  } catch (err) {
    onError((err as Error).message);
  } finally {
    await db?.close();
  }
}

/**
 * JSON output helper — used by commands that support --json.
 */
export function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
