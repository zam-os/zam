/**
 * Testable multi-draft stepper for image-VL import (draft i of N).
 *
 * The controller holds the remaining drafts and advances on save or skip.
 * The UI layer renders `current()` into the existing confirm form.
 */

export interface MultiDraftState<T> {
  /** Drafts still awaiting confirm or skip (includes the current one). */
  remaining: T[];
  /** Zero-based index among the original set (for "i of N" labels). */
  originalIndex: number;
  /** Total drafts produced for this import. */
  total: number;
  /** How many drafts were saved. */
  saved: number;
  /** How many drafts were skipped. */
  skipped: number;
}

export interface MultiDraftController<T> {
  state(): MultiDraftState<T>;
  current(): T | undefined;
  isDone(): boolean;
  /** Label parts for "draft i of N" (1-based i). */
  progress(): { current: number; total: number };
  /** Keep the current draft's form values and replace the head. */
  replaceCurrent(draft: T): void;
  /** Advance past the current draft as saved. Returns false when finished. */
  saveAndNext(): boolean;
  /** Advance past the current draft as skipped. Returns false when finished. */
  skip(): boolean;
}

export function createMultiDraftController<T>(
  drafts: T[],
): MultiDraftController<T> {
  if (drafts.length === 0) {
    throw new Error("multi-draft controller requires at least one draft");
  }

  let remaining = [...drafts];
  let originalIndex = 0;
  const total = drafts.length;
  let saved = 0;
  let skipped = 0;

  const controller: MultiDraftController<T> = {
    state() {
      return {
        remaining: [...remaining],
        originalIndex,
        total,
        saved,
        skipped,
      };
    },
    current() {
      return remaining[0];
    },
    isDone() {
      return remaining.length === 0;
    },
    progress() {
      return {
        current: Math.min(originalIndex + 1, total),
        total,
      };
    },
    replaceCurrent(draft: T) {
      if (remaining.length === 0) return;
      remaining = [draft, ...remaining.slice(1)];
    },
    saveAndNext() {
      if (remaining.length === 0) return false;
      remaining = remaining.slice(1);
      saved += 1;
      originalIndex += 1;
      return remaining.length > 0;
    },
    skip() {
      if (remaining.length === 0) return false;
      remaining = remaining.slice(1);
      skipped += 1;
      originalIndex += 1;
      return remaining.length > 0;
    },
  };

  return controller;
}
