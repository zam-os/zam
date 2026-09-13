import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecallEndpointCache,
  evaluateAnswerViaLLM,
} from "../../src/cli/llm/client.js";
import {
  probeModelCapabilities,
  validateModelSave,
} from "../../src/cli/llm/capability-probe.js";
import {
  type CapabilityFlags,
  type ModelEntry,
  openDatabase,
  saveMachineAiModels,
  setSetting,
  type Database,
} from "../../src/kernel/index.js";

/**
 * GLM-5.3-Flash and other reasoning-mandatory OpenRouter models answer the
 * `reasoning: { effort: "none" }` evaluation default with a 400 instead of an
 * evaluation (reported 2026-09-13: the whole answer-feedback flow silently
 * degraded to the static reveal). The retry must drop the control and let the
 * model reason natively.
 */

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

function openRouterEntry(effort?: ModelEntry["effort"]): ModelEntry {
  return {
    id: "glm",
    label: "GLM-5.3 Flash",
    url: "https://openrouter.ai/api/v1",
    model: "z-ai/glm-5.3-flash",
    local: false,
    apiFlavor: "chat-completions",
    order: 0,
    capabilities: textCaps(),
    detectedCapabilities: textCaps(),
    ...(effort ? { effort } : {}),
  };
}

interface RecordedCall {
  url: string;
  method: string;
  body: Record<string, unknown> | null;
}

const evaluationBody = {
  choices: [
    {
      message: { content: "Vollständig — Paris ist die Hauptstadt Frankreichs." },
      finish_reason: "stop",
    },
  ],
};

/**
 * Serve `/models` (the readiness + catalog check) plus a scripted chat
 * completion sequence, all through a stubbed global fetch — no real network,
 * which is the point: the configured URL is openrouter.ai.
 */
function stubFetch(
  chatResponses: Array<{ status: number; body: unknown }>,
): { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  const queue = [...chatResponses];
  vi.stubGlobal(
    "fetch",
    async (
      url: string | URL | Request,
      init?: { method?: string; body?: unknown },
    ): Promise<Response> => {
      const urlText = String(url);
      const method = init?.method ?? "GET";
      const body =
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as Record<string, unknown>)
          : null;
      calls.push({ url: urlText, method, body });
      if (urlText.endsWith("/models")) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      const next = queue.shift();
      if (!next) throw new Error("No scripted chat response left");
      return new Response(JSON.stringify(next.body), {
        status: next.status,
        headers: { "content-type": "application/json" },
      });
    },
  );
  return { calls };
}

describe("evaluateAnswerViaLLM and a reasoning-mandatory endpoint", () => {
  let testConfigDir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    testConfigDir = mkdtempSync(join(tmpdir(), "zam-eval-retry-"));
    const configPath = join(testConfigDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ ai: { providers: {}, roles: {} } }),
    );
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = configPath;
    clearRecallEndpointCache();
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
    saveMachineAiModels([openRouterEntry()]);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    clearRecallEndpointCache();
    await db.close();
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(testConfigDir, { recursive: true, force: true });
  });

  it("retries without the reasoning control when the endpoint rejects it", async () => {
    const { calls } = stubFetch([
      {
        status: 400,
        body: {
          error: {
            message: "Reasoning is mandatory for this endpoint and cannot be disabled.",
            code: 400,
          },
        },
      },
      { status: 200, body: evaluationBody },
    ]);

    const result = await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

    expect(result.text).toContain("Paris");
    const chats = calls.filter((call) => !call.url.endsWith("/models"));
    expect(chats).toHaveLength(2);
    expect(chats[0]?.body?.reasoning).toEqual({ effort: "none" });
    expect(chats[1]?.body?.reasoning).toBeUndefined();
  });

  it("keeps the effort control for a model that accepts it", async () => {
    const { calls } = stubFetch([
      { status: 200, body: evaluationBody },
    ]);

    const result = await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

    expect(result.text).toContain("Paris");
    const chats = calls.filter((call) => !call.url.endsWith("/models"));
    expect(chats).toHaveLength(1);
    expect(chats[0]?.body?.reasoning).toEqual({ effort: "none" });
  });
});

describe("reasoning-effort probe and a stored effort level", () => {
  let testConfigDir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    testConfigDir = mkdtempSync(join(tmpdir(), "zam-effort-probe-"));
    const configPath = join(testConfigDir, "config.json");
    writeFileSync(
      configPath,
      JSON.stringify({ ai: { providers: {}, roles: {} } }),
    );
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = configPath;
    clearRecallEndpointCache();
    db = await openDatabase({
      dbPath: ":memory:",
      initialize: true,
      useConfiguredCloud: false,
    });
    await setSetting(db, "llm.enabled", "true");
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    clearRecallEndpointCache();
    await db.close();
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(testConfigDir, { recursive: true, force: true });
  });

  it("stores none when the endpoint honors the control", async () => {
    saveMachineAiModels([openRouterEntry()]);
    const { calls } = stubFetch([{ status: 200, body: evaluationBody }]);

    const probe = await probeModelCapabilities(openRouterEntry(), {
      reasoningEffortProbe: true,
    });

    expect(probe.effort).toBe("none");
    const chats = calls.filter((call) => !call.url.endsWith("/models"));
    expect(chats).toHaveLength(1);
    const result = validateModelSave(openRouterEntry(), probe);
    expect(result.ok).toBe(true);
    expect(result.entry?.effort).toBe("none");
  });

  it("stores minimal for a reasoning-mandatory model", async () => {
    saveMachineAiModels([openRouterEntry()]);
    const mandatory = {
      status: 400,
      body: {
        error: {
          message: "Reasoning is mandatory for this endpoint and cannot be disabled.",
          code: 400,
        },
      },
    };
    stubFetch([mandatory, { status: 200, body: evaluationBody }]);

    const probe = await probeModelCapabilities(openRouterEntry(), {
      reasoningEffortProbe: true,
    });

    expect(probe.effort).toBe("minimal");
    const result = validateModelSave(openRouterEntry(), probe);
    expect(result.entry?.effort).toBe("minimal");
  });

  it("keeps the stored level when the probe has no verdict", async () => {
    saveMachineAiModels([openRouterEntry("low")]);
    stubFetch([{ status: 500, body: { error: { message: "boom" } } }]);

    const entry = openRouterEntry("low");
    const probe = await probeModelCapabilities(entry, {
      reasoningEffortProbe: true,
    });

    expect(probe.effort).toBeUndefined();
    const result = validateModelSave(entry, probe);
    expect(result.entry?.effort).toBe("low");
  });

  it("sends the stored level during evaluation", async () => {
    saveMachineAiModels([openRouterEntry("minimal")]);
    const { calls } = stubFetch([{ status: 200, body: evaluationBody }]);

    const result = await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

    expect(result.text).toContain("Paris");
    const chats = calls.filter((call) => !call.url.endsWith("/models"));
    expect(chats).toHaveLength(1);
    expect(chats[0]?.body?.reasoning).toEqual({ effort: "minimal" });
  });
});
