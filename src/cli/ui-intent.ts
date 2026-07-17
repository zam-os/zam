import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
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
  hostRegistrationPath?: string;
}

interface UiHostRegistration {
  version: 1;
  intentPath: string;
  updatedAt: string;
}

export function getUiIntentPath(home: string = homedir()): string {
  return join(home, ".zam", "ui-intent.json");
}

export function getUiHostRegistrationPath(home: string = homedir()): string {
  return join(home, ".zam", "vscode-host.json");
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

/**
 * Atomically hand one purpose-built MCP App request to a local visual host.
 * The file is deliberately a last-intent snapshot rather than a queue: users
 * operate one harness at a time, and a newer request supersedes an older one.
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
 * Opening an MCP App must still succeed in hosts that do not run the VS Code
 * companion, or when its optional local handoff cannot be written.
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
    const registrationPath =
      opts.hostRegistrationPath ?? getUiHostRegistrationPath();
    const registration = JSON.parse(
      await readFile(registrationPath, "utf8"),
    ) as Partial<UiHostRegistration>;
    const updatedAt = Date.parse(registration.updatedAt ?? "");
    if (
      registration.version !== 1 ||
      typeof registration.intentPath !== "string" ||
      !Number.isFinite(updatedAt) ||
      now.getTime() - updatedAt > 15_000
    ) {
      return undefined;
    }

    return await writeUiIntent(app, input, {
      ...opts,
      path: registration.intentPath,
      now: () => now,
    });
  } catch {
    return undefined;
  }
}
