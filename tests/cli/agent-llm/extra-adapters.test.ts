import { describe, expect, it } from "vitest";
import {
  AgentError,
  getAgentAdapter,
  listAgentTextHarnessIds,
} from "../../../src/cli/agent-llm/adapter.js";
import {
  copilotEffortForModel,
  parseCopilotStdout,
} from "../../../src/cli/agent-llm/copilot.js";
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

describe("copilotEffortForModel", () => {
  it("defaults to medium for balanced one-shot latency", () => {
    expect(copilotEffortForModel("gpt-5-mini")).toBe("medium");
    expect(copilotEffortForModel(undefined)).toBe("medium");
  });

  it("honors an explicit override (e.g. high for evaluation)", () => {
    expect(copilotEffortForModel("gpt-5-mini", "high")).toBe("high");
    expect(copilotEffortForModel("gpt-5.4", "low")).toBe("low");
  });
});

describe("parseCopilotStdout", () => {
  it("reads silent text", () => {
    expect(parseCopilotStdout("OK\n\nChanges    +0 -0\n")).toBe("OK");
  });

  it("keeps multi-line evaluation including the trailing FSRS rating line", () => {
    const raw = `Gut gemacht, die Antwort trifft den Kern.
Empfohlene Bewertung: 3

Changes    +0 -0
AI Credits 1.2 (5s)
Tokens     ↑ 1k • ↓ 20
Resume     copilot --resume=abc
`;
    const text = parseCopilotStdout(raw);
    expect(text).toContain("Gut gemacht");
    expect(text).toMatch(/Empfohlene Bewertung:\s*3/);
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
