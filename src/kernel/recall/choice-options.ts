/**
 * Where choice options come from (ADR 2026-09-27 Decisions 6 and 9).
 *
 * Curated and generated options are a shared, rebuildable presentation cache
 * keyed to the item's question and answer text — never item substance, so
 * rewriting them never makes a card due. Derived options are answers of other
 * items the learner has already met; they are built per learner and per call
 * and never stored, because they come from one person's history. No model is
 * involved here: generated options arrive as data.
 */

import { ulid } from "ulid";
import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";
import type { Token } from "../models/token.js";
import { decodeEmbedding } from "../models/token-embedding.js";
import { cosineSimilarity } from "../search/hybrid.js";
import { sha256Hex } from "../util/sha256.js";
import { checkCandidate, normalizeOption } from "./choice-checks.js";

/** Highest Bloom level asked as a choice. */
export const MAX_CHOICE_BLOOM_LEVEL = 3;

/** How many derived options a presentation may choose from. */
export const DERIVED_POOL_SIZE = 4;

/** Retire a distractor that almost nobody picks once it has been seen enough. */
export const RETIRE_MIN_SHOWN = 30;
export const RETIRE_MAX_CHOSEN_SHARE = 0.05;

export interface ChoiceSuitabilityInput {
  bloomLevel: number;
  hasAnswerMedia: boolean;
}

/** Why an item is asked in a recall format rather than as a choice. */
export type ChoiceUnsuitability = "bloom_level" | "answer_media";

/**
 * Answers at Bloom levels 1–3 without answer media (Decision 9, amended
 * 2026-09-29): the number of answer points no longer excludes an item, since
 * many existing items predate the one-point authoring rule. Returns why an
 * item is unsuitable, or null.
 */
export function choiceUnsuitability(
  input: ChoiceSuitabilityInput,
): ChoiceUnsuitability | null {
  if (input.bloomLevel < 1 || input.bloomLevel > MAX_CHOICE_BLOOM_LEVEL) {
    return "bloom_level";
  }
  return input.hasAnswerMedia ? "answer_media" : null;
}

export function isChoiceSuitable(input: ChoiceSuitabilityInput): boolean {
  return choiceUnsuitability(input) === null;
}

/** Cache key for an item's options: its id plus its question and answer text. */
export function choiceSourceHash(
  token: Pick<Token, "id" | "question" | "concept">,
): string {
  return sha256Hex(`${token.id}\n${token.question ?? ""}\n${token.concept}`);
}

export type StoredDistractorSource = "curated" | "generated";

export interface StoredDistractor {
  id: string;
  tokenId: string;
  source: StoredDistractorSource;
  text: string;
  reason: string | null;
  shownCount: number;
  chosenCount: number;
}

interface DistractorRow {
  id: string;
  token_id: string;
  source: StoredDistractorSource;
  text: string;
  reason: string | null;
  shown_count: number;
  chosen_count: number;
}

function fromRow(row: DistractorRow): StoredDistractor {
  return {
    id: row.id,
    tokenId: row.token_id,
    source: row.source,
    text: row.text,
    reason: row.reason,
    shownCount: Number(row.shown_count),
    chosenCount: Number(row.chosen_count),
  };
}

/** Curated and generated options for the item's current wording, not retired. */
export async function listActiveDistractors(
  db: Database,
  tokenId: string,
  sourceHash: string,
): Promise<StoredDistractor[]> {
  const rows = (await db
    .prepare(
      `SELECT id, token_id, source, text, reason, shown_count, chosen_count
         FROM choice_distractors
        WHERE token_id = ? AND source_hash = ? AND retired_at IS NULL
        ORDER BY created_at, id`,
    )
    .all(tokenId, sourceHash)) as DistractorRow[];
  return rows.map(fromRow);
}

export interface NewDistractor {
  text: string;
  reason?: string | null;
  /** What the reject filter answered, kept for audit. */
  filterVerdict?: unknown;
}

export interface StoreDistractorsInput {
  tokenId: string;
  sourceHash: string;
  source: StoredDistractorSource;
  entries: readonly NewDistractor[];
  model?: string | null;
  filterModel?: string | null;
}

/**
 * Add options to the cache. An option equal to one already active for the same
 * wording is skipped. Returns how many rows were written.
 */
export async function storeDistractors(
  db: Database,
  input: StoreDistractorsInput,
): Promise<number> {
  const existing = await listActiveDistractors(
    db,
    input.tokenId,
    input.sourceHash,
  );
  const seen = new Set(existing.map((row) => normalizeOption(row.text)));
  const created = nowIso();
  let written = 0;
  for (const entry of input.entries) {
    const text = entry.text.trim();
    const key = normalizeOption(text);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    await db
      .prepare(
        `INSERT INTO choice_distractors (
           id, token_id, source_hash, source, text, reason, model,
           filter_model, filter_verdict, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        ulid(),
        input.tokenId,
        input.sourceHash,
        input.source,
        text,
        entry.reason?.trim() || null,
        input.model ?? null,
        input.filterModel ?? null,
        entry.filterVerdict === undefined
          ? null
          : JSON.stringify(entry.filterVerdict),
        created,
      );
    written += 1;
  }
  return written;
}

/**
 * Make an item's curated options match what its tile ships: add new ones and
 * drop curated rows the curator withdrew. Generated options are untouched.
 */
export async function syncCuratedDistractors(
  db: Database,
  token: Pick<Token, "id" | "question" | "concept">,
  entries: readonly NewDistractor[],
): Promise<void> {
  const sourceHash = choiceSourceHash(token);
  const wanted = new Set(entries.map((entry) => normalizeOption(entry.text)));
  const rows = (await db
    .prepare(
      `SELECT id, text FROM choice_distractors
        WHERE token_id = ? AND source = 'curated'`,
    )
    .all(token.id)) as Array<{ id: string; text: string }>;
  for (const row of rows) {
    if (!wanted.has(normalizeOption(row.text))) {
      await db
        .prepare("DELETE FROM choice_distractors WHERE id = ?")
        .run(row.id);
    }
  }
  await storeDistractors(db, {
    tokenId: token.id,
    sourceHash,
    source: "curated",
    entries,
  });
}

export interface DerivedDistractor {
  donorTokenId: string;
  text: string;
  /** The donor's question: "This answers: …" after a miss. */
  question: string | null;
  score: number;
}

export interface DeriveDistractorsInput {
  userId: string;
  token: Pick<Token, "id" | "concept" | "question" | "domain" | "atom_id">;
  /** The target item's sibling group (Anki note), excluded as donor. */
  siblingGroup?: string | null;
  /** The knowledge context the session is filtered by, if any. */
  knowledgeContext?: string;
  limit?: number;
}

interface DonorRow {
  id: string;
  concept: string;
  question: string | null;
  bloom_level: number;
  atom_id: string | null;
  sibling_group: string | null;
  answer_media: number;
  emb_model: string | null;
  emb_blob: Uint8Array | null;
}

function trigrams(text: string): Set<string> {
  const padded = `  ${normalizeOption(text)} `;
  const grams = new Set<string>();
  for (let index = 0; index + 3 <= padded.length; index++) {
    grams.add(padded.slice(index, index + 3));
  }
  return grams;
}

function trigramSimilarity(a: string, b: string): number {
  const left = trigrams(a);
  const right = trigrams(b);
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared += 1;
  const union = left.size + right.size - shared;
  return union === 0 ? 0 : shared / union;
}

function lengthCloseness(a: string, b: string): number {
  const longer = Math.max(a.length, b.length);
  return longer === 0 ? 1 : 1 - Math.abs(a.length - b.length) / longer;
}

/**
 * Answers of other items as distractors (Decision 6, source 2).
 *
 * Donors are only items this learner has already been asked, in the same
 * domain (and knowledge context when the session is filtered), published and
 * themselves suitable. The item's own atom, its sibling group, the learner's
 * disputed donors and anything the deterministic checks reject are excluded.
 * Stored embeddings rank donors when both sides have one under the same model;
 * otherwise text similarity and length closeness do.
 */
export async function deriveDistractors(
  db: Database,
  input: DeriveDistractorsInput,
): Promise<DerivedDistractor[]> {
  const params: unknown[] = [input.userId, input.token.id, input.token.domain];
  let sql = `
    SELECT t.id, t.concept, t.question, t.bloom_level, t.atom_id,
           (SELECT b.note_guid FROM imported_card_bindings b
             WHERE b.token_id = t.id LIMIT 1) AS sibling_group,
           (SELECT COUNT(*) FROM token_media tm
             WHERE tm.token_id = t.id AND tm.side = 'answer') AS answer_media,
           e.model AS emb_model,
           e.embedding AS emb_blob
      FROM cards c
      JOIN tokens t ON t.id = c.token_id
      LEFT JOIN token_embeddings e ON e.token_id = t.id
     WHERE c.user_id = ?
       AND c.last_review_at IS NOT NULL
       AND t.id <> ?
       AND t.domain = ?
       AND t.deprecated_at IS NULL
       AND t.editorial_state = 'published'`;
  if (input.knowledgeContext) {
    sql += ` AND EXISTS (
      SELECT 1 FROM token_contexts tc
      INNER JOIN contexts ctx ON ctx.id = tc.context_id
      WHERE tc.token_id = t.id AND ctx.name = ?
    )`;
    params.push(input.knowledgeContext);
  }
  const donors = (await db.prepare(sql).all(...params)) as DonorRow[];
  if (donors.length === 0) return [];

  const excluded = new Set(
    (
      (await db
        .prepare(
          `SELECT excluded_key FROM choice_exclusions
            WHERE user_id = ? AND token_id = ?`,
        )
        .all(input.userId, input.token.id)) as Array<{ excluded_key: string }>
    ).map((row) => row.excluded_key),
  );

  const target = (await db
    .prepare("SELECT model, embedding FROM token_embeddings WHERE token_id = ?")
    .get(input.token.id)) as
    | { model: string; embedding: Uint8Array }
    | undefined;
  const targetVector = target ? decodeEmbedding(target.embedding) : null;

  const scored: DerivedDistractor[] = [];
  for (const donor of donors) {
    if (input.token.atom_id && donor.atom_id === input.token.atom_id) continue;
    if (input.siblingGroup && donor.sibling_group === input.siblingGroup) {
      continue;
    }
    if (excluded.has(`donor:${donor.id}`)) continue;
    if (
      !isChoiceSuitable({
        bloomLevel: Number(donor.bloom_level),
        hasAnswerMedia: Number(donor.answer_media) > 0,
      })
    ) {
      continue;
    }
    if (
      checkCandidate(
        input.token.concept,
        donor.concept,
        [],
        input.token.question,
      )
    ) {
      continue;
    }
    const semantic =
      targetVector && donor.emb_blob && donor.emb_model === target?.model
        ? cosineSimilarity(targetVector, decodeEmbedding(donor.emb_blob))
        : null;
    const score =
      semantic ??
      0.7 * trigramSimilarity(input.token.concept, donor.concept) +
        0.3 * lengthCloseness(input.token.concept, donor.concept);
    scored.push({
      donorTokenId: donor.id,
      text: donor.concept.trim(),
      question: donor.question,
      // Embedding scores rank before text scores: one semantic hit beats any
      // lexical guess.
      score: semantic === null ? score : 1 + score,
    });
  }

  scored.sort(
    (a, b) => b.score - a.score || a.donorTokenId.localeCompare(b.donorTokenId),
  );
  const chosen: DerivedDistractor[] = [];
  for (const candidate of scored) {
    if (
      checkCandidate(
        input.token.concept,
        candidate.text,
        chosen.map((entry) => entry.text),
        input.token.question,
      ) !== null
    ) {
      continue;
    }
    chosen.push(candidate);
    if (chosen.length >= (input.limit ?? DERIVED_POOL_SIZE)) break;
  }
  return chosen;
}
