/**
 * How a card is asked in the Choice and Auto modes (ADR 2026-09-27 Decisions
 * 6–9), and what a choice's outcome writes.
 *
 * `resolveAnswerPresentation` decides between a choice and a recall format and,
 * for a choice, assembles the options a learner sees. Every selection and
 * permutation is derived from the card and its due date: the same card shows
 * the same set while it is being answered, and the kernel draws no random
 * numbers. No model is involved — generated options arrive through the cache.
 */

import { nowIso } from "../db/sql.js";
import type { Database } from "../db/types.js";
import { getCardById } from "../models/card.js";
import { getTokenById } from "../models/token.js";
import {
  type AnswerFormat,
  CHOICE_CEILING_DAYS,
} from "../scheduler/choice-ceiling.js";
import { createFSRS, type SchedulingCard } from "../scheduler/fsrs.js";
import { parseReviewFastCheck } from "../scheduler/queue.js";
import type { StudyLearningMode } from "../scheduler/study-settings.js";
import { seededPermutation } from "../util/seeded.js";
import { checkCandidate, checkShownSet } from "./choice-checks.js";
import {
  choiceSourceHash,
  deriveDistractors,
  isChoiceSuitable,
  listActiveDistractors,
  RETIRE_MAX_CHOSEN_SHARE,
  RETIRE_MIN_SHOWN,
} from "./choice-options.js";

/** How many distractors a presentation shows beside the answer (Decision 2). */
export const SHOWN_DISTRACTORS = 2;

export type RecallReason =
  | "mode"
  | "unsuitable"
  | "no_options"
  | "probe"
  | "recall_stage"
  | "curated_disputed";

export type ChoiceEntrySource = "correct" | "curated" | "derived" | "generated";

export interface ChoiceEntry {
  source: ChoiceEntrySource;
  /** `choice_distractors` row, for curated and generated cached options. */
  distractorId?: string;
  /** Index in the item's stored `fast_check`, for an authored set. */
  curatedIndex?: number;
  /** The item a derived option was taken from. */
  donorTokenId?: string;
  /** Contrast line after a miss; a derived option names its own question. */
  reason?: string | null;
}

export interface PresentedChoice {
  options: string[];
  correctIndex: number;
  /** Aligned with `options`. */
  entries: ChoiceEntry[];
}

export type AnswerPresentation =
  | { format: "choice"; choice: PresentedChoice }
  | { format: "recall"; reason: RecallReason };

export interface AnswerPresentationInput {
  userId: string;
  cardId: string;
  mode: StudyLearningMode;
  now?: Date;
  /** The knowledge context the session is filtered by, if any. */
  knowledgeContext?: string;
}

/**
 * What a learner saw and picked, stored with the attempt and used to update the
 * option cache (Decisions 5 and 7).
 */
export interface ChoiceEvidence {
  options: string[];
  correctIndex: number;
  chosen: number | "dont_know";
  entries: ChoiceEntry[];
  /** "My answer is also correct" on the chosen distractor. */
  disputed?: boolean;
}

interface Candidate {
  text: string;
  entry: ChoiceEntry;
}

function schedulingCardOf(card: {
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: string;
  learning_step: number | null;
  due_at: string;
  last_review_at: string | null;
}): SchedulingCard {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as SchedulingCard["state"],
    learningStep: card.learning_step,
    dueAt: new Date(card.due_at),
    lastReviewAt: card.last_review_at ? new Date(card.last_review_at) : null,
  };
}

/**
 * Whether Auto asks this card in free recall (Decision 8): once any of its
 * reviews was answered freely — or predates the answer format — the card stays
 * in free recall; before that, the review at which a correct choice would
 * reach the ceiling becomes the recall probe.
 */
async function autoRecallReason(
  db: Database,
  cardId: string,
  card: SchedulingCard,
  now: Date,
): Promise<"recall_stage" | "probe" | null> {
  const recalled = await db
    .prepare(
      `SELECT 1 AS hit FROM review_logs
        WHERE card_id = ?
          AND (answer_format IS NULL OR answer_format = 'recall')
        LIMIT 1`,
    )
    .get(cardId);
  if (recalled) return "recall_stage";
  if (card.state === "new") return null;
  if (card.stability >= CHOICE_CEILING_DAYS) return "probe";
  const ifCorrect = createFSRS().schedule(card, 3, now);
  return ifCorrect.stability >= CHOICE_CEILING_DAYS ? "probe" : null;
}

function presentSet(
  correct: string,
  distractors: readonly Candidate[],
  seed: string,
): PresentedChoice {
  const ordered = seededPermutation(
    [
      { text: correct, entry: { source: "correct" } as ChoiceEntry },
      ...distractors,
    ],
    seed,
  );
  return {
    options: ordered.map((candidate) => candidate.text),
    correctIndex: ordered.findIndex(
      (candidate) => candidate.entry.source === "correct",
    ),
    entries: ordered.map((candidate) => candidate.entry),
  };
}

/**
 * Choose two distractors from a pool and a permutation, both seeded, and keep
 * the first set whose form does not give the answer away.
 */
function chooseFromPool(
  correct: string,
  pool: readonly Candidate[],
  seed: string,
): PresentedChoice | null {
  const shuffled = seededPermutation(pool, `${seed}:pool`);
  for (let first = 0; first < shuffled.length; first++) {
    for (let second = first + 1; second < shuffled.length; second++) {
      const set = presentSet(
        correct,
        [shuffled[first]!, shuffled[second]!],
        `${seed}:${first}:${second}`,
      );
      if (checkShownSet(set.options, set.correctIndex) === null) return set;
    }
  }
  return null;
}

/** Candidates that survive the deterministic checks, in order, deduplicated. */
function usable(
  correct: string,
  candidates: readonly Candidate[],
): Candidate[] {
  const kept: Candidate[] = [];
  for (const candidate of candidates) {
    if (
      checkCandidate(
        correct,
        candidate.text,
        kept.map((entry) => entry.text),
      ) === null
    ) {
      kept.push(candidate);
    }
  }
  return kept;
}

/**
 * Decide how a card is asked and, for a choice, what the learner sees.
 *
 * Order: the mode, the item's suitability, Auto's stage, then the first option
 * source with enough usable distractors — the item's authored fast check,
 * curated options, options derived from items the learner has met, generated
 * options. Without enough options the card is asked in a recall format.
 */
export async function resolveAnswerPresentation(
  db: Database,
  input: AnswerPresentationInput,
): Promise<AnswerPresentation> {
  if (input.mode !== "choice" && input.mode !== "auto") {
    return { format: "recall", reason: "mode" };
  }
  const card = await getCardById(db, input.cardId);
  if (!card || card.user_id !== input.userId) {
    throw new Error(`Card ${input.cardId} does not belong to ${input.userId}`);
  }
  const token = await getTokenById(db, card.token_id);
  if (!token) throw new Error(`Token not found for card ${input.cardId}`);
  const media = (await db
    .prepare(
      `SELECT COUNT(*) AS n FROM token_media
        WHERE token_id = ? AND side = 'answer'`,
    )
    .get(token.id)) as { n: number } | undefined;

  if (
    !isChoiceSuitable({
      bloomLevel: token.bloom_level,
      concept: token.concept,
      hasAnswerMedia: Number(media?.n ?? 0) > 0,
    })
  ) {
    return { format: "recall", reason: "unsuitable" };
  }

  const now = input.now ?? new Date();
  if (input.mode === "auto") {
    const reason = await autoRecallReason(
      db,
      card.id,
      schedulingCardOf(card),
      now,
    );
    if (reason) return { format: "recall", reason };
  }

  const seed = `${card.id}:${card.due_at}`;
  const correct = token.concept.trim();
  const excluded = new Set(
    (
      (await db
        .prepare(
          `SELECT excluded_key FROM choice_exclusions
            WHERE user_id = ? AND token_id = ?`,
        )
        .all(input.userId, token.id)) as Array<{ excluded_key: string }>
    ).map((row) => row.excluded_key),
  );

  // 1. The item's authored fast check: its own options, all shown.
  const fastCheck = parseReviewFastCheck(token.fast_check);
  if (fastCheck) {
    const distractors: Candidate[] = fastCheck.options.flatMap((text, index) =>
      index === fastCheck.correctIndex || excluded.has(`curated:${index}`)
        ? []
        : [{ text, entry: { source: "curated", curatedIndex: index } }],
    );
    const needed = fastCheck.type === "binary_choice" ? 1 : SHOWN_DISTRACTORS;
    if (distractors.length < needed) {
      return { format: "recall", reason: "curated_disputed" };
    }
    const answer = fastCheck.options[fastCheck.correctIndex]!;
    return { format: "choice", choice: presentSet(answer, distractors, seed) };
  }

  // 2–4. Curated options, derived options, generated options.
  const stored = await listActiveDistractors(
    db,
    token.id,
    choiceSourceHash(token),
  );
  const curated = usable(
    correct,
    stored
      .filter(
        (row) =>
          row.source === "curated" && !excluded.has(`curated-row:${row.id}`),
      )
      .map((row) => ({
        text: row.text,
        entry: { source: "curated", distractorId: row.id, reason: row.reason },
      })),
  );
  const siblingGroup = (
    (await db
      .prepare(
        `SELECT note_guid FROM imported_card_bindings
          WHERE token_id = ? LIMIT 1`,
      )
      .get(token.id)) as { note_guid: string | null } | undefined
  )?.note_guid;
  const sources: Array<() => Promise<Candidate[]>> = [
    async () => curated,
    async () =>
      usable(
        correct,
        (
          await deriveDistractors(db, {
            userId: input.userId,
            token,
            siblingGroup,
            knowledgeContext: input.knowledgeContext,
          })
        ).map((donor) => ({
          text: donor.text,
          entry: {
            source: "derived",
            donorTokenId: donor.donorTokenId,
            reason: donor.question,
          },
        })),
      ),
    async () =>
      usable(
        correct,
        stored
          .filter((row) => row.source === "generated")
          .map((row) => ({
            text: row.text,
            entry: {
              source: "generated",
              distractorId: row.id,
              reason: row.reason,
            },
          })),
      ),
  ];
  for (const source of sources) {
    const pool = await source();
    if (pool.length < SHOWN_DISTRACTORS) continue;
    const set = chooseFromPool(correct, pool, seed);
    if (set) return { format: "choice", choice: set };
  }
  return { format: "recall", reason: "no_options" };
}

/** The rating a choice earns: correct or disputed → Good, else Again. */
export function ratingForChoice(evidence: ChoiceEvidence): 1 | 3 {
  return evidence.chosen === evidence.correctIndex || evidence.disputed === true
    ? 3
    : 1;
}

/** Reject evidence whose shape cannot have come from a presentation. */
export function assertChoiceEvidence(evidence: ChoiceEvidence): void {
  const count = evidence.options?.length ?? 0;
  if (
    count < 2 ||
    !Array.isArray(evidence.entries) ||
    evidence.entries.length !== count ||
    !Number.isInteger(evidence.correctIndex) ||
    evidence.correctIndex < 0 ||
    evidence.correctIndex >= count ||
    evidence.entries[evidence.correctIndex]?.source !== "correct"
  ) {
    throw new Error("Choice evidence does not describe a presented choice");
  }
  if (
    evidence.chosen !== "dont_know" &&
    (!Number.isInteger(evidence.chosen) ||
      evidence.chosen < 0 ||
      evidence.chosen >= count)
  ) {
    throw new Error("Choice evidence names an option that was not shown");
  }
  if (
    evidence.disputed &&
    (evidence.chosen === "dont_know" ||
      evidence.chosen === evidence.correctIndex)
  ) {
    throw new Error("Only a chosen distractor can be disputed");
  }
}

/**
 * What a choice writes beyond the rating (Decisions 6 and 7): exposure and pick
 * counters for cached options, retirement of options nobody picks, and the
 * consequences of a dispute — a cached generated option is retired for every
 * learner, a curated or derived one is excluded for this learner only.
 */
export async function applyChoiceOutcome(
  db: Database,
  input: {
    userId: string;
    tokenId: string;
    answerFormat: AnswerFormat;
    evidence: ChoiceEvidence;
  },
): Promise<void> {
  if (input.answerFormat !== "choice") return;
  const { evidence } = input;
  const now = nowIso();

  for (const [index, entry] of evidence.entries.entries()) {
    if (!entry.distractorId) continue;
    const chosen = evidence.chosen === index ? 1 : 0;
    await db
      .prepare(
        `UPDATE choice_distractors
            SET shown_count = shown_count + 1,
                chosen_count = chosen_count + ?
          WHERE id = ? AND token_id = ?`,
      )
      .run(chosen, entry.distractorId, input.tokenId);
    await db
      .prepare(
        `UPDATE choice_distractors
            SET retired_at = ?, retired_reason = 'unchosen'
          WHERE id = ?
            AND source = 'generated'
            AND retired_at IS NULL
            AND shown_count >= ?
            AND chosen_count < shown_count * ?`,
      )
      .run(now, entry.distractorId, RETIRE_MIN_SHOWN, RETIRE_MAX_CHOSEN_SHARE);
  }

  if (!evidence.disputed || evidence.chosen === "dont_know") return;
  const disputed = evidence.entries[evidence.chosen];
  if (!disputed) return;
  const exclude = async (key: string) => {
    await db
      .prepare(
        `INSERT INTO choice_exclusions (user_id, token_id, excluded_key, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (user_id, token_id, excluded_key) DO NOTHING`,
      )
      .run(input.userId, input.tokenId, key, now);
  };
  if (disputed.source === "generated" && disputed.distractorId) {
    await db
      .prepare(
        `UPDATE choice_distractors
            SET retired_at = COALESCE(retired_at, ?), retired_reason = 'disputed'
          WHERE id = ? AND token_id = ?`,
      )
      .run(now, disputed.distractorId, input.tokenId);
  } else if (disputed.source === "derived" && disputed.donorTokenId) {
    await exclude(`donor:${disputed.donorTokenId}`);
  } else if (disputed.source === "curated") {
    // A curator's option is flagged, never edited locally: this learner stops
    // seeing it, and the attempt evidence carries the dispute.
    if (disputed.curatedIndex !== undefined) {
      await exclude(`curated:${disputed.curatedIndex}`);
    } else if (disputed.distractorId) {
      await exclude(`curated-row:${disputed.distractorId}`);
    }
  }
}
