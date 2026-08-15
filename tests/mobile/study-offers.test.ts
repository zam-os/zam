import { describe, expect, it } from "vitest";
import {
  bonusBecause,
  keepGoingCardIds,
  matchUnassessedPrecondition,
} from "../../mobile/src/study-offers.js";

describe("mobile study-offers", () => {
  it("matches only an unassessed precondition for the card's atom", () => {
    const candidates = [
      {
        atomId: "atom-a",
        title: "Einfallslot",
        assessmentState: "learning" as const,
      },
      {
        atomId: "atom-b",
        title: "Brechung",
        assessmentState: "unassessed" as const,
      },
    ];
    expect(matchUnassessedPrecondition("atom-b", candidates)?.title).toBe(
      "Brechung",
    );
    expect(matchUnassessedPrecondition("atom-a", candidates)).toBeNull();
    expect(matchUnassessedPrecondition(null, candidates)).toBeNull();
  });

  it("takes the first keep-going cards in listed order", () => {
    expect(
      keepGoingCardIds(
        [
          { cardId: "c1", reason: "precondition_buried" },
          { cardId: "c2", reason: "future_due" },
          { cardId: "c3", reason: "new_in_scope" },
        ],
        2,
      ),
    ).toEqual(["c1", "c2"]);
  });

  it("joins rest-on titles for the honest bonus sentence", () => {
    expect(bonusBecause(["Einfallslot", "Brechung"])).toBe(
      "Einfallslot, Brechung",
    );
  });
});
