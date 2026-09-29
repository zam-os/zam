/** Offline-first Android review-session orchestration over the shared kernel. */

import type { Database } from "../../src/kernel/db/types.js";
import {
  endSession,
  getSessionSummary,
  startSession,
} from "../../src/kernel/models/session.js";
import { executeReviewAction } from "../../src/kernel/recall/actions.js";
import {
  type AnswerPresentation,
  type ChoiceEvidence,
  ratingForChoice,
  resolveAnswerPresentation,
} from "../../src/kernel/recall/answer-presentation.js";
import {
  generatePrompt,
  type RecallPrompt,
} from "../../src/kernel/recall/prompter.js";
import type { AnswerFormat } from "../../src/kernel/scheduler/choice-ceiling.js";
import type { Rating } from "../../src/kernel/scheduler/fsrs.js";
import {
  AtomSiblingOccupiedError,
  abandonPresentation,
  admitPresentation,
  CardNotDueError,
  CardNotReviewableError,
} from "../../src/kernel/scheduler/presentation.js";
import {
  buildReviewQueue,
  type ReviewQueueItem,
} from "../../src/kernel/scheduler/queue.js";
import type { StudyLearningMode } from "../../src/kernel/scheduler/study-settings.js";

export const MOBILE_REVIEW_STORAGE_KEY = "zam.mobile-review-session.v1";

/** A choice answer: the option index, or "Don't know". */
export type ChoicePick = number | "dont_know";

interface StoredPresentation {
  cardId: string;
  mode: StudyLearningMode;
  value: AnswerPresentation;
}

export interface StoredChoicePick {
  chosen: ChoicePick;
  disputed: boolean;
}

export interface ReviewSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface ReviewSessionSnapshot {
  version: 1;
  sessionId: string;
  userId: string;
  items: ReviewQueueItem[];
  currentIndex: number;
  draftAnswer: string;
  revealed: boolean;
  cardStartedAt: number;
  assessedAtomIds?: string[];
  /** Attempt id from the current card's admission; travels with its rating. */
  attemptId?: string | null;
  /**
   * `options` once the learner tapped a fast check on the current card, and
   * `choice` once they picked an option: both ratings are bounded by the tap
   * ceiling (ADR 2026-09-27).
   */
  answerFormat?: AnswerFormat;
  /**
   * How the current card is asked in Choice or Auto, kept so a restored
   * session shows the same options under the learner's finger.
   */
  presentation?: StoredPresentation;
  /** The learner's pick on the current choice card. */
  choicePick?: StoredChoicePick;
}

export interface MobileReviewProgress {
  current: number;
  total: number;
}

export interface MobileReviewSummary {
  sessionId: string;
  completedCount: number;
  totalCount: number;
  againCount: number;
  nextDueAt: string | null;
  stopped: boolean;
}

export interface MobileReviewRatingResult {
  nextDueAt: string;
  blockedPrerequisites: string[];
  summary?: MobileReviewSummary;
}

export type MobileReviewRestoreResult =
  | { kind: "none" }
  | { kind: "active" }
  | { kind: "completed"; summary: MobileReviewSummary };

function isQueueItem(value: unknown): value is ReviewQueueItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ReviewQueueItem>;
  return (
    typeof item.cardId === "string" &&
    typeof item.tokenId === "string" &&
    typeof item.slug === "string" &&
    typeof item.title === "string" &&
    typeof item.concept === "string" &&
    typeof item.domain === "string" &&
    typeof item.bloomLevel === "number" &&
    typeof item.state === "string" &&
    typeof item.dueAt === "string"
  );
}

function parseSnapshot(raw: string | null): ReviewSessionSnapshot | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ReviewSessionSnapshot>;
    if (
      value.version !== 1 ||
      typeof value.sessionId !== "string" ||
      typeof value.userId !== "string" ||
      !Array.isArray(value.items) ||
      !value.items.every(isQueueItem) ||
      !Number.isInteger(value.currentIndex) ||
      (value.currentIndex ?? -1) < 0 ||
      typeof value.draftAnswer !== "string" ||
      typeof value.revealed !== "boolean" ||
      typeof value.cardStartedAt !== "number"
    ) {
      return null;
    }
    // A malformed choice state costs the options, never the session.
    const presentation = value.presentation as Partial<StoredPresentation>;
    if (
      presentation &&
      (typeof presentation.cardId !== "string" ||
        (presentation.value?.format !== "choice" &&
          presentation.value?.format !== "recall"))
    ) {
      delete value.presentation;
      delete value.choicePick;
    }
    const pick = value.choicePick as Partial<StoredChoicePick> | undefined;
    if (
      pick &&
      (!value.presentation ||
        typeof pick.disputed !== "boolean" ||
        (pick.chosen !== "dont_know" && !Number.isInteger(pick.chosen)))
    ) {
      delete value.choicePick;
    }
    return value as ReviewSessionSnapshot;
  } catch {
    return null;
  }
}

export class MobileReviewSession {
  private snapshot: ReviewSessionSnapshot | null = null;

  constructor(
    private readonly db: Database,
    private readonly storage: ReviewSessionStorage,
    private readonly now: () => number = Date.now,
  ) {}

  get active(): boolean {
    return this.snapshot !== null;
  }

  get currentItem(): ReviewQueueItem | null {
    if (!this.snapshot) return null;
    return this.snapshot.items[this.snapshot.currentIndex] ?? null;
  }

  get currentPrompt(): RecallPrompt | null {
    const item = this.currentItem;
    if (!item) return null;
    return generatePrompt({
      cardId: item.cardId,
      tokenId: item.tokenId,
      slug: item.slug,
      concept: item.concept,
      domain: item.domain,
      bloomLevel: item.bloomLevel as 1 | 2 | 3 | 4 | 5,
      sourceLink: item.sourceLink,
      question: item.question,
    });
  }

  get progress(): MobileReviewProgress {
    if (!this.snapshot) return { current: 0, total: 0 };
    return {
      current: Math.min(
        this.snapshot.currentIndex + 1,
        this.snapshot.items.length,
      ),
      total: this.snapshot.items.length,
    };
  }

  get draftAnswer(): string {
    return this.snapshot?.draftAnswer ?? "";
  }

  get revealed(): boolean {
    return this.snapshot?.revealed ?? false;
  }

  isAtomAssessed(atomId: string | null | undefined): boolean {
    if (!atomId || !this.snapshot) return false;
    return (this.snapshot.assessedAtomIds ?? []).includes(atomId);
  }

  markAtomAssessed(atomId: string): void {
    if (!this.snapshot) return;
    const seen = new Set(this.snapshot.assessedAtomIds ?? []);
    seen.add(atomId);
    this.snapshot.assessedAtomIds = [...seen];
    this.persist();
  }

  async start(
    userId: string,
    options: { maxNew?: number } = {},
  ): Promise<boolean> {
    const queue = await buildReviewQueue(this.db, {
      userId,
      maxNew: options.maxNew,
      timeZone: this.timeZone(),
    });
    if (queue.items.length === 0) return false;

    const session = await startSession(this.db, {
      user_id: userId,
      task: "Android active recall",
      execution_context: "ui",
    });
    this.snapshot = {
      version: 1,
      sessionId: session.id,
      userId,
      items: queue.items,
      currentIndex: 0,
      draftAnswer: "",
      revealed: false,
      cardStartedAt: this.now(),
      assessedAtomIds: [],
    };
    await this.admitCurrent();
    if (!this.currentItem) {
      await this.finish();
      return false;
    }
    this.persist();
    return true;
  }

  async restore(userId: string): Promise<MobileReviewRestoreResult> {
    const snapshot = parseSnapshot(
      this.storage.getItem(MOBILE_REVIEW_STORAGE_KEY),
    );
    if (!snapshot || snapshot.userId !== userId) {
      this.clear();
      return { kind: "none" };
    }

    const session = (await this.db
      .prepare(
        "SELECT id, user_id, completed_at FROM sessions WHERE id = ? AND user_id = ?",
      )
      .get(snapshot.sessionId, userId)) as
      | { id: string; user_id: string; completed_at: string | null }
      | undefined;
    if (!session) {
      this.clear();
      return { kind: "none" };
    }
    this.snapshot = snapshot;
    if (session.completed_at) {
      return { kind: "completed", summary: await this.finish() };
    }

    const completed = (await this.db
      .prepare(
        "SELECT token_id FROM session_steps WHERE session_id = ? AND rating IS NOT NULL",
      )
      .all(snapshot.sessionId)) as { token_id: string }[];
    const completedTokenIds = new Set(completed.map((row) => row.token_id));
    while (
      snapshot.currentIndex < snapshot.items.length &&
      completedTokenIds.has(snapshot.items[snapshot.currentIndex].tokenId)
    ) {
      snapshot.currentIndex += 1;
      this.resetCardAnswer(snapshot);
    }

    if (!this.currentItem) {
      return { kind: "completed", summary: await this.finish() };
    }
    await this.admitCurrent();
    if (!this.currentItem) {
      return { kind: "completed", summary: await this.finish() };
    }
    this.persist();
    return { kind: "active" };
  }

  /** The current card was answered by tapping one of its fast-check options. */
  markOptionsTapped(): void {
    if (!this.snapshot || this.snapshot.revealed) return;
    this.snapshot.answerFormat = "options";
    this.persist();
  }

  updateDraftAnswer(answer: string): void {
    if (!this.snapshot || this.snapshot.revealed) return;
    this.snapshot.draftAnswer = answer;
    this.persist();
  }

  reveal(options?: { allowEmpty?: boolean }): void {
    if (!this.snapshot) throw new Error("No active review session");
    if (!options?.allowEmpty && !this.snapshot.draftAnswer.trim()) {
      throw new Error("Answer is required before reveal");
    }
    this.snapshot.revealed = true;
    this.persist();
  }

  /**
   * How the current card is asked in `mode` (ADR 2026-09-27 Decisions 6–9).
   *
   * Resolved once per card and mode and kept in the snapshot, so a re-render
   * or a restored session shows the same options. Once the card is answered
   * the stored presentation stands, whatever the mode switcher says since.
   */
  async presentCurrent(
    mode: StudyLearningMode,
    options: { knowledgeContext?: string } = {},
  ): Promise<AnswerPresentation> {
    const snapshot = this.snapshot;
    const item = this.currentItem;
    if (!snapshot || !item) throw new Error("No active review card");
    const stored = snapshot.presentation;
    if (
      stored?.cardId === item.cardId &&
      (stored.mode === mode || snapshot.revealed)
    ) {
      return stored.value;
    }
    if (snapshot.revealed) return { format: "recall", reason: "mode" };
    const value = await resolveAnswerPresentation(this.db, {
      userId: snapshot.userId,
      cardId: item.cardId,
      mode,
      now: new Date(this.now()),
      knowledgeContext: options.knowledgeContext,
    });
    // The learner may have moved on while the kernel answered.
    if (this.snapshot !== snapshot || this.currentItem !== item) return value;
    snapshot.presentation = { cardId: item.cardId, mode, value };
    this.persist();
    return value;
  }

  /** The stored presentation for the current card, if it has one. */
  get presentation(): AnswerPresentation | null {
    const stored = this.snapshot?.presentation;
    return stored && stored.cardId === this.currentItem?.cardId
      ? stored.value
      : null;
  }

  get choicePick(): StoredChoicePick | null {
    return this.snapshot?.choicePick ?? null;
  }

  /**
   * The learner picked an option, or "Don't know". The pick is the answer:
   * the card counts as revealed and its rating follows from the pick.
   */
  choose(chosen: ChoicePick): void {
    const snapshot = this.snapshot;
    const presentation = this.presentation;
    if (!snapshot || presentation?.format !== "choice") {
      throw new Error("The current card is not asked as a choice");
    }
    if (snapshot.revealed || snapshot.choicePick) return;
    const { options } = presentation.choice;
    if (
      chosen !== "dont_know" &&
      (!Number.isInteger(chosen) || chosen < 0 || chosen >= options.length)
    ) {
      throw new Error("That option was not shown");
    }
    snapshot.choicePick = { chosen, disputed: false };
    snapshot.answerFormat = "choice";
    snapshot.draftAnswer = chosen === "dont_know" ? "" : options[chosen]!;
    snapshot.revealed = true;
    this.persist();
  }

  /** "My answer is also correct" on a chosen distractor (Decision 7). */
  disputeChoice(): void {
    const snapshot = this.snapshot;
    const pick = snapshot?.choicePick;
    const presentation = this.presentation;
    if (
      !snapshot ||
      !pick ||
      pick.disputed ||
      pick.chosen === "dont_know" ||
      presentation?.format !== "choice" ||
      pick.chosen === presentation.choice.correctIndex
    ) {
      return;
    }
    pick.disputed = true;
    this.persist();
  }

  /** The evidence a picked choice is booked with, or null. */
  private choiceEvidence(): ChoiceEvidence | null {
    const pick = this.snapshot?.choicePick;
    const presentation = this.presentation;
    if (!pick || presentation?.format !== "choice") return null;
    const { options, correctIndex, entries } = presentation.choice;
    return {
      options,
      correctIndex,
      entries,
      chosen: pick.chosen,
      ...(pick.disputed ? { disputed: true } : {}),
    };
  }

  /** Book the picked choice with the rating it earns (Decision 3). */
  async rateChoice(): Promise<MobileReviewRatingResult> {
    const evidence = this.choiceEvidence();
    if (!evidence) throw new Error("Pick an option before moving on");
    return this.rate(ratingForChoice(evidence));
  }

  async rate(rating: Rating): Promise<MobileReviewRatingResult> {
    const snapshot = this.snapshot;
    const item = this.currentItem;
    if (!snapshot || !item) throw new Error("No active review card");
    if (!snapshot.revealed) throw new Error("Reveal the answer before rating");

    const choiceEvidence = this.choiceEvidence();
    if (choiceEvidence && rating !== ratingForChoice(choiceEvidence)) {
      throw new Error(
        `A choice earns rating ${ratingForChoice(choiceEvidence)}, not ${rating}`,
      );
    }
    const result = await executeReviewAction(this.db, {
      action: "rate",
      cardId: item.cardId,
      userId: snapshot.userId,
      rating,
      sessionId: snapshot.sessionId,
      responseTimeMs: Math.max(0, this.now() - snapshot.cardStartedAt),
      attemptId: snapshot.attemptId ?? undefined,
      answerFormat: choiceEvidence
        ? "choice"
        : snapshot.answerFormat === "options"
          ? "options"
          : "recall",
      ...(choiceEvidence ? { choiceEvidence } : {}),
    });

    snapshot.currentIndex += 1;
    this.resetCardAnswer(snapshot);
    snapshot.attemptId = null;

    const response: MobileReviewRatingResult = {
      nextDueAt: result.evaluation?.nextDueAt ?? item.dueAt,
      blockedPrerequisites:
        result.blocked?.prerequisites.map((entry) => entry.slug) ?? [],
    };
    if (!this.currentItem) {
      response.summary = await this.finish();
    } else {
      await this.admitCurrent();
      if (!this.currentItem) {
        response.summary = await this.finish();
      } else {
        this.persist();
      }
    }
    return response;
  }

  /**
   * Take a corrected question or answer into the running session.
   *
   * The queue is a snapshot taken when the session started, so a card edited
   * mid-session would otherwise keep asking the old wording until the next
   * session — the learner would fix a card, see the mistake again on the very
   * next screen, and reasonably conclude nothing was saved. The database write
   * belongs to the caller; this keeps the in-memory copy honest.
   */
  applyCardEdit(edit: { question?: string; concept?: string }): void {
    const snapshot = this.snapshot;
    const item = this.currentItem;
    if (!snapshot || !item) return;
    if (edit.question !== undefined) item.question = edit.question;
    if (edit.concept !== undefined) item.concept = edit.concept;
    // Options chosen for the old wording must not outlive it.
    if (!snapshot.revealed) delete snapshot.presentation;
    this.persist();
  }

  /**
   * Drop the current card from the queue without rating it.
   *
   * A deleted card has no FSRS outcome to record — it is gone, not "again" —
   * so it leaves the queue rather than being scored. Removing it (instead of
   * skipping past it) keeps `progress.total` truthful: a session that started
   * with eight cards and lost one is a session of seven.
   *
   * Returns the summary when that was the last card, mirroring `rate`.
   */
  async dropCurrent(): Promise<MobileReviewSummary | null> {
    const snapshot = this.snapshot;
    if (!snapshot || !this.currentItem) return null;
    await this.releaseUnshownCurrent();
    snapshot.items.splice(snapshot.currentIndex, 1);
    this.resetCardAnswer(snapshot);
    if (!this.currentItem) return await this.finish();
    await this.admitCurrent();
    if (!this.currentItem) return await this.finish();
    this.persist();
    return null;
  }

  /**
   * Remove the current and remaining cards of one atom (self-assessment
   * "I already know this"). Earlier rated cards stay in the snapshot so the
   * session total stays honest.
   */
  async dropAtom(atomId: string): Promise<MobileReviewSummary | null> {
    const snapshot = this.snapshot;
    if (!snapshot || !atomId) return null;
    await this.releaseUnshownCurrent();
    snapshot.items = snapshot.items.filter(
      (item, index) => index < snapshot.currentIndex || item.atomId !== atomId,
    );
    this.resetCardAnswer(snapshot);
    if (!this.currentItem) return await this.finish();
    await this.admitCurrent();
    if (!this.currentItem) return await this.finish();
    this.persist();
    return null;
  }

  async finish(): Promise<MobileReviewSummary> {
    const snapshot = this.snapshot;
    if (!snapshot) throw new Error("No active review session");

    const session = (await this.db
      .prepare("SELECT completed_at FROM sessions WHERE id = ?")
      .get(snapshot.sessionId)) as { completed_at: string | null } | undefined;
    if (session && !session.completed_at) {
      await endSession(this.db, snapshot.sessionId);
    }

    const summary = await getSessionSummary(this.db, snapshot.sessionId);
    const ratedSteps = summary.steps.filter((step) => step.rating !== null);
    const next = (await this.db
      .prepare(
        "SELECT MIN(due_at) AS next_due_at FROM cards WHERE user_id = ? AND blocked = 0",
      )
      .get(snapshot.userId)) as { next_due_at: string | null } | undefined;
    const result: MobileReviewSummary = {
      sessionId: snapshot.sessionId,
      completedCount: ratedSteps.length,
      totalCount: snapshot.items.length,
      againCount: ratedSteps.filter((step) => step.rating === 1).length,
      nextDueAt: next?.next_due_at ?? null,
      stopped: ratedSteps.length < snapshot.items.length,
    };
    this.clear();
    return result;
  }

  /** Same zone for queue building and admission, so both see one learning day. */
  private timeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  }

  /**
   * Confirm the reserved current card as an actual display. Call this only
   * when the card itself is shown, not when a precondition offer covers it.
   *
   * A reservation can still lose its slot between the prefetch and the
   * display — a sibling taken on another surface, or a rating that moved the
   * card out of due — and `admitCurrent` then drops it from the queue. When
   * that empties the queue this returns the summary, like `rate` and
   * `dropCurrent`, so the caller ends the session instead of leaving the
   * previous card on screen.
   */
  async confirmCurrent(): Promise<MobileReviewSummary | null> {
    if (!this.snapshot || !this.currentItem) return null;
    await this.admitCurrent(true);
    if (!this.currentItem) return await this.finish();
    this.persist();
    return null;
  }

  private async releaseUnshownCurrent(): Promise<void> {
    const snapshot = this.snapshot;
    if (!snapshot?.attemptId) return;
    await abandonPresentation(this.db, snapshot.attemptId);
    snapshot.attemptId = null;
  }

  private async admitCurrent(confirm = false): Promise<void> {
    const snapshot = this.snapshot;
    if (!snapshot) return;
    while (this.currentItem) {
      try {
        const admission = await admitPresentation(this.db, {
          userId: snapshot.userId,
          cardId: this.currentItem.cardId,
          sessionId: snapshot.sessionId,
          timeZone: this.timeZone(),
          confirm,
        });
        snapshot.attemptId = admission.attemptId;
        return;
      } catch (error) {
        if (
          !(error instanceof AtomSiblingOccupiedError) &&
          !(error instanceof CardNotDueError) &&
          !(error instanceof CardNotReviewableError)
        ) {
          throw error;
        }
        // Never shown, so not part of this session: remove it like a dropped
        // card so `progress.total` and the summary stay truthful.
        snapshot.items.splice(snapshot.currentIndex, 1);
        this.resetCardAnswer(snapshot);
        snapshot.attemptId = null;
      }
    }
  }

  /** Card ids after the current one, for preparing their options ahead. */
  upcomingCardIds(limit: number): string[] {
    if (!this.snapshot) return [];
    return this.snapshot.items
      .slice(this.snapshot.currentIndex + 1, this.snapshot.currentIndex + 1 + limit)
      .map((item) => item.cardId);
  }

  /** Forget everything the learner did on the card that was current. */
  private resetCardAnswer(snapshot: ReviewSessionSnapshot): void {
    snapshot.draftAnswer = "";
    delete snapshot.answerFormat;
    delete snapshot.presentation;
    delete snapshot.choicePick;
    snapshot.revealed = false;
    snapshot.cardStartedAt = this.now();
  }

  private persist(): void {
    if (!this.snapshot) return;
    this.storage.setItem(
      MOBILE_REVIEW_STORAGE_KEY,
      JSON.stringify(this.snapshot),
    );
  }

  private clear(): void {
    this.snapshot = null;
    this.storage.removeItem(MOBILE_REVIEW_STORAGE_KEY);
  }
}
