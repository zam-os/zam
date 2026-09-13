import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecallEndpointCache,
  discussReviewViaLLM,
  evaluateAnswerViaLLM,
  getProviderRoleStatus,
  prepareRecallChain,
  probeKeyValidity,
  RECALL_EVALUATION_RETRY_OUTPUT_TOKENS,
} from "../../src/cli/llm/client.js";

vi.mock("../../src/cli/llm/foundry-local.js", async (importActual) => {
  const actual = await importActual<
    typeof import("../../src/cli/llm/foundry-local.js")
  >();
  return {
    ...actual,
    // The prepared service answers on a different URL than the row stores —
    // the resolved config, not the stored one, is what the walk must call.
    ensureFoundryModelLoaded: async () => ({
      ok: true,
      endpoint: "http://127.0.0.1:9999/v1",
    }),
  };
});
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
    url?: string;
  } = {},
): ModelEntry {
  return {
    id: options.id ?? "glm",
    label: "GLM-5.3 Flash",
    url: options.url ?? "https://openrouter.ai/api/v1",
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

/**
 * URL-keyed stub for the boundary tests: rows use distinct hosts so the
 * assertions can prove a row was never contacted at all.
 */
/**
 * Responses keyed by URL. `undefined` answers 404 (reachable, nothing there);
 * `"unreachable"` throws the way fetch does without a network — the
 * distinction the offline tier is built on.
 */
function stubFetchByUrl(
  respond: (
    url: string,
  ) => { status: number; body: unknown } | "unreachable" | undefined,
): { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  vi.stubGlobal("fetch", async (url: string | URL | Request): Promise<Response> => {
    const urlText = String(url);
    calls.push({ url: urlText, method: "GET", body: null });
    const r = respond(urlText);
    if (r === "unreachable") throw new TypeError("fetch failed");
    return new Response(JSON.stringify(r?.body ?? {}), {
      status: r?.status ?? 404,
      headers: { "content-type": "application/json" },
    });
  });
  return { calls };
}

const okResponse = (content: string) => ({
  status: 200,
  body: { choices: [{ message: { content }, finish_reason: "stop" }] },
});

describe("fallback chain boundaries", () => {
  let testConfigDir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    testConfigDir = mkdtempSync(join(tmpdir(), "zam-chain-boundary-"));
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

  it("a healthy primary never contacts fallback rows before the chat", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "r1",
        model: "a/model",
        order: 0,
        url: "https://r1.openrouter.ai/api/v1",
      }),
      openRouterEntry({
        id: "r2",
        model: "b/model",
        order: 1,
        url: "https://r2.openrouter.ai/api/v1",
      }),
      openRouterEntry({
        id: "r3",
        model: "c/model",
        order: 2,
        url: "https://r3.openrouter.ai/api/v1",
      }),
    ]);
    const { calls } = stubFetchByUrl((url) =>
      url.startsWith("https://r1.")
        ? okResponse("OK")
        : undefined,
    );

    const result = await evaluate();

    expect(result.model).toBe("a/model");
    expect(
      calls.filter((call) => !call.url.includes("r1.openrouter.ai")),
    ).toEqual([]);
  });

  it("a foundry fallback is never started when the primary serves", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://primary.openrouter.ai/api/v1",
      }),
      {
        id: "foundry-fallback",
        label: "Foundry",
        url: "http://127.0.0.1:5273/v1",
        model: "qwen3.5-0.8b",
        local: true,
        apiFlavor: "chat-completions",
        runner: "foundry",
        order: 1,
        capabilities: textCaps(),
        detectedCapabilities: textCaps(),
      },
    ]);
    const { calls } = stubFetchByUrl((url) =>
      url.startsWith("https://primary.") ? okResponse("OK") : undefined,
    );

    const result = await evaluate();

    expect(result.model).toBe("cloud/model");
    expect(calls.filter((call) => call.url.includes("127.0.0.1:5273"))).toEqual(
      [],
    );
  });

  const localOllamaRow = (order: number): ModelEntry => ({
    id: "local-ollama",
    label: "Ollama",
    url: "http://localhost:11434/v1",
    model: "local/model",
    local: true,
    apiFlavor: "chat-completions",
    runner: "ollama",
    order,
    capabilities: textCaps(),
    detectedCapabilities: textCaps(),
  });

  it("a cloud primary that answers keeps the offline tier closed", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://primary.openrouter.ai/api/v1",
      }),
      localOllamaRow(1),
    ]);
    const { calls } = stubFetchByUrl((url) =>
      url.startsWith("https://primary.")
        ? {
            status: 401,
            body: {
              error: { message: "Missing Authentication header", code: 401 },
            },
          }
        : okResponse("OK"),
    );

    // The cloud answered and refused: the local row is the offline tier and
    // stays untouched — the original 401 is raised, Ollama is never called,
    // let alone started.
    await expect(evaluate()).rejects.toThrow(/401/);
    expect(calls.filter((call) => call.url.includes("localhost:11434"))).toEqual(
      [],
    );
  });

  it("a rejected stored key keeps the offline tier closed and names itself", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://primary.openrouter.ai/api/v1",
        keyValid: false,
      }),
      localOllamaRow(1),
    ]);
    const { calls } = stubFetchByUrl((url) =>
      url.startsWith("https://primary.") && url.endsWith("/models")
        ? { status: 200, body: { data: [] } }
        : okResponse("OK"),
    );

    // Reachable cloud, refused key: not "offline", so no local fallback — and
    // the error says what to fix instead of "no endpoint is online".
    await expect(evaluate()).rejects.toThrow(/API key was rejected/);
    expect(calls.filter((call) => call.url.includes("localhost:11434"))).toEqual(
      [],
    );
    expect(
      calls.some((call) => call.url.includes("primary.openrouter.ai")),
    ).toBe(true);
  });

  it("a cloud primary that does not answer falls through to the local row", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://primary.openrouter.ai/api/v1",
      }),
      localOllamaRow(1),
    ]);
    const { calls } = stubFetchByUrl((url) => {
      if (url.startsWith("https://primary.")) return "unreachable";
      return url.endsWith("/models")
        ? { status: 200, body: { data: [{ id: "local/model" }] } }
        : okResponse("OK");
    });

    // No network: the offline tier opens and the learner's own local model
    // evaluates the answer — the graceful-degradation path.
    const result = await evaluate();

    expect(result.model).toBe("local/model");
    expect(calls.some((call) => call.url.includes("localhost:11434"))).toBe(
      true,
    );
  });

  it("the offline tier opens only after every cloud row failed to answer", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "r1",
        model: "a/model",
        order: 0,
        url: "https://r1.openrouter.ai/api/v1",
      }),
      localOllamaRow(1),
      openRouterEntry({
        id: "r2",
        model: "b/model",
        order: 2,
        url: "https://r2.openrouter.ai/api/v1",
      }),
    ]);
    const { calls } = stubFetchByUrl((url) => {
      if (url.startsWith("https://r1.")) return "unreachable";
      if (url.startsWith("https://r2.")) return okResponse("OK");
      return okResponse("OK");
    });

    // The second cloud row sits behind the local row in registry order, but
    // cloud rows come first: it answers, so Ollama is never consulted.
    const result = await evaluate();

    expect(result.model).toBe("b/model");
    expect(calls.filter((call) => call.url.includes("localhost:11434"))).toEqual(
      [],
    );
  });

  it("a foundry row in the offline tier is prepared and called when the cloud is gone", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://primary.openrouter.ai/api/v1",
      }),
      {
        id: "foundry-fallback",
        label: "Foundry",
        url: "http://127.0.0.1:5273/v1",
        model: "qwen3.5-0.8b",
        local: true,
        apiFlavor: "chat-completions",
        runner: "foundry",
        order: 1,
        capabilities: textCaps(),
        detectedCapabilities: textCaps(),
      },
    ]);
    const { calls } = stubFetchByUrl((url) => {
      if (url.startsWith("https://primary.")) return "unreachable";
      if (!url.startsWith("http://127.0.0.1:9999")) return undefined;
      return url.endsWith("/models")
        ? { status: 200, body: { data: [{ id: "qwen3.5-0.8b" }] } }
        : okResponse("OK");
    });

    const result = await evaluate();

    // Prepared (mocked service reports :9999) and called there — starting the
    // local runtime is the point of the offline tier, not a side effect.
    expect(result.model).toBe("qwen3.5-0.8b");
    expect(
      calls.some(
        (call) =>
          call.url.startsWith("http://127.0.0.1:9999") &&
          !call.url.endsWith("/models"),
      ),
    ).toBe(true);
  });

  it("a local primary keeps its cloud fallback", async () => {
    saveMachineAiModels([
      {
        id: "local-ollama",
        label: "Ollama",
        url: "http://localhost:11434/v1",
        model: "local/model",
        local: true,
        apiFlavor: "chat-completions",
        runner: "ollama",
        order: 0,
        capabilities: textCaps(),
        detectedCapabilities: textCaps(),
      },
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 1,
        url: "https://cloud.openrouter.ai/api/v1",
      }),
    ]);
    const { calls } = stubFetchByUrl((url) =>
      url.startsWith("http://localhost:11434")
        ? {
            status: 401,
            body: { error: { message: "model gone", code: 401 } },
          }
        : okResponse("OK"),
    );

    const result = await evaluate();

    expect(result.model).toBe("cloud/model");
    expect(calls.some((call) => call.url.includes("localhost:11434"))).toBe(
      true,
    );
    expect(calls.some((call) => call.url.includes("cloud.openrouter.ai"))).toBe(
      true,
    );
  });
});

describe("foundry resolution and ensure-llm boundary", () => {
  let testConfigDir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    testConfigDir = mkdtempSync(join(tmpdir(), "zam-foundry-ready-"));
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

  it("calls a foundry primary on the URL the prepared service reports", async () => {
    saveMachineAiModels([
      {
        id: "foundry-primary",
        label: "Foundry",
        url: "http://127.0.0.1:5273/v1",
        model: "qwen3.5-0.8b",
        local: true,
        apiFlavor: "chat-completions",
        runner: "foundry",
        order: 0,
        capabilities: textCaps(),
        detectedCapabilities: textCaps(),
      },
    ]);
    const { calls } = stubFetchByUrl((url) => {
      if (!url.startsWith("http://127.0.0.1:9999")) return undefined;
      return url.endsWith("/models")
        ? { status: 200, body: { data: [{ id: "qwen3.5-0.8b" }] } }
        : okResponse("OK");
    });

    const result = await evaluateAnswerViaLLM(db, {
      slug: "frankreich-hauptstadt",
      concept: "Paris",
      domain: "Geografie",
      bloomLevel: 1,
      question: "Was ist die Hauptstadt von Frankreich?",
      userAnswer: "Paris",
    });

    expect(result.model).toBe("qwen3.5-0.8b");
    // The chat goes to the URL the prepared service reported — never to the
    // stale stored one.
    expect(
      calls.some(
        (call) =>
          call.url.startsWith("http://127.0.0.1:9999") &&
          !call.url.endsWith("/models"),
      ),
    ).toBe(true);
    expect(calls.some((call) => call.url.includes("127.0.0.1:5273"))).toBe(
      false,
    );
  });

  const localRowBehindCloud = (): ModelEntry => ({
    id: "local-ollama",
    label: "Ollama",
    url: "http://localhost:59999/v1",
    model: "local/model",
    local: true,
    apiFlavor: "chat-completions",
    runner: "ollama",
    order: 1,
    capabilities: textCaps(),
    detectedCapabilities: textCaps(),
  });

  it("ensure-llm reports a reachable cloud that rejected its key without touching the local row", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://primary.openrouter.ai/api/v1",
        keyValid: false,
      }),
      localRowBehindCloud(),
    ]);
    const { calls } = stubFetchByUrl((url) =>
      url.startsWith("https://primary.") && url.endsWith("/models")
        ? { status: 200, body: { data: [] } }
        : undefined,
    );

    const result = await prepareRecallChain(db, {
      timeoutMs: 800,
      interactive: false,
    });

    // The cloud answered: the offline tier stays closed, the header learns
    // the real reason, and the local row is never probed, let alone started.
    expect(result.usable).toBe(false);
    expect(result.reason).toBe("key-invalid");
    expect(result.model).toBe("cloud/model");
    expect(calls.filter((call) => call.url.includes("localhost:59999"))).toEqual(
      [],
    );
  });

  it("ensure-llm opens the offline tier when no cloud row answers", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://offline.openrouter.ai/api/v1",
      }),
      localRowBehindCloud(),
    ]);
    const { calls } = stubFetchByUrl((url) => {
      if (url.startsWith("https://offline.")) return "unreachable";
      return url.endsWith("/models")
        ? { status: 200, body: { data: [{ id: "local/model" }] } }
        : undefined;
    });

    const result = await prepareRecallChain(db, {
      timeoutMs: 800,
      interactive: false,
    });

    // Same verdict the recall walk will reach: the local row serves, and the
    // header says so instead of going green on a row the walk would refuse.
    expect(result.usable).toBe(true);
    expect(result.model).toBe("local/model");
    expect(result.local).toBe(true);
    expect(result.activeTier).toBe("fallback");
    expect(calls.some((call) => call.url.includes("localhost:59999"))).toBe(
      true,
    );
  });

  it("the text role applies the same tiering through the role status", async () => {
    saveMachineAiModels([
      openRouterEntry({
        id: "cloud",
        model: "cloud/model",
        order: 0,
        url: "https://primary.openrouter.ai/api/v1",
        keyValid: false,
      }),
      localRowBehindCloud(),
    ]);
    const { calls } = stubFetchByUrl((url) =>
      url.startsWith("https://primary.") && url.endsWith("/models")
        ? { status: 200, body: { data: [] } }
        : undefined,
    );

    const status = await getProviderRoleStatus(db, "text");

    expect(status.usable).toBe(false);
    expect(status.reason).toBe("key-invalid");
    expect(status.providerName).toBe("cloud");
    expect(status.fallback?.offlineOnly).toBe(true);
    expect(calls.filter((call) => call.url.includes("localhost:59999"))).toEqual(
      [],
    );
  });
});
