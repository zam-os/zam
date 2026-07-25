import { describe, expect, it } from "vitest";
import { AgentError } from "../../../src/cli/agent-llm/adapter.js";
import {
  buildCodexPrompt,
  CodexAdapter,
  type CodexRunner,
  type CodexRunResult,
  parseCodexJsonl,
} from "../../../src/cli/agent-llm/codex.js";

const BIN = "/usr/local/bin/codex";

function fixedRunner(res: Partial<CodexRunResult>): CodexRunner {
  return async () => ({
    code: 0,
    stdout: agentMessage("ok"),
    stderr: "",
    timedOut: false,
    ...res,
  });
}

function agentMessage(text: string): string {
  return [
    JSON.stringify({ type: "thread.started", thread_id: "t1" }),
    JSON.stringify({ type: "turn.started" }),
    JSON.stringify({
      type: "item.completed",
      item: { id: "item_0", type: "agent_message", text },
    }),
    JSON.stringify({
      type: "turn.completed",
      usage: { input_tokens: 1, output_tokens: 1 },
    }),
  ].join("\n");
}

describe("parseCodexJsonl", () => {
  it("returns the last agent_message text", () => {
    const stdout = [
      agentMessage("first"),
      JSON.stringify({
        type: "item.completed",
        item: { id: "item_1", type: "agent_message", text: "final" },
      }),
    ].join("\n");
    expect(parseCodexJsonl(stdout)).toBe("final");
  });

  it("throws when no agent_message is present", () => {
    expect(() => parseCodexJsonl('{"type":"thread.started"}\n')).toThrow(
      AgentError,
    );
  });
});

describe("buildCodexPrompt", () => {
  it("joins system and user", () => {
    expect(buildCodexPrompt({ system: "SYS", user: "USER" })).toBe(
      "SYS\n\nUSER",
    );
  });
});

describe("CodexAdapter", () => {
  it("probe reports available when codex resolves", async () => {
    const adapter = new CodexAdapter(() => BIN, fixedRunner({}));
    await expect(adapter.probe()).resolves.toMatchObject({
      harness: "codex",
      available: true,
    });
  });

  it("declares multimodal modalities", () => {
    expect(new CodexAdapter(() => BIN, fixedRunner({})).modalities).toEqual({
      text: true,
      image: true,
    });
  });

  it("runs codex exec --json and parses agent_message", async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const adapter = new CodexAdapter(
      () => BIN,
      async (input) => {
        calls.push(input);
        return {
          code: 0,
          stdout: agentMessage("hello from codex"),
          stderr: "",
          timedOut: false,
        };
      },
    );

    const { text } = await adapter.generate({
      system: "SYS",
      user: "USER",
      model: "gpt-5.4-mini",
    });
    expect(text).toBe("hello from codex");
    expect(calls[0].command).toBe(BIN);
    expect(calls[0].args[0]).toBe("exec");
    expect(calls[0].args).toContain("--json");
    expect(calls[0].args).toContain("--ephemeral");
    expect(calls[0].args).toContain("read-only");
    expect(calls[0].args).toContain("-m");
    expect(calls[0].args).toContain("gpt-5.4-mini");
    expect(calls[0].args.at(-1)).toContain("SYS");
    expect(calls[0].args.at(-1)).toContain("USER");
  });

  it("attaches images via -i", async () => {
    let seen: string[] = [];
    const adapter = new CodexAdapter(
      () => BIN,
      async (input) => {
        seen = input.args;
        return {
          code: 0,
          stdout: agentMessage("ocr"),
          stderr: "",
          timedOut: false,
        };
      },
    );

    await adapter.generate({
      system: "OCR",
      user: "Extract",
      imagePaths: ["/tmp/a.png", "/tmp/b.jpg"],
    });

    expect(seen).toContain("-i");
    expect(seen).toContain("/tmp/a.png");
    expect(seen).toContain("/tmp/b.jpg");
  });

  it("throws AgentError when codex is missing", async () => {
    const adapter = new CodexAdapter(() => null, fixedRunner({}));
    await expect(
      adapter.generate({ system: "s", user: "u" }),
    ).rejects.toMatchObject({ harness: "codex" });
  });

  it("throws AgentError on non-zero exit", async () => {
    const adapter = new CodexAdapter(
      () => BIN,
      fixedRunner({ code: 1, stdout: "", stderr: "auth failed" }),
    );
    await expect(adapter.generate({ system: "s", user: "u" })).rejects.toThrow(
      /exited with code 1/i,
    );
  });

  it("throws AgentError on timeout", async () => {
    const adapter = new CodexAdapter(
      () => BIN,
      fixedRunner({ timedOut: true, code: null, stdout: "" }),
    );
    await expect(
      adapter.generate({ system: "s", user: "u", timeoutMs: 5 }),
    ).rejects.toThrow(/timed out/i);
  });

  it("passes --reasoning-effort when effort level is specified", async () => {
    let seen: string[] = [];
    const adapter = new CodexAdapter(
      () => BIN,
      async (input) => {
        seen = input.args;
        return {
          code: 0,
          stdout: agentMessage("ok"),
          stderr: "",
          timedOut: false,
        };
      },
    );

    await adapter.generate({ system: "s", user: "u", effort: "high" });
    expect(seen).toContain("--reasoning-effort");
    expect(seen).toContain("high");
  });
});
