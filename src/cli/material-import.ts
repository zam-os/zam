/**
 * Material import, CLI side (ADR 2026-10-05): the staged batch, the review
 * the learner sees, and the confirm. Shared by `zam bridge material-import-*`
 * and the MCP tools, so both paths end in the same list and the same write.
 *
 * The kernel does the learning logic; this layer adds what the kernel must
 * not do — the staging file, the embedding endpoint, the learner's
 * curriculum position.
 */

import { readFile, stat } from "node:fs/promises";
import { basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type CurriculumScope,
  commitMaterialImport,
  type Database,
  findImportsByFingerprints,
  type MaterialChoice,
  type MaterialCommitResult,
  type MaterialFile,
  type MaterialImportRecord,
  type MaterialMatchOptions,
  type MaterialProposal,
  type MaterialProposalSet,
  type MaterialReviewRow,
  matchMaterialProposals,
} from "../kernel/index.js";
import { getLastCurriculumSelection } from "./curriculum/breadcrumb.js";
import {
  canonicalEmbeddingModelId,
  embeddingTextForDocument,
  embedTexts,
  ensureTokenEmbeddings,
  resolveUsableEmbeddingEndpoint,
} from "./llm/embedder.js";
import {
  discardStagedImport,
  listStagedImports,
  readStagedImport,
  type StagedImport,
  type StagingOptions,
  writeStagedImport,
} from "./material-staging.js";

export interface PendingMaterialImport {
  id: string;
  title: string;
  createdAt: string;
  origin: StagedImport["origin"];
  harness: string | null;
  proposalCount: number;
}

export interface MaterialAreaGroup {
  /** The area as proposed; the key a confirmed rename is sent under. */
  area: string;
  proposalIndexes: number[];
}

export interface MaterialImportReview {
  id: string;
  createdAt: string;
  origin: StagedImport["origin"];
  harness: string | null;
  analysis: MaterialProposalSet["analysis"];
  proposals: MaterialProposal[];
  files: MaterialFile[];
  rows: MaterialReviewRow[];
  areaGroups: MaterialAreaGroup[];
  /** Earlier imports of the same files (Decision 9): a notice, not a block. */
  reimports: MaterialImportRecord[];
  /** Whether matching had embeddings, or ran on words alone. */
  semantic: boolean;
}

function summary(batch: StagedImport): PendingMaterialImport {
  return {
    id: batch.id,
    title: batch.set.analysis.title,
    createdAt: batch.createdAt,
    origin: batch.origin,
    harness: batch.harness ?? null,
    proposalCount: batch.set.proposals.length,
  };
}

export async function listPendingMaterialImports(
  opts: StagingOptions = {},
): Promise<PendingMaterialImport[]> {
  return (await listStagedImports(opts)).map(summary);
}

async function requireBatch(
  id: string,
  opts: StagingOptions,
): Promise<StagedImport> {
  const batch = await readStagedImport(id, opts);
  if (!batch) {
    throw new Error(
      `Import ${id} is not waiting any more: it was confirmed, discarded or expired.`,
    );
  }
  return batch;
}

/** The learner's curriculum position, when they ever picked one. */
async function learnerScope(
  db: Database,
): Promise<CurriculumScope | undefined> {
  const selection = await getLastCurriculumSelection(db).catch(() => undefined);
  if (!selection?.providerId) return undefined;
  const grade = selection.grade ? Number.parseInt(selection.grade, 10) : NaN;
  return {
    provider: selection.providerId,
    schoolType: selection.schoolType,
    grade: Number.isFinite(grade) ? grade : undefined,
    track: selection.track,
    subject: selection.subject,
  };
}

/**
 * Embeddings for matching, when an embedding model is usable. Any failure
 * degrades to word matching: finding fewer neighbours beats failing the
 * review.
 */
async function semanticMatching(
  db: Database,
): Promise<Pick<MaterialMatchOptions, "embed" | "embeddingModel"> | null> {
  const endpoint = await resolveUsableEmbeddingEndpoint(db).catch(() => null);
  if (!endpoint) return null;
  await ensureTokenEmbeddings(db, { limit: 64 }).catch(() => undefined);
  return {
    embeddingModel: canonicalEmbeddingModelId(endpoint.model),
    embed: (texts) =>
      embedTexts(
        { url: endpoint.url, model: endpoint.model, apiKey: endpoint.apiKey },
        texts.map((text) => embeddingTextForDocument(text, endpoint.model)),
      ),
  };
}

async function matchRows(
  db: Database,
  userId: string,
  set: MaterialProposalSet,
): Promise<{ rows: MaterialReviewRow[]; semantic: boolean }> {
  const scope = await learnerScope(db);
  const semantic = await semanticMatching(db);
  if (semantic) {
    try {
      return {
        rows: await matchMaterialProposals(db, userId, set, {
          ...semantic,
          scope,
        }),
        semantic: true,
      };
    } catch {
      // fall through to words alone
    }
  }
  return {
    rows: await matchMaterialProposals(db, userId, set, { scope }),
    semantic: false,
  };
}

function areaGroups(set: MaterialProposalSet): MaterialAreaGroup[] {
  const groups = new Map<string, number[]>();
  set.proposals.forEach((proposal, index) => {
    const list = groups.get(proposal.area) ?? [];
    list.push(index);
    groups.set(proposal.area, list);
  });
  return [...groups].map(([area, proposalIndexes]) => ({
    area,
    proposalIndexes,
  }));
}

/**
 * Build the review list for a waiting batch and remember it, so the confirm
 * applies the learner's choices to exactly the rows they saw.
 */
export async function reviewMaterialImport(
  db: Database,
  userId: string,
  id: string,
  opts: StagingOptions = {},
): Promise<MaterialImportReview> {
  const batch = await requireBatch(id, opts);
  const { rows, semantic } = await matchRows(db, userId, batch.set);
  const reimports = await findImportsByFingerprints(
    db,
    batch.set.files
      .map((file) => file.sha256)
      .filter((sha): sha is string => sha !== null),
  );
  await writeStagedImport(
    {
      ...batch,
      rows,
      reviewedAt: (opts.now?.() ?? new Date()).toISOString(),
    },
    opts,
  );
  return {
    id: batch.id,
    createdAt: batch.createdAt,
    origin: batch.origin,
    harness: batch.harness ?? null,
    analysis: batch.set.analysis,
    proposals: batch.set.proposals,
    files: batch.set.files,
    rows,
    areaGroups: areaGroups(batch.set),
    reimports,
    semantic,
  };
}

/** Parse `--decisions` JSON: row id → yes | bonus | no. */
export function parseMaterialDecisions(
  raw: unknown,
): Record<string, MaterialChoice> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new Error("decisions must be an object of row id → yes|bonus|no");
  }
  const decisions: Record<string, MaterialChoice> = {};
  for (const [rowId, choice] of Object.entries(raw)) {
    if (choice !== "yes" && choice !== "bonus" && choice !== "no") {
      throw new Error(`decisions.${rowId}: must be yes, bonus or no`);
    }
    decisions[rowId] = choice;
  }
  return decisions;
}

/** Parse `--areas` JSON: proposed area → confirmed area. */
export function parseMaterialAreas(raw: unknown): Record<string, string> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("areas must be an object of proposed → confirmed area");
  }
  const areas: Record<string, string> = {};
  for (const [proposed, confirmed] of Object.entries(raw)) {
    if (typeof confirmed !== "string" || confirmed.trim().length === 0) {
      throw new Error(`areas.${proposed}: must be a non-empty string`);
    }
    areas[proposed] = confirmed;
  }
  return areas;
}

/**
 * Write the learner's choices and retire the batch. The rows come from the
 * review the learner saw; a batch never reviewed is matched now.
 */
export async function confirmMaterialImport(
  db: Database,
  userId: string,
  id: string,
  decisions: Record<string, MaterialChoice>,
  areas: Record<string, string> = {},
  opts: StagingOptions = {},
): Promise<MaterialCommitResult> {
  const batch = await requireBatch(id, opts);
  const rows = batch.rows ?? (await matchRows(db, userId, batch.set)).rows;
  const result = await commitMaterialImport(db, userId, {
    set: batch.set,
    rows,
    decisions,
    areas,
  });
  await discardStagedImport(id, opts);
  return result;
}

export async function discardMaterialImport(
  id: string,
  opts: StagingOptions = {},
): Promise<boolean> {
  return discardStagedImport(id, opts);
}

// ── Page preview (Decision 5: the page stays in view) ───────────────────────

/** Images above this size are not inlined; the review shows the name. */
export const PREVIEW_MAX_BYTES = 5 * 1024 * 1024;

const PREVIEW_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export interface MaterialFilePreview {
  name: string;
  path: string | null;
  kind: "image" | "pdf" | "other";
  /** `data:` URL of the image, when it can be shown inline. */
  dataUrl: string | null;
  reason: "ok" | "missing" | "too-large" | "not-viewable";
}

function filePathOf(file: MaterialFile): string | null {
  if (file.path) return file.path;
  if (file.sourceLink.startsWith("file://")) {
    try {
      return fileURLToPath(file.sourceLink.split("#")[0]);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * The page beside the review list. Only a file the staged batch names is
 * read — never a path from the caller — and only an image small enough to
 * inline. A PDF or a HEIC photo is named, not rendered.
 */
export async function previewMaterialImportFile(
  id: string,
  fileIndex: number,
  opts: StagingOptions = {},
): Promise<MaterialFilePreview> {
  const batch = await requireBatch(id, opts);
  const file = batch.set.files[fileIndex];
  if (!file) {
    throw new Error(`Import ${id} has no file ${fileIndex}`);
  }
  const path = filePathOf(file);
  const extension = extname(path ?? file.name).toLowerCase();
  const kind =
    extension === ".pdf"
      ? "pdf"
      : extension in PREVIEW_MIME ||
          extension === ".heic" ||
          extension === ".heif"
        ? "image"
        : "other";
  const base = { name: file.name || basename(path ?? ""), path, kind } as const;
  if (!path) return { ...base, dataUrl: null, reason: "missing" };
  const info = await stat(path).catch(() => null);
  if (!info?.isFile()) return { ...base, dataUrl: null, reason: "missing" };
  const mime = PREVIEW_MIME[extension];
  if (!mime) return { ...base, dataUrl: null, reason: "not-viewable" };
  if (info.size > PREVIEW_MAX_BYTES) {
    return { ...base, dataUrl: null, reason: "too-large" };
  }
  const bytes = await readFile(path);
  return {
    ...base,
    dataUrl: `data:${mime};base64,${bytes.toString("base64")}`,
    reason: "ok",
  };
}
