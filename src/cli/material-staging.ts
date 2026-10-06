/**
 * Machine-local staging for material imports (ADR 2026-10-05 Decision 2).
 *
 * On the harness path the agent's proposals arrive in the `zam mcp` process,
 * and the learner decides them in the Studio — another process, possibly
 * started later. Until the learner confirms, a batch is therefore neither a
 * token nor a card row: it waits as one JSON file under
 * `~/.zam/pending-imports/`, written atomically like the focused OKF article.
 *
 * A batch holds the proposals and file references, never the material
 * itself. Batches nobody confirms or discards expire after
 * {@link STAGED_IMPORT_TTL_DAYS} days.
 */

import {
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { ulid } from "ulid";
import {
  type MaterialProposalSet,
  type MaterialReviewRow,
  parseMaterialProposalSet,
} from "../kernel/index.js";

export const STAGED_IMPORT_TTL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const ID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export type StagedImportOrigin = "harness" | "studio";

export interface StagedImport {
  version: 1;
  id: string;
  createdAt: string;
  origin: StagedImportOrigin;
  /** The host that submitted the batch on the harness path, when known. */
  harness?: string;
  /** On the built-in path: the model that read the pages (D11). */
  readBy?: string;
  /** On the built-in path: every model the pages were sent to, in order. */
  sentTo?: string[];
  set: MaterialProposalSet;
  /**
   * The rows the learner was shown. Kept so a confirm applies decisions to
   * exactly that list, even if the library or the embeddings changed since.
   */
  rows?: MaterialReviewRow[];
  reviewedAt?: string;
}

export interface StagingOptions {
  /** Directory override; defaults to `ZAM_PENDING_IMPORTS_DIR`, then `~/.zam/pending-imports`. */
  dir?: string;
  now?: () => Date;
}

export function getPendingImportsDir(opts: StagingOptions = {}): string {
  return (
    opts.dir ??
    process.env.ZAM_PENDING_IMPORTS_DIR ??
    join(homedir(), ".zam", "pending-imports")
  );
}

function batchPath(id: string, opts: StagingOptions): string {
  if (!ID_PATTERN.test(id)) {
    throw new Error(`Invalid import id: ${id}`);
  }
  return join(getPendingImportsDir(opts), `${id}.json`);
}

function isExpired(batch: StagedImport, now: Date): boolean {
  const created = Date.parse(batch.createdAt);
  return (
    !Number.isFinite(created) ||
    now.getTime() - created > STAGED_IMPORT_TTL_DAYS * DAY_MS
  );
}

/** Parse a staged file; `null` for anything that is not a valid batch. */
function parseBatch(raw: string): StagedImport | null {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const batch = value as Partial<StagedImport>;
  if (
    batch.version !== 1 ||
    typeof batch.id !== "string" ||
    !ID_PATTERN.test(batch.id) ||
    typeof batch.createdAt !== "string" ||
    (batch.origin !== "harness" && batch.origin !== "studio")
  ) {
    return null;
  }
  try {
    return {
      version: 1,
      id: batch.id,
      createdAt: batch.createdAt,
      origin: batch.origin,
      ...(typeof batch.harness === "string" ? { harness: batch.harness } : {}),
      ...(typeof batch.readBy === "string" ? { readBy: batch.readBy } : {}),
      ...(Array.isArray(batch.sentTo) &&
      batch.sentTo.every((label) => typeof label === "string")
        ? { sentTo: batch.sentTo }
        : {}),
      set: parseMaterialProposalSet(batch.set),
      ...(Array.isArray(batch.rows) ? { rows: batch.rows } : {}),
      ...(typeof batch.reviewedAt === "string"
        ? { reviewedAt: batch.reviewedAt }
        : {}),
    };
  } catch {
    return null;
  }
}

/** Write a batch atomically: a pid-scoped temp file, then rename. */
export async function writeStagedImport(
  batch: StagedImport,
  opts: StagingOptions = {},
): Promise<void> {
  const path = batchPath(batch.id, opts);
  await mkdir(getPendingImportsDir(opts), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(batch, null, 2)}\n`, "utf8");
  await rename(tmp, path);
}

/** Validate and stage a new batch; returns it with its fresh id. */
export async function stageMaterialImport(
  input: {
    set: unknown;
    origin: StagedImportOrigin;
    harness?: string;
    readBy?: string;
    sentTo?: string[];
  },
  opts: StagingOptions = {},
): Promise<StagedImport> {
  const batch: StagedImport = {
    version: 1,
    id: ulid(),
    createdAt: (opts.now?.() ?? new Date()).toISOString(),
    origin: input.origin,
    ...(input.harness ? { harness: input.harness } : {}),
    ...(input.readBy ? { readBy: input.readBy } : {}),
    ...(input.sentTo ? { sentTo: input.sentTo } : {}),
    set: parseMaterialProposalSet(input.set),
  };
  await writeStagedImport(batch, opts);
  return batch;
}

/** One batch, or `null` when it is missing, unreadable or expired. */
export async function readStagedImport(
  id: string,
  opts: StagingOptions = {},
): Promise<StagedImport | null> {
  const path = batchPath(id, opts);
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch {
    return null;
  }
  const batch = parseBatch(raw);
  if (!batch || batch.id !== id) return null;
  if (isExpired(batch, opts.now?.() ?? new Date())) return null;
  return batch;
}

/**
 * Waiting batches, newest first. Expired and unreadable files are removed on
 * the way: a list nobody can act on is noise, and the material they describe
 * is not in them anyway.
 */
export async function listStagedImports(
  opts: StagingOptions = {},
): Promise<StagedImport[]> {
  const dir = getPendingImportsDir(opts);
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const now = opts.now?.() ?? new Date();
  const batches: StagedImport[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const path = join(dir, name);
    let raw: string;
    try {
      raw = await readFile(path, "utf8");
    } catch {
      continue;
    }
    const batch = parseBatch(raw);
    if (!batch || `${batch.id}.json` !== name || isExpired(batch, now)) {
      await unlink(path).catch(() => {});
      continue;
    }
    batches.push(batch);
  }
  return batches.sort((a, b) =>
    a.createdAt === b.createdAt
      ? b.id.localeCompare(a.id)
      : b.createdAt.localeCompare(a.createdAt),
  );
}

/** Remove a batch; true when there was one. */
export async function discardStagedImport(
  id: string,
  opts: StagingOptions = {},
): Promise<boolean> {
  const path = batchPath(id, opts);
  try {
    await unlink(path);
    return true;
  } catch {
    return false;
  }
}
