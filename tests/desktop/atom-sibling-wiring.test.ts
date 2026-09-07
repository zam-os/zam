import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

describe("atom sibling presentation wiring", () => {
  it("admits a card on Desktop, Mobile, CLI, and MCP before display", () => {
    const recall = file("desktop/src/panel/recall.ts");
    expect(recall).toContain('"zam_admit_review"');
    expect(recall).toContain("timeZone: learnerTimeZone()");

    const native = file("desktop/src/main.ts");
    expect(native).toContain('"admit-review"');
    expect(native).toContain('"--time-zone"');

    const mobile = file("mobile/src/review-session.ts");
    expect(mobile).toContain("admitPresentation");
    expect(mobile).toContain("admitCurrent");
    expect(mobile).toContain("confirmCurrent");
    expect(file("mobile/src/main.ts")).toContain("confirmCurrent");

    const learn = file("src/cli/commands/learn.ts");
    expect(learn).toContain("admitPresentation");
    expect(learn).toContain("AtomSiblingOccupiedError");

    const mcp = file("src/cli/commands/mcp.ts");
    expect(mcp).toContain('"zam_admit_review"');

    const bridge = file("src/cli/commands/bridge.ts");
    expect(bridge).toContain('.command("admit-review")');
  });

  it("skips, never aborts, when a token stops being reviewable", () => {
    // A token unpublished between queue build and display costs one card, not
    // the session around it. Mobile is covered behaviourally in
    // tests/mobile/review-session.test.ts; these surfaces have no cheap
    // harness, so the wiring itself is what is asserted.
    for (const path of [
      "src/cli/commands/learn.ts",
      "src/cli/commands/review.ts",
      "src/cli/commands/session.ts",
      "mobile/src/review-session.ts",
    ]) {
      expect(file(path)).toContain("CardNotReviewableError");
    }
    expect(file("desktop/src/panel/recall.ts")).toContain(
      "isCardNotReviewable(error)",
    );
  });
});
