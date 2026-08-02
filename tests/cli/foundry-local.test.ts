import { describe, expect, it } from "vitest";
import {
  chooseFoundryRecommendations,
  foundryHttpModelId,
  getFoundryLocalStatus,
  setupFoundryLocal,
  type FoundryCatalogModel,
  type FoundryLocalDeps,
} from "../../src/cli/llm/foundry-local.js";
import { promoteModelToPrimary } from "../../src/cli/llm/model-registry.js";

const MODELS: FoundryCatalogModel[] = [
  {
    alias: "phi-3.5-mini",
    id: "phi-3.5-mini-instruct-qnn-npu:2",
    type: "Chat",
    device: "Npu",
    fileSizeMb: 2844,
    cached: true,
  },
  {
    alias: "qwen3.5-0.8b",
    id: "qwen3.5-0.8b-generic-cpu:2",
    type: "Multimodal",
    device: "Cpu",
    fileSizeMb: 904,
    cached: false,
  },
  {
    alias: "qwen3-vl-2b-instruct",
    id: "qwen3-vl-2b-instruct-generic-cpu:2",
    type: "Multimodal",
    device: "Cpu",
    fileSizeMb: 1374,
    cached: false,
  },
  {
    alias: "qwen3-vl-4b-instruct",
    id: "qwen3-vl-4b-instruct-generic-cpu:3",
    type: "Multimodal",
    device: "Cpu",
    fileSizeMb: 2797,
    cached: false,
  },
];

function json(value: unknown): string {
  return JSON.stringify(value);
}

function deps(
  run: FoundryLocalDeps["run"],
  overrides: Partial<FoundryLocalDeps> = {},
): FoundryLocalDeps {
  return {
    platform: "win32",
    hasFoundry: () => true,
    hasWinget: () => true,
    run,
    ...overrides,
  };
}

describe("Foundry Local setup", () => {
  it("uses the OpenAI service id without the catalog variant suffix", () => {
    expect(foundryHttpModelId(MODELS[0])).toBe(
      "phi-3.5-mini-instruct-qnn-npu",
    );
  });

  it("offers the accelerated text model and a working fallback", () => {
    expect(chooseFoundryRecommendations(MODELS)).toMatchObject({
      text: { alias: "phi-3.5-mini", device: "Npu" },
      textFallback: { alias: "qwen3.5-0.8b", fileSizeMb: 904 },
    });
  });

  it("makes an explicitly set-up local model the primary candidate", () => {
    const promoted = promoteModelToPrimary(
      [
        { id: "cloud", order: 0 },
        { id: "local-text", order: 1 },
        { id: "fallback", order: 2 },
      ],
      "local-text",
    );

    expect(promoted).toEqual([
      { id: "local-text", order: 0 },
      { id: "cloud", order: 1 },
      { id: "fallback", order: 2 },
    ]);
  });
  it("reports a missing Foundry installation without attempting a command", async () => {
    const result = await getFoundryLocalStatus(
      deps(async () => {
        throw new Error("must not run");
      }, { hasFoundry: () => false }),
    );

    expect(result).toEqual({
      installed: false,
      running: false,
      models: [],
      recommendations: {},
    });
  });

  it("falls back from an unavailable Qualcomm runtime to a compact CPU model", async () => {
    const calls: string[][] = [];
    const result = await setupFoundryLocal(
      "text",
      deps(async (command, args) => {
        calls.push([command, ...args]);
        if (command !== "foundry") throw new Error("unexpected command");
        if (args[0] === "server" && args[1] === "start") {
          return json({ running: true, webUrls: ["http://127.0.0.1:5273"] });
        }
        if (args[0] === "server" && args[1] === "status") {
          return json({ running: true, webUrls: ["http://127.0.0.1:5273"] });
        }
        if (args[0] === "model" && args[1] === "list") {
          return json({ models: MODELS });
        }
        if (
          args[0] === "model" &&
          args[1] === "load" &&
          args[2] === "phi-3.5-mini"
        ) {
          throw new Error("QNNExecutionProvider is not available");
        }
        if (
          args[0] === "model" &&
          args[1] === "download" &&
          args[2] === "qwen3.5-0.8b"
        ) {
          return json({ success: true });
        }
        if (
          args[0] === "model" &&
          args[1] === "load" &&
          args[2] === "qwen3.5-0.8b"
        ) {
          return json({ success: true });
        }
        throw new Error(`unexpected args: ${args.join(" ")}`);
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.prepared).toMatchObject({
      alias: "qwen3.5-0.8b",
      model: "qwen3.5-0.8b-generic-cpu",
      role: "text",
      fallbackUsed: true,
      downloaded: true,
    });
    expect(calls).toContainEqual([
      "foundry",
      "model",
      "download",
      "qwen3.5-0.8b",
      "--output",
      "json",
    ]);
  });
});
