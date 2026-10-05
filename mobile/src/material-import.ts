/**
 * Learning cards from photos and PDFs on the phone (ADR 2026-10-05, Phase 8).
 *
 * The same pipeline as the desktop's built-in path, without a process
 * boundary and so without a staging file: the model reads the material,
 * the kernel matches the proposals against the library on the device, the
 * learner decides each card, and one transaction writes the choices.
 *
 * No DOM here — `main.ts` renders the review list. No Node built-ins: this is
 * bundled into the WebView.
 */

import {
  batchByBudget,
  buildMaterialInstructions,
  type MaterialAttachment,
  mergeMaterialReplies,
} from "../../src/cli/llm/material-prompt.js";
import type { Database } from "../../src/kernel/db/types.js";
import {
  commitMaterialImport,
  findImportsByFingerprints,
  listMaterialAreaContext,
  listMaterialBonusItems,
  type MaterialBonusItem,
  type MaterialCommitResult,
  type MaterialImportRecord,
  type MaterialProposalSet,
  type MaterialReviewRow,
  matchMaterialProposals,
  parseMaterialProposalSet,
  takeMaterialBonusItem,
} from "../../src/kernel/import/material-import.js";
import {
  changedAreas,
  decisionsOf,
  type MaterialAreaGroup,
  type MaterialChoices,
  materialAreaGroups,
} from "../../src/kernel/import/material-review-state.js";
import type { CurriculumScope } from "../../src/kernel/library/bundled-cells.js";
import { getSetting } from "../../src/kernel/models/settings.js";
import { CLOUD_EMBEDDING_MODEL_ID } from "./ai/connect.js";
import { requestEmbeddings } from "./ai/embedder.js";
import { resolveMobileCloudChain } from "./model-registry.js";
import { resolveMobileVisionEndpoint } from "./vision-config.js";
import {
  MOBILE_REQUEST_MAX_BYTES,
  type MobileMaterialEndpoint,
  readMaterialOnDevice,
  type VisionRequestFn,
} from "./vl-import.js";

/** One picked file, read and encoded on the device. */
export interface DeviceMaterialFile extends MaterialAttachment {
  /** SHA-256 of the file as picked, before any downscaling. */
  sha256: string | null;
}

/** The models photos or a PDF go to, in the order they are tried. */
export async function resolveMaterialEndpoints(
  db: Database,
  kind: "image" | "pdf",
): Promise<MobileMaterialEndpoint[]> {
  const endpoints: MobileMaterialEndpoint[] = [];
  let link = await resolveMobileCloudChain(
    db,
    kind === "pdf" ? "file" : "image",
  );
  while (link) {
    endpoints.push({
      url: link.url,
      model: link.model,
      apiKey: link.apiKey,
      label: link.label || link.model,
      readsPdf: kind === "pdf",
    });
    link = link.fallback ?? null;
  }
  // Photos: the vision endpoint set on the library before the model registry
  // reached the phone still works. PDFs need a detected `file` row (D1).
  if (endpoints.length === 0 && kind === "image") {
    const legacy = await resolveMobileVisionEndpoint(db);
    if (legacy) {
      endpoints.push({
        url: legacy.url,
        model: legacy.model,
        apiKey: legacy.apiKey,
        label: legacy.label,
        readsPdf: false,
      });
    }
  }
  return endpoints;
}

/** `photo:IMG_1234.HEIC@2026-10-05` — the phone has no path to link to. */
export function deviceSourceLink(name: string, now: Date): string {
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return `photo:${name}@${date}`;
}

/** Hex SHA-256 of a file's bytes, with the WebView's own crypto. */
export async function sha256Hex(bytes: ArrayBuffer): Promise<string | null> {
  try {
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return null;
  }
}

/** The learner's curriculum position, when they ever picked one. */
async function learnerScope(
  db: Database,
): Promise<CurriculumScope | undefined> {
  const raw = await getSetting(db, "curriculum.lastSelection");
  if (!raw) return undefined;
  try {
    const selection = JSON.parse(raw) as {
      providerId?: string;
      schoolType?: string;
      grade?: string;
      track?: string;
      subject?: string;
    };
    if (!selection.providerId) return undefined;
    const grade = selection.grade ? Number.parseInt(selection.grade, 10) : NaN;
    return {
      provider: selection.providerId,
      schoolType: selection.schoolType,
      grade: Number.isFinite(grade) ? grade : undefined,
      track: selection.track,
      subject: selection.subject,
    };
  } catch {
    return undefined;
  }
}

export interface DeviceAnalysis {
  set: MaterialProposalSet;
  /** The model that read the material, as the learner knows it. */
  model: string;
}

/**
 * Read the files with the connected model and validate its proposals. The
 * caller has checked the selection (`materialSelection`) and the endpoints.
 */
export async function analyzeMaterialOnDevice(
  db: Database,
  files: DeviceMaterialFile[],
  deps: {
    endpoints: MobileMaterialEndpoint[];
    locale: string;
    request: VisionRequestFn;
    now?: Date;
  },
): Promise<DeviceAnalysis> {
  const scope = await learnerScope(db);
  const context = await listMaterialAreaContext(db, {
    schoolType: scope?.schoolType,
  });
  const instructions = buildMaterialInstructions({
    locale: deps.locale,
    areas: [...context.areas]
      .sort((a, b) => b.tokenCount - a.tokenCount)
      .slice(0, 150)
      .map((area) => area.path),
    subjects: context.cellSubjects,
  });

  const attachments: MaterialAttachment[] = files.map(
    ({ name, kind, mime, base64 }) => ({ name, kind, mime, base64 }),
  );
  const replies = [];
  let model = deps.endpoints[0]?.label ?? "";
  for (const batch of batchByBudget(attachments, MOBILE_REQUEST_MAX_BYTES)) {
    const result = await readMaterialOnDevice({
      endpoints: deps.endpoints,
      instructions,
      attachments: batch.map((index) => attachments[index]),
      request: deps.request,
    });
    model = result.endpoint.label;
    replies.push({ reply: result.reply, fileIndexes: batch });
  }
  const merged = mergeMaterialReplies(replies);
  const now = deps.now ?? new Date();
  const set = parseMaterialProposalSet({
    version: 1,
    analysis: merged.analysis,
    proposals: merged.proposals,
    files: files.map((file) => ({
      name: file.name,
      sourceLink: deviceSourceLink(file.name, now),
      ...(file.sha256 ? { sha256: file.sha256 } : {}),
    })),
  });
  return { set, model };
}

export interface DeviceReview {
  set: MaterialProposalSet;
  rows: MaterialReviewRow[];
  areaGroups: MaterialAreaGroup[];
  /** Earlier imports of the same files: a notice, never a block (D9). */
  reimports: MaterialImportRecord[];
  /** Areas already in the library, for the area field's suggestions. */
  areas: string[];
}

/**
 * Match the proposals against the library on the device. With an embedding
 * model the match also runs by meaning; any failure there falls back to
 * words alone, because fewer neighbours beat a failed review.
 */
export async function reviewMaterialOnDevice(
  db: Database,
  userId: string,
  set: MaterialProposalSet,
  deps: { fetchImpl?: typeof fetch } = {},
): Promise<DeviceReview> {
  const scope = await learnerScope(db);
  let rows: MaterialReviewRow[] | null = null;
  const embedding = await resolveMobileCloudChain(db, "embedding").catch(
    () => null,
  );
  if (embedding) {
    try {
      rows = await matchMaterialProposals(db, userId, set, {
        scope,
        embeddingModel: CLOUD_EMBEDDING_MODEL_ID,
        embed: (texts) => requestEmbeddings(embedding, texts, deps.fetchImpl),
      });
    } catch {
      rows = null;
    }
  }
  rows ??= await matchMaterialProposals(db, userId, set, { scope });
  const reimports = await findImportsByFingerprints(
    db,
    set.files
      .map((file) => file.sha256)
      .filter((sha): sha is string => sha !== null),
  );
  const context = await listMaterialAreaContext(db, {
    schoolType: scope?.schoolType,
  });
  return {
    set,
    rows,
    areaGroups: materialAreaGroups(set.proposals),
    reimports,
    areas: context.areas.map((area) => area.path),
  };
}

/** Write the learner's choices for exactly the rows they saw. */
export async function confirmMaterialOnDevice(
  db: Database,
  userId: string,
  review: DeviceReview,
  choices: MaterialChoices,
  editedAreas: Record<string, string>,
): Promise<MaterialCommitResult> {
  return commitMaterialImport(db, userId, {
    set: review.set,
    rows: review.rows,
    decisions: decisionsOf(choices),
    areas: changedAreas(editedAreas),
  });
}

/** Bonus items from the learner's own imports, newest import first (D6). */
export function listImportBonus(
  db: Database,
  userId: string,
  limit = 2,
): Promise<MaterialBonusItem[]> {
  return listMaterialBonusItems(db, userId, { limit });
}

/** Take bonus items: a card each, in the learner's queue from now on. */
export async function takeImportBonus(
  db: Database,
  userId: string,
  tokenIds: string[],
): Promise<void> {
  for (const tokenId of tokenIds) {
    await takeMaterialBonusItem(db, userId, tokenId);
  }
}
