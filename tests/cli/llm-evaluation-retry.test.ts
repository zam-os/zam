import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecallEndpointCache,
  discussReviewViaLLM,
  evaluateAnswerViaLLM,
  probeKeyValidity,
  RECALL_EVALUATION_RETRY_OUTPUT_TOKENS,
} from "../../src/cli/llm/client.js";
import {
  probeModelCapabilities,
  validateModelSave,
} from "../../src/cli/llm/capability-probe.js";
import {
  type CapabilityFlags,
  emptyCapabilityFlags,
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
 * model reason natively. The same file covers the fallback chain: rows that
 * fail with an auth-level status (401/402/403) at call time are skipped in
 * favour of the next configured row, and rows the probe flagged `keyValid:
 * false` are never called at all.
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

function openRouterEntry(
  options: {
    model?: string;
    effort?: ModelEntry["effort"];
    keyValid?: boolean;
    id?: string;
    order?: number;
  } = {},
): ModelEntry {
  return {
    id: options.id ?? "glm",
    label: "GLM-5.3 Flash",
    url: "https://openrouter.ai/api/v1",
    model: options.model ?? "z-ai/glm-5.3-flash",
    local: false,
    apiFlavor: "chat-completions",
    order: options.order ?? 0,
    capabilities: textCaps(),
    detectedCapabilities: textCaps(),
    ...(options.effort ? { effort: options.effort } : {}),
    ...(options.keyValid !== undefined ? { keyValid: options.keyValid } : {}),
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

  it("sends a newly stored minimal level even after none was memoized", async () => {
    // First evaluation: effort none is rejected and memoized, then retried
    // natively. A re-probe stores "minimal" — the memo is keyed by level, so
    // the stored control must be sent again instead of being suppressed.
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
      { status: 200, body: evaluationBody },
    ]);
    await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });
    saveMachineAiModels([openRouterEntry({ effort: "minimal" })]);

    const result = await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

    expect(result.model).toBe("z-ai/glm-5.3-flash");
    const chats = calls.filter((call) => !call.url.endsWith("/models"));
    expect(chats).toHaveLength(3);
    expect(chats[2]?.body?.reasoning).toEqual({ effort: "minimal" });
  });

  it("a memo hit skips the control and starts at the retry budget", async () => {
    // The endpoint is known to reason: the control-free attempt must not bill
    // a thinking pass at the small budget that would be thrown away anyway.
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
      { status: 200, body: evaluationBody },
    ]);
    await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

    await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

    const chats = calls.filter((call) => !call.url.endsWith("/models"));
    expect(chats).toHaveLength(3);
    expect(chats[2]?.body?.reasoning).toBeUndefined();
    expect(chats[2]?.body?.max_tokens).toBe(
      RECALL_EVALUATION_RETRY_OUTPUT_TOKENS,
    );
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
    saveMachineAiModels([openRouterEntry({ effort: "low" })]);
    stubFetch([{ status: 500, body: { error: { message: "boom" } } }]);

    const entry = openRouterEntry({ effort: "low" });
    const probe = await probeModelCapabilities(entry, {
      reasoningEffortProbe: true,
    });

    expect(probe.effort).toBeUndefined();
    const result = validateModelSave(entry, probe);
    expect(result.entry?.effort).toBe("low");
  });

  it("sends the stored level during evaluation", async () => {
    saveMachineAiModels([openRouterEntry({ effort: "minimal" })]);
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

describe("key-validity probe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubStatus(status: number): void {
    vi.stubGlobal("fetch", async () => new Response("{}", { status }));
  }

  it("reports true for a key the provider authenticates", async () => {
    stubStatus(200);
    await expect(probeKeyValidity("https://openrouter.ai/api/v1", "sk-x")).resolves.toBe(true);
  });

  it("reports false for a rejected key (401/403)", async () => {
    stubStatus(401);
    await expect(probeKeyValidity("https://openrouter.ai/api/v1", "sk-bad")).resolves.toBe(false);
    stubStatus(403);
    await expect(probeKeyValidity("https://openrouter.ai/api/v1", "sk-bad")).resolves.toBe(false);
  });

  it("gives no verdict on transient failures", async () => {
    stubStatus(500);
    await expect(probeKeyValidity("https://openrouter.ai/api/v1", "sk-x")).resolves.toBeUndefined();
    vi.stubGlobal("fetch", async () => {
      throw new Error("offline");
    });
    await expect(probeKeyValidity("https://openrouter.ai/api/v1", "sk-x")).resolves.toBeUndefined();
  });

  it("skips keyless rows entirely", async () => {
    // A row without its own credential must not be marked invalid: the check
    // would run against the default sentinel key and 401.
    saveMachineAiModels([openRouterEntry()]);
    stubFetch([{ status: 200, body: evaluationBody }]);
    const probe = await probeModelCapabilities(openRouterEntry(), {
      reasoningEffortProbe: true,
    });
    expect(probe.keyValid).toBeUndefined();
  });

  it("stamps the verdict onto the saved row and keeps a prior one without a verdict", () => {
    const entry = openRouterEntry();
    const base = {
      reachable: true,
      catalog: ["z-ai/glm-5.3-flash"],
      detected: { ...emptyCapabilityFlags(), text: true },
    };
    const invalid = validateModelSave(entry, { ...base, keyValid: false });
    expect(invalid.entry?.keyValid).toBe(false);
    const valid = validateModelSave(entry, { ...base, keyValid: true });
    expect(valid.entry?.keyValid).toBe(true);
    // No verdict from a later probe must not wipe the last known state.
    const rejected = { ...openRouterEntry(), keyValid: false };
    const kept = validateModelSave(rejected, base);
    expect(kept.entry?.keyValid).toBe(false);
  });
});

/**
 * Chat responses keyed by the requested model: rows share the OpenRouter URL
 * in these tests, so the model id is what distinguishes one row's call from
 * another's.
 */
function stubFetchByModel(
  respond: (model: string) => { status: number; body: unknown },
): { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  vi.stubGlobal(
    "fetch",
    async (
      url: string | URL | Request,
      init?: { method?: string; body?: unknown },
    ): Promise<Response> => {
      const urlText = String(url);
      const body =
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as Record<string, unknown>)
          : null;
      calls.push({ url: urlText, method: init?.method ?? "GET", body });
      if (urlText.endsWith("/models")) {
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      const r = respond((body?.model as string) ?? "");
      return new Response(JSON.stringify(r.body), {
        status: r.status,
        headers: { "content-type": "application/json" },
      });
    },
  );
  return { calls };
}

describe("recall fallback chain", () => {
  let testConfigDir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    testConfigDir = mkdtempSync(join(tmpdir(), "zam-recall-chain-"));
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

  const evaluate = () =>
    evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

  const modelsCalled = (calls: RecordedCall[]): unknown[] =>
    calls
      .filter((call) => !call.url.endsWith("/models"))
      .map((call) => call.body?.model);

  it("falls through to the next row when the primary rejects the key", async () => {
    saveMachineAiModels([
      openRouterEntry({ id: "broken", model: "broken/model", order: 0 }),
      openRouterEntry({ id: "working", model: "working/model", order: 1 }),
    ]);
    const { calls } = stubFetchByModel((model) =>
      model === "broken/model"
        ? {
            status: 401,
            body: { error: { message: "Missing Authentication header", code: 401 } },
          }
        : { status: 200, body: evaluationBody },
    );

    const result = await evaluate();

    expect(result.model).toBe("working/model");
    expect(modelsCalled(calls)).toEqual(["broken/model", "working/model"]);
  });

  it("walks the whole chain, not just the first two rows", async () => {
    saveMachineAiModels([
      openRouterEntry({ id: "a", model: "a/model", order: 0 }),
      openRouterEntry({ id: "b", model: "b/model", order: 1 }),
      openRouterEntry({ id: "c", model: "c/model", order: 2 }),
    ]);
    const { calls } = stubFetchByModel((model) =>
      model === "c/model"
        ? { status: 200, body: evaluationBody }
        : model === "b/model"
          ? {
              status: 429,
              body: {
                error: { message: "Provider returned error", code: 429 },
              },
            }
          : {
              status: 402,
              body: { error: { message: "Insufficient credits", code: 402 } },
            },
    );

    const result = await evaluate();

    expect(result.model).toBe("c/model");
    expect(modelsCalled(calls)).toEqual(["a/model", "b/model", "c/model"]);
  });

  it("never calls a row the probe flagged keyValid: false", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "flagged",
        model: "flagged/model",
        order: 0,
        keyValid: false,
      }),
      openRouterEntry({ id: "healthy", model: "healthy/model", order: 1 }),
    ]);
    const { calls } = stubFetchByModel((model) =>
      model === "healthy/model"
        ? { status: 200, body: evaluationBody }
        : {
            status: 401,
            body: { error: { message: "Missing Authentication header", code: 401 } },
          },
    );

    const result = await evaluate();

    expect(result.model).toBe("healthy/model");
    expect(modelsCalled(calls)).toEqual(["healthy/model"]);
  });

  it("the discussion falls through on an auth-level failure too", async () => {
    saveMachineAiModels([
      openRouterEntry({ id: "broken", model: "broken/model", order: 0 }),
      openRouterEntry({ id: "working", model: "working/model", order: 1 }),
    ]);
    const { calls } = stubFetchByModel((model) =>
      model === "broken/model"
        ? {
            status: 401,
            body: { error: { message: "Missing Authentication header", code: 401 } },
          }
        : { status: 200, body: { choices: [{ message: { content: "Sure!" }, finish_reason: "stop" }] } },
    );

    const result = await discussReviewViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
      thread: [],
      message: "Warum ist Paris die Hauptstadt?",
    });

    expect(result.model).toBe("working/model");
    expect(modelsCalled(calls)).toEqual(["broken/model", "working/model"]);
  });
});
