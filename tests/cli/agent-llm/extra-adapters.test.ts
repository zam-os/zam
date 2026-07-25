import { describe, expect, it } from "vitest";
import {
  AgentError,
  getAgentAdapter,
  listAgentTextHarnessIds,
} from "../../../src/cli/agent-llm/adapter.js";
import { parseCopilotStdout } from "../../../src/cli/agent-llm/copilot.js";
import { parseGooseStdout } from "../../../src/cli/agent-llm/goose.js";
import { parseHermesStdout } from "../../../src/cli/agent-llm/hermes.js";
import { parseOpenCodeJsonl } from "../../../src/cli/agent-llm/opencode.js";

describe("listAgentTextHarnessIds", () => {
  it("includes the full outbound set for consistent Settings options", () => {
    const ids = listAgentTextHarnessIds();
    expect(ids).toEqual(
      expect.arrayContaining([
        "claude-code",
        "codex",
        "antigravity",
        "grok",
        "opencode",
        "goose",
        "copilot",
        "hermes",
      ]),
    );
    for (const id of ids) {
      expect(getAgentAdapter(id)).not.toBeNull();
    }
  });
});

describe("parseOpenCodeJsonl", () => {
  it("surfaces API errors", () => {
    const line = JSON.stringify({
      type: "error",
      error: { data: { message: "Authentication Fails" } },
    });
    expect(() => parseOpenCodeJsonl(line)).toThrow(/Authentication Fails/);
  });

  it("returns the last text part", () => {
    const out = [
      JSON.stringify({ type: "start" }),
      JSON.stringify({ type: "text", part: { text: "hello" } }),
    ].join("\n");
    expect(parseOpenCodeJsonl(out)).toBe("hello");
  });
});

describe("parseGooseStdout", () => {
  it("skips banner lines", () => {
    const out = `
    __( O)>  ● new session · openrouter deepseek
   \\____)    20260725_1
     L L     goose is ready
OK
`;
    expect(parseGooseStdout(out)).toBe("OK");
  });
});

describe("parseCopilotStdout", () => {
  it("reads silent text", () => {
    expect(parseCopilotStdout("OK\n\nChanges    +0 -0\n")).toBe("OK");
  });

  it("reads assistant.message JSONL", () => {
    const line = JSON.stringify({
      type: "assistant.message",
      data: { content: "OK" },
    });
    expect(parseCopilotStdout(line)).toBe("OK");
  });
});

describe("parseHermesStdout", () => {
  it("skips session_id noise", () => {
    expect(
      parseHermesStdout("Warning: Unknown toolsets\nsession_id: abc\nOK\n"),
    ).toBe("OK");
  });

  it("throws on empty", () => {
    expect(() => parseHermesStdout("session_id: x\n")).toThrow(AgentError);
  });
});
