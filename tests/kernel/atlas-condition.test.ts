import { describe, expect, it } from "vitest";
import {
  CONDITION_BAND_RATIOS,
  type ConditionCard,
  cardCondition,
  DECAY_LAPSES,
  unitCondition,
} from "../../src/kernel/atlas/condition.js";
import {
  createEmptyCard,
  createFSRS,
  currentRetrievability,
  type SchedulingCard,
} from "../../src/kernel/scheduler/fsrs.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date("2026-10-13T12:00:00.000Z");

// FSRS-6 default decay; kept here so the inverse below cannot drift silently.
const W20 = 0.1542;
const FACTOR = 0.9 ** (-1 / W20) - 1;

/** Days after the last review at which a card of this stability has recall r. */
function elapsedForR(stability: number, r: number): number {
  return (stability / FACTOR) * (r ** (-1 / W20) - 1);
}

/** A due review card whose recall probability at NOW is r. */
function dueCardAt(
  r: number,
  overrides: Partial<ConditionCard> = {},
): ConditionCard {
  const stability = 20;
  const lastReview = new Date(
    NOW.getTime() - elapsedForR(stability, r) * DAY_MS,
  );
  return {
    state: "review",
    stability,
    dueAt: new Date(NOW.getTime() - 60_000).toISOString(),
    lastReviewAt: lastReview.toISOString(),
    lapses: 0,
    ...overrides,
  };
}

function knownCard(overrides: Partial<ConditionCard> = {}): ConditionCard {
  return {
    state: "review",
    stability: 20,
    dueAt: new Date(NOW.getTime() + 5 * DAY_MS).toISOString(),
    lastReviewAt: new Date(NOW.getTime() - 3 * DAY_MS).toISOString(),
    lapses: 0,
    ...overrides,
  };
}

const NEW_CARD: ConditionCard = {
  state: "new",
  stability: 0,
  dueAt: NOW.toISOString(),
  lastReviewAt: null,
  lapses: 0,
};

describe("cardCondition", () => {
  it("reproduces the spike's bands at the default retention of 0.9", () => {
    expect(CONDITION_BAND_RATIOS.due * 0.9).toBeCloseTo(0.85, 10);
    expect(CONDITION_BAND_RATIOS.overdue * 0.9).toBeCloseTo(0.75, 10);
    expect(CONDITION_BAND_RATIOS.decaying * 0.9).toBeCloseTo(0.65, 10);

    expect(cardCondition(dueCardAt(0.851), NOW)).toBe("due");
    expect(cardCondition(dueCardAt(0.849), NOW)).toBe("overdue");
    expect(cardCondition(dueCardAt(0.751), NOW)).toBe("overdue");
    expect(cardCondition(dueCardAt(0.749), NOW)).toBe("decaying");
    expect(cardCondition(dueCardAt(0.651), NOW)).toBe("decaying");
    expect(cardCondition(dueCardAt(0.649), NOW)).toBe("forgotten");
  });

  it("scales the bands with the request retention", () => {
    const params = { requestRetention: 0.8 };
    const due = CONDITION_BAND_RATIOS.due * 0.8; // ≈ 0.756
    const overdue = CONDITION_BAND_RATIOS.overdue * 0.8; // ≈ 0.667
    const decaying = CONDITION_BAND_RATIOS.decaying * 0.8; // ≈ 0.578

    expect(cardCondition(dueCardAt(due + 0.001), NOW, params)).toBe("due");
    expect(cardCondition(dueCardAt(due - 0.001), NOW, params)).toBe("overdue");
    expect(cardCondition(dueCardAt(overdue - 0.001), NOW, params)).toBe(
      "decaying",
    );
    expect(cardCondition(dueCardAt(decaying - 0.001), NOW, params)).toBe(
      "forgotten",
    );
    // The same card reads worse under the stricter default retention.
    expect(cardCondition(dueCardAt(due + 0.001), NOW)).toBe("overdue");
  });

  it("treats a new or never-reviewed card as unpractised", () => {
    expect(cardCondition(NEW_CARD, NOW)).toBe("unpractised");
    expect(cardCondition({ ...knownCard(), lastReviewAt: null }, NOW)).toBe(
      "unpractised",
    );
  });

  it("counts short steps as due", () => {
    const inTenMinutes = new Date(NOW.getTime() + 10 * 60_000).toISOString();
    expect(
      cardCondition(
        { ...knownCard(), state: "learning", dueAt: inTenMinutes },
        NOW,
      ),
    ).toBe("due");
    expect(
      cardCondition(
        { ...knownCard(), state: "relearning", dueAt: inTenMinutes, lapses: 1 },
        NOW,
      ),
    ).toBe("due");
  });

  it("treats a review card that is not due yet as known", () => {
    expect(cardCondition(knownCard(), NOW)).toBe("known");
  });

  it("marks a due card that keeps lapsing as at least decaying", () => {
    expect(cardCondition(dueCardAt(0.89, { lapses: DECAY_LAPSES }), NOW)).toBe(
      "decaying",
    );
    expect(cardCondition(dueCardAt(0.5, { lapses: DECAY_LAPSES }), NOW)).toBe(
      "forgotten",
    );
    expect(
      cardCondition(dueCardAt(0.89, { lapses: DECAY_LAPSES - 1 }), NOW),
    ).toBe("due");
    // Lapses alone never age a card that is not due.
    expect(cardCondition(knownCard({ lapses: DECAY_LAPSES }), NOW)).toBe(
      "known",
    );
  });

  it("reads SQLite's zone-less timestamps as UTC", () => {
    const sqlite = (d: Date) => d.toISOString().replace("T", " ").slice(0, 19);
    const card = dueCardAt(0.8);
    const asSqlite: ConditionCard = {
      ...card,
      dueAt: sqlite(new Date(card.dueAt)),
      lastReviewAt: sqlite(new Date(card.lastReviewAt as string)),
    };
    expect(cardCondition(asSqlite, NOW)).toBe(cardCondition(card, NOW));
  });
});

describe("unitCondition", () => {
  it("is null for a unit without cards", () => {
    expect(unitCondition([], NOW)).toBeNull();
  });

  it("takes the weakest card", () => {
    expect(
      unitCondition([knownCard(), dueCardAt(0.7), dueCardAt(0.86)], NOW),
    ).toBe("decaying");
    expect(unitCondition([knownCard(), dueCardAt(0.6)], NOW)).toBe("forgotten");
  });

  it("ignores unpractised cards while any card has been practised", () => {
    expect(unitCondition([knownCard(), NEW_CARD], NOW)).toBe("known");
    expect(unitCondition([NEW_CARD, dueCardAt(0.8)], NOW)).toBe("overdue");
  });

  it("is unpractised when every card is", () => {
    expect(unitCondition([NEW_CARD, NEW_CARD], NOW)).toBe("unpractised");
  });
});

describe("coherence with the scheduler", () => {
  function toConditionCard(card: SchedulingCard): ConditionCard {
    return {
      state: card.state,
      stability: card.stability,
      dueAt: card.dueAt.toISOString(),
      lastReviewAt: card.lastReviewAt?.toISOString() ?? null,
      lapses: card.lapses,
    };
  }

  it("reaches the request retention at the due date", () => {
    const fsrs = createFSRS();
    let card = createEmptyCard(new Date("2026-01-01T08:00:00Z"));
    let at = card.dueAt;
    // Good until the card is in long-term review with a multi-week interval.
    for (let i = 0; i < 6; i++) {
      card = fsrs.schedule(card, 3, at);
      at = card.dueAt;
    }
    expect(card.state).toBe("review");
    expect(card.scheduledDays).toBeGreaterThan(14);

    const r = currentRetrievability(card, card.dueAt);
    expect(r).not.toBeNull();
    expect(Math.abs((r as number) - 0.9)).toBeLessThan(0.02);

    const justBefore = new Date(card.dueAt.getTime() - 1000);
    expect(cardCondition(toConditionCard(card), justBefore)).toBe("known");
    expect(cardCondition(toConditionCard(card), card.dueAt)).toBe("due");
  });

  it("returns null retrievability for a card never reviewed", () => {
    expect(currentRetrievability(createEmptyCard(NOW), NOW)).toBeNull();
  });
});
