/**
 * Deterministic, model-free text-card import (ADR 2026-08-09).
 *
 * File and archive parsing live in the CLI layer. The kernel receives plain,
 * sanitized card candidates, classifies a preview against stable external
 * bindings, and commits the exact preview in one transaction. No LLM, HTTP,
 * filesystem, or concrete database driver belongs here.
 */

import { ulid } from "ulid";
import type { Database } from "../db/types.js";
import { publishTokenRevisionInTransaction } from "../library/revision.js";
import { ensureCard } from "../models/card.js";
import type {
  ImageOcclusionShape,
  TokenMediaKind,
  TokenMediaSide,
} from "../models/media.js";
import { createToken, generateTokenSlug } from "../models/token.js";
import { sha256Hex, sha256HexBytes } from "../util/sha256.js";

export type TextImportFormat = "apkg" | "csv" | "tsv";
export type TextImportAction = "create" | "update" | "skip" | "conflict";

export interface TextImportNotice {
  code: string;
  message: string;
  externalId?: string;
  deckPath?: string;
}

export interface TextImportCardInput {
  /** Globally stable for Anki; source-scoped for delimited files. */
  externalId: string;
  question: string;
  answer: string;
  title?: string | null;
  deckPath?: string;
  tags?: string[];
  source?: string | null;
  author?: string | null;
  license?: string | null;
  noteGuid?: string | null;
  cardOrdinal?: number | null;
  media?: TextImportMediaReference[];
  warnings?: TextImportNotice[];
}

export interface TextImportAssetInput {
  name: string;
  mimeType: string;
  kind: TokenMediaKind;
  data: Uint8Array;
}

export interface TextImportMediaReference {
  assetName: string;
  side: TokenMediaSide;
  kind: TokenMediaKind;
  altText?: string | null;
  occlusions?: ImageOcclusionShape[];
}

export interface TextImportDocument {
  format: TextImportFormat;
  /** Display-only basename. Absolute local paths never enter shared storage. */
  sourceName: string;
  cards: TextImportCardInput[];
  assets?: TextImportAssetInput[];
  warnings?: TextImportNotice[];
  unsupported?: TextImportNotice[];
}

export interface TextImportPreviewCard {
  externalId: string;
  question: string;
  answer: string;
  deckPath: string;
  action: TextImportAction;
  reason: string;
  tokenId: string | null;
  cardAction: "create" | "keep" | "none";
  contentChanged: boolean;
  mediaCount: number;
  warnings: TextImportNotice[];
}

export interface TextImportDeckPreview {
  path: string;
  cards: number;
}

export interface TextImportCounts {
  create: number;
  update: number;
  skip: number;
  conflict: number;
  unsupported: number;
  cardsToCreate: number;
  valid: number;
  total: number;
}

export interface TextImportPreview {
  format: TextImportFormat;
  sourceName: string;
  planHash: string;
  counts: TextImportCounts;
  decks: TextImportDeckPreview[];
  media: { assets: number; references: number; totalBytes: number };
  cards: TextImportPreviewCard[];
  warnings: TextImportNotice[];
  unsupported: TextImportNotice[];
}

export interface TextImportCommitResult {
  planHash: string;
  counts: TextImportCounts;
  cardsCreated: number;
}

interface NormalizedCard {
  externalId: string;
  question: string;
  answer: string;
  title: string | null;
  deckPath: string;
  tags: string[];
  source: string | null;
  author: string | null;
  license: string | null;
  noteGuid: string | null;
  cardOrdinal: number | null;
  warnings: TextImportNotice[];
  media: NormalizedMediaReference[];
  contentHash: string;
  metadataHash: string;
}

interface NormalizedAsset {
  name: string;
  mimeType: string;
  kind: TokenMediaKind;
  data: Uint8Array;
  hash: string;
}

interface NormalizedMediaReference {
  assetName: string;
  assetHash: string;
  side: TokenMediaSide;
  kind: TokenMediaKind;
  ordinal: number;
  altText: string | null;
  occlusions: ImageOcclusionShape[];
}

interface ImportBindingRow {
  external_id: string;
  token_id: string;
  binding_content_hash: string;
  binding_metadata_hash: string;
  token_question: string | null;
  token_concept: string | null;
  deprecated_at: string | null;
  user_card_id: string | null;
  local_media: NormalizedMediaReference[];
}

const MAX_IMPORT_CARDS = 50_000;
const MAX_EXTERNAL_ID_LENGTH = 512;
const MAX_TEXT_LENGTH = 65_536;
const MAX_MEDIA_ASSETS = 10_000;
const MAX_MEDIA_PER_CARD = 64;
const MAX_MEDIA_ITEM_BYTES = 20 * 1024 * 1024;
const MAX_MEDIA_TOTAL_BYTES = 200 * 1024 * 1024;
const ALLOWED_MEDIA_MIME = new Map<string, TokenMediaKind>([
  ["image/png", "image"],
  ["image/jpeg", "image"],
  ["image/gif", "image"],
  ["image/webp", "image"],
  ["audio/mpeg", "audio"],
  ["audio/ogg", "audio"],
  ["audio/wav", "audio"],
  ["audio/mp4", "audio"],
]);

function normalizeText(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

function optionalText(value: string | null | undefined): string | null {
  const normalized = normalizeText(value ?? "");
  return normalized || null;
}

function normalizeTags(tags: string[] | undefined): string[] {
  return [...new Set((tags ?? []).map(normalizeText).filter(Boolean))].sort();
}

function mediaHashShape(media: NormalizedMediaReference): unknown[] {
  return [
    media.side,
    media.kind,
    media.ordinal,
    media.assetHash,
    media.altText,
    media.occlusions,
  ];
}

function contentHash(
  question: string | null,
  answer: string | null,
  media: NormalizedMediaReference[] = [],
): string {
  const text = `${normalizeText(question ?? "")}\n${normalizeText(answer ?? "")}`;
  const canonicalMedia = [...media].sort(
    (left, right) =>
      left.side.localeCompare(right.side) || left.ordinal - right.ordinal,
  );
  // Retain the phase-2 digest for text-only cards so upgrading does not make
  // every unchanged binding look like a source edit.
  return sha256Hex(
    media.length > 0
      ? `${text}\n${JSON.stringify(canonicalMedia.map(mediaHashShape))}`
      : text,
  );
}

function metadataHash(card: {
  title: string | null;
  deckPath: string;
  tags: string[];
  source: string | null;
  author: string | null;
  license: string | null;
  noteGuid: string | null;
  cardOrdinal: number | null;
  media: NormalizedMediaReference[];
}): string {
  return sha256Hex(
    JSON.stringify([
      card.title,
      card.deckPath,
      card.tags,
      card.source,
      card.author,
      card.license,
      card.noteGuid,
      card.cardOrdinal,
      [...card.media]
        .sort(
          (left, right) =>
            left.side.localeCompare(right.side) || left.ordinal - right.ordinal,
        )
        .map((item) => item.assetName),
    ]),
  );
}

function normalizeDocument(document: TextImportDocument): {
  cards: NormalizedCard[];
  assets: NormalizedAsset[];
  duplicateIds: Set<string>;
  warnings: TextImportNotice[];
  unsupported: TextImportNotice[];
} {
  if (!["apkg", "csv", "tsv"].includes(document.format)) {
    throw new Error(`Unsupported import format: ${String(document.format)}`);
  }
  const sourceName = normalizeText(document.sourceName);
  if (!sourceName || sourceName.length > 255) {
    throw new Error("Import source name must contain 1 to 255 characters");
  }
  if (document.cards.length > MAX_IMPORT_CARDS) {
    throw new Error(`Import contains more than ${MAX_IMPORT_CARDS} cards`);
  }

  const assetInputs = document.assets ?? [];
  if (assetInputs.length > MAX_MEDIA_ASSETS) {
    throw new Error(
      `Import contains more than ${MAX_MEDIA_ASSETS} media assets`,
    );
  }
  const assetsByName = new Map<string, NormalizedAsset>();
  let totalAssetBytes = 0;
  for (const [index, input] of assetInputs.entries()) {
    const name = normalizeText(input.name).replace(/\\/g, "/");
    if (
      !name ||
      name.length > 255 ||
      name.includes("\0") ||
      name.startsWith("/") ||
      /^[a-z]+:/i.test(name) ||
      name.split("/").some((part) => part === "..")
    ) {
      throw new Error(`Media asset ${index + 1} has an unsafe name`);
    }
    if (assetsByName.has(name)) {
      throw new Error(`Import contains duplicate media name: ${name}`);
    }
    if (!(input.data instanceof Uint8Array)) {
      throw new Error(`Media asset ${name} is not binary data`);
    }
    if (input.data.byteLength > MAX_MEDIA_ITEM_BYTES) {
      throw new Error(`Media asset exceeds the 20 MiB limit: ${name}`);
    }
    totalAssetBytes += input.data.byteLength;
    if (totalAssetBytes > MAX_MEDIA_TOTAL_BYTES) {
      throw new Error("Import media exceeds the 200 MiB total limit");
    }
    const expectedKind = ALLOWED_MEDIA_MIME.get(input.mimeType);
    if (!expectedKind || expectedKind !== input.kind) {
      throw new Error(`Media asset ${name} has an unsupported type`);
    }
    assetsByName.set(name, {
      name,
      mimeType: input.mimeType,
      kind: input.kind,
      data: Uint8Array.prototype.slice.call(input.data) as Uint8Array,
      hash: sha256HexBytes(input.data),
    });
  }

  const occurrences = new Map<string, number>();
  const cards = document.cards.map((input, index): NormalizedCard => {
    const externalId = normalizeText(input.externalId);
    if (!externalId || externalId.length > MAX_EXTERNAL_ID_LENGTH) {
      throw new Error(`Card ${index + 1} has an invalid external identity`);
    }
    const question = normalizeText(input.question);
    const answer = normalizeText(input.answer);
    if (!question || !answer) {
      throw new Error(`Card ${externalId} must have both question and answer`);
    }
    if (question.length > MAX_TEXT_LENGTH || answer.length > MAX_TEXT_LENGTH) {
      throw new Error(`Card ${externalId} exceeds the text size limit`);
    }
    const cardOrdinal = input.cardOrdinal ?? null;
    if (
      cardOrdinal !== null &&
      (!Number.isSafeInteger(cardOrdinal) || cardOrdinal < 0)
    ) {
      throw new Error(`Card ${externalId} has an invalid ordinal`);
    }
    occurrences.set(externalId, (occurrences.get(externalId) ?? 0) + 1);

    const inputMedia = input.media ?? [];
    if (inputMedia.length > MAX_MEDIA_PER_CARD) {
      throw new Error(
        `Card ${externalId} contains more than ${MAX_MEDIA_PER_CARD} media references`,
      );
    }
    const sideOrdinals: Record<TokenMediaSide, number> = {
      question: 0,
      answer: 0,
    };
    const media = inputMedia.map((reference): NormalizedMediaReference => {
      const assetName = normalizeText(reference.assetName).replace(/\\/g, "/");
      const asset = assetsByName.get(assetName);
      if (!asset) {
        throw new Error(
          `Card ${externalId} references missing media asset: ${assetName}`,
        );
      }
      if (!["question", "answer"].includes(reference.side)) {
        throw new Error(`Card ${externalId} has an invalid media side`);
      }
      if (asset.kind !== reference.kind) {
        throw new Error(`Card ${externalId} has a mismatched media kind`);
      }
      const occlusions = reference.occlusions ?? [];
      if (occlusions.length > 100) {
        throw new Error(`Card ${externalId} has too many image occlusions`);
      }
      for (const shape of occlusions) {
        if (
          !["rect", "ellipse"].includes(shape.shape) ||
          ![shape.left, shape.top, shape.width, shape.height].every(
            (value) => Number.isFinite(value) && value >= 0 && value <= 1,
          )
        ) {
          throw new Error(`Card ${externalId} has invalid occlusion geometry`);
        }
      }
      return {
        assetName,
        assetHash: asset.hash,
        side: reference.side,
        kind: reference.kind,
        ordinal: sideOrdinals[reference.side]++,
        altText: optionalText(reference.altText)?.slice(0, 1_000) ?? null,
        occlusions,
      };
    });

    const card = {
      externalId,
      question,
      answer,
      title: optionalText(input.title),
      deckPath: normalizeText(input.deckPath ?? "") || "Imported",
      tags: normalizeTags(input.tags),
      source: optionalText(input.source),
      author: optionalText(input.author),
      license: optionalText(input.license),
      noteGuid: optionalText(input.noteGuid),
      cardOrdinal,
      warnings: input.warnings ?? [],
      media,
    };
    return {
      ...card,
      contentHash: contentHash(card.question, card.answer, card.media),
      metadataHash: metadataHash(card),
    };
  });

  const usedAssetHashes = new Set(
    cards.flatMap((card) => card.media.map((item) => item.assetHash)),
  );
  return {
    cards,
    assets: [...assetsByName.values()].filter((asset) =>
      usedAssetHashes.has(asset.hash),
    ),
    duplicateIds: new Set(
      [...occurrences].filter(([, count]) => count > 1).map(([id]) => id),
    ),
    warnings: document.warnings ?? [],
    unsupported: document.unsupported ?? [],
  };
}

async function loadBindings(
  db: Database,
  userId: string,
  externalIds: string[],
): Promise<Map<string, ImportBindingRow>> {
  const bindings = new Map<string, ImportBindingRow>();
  const unique = [...new Set(externalIds)];
  const chunkSize = 400;
  for (let offset = 0; offset < unique.length; offset += chunkSize) {
    const chunk = unique.slice(offset, offset + chunkSize);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = (await db
      .prepare(
        `SELECT b.external_id,
                b.token_id,
                b.content_hash AS binding_content_hash,
                b.metadata_hash AS binding_metadata_hash,
                t.question AS token_question,
                t.concept AS token_concept,
                t.deprecated_at,
                c.id AS user_card_id
           FROM imported_card_bindings b
           LEFT JOIN tokens t ON t.id = b.token_id
           LEFT JOIN cards c ON c.token_id = b.token_id AND c.user_id = ?
          WHERE b.external_id IN (${placeholders})`,
      )
      .all(userId, ...chunk)) as ImportBindingRow[];
    for (const row of rows) bindings.set(row.external_id, row);
  }
  const tokenIds = [
    ...new Set([...bindings.values()].map((row) => row.token_id)),
  ];
  const mediaByToken = new Map<string, NormalizedMediaReference[]>();
  for (let offset = 0; offset < tokenIds.length; offset += chunkSize) {
    const chunk = tokenIds.slice(offset, offset + chunkSize);
    const placeholders = chunk.map(() => "?").join(",");
    const rows = (await db
      .prepare(
        `SELECT token_id, asset_hash, side, kind, ordinal, original_name,
                alt_text, occlusion_json
           FROM token_media
          WHERE token_id IN (${placeholders})
          ORDER BY token_id, side, ordinal`,
      )
      .all(...chunk)) as Array<{
      token_id: string;
      asset_hash: string;
      side: TokenMediaSide;
      kind: TokenMediaKind;
      ordinal: number;
      original_name: string;
      alt_text: string | null;
      occlusion_json: string | null;
    }>;
    for (const row of rows) {
      let occlusions: ImageOcclusionShape[] = [];
      try {
        occlusions = row.occlusion_json
          ? (JSON.parse(row.occlusion_json) as ImageOcclusionShape[])
          : [];
      } catch {
        occlusions = [];
      }
      const list = mediaByToken.get(row.token_id) ?? [];
      list.push({
        assetName: row.original_name,
        assetHash: row.asset_hash,
        side: row.side,
        kind: row.kind,
        ordinal: Number(row.ordinal),
        altText: row.alt_text,
        occlusions,
      });
      mediaByToken.set(row.token_id, list);
    }
  }
  for (const binding of bindings.values()) {
    binding.local_media = mediaByToken.get(binding.token_id) ?? [];
  }
  return bindings;
}

function planHashFor(
  document: TextImportDocument,
  cards: TextImportPreviewCard[],
  normalizedCards: NormalizedCard[],
  warnings: TextImportNotice[],
  unsupported: TextImportNotice[],
): string {
  return sha256Hex(
    JSON.stringify({
      format: document.format,
      sourceName: normalizeText(document.sourceName),
      cards: cards.map((card, index) => [
        card.externalId,
        card.action,
        card.tokenId,
        card.cardAction,
        card.contentChanged,
        card.mediaCount,
        normalizedCards[index]?.contentHash,
        normalizedCards[index]?.metadataHash,
        card.warnings.map((warning) => [warning.code, warning.message]),
      ]),
      warnings: warnings.map((notice) => [notice.code, notice.message]),
      unsupported: unsupported.map((notice) => [
        notice.code,
        notice.message,
        notice.externalId ?? null,
        notice.deckPath ?? null,
      ]),
    }),
  );
}

/** Classify a deterministic import preview without mutating the library. */
export async function previewTextImport(
  db: Database,
  userId: string,
  document: TextImportDocument,
): Promise<TextImportPreview> {
  const normalized = normalizeDocument(document);
  const bindings = await loadBindings(
    db,
    userId,
    normalized.cards.map((card) => card.externalId),
  );

  const cards: TextImportPreviewCard[] = normalized.cards.map((card) => {
    const binding = bindings.get(card.externalId);
    let action: TextImportAction;
    let reason: string;
    let tokenId: string | null = binding?.token_id ?? null;
    let contentChanged = false;

    if (normalized.duplicateIds.has(card.externalId)) {
      action = "conflict";
      reason = "The file contains this external identity more than once.";
      tokenId = null;
    } else if (!binding) {
      action = "create";
      reason = "No existing source binding was found.";
    } else if (
      binding.token_question === null ||
      binding.token_concept === null ||
      binding.deprecated_at !== null
    ) {
      action = "conflict";
      reason =
        "The existing source binding no longer points to active content.";
    } else {
      const currentHash = contentHash(
        binding.token_question,
        binding.token_concept,
        binding.local_media,
      );
      const sourceContentChanged =
        card.contentHash !== binding.binding_content_hash;
      const localContentChanged = currentHash !== binding.binding_content_hash;

      if (card.contentHash === currentHash) {
        contentChanged = false;
        if (
          card.contentHash !== binding.binding_content_hash ||
          card.metadataHash !== binding.binding_metadata_hash
        ) {
          action = "update";
          reason =
            "The imported card already matches locally; its source binding will be refreshed.";
        } else {
          action = "skip";
          reason = "Content and metadata are unchanged.";
        }
      } else if (sourceContentChanged && !localContentChanged) {
        action = "update";
        reason = "The source content changed since the previous import.";
        contentChanged = true;
      } else {
        action = "conflict";
        reason =
          "The source and the local card differ from the last imported version.";
      }
    }

    const cardAction =
      action === "conflict"
        ? "none"
        : binding?.user_card_id
          ? "keep"
          : "create";
    return {
      externalId: card.externalId,
      question: card.question,
      answer: card.answer,
      deckPath: card.deckPath,
      action,
      reason,
      tokenId,
      cardAction,
      contentChanged,
      mediaCount: card.media.length,
      warnings: card.warnings,
    };
  });

  const counts: TextImportCounts = {
    create: cards.filter((card) => card.action === "create").length,
    update: cards.filter((card) => card.action === "update").length,
    skip: cards.filter((card) => card.action === "skip").length,
    conflict: cards.filter((card) => card.action === "conflict").length,
    unsupported: normalized.unsupported.length,
    cardsToCreate: cards.filter((card) => card.cardAction === "create").length,
    valid: cards.filter((card) => card.action !== "conflict").length,
    total: cards.length + normalized.unsupported.length,
  };

  const deckCounts = new Map<string, number>();
  for (const card of cards) {
    deckCounts.set(card.deckPath, (deckCounts.get(card.deckPath) ?? 0) + 1);
  }
  const decks = [...deckCounts]
    .map(([path, deckCards]) => ({ path, cards: deckCards }))
    .sort((a, b) => a.path.localeCompare(b.path));

  return {
    format: document.format,
    sourceName: normalizeText(document.sourceName),
    planHash: planHashFor(
      document,
      cards,
      normalized.cards,
      normalized.warnings,
      normalized.unsupported,
    ),
    counts,
    decks,
    media: {
      assets: normalized.assets.length,
      references: normalized.cards.reduce(
        (sum, card) => sum + card.media.length,
        0,
      ),
      totalBytes: normalized.assets.reduce(
        (sum, asset) => sum + asset.data.byteLength,
        0,
      ),
    },
    cards,
    warnings: normalized.warnings,
    unsupported: normalized.unsupported,
  };
}

async function replaceTokenMedia(
  db: Database,
  tokenId: string,
  card: NormalizedCard,
  assetsByHash: Map<string, NormalizedAsset>,
): Promise<void> {
  await db.prepare("DELETE FROM token_media WHERE token_id = ?").run(tokenId);
  for (const media of card.media) {
    const asset = assetsByHash.get(media.assetHash);
    if (!asset) throw new Error(`Import media disappeared: ${media.assetName}`);
    await db
      .prepare(
        `INSERT INTO media_assets (hash, mime_type, byte_size, data)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(hash) DO NOTHING`,
      )
      .run(asset.hash, asset.mimeType, asset.data.byteLength, asset.data);
    const stored = (await db
      .prepare(
        "SELECT mime_type, byte_size, data FROM media_assets WHERE hash = ?",
      )
      .get(asset.hash)) as
      | { mime_type: string; byte_size: number | bigint; data: Uint8Array }
      | undefined;
    if (
      !stored ||
      stored.mime_type !== asset.mimeType ||
      Number(stored.byte_size) !== asset.data.byteLength ||
      sha256HexBytes(stored.data) !== asset.hash
    ) {
      throw new Error(
        `Content-addressed media verification failed: ${asset.name}`,
      );
    }
    await db
      .prepare(
        `INSERT INTO token_media
          (token_id, asset_hash, side, kind, ordinal, original_name,
           alt_text, occlusion_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        tokenId,
        media.assetHash,
        media.side,
        media.kind,
        media.ordinal,
        media.assetName,
        media.altText,
        media.occlusions.length > 0 ? JSON.stringify(media.occlusions) : null,
      );
  }
}

function titleFor(card: NormalizedCard): string {
  return (card.title ?? card.question).slice(0, 160);
}

async function insertBinding(
  db: Database,
  document: TextImportDocument,
  card: NormalizedCard,
  tokenId: string,
  now: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO imported_card_bindings
        (id, external_id, token_id, format, source_name, note_guid,
         card_ordinal, deck_path, tags_json, source, author, license,
         content_hash, metadata_hash, imported_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      ulid(),
      card.externalId,
      tokenId,
      document.format,
      normalizeText(document.sourceName),
      card.noteGuid,
      card.cardOrdinal,
      card.deckPath,
      JSON.stringify(card.tags),
      card.source,
      card.author,
      card.license,
      card.contentHash,
      card.metadataHash,
      now,
      now,
    );
}

async function updateBinding(
  db: Database,
  document: TextImportDocument,
  card: NormalizedCard,
  now: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE imported_card_bindings
          SET format = ?, source_name = ?, note_guid = ?, card_ordinal = ?,
              deck_path = ?, tags_json = ?, source = ?, author = ?, license = ?,
              content_hash = ?, metadata_hash = ?, updated_at = ?
        WHERE external_id = ?`,
    )
    .run(
      document.format,
      normalizeText(document.sourceName),
      card.noteGuid,
      card.cardOrdinal,
      card.deckPath,
      JSON.stringify(card.tags),
      card.source,
      card.author,
      card.license,
      card.contentHash,
      card.metadataHash,
      now,
      card.externalId,
    );
}

/**
 * Recompute and atomically commit a previously shown preview.
 *
 * A changed file or library state changes the plan hash and aborts before the
 * first write, preventing a stale confirmation from importing unseen data.
 */
export async function commitTextImport(
  db: Database,
  userId: string,
  document: TextImportDocument,
  expectedPlanHash: string,
): Promise<TextImportCommitResult> {
  if (!expectedPlanHash.trim()) {
    throw new Error("An import preview must be confirmed before committing");
  }

  return db.transaction(async (tx) => {
    const preview = await previewTextImport(tx, userId, document);
    if (preview.planHash !== expectedPlanHash) {
      throw new Error(
        "The import preview is no longer current. Preview the file again before importing.",
      );
    }

    const normalized = normalizeDocument(document);
    const cardsByExternalId = new Map(
      normalized.cards.map((card) => [card.externalId, card]),
    );
    const assetsByHash = new Map(
      normalized.assets.map((asset) => [asset.hash, asset]),
    );
    const now = new Date().toISOString();
    let cardsCreated = 0;

    for (const item of preview.cards) {
      if (item.action === "conflict") continue;
      const card = cardsByExternalId.get(item.externalId);
      if (!card) {
        throw new Error(`Import card disappeared: ${item.externalId}`);
      }

      let tokenId = item.tokenId;
      if (item.action === "create") {
        const slug = await generateTokenSlug(
          tx,
          card.deckPath,
          card.answer,
          card.question,
        );
        const token = await createToken(tx, {
          slug,
          title: titleFor(card),
          question: card.question,
          concept: card.answer,
          domain: card.deckPath,
          source_link: card.source,
          question_source: "template",
        });
        tokenId = token.id;
        await insertBinding(tx, document, card, token.id, now);
        await replaceTokenMedia(tx, token.id, card, assetsByHash);
      } else {
        if (!tokenId) {
          throw new Error(`Import binding disappeared: ${item.externalId}`);
        }
        if (item.action === "update" && item.contentChanged) {
          await publishTokenRevisionInTransaction(tx, {
            tokenId,
            materiality: "material",
            changes: {
              question: card.question,
              concept: card.answer,
            },
            publishedBy: "file-import",
          });
          await replaceTokenMedia(tx, tokenId, card, assetsByHash);
        }
        if (item.action === "update") {
          await updateBinding(tx, document, card, now);
        }
      }

      if (!tokenId)
        throw new Error(`Could not resolve token: ${item.externalId}`);
      await ensureCard(tx, tokenId, userId);
      if (item.cardAction === "create") cardsCreated++;
    }

    return {
      planHash: preview.planHash,
      counts: preview.counts,
      cardsCreated,
    };
  });
}
