import {
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { ulid } from "ulid";

export type UiIntentApp = "recall" | "graph" | "settings" | "okf";

export interface UiIntent {
  version: 1;
  id: string;
  app: UiIntentApp;
  input: Record<string, string>;
  createdAt: string;
}

export interface WriteUiIntentOptions {
  path?: string;
  id?: string;
  now?: () => Date;
  /** Legacy single-slot registration (`~/.zam/vscode-host.json`). */
  hostRegistrationPath?: string;
  /** Per-window registry directory (`~/.zam/hosts`). */
  hostsDir?: string;
  /**
   * Working directory used to match a host by workspace. Defaults to the
   * publishing process's cwd, which for an agent's `zam mcp` is the workspace
   * the user is actually working in.
   */
  cwd?: string;
}

/** Legacy machine-global registration written by Companion ≤ 0.24.x. */
interface LegacyUiHostRegistration {
  version: 1;
  intentPath: string;
  updatedAt: string;
}

/**
 * One entry per live Companion window (`~/.zam/hosts/<hostId>.json`).
 *
 * The pre-0.25 handoff had a single registration slot and a single intent
 * file for the whole machine, so two open editor windows overwrote each
 * other's registration and then raced to consume the one shared intent —
 * whichever window happened to be focused won, and requests published while
 * no window was focused were dropped entirely. Each window now owns its own
 * registry entry and its own intent path, so an intent is addressed to
 * exactly one window.
 */
export interface UiHostEntry {
  version: 2;
  /** Stable per-window id (the extension host's pid). */
  hostId: string;
  /** The intent file this window — and only this window — consumes. */
  intentPath: string;
  /** First workspace folder of the window, when it has one. */
  workspace?: string;
  /** Whether the window was focused at the last heartbeat. */
  focused: boolean;
  /** Last time the window was focused, for tie-breaking. */
  focusedAt?: string;
  updatedAt: string;
}

/** A registration is only considered live for this long after its heartbeat. */
export const UI_HOST_FRESHNESS_MS = 15_000;

export function getUiIntentPath(home: string = homedir()): string {
  return join(home, ".zam", "ui-intent.json");
}

export function getUiHostRegistrationPath(home: string = homedir()): string {
  return join(home, ".zam", "vscode-host.json");
}

export function getUiHostsDirPath(home: string = homedir()): string {
  return join(home, ".zam", "hosts");
}

export function getUiHostIntentPath(
  hostId: string,
  home: string = homedir(),
): string {
  return join(home, ".zam", "intents", `${hostId}.json`);
}

/**
 * The OKF article one window's reader currently shows. Scoped per host for
 * the same reason intents are: two windows each browsing the knowledge base
 * would otherwise overwrite one another's "focused article", and
 * `zam_okf_focused` would resolve "import the open article" to whichever
 * window last painted (see `src/cli/okf-focus.ts`).
 */
export function getUiHostFocusPath(
  hostId: string,
  home: string = homedir(),
): string {
  return join(home, ".zam", "focus", `${hostId}.json`);
}

function compactStringInput(
  input: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(input).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function isUiHostEntry(value: unknown): value is UiHostEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<UiHostEntry>;
  return (
    entry.version === 2 &&
    typeof entry.hostId === "string" &&
    typeof entry.intentPath === "string" &&
    typeof entry.updatedAt === "string"
  );
}

/** True when `cwd` is the workspace directory or lives inside it. */
function isInsideWorkspace(cwd: string, workspace: string): boolean {
  const base = resolve(workspace);
  const target = resolve(cwd);
  return target === base || target.startsWith(base + sep);
}

/**
 * Read every live Companion registration. Unreadable or malformed entries are
 * skipped rather than failing the read — a half-written file from a window
 * starting up must never keep a healthy window from receiving its intent.
 */
export async function readUiHosts(dir: string): Promise<UiHostEntry[]> {
  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return [];
  }
  const entries = await Promise.all(
    names
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => {
        try {
          const parsed: unknown = JSON.parse(
            await readFile(join(dir, name), "utf8"),
          );
          return isUiHostEntry(parsed) ? parsed : undefined;
        } catch {
          return undefined;
        }
      }),
  );
  return entries.filter((entry): entry is UiHostEntry => entry !== undefined);
}

function heartbeatAge(entry: UiHostEntry, now: number): number {
  const updatedAt = Date.parse(entry.updatedAt);
  return Number.isFinite(updatedAt)
    ? now - updatedAt
    : Number.POSITIVE_INFINITY;
}

/**
 * Pick the window an intent belongs to.
 *
 * Workspace affinity comes first: an agent's `zam mcp` runs with the user's
 * workspace as its cwd, so the window holding that workspace is the one that
 * asked. Focus only breaks ties — relying on it alone is what made the
 * pre-0.25 handoff open panels in the wrong window.
 */
export function selectUiHost(
  hosts: UiHostEntry[],
  opts: { now: number; cwd?: string } = { now: Date.now() },
): UiHostEntry | undefined {
  const live = hosts.filter(
    (entry) => heartbeatAge(entry, opts.now) <= UI_HOST_FRESHNESS_MS,
  );
  if (live.length === 0) return undefined;

  const cwd = opts.cwd;
  const matching = cwd
    ? live.filter(
        (entry) => entry.workspace && isInsideWorkspace(cwd, entry.workspace),
      )
    : [];
  const candidates = matching.length > 0 ? matching : live;

  return [...candidates].sort((a, b) => {
    if (a.focused !== b.focused) return a.focused ? -1 : 1;
    const focusDelta =
      (Date.parse(b.focusedAt ?? "") || 0) -
      (Date.parse(a.focusedAt ?? "") || 0);
    if (focusDelta !== 0) return focusDelta;
    return heartbeatAge(a, opts.now) - heartbeatAge(b, opts.now);
  })[0];
}

/** Remove registrations whose window is long gone, so the registry stays small. */
export async function pruneUiHosts(
  dir: string,
  opts: { now?: number; maxAgeMs?: number } = {},
): Promise<void> {
  const now = opts.now ?? Date.now();
  const maxAgeMs = opts.maxAgeMs ?? 60_000;
  // `dir` is `<home>/.zam/hosts`, so the sibling per-host directories hang off
  // its parent — the same derivation the path helpers above encode.
  const zamDir = dirname(dir);
  for (const entry of await readUiHosts(dir)) {
    if (heartbeatAge(entry, now) <= maxAgeMs) continue;
    await unlink(join(dir, `${entry.hostId}.json`)).catch(() => {});
    await unlink(entry.intentPath).catch(() => {});
    await unlink(join(zamDir, "focus", `${entry.hostId}.json`)).catch(() => {});
  }
}

/**
 * Atomically hand one purpose-built MCP App request to a local visual host.
 * The file is deliberately a last-intent snapshot rather than a queue: a
 * newer request for the same window supersedes an older one.
 */
export async function writeUiIntent(
  app: UiIntentApp,
  input: Record<string, string | undefined> = {},
  opts: WriteUiIntentOptions = {},
): Promise<UiIntent> {
  const path = opts.path ?? process.env.ZAM_UI_INTENT_PATH ?? getUiIntentPath();
  const id = opts.id ?? ulid();
  const intent: UiIntent = {
    version: 1,
    id,
    app,
    input: compactStringInput(input),
    createdAt: (opts.now ?? (() => new Date()))().toISOString(),
  };
  const tempPath = join(dirname(path), `.ui-intent-${process.pid}-${id}.tmp`);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(tempPath, `${JSON.stringify(intent, null, 2)}\n`, "utf8");
  await rename(tempPath, path);
  return intent;
}

/**
 * Opening an MCP App must still succeed in hosts that do not run the
 * companion, or when its optional local handoff cannot be written.
 *
 * Resolution order: the per-window registry (Companion ≥ 0.25), then the
 * legacy single-slot registration so an older Companion still receives
 * intents from a newer CLI.
 */
export async function publishUiIntent(
  app: UiIntentApp,
  input: Record<string, string | undefined> = {},
  opts: WriteUiIntentOptions = {},
): Promise<UiIntent | undefined> {
  try {
    if (process.env.ZAM_DISABLE_UI_INTENT === "1") return undefined;
    const explicitPath = opts.path ?? process.env.ZAM_UI_INTENT_PATH;
    if (explicitPath) {
      return await writeUiIntent(app, input, { ...opts, path: explicitPath });
    }

    const now = (opts.now ?? (() => new Date()))();
    const target = await resolveIntentPath(now, opts);
    if (!target) return undefined;

    return await writeUiIntent(app, input, {
      ...opts,
      path: target,
      now: () => now,
    });
  } catch {
    return undefined;
  }
}

async function resolveIntentPath(
  now: Date,
  opts: WriteUiIntentOptions,
): Promise<string | undefined> {
  const registrationPath =
    opts.hostRegistrationPath ?? getUiHostRegistrationPath();
  // The registry always sits beside the legacy registration file (`~/.zam`),
  // so pointing one at a test home implicitly points the other there too.
  const hostsDir =
    opts.hostsDir ??
    (opts.hostRegistrationPath
      ? join(dirname(opts.hostRegistrationPath), "hosts")
      : getUiHostsDirPath());
  const host = selectUiHost(await readUiHosts(hostsDir), {
    now: now.getTime(),
    cwd: opts.cwd ?? process.cwd(),
  });
  if (host) return host.intentPath;

  try {
    const registration = JSON.parse(
      await readFile(registrationPath, "utf8"),
    ) as Partial<LegacyUiHostRegistration>;
    const updatedAt = Date.parse(registration.updatedAt ?? "");
    if (
      registration.version !== 1 ||
      typeof registration.intentPath !== "string" ||
      !Number.isFinite(updatedAt) ||
      now.getTime() - updatedAt > UI_HOST_FRESHNESS_MS
    ) {
      return undefined;
    }
    return registration.intentPath;
  } catch {
    return undefined;
  }
}
