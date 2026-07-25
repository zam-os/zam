import { describe, expect, it } from "vitest";
import { AgentError } from "../../../src/cli/agent-llm/adapter.js";
import {
  buildClaudeUserPayload,
  ClaudeCodeAdapter,
  type HeadlessRunner,
  type HeadlessRunResult,
  parseClaudeEnvelope,
} from "../../../src/cli/agent-llm/claude-code.js";

const BIN = "/usr/local/bin/claude";

/** A success envelope as `claude -p --output-format json` emits it. */
function successEnvelope(result: string): string {
  return JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    result,
  });
}

/** A runner that always returns the given (partial) result. */
function fixedRunner(res: Partial<HeadlessRunResult>): HeadlessRunner {
  return async () => ({
    code: 0,
    stdout: "",
    stderr: "",
    timedOut: false,
    ...res,
  });
}

describe("parseClaudeEnvelope", () => {
  it("returns the result text on success", () => {
    expect(parseClaudeEnvelope(successEnvelope("hello"))).toBe("hello");
  });

  it("throws AgentError on non-JSON output", () => {
    expect(() => parseClaudeEnvelope("not json at all")).toThrow(AgentError);
  });

  it("throws AgentError when the harness reports an error", () => {
    const env = JSON.stringify({
      type: "result",
      subtype: "error_during_execution",
      is_error: true,
      result: "boom",
    });
    expect(() => parseClaudeEnvelope(env)).toThrow(/reported an error/i);
  });

  it("throws AgentError when result is not a string", () => {
    const env = JSON.stringify({
      type: "result",
      subtype: "success",
      is_error: false,
      result: 42,
    });
    expect(() => parseClaudeEnvelope(env)).toThrow(AgentError);
  });
});

describe("ClaudeCodeAdapter", () => {
  it("probe reports available when the executable resolves", async () => {
    const adapter = new ClaudeCodeAdapter(() => BIN, fixedRunner({}));
    await expect(adapter.probe()).resolves.toMatchObject({
      harness: "claude-code",
      available: true,
    });
  });

  it("probe reports unavailable when the CLI is not found", async () => {
    const adapter = new ClaudeCodeAdapter(() => null, fixedRunner({}));
    await expect(adapter.probe()).resolves.toMatchObject({ available: false });
  });

  it("runs the harness headless and returns the envelope result", async () => {
    const calls: Array<{ command: string; args: string[]; stdin: string }> = [];
    const adapter = new ClaudeCodeAdapter(
      () => BIN,
      async (input) => {
        calls.push(input);
        return {
          code: 0,
          stdout: successEnvelope("[]"),
          stderr: "",
          timedOut: false,
        };
      },
    );

    const { text } = await adapter.generate({
      system: "SYS",
      user: "USER",
      model: "haiku",
    });

    expect(text).toBe("[]");
    expect(calls[0].command).toBe(BIN);
    expect(calls[0].args).toEqual([
      "-p",
      "--output-format",
      "json",
      "--system-prompt",
      "SYS",
      "--strict-mcp-config",
      "--model",
      "haiku",
    ]);
    // The (potentially large) user content goes on stdin, not argv.
    expect(calls[0].stdin).toBe("USER");
  });

  it("appends the JSON schema hint to the system prompt", async () => {
    let seen: string[] = [];
    const adapter = new ClaudeCodeAdapter(
      () => BIN,
      async (input) => {
        seen = input.args;
        return {
          code: 0,
          stdout: successEnvelope("x"),
          stderr: "",
          timedOut: false,
        };
      },
    );

    await adapter.generate({
      system: "SYS",
      user: "U",
      jsonSchemaHint: "HINT",
    });

    const idx = seen.indexOf("--system-prompt");
    expect(seen[idx + 1]).toBe("SYS\n\nHINT");
  });

  it("declares multimodal modalities", () => {
    expect(
      new ClaudeCodeAdapter(() => BIN, fixedRunner({})).modalities,
    ).toEqual({
      text: true,
      image: true,
    });
  });

  it("lists image paths in the user payload and passes --add-dir", async () => {
    expect(
      buildClaudeUserPayload({
        system: "OCR",
        user: "Extract",
        imagePaths: ["/data/a.png"],
      }),
    ).toContain("/data/a.png");

    let seen: string[] = [];
    let stdin = "";
    const adapter = new ClaudeCodeAdapter(
      () => BIN,
      async (input) => {
        seen = input.args;
        stdin = input.stdin;
        return {
          code: 0,
          stdout: successEnvelope("text"),
          stderr: "",
          timedOut: false,
        };
      },
    );

    await adapter.generate({
      system: "OCR",
      user: "Extract",
      imagePaths: ["/data/scans/inv.png"],
    });

    expect(seen).toContain("--add-dir");
    expect(seen).toContain("/data/scans");
    expect(stdin).toContain("/data/scans/inv.png");
  });

  it("throws an AgentError naming the harness when the CLI is missing", async () => {
    const adapter = new ClaudeCodeAdapter(() => null, fixedRunner({}));
    await expect(
      adapter.generate({ system: "s", user: "u" }),
    ).rejects.toBeInstanceOf(AgentError);
    await expect(
      adapter.generate({ system: "s", user: "u" }),
    ).rejects.toMatchObject({ harness: "claude-code" });
  });

  it("throws an AgentError on timeout", async () => {
    const adapter = new ClaudeCodeAdapter(
      () => BIN,
      fixedRunner({ timedOut: true, code: null }),
    );
    await expect(
      adapter.generate({ system: "s", user: "u", timeoutMs: 10 }),
    ).rejects.toThrow(/timed out/i);
  });

  it("throws an AgentError on a non-zero exit code", async () => {
    const adapter = new ClaudeCodeAdapter(
      () => BIN,
      fixedRunner({ code: 2, stderr: "bad flag" }),
    );
    await expect(adapter.generate({ system: "s", user: "u" })).rejects.toThrow(
      /exited with code 2/i,
    );
  });

  it("wraps a launch failure as an AgentError", async () => {
    const adapter = new ClaudeCodeAdapter(
      () => BIN,
      async () => {
        throw new Error("spawn ENOENT");
      },
    );
    await expect(
      adapter.generate({ system: "s", user: "u" }),
    ).rejects.toBeInstanceOf(AgentError);
  });
});
