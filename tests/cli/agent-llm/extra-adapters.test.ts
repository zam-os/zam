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
import {
  OpenCodeAdapter,
  openCodeSessionIds,
  parseOpenCodeJsonl,
} from "../../../src/cli/agent-llm/opencode.js";

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

  // Issue #224: Settings only offers the effort control for harnesses whose
  // adapter actually forwards it. Keep the declaration honest — an adapter that
  // ignores `req.effort` must not advertise support.
  it("declares supportsEffort only for adapters that forward effort", () => {
    const withEffort = listAgentTextHarnessIds().filter(
      (id) => getAgentAdapter(id)?.supportsEffort === true,
    );
    expect(withEffort.sort()).toEqual(["antigravity", "codex", "copilot"]);
  });

  // Learner material reaches only adapters that honour `isolate`.
  it("declares supportsIsolation only for adapters that honour it", () => {
    const isolating = listAgentTextHarnessIds().filter(
      (id) => getAgentAdapter(id)?.supportsIsolation === true,
    );
    expect(isolating.sort()).toEqual(["claude-code", "codex", "opencode"]);
  });

  it("every registered agent text adapter implements listModels()", async () => {
    const ids = listAgentTextHarnessIds();
    for (const id of ids) {
      const adapter = getAgentAdapter(id);
      expect(adapter?.listModels).toBeDefined();
      const models = await adapter!.listModels!();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    }
  }, 15_000);
});

describe("parseOpenCodeJsonl", () => {
  it("attaches PDFs natively, denies tools and deletes the stored session", async () => {
    const calls: string[][] = [];
    const adapter = new OpenCodeAdapter(
      () => "/opencode",
      async (input) => {
        calls.push(input.args);
        if (input.args[0] === "session") {
          return { code: 0, stdout: "", stderr: "", timedOut: false };
        }
        expect(input.args).not.toContain("--dir");
        // The background service ignores inline configuration.
        expect(input.args).toContain("--standalone");
        expect(input.args[input.args.indexOf("-f") + 1]).toBe(
          "/source/book.pdf",
        );
        expect(JSON.parse(input.env!.OPENCODE_CONFIG_CONTENT!)).toMatchObject({
          permission: "deny",
        });
        return {
          code: 0,
          stdout: [
            JSON.stringify({ type: "step_start", sessionID: "ses_abc123" }),
            JSON.stringify({
              type: "text",
              sessionID: "ses_abc123",
              part: { text: "read" },
            }),
          ].join("\n"),
          stderr: "",
          timedOut: false,
        };
      },
    );
    await expect(
      adapter.generate({
        system: "read",
        user: "read",
        pdfPaths: ["/source/book.pdf"],
      }),
    ).resolves.toEqual({ text: "read" });
    expect(calls.at(-1)).toEqual([
      "session",
      "delete",
      "--standalone",
      "ses_abc123",
    ]);
  });

  it("deletes an isolated session after a failed run", async () => {
    const deleted: string[] = [];
    const adapter = new OpenCodeAdapter(
      () => "/opencode",
      async (input) => {
        if (input.args[0] === "session") {
          deleted.push(input.args.at(-1)!);
          throw new Error("cleanup failed");
        }
        return {
          code: 0,
          stdout: JSON.stringify({
            type: "error",
            sessionID: "ses_failed1",
            error: { data: { message: "Model unavailable" } },
          }),
          stderr: "",
          timedOut: false,
        };
      },
    );
    await expect(
      adapter.generate({ system: "s", user: "notes", isolate: true }),
    ).rejects.toThrow("Model unavailable");
    expect(deleted).toEqual(["ses_failed1"]);
  });

  it("leaves ordinary text runs on the background service", async () => {
    const calls: string[][] = [];
    const adapter = new OpenCodeAdapter(
      () => "/opencode",
      async (input) => {
        calls.push(input.args);
        expect(input.env).toBeUndefined();
        return {
          code: 0,
          stdout: JSON.stringify({ sessionID: "ses_x1", text: "ok" }),
          stderr: "",
          timedOut: false,
        };
      },
    );
    await adapter.generate({ system: "s", user: "u" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).not.toContain("--standalone");
  });

  it("reads only well-formed session ids", () => {
    expect(
      openCodeSessionIds(
        [
          JSON.stringify({ sessionID: "ses_a1" }),
          JSON.stringify({ sessionID: "ses_a1" }),
          JSON.stringify({ sessionID: "--all" }),
          "not json",
        ].join("\n"),
      ),
    ).toEqual(["ses_a1"]);
  });
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

  it("keeps multi-line evaluation including the trailing FSRS rating line", () => {
    const out = `
    __( O)>  ● new session · openrouter deepseek
   \\____)    20260725_1
     L L     goose is ready
Gut gemacht, die Antwort trifft den Kern.
Empfohlene Bewertung: 3
`;
    const text = parseGooseStdout(out);
    expect(text).toContain("Gut gemacht");
    expect(text).toMatch(/Empfohlene Bewertung:\s*3/);
  });
});

describe("copilotEffortForModel", () => {
  it("uses low for Luna (default experimental model)", () => {
    expect(copilotEffortForModel("gpt-5.6-luna")).toBe("low");
    expect(copilotEffortForModel(undefined)).toBe("low");
  });

  it("uses high for mini-class models", () => {
    expect(copilotEffortForModel("gpt-5-mini")).toBe("high");
    expect(copilotEffortForModel("gpt-4.1-mini")).toBe("high");
  });

  it("uses medium for larger models unless overridden", () => {
    expect(copilotEffortForModel("gpt-5.4")).toBe("medium");
    expect(copilotEffortForModel("gpt-5.4", "high")).toBe("high");
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

  it("keeps multi-line evaluation including the trailing FSRS rating line", () => {
    const text = parseHermesStdout(
      "session_id: abc\nGut gemacht, die Antwort trifft den Kern.\nEmpfohlene Bewertung: 3\n",
    );
    expect(text).toContain("Gut gemacht");
    expect(text).toMatch(/Empfohlene Bewertung:\s*3/);
  });
});
