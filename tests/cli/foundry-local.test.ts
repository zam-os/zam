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

  it("offers the accelerated text model and never a CPU build", () => {
    expect(chooseFoundryRecommendations(MODELS)).toEqual({
      text: {
        alias: "phi-3.5-mini",
        model: "phi-3.5-mini-instruct-qnn-npu",
        device: "Npu",
        fileSizeMb: 2844,
      },
    });
  });

  it("offers nothing when the catalog holds only CPU builds", () => {
    const cpuOnly = MODELS.filter((model) => model.device === "Cpu");

    expect(chooseFoundryRecommendations(cpuOnly)).toEqual({});
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

  it("reports an unavailable Qualcomm runtime instead of downgrading to CPU", async () => {
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
        throw new Error(`unexpected args: ${args.join(" ")}`);
      }),
    );

    expect(result.ok).toBe(false);
    expect(result.prepared).toBeUndefined();
    expect(result.error).toContain("QNNExecutionProvider is not available");
    // A CPU build must never be downloaded as a consolation prize.
    const downloads = calls.filter(
      (call) => call[1] === "model" && call[2] === "download",
    );
    expect(downloads).toEqual([]);
  });

  it("loads the cached accelerated model without downloading it again", async () => {
    const calls: string[][] = [];
    const result = await setupFoundryLocal(
      "text",
      deps(async (command, args) => {
        calls.push([command, ...args]);
        if (command !== "foundry") throw new Error("unexpected command");
        if (args[0] === "server") {
          return json({ running: true, webUrls: ["http://127.0.0.1:5273"] });
        }
        if (args[0] === "model" && args[1] === "list") {
          return json({ models: MODELS });
        }
        if (args[0] === "model" && args[1] === "load") {
          return json({ success: true });
        }
        throw new Error(`unexpected args: ${args.join(" ")}`);
      }),
    );

    expect(result.ok).toBe(true);
    expect(result.prepared).toEqual({
      alias: "phi-3.5-mini",
      model: "phi-3.5-mini-instruct-qnn-npu",
      device: "Npu",
      fileSizeMb: 2844,
      role: "text",
      downloaded: false,
    });
    expect(
      calls.some((call) => call[1] === "model" && call[2] === "download"),
    ).toBe(false);
  });
});
