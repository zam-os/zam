import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  type Database,
  getMachineAiModels,
  getSetting,
  openDatabase,
} from "../../src/kernel/index.js";
import {
  enforceOpenRouterPrivacy,
  isOpenRouterUrl,
  OPENROUTER_ROUTING_PREFERENCES,
} from "../../src/cli/llm/client.js";
import {
  type CloudConnectDeps,
  connectCloudProvider,
} from "../../src/cli/llm/cloud-connect.js";
import {
  CLOUD_PROVIDERS,
  OPENROUTER_PROVIDER,
} from "../../src/cli/llm/cloud-providers.js";

const OPENROUTER_CHAT = "https://openrouter.ai/api/v1/chat/completions";

describe("OpenRouter privacy enforcement (ADR 2026-07-24 §5)", () => {
  it("recognizes openrouter.ai hosts and nothing else", () => {
    expect(isOpenRouterUrl("https://openrouter.ai/api/v1")).toBe(true);
    expect(isOpenRouterUrl("https://api.openrouter.ai/v1")).toBe(true);
    expect(isOpenRouterUrl("https://api.openai.com/v1")).toBe(false);
    expect(isOpenRouterUrl("https://evilopenrouter.ai/v1")).toBe(false);
    expect(isOpenRouterUrl("not a url")).toBe(false);
  });

  it("injects deny + zdr into every OpenRouter chat-completions body", () => {
    const body = JSON.stringify({ model: "xiaomi/mimo-v2.5", messages: [] });
    const result = JSON.parse(
      enforceOpenRouterPrivacy(OPENROUTER_CHAT, body) as string,
    );
    expect(result.provider).toEqual({ data_collection: "deny", zdr: true });
    expect(result.model).toBe("xiaomi/mimo-v2.5");
  });

  it("wins over a caller-supplied provider object", () => {
    const body = JSON.stringify({
      model: "m",
      messages: [],
      provider: { data_collection: "allow", zdr: false, order: ["x"] },
    });
    const result = JSON.parse(
      enforceOpenRouterPrivacy(OPENROUTER_CHAT, body) as string,
    );
    expect(result.provider.data_collection).toBe("deny");
    expect(result.provider.zdr).toBe(true);
    // Unrelated routing fields survive the merge.
    expect(result.provider.order).toEqual(["x"]);
  });

  it("leaves non-OpenRouter endpoints untouched", () => {
    const body = JSON.stringify({ model: "gpt-5-mini", messages: [] });
    const url = "https://api.openai.com/v1/chat/completions";
    expect(enforceOpenRouterPrivacy(url, body)).toBe(body);
    expect(JSON.parse(body).provider).toBeUndefined();
  });

  it("leaves non-chat-completions OpenRouter requests untouched", () => {
    const body = JSON.stringify({ input: "hello" });
    expect(
      enforceOpenRouterPrivacy("https://openrouter.ai/api/v1/models", body),
    ).toBe(body);
  });

  it("passes through bodies it cannot parse", () => {
    expect(enforceOpenRouterPrivacy(OPENROUTER_CHAT, "not json")).toBe(
      "not json",
    );
    expect(enforceOpenRouterPrivacy(OPENROUTER_CHAT, undefined)).toBe(
      undefined,
    );
  });

  it("freezes the preference contract", () => {
    expect(OPENROUTER_ROUTING_PREFERENCES).toEqual({
      data_collection: "deny",
      zdr: true,
    });
  });
});

describe("cloud provider descriptors", () => {
  it("ships OpenRouter with the verified $5 minimum and both capabilities", () => {
    expect(CLOUD_PROVIDERS.map((p) => p.id)).toContain("openrouter");
    expect(OPENROUTER_PROVIDER.minTopUpUsd).toBe(5);
    expect(OPENROUTER_PROVIDER.capabilities.sort()).toEqual(["image", "text"]);
    expect(isOpenRouterUrl(OPENROUTER_PROVIDER.baseUrl)).toBe(true);
    // No :free variant — it would route around the enforced privacy prefs.
    expect(OPENROUTER_PROVIDER.defaultModel).not.toContain(":free");
  });
});

describe("connectCloudProvider", () => {
  let db: Database;
  let tempDir: string;
  let previousConfigPath: string | undefined;
  let storedKeys: Array<{ ref: string; apiKey: string }>;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), "zam-cloud-connect-"));
    previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = join(tempDir, "config.json");
    storedKeys = [];
    db = await openDatabase({
      dbPath: join(tempDir, "zam-test.db"),
      initialize: true,
      useConfiguredCloud: false,
    });
  });

  afterEach(async () => {
    await db.close();
    if (previousConfigPath === undefined) {
      delete process.env.ZAM_CONFIG_PATH;
    } else {
      process.env.ZAM_CONFIG_PATH = previousConfigPath;
    }
    try {
      rmSync(tempDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 50,
      });
    } catch {
      // Best-effort cleanup
    }
  });

  function deps(
    overrides: Partial<CloudConnectDeps> = {},
  ): CloudConnectDeps {
    return {
      probe: async () => ({
        reachable: true,
        catalog: [OPENROUTER_PROVIDER.defaultModel],
        detected: {
          text: true,
          embedding: false,
          image: true,
          video: false,
          stt: false,
          tts: false,
        },
      }),
      verifyKey: async () => ({ valid: true }),
      storeKey: (ref, apiKey) => storedKeys.push({ ref, apiKey }),
      ...overrides,
    };
  }

  it("rejects unknown providers and empty keys without side effects", async () => {
    const unknown = await connectCloudProvider(db, "nova", "sk-x", deps());
    expect(unknown.ok).toBe(false);
    expect(unknown.error).toContain("Unknown cloud provider");

    const empty = await connectCloudProvider(db, "openrouter", "  ", deps());
    expect(empty.ok).toBe(false);
    expect(storedKeys).toHaveLength(0);
    expect(getMachineAiModels()).toHaveLength(0);
  });

  it("rejects an invalid key before storing anything", async () => {
    const result = await connectCloudProvider(
      db,
      "openrouter",
      "sk-or-bad",
      deps({
        verifyKey: async () => ({ valid: false, reason: "rejected (401)" }),
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.error).toContain("rejected");
    expect(storedKeys).toHaveLength(0);
    expect(getMachineAiModels()).toHaveLength(0);
    expect(await getSetting(db, "llm.enabled")).not.toBe("true");
  });

  it("registers the default model, stores the key, and enables the LLM", async () => {
    const result = await connectCloudProvider(
      db,
      "openrouter",
      " sk-or-good ",
      deps(),
    );
    expect(result.ok).toBe(true);
    expect(result.created).toBe(true);

    expect(storedKeys).toEqual([
      { ref: OPENROUTER_PROVIDER.apiKeyRef, apiKey: "sk-or-good" },
    ]);
    const models = getMachineAiModels();
    expect(models).toHaveLength(1);
    expect(models[0].url).toBe(OPENROUTER_PROVIDER.baseUrl);
    expect(models[0].model).toBe(OPENROUTER_PROVIDER.defaultModel);
    expect(models[0].local).toBe(false);
    expect(models[0].capabilities.text).toBe(true);
    expect(models[0].capabilities.image).toBe(true);
    expect(models[0].detectedCapabilities.text).toBe(true);
    expect(await getSetting(db, "llm.enabled")).toBe("true");
  });

  it("is idempotent: reconnecting updates the entry in place", async () => {
    await connectCloudProvider(db, "openrouter", "sk-or-1", deps());
    const [first] = getMachineAiModels();

    const again = await connectCloudProvider(db, "openrouter", "sk-or-2", deps());
    expect(again.ok).toBe(true);
    expect(again.created).toBe(false);

    const models = getMachineAiModels();
    expect(models).toHaveLength(1);
    expect(models[0].id).toBe(first.id);
    expect(models[0].order).toBe(first.order);
    expect(storedKeys.map((k) => k.apiKey)).toEqual(["sk-or-1", "sk-or-2"]);
  });

  it("fails the save when the endpoint is unreachable", async () => {
    const result = await connectCloudProvider(
      db,
      "openrouter",
      "sk-or-good",
      deps({
        probe: async () => ({
          reachable: false,
          catalog: [],
          detected: {
            text: false,
            embedding: false,
            image: false,
            video: false,
            stt: false,
            tts: false,
          },
        }),
      }),
    );
    expect(result.ok).toBe(false);
    expect(getMachineAiModels()).toHaveLength(0);
    expect(await getSetting(db, "llm.enabled")).not.toBe("true");
  });
});
