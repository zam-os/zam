import { describe, expect, it } from "vitest";
import {
  bonusBecause,
  bonusCandidatesCommand,
  bonusEnrolCommand,
  keepGoingCardIds,
  matchUnassessedPrecondition,
  preconditionAssessCommand,
  preconditionsListCommand,
  pullForwardCandidatesCommand,
  pullForwardExecuteCommand,
} from "../../desktop/src/study-offers.js";

describe("study-offers", () => {
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
    expect(bonusBecause(["Einfallslot", "  "])).toBe("Einfallslot");
  });

  it("builds the bridge commands the study view will fire", () => {
    expect(preconditionsListCommand()).toEqual({
      cmd: "preconditions-get",
      args: [],
    });
    expect(preconditionAssessCommand("atom-b", "known")).toEqual({
      cmd: "precondition-assess",
      args: ["atom-b", "known"],
    });
    expect(pullForwardCandidatesCommand(5)).toEqual({
      cmd: "pull-forward-candidates",
      args: ["--limit", "5"],
    });
    expect(pullForwardExecuteCommand(["c1", "c2"])).toEqual({
      cmd: "pull-forward-execute",
      args: ["--cards", "c1", "c2"],
    });
    expect(bonusCandidatesCommand(1)).toEqual({
      cmd: "bonus-candidates-list",
      args: ["--limit", "1"],
    });
    expect(bonusEnrolCommand("atom-x")).toEqual({
      cmd: "bonus-atom-enrol",
      args: ["atom-x"],
    });
  });
});
