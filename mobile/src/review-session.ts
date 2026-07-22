/** Offline-first Android review-session orchestration over the shared kernel. */

import type { Database } from "../../src/kernel/db/types.js";
import {
  endSession,
  getSessionSummary,
  startSession,
} from "../../src/kernel/models/session.js";
import { executeReviewAction } from "../../src/kernel/recall/actions.js";
import {
  generatePrompt,
  type RecallPrompt,
} from "../../src/kernel/recall/prompter.js";
import type { Rating } from "../../src/kernel/scheduler/fsrs.js";
import {
  buildReviewQueue,
  type ReviewQueueItem,
} from "../../src/kernel/scheduler/queue.js";

export const MOBILE_REVIEW_STORAGE_KEY = "zam.mobile-review-session.v1";

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

  async start(userId: string): Promise<boolean> {
    const queue = await buildReviewQueue(this.db, { userId });
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
    };
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
      snapshot.draftAnswer = "";
      snapshot.revealed = false;
      snapshot.cardStartedAt = this.now();
    }

    if (!this.currentItem) {
      return { kind: "completed", summary: await this.finish() };
    }
    this.persist();
    return { kind: "active" };
  }

  updateDraftAnswer(answer: string): void {
    if (!this.snapshot || this.snapshot.revealed) return;
    this.snapshot.draftAnswer = answer;
    this.persist();
  }

  reveal(): void {
    if (!this.snapshot) throw new Error("No active review session");
    if (!this.snapshot.draftAnswer.trim()) {
      throw new Error("Answer is required before reveal");
    }
    this.snapshot.revealed = true;
    this.persist();
  }

  async rate(rating: Rating): Promise<MobileReviewRatingResult> {
    const snapshot = this.snapshot;
    const item = this.currentItem;
    if (!snapshot || !item) throw new Error("No active review card");
    if (!snapshot.revealed) throw new Error("Reveal the answer before rating");

    const result = await executeReviewAction(this.db, {
      action: "rate",
      cardId: item.cardId,
      userId: snapshot.userId,
      rating,
      sessionId: snapshot.sessionId,
      responseTimeMs: Math.max(0, this.now() - snapshot.cardStartedAt),
    });

    snapshot.currentIndex += 1;
    snapshot.draftAnswer = "";
    snapshot.revealed = false;
    snapshot.cardStartedAt = this.now();

    const response: MobileReviewRatingResult = {
      nextDueAt: result.evaluation?.nextDueAt ?? item.dueAt,
      blockedPrerequisites:
        result.blocked?.prerequisites.map((entry) => entry.slug) ?? [],
    };
    if (!this.currentItem) {
      response.summary = await this.finish();
    } else {
      this.persist();
    }
    return response;
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
