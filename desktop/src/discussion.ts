/**
 * Post-reveal discussion thread state (ADR 2026-07-06b).
 *
 * Framework-free by design (like bridge-transport.ts): no DOM, no Tauri
 * imports — main.ts owns all rendering, and tests/desktop/discussion.test.ts
 * drives this state machine directly. The thread is ephemeral: it opens only
 * after a successful AI evaluation and dies on every exit action (rating
 * check-in, skip, pause/stop, next card). Nothing here ever touches FSRS
 * state; the rating check-in is the only scheduling mutation and lives
 * elsewhere.
 */

export interface DiscussionTurn {
  role: "user" | "assistant";
  content: string;
}

/** Card frame captured at reveal time — the stable context of the thread. */
export interface DiscussionCardContext {
  slug: string;
  concept: string;
  domain: string;
  bloomLevel: number;
  context?: string | null;
  question: string;
  userAnswer: string;
  sourceContent?: string | null;
  sourceLink?: string | null;
  /** AI feedback already shown for this answer (the thread's opening turn). */
  feedback: string;
}

export interface DiscussionState {
  /** True only while a thread opened by a successful evaluation is alive. */
  active: boolean;
  /** Committed turn pairs, oldest first. */
  turns: DiscussionTurn[];
  /** A turn is in flight; further sends are rejected until it settles. */
  busy: boolean;
  /** Monotonic guard: bumped on every open/reset so stale replies are dropped. */
  seq: number;
  card: DiscussionCardContext | null;
}

export function createDiscussionState(): DiscussionState {
  return { active: false, turns: [], busy: false, seq: 0, card: null };
}

/**
 * Open the thread for the just-revealed card. The dialogue exists only after
 * the reveal produced AI feedback (checkpoint 2 + feedback); without it the
 * App stays in the one-shot flow and this returns false.
 */
export function openDiscussion(
  state: DiscussionState,
  card: DiscussionCardContext,
  opts: { evaluationSuccessful: boolean },
): boolean {
  if (!opts.evaluationSuccessful || !card.feedback.trim()) return false;
  state.active = true;
  state.turns = [];
  state.busy = false;
  state.seq++;
  state.card = card;
  return true;
}

/** Teardown on every exit action: rating check-in, skip, pause/stop, next card. */
export function resetDiscussion(state: DiscussionState): void {
  state.active = false;
  state.turns = [];
  state.busy = false;
  state.seq++;
  state.card = null;
}

/**
 * Begin one learner turn. Returns the guard token to pass to completeTurn /
 * failTurn, or null when the thread is closed, busy, or the message is blank.
 * There is deliberately no turn cap — the thread runs as long as the learner
 * needs (revised ADR 2026-07-06b).
 */
export function beginTurn(
  state: DiscussionState,
  message: string,
): number | null {
  if (!state.active || state.busy) return null;
  if (!message.trim()) return null;
  state.busy = true;
  return state.seq;
}

/** Commit a finished turn pair; drops replies from a torn-down thread. */
export function completeTurn(
  state: DiscussionState,
  guard: number,
  userMessage: string,
  reply: string,
): boolean {
  if (guard !== state.seq || !state.active) return false;
  state.turns.push({ role: "user", content: userMessage });
  state.turns.push({ role: "assistant", content: reply });
  state.busy = false;
  return true;
}

/** Unlock after a failed turn; the message is not recorded in the thread. */
export function failTurn(state: DiscussionState, guard: number): boolean {
  if (guard !== state.seq) return false;
  state.busy = false;
  return true;
}

/** CLI args for `zam bridge discuss-review`, mirroring evaluate-answer's. */
export function buildDiscussReviewArgs(
  card: DiscussionCardContext,
  turns: DiscussionTurn[],
  message: string,
): string[] {
  const args = [
    "--slug",
    card.slug,
    "--concept",
    card.concept,
    "--domain",
    card.domain,
    "--bloom-level",
    String(card.bloomLevel),
    "--question",
    card.question,
    "--user-answer",
    card.userAnswer,
    "--message",
    message,
    "--feedback",
    card.feedback,
  ];
  if (card.context) {
    args.push("--context", card.context);
  }
  if (card.sourceContent) {
    args.push("--source-content", card.sourceContent);
  } else if (card.sourceLink) {
    args.push("--source-link", card.sourceLink);
  }
  if (turns.length > 0) {
    args.push("--thread", JSON.stringify(turns));
  }
  return args;
}
