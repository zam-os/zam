/**
 * The one write path for card text (ADR 2026-10-14b, Decision 1).
 *
 * A card's question and reference answer may be stored as segments. The
 * plain columns stay, and they hold the segments' plain projection — so they
 * must never be written apart from the segments, or every plain reader
 * (search, CLI, answer points, LLM prompts) would see text the learner does
 * not. `writeCardText` is the only function that writes a segment column, it
 * takes segments only, and it derives the plain column itself: drift is
 * impossible by construction rather than by convention.
 *
 * It also keeps two neighbours in step: a token whose plain text changed
 * loses its stored embedding (the next embedding pass recomputes it), and the
 * images a card's text names are `inline` rows in `token_media`, the single
 * link that keeps a media asset alive (Decision 5).
 */

import type { Database } from "../db/types.js";
import {
  type CardText,
  type CardTextIssue,
  normalizeCardText,
  plainProjection,
  type ValidateCardTextOptions,
  validateCardText,
} from "./card-text.js";

/** Image types an image segment may show; SVG is rasterised at import. */
const INLINE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export class CardTextError extends Error {
  constructor(
    readonly field: string,
    readonly issues: CardTextIssue[],
  ) {
    super(`${field}: ${issues.map((issue) => issue.message).join(" ")}`.trim());
    this.name = "CardTextError";
  }
}

/**
 * Read a stored segment column. Never throws: malformed or invalid stored
 * text reads as `null`, and the card falls back to its plain column — the
 * same graceful degradation the queue applies to a malformed fast check.
 */
export function parseStoredCardText(raw: unknown): CardText | null {
  if (raw === null || raw === undefined || raw === "") return null;
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return validateCardText(value).length === 0 ? (value as CardText) : null;
}

/** The token columns the guard and the write path read. */
export interface CardTextColumns {
  question: string | null;
  concept: string;
  question_segments?: string | null;
  concept_segments?: string | null;
}

/**
 * Refuse a plain write that would drift from the segments.
 *
 * A plain `question` or `concept` written to a field that has segments is
 * accepted only when it equals the stored projection (a surface echoing the
 * text it was shown). Anything else must go through the segments, and the
 * message sends the learner to the Studio's card editor, which edits them.
 */
export function assertPlainWriteAllowed(
  token: CardTextColumns,
  changes: { question?: string | null; concept?: string },
): void {
  const segmented: string[] = [];
  if (
    changes.question !== undefined &&
    token.question_segments &&
    (changes.question ?? "") !== (token.question ?? "")
  ) {
    segmented.push("question");
  }
  if (
    changes.concept !== undefined &&
    token.concept_segments &&
    changes.concept !== token.concept
  ) {
    segmented.push("answer");
  }
  if (segmented.length > 0) {
    throw new Error(
      `This card's ${segmented.join(" and ")} has formulas. Change it in the card editor, which keeps them.`,
    );
  }
}

export interface CardTextFields {
  /** Segments for the question; `null` turns it back into a plain question. */
  question?: CardText | null;
  /** Segments for the reference answer; `null` makes it plain again. */
  concept?: CardText | null;
}

export interface WriteCardTextResult {
  /** The plain projections now stored. */
  question: string | null;
  concept: string;
  /** Whether either plain column changed (and the embedding was dropped). */
  projectionChanged: boolean;
}

function prepare(
  field: string,
  value: CardText,
  opts: ValidateCardTextOptions,
): { segments: CardText; plain: string } {
  const issues = validateCardText(value, opts);
  if (issues.length > 0) throw new CardTextError(field, issues);
  const segments = normalizeCardText(value);
  const plain = plainProjection(segments);
  if (!plain) {
    throw new CardTextError(field, [
      { path: "", code: "empty", message: "The text is empty." },
    ]);
  }
  return { segments, plain };
}

/**
 * Write a token's question and/or reference answer as segments, with their
 * plain projections. Run it inside the caller's transaction when other
 * writes belong to the same change.
 *
 * `opts.requireSpeech` applies to published content and model-written cards
 * (ADR Decision 4); a personal import without a model leaves it off.
 */
export async function writeCardText(
  db: Database,
  tokenId: string,
  fields: CardTextFields,
  opts: ValidateCardTextOptions = {},
): Promise<WriteCardTextResult> {
  const token = (await db
    .prepare(
      "SELECT question, concept, question_segments, concept_segments FROM tokens WHERE id = ?",
    )
    .get(tokenId)) as CardTextColumns | undefined;
  if (!token) throw new Error(`Token not found: ${tokenId}`);

  const sets: string[] = [];
  const params: unknown[] = [];
  let question = token.question;
  let concept = token.concept;
  const media: Array<{ side: "question" | "answer"; segments: CardText }> = [];

  // A field whose stored segments and plain text already match is left
  // alone, so re-installing an unchanged tile writes no row.
  if (fields.question !== undefined) {
    if (fields.question === null) {
      if (token.question_segments) {
        sets.push("question_segments = NULL");
        media.push({ side: "question", segments: [] });
      }
    } else {
      const { segments, plain } = prepare("question", fields.question, opts);
      const json = JSON.stringify(segments);
      if (json !== token.question_segments || plain !== token.question) {
        sets.push("question = ?", "question_segments = ?");
        params.push(plain, json);
        question = plain;
        media.push({ side: "question", segments });
      }
    }
  }
  if (fields.concept !== undefined) {
    if (fields.concept === null) {
      if (token.concept_segments) {
        sets.push("concept_segments = NULL");
        media.push({ side: "answer", segments: [] });
      }
    } else {
      const { segments, plain } = prepare("concept", fields.concept, opts);
      const json = JSON.stringify(segments);
      if (json !== token.concept_segments || plain !== token.concept) {
        sets.push("concept = ?", "concept_segments = ?");
        params.push(plain, json);
        concept = plain;
        media.push({ side: "answer", segments });
      }
    }
  }
  if (sets.length === 0) {
    return { question, concept, projectionChanged: false };
  }

  sets.push("updated_at = ?");
  params.push(new Date().toISOString());
  await db
    .prepare(`UPDATE tokens SET ${sets.join(", ")} WHERE id = ?`)
    .run(...params, tokenId);

  for (const { side, segments } of media) {
    await syncInlineMedia(db, tokenId, side, segments);
  }

  const projectionChanged =
    question !== token.question || concept !== token.concept;
  if (projectionChanged) {
    // The vector was computed from the old text; the next embedding pass
    // recomputes it, and keyword search covers the gap.
    await db
      .prepare("DELETE FROM token_embeddings WHERE token_id = ?")
      .run(tokenId);
  }
  return { question, concept, projectionChanged };
}

/**
 * Make the `inline` media rows of one side match the image segments of that
 * side's text. `attached` rows (Anki media) are never touched.
 */
async function syncInlineMedia(
  db: Database,
  tokenId: string,
  side: "question" | "answer",
  segments: CardText,
): Promise<void> {
  const wanted = new Map<string, string>();
  for (const segment of segments) {
    if (segment.type === "image" && !wanted.has(segment.media)) {
      wanted.set(segment.media, segment.alt);
    }
  }
  const rows = (await db
    .prepare(
      `SELECT asset_hash, ordinal FROM token_media
        WHERE token_id = ? AND side = ? AND placement = 'inline'`,
    )
    .all(tokenId, side)) as Array<{ asset_hash: string; ordinal: number }>;

  for (const row of rows) {
    if (wanted.has(row.asset_hash)) {
      await db
        .prepare(
          `UPDATE token_media SET alt_text = ?
            WHERE token_id = ? AND side = ? AND ordinal = ?`,
        )
        .run(wanted.get(row.asset_hash), tokenId, side, row.ordinal);
      wanted.delete(row.asset_hash);
    } else {
      await db
        .prepare(
          "DELETE FROM token_media WHERE token_id = ? AND side = ? AND ordinal = ?",
        )
        .run(tokenId, side, row.ordinal);
    }
  }

  for (const [hash, alt] of wanted) {
    const asset = (await db
      .prepare("SELECT mime_type FROM media_assets WHERE hash = ?")
      .get(hash)) as { mime_type: string } | undefined;
    if (!asset) {
      throw new CardTextError(side === "question" ? "question" : "concept", [
        {
          path: "",
          code: "missing-media",
          message: `The image ${hash.slice(0, 12)}… is not stored.`,
        },
      ]);
    }
    if (!INLINE_IMAGE_TYPES.has(asset.mime_type)) {
      throw new CardTextError(side === "question" ? "question" : "concept", [
        {
          path: "",
          code: "bad-media-type",
          message: `${asset.mime_type} cannot be shown in card text; use PNG, JPEG, WebP or GIF.`,
        },
      ]);
    }
    const next = (await db
      .prepare(
        "SELECT COALESCE(MAX(ordinal), -1) + 1 AS next FROM token_media WHERE token_id = ? AND side = ?",
      )
      .get(tokenId, side)) as { next: number | bigint };
    await db
      .prepare(
        `INSERT INTO token_media
           (token_id, asset_hash, side, kind, ordinal, original_name, alt_text, placement)
         VALUES (?, ?, ?, 'image', ?, ?, ?, 'inline')`,
      )
      .run(
        tokenId,
        hash,
        side,
        Number(next.next),
        `inline-${hash.slice(0, 12)}`,
        alt,
      );
  }
}
