import { describe, expect, it } from "vitest";
import {
  beginTurn,
  buildDiscussReviewArgs,
  completeTurn,
  createDiscussionState,
  type DiscussionCardContext,
  failTurn,
  openDiscussion,
  resetDiscussion,
} from "../../desktop/src/discussion.js";

function makeCard(
  overrides: Partial<DiscussionCardContext> = {},
): DiscussionCardContext {
  return {
    slug: "fsrs-stability",
    concept: "Stability is the FSRS memory half-life parameter.",
    domain: "learning-science",
    bloomLevel: 2,
    context: "Scheduling internals",
    question: "What does the stability parameter express?",
    userAnswer: "How long a memory lasts",
    sourceContent: null,
    sourceLink: null,
    feedback: "Close! Stability is the interval at 90% recall. Rating: 3",
    ...overrides,
  };
}

describe("post-reveal discussion thread state (ADR 2026-07-06b)", () => {
  it("opens only after a successful AI evaluation with feedback", () => {
    const state = createDiscussionState();

    expect(
      openDiscussion(state, makeCard(), { evaluationSuccessful: false }),
    ).toBe(false);
    expect(state.active).toBe(false);

    expect(
      openDiscussion(state, makeCard({ feedback: "   " }), {
        evaluationSuccessful: true,
      }),
    ).toBe(false);
    expect(state.active).toBe(false);

    expect(
      openDiscussion(state, makeCard(), { evaluationSuccessful: true }),
    ).toBe(true);
    expect(state.active).toBe(true);
    expect(state.card?.slug).toBe("fsrs-stability");
  });

  it("rejects turns while closed, while busy, or with a blank message", () => {
    const state = createDiscussionState();
    expect(beginTurn(state, "hello?")).toBeNull();

    openDiscussion(state, makeCard(), { evaluationSuccessful: true });
    expect(beginTurn(state, "   ")).toBeNull();

    const guard = beginTurn(state, "first question");
    expect(guard).not.toBeNull();
    expect(beginTurn(state, "second while busy")).toBeNull();
  });

  it("accumulates many consecutive turns — there is no cap", () => {
    const state = createDiscussionState();
    openDiscussion(state, makeCard(), { evaluationSuccessful: true });

    for (let i = 1; i <= 12; i++) {
      const guard = beginTurn(state, `question ${i}`);
      expect(guard).not.toBeNull();
      expect(
        completeTurn(state, guard as number, `question ${i}`, `answer ${i}`),
      ).toBe(true);
    }

    expect(state.turns).toHaveLength(24);
    expect(state.turns[0]).toEqual({ role: "user", content: "question 1" });
    expect(state.turns[23]).toEqual({ role: "assistant", content: "answer 12" });
    expect(state.busy).toBe(false);
  });

  it("tears down on every exit action and drops stale replies", () => {
    const state = createDiscussionState();
    openDiscussion(state, makeCard(), { evaluationSuccessful: true });
    const guard = beginTurn(state, "why is that?") as number;

    // Exit action (rate/skip/pause/next card) while the turn is in flight.
    resetDiscussion(state);
    expect(state.active).toBe(false);
    expect(state.turns).toHaveLength(0);
    expect(state.card).toBeNull();

    // The reply that arrives afterwards must be dropped, not committed.
    expect(completeTurn(state, guard, "why is that?", "late reply")).toBe(
      false,
    );
    expect(state.turns).toHaveLength(0);

    // A stale failure must not unlock a thread it does not belong to.
    expect(failTurn(state, guard)).toBe(false);

    // No new turns without a fresh reveal.
    expect(beginTurn(state, "still there?")).toBeNull();
  });

  it("keeps guards from a previous card stale after reopening", () => {
    const state = createDiscussionState();
    openDiscussion(state, makeCard(), { evaluationSuccessful: true });
    const staleGuard = beginTurn(state, "old card question") as number;

    resetDiscussion(state);
    openDiscussion(state, makeCard({ slug: "next-card" }), {
      evaluationSuccessful: true,
    });

    expect(completeTurn(state, staleGuard, "old card question", "late")).toBe(
      false,
    );
    expect(state.turns).toHaveLength(0);

    const freshGuard = beginTurn(state, "new card question") as number;
    expect(freshGuard).not.toBe(staleGuard);
    expect(
      completeTurn(state, freshGuard, "new card question", "fresh reply"),
    ).toBe(true);
  });

  it("unlocks after a failed turn without recording it", () => {
    const state = createDiscussionState();
    openDiscussion(state, makeCard(), { evaluationSuccessful: true });

    const guard = beginTurn(state, "does not reach the provider") as number;
    expect(failTurn(state, guard)).toBe(true);
    expect(state.busy).toBe(false);
    expect(state.turns).toHaveLength(0);

    // The learner can retry immediately.
    expect(beginTurn(state, "retry")).not.toBeNull();
  });

  it("builds discuss-review args mirroring evaluate-answer's context", () => {
    const card = makeCard({ sourceContent: "resolved source text" });
    const turns = [
      { role: "user" as const, content: "why?" },
      { role: "assistant" as const, content: "because." },
    ];

    const args = buildDiscussReviewArgs(card, turns, "and how?");

    const arg = (flag: string) => args[args.indexOf(flag) + 1];
    expect(arg("--slug")).toBe("fsrs-stability");
    expect(arg("--concept")).toBe(card.concept);
    expect(arg("--domain")).toBe("learning-science");
    expect(arg("--bloom-level")).toBe("2");
    expect(arg("--question")).toBe(card.question);
    expect(arg("--user-answer")).toBe(card.userAnswer);
    expect(arg("--message")).toBe("and how?");
    expect(arg("--feedback")).toBe(card.feedback);
    expect(arg("--context")).toBe("Scheduling internals");
    expect(arg("--source-content")).toBe("resolved source text");
    expect(JSON.parse(arg("--thread"))).toEqual(turns);
  });

  it("omits optional args and prefers resolved source content over the link", () => {
    const bare = buildDiscussReviewArgs(
      makeCard({ context: null, sourceContent: null, sourceLink: null }),
      [],
      "first question",
    );
    expect(bare).not.toContain("--context");
    expect(bare).not.toContain("--thread");
    expect(bare).not.toContain("--source-content");
    expect(bare).not.toContain("--source-link");

    const linked = buildDiscussReviewArgs(
      makeCard({ sourceContent: null, sourceLink: "src/kernel/fsrs.ts" }),
      [],
      "q",
    );
    expect(linked).toContain("--source-link");

    const resolved = buildDiscussReviewArgs(
      makeCard({ sourceContent: "text", sourceLink: "src/kernel/fsrs.ts" }),
      [],
      "q",
    );
    expect(resolved).toContain("--source-content");
    expect(resolved).not.toContain("--source-link");
  });
});
