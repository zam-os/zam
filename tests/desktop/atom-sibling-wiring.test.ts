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
});
