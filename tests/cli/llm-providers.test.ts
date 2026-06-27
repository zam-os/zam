import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  checkVisionReadiness,
  getProviderForRole,
  inferApiFlavor,
} from "../../src/cli/llm/client.js";
import { observeUiSnapshotViaLLM } from "../../src/cli/llm/vision.js";
import {
  getProviderApiKey,
  openDatabase,
  saveMachineAiConfig,
  setProviderApiKey,
  setSetting,
} from "../../src/kernel/index.js";

function openDb() {
  return openDatabase({
    dbPath: ":memory:",
    initialize: true,
    useConfiguredCloud: false,
  });
}

const tempDirs: string[] = [];
function makeSnapshot(): string {
  const dir = mkdtempSync(join(tmpdir(), "zam-providers-"));
  tempDirs.push(dir);
  const path = join(dir, "snapshot.png");
  writeFileSync(path, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]));
  return path;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Isolate the per-machine config (~/.zam/config.json) so these tests neither
// read the developer's real machine providers/roles nor clobber them when they
// call saveMachineAiConfig. getMachineAiConfig() honors ZAM_CONFIG_PATH.
let machineConfigDir: string;
let previousZamConfigPath: string | undefined;
beforeEach(() => {
  machineConfigDir = mkdtempSync(join(tmpdir(), "zam-machine-cfg-"));
  previousZamConfigPath = process.env.ZAM_CONFIG_PATH;
  process.env.ZAM_CONFIG_PATH = join(machineConfigDir, "config.json");
});
afterEach(() => {
  if (previousZamConfigPath === undefined) {
    delete process.env.ZAM_CONFIG_PATH;
  } else {
    process.env.ZAM_CONFIG_PATH = previousZamConfigPath;
  }
  rmSync(machineConfigDir, { recursive: true, force: true });
});

describe("inferApiFlavor", () => {
  it("maps anthropic.com to the Messages API, everything else to chat-completions", () => {
    expect(inferApiFlavor("https://api.anthropic.com")).toBe(
      "anthropic-messages",
    );
    expect(inferApiFlavor("https://api.deepseek.com/v1")).toBe(
      "chat-completions",
    );
    expect(inferApiFlavor("http://localhost:8000/v1")).toBe("chat-completions");
    expect(inferApiFlavor("not a url")).toBe("chat-completions");
  });
});

describe("getProviderForRole", () => {
  it("falls back to legacy llm.* keys for recall when no role config exists", async () => {
    const db = await openDb();
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "https://api.deepseek.com/v1");
    await setSetting(db, "llm.model", "deepseek-v4-flash");
    try {
      const p = await getProviderForRole(db, "recall");
      expect(p).toMatchObject({
        enabled: true,
        url: "https://api.deepseek.com/v1",
        model: "deepseek-v4-flash",
        apiFlavor: "chat-completions",
      });
      expect(p.fallback).toBeUndefined();
    } finally {
      await db.close();
    }
  });

  it("falls back to legacy llm.vision.* keys for vision", async () => {
    const db = await openDb();
    await setSetting(db, "llm.enabled", "true");
    await setSetting(db, "llm.url", "http://localhost:8000/v1");
    await setSetting(db, "llm.model", "gemma4-it:e4b");
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(db, "llm.vision.url", "http://localhost:8000/v1");
    await setSetting(db, "llm.vision.model", "mimo-vl");
    try {
      const p = await getProviderForRole(db, "vision");
      expect(p).toMatchObject({
        enabled: true,
        url: "http://localhost:8000/v1",
        model: "mimo-vl",
        apiFlavor: "chat-completions",
        maxFrames: 100,
      });
    } finally {
      await db.close();
    }
  });

  it("resolves a role to its configured provider + fallback", async () => {
    const db = await openDb();
    await setSetting(db, "llm.enabled", "true");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        deepseek: {
          url: "https://api.deepseek.com/v1",
          model: "deepseek-v4-flash",
          apiKey: "sk-ds",
        },
        mimo: {
          url: "https://api.xiaomi.com/mimo/v1",
          model: "mimo-v2.5",
          apiKey: "sk-mimo",
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ recall: { primary: "deepseek", fallback: "mimo" } }),
    );
    try {
      const p = await getProviderForRole(db, "recall");
      expect(p).toMatchObject({
        enabled: true,
        url: "https://api.deepseek.com/v1",
        model: "deepseek-v4-flash",
        apiKey: "sk-ds",
        apiFlavor: "chat-completions",
      });
      expect(p.fallback).toMatchObject({
        model: "mimo-v2.5",
        apiKey: "sk-mimo",
      });
    } finally {
      await db.close();
    }
  });

  it("lets machine-local role bindings override shared DB bindings", async () => {
    const db = await openDb();
    const configDir = mkdtempSync(join(tmpdir(), "zam-machine-ai-"));
    tempDirs.push(configDir);
    const configPath = join(configDir, "config.json");
    const previousConfigPath = process.env.ZAM_CONFIG_PATH;
    process.env.ZAM_CONFIG_PATH = configPath;

    await setSetting(db, "llm.enabled", "true");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        shared: {
          url: "https://api.deepseek.com/v1",
          model: "deepseek-v4-flash",
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ recall: { primary: "shared" } }),
    );
    saveMachineAiConfig({
      providers: {
        localFoundry: {
          label: "Foundry Gemma",
          url: "http://localhost:8000/v1",
          model: "gemma4-it:e4b",
          local: true,
        },
      },
      roles: { recall: { primary: "localFoundry" } },
    });

    try {
      const p = await getProviderForRole(db, "recall");
      expect(p).toMatchObject({
        providerName: "localFoundry",
        label: "Foundry Gemma",
        source: "machine",
        url: "http://localhost:8000/v1",
        model: "gemma4-it:e4b",
        local: true,
      });
    } finally {
      if (previousConfigPath === undefined) {
        delete process.env.ZAM_CONFIG_PATH;
      } else {
        process.env.ZAM_CONFIG_PATH = previousConfigPath;
      }
      await db.close();
    }
  });

  it("infers the anthropic-messages flavor from an anthropic provider URL", async () => {
    const db = await openDb();
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        claude: {
          url: "https://api.anthropic.com",
          model: "claude-haiku-4-5",
          apiKey: "sk-ant",
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ vision: { primary: "claude" } }),
    );
    try {
      const p = await getProviderForRole(db, "vision");
      expect(p).toMatchObject({
        enabled: true,
        url: "https://api.anthropic.com",
        model: "claude-haiku-4-5",
        apiFlavor: "anthropic-messages",
      });
    } finally {
      await db.close();
    }
  });

  it("keeps the vision consent gate independent of provider wiring", async () => {
    const db = await openDb();
    // Providers/roles configured, but llm.vision.enabled is left off.
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        claude: { url: "https://api.anthropic.com", model: "claude-haiku-4-5" },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ vision: { primary: "claude" } }),
    );
    try {
      const p = await getProviderForRole(db, "vision");
      expect(p.enabled).toBe(false);
    } finally {
      await db.close();
    }
  });
});

describe("provider API key store (apiKeyRef)", () => {
  it("round-trips a provider key via credentials.json", () => {
    const dir = mkdtempSync(join(tmpdir(), "zam-creds-"));
    const path = join(dir, "credentials.json");
    try {
      expect(getProviderApiKey("deepseek", path)).toBeNull();
      setProviderApiKey("deepseek", "sk-secret", path);
      expect(getProviderApiKey("deepseek", path)).toBe("sk-secret");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("anthropic-messages vision adapter", () => {
  it("posts base64 image blocks to /v1/messages with x-api-key", async () => {
    const db = await openDb();
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        claude: {
          url: "https://api.anthropic.com",
          model: "claude-haiku-4-5",
          apiKey: "sk-ant-test",
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ vision: { primary: "claude" } }),
    );
    await setSetting(db, "system.locale", "de");

    const imagePath = makeSnapshot();
    const originalFetch = global.fetch;
    let requestUrl: string | undefined;
    let requestHeaders: Record<string, string> | undefined;
    let requestBody: Record<string, unknown> | undefined;

    global.fetch = (async (url, init) => {
      requestUrl = String(url);
      requestHeaders = init?.headers as Record<string, string>;
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                kind: "progress",
                summary: "Das Fenster zeigt eine einfache UI.",
                actions: [],
                candidateTokens: [],
                confidence: 0.6,
              }),
            },
          ],
          stop_reason: "end_turn",
        }),
      );
    }) as typeof fetch;

    try {
      const report = await observeUiSnapshotViaLLM(db, {
        sessionId: "s1",
        sequence: 1,
        observedFrom: "2026-06-23T00:00:00.000Z",
        observedTo: "2026-06-23T00:00:01.000Z",
        imagePath,
        application: { processName: "notepad.exe" },
      });

      expect(report).toMatchObject({
        kind: "progress",
        summary: "Das Fenster zeigt eine einfache UI.",
        confidence: 0.6,
      });
      expect(requestUrl).toBe("https://api.anthropic.com/v1/messages");
      expect(requestHeaders?.["x-api-key"]).toBe("sk-ant-test");
      expect(requestHeaders?.["anthropic-version"]).toBe("2023-06-01");
      expect(requestBody?.model).toBe("claude-haiku-4-5");
      const messages = requestBody?.messages as Array<{
        content: Array<Record<string, unknown>>;
      }>;
      expect(messages[0].content[0]).toMatchObject({ type: "text" });
      expect(messages[0].content[1]).toMatchObject({
        type: "image",
        source: { type: "base64", media_type: "image/png" },
      });
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });
});

describe("vision endpoint fallback", () => {
  it("falls back to the configured fallback endpoint when the primary fails", async () => {
    const db = await openDb();
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        local: {
          url: "http://local/v1",
          model: "text-only",
          apiKey: "sk-local",
        },
        cloud: {
          url: "https://api.deepseek.com/v1",
          model: "deepseek-v4-flash",
          apiKey: "sk-cloud",
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ vision: { primary: "local", fallback: "cloud" } }),
    );

    const imagePath = makeSnapshot();
    const originalFetch = global.fetch;
    const urls: string[] = [];
    global.fetch = (async (url) => {
      urls.push(String(url));
      if (String(url) === "http://local/v1/chat/completions") {
        // Primary (local, text-only) rejects image input → request throws.
        return new Response("image input unsupported", { status: 400 });
      }
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  kind: "help-seeking",
                  summary: "Cloud-Fallback lief.",
                  actions: [],
                  candidateTokens: [],
                  confidence: 0.7,
                }),
              },
            },
          ],
        }),
      );
    }) as typeof fetch;

    try {
      const report = await observeUiSnapshotViaLLM(db, {
        sessionId: "s2",
        sequence: 2,
        observedFrom: "2026-06-23T00:00:00.000Z",
        observedTo: "2026-06-23T00:00:01.000Z",
        imagePath,
        application: { processName: "explorer.exe" },
      });

      expect(urls).toEqual([
        "http://local/v1/chat/completions",
        "https://api.deepseek.com/v1/chat/completions",
      ]);
      expect(report).toMatchObject({
        kind: "help-seeking",
        summary: "Cloud-Fallback lief.",
      });
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });
  it("reports vision ready when the primary is down but the fallback is usable", async () => {
    const db = await openDb();
    await setSetting(db, "llm.vision.enabled", "true");
    await setSetting(
      db,
      "llm.providers",
      JSON.stringify({
        local: {
          url: "http://local/v1",
          model: "text-only",
          apiKey: "sk-local",
        },
        cloud: {
          url: "https://api.deepseek.com/v1",
          model: "deepseek-v4-flash",
          apiKey: "sk-cloud",
        },
      }),
    );
    await setSetting(
      db,
      "llm.roles",
      JSON.stringify({ vision: { primary: "local", fallback: "cloud" } }),
    );

    const originalFetch = global.fetch;
    const urls: string[] = [];
    global.fetch = (async (url) => {
      urls.push(String(url));
      if (String(url) === "http://local/v1/models") {
        return new Response("down", { status: 503 });
      }
      return new Response(
        JSON.stringify({ data: [{ id: "deepseek-v4-flash" }] }),
      );
    }) as typeof fetch;

    try {
      const readiness = await checkVisionReadiness(db);
      expect(readiness).toMatchObject({
        enabled: true,
        online: true,
        url: "https://api.deepseek.com/v1",
        model: "deepseek-v4-flash",
        modelAvailable: true,
        usable: true,
        visionModelExplicit: true,
      });
      expect(readiness.warning).toBeUndefined();
      expect(urls).toEqual([
        "http://local/v1/models",
        "https://api.deepseek.com/v1/models",
        "https://api.deepseek.com/v1/models",
      ]);
    } finally {
      global.fetch = originalFetch;
      await db.close();
    }
  });
});
