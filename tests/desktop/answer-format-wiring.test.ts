import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const file = (path: string) => readFileSync(join(process.cwd(), path), "utf-8");

/**
 * Every surface that shows a tier-1 fast check books the tap as `options`,
 * so the kernel bounds its rating by the tap ceiling (ADR 2026-09-27
 * Decisions 5 and 9, owner decision after review round 2).
 */
describe("answer format on fast-check taps", () => {
  it("the Studio study window marks a tapped option and submits it", () => {
    const main = file("desktop/src/main.ts");
    const render = main.slice(main.indexOf("function renderFastCheckAnswer"));
    expect(render.slice(0, render.indexOf("\n}\n"))).toContain(
      'activeAnswerFormat = "options";',
    );
    expect(main).toContain("answerFormat: activeAnswerFormat,");
    // A new card starts as recall again.
    expect(main).toContain(
      'activeAttemptId = null;\n  activeAnswerFormat = "recall";',
    );
  });

  it("the MCP Recall panel sends options after a tap", () => {
    const recall = file("desktop/src/panel/recall.ts");
    expect(recall).toContain("tappedOption = true;");
    expect(recall).toContain(
      'if (tappedOption) args.answerFormat = "options";',
    );
  });

  it("the mobile review marks the tap on the session", () => {
    const main = file("mobile/src/main.ts");
    expect(main).toContain("reviewSession.markOptionsTapped();");
  });

  it("the bridge and MCP submit accept the answer format", () => {
    expect(file("src/cli/commands/bridge.ts")).toContain(
      '"--answer-format <recall|options|choice>"',
    );
    const mcp = file("src/cli/commands/mcp.ts");
    expect(mcp).toContain('.enum(["recall", "options", "choice"])');
    expect(mcp).toContain("answerFormat: params.answerFormat,");
  });
});
