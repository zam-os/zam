/**
 * The built-in path of a material import (ADR 2026-10-05 Decisions 1, 3, 11):
 * the photos or the PDF go to the learner's connected model in one request,
 * which proposes the cards for the review list.
 *
 * - **Selection.** Up to ten photos, or one PDF —
 *   never both in one import.
 * - **Model.** Photos go to the first row with the `image` capability, a PDF
 *   to the first with `file` (it reads PDFs itself). Harness-backed rows are
 *   left out: the harness path is their way in.
 * - **Photos.** On macOS `sips` converts HEIC to JPEG and caps the long edge
 *   at {@link IMAGE_LONG_EDGE_PX}, in a temporary directory removed
 *   afterwards. Elsewhere photos go unchanged within a size budget, and HEIC
 *   is refused with a hint to export JPEG.
 * - **Too many photos for the model.** A request the provider rejects for its
 *   image count or size is split in halves, and the results are merged.
 *
 * Nothing of the material or the model's answer is logged or stored here; the
 * caller stages the validated proposal set.
 */

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import type { MaterialAnalyzeCodeWire } from "../../bridge/protocol.js";
import {
  type Database,
  endpointUrl,
  listMaterialAreaContext,
  type MaterialProposalSet,
  MaterialProposalSetError,
  mapEndpointPath,
  parseMaterialProposalSet,
} from "../../kernel/index.js";
import { getLastCurriculumSelection } from "../curriculum/breadcrumb.js";
import { materialFileFromAgent } from "../material-import.js";
import {
  DEFAULT_LLM_API_KEY,
  fetchWithInteractiveTimeout,
  isNoAnswerFailure,
  isOpenRouterUrl,
  LlmHttpError,
  type ProviderConfig,
  prepareFoundryEndpoint,
  providerChain,
  readChatContent,
  resolveCapability,
} from "./client.js";
import {
  buildMaterialInstructions,
  buildMaterialRequest,
  IMAGE_LONG_EDGE_PX,
  type MaterialAttachment,
  type MaterialReply,
  materialFileKind,
  materialSelection,
  mergeMaterialReplies,
  parseMaterialReply,
} from "./material-prompt.js";

export { materialFileKind, materialSelection };

/** One photo after preparation; PDFs are never changed. */
export const MATERIAL_FILE_MAX_BYTES = 10 * 1024 * 1024;
/** Everything one request carries. */
export const MATERIAL_REQUEST_MAX_BYTES = 20 * 1024 * 1024;
/** Reading a page of notes and writing its cards can take minutes. */
const MATERIAL_REQUEST_TIMEOUT_MS = 5 * 60 * 1000;
/** Areas named in the instructions, most-used first. */
const MAX_AREAS_IN_PROMPT = 150;

/** The refusal codes, as the bridge reports them. */
export type MaterialAnalyzeCode = MaterialAnalyzeCodeWire;

/** A refusal the Studio explains in the learner's language, by its code. */
export class MaterialAnalyzeError extends Error {
  constructor(
    readonly code: MaterialAnalyzeCode,
    message: string,
  ) {
    super(message);
    this.name = "MaterialAnalyzeError";
  }
}

const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

// ── Models ───────────────────────────────────────────────────────────────────

/** Rows a request can go to: direct HTTP, in the registry's order. */
async function materialChain(
  db: Database,
  capability: "image" | "file",
): Promise<ProviderConfig[]> {
  const primary = await resolveCapability(db, capability);
  if (!primary) return [];
  return providerChain(primary).filter((row) => row.transport !== "agent");
}

export interface MaterialModelInfo {
  label: string;
  model: string;
}

export interface MaterialImportModels {
  image: MaterialModelInfo | null;
  file: MaterialModelInfo | null;
  /** HEIC can be converted here (macOS `sips`). */
  convertsHeic: boolean;
}

function describeRow(
  row: ProviderConfig | undefined,
): MaterialModelInfo | null {
  return row ? { label: row.label || row.model, model: row.model } : null;
}

/** The models photos and PDFs would go to — the dialog names them (D11). */
export async function materialImportModels(
  db: Database,
  platform: NodeJS.Platform = process.platform,
): Promise<MaterialImportModels> {
  return {
    image: describeRow((await materialChain(db, "image"))[0]),
    file: describeRow((await materialChain(db, "file"))[0]),
    convertsHeic: platform === "darwin",
  };
}

// ── Photos ───────────────────────────────────────────────────────────────────

/** Run `sips`; injected in tests. */
export type SipsRunner = (args: string[]) => Promise<string>;

const runSips: SipsRunner = (args) =>
  new Promise((resolve, reject) => {
    execFile("sips", args, (error, stdout) => {
      if (error) reject(error);
      else resolve(String(stdout));
    });
  });

async function longEdge(sips: SipsRunner, path: string): Promise<number> {
  const out = await sips(["-g", "pixelWidth", "-g", "pixelHeight", path]);
  const sizes = [...out.matchAll(/pixel(?:Width|Height):\s*(\d+)/g)].map(
    (match) => Number(match[1]),
  );
  return sizes.length > 0 ? Math.max(...sizes) : 0;
}

async function readAttachment(
  path: string,
  kind: "image" | "pdf",
  mime: string,
  maxBytes: number,
  name: string,
): Promise<MaterialAttachment> {
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) {
    throw new MaterialAnalyzeError("missing", `${name} is no longer there.`);
  }
  if (info.size > maxBytes) {
    throw new MaterialAnalyzeError(
      "too-large",
      `${name} is larger than ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  }
  const bytes = await readFile(path);
  return { name, kind, mime, base64: bytes.toString("base64") };
}

/**
 * Photos ready to send. On macOS HEIC becomes JPEG and a photo larger than
 * {@link IMAGE_LONG_EDGE_PX} is scaled down; elsewhere photos go as they are.
 */
async function preparePhotos(
  paths: string[],
  opts: {
    platform: NodeJS.Platform;
    sips: SipsRunner;
    workDir: () => Promise<string>;
  },
): Promise<MaterialAttachment[]> {
  const attachments: MaterialAttachment[] = [];
  for (const [index, path] of paths.entries()) {
    const name = basename(path);
    const heic = materialFileKind(path) === "heic";
    if (opts.platform !== "darwin") {
      if (heic) {
        throw new MaterialAnalyzeError(
          "heic",
          `${name} is a HEIC photo; please export it as JPEG.`,
        );
      }
      attachments.push(
        await readAttachment(
          path,
          "image",
          IMAGE_TYPES[extname(path).toLowerCase()],
          MATERIAL_FILE_MAX_BYTES,
          name,
        ),
      );
      continue;
    }
    if (!(await stat(path).catch(() => null))?.isFile()) {
      throw new MaterialAnalyzeError("missing", `${name} is no longer there.`);
    }
    const edge = await longEdge(opts.sips, path).catch(() => 0);
    if (!heic && edge > 0 && edge <= IMAGE_LONG_EDGE_PX) {
      attachments.push(
        await readAttachment(
          path,
          "image",
          IMAGE_TYPES[extname(path).toLowerCase()],
          MATERIAL_FILE_MAX_BYTES,
          name,
        ),
      );
      continue;
    }
    const out = join(await opts.workDir(), `${index}.jpg`);
    const args = ["-s", "format", "jpeg"];
    if (edge === 0 || edge > IMAGE_LONG_EDGE_PX) {
      args.push("-Z", String(IMAGE_LONG_EDGE_PX));
    }
    try {
      await opts.sips([...args, path, "--out", out]);
    } catch {
      if (heic) {
        throw new MaterialAnalyzeError(
          "heic",
          `${name} could not be converted; please export it as JPEG.`,
        );
      }
      // Not convertible here: send the original within the budget.
      attachments.push(
        await readAttachment(
          path,
          "image",
          IMAGE_TYPES[extname(path).toLowerCase()],
          MATERIAL_FILE_MAX_BYTES,
          name,
        ),
      );
      continue;
    }
    attachments.push(
      await readAttachment(
        out,
        "image",
        "image/jpeg",
        MATERIAL_FILE_MAX_BYTES,
        name,
      ),
    );
  }
  return attachments;
}

// ── Requests ─────────────────────────────────────────────────────────────────

/** A provider saying the request has too many or too large images. */
export function isSplittableRejection(error: unknown): boolean {
  if (!(error instanceof LlmHttpError)) return false;
  if (error.status === 413) return true;
  if (error.status !== 400) return false;
  const text = error.message.toLowerCase();
  return (
    /image|file|attachment|payload|request/.test(text) &&
    /too many|too large|maximum|max |limit|exceed/.test(text)
  );
}

export interface MaterialAnalyzeDeps {
  /** Injected in tests; defaults to the interactive-timeout fetch. */
  fetch?: (
    url: string,
    init: RequestInit & {
      locale?: ProviderConfig["locale"];
      hardTimeoutMs?: number;
    },
  ) => Promise<Response>;
  platform?: NodeJS.Platform;
  sips?: SipsRunner;
  /** Called as requests finish; the total grows when a request is split. */
  onProgress?: (progress: { done: number; total: number }) => void;
}

async function readAnthropicText(res: Response): Promise<string> {
  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new LlmHttpError(
      "Material import",
      res.status,
      res.statusText,
      errorText,
    );
  }
  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    stop_reason?: string;
  };
  if (data.stop_reason === "max_tokens") {
    throw new Error("The model's answer was cut off.");
  }
  const text = data.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
  if (!text) throw new Error("Empty response from the model");
  return text;
}

async function sendOnce(
  row: ProviderConfig,
  kind: "image" | "pdf",
  instructions: string,
  attachments: MaterialAttachment[],
  deps: MaterialAnalyzeDeps,
  sentTo: Set<ProviderConfig>,
): Promise<MaterialReply> {
  const endpoint = await prepareFoundryEndpoint(row);
  const request = buildMaterialRequest(
    endpoint.apiFlavor,
    // The row came from the `file` chain only for a PDF (strict gate, D1).
    { model: endpoint.model, readsPdf: kind === "pdf" },
    { instructions, attachments, openRouter: isOpenRouterUrl(endpoint.url) },
  );
  const apiKey = endpoint.apiKey || DEFAULT_LLM_API_KEY;
  const anthropic = endpoint.apiFlavor === "anthropic-messages";
  const url = anthropic
    ? mapEndpointPath(
        endpoint.url,
        (path) => `${path.replace(/\/v1$/, "")}/v1/messages`,
      )
    : endpointUrl(endpoint.url, request.path);
  const send = deps.fetch ?? fetchWithInteractiveTimeout;
  sentTo.add(row);
  const res = await send(url, {
    method: "POST",
    headers: anthropic
      ? {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        }
      : {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
    body: JSON.stringify(request.body),
    locale: endpoint.locale,
    hardTimeoutMs: MATERIAL_REQUEST_TIMEOUT_MS,
  });
  const text = anthropic
    ? await readAnthropicText(res)
    : await readChatContent(res, "Material import");
  return parseMaterialReply(text);
}

interface AnsweredBatch {
  reply: MaterialReply;
  fileIndexes: number[];
  /** The row that answered this batch. */
  row: ProviderConfig;
}

/**
 * Send the attachments, splitting on a size or count rejection. Walks the
 * chain like the vision path: a row that fails, even after splitting, hands
 * the whole request to the next one, and a local row behind a cloud primary
 * serves only when no cloud row answered (ADR 2026-09-13 decision 9).
 */
async function requestBatches(
  rows: ProviderConfig[],
  kind: "image" | "pdf",
  instructions: string,
  attachments: MaterialAttachment[],
  fileIndexes: number[],
  progress: { done: number; total: number },
  deps: MaterialAnalyzeDeps,
  sentTo: Set<ProviderConfig>,
): Promise<AnsweredBatch[]> {
  let lastError: unknown;
  let cloudAnswered = false;
  for (const row of rows) {
    if (row.offlineOnly && cloudAnswered) break;
    const before = { ...progress };
    try {
      const reply = await sendOnce(
        row,
        kind,
        instructions,
        attachments,
        deps,
        sentTo,
      );
      progress.done++;
      deps.onProgress?.({ ...progress });
      return [{ reply, fileIndexes, row }];
    } catch (error) {
      lastError = error;
      if (isSplittableRejection(error) && attachments.length > 1) {
        try {
          return await requestHalves(
            row,
            kind,
            instructions,
            attachments,
            fileIndexes,
            progress,
            deps,
            sentTo,
          );
        } catch (splitError) {
          lastError = splitError;
          // The next row starts over with every page.
          Object.assign(progress, before);
          deps.onProgress?.({ ...progress });
        }
      }
      if (!row.offlineOnly && !isNoAnswerFailure(error)) cloudAnswered = true;
    }
  }
  if (lastError instanceof MaterialAnalyzeError) throw lastError;
  const reason =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new MaterialAnalyzeError(
    "model-failed",
    `The model could not read the material: ${reason}`,
  );
}

/** Both halves on one row; a half that still fails fails the row. */
async function requestHalves(
  row: ProviderConfig,
  kind: "image" | "pdf",
  instructions: string,
  attachments: MaterialAttachment[],
  fileIndexes: number[],
  progress: { done: number; total: number },
  deps: MaterialAnalyzeDeps,
  sentTo: Set<ProviderConfig>,
): Promise<AnsweredBatch[]> {
  const half = Math.ceil(attachments.length / 2);
  progress.total++;
  deps.onProgress?.({ ...progress });
  const first = await requestBatches(
    [row],
    kind,
    instructions,
    attachments.slice(0, half),
    fileIndexes.slice(0, half),
    progress,
    deps,
    sentTo,
  );
  const second = await requestBatches(
    [row],
    kind,
    instructions,
    attachments.slice(half),
    fileIndexes.slice(half),
    progress,
    deps,
    sentTo,
  );
  return [...first, ...second];
}

export interface MaterialAnalyzeResult {
  set: MaterialProposalSet;
  /**
   * The model that read the pages. Not always the one the dialog named: when
   * that one fails, the next connected model may answer (D11).
   */
  model: MaterialModelInfo;
  /** Every model the pages were sent to, in order; the reader is one of them. */
  sentTo: MaterialModelInfo[];
}

/**
 * Read the files with the connected model and return the validated proposal
 * set, ready to stage for the review list.
 */
export async function analyzeMaterialViaLLM(
  db: Database,
  paths: string[],
  opts: { pages?: string } = {},
  deps: MaterialAnalyzeDeps = {},
): Promise<MaterialAnalyzeResult> {
  const selection = materialSelection(paths);
  if (!selection.ok) {
    throw new MaterialAnalyzeError(selection.code, selection.message);
  }
  const rows = await materialChain(
    db,
    selection.kind === "pdf" ? "file" : "image",
  );
  if (rows.length === 0) {
    throw selection.kind === "pdf"
      ? new MaterialAnalyzeError(
          "no-file-model",
          "No connected model reads PDFs itself.",
        )
      : new MaterialAnalyzeError(
          "no-image-model",
          "No connected model reads images.",
        );
  }

  let workDir: string | null = null;
  try {
    const attachments =
      selection.kind === "pdf"
        ? [
            await readAttachment(
              paths[0],
              "pdf",
              "application/pdf",
              MATERIAL_REQUEST_MAX_BYTES,
              basename(paths[0]),
            ),
          ]
        : await preparePhotos(paths, {
            platform: deps.platform ?? process.platform,
            sips: deps.sips ?? runSips,
            workDir: async () => {
              workDir ??= await mkdtemp(join(tmpdir(), "zam-material-"));
              return workDir;
            },
          });
    const total = attachments.reduce(
      (sum, file) => sum + Math.ceil((file.base64.length * 3) / 4),
      0,
    );
    if (total > MATERIAL_REQUEST_MAX_BYTES) {
      throw new MaterialAnalyzeError(
        "too-large",
        `The photos are larger than ${MATERIAL_REQUEST_MAX_BYTES / 1024 / 1024} MB together.`,
      );
    }

    const scope = await getLastCurriculumSelection(db).catch(() => undefined);
    const context = await listMaterialAreaContext(db, {
      schoolType: scope?.schoolType,
    });
    const instructions = buildMaterialInstructions({
      locale: rows[0].locale,
      areas: [...context.areas]
        .sort((a, b) => b.tokenCount - a.tokenCount)
        .slice(0, MAX_AREAS_IN_PROMPT)
        .map((area) => area.path),
      subjects: context.cellSubjects,
      pages: opts.pages,
    });

    const progress = { done: 0, total: 1 };
    deps.onProgress?.({ ...progress });
    const sentTo = new Set<ProviderConfig>();
    const replies = await requestBatches(
      rows,
      selection.kind,
      instructions,
      attachments,
      attachments.map((_, index) => index),
      progress,
      deps,
      sentTo,
    );
    const merged = mergeMaterialReplies(replies);
    const now = new Date();
    const files = await Promise.all(
      paths.map((path) =>
        // The learner picked this file: no confinement.
        materialFileFromAgent({ name: basename(path), path }, now, null),
      ),
    );
    try {
      const set = parseMaterialProposalSet({
        version: 1,
        analysis: merged.analysis,
        proposals: merged.proposals,
        files,
      });
      return {
        set,
        model: describeRow(replies[0].row) as MaterialModelInfo,
        sentTo: [...sentTo].map((row) => describeRow(row) as MaterialModelInfo),
      };
    } catch (error) {
      if (error instanceof MaterialProposalSetError) {
        throw new MaterialAnalyzeError(
          "invalid-answer",
          `The model's proposals did not fit ZAM's format: ${error.issues.slice(0, 5).join("; ")}`,
        );
      }
      throw error;
    }
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true });
  }
}
