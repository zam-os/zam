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

/** Synchronous wrapper: opens DB, calls fn, closes DB, handles errors. */
export function withDb(
  fn: (db: Database) => void,
  onError: ErrorHandler = defaultErrorHandler,
): void {
  let db: Database | undefined;
  try {
    db = openDatabase();
    fn(db);
  } catch (err) {
    onError((err as Error).message);
  } finally {
    db?.close();
  }
}

/** Asynchronous wrapper for commands that need async operations (LLM, etc.). */
export async function withDbAsync(
  fn: (db: Database) => Promise<void>,
  onError: ErrorHandler = defaultErrorHandler,
): Promise<void> {
  let db: Database | undefined;
  try {
    db = openDatabase();
    await fn(db);
  } catch (err) {
    onError((err as Error).message);
  } finally {
    db?.close();
  }
}

/**
 * JSON output helper — used by commands that support --json.
 */
export function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
