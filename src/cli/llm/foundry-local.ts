/**
 * Microsoft Foundry Local integration.
 *
 * Foundry's OpenAI-compatible service is intentionally kept in the CLI layer:
 * the kernel only stores the selected endpoint and capabilities, while this
 * module is responsible for inspecting the local CLI, starting its service,
 * and preparing downloaded models.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { hasCommand } from "../../kernel/index.js";

const execFileAsync = promisify(execFile);

/** Keep Ollama's conventional 11434 port free for EmbeddingGemma. */
export const FOUNDRY_DEFAULT_PORT = 5273;
export const FOUNDRY_DEFAULT_URL = `http://127.0.0.1:${FOUNDRY_DEFAULT_PORT}/v1`;

export type FoundrySetupRole = "text";

export interface FoundryCatalogModel {
  alias: string;
  id: string;
  displayName?: string;
  type?: string;
  device?: string;
  fileSizeMb?: number;
  cached?: boolean;
}

export interface FoundryRecommendation {
  alias: string;
  /** The id exposed by Foundry's OpenAI-compatible /v1/models endpoint. */
  model: string;
  device?: string;
  fileSizeMb?: number;
}

export interface FoundryRecommendations {
  text?: FoundryRecommendation;
}

export interface FoundryLocalStatus {
  installed: boolean;
  running: boolean;
  endpoint?: string;
  models: FoundryCatalogModel[];
  recommendations: FoundryRecommendations;
  error?: string;
}

export interface FoundryPreparedModel extends FoundryRecommendation {
  role: FoundrySetupRole;
  downloaded: boolean;
}

export interface FoundrySetupResult {
  ok: boolean;
  status: FoundryLocalStatus;
  prepared?: FoundryPreparedModel;
  error?: string;
}

export interface FoundryLocalDeps {
  platform: NodeJS.Platform;
  hasFoundry: () => boolean;
  hasWinget: () => boolean;
  run: (command: string, args: string[]) => Promise<string>;
}

function commandError(error: unknown): Error {
  const value = error as {
    message?: string;
    stdout?: string | Buffer;
    stderr?: string | Buffer;
  };
  const parts = [value.stderr, value.stdout, value.message]
    .map((part) => (part === undefined ? "" : String(part).trim()))
    .filter(Boolean);
  return new Error(parts.join("\n") || "Foundry Local command failed.");
}

function defaultDeps(): FoundryLocalDeps {
  return {
    platform: process.platform,
    hasFoundry: () => hasCommand("foundry"),
    hasWinget: () => hasCommand("winget"),
    run: async (command, args) => {
      try {
        const { stdout } = await execFileAsync(command, args, {
          encoding: "utf8",
          windowsHide: true,
          timeout: 10 * 60_000,
          maxBuffer: 4 * 1024 * 1024,
        });
        return String(stdout);
      } catch (error) {
        throw commandError(error);
      }
    },
  };
}

function parseJson<T>(output: string, description: string): T {
  try {
    return JSON.parse(output.replace(/^\uFEFF/, "")) as T;
  } catch {
    throw new Error(`Foundry Local returned invalid ${description}.`);
  }
}

function stripVariantVersion(model: string): string {
  return model.replace(/:\d+$/, "");
}

/** Convert a catalog id to the model id accepted by /v1/chat/completions. */
export function foundryHttpModelId(
  model: Pick<FoundryCatalogModel, "id" | "alias">,
): string {
  return stripVariantVersion(model.id || model.alias);
}

function toRecommendation(
  model: FoundryCatalogModel | undefined,
): FoundryRecommendation | undefined {
  if (!model) return undefined;
  return {
    alias: model.alias,
    model: foundryHttpModelId(model),
    device: model.device,
    fileSizeMb: model.fileSizeMb,
  };
}

function findAlias(
  models: FoundryCatalogModel[],
  aliases: string[],
): FoundryCatalogModel | undefined {
  for (const alias of aliases) {
    const match = models.find(
      (model) => model.alias.toLowerCase() === alias.toLowerCase(),
    );
    if (match) return match;
  }
  return undefined;
}

/** Foundry reports the device a catalog build targets, e.g. `Npu` or `Cpu`. */
function isAcceleratedBuild(model: FoundryCatalogModel): boolean {
  const device = model.device?.trim().toLowerCase();
  return device === "npu" || device === "gpu";
}

/**
 * Choose a text default from the catalog actually available on the machine, so
 * learners never have to guess model ids.
 *
 * Only accelerated builds are offered. A CPU build of a chat model is fast
 * enough to finish and too slow to review with, and a recall session that
 * stalls is one that does not happen — so no recommendation is the honest
 * answer where no accelerated build exists, and the learner is pointed at a
 * cloud model instead.
 */
export function chooseFoundryRecommendations(
  models: FoundryCatalogModel[],
): FoundryRecommendations {
  const accelerated = models.filter(isAcceleratedBuild);
  const preferred = findAlias(accelerated, [
    "phi-3.5-mini",
    "qwen3.5-2b-text",
    "qwen3.5-0.8b",
  ]);
  return { text: toRecommendation(preferred ?? accelerated[0]) };
}

interface ServerStatusJson {
  running?: boolean;
  state?: string;
  webUrls?: string[];
  port?: number;
}

interface CatalogJson {
  models?: FoundryCatalogModel[];
}

async function runFoundry(
  deps: FoundryLocalDeps,
  args: string[],
): Promise<string> {
  return deps.run("foundry", args);
}

/** Support both the current `server` and preview-era `service` command group. */
async function runServerCommand(
  deps: FoundryLocalDeps,
  command: "start" | "status",
): Promise<string> {
  try {
    return await runFoundry(deps, ["server", command, "--output", "json"]);
  } catch (firstError) {
    try {
      return await runFoundry(deps, ["service", command, "--output", "json"]);
    } catch {
      throw firstError;
    }
  }
}

async function getServerStatus(
  deps: FoundryLocalDeps,
): Promise<ServerStatusJson> {
  const raw = await runServerCommand(deps, "status");
  return parseJson<ServerStatusJson>(raw, "service status");
}

async function listModels(
  deps: FoundryLocalDeps,
): Promise<FoundryCatalogModel[]> {
  const raw = await runFoundry(deps, ["model", "list", "--output", "json"]);
  const parsed = parseJson<CatalogJson>(raw, "model catalog");
  return Array.isArray(parsed.models)
    ? parsed.models.filter(
        (model): model is FoundryCatalogModel =>
          Boolean(model?.alias) && Boolean(model?.id),
      )
    : [];
}

function endpointFromStatus(status: ServerStatusJson): string | undefined {
  const webUrl = status.webUrls?.[0];
  if (!webUrl) return undefined;
  return `${webUrl.replace(/\/+$/, "")}/v1`;
}

/** Inspect Foundry without starting it or downloading models. */
export async function getFoundryLocalStatus(
  deps: FoundryLocalDeps = defaultDeps(),
): Promise<FoundryLocalStatus> {
  if (!deps.hasFoundry()) {
    return {
      installed: false,
      running: false,
      models: [],
      recommendations: {},
    };
  }

  try {
    const [server, models] = await Promise.all([
      getServerStatus(deps),
      listModels(deps),
    ]);
    return {
      installed: true,
      running: server.running === true || server.state === "ready",
      endpoint: endpointFromStatus(server),
      models,
      recommendations: chooseFoundryRecommendations(models),
    };
  } catch (error) {
    return {
      installed: true,
      running: false,
      models: [],
      recommendations: {},
      error: (error as Error).message,
    };
  }
}

async function installFoundryLocal(deps: FoundryLocalDeps): Promise<void> {
  if (deps.hasFoundry()) return;
  if (deps.platform !== "win32") {
    throw new Error(
      "Foundry Local installation is currently guided on Windows only.",
    );
  }
  if (!deps.hasWinget()) {
    throw new Error(
      "winget is required to install Foundry Local automatically.",
    );
  }
  await deps.run("winget", [
    "install",
    "--exact",
    "--id",
    "Microsoft.FoundryLocal",
    "--accept-source-agreements",
    "--accept-package-agreements",
  ]);
  if (!deps.hasFoundry()) {
    throw new Error(
      "Foundry Local was installed, but is not available in this process yet. Restart ZAM, then retry.",
    );
  }
}

async function startFoundryLocal(deps: FoundryLocalDeps): Promise<string> {
  const raw = await runServerCommand(deps, "start");
  const started = parseJson<ServerStatusJson>(raw, "service start response");
  const endpoint = endpointFromStatus(started);
  if (endpoint) return endpoint;
  const status = await getServerStatus(deps);
  return endpointFromStatus(status) ?? FOUNDRY_DEFAULT_URL;
}

async function downloadAndLoad(
  deps: FoundryLocalDeps,
  candidate: FoundryRecommendation,
  cached: boolean,
): Promise<boolean> {
  if (!cached) {
    await runFoundry(deps, [
      "model",
      "download",
      candidate.alias,
      "--output",
      "json",
    ]);
  }
  await runFoundry(deps, [
    "model",
    "load",
    candidate.alias,
    "--output",
    "json",
  ]);
  return !cached;
}

/**
 * Install (when necessary), start, download, and load the recommended model.
 *
 * There is deliberately no second attempt on a CPU build. If the accelerated
 * candidate's execution provider is unavailable, Foundry's load failure is
 * reported as-is: a compact CPU model would make setup *look* successful while
 * producing a recall experience slow enough that the learner stops reviewing,
 * and a plain failure that points at a cloud model is the more useful answer.
 */
export async function setupFoundryLocal(
  role: FoundrySetupRole,
  deps: FoundryLocalDeps = defaultDeps(),
): Promise<FoundrySetupResult> {
  try {
    await installFoundryLocal(deps);
    const endpoint = await startFoundryLocal(deps);
    const status = await getFoundryLocalStatus(deps);
    const candidate = status.recommendations.text;
    if (!candidate) {
      return {
        ok: false,
        status: { ...status, endpoint },
        error:
          "Foundry Local offers no accelerated text model on this computer. Connect a cloud model instead.",
      };
    }

    const catalogModel = status.models.find(
      (model) => model.alias.toLowerCase() === candidate.alias.toLowerCase(),
    );
    try {
      const downloaded = await downloadAndLoad(
        deps,
        candidate,
        catalogModel?.cached === true,
      );
      return {
        ok: true,
        status: { ...status, endpoint },
        prepared: { ...candidate, role, downloaded },
      };
    } catch (error) {
      return {
        ok: false,
        status: { ...status, endpoint },
        error: `${candidate.alias}: ${(error as Error).message}`,
      };
    }
  } catch (error) {
    const status = await getFoundryLocalStatus(deps);
    return { ok: false, status, error: (error as Error).message };
  }
}

/**
 * Start Foundry and load a model that has already been downloaded. Runtime
 * callers use this after a Foundry service restart; it never downloads a model
 * implicitly, so a review cannot unexpectedly consume several gigabytes.
 */
export async function ensureFoundryModelLoaded(
  configuredModel: string,
  deps: FoundryLocalDeps = defaultDeps(),
): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
  if (!deps.hasFoundry()) {
    return { ok: false, error: "Foundry Local is not installed." };
  }
  try {
    const endpoint = await startFoundryLocal(deps);
    const models = await listModels(deps);
    const normalized = configuredModel.toLowerCase();
    const catalogModel = models.find(
      (model) =>
        model.alias.toLowerCase() === normalized ||
        foundryHttpModelId(model).toLowerCase() === normalized ||
        model.id.toLowerCase() === normalized,
    );
    if (!catalogModel?.cached) {
      return {
        ok: false,
        endpoint,
        error: `Foundry model "${configuredModel}" is not downloaded.`,
      };
    }
    await runFoundry(deps, [
      "model",
      "load",
      catalogModel.alias,
      "--output",
      "json",
    ]);
    return { ok: true, endpoint };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
