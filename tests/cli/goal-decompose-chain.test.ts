import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearRecallEndpointCache,
  evaluateAnswerViaLLM,
  GOAL_DECOMPOSITION_MAX_OUTPUT_TOKENS,
  GOAL_DECOMPOSITION_RETRY_OUTPUT_TOKENS,
  generateGoalDecompositionViaLLM,
} from "../../src/cli/llm/client.js";
import {
  type CapabilityFlags,
  type Database,
  type ModelEntry,
  openDatabase,
  saveMachineAiModels,
  setSetting,
} from "../../src/kernel/index.js";

/**
 * Klara's goal import (2026-09-15): OpenRouter answered the goal
 * decomposition for gpt-5.6-luna with HTTP 200 and `{ error: { code: 429,
 * message: "… temporarily rate-limited upstream …" } }` — no `choices` at
 * all. The goal step read an empty content string out of that and failed
 * the learner with "JSON array brackets not found". The same body shape is
 * what OpenRouter uses for provider errors after routing, so every chat
 * reader treats an embedded error as the status it carries: 429 and 401
 * walk the chain, anything else surfaces with the upstream message.
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

function cloudRow(id: string, model: string, order: number): ModelEntry {
  return {
    id,
    label: model,
    url: `https://${id}.openrouter.ai/api/v1`,
    model,
    local: false,
    apiFlavor: "chat-completions",
    order,
    capabilities: textCaps(),
    detectedCapabilities: textCaps(),
  };
}

interface RecordedCall {
  url: string;
  body: Record<string, unknown> | null;
}

function stubFetch(
  respond: (
    url: string,
    call: number,
  ) => { status: number; body: unknown } | undefined,
): { calls: RecordedCall[] } {
  const calls: RecordedCall[] = [];
  let chatCalls = 0;
  vi.stubGlobal(
    "fetch",
    async (
      url: string | URL | Request,
      init?: { body?: unknown },
    ): Promise<Response> => {
      const urlText = String(url);
      const body =
        typeof init?.body === "string"
          ? (JSON.parse(init.body) as Record<string, unknown>)
          : null;
      calls.push({ url: urlText, body });
      if (urlText.endsWith("/models")) {
        const host = new URL(urlText).hostname.split(".")[0];
        return new Response(
          JSON.stringify({
            data: [{ id: host === "luna" ? "openai/gpt-5.6-luna" : "z-ai/glm-5.3-flash" }],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      chatCalls += 1;
      const r = respond(urlText, chatCalls);
      return new Response(JSON.stringify(r?.body ?? {}), {
        status: r?.status ?? 404,
        headers: { "content-type": "application/json" },
      });
    },
  );
  return { calls };
}

const rateLimitedInA200 = {
  status: 200,
  body: {
    error: {
      message:
        "openai/gpt-5.6-luna is temporarily rate-limited upstream. Please retry shortly, or add your own key to accumulate your rate limits: https://openrouter.ai/settings/integrations",
      code: 429,
      metadata: { error_type: "rate_limit_exceeded" },
    },
  },
};

const breakdown = [
  { label: "Grundlagen der Reibung", description: "Reibung als Kraft verstehen." },
  { label: "Haft- und Gleitreibung", description: "Beide Arten unterscheiden." },
  { label: "Rollreibung", description: "Rollreibung einordnen." },
];

const arrayReply = (finish = "stop") => ({
  status: 200,
  body: {
    choices: [
      { message: { content: JSON.stringify(breakdown) }, finish_reason: finish },
    ],
  },
});

const chatCalls = (calls: RecordedCall[]) =>
  calls.filter((call) => !call.url.endsWith("/models"));

describe("goal decomposition on the text chain", () => {
  let testConfigDir: string;
  let previousConfigPath: string | undefined;
  let db: Database;

  beforeEach(async () => {
    testConfigDir = mkdtempSync(join(tmpdir(), "zam-goal-chain-"));
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
    saveMachineAiModels([
      cloudRow("luna", "openai/gpt-5.6-luna", 0),
      cloudRow("glm", "z-ai/glm-5.3-flash", 1),
    ]);
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    clearRecallEndpointCache();
    await db.close();
    if (previousConfigPath === undefined) delete process.env.ZAM_CONFIG_PATH;
    else process.env.ZAM_CONFIG_PATH = previousConfigPath;
    rmSync(testConfigDir, { recursive: true, force: true });
  });

  const decompose = () =>
    generateGoalDecompositionViaLLM(db, {
      title: "Reibung",
      description: "frage mich alle reibungsarten der physik ab",
      path: [],
    });

  it("a rate limit embedded in a 200 body hands over to the next row", async () => {
    const { calls } = stubFetch((url) =>
      url.startsWith("https://luna.") ? rateLimitedInA200 : arrayReply(),
    );

    const options = await decompose();

    expect(options.map((option) => option.label)).toEqual(
      breakdown.map((item) => item.label),
    );
    expect(chatCalls(calls).map((call) => call.body?.model)).toEqual([
      "openai/gpt-5.6-luna",
      "z-ai/glm-5.3-flash",
    ]);
  });

  it("names the upstream reason when every row is rate-limited", async () => {
    stubFetch(() => rateLimitedInA200);

    await expect(decompose()).rejects.toThrow(
      /Goal decomposition failed: openai\/gpt-5.6-luna is temporarily rate-limited upstream/,
    );
    await expect(decompose()).rejects.not.toThrow(/brackets not found/);
  });

  it("retries a reply the reasoning budget cut off with a larger allowance", async () => {
    const { calls } = stubFetch((url, call) => {
      if (!url.startsWith("https://luna.")) return undefined;
      return call === 1
        ? {
            status: 200,
            body: {
              choices: [{ message: { content: "" }, finish_reason: "length" }],
            },
          }
        : arrayReply();
    });

    const options = await decompose();

    expect(options).toHaveLength(3);
    expect(chatCalls(calls).map((call) => call.body?.max_tokens)).toEqual([
      GOAL_DECOMPOSITION_MAX_OUTPUT_TOKENS,
      GOAL_DECOMPOSITION_RETRY_OUTPUT_TOKENS,
    ]);
  });

  it("a provider error embedded in a 200 body surfaces its message on the evaluation too", async () => {
    stubFetch(() => ({
      status: 200,
      body: { error: { message: "Provider returned error", code: 502 } },
    }));

    await expect(
      evaluateAnswerViaLLM(db, {
        slug: "reibung",
        concept: "Haftreibung",
        domain: "Physik",
        bloomLevel: 1,
        question: "Was ist Haftreibung?",
        userAnswer: "Reibung in Ruhe",
      }),
    ).rejects.toThrow(/Provider returned error \(502\)/);
  });
});
