import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentTextAdapter } from "../../../src/cli/agent-llm/adapter.js";

// Mock the adapter lookup so the chain walks a real agent row without spawning
// a harness; the cloud row behind it answers through a stubbed fetch.
vi.mock("../../../src/cli/agent-llm/adapter.js", async (importActual) => {
  const actual =
    await importActual<
      typeof import("../../../src/cli/agent-llm/adapter.js")
    >();
  return { ...actual, getAgentAdapter: vi.fn() };
});

import {
  AgentError,
  getAgentAdapter,
} from "../../../src/cli/agent-llm/adapter.js";
import {
  clearRecallEndpointCache,
  ensureLlmReadyHeadless,
  evaluateAnswerViaLLM,
  resolveUsableRecallEndpoint,
} from "../../../src/cli/llm/client.js";
import {
  type CapabilityFlags,
  type Database,
  type ModelEntry,
  openDatabase,
  saveMachineAiModels,
  setSetting,
} from "../../../src/kernel/index.js";

function textCaps(): CapabilityFlags {
  return {
    text: true,
    embedding: false,
    image: false,
    video: false,
    stt: false,
    tts: false,
  };
}

const agentRow: ModelEntry = {
  id: "agent-claude",
  label: "Claude Code",
  url: "",
  model: "haiku",
  local: false,
  apiFlavor: "chat-completions",
  order: 0,
  capabilities: textCaps(),
  detectedCapabilities: textCaps(),
  transport: "agent",
  agentHarness: "claude-code",
};

const cloudRow: ModelEntry = {
  id: "cloud",
  label: "Cloud fallback",
  url: "https://openrouter.ai/api/v1",
  model: "working/model",
  local: false,
  apiFlavor: "chat-completions",
  order: 1,
  capabilities: textCaps(),
  detectedCapabilities: textCaps(),
};

const evaluationBody = {
  choices: [
    {
      message: { content: "Vollständig — Paris ist die Hauptstadt." },
      finish_reason: "stop",
    },
  ],
};

/** `/models` answers empty (catalog not exposed); every chat call succeeds. */
function stubCloud(): { calls: string[] } {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;
      if (url.endsWith("/models")) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      calls.push(String(body.model));
      return new Response(JSON.stringify(evaluationBody), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  );
  return { calls };
}

function adapter(overrides: Partial<AgentTextAdapter>): AgentTextAdapter {
  return {
    harness: "claude-code",
    probe: async () => ({ harness: "claude-code", available: true }),
    generate: async () => ({ text: "unused" }),
    ...overrides,
  };
}

const missingHarness = (): AgentTextAdapter["probe"] =>
  async () => ({
    harness: "claude-code",
    available: false,
    detail: "Claude Code CLI (`claude`) not found on PATH",
  });

/**
 * Issue #346: the recall walk treated every agent row as ready without a
 * probe, and a harness failure was neither a fallthrough status nor "no
 * answer", so an offline harness failed the learner's whole answer even
 * with healthy rows behind it — while ensure-llm reported the same row as
 * offline. The chain must skip a dead harness like any unreachable row.
 */
describe("agent primary in the recall chain", () => {
  let testConfigDir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    testConfigDir = mkdtempSync(join(tmpdir(), "zam-agent-chain-"));
    const configPath = join(testConfigDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ ai: { providers: {}, roles: {} } }),
    );
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = configPath;
    clearRecallEndpointCache();
    vi.mocked(getAgentAdapter).mockReset();
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    saveMachineAiModels([agentRow, cloudRow]);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    clearRecallEndpointCache();
    await db.close();
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(testConfigDir, { recursive: true, force: true });
  });

  const evaluate = () =>
    evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

  it("skips an agent primary whose harness is missing and lets the next row serve", async () => {
    const generate = vi.fn(async () => ({ text: "must not be called" }));
    vi.mocked(getAgentAdapter).mockReturnValue(
      adapter({ probe: missingHarness(), generate }),
    );
    const { calls } = stubCloud();

    const result = await evaluate();

    expect(result.model).toBe("working/model");
    expect(generate).not.toHaveBeenCalled();
    expect(calls).toEqual(["working/model"]);
  });

  it("lets the next row serve when the harness fails during the call", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      adapter({
        generate: async () => {
          throw new AgentError(
            "claude-code",
            "Claude Code exited with code 1: session expired",
          );
        },
      }),
    );
    const { calls } = stubCloud();

    const result = await evaluate();

    expect(result.model).toBe("working/model");
    expect(calls).toEqual(["working/model"]);
  });

  it("resolves past a missing harness for dynamic questions and sampling", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      adapter({ probe: missingHarness() }),
    );
    stubCloud();

    const endpoint = await resolveUsableRecallEndpoint(db, {
      allowAgent: true,
    });

    expect(endpoint.transport).toBeUndefined();
    expect(endpoint.model).toBe("working/model");
  });

  it("ensure-llm agrees with the walk: a dead harness leaves the next row usable", async () => {
    vi.mocked(getAgentAdapter).mockReturnValue(
      adapter({ probe: missingHarness() }),
    );
    stubCloud();

    const ready = await ensureLlmReadyHeadless(db, { timeoutMs: 1000 });

    expect(ready.usable).toBe(true);
    expect(ready.model).toBe("working/model");
  });

  it("still fails loudly when the dead harness is the only row", async () => {
    saveMachineAiModels([agentRow]);
    vi.mocked(getAgentAdapter).mockReturnValue(
      adapter({ probe: missingHarness() }),
    );

    await expect(evaluate()).rejects.toThrow(/online|usable/);
  });
});
