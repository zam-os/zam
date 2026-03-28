/**
 * Resolve the active user ID from --user flag or stored whoami setting.
 */

import type { Database } from "libsql";
import { getSetting } from "../../kernel/index.js";

export interface ResolveUserOptions {
  /** If true, output JSON error instead of console.error (for bridge commands). */
  json?: boolean;
}

/**
 * Returns the user ID from the explicit --user flag, or falls back to the
 * stored `user.id` setting. Exits with an error if neither is available.
 */
export function resolveUser(
  opts: { user?: string },
  db: Database,
  resolveOpts?: ResolveUserOptions,
): string {
  if (opts.user) return opts.user;

  const stored = getSetting(db, "user.id");
  if (stored) return stored;

  const message = 'No user specified. Set a default with: zam whoami --set <id>';
  if (resolveOpts?.json) {
    console.log(JSON.stringify({ error: message }, null, 2));
  } else {
    console.error(message);
  }
  process.exit(1);
}
