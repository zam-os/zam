import { describe, expect, it } from "vitest";
import { AgentError } from "../../../src/cli/agent-llm/adapter.js";
import {
  type AgyRunner,
  type AgyRunResult,
  AntigravityAdapter,
  buildAgyPrompt,
  formatPrintTimeout,
} from "../../../src/cli/agent-llm/antigravity.js";

const BIN = "/usr/local/bin/agy";

function fixedRunner(res: Partial<AgyRunResult>): AgyRunner {
  return async () => ({
    code: 0,
    stdout: "ok",
    stderr: "",
    timedOut: false,
    ...res,
  });
}

describe("formatPrintTimeout", () => {
  it("rounds ms up to whole seconds", () => {
    expect(formatPrintTimeout(1)).toBe("1s");
    expect(formatPrintTimeout(1000)).toBe("1s");
    expect(formatPrintTimeout(1001)).toBe("2s");
    expect(formatPrintTimeout(120_000)).toBe("120s");
  });
});

describe("buildAgyPrompt", () => {
  it("joins system and user with a blank line", () => {
    expect(buildAgyPrompt({ system: "SYS", user: "USER" })).toBe("SYS\n\nUSER");
  });

  it("appends schema hint to the system block", () => {
    expect(
      buildAgyPrompt({
        system: "SYS",
        user: "U",
        jsonSchemaHint: "HINT",
      }),
    ).toContain("SYS\n\nHINT");
  });

  it("lists image paths for multimodal requests", () => {
    const prompt = buildAgyPrompt({
      system: "OCR",
      user: "Extract text",
      imagePaths: ["/tmp/a.png", "/tmp/b.jpg"],
    });
    expect(prompt).toContain("/tmp/a.png");
    expect(prompt).toContain("/tmp/b.jpg");
    expect(prompt).toMatch(/Image files to inspect/i);
  });
});

describe("AntigravityAdapter", () => {
  it("probe reports available when agy resolves", async () => {
    const adapter = new AntigravityAdapter(() => BIN, fixedRunner({}));
    await expect(adapter.probe()).resolves.toMatchObject({
      harness: "antigravity",
      available: true,
    });
  });

  it("probe reports unavailable when agy is missing", async () => {
    const adapter = new AntigravityAdapter(() => null, fixedRunner({}));
    await expect(adapter.probe()).resolves.toMatchObject({ available: false });
  });

  it("declares multimodal modalities", () => {
    const adapter = new AntigravityAdapter(() => BIN, fixedRunner({}));
    expect(adapter.modalities).toEqual({ text: true, image: true });
  });

  it("runs agy -p and returns plain stdout", async () => {
    const calls: Array<{ command: string; args: string[]; cwd: string }> = [];
    const adapter = new AntigravityAdapter(
      () => BIN,
      async (input) => {
        calls.push(input);
        return {
          code: 0,
          stdout: "  hello from gemini  \n",
          stderr: "",
          timedOut: false,
        };
      },
    );

    const { text } = await adapter.generate({
      system: "SYS",
      user: "USER",
      timeoutMs: 30_000,
    });

    expect(text).toBe("hello from gemini");
    expect(calls[0].command).toBe(BIN);
    expect(calls[0].args[0]).toBe("-p");
    expect(calls[0].args[1]).toContain("SYS");
    expect(calls[0].args[1]).toContain("USER");
    expect(calls[0].args).toContain("--print-timeout");
    expect(calls[0].args).toContain("30s");
  });

  it("adds --add-dir and model for multimodal image requests", async () => {
    let seen: string[] = [];
    let cwd = "";
    const adapter = new AntigravityAdapter(
      () => BIN,
      async (input) => {
        seen = input.args;
        cwd = input.cwd;
        return {
          code: 0,
          stdout: "invoice 42",
          stderr: "",
          timedOut: false,
        };
      },
    );

    await adapter.generate({
      system: "OCR",
      user: "Extract",
      imagePaths: ["/data/scans/inv.png"],
      model: "Gemini 3.5 Flash (Low)",
    });

    expect(seen).toContain("--add-dir");
    expect(seen).toContain("/data/scans");
    expect(seen).toContain("--model");
    expect(seen).toContain("Gemini 3.5 Flash (Low)");
    expect(cwd).toBe("/data/scans");
  });

  it("throws AgentError when agy is missing", async () => {
    const adapter = new AntigravityAdapter(() => null, fixedRunner({}));
    await expect(
      adapter.generate({ system: "s", user: "u" }),
    ).rejects.toBeInstanceOf(AgentError);
    await expect(
      adapter.generate({ system: "s", user: "u" }),
    ).rejects.toMatchObject({ harness: "antigravity" });
  });

  it("throws AgentError on timeout", async () => {
    const adapter = new AntigravityAdapter(
      () => BIN,
      fixedRunner({ timedOut: true, code: null, stdout: "" }),
    );
    await expect(
      adapter.generate({ system: "s", user: "u", timeoutMs: 10 }),
    ).rejects.toThrow(/timed out/i);
  });

  it("throws AgentError on non-zero exit", async () => {
    const adapter = new AntigravityAdapter(
      () => BIN,
      fixedRunner({ code: 2, stderr: "quota exceeded", stdout: "" }),
    );
    await expect(adapter.generate({ system: "s", user: "u" })).rejects.toThrow(
      /exited with code 2/i,
    );
  });

  it("throws AgentError on empty stdout", async () => {
    const adapter = new AntigravityAdapter(
      () => BIN,
      fixedRunner({ code: 0, stdout: "  \n", stderr: "" }),
    );
    await expect(adapter.generate({ system: "s", user: "u" })).rejects.toThrow(
      /empty output/i,
    );
  });

  it("passes --effort flag when effort level is specified", async () => {
    let args: string[] = [];
    const adapter = new AntigravityAdapter(
      () => BIN,
      async (input) => {
        args = input.args;
        return { code: 0, stdout: "ok", stderr: "", timedOut: false };
      },
    );

    await adapter.generate({ system: "s", user: "u", effort: "medium" });
    expect(args).toContain("--effort");
    expect(args).toContain("medium");
  });

  it("listModels returns stdout models or fallback list", async () => {
    const adapter = new AntigravityAdapter(
      () => BIN,
      fixedRunner({ code: 0, stdout: "gemini-3.5-flash\ngemini-3.5-pro\n" }),
    );
    const models = await adapter.listModels();
    expect(models).toEqual(["gemini-3.5-flash", "gemini-3.5-pro"]);
  });
});
