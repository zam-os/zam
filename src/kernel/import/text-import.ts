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
import { createToken, generateTokenSlug } from "../models/token.js";
import { sha256Hex } from "../util/sha256.js";

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
  warnings?: TextImportNotice[];
}

export interface TextImportDocument {
  format: TextImportFormat;
  /** Display-only basename. Absolute local paths never enter shared storage. */
  sourceName: string;
  cards: TextImportCardInput[];
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
  contentHash: string;
  metadataHash: string;
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
}

const MAX_IMPORT_CARDS = 50_000;
const MAX_EXTERNAL_ID_LENGTH = 512;
const MAX_TEXT_LENGTH = 65_536;

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

function contentHash(question: string | null, answer: string | null): string {
  return sha256Hex(
    `${normalizeText(question ?? "")}\n${normalizeText(answer ?? "")}`,
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
    ]),
  );
}

function normalizeDocument(document: TextImportDocument): {
  cards: NormalizedCard[];
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
    };
    return {
      ...card,
      contentHash: contentHash(card.question, card.answer),
      metadataHash: metadataHash(card),
    };
  });

  return {
    cards,
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
    cards,
    warnings: normalized.warnings,
    unsupported: normalized.unsupported,
  };
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
